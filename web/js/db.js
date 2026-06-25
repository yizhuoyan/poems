const DB_NAME = 'poems_db'
const DB_VERSION = 1
const STORE_NAME = 'images'

const DB = {
  _db: null,

  async _open() {
    if (this._db) return this._db
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        req.result.createObjectStore(STORE_NAME)
      }
      req.onsuccess = () => {
        this._db = req.result
        resolve(this._db)
      }
      req.onerror = () => reject(req.error)
    })
  },

  async get(key) {
    const db = await this._open()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(key)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  },

  async set(key, value) {
    const db = await this._open()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const req = tx.objectStore(STORE_NAME).put(value, key)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  },

  async has(key) {
    const db = await this._open()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).getKey(key)
      req.onsuccess = () => resolve(req.result != null)
      req.onerror = () => reject(req.error)
    })
  }
}
