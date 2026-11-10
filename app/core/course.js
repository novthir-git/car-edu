/* 课程登记处。这个文件里没有任何具体内容。
   内容都在 content/ 下，每个文件加载时把自己登记进来：
     CE.def       一个活动
     CE.addStory  一个故事
     CE.addWeek   一周的安排
     CE.addGrade  一个年级的大纲摘要
   页面只从这里读，所以加内容不需要改 app/ 下的任何文件。 */
(function (CE) {
  'use strict';

  CE.CATS = {
    story:  { name: '故事', icon: '📖' },
    zh:     { name: '识字', icon: '字' },
    math:   { name: '数学', icon: '123' },
    en:     { name: '英语', icon: 'ABC' },
    art:    { name: '美术', icon: '🎨' },
    safety: { name: '安全', icon: '🚦' },
    sci:    { name: '科学', icon: '🔬' },
    logic:  { name: '逻辑', icon: '🧩' }
  };
  CE.CAT_ORDER = ['story', 'zh', 'math', 'en', 'art', 'safety', 'sci', 'logic'];

  CE.ACTS = {};      // 活动 id → 活动
  CE.STORIES = {};   // 故事 id → 故事
  CE.WEEKS = [];     // 已经做好的周，按先后排序
  CE.GRADES = [];    // 各年级的大纲摘要，按先后排序
  CE.Lib = {};       // content/library 提供给各周复用的做题函数

  // id 写进了学习记录，重复会让两份内容互相覆盖，所以直接报错
  const taken = (what, id) => { throw new Error(what + '的 id 重复了：' + id); };

  /* 活动：cat 类别，title 名称，icon 图标，sub 给家长看的说明，
     leveled 最高难度（做得好自动升级，做得吃力自动降级），run(api) 开始。 */
  CE.def = function (id, o) {
    if (CE.ACTS[id]) taken('活动', id);
    o.id = id;
    CE.ACTS[id] = o;
  };

  CE.addStory = function (id, story) {
    if (CE.STORIES[id]) taken('故事', id);
    CE.STORIES[id] = story;
    return story;
  };

  /* 年级：id 年级代号（k2 是中班），order 先后，stages 各阶段的目标。要在这个年级的各周之前登记。 */
  CE.addGrade = function (g) {
    if (CE.GRADES.some(x => x.id === g.id)) taken('年级', g.id);
    CE.GRADES.push(g);
    CE.GRADES.sort((a, b) => a.order - b.order);
  };

  /* 一周：grade 属于哪个年级，n 这个年级里的第几周，days 每天三个活动的 id（大约十分钟），
     extra 只在“自由玩”里出现的活动。 */
  CE.addWeek = function (w) {
    if (CE.WEEKS.some(x => x.id === w.id)) taken('周', w.id);
    const at = x => CE.GRADES.findIndex(g => g.id === x.grade);
    if (at(w) < 0) throw new Error('第 ' + w.n + ' 周写的年级还没有登记：' + w.grade);
    w.extra = w.extra || [];
    CE.WEEKS.push(w);
    CE.WEEKS.sort((a, b) => (at(a) - at(b)) || (a.n - b.n));
  };

  const P = CE.Plan = {};
  P.days = function () {
    const out = [];
    CE.WEEKS.forEach(w => w.days.forEach((acts, i) => {
      out.push({ id: w.id + 'd' + (i + 1), week: w, n: i + 1, acts: acts });
    }));
    return out;
  };
  P.day = id => P.days().find(d => d.id === id) || null;
  P.isDone = function (day) {
    const rec = (CE.Store.data.days[day.id] || {}).done || {};
    return day.acts.every(a => rec[a]);
  };
  // 第一个还没做完的日子；全部做完则返回 null
  P.current = function () { return P.days().find(d => !P.isDone(d)) || null; };
  P.unlocked = function (day) {
    const all = P.days(), i = all.findIndex(d => d.id === day.id);
    return i === 0 || P.isDone(all[i - 1]) || P.isDone(day);
  };
  // 自由玩里可选的活动：已经开放的周里出现过的全部活动
  P.freeActs = function () {
    const cur = P.current();
    const open = cur ? CE.WEEKS.slice(0, CE.WEEKS.indexOf(cur.week) + 1) : CE.WEEKS;
    const seen = [];
    open.forEach(w => {
      w.days.forEach(acts => acts.forEach(a => { if (seen.indexOf(a) < 0) seen.push(a); }));
      w.extra.forEach(a => { if (seen.indexOf(a) < 0) seen.push(a); });
    });
    return seen;
  };
})(window.CE);
