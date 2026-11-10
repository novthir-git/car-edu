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
  // 打乱顺序，尽量不让同一项连着出现
  U.mix = list => {
    for (let t = 0; t < 30; t++) {
      const a = U.shuffle(list);
      if (a.every((x, i) => i === 0 || x !== a[i - 1])) return a;
    }
    return U.shuffle(list);
  };
  // 换页。当前页面记在 CE.cur 里；地址栏的 # 只是跟着同步，方便后退和收藏。
  // CE.EMBED（嵌在别的页面里预览）时不碰地址栏。
  U.go = hash => {
    CE.cur = hash;
    if (!CE.EMBED) { try { if (location.hash !== hash) location.hash = hash; } catch (e) { /* 忽略 */ } }
    CE.route();
  };
  // 去掉拼音声调，用来判断同音字
  U.bare = py => String(py).normalize('NFD').replace(/[̀-ͯ]/g, '');
})(window.CE);
