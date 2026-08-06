# 卷卷抓小动物 — Agent 指南

## 零依赖，零构建

纯原生 HTML/CSS/JS，无需 npm、框架、打包。双击 `index.html` 即可运行；语法检查用 `node --check js/*.js`（无 import，可直接检查）。

## 架构（单页面，无 iframe）

- `index.html` — 唯一页面：主菜单 / 游戏画面 / 过关弹窗 / 失败弹窗；含重置、全屏按钮
- `js/data.js` — 唯一数据源：`ANIMALS`、`LEVELS`（20 关）、`BG_THEMES`（背景渐变）、`GAME_CONFIG`、`pickRandom`/`getLevel`
- `js/game.js` — `GameManager`：关卡流程、泡泡生成、直接漂浮动物（11-20）、飘过小动物、抓取入账
- `js/ui.js` — `UIManager`：界面切换、横幅、收集栏、关卡 HUD、弹窗
- `js/audio.js` — `AudioManager`：Web Audio 合成音效 + 雪碧图语音
- `js/storage.js` — localStorage，key `bubble-pop-save-v2`，含 `resetProgress()`
- `js/main.js` — 入口：事件绑定 + 首次手势解锁音频

## 抓取计数与动画解耦（重要）

- 入账在 `_collectAnimal()`（动物开始飞时立即执行一次），**只依赖 `running`/`level` 状态**
- `transitionend` 和超时兜底只调用 `cleanup` 删 DOM，绝不触发计数（否则 transform/opacity 双 transitionend 会重复入账）
- `_flyToTop()` 必须移除全部动画类（`animal`/`animal-hop`/`animal-pass`/`animal-direct`）后再设内联 transform

## 计数不变量（踩过的坑）

- `activeBubbles` **只在 `_destroyBubble()` 递减**（带 `_destroyed` 防重入），`_popBubble` 里不要减——否则切出界面后泡泡飘走计数泄漏、卡在 `MAX_BUBBLES` 导致不再生成
- 切出界面：`main.js` 的 `visibilitychange` 调 `GameManager.pause()`/`resume()`，**不要用 `stop()`**（会销毁关卡）；pause 必须同时清 `spawnTimer` 和 `passTimer`，resume 两个都要恢复

## 关卡结构（1-20）

- **1~10 关**：泡泡模式。爆泡有 `animalChance` 蹦出小动物，动物自动跳一跳后飞向顶部收集栏入账
- **11~20 关**：直接漂浮模式（`_isDirectLevel()`，由 `LEVELS[n].targetAnimal` 触发）。无泡泡，动物带半透明圈从底部上浮（`.animal-direct`），**点击才交互**：
  - 点中目标动物 → 飞向顶部入账
  - 点错其他动物 → `_vanish()` 快速消失 + **随机播一句失败重试语音**（`RETRY_PRAISE_IDS`，不播英文）
  - 每关 `targetAnimal` 不同（11小鸡/12小鸭/…/20猴子），`needCount` 按 1-5 循环；动物尺寸每次出现时在 `sizeMin~sizeMax` 随机
  - 目标动物保证出现：`_pickSpawnAnimal()` 30% 直接出目标，连续 3 只非目标后强制出目标（`nonTargetStreak` 每关重置）
- 快速飘过小动物：仅第 6~20 关（`LEVELS[n].passChance`），每 4~7s 掷骰、60% 命中（~10s 一只）；方向与起止点用 `--from`/`--to`（**两个方向都必须从屏幕外进入**，`--dir` 计算会出错）；点击即抓，入账与泡泡动物同流程；不点飘走无惩罚
- 每关开始随机一个背景渐变主题（`BG_THEMES`，写回 `--bg-top`/`--bg-bottom` CSS 变量）
- 泡泡序号 `bubbleSeq` 每关从 1 递增，第 100 个生成时 `_failLevel()` → 失败弹窗 + 随机失败语音 + 重试当前关
- 收集栏：动物归位到**顶部中央**，emoji 下方显示英文名（`animal.en` 与 animals.wav 雪碧图 id 一致）
- 开场横幅：`showBanner` → `.show` 大屏展示 → `.compact` 缩到页面顶部（`top: 0`）并常驻；指定动物关卡横幅显示 `找出 X 只 🐰 (Rabbit)`

## 鼓励语音分组（praise.wav 雪碧图，15 段）

- 触发时**随机**播组内一句，`GAME_CONFIG` 里定义三组：
  - `HELLO_PRAISE_IDS`（4 段）— 首次进首页，在 `unlock().then()` 里播
  - `WIN_PRAISE_IDS`（7 段）— 过关弹窗（过关先播 `playLevelComplete()` 旋律，2.6s 后弹窗时播语音）
  - `RETRY_PRAISE_IDS`（4 段）— 失败重试 + 直接模式点错动物
- `audio.js` 内置 `PRAISE_OFFSETS`/`PRAISE_DURS` 回退偏移表，**与 `praise.json` 一致**；替换录音后需重新生成雪碧图并同步两张表

## 音频（iOS 要点）

- **iOS 只认 `touchstart`/`click` 为合法音频解锁手势**，`pointerdown` 不算；首次手势 `unlock()` 创建 AudioContext 并立即 `ctx.resume()`
- `unlock()` 返回 Promise，`resume()` 完成后才 resolve；**hello/BGM 必须在 `.then()` 里播**，否则 Context 还 suspended、首段被静默丢弃（踩过坑：首页 hello 无声）
- BGM 每次 `startBGM()` 新建独立增益节点 `bgmGain`，`stopBGM()` 断开并静音旧节点——**杜绝多次调用叠加**（`musicGain` 旧方案会叠音变快）；手势解锁只在首次开 BGM（`bgmStarted` 标志）
- 语音雪碧图：`praise.wav`（15 段）、`animals.wav`（10 种动物英文）、`goal.wav`；fetch+decodeAudioData 优先，失败回退 `<audio>` 元素定位播放
- 动物英文单词：`playAnimalWord(id)` 播 **2 遍**（不是 3）
- 所有资源路径相对路径（`assets/audio/animals.wav`），支持子目录部署

## 首页按钮

- 🔄 重置进度：`confirm` 后 `StorageManager.resetProgress()` 回第 1 关（保留音乐/音效设置）
- ⛶ 全屏切换：支持标准与 webkit 前缀；**全屏时屏蔽 keydown/keypress**，避免 Chrome 弹"似乎正在全屏模式下键入"（游戏纯触屏无需键盘）
- 第 10 关全通后点"开始"从第 1 关重玩（`getCompletedCount() >= MAX_LEVELS` 判断）；最后一关"全部完成！"回菜单时自动重置进度

## 风格

- ES5 风格（var + IIFE 模块），无 ES6 语法；中文注释精简；动画只用 transform/opacity
- 面向 2~3 岁：泡泡直径 ≥80px、无失败惩罚（失败仅限 100 上限）、语音优先文字极少

## 语音素材维护

- 录音格式统一转 **PCM / 16kHz / 16-bit / 单声道** WAV（ffmpeg：`-ar 16000 -ac 1 -sample_fmt s16`）
- 随手录音开头有静音/杂音：用 ffmpeg 清理 `silenceremove=start_periods=1:start_threshold=-40dB:start_silence=0.05:stop_periods=-1:stop_threshold=-40dB:stop_silence=0.05,afftdn=nf=-25:nt=w`
- 合并雪碧图：`node tools/merge-sprite.js <wav目录> praise`（目录内文件名即段 id），生成 `praise.wav`+`praise.json` 覆盖到 `assets/audio/`
- **改语音后必须同步** `PRAISE_OFFSETS`/`PRAISE_DURS` 回退表，否则 `file://` 打开错位
