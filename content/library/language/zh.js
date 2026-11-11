/* 说得出 · 识字：找字、认字。字从 zh-chars.js 的字库里取，字的意思和来历在 zh-meaning.js。
   认字先认意思，再记样子（见 docs/learning.md）。一次“认字”是四步：
     1 字是怎么来的：图 → 古时候的字 → 今天的字。没有来历可讲的字，看它的意思（风吹树摇、车开过来）
     2 看图找字：线索是意思（一座山、一辆大车、开过来的车），不是读音；选项里放意思相近、样子相反的字
     3 读词：用学过的字组成的词，不读出声，要他自己读出意思再点图。干扰的图和答案共用一个字（火车、火山、风车），
       只认出一个字是选不对的
     4 句子里补字：故事里的一句话空一个字
   CE.Lib.learnZh 留给各周的“认字”活动用（见 content/k2/w01.js）。 */
(function (CE) {
  'use strict';
  const U = CE.U, Q = CE.Quiz, S = CE.Store, def = CE.def, M = CE.ZHM;

  const hz = c => `<span class="hz">${c}</span>`;
  const zhSay = z => `${z.c}，${z.w}的${z.c}。`;
  const lvOf = z => S.level('zh:' + z.c);
  const has = c => !!M[c];
  // 意思容易混的字不互相当干扰项：一滴水也可以说是雨，一个土堆也可以说是小山
  const AVOID = { '水': '雨', '雨': '水', '土': '山石', '山': '土', '石': '土' };

  // 听音找字：干扰项选难度相近、读音不同的字。只用来摸底（找字小侦探），不用来教
  function zhQ(z) {
    const near = CE.ZH.filter(o => o.c !== z.c && o.b !== z.b && Math.abs(o.i - z.i) <= 24);
    const opts = U.shuffle([z].concat(U.sample(near, 3))).map(o => ({ k: o.c, html: hz(o.c) }));
    return { say: '找一找：' + zhSay(z), text: `找出“${z.c}”（${z.w}的${z.c}）`, opts: opts, ans: z.c, item: 'zh:' + z.c, optCls: 'txt' };
  }

  /* ---------- 1 字是怎么来的 ---------- */
  function rootCard(z) {
    const m = M[z.c], r = m.root;
    const now = `<span class="rt-step rt-now tian">${hz(z.c)}</span>`;
    const arrow = '<span class="rt-arrow">→</span>';
    const strip = r
      ? `<span class="rt-step rt-pic">${CE.zhBox(r.pic)}</span>${arrow}` +
        `<span class="rt-step rt-old">${r.oldText ? hz(r.oldText) : CE.zhBox(r.old)}</span>${arrow}${now}`
      : `<span class="rt-step rt-pic ${m.pair ? 'wide' : ''}">${CE.zhSee(z.c)}</span>${arrow}${now}`;
    return {
      cls: 'zh-root', say: [r ? r.say : m.say, zhSay(z)],
      html: `<span class="root ${r ? 'three' : 'two'}">${strip}</span>` +
        `<span class="rt-cap"><span class="py">${z.p}</span><span class="word">${U.esc(z.w)}</span></span>`
    };
  }

  /* ---------- 2 看图找字 ---------- */
  // near：这一课的字，先拿它们当干扰项（意思放在一起比，才知道差在哪里）
  function seeQ(z, near) {
    const m = M[z.c], bad = AVOID[z.c] || '';
    let opts;
    if (m.pair) opts = [z.c, m.pair];
    else {
      const ok = c => c !== z.c && has(c) && bad.indexOf(c) < 0 && opts.indexOf(c) < 0;
      opts = [z.c];
      U.shuffle(near).forEach(c => { if (opts.length < 4 && ok(c)) opts.push(c); });
      U.shuffle(Object.keys(M)).forEach(c => { if (opts.length < 4 && ok(c)) opts.push(c); });
    }
    const ask = m.ask || '看，这是什么？找一找，哪个是它的字？';
    return {
      say: ask, text: '看图找字：' + ask, cls: 'has-visual',
      visual: `<div class="zh-see ${m.pair ? 'wide' : ''}">${CE.zhSee(z.c)}</div>`,
      opts: U.shuffle(opts).map(c => ({ k: c, html: hz(c) })), ans: z.c, optCls: 'txt',
      item: 'zh:' + z.c, hint: m.hint, after: m.got
    };
  }

  /* ---------- 3 读词：不读出声 ---------- */
  // sibs：一起出现的词。最好和答案共用一个字，这样只认一个字选不对
  function wordQ(w, sibs) {
    const share = x => x !== w && Array.from(x).some(c => w.indexOf(c) >= 0);
    let others = U.shuffle(sibs.filter(share)).concat(U.shuffle(sibs.filter(x => x !== w && !share(x))));
    others = others.slice(0, 2);
    return {
      say: '这两个字，你都见过。自己读一读，它说的是哪一个？', text: '读一读：这个词说的是哪一个？（不读出来，让他自己读）',
      cls: 'has-visual', visual: `<div class="zh-word">${Array.from(w).map(hz).join('')}</div>`,
      opts: U.shuffle([w].concat(others)).map(x => ({ k: x, html: CE.ZHWORDS[x]() })), ans: w, optCls: 'pic',
      item: 'ci:' + w, hint: `这两个字是“${w}”。`, after: `对！${Array.from(w).join('、')}，${w}！`
    };
  }

  /* ---------- 4 句子里补字 ---------- */
  // r: { t 句子，用 [字] 标出空着的字；ask 问他的话；opts 选项；page 配故事的第几页（从 0 数）；hint }
  function readQ(r, story) {
    const m = /\[(.)\]/.exec(r.t), c = m[1];
    const p = story && r.page != null ? story.pages[r.page] : null;
    const show = fill => `<div class="zh-cloze">` +
      (p ? `<span class="cz-pic">${CE.Art.scene(p.bg, p.sp)}</span>` : '') +
      `<p>${U.esc(r.t.slice(0, m.index))}${fill ? `<b class="cz-fill">${c}</b>` : '<span class="cz-blank"></span>'}${U.esc(r.t.slice(m.index + 3))}</p></div>`;
    return {
      say: r.ask, text: '句子里少了一个字：' + r.ask, cls: 'has-visual', visual: show(false), reveal: show(true),
      opts: U.shuffle(r.opts).map(x => ({ k: x, html: hz(x) })), ans: c, optCls: 'txt',
      item: 'zh:' + c, hint: r.hint || '想一想故事里是怎么说的。', after: '对！' + r.t.replace(/\[(.)\]/, '$1')
    };
  }

  // 读词和补句子轮着来
  const zip = (a, b) => U.range(0, Math.max(a.length, b.length) - 1).reduce((o, i) => o.concat(a[i] || [], b[i] || []), []);

  /* 认字：list 这一课的字（一课四五个字）；o.words 用这些字（和以前学过的字）组成的词；o.read 故事里补字的句子；o.story 配图用的故事
     还没认识的字都先看一张“怎么来的”卡片，再出题：没讲过的字不考。
     这一课的字他都认识了，就不讲来历，多读词、读句子（先加深，再加快） */
  function learnZh(api, list, o) {
    o = o || {};
    const mine = list.map(c => CE.ZHMAP[c]);
    const fresh = mine.filter(z => lvOf(z) !== 'known').slice(0, 5);
    const easy = !fresh.length;
    const qs = [];
    // 看图找字的顺序打乱：不能照着刚才卡片的顺序答
    U.shuffle(fresh).concat(U.shuffle(mine.filter(z => fresh.indexOf(z) < 0))).filter(z => has(z.c))
      .slice(0, Math.max(2, fresh.length)).forEach(z => qs.push(() => seeQ(z, list)));
    // 没有意思可看的字：只好听音找字。做这一周的时候，应该在 zh-meaning.js 里给它补上
    fresh.filter(z => !has(z.c)).forEach(z => qs.push(() => zhQ(z)));
    const words = (o.words || []).filter(w => CE.ZHWORDS[w]);
    const freshFirst = (a, b) => (fresh.some(z => z.c === b.t.match(/\[(.)\]/)[1]) - fresh.some(z => z.c === a.t.match(/\[(.)\]/)[1]));
    const reads = U.shuffle(o.read || []).sort(freshFirst);
    const n = easy ? 3 : 2;
    zip(U.sample(words, n).map(w => () => wordQ(w, words)), reads.slice(0, n).map(r => () => readQ(r, o.story)))
      .forEach(f => qs.push(f));
    const quiz = () => Q.run(api, { rounds: qs.length, make: i => qs[i]() });
    if (easy) return quiz();
    return CE.Cards.run(api, fresh.map(rootCard)).then(ok => (ok ? quiz() : null));
  }
  CE.Lib.learnZh = learnZh;

  // 找字：按字库顺序把没测过的字过一遍，顺带复查“只对过一次”的字。这是摸底，不是教
  def('find-zh', {
    cat: 'zh', title: '找字小侦探', icon: '🔍', sub: '听读音找字，摸清哪些字已经认识（摸底用）',
    run: api => {
      const by = { new: [], maybe: [], learning: [], known: [] };
      CE.ZH.forEach(z => by[lvOf(z)].push(z));
      let t = by.new.slice(0, 8).concat(U.sample(by.maybe, 2));
      [by.learning, by.maybe, by.new, by.known].forEach(src => {
        if (t.length < 10) t = t.concat(U.sample(src.filter(z => t.indexOf(z) < 0), 10 - t.length));
      });
      t = U.shuffle(t);
      return Q.run(api, { rounds: t.length, make: i => zhQ(t[i]) });
    }
  });

  /* 认新字：从字库里挑他还不会、又讲得出来历或者看得出意思的字，一次最多 3 个；反义字一起教。
     没有意思可讲的字（的、了、是……）不在这里单独教，等它们在句子里出现。
     这样的字都会了，就用认识的字读词。 */
  function learnMore(api) {
    const rank = { learning: 0, new: 1, maybe: 2 };
    // 故事里出现过的字排在前面：他在故事里见过，这时候来认最自然
    const seen = {};
    Object.keys(CE.STORIES).forEach(id => (CE.STORIES[id].chars || []).forEach(c => { seen[c] = 1; }));
    const can = CE.ZH.filter(z => has(z.c) && lvOf(z) !== 'known')
      .sort((a, b) => (rank[lvOf(a)] - rank[lvOf(b)]) || ((seen[b.c] || 0) - (seen[a.c] || 0)) ||
        (!!M[b.c].root - !!M[a.c].root) || (a.i - b.i));
    const pick = [];
    can.forEach(z => {
      if (pick.length >= 3 || pick.indexOf(z) >= 0) return;
      pick.push(z);
      const p = M[z.c].pair && CE.ZHMAP[M[z.c].pair];
      if (p && pick.length < 3 && can.indexOf(p) >= 0 && pick.indexOf(p) < 0) pick.push(p);
    });
    const knows = c => pick.some(z => z.c === c) || ['known', 'maybe'].indexOf(S.level('zh:' + c)) >= 0;
    const canRead = Object.keys(CE.ZHWORDS).filter(w => Array.from(w).every(knows));
    const qs = [];
    if (pick.length) {
      const near = pick.map(z => z.c);
      U.mix(pick.concat(pick)).forEach(z => qs.push(() => seeQ(z, near)));
      U.sample(canRead.filter(w => pick.some(z => w.indexOf(z.c) >= 0)), 2).forEach(w => qs.push(() => wordQ(w, Object.keys(CE.ZHWORDS))));
      return CE.Cards.run(api, pick.map(rootCard)).then(ok => (ok ? Q.run(api, { rounds: qs.length, make: i => qs[i]() }) : null));
    }
    // 有意思可讲的字都认识了：换着样子再认几个，再读几个词
    const known = U.sample(CE.ZH.filter(z => has(z.c)), 4);
    known.forEach(z => qs.push(() => seeQ(z, known.map(x => x.c))));
    U.sample(canRead, 3).forEach(w => qs.push(() => wordQ(w, Object.keys(CE.ZHWORDS))));
    return Q.run(api, { rounds: qs.length, make: i => qs[i]() });
  }
  def('learn-zh-more', { cat: 'zh', title: '认新字', icon: '字', sub: '挑他还不会、讲得出来历的字（日、月、木……），一次最多 3 个', run: learnMore });
})(window.CE);
