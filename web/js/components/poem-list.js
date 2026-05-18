const PoemList = {
  render(poems, params) {
    let filtered = [...poems]
    let title = '全部诗词'

    if (params.year) {
      filtered = filtered.filter(p => p.year === params.year)
      title = `${params.year}年（共 ${filtered.length} 首）`
    }

    if (params.genre) {
      filtered = filtered.filter(p => p.genre === params.genre)
      title = `${params.genre === '诗' ? '诗' : '词'}（共 ${filtered.length} 首）`
    }

    if (params.sub) {
      filtered = filtered.filter(p => p.subGenre === params.sub)
      title = `${params.sub}（共 ${filtered.length} 首）`
    }

    if (params.cipai) {
      filtered = filtered.filter(p => p.cipai === params.cipai)
      title = `${params.cipai}（共 ${filtered.length} 首）`
    }

    if (params.rhyme) {
      filtered = filtered.filter(p => p.rhyme === params.rhyme)
      title = `${params.rhyme}（共 ${filtered.length} 首）`
    }

    filtered.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title))

    const el = document.getElementById('main-content')
    el.innerHTML = `<div class="page-title">${this._esc(title)}</div>`

    if (!filtered.length) {
      el.innerHTML += '<p style="color:#8b7355;padding:24px 0;">暂无数据</p>'
      return
    }

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
