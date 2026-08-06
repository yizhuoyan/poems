// 卷卷认颜色 - Web Audio API 音效合成

var AudioManager = (function() {
  var ctx = null;
  var musicOn = true;
  var sfxOn = true;
  var masterGain = null;
  var musicGain = null;
  var sfxGain = null;
  var bgmRunning = false;
  var bgmTimer = null;

  function init() {}

  function _ensureCtx() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.5;
      masterGain.connect(ctx.destination);
      sfxGain = ctx.createGain();
      sfxGain.gain.value = 0.35;
      sfxGain.connect(masterGain);
      return true;
    } catch (e) {
      ctx = null;
      return false;
    }
  }

  function resumeContext() {
    _ensureCtx();
  }

  function playNote(freq, duration, startTime, type, gainNode) {
    if (!_ensureCtx()) return;
    type = type || 'sine';
    gainNode = gainNode || sfxGain;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(gainNode);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  // 拿起音效
  function playPickup() {
    if (!sfxOn) return;
    playNote(520, 0.08, ctx.currentTime, 'triangle');
  }

  // 放对：叮咚上行音
  function playCorrect() {
    if (!sfxOn) return;
    var now = ctx.currentTime;
    var notes = [523, 659, 784, 1047];
    for (var i = 0; i < notes.length; i++) {
      playNote(notes[i], 0.12, now + i * 0.08, 'sine');
    }
  }

  // 放错：低鸣
  function playWrong() {
    if (!sfxOn) return;
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.linearRampToValueAtTime(150, now + 0.35);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  // 盒子闪光音
  function playSparkle() {
    if (!sfxOn) return;
    var now = ctx.currentTime;
    for (var i = 0; i < 5; i++) {
      var f = 1200 + Math.random() * 800;
      playNote(f, 0.06, now + i * 0.04, 'sine');
    }
  }

  // 星星音
  function playStar(index) {
    if (!sfxOn) return;
    var notes = [523, 659, 784];
    playNote(notes[index] || 784, 0.25, ctx.currentTime, 'sine');
  }

  // 过关庆祝旋律
  function playLevelComplete() {
    if (!sfxOn) return;
    var now = ctx.currentTime;
    var notes = [523, 587, 659, 784, 1047];
    for (var i = 0; i < notes.length; i++) {
      playNote(notes[i], 0.28, now + i * 0.13, 'triangle');
    }
  }

  // 点击音效
  function playClick() {
    if (!sfxOn) return;
    playNote(660, 0.06, ctx.currentTime, 'sine');
  }

  // 背景音乐（每次 startBGM 创建新总线，旧总线淡出断开；快速切换也不会叠加）
  function _killMusicBus(bus) {
    if (!bus || !ctx) return;
    try {
      var t = ctx.currentTime;
      bus.gain.cancelScheduledValues(t);
      bus.gain.setValueAtTime(bus.gain.value, t);
      bus.gain.linearRampToValueAtTime(0, t + 0.05);
      setTimeout(function() {
        try { bus.disconnect(); } catch (e) {}
      }, 150);
    } catch (e) {}
  }

  function startBGM() {
    if (!musicOn) return;
    if (!_ensureCtx()) return;
    _killMusicBus(musicGain);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.12;
    musicGain.connect(masterGain);
    bgmRunning = true;
    _playBGMLoop();
  }

  function _playBGMLoop() {
    if (!bgmRunning || !musicOn || !_ensureCtx()) return;
    var now = ctx.currentTime;
    var melody = [
      262, 294, 330, 349, 392, 349, 330, 294,
      262, 330, 392, 523, 392, 330, 294, 262,
      349, 392, 440, 440, 392, 349, 330, 294,
      262, 330, 392, 330, 262, 0, 0, 0,
    ];
    var noteDur = 0.28;
    for (var i = 0; i < melody.length; i++) {
      if (melody[i] > 0) {
        playNote(melody[i], 0.20, now + i * noteDur, 'triangle', musicGain);
      }
    }
    var totalMs = melody.length * noteDur * 1000;
    bgmTimer = setTimeout(_playBGMLoop, totalMs);
  }

  function stopBGM() {
    bgmRunning = false;
    if (bgmTimer) {
      clearTimeout(bgmTimer);
      bgmTimer = null;
    }
    _killMusicBus(musicGain);
    musicGain = null;
  }

  function toggleMusic() {
    musicOn = !musicOn;
    if (musicOn) startBGM();
    else stopBGM();
    return musicOn;
  }

  function toggleSfx() {
    sfxOn = !sfxOn;
    return sfxOn;
  }

  function setMusic(on) { musicOn = on; }
  function setSfx(on) { sfxOn = on; }

  function isMusicOn() { return musicOn; }
  function isSfxOn() { return sfxOn; }

  // --- 鼓励语音雪碧图 ---
  return {
    init: init,
    resumeContext: resumeContext,
    playPickup: playPickup,
    playCorrect: playCorrect,
    playWrong: playWrong,
    playSparkle: playSparkle,
    playStar: playStar,
    playLevelComplete: playLevelComplete,
    playClick: playClick,
    startBGM: startBGM,
    stopBGM: stopBGM,
    toggleMusic: toggleMusic,
    toggleSfx: toggleSfx,
    setMusic: setMusic,
    setSfx: setSfx,
    isMusicOn: isMusicOn,
    isSfxOn: isSfxOn,
  };
})();
