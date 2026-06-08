const Nav = {
  render(poems) {
    const years = [...new Set(poems.map(p => p.year))].filter(y => /^\d{4}$/.test(y)).sort().reverse()
    const poemSubs = [...new Set(poems.filter(p => p.genre === '诗').map(p => p.subGenre).filter(Boolean))].sort()
    const cipais = [...new Set(poems.filter(p => p.genre === '词' && p.cipai).map(p => p.cipai))].sort()
    const rhymes = [...new Set(poems.map(p => p.rhyme).filter(r => r && r !== '未知'))].sort()

    const nav = document.getElementById('top-nav')
    nav.innerHTML = ''

    this._addItem(nav, '首页', '/')

    if (years.length) {
      const dd = this._createDropdown(years.map(y => ({ label: y, href: `/year/${y}` })))
      this._addItem(nav, '年份', null, dd)
    }

    const poemDD = this._createDropdown([
      { label: '全部', href: '/genre/shi' },
      ...poemSubs.map(s => ({ label: s, href: `/genre/shi?sub=${encodeURIComponent(s)}` }))
    ])
    this._addItem(nav, '诗', null, poemDD)

    const ciDD = this._createDropdown([
      { label: '全部', href: '/genre/ci' },
      ...cipais.map(c => ({ label: c, href: `/genre/ci?cipai=${encodeURIComponent(c)}` }))
    ])
    this._addItem(nav, '词', null, ciDD)

    if (rhymes.length) {
      const rDD = this._createDropdown(rhymes.map(r => ({ label: r, href: `/rhyme/${Parser._rhymeSlug[r] || r}` })))
      this._addItem(nav, '韵书', null, rDD)
    }

    const spacer = document.createElement('div')
    spacer.className = 'nav-spacer'
    nav.appendChild(spacer)

    const stats = document.createElement('a')
    stats.className = 'stats-link'
    stats.href = '#/stats'
    stats.textContent = '📊 统计'
    nav.appendChild(stats)

    const otherLink = document.createElement('a')
    otherLink.className = 'stats-link'
    otherLink.href = 'other/index.html'
    otherLink.textContent = '其他'
    nav.appendChild(otherLink)

    if (!Nav._closeHandler) {
      Nav._closeHandler = (e) => {
        if (!e.target.closest('#top-nav .nav-item')) {
          document.querySelectorAll('#top-nav .nav-item.active').forEach(el => el.classList.remove('active'))
        }
      }
      document.addEventListener('click', Nav._closeHandler)
    }
  },

  _addItem(parent, label, href, dropdown) {
    const item = document.createElement('div')
    item.className = 'nav-item'
    if (href) {
      const a = document.createElement('a')
      a.href = '#' + href
      a.textContent = label
      item.appendChild(a)
    } else {
      const span = document.createElement('span')
      span.textContent = label + ' '
      item.appendChild(span)
      const arrow = document.createElement('span')
      arrow.className = 'arrow'
      arrow.textContent = '▾'
      item.appendChild(arrow)
    }
    if (dropdown) {
      item.appendChild(dropdown)
      item.addEventListener('click', (e) => {
        e.stopPropagation()
        document.querySelectorAll('#top-nav .nav-item.active').forEach(el => {
          if (el !== item) el.classList.remove('active')
        })
        item.classList.toggle('active')
      })
    }
    parent.appendChild(item)
  },

  _createDropdown(items) {
    const dd = document.createElement('div')
    dd.className = 'dropdown'
    for (const { label, href } of items) {
      const a = document.createElement('a')
      a.className = 'dropdown-item'
      a.href = '#' + href
      a.textContent = label
      dd.appendChild(a)
    }
    return dd
  }
}
