/* 活动登记表：把内容和引擎拼成一个个可以玩的活动。
   每个活动：cat 类别，title 名称，icon 图标，sub 给家长看的说明，
   leveled 最高难度（做得好自动升级，做得吃力自动降级），run(api) 开始。 */
(function (CE) {
  'use strict';
  const U = CE.U, A = CE.Art, Q = CE.Quiz, S = CE.Store;
  const ACTS = CE.ACTS = {};
  const def = (id, o) => { o.id = id; ACTS[id] = o; };

  const pickNums = (lo, hi, k) => {
    let all = U.shuffle(U.range(lo, hi));
    while (all.length < k) all = all.concat(U.shuffle(U.range(lo, hi)));
    return all.slice(0, k);
  };
  // 打乱顺序，尽量不让同一项连着出现
  const mix = list => {
    for (let t = 0; t < 30; t++) {
      const a = U.shuffle(list);
      if (a.every((x, i) => i === 0 || x !== a[i - 1])) return a;
    }
    return U.shuffle(list);
  };

  /* ================= 识字 ================= */
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
    targets = mix(targets.concat(review.filter(z => fresh.indexOf(z) < 0).slice(0, Math.max(0, 8 - targets.length))));
    const quiz = () => Q.run(api, { rounds: targets.length, make: i => zhQ(targets[i]) });
    if (!fresh.length) return quiz();
    return CE.Cards.run(api, fresh.map(zhCard)).then(ok => (ok ? quiz() : null));
  }
  def('learn-zh-w1a', { cat: 'zh', title: '认字：车 山 火 风', icon: '字', sub: '第 1 周故事里的字（上）', run: api => learnZh(api, ['车', '山', '火', '风']) });
  def('learn-zh-w1b', { cat: 'zh', title: '认字：大 小 水 土', icon: '字', sub: '第 1 周故事里的字（下）', run: api => learnZh(api, ['大', '小', '水', '土']) });
  def('learn-zh-w2', { cat: 'zh', title: '认字：石 上 下 来 去', icon: '字', sub: '第 2 周故事里的字', run: api => learnZh(api, ['石', '上', '下', '来', '去']) });
  def('learn-zh-more', { cat: 'zh', title: '认新字', icon: '字', sub: '从字库里挑他还不会的字来教', run: api => learnZh(api, []) });

  /* ================= 故事 ================= */
  function storyQuiz(api, id) {
    const qs = CE.STORIES[id].quiz;
    return Q.run(api, {
      rounds: qs.length, make: i => {
        const q = qs[i];
        let opts;
        if (q.who) opts = q.who.map(k => ({ k: k, html: A.who(k) + `<span class="cap">${A.CHARS[k].name}</span>` }));
        else if (q.prop) opts = q.prop.map(k => ({ k: k, html: A.prop(k) }));
        else opts = q.num.map(n => ({ k: String(n), html: `<span class="num">${n}</span>` }));
        return { say: q.q, text: q.q, opts: opts, ans: String(q.ans), optCls: q.num ? 'txt' : 'pic' };
      }
    });
  }
  def('story-1', { cat: 'story', title: '小风来到车车镇', icon: '📖', sub: '第 1 周故事', run: api => CE.Story.run(api, CE.STORIES['story-1']) });
  def('story-1-quiz', { cat: 'story', title: '故事问答：谁是谁', icon: '❓', sub: '回忆故事里的角色', run: api => storyQuiz(api, 'story-1') });
  def('story-2', { cat: 'story', title: '大石头挡路了', icon: '📖', sub: '第 2 周故事', run: api => CE.Story.run(api, CE.STORIES['story-2']) });
  def('story-2-quiz', { cat: 'story', title: '故事问答：石头', icon: '❓', sub: '回忆故事的经过', run: api => storyQuiz(api, 'story-2') });

  /* ================= 数学 ================= */
  const num = n => `<span class="num">${n}</span>`;
  const PALETTE = ['#3b8beb', '#ef5350', '#ffca3a', '#43b66b', '#9b6bdf', '#ff8a3d'];
  const group = (n, kind, color) =>
    `<div class="grp">${U.range(1, n).map(() => A.v(kind || 'car', { color: color })).join('')}</div>`;

  // 数字选项。read 模式优先放容易混的数（23 和 32、23 和 33）
  function numOpts(n, lo, hi, k, read) {
    const rev = n > 11 && n % 11 ? Number(String(n).split('').reverse().join('')) : null;
    const near = U.shuffle([n - 1, n + 1, n - 2, n + 2]);
    const cand = (read ? [rev, n + 10, n - 10].concat(near) : near)
      .filter(x => x != null && x >= lo && x <= hi && x !== n);
    const set = [];
    cand.forEach(x => { if (set.indexOf(x) < 0) set.push(x); });
    for (let guard = 0; set.length < k - 1 && guard < 200; guard++) {
      const x = U.rand(lo, hi);
      if (x !== n && set.indexOf(x) < 0) set.push(x);
    }
    return U.shuffle([n].concat(set.slice(0, k - 1))).map(x => ({ k: String(x), html: num(x) }));
  }

  def('count-cars', {
    cat: 'math', title: '数车车', icon: '🚗', leveled: 3, sub: '点数：1–10 → 6–15 → 11–20',
    run: api => {
      const r = [[1, 10], [6, 15], [11, 20]][S.lv('count-cars') - 1];
      const ns = pickNums(r[0], r[1], 8);
      return Q.run(api, {
        rounds: 8, make: i => {
          const n = ns[i];
          return {
            say: '数一数，有几辆车？', text: '数一数，有几辆车？', cls: 'has-visual',
            visual: group(n, U.pick(['car', 'bus', 'truck']), U.pick(PALETTE)),
            opts: numOpts(n, Math.max(1, r[0] - 2), r[1] + 2, 3), ans: String(n), optCls: 'txt',
            item: 'cnt:' + n, after: `对！${n}辆。`
          };
        }
      });
    }
  });

  def('find-num', {
    cat: 'math', title: '找数字', icon: '🔢', leveled: 3, sub: '听数找数：1–20 → 21–50 → 51–100',
    run: api => {
      const r = [[1, 20], [21, 50], [51, 100]][S.lv('find-num') - 1];
      const ns = pickNums(r[0], r[1], 10);
      return Q.run(api, {
        rounds: 10, make: i => ({
          say: `找一找数字：${ns[i]}。`, text: `找出数字 ${ns[i]}`,
          opts: numOpts(ns[i], r[0], r[1], 4, true), ans: String(ns[i]), optCls: 'txt', item: 'num:' + ns[i]
        })
      });
    }
  });

  def('give-n', {
    cat: 'math', title: '停车场', icon: '🅿️', leveled: 3, sub: '按数取物：2–6 → 5–10 → 8–15',
    run: api => {
      const r = [[2, 6], [5, 10], [8, 15]][S.lv('give-n') - 1];
      return CE.GiveN.run(api, pickNums(r[0], r[1], 5));
    }
  });

  def('compare', {
    cat: 'math', title: '谁多谁少', icon: '⚖️', leveled: 2, sub: '比较两组的多少，第二级两组更接近',
    run: api => {
      const hard = S.lv('compare') > 1, max = hard ? 12 : 8;
      return Q.run(api, {
        rounds: 8, make: () => {
          const a = U.rand(1, max);
          let b = a;
          for (let g = 0; g < 100 && (b === a || (hard && Math.abs(a - b) > 3)); g++) b = U.rand(1, max);
          if (b === a) b = a === 1 ? 2 : a - 1;
          const more = Math.random() < 0.6, hi = Math.max(a, b), lo = Math.min(a, b);
          const text = more ? '哪一边的车多？' : '哪一边的车少？';
          return {
            say: text, text: text, optCls: 'pic grp-opt', item: 'cmp',
            opts: [{ k: 'a', html: group(a, 'car', '#3b8beb') }, { k: 'b', html: group(b, 'car', '#ef5350') }],
            ans: (more ? a > b : a < b) ? 'a' : 'b',
            after: more ? `对！${hi}比${lo}多。` : `对！${lo}比${hi}少。`
          };
        }
      });
    }
  });

  def('num-road', {
    cat: 'math', title: '数字公路', icon: '🛣️', leveled: 3, sub: '找出缺的数：20 以内 → 50 以内 → 100 以内',
    run: api => {
      const r = [[1, 20], [20, 50], [50, 100]][S.lv('num-road') - 1];
      return Q.run(api, {
        rounds: 8, make: () => {
          const start = U.rand(r[0], r[1] - 4), gap = U.rand(1, 4), miss = start + gap;
          return {
            say: '数字公路上，少了哪个数字？', text: '数字公路上，少了哪个数字？', cls: 'has-visual',
            visual: `<div class="signs">${U.range(0, 4).map(i =>
              `<span class="sign ${i === gap ? 'gap' : ''}">${i === gap ? '?' : start + i}</span>`).join('')}</div>`,
            opts: numOpts(miss, r[0], r[1], 3), ans: String(miss), optCls: 'txt',
            item: 'seq:' + miss, after: `对！是${miss}。`
          };
        }
      });
    }
  });

  def('add-intro', {
    cat: 'math', title: '又来了几辆', icon: '➕', leveled: 2, sub: '看图加法：和不超过 5 → 不超过 10',
    run: api => {
      const max = S.lv('add-intro') > 1 ? 10 : 5;
      return Q.run(api, {
        rounds: 6, make: () => {
          const a = U.rand(1, max - 1), b = U.rand(1, max - a);
          return {
            say: `停车场有${a}辆车，又来了${b}辆。一共有几辆？`, text: `${a} 辆，又来了 ${b} 辆，一共有几辆？`, cls: 'has-visual',
            visual: `<div class="sum">${group(a, 'car', '#3b8beb')}<span class="plus">+</span>${group(b, 'car', '#ef5350')}</div>`,
            opts: numOpts(a + b, 1, max + 1, 3), ans: String(a + b), optCls: 'txt',
            item: `add:${a}+${b}`, after: `${a}加${b}，等于${a + b}。`
          };
        }
      });
    }
  });

  /* ================= 逻辑 ================= */
  def('pattern', {
    cat: 'logic', title: '找规律', icon: '🧩', leveled: 2, sub: '接着排：AB → AAB、ABB、ABC',
    run: api => Q.run(api, {
      rounds: 6, make: () => {
        const units = U.shuffle([{ kind: 'car', color: '#ef5350' }, { kind: 'bus', color: '#ffca3a' }, { kind: 'truck', color: '#3b8beb' }]);
        const pat = S.lv('pattern') > 1 ? U.pick([[0, 0, 1], [0, 1, 1], [0, 1, 2]]) : [0, 1];
        const len = pat.length === 2 ? 5 : 6;
        const draw = u => A.v(units[u].kind, { color: units[u].color });
        return {
          say: '找规律：接下来是哪一辆车？', text: '找规律：接下来是哪一辆车？', cls: 'has-visual',
          visual: `<div class="pat">${U.range(0, len - 1).map(i => draw(pat[i % pat.length])).join('')}<span class="sign gap">?</span></div>`,
          opts: U.shuffle([0, 1, 2]).map(u => ({ k: String(u), html: draw(u) })), ans: String(pat[len % pat.length]),
          optCls: 'pic', item: 'pat'
        };
      }
    })
  });

  /* ================= 英语 ================= */
  const EN = CE.EN = {
    car: { w: 'car', zh: '小汽车', type: 'veh' }, bus: { w: 'bus', zh: '公共汽车', type: 'veh' }, truck: { w: 'truck', zh: '卡车', type: 'veh' },
    red: { w: 'red', zh: '红色', type: 'color', color: '#ef5350' }, blue: { w: 'blue', zh: '蓝色', type: 'color', color: '#3b8beb' },
    yellow: { w: 'yellow', zh: '黄色', type: 'color', color: '#ffca3a' }, green: { w: 'green', zh: '绿色', type: 'color', color: '#43b66b' },
    one: { w: 'one', zh: '一', type: 'num', n: 1 }, two: { w: 'two', zh: '二', type: 'num', n: 2 }, three: { w: 'three', zh: '三', type: 'num', n: 3 },
    four: { w: 'four', zh: '四', type: 'num', n: 4 }, five: { w: 'five', zh: '五', type: 'num', n: 5 }
  };
  const enPic = k => {
    const e = EN[k];
    if (e.type === 'veh') return A.v(k);
    if (e.type === 'color') return `<span class="blob" style="background:${e.color}"></span>`;
    return num(e.n);
  };
  CE.enPic = enPic;
  const enCard = k => ({
    cls: 'en-card', say: [{ t: EN[k].w, lang: 'en', gap: 400 }, { t: EN[k].zh, gap: 400 }, { t: EN[k].w, lang: 'en' }],
    html: `<span class="en-pic">${enPic(k)}</span><span class="en-word">${EN[k].w}</span><span class="en-zh">${EN[k].zh}</span>`
  });
  const listen = phrase => [{ t: '听一听，点一点：' }, { t: phrase, lang: 'en', gap: 600 }, { t: phrase, lang: 'en' }];

  // words 本次要学的词；pool 做题时的选项范围
  function enAct(api, words, pool) {
    pool = pool || words;
    const fresh = words.filter(k => S.level('en:' + k) !== 'known');
    const targets = mix(words.concat(words).concat(U.sample(pool, 2))).slice(0, 8);
    const quiz = () => Q.run(api, {
      rounds: targets.length, make: i => {
        const k = targets[i];
        const others = U.sample(pool.filter(x => x !== k), 2);
        return {
          say: listen(EN[k].w), text: `Listen: ${EN[k].w}（${EN[k].zh}）`,
          opts: U.shuffle([k].concat(others)).map(x => ({ k: x, html: enPic(x) })), ans: k,
          optCls: EN[k].type === 'num' ? 'txt' : 'pic', item: 'en:' + k, after: [{ t: `Yes! ${EN[k].w}!`, lang: 'en' }]
        };
      }
    });
    if (!fresh.length) return quiz();
    return CE.Cards.run(api, fresh.map(enCard)).then(ok => (ok ? quiz() : null));
  }
  def('en-vehicles', { cat: 'en', title: 'car, bus, truck', icon: 'ABC', sub: '三种车的英语', run: api => enAct(api, ['car', 'bus', 'truck']) });
  def('en-colors', { cat: 'en', title: 'red, blue, yellow', icon: 'ABC', sub: '三种颜色的英语', run: api => enAct(api, ['red', 'blue', 'yellow']) });
  def('en-numbers', { cat: 'en', title: 'one to five', icon: 'ABC', sub: '数字 1–5 的英语', run: api => enAct(api, ['one', 'two', 'three', 'four', 'five']) });

  // 颜色加车：a red bus。同时听懂两个词才能选对。
  def('en-phrases', {
    cat: 'en', title: 'a red car', icon: 'ABC', sub: '颜色 + 车的短语，新词 green',
    run: api => {
      const kinds = ['car', 'bus', 'truck'], colors = ['red', 'blue', 'yellow', 'green'];
      const quiz = () => Q.run(api, {
        rounds: 8, make: () => {
          const k = U.pick(kinds), c = U.pick(colors);
          const k2 = U.pick(kinds.filter(x => x !== k)), c2 = U.pick(colors.filter(x => x !== c));
          const phrase = `a ${c} ${k}`;
          const tile = (kk, cc) => ({ k: cc + '-' + kk, html: A.v(kk, { color: EN[cc].color }) });
          return {
            say: listen(phrase), text: `Listen: ${phrase}`,
            opts: U.shuffle([tile(k, c), tile(k, c2), tile(k2, c), tile(k2, c2)]), ans: c + '-' + k,
            optCls: 'pic', item: 'en:phrase', after: [{ t: `Yes! ${phrase}!`, lang: 'en' }]
          };
        }
      });
      if (S.level('en:green') === 'known') return quiz();
      return CE.Cards.run(api, [enCard('green')]).then(ok => (ok ? quiz() : null));
    }
  });

  /* ================= 探索 ================= */
  def('traffic', { cat: 'safety', title: '红绿灯', icon: '🚦', sub: '红灯停，绿灯行，黄灯等一等', run: api => CE.Traffic.run(api) });
  def('wheel-lab', { cat: 'sci', title: '轮子实验室', icon: '🔬', sub: '试试圆、方、三角三种轮子', run: api => CE.Wheel.run(api) });
  Object.keys(A.CHARS).forEach(k => {
    def('color-' + k, { cat: 'art', title: '给' + A.CHARS[k].name + '涂色', icon: '🎨', sub: '自由涂色，没有对错', run: api => CE.Coloring.run(api, k) });
  });
})(window.CE);
