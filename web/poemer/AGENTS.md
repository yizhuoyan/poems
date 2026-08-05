# 诗词创作工具 (poemer)

纯前端单页应用，无构建/测试/依赖管理。

## 文件结构

- `index.html` — 完整 UI + 内联 CSS + 全部 JS 逻辑（~525 行）
- `data.js` — 中华通韵韵书数据 + 格律模式定义；通过 `<script src="data.js">` 加载

## 核心架构

- 无框架，ES5 IIFE（自执行函数），所有状态闭包内管理
- 韵部数据：`zhtyRhymeBook`（`RhymeBook` 实例，含 `rhymeCategories` 数组）
- 每个韵部：`yinpingChars` / `yangpingChars` / `shangshengChars` / `qushengChars` 四个字符串
- 格律模式：`ShiMetricalPatternArray`（`MetricalPattern[]` 含 `PzPattern[]`）
- 单字查询：`getCharInfo(ch)` 返回 `{tones, categories, isPing, isZe, isAmbiguous, primaryTone}`

## 关键约定

- `char-card` 的 `.char` 子元素显示汉字，`.tone-label` 显示声调标记；无独立 `char-hanzi` 类
- 韵部标签是 `<a>` 元素（`.rhyme-tag`），underline 样式，点击弹出平声字浮层
- 检验结果分 "平仄" 和 "押韵" 两个隐含维度，但显示在同一个 `#toneResult` 容器中（无 tab 切换）
- 备注区 (`#notesArea`) 只显示：重字、多音字、未收录字、行数不匹配；无统计汇总
- 图案模式在 `.pattern-display` 中每两行一组（`.pattern-row`）
- 弹出浮层 `.rhyme-popup` 通过 fixed 定位，在 document click 时关闭（排除 `.rhyme-tag` 点击）
- 输入框无默认值；`input` 事件实时清理内容（`cleanInput`，仅保留汉字与 `，。？！` 及换行）并自动识别体裁（`autoDetect`），不自动校验

## 修改注意事项

- 所有样式在 `<style>` 内联，无外部 CSS 文件
- 修改 `.char-card` 结构时，确保 `card.innerHTML` 模板字符串同步更新
- 添加新的声调类型时需要同步更新 CSS class 和 `render()` 中的 class 判断逻辑
- 韵书数据（`data.js`）排查约定：轻声视为阴平；多音字以普通话标准读音为准，删除无实义读法；同一字不应同时出现在阴平与阳平（混调）
