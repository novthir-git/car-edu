/* 说得出 · 识字练习：找字、认字。字从 zh-chars.js 的字库里取。
   CE.Lib.learnZh 留给各周的“认字”活动用（见 content/k2/w01.js）。 */
(function (CE) {
  'use strict';
  const U = CE.U, Q = CE.Quiz, S = CE.Store, def = CE.def;

  const hz = c => `<span class="hz">${c}</span>`;
  const zhSay = z => `${z.c}，${z.w}的${z.c}。`;
  const lvOf = z => S.level('zh:' + z.c);

  function zhQ(z) {
    // 干扰项选难度相近、读音不同的字
    const near = CE.ZH.filter(o => o.c !== z.c && o.b !== z.b && Math.abs(o.i - z.i) <= 24);
    const opts = U.shuffle([z].concat(U.sample(near, 3))).map(o => ({ k: o.c, html: hz(o.c) }));
    return { say: '找一找：' + zhSay(z), text: `找出“${z.c}”（${z.w}的${z.c}）`, opts: opts, ans: z.c, item: 'zh:' + z.c, optCls: 'txt' };
  }
  function zhCard(z) {
    return {
      cls: 'zh-card', say: '这个字是：' + zhSay(z),
      html: `<span class="tian">${hz(z.c)}</span>` +
        `<span class="zh-info">${z.pic ? `<span class="pic">${z.pic}</span>` : ''}<span class="py">${z.p}</span><span class="word">${U.esc(z.w)}</span></span>`
    };
  }

  // 找字：按字库顺序把没测过的字过一遍，顺带复查“只对过一次”的字
  def('find-zh', {
    cat: 'zh', title: '找字小侦探', icon: '🔍', sub: '听读音找字，摸清哪些字已经认识',
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

  // 认字：先用卡片教还不会的字（一次最多 3 个），再做题巩固
  function learnZh(api, list) {
    const mine = list.map(c => CE.ZHMAP[c]);
    let fresh = mine.filter(z => lvOf(z) !== 'known').slice(0, 3);
    if (!fresh.length) fresh = CE.ZH.filter(z => lvOf(z) === 'learning').slice(0, 2);
    if (!fresh.length) fresh = CE.ZH.filter(z => lvOf(z) === 'new').slice(0, 2);
    const review = U.shuffle(mine.filter(z => fresh.indexOf(z) < 0))
      .concat(U.shuffle(CE.ZH.filter(z => lvOf(z) === 'maybe' && mine.indexOf(z) < 0)))
      .concat(U.shuffle(CE.ZH.filter(z => lvOf(z) === 'known' && mine.indexOf(z) < 0)));
    let targets = fresh.concat(fresh);
    targets = U.mix(targets.concat(review.filter(z => fresh.indexOf(z) < 0).slice(0, Math.max(0, 8 - targets.length))));
    const quiz = () => Q.run(api, { rounds: targets.length, make: i => zhQ(targets[i]) });
    if (!fresh.length) return quiz();
    return CE.Cards.run(api, fresh.map(zhCard)).then(ok => (ok ? quiz() : null));
  }
  CE.Lib.learnZh = learnZh;

  def('learn-zh-more', { cat: 'zh', title: '认新字', icon: '字', sub: '从字库里挑他还不会的字来教', run: api => learnZh(api, []) });
})(window.CE);
