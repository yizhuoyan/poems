// 颜色小分类 - 游戏核心逻辑与状态机

var GameManager = (function() {
  var STATE = { MENU: 'menu', PLAYING: 'playing', ANIMATING: 'animating', LEVEL_COMPLETE: 'levelComplete' };

  var state = STATE.MENU;
  var currentLevelId = 0;
  var currentLevelData = null;
  var score = 0;
  var combo = 0;
  var correctCount = 0;
  var wrongCount = 0;
  var targetCount = 0;
  var currentItemColor = null;
  var currentItemEmoji = '';
  var isInputLocked = false;

  function getState() { return state; }

  function startLevel(levelId) {
    var level = generateLevel(levelId);
    if (!level) return false;

    currentLevelId = levelId;
    currentLevelData = level;
    score = 0;
    combo = 0;
    correctCount = 0;
    wrongCount = 0;
    targetCount = level.targetCount;
    isInputLocked = false;
    state = STATE.PLAYING;
    _generateNewItem();
    return true;
  }

  function _generateNewItem() {
    var colors = currentLevelData.boxColors;
    currentItemColor = colors[Math.floor(Math.random() * colors.length)];
    currentItemEmoji = randomItemForColor(currentItemColor);
  }

  function getCurrentLevelData() { return currentLevelData; }
  function getCurrentLevelId() { return currentLevelId; }
  function getScore() { return score; }
  function getCombo() { return combo; }
  function getCorrectCount() { return correctCount; }
  function getWrongCount() { return wrongCount; }
  function getTargetCount() { return targetCount; }
  function getCurrentItemColor() { return currentItemColor; }
  function getCurrentItemEmoji() { return currentItemEmoji; }
  function isLocked() { return isInputLocked; }

  function handleDrop(boxColor) {
    if (state !== STATE.PLAYING || isInputLocked) return null;

    if (boxColor === currentItemColor) {
      correctCount++;
      combo++;
      var bonusPoints = 10;
      score += bonusPoints;
      var encourage = null;
      if (combo === 3) encourage = _randomPick(GAME_CONFIG.ENCOURAGE_COMBO_3);
      else if (combo >= 6 && combo % 3 === 0) encourage = _randomPick(GAME_CONFIG.ENCOURAGE_COMBO_6);

      var itemColor = currentItemColor;
      var itemEmoji = currentItemEmoji;
      var isComplete = correctCount >= targetCount;
      if (!isComplete) _generateNewItem();

      return {
        result: 'correct',
        score: score,
        combo: combo,
        correctCount: correctCount,
        targetCount: targetCount,
        bonus: bonusPoints,
        encourage: encourage,
        color: itemColor,
        emoji: itemEmoji,
        isComplete: isComplete,
      };
    } else {
      wrongCount++;
      combo = 0;
      return {
        result: 'wrong',
        score: score,
        combo: combo,
        wrongCount: wrongCount,
        correctCount: correctCount,
        targetCount: targetCount,
        emoji: currentItemEmoji,
      };
    }
  }

  function handleDropOutside() {
    combo = 0;
    return { result: 'outside', combo: combo, emoji: currentItemEmoji };
  }

  function isLevelComplete() {
    return correctCount >= targetCount;
  }

  function calculateStars() {
    if (wrongCount === 0) return 3;
    if (wrongCount <= 2) return 2;
    return 1;
  }

  function completeLevel() {
    var stars = calculateStars();
    state = STATE.LEVEL_COMPLETE;
    StorageManager.saveLevelResult(currentLevelId, stars, score);
    return { stars: stars, score: score, levelId: currentLevelId };
  }

  function nextLevel() {
    var nextId = currentLevelId + 1;
    if (nextId > GAME_CONFIG.MAX_LEVELS) {
      state = STATE.MENU;
      return null;
    }
    if (!startLevel(nextId)) {
      state = STATE.MENU;
      return null;
    }
    return currentLevelData;
  }

  function goToMenu() {
    state = STATE.MENU;
    currentLevelData = null;
    currentLevelId = 0;
  }

  function lockInput() { isInputLocked = true; }
  function unlockInput() { isInputLocked = false; }

  function setAnimating(isAnimating) {
    if (isAnimating) {
      state = STATE.ANIMATING;
    } else {
      state = isLevelComplete() ? STATE.LEVEL_COMPLETE : STATE.PLAYING;
    }
  }

  function _randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  return {
    STATE: STATE,
    getState: getState,
    startLevel: startLevel,
    getCurrentLevelData: getCurrentLevelData,
    getCurrentLevelId: getCurrentLevelId,
    getScore: getScore,
    getCombo: getCombo,
    getCorrectCount: getCorrectCount,
    getWrongCount: getWrongCount,
    getTargetCount: getTargetCount,
    getCurrentItemColor: getCurrentItemColor,
    getCurrentItemEmoji: getCurrentItemEmoji,
    isLocked: isLocked,
    handleDrop: handleDrop,
    handleDropOutside: handleDropOutside,
    isLevelComplete: isLevelComplete,
    calculateStars: calculateStars,
    completeLevel: completeLevel,
    nextLevel: nextLevel,
    goToMenu: goToMenu,
    lockInput: lockInput,
    unlockInput: unlockInput,
    setAnimating: setAnimating,
  };
})();
