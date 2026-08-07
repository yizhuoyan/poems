// 音频雪碧图合并脚本（零依赖）
// 用法: node tools/merge-sprite.js <wav目录> <输出前缀>
const fs = require('fs');
const path = require('path');

const GAP_MS = 50;
const srcDir = process.argv[2];
const outBase = process.argv[3] || 'goal';
const outDir = path.dirname(srcDir);

function parseWav(buf) {
  let o = 12, fmt = null, data = null;
  while (o + 8 <= buf.length) {
    const id = buf.toString('ascii', o, o + 4);
    const size = buf.readUInt32LE(o + 4);
    if (id === 'fmt ') fmt = { channels: buf.readUInt16LE(o + 10), sampleRate: buf.readUInt32LE(o + 12), bits: buf.readUInt16LE(o + 22) };
    else if (id === 'data') data = buf.slice(o + 8, o + 8 + size);
    o += 8 + size + (size % 2);
  }
  return { fmt, data };
}

const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.wav')).sort();
let fmtRef = null, chunks = [], segs = [];
for (const f of files) {
  const { fmt, data } = parseWav(fs.readFileSync(path.join(srcDir, f)));
  if (!fmtRef) fmtRef = fmt;
  if (fmt.sampleRate !== fmtRef.sampleRate || fmt.channels !== fmtRef.channels || fmt.bits !== fmtRef.bits) {
    throw new Error('格式不一致: ' + f);
  }
  segs.push({ id: f.replace(/\.wav$/, ''), data });
  chunks.push(data);
}

const bytesPer = fmtRef.channels * fmtRef.bits / 8;
const gap = Buffer.alloc(Math.round((GAP_MS / 1000) * fmtRef.sampleRate * bytesPer / 2) * 2, 0);
const merged = Buffer.alloc(chunks.reduce((a, c) => a + c.length, 0) + gap.length * (segs.length - 1));
const manifest = { format: { sampleRate: fmtRef.sampleRate, channels: fmtRef.channels, bits: fmtRef.bits, pcm: true }, gapMs: GAP_MS, file: outBase + '.wav', segments: {}, totalDuration: 0 };

let pos = 0;
for (let i = 0; i < segs.length; i++) {
  const start = pos / bytesPer / fmtRef.sampleRate;
  const dur = segs[i].data.length / bytesPer / fmtRef.sampleRate;
  manifest.segments[segs[i].id] = { start: +start.toFixed(4), duration: +dur.toFixed(4), end: +((start + dur).toFixed(4)) };
  segs[i].data.copy(merged, pos); pos += segs[i].data.length;
  if (i < segs.length - 1) { gap.copy(merged, pos); pos += gap.length; }
}
manifest.totalDuration = +(merged.length / bytesPer / fmtRef.sampleRate).toFixed(4);

const h = Buffer.alloc(44);
h.write('RIFF', 0, 'ascii'); h.writeUInt32LE(36 + merged.length, 4); h.write('WAVE', 8, 'ascii');
h.write('fmt ', 12, 'ascii'); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20);
h.writeUInt16LE(fmtRef.channels, 22); h.writeUInt32LE(fmtRef.sampleRate, 24);
h.writeUInt32LE(fmtRef.sampleRate * bytesPer, 28); h.writeUInt16LE(bytesPer, 32);
h.writeUInt16LE(fmtRef.bits, 34); h.write('data', 36, 'ascii'); h.writeUInt32LE(merged.length, 40);

fs.writeFileSync(path.join(outDir, outBase + '.wav'), Buffer.concat([h, merged]));
fs.writeFileSync(path.join(outDir, outBase + '.json'), JSON.stringify(manifest, null, 2));
console.log('OK', outBase + '.wav', manifest.totalDuration + 's');
