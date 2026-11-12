/* 孩子看到的界面：活动外壳、主页、每天的一站、自由玩、休息提醒。
   这里的话都是说给孩子听的：不说“任务”“完成”，说“出发”“这一站”“玩好啦”。 */
(function (CE) {
  'use strict';
  const U = CE.U, A = CE.Art, S = CE.Store, P = CE.Plan;

  const icon = act => {
    const t = act.icon || CE.CATS[act.cat].icon;
    return `<span class="aic ${/^[\x00-\x7f]+$|^字$/.test(t) ? 'txt' : ''}">${t}</span>`;
  };
  const card = (id, stars, sub) => {
    const a = CE.ACTS[id];
    return `<button class="acard cat-${a.cat}" data-a="${id}">${icon(a)}` +
      `<span class="acard-t">${U.esc(a.title)}</span>` +
      `<span class="acard-s">${stars ? A.stars(stars) : U.esc(sub || CE.CATS[a.cat].name)}</span></button>`;
  };

  /* ================= 活动外壳 ================= */
  const Sh = CE.Shell = { cur: null };
  Sh.abort = function () { if (Sh.cur) { const f = Sh.cur; Sh.cur = null; f(); } };

  Sh.open = function (app, id, ctx) {
    const act = CE.ACTS[id];
    if (!act) return U.go('#/');
    const back = ctx.day ? '#/day/' + ctx.day : ctx.free ? '#/free' : '#/';
    app.innerHTML =
      `<div class="act cat-${act.cat}">` +
        `<header class="act-bar">` +
          `<button class="ic-btn back" aria-label="返回">◀</button>` +
          `<div class="act-title">${U.esc(act.title)}</div><div class="dots"></div>` +
          `<button class="ic-btn replay" aria-label="再听一遍">🔊</button>` +
        `</header><main class="act-body"></main>` +
      `</div>`;
    const t0 = Date.now(), dots = U.$('.dots', app);
    let replay = null;
    const api = {
      host: U.$('.act-body', app), act: act, ctx: ctx, closed: false, onClose: null,
      progress(i, n) {
        dots.innerHTML = n > 12 ? `<span class="pgn">${Math.min(i + 1, n)}/${n}</span>`
          : U.range(0, n - 1).map(k => `<i class="${k < i ? 'on' : k === i ? 'cur' : ''}"></i>`).join('');
      },
      replay(fn) { replay = fn; }
    };
    U.$('.replay', app).addEventListener('click', () => { if (replay) replay(); });
    U.$('.back', app).addEventListener('click', () => U.go(back));
    const log = (done, res, stars) => S.logAct(id, act.cat, {
      ms: Date.now() - t0, free: !!ctx.free, done: done, score: res && res.score, total: res && res.total, stars: stars
    });
    // 中途离开：记一条“没做完”，这也是兴趣信号
    Sh.cur = () => {
      if (api.closed) return;
      api.closed = true;
      if (api.onClose) api.onClose();
      if (Date.now() - t0 > 3000) log(false);
    };

    Promise.resolve(act.run(api)).then(res => {
      if (api.closed || !res) return;
      api.closed = true; Sh.cur = null;
      const ratio = res.total ? res.score / res.total : 1;
      const stars = res.stars || (ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1);
      log(true, res, stars);
      if (ctx.day) S.dayDone(ctx.day, id, stars);
      if (act.leveled && res.total) {
        const lv = S.lv(id);
        if (ratio >= 0.8 && lv < act.leveled) S.setLv(id, lv + 1);
        else if (ratio < 0.4 && lv > 1) S.setLv(id, lv - 1);
      }
      // quiet：活动的后半段不在屏幕上（比如去纸上涂色），不弹星星，直接回去
      if (res.quiet) return U.go(back);
      result(app, act, ctx, stars, back);
    });
  };

  function result(app, act, ctx, stars, back) {
    const el = document.createElement('div');
    el.className = 'result';
    el.innerHTML =
      `<div class="result-card"><div class="stars lg">${A.stars(stars)}</div>` +
      `<div class="result-art">${A.who('xiaofeng', {}, 'cheer')}</div>` +
      `<div class="result-btns"><button class="btn again">再玩一次</button><button class="btn ok">好了 ✓</button></div></div>`;
    app.appendChild(el);
    CE.Sfx.star();
    CE.Speech.say(stars === 3 ? '太棒了！三颗星星！' : stars === 2 ? '很好！两颗星星！' : '玩好啦！一颗星星！');
    const ok = U.$('.ok', el);
    if (CE.TEST) {
      U.$$('[data-tn]', app).forEach(e => e.removeAttribute('data-tn'));
      ok.dataset.tn = '1';
    }
    ok.addEventListener('click', () => { CE.Sfx.tap(); U.go(back); });
    U.$('.again', el).addEventListener('click', () => { CE.Sfx.tap(); CE.Speech.stop(); Sh.open(app, act.id, ctx); });
  }

  /* ================= 主页 ================= */
  CE.Home = {
    show(app) {
      const cur = P.current();
      const stops = CE.WEEKS.map(w =>
        `<div class="map-week"><div class="map-label">第 ${w.n} 周　${U.esc(w.title)}</div><div class="map-row">` +
        w.days.map((acts, i) => {
          const day = P.day(w.id + 'd' + (i + 1));
          const done = P.isDone(day), open = P.unlocked(day);
          const cls = done ? 'done' : cur && cur.id === day.id ? 'cur' : open ? '' : 'lock';
          return `<button class="stop ${cls}" data-d="${day.id}" ${open ? '' : 'disabled'} aria-label="第${i + 1}站">${done ? '★' : i + 1}</button>`;
        }).join('') + `</div></div>`).join('');
      app.innerHTML =
        `<div class="screen home">` +
          `<header class="topbar"><div class="brand">车车镇</div>` +
            `<div class="pill">${A.starIcon(true)}<b>${S.stars()}</b></div>` +
            `<button class="parent-btn">家长</button></header>` +
          `<div class="home-stage">${A.scene('town', [
            { k: 'dashan', x: 150, y: 398, s: 0.85, anim: 'bob', delay: 0.2 },
            { k: 'xiaohuo', x: 650, y: 398, s: 0.8, flip: true, anim: 'bob', delay: 0.5 },
            { k: 'xiaofeng', x: 400, y: 428, s: 1.2, anim: 'bob' }])}</div>` +
          `<div class="home-actions">` +
            `<button class="big trip"><span class="em">🔑</span><span>出发</span>` +
              `<small>${cur ? `${U.esc(cur.week.title)} · 第 ${cur.n} 站` : '每一站都去过啦'}</small></button>` +
            `<button class="big free"><span class="em">🎮</span><span>自由玩</span><small>想玩什么都可以</small></button>` +
          `</div>` +
          `<div class="map">${stops}</div>` +
        `</div>`;
      U.$('.trip', app).addEventListener('click', () => { CE.Sfx.tap(); U.go(cur ? '#/day/' + cur.id : '#/free'); });
      U.$('.free', app).addEventListener('click', () => { CE.Sfx.tap(); U.go('#/free'); });
      U.$('.parent-btn', app).addEventListener('click', () => U.go('#/parent'));
      U.$$('.stop', app).forEach(b => b.addEventListener('click', () => { CE.Sfx.tap(); U.go('#/day/' + b.dataset.d); }));
      if (CE.unlocked) CE.Home.greet();
    },
    // 名字只显示在屏幕上，不读出来：朗读用的是预先生成的音频（voice/），家长填的名字没法提前生成
    greet() {
      const cur = P.current();
      CE.Speech.say('你好！' +
        (cur ? '点钥匙，跟小风出发。点游戏机，想玩什么都可以。' : '每一站都去过啦！点游戏机，想玩什么都可以。'));
    }
  };

  /* ================= 每天的一站：三个活动 ================= */
  CE.Day = {
    show(app, id) {
      const day = P.day(id);
      if (!day || !P.unlocked(day)) return U.go('#/');
      const rec = S.data.days[id] || (S.data.days[id] = { done: {} });
      const all = P.isDone(day);
      app.innerHTML =
        `<div class="screen day">` +
          `<header class="topbar"><button class="ic-btn back" aria-label="回主页">◀</button>` +
            `<div class="brand sm">第 ${day.week.n} 周 · 第 ${day.n} 站</div><span class="spacer"></span></header>` +
          `<div class="day-title">${U.esc(day.week.title)}</div>` +
          `<div class="day-cards">${day.acts.map(a => card(a, rec.done[a])).join('')}</div>` +
          (all ? `<div class="day-done">${A.who('xiaofeng', {}, 'cheer')}<span>这一站玩好啦！</span></div>` : '') +
        `</div>`;
      U.$('.back', app).addEventListener('click', () => U.go('#/'));
      U.$$('.acard', app).forEach(b => b.addEventListener('click', () => {
        CE.Sfx.tap(); U.go('#/play/' + b.dataset.a + '?d=' + id);
      }));
      if (all && !rec.cheered) {
        rec.cheered = 1; S.save();
        CE.Sfx.star();
        CE.Speech.say('这一站玩好啦！明天再出发。');
      } else if (!all) {
        CE.Speech.say('这一站有三样好玩的。想玩哪个，就点哪个。');
      }
    }
  };

  /* ================= 自由玩 ================= */
  CE.Free = {
    show(app) {
      const ids = P.freeActs();
      const groups = CE.CAT_ORDER.map(c => {
        const mine = ids.filter(i => CE.ACTS[i].cat === c);
        if (!mine.length) return '';
        return `<section class="free-group"><h2>${CE.CATS[c].name}</h2><div class="free-row">${mine.map(i => card(i, 0)).join('')}</div></section>`;
      }).join('');
      app.innerHTML =
        `<div class="screen free-screen">` +
          `<header class="topbar"><button class="ic-btn back" aria-label="回主页">◀</button><div class="brand sm">自由玩</div><span class="spacer"></span></header>` +
          `<div class="free-list">${groups}</div>` +
        `</div>`;
      U.$('.back', app).addEventListener('click', () => U.go('#/'));
      U.$$('.acard', app).forEach(b => b.addEventListener('click', () => {
        CE.Sfx.tap(); U.go('#/play/' + b.dataset.a + '?f=1');
      }));
      CE.Speech.say('想玩什么，就点什么。');
    }
  };

  /* ================= 休息提醒 ================= */
  CE.Rest = {
    show(app) {
      app.innerHTML =
        `<div class="screen rest">` +
          `<div class="rest-art">${A.who('xiaofeng', {}, 'cheer')}</div>` +
          `<h1>今天玩好啦</h1><p>小风要回车库休息了，明天见！</p>` +
          `<button class="parent-btn more">家长：再玩 10 分钟</button>` +
        `</div>`;
      CE.Speech.say('今天玩好啦！小风要回车库休息了。我们明天见！');
      U.$('.more', app).addEventListener('click', () => {
        CE.Gate.ask().then(ok => { if (ok) { S.addTime(10); U.go('#/'); } });
      });
    }
  };

  /* ================= 开场 ================= */
  // 浏览器要求先有一次点击才能出声，所以用一个“出发”画面接住第一次点击
  CE.Splash = {
    show() {
      const el = document.createElement('div');
      el.className = 'splash';
      el.innerHTML = `<div class="splash-art">${A.who('xiaofeng', {}, 'cheer')}</div><div class="splash-t">点一下小风，出发！</div>`;
      document.body.appendChild(el);
      el.addEventListener('click', () => {
        el.remove();
        CE.unlocked = true;
        CE.Sfx.unlock(); CE.Sfx.horn();
        if (!CE.cur || CE.cur === '#/' || CE.cur === '#') CE.Home.greet();
      }, { once: true });
    }
  };

  /* ================= 家长验证 ================= */
  CE.Gate = {
    ask() {
      return new Promise(resolve => {
        const a = U.rand(3, 9), b = U.rand(3, 9);
        const el = document.createElement('div');
        el.className = 'gate';
        el.innerHTML =
          `<form class="gate-card"><h2>家长验证</h2><p>${a} × ${b} = ？</p>` +
          `<input class="gate-in" inputmode="numeric" autocomplete="off" aria-label="答案">` +
          `<div class="gate-btns"><button type="button" class="btn sm cancel">取消</button><button type="submit" class="btn sm">确定</button></div></form>`;
        document.body.appendChild(el);
        const input = U.$('.gate-in', el);
        if (CE.TEST) input.value = String(a * b);
        const close = ok => { el.remove(); resolve(ok); };
        U.$('.cancel', el).addEventListener('click', () => close(false));
        U.$('form', el).addEventListener('submit', e => {
          e.preventDefault();
          if (Number(input.value) === a * b) close(true);
          else { input.value = ''; input.classList.add('bad'); input.focus(); }
        });
        input.focus();
      });
    }
  };
})(window.CE);
