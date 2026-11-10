/* 打印材料的版式：涂色页、绘本、描红、数学练习、英语卡片。按 A4 设计。
   这里只管“长什么样”。具体印哪些，由 content/ 下的文件用 Pr.add(...) 登记。 */
(function (CE) {
  'use strict';
  const U = CE.U, A = CE.Art;
  // GROUPS 是家长页上分组的顺序
  const Pr = CE.Print = { LIST: [], GROUPS: ['涂色画画', '故事绘本', '写字描红', '数学练习', '英语卡片'] };

  /* 登记一份打印材料：g 分组，id 全局唯一，t 家长页上显示的名称，f 返回若干页的函数 */
  Pr.add = function (g, id, t, f) {
    if (Pr.GROUPS.indexOf(g) < 0) throw new Error('没有这个打印分组：' + g);
    if (Pr.LIST.some(x => x.id === id)) throw new Error('打印材料的 id 重复了：' + id);
    Pr.LIST.push({ g: g, id: id, t: t, f: f });
  };

  const sheet = html => `<section class="sheet">${html}</section>`;
  const head = (title, sub) =>
    `<div class="sh-head"><h2>${title}</h2><div class="sh-meta">名字：__________　日期：__________</div></div>` +
    (sub ? `<p class="sh-sub">${sub}</p>` : '');

  Pr.coloring = function (key) {
    const w = A.CHARS[key];
    return sheet(head(`给${w.name}涂颜色`, `${w.name}是一辆${w.job}。用你喜欢的颜色把它涂满吧！`) +
      `<div class="pr-art">${A.who(key, { line: true })}</div><div class="pr-hollow">${w.name}</div>`);
  };

  Pr.drawCar = function () {
    const INK = '#222';
    const wheel = cx => `<circle cx="${cx}" cy="186" r="20" fill="#fff" stroke="${INK}" stroke-width="1.6"/><circle cx="${cx}" cy="186" r="8" fill="#fff" stroke="${INK}" stroke-width="1.2"/>`;
    return sheet(head('画一辆我自己的车', '轮子和马路已经画好了。车是什么样子，由你来决定！') +
      `<svg class="pr-draw" viewBox="0 0 190 230"><path d="M0 206H190" stroke="${INK}" stroke-width="1.6"/>` +
      `<path d="M6 218H184" stroke="${INK}" stroke-width="1.2" stroke-dasharray="10 8"/>${wheel(58)}${wheel(132)}</svg>`);
  };

  const tz = (c, cls) => `<div class="tz ${cls || ''}">${c || ''}</div>`;
  const traceRow = (lab, sub, c) =>
    `<div class="trace-row"><div class="trace-lab"><b>${lab}</b><span>${sub}</span></div>` +
    tz(c, 'model') + tz(c, 'ghost').repeat(3) + tz('').repeat(3) + `</div>`;

  // 描红。一页最多 8 个字
  Pr.trace = function (title, chars) {
    return sheet(head(title, '先看第一个字，再描灰色的字，最后自己写。') +
      chars.map(c => traceRow(CE.ZHMAP[c].p, CE.ZHMAP[c].w, c)).join(''));
  };
  Pr.traceNum = function () {
    const zh = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    const page = (lo, hi) => sheet(head(`写数字 ${lo}–${hi}`, '先描灰色的数字，再自己写。') +
      U.range(lo, hi).map(n => traceRow(zh[n - 1], '●'.repeat(Math.min(n, 5)) + (n > 5 ? '<br>' + '●'.repeat(n - 5) : ''), n)).join(''));
    return page(1, 5) + page(6, 10);
  };

  const mini = kind => A.v(kind, { line: true, noFace: true });
  // 数一数。rows 每行是 [几辆, 哪种车]，一页最多 6 行
  Pr.count = function (rows) {
    return sheet(head('数一数，写数字', '每一行有几辆车？数一数，把数字写在方框里。') +
      rows.map(r => `<div class="cnt-row"><div class="cnt-items">${mini(r[1]).repeat(r[0])}</div><div class="cnt-box"></div></div>`).join(''));
  };
  // 比多少。rows 每行是 [左边几辆, 右边几辆]，一页最多 4 行；seq 是 10 个数，0 表示留空让孩子填
  Pr.compare = function (rows, seq) {
    return sheet(head('比多少，接着写', '哪一边的车多？把多的那一边圈起来。') +
      rows.map(r => `<div class="cmp-row"><div class="cnt-items">${mini('car').repeat(r[0])}</div><div class="cnt-items">${mini('bus').repeat(r[1])}</div></div>`).join('') +
      `<p class="sh-sub mt">数字公路上少了几个数字，请你补上：</p>` +
      `<div class="seq-row">${seq.map(n => `<div class="cnt-box">${n || ''}</div>`).join('')}</div>`);
  };

  // 绘本：封面一页，之后每张纸两页故事。no 是“第几本”
  Pr.book = function (st, no) {
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
  };

  // 英语卡片。keys 是词库里的词，一页 6 张
  Pr.cards = function (keys) {
    return sheet(`<p class="sh-sub">沿虚线剪开，就是一套英语卡片。</p><div class="fc-grid">` +
      keys.map(k => `<div class="fc"><div class="fc-pic">${CE.enPic(k)}</div><div class="fc-w">${CE.EN[k].w}</div><div class="fc-zh">${CE.EN[k].zh}</div></div>`).join('') +
      `</div>`);
  };

  Pr.show = function (app, id) {
    const it = Pr.LIST.find(x => x.id === id);
    if (!it) return U.go('#/parent');
    app.innerHTML =
      `<div class="print-view">` +
        `<div class="print-bar no-print"><button class="btn sm back">◀ 返回</button><span>${U.esc(it.t)}</span>` +
          // 嵌在别的页面里预览时浏览器不让打印，换成一句说明
          (CE.EMBED ? `<span class="muted">预览里不能打印，请在电脑上打开项目后打印</span>` : `<button class="btn sm go">打印</button>`) +
        `</div>` +
        `<div class="sheets">${it.f()}</div>` +
      `</div>`;
    U.$('.back', app).addEventListener('click', () => U.go('#/parent'));
    const go = U.$('.go', app);
    if (go) go.addEventListener('click', () => window.print());
  };
})(window.CE);
