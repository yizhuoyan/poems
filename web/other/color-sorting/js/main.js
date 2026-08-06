// 卷卷认颜色 - 主页面入口（菜单路由 + 音频代理 + 语音设置）

(function() {
  UIManager.initElements();
  AudioManager.init();
  TTSManager.init();

  var settings = StorageManager.getSettings();
  AudioManager.setMusic(settings.music);
  AudioManager.setSfx(settings.sfx);

  var levelNumEl = document.getElementById('level-num');
  var levelTotalEl = document.getElementById('level-total');

  function onStartClick() {
    UIManager.showGame();
    AudioManager.stopBGM();
    var levelId = StorageManager.getUnlockedLevel();
    var iframe = document.getElementById('game-iframe');
    iframe.contentWindow.postMessage({ type: 'start-level', levelId: levelId }, '*');
    setTimeout(function() {
      iframe.contentWindow.postMessage({ type: 'start-level', levelId: levelId }, '*');
    }, 300);
  }

  var audioProxy = {
    playCorrect: function() { AudioManager.playCorrect(); },
    playWrong: function() { AudioManager.playWrong(); },
    playPickup: function() { AudioManager.playPickup(); },
    playSparkle: function() { AudioManager.playSparkle(); },
    playLevelComplete: function() { AudioManager.playLevelComplete(); },
    playStar: function(d) { AudioManager.playStar(d.index); },
  };

  window.addEventListener('message', function(e) {
    var msg = e.data;
    if (!msg || !msg.type) return;
    if (msg.type === 'audio') {
      AudioManager.resumeContext();
      var fn = audioProxy[msg.data.method];
      if (fn) fn(msg.data);
    } else if (msg.type === 'nav' && msg.data && msg.data.target === 'menu') {
      UIManager.showMenu();
      UIManager.renderMenu();
      levelNumEl.textContent = StorageManager.getUnlockedLevel();
      levelTotalEl.textContent = GAME_CONFIG.MAX_LEVELS;
      if (AudioManager.isMusicOn()) AudioManager.startBGM();
    }
  });

  var helloPlayed = false;
  document.addEventListener('pointerdown', function playHello() {
    AudioManager.resumeContext();
    if (!helloPlayed) {
      helloPlayed = true;
      setTimeout(function() {
        TTSManager.speak('你好，' + GAME_CONFIG.TTS_NAME + '！');
      }, 100);
    }
    if (AudioManager.isMusicOn()) AudioManager.startBGM();
  }, { once: false });

  // --- 界面初始化 ---
  UIManager.renderMenu();
  UIManager.showMenu();
  UIManager.bindEvents(onStartClick);

  levelNumEl.textContent = StorageManager.getUnlockedLevel();
  levelTotalEl.textContent = GAME_CONFIG.MAX_LEVELS;

  document.getElementById('btn-voice').addEventListener('click', function() {
    AudioManager.resumeContext();
    TTSManager.openPanel();
  });

  document.getElementById('btn-reset').addEventListener('click', function() {
    AudioManager.resumeContext();
    if (confirm('确定要重置所有关卡进度吗？')) {
      StorageManager.resetProgress();
      levelNumEl.textContent = 1;
    }
  });
})();
