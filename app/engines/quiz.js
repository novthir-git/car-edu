/* 选择题引擎：读出问题，孩子点答案。识字、数学、英语、找规律都复用它。
   答错不扣分、不打叉：选项轻轻晃一下，再读一遍题（或者给一句提示）；连错两次会提示正确答案。
   怎么出题才不是死记硬背，见 docs/learning.md：线索用意思（图、句子、数量），不只用读音；
   答对以后把道理亮出来（reveal）。 */
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
       any    没有对错（先猜一猜）：点哪个都行，不记录。这时返回点的那个 k
       hint   答错以后说的话（可选，默认把题再读一遍）。用来提醒道理，不是直接说答案
       reveal 答对以后换上的配图（可选）：把道理亮出来，比如排齐的两排车、补好的句子
       tapCount 配图里带 .tap-n 的东西，点一下数一个（屏幕上替他记着数到了几）；
              数字可以接着往下数：tapCount 写成数字 a，第一下就数 a+1
       item   记录到哪个知识点（可选）
       after  答对后说的话（可选）。可以是函数 host => 话，按他刚才怎么做的来说
       cls / optCls  额外样式
     }
     返回 true（第一次就答对）/ false / null（中途退出）；any 的题返回点的那个 k */
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
      const right = q.any ? null : btns.find(b => b.dataset.k === String(q.ans));
      if (CE.TEST && (right || btns[0])) (right || btns[0]).dataset.tn = '1';
      if (q.tapCount != null && q.tapCount !== false) tapCount(api, q.tapCount === true ? 0 : Number(q.tapCount));
      btns.forEach(b => b.addEventListener('click', async () => {
        if (locked || b.classList.contains('wrong')) return;
        if (q.any || b === right) {
          locked = true;
          b.classList.add(q.any ? 'picked' : 'right');
          CE.Sfx.ok();
          if (q.item && !q.any) CE.Store.mark(q.item, wrong === 0);
          // 先按他刚才怎么做的想好要说什么，再把配图换成讲道理的那一张
          const after = typeof q.after === 'function' ? q.after(api.host) : (q.after || Q.praise());
          U.$('.quiz', api.host).classList.add('solved');
          const v = U.$('.q-visual', api.host);
          if (q.reveal && v) v.innerHTML = q.reveal;
          await CE.Speech.say(after);
          await U.wait(350);
          if (!api.closed) resolve(q.any ? b.dataset.k : wrong === 0);
        } else {
          wrong++;
          b.classList.add('wrong');
          CE.Sfx.no();
          if (wrong >= 2 && right) right.classList.add('hint');
          CE.Speech.say([Q.again()].concat(q.hint || q.say));
        }
      }));
      speak();
    });
  };

  // 点一下数一个：给点过的东西标上数字，并读出来。同一个点两次不重复数
  function tapCount(api, from) {
    let n = from;
    U.$$('.q-visual .tap-n', api.host).forEach(el => el.addEventListener('click', () => {
      if (el.dataset.n) return;
      el.dataset.n = String(++n);
      CE.Sfx.tap();
      CE.Speech.say(String(n));
    }));
  }
  // 他自己点着数了几个（用来按他的做法说话）
  Q.tapped = host => U.$$('.q-visual .tap-n[data-n]', host).length;

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
})(window.CE);
