// 卷卷抓小动物 - 游戏逻辑模块（关卡流程/泡泡生成/抓动物/过关）

var GameManager = (function() {
  var running = false;
  var paused = false;
  var field = null;
  var spawnTimer = null;
  var passTimer = null;    // 快速飘过小动物定时器
  var level = null;        // 当前关卡配置
  var collected = 0;       // 本关已抓数量
  var caught = [];         // 本关抓到的小动物
  var activeBubbles = 0;
  var bubbleSeq = 0;       // 泡泡序号（每关从 1 开始，让卷卷认数字）
  var nonTargetStreak = 0; // 连续非目标动物计数（保证目标动物出现频率）

  function startLevel(levelId) {
    stop();
    level = getLevel(levelId);
    if (!level) return;
    running = true;
    field = document.getElementById('bubble-field');
    field.innerHTML = '';
    activeBubbles = 0;
    collected = 0;
    caught = [];
    bubbleSeq = 0;
    nonTargetStreak = 0;
    _applyRandomBackground();
    UIManager.showGame();
    UIManager.setGoal(level.id, 0, level.needCount);
    var target = level.targetAnimal ? ANIMALS[level.targetAnimal] : null;
    var bannerText = target
      ? ('找出 ' + level.needCount + ' 只 ' + target.emoji + ' (' + target.en + ')')
      : ('找出 ' + level.needCount + ' 只小动物！');
    UIManager.showBanner(bannerText, 2600);
    // 播目标句：指定动物时先报数量再报英文名；通用目标用 goal 语音
    setTimeout(function() {
      if (!running) return;
      if (target) {
        if (level.needCount >= 2) AudioManager.playGoal(level.needCount);
        setTimeout(function() {
          if (running && target) AudioManager.playAnimalWord(target.id);
        }, level.needCount >= 2 ? 2600 : 400);
      } else {
        AudioManager.playGoal(level.needCount);
      }
    }, 2200);
    AudioManager.loadAnimals();
    _scheduleSpawn();
    _schedulePass();
  }

  function stop() {
    running = false;
    paused = false;
    if (spawnTimer) { clearTimeout(spawnTimer); spawnTimer = null; }
    if (passTimer) { clearTimeout(passTimer); passTimer = null; }
    if (field) field.innerHTML = '';
    activeBubbles = 0;
    UIManager.hideWin();
    UIManager.hideFail();
  }

  // 每关随机一个背景渐变主题（写回 CSS 变量）
  function _applyRandomBackground() {
    var theme = pickRandom(BG_THEMES);
    document.documentElement.style.setProperty('--bg-top', theme.top);
    document.documentElement.style.setProperty('--bg-bottom', theme.bottom);
  }

  // 切出界面：只暂停泡泡生成，保留关卡进度；返回时恢复
  function pause() {
    if (!running || paused) return;
    paused = true;
    if (spawnTimer) { clearTimeout(spawnTimer); spawnTimer = null; }
    if (passTimer) { clearTimeout(passTimer); passTimer = null; }
  }

  function resume() {
    if (!running || !paused) return;
    paused = false;
    _scheduleSpawn();
    _schedulePass();
  }

  function isRunning() { return running; }

  // 11~20 关：去掉泡泡，直接漂浮小动物
  function _isDirectLevel() {
    return !!(level && level.targetAnimal);
  }

  // ---------- 泡泡生成 ----------
  function _scheduleSpawn() {
    if (!running) return;
    if (_isDirectLevel()) {
      spawnTimer = setTimeout(_spawnDirectAnimal, level.spawnMs);
      return;
    }
    if (activeBubbles >= GAME_CONFIG.MAX_BUBBLES) {
      spawnTimer = setTimeout(_scheduleSpawn, 300);
      return;
    }
    spawnTimer = setTimeout(_spawnBubble, level.spawnMs);
  }

  // 直接模式：小动物从底部上浮，点目标得分，点其他消失（无音效）
  function _spawnDirectAnimal() {
    if (!running) return;
    var animal = _pickSpawnAnimal();
    var el = document.createElement('div');
    el.className = 'animal-direct';
    el.textContent = animal.emoji;
    // 随机大小（在 sizeMin~sizeMax 之间）
    var size = level.sizeMin + Math.random() * (level.sizeMax - level.sizeMin);
    el.style.fontSize = size + 'px';
    var x = _pickX(90);
    el.style.left = x + '%';
    var dur = level.floatMin + Math.random() * (level.floatMax - level.floatMin);
    el.style.setProperty('--dur', dur + 's');
    field.appendChild(el);

    el.addEventListener('pointerdown', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (el._caught || !running) return;
      el._caught = true;
      if (_isCountable(animal)) _flyToTop(el, animal);
      else {
        // 点错：消失并随机播一句失败重试语音
        _vanish(el);
        AudioManager.playPraise(pickRandom(GAME_CONFIG.RETRY_PRAISE_IDS));
      }
    });
    el.addEventListener('animationend', function(e) {
      if (e.animationName === 'bubble-float') {
        if (el.parentNode) el.parentNode.removeChild(el);
      }
    });

    _scheduleSpawn();
  }

  function _spawnBubble() {
    if (!running) return;
    var size = level.sizeMin + Math.random() * (level.sizeMax - level.sizeMin);
    var color = pickRandom(BUBBLE_COLORS);
    var x = _pickX(size);
    var dur = level.floatMin + Math.random() * (level.floatMax - level.floatMin);

    var bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.style.setProperty('--x', x + '%');
    bubble.style.setProperty('--dur', dur + 's');
    var inner = document.createElement('div');
    inner.className = 'bubble-inner';
    inner.style.setProperty('--size', size + 'px');
    inner.style.setProperty('--c', color.c);
    inner.style.setProperty('--light', color.light);
    inner.style.setProperty('--sway', (2.5 + Math.random() * 2) + 's');
    // 序号从 1 递增，数到 100 游戏失败
    bubbleSeq++;
    var num = document.createElement('span');
    num.className = 'bubble-num';
    num.textContent = bubbleSeq;
    inner.appendChild(num);
    bubble.appendChild(inner);

    bubble.addEventListener('pointerdown', function(e) {
      e.preventDefault();
      e.stopPropagation();
      _popBubble(bubble);
    });
    bubble.addEventListener('animationend', function(e) {
      if (e.animationName === 'bubble-float') _destroyBubble(bubble);
    });

    field.appendChild(bubble);
    activeBubbles++;
    if (bubbleSeq >= 100) { _failLevel(); return; }
    _scheduleSpawn();
  }

  // ---------- 失败：泡泡数到 100 ----------
  function _failLevel() {
    running = false;
    paused = false;
    if (spawnTimer) { clearTimeout(spawnTimer); spawnTimer = null; }
    if (passTimer) { clearTimeout(passTimer); passTimer = null; }
    setTimeout(function() { if (field) field.innerHTML = ''; }, 500);
    AudioManager.playPraise(pickRandom(GAME_CONFIG.RETRY_PRAISE_IDS));
    UIManager.showFail(level.id);
  }

  // ---------- 快速飘过的小动物（奖励性质，~30s 一只） ----------
  function _schedulePass() {
    if (!running || paused) return;
    if (!level || !level.passChance) return;
    var delay = GAME_CONFIG.PASS_MIN_MS + Math.random() * (GAME_CONFIG.PASS_MAX_MS - GAME_CONFIG.PASS_MIN_MS);
    passTimer = setTimeout(function() {
      if (!running || paused) return;
      if (Math.random() < level.passChance) _spawnPassingAnimal();
      _schedulePass();
    }, delay);
  }

  function _spawnPassingAnimal() {
    if (!running) return;
    var animal = _pickLevelAnimal();
    var el = document.createElement('div');
    el.className = 'animal-pass';
    el.textContent = animal.emoji;
    // 随机高度与方向；起止点都在屏幕外（避免从屏内冒出来）
    el.style.top = (15 + Math.random() * 60) + '%';
    var dir = Math.random() < 0.5 ? 1 : -1;
    el.style.setProperty('--from', (dir > 0 ? -20 : 120) + 'vw');
    el.style.setProperty('--to', (dir > 0 ? 120 : -20) + 'vw');
    // 速度：约为当前关卡泡泡上浮速度的 2 倍（泡泡走 136vh、横穿走 130vw，距离相当）
    var passDur = (level.floatMin + level.floatMax) / 4;
    el.style.setProperty('--cross', passDur + 's');

    el.addEventListener('pointerdown', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (el._caught) return;
      el._caught = true;
      AudioManager.playCatch();
      UIManager.avatarHappy();
      _flyToTop(el, animal);
    });
    el.addEventListener('animationend', function(e) {
      if (e.animationName === 'animal-cross') {
        if (el.parentNode) el.parentNode.removeChild(el);
      }
    });

    field.appendChild(el);
    AudioManager.playAnimalAppear();
  }

  // 避免新泡泡和已有泡泡贴太近
  function _pickX(size) {
    var widthPct = size / field.clientWidth * 100;
    for (var tries = 0; tries < 10; tries++) {
      var x = widthPct / 2 + Math.random() * (100 - widthPct);
      var ok = true;
      var bubbles = field.querySelectorAll('.bubble');
      for (var i = 0; i < bubbles.length; i++) {
        var ox = parseFloat(bubbles[i].style.getPropertyValue('--x'));
        if (Math.abs(ox - x) < widthPct + 6) { ok = false; break; }
      }
      if (ok) return x;
    }
    return widthPct / 2 + Math.random() * (100 - widthPct);
  }

  function _destroyBubble(bubble) {
    if (!bubble.parentNode || bubble._destroyed) return;
    bubble._destroyed = true;
    activeBubbles--;
    bubble.parentNode.removeChild(bubble);
  }

  // ---------- 爆泡泡 ----------
  function _popBubble(bubble) {
    if (bubble._popped) return;
    bubble._popped = true;
    bubble.classList.add('popping');

    var rect = bubble.getBoundingClientRect();
    var frect = field.getBoundingClientRect();
    var cx = rect.left + rect.width / 2 - frect.left;
    var cy = rect.top + rect.height / 2 - frect.top;

    AudioManager.playPop();
    UIManager.avatarHappy();
    _spawnParticles(cx, cy, bubble.style.getPropertyValue('--c'));
    if (Math.random() < level.animalChance) _spawnAnimal(cx, cy);

    setTimeout(function() { _destroyBubble(bubble); }, 400);
  }

  // 爆泡粒子：8 个小圆点四散
  function _spawnParticles(cx, cy, color) {
    for (var i = 0; i < 8; i++) {
      var p = document.createElement('span');
      p.className = 'particle';
      var angle = Math.random() * Math.PI * 2;
      var dist = 40 + Math.random() * 50;
      p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      p.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      p.style.background = (i % 3 === 0) ? '#ffffff' : color;
      p.addEventListener('animationend', function() {
        if (p.parentNode) p.parentNode.removeChild(p);
      });
      field.appendChild(p);
    }
  }

  // 本关出场的奖励动物：指定动物时只出目标动物，否则随机
  function _pickLevelAnimal() {
    if (level && level.targetAnimal && ANIMALS[level.targetAnimal]) return ANIMALS[level.targetAnimal];
    return ANIMALS[pickRandom(ANIMAL_ORDER)];
  }

  // 该动物是否计入本关目标（11~20 关只有目标动物计数）
  function _isCountable(animal) {
    return !level || !level.targetAnimal || animal.id === level.targetAnimal;
  }

  // 小动物：蹦出 → 跳跃 → 飞向顶部（非目标动物跳两下后淡出）
  // 目标动物保证出现：30% 概率直接出目标，且连续 3 只非目标后强制出目标
  function _pickSpawnAnimal() {
    if (!level || !level.targetAnimal || !ANIMALS[level.targetAnimal]) return ANIMALS[pickRandom(ANIMAL_ORDER)];
    if (nonTargetStreak >= 3 || Math.random() < 0.3) {
      nonTargetStreak = 0;
      return ANIMALS[level.targetAnimal];
    }
    nonTargetStreak++;
    return ANIMALS[pickRandom(ANIMAL_ORDER)];
  }

  function _spawnAnimal(cx, cy) {
    var animal = _pickSpawnAnimal();
    var el = document.createElement('div');
    el.className = 'animal';
    el.textContent = animal.emoji;
    el.style.left = (cx - 28) + 'px';
    el.style.top = (cy - 28) + 'px';
    field.appendChild(el);

    AudioManager.playAnimalAppear();
    AudioManager.playAnimalWord(animal.id);

    // 蹦出后先跳一跳，再飞向顶部收集栏
    setTimeout(function() {
      if (!el.parentNode) return;
      el.classList.add('animal-hop');
    }, 350);
    setTimeout(function() {
      if (!el.parentNode) return;
      if (_isCountable(animal)) _flyToTop(el, animal);
      else _fadeAway(el);
    }, 1000);
  }

  // 非目标动物：原地淡出消失（不计数、不进收集栏、不发音）
  function _fadeAway(el) {
    el.classList.remove('animal', 'animal-hop');
    el.classList.add('animal-fly');
    el.style.opacity = '0';
    setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 900);
  }

  // 直接模式：点中非目标动物，快速缩放消失（无音效）
  function _vanish(el) {
    el.classList.remove('animal-direct');
    el.classList.add('animal-fly');
    el.style.transition = 'transform .3s ease, opacity .3s ease';
    void el.offsetWidth;
    el.style.transform = 'scale(.1)';
    el.style.opacity = '0';
    setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 320);
  }

  function _flyToTop(el, animal) {
    // 计数与动画解耦：入账立即完成，动画只做展示
    _collectAnimal(animal);

    var rrect = el.getBoundingClientRect();
    var frect = field.getBoundingClientRect();
    var row = document.getElementById('collected-row');
    var trect = row.getBoundingClientRect();
    // 目标点：收集栏中刚加入的那个图标槽位中心
    var kids = row.children;
    var slotW = kids.length ? kids[0].offsetWidth : 44;
    var gap = 10;
    var slot = kids.length - 1;
    var centerX = (trect.left + trect.right) / 2 - frect.left;
    var tx = centerX + (slot - (kids.length - 1) / 2) * (slotW + gap);
    var ty = trect.top - frect.top + trect.height / 2;
    var sx = rrect.left - frect.left + rrect.width / 2;
    var sy = rrect.top - frect.top + rrect.height / 2;

    el.classList.remove('animal', 'animal-hop', 'animal-pass', 'animal-direct');
    el.classList.add('animal-fly');
    el.style.left = sx + 'px';
    el.style.top = sy + 'px';
    void el.offsetWidth; // 重置 transition
    el.style.transform = 'translate(' + (tx - sx) + 'px, ' + (ty - sy) + 'px) scale(.45)';
    el.style.opacity = '0';

    // 动画结束后只清理 DOM，不再触发任何计数
    function cleanup() {
      if (el.parentNode) el.parentNode.removeChild(el);
    }
    el.addEventListener('transitionend', cleanup);
    setTimeout(cleanup, 1000);
  }

  function _collectAnimal(animal) {
    if (!running || !level) return;
    collected++;
    caught.push(animal);
    UIManager.updateGoal(collected, level.needCount);
    UIManager.addCollected(animal);
    AudioManager.playCatch();
    if (collected >= level.needCount) _completeLevel();
  }

  // ---------- 过关 ----------
  function _completeLevel() {
    running = false;
    if (spawnTimer) { clearTimeout(spawnTimer); spawnTimer = null; }
    setTimeout(function() { if (field) field.innerHTML = ''; }, 500);
    StorageManager.completeLevel(level.id);
    AudioManager.playLevelComplete();
    UIManager.showBanner(pickRandom(GAME_CONFIG.ENCOURAGE_TEXTS), 2600);
    setTimeout(function() {
      AudioManager.playPraise(pickRandom(GAME_CONFIG.WIN_PRAISE_IDS));
      UIManager.showWin(caught, level.id);
    }, 2600);
  }

  function currentLevelId() { return level ? level.id : 0; }

  return {
    startLevel: startLevel,
    stop: stop,
    pause: pause,
    resume: resume,
    isRunning: isRunning,
    currentLevelId: currentLevelId,
  };
})();
