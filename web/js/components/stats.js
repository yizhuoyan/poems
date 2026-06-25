const Stats = {
  _pieColors: ['#8b7355', '#c4b08a', '#a8936e', '#6b5b4b', '#d4c9b8', '#5a4a3a'],

  render(poems) {
    const total = poems.length
    const years = [...new Set(poems.map(p => p.year))].sort()
    const yearCounts = years.map(y => ({ year: y, count: poems.filter(p => p.year === y).length }))
    const poemCount = poems.filter(p => p.genre === '诗').length
    const ciCount = poems.filter(p => p.genre === '词').length
    const rhymes = [...new Set(poems.map(p => p.rhyme).filter(Boolean))].sort()
    const rhymeCounts = rhymes.map(r => ({ rhyme: r, count: poems.filter(p => p.rhyme === r).length }))

    const el = document.getElementById('main-content')
    el.innerHTML = `<div class="stats-page">
      <div class="stats-summary">
        <div class="stat-box"><div class="num">${total}</div><div class="label">总篇数</div></div>
        <div class="stat-box"><div class="num">${poemCount}</div><div class="label">诗</div></div>
        <div class="stat-box"><div class="num">${ciCount}</div><div class="label">词</div></div>
      </div>
      <div class="chart-container">
        <h3>各年分布</h3>
        ${this._barChart(yearCounts, 'year', 'count')}
      </div>
      <div class="chart-container">
        <h3>诗 / 词 比例</h3>
        ${this._pieChart([
          { label: '诗', value: poemCount },
          { label: '词', value: ciCount }
        ])}
      </div>
      <div class="chart-container">
        <h3>韵书分布</h3>
        ${this._barChart(rhymeCounts, 'rhyme', 'count')}
      </div>
    </div>`
  },

  _barChart(data, labelKey, valueKey) {
    if (!data.length) return '<p style="color:#8b7355;">暂无数据</p>'
    const maxVal = Math.max(...data.map(d => d[valueKey]))
    if (maxVal === 0) return '<p style="color:#8b7355;">暂无数据</p>'

    const w = data.length * 50 + 60
    const h = 260
    const barW = Math.min(40, (w - 80) / data.length - 8)
    const padL = 50
    const padB = 40

    let bars = ''
    for (let i = 0; i < data.length; i++) {
      const d = data[i]
      const barH = (d[valueKey] / maxVal) * 180
      const x = padL + i * (barW + 12)
      const y = h - padB - barH
      bars += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="#8b7355" rx="3" />
        <text x="${x + barW / 2}" y="${y - 6}" text-anchor="middle" font-size="12" fill="#5a4a3a">${d[valueKey]}</text>
        <text x="${x + barW / 2}" y="${h - padB + 16}" text-anchor="middle" font-size="11" fill="#8b7355">${Util.esc(d[labelKey])}</text>`
    }

    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
      <line x1="${padL}" y1="${h - padB}" x2="${w - 10}" y2="${h - padB}" stroke="#d4c9b8" stroke-width="1"/>
      ${bars}
    </svg>`
  },

  _pieChart(items) {
    if (!items.length) return '<p style="color:#8b7355;">暂无数据</p>'
    const total = items.reduce((s, i) => s + i.value, 0)
    if (total === 0) return '<p style="color:#8b7355;">暂无数据</p>'

    const cx = 120
    const cy = 120
    const r = 100

    let startAngle = 0
    let arcs = ''
    const legend = []

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const angle = (item.value / total) * 360
      const endAngle = startAngle + angle
      const percent = ((item.value / total) * 100).toFixed(1)

      const x1 = cx + r * Math.sin(startAngle * Math.PI / 180)
      const y1 = cy - r * Math.cos(startAngle * Math.PI / 180)
      const x2 = cx + r * Math.sin(endAngle * Math.PI / 180)
      const y2 = cy - r * Math.cos(endAngle * Math.PI / 180)

      const large = angle > 180 ? 1 : 0
      const color = this._pieColors[i % this._pieColors.length]

      arcs += `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z" fill="${color}" stroke="#f5f2ed" stroke-width="2"/>`
      legend.push(`<span style="display:inline-flex;align-items:center;gap:4px;margin:0 8px;font-size:13px;color:#5a4a3a;"><span style="width:12px;height:12px;border-radius:2px;background:${color};display:inline-block;"></span>${Util.esc(item.label)} ${percent}%</span>`)

      startAngle = endAngle
    }

    return `<div style="display:flex;flex-direction:column;align-items:center;">
      <svg width="240" height="240" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
        ${arcs}
      </svg>
      <div style="margin-top:8px;">${legend.join('')}</div>
    </div>`
  }
}
