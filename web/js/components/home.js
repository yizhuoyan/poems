const Home = {
  render(poems) {
    const years = [...new Set(poems.map(p => p.year))].filter(y => /^\d{4}$/.test(y)).sort()
    const latestYear = years[years.length - 1] || ''
    const filtered = poems.filter(p => p.year === latestYear).sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title))

    const el = document.getElementById('main-content')
    el.innerHTML = `<div class="page-title">${latestYear}年（共 ${filtered.length} 首）</div>`

    for (const p of filtered) {
      this._renderCard(el, p)
    }
  },

  _renderCard(parent, poem) {
    const card = document.createElement('div')
    card.className = 'poem-card'
    card.onclick = () => Router.go(`/detail/${encodeURIComponent(poem.id)}`)

    const tags = []
    if (poem.cipai) {
      tags.push(poem.cipai)
    } else if (poem.subGenre) {
      tags.push(poem.subGenre)
    }
    if (poem.rhyme) tags.push(poem.rhyme)
    if (poem.date && /^\d{4}-\d{2}-\d{2}$/.test(poem.date)) tags.push(poem.date)

    card.innerHTML = `
      <div class="card-title">《${this._esc(poem.fullTitle)}》</div>
      <div class="card-meta">${tags.map(t => `<span>${this._esc(t)}</span>`).join('')}</div>
    `
    parent.appendChild(card)
  },

  _esc(s) {
    const d = document.createElement('div')
    d.textContent = s
    return d.innerHTML
  }
}
