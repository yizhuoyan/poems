// 颜色小分类 - localStorage 存档模块

var StorageManager = (function() {
  var STORAGE_KEY = 'color-sort-save-v1';

  function getDefaultSave() {
    return {
      unlockedLevel: 1,
      levels: {},
      settings: { music: true, sfx: true, voice: '' },
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return getDefaultSave();
      var data = JSON.parse(raw);
      var def = getDefaultSave();
      if (!data || typeof data !== 'object') return def;
      if (typeof data.unlockedLevel !== 'number') data.unlockedLevel = def.unlockedLevel;
      if (!data.levels || typeof data.levels !== 'object') data.levels = {};
      if (!data.settings || typeof data.settings !== 'object') data.settings = def.settings;
      if (typeof data.settings.music !== 'boolean') data.settings.music = def.settings.music;
      if (typeof data.settings.sfx !== 'boolean') data.settings.sfx = def.settings.sfx;
      if (typeof data.settings.voice !== 'string') data.settings.voice = def.settings.voice;
      return data;
    } catch (e) {
      return getDefaultSave();
    }
  }

  function save(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
  }

  function getLevelData(levelId) {
    return load().levels[levelId] || null;
  }

  function saveLevelResult(levelId, stars, score) {
    var saveData = load();
    var prev = saveData.levels[levelId];
    var bestStars = prev ? Math.max(prev.stars || 0, stars) : stars;
    var bestScore = prev ? Math.max(prev.bestScore || 0, score) : score;
    saveData.levels[levelId] = { stars: bestStars, bestScore: bestScore };
    if (stars > 0 && levelId >= saveData.unlockedLevel && levelId < GAME_CONFIG.MAX_LEVELS) {
      saveData.unlockedLevel = levelId + 1;
    }
    save(saveData);
  }

  function isLevelUnlocked(levelId) {
    return levelId <= load().unlockedLevel;
  }

  function getUnlockedLevel() {
    return load().unlockedLevel;
  }

  function getSettings() {
    return load().settings;
  }

  function updateSettings(key, value) {
    var saveData = load();
    saveData.settings[key] = value;
    save(saveData);
  }

  function getVoiceName() {
    return load().settings.voice || '';
  }

  function setVoiceName(name) {
    updateSettings('voice', name);
  }

  function resetProgress() {
    localStorage.removeItem(STORAGE_KEY);
  }

  return {
    load: load,
    save: save,
    getLevelData: getLevelData,
    saveLevelResult: saveLevelResult,
    isLevelUnlocked: isLevelUnlocked,
    getUnlockedLevel: getUnlockedLevel,
    getSettings: getSettings,
    updateSettings: updateSettings,
    getVoiceName: getVoiceName,
    setVoiceName: setVoiceName,
    resetProgress: resetProgress,
  };
})();
