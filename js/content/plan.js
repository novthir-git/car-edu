/* 课程安排：类别、已做好的周、一年大纲的摘要。
   新增一周只需要在 WEEKS 里加一项，并在 activities.js 里登记用到的新活动。 */
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

  // 每天三个活动，大约十分钟。extra 是只在“自由玩”里出现的活动。
  CE.WEEKS = [
    { id: 'w1', n: 1, title: '你好，车车镇',
      days: [
        ['story-1', 'find-zh', 'color-xiaofeng'],
        ['count-cars', 'en-vehicles', 'learn-zh-w1a'],
        ['story-1-quiz', 'give-n', 'traffic'],
        ['find-num', 'learn-zh-w1b', 'en-colors'],
        ['find-zh', 'count-cars', 'color-xiaohuo']
      ],
      extra: [] },
    { id: 'w2', n: 2, title: '大石头挡路了',
      days: [
        ['story-2', 'learn-zh-w2', 'wheel-lab'],
        ['compare', 'en-numbers', 'find-zh'],
        ['story-2-quiz', 'num-road', 'pattern'],
        ['add-intro', 'en-phrases', 'learn-zh-more'],
        ['find-zh', 'give-n', 'color-atu']
      ],
      extra: ['color-dashan', 'color-xiaoshui'] }
  ];

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
    const maxWeek = cur ? cur.week.n : CE.WEEKS.length;
    const seen = [];
    CE.WEEKS.filter(w => w.n <= maxWeek).forEach(w => {
      w.days.forEach(acts => acts.forEach(a => { if (seen.indexOf(a) < 0) seen.push(a); }));
      (w.extra || []).forEach(a => { if (seen.indexOf(a) < 0) seen.push(a); });
    });
    return seen;
  };

  // 一年大纲摘要，完整版见 docs/year-plan.md
  CE.YEAR = [
    { n: 1, weeks: '第 1–12 周', title: '车车镇的朋友们', ready: '第 1–2 周已做好',
      zh: '摸清已认识的字；每周约 4 个新字，累计认识约 90 个',
      math: '数到 100；20 以内点数；认读 0–50；比多少；5 以内加法（看图）',
      en: '约 30 个词（车、颜色、数字 1–10）；字母 A–H',
      more: '美术、交通安全、科学、逻辑轮流出现，观察他更喜欢哪一类' },
    { n: 2, weeks: '第 13–24 周', title: '出发去工地和山里',
      zh: '累计约 140 个；开始读两三个字的词和短句',
      math: '认读到 100；十和一；10 以内加减；认识图形',
      en: '约 60 个词（动物、大小、动作）；字母 I–Q；“I see a …”',
      more: '按第一阶段观察到的兴趣调整比例；加入方向与地图、节奏、天气' },
    { n: 3, weeks: '第 25–36 周', title: '车车镇运输队',
      zh: '累计约 190 个；独立读 3–5 个字的句子',
      math: '10 以内加减熟练；20 以内借助实物；整点钟表；长短轻重',
      en: '约 100 个词；字母 R–Z；简单拼读',
      more: '指令序列（编程思维）、浮沉与磁铁、各地的车、纸模手工' },
    { n: 4, weeks: '第 37–48 周', title: '小小工程师',
      zh: '累计约 250 个；自己读短绘本',
      math: '20 以内加减；2、5、10 的跳数；简单应用题和统计',
      en: '约 150 个词；短句和简单对话',
      more: '做小项目：设计自己的车、讲自己的故事' }
  ];
})(window.CE);
