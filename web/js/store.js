const POEMS_KEY = 'poems_data'
const ETAG_KEY = 'poems_etag'

const Store = {
  getPoems() {
    try {
      const raw = localStorage.getItem(POEMS_KEY)
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  },

  setPoems(poems) {
    localStorage.setItem(POEMS_KEY, JSON.stringify(poems))
  },

  getZipEtag() {
    return localStorage.getItem(ETAG_KEY)
  },

  setZipEtag(etag) {
    localStorage.setItem(ETAG_KEY, etag)
  },

  clear() {
    localStorage.removeItem(POEMS_KEY)
    localStorage.removeItem(ETAG_KEY)
  }
}
