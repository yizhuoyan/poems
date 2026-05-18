const Router = {
  _routes: [],
  _after: null,

  on(pattern, handler) {
    this._routes.push({ pattern, handler })
  },

  resolve(url) {
    const [pathPart, qs] = url.split('?')
    const clean = decodeURIComponent(pathPart).replace(/^\//, '') || 'home'
    for (const { pattern, handler } of this._routes) {
      const m = clean.match(pattern)
      if (m) {
        handler(m, qs || '')
        if (this._after) this._after()
        return
      }
    }
    const fallback = this._routes.find(r => r.pattern === 'home')
    if (fallback) fallback.handler(null, '')
    if (this._after) this._after()
  },

  start() {
    window.addEventListener('popstate', () => this.resolve(location.pathname + location.search))
    this.resolve(location.pathname + location.search)
  },

  go(path) {
    history.pushState(null, '', path)
    this.resolve(path)
  }
}
