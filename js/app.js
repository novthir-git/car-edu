/* 入口：根据地址栏的 # 部分切换页面。 */
(function (CE) {
  'use strict';
  const U = CE.U, S = CE.Store;

  function route() {
    const raw = location.hash.replace(/^#/, '') || '/';
    const parts = raw.split('?');
    const seg = parts[0].split('/').filter(Boolean);
    const q = new URLSearchParams(parts[1] || '');

    CE.Speech.stop();
    CE.Shell.abort();
    U.$$('.gate, .result').forEach(e => e.remove());
    const app = U.$('#app');
    window.scrollTo(0, 0);

    const kid = !seg.length || ['day', 'play', 'free'].indexOf(seg[0]) >= 0;
    document.body.classList.toggle('doc-mode', !kid);
    // 到了每天的时间上限，孩子的页面都换成“休息”画面；正在进行的活动不会被打断
    if (kid && S.timeLeft() <= 0) return CE.Rest.show(app);

    switch (seg[0]) {
      case undefined: return CE.Home.show(app);
      case 'day': return CE.Day.show(app, seg[1]);
      case 'play': return CE.Shell.open(app, seg[1], { day: q.get('d'), free: q.get('f') === '1' });
      case 'free': return CE.Free.show(app);
      case 'parent': return CE.Parent.show(app);
      case 'print': return CE.Print.show(app, seg[1]);
      default: return U.go('#/');
    }
  }

  function boot() {
    S.load();
    CE.Speech.init();
    window.addEventListener('hashchange', route);
    window.addEventListener('pagehide', S.flush);
    document.addEventListener('visibilitychange', () => { if (document.hidden) S.flush(); });
    route();
    if (!CE.TEST && !/^#\/(parent|print)/.test(location.hash)) CE.Splash.show();
    else CE.unlocked = true;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window.CE);
