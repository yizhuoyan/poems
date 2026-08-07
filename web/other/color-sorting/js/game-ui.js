// 颜色小分类 - 游戏 UI（game.html 内独立运行）
// 音频和导航通过 postMessage 发送给父页

var GameUI = (function() {
  var gameApp, itemZone, itemDisplay, itemGlow;
  var boxTray, progressDots, scoreValueEl, comboValueEl;
  var encourageText, floatScoreEl, floatHeartEl;
  var dragLayer, gameAvatar;
  var levelCompleteOverlay, starsDisplay;
  var itemNameCn, itemNameEn, itemNameLabel;
  var levelDisplay;

  var draggedClone = null, draggedOriginal = null, dragActive = false;
  var hoveredBox = null;
  var inputLocked = false;
  var currentLevelData = null;
  var detectDragStartX = 0, detectDragStartY = 0, detectDragStarted = false;

  function post(type, data) {
    window.parent.postMessage({ type: type, data: data || {} }, '*');
  }

  function initElements() {
    gameApp = document.getElementById('game-app');
    itemDisplay = document.getElementById('item-display');
    itemGlow = document.getElementById('item-glow');
    itemZone = document.getElementById('item-zone');
    boxTray = document.getElementById('box-tray');
    progressDots = document.getElementById('progress-dots');
    scoreValueEl = document.getElementById('score-value');
    comboValueEl = document.getElementById('combo-value');
    encourageText = document.getElementById('encourage-text');
    floatScoreEl = document.getElementById('float-score');
    floatHeartEl = document.getElementById('float-heart');
    dragLayer = document.getElementById('drag-layer');
    gameAvatar = document.getElementById('game-avatar');
    levelCompleteOverlay = document.getElementById('level-complete-overlay');
    starsDisplay = document.getElementById('stars-display');
    itemNameCn = document.getElementById('item-name-label').querySelector('.item-cn');
    itemNameEn = document.getElementById('item-name-label').querySelector('.item-en');
    itemNameLabel = document.getElementById('item-name-label');
    levelDisplay = document.getElementById('level-display');
  }

  function renderGame(levelData) {
    inputLocked = false;
    currentLevelData = levelData;

    levelDisplay.textContent = '第 ' + GameManager.getCurrentLevelId() + ' 关';

    _renderBoxes();
    _renderItem();
    _renderProgress();
    updateScore();

    encourageText.textContent = '';
    encourageText.classList.remove('show');

    setTimeout(function() {
      var emoji = GameManager.getCurrentItemEmoji();
      var colorName = COLORS[GameManager.getCurrentItemColor()].name;
      var info = ITEM_NAMES[emoji];
      if (info) _speakItem(info.name, info.en, colorName);
    }, 600);
  }

  function _renderBoxes() {
    boxTray.innerHTML = '';
    var colors = currentLevelData.boxColors;
    for (var i = 0; i < colors.length; i++) {
      var c = COLORS[colors[i]];
      if (!c) continue;
      var box = document.createElement('div');
      box.className = 'color-box';
      box.setAttribute('data-color', c.id);
      box.style.backgroundColor = c.light;
      box.style.borderColor = c.hex;
      box.style.color = c.hex;
      box.innerHTML =
        '<span class="box-label">' + c.name + '</span>' +
        '<span class="box-en">' + c.en + '</span>';
      boxTray.appendChild(box);
    }
  }

  function _renderItem() {
    var emoji = GameManager.getCurrentItemEmoji();

    itemDisplay.textContent = emoji;
    itemDisplay.style.transition = 'none';
    itemDisplay.style.transform = 'scale(1)';
    itemDisplay.style.opacity = '1';
    itemDisplay.style.background = '';
    itemDisplay.style.borderRadius = '';
    itemDisplay.style.width = '';
    itemDisplay.style.height = '';
    itemDisplay.style.fontSize = '';
    itemDisplay.classList.remove('being-dragged');
    itemGlow.style.animation = 'none';
    void itemGlow.offsetWidth;
    itemGlow.style.animation = 'drop-in .7s cubic-bezier(.25,.8,.35,1)';
    setTimeout(function() { itemGlow.style.animation = ''; }, 800);

    var info = ITEM_NAMES[emoji];
    if (info && itemNameCn && itemNameEn) {
      itemNameCn.textContent = info.name;
      itemNameEn.textContent = info.en;
      itemNameLabel.classList.remove('pop-in');
      void itemNameLabel.offsetWidth;
      itemNameLabel.style.display = 'flex';
      itemNameLabel.classList.add('pop-in');
    } else if (itemNameLabel) {
      itemNameLabel.style.display = 'none';
    }
  }

  // 答对后：物品区显示「色块 + 颜色名」，告知用户这是正确的颜色，等待下一题
  function _showCorrectHint(colorId, colorName, enName) {
    var c = COLORS[colorId];
    if (!c) return;
    itemDisplay.textContent = '✓';
    itemDisplay.style.background = c.hex;
    itemDisplay.style.color = '#fff';
    itemDisplay.style.borderRadius = '50%';
    itemDisplay.style.width = 'clamp(56px,12vw,76px)';
    itemDisplay.style.height = 'clamp(56px,12vw,76px)';
    itemDisplay.style.fontSize = 'clamp(24px,5vw,34px)';
    itemDisplay.classList.remove('pop-in');
    void itemDisplay.offsetWidth;
    itemDisplay.classList.add('pop-in');
    if (itemNameCn && itemNameEn) {
      itemNameCn.textContent = colorName;
      itemNameEn.textContent = enName;
      itemNameLabel.style.display = 'flex';
    }
  }

  function _renderProgress() {
    progressDots.innerHTML = '';
    var t = GameManager.getTargetCount();
    var c = GameManager.getCorrectCount();
    for (var i = 0; i < t; i++) {
      var d = document.createElement('span');
      d.className = 'progress-dot' + (i < c ? ' filled' : '');
      d.textContent = i < c ? '💗' : '🤍';
      progressDots.appendChild(d);
    }
  }

  function updateScore() {
    scoreValueEl.textContent = GameManager.getScore();
    comboValueEl.textContent = GameManager.getCombo();
  }

  // --- 拖拽系统 ---
  function setupDrag() {
    itemZone.addEventListener('pointerdown', _onPointerDown);
    document.addEventListener('pointermove', _onPointerMove);
    document.addEventListener('pointerup', _onPointerUp);
    document.addEventListener('pointercancel', _onPointerUp);
    itemZone.addEventListener('contextmenu', function(e) { e.preventDefault(); });
  }

  function _onPointerDown(e) {
    if (inputLocked) return;
    var t = e.target.closest('#item-glow');
    if (!t) return;
    e.preventDefault();
    post('audio', { method: 'playPickup' });

    draggedOriginal = itemDisplay;
    itemDisplay.classList.add('being-dragged');

    var rect = itemGlow.getBoundingClientRect();
    var clone = document.createElement('div');
    clone.className = 'drag-clone active';
    clone.innerHTML = itemGlow.innerHTML;
    clone.style.left = rect.left + 'px';
    clone.style.top = rect.top + 'px';
    clone.style.width = rect.width + 'px';
    clone.style.height = rect.height + 'px';
    clone.style.fontSize = '64px';
    clone.style.display = 'none';

    dragLayer.appendChild(clone);
    draggedClone = clone;
    dragActive = true;
    detectDragStartX = e.clientX;
    detectDragStartY = e.clientY;
    detectDragStarted = false;

    itemZone.setPointerCapture(e.pointerId);
  }

  function _onPointerMove(e) {
    if (!dragActive || !draggedClone) return;
    e.preventDefault();

    if (!detectDragStarted) {
      var dx = e.clientX - detectDragStartX;
      var dy = e.clientY - detectDragStartY;
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      detectDragStarted = true;
      draggedClone.style.display = '';
    }

    _updateClonePos(e.clientX, e.clientY);

    var hitBox = _hitTestBox(e.clientX, e.clientY);
    if (hitBox !== hoveredBox) {
      if (hoveredBox) hoveredBox.classList.remove('drag-hover');
      hoveredBox = hitBox;
      if (hoveredBox) hoveredBox.classList.add('drag-hover');
    }
  }

  function _updateClonePos(cx, cy) {
    if (!draggedClone) return;
    draggedClone.style.left = (cx - GAME_CONFIG.DRAG_OFFSET_Y) + 'px';
    draggedClone.style.top = (cy - GAME_CONFIG.DRAG_OFFSET_Y) + 'px';
  }

  function _onPointerUp(e) {
    if (!dragActive) return;
    dragActive = false;

    if (hoveredBox) {
      hoveredBox.classList.remove('drag-hover');
      hoveredBox = null;
    }

    var ce = draggedClone;
    var oe = draggedOriginal;
    draggedClone = null;
    draggedOriginal = null;

    try { itemZone.releasePointerCapture(e.pointerId); } catch (ex) {}

    if (!ce) return;

    if (!detectDragStarted) {
      if (ce.parentNode) ce.parentNode.removeChild(ce);
      if (oe) {
        oe.classList.remove('being-dragged');
      }
      return;
    }

    var hitBox = _hitTestBox(e.clientX, e.clientY);
    if (hitBox) {
      var boxColor = hitBox.getAttribute('data-color');
      var res = GameManager.handleDrop(boxColor);
      if (res && res.result === 'correct') {
        _playCorrect(ce, oe, res, hitBox);
      } else if (res && res.result === 'wrong') {
        _playWrong(ce, oe, hitBox);
      } else {
        _returnItem(ce, oe);
      }
    } else {
      GameManager.handleDropOutside();
      _returnItem(ce, oe);
    }
  }

  function _hitTestBox(cx, cy) {
    var boxes = boxTray.querySelectorAll('.color-box');
    for (var i = 0; i < boxes.length; i++) {
      var r = boxes[i].getBoundingClientRect();
      if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) {
        return boxes[i];
      }
    }
    return null;
  }

  // --- 放对 ---
  function _playCorrect(ce, oe, res, hitBox) {
    inputLocked = true;
    post('audio', { method: 'playCorrect' });
    post('audio', { method: 'playSparkle' });

    var colorName = COLORS[res.color] ? COLORS[res.color].name : '';
    var enName = COLORS[res.color] ? COLORS[res.color].en : '';
    var chainedNext = false;
    function showNextItem() {
      if (chainedNext || res.isComplete) return;
      chainedNext = true;
      setTimeout(function() {
        if (oe) {
          oe.classList.remove('being-dragged');
          _renderItem();
        }
        inputLocked = false;
        var emoji = GameManager.getCurrentItemEmoji();
        var info = ITEM_NAMES[emoji];
        var cn = COLORS[GameManager.getCurrentItemColor()];
        if (info && cn) _speakNewItem(info.name, info.en, cn.name);
      }, 500);
    }
    setTimeout(function() {
      _speakCorrect(colorName, enName, res.combo, showNextItem);
    }, 200);
    setTimeout(showNextItem, 6000);

    var br = hitBox.getBoundingClientRect();
    ce.style.transition = 'all .35s ease-in';
    ce.style.transform = 'scale(.15)';
    ce.style.left = (br.left + br.width / 2 - 16) + 'px';
    ce.style.top = (br.top + br.height / 2 - 16) + 'px';
    ce.style.opacity = '0';

    hitBox.classList.add('sparkle');
    setTimeout(function() { hitBox.classList.remove('sparkle'); }, 600);

    _animateAvatarHappy();
    _showFloatHeart(hitBox);
    _showFloatScore('+' + res.bonus, hitBox);
    _spawnParticles(hitBox, res.color);

    if (res.encourage) {
      encourageText.textContent = res.encourage;
      encourageText.classList.add('show');
      setTimeout(function() { encourageText.classList.remove('show'); }, 1800);
    }

    updateScore();
    _renderProgress();

    setTimeout(function() {
      if (ce.parentNode) ce.parentNode.removeChild(ce);
      if (res.isComplete) {
        _triggerLevelComplete();
      } else {
        _showCorrectHint(res.color, colorName, enName);
      }
    }, 400);
  }

  // --- 放错 ---
  function _playWrong(ce, oe, hitBox) {
    inputLocked = true;
    post('audio', { method: 'playWrong' });
    setTimeout(function() { _speakWrong(); }, 150);

    hitBox.classList.add('shake');
    setTimeout(function() { hitBox.classList.remove('shake'); }, 500);

    _animateAvatarSad();

    var rect = itemGlow.getBoundingClientRect();
    ce.style.transition = 'all .4s cubic-bezier(.175,.885,.32,1.275)';
    ce.style.left = rect.left + 'px';
    ce.style.top = rect.top + 'px';
    ce.style.width = rect.width + 'px';
    ce.style.height = rect.height + 'px';
    ce.style.transform = 'scale(1)';
    ce.style.opacity = '.8';

    updateScore();

    setTimeout(function() {
      if (ce.parentNode) ce.parentNode.removeChild(ce);
      if (oe) {
        oe.classList.remove('being-dragged');
        oe.classList.add('pop-in');
        setTimeout(function() { oe.classList.remove('pop-in'); }, 400);
      }
      inputLocked = false;
    }, 450);
  }

  // --- 未命中 ---
  function _returnItem(ce, oe) {
    inputLocked = true;
    updateScore();
    var rect = itemGlow.getBoundingClientRect();
    ce.style.transition = 'all .4s cubic-bezier(.175,.885,.32,1.275)';
    ce.style.left = rect.left + 'px';
    ce.style.top = rect.top + 'px';
    ce.style.width = rect.width + 'px';
    ce.style.height = rect.height + 'px';
    ce.style.transform = 'scale(1)';
    ce.style.opacity = '.8';

    setTimeout(function() {
      if (ce.parentNode) ce.parentNode.removeChild(ce);
      if (oe) {
        oe.classList.remove('being-dragged');
        oe.classList.add('pop-in');
        setTimeout(function() { oe.classList.remove('pop-in'); }, 400);
      }
      inputLocked = false;
    }, 450);
  }

  // --- 卷卷头像动画 ---
  function _animateAvatarHappy() {
    if (!gameAvatar) return;
    gameAvatar.classList.add('happy');
    setTimeout(function() { gameAvatar.classList.remove('happy'); }, 500);
  }

  function _animateAvatarSad() {
    if (!gameAvatar) return;
    gameAvatar.classList.add('shake');
    setTimeout(function() { gameAvatar.classList.remove('shake'); }, 500);
  }

  // --- 浮动文字 ---
  function _showFloatScore(txt, hitBox) {
    floatScoreEl.textContent = txt;
    var r = hitBox ? hitBox.getBoundingClientRect() : { left: 0, top: 0 };
    floatScoreEl.style.left = (r.left + r.width / 2 - 30) + 'px';
    floatScoreEl.style.top = (r.top - 20) + 'px';
    floatScoreEl.classList.remove('show');
    void floatScoreEl.offsetWidth;
    floatScoreEl.classList.add('show');
  }

  function _showFloatHeart(hitBox) {
    var r = hitBox.getBoundingClientRect();
    floatHeartEl.style.left = (r.left + r.width / 2 - 25) + 'px';
    floatHeartEl.style.top = (r.top - 10) + 'px';
    floatHeartEl.classList.remove('show');
    void floatHeartEl.offsetWidth;
    floatHeartEl.classList.add('show');
  }

  // --- 过关 ---
  function _triggerLevelComplete() {
    inputLocked = true;
    var res = GameManager.completeLevel();
    _spawnConfetti();
    levelCompleteOverlay.classList.add('active');
    document.getElementById('final-score').textContent = res.score;

    var ses = starsDisplay.querySelectorAll('.star');
    for (var i = 0; i < ses.length; i++) {
      ses[i].classList.remove('lit');
      ses[i].textContent = '⭐';
    }

    setTimeout(function() {
      post('audio', { method: 'playLevelComplete' });
      _speak('过关啦！真棒！', 0.85, 1.15, 0.8);
      _lightStars(0, res.stars, ses);
    }, 500);
  }

  function _lightStars(idx, total, ses) {
    if (idx >= total) return;
    setTimeout(function() {
      ses[idx].classList.add('lit');
      ses[idx].textContent = '🌟';
      post('audio', { method: 'playStar', index: idx });
      _lightStars(idx + 1, total, ses);
    }, 500);
  }

  function _spawnConfetti() {
    var c = document.getElementById('confetti-container');
    if (!c) return;
    c.innerHTML = '';
    var cols = ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#ff9f43','#ee5a89','#a55eea','#2ed573'];
    for (var i = 0; i < 60; i++) {
      var p = document.createElement('div');
      p.className = 'confetti-piece';
      p.style.left = Math.random() * 100 + '%';
      p.style.backgroundColor = cols[Math.floor(Math.random() * cols.length)];
      p.style.animationDelay = Math.random() * 1.5 + 's';
      p.style.animationDuration = (2 + Math.random() * 3) + 's';
      p.style.width = (6 + Math.random() * 10) + 'px';
      p.style.height = (6 + Math.random() * 14) + 'px';
      p.style.borderRadius = Math.random() > .5 ? '50%' : '2px';
      c.appendChild(p);
    }
    setTimeout(function() { c.innerHTML = ''; }, 4000);
  }

  // --- 语音合成 (TTS) --- 统一走 TTSManager 组件
  function _speak(text, rate, pitch, volume, onDone) {
    TTSManager.speak(text, { rate: rate, pitch: pitch, volume: volume, onDone: onDone });
  }

  function _speakItem(name, en, colorName) {
    _speak(GAME_CONFIG.TTS_NAME + '，这是' + name + '，' + en + '，' + en + '，它是什么颜色呢？', 0.85, 1.15, 0.8);
  }

  function _speakCorrect(colorName, enName, combo, onDone) {
    var prefix = (combo >= 6) ? GAME_CONFIG.TTS_NAME + '真棒！' : '';
    _speak(prefix + '答对了 这是' + colorName + ' ' + enName + ' ' + enName, 0.95, 1.2, 0.7, onDone);
  }

  function _speakWrong() {
    _speak('再试一次！', 0.9, 1.05, 0.7);
  }

  function _speakNewItem(name, en, colorName) {
    _speak(GAME_CONFIG.TTS_NAME + '，这是' + name + '，' + en + '，它是什么颜色呢？', 0.85, 1.15, 0.8);
  }

  // --- 粒子爆发 ---
  function _spawnParticles(hitBox, colorId) {
    var r = hitBox.getBoundingClientRect();
    var cx = r.left + r.width / 2;
    var cy = r.top + r.height / 2;
    var c = COLORS[colorId];
    var particles = ['✨','⭐','💫','🌟','✦','★','•'];

    for (var i = 0; i < 10; i++) {
      var p = document.createElement('div');
      p.className = 'particle';
      p.textContent = particles[i % particles.length];
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      var px = (Math.random() * 120 - 60);
      var py = -(Math.random() * 80 + 20);
      p.style.setProperty('--px', px + 'px');
      p.style.setProperty('--py', py + 'px');
      p.style.color = c ? c.hex : '#ffd700';
      p.style.fontSize = (12 + Math.random() * 14) + 'px';
      document.body.appendChild(p);
      setTimeout(function() { if (p.parentNode) p.parentNode.removeChild(p); }, 700);
    }
  }

  function hideLevelComplete() {
    levelCompleteOverlay.classList.remove('active');
  }

  function cleanupGame() {}

  return {
    initElements: initElements,
    renderGame: renderGame,
    updateScore: updateScore,
    setupDrag: setupDrag,
    hideLevelComplete: hideLevelComplete,
    cleanupGame: cleanupGame,
  };
})();
