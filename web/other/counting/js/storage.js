// 数一数 Counting —— 存档模块（两页共享，每次直读 localStorage，避免缓存不同步）
var Storage = (function () {
  'use strict';

  var KEY = 'counting-save-v1';
  var MAX_LEVEL = 12;

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var d = JSON.parse(raw);
      return d && typeof d === 'object' ? d : null;
    } catch (e) { return null; }
  }

  function write(d) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {}
  }

  function getCurrentLevel() {
    var d = read();
    var lv = d && typeof d.currentLevel === 'number' ? d.currentLevel : 0;
    if (!lv && d && typeof d.maxCount === 'number') lv = d.maxCount; // 兼容旧版 maxCount
    return Math.min(Math.max(1, lv), MAX_LEVEL);
  }

  function setCurrentLevel(v) {
    var d = read() || {};
    var lv = Math.min(Math.max(1, v), MAX_LEVEL);
    if (lv > (d.currentLevel || 1)) { d.currentLevel = lv; write(d); }
  }

  function resetProgress() {
    var d = read() || {};
    d.currentLevel = 1;
    write(d);
  }

  function isMusicOn() {
    var d = read();
    return !d || !d.settings ? true : d.settings.music !== false;
  }

  function setMusic(v) {
    var d = read() || {};
    if (!d.settings) d.settings = {};
    d.settings.music = !!v;
    write(d);
  }

  function isSfxOn() {
    var d = read();
    return !d || !d.settings ? true : d.settings.sfx !== false;
  }

  function setSfx(v) {
    var d = read() || {};
    if (!d.settings) d.settings = {};
    d.settings.sfx = !!v;
    write(d);
  }

  // 声音权限（权利模型）：sessionStorage 保存（标签页级，iframe 与首页同源共享）；null=未决断
  function getSoundPermission() {
    try {
      var v = sessionStorage.getItem(KEY + '-sound');
      return v === 'allowed' ? 'allowed' : (v === 'denied' ? 'denied' : null);
    } catch (e) { return null; }
  }

  function setSoundPermission(v) {
    try {
      sessionStorage.setItem(KEY + '-sound', v === 'allowed' ? 'allowed' : 'denied');
    } catch (e) {}
  }

  function load() { return read(); }

  return {
    load: load,
    getCurrentLevel: getCurrentLevel,
    setCurrentLevel: setCurrentLevel,
    resetProgress: resetProgress,
    isMusicOn: isMusicOn,
    setMusic: setMusic,
    isSfxOn: isSfxOn,
    setSfx: setSfx,
    getSoundPermission: getSoundPermission,
    setSoundPermission: setSoundPermission
  };
})();
