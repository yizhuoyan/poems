# 诗词集项目

## 项目结构

```
web/                    # 网站根目录（nginx root 指向此）
├── AGENTS.md
├── index.html          # SPA 入口（<base href="/">）
├── poems.zip           # 诗词数据包（build-zip.ps1 生成）
├── css/
│   └── style.css       # 全局样式（响应式，古典风格）
├── js/
│   ├── app.js          # 入口：ZipLoader.ensure() → 路由注册
│   ├── store.js        # localStorage 封装（poems_data + poems_etag）
│   ├── db.js           # IndexedDB 存储图片（images store，key-value）
│   ├── parser.js       # 解析 .md → JSON 对象（含体裁/韵书/词牌/赏析分离）
│   ├── zip-loader.js   # 下载 poems.zip → JSZip 解压 → parser 解析 → 缓存
│   │                   #   - HTTP 模式：fetch + ETag 增量检测
│   │                   #   - file:// 模式：弹出文件选择器手动选 zip
│   ├── router.js       # Hash-only 路由（hashchange 事件，无 history.pushState）
│   │                   #   - HTTP & file:// 均用 location.hash + hashchange
│   │                   #   - go() 设置 location.hash 并立即 resolve
│   ├── lib/
│   │   └── jszip.min.js
│   └── components/
│       ├── nav.js          # 顶部导航栏：href="#/..."，浏览器自然跟随 hash（无 preventDefault）
│       │                   #   dropdown 通过 click 切换 .active 类（hover 已移除，兼容 iOS）
│       ├── home.js         # 首页：显示最新年份诗词列表 + 底部上/下一年导航
│       ├── poem-list.js    # 通用列表页：按 year/genre/sub/cipai/rhyme 筛选
│       │                   #   year 模式底部有上/下一年导航（左/右对齐）
│       ├── poem-detail.js  # 详情页：面包屑 + 内容 + 图片 + 赏析 + 上/下一首
│       ├── search.js       # 搜索页：标题+正文全文搜索，关键词高亮
│       └── stats.js        # 统计页：总篇数/诗/词 + SVG 柱状图 + 饼图
```

## 部署

nginx root 指向 `web/` 目录。已配置在 `D:\opt\nginx\conf\nginx.conf`，端口 80。
SPA 路由使用 hash（`#/...`），无需服务器端回退配置（try_files 已移除）。

## 数据流

**首次访问** → 下载 poems.zip → JSZip 解压 → zip-loader 过滤 `YYYY/` 下 `.md` + 图片 → parser 解析 `.md` 为 JSON → 存入 localStorage → 图片存入 IndexedDB → 渲染。  
**再次访问** → 直接读 localStorage（ETag/HEAD 未变则不重复下载）。  
**file:// 协议** → fetch 不可用，弹出文件选择器让用户手动选择 `poems.zip`，后续流程同 HTTP。

## 路由

基于 `location.hash` + `hashchange` 事件，HTTP 和 `file://` 协议统一使用 `#/...` 格式。  
`Router.go(path)` 设置 `location.hash`，由 `hashchange` 事件触发路由解析。  
导航栏 `<a href="#/...">` 不带 click 拦截器，浏览器自然跟随 hash 触发 hashchange → 路由解析。

| 路径（实际地址栏为 `#/...`） | 说明 |
|------|------|
| `/` | 首页（最新年份诗词列表） |
| `/year/{yyyy}` | 按年份筛选 |
| `/genre/shi?sub={子体裁}&cipai={词牌}` | 按诗筛选（支持子体裁/词牌过滤） |
| `/genre/ci?sub={子体裁}&cipai={词牌}` | 按词筛选（支持子体裁/词牌过滤） |
| `/rhyme/{pingshui\|xinyun\|tongyun}` | 按韵书筛选 |
| `/detail/{id}` | 诗词详情（id 为文件路径 + 日期的 DJB2 哈希，base36） |
| `/search?q={关键词}` | 搜索（标题 + 正文，不区分大小写） |
| `/stats` | 统计页面（总篇数/诗/词 + SVG 柱状图 + 饼图） |

## parser.js 关键字段

| 字段 | 说明 |
|------|------|
| `id` | 唯一 ID（`filePath + date` 的 DJB2 哈希，toString(36)） |
| `title` | 诗词标题（简，`·` 后部分或完整） |
| `fullTitle` | 完整标题（从文件名 `《》` 或 `# 《》` 提取） |
| `filename` | 原始文件名 |
| `year` | 创作年份（从目录名提取） |
| `date` | 创作日期 YYYY-MM-DD（从文件名提取） |
| `genre` | 诗 / 词 |
| `rhyme` | 韵书（平水韵 / 中华新韵 / 中华通韵），URL slug 见 `Parser._rhymeSlug` |
| `cipai` | 词牌名（从 `_knownCipai` 列表匹配） |
| `subGenre` | 诗子体裁（五言绝句/七言绝句/五言律诗/七言律诗/排律/古风/其他） |
| `content` | 诗词正文（第一个代码块） |
| `contentLines` | 按句分割的正文列表（按标点/空格分割，去除非汉字） |
| `appreciation` | 赏析文字（第二个代码块） |
| `epigraph` | 备注（`>>` 后内容） |
| `images` | 图片列表 `[{alt, src}]`（从 `![alt](src)` 提取） |
| `_raw` | 原始文件路径 |

## 关键设计

- **parser.js 新增词牌时**：`_knownCipai` 数组需补充新词牌名  
- **图片加载**：`ZipLoader.getImageBlobUrl()` 按 `src → year/src → images/去除` 三个路径尝试从 IndexedDB 获取  
- **Nav 导航栏**：年份倒序、诗按子体裁分组、词按词牌分组、韵书自动收集有数据的项  
  - 全部使用 `<a href="#/...">`，浏览器自然跟随 hash，无 `e.preventDefault()`  
  - dropdown 通过 `.nav-item` 的 click 事件切换 `.active` 类控制显隐（hover 已移除）  
  - `document click` 关闭所有 active 的 dropdown  
- **年份导航**：首页和按年份筛选页底部均有上/下一年链接，左/右对齐布局  
- **Stats 图表**：纯 SVG 绘制，无第三方依赖
