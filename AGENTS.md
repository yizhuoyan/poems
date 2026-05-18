# 诗词集项目

## 项目结构

```
F:\STUDY\poems\
├── web\                    # 网站根目录（nginx root 指向此）
│   ├── index.html          # SPA 入口（<base href="/">）
│   ├── poems.zip           # 诗词数据包（脚本生成）
│   ├── css/style.css
│   └── js/
│       ├── app.js          # 入口：ZipLoader.ensure() → 路由注册（含 genreMap / rhymeSlug）
│       ├── store.js        # localStorage 封装（含 ETag 缓存）
│       ├── db.js           # IndexedDB 存储图片
│       ├── parser.js       # 解析 md → JSON
│       ├── zip-loader.js   # 下载/解压/解析/缓存（仅处理 YYYY/ 目录下 .md）
│       ├── router.js       # History API 路由（pushState/popstate）
│       ├── lib/jszip.min.js
│       └── components/
│           ├── nav.js, home.js, poem-list.js
│           ├── poem-detail.js（面包屑+上/下一首）, search.js, stats.js
├── build-zip.ps1           # 打包脚本
├── nginx.conf              # nginx 配置参考
├── 2010/ ~ 2026/           # 原始诗词 .md 文件（按年份分目录）
├── AGENTS.md
└── web/poems.zip
```

## 部署

nginx root 指向 `web/` 目录。已配置在 `D:\opt\nginx\conf\nginx.conf`，端口 80。
SPA 路由通过 `try_files $uri $uri/ /index.html;` 实现回退。

## 新增诗词后的操作

1. 在对应年份目录下新建 `YYYYMMDD-《标题》.md` 文件
2. 运行 `.\build-zip.ps1` 重新打包

> 缓存自动通过 ETag / Last-Modified / Content-Length 检测更新，无需手动修改版本号。

## 数据流

首次访问 → 下载 poems.zip → JSZip 解压 → zip-loader 过滤 YYYY/ 下 .md → parser.js 解析为 JSON → 存入 localStorage → 图片存入 IndexedDB → 渲染。
再次访问 → 直接读 localStorage（ETag 未变则不重复下载）。

## 路由

基于 History API（pushState/popstate），路径式路由而非 hash：

| 路径 | 说明 |
|------|------|
| `/` | 首页（最新年份诗词列表） |
| `/year/{yyyy}` | 按年份筛选 |
| `/genre/shi?sub={子体裁}` | 按诗/子体裁筛选 |
| `/genre/ci?cipai={词牌}` | 按词/词牌筛选 |
| `/rhyme/{pingshui|xinyun|tongyun}` | 按韵书筛选 |
| `/detail/{id}` | 诗词详情（id 为文件路径哈希） |
| `/search?q={关键词}` | 搜索（标题+正文） |
| `/stats` | 统计页面 |

## parser.js 关键字段

| 字段 | 说明 |
|------|------|
| `id` | 唯一 ID（文件路径+日期的 DJB2 哈希，base36） |
| `title` | 诗词标题（简） |
| `fullTitle` | 完整标题（含格律/词牌） |
| `year` | 创作年份 |
| `date` | 创作日期 YYYY-MM-DD |
| `genre` | 诗 / 词 |
| `rhyme` | 韵书（平水韵/中华新韵/中华通韵），URL slug 见 `parser._rhymeSlug` |
| `cipai` | 词牌名 |
| `subGenre` | 诗子体裁（五言绝句/七言律诗/排律/古风/其他） |
| `content` | 诗词正文 |
| `contentLines` | 按句分割的正文列表 |
| `appreciation` | 赏析文字 |
| `epigraph` | 备注（>>后内容） |
| `images` | 图片列表 [{alt, src}] |
