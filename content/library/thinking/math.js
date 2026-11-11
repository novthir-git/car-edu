/* 想得清 · 数：点数、认数、按数取物、比多少、找缺的数、加法。
   题目都是现场出的，难度分级，由外壳按表现自动升降。
   数不是背出来的（见 docs/learning.md）：
     - 数一数：车换着样子摆（排成排、散开、大车小车混着），点一下数一个；数到最后是几，一共就是几
     - 找数字：数字对着数量。一个停车场停满是 10 辆，23 就是停满两个、再停 3 辆：先写 2，再写 3
     - 比多少：有时少的那排排得长，光看长短会错，要数，或者一辆对一辆；答对以后排齐，多出来的亮起来
     - 加法：先看车开进来，再说“加”；第二级车库门关着，要从门上的数接着往下数 */
(function (CE) {
  'use strict';
  const U = CE.U, A = CE.Art, Q = CE.Quiz, S = CE.Store, def = CE.def;
  const INK = '#2b2b3a', BLUE = '#3b8beb', RED = '#ef5350';

  const pickNums = (lo, hi, k) => {
    let all = U.shuffle(U.range(lo, hi));
    while (all.length < k) all = all.concat(U.shuffle(U.range(lo, hi)));
    return all.slice(0, k);
  };

  const num = n => `<span class="num">${n}</span>`;
  const PALETTE = ['#3b8beb', '#ef5350', '#ffca3a', '#43b66b', '#9b6bdf', '#ff8a3d'];
  // 能点着数的一辆车
  const car = (kind, color, cls, style) =>
    `<span class="tap-n ${cls || ''}"${style ? ` style="${style}"` : ''}>${A.v(kind || 'car', { color: color })}</span>`;

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

  /* ---------- 数车车：同一个数，换着样子摆 ---------- */
  const KINDS = ['car', 'bus', 'truck', 'firetruck', 'dumptruck'];
  function layout(n, how) {
    if (how === 'scatter') {
      // 散开：放在 6 列的格子里，空格随机，每辆车歪一点
      const cells = U.shuffle(U.range(0, (n > 12 ? 24 : 18) - 1)).slice(0, n);
      const color = U.pick(PALETTE), kind = U.pick(['car', 'bus', 'truck']);
      return `<div class="scat">${U.range(0, n > 12 ? 23 : 17).map(i => (cells.indexOf(i) < 0 ? '<span class="scat-gap"></span>'
        : car(kind, color, '', `transform:translate(${U.rand(-6, 6)}px,${U.rand(-5, 5)}px) rotate(${U.rand(-12, 12)}deg)`))).join('')}</div>`;
    }
    if (how === 'mixed') return `<div class="grp">${U.range(1, n).map(() => car(U.pick(KINDS), U.pick(PALETTE))).join('')}</div>`;
    const kind = U.pick(['car', 'bus', 'truck']), color = U.pick(PALETTE);
    return `<div class="grp">${U.range(1, n).map(() => car(kind, color)).join('')}</div>`;
  }

  def('count-cars', {
    cat: 'math', title: '数车车', icon: '🚗', leveled: 3, sub: '点数：1–10 → 6–15 → 11–20。车换着样子摆，点一下数一个',
    run: api => {
      const r = [[1, 10], [6, 15], [11, 20]][S.lv('count-cars') - 1];
      const ns = pickNums(r[0], r[1], 8);
      return Q.run(api, {
        rounds: 8, make: i => {
          const n = ns[i], how = U.pick(['row', 'row', 'scatter', 'mixed']);
          const ask = how === 'mixed' ? '数一数，一共有几辆车？大车小车都算。' : '数一数，有几辆车？';
          return {
            say: i === 0 ? ask + '可以一辆一辆点着数。' : ask, text: ask + '（点一下车，数一个）', cls: 'has-visual',
            visual: layout(n, how), tapCount: true,
            opts: numOpts(n, Math.max(1, r[0] - 2), r[1] + 2, 3), ans: String(n), optCls: 'txt',
            item: 'cnt:' + n, hint: '一辆一辆点着数，数过的不再数。',
            // 他点着数完了：把“数到最后是几，一共就是几”说出来
            after: host => (Q.tapped(host) === n ? `对！你一辆一辆数，数到了${n}，所以一共是${n}辆。` : `对！${n}辆。`)
          };
        }
      });
    }
  });

  /* ---------- 找数字：数字对着数量，十个一停车场 ---------- */
  // 一个停车场两排、每排 5 个车位，停满是 10 辆
  const lot = k => `<svg class="tf" viewBox="0 0 108 48" aria-hidden="true">` +
    `<rect x="1.5" y="1.5" width="105" height="45" rx="6" fill="#e6ebf2" stroke="${INK}" stroke-width="3"/>` +
    U.range(0, 9).map(i => {
      const x = 6 + (i % 5) * 20, y = 6 + Math.floor(i / 5) * 19;
      return i < k
        ? `<rect x="${x}" y="${y}" width="17" height="14" rx="4" fill="${BLUE}" stroke="${INK}" stroke-width="2"/>` +
          `<rect x="${x + 4}" y="${y + 3}" width="9" height="5" rx="1.5" fill="#d9f1ff"/>` +
          `<circle cx="${x + 4.5}" cy="${y + 14}" r="2.6" fill="${INK}"/><circle cx="${x + 12.5}" cy="${y + 14}" r="2.6" fill="${INK}"/>`
        : `<rect x="${x}" y="${y}" width="17" height="15" rx="3" fill="none" stroke="#a9b3c3" stroke-width="1.5" stroke-dasharray="3 3"/>`;
    }).join('') + `</svg>`;
  const lots = n => `<div class="tfs">${U.range(1, Math.floor(n / 10)).map(() => lot(10)).join('')}${n % 10 ? lot(n % 10) : ''}</div>`;
  // 说数的样子：23 → 两个十，三个一
  const tensSay = n => {
    const t = Math.floor(n / 10), o = n % 10;
    if (!t) return n > 5 ? `一排五辆，再加${n - 5}辆，是${n}。` : `${n}。`;
    return `${t}个十${o ? `，${o}个一` : ''}，就是${n}。`;
  };

  def('find-num', {
    cat: 'math', title: '找数字', icon: '🔢', leveled: 3, sub: '听数找数：1–20 → 21–50 → 51–100。图上一个停车场停满是 10 辆',
    run: api => {
      const r = [[1, 20], [21, 50], [51, 100]][S.lv('find-num') - 1];
      const ns = pickNums(r[0], r[1], 10);
      return Q.run(api, {
        rounds: 10, make: i => {
          const n = ns[i], t = Math.floor(n / 10);
          return {
            say: `找一找数字：${n}。`, text: `找出数字 ${n}（图上一个停车场停满是 10 辆）`, cls: 'has-visual', visual: lots(n),
            opts: numOpts(n, r[0], r[1], 4, true), ans: String(n), optCls: 'txt', item: 'num:' + n,
            hint: t ? `${n}：停满了${t}个停车场，就是${t}个十，${n % 10 ? `还有${n % 10}辆，是${n % 10}个一。先写${t}，再写${n % 10}。` : '一辆也不多。'}` : `数一数，停了几辆？`,
            after: '对！' + tensSay(n)
          };
        }
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

  /* ---------- 谁多谁少：长短会骗人 ---------- */
  def('compare', {
    cat: 'math', title: '谁多谁少', icon: '⚖️', leveled: 2, sub: '比两排车的多少。有时少的那排排得长，要数一数或者一辆对一辆；第二级两排更接近',
    run: api => {
      const hard = S.lv('compare') > 1, max = hard ? 10 : 8;
      return Q.run(api, {
        rounds: 8, make: () => {
          const a = U.rand(1, max);   // a 是蓝车，b 是红车
          let b = a;
          for (let g = 0; g < 100 && (b === a || (hard && Math.abs(a - b) > 3)); g++) b = U.rand(1, max);
          if (b === a) b = a === 1 ? 2 : a - 1;
          const more = Math.random() < 0.6, hi = Math.max(a, b), lo = Math.min(a, b);
          // 一半的题（第二级四分之三）故意把少的那一排拉开、排得更长：只看长短会选错
          const trick = Math.random() < (hard ? 0.75 : 0.5);
          const slots = Math.max(hi + 3, Math.ceil(hi * 1.4));
          const line = (n, color, spread) => `<div class="cmp-line ${spread ? 'spread' : ''}">` +
            U.range(1, n).map(i => car('car', color, i > lo ? 'extra' : '')).join('') + `</div>`;
          // 答对以后两排对齐：一辆对一辆，多出来的几辆亮起来
          const rows = aligned => `<div class="cmp-rows ${aligned ? 'aligned' : ''}" style="--n:${slots}">` +
            line(a, BLUE, !aligned && trick && a < b) + line(b, RED, !aligned && trick && b < a) + `</div>`;
          const name = n => (n === a ? '蓝色' : '红色');
          const ask = more ? '哪一种车多？蓝色的，还是红色的？' : '哪一种车少？蓝色的，还是红色的？';
          return {
            say: ask, text: ask, cls: 'has-visual', visual: rows(false), reveal: rows(true), tapCount: true,
            opts: [{ k: 'a', html: A.v('car', { color: BLUE }) }, { k: 'b', html: A.v('car', { color: RED }) }],
            ans: (more ? a > b : a < b) ? 'a' : 'b', optCls: 'pic', item: 'cmp',
            hint: trick ? '排得长，不一定多。数一数，或者一辆对一辆地比。' : '数一数，比一比。',
            after: more ? `对！一辆对一辆排好，${name(hi)}的多出来${hi - lo}辆。` : `对！一辆对一辆排好，${name(lo)}的少了${hi - lo}辆。`
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
            item: 'seq:' + miss, hint: `看看前面的${miss - 1}，再多一个是几？`, after: `对！${miss - 1}再多一个，就是${miss}。`
          };
        }
      });
    }
  });

  /* ---------- 加法：先看车开进来，再说“加” ---------- */
  def('add-intro', {
    cat: 'math', title: '又来了几辆', icon: '➕', leveled: 2, sub: '加法：车开进停车场（和不超过 5）→ 车库门关着，接着往下数（和不超过 10）',
    run: api => {
      const lv2 = S.lv('add-intro') > 1;
      const eq = (a, b) => `<div class="add-eq">${a} + ${b} = ${a + b}</div>`;
      return Q.run(api, {
        rounds: 6, make: () => {
          if (!lv2) {
            const a = U.rand(1, 4), b = U.rand(1, 5 - a);
            const park = drive => `<div class="add-lot">` + U.range(1, a).map(() => car('car', BLUE)).join('') +
              U.range(1, b).map(i => car('car', RED, drive ? 'drive-in' : '', drive ? `animation-delay:${0.5 + i * 0.6}s` : '')).join('') + `</div>`;
            return {
              say: `停车场里有${a}辆车。又开进来${b}辆。现在一共有几辆？`, text: `停车场里有 ${a} 辆，又开进来 ${b} 辆，一共有几辆？`,
              cls: 'has-visual', visual: park(true), reveal: park(false) + eq(a, b), tapCount: true,
              opts: numOpts(a + b, 1, 6, 3), ans: String(a + b), optCls: 'txt', item: `add:${a}+${b}`,
              hint: '把停车场里的车都数一数。', after: `${a}辆，又开进来${b}辆，一共${a + b}辆。${a}加${b}，等于${a + b}。`
            };
          }
          // 第二级：车库门关着，里面的车看不见，只能从门上的数接着往下数
          const a = U.rand(3, 7), b = U.rand(1, Math.min(4, 10 - a));
          const garage = (n, cars) => `<div class="add-gar"><span class="gar">${A.prop('garage', { n: n })}</span>` +
            (cars ? `<div class="add-in">${U.range(1, b).map(i => car('car', RED, 'drive-in', `animation-delay:${0.4 + i * 0.6}s`)).join('')}</div>` : '') + `</div>`;
          return {
            say: `车库里已经停了${a}辆车，门关着，看不见。又开来${b}辆，都要停进去。停好以后，车库里一共有几辆？`,
            text: `车库里有 ${a} 辆（看不见），又开进去 ${b} 辆，一共有几辆？`,
            cls: 'has-visual', visual: garage(a, true), reveal: garage(a + b, false) + eq(a, b), tapCount: a,
            opts: numOpts(a + b, 2, 11, 3), ans: String(a + b), optCls: 'txt', item: `add:${a}+${b}`,
            hint: `车库里本来有${a}辆。从${a}接着往下数：点一下开来的车，数一个。`,
            after: `对！从${a}接着数：${U.range(a + 1, a + b).join('、')}。一共${a + b}辆。${a}加${b}，等于${a + b}。`
          };
        }
      });
    }
  });
})(window.CE);
