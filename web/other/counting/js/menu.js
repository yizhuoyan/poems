// 数一数 Counting —— 首页模块（菜单 + BGM 控制 + iframe 管理）
(function () {
  'use strict';

  var menu = document.getElementById('menu-screen');
  var frame = document.getElementById('game-frame');
  var menuLevel = document.getElementById('menu-level');
  var btnStart = document.getElementById('btn-start');
  var btnReset = document.getElementById('btn-reset');
  var btnMenuMusic = document.getElementById('btn-menu-music');
  var btnMenuSfx = document.getElementById('btn-menu-sfx');

  var gameStarted = false;

  function updateMenuLevel() {
    var lv = Storage.getCurrentLevel();
    var lc = GameData.LEVELS[lv - 1];
    menuLevel.textContent = (lc ? lc.label : '关卡 ' + lv) + '  (' + lv + '/' + GameData.TOTAL_LEVELS + ')';
  }

  function updateSettingsButtons() {
    // 声音未授权时强制显示关闭态
    var permitted = AudioUnlock.isPermitted();
    var m = permitted && Storage.isMusicOn(), s = permitted && Storage.isSfxOn();
    btnMenuMusic.textContent = m ? '🔊' : '🔇';
    btnMenuMusic.classList.toggle('off', !m);
    btnMenuSfx.textContent = s ? '🔔' : '🔕';
    btnMenuSfx.classList.toggle('off', !s);
  }

  function createStarBackground() {
    var bg = document.getElementById('stars-bg');
    if (!bg) return;
    bg.innerHTML = '';
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 50; i++) {
      var star = document.createElement('span');
      star.className = 'star';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      var size = 2 + Math.random() * 4;
      star.style.width = size + 'px';
      star.style.height = size + 'px';
      star.style.animationDelay = Math.random() * 3 + 's';
      star.style.animationDuration = (2 + Math.random() * 3) + 's';
      star.style.opacity = 0.3 + Math.random() * 0.7;
      frag.appendChild(star);
    }
    bg.appendChild(frag);
  }

  // 开始游戏：显示 iframe，必要时重载重置
  function startGame() {
    menu.classList.add('hidden');
    menu.classList.remove('active');
    frame.classList.add('active');
    if (gameStarted) {
      frame.src = 'game.html?t=' + Date.now();
    }
    gameStarted = true;
    if (AudioUnlock.isPermitted()) AudioManager.resume();
  }

  // 返回菜单
  function showMenu() {
    frame.classList.remove('active');
    menu.classList.add('active');
    menu.classList.remove('hidden');
    updateMenuLevel();
    updateSettingsButtons();
  }

  btnStart.addEventListener('click', function (e) {
    e.stopPropagation();
    startGame();
  });

  btnMenuMusic.addEventListener('click', function (e) {
    e.stopPropagation();
    // 拒绝状态：点开关 = 后悔了，复问授权
    if (!AudioUnlock.isPermitted()) {
      AudioUnlock.ask({
        onUnlock: function () {
          if (Storage.isMusicOn()) AudioManager.startMusic();
          updateSettingsButtons();
        },
        onDeny: function () { updateSettingsButtons(); }
      });
      return;
    }
    var on = !Storage.isMusicOn();
    Storage.setMusic(on);
    if (on) { AudioManager.resume(); AudioManager.startMusic(); }
    else { AudioManager.stopMusic(); }
    updateSettingsButtons();
  });

  btnMenuSfx.addEventListener('click', function (e) {
    e.stopPropagation();
    Storage.setSfx(!Storage.isSfxOn());
    updateSettingsButtons();
  });

  btnReset.addEventListener('click', function (e) {
    e.stopPropagation();
    Storage.resetProgress();
    updateMenuLevel();
  });

  // 接收 iframe（游戏页）事件消息：BGM 播放/暂停、返回
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || d.type !== 'game') return;
    if (d.action === 'bgm-play') {
      if (AudioUnlock.isPermitted()) {
        AudioManager.resume();
        if (Storage.isMusicOn()) AudioManager.startMusic();
      }
    } else if (d.action === 'music-on') {
      // 游戏页开关授予声音权利；若此前首页未授权，本窗口 ctx 未解锁，不做非手势 resume
      var wasDenied = !AudioUnlock.isPermitted();
      Storage.setSoundPermission('allowed');
      if (!wasDenied) {
        AudioManager.resume();
        if (Storage.isMusicOn()) AudioManager.startMusic();
      }
    } else if (d.action === 'bgm-pause') {
      AudioManager.stopMusic();
    } else if (d.action === 'back') {
      showMenu();
      // 返回首页后恢复 BGM（已授权且音乐开启时）
      if (AudioUnlock.isPermitted()) {
        AudioManager.resume();
        if (Storage.isMusicOn()) AudioManager.startMusic();
      }
    }
  });

  // 切后台暂停 BGM，回前台恢复
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      AudioManager.stopMusic();
    } else if (AudioUnlock.isPermitted() && Storage.isMusicOn()) {
      AudioManager.resume();
      AudioManager.startMusic();
    }
  });

  updateSettingsButtons();
  updateMenuLevel();
  createStarBackground();

  // 每次加载首页都弹声音授权窗（新窗口必须手势授权）
  AudioUnlock.show({
    onUnlock: function () {
      if (Storage.isMusicOn()) AudioManager.startMusic();
      updateSettingsButtons();
    },
    onDeny: function () { updateSettingsButtons(); }
  });
})();
