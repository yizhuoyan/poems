const Search = {
  render(poems, params) {
    const q = (params.q || '').trim().toLowerCase()
    const el = document.getElementById('main-content')

    if (!q) {
      el.innerHTML = '<p style="color:#8b7355;padding:24px;">输入关键词后回车搜索</p>'
      return
    }

    const results = poems.filter(p => {
      const searchText = (p.title + ' ' + p.fullTitle + ' ' + p.content).toLowerCase()
      return searchText.includes(q)
    })

    el.innerHTML = `<div class="search-page">
      <div class="search-info">搜索 "${Util.esc(q)}" — 找到 ${results.length} 首</div>
    </div>`

    if (!results.length) {
      el.innerHTML += '<p style="color:#8b7355;padding:16px 0;">未找到匹配结果</p>'
      return
    }

    for (const p of results) {
      const card = document.createElement('div')
      card.className = 'poem-card'
      card.onclick = () => Router.go(`/detail/${encodeURIComponent(p.id)}`)

      const tags = Util.buildTags(p)

      card.innerHTML = `
        <div class="card-title">《${this._highlight(p.fullTitle, q)}》</div>
        <div class="card-meta">${tags.map(t => `<span>${Util.esc(t)}</span>`).join('')}</div>
      `
      el.appendChild(card)
    }
  },

  _highlight(text, keyword) {
    const esc = Util.esc(text)
    if (!keyword) return esc
    const re = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return esc.replace(re, '<mark>$1</mark>')
  }
}
