/* 问为什么：他挑一个想知道的“为什么”，小风用他听得懂的话讲给他听。
   一屏是一张张画着问题的卡片（他不识字，点画就行，卡片下面的字给家长代读）；
   点一张，就像翻一本两三页的小绘本：先把问题说一遍，再一页一句地讲，最后留一件能在家试一试的事。
   讲完回到卡片，想听哪个听哪个，听过的打个勾；点“玩好啦”结束。没有对错，也不给星星。

   问题的写法（见 content/library/thinking/why.js）：
     k 编号（写进学习记录 why:<k>，家长页据此看他点了哪些）；q 问题；pic() 卡片上的画；
     pages 讲解，每页 {bg, sp, t}，和故事的一页一样（app/engines/story.js）；
     try 讲完以后，在家试一试的一件事。 */
(function (CE) {
  'use strict';
  const U = CE.U, A = CE.Art;
  const W = CE.Why = {};

  W.run = async function (api, list) {
    const heard = {};
    for (;;) {
      const k = await pick(api, list, heard);
      if (k === null || api.closed) return null;
      if (k === '') return { score: 0, total: 0, quiet: true };
      const q = list.find(x => x.k === k);
      CE.Store.mark('why:' + k, true);
      // 第一页把问题再说一遍，最后一页是“试一试”
      const pages = [{ bg: q.pages[0].bg, sp: q.pages[0].sp, t: q.q }].concat(q.pages.slice(1),
        [{ bg: 'town', sp: [{ k: 'xiaofeng', x: 400, y: 428, s: 1.2, anim: 'bob' }], t: '你也来试一试：' + q.try }]);
      const r = await CE.Story.run(api, { pages: pages });
      if (r === null || api.closed) return null;
      heard[k] = 1;
    }
  };

  // 选一个问题：返回它的 k；点“玩好啦”返回 ''；中途退出返回 null
  function pick(api, list, heard) {
    return new Promise(resolve => {
      const any = Object.keys(heard).length > 0;
      api.progress(0, 0);
      api.host.innerHTML =
        `<div class="why">` +
          `<div class="q-text">你想知道什么？点一个，小风讲给你听。</div>` +
          `<div class="why-grid">` + list.map(q =>
            `<button class="why-card ${heard[q.k] ? 'heard' : ''}" data-k="${q.k}">` +
              `<span class="why-pic">${q.pic()}</span><span class="why-q">${U.esc(q.q)}</span></button>`).join('') +
          `</div>` +
          (any ? `<div class="why-foot"><button class="btn ok done">玩好啦 ✓</button></div>` : '') +
        `</div>`;
      const intro = () => CE.Speech.say(any ? '还想知道什么？点一个。听够了，就点“玩好啦”。' : '你想知道什么？点一个，小风讲给你听。');
      api.replay(intro);
      api.onClose = () => resolve(null);
      U.$$('.why-card', api.host).forEach(b => b.addEventListener('click', () => { CE.Sfx.tap(); resolve(b.dataset.k); }));
      if (any) U.$('.done', api.host).addEventListener('click', () => { CE.Sfx.tap(); resolve(''); });
      // 测试：一个一个听过去，都听过了再点“玩好啦”（收集朗读的句子时，这样每一句都能走到）
      if (CE.TEST) {
        const next = list.find(q => !heard[q.k]);
        (next ? U.$(`.why-card[data-k="${next.k}"]`, api.host) : U.$('.done', api.host)).dataset.tn = '1';
      }
      intro();
    });
  }
})(window.CE);
