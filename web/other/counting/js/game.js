// 数一数 Counting —— 游戏页模块（iframe 内：逻辑 + 渲染）
var GamePage = (function () {
  'use strict';

  var state = null;
  var els = {};

  // 向父页（首页）发送事件消息
  function send(action) {
    try { window.parent.postMessage({ type: 'game', action: action }, '*'); } catch (e) {}
  }

  function getLevelConfig(level) { return GameData.LEVELS[level - 1]; }

  function resetState(level) {
    var lc = getLevelConfig(level);
    state = {
      level: level, count: lc.count || 0, totalRounds: lc.rounds,
      quizRound: lc.quizRound || 0, roundIndex: 0, isTestLevel: lc.type === 'test',
      isQuizRound: false, objects: [], clickedCount: 0,
      isComplete: false, isCelebrating: false, isCardPhase: false, targetCount: 0
    };
  }

  // === 生成物件 ===
  function generatePositions(count, areaW, areaH) {
    var cfg = GameData.CONFIG;
    var size = cfg.objectDiameter, padding = cfg.objectAreaPadding + size / 2;
    var minDist = size + cfg.minGap;
    var availW = areaW - padding * 2, availH = areaH - padding * 2;
    if (availW < size || availH < size) { availW = Math.max(availW, size); availH = Math.max(availH, size); }
    var positions = [];
    for (var i = 0; i < count; i++) {
      var placed = false;
      for (var a = 0; a < 200; a++) {
        var x = Math.random() * (availW - size) + padding;
        var y = Math.random() * (availH - size) + padding;
        var valid = true;
        for (var j = 0; j < positions.length; j++) {
          if (Math.sqrt((x - positions[j].x) * (x - positions[j].x) + (y - positions[j].y) * (y - positions[j].y)) < minDist) { valid = false; break; }
        }
        if (valid) { positions.push({ x: x, y: y }); placed = true; break; }
      }
      if (!placed) {
        var cols = Math.ceil(Math.sqrt(count)), rows = Math.ceil(count / cols);
        positions.push({
          x: padding + (i % cols) * (availW - size) / Math.max(cols - 1, 1),
          y: padding + Math.floor(i / cols) * (availH - size) / Math.max(rows - 1, 1)
        });
      }
    }
    return positions;
  }

  function pickEmojis(count) {
    var pool = GameData.OBJECT_POOL, result = [], used = {};
    for (var i = 0; i < count; i++) {
      var idx;
      do { idx = Math.floor(Math.random() * pool.length); } while (used[idx] && Object.keys(used).length < pool.length);
      used[idx] = true; result.push(pool[idx]);
    }
    return result;
  }

  function randInt(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }

  function generateRound() {
    var areaW = els.gameArea ? els.gameArea.clientWidth : window.innerWidth;
    var areaH = els.gameArea ? els.gameArea.clientHeight : window.innerHeight * 0.6;
    var lc = getLevelConfig(state.level);
    if (lc.type === 'test') { state.count = randInt(lc.range[0], lc.range[1]); state.isQuizRound = true; }
    else { state.count = lc.count; state.isQuizRound = (lc.quizRound > 0 && state.roundIndex + 1 === lc.quizRound); }
    var emojis = pickEmojis(state.count);
    var positions = generatePositions(state.count, areaW, areaH);
    state.objects = [];
    for (var i = 0; i < state.count; i++) {
      state.objects.push({ id: i, emoji: emojis[i], x: positions[i].x, y: positions[i].y, clicked: false, clickOrder: 0 });
    }
    state.clickedCount = 0; state.isComplete = false; state.isCelebrating = false;
    state.isCardPhase = false; state.targetCount = state.count;
  }

  // === 游戏逻辑 ===
  function onObjectClick(objId) {
    if (!state || state.isQuizRound || state.isComplete || state.isCelebrating || state.isCardPhase) return;
    var obj = state.objects[objId]; if (!obj || obj.clicked) return;
    obj.clicked = true; state.clickedCount++; obj.clickOrder = state.clickedCount;
    AudioManager.playDing(state.clickedCount); AudioManager.playNum(state.clickedCount);
    markObjectClicked(objId, state.clickedCount);
    updateProgress(state.clickedCount, state.count);
    if (state.clickedCount >= state.count) onAllClicked();
  }

  function onEmptyClick() {
    if (!state || state.isQuizRound || state.isComplete || state.isCelebrating || state.isCardPhase) return;
    AudioManager.playSoftDing();
  }

  function onAllClicked() {
    state.isComplete = true; state.isCelebrating = true;
    setTimeout(function () {
      AudioManager.playTotal(state.count);
      setTimeout(function () {
        AudioManager.playRandomPraise(); AudioManager.playCelebration();
        spawnConfetti(); bounceAvatar();
      }, 800);
    }, GameData.CONFIG.celebrationDelay);
    setTimeout(function () { advanceRound(); }, GameData.CONFIG.celebrationDelay + 2500);
  }

  function startQuiz() {
    state.isCardPhase = true; setQuizMode(true);
    setTimeout(function () { showNumberCards(state.targetCount); }, 600);
  }

  function onCardClick(num) {
    if (!state || !state.isCardPhase) return;
    if (num === state.targetCount) {
      AudioManager.playTotal(state.count);
      setTimeout(function () { AudioManager.playPraise('correct'); }, 800);
      AudioManager.playCelebration(); highlightCard(num);
      spawnConfetti(); bounceAvatar(); state.isCardPhase = false;
      setTimeout(function () { hideNumberCards(); advanceRound(); }, 2200);
    } else {
      AudioManager.playPraise('retry'); shakeCard(num);
    }
  }

  // 每轮开场：普通轮播「我们数一数」语音，测验轮播「这是几个啊」语音
  function playRoundIntro() {
    if (state.isQuizRound) {
      showQuestion('卷卷，这是几个啊？');
      AudioManager.playQuizVoice();
      startQuiz();
    } else {
      setQuizMode(false);
      showQuestion('数一数？');
      AudioManager.playStartVoice();
    }
  }

  function advanceRound() {
    state.roundIndex++;
    if (state.roundIndex >= state.totalRounds) {
      var nextLevel = state.level + 1;
      if (nextLevel > GameData.TOTAL_LEVELS) {
        AudioManager.playPraise('win'); AudioManager.playCelebration();
        spawnConfetti(); bounceAvatar();
        showQuestion('全部通关！真厉害！');
        setTimeout(function () { backToMenu(); }, 3500);
        Storage.setCurrentLevel(GameData.TOTAL_LEVELS); return;
      }
      Storage.setCurrentLevel(nextLevel); state.level = nextLevel;
      var lc = getLevelConfig(nextLevel);
      state.totalRounds = lc.rounds; state.quizRound = lc.quizRound || 0;
      state.isTestLevel = lc.type === 'test'; state.roundIndex = 0;
    }
    clearConfetti(); generateRound();
    renderObjects(state.objects); updateProgress(0, state.count);
    playRoundIntro();
  }

  function start() {
    var level = Storage.getCurrentLevel();
    resetState(level);
    send('bgm-play');
    generateRound();
    renderObjects(state.objects);
    updateProgress(0, state.count);
    playRoundIntro();
  }

  function backToMenu() {
    send('bgm-pause');
    send('back');
    state = null;
  }

  // === 渲染 ===
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

  function renderObjects(objects) {
    if (!els.gameArea) return;
    els.gameArea.innerHTML = '';
    var frag = document.createDocumentFragment();
    var cfg = GameData.CONFIG;

    objects.forEach(function (obj) {
      var wrapper = document.createElement('div');
      wrapper.className = 'game-object';
      wrapper.setAttribute('data-id', obj.id);
      wrapper.style.left = obj.x + 'px';
      wrapper.style.top = obj.y + 'px';
      wrapper.style.width = cfg.objectDiameter + 'px';
      wrapper.style.height = cfg.objectDiameter + 'px';

      var emoji = document.createElement('span');
      emoji.className = 'object-emoji';
      emoji.textContent = obj.emoji;
      emoji.style.fontSize = cfg.objectEmojiSize + 'px';
      wrapper.appendChild(emoji);

      var badge = document.createElement('span');
      badge.className = 'count-badge';
      wrapper.appendChild(badge);

      var glow = document.createElement('span');
      glow.className = 'object-glow';
      wrapper.appendChild(glow);

      frag.appendChild(wrapper);
    });
    els.gameArea.appendChild(frag);
  }

  function markObjectClicked(objId, order) {
    if (!els.gameArea) return;
    var el = els.gameArea.querySelector('.game-object[data-id="' + objId + '"]');
    if (!el) return;
    el.classList.add('clicked');
    el.classList.add('just-bounced');
    var emoji = el.querySelector('.object-emoji');
    if (emoji) emoji.classList.add('lit');
    var badge = el.querySelector('.count-badge');
    if (badge) {
      badge.textContent = order;
      badge.classList.add('show');
    }
    setTimeout(function () { el.classList.remove('just-bounced'); }, 400);
  }

  function updateProgress(clicked, total) {
    var dots = '';
    for (var i = 1; i <= total; i++) {
      dots += '<span class="dot' + (i <= clicked ? ' filled' : '') + '"></span>';
    }
    els.progressDots.innerHTML = dots;
    els.progressText.textContent = clicked + '/' + total;
  }

  function showQuestion(text) {
    if (els.questionText) {
      els.questionText.classList.remove('hidden');
      els.questionText.classList.remove('fade-out');
      els.questionText.textContent = text || '数一数？';
    }
  }

  function hideQuestion() {
    if (els.questionText) els.questionText.classList.add('fade-out');
  }

  function setQuizMode(on) {
    if (els.gameArea) els.gameArea.classList.toggle('quiz-mode', !!on);
    if (els.progressDots) els.progressDots.style.visibility = on ? 'hidden' : 'visible';
    if (els.progressText) els.progressText.style.visibility = on ? 'hidden' : 'visible';
  }

  function spawnConfetti() {
    if (!els.confettiLayer) return;
    var emojis = ['⭐', '✨', '🌟', '💫', '🎉', '🎊', '💖'];
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 40; i++) {
      var piece = document.createElement('span');
      piece.className = 'confetti-piece';
      piece.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      piece.style.left = Math.random() * 100 + '%';
      piece.style.fontSize = (16 + Math.random() * 24) + 'px';
      piece.style.animationDuration = (1.5 + Math.random() * 2.5) + 's';
      piece.style.animationDelay = Math.random() * 0.6 + 's';
      frag.appendChild(piece);
    }
    els.confettiLayer.appendChild(frag);
    setTimeout(clearConfetti, 3500);
  }

  function clearConfetti() {
    if (els.confettiLayer) els.confettiLayer.innerHTML = '';
  }

  function bounceAvatar() {
    if (els.avatar) {
      els.avatar.classList.add('avatar-bounce');
      setTimeout(function () { els.avatar.classList.remove('avatar-bounce'); }, 600);
    }
  }

  function showNumberCards(correctNum) {
    if (!els.numberCards) return;
    els.numberCards.innerHTML = '';
    els.numberCards.classList.remove('hidden');
    els.numberCards.classList.add('show');

    var frag = document.createDocumentFragment();
    for (var i = 1; i <= correctNum; i++) {
      var card = document.createElement('button');
      card.className = 'number-card';
      card.setAttribute('data-num', i);
      card.innerHTML = '<span class="card-num-cn">' + i + '</span><span class="card-num-en">' + GameData.NUM_EN[i] + '</span>';
      card.style.animationDelay = (i - 1) * 0.08 + 's';
      frag.appendChild(card);
    }
    els.numberCards.appendChild(frag);
    els.numberCards.setAttribute('data-correct', correctNum);

    hideQuestion();
    showQuestion('卷卷，这是几个啊？');
  }

  function hideNumberCards() {
    if (!els.numberCards) return;
    els.numberCards.classList.add('hidden');
    els.numberCards.classList.remove('show');
    els.numberCards.innerHTML = '';
  }

  function highlightCard(num) {
    var card = els.numberCards.querySelector('.number-card[data-num="' + num + '"]');
    if (card) card.classList.add('correct');
  }

  function shakeCard(num) {
    var card = els.numberCards.querySelector('.number-card[data-num="' + num + '"]');
    if (!card) return;
    card.classList.add('shake');
    setTimeout(function () { card.classList.remove('shake'); }, 500);
  }

  function updateSettingsButtons() {
    // 声音未授权时强制显示关闭态
    var permitted = AudioUnlock.isPermitted();
    var m = permitted && Storage.isMusicOn(), s = permitted && Storage.isSfxOn();
    if (els.btnMusic) {
      els.btnMusic.textContent = m ? '🔊' : '🔇';
      els.btnMusic.classList.toggle('off', !m);
    }
    if (els.btnSfx) {
      els.btnSfx.textContent = s ? '🔔' : '🔕';
      els.btnSfx.classList.toggle('off', !s);
    }
  }

  // === 事件绑定 ===
  function bindEvents() {
    if (els.btnMusic) els.btnMusic.addEventListener('click', function (e) {
      e.stopPropagation();
      // 拒绝状态：点开关 = 后悔了，复问授权
      if (!AudioUnlock.isPermitted()) {
        AudioUnlock.ask({
          onUnlock: function () {
            send('music-on');
            updateSettingsButtons();
          },
          onDeny: function () { updateSettingsButtons(); }
        });
        return;
      }
      var on = !Storage.isMusicOn();
      Storage.setMusic(on);
      send(on ? 'music-on' : 'bgm-pause');
      updateSettingsButtons();
    });

    if (els.btnSfx) els.btnSfx.addEventListener('click', function (e) {
      e.stopPropagation();
      Storage.setSfx(!Storage.isSfxOn());
      updateSettingsButtons();
    });

    els.btnBack.addEventListener('click', function (e) { e.stopPropagation(); backToMenu(); });

    els.gameArea.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (!state) return;
      var target = e.target, objEl = null;
      while (target && target !== els.gameArea) {
        if (target.classList && target.classList.contains('game-object')) { objEl = target; break; }
        target = target.parentElement;
      }
      if (objEl) {
        var objId = parseInt(objEl.getAttribute('data-id'), 10);
        if (!isNaN(objId)) onObjectClick(objId);
      } else {
        if (state.isCardPhase) return;
        onEmptyClick();
      }
    });

    els.numberCards.addEventListener('click', function (e) {
      var target = e.target, card = null;
      while (target && target !== els.numberCards) {
        if (target.classList && target.classList.contains('number-card')) { card = target; break; }
        target = target.parentElement;
      }
      if (card) {
        var num = parseInt(card.getAttribute('data-num'), 10);
        if (!isNaN(num)) onCardClick(num);
      }
    });

    document.addEventListener('touchmove', function (e) {
      if (e.target.closest('.number-cards')) return;
      e.preventDefault();
    }, { passive: false });

    document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
    document.addEventListener('gesturechange', function (e) { e.preventDefault(); });
    document.addEventListener('gestureend', function (e) { e.preventDefault(); });

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (state && state.objects.length > 0 && !state.isComplete && !state.isCardPhase) {
          generateRound();
          renderObjects(state.objects);
          updateProgress(state.clickedCount, state.count);
        }
      }, 300);
    });
  }

  // 等 iframe 可见后再开始（隐藏预载时尺寸为 0）
  function waitForVisible(cb, tries) {
    tries = tries || 0;
    if (els.gameArea && els.gameArea.clientWidth > 0 && els.gameArea.clientHeight > 0) { cb(); return; }
    if (tries > 300) { cb(); return; }
    setTimeout(function () { waitForVisible(cb, tries + 1); }, 50);
  }

  function init() {
    els.gameArea = document.getElementById('game-area');
    els.progressDots = document.getElementById('progress-dots');
    els.progressText = document.getElementById('progress-text');
    els.questionText = document.getElementById('question-text');
    els.numberCards = document.getElementById('number-cards');
    els.confettiLayer = document.getElementById('confetti-layer');
    els.avatar = document.querySelector('#game-screen .avatar-wrap');
    els.btnMusic = document.getElementById('btn-music');
    els.btnSfx = document.getElementById('btn-sfx');
    els.btnBack = document.getElementById('btn-back');

    createStarBackground();
    updateSettingsButtons();
    bindEvents();
    AudioManager.loadAll().catch(function () {});
    AudioUnlock.showInstruction();
    waitForVisible(start);
  }

  return { init: init };
})();

GamePage.init();
