/* 卡片：先认识新内容，再做题。识字用它讲字的来历，英语用它看图听词。
   点卡片可以重听；卡片里有动画的（比如“图 → 古时候的字 → 今天的字”一步一步出来），点一下从头再放一遍。 */
(function (CE) {
  'use strict';
  const U = CE.U;

  const C = CE.Cards = {};
  C.run = function (api, cards) {
    return new Promise(resolve => {
      let i = 0;
      api.onClose = () => resolve(false);
      const show = () => {
        if (api.closed) return;
        if (i >= cards.length) return resolve(true);
        const c = cards[i];
        api.progress(i, cards.length);
        api.host.innerHTML =
          `<div class="cards"><button class="card-big ${c.cls || ''}">${c.html}</button>` +
          `<div class="cards-nav"><button class="btn next">${i < cards.length - 1 ? '下一个' : '看好了'} ▶</button></div></div>`;
        const speak = () => CE.Speech.say(c.say);
        api.replay(speak);
        const big = U.$('.card-big', api.host);
        big.addEventListener('click', () => { CE.Sfx.tap(); big.innerHTML = c.html; speak(); });
        const nx = U.$('.next', api.host);
        if (CE.TEST) nx.dataset.tn = '1';
        nx.addEventListener('click', () => { CE.Sfx.tap(); i++; show(); });
        speak();
      };
      show();
    });
  };
})(window.CE);
