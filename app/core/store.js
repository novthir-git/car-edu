/* 学习记录：只存在本机浏览器（localStorage），不上传，不需要账号。 */
(function (CE) {
  'use strict';
  const KEY = 'car-edu:v1';
  const today = () => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  const fresh = () => ({
    v: 1,
    created: Date.now(),
    settings: { name: '', rate: 0.9, minutes: 15, sfx: true, voiceZh: '', voiceEn: '' },
    items: {},    // 每个知识点（字、数字、单词）的作答记录
    acts: {},     // 每个活动的累计记录
    days: {},     // 每天任务的完成情况
    levels: {},   // 可升级活动的当前难度
    colors: {},   // 涂色作品
    log: [],      // 每次进入活动的流水，用来看兴趣
    today: { d: today(), ms: 0, extra: 0 },
    notes: ''
  });

  const S = CE.Store = { data: fresh(), ok: true };

  S.load = function () {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) S.adopt(JSON.parse(raw));
    } catch (e) { S.ok = false; }
  };
  S.adopt = function (d) {
    if (!d || d.v !== 1) return false;
    const f = fresh();
    S.data = Object.assign(f, d, { settings: Object.assign(f.settings, d.settings || {}) });
    return true;
  };

  let timer = null;
  S.flush = function () {
    clearTimeout(timer); timer = null;
    try { localStorage.setItem(KEY, JSON.stringify(S.data)); } catch (e) { S.ok = false; }
  };
  S.save = function () { if (!timer) timer = setTimeout(S.flush, 250); };
  S.reset = function () { S.data = fresh(); S.flush(); };

  /* ---------- 知识点 ---------- */
  // firstTry: 这一题是否第一次就点对
  S.mark = function (id, firstTry) {
    const it = S.data.items[id] || (S.data.items[id] = { n: 0, ok: 0, st: 0 });
    it.n++;
    if (firstTry) { it.ok++; it.st++; } else { it.st = 0; }
    it.t = Date.now();
    // 家长手动标记会被孩子的实际表现修正
    if (!firstTry && it.m === 1) delete it.m;
    if (firstTry && it.m === 0 && it.st >= 2) delete it.m;
    S.save();
  };
  // new 没见过 / learning 还不会 / maybe 对过一次 / known 已掌握
  S.level = function (id) {
    const it = S.data.items[id];
    if (!it) return 'new';
    if (it.m === 1) return 'known';
    if (it.m === 0) return 'learning';
    if (!it.n) return 'new';
    if (it.st >= 2) return 'known';
    if (it.st === 1) return 'maybe';
    return 'learning';
  };
  S.setManual = function (id, m) {
    const it = S.data.items[id] || (S.data.items[id] = { n: 0, ok: 0, st: 0 });
    if (m === null) delete it.m; else it.m = m;
    S.save();
  };

  /* ---------- 活动 ---------- */
  S.rollDay = function () {
    const t = S.data.today;
    if (!t || t.d !== today()) S.data.today = { d: today(), ms: 0, extra: 0 };
    return S.data.today;
  };
  S.logAct = function (id, cat, r) {
    const a = S.data.acts[id] || (S.data.acts[id] = { plays: 0, done: 0, free: 0, ms: 0, stars: 0 });
    a.plays++; a.ms += r.ms; a.t = Date.now();
    if (r.free) a.free++;
    if (r.done) { a.done++; a.stars = Math.max(a.stars, r.stars || 1); }
    S.data.log.push({ t: Date.now(), id: id, cat: cat, ms: r.ms, f: r.free ? 1 : 0, d: r.done ? 1 : 0, s: r.score || 0, n: r.total || 0 });
    if (S.data.log.length > 3000) S.data.log.splice(0, S.data.log.length - 3000);
    S.rollDay().ms += r.ms;
    S.save();
  };
  S.dayDone = function (dayId, actId, stars) {
    const d = S.data.days[dayId] || (S.data.days[dayId] = { done: {} });
    d.done[actId] = Math.max(d.done[actId] || 0, stars || 1);
    S.save();
  };
  S.stars = function () {
    let n = 0;
    Object.keys(S.data.days).forEach(k => {
      const d = S.data.days[k].done || {};
      Object.keys(d).forEach(a => { n += d[a]; });
    });
    return n;
  };
  S.lv = function (id) { return S.data.levels[id] || 1; };
  S.setLv = function (id, n) { S.data.levels[id] = n; S.save(); };

  // 今天还能玩多久（毫秒）。minutes 设为 0 表示不限制
  S.timeLeft = function () {
    const lim = Number(S.data.settings.minutes) || 0;
    if (!lim) return Infinity;
    const t = S.rollDay();
    return lim * 60000 + (t.extra || 0) - t.ms;
  };
  S.addTime = function (min) { S.rollDay().extra += min * 60000; S.save(); };
})(window.CE);
