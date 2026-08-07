// 数一数 Counting —— 声音授权弹窗（iOS 样式）+ 游戏说明弹窗
// 声音是权利：授权状态存 sessionStorage；允许/不允许 由首页弹窗决定，游戏页只执行
var AudioUnlock = (function () {
  'use strict';

  var popup = null;

  function isPermitted() { return Storage.getSoundPermission() === 'allowed'; }

  function removePopup() {
    if (popup) { popup.remove(); popup = null; }
  }

  function open(card) {
    removePopup();
    var style = document.createElement('style');
    style.textContent =
      '@keyframes unlockMaskIn{from{opacity:0}to{opacity:1}}' +
      '@keyframes unlockCardIn{from{opacity:0;transform:scale(1.06)}to{opacity:1;transform:scale(1)}}';
    document.head.appendChild(style);

    var mask = document.createElement('div');
    mask.style.cssText =
      'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;' +
      'background:rgba(0,0,0,0.55);animation:unlockMaskIn 0.25s ease;';

    var cardEl = document.createElement('div');
    cardEl.style.cssText =
      'width:300px;background:#fff;border-radius:14px;overflow:hidden;text-align:center;' +
      'font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;' +
      'animation:unlockCardIn 0.3s cubic-bezier(0.25,0.8,0.4,1);';
    cardEl.appendChild(card);

    mask.appendChild(cardEl);
    document.body.appendChild(mask);
    popup = mask;

    return function close() {
      mask.remove();
      style.remove();
      if (popup === mask) popup = null;
    };
  }

  function textEl(tag, text, style) {
    var el = document.createElement(tag);
    el.textContent = text;
    el.style.cssText = style;
    return el;
  }

  function btnEl(text, style, onTap) {
    var b = document.createElement('button');
    b.textContent = text;
    b.style.cssText = style;
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      if (onTap) onTap();
    });
    return b;
  }

  // === 授权弹窗：允许→写权限+resume；不允许→写权限，绝不 resume ===
  function ask(opts) {
    opts = opts || {};
    var close = open(
      (function () {
        var wrap = document.createDocumentFragment();
        wrap.appendChild(textEl('p', opts.title || '“卷卷数一数”想播放声音',
          'margin:0;padding:24px 16px 6px;font-size:17px;font-weight:600;color:#000;'));
        wrap.appendChild(textEl('p', opts.message || '用于播放游戏语音和背景音乐，声音更棒哦',
          'margin:0;padding:0 16px 20px;font-size:13px;line-height:1.5;color:rgba(0,0,0,0.55);'));

        var row = document.createElement('div');
        row.style.cssText = 'display:flex;border-top:0.5px solid rgba(0,0,0,0.15);';

        var deny = btnEl(opts.denyText || '不允许',
          'flex:1;padding:13px 0;font-size:17px;color:#007aff;background:none;border:none;' +
          'cursor:pointer;-webkit-tap-highlight-color:transparent;' +
          'border-right:0.5px solid rgba(0,0,0,0.15);', function () {
            Storage.setSoundPermission('denied');
            if (opts.onDeny) opts.onDeny();
            close();
          });

        var allow = btnEl(opts.allowText || '允许',
          'flex:1;padding:13px 0;font-size:17px;font-weight:700;color:#007aff;background:none;' +
          'border:none;cursor:pointer;-webkit-tap-highlight-color:transparent;', function () {
            Storage.setSoundPermission('allowed');
            AudioManager.resume();
            if (opts.onUnlock) opts.onUnlock();
            close();
          });

        row.appendChild(deny);
        row.appendChild(allow);
        wrap.appendChild(row);
        return wrap;
      })()
    );
  }

  // === 游戏说明弹窗：点「我知道了」时已授权才解锁 ===
  function showInstruction(opts) {
    opts = opts || {};
    var close = open(
      (function () {
        var wrap = document.createDocumentFragment();
        wrap.appendChild(textEl('p', opts.title || '游戏说明',
          'margin:0;padding:28px 20px 8px;font-size:20px;font-weight:800;color:#1a0a40;'));
        wrap.appendChild(textEl('p', opts.message || '请卷卷点击物品数数，点完会有惊喜哦',
          'margin:0;padding:0 20px 24px;font-size:16px;line-height:1.7;color:rgba(0,0,0,0.6);'));

        wrap.appendChild(btnEl(opts.buttonText || '我知道了',
          'display:block;width:calc(100% - 40px);margin:0 20px 24px;padding:16px 0;' +
          'font-size:22px;font-weight:800;color:#1a0a40;border:none;border-radius:50px;' +
          'background:linear-gradient(180deg,#ffd666 0%,#ffc53d 50%,#faad14 100%);' +
          'box-shadow:0 4px 20px rgba(255,200,50,0.6);cursor:pointer;' +
          '-webkit-tap-highlight-color:transparent;', function () {
            if (Storage.getSoundPermission() === 'allowed') AudioManager.resume();
            if (opts.onDone) opts.onDone();
            close();
          }));
        return wrap;
      })()
    );
  }

  // 页面加载时调用：每次加载都弹（新窗口必须重新手势授权）
  function show(opts) { ask(opts); }

  return { show: show, ask: ask, showInstruction: showInstruction, isPermitted: isPermitted };
})();
