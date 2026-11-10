/* 通用小工具。所有模块都挂在全局 CE 上，不需要打包，直接双击 index.html 也能运行。 */
window.CE = window.CE || {};
(function (CE) {
  'use strict';

  // ?test=1 时关闭语音和等待，供自动化测试使用
  CE.TEST = /[?&]test=1/.test(location.search);

  const U = CE.U = {};
  U.$ = (s, r) => (r || document).querySelector(s);
  U.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  U.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.shuffle = a => {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };
  U.pick = a => a[Math.floor(Math.random() * a.length)];
  U.sample = (a, n) => U.shuffle(a).slice(0, n);
  U.rand = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  U.range = (lo, hi) => { const r = []; for (let i = lo; i <= hi; i++) r.push(i); return r; };
  U.wait = ms => new Promise(r => setTimeout(r, CE.TEST ? 0 : ms));
  U.dur = ms => {
    const s = Math.round(ms / 1000);
    if (s < 60) return s + ' 秒';
    return Math.floor(s / 60) + ' 分' + (s % 60 ? ' ' + (s % 60) + ' 秒' : '');
  };
  U.go = hash => {
    if (location.hash === hash) window.dispatchEvent(new Event('hashchange'));
    else location.hash = hash;
  };
  // 去掉拼音声调，用来判断同音字
  U.bare = py => String(py).normalize('NFD').replace(/[̀-ͯ]/g, '');
})(window.CE);
