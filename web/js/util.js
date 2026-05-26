const Util = {
  esc(s) {
    const d = document.createElement('div')
    d.textContent = s
    return d.innerHTML
  },

  buildTags(poem) {
    const tags = []
    if (poem.cipai) {
      tags.push(poem.cipai)
    } else if (poem.subGenre) {
      tags.push(poem.subGenre)
    }
    if (poem.rhyme) tags.push(poem.rhyme)
    if (poem.date && /^\d{4}-\d{2}-\d{2}$/.test(poem.date)) tags.push(poem.date)
    return tags
  },

  renderYearNav(parent, years, yearIdx) {
    if (!years.length) return
    const bar = document.createElement('div')
    bar.className = 'year-nav-bar'
    const left = yearIdx > 0
      ? `<a href="#/year/${years[yearIdx - 1]}" class="year-nav">← ${years[yearIdx - 1]}年</a>`
      : ''
    const right = yearIdx < years.length - 1
      ? `<a href="#/year/${years[yearIdx + 1]}" class="year-nav">${years[yearIdx + 1]}年 →</a>`
      : ''
    bar.innerHTML = `<span class="year-nav-left">${left}</span><span class="year-nav-right">${right}</span>`
    bar.querySelectorAll('.year-nav').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault()
        Router.go(a.getAttribute('href').slice(1))
      })
    })
    parent.appendChild(bar)
  }
}
