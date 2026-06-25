const ZipLoader = {
  async ensure() {
    const cached = Store.getPoems()
    if (cached && cached.length) {
      const etag = Store.getZipEtag()
      if (etag && location.protocol !== 'file:') {
        try {
          const resp = await fetch('./poems.zip', {
            headers: { 'If-None-Match': etag }
          })
          if (resp.status === 304) return cached
          if (resp.ok) {
            const blob = await resp.blob()
            return await this._processZip(blob, resp)
          }
        } catch { /* fall through to full download */ }
      } else {
        return cached
      }
    }
    return this._download()
  },

  async _download() {
    if (location.protocol === 'file:') {
      return this._pickFile()
    }
    try {
      document.getElementById('loading-text').textContent = '正在下载诗词数据包...'
      const resp = await fetch('./poems.zip')
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const blob = await resp.blob()
      return await this._processZip(blob, resp)
    } catch (err) {
      document.getElementById('loading-text').textContent = '加载失败: ' + err.message
      throw err
    }
  },

  async _pickFile() {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.zip,application/zip'
      input.onchange = async () => {
        const file = input.files[0]
        if (!file) return reject(new Error('未选择文件'))
        document.getElementById('loading-text').textContent = '正在解压...'
        const zip = await JSZip.loadAsync(file)
        resolve(this._extractZip(zip))
      }
	   let p=document.getElementById('loading-text');
	   p.innerHTML = '<b>请选择本地数据文件</b><br>'
	   p.appendChild(input)
      //input.click()
    })
  },

  async _processZip(blob, resp) {
    document.getElementById('loading-text').textContent = '正在解压...'
    const zip = await JSZip.loadAsync(blob)
    const result = await this._extractZip(zip)
    const etag = resp.headers.get('ETag') || resp.headers.get('Last-Modified')
    if (etag) Store.setZipEtag(etag)
    return result
  },

  async _extractZip(zip) {
    document.getElementById('loading-text').textContent = '正在解析诗词文件...'

    const mdFiles = []
    const imageFiles = []

    zip.forEach((relativePath, entry) => {
      if (entry.dir) return
      if (/\.md$/i.test(relativePath)) {
        if (/(?:^|\/)\d{4}\//.test(relativePath.replace(/\\/g, '/'))) mdFiles.push(relativePath)
      } else if (/\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(relativePath)) imageFiles.push(relativePath)
    })

    const poems = []
    for (const path of mdFiles) {
      const content = await zip.files[path].async('string')
      poems.push(Parser.parse(content, path))
    }

    const seen = new Set()
    const unique = []
    for (const p of poems) {
      if (!seen.has(p.id)) { seen.add(p.id); unique.push(p) }
    }

    Store.setPoems(unique)

    document.getElementById('loading-text').textContent = '正在缓存图片...'
    for (const path of imageFiles) {
      const blob = await zip.files[path].async('blob')
      await DB.set(path.replace(/\\/g, '/'), blob)
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
