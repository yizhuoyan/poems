// 卷卷抓小动物 - 页面入口（事件绑定 + 首次手势解锁音频）

(function() {
  UIManager.initElements();
  AudioManager.init();

  var settings = StorageManager.getSettings();
  AudioManager.setMusic(settings.music);
  AudioManager.setSfx(settings.sfx);

  var btnStart = document.getElementById('btn-start');
  var btnBack = document.getElementById('btn-back');
  var btnMusic = document.getElementById('btn-music');
  var btnSfx = document.getElementById('btn-sfx');
  var btnReset = document.getElementById('btn-reset');
  var btnFullscreen = document.getElementById('btn-fullscreen');

  // 空点：轻微"叮"，无惩罚
  var field = document.getElementById('bubble-field');
  field.addEventListener('pointerdown', function(e) {
    if (e.target === field && GameManager.isRunning()) AudioManager.playDing();
  });

  // 开始：从当前解锁关卡继续；全部通关后从第 1 关重新开始
  btnStart.addEventListener('pointerdown', function(e) {
    e.preventDefault();
    var unlocked = StorageManager.getUnlockedLevel();
    var allDone = StorageManager.getCompletedCount() >= GAME_CONFIG.MAX_LEVELS;
    if (allDone) unlocked = 1;
    else if (unlocked > GAME_CONFIG.MAX_LEVELS) unlocked = GAME_CONFIG.MAX_LEVELS;
    GameManager.startLevel(unlocked);
    if (!bgmStarted && AudioManager.isMusicOn()) {
      bgmStarted = true;
      AudioManager.startBGM();
    }
  });

  btnBack.addEventListener('pointerdown', function(e) {
    e.preventDefault();
    GameManager.stop();
    UIManager.showMenu();
    UIManager.renderMenu();
  });

  btnMusic.addEventListener('pointerdown', function(e) {
    e.preventDefault();
    var on = AudioManager.toggleMusic();
    StorageManager.updateSettings('music', on);
    UIManager.renderToggles();
  });

  btnSfx.addEventListener('pointerdown', function(e) {
    e.preventDefault();
    var on = AudioManager.toggleSfx();
    StorageManager.updateSettings('sfx', on);
    UIManager.renderToggles();
  });

  // 重置进度：回到第 1 关
  btnReset.addEventListener('pointerdown', function(e) {
    e.preventDefault();
    if (!confirm('确定要重置所有关卡进度吗？')) return;
    StorageManager.resetProgress();
    UIManager.renderMenu();
  });

  // 全屏切换
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      var el = document.documentElement;
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
  }
  // 全屏时屏蔽键盘，避免 Chrome 提示"似乎正在全屏模式下键入"（游戏纯触屏无需键盘）
  function blockKeys(ev) {
    ev.preventDefault();
    ev.stopPropagation();
  }
  function syncKeyBlock() {
    var full = !!(document.fullscreenElement || document.webkitFullscreenElement);
    if (full) {
      if (!keydownHandler) {
        keydownHandler = blockKeys;
        document.addEventListener('keydown', keydownHandler, true);
        document.addEventListener('keypress', keydownHandler, true);
      }
    } else {
      if (keydownHandler) {
        document.removeEventListener('keydown', keydownHandler, true);
        document.removeEventListener('keypress', keydownHandler, true);
        keydownHandler = null;
      }
    }
  }
  var keydownHandler = null;
  document.addEventListener('fullscreenchange', syncKeyBlock);
  document.addEventListener('webkitfullscreenchange', syncKeyBlock);
  btnFullscreen.addEventListener('pointerdown', function(e) {
    e.preventDefault();
    toggleFullscreen();
    syncKeyBlock();
  });

  // 过关庆祝：下一关 / 全部完成回菜单并从第 1 关重新开始
  UIManager.onNextClick(function() {
    UIManager.hideWin();
    var current = GameManager.currentLevelId();
    if (current >= GAME_CONFIG.MAX_LEVELS) {
      StorageManager.resetProgress();
      UIManager.showMenu();
      UIManager.renderMenu();
      return;
    }
    GameManager.startLevel(current + 1);
  });

  // 失败弹窗：重试当前关
  UIManager.onRetryClick(function() {
    UIManager.hideFail();
    GameManager.startLevel(GameManager.currentLevelId());
  });

  // 首次手势：解锁 AudioContext + 打招呼 + 预载语音 + 开背景音乐
  // 等 resume() 完成后（Context running）再播 hello/BGM，否则首段会被静默丢弃
  var helloPlayed = false;
  var bgmStarted = false;
  function unlockAudio() {
    AudioManager.loadPraise();
    AudioManager.loadAnimals();
    AudioManager.loadGoal();
    AudioManager.unlock().then(function(ok) {
      if (!ok) return;
      if (!helloPlayed) {
        helloPlayed = true;
        AudioManager.playPraise(pickRandom(GAME_CONFIG.HELLO_PRAISE_IDS));
      }
      if (!bgmStarted && AudioManager.isMusicOn()) {
        bgmStarted = true;
        AudioManager.startBGM();
      }
    });
  }
  document.addEventListener('touchstart', unlockAudio, { passive: true });
  document.addEventListener('click', unlockAudio);

  // 页面切出时暂停（不中断关卡），返回时恢复泡泡
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      GameManager.pause();
      AudioManager.stopBGM();
    } else {
      GameManager.resume();
      if (bgmStarted && AudioManager.isMusicOn()) AudioManager.startBGM();
    }
  });

  UIManager.renderMenu();
  UIManager.showMenu();
})();
