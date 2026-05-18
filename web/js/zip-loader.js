const ZipLoader = {
  async ensure() {
    const cached = Store.getPoems()
    const storedEtag = Store.getZipEtag()

    if (cached && cached.length) {
      try {
        const headResp = await fetch(`./poems.zip?_=${Date.now()}`, { method: 'HEAD' })
        const etag = headResp.headers.get('ETag') || headResp.headers.get('Last-Modified') || headResp.headers.get('Content-Length') || ''
        if (etag && etag === storedEtag) return cached
      } catch { /* fall through to re-download */ }
    }

    return this._download()
  },

  async _download() {
    document.getElementById('loading-text').textContent = '正在下载诗词数据包...'
    const resp = await fetch('./poems.zip')
    const blob = await resp.blob()

    document.getElementById('loading-text').textContent = '正在解压...'
    const zip = await JSZip.loadAsync(blob)

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
    Store.setZipEtag(resp.headers.get('ETag') || resp.headers.get('Last-Modified') || String(resp.headers.get('Content-Length') || ''))

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
