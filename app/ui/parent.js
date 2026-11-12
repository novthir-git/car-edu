/* 家长页：兴趣观察、各科掌握情况、设置、数据导出、打印入口、大纲。 */
(function (CE) {
  'use strict';
  const U = CE.U, S = CE.Store, P = CE.Plan;
  const Pa = CE.Parent = { ok: false };
  const pct = (a, b) => (b ? Math.round(a / b * 100) + '%' : '—');
  const LV = { known: '已掌握', maybe: '对过一次', learning: '还不会', new: '没测过' };

  function overview() {
    const days = P.days(), done = days.filter(P.isDone).length;
    const total = S.data.log.reduce((s, e) => s + e.ms, 0);
    const t = S.rollDay(), lim = Number(S.data.settings.minutes) || 0;
    const cell = (k, v) => `<div class="kv"><b>${v}</b><span>${k}</span></div>`;
    return `<div class="kvs">` +
      cell('走过的站', `${done} / ${days.length}`) +
      cell('星星', S.stars()) +
      cell('累计使用', U.dur(total)) +
      cell('今天已用', U.dur(t.ms) + (lim ? ` / ${lim} 分钟` : '')) +
      cell('进入活动次数', S.data.log.length) +
      `</div>`;
  }

  function interest() {
    const cats = {};
    CE.CAT_ORDER.forEach(c => { cats[c] = { ms: 0, plays: 0, free: 0, freeMs: 0, quit: 0, s: 0, n: 0 }; });
    S.data.log.forEach(e => {
      const c = cats[e.cat]; if (!c) return;
      c.ms += e.ms; c.plays++;
      if (e.f) { c.free++; c.freeMs += e.ms; }
      if (!e.d) c.quit++;
      c.s += e.s || 0; c.n += e.n || 0;
    });
    const order = CE.CAT_ORDER.slice().sort((a, b) => (cats[b].freeMs - cats[a].freeMs) || (cats[b].ms - cats[a].ms));
    const max = Math.max(1, Math.max.apply(null, order.map(c => cats[c].freeMs)));
    if (!S.data.log.length) return `<p class="muted">还没有记录。孩子玩过之后，这里会显示各类内容的时间和选择。</p>`;
    return `<table class="tbl"><thead><tr><th>类别</th><th>自由玩次数</th><th>自由玩时长</th><th>总时长</th><th>中途退出</th><th>第一次就答对</th></tr></thead><tbody>` +
      order.map(c => {
        const x = cats[c];
        return `<tr><td>${CE.CATS[c].name}</td><td>${x.free}</td>` +
          `<td><span class="bar"><i style="width:${Math.round(x.freeMs / max * 100)}%"></i></span> ${U.dur(x.freeMs)}</td>` +
          `<td>${U.dur(x.ms)}</td><td>${x.quit} / ${x.plays}</td><td>${pct(x.s, x.n)}</td></tr>`;
      }).join('') + `</tbody></table>` +
      `<p class="muted">怎么看：“自由玩”是他自己选的，最能说明兴趣；“中途退出”多，可能是太难或不喜欢。故事、涂色没有对错，所以没有答对率。记录少于两周时只能当参考。</p>`;
  }

  function zh() {
    const n = { known: 0, maybe: 0, learning: 0, new: 0 };
    const cells = CE.ZH.map(z => {
      const lv = S.level('zh:' + z.c); n[lv]++;
      const it = S.data.items['zh:' + z.c];
      const manual = it && (it.m === 1 || it.m === 0);
      return `<button class="zc lv-${lv} ${manual ? 'manual' : ''}" data-c="${z.c}" title="${z.p}　${z.w}　${LV[lv]}${manual ? '（手动）' : ''}">${z.c}</button>`;
    }).join('');
    // 读词的时候不出声，他自己读对的词记在 ci: 下面
    const words = Object.keys(S.data.items).filter(k => k.indexOf('ci:') === 0);
    return `<p>字库共 ${CE.ZH.length} 个字：<span class="tag lv-known">已掌握 ${n.known}</span> <span class="tag lv-maybe">对过一次 ${n.maybe}</span> ` +
      `<span class="tag lv-learning">还不会 ${n.learning}</span> <span class="tag lv-new">没测过 ${n.new}</span></p>` +
      `<div class="zgrid">${cells}</div>` +
      (words.length ? `<h3>自己读出来的词</h3><div class="chips">${words.map(k =>
        `<span class="tag lv-${S.level(k)}">${U.esc(k.slice(3))}　${LV[S.level(k)]}</span>`).join('')}</div>` : '') +
      `<p class="muted">点一个字可以手动标记：已掌握 → 还不会 → 交回系统判断。您清楚他认识哪些字的话，直接在这里标一遍最快；` +
      `“认字”活动只教没掌握的字。四选一有蒙对的可能，所以要连续两次第一下就点对才算“已掌握”。</p>` +
      `<p class="muted">“认字”不是看卡片记字形：先讲字是怎么来的（山就是照着山画的），再看图找字、用学过的字读词、补故事里的句子。` +
      `读词的时候屏幕不读出声，要他自己读，读对了记在上面“自己读出来的词”里。路上、书上的字他认不认得，屏幕记不到，想到了请记在观察笔记里。` +
      `“找字小侦探”是听音找字，只用来摸底。</p>`;
  }

  function math() {
    const sum = (prefix, lo, hi) => {
      let n = 0, ok = 0;
      Object.keys(S.data.items).forEach(id => {
        if (id.indexOf(prefix) !== 0) return;
        const v = Number(id.slice(prefix.length));
        if (lo != null && !(v >= lo && v <= hi)) return;
        n += S.data.items[id].n; ok += S.data.items[id].ok;
      });
      return n ? `${pct(ok, n)}（${n} 题）` : '还没做过';
    };
    const lv = (id, max) => `第 ${S.lv(id)} / ${max} 级`;
    const rows = [
      ['认读数字 1–20', sum('num:', 1, 20)], ['认读数字 21–50', sum('num:', 21, 50)], ['认读数字 51–100', sum('num:', 51, 100)],
      ['点数 1–10', sum('cnt:', 1, 10)], ['点数 11–20', sum('cnt:', 11, 20)],
      ['按数取物 2–6', sum('give:', 2, 6)], ['按数取物 7–15', sum('give:', 7, 15)],
      ['比多少', sum('cmp')], ['找缺的数', sum('seq:', 1, 100)], ['看图加法', sum('add:')]
    ];
    return `<table class="tbl"><thead><tr><th>内容</th><th>第一次就答对</th></tr></thead><tbody>` +
      rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('') + `</tbody></table>` +
      `<p class="muted">当前难度：数车车 ${lv('count-cars', 3)}，找数字 ${lv('find-num', 3)}，停车场 ${lv('give-n', 3)}，` +
      `数字公路 ${lv('num-road', 3)}，谁多谁少 ${lv('compare', 2)}，又来了几辆 ${lv('add-intro', 2)}。` +
      `一次活动答对八成以上自动升一级，不到四成降一级。</p>` +
      `<p class="muted">“按数取物”检查的是他是否理解数量：能背着数到 49，不一定能准确拿出 7 个。</p>` +
      `<p class="muted">“谁多谁少”里，有一半的题故意让少的那一排排得更长，只看长短会选错。这个年纪常常看长短，答错是正常的，不用纠正；` +
      `答对以后，屏幕会把两排一辆对一辆排齐，让他看到多出来的几辆。“找数字”的图上，一个停车场停满是 10 辆：23 就是停满两个、再停 3 辆。` +
      `“又来了几辆”到第二级，车库门关着，看不见里面的车，要从门上的数接着往下数。数车车、谁多谁少、又来了几辆里的车，都可以点一下数一个。</p>`;
  }

  function en() {
    return `<div class="chips">` + Object.keys(CE.EN).map(k => {
      const lv = S.level('en:' + k);
      return `<span class="tag lv-${lv}">${CE.EN[k].w}　${LV[lv]}</span>`;
    }).join('') + `</div>`;
  }

  // 声音的好坏取决于设备里装了哪些语音，网页没法自己下载，只能请家长在设备上装好
  const VOICE_TIP = CE.Native
    ? '点下面的“系统语音设置”，在“首选引擎”里选一个中文好的（例如 Google 语音服务、讯飞），在引擎的设置里下载普通话语音包。回到这里会自动刷新。'
    : 'iPad / iPhone：设置 → 辅助功能 → 朗读内容 → 声音 → 中文（中国大陆），下载带“优化”或“高品质”的声音，回来刷新页面。' +
      '电脑：用 Edge 浏览器打开，有自然的“晓晓”声音。安卓：在“文字转语音”设置里选 Google 引擎并下载普通话。';

  function settings() {
    const st = S.data.settings, sp = CE.Speech;
    const sel = (list, cur) => `<option value="">自动选择</option>` +
      (list || []).slice().sort((a, b) => sp.quality(b) - sp.quality(a)).map(v => {
        const key = v.voiceURI || v.name, q = sp.quality(v);
        const tag = q >= 7 ? '，自然' : q < 0 ? '，较机械' : '';
        return `<option value="${U.esc(key)}" ${key === cur || v.name === cur ? 'selected' : ''}>${U.esc(v.name)}（${U.esc(v.lang)}${tag}）</option>`;
      }).join('');
    const engine = CE.Native ? `朗读引擎：${U.esc(CE.Native.info().engine || '没有找到')}。` : '';
    const status = !sp.supported ? '这个浏览器不支持语音朗读。屏幕上会显示文字，需要您读给孩子听。'
      : !sp.zh ? engine + '没有找到中文语音。可以点下面的“试听”确认；如果没有声音，需要您读给孩子听，或换一台设备/浏览器。'
        : engine + `中文语音：${U.esc(sp.zh.name)}；英文语音：${sp.en ? U.esc(sp.en.name) : '没有找到'}`;
    return `<div class="form">` +
      `<label>孩子的名字（现在只保存，不读出来，也还没有显示的地方）<input type="text" data-k="name" value="${U.esc(st.name)}" maxlength="12"></label>` +
      `<label>每天使用上限（分钟，0 表示不限）<input type="number" data-k="minutes" min="0" max="120" value="${Number(st.minutes) || 0}"></label>` +
      `<label>语速 <input type="range" data-k="rate" min="0.6" max="1.2" step="0.05" value="${st.rate}"> <output>${st.rate}</output></label>` +
      `<label class="chk"><input type="checkbox" data-k="sfx" ${st.sfx ? 'checked' : ''}> 音效</label>` +
      `<label>中文语音 <select data-k="voiceZh">${sel(sp.zhList, st.voiceZh)}</select></label>` +
      `<label>英文语音 <select data-k="voiceEn">${sel(sp.enList, st.voiceEn)}</select></label>` +
      `<p class="muted">${status}</p>` +
      `<div class="row"><button class="btn sm" data-act="try-zh">试听中文</button><button class="btn sm" data-act="try-en">试听英文</button>` +
        (CE.Native ? `<button class="btn sm" data-act="tts">系统语音设置</button>` : '') + `</div>` +
      (sp.zh && sp.quality(sp.zh) < 5 ? `<p class="warn">现在用的中文语音比较机械。${VOICE_TIP}</p>` : `<p class="muted">声音听着机械的话：${VOICE_TIP}</p>`) +
      `</div>`;
  }

  function prints() {
    const items = CE.Print.items();
    const groups = CE.Print.GROUPS.filter(g => items.some(it => it.g === g));
    const cur = P.current();
    return `<h3>按周打印</h3><div class="links">` +
      CE.WEEKS.filter(w => w.prints.length).map(w =>
        `<button class="plink" data-go="#/print/week-${w.id}">第 ${w.n} 周　${U.esc(w.title)}${cur && cur.week === w ? '（现在）' : ''}</button>`).join('') +
      `</div><p class="muted">一周要用的纸一次打印出来。涂色以纸为主：孩子走到涂色那一步，屏幕会让他去拿纸和蜡笔。</p>` +
      groups.map(g => `<h3>${g}</h3><div class="links">` +
      items.filter(it => it.g === g).map(it => `<button class="plink" data-go="#/print/${it.id}">${U.esc(it.t)}</button>`).join('') +
      `</div>`).join('') +
      `<p class="muted">A4 纸，打开后点“打印”。描红页没有笔顺提示，第一次写请您示范。</p>`;
  }

  function outline() {
    // “已做好几周”是按实际登记的周数算出来的，不用手动维护
    return CE.GRADES.map(g => {
      const made = CE.WEEKS.filter(w => w.grade === g.id);
      const ready = s => made.filter(w => w.n >= s.from && w.n <= s.to).length;
      return `<p><b>${g.title}（${g.age}）</b>　${g.span}，计划 ${g.weeks} 周，已做好 ${made.length} 周。完整大纲见仓库里的 ${g.doc}。</p>` +
        g.stages.map(s => `<div class="stage"><h3>第 ${s.n} 阶段　${s.title}<small>第 ${s.from}–${s.to} 周${ready(s) ? '　·　已做好 ' + ready(s) + ' 周' : ''}</small></h3>` +
          `<dl><dt>识字</dt><dd>${s.zh}</dd><dt>数学</dt><dd>${s.math}</dd><dt>英语</dt><dd>${s.en}</dd><dt>探索</dt><dd>${s.more}</dd></dl></div>`).join('');
    }).join('') +
      `<p class="muted">后面的内容先不做，等看到他的反应再决定方向和比例。升到下一个年级时，再定下一个年级的大纲。</p>`;
  }

  // 安卓应用：外壳和内容的版本、检查更新。更新包放在哪里、怎么签名，见 android/README.md
  function appInfo() {
    const i = CE.Native.info(), c = i.content || {}, st = i.staged;
    const time = ms => new Date(ms).toLocaleString('zh-CN', { hour12: false });
    const ver = x => (x.v ? time(x.v * 1000) : '—') + (x.sha ? `（${U.esc(x.sha)}）` : '');
    return `<p>应用（外壳）第 ${U.esc(i.shell)} 版。内容：${ver(c)}，${c.from === 'update' ? '下载的更新' : '应用自带'}。</p>` +
      (st ? `<p class="warn">新内容 ${ver(st)} 已经下载好，下次打开应用时换上。<button class="btn sm" data-act="apply">现在换上</button></p>` : '') +
      `<p class="muted">${i.checking ? '正在检查更新……' : `上次检查：${i.last ? time(i.last) : '还没有'}。${U.esc(i.msg || '')}`}</p>` +
      `<div class="form"><label>自己的更新地址（可以不填。想从别的地方下载更新时，例如家里的 NAS，一行写一个，按顺序试）` +
        `<textarea data-k="sources" rows="2" placeholder="不填就从下面的默认地址下载">${U.esc((i.sources || []).join('\n'))}</textarea></label></div>` +
      ((i.builtin || []).length ? `<p class="muted">默认地址：${i.builtin.map(U.esc).join('、')}</p>` : '') +
      `<div class="row"><button class="btn sm" data-act="check" ${i.checking ? 'disabled' : ''}>检查更新</button></div>` +
      `<p class="muted">应用每次打开时会在后台查一下有没有新内容，只下载，不上传任何记录。更新包带签名，签名对不上的不会换上，所以地址用 http 也可以。` +
      `新内容不会在孩子玩到一半时换上，要等下次打开应用，或者离开半小时以上再回来。外壳本身要更新时，这里会提示去下载新的应用（APK）安装。</p>`;
  }

  function data() {
    return (CE.Native
      ? `<p>所有记录只保存在这台设备的这个应用里，不会上传。卸载应用会把记录一起删掉；换设备、卸载重装之前请先导出。</p>`
      : `<p>所有记录只保存在这台设备的这个浏览器里，不会上传。换设备前请先导出。</p>`) +
      `<div class="row"><button class="btn sm" data-act="export">导出记录</button>` +
      `<label class="btn sm filebtn">导入记录<input type="file" accept="application/json,.json" data-act="import" hidden></label>` +
      `<button class="btn sm danger" data-act="reset">清空记录</button></div>` +
      `<p class="warn" id="data-msg" hidden></p>` +
      `<textarea id="data-out" rows="6" readonly hidden aria-label="导出的记录"></textarea>` +
      (S.ok ? '' : `<p class="warn">这个浏览器不允许保存数据（可能是无痕模式），关闭页面后记录会丢失。</p>`) +
      `<label class="notes">观察笔记（纸上的活动、他说过的话，都可以记在这里）<textarea data-k="notes" rows="4">${U.esc(S.data.notes)}</textarea></label>`;
  }

  const SECTIONS = [
    ['ov', '概览', overview], ['in', '兴趣观察', interest], ['zh', '识字', zh], ['ma', '数学', math], ['en', '英语', en],
    ['pr', '打印', prints], ['yr', '大纲', outline], ['st', '设置', settings]
  ].concat(CE.Native ? [['ap', '应用', appInfo]] : [], [['da', '数据', data]]);

  Pa.show = function (app) {
    if (!Pa.ok && !CE.TEST) {
      app.innerHTML = `<div class="doc"><p class="muted">家长页需要验证。</p></div>`;
      CE.Gate.ask().then(ok => { if (ok) { Pa.ok = true; Pa.render(app); } else U.go('#/'); });
      return;
    }
    Pa.render(app);
  };

  // 安卓外壳通知声音或更新的状态变了：家长页正开着（已经过了验证）就重画一遍
  Pa.refresh = function () {
    if (U.$('#sec-st')) Pa.render(U.$('#app'));
  };

  Pa.render = function (app) {
    const top = window.scrollY;
    app.innerHTML =
      `<div class="doc">` +
        `<header class="doc-head"><button class="btn sm" data-act="home">◀ 回到孩子的页面</button><h1>家长页</h1></header>` +
        `<nav class="doc-nav">${SECTIONS.map(s => `<button data-sec="${s[0]}">${s[1]}</button>`).join('')}</nav>` +
        SECTIONS.map(s => `<section id="sec-${s[0]}"><h2>${s[1]}</h2>${s[2]()}</section>`).join('') +
      `</div>`;
    window.scrollTo(0, top);

    U.$$('.doc-nav button', app).forEach(b => b.addEventListener('click', () => {
      U.$('#sec-' + b.dataset.sec, app).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
    U.$$('[data-go]', app).forEach(b => b.addEventListener('click', () => U.go(b.dataset.go)));
    U.$$('.zc', app).forEach(b => b.addEventListener('click', () => {
      const id = 'zh:' + b.dataset.c, it = S.data.items[id];
      S.setManual(id, !it || it.m == null ? 1 : it.m === 1 ? 0 : null);
      Pa.render(app);
    }));
    U.$$('[data-k]', app).forEach(inp => inp.addEventListener('change', () => {
      const k = inp.dataset.k;
      if (k === 'sources') { CE.Native.setSources(inp.value); return; }   // 存在外壳里，不在学习记录里
      if (k === 'notes') S.data.notes = inp.value;
      else if (inp.type === 'checkbox') S.data.settings[k] = inp.checked;
      else if (inp.type === 'number' || inp.type === 'range') S.data.settings[k] = Number(inp.value);
      else S.data.settings[k] = inp.value;
      if (inp.type === 'range') inp.parentNode.querySelector('output').textContent = inp.value;
      S.flush();
      CE.Speech.refresh();
    }));
    const say = t => { const m = U.$('#data-msg', app); m.textContent = t; m.hidden = false; };
    const acts = {
      home: () => U.go('#/'),
      'try-zh': () => CE.Speech.say('你好！我是小风。我们一起去车车镇吧！'),
      'try-en': () => CE.Speech.say([{ t: 'Hello! A red car, a blue bus, a yellow truck.', lang: 'en' }]),
      tts: () => CE.Native.tts.settings(),
      check: () => CE.Native.checkUpdate(),
      apply: () => CE.Native.applyUpdate(),
      export: () => {
        S.flush();
        // 安卓应用里 WebView 不能下载文件，交给系统，让家长选存在哪里
        if (CE.Native) { CE.Native.saveText('car-edu-record.json', 'application/json', JSON.stringify(S.data, null, 2)); return; }
        if (CE.EMBED) {   // 预览环境不允许下载文件，改成显示出来让家长复制
          const out = U.$('#data-out', app);
          out.value = JSON.stringify(S.data);
          out.hidden = false; out.focus(); out.select();
          say('这里不能下载文件。请全选下面的文字，复制后自己保存。');
          return;
        }
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([JSON.stringify(S.data, null, 2)], { type: 'application/json' }));
        a.download = 'car-edu-record.json';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      },
      // 第一次点只是提醒，5 秒内再点一次才真的清空
      reset: () => {
        if (Pa.armed && Date.now() - Pa.armed < 5000) { Pa.armed = 0; S.reset(); Pa.render(app); return; }
        Pa.armed = Date.now();
        say('清空后不能恢复。确定的话，请在 5 秒内再点一次“清空记录”。');
      }
    };
    U.$$('button[data-act]', app).forEach(b => b.addEventListener('click', () => acts[b.dataset.act]()));
    const imp = U.$('input[data-act="import"]', app);
    imp.addEventListener('change', () => {
      const f = imp.files && imp.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        let ok = false;
        try { ok = S.adopt(JSON.parse(String(r.result))); } catch (e) { ok = false; }
        if (ok) { S.flush(); Pa.render(app); } else say('这个文件不是本应用导出的记录。');
      };
      r.readAsText(f);
    });
  };
})(window.CE);
