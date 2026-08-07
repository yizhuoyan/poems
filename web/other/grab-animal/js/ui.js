// 卷卷抓小动物 - UI 模块（菜单渲染 + 界面切换 + HUD + 过关庆祝）

var UIManager = (function() {
  var els = {};
  var bannerTimer = null;
  var nextHandler = null;
  var retryHandler = null;

  function initElements() {
    els.menuScreen = document.getElementById('menu-screen');
    els.gameScreen = document.getElementById('game-screen');
    els.menuProgress = document.getElementById('menu-progress');
    els.btnMusic = document.getElementById('btn-music');
    els.btnSfx = document.getElementById('btn-sfx');
    els.goalCount = document.getElementById('goal-count');
    els.levelHud = document.getElementById('level-hud');
    els.collectedRow = document.getElementById('collected-row');
    els.banner = document.getElementById('level-banner');
    els.hudAvatar = document.getElementById('hud-avatar');
    els.winOverlay = document.getElementById('win-overlay');
    els.winParade = document.getElementById('win-parade');
    els.winText = document.getElementById('win-text');
    els.btnNext = document.getElementById('btn-next-level');
    els.failOverlay = document.getElementById('fail-overlay');
    els.btnRetry = document.getElementById('btn-retry');
  }

  function showMenu() {
    els.menuScreen.classList.add('active');
    els.gameScreen.classList.remove('active');
  }

  function showGame() {
    els.menuScreen.classList.remove('active');
    els.gameScreen.classList.add('active');
  }

  // 菜单进度 + 开关状态
  function renderMenu() {
    var unlocked = StorageManager.getUnlockedLevel();
    var done = StorageManager.getCompletedCount();
    var last = GAME_CONFIG.MAX_LEVELS;
    var text = (unlocked > last) ? '全部完成！' : ('第 ' + unlocked + ' 关 · 已完成 ' + done + '/' + last + ' 关');
    els.menuProgress.textContent = text;
    renderToggles();
  }

  function renderToggles() {
    var s = StorageManager.getSettings();
    els.btnMusic.classList.toggle('off', !s.music);
    els.btnSfx.classList.toggle('off', !s.sfx);
  }

  // 关卡开始：设置目标与收集栏
  function setGoal(levelId, collected, need) {
    els.levelHud.textContent = '第 ' + levelId + ' 关';
    els.goalCount.textContent = collected + '/' + need;
    els.collectedRow.innerHTML = '';
  }

  function updateGoal(collected, need) {
    els.goalCount.textContent = collected + '/' + need;
    els.goalCount.classList.remove('bump');
    void els.goalCount.offsetWidth;
    els.goalCount.classList.add('bump');
  }

  // 小动物归位到顶部中央收集栏（图标 + 英文名）
  function addCollected(animal) {
    var item = document.createElement('div');
    item.className = 'collected-item';
    var icon = document.createElement('span');
    icon.className = 'collected-icon';
    icon.textContent = animal.emoji;
    var word = document.createElement('span');
    word.className = 'collected-word';
    word.textContent = animal.en;
    item.appendChild(icon);
    item.appendChild(word);
    els.collectedRow.appendChild(item);
  }

  // 每次抓到手，卷卷头像开心跳一下
  function avatarHappy() {
    els.hudAvatar.classList.remove('happy');
    void els.hudAvatar.offsetWidth;
    els.hudAvatar.classList.add('happy');
  }

  // 关卡开场横幅：先大屏展示，随后缩小固定在页面顶部
  function showBanner(text, duration) {
    if (bannerTimer) { clearTimeout(bannerTimer); bannerTimer = null; }
    els.banner.textContent = text;
    els.banner.classList.remove('show');
    els.banner.classList.remove('compact');
    void els.banner.offsetWidth;
    els.banner.classList.add('show');
    bannerTimer = setTimeout(function() {
      els.banner.classList.remove('show');
      els.banner.classList.add('compact');
    }, duration || 2200);
  }

  // 过关庆祝面板
  function showWin(caughtAnimals, levelId) {
    els.winParade.innerHTML = '';
    for (var i = 0; i < caughtAnimals.length; i++) {
      var a = document.createElement('span');
      a.className = 'parade-animal';
      a.style.animationDelay = (i % 5) * 0.1 + 's';
      a.textContent = caughtAnimals[i].emoji;
      els.winParade.appendChild(a);
    }
    els.winText.textContent = '卷卷真棒！';
    var lastLevel = levelId >= GAME_CONFIG.MAX_LEVELS;
    els.btnNext.textContent = lastLevel ? '全部完成！' : '下一关';
    els.winOverlay.classList.add('show');
  }

  function hideWin() {
    els.winOverlay.classList.remove('show');
  }

  // 失败弹窗：泡泡数到 100
  function showFail() {
    els.failOverlay.classList.add('show');
  }

  function hideFail() {
    els.failOverlay.classList.remove('show');
  }

  function onRetryClick(handler) {
    retryHandler = handler;
    els.btnRetry.addEventListener('pointerdown', function(e) {
      e.preventDefault();
      if (retryHandler) retryHandler();
    });
  }

  function onNextClick(handler) {
    nextHandler = handler;
    els.btnNext.addEventListener('pointerdown', function(e) {
      e.preventDefault();
      if (nextHandler) nextHandler();
    });
  }

  return {
    initElements: initElements,
    showMenu: showMenu,
    showGame: showGame,
    renderMenu: renderMenu,
    renderToggles: renderToggles,
    setGoal: setGoal,
    updateGoal: updateGoal,
    addCollected: addCollected,
    avatarHappy: avatarHappy,
    showBanner: showBanner,
    showWin: showWin,
    hideWin: hideWin,
    showFail: showFail,
    hideFail: hideFail,
    onNextClick: onNextClick,
    onRetryClick: onRetryClick,
  };
})();
