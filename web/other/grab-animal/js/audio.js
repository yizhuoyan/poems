// 卷卷抓小动物 - Web Audio 音效合成 + 语音雪碧图模块
// AudioContext 延迟到首次用户手势创建；语音雪碧图 fetch 失败(双击 file://)时回退到 <audio> 元素播放

var AudioManager = (function() {
  var ctx = null;
  var masterGain = null;
  var bgmGain = null;
  var sfxGain = null;
  var musicOn = true;
  var sfxOn = true;
  var bgmRunning = false;
  var bgmTimer = null;
  var noiseBuffer = null;

  function init() {}

  function _ensureCtx() {
    if (ctx) {
      // iOS Safari：即便在手势内创建的 AudioContext 初始也可能是 suspended/interrupted，需显式 resume
      if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
        var r = ctx.resume();
        if (r && r.catch) r.catch(function() {});
      }
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
      // 创建后立即 resume，iOS Safari 必须手动手势内恢复
      var r2 = ctx.resume();
      if (r2 && r2.catch) r2.catch(function() {});
      return true;
    } catch (e) {
      ctx = null;
      return false;
    }
  }

  // iOS 解锁：在用户手势同步栈里创建 Context 并播放一段短音，完成"首次发声解锁"
  // 返回 Promise，resume 完成后 resolve，调用方等 running 再排程播放（避免被静默丢弃）
  function unlock() {
    if (!_ensureCtx()) return Promise.resolve(false);
    try {
      var now = ctx.currentTime;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 440;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
      osc.connect(gain);
      gain.connect(masterGain || ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
      var r = ctx.resume();
      if (r && r.then) {
        return r.then(function() { return ctx.state === 'running'; });
      }
      return Promise.resolve(ctx.state === 'running');
    } catch (e) {
      return Promise.resolve(false);
    }
  }

  function resumeContext() { _ensureCtx(); }

  function playNote(freq, duration, startTime, type, gainNode, volume) {
    if (!_ensureCtx()) return;
    gainNode = gainNode || sfxGain;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume || 0.3, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(gainNode);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  // 白噪声缓冲（复用）
  function _getNoiseBuffer() {
    if (!noiseBuffer) {
      var len = Math.floor(ctx.sampleRate * 0.3);
      noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
      var data = noiseBuffer.getChannelData(0);
      for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    return noiseBuffer;
  }

  // 泡泡"噗"：白噪声突发 + 低通 + 上滑音
  function playPop() {
    if (!sfxOn || !_ensureCtx()) return;
    var now = ctx.currentTime;
    var src = ctx.createBufferSource();
    src.buffer = _getNoiseBuffer();
    var filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGain);
    src.start(now);
    src.stop(now + 0.2);
    var osc = ctx.createOscillator();
    var og = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(660, now + 0.12);
    og.gain.setValueAtTime(0.18, now);
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.connect(og);
    og.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // 动物出现：欢快上行琶音 C-E-G
  function playAnimalAppear() {
    if (!sfxOn || !_ensureCtx()) return;
    var now = ctx.currentTime;
    var notes = [523, 659, 784];
    for (var i = 0; i < notes.length; i++) {
      playNote(notes[i], 0.16, now + i * 0.07, 'sine', null, 0.3);
    }
  }

  // 抓到手：清脆"叮"
  function playCatch() {
    if (!sfxOn || !_ensureCtx()) return;
    var now = ctx.currentTime;
    playNote(1319, 0.22, now, 'sine', null, 0.3);
    playNote(2637, 0.18, now + 0.03, 'sine', null, 0.08);
  }

  // 点空白：轻微"叮"
  function playDing() {
    if (!sfxOn || !_ensureCtx()) return;
    playNote(880, 0.09, ctx.currentTime, 'sine', null, 0.12);
  }

  // 过关庆祝旋律
  function playLevelComplete() {
    if (!sfxOn || !_ensureCtx()) return;
    var now = ctx.currentTime;
    var notes = [523, 587, 659, 784, 1047];
    for (var i = 0; i < notes.length; i++) {
      playNote(notes[i], 0.28, now + i * 0.13, 'triangle', null, 0.3);
    }
  }

  // ---------- 背景音乐：轻快循环小旋律（三角波，音量小） ----------
  // 每次 startBGM 都新建独立增益节点，旧的已排程音符随旧节点断开而立即静音，杜绝叠加
  function startBGM() {
    if (!musicOn) return;
    if (!_ensureCtx()) return;
    stopBGM();
    var g = ctx.createGain();
    g.gain.value = 0.11;
    g.connect(masterGain);
    bgmGain = g;
    bgmRunning = true;
    _playBGMLoop();
  }

  function _playBGMLoop() {
    if (!bgmRunning || !musicOn || !_ensureCtx()) return;
    var now = ctx.currentTime;
    var melody = [
      523, 659, 784, 659, 784, 880, 784, 659,
      523, 659, 784, 880, 784, 659, 523, 440,
      392, 523, 659, 523, 659, 784, 659, 523,
      392, 440, 523, 587, 523, 440, 392, 330,
    ];
    var noteDur = 0.36;
    for (var i = 0; i < melody.length; i++) {
      playNote(melody[i], 0.24, now + i * noteDur, 'triangle', bgmGain, 0.28);
    }
    bgmTimer = setTimeout(_playBGMLoop, melody.length * noteDur * 1000 + 200);
  }

  function stopBGM() {
    bgmRunning = false;
    if (bgmTimer) { clearTimeout(bgmTimer); bgmTimer = null; }
    if (bgmGain) {
      // 断开并静音：让已排程但未播完的音符立即无声
      try { bgmGain.gain.setValueAtTime(0, ctx.currentTime); } catch (e) {}
      bgmGain.disconnect();
      bgmGain = null;
    }
  }

  function toggleMusic() {
    musicOn = !musicOn;
    if (musicOn) startBGM(); else stopBGM();
    return musicOn;
  }

  function toggleSfx() { sfxOn = !sfxOn; return sfxOn; }
  function setMusic(on) { musicOn = on; }
  function setSfx(on) { sfxOn = on; }

  // ---------- 通用语音雪碧图播放器 ----------
  // 优先 fetch + decodeAudioData；file:// 下 fetch 被拦截时回退到 <audio> 元素 + currentTime 定位
  function createSpritePlayer(wavUrl, jsonUrl, fallbackOffsets, fallbackDurs) {
    var buffer = null;
    var manifest = null;
    var loaded = false;
    var loading = false;
    var pending = null;

    var fbAudio = null;
    var fbReady = false;
    var fbStopTimer = null;

    function ensureFbAudio() {
      if (fbAudio) return;
      fbAudio = document.createElement('audio');
      fbAudio.src = wavUrl;
      fbAudio.preload = 'auto';
      fbAudio.addEventListener('loadedmetadata', function() { fbReady = true; });
    }

    function load() {
      if (loaded || loading) return;
      loading = true;
      fetch(wavUrl)
        .then(function(res) {
          if (!res.ok) throw new Error('WAV load failed');
          return res.arrayBuffer();
        })
        .then(function(buf) {
          if (!_ensureCtx()) throw new Error('No AudioContext');
          return ctx.decodeAudioData(buf);
        })
        .then(function(audioBuf) {
          buffer = audioBuf;
          return fetch(jsonUrl).then(function(r) { return r.json(); });
        })
        .then(function(m) {
          manifest = m;
          loaded = true;
          loading = false;
          flushPending();
        })
        .catch(function(e) {
          // file:// 双击打开时回退到 <audio> 元素
          loading = false;
          loaded = true;
          buffer = null;
          manifest = null;
          ensureFbAudio();
          console.warn('语音雪碧图 fetch 失败，改用 <audio> 回退模式:', wavUrl, e);
          flushPending();
        });
    }

    function flushPending() {
      if (pending) {
        var p = pending;
        pending = null;
        play(p.id, p.times);
      }
    }

    // 回退模式通过 <audio> 播放某段（times 表示连续播几遍）
    function fbPlay(segId, times) {
      var seg = manifest && manifest.segments ? manifest.segments[segId] : null;
      var offset = seg ? seg.start : (fallbackOffsets[segId] || 0);
      var duration = seg ? seg.duration : (fallbackDurs[segId] || 1.8);
      var i = 0;
      (function next() {
        if (i >= times) return;
        i++;
        fbStart(offset, duration);
        setTimeout(next, (duration + 0.15) * 1000);
      })();
    }

    function fbStart(offset, duration) {
      if (!fbAudio) return;
      if (!fbReady) {
        fbAudio.addEventListener('loadedmetadata', function once() {
          fbAudio.removeEventListener('loadedmetadata', once);
          fbStart(offset, duration);
        });
        return;
      }
      if (fbStopTimer) { clearTimeout(fbStopTimer); fbStopTimer = null; }
      try {
        fbAudio.pause();
        fbAudio.currentTime = offset;
        fbAudio.volume = 1;
        var p = fbAudio.play();
        if (p && p.catch) p.catch(function() {});
        fbStopTimer = setTimeout(function() {
          fbAudio.pause();
          fbStopTimer = null;
        }, (duration + 0.1) * 1000);
      } catch (e) {}
    }

    function play(segId, times) {
      times = times || 1;
      if (!loaded) {
        pending = pending || { id: segId, times: times };
        load();
        return;
      }
      if (!ctx || !buffer || !manifest) {
        fbPlay(segId, times);
        return;
      }
      var seg = manifest.segments[segId];
      if (!seg) return;
      var now = ctx.currentTime;
      for (var i = 0; i < times; i++) {
        var gain = ctx.createGain();
        gain.gain.value = 0.45;
        gain.connect(masterGain || ctx.destination);
        var source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(gain);
        source.start(now + i * (seg.duration + 0.15), seg.start, seg.duration);
      }
    }

    return { load: load, play: play };
  }

  // ---------- 鼓励语音（hello/praise/retry... 共 15 段） ----------
  // 回退偏移表（与 praise.json 一致）
  var PRAISE_OFFSETS = {
    hello_1: 0,        hello_2: 2.4724,  hello_3: 4.7791,  hello_4: 6.442,
    praise_1: 7.6756,  praise_2: 9.4901, praise_3: 10.9208, praise_4: 12.2553,
    praise_5: 13.8882, praise_6: 15.8534, praise_7: 17.9255,
    retry_1: 18.8952,  retry_2: 20.5193, retry_3: 22.3318,  retry_4: 24.3109,
  };
  var PRAISE_DURS = {
    hello_1: 2.4224,   hello_2: 2.2567,  hello_3: 1.6129,   hello_4: 1.1836,
    praise_1: 1.7645,  praise_2: 1.3807, praise_3: 1.2844,  praise_4: 1.5829,
    praise_5: 1.9152,  praise_6: 2.0221, praise_7: 0.9197,
    retry_1: 1.5741,   retry_2: 1.7625,  retry_3: 1.9291,   retry_4: 1.6339,
  };
  var praisePlayer = createSpritePlayer('assets/audio/praise.wav', 'assets/audio/praise.json', PRAISE_OFFSETS, PRAISE_DURS);

  // ---------- 动物英语语音 ----------
  // 回退偏移表（与 animals.json 一致，仅列用到的 10 种）
  var ANIMAL_OFFSETS = {
    chick: 5.7203, duck: 13.7856, rabbit: 41.1066, cat: 4.2752, dog: 12.3305,
    pig: 38.1865, bee: 1.4351, bear: 0, panda: 33.3113, monkey: 30.1012,
  };
  var ANIMAL_DURS = {
    chick: 1.47, duck: 1.405, rabbit: 1.51, cat: 1.395, dog: 1.405,
    pig: 1.405, bee: 1.255, bear: 1.385, panda: 1.475, monkey: 1.47,
  };
  var animalPlayer = createSpritePlayer('assets/audio/animals.wav', 'assets/audio/animals.json', ANIMAL_OFFSETS, ANIMAL_DURS);

  // ---------- 关卡目标语音 ----------
  // 回退偏移表（与 goal.json 一致）
  var GOAL_OFFSETS = { goal_2: 0, goal_3: 2.445, goal_4: 4.905, goal_5: 7.35, goal_6: 9.765 };
  var GOAL_DURS = { goal_2: 2.395, goal_3: 2.41, goal_4: 2.395, goal_5: 2.365, goal_6: 2.37 };
  var goalPlayer = createSpritePlayer('assets/audio/goal.wav', 'assets/audio/goal.json', GOAL_OFFSETS, GOAL_DURS);

  return {
    init: init,
    resumeContext: resumeContext,
    unlock: unlock,
    playPop: playPop,
    playAnimalAppear: playAnimalAppear,
    playCatch: playCatch,
    playDing: playDing,
    playLevelComplete: playLevelComplete,
    startBGM: startBGM,
    stopBGM: stopBGM,
    toggleMusic: toggleMusic,
    toggleSfx: toggleSfx,
    setMusic: setMusic,
    setSfx: setSfx,
    isMusicOn: function() { return musicOn; },
    isSfxOn: function() { return sfxOn; },
    playPraise: function(id) { praisePlayer.play(id); },
    loadPraise: function() { praisePlayer.load(); },
    playAnimalWord: function(id) { animalPlayer.play(id, 2); },
    loadAnimals: function() { animalPlayer.load(); },
    playGoal: function(count) { goalPlayer.play('goal_' + count); },
    loadGoal: function() { goalPlayer.load(); },
  };
})();
