# 颜色小分类 — Agent 指南

## 零依赖，零构建

纯原生 HTML/CSS/JS，无需 npm、框架、打包。双击 `index.html` 或 `python -m http.server` 即可运行。

## ⚠️ 血泪教训（必须遵守，防止再犯）

### 1. 禁止用 PowerShell 读写项目文件
- 禁止 `Get-Content` / `Set-Content` / `Out-File` 修改本项目的任何文件。
- PowerShell 5.1 默认按 GBK 读取 UTF-8 文件 → 双重编码乱码（mojibake），**曾两次损坏 index.html/game.html 中文**。
- `Set-Content -Encoding UTF8` 还会写入 BOM。
- 文件读写一律用 Read / Write / Edit 工具（write 工具输出的脚本标签也要走 Edit/Write，不能用管道）。

### 2. 文件覆盖事故
- 曾把 `(Get-Content index.html) -replace ... | Set-Content game.html` 写成跨文件写入，**用 index.html 内容覆盖了 game.html**。
- 教训：永远不要一条命令读写两个不同文件；写文件前先确认目标路径与内容来源。

### 3. 改 JS 必须同步升版本号
- `index.html` / `game.html` 的脚本标签带缓存版本号 `?v=N`（如 `js/main.js?v=6`）。
- **每次修改 JS/CSS 文件后，必须把两个 html 里所有 `v=` 版本号 +1**，否则 Chrome/iPad 缓存旧文件，用户看到"改了个寂寞"（曾出现 getVoiceName is not a function、按钮没反应）。
- 修改后验证：`grep v= index.html game.html` 确认两个文件版本一致。

### 4. 每次修改后立即 git commit
- 每次修改完（连同版本号升级）立刻 `git commit`（只 stage `color-sorting/` 目录，勿动工作区其他项目如 grab-animal/counting）。
- 便于 `git checkout` 快速回滚。
- 提交信息格式：`color-sorting: 简述改动`。

### 5. 中文编码验证
- 用 PowerShell 检查文件是否乱码时，输出中文到控制台会显示乱码（控制台 GBK），**以布尔值和码点判断为准**：
  `$t.Contains([char]0xFFFD)`、`[int[]][char[]]$str`，不要靠肉眼读控制台中文。

## 双页面架构（iframe + postMessage）

| 页面 | 职责 | 通信 |
|------|------|------|
| `index.html` | 主菜单 + 音频代理 | 监听 game iframe 的 `audio`/`nav` 消息 |
| `game.html` | 游戏全流程（iframe） | 发 `audio`/`nav`，收 `start-level` |

**iframe 之间用 `postMessage`，禁止 `window.parent.` 直接访问。**

## 文件结构

```
css/   base.css  game.css  menu.css  overlay.css  animations.css
js/    data.js  storage.js  audio.js  game.js  game-ui.js  game-init.js  main.js  ui.js
```

- `data.js` — 颜色 `COLORS`、物件 `COLOR_ITEMS`、难度分块 `DIFFICULTY_BLOCKS`、`GAME_CONFIG`（MAX_LEVELS=12）、关卡生成函数
- `game.js` — `GameManager` 状态机，`handleDrop()`/`handleDropOutside()`
- `game-ui.js` — iframe 内独立运行：拖拽、动画、TTS、渲染
- `audio.js` — Web Audio 合成音效（pickup/correct/wrong/sparkle/BGM）
- `game-init.js` — iframe 入口，监听 `start-level` 消息
- `main.js` — 父页入口，音频代理 + 语音选择面板

## 需要知道的

- **路径相对**：`css/base.css`，非 `/css/base.css`
- **`main.js` 发送 `start-level` 两次**（立即 + 300ms 延迟），这是有意为之（兼容 iframe 加载时序），勿删第二次
- **拖拽阈值 8px**：只有手指移动超过 8px 才显示拖拽克隆体，短点击不会触发飞回动画
- **拖拽触发区是 `#item-glow`**（物品本身），不是整片 `#item-zone`
- **物品圆圈不暴露颜色**：边框和光晕在 CSS 中写死为灰色（`rgba(0,0,0,.06/.08)`），JS 中不再动态设置颜色
- **物品名称在圆圈内**：中英文名是 `#item-glow` 的子元素，拖拽克隆用 `innerHTML` 整体复制
- **难度**：1-3关(2盒/4件) → 4-6关(3盒/6件) → 7-9关(4盒/8件) → 10-12关(5盒/10件，从6色中随机抽5色)
- **存档 key**：`color-sort-save-v1`
- **语音全部用本地 TTS**（speechSynthesis），无音频文件；游戏内 `_speak()` 在 game-ui.js，父页 `_speakText()` 在 main.js
- **语音选择器**：首页 🎙️ 按钮，家长可选语音，存 `settings.voice`（storage.js），父页和 iframe 同源共享 localStorage
- **TTS 名字**：朗读用 `GAME_CONFIG.TTS_NAME = '卷娟'`（发音正确），显示用 `PLAYER_NAME = '卷卷'`，勿混淆
- **语音是异步加载**：`getVoices()` 首次可能为空，靠 `onvoiceschanged` 事件；面板打开时要等待加载完成再渲染
- **start-level 防抖**：`game-init.js` 对 1 秒内同关卡重复消息只处理一次（父页发两次是有意的）
- **答对后语音链**：`_speak` 支持 onDone 回调，"答对了…"播完再出下一题（间隔 500ms）；最后一件物品（过关）不渲染新物品
