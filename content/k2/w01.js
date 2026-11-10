/* 中班 · 第 1 周　你好，车车镇
   一个文件就是一周：故事、这一周新教的字和词、五天的安排、配套的打印材料。
   题库和反复出现的练习不在这里，在 content/library/ 里。 */
(function (CE) {
  'use strict';
  const def = CE.def, L = CE.Lib, Pr = CE.Print;

  /* ---------- 故事（写法见 app/engines/story.js 开头） ---------- */
  const story = CE.addStory('story-1', {
    title: '小风来到车车镇',
    chars: ['车', '大', '小', '山', '火', '水', '土', '风'],
    pages: [
      { bg: 'town', t: '今天，小汽车小风来到了车车镇。', hi: ['车'],
        sp: [{ k: 'xiaofeng', x: 420, y: 405, s: 1.3, anim: 'in', dx: -700 }] },
      { bg: 'road', t: '“你好！我叫小风。我跑得像风一样快！”', hi: ['风'],
        sp: [{ k: 'wind', x: 150, y: 330, anim: 'pulse' }, { k: 'xiaofeng', x: 500, y: 405, s: 1.4, anim: 'bob' }] },
      { bg: 'town', t: '一辆红色的消防车开过来。“我叫小火。哪里有火，我就去哪里！”', hi: ['火'],
        sp: [{ k: 'bubble', icon: 'flame', x: 330, y: 190 }, { k: 'xiaohuo', x: 290, y: 405, s: 1.5, anim: 'in', dx: -600 },
             { k: 'xiaofeng', x: 670, y: 405, s: 0.95, flip: true }] },
      { bg: 'town', t: '“火怕什么呀？”小风问。“火怕水！”洒水车小水喷出了水花。', hi: ['水'],
        sp: [{ k: 'xiaoshui', x: 230, y: 405, s: 1.4 }, { k: 'spray', x: 372, y: 262, anim: 'pulse' },
             { k: 'xiaofeng', x: 690, y: 405, s: 0.9, flip: true, mood: 'wow' }] },
      { bg: 'site', t: '轰隆隆！挖掘机阿土在挖土。“我叫阿土，我最爱挖土！”', hi: ['土'],
        sp: [{ k: 'dirt', x: 650, y: 412, s: 1.3 }, { k: 'atu', x: 370, y: 410, s: 1.6, anim: 'bob' },
             { k: 'xiaofeng', x: 160, y: 410, s: 0.8 }] },
      { bg: 'town', t: '一辆大卡车慢慢开过来。“我叫大山。我的力气像山一样大！”', hi: ['大', '山'],
        sp: [{ k: 'dashan', x: 300, y: 405, s: 1.8, anim: 'in', dx: -500, slow: true },
             { k: 'xiaofeng', x: 690, y: 405, s: 0.85, flip: true, mood: 'wow' }] },
      { bg: 'town', t: '小风说：“你们都好大呀，我好小。”', hi: ['大', '小'],
        sp: [{ k: 'dashan', x: 240, y: 405, s: 1.75 }, { k: 'xiaofeng', x: 650, y: 405, s: 0.8, flip: true, mood: 'sad' }] },
      { bg: 'town', t: '大山笑了：“大车有大车的本领，小车有小车的本领。”', hi: ['大', '小', '车'],
        sp: [{ k: 'dashan', x: 240, y: 405, s: 1.75, anim: 'bob' }, { k: 'xiaofeng', x: 650, y: 405, s: 0.9, flip: true, anim: 'bob', delay: 0.3 }] },
      { bg: 'town', t: '“欢迎你，小风！我们一起玩吧！”车车镇的车都笑了。', hi: ['车'],
        sp: [{ k: 'xiaohuo', x: 120, y: 398, s: 0.8, anim: 'bob' }, { k: 'xiaoshui', x: 292, y: 398, s: 0.8, anim: 'bob', delay: 0.2 },
             { k: 'atu', x: 550, y: 398, s: 0.85, flip: true, anim: 'bob', delay: 0.4 }, { k: 'dashan', x: 700, y: 398, s: 0.85, flip: true, anim: 'bob', delay: 0.1 },
             { k: 'xiaofeng', x: 420, y: 428, s: 0.95, anim: 'bob', delay: 0.3 }] }
    ],
    quiz: [
      { q: '谁跑得像风一样快？', who: ['xiaofeng', 'dashan', 'xiaohuo'], ans: 'xiaofeng' },
      { q: '谁最爱挖土？', who: ['xiaoshui', 'atu', 'xiaofeng'], ans: 'atu' },
      { q: '哪里有火，谁就去哪里？', who: ['xiaohuo', 'atu', 'dashan'], ans: 'xiaohuo' },
      { q: '谁会喷水？', who: ['dashan', 'xiaofeng', 'xiaoshui'], ans: 'xiaoshui' },
      { q: '谁的力气像山一样大？', who: ['xiaohuo', 'dashan', 'xiaoshui'], ans: 'dashan' }
    ]
  });
  def('story-1', { cat: 'story', title: '小风来到车车镇', icon: '📖', sub: '第 1 周故事', run: api => CE.Story.run(api, story) });
  def('story-1-quiz', { cat: 'story', title: '故事问答：谁是谁', icon: '❓', sub: '回忆故事里的角色', run: api => CE.Story.quiz(api, story) });

  /* ---------- 这一周新教的字和词 ---------- */
  def('learn-zh-w1a', { cat: 'zh', title: '认字：车 山 火 风', icon: '字', sub: '第 1 周故事里的字（上）', run: api => L.learnZh(api, ['车', '山', '火', '风']) });
  def('learn-zh-w1b', { cat: 'zh', title: '认字：大 小 水 土', icon: '字', sub: '第 1 周故事里的字（下）', run: api => L.learnZh(api, ['大', '小', '水', '土']) });
  def('en-vehicles', { cat: 'en', title: 'car, bus, truck', icon: 'ABC', sub: '三种车的英语', run: api => L.enLesson(api, ['car', 'bus', 'truck']) });
  def('en-colors', { cat: 'en', title: 'red, blue, yellow', icon: 'ABC', sub: '三种颜色的英语', run: api => L.enLesson(api, ['red', 'blue', 'yellow']) });

  /* ---------- 五天的安排：每天三个活动，大约十分钟 ---------- */
  CE.addWeek({
    id: 'w1', grade: 'k2', n: 1, title: '你好，车车镇',
    days: [
      ['story-1', 'find-zh', 'color-xiaofeng'],
      ['count-cars', 'en-vehicles', 'learn-zh-w1a'],
      ['story-1-quiz', 'give-n', 'traffic'],
      ['find-num', 'learn-zh-w1b', 'en-colors'],
      ['find-zh', 'count-cars', 'color-xiaohuo']
    ],
    prints: ['color-xiaofeng', 'color-xiaohuo', 'color-train', 'pen-roads', 'book-1', 'trace-w1', 'count-1', 'cards-en-1']
  });

  /* ---------- 这一周自己的打印材料。id 要写进上面的 prints，家长才能按周一次打印 ---------- */
  Pr.add('故事绘本', 'book-1', '绘本：小风来到车车镇（6 页纸）', () => Pr.book(story, 1));
  Pr.add('写字描红', 'trace-w1', '描红：车 大 小 山 火 水 土 风', () => Pr.trace('描红 · 第 1 周的字', story.chars));
  Pr.add('数学练习', 'count-1', '数一数，写数字', () => Pr.count([[3, 'car'], [5, 'bus'], [2, 'firetruck'], [6, 'truck'], [4, 'excavator'], [7, 'car']]));
  Pr.add('英语卡片', 'cards-en-1', '卡片：car bus truck red blue yellow', () => Pr.cards(['car', 'bus', 'truck', 'red', 'blue', 'yellow']));
})(window.CE);
