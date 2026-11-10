/* 选择题引擎：读出问题，孩子点答案。识字、数学、英语、找规律都复用它。
   答错不扣分、不打叉：选项轻轻晃一下，再读一遍题；连错两次会提示正确答案。 */
(function (CE) {
  'use strict';
  const U = CE.U;
  const PRAISE = ['真棒！', '答对了！', '太好了！', '好厉害！', '对啦！'];
  const AGAIN = ['再试一试。', '再找找看。', '再想一想。'];
  const Q = CE.Quiz = {};
  Q.praise = () => U.pick(PRAISE);
  Q.again = () => U.pick(AGAIN);

  /* q: {
       say    朗读的问题（字符串或分段数组）
       text   屏幕上给家长看的文字
       visual 题目配图（HTML，可选）
       opts   [{k, html}] 选项
       ans    正确选项的 k
       item   记录到哪个知识点（可选）
       after  答对后说的话（可选）
       cls / optCls  额外样式
     }
     返回 true（第一次就答对）/ false / null（中途退出） */
  Q.ask = function (api, q) {
    return new Promise(resolve => {
      api.host.innerHTML =
        `<div class="quiz ${q.cls || ''}">` +
          `<div class="q-prompt">${q.visual ? `<div class="q-visual">${q.visual}</div>` : ''}` +
          `<div class="q-text">${U.esc(q.text || '')}</div></div>` +
          `<div class="q-opts n${q.opts.length} ${q.optCls || ''}">` +
            q.opts.map(o => `<button class="opt" data-k="${U.esc(o.k)}">${o.html}</button>`).join('') +
          `</div>` +
        `</div>`;
      let wrong = 0, locked = false;
      const speak = () => CE.Speech.say(q.say);
      api.replay(speak);
      api.onClose = () => resolve(null);
      const btns = U.$$('.opt', api.host);
      const right = btns.find(b => b.dataset.k === String(q.ans));
      if (CE.TEST && right) right.dataset.tn = '1';
      btns.forEach(b => b.addEventListener('click', async () => {
        if (locked || b.classList.contains('wrong')) return;
        if (b === right) {
          locked = true;
          b.classList.add('right');
          CE.Sfx.ok();
          if (q.item) CE.Store.mark(q.item, wrong === 0);
          await CE.Speech.say(q.after || Q.praise());
          await U.wait(350);
          if (!api.closed) resolve(wrong === 0);
        } else {
          wrong++;
          b.classList.add('wrong');
          CE.Sfx.no();
          if (wrong >= 2 && right) right.classList.add('hint');
          CE.Speech.say([Q.again()].concat(q.say));
        }
      }));
      speak();
    });
  };

  // 连续问 rounds 道题。make(i) 返回第 i 题。
  Q.run = async function (api, cfg) {
    let ok = 0;
    for (let i = 0; i < cfg.rounds; i++) {
      if (api.closed) return null;
      api.progress(i, cfg.rounds);
      const r = await Q.ask(api, cfg.make(i));
      if (r === null) return null;
      if (r) ok++;
    }
    api.progress(cfg.rounds, cfg.rounds);
    return { score: ok, total: cfg.rounds };
  };

  /* 卡片：先认识新内容，再做题。点卡片可以重听。 */
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
