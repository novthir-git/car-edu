/* 故事阅读器：每页自动朗读，突出显示的字可以点读。讲完之后还有回忆题。

   故事的写法（各周的文件里用 CE.addStory 登记）：
     title 标题；chars 这个故事要教的字；
     pages 每页一两句话，配一幅场景：
       bg 背景；sp 画面里的角色和道具（x,y 是底边中点，画布 800x450）；
       t 正文；hi 本页要突出的字（可点读）。
     quiz 故事问答：q 问题，ans 答案，after 答对以后说的话（可选）。选项是下面几种之一：
       who（角色）、prop（道具）、num（数字）：回忆谁、什么、几个
       mood（表情，k 是哪个角色）：他心里怎么样。答案是这一页里他的表情
       pages（故事的第几页，从 0 数）：哪件事先发生。只问“谁、什么”是死记，问心情和先后才要想 */
(function (CE) {
  'use strict';
  const U = CE.U, A = CE.Art;
  const S = CE.Story = {};

  S.quiz = function (api, story) {
    const qs = story.quiz;
    return CE.Quiz.run(api, {
      rounds: qs.length, make: i => {
        const q = qs[i];
        let opts;
        if (q.who) opts = q.who.map(k => ({ k: k, html: A.who(k) + `<span class="cap">${A.CHARS[k].name}</span>` }));
        else if (q.prop) opts = q.prop.map(k => ({ k: k, html: A.prop(k) }));
        else if (q.mood) opts = q.mood.map(m => ({ k: m, html: A.face(q.k, m) }));
        else if (q.pages) opts = q.pages.map(n => ({ k: String(n), html: A.scene(story.pages[n].bg, story.pages[n].sp) }));
        else opts = q.num.map(n => ({ k: String(n), html: `<span class="num">${n}</span>` }));
        return { say: q.q, text: q.q, opts: opts, ans: String(q.ans), optCls: q.num ? 'txt' : 'pic', after: q.after };
      }
    });
  };

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
