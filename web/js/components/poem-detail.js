const PoemDetail = {
  async render(poems, params) {
    const id = decodeURIComponent(params.id || '')
    const poem = poems.find(p => p.id === id)

    const el = document.getElementById('main-content')
    if (!poem) {
      el.innerHTML = '<p style="color:#8b7355;padding:24px;">未找到该诗词</p>'
      return
    }

    const sorted = [...poems].sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title))
    const idx = sorted.findIndex(p => p.id === poem.id)
    const prev = idx > 0 ? sorted[idx - 1] : null
    const next = idx < sorted.length - 1 ? sorted[idx + 1] : null

    const tags = []
    if (poem.cipai) {
      tags.push(poem.cipai)
    } else if (poem.subGenre) {
      tags.push(poem.subGenre)
    }
    if (poem.rhyme) tags.push(poem.rhyme)
    if (poem.date && /^\d{4}-\d{2}-\d{2}$/.test(poem.date)) tags.push(poem.date)

    const bc = `<div class="detail-breadcrumb"><a href="/" data-bc="home">首页</a> &gt; <a href="/year/${this._esc(poem.year)}" data-bc="year">${this._esc(poem.year)}</a> &gt; 《${this._esc(poem.fullTitle)}》</div>`

    let epigraphHtml = ''
    if (poem.epigraph) {
      epigraphHtml = `<p style="color:#8b7355;font-size:14px;margin-bottom:12px;text-align:center;">${this._esc(poem.epigraph)}</p>`
    }

    let imageHtml = ''
    if (poem.images && poem.images.length) {
      const img = poem.images[0]
      const url = await ZipLoader.getImageBlobUrl(img.src, poem.year)
      if (url) {
        imageHtml = `<div class="detail-image"><img src="${url}" alt="${this._esc(img.alt)}" /></div>`
      }
    }

    const navBtn = (p, label) => p
      ? `<a href="#" class="detail-nav" data-id="${this._esc(p.id)}">${this._esc(label)}：《${this._esc(p.fullTitle)}》</a>`
      : `<span class="detail-nav disabled">${this._esc(label)}：无</span>`

    el.innerHTML = `
      <div class="detail-container">
        ${bc}
        <div class="detail-title">《${this._esc(poem.fullTitle)}》</div>
        <div class="detail-meta">${tags.map(t => `<span>${this._esc(t)}</span>`).join('')}</div>
        ${epigraphHtml}
        <div class="detail-content">${this._esc(poem.content)}</div>
        ${imageHtml}
        ${poem.appreciation ? `<div class="detail-appreciation"><h2>赏析</h2><p>${poem.appreciation.replace(/\n/g, '<br>')}</p></div>` : ''}
        <div class="detail-nav-bar"><span class="detail-nav-left">${navBtn(prev, '上一首')}</span><span class="detail-nav-right">${navBtn(next, '下一首')}</span></div>
      </div>
    `

    el.querySelectorAll('a[data-bc], .detail-nav[data-id]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault()
        if (a.dataset.bc === 'home') Router.go('/')
        else if (a.dataset.bc === 'year') Router.go(`/year/${poem.year}`)
        else Router.go(`/detail/${encodeURIComponent(a.dataset.id)}`)
      })
    })
  },

  _esc(s) {
    const d = document.createElement('div')
    d.textContent = s
    return d.innerHTML
  }
}
