/* 打印材料：涂色页、绘本、描红、数学练习、英语卡片。版式按 A4 设计。 */
(function (CE) {
  'use strict';
  const U = CE.U, A = CE.Art;
  const Pr = CE.Print = {};

  const sheet = html => `<section class="sheet">${html}</section>`;
  const head = (title, sub) =>
    `<div class="sh-head"><h2>${title}</h2><div class="sh-meta">名字：__________　日期：__________</div></div>` +
    (sub ? `<p class="sh-sub">${sub}</p>` : '');

  function coloring(key) {
    const w = A.CHARS[key];
    return sheet(head(`给${w.name}涂颜色`, `${w.name}是一辆${w.job}。用你喜欢的颜色把它涂满吧！`) +
      `<div class="pr-art">${A.who(key, { line: true })}</div><div class="pr-hollow">${w.name}</div>`);
  }

  function drawCar() {
    const INK = '#222';
    const wheel = cx => `<circle cx="${cx}" cy="186" r="20" fill="#fff" stroke="${INK}" stroke-width="1.6"/><circle cx="${cx}" cy="186" r="8" fill="#fff" stroke="${INK}" stroke-width="1.2"/>`;
    return sheet(head('画一辆我自己的车', '轮子和马路已经画好了。车是什么样子，由你来决定！') +
      `<svg class="pr-draw" viewBox="0 0 190 230"><path d="M0 206H190" stroke="${INK}" stroke-width="1.6"/>` +
      `<path d="M6 218H184" stroke="${INK}" stroke-width="1.2" stroke-dasharray="10 8"/>${wheel(58)}${wheel(132)}</svg>`);
  }

  const tz = (c, cls) => `<div class="tz ${cls || ''}">${c || ''}</div>`;
  const traceRow = (lab, sub, c) =>
    `<div class="trace-row"><div class="trace-lab"><b>${lab}</b><span>${sub}</span></div>` +
    tz(c, 'model') + tz(c, 'ghost').repeat(3) + tz('').repeat(3) + `</div>`;

  function trace(title, chars) {
    return sheet(head(title, '先看第一个字，再描灰色的字，最后自己写。') +
      chars.map(c => traceRow(CE.ZHMAP[c].p, CE.ZHMAP[c].w, c)).join(''));
  }
  function traceNum() {
    const zh = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    const page = (lo, hi) => sheet(head(`写数字 ${lo}–${hi}`, '先描灰色的数字，再自己写。') +
      U.range(lo, hi).map(n => traceRow(zh[n - 1], '●'.repeat(Math.min(n, 5)) + (n > 5 ? '<br>' + '●'.repeat(n - 5) : ''), n)).join(''));
    return page(1, 5) + page(6, 10);
  }

  const mini = kind => A.v(kind, { line: true, noFace: true });
  function count1() {
    const rows = [[3, 'car'], [5, 'bus'], [2, 'firetruck'], [6, 'truck'], [4, 'excavator'], [7, 'car']];
    return sheet(head('数一数，写数字', '每一行有几辆车？数一数，把数字写在方框里。') +
      rows.map(r => `<div class="cnt-row"><div class="cnt-items">${mini(r[1]).repeat(r[0])}</div><div class="cnt-box"></div></div>`).join(''));
  }
  function count2() {
    const rows = [[3, 5], [6, 4], [2, 6], [5, 6]];
    const seq = [1, 2, 3, 0, 0, 6, 0, 8, 0, 10];
    return sheet(head('比多少，接着写', '哪一边的车多？把多的那一边圈起来。') +
      rows.map(r => `<div class="cmp-row"><div class="cnt-items">${mini('car').repeat(r[0])}</div><div class="cnt-items">${mini('bus').repeat(r[1])}</div></div>`).join('') +
      `<p class="sh-sub mt">数字公路上少了几个数字，请你补上：</p>` +
      `<div class="seq-row">${seq.map(n => `<div class="cnt-box">${n || ''}</div>`).join('')}</div>`);
  }

  function book(id, no) {
    const st = CE.STORIES[id];
    let out = sheet(`<div class="bk-cover"><div class="bk-series">车车镇的故事 · 第 ${no} 本</div><h1>${st.title}</h1>` +
      `<div class="bk-art">${A.scene(st.pages[0].bg, st.pages[0].sp)}</div>` +
      `<div class="sh-meta">这本书是 __________ 的</div></div>`);
    for (let i = 0; i < st.pages.length; i += 2) {
      out += sheet(st.pages.slice(i, i + 2).map((p, k) =>
        `<div class="bk-page"><div class="bk-art">${A.scene(p.bg, p.sp)}</div>` +
        `<p class="bk-text">${CE.Story.markup(p.t, p.hi)}</p><span class="bk-no">${i + k + 1}</span></div>`).join('') +
        (i + 2 >= st.pages.length ? `<p class="bk-end">这本书里的字：${st.chars.join('　')}</p>` : ''));
    }
    return out;
  }

  function cards(keys) {
    return sheet(`<p class="sh-sub">沿虚线剪开，就是一套英语卡片。</p><div class="fc-grid">` +
      keys.map(k => `<div class="fc"><div class="fc-pic">${CE.enPic(k)}</div><div class="fc-w">${CE.EN[k].w}</div><div class="fc-zh">${CE.EN[k].zh}</div></div>`).join('') +
      `</div>`);
  }

  Pr.LIST = [
    { g: '涂色画画', id: 'color-xiaofeng', t: '涂色：小风', f: () => coloring('xiaofeng') },
    { g: '涂色画画', id: 'color-xiaohuo', t: '涂色：小火', f: () => coloring('xiaohuo') },
    { g: '涂色画画', id: 'color-xiaoshui', t: '涂色：小水', f: () => coloring('xiaoshui') },
    { g: '涂色画画', id: 'color-atu', t: '涂色：阿土', f: () => coloring('atu') },
    { g: '涂色画画', id: 'color-dashan', t: '涂色：大山', f: () => coloring('dashan') },
    { g: '涂色画画', id: 'draw-car', t: '画一辆我自己的车', f: drawCar },
    { g: '故事绘本', id: 'book-1', t: '绘本：小风来到车车镇（6 页纸）', f: () => book('story-1', 1) },
    { g: '故事绘本', id: 'book-2', t: '绘本：大石头挡路了（6 页纸）', f: () => book('story-2', 2) },
    { g: '写字描红', id: 'trace-w1', t: '描红：车 大 小 山 火 水 土 风', f: () => trace('描红 · 第 1 周的字', ['车', '大', '小', '山', '火', '水', '土', '风']) },
    { g: '写字描红', id: 'trace-w2', t: '描红：石 上 下 来 去', f: () => trace('描红 · 第 2 周的字', ['石', '上', '下', '来', '去']) },
    { g: '写字描红', id: 'trace-num', t: '写数字 1–10（2 页纸）', f: traceNum },
    { g: '数学练习', id: 'count-1', t: '数一数，写数字', f: count1 },
    { g: '数学练习', id: 'count-2', t: '比多少，接着写', f: count2 },
    { g: '英语卡片', id: 'cards-en-1', t: '卡片：car bus truck red blue yellow', f: () => cards(['car', 'bus', 'truck', 'red', 'blue', 'yellow']) },
    { g: '英语卡片', id: 'cards-en-2', t: '卡片：green one two three four five', f: () => cards(['green', 'one', 'two', 'three', 'four', 'five']) }
  ];

  Pr.show = function (app, id) {
    const it = Pr.LIST.find(x => x.id === id);
    if (!it) return U.go('#/parent');
    app.innerHTML =
      `<div class="print-view">` +
        `<div class="print-bar no-print"><button class="btn sm back">◀ 返回</button><span>${U.esc(it.t)}</span><button class="btn sm go">打印</button></div>` +
        `<div class="sheets">${it.f()}</div>` +
      `</div>`;
    U.$('.back', app).addEventListener('click', () => U.go('#/parent'));
    U.$('.go', app).addEventListener('click', () => window.print());
  };
})(window.CE);
