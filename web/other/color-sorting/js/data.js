// 颜色小分类 - 颜色/物件/关卡配置（数据驱动）

var COLORS = {
  red:    { id: 'red',    name: '红色', en: 'Red',    hex: '#E74C3C', light: '#FADBD8', dark: '#C0392B' },
  yellow: { id: 'yellow', name: '黄色', en: 'Yellow', hex: '#F1C40F', light: '#FEF9E7', dark: '#B7950B' },
  blue:   { id: 'blue',   name: '蓝色', en: 'Blue',   hex: '#3498DB', light: '#D6EAF8', dark: '#2471A3' },
  green:  { id: 'green',  name: '绿色', en: 'Green',  hex: '#2ECC71', light: '#D5F5E3', dark: '#1E8449' },
  orange: { id: 'orange', name: '橙色', en: 'Orange', hex: '#E67E22', light: '#FDEBD0', dark: '#B85C05' },
  purple: { id: 'purple', name: '紫色', en: 'Purple', hex: '#9B59B6', light: '#E8DAEF', dark: '#6C3483' },
};

var COLOR_ITEMS = {
  red:    ['🍎','🍒','🌹','❤️','🎈','🍓','🎒','🌶️'],
  yellow: ['🍋','🌻','⭐','🏀','🍌','🌽','🧀','🚕'],
  blue:   ['🫐','🐟','💧','🧢','🎽','🚙','💎','🦋'],
  green:  ['🍏','🥦','🌳','🍀','🐸','🧃','🌿','🫑'],
  orange: ['🍊','🎃','🦊','🏈','🥕','🍑','🌅','🦺'],
  purple: ['🍇','🍆','🧪','🦄','💜','🎀','☂️','🔮'],
};

var DIFFICULTY_BLOCKS = [
  { levelStart: 1,  levelEnd: 3,  boxCount: 2, colors: ['red','yellow'],   targetCount: 4 },
  { levelStart: 4,  levelEnd: 6,  boxCount: 3, colors: ['red','yellow','blue'], targetCount: 6 },
  { levelStart: 7,  levelEnd: 9,  boxCount: 4, colors: ['red','yellow','blue','green'], targetCount: 8 },
  { levelStart: 10, levelEnd: 12, boxCount: 5, colors: ['red','yellow','blue','green','orange','purple'], targetCount: 10 },
];

var GAME_CONFIG = {
  MAX_LEVELS: 12,
  PLAYER_NAME: '卷卷',
  TTS_NAME: '卷娟',
  ITEM_SIZE: 100,
  BOX_SIZE: 90,
  DRAG_OFFSET_Y: 50,
  ENCOURAGE_COMBO_3: ['卷卷真棒！', '太厉害了！', '好聪明！'],
  ENCOURAGE_COMBO_6: ['卷卷超级棒！', '卷卷小天才！', '太了不起了！'],
};

var ITEM_NAMES = {};
function _reg(cn, en, emojis) {
  for (var i = 0; i < emojis.length; i++) {
    ITEM_NAMES[emojis[i]] = { name: cn, en: en };
  }
}
_reg('苹果',   'Apple',      ['🍎']);
_reg('樱桃',   'Cherry',     ['🍒']);
_reg('玫瑰',   'Rose',       ['🌹']);
_reg('爱心',   'Heart',      ['❤️']);
_reg('气球',   'Balloon',    ['🎈']);
_reg('草莓',   'Strawberry', ['🍓']);
_reg('书包',   'Bag',        ['🎒']);
_reg('辣椒',   'Pepper',     ['🌶️']);
_reg('柠檬',   'Lemon',      ['🍋']);
_reg('向日葵', 'Sunflower',  ['🌻']);
_reg('星星',   'Star',       ['⭐']);
_reg('篮球',   'Basketball', ['🏀']);
_reg('香蕉',   'Banana',     ['🍌']);
_reg('玉米',   'Corn',       ['🌽']);
_reg('奶酪',   'Cheese',     ['🧀']);
_reg('出租车', 'Taxi',       ['🚕']);
_reg('蓝莓',   'Blueberry',  ['🫐']);
_reg('小鱼',   'Fish',       ['🐟']);
_reg('水滴',   'Drop',       ['💧']);
_reg('帽子',   'Cap',        ['🧢']);
_reg('运动服', 'Jersey',     ['🎽']);
_reg('蓝色车', 'Car',        ['🚙']);
_reg('钻石',   'Diamond',    ['💎']);
_reg('蝴蝶',   'Butterfly',  ['🦋']);
_reg('青苹果', 'Green Apple',['🍏']);
_reg('西兰花', 'Broccoli',   ['🥦']);
_reg('树',     'Tree',       ['🌳']);
_reg('四叶草', 'Clover',     ['🍀']);
_reg('青蛙',   'Frog',       ['🐸']);
_reg('果汁',   'Juice',      ['🧃']);
_reg('叶子',   'Leaf',       ['🌿']);
_reg('甜椒',   'Bell Pepper',['🫑']);
_reg('橙子',   'Orange',     ['🍊']);
_reg('南瓜',   'Pumpkin',    ['🎃']);
_reg('狐狸',   'Fox',        ['🦊']);
_reg('橄榄球', 'Football',   ['🏈']);
_reg('胡萝卜', 'Carrot',     ['🥕']);
_reg('桃子',   'Peach',      ['🍑']);
_reg('日落',   'Sunset',     ['🌅']);
_reg('安全服', 'Vest',       ['🦺']);
_reg('葡萄',   'Grape',      ['🍇']);
_reg('茄子',   'Eggplant',   ['🍆']);
_reg('实验瓶', 'Flask',      ['🧪']);
_reg('独角兽', 'Unicorn',    ['🦄']);
_reg('紫心',   'PurpleHeart',['💜']);
_reg('蝴蝶结', 'Ribbon',     ['🎀']);
_reg('雨伞',   'Umbrella',   ['☂️']);
_reg('水晶球', 'CrystalBall',['🔮']);

function getDifficultyBlock(levelId) {
  for (var i = 0; i < DIFFICULTY_BLOCKS.length; i++) {
    var b = DIFFICULTY_BLOCKS[i];
    if (levelId >= b.levelStart && levelId <= b.levelEnd) return b;
  }
  return DIFFICULTY_BLOCKS[DIFFICULTY_BLOCKS.length - 1];
}

function shuffleArray(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

function pickRandom(arr, n) {
  return shuffleArray(arr).slice(0, Math.min(n, arr.length));
}

function generateLevel(levelId) {
  var block = getDifficultyBlock(levelId);
  var boxColors = block.colors;
  if (boxColors.length > block.boxCount) {
    boxColors = pickRandom(boxColors, block.boxCount);
  }

  var allItems = {};
  for (var i = 0; i < boxColors.length; i++) {
    var cid = boxColors[i];
    allItems[cid] = COLOR_ITEMS[cid] || [];
  }

  return {
    id: levelId,
    boxColors: boxColors,
    allItems: allItems,
    targetCount: block.targetCount,
  };
}

function randomItemForColor(colorId) {
  var items = COLOR_ITEMS[colorId];
  if (!items || items.length === 0) return '🔴';
  return items[Math.floor(Math.random() * items.length)];
}
