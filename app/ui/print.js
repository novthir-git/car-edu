/* 打印材料的版式：给家长的一页、涂色页、绘本、描红、数学练习、英语卡片。按 A4 设计。
   这里只管“长什么样”。具体印哪些，由 content/ 下的文件用 Pr.add(...) 登记。 */
(function (CE) {
  'use strict';
  const U = CE.U, A = CE.Art;
  // GROUPS 是家长页上分组的顺序
  const Pr = CE.Print = { LIST: [], GROUPS: ['给家长', '涂色画画', '故事绘本', '写字描红', '数学练习', '英语卡片'] };

  /* 登记一份打印材料：g 分组，id 全局唯一，t 家长页上显示的名称，f 返回若干页的函数 */
  Pr.add = function (g, id, t, f) {
    if (Pr.GROUPS.indexOf(g) < 0) throw new Error('没有这个打印分组：' + g);
    if (Pr.LIST.some(x => x.id === id)) throw new Error('打印材料的 id 重复了：' + id);
    Pr.LIST.push({ g: g, id: id, t: t, f: f });
  };

  const mini = kind => A.v(kind, { line: true, noFace: true });
  const sheet = html => `<section class="sheet">${html}</section>`;
  const head = (title, sub) =>
    `<div class="sh-head"><h2>${title}</h2><div class="sh-meta">名字：__________　日期：__________</div></div>` +
    (sub ? `<p class="sh-sub">${sub}</p>` : '');

  const colorSheet = (name, intro, art) =>
    sheet(head(`给${name}涂颜色`, intro + '用你喜欢的颜色把它涂满吧！') +
      `<div class="pr-art">${art}</div><div class="pr-hollow">${name}</div>`);
  // 涂色页：给一个角色涂
  Pr.coloring = function (key) {
    const w = A.CHARS[key];
    return colorSheet(w.name, `${w.name}是一辆${w.job}。`, A.who(key, { line: true }));
  };
  // 涂色页：还没有编进故事、没有名字的车也可以先涂。kind 车的种类，name 印在纸上的空心字
  Pr.coloringKind = function (kind, name, intro) {
    return colorSheet(name, intro, A.v(kind, { line: true }));
  };

  Pr.drawCar = function () {
    const INK = '#222';
    const wheel = cx => `<circle cx="${cx}" cy="186" r="20" fill="#fff" stroke="${INK}" stroke-width="1.6"/><circle cx="${cx}" cy="186" r="8" fill="#fff" stroke="${INK}" stroke-width="1.2"/>`;
    return sheet(head('画一辆我自己的车', '轮子和马路已经画好了。车是什么样子，由你来决定！') +
      `<svg class="pr-draw" viewBox="0 0 190 230"><path d="M0 206H190" stroke="${INK}" stroke-width="1.6"/>` +
      `<path d="M6 218H184" stroke="${INK}" stroke-width="1.2" stroke-dasharray="10 8"/>${wheel(58)}${wheel(132)}</svg>`);
  };

  // 控笔：沿着马路中间的虚线，从小车画到车库。线型由易到难：直、弯、折、拐、拱
  Pr.roads = function () {
    const INK = '#222';
    const lines = [
      'M4 15H146',
      'M4 15Q21.75 -5 39.5 15T75 15T110.5 15T146 15',
      'M4 23L24.3 7L44.6 23L64.9 7L85.2 23L105.5 7L125.8 23L146 7',
      'M4 23H32V7H61V23H90V7H119V23H146',
      'M4 25a17.75 17.75 0 0 1 35.5 0a17.75 17.75 0 0 1 35.5 0a17.75 17.75 0 0 1 35.5 0a17.75 17.75 0 0 1 35.5 0'
    ];
    const home = `<svg class="pen-home" viewBox="0 0 24 24"><path d="M2 11L12 3L22 11V22H2Z" fill="#fff" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>` +
      `<path d="M7 22V14H17V22" fill="none" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
    return sheet(head('开车回家', '用笔沿着马路中间的虚线，把小车开回家。慢慢开。') +
      lines.map(d => `<div class="pen-row">${mini('car')}<svg class="pen-road" viewBox="0 0 150 30">` +
        `<path d="${d}" fill="none" stroke="#e4e4e4" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<path d="${d}" fill="none" stroke="#777" stroke-width=".5" stroke-dasharray="2.4 2" stroke-linejoin="round"/></svg>${home}</div>`).join('') +
      `<p class="sh-sub mt">给家长：一次画一两行就够，画出马路也没关系。</p>`);
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

  /* 给家长：每周一页，放在这一周的纸最前面。屏幕上练不到的（说、专注、相处）靠这一页交给家长。
     内容写在周文件的 CE.addWeek 里，这里不用另外登记：
       idea          这一周的故事想说的一句话
       family.talk   聊一聊 [{q 问题, a 怎么接}]，三个：回忆的、“为什么”的、联系他自己的
       family.play   玩一玩 [{t 名字, aim 练什么, how 怎么玩}]，一两样，不用屏幕
       family.watch  看一看 [一句话]，三件这一周留意的事
     一页放得下的大约就是这些。写多了会被裁掉，冒烟测试会查。 */
  Pr.family = function (w) {
    const o = w.family;
    const sec = (title, note, items) =>
      `<div class="fam-sec"><h3>${title}</h3><p class="fam-note">${note}</p>` +
      `<ol class="fam-list">${items.map(h => `<li>${h}</li>`).join('')}</ol></div>`;
    return sheet(
      `<div class="sh-head"><h2>给家长：第 ${w.n} 周</h2><div class="sh-meta">${w.title}</div></div>` +
      `<div class="fam">` +
        `<p class="fam-lead">屏幕上练不到的事都在这一页：听他说，陪他玩，看看他。加起来一周二三十分钟，挑着做，不用做全。</p>` +
        `<p class="fam-idea">这一周的故事想说的是：<b>${w.idea}</b></p>` +
        sec('聊一聊', '看完故事以后，或者睡前拿着打印的绘本。没有标准答案：等他说完再接话；他说得短，就把他的话补完整，再说一遍。',
          o.talk.map(t => `<b>${t.q}</b><span>${t.a}</span>`)) +
        sec('玩一玩', '不用屏幕，一次五分钟。他不想玩就停。',
          o.play.map(p => `<b>${p.t}<i>${p.aim}</i></b><span>${p.how}</span>`)) +
        sec('看一看', '不用考他，平时留意就行。想到了就记一句，记在家长页的“观察笔记”里或者这张纸上都行。',
          o.watch.map(t => `<span>${t}</span>`)) +
      `</div>`);
  };

  // 全部能打印的：每一周“给家长”的那页（id 是 family-<周 id>），加上登记过的材料
  Pr.items = function () {
    return CE.WEEKS.filter(w => w.family).map(w => (
      { g: '给家长', id: 'family-' + w.id, t: `第 ${w.n} 周　${w.title}`, f: () => Pr.family(w) })).concat(Pr.LIST);
  };

  // 一周要用的纸合成一份，一次打印出来：最前面是给家长的一页，后面是周文件 prints 里列的材料
  Pr.week = function (w) {
    return {
      id: 'week-' + w.id, t: `第 ${w.n} 周要用的纸：${w.title}`,
      f: () => (w.family ? Pr.family(w) : '') + (w.prints || []).map(id => {
        const it = Pr.LIST.find(x => x.id === id);
        if (!it) throw new Error(`第 ${w.n} 周要打印的材料没有登记：` + id);
        return it.f();
      }).join('')
    };
  };

  Pr.show = function (app, id) {
    const wk = CE.WEEKS.find(w => 'week-' + w.id === id);
    const it = wk ? Pr.week(wk) : Pr.items().find(x => x.id === id);
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
    // 安卓应用里 WebView 不能直接打印，交给系统的打印（可以选打印机，也可以存成 PDF）
    if (go) go.addEventListener('click', () => (CE.Native ? CE.Native.print(it.t) : window.print()));
  };
})(window.CE);
