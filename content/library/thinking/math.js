/* 想得清 · 数：点数、认数、按数取物、比多少、找缺的数、看图加法。
   题目都是现场出的，难度分级，由外壳按表现自动升降。 */
(function (CE) {
  'use strict';
  const U = CE.U, A = CE.Art, Q = CE.Quiz, S = CE.Store, def = CE.def;

  const pickNums = (lo, hi, k) => {
    let all = U.shuffle(U.range(lo, hi));
    while (all.length < k) all = all.concat(U.shuffle(U.range(lo, hi)));
    return all.slice(0, k);
  };

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
})(window.CE);
