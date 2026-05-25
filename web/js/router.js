const Router = {
  _routes: [],
  _after: null,
  _isFile: location.protocol === 'file:',

  on(pattern, handler) {
    this._routes.push({ pattern, handler })
  },

  resolve(url) {
    let raw = url
    if (this._isFile && raw.startsWith('#')) {
      raw = raw.slice(1)
    }
    const [pathPart, qs] = raw.split('?')
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
    if (this._isFile) {
      window.addEventListener('hashchange', () => this.resolve(location.hash))
      this.resolve(location.hash)
    } else {
      window.addEventListener('popstate', () => this.resolve(location.pathname + location.search))
      this.resolve(location.pathname + location.search)
    }
  },

  go(path) {
    if (this._isFile) {
      location.hash = '#' + path
    } else {
      history.pushState(null, '', path)
      this.resolve(path)
    }
  }
}
