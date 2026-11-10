/* 卡片：先认识新内容，再做题。点卡片可以重听。识字和英语教新字、新词时用。 */
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
          `<div class="cards-nav"><button class="btn next">${i < cards.length - 1 ? '下一个' : '我会了'} ▶</button></div></div>`;
        const speak = () => CE.Speech.say(c.say);
        api.replay(speak);
        U.$('.card-big', api.host).addEventListener('click', () => { CE.Sfx.tap(); speak(); });
        const nx = U.$('.next', api.host);
        if (CE.TEST) nx.dataset.tn = '1';
        nx.addEventListener('click', () => { CE.Sfx.tap(); i++; show(); });
        speak();
      };
      show();
    });
  };
})(window.CE);
