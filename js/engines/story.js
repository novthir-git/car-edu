/* 故事阅读器：每页自动朗读，突出显示的字可以点读。 */
(function (CE) {
  'use strict';
  const U = CE.U, A = CE.Art;
  const S = CE.Story = {};

  S.markup = function (t, hi) {
    hi = hi || [];
    return Array.from(t).map(ch =>
      (hi.indexOf(ch) >= 0 ? `<b class="tc" data-c="${ch}">${ch}</b>` : U.esc(ch))).join('');
  };

  S.run = function (api, story) {
    return new Promise(resolve => {
      const n = story.pages.length;
      let i = 0;
      api.onClose = () => resolve(null);
      const show = () => {
        if (api.closed) return;
        const p = story.pages[i];
        api.progress(i, n);
        api.host.innerHTML =
          `<div class="story">` +
            `<div class="story-stage">${A.scene(p.bg, p.sp)}</div>` +
            `<div class="story-text"><p>${S.markup(p.t, p.hi)}</p></div>` +
            `<div class="story-nav">` +
              `<button class="ic-btn prev" ${i === 0 ? 'disabled' : ''} aria-label="上一页">◀</button>` +
              `<span class="pg">${i + 1} / ${n}</span>` +
              `<button class="btn next">${i < n - 1 ? '下一页 ▶' : '讲完了 ✓'}</button>` +
            `</div>` +
          `</div>`;
        const speak = () => CE.Speech.say(p.t);
        api.replay(speak);
        U.$$('.tc', api.host).forEach(b => b.addEventListener('click', () => {
          const z = CE.ZHMAP[b.dataset.c];
          CE.Sfx.tap();
          CE.Speech.say(z ? `${z.c}，${z.w}的${z.c}。` : b.dataset.c);
        }));
        U.$('.prev', api.host).addEventListener('click', () => { if (i > 0) { CE.Sfx.tap(); i--; show(); } });
        const nx = U.$('.next', api.host);
        if (CE.TEST) nx.dataset.tn = '1';
        nx.addEventListener('click', () => {
          CE.Sfx.tap();
          if (i < n - 1) { i++; show(); }
          else { api.progress(n, n); resolve({ score: 0, total: 0, stars: 3 }); }
        });
        speak();
      };
      show();
    });
  };
})(window.CE);
