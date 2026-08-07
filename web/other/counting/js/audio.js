// 数一数 Counting —— 音频模块（共享：BGM 合成归首页 / 语音音效归游戏页）
var AudioManager = (function () {
  'use strict';

  var ctx = null;
  var masterGain = null;
  var musicGain = null;
  var sfxGain = null;

  var numsBuffer = null;
  var numsManifest = null;
  var praiseBuffer = null;
  var praiseManifest = null;
  var startVoiceBuffer = null;
  var quizVoiceBuffer = null;

  var bgmTimer = null;
  var bgmIndex = 0;
  var musicPlaying = false;

  var resumeWaiters = [];
  var audioLoaded = false;
  var loadPromise = null;

  // praise 语义 id → 雪碧图真实片段
  var PRAISE_MAP = {
    start: ['hello_1', 'hello_2', 'hello_3', 'hello_4'],
    praise: ['praise_1', 'praise_2', 'praise_3'],
    correct: ['praise_4'],
    retry: ['retry_1', 'retry_2', 'retry_3', 'retry_4'],
    win: ['praise_5', 'praise_6', 'praise_7']
  };

  function init() {}

  function ensureContext() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { return null; }
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.8;
      masterGain.connect(ctx.destination);
      musicGain = ctx.createGain();
      musicGain.gain.value = 0;
      musicGain.connect(masterGain);
      sfxGain = ctx.createGain();
      sfxGain.gain.value = 0.6;
      sfxGain.connect(masterGain);
    }
    return ctx;
  }

  function flushWaiters() {
    var ws = resumeWaiters; resumeWaiters = [];
    ws.forEach(function (w) { if (ctx) w(ctx); });
  }

  function resume() {
    if (!ctx) ctx = ensureContext();
    if (ctx && ctx.state === 'suspended') {
      return ctx.resume().then(flushWaiters);
    }
    flushWaiters();
    return Promise.resolve();
  }

  // 等 AudioContext 运行起来（首次触摸 resume 后）再继续
  function whenCtxReady() {
    return new Promise(function (resolve) {
      var ac = ensureContext();
      if (ac && ac.state === 'running') { resolve(ac); return; }
      resumeWaiters.push(resolve);
    });
  }

  // fetch 立即执行（无需手势）；解码延后到 ctx 运行后（iOS Safari 挂起态解码会失败）
  function fetchAudio(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.arrayBuffer();
    }).then(function (buf) {
      return whenCtxReady().then(function () { return ctx.decodeAudioData(buf); });
    });
  }

  function loadAll() {
    if (loadPromise) return loadPromise;
    var p = [];
    numsBuffer = fetchAudio('assets/audio/nums.wav').catch(function () {});
    numsManifest = fetch('assets/audio/nums.json').then(function (r) { return r.json(); }).catch(function () {});
    praiseBuffer = fetchAudio('assets/audio/praise.wav').catch(function () {});
    praiseManifest = fetch('assets/audio/praise.json').then(function (r) { return r.json(); }).catch(function () {});
    startVoiceBuffer = fetchAudio('assets/audio/lets_count.wav').catch(function () {});
    quizVoiceBuffer = fetchAudio('assets/audio/how_many.wav').catch(function () {});
    loadPromise = Promise.all(p).then(function () { audioLoaded = true; }, function () { audioLoaded = true; });
    return loadPromise;
  }

  function isLoaded() { return audioLoaded; }

  function onReady(cb) {
    if (audioLoaded) { cb(); return; }
    loadAll().then(cb);
  }

  // buffer 就绪后播放（调用时未就绪则自动补播）
  function playBuffer(promise, onBuffer) {
    if (!ensureContext() || !promise) return;
    if (!Storage.isSfxOn()) return;
    promise.then(function (b) {
      if (!b || !Storage.isSfxOn()) return;
      onBuffer(b);
    }).catch(function () {});
  }

  function mapPraiseId(id) {
    var g = PRAISE_MAP[id];
    return g ? g[Math.floor(Math.random() * g.length)] : id;
  }

  // 雪碧图片段播放（buffer+manifest 就绪后自动补播）
  function playSprite(bufferPromise, manifestPromise, id) {
    if (!ensureContext() || !bufferPromise || !manifestPromise) return;
    if (!Storage.isSfxOn()) return;
    Promise.all([bufferPromise, manifestPromise]).then(function (rs) {
      if (!Storage.isSfxOn()) return;
      var buf = rs[0], man = rs[1];
      var seg = man && man.segments[id];
      if (!buf || !seg) return;
      var src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(sfxGain);
      src.start(0, seg.start, seg.duration);
    }).catch(function () {});
  }

  // === 鼓励雪碧图 ===
  function playPraise(id) {
    playSprite(praiseBuffer, praiseManifest, mapPraiseId(id));
  }

  function playRandomPraise() { playPraise('praise'); }

  function playStartVoice() {
    playBuffer(startVoiceBuffer, function (b) {
      var src = ctx.createBufferSource();
      src.buffer = b; src.connect(sfxGain); src.start();
    });
  }

  function playQuizVoice() {
    playBuffer(quizVoiceBuffer, function (b) {
      var src = ctx.createBufferSource();
      src.buffer = b; src.connect(sfxGain); src.start();
    });
  }

  // === 音效 ===
  function playDing(index) {
    if (!ensureContext()) return;
    if (!Storage.isSfxOn()) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 523 + (index - 1) * 87;
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain); gain.connect(sfxGain);
    osc.start(); osc.stop(ctx.currentTime + 0.2);
  }

  function playSoftDing() {
    if (!ensureContext()) return;
    if (!Storage.isSfxOn()) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain); gain.connect(sfxGain);
    osc.start(); osc.stop(ctx.currentTime + 0.15);
  }

  function playNum(n) {
    playSprite(numsBuffer, numsManifest, 'num_' + n);
  }

  function playTotal(n) {
    playSprite(numsBuffer, numsManifest, 'total_' + n);
  }

  function playCelebration() {
    if (!ensureContext()) return;
    if (!Storage.isSfxOn()) return;
    var notes = [523, 659, 784, 1047, 1319];
    notes.forEach(function (f, i) {
      var o = ctx.createOscillator(); var g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      var t = ctx.currentTime + i * 0.12;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.2, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      o.connect(g); g.connect(sfxGain);
      o.start(t); o.stop(t + 0.12);
    });
  }

  // === BGM（归首页控制） ===
  var BGM_TUNE = [523,659,784,1047,784,659,523,440,523,659,784,659,523,440,392,523,587,698,784,880,784,659,587,523,440,523,659,523,392,440,523,440];

  function _playBGMTune() {
    if (!ctx || !musicPlaying) return;
    var f = BGM_TUNE[bgmIndex % BGM_TUNE.length];
    var o = ctx.createOscillator(); var g = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = f;
    var now = ctx.currentTime, dur = 0.44;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.02, now + 0.02);
    g.gain.setValueAtTime(0.02, now + dur - 0.03);
    g.gain.linearRampToValueAtTime(0, now + dur);
    o.connect(g); g.connect(musicGain);
    o.start(now); o.stop(now + dur + 0.01);
    bgmIndex++;
    bgmTimer = setTimeout(_playBGMTune, 480);
  }

  function startMusic() {
    ensureContext(); if (!ctx || musicPlaying || !Storage.isMusicOn()) return;
    musicPlaying = true;
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    musicGain.gain.setValueAtTime(musicGain.gain.value, ctx.currentTime);
    musicGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.5);
    bgmIndex = 0; _playBGMTune();
  }

  function stopMusic() {
    musicPlaying = false;
    if (bgmTimer) { clearTimeout(bgmTimer); bgmTimer = null; }
    if (musicGain) {
      musicGain.gain.cancelScheduledValues(ctx.currentTime);
      musicGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    }
  }

  return {
    init: init, resume: resume, loadAll: loadAll,
    isLoaded: isLoaded, onReady: onReady,
    playDing: playDing, playSoftDing: playSoftDing,
    playNum: playNum, playTotal: playTotal,
    playPraise: playPraise, playRandomPraise: playRandomPraise,
    playStartVoice: playStartVoice, playQuizVoice: playQuizVoice,
    playCelebration: playCelebration,
    startMusic: startMusic, stopMusic: stopMusic
  };
})();
