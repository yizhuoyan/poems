let _poems = null

async function init() {
  try {
    _poems = await ZipLoader.ensure()
  } catch (err) {
    document.getElementById('loading-text').textContent = '加载失败，请刷新重试'
    return
  }

  document.getElementById('loading-overlay').classList.add('hidden')

  Nav.render(_poems)
  setupSearch()

  Router.on(/^home$/, () => Home.render(_poems))
  Router.on(/^year\/(\d+)$/, (m) => PoemList.render(_poems, { year: m[1] }))
  Router.on(/^genre\/shi$/, (m, qs) => {
    const sp = new URLSearchParams(qs)
    PoemList.render(_poems, { genre: '诗', sub: sp.get('sub'), cipai: sp.get('cipai') })
  })
  Router.on(/^genre\/ci$/, (m, qs) => {
    const sp = new URLSearchParams(qs)
    PoemList.render(_poems, { genre: '词', sub: sp.get('sub'), cipai: sp.get('cipai') })
  })
  Router.on(/^rhyme\/(pingshui|xinyun|tongyun)$/, (m) => {
    const slug = { pingshui: '平水韵', xinyun: '中华新韵', tongyun: '中华通韵' }
    PoemList.render(_poems, { rhyme: slug[m[1]] })
  })
  Router.on(/^detail\/(.+)$/, (m) => PoemDetail.render(_poems, { id: m[1] }))
  Router.on(/^search$/, (m, qs) => {
    const sp = new URLSearchParams(qs)
    Search.render(_poems, { q: sp.get('q') })
  })
  Router.on(/^stats$/, () => Stats.render(_poems))

  Router._after = () => updateStatsFooter(_poems)
  Router.start()
}

function updateStatsFooter(poems) {
  if (!poems) return
  const total = poems.length
  const poemCount = poems.filter(p => p.genre === '诗').length
  const ciCount = poems.filter(p => p.genre === '词').length
  const el = document.getElementById('stats-footer')
  if (!el) return
  el.innerHTML = `<div class="stats-row">
    <span>总篇数：${total}</span>
    <span>诗：${poemCount}</span>
    <span>词：${ciCount}</span>
  </div>`
}

function setupSearch() {
  const input = document.getElementById('search-input')
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = input.value.trim()
      if (q) Router.go(`/search?q=${encodeURIComponent(q)}`)
    }
  })
}

init()
