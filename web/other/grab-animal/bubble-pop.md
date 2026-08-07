# 泡泡噗噗 Bubble Pop —— 游戏开发提示词

> 用途：全新开发一款给 2~3 岁小女孩「卷卷」玩的触屏游戏。
> 本目录即为游戏目录（已预置卷卷头像与鼓励语音资源），直接在此开发。
> 交付时告诉模型游戏目录路径，并说：**"按本目录内 bubble-pop.md 完整实现游戏。"**

## 一、项目概述
屏幕持续飘出彩色泡泡，卷卷用手指点一下泡泡就"噗"地破掉，溅出小彩光，偶尔蹦出一颗星星或小表情（惊喜彩蛋）。无限玩、永不失败、语音鼓励。适合 iPad，也兼容电脑浏览器测试。

- 游戏名：泡泡噗噗（Bubble Pop），标题副标可写「卷卷的泡泡乐园」
- 单机离线，零网络；中文为主

## 二、技术约束
1. 零依赖零构建：原生 HTML/CSS/JS，双击 index.html 可运行
2. 单一页面（不需要 iframe），文件建议：index.html + css/style.css + js/{data.js,audio.js,storage.js,game.js,ui.js,main.js}
3. 触屏+鼠标统一用 Pointer Events（pointerdown/move/up），多点同时点泡泡要都响应
4. 不用 Canvas 整体渲染，用 DOM + CSS transform 动画
5. 音效用 Web Audio 振荡器合成；鼓励语音用已就位的「卷卷」语音雪碧图（见 §6）
6. iPad 适配：viewport meta（禁止缩放）、touch-action: manipulation、禁页面滚动/橡皮筋（overflow hidden + 100dvh）、禁长按菜单与文本选中
7. 2~3 岁设计：泡泡直径 ≥80px、语音优先文字极少、无失败、无倒计时、永远鼓励

## 三、玩法与界面
- 主菜单：标题 + 卷卷头像 + 大「开始」按钮；可带音乐/音效开关
- 游戏画面：
  - 顶部：卷卷小头像（对每次"爆"泡泡轻微开心跳动）、已收星星数（⭐）
  - 主区：泡泡随机位置/大小生成（直径 80~140px），缓慢上浮 + 轻微左右晃动（CSS @keyframes），颜色柔和多彩
  - 生成节奏：开始慢（每 ~1.2s 一个），随游玩时间加快（最快 ~0.45s），屏幕最多同时 ~8 个
  - 点泡泡：立即播放"噗"音效 + 泡泡碎裂小粒子（CSS 粒子）+ 消失；偶尔（~1/4 概率）蹦出彩蛋（⭐ 或小动物表情🐤🐰🐶），弹出时亮闪闪，星星入账
  - 点空白：轻微"叮"一声即可，不做任何惩罚
- 里程碑鼓励：每集满 5 颗星播一次随机鼓励语音，并短暂显示"卷卷真棒！"
- 无关卡/无结束：点返回按钮回主菜单，星星数存档

## 四、数据（data.js）
- 泡泡颜色调色板（8~10 个柔和糖果色）
- 彩蛋池：⭐🐤🐰🐶🐱🦄🌈 等
- GAME_CONFIG：泡泡尺寸范围、生成间隔范围、彩蛋概率、星星目标档位（5/10/15 播鼓励）

## 五、音效（audio.js，Web Audio 合成）
- 泡泡"噗"：短促噪声爆裂音（白噪声突发 + 低通）+ 上滑音
- 彩蛋弹出：上行琶音（C-E-G）
- 星星入账：清脆"叮"
- 背景音乐：轻快循环小旋律（三角波，音量小）
- 鼓励语音：见 §6

## 六、卷卷定制（资源已就位）
- **卷卷头像已就位**：`assets/images/avatar.png`，主菜单 + 顶部圆形裁剪展示（border-radius:50% + object-fit:cover）
- **鼓励语音雪碧图已就位**：`assets/audio/praise.wav` + `assets/audio/praise.json`，片段 id：hello/start/praise_1/praise_2/cheer/correct/retry/win/wow（内容：你好卷卷/我们开始吧/卷卷真棒/卷卷好厉害/卷卷加油/再试一次/答对了/过关啦/哇真厉害）
  - 播放方式：fetch → decodeAudioData → BufferSourceNode.start(0, offset, duration)；进入游戏播 start，满 5 颗星随机 praise_1/praise_2/cheer
  - 需要新语音时可用 Windows 本地 TTS（Microsoft Huihui，zh-CN）合成 16kHz/16bit/mono WAV 放入 assets/audio/
- 视觉主题（全新，不复用旧粉色）：水族馆/泡泡主题——浅蓝→浅紫背景渐变，透明感泡泡，圆润字体

## 七、存档（storage.js，localStorage）
- key 如 `bubble-pop-save-v1`：{ stars: 累计星星, bestStars: 历史最高, settings:{music,sfx} }
- 容错处理缺字段；首次自动初始化

## 八、验收清单
- 双击 index.html 可玩；触屏与鼠标都能点；多点同爆
- 泡泡生成/上浮/消失流畅，无报错、控制台干净
- 点泡泡有"噗"音+粒子；彩蛋概率正确、星星入账
- 满 5 颗星触发鼓励语音（"卷卷真棒"等）且语音不卡顿
- 返回主菜单星星数保留；音乐/音效开关生效并持久化
- iPad 不滚动、不长按弹菜单、双击不缩放
- 卷卷头像显示正常，替换头像图片不改代码

## 九、编码要求
- 模块化职责分离；数据与表现分离；音效触发与动画同步
- 动画只用 transform/opacity；中文注释精简
