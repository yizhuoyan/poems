// 颜色小分类 - 游戏 iframe 入口
// 通过 postMessage 接收关卡指令，发送音频请求和导航事件

(function() {
  GameUI.initElements();
  GameUI.setupDrag();

  // 父页会发送两次 start-level（兼容 iframe 加载时序），这里防抖只处理一次
  var lastStartLevel = { id: -1, time: 0 };
  function onStartLevel(levelId) {
    var now = Date.now();
    if (lastStartLevel.id === levelId && now - lastStartLevel.time < 1000) return;
    lastStartLevel = { id: levelId, time: now };
    var started = GameManager.startLevel(levelId);
    if (!started) return;
    GameUI.renderGame(GameManager.getCurrentLevelData());
    GameUI.updateScore();
  }

  document.getElementById('btn-back').addEventListener('click', function() {
    GameUI.cleanupGame();
    GameManager.goToMenu();
    window.parent.postMessage({ type: 'nav', data: { target: 'menu' } }, '*');
  });

  document.getElementById('btn-next-level').addEventListener('click', function() {
    GameUI.hideLevelComplete();
    var next = GameManager.nextLevel();
    if (next) {
      GameUI.renderGame(next);
      GameUI.updateScore();
    } else {
      GameUI.cleanupGame();
      window.parent.postMessage({ type: 'nav', data: { target: 'menu' } }, '*');
    }
  });

  document.getElementById('btn-back-menu').addEventListener('click', function() {
    GameUI.hideLevelComplete();
    GameManager.goToMenu();
    GameUI.cleanupGame();
    window.parent.postMessage({ type: 'nav', data: { target: 'menu' } }, '*');
  });

  window.addEventListener('message', function(e) {
    var msg = e.data;
    if (!msg || !msg.type) return;
    if (msg.type === 'start-level' && msg.levelId) {
      onStartLevel(msg.levelId);
    }
  });

  window.parent.postMessage({ type: 'ready' }, '*');
})();
