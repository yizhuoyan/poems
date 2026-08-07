// 数一数 Counting —— 游戏数据配置
var GameData = {
  OBJECT_POOL: ['⭐', '🔴', '🍎', '🐤', '🐰', '🚗', '🌼', '⚽'],

  NUM_CN: ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'],
  NUM_EN: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'],

  TOTAL_LEVELS: 12,

  // 关卡配置
  // type: 'normal' 普通关（计数+测验） / 'test' 纯测验关
  LEVELS: [
    // === 数字 1~5 ===
    { level: 1,  label: '数字 1',  type: 'normal', count: 1, rounds: 3, quizRound: 0 },
    { level: 2,  label: '数字 2',  type: 'normal', count: 2, rounds: 5, quizRound: 5 },
    { level: 3,  label: '数字 3',  type: 'normal', count: 3, rounds: 5, quizRound: 5 },
    { level: 4,  label: '数字 4',  type: 'normal', count: 4, rounds: 5, quizRound: 5 },
    { level: 5,  label: '数字 5',  type: 'normal', count: 5, rounds: 5, quizRound: 5 },
    // === 阶段测验一：1~5 ===
    { level: 6,  label: '测验 1~5', type: 'test',   range: [1, 5], rounds: 10 },
    // === 数字 6~9 ===
    { level: 7,  label: '数字 6',  type: 'normal', count: 6, rounds: 5, quizRound: 5 },
    { level: 8,  label: '数字 7',  type: 'normal', count: 7, rounds: 5, quizRound: 5 },
    { level: 9,  label: '数字 8',  type: 'normal', count: 8, rounds: 5, quizRound: 5 },
    { level: 10, label: '数字 9',  type: 'normal', count: 9, rounds: 5, quizRound: 5 },
    // === 阶段测验二：6~9 ===
    { level: 11, label: '测验 6~9', type: 'test',   range: [6, 9], rounds: 10 },
    // === 总测验：1~9 ===
    { level: 12, label: '总测验',   type: 'test',   range: [1, 9], rounds: 10 }
  ],

  CONFIG: {
    objectDiameter: 96,
    objectEmojiSize: 72,
    minGap: 24,
    celebrationDelay: 600,
    objectAreaPadding: 20
  }
};
