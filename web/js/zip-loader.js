const ZipLoader = {
  async ensure() {
    const cached = Store.getPoems()
    if (cached && cached.length) return cached

    // file:// 协议下 fetch 被 CORS 阻止，改用文件选择器
    if (location.protocol === 'file:') {
      return this._loadFromFileInput()
    }

    return this._download()
  },

  async _loadFromFileInput() {
    return new Promise((resolve, reject) => {
      const overlay = document.getElementById('loading-overlay')
      const text = document.getElementById('loading-text')
      const content = overlay.querySelector('.loading-content')

      text.textContent = '本地文件模式需要手动加载数据'

      const btn = document.createElement('button')
      btn.textContent = '选择 poems.zip'
      btn.style.marginTop = '16px'
      btn.style.padding = '8px 16px'
      btn.style.fontSize = '16px'
      btn.style.cursor = 'pointer'
      btn.style.border = '1px solid #8b7355'
      btn.style.background = '#fdfbf7'
      btn.style.color = '#5c4033'
      btn.style.borderRadius = '4px'

      btn.addEventListener('click', () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.zip'
        input.addEventListener('change', async (e) => {
          const file = e.target.files[0]
          if (!file) return
          if (btn.parentNode) btn.parentNode.removeChild(btn)
          text.textContent = '正在读取文件...'
          try {
            const buffer = await file.arrayBuffer()
            const zip = await JSZip.loadAsync(buffer)
            const poems = await this._processZip(zip, file.name + '_' + file.size)
            resolve(poems)
          } catch (err) {
            text.textContent = '加载失败：' + err.message
            reject(err)
          }
        })
        input.click()
      })

      content.appendChild(btn)
    })
  },

  async _download() {
    document.getElementById('loading-text').textContent = '正在下载诗词数据包...'
    const resp = await fetch('./poems.zip')
    const blob = await resp.blob()

    document.getElementById('loading-text').textContent = '正在解压...'
    const zip = await JSZip.loadAsync(blob)

    const etag = resp.headers.get('ETag') || resp.headers.get('Last-Modified') || String(resp.headers.get('Content-Length') || '')
    return this._processZip(zip, etag)
  },

  async _processZip(zip, etag) {
    document.getElementById('loading-text').textContent = '正在解析诗词文件...'

    const mdFiles = []
    const imageFiles = []

    zip.forEach((relativePath, entry) => {
      if (entry.dir) return
      if (/\.md$/i.test(relativePath)) {
        if (/(?:^|\/)\d{4}\//.test(relativePath.replace(/\\/g, '/'))) mdFiles.push(relativePath)
      } else if (/\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(relativePath)) {
        imageFiles.push(relativePath)
      }
    })

    const poems = []
    for (const path of mdFiles) {
      const content = await zip.files[path].async('string')
      const poem = Parser.parse(content, path)
      poems.push(poem)
    }

    // 去重（按 id）
    const seen = new Set()
    const unique = []
    for (const p of poems) {
      if (!seen.has(p.id)) { seen.add(p.id); unique.push(p); }
    }

    Store.setPoems(unique)
    Store.setZipEtag(etag)

    // 存图片到 IndexedDB
    document.getElementById('loading-text').textContent = '正在缓存图片...'
    for (const path of imageFiles) {
      const blob2 = await zip.files[path].async('blob')
      await DB.set(path.replace(/\\/g, '/'), blob2)
    }

    return unique
  },

  async getImageBlobUrl(src, poemYear) {
    const searchPaths = [
      src,
      `${poemYear}/${src}`,
      src.replace(/^images\//, '')
    ]
    for (const p of searchPaths) {
      const norm = p.replace(/\\/g, '/')
      const blob = await DB.get(norm)
      if (blob) return URL.createObjectURL(blob)
    }
    return null
  }
}
