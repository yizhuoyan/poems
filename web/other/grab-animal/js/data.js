// 卷卷抓小动物 - 动物与关卡配置（数据驱动）

// 10 种小动物（英文语音段 id 与 animals.wav 雪碧图一致）
var ANIMALS = {
  chick:   { id: 'chick',   name: '小鸡', en: 'Chick',   emoji: '🐤' },
  duck:    { id: 'duck',    name: '小鸭', en: 'Duck',    emoji: '🦆' },
  rabbit:  { id: 'rabbit',  name: '小兔', en: 'Rabbit',  emoji: '🐰' },
  cat:     { id: 'cat',     name: '小猫', en: 'Cat',     emoji: '🐱' },
  dog:     { id: 'dog',     name: '小狗', en: 'Dog',     emoji: '🐶' },
  pig:     { id: 'pig',     name: '小猪', en: 'Pig',     emoji: '🐷' },
  bee:     { id: 'bee',     name: '蜜蜂', en: 'Bee',     emoji: '🐝' },
  bear:    { id: 'bear',    name: '小熊', en: 'Bear',    emoji: '🐻' },
  panda:   { id: 'panda',   name: '熊猫', en: 'Panda',   emoji: '🐼' },
  monkey:  { id: 'monkey',  name: '猴子', en: 'Monkey',  emoji: '🐵' },
};

var ANIMAL_ORDER = ['chick', 'duck', 'rabbit', 'cat', 'dog', 'pig', 'bee', 'bear', 'panda', 'monkey'];

// 柔和糖果色泡泡（c: 主色，light: 高光渐变浅色）
var BUBBLE_COLORS = [
  { c: '#ffb7c5', light: '#ffdde4' }, // 淡粉
  { c: '#a5d8ff', light: '#d0ecff' }, // 淡蓝
  { c: '#a8e6cf', light: '#d8f7ed' }, // 薄荷
  { c: '#cdb8ff', light: '#e8dfff' }, // 淡紫
  { c: '#fff0a8', light: '#fff9dc' }, // 淡黄
  { c: '#ffcfa8', light: '#ffe9d6' }, // 蜜桃
  { c: '#a5f0e0', light: '#d4faf2' }, // 淡青
  { c: '#ffc2a5', light: '#ffe4d4' }, // 淡橙
  { c: '#b9e8b0', light: '#dcf6d7' }, // 淡绿
];

// 20 个关卡：越后越难（泡泡更小更快、生成更密、动物出现概率更低、需要数量更多）
// sizeMin/sizeMax: 泡泡直径范围(px)；floatMin/floatMax: 上浮时长范围(s)
// spawnMs: 生成间隔(ms)；animalChance: 爆泡蹦出小动物概率；needCount: 需收集数量
// passChance: 快速飘过小动物的出现概率（0=不出现，第 6 关起奖励性质，平均 ~10s 一只）
// targetAnimal: 指定收集的动物（11~20 关每关一种动物，数量 1~5 循环递增）
var LEVELS = [
  { id: 1,  sizeMin: 120, sizeMax: 140, floatMin: 10, floatMax: 14, spawnMs: 1300, animalChance: 0.45, needCount: 2, passChance: 0 },
  { id: 2,  sizeMin: 115, sizeMax: 140, floatMin: 9,  floatMax: 13, spawnMs: 1200, animalChance: 0.42, needCount: 3, passChance: 0 },
  { id: 3,  sizeMin: 110, sizeMax: 135, floatMin: 9,  floatMax: 13, spawnMs: 1100, animalChance: 0.40, needCount: 3, passChance: 0 },
  { id: 4,  sizeMin: 105, sizeMax: 130, floatMin: 8,  floatMax: 12, spawnMs: 1000, animalChance: 0.38, needCount: 4, passChance: 0 },
  { id: 5,  sizeMin: 100, sizeMax: 125, floatMin: 8,  floatMax: 12, spawnMs: 950,  animalChance: 0.35, needCount: 4, passChance: 0 },
  { id: 6,  sizeMin: 95,  sizeMax: 120, floatMin: 7,  floatMax: 11, spawnMs: 900,  animalChance: 0.32, needCount: 4, passChance: 0.6 },
  { id: 7,  sizeMin: 90,  sizeMax: 115, floatMin: 7,  floatMax: 10, spawnMs: 850,  animalChance: 0.30, needCount: 5, passChance: 0.6 },
  { id: 8,  sizeMin: 85,  sizeMax: 110, floatMin: 6,  floatMax: 9,  spawnMs: 800,  animalChance: 0.27, needCount: 5, passChance: 0.6 },
  { id: 9,  sizeMin: 80,  sizeMax: 105, floatMin: 6,  floatMax: 9,  spawnMs: 750,  animalChance: 0.25, needCount: 5, passChance: 0.6 },
  { id: 10, sizeMin: 80,  sizeMax: 100, floatMin: 5,  floatMax: 8,  spawnMs: 650,  animalChance: 0.22, needCount: 6, passChance: 0.6 },
  { id: 11, sizeMin: 80,  sizeMax: 115, floatMin: 7,  floatMax: 10, spawnMs: 900,  animalChance: 0.22, needCount: 1, passChance: 0.6, targetAnimal: 'chick' },
  { id: 12, sizeMin: 80,  sizeMax: 115, floatMin: 7,  floatMax: 10, spawnMs: 880,  animalChance: 0.21, needCount: 2, passChance: 0.6, targetAnimal: 'duck' },
  { id: 13, sizeMin: 80,  sizeMax: 115, floatMin: 6.5, floatMax: 9.5, spawnMs: 860, animalChance: 0.20, needCount: 3, passChance: 0.6, targetAnimal: 'rabbit' },
  { id: 14, sizeMin: 80,  sizeMax: 115, floatMin: 6.5, floatMax: 9.5, spawnMs: 840, animalChance: 0.20, needCount: 4, passChance: 0.6, targetAnimal: 'cat' },
  { id: 15, sizeMin: 80,  sizeMax: 115, floatMin: 6,  floatMax: 9,  spawnMs: 820,  animalChance: 0.19, needCount: 5, passChance: 0.6, targetAnimal: 'dog' },
  { id: 16, sizeMin: 80,  sizeMax: 115, floatMin: 6,  floatMax: 9,  spawnMs: 800,  animalChance: 0.19, needCount: 1, passChance: 0.6, targetAnimal: 'pig' },
  { id: 17, sizeMin: 80,  sizeMax: 115, floatMin: 6,  floatMax: 9,  spawnMs: 780,  animalChance: 0.18, needCount: 2, passChance: 0.6, targetAnimal: 'bee' },
  { id: 18, sizeMin: 80,  sizeMax: 115, floatMin: 5.5, floatMax: 8.5, spawnMs: 760, animalChance: 0.18, needCount: 3, passChance: 0.6, targetAnimal: 'bear' },
  { id: 19, sizeMin: 80,  sizeMax: 115, floatMin: 5.5, floatMax: 8.5, spawnMs: 740, animalChance: 0.17, needCount: 4, passChance: 0.6, targetAnimal: 'panda' },
  { id: 20, sizeMin: 80,  sizeMax: 115, floatMin: 5,  floatMax: 8,  spawnMs: 700,  animalChance: 0.17, needCount: 5, passChance: 0.6, targetAnimal: 'monkey' },
];

// 关卡背景渐变主题（每关随机取一个，营造不同场景氛围）
var BG_THEMES = [
  { name: '水族馆', top: '#cfeaff',  bottom: '#e6d9ff' },
  { name: '天空',   top: '#a5e6ff',  bottom: '#ffe9a8' },
  { name: '草原',   top: '#d4f7c0',  bottom: '#fff3b0' },
  { name: '森林',   top: '#c9f0d8',  bottom: '#b3e0c8' },
  { name: '沙滩',   top: '#ffe8c2',  bottom: '#bde9f2' },
  { name: '黄昏',   top: '#ffd9b0',  bottom: '#ffb3c8' },
  { name: '月光',   top: '#c3c8f0',  bottom: '#e0d6ff' },
  { name: '花园',   top: '#ffc9e0',  bottom: '#d0f0a8' },
  { name: '糖果',   top: '#ffd6e8',  bottom: '#b8e8ff' },
  { name: '星星',   top: '#aab4f5',  bottom: '#d8b0ff' },
];

var GAME_CONFIG = {
  MAX_LEVELS: LEVELS.length,
  MAX_BUBBLES: 8,
  PLAYER_NAME: '卷卷',
  ENCOURAGE_TEXTS: ['卷卷真棒！', '卷卷好厉害！', '卷卷加油！'],
  // 鼓励语音分组（对应 praise.wav 雪碧图，触发时随机播一句）
  HELLO_PRAISE_IDS: ['hello_1', 'hello_2', 'hello_3', 'hello_4'],
  WIN_PRAISE_IDS: ['praise_1', 'praise_2', 'praise_3', 'praise_4', 'praise_5', 'praise_6', 'praise_7'],
  RETRY_PRAISE_IDS: ['retry_1', 'retry_2', 'retry_3', 'retry_4'],
  // 快速飘过小动物：每 4~7s 掷一次骰子，命中 passChance 则出现（平均 ~10s 一只）
  PASS_MIN_MS: 4000,
  PASS_MAX_MS: 7000,
};

// 随机取一个元素
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 获取关卡配置
function getLevel(levelId) {
  for (var i = 0; i < LEVELS.length; i++) {
    if (LEVELS[i].id === levelId) return LEVELS[i];
  }
  return null;
}
