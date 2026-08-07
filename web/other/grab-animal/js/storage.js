// 卷卷抓小动物 - localStorage 存档模块

var StorageManager = (function() {
  var STORAGE_KEY = 'bubble-pop-save-v2';

  function getDefaultSave() {
    return {
      unlockedLevel: 1,
      completedLevels: [],
      settings: { music: true, sfx: true },
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return getDefaultSave();
      var data = JSON.parse(raw);
      var def = getDefaultSave();
      if (!data || typeof data !== 'object') return def;
      if (typeof data.unlockedLevel !== 'number' || data.unlockedLevel < 1) data.unlockedLevel = def.unlockedLevel;
      if (!data.completedLevels || !Array.isArray(data.completedLevels)) data.completedLevels = def.completedLevels;
      if (!data.settings || typeof data.settings !== 'object') data.settings = def.settings;
      if (typeof data.settings.music !== 'boolean') data.settings.music = def.settings.music;
      if (typeof data.settings.sfx !== 'boolean') data.settings.sfx = def.settings.sfx;
      return data;
    } catch (e) {
      return getDefaultSave();
    }
  }

  function save(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
  }

  // 记录过关：解锁下一关
  function completeLevel(levelId) {
    var d = load();
    if (d.completedLevels.indexOf(levelId) === -1) d.completedLevels.push(levelId);
    if (levelId >= d.unlockedLevel && levelId < GAME_CONFIG.MAX_LEVELS) {
      d.unlockedLevel = levelId + 1;
    }
    save(d);
    return d;
  }

  function getUnlockedLevel() { return load().unlockedLevel; }
  function getCompletedCount() { return load().completedLevels.length; }
  function isLevelCompleted(levelId) { return load().completedLevels.indexOf(levelId) !== -1; }

  function getSettings() { return load().settings; }

  function updateSettings(key, value) {
    var d = load();
    d.settings[key] = value;
    save(d);
  }

  // 重置存档（清空进度，保留设置）
  function resetProgress() {
    var d = getDefaultSave();
    d.settings = load().settings;
    save(d);
    return d;
  }

  return {
    load: load,
    save: save,
    completeLevel: completeLevel,
    resetProgress: resetProgress,
    getUnlockedLevel: getUnlockedLevel,
    getCompletedCount: getCompletedCount,
    isLevelCompleted: isLevelCompleted,
    getSettings: getSettings,
    updateSettings: updateSettings,
  };
})();
