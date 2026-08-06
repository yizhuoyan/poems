// 颜色小分类 - 主页面 UI（菜单渲染 + iframe 切换）

var UIManager = (function() {
  var menuScreen, gameIframe, musicBtn, sfxBtn;

  function initElements() {
    menuScreen = document.getElementById('menu-screen');
    gameIframe = document.getElementById('game-iframe');
    musicBtn = document.getElementById('btn-music');
    sfxBtn = document.getElementById('btn-sfx');
  }

  function showMenu() {
    menuScreen.classList.add('active');
    gameIframe.style.display = 'none';
  }

  function showGame() {
    menuScreen.classList.remove('active');
    gameIframe.style.display = 'block';
  }

  function renderMenu() {
    var settings = StorageManager.getSettings();
    _updateToggleBtns(settings);
  }

  function _updateToggleBtns(settings) {
    if (musicBtn) musicBtn.textContent = settings.music ? '🎵' : '🎵‍❌';
    if (sfxBtn) sfxBtn.textContent = settings.sfx ? '🔊' : '🔇';
  }

  function bindEvents(onStartClick) {
    document.getElementById('btn-start').addEventListener('click', function() {
      AudioManager.resumeContext();
      onStartClick();
    });

    if (musicBtn) {
      musicBtn.addEventListener('click', function() {
        AudioManager.resumeContext();
        var on = AudioManager.toggleMusic();
        StorageManager.updateSettings('music', on);
        _updateToggleBtns({ music: on, sfx: AudioManager.isSfxOn() });
        if (on) {
          AudioManager.startBGM();
        } else {
          AudioManager.stopBGM();
        }
      });
    }

    if (sfxBtn) {
      sfxBtn.addEventListener('click', function() {
        AudioManager.resumeContext();
        var on = AudioManager.toggleSfx();
        StorageManager.updateSettings('sfx', on);
        _updateToggleBtns({ music: AudioManager.isMusicOn(), sfx: on });
      });
    }
  }

  return {
    initElements: initElements,
    showMenu: showMenu,
    showGame: showGame,
    renderMenu: renderMenu,
    bindEvents: bindEvents,
  };
})();
