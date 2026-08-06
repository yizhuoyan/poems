// 卷卷认颜色 - TTS 语音通用组件（父页与 iframe 共用）
// 依赖：StorageManager（settings.voice）、GAME_CONFIG.TTS_NAME

var TTSManager = (function() {
  var FEMALE_VOICE_NAMES = ['ting-ting', 'tingting', 'meijia', 'huihui', 'yaoyao', 'xiaoxiao', 'xiaoyi', 'xiaomo', 'shelley', 'reed', 'sandy'];

  var voices = [];
  var ready = false;
  var speakTimer = null;

  function init() {
    if (ready || !window.speechSynthesis) return;
    voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) ready = true;
    window.speechSynthesis.onvoiceschanged = function() {
      voices = window.speechSynthesis.getVoices();
      ready = true;
    };
  }

  function getVoices() {
    return (window.speechSynthesis && window.speechSynthesis.getVoices()) || [];
  }

  function getZhVoices() {
    init();
    var list = voices.length > 0 ? voices : getVoices();
    var zh = [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].lang && list[i].lang.indexOf('zh') === 0) zh.push(list[i]);
    }
    return zh;
  }

  function getSavedVoice() {
    return StorageManager.getVoiceName() || '';
  }

  function findVoiceByName(name) {
    if (!name) return null;
    var list = getVoices();
    for (var i = 0; i < list.length; i++) {
      if (list[i].name === name) return list[i];
    }
    return null;
  }

  // 已选语音优先 → 女声名称匹配 → 第一个中文
  function pickVoice() {
    var saved = getSavedVoice();
    if (saved) {
      var sv = findVoiceByName(saved);
      if (sv) return sv;
    }
    var zh = getZhVoices();
    if (zh.length === 0) return null;
    for (var j = 0; j < FEMALE_VOICE_NAMES.length; j++) {
      for (var k = 0; k < zh.length; k++) {
        if (zh[k].name.toLowerCase().indexOf(FEMALE_VOICE_NAMES[j]) !== -1) return zh[k];
      }
    }
    return zh[0];
  }

  // 统一朗读入口；opts: { rate, pitch, volume, onDone }
  function speak(text, opts) {
    if (!window.speechSynthesis) {
      if (opts && opts.onDone) opts.onDone();
      return;
    }
    init();
    if (speakTimer) clearTimeout(speakTimer);
    window.speechSynthesis.cancel();

    var delay = /iPhone|iPad|iPod/.test(navigator.userAgent) ? 80 : 20;

    speakTimer = setTimeout(function() {
      speakTimer = null;
      var utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'zh-CN';
      utter.rate = (opts && opts.rate != null) ? opts.rate : 0.9;
      utter.pitch = (opts && opts.pitch != null) ? opts.pitch : 1.1;
      utter.volume = (opts && opts.volume != null) ? opts.volume : 0.8;
      if (opts && opts.onDone) utter.onend = function() { opts.onDone(); };

      var v = pickVoice();
      if (v) utter.voice = v;

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utter);
    }, delay);
  }

  // --- 语音选择面板 ---
  function openPanel() {
    if (!window.speechSynthesis) return;
    var saved = getSavedVoice();

    var overlay = document.createElement('div');
    overlay.className = 'voice-overlay';
    var list = document.createElement('div');
    list.className = 'voice-list';
    var closeBtn = document.createElement('button');
    closeBtn.className = 'voice-close';
    closeBtn.textContent = '完成';
    closeBtn.onclick = function() { document.body.removeChild(overlay); };

    overlay.appendChild(list);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);

    function makeRow(voice, label, isSelected) {
      var row = document.createElement('div');
      row.className = 'voice-row' + (isSelected ? ' selected' : '');

      var nameSpan = document.createElement('span');
      nameSpan.className = 'voice-name';
      nameSpan.textContent = label;

      var playBtn = document.createElement('button');
      playBtn.className = 'voice-play';
      playBtn.textContent = '试听';
      playBtn.onclick = function(e) {
        e.stopPropagation();
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance('你好，' + GAME_CONFIG.TTS_NAME + '！这是红色 red red');
        u.lang = 'zh-CN';
        u.rate = 0.9;
        u.pitch = 1.1;
        if (voice.name) u.voice = voice;
        window.speechSynthesis.speak(u);
      };

      row.appendChild(nameSpan);
      row.appendChild(playBtn);
      row.onclick = function() {
        StorageManager.setVoiceName(voice.name || '');
        var rows = document.querySelectorAll('.voice-row');
        for (var i = 0; i < rows.length; i++) rows[i].classList.remove('selected');
        row.classList.add('selected');
        speak('你好，' + GAME_CONFIG.TTS_NAME + '！这是红色 red red');
      };
      return row;
    }

    function renderList() {
      var zh = getZhVoices();
      if (zh.length === 0) {
        list.innerHTML = '<div class="voice-name" style="text-align:center;padding:10px;">语音加载中…请稍候</div>';
        return false;
      }
      list.innerHTML = '';
      list.appendChild(makeRow({ name: '', lang: 'zh' }, '自动选择（推荐女声）', saved === ''));
      for (var i = 0; i < zh.length; i++) {
        list.appendChild(makeRow(zh[i], zh[i].name + ' (' + zh[i].lang + ')', zh[i].name === saved));
      }
      return true;
    }

    if (!renderList()) {
      window.speechSynthesis.onvoiceschanged = function() {
        if (renderList()) window.speechSynthesis.onvoiceschanged = null;
      };
      setTimeout(function() { renderList(); }, 500);
    }
  }

  return {
    init: init,
    getVoices: getVoices,
    getZhVoices: getZhVoices,
    getSavedVoice: getSavedVoice,
    pickVoice: pickVoice,
    speak: speak,
    openPanel: openPanel,
  };
})();
