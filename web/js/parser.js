const Parser = {
  _titlePatterns: [
    /《([^》]+?)》/,
    /「([^」]+?)」/,
    /"([^"]+?)"/
  ],

  _datePatterns: [
    /^(\d{4})(\d{2})(\d{2})/,
    /^(\d{4})-(\d{2})-(\d{2})/,
    /^(\d{4})\.(\d{2})\.(\d{2})/,
    /(\d{4})年(\d{1,2})月(\d{1,2})日/
  ],

  _rhymeMap: {
    '平水': '平水韵',
    '新韵': '中华新韵',
    '通韵': '中华通韵'
  },

  _rhymeSlug: {
    '平水韵': 'pingshui',
    '中华新韵': 'xinyun',
    '中华通韵': 'tongyun'
  },

  _knownCipai: [
    '卜算子', '十六字令', '点绛唇', '如梦令', '忆江南',
    '浣溪沙', '菩萨蛮', '蝶恋花', '鹧鸪天', '西江月',
    '临江仙', '念奴娇', '水调歌头', '满江红', '沁园春',
    '清平乐', '虞美人', '浪淘沙', '江城子', '苏幕遮',
    '采桑子', '长相思', '阮郎归', '踏莎行', '醉花阴',
    '南乡子', '望江南', '渔歌子', '捣练子', '定风波',
    '青玉案', '一剪梅', '行香子', '喝火令', '八声甘州',
    '声声慢', '贺新郎', '摸鱼儿', '永遇乐', '扬州慢',
    '雨霖铃', '桂枝香', '暗香', '疏影', '风入松',
    '满庭芳', '水龙吟', '石州慢', '忆秦娥', '更漏子',
    '生查子', '减字木兰花', '画堂春', '山花子'
  ],

  parse(content, filePath) {
    const pathParts = filePath.replace(/\\/g, '/').split('/')
    const fileName = pathParts[pathParts.length - 1] || ''

    const yearDir = pathParts.find(p => /^\d{4}$/.test(p)) || ''
    const date = this._extractDate(fileName, pathParts)
    const fullTitle = this._extractTitle(fileName, content)
    const { genre, rhyme, cipai } = this._classify(fullTitle)

    const text = content.replace(/\r\n?/g, '\n')
    const codeBlocks = this._extractFencedBlocks(text)
    const rawContent = codeBlocks[0] || ''
    const contentLines = this._splitIntoLines(rawContent)
    const appreciation = codeBlocks[1] || ''
    const epigraph = this._extractEpigraph(text)
    const images = this._extractImages(text)
    const subGenre = genre === '诗' ? this._determineSubGenre(contentLines) : ''

    const titlePart = fullTitle.includes('·') ? fullTitle.split('·')[1].trim() : fullTitle
    const id = this._hashId(filePath + (date || yearDir))

    return {
      id,
      title: titlePart || '未知',
      fullTitle: fullTitle || '未知',
      year: yearDir || '未知',
      date: date || '未知',
      genre,
      rhyme,
      cipai,
      subGenre,
      epigraph: epigraph || '',
      filename: fileName,
      content: rawContent || '',
      contentLines,
      appreciation: appreciation || '',
      images,
      _raw: filePath
    }
  },

  // ---------- title ----------
  _extractTitle(fileName, content) {
    for (const p of this._titlePatterns) {
      const m = fileName.match(p)
      if (m) return m[1].trim()
    }
    const m2 = content.match(/^# ?《([^》]+?)》/m)
    if (m2) return m2[1].trim()
    return '未知'
  },

  // ---------- date ----------
  _extractDate(fileName, pathParts) {
    for (const p of this._datePatterns) {
      const m = fileName.match(p)
      if (m) return `${m[1]}-${m[2]}-${m[3]}`
    }
    // fallback: directory year
    const year = pathParts.find(d => /^\d{4}$/.test(d))
    if (year) return year
    return ''
  },

  // ---------- rhyme / genre / cipai ----------
  _classify(fullTitle) {
    for (const [key, value] of Object.entries(this._rhymeMap)) {
      if (fullTitle.includes(key)) {
        return { genre: '诗', rhyme: value, cipai: '' }
      }
    }
    for (const c of this._knownCipai) {
      if (fullTitle.startsWith(c) || fullTitle.includes(`·${c}`) || fullTitle.includes(`${c}·`)) {
        return { genre: '词', rhyme: '', cipai: c }
      }
    }
    return { genre: '诗', rhyme: '', cipai: '' }
  },

  // ---------- content: fenced code blocks ----------
  _extractFencedBlocks(text) {
    const blocks = []
    const lines = text.split('\n')
    let i = 0
    while (i < lines.length) {
      const line = lines[i]
      const fenceIdx = line.search(/(`{3,})|(~{3,})/)
      if (fenceIdx !== -1) {
        const fc = line[fenceIdx]
        let fenceLen = 1
        for (let j = fenceIdx + 1; j < line.length; j++) {
          if (line[j] === fc) fenceLen++
          else break
        }
        const closingRegex = new RegExp(`^[ \\t]*${fc}{${fenceLen},}[ \\t]*$`)
        const content = []
        i++
        while (i < lines.length) {
          if (closingRegex.test(lines[i])) break
          content.push(lines[i])
          i++
        }
        blocks.push(content.join('\n'))
      }
      i++
    }
    return blocks
  },

  // ---------- split content into lines ----------
  _splitIntoLines(content) {
    const rawLines = content.split('\n').map(l => l.trim()).filter(l => l)
    const result = []
    for (const line of rawLines) {
      const parts = line.split(/[，、。！？；：\s,\.!?;:]+/).filter(p => {
        const cn = p.replace(/[^\u4e00-\u9fff]/g, '')
        return cn.length > 0
      })
      for (const part of parts) {
        result.push(part.replace(/[^\u4e00-\u9fff]/g, ''))
      }
    }
    return result
  },

  // ---------- poem sub-genre (诗体裁) ----------
  _determineSubGenre(contentLines) {
    if (!contentLines.length) return '其他'
    const counts = {}
    for (const line of contentLines) {
      const len = line.length
      if (len > 0) counts[len] = (counts[len] || 0) + 1
    }
    if (!Object.keys(counts).length) return '其他'

    const totalLines = contentLines.length
    let maxCount = 0
    let commonLen = 0
    for (const [len, count] of Object.entries(counts)) {
      if (count > maxCount) { maxCount = count; commonLen = parseInt(len) }
    }

    if (commonLen === 5) {
      if (totalLines === 4) return '五言绝句'
      if (totalLines === 8) return '五言律诗'
      if (totalLines > 8) return '排律'
    }
    if (commonLen === 7) {
      if (totalLines === 4) return '七言绝句'
      if (totalLines === 8) return '七言律诗'
      if (totalLines > 8) return '排律'
    }

    return '古风'
  },

  // ---------- epigraph ----------
  _extractEpigraph(text) {
    const m = text.match(/^>> ?(.+)$/m)
    return m ? m[1].trim() : ''
  },

  // ---------- images ----------
  _extractImages(text) {
    const results = []
    const re = /!\[([^\]]*)\]\(([^)]+)\)/g
    let m
    while ((m = re.exec(text)) !== null) {
      results.push({ alt: m[1], src: m[2] })
    }
    return results
  },

  // ---------- unique id ----------
  _hashId(s) {
    let h = 0
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h) + s.charCodeAt(i)
      h |= 0
    }
    return (h >>> 0).toString(36)
  }
}
