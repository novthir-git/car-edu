/* 中班 · 第 1 周　你好，车车镇
   一个文件就是一周，都按同一个顺序写：这一周（三条路的总表）→ 故事 → 屏幕上这一周自己的活动 → 这一周自己的纸。 */
(function (CE) {
  'use strict';
  const def = CE.def, L = CE.Lib, Pr = CE.Print;

  /* ---------- 这一周：屏幕、纸、家长三条路都登记在这里 ---------- */
  CE.addWeek({
    id: 'w1', grade: 'k2', n: 1, title: '你好，车车镇',
    idea: '每辆车都有自己的本领，小也有小的好。',
    // 屏幕：五天，每天三个活动，大约十分钟
    days: [
      ['story-1', 'find-zh', 'color-xiaofeng'],
      ['count-cars', 'en-vehicles', 'learn-zh-w1a'],
      ['story-1-quiz', 'give-n', 'traffic'],
      ['find-num', 'learn-zh-w1b', 'en-colors'],
      ['find-zh', 'count-cars', 'color-xiaohuo']
    ],
    // 纸：这一周要打印的。给家长的那一页会自动排在最前面，不用写在这里
    prints: ['color-xiaofeng', 'color-xiaohuo', 'color-train', 'pen-roads', 'book-1', 'roots-w1', 'trace-w1', 'count-1', 'cards-en-1'],
    // 家长：给家长的一页（写法见 app/ui/print.js 的 Pr.family）
    family: {
      talk: [
        { q: '车车镇有哪些车？它们各会做什么？',
          a: '想不起来就翻绘本，指着图说。能说出“谁会做什么”就很好。' },
        { q: '小风为什么说“我好小”？大山是怎么回答他的？',
          a: '“为什么”的问题要慢一点，等他想。他说出原因以后，你用“因为……所以……”把它再说一遍。' },
        { q: '你有什么本领？有什么事是小孩做得到、大人反而做不到的？',
          a: '比如钻到桌子底下捡东西。让他多说几样，你也说说自己的。' }
      ],
      play: [
        { t: '反着做', aim: '练专心听、管住自己',
          how: '先玩正的：你说“大”，他踮脚举手变大；你说“小”，他蹲下变小。玩熟了反过来，说“大”要蹲下，说“小”要举手。再换他发口令，你来做。' },
        { t: '路上认灯、数车', aim: '把屏幕上学的用到真的地方',
          how: '过马路时请他告诉你：现在是什么灯，能不能走？等车的时候一起数路过的公共汽车，或者只数红色的车，数到 10。' }
      ],
      watch: [
        '涂色、沿着马路描线的时候：他能自己坐多久？笔是一把抓，还是三个手指捏？',
        '答错的时候：他是再试一次，乱点，还是不想玩了？',
        '请他讲故事的时候：是只说出名字，还是能说出谁做了什么？'
      ]
    }
  });

  /* ---------- 故事和回忆题（写法见 app/engines/story.js 开头） ---------- */
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
    // 问答：谁是谁，再加上心情（他那时心里怎么样）和先后（哪件事先发生）。pages 里的数是故事的第几页，从 0 数
    quiz: [
      { q: '谁跑得像风一样快？', who: ['xiaofeng', 'dashan', 'xiaohuo'], ans: 'xiaofeng' },
      { q: '谁最爱挖土？', who: ['xiaoshui', 'atu', 'xiaofeng'], ans: 'atu' },
      { q: '哪里有火，谁就去哪里？', who: ['xiaohuo', 'atu', 'dashan'], ans: 'xiaohuo' },
      { q: '谁的力气像山一样大？', who: ['xiaohuo', 'dashan', 'xiaoshui'], ans: 'dashan' },
      { q: '谁先来的？是小火先来，还是阿土先来？', pages: [2, 4], ans: 2, after: '对！小火先来，阿土后来。' },
      { q: '小风说“我好小”的时候，心里是什么样的？', k: 'xiaofeng', mood: ['happy', 'sad', 'wow'], ans: 'sad',
        after: '对，他有点难过，觉得自己太小了。后来大山告诉他：小车也有小车的本领。' },
      { q: '最后，大家说“欢迎你”，小风心里怎么样？', k: 'xiaofeng', mood: ['sad', 'wow', 'happy'], ans: 'happy',
        after: '对！他很高兴。刚才还难过，现在高兴了。' }
    ]
  });
  def('story-1', { cat: 'story', title: '小风来到车车镇', icon: '📖', sub: '第 1 周故事', run: api => CE.Story.run(api, story) });
  def('story-1-quiz', { cat: 'story', title: '故事问答：谁是谁', icon: '❓', sub: '回忆故事里的角色，谁先来，小风心里怎么样', run: api => CE.Story.quiz(api, story) });

  /* ---------- 屏幕：这一周新教的字和词。反复出现的练习在 content/library/ 里 ---------- */
  // 认字：先看字是怎么来的，再看图找字，再用这些字读词、补故事里的句子（见 content/library/language/zh.js）
  // 句子里 [ ] 中的字空着让他补；page 是配故事的第几页（从 0 数）
  const READ = {
    a: [
      { t: '小风跑得像[风]一样快。', ask: '小风跑得像什么一样快？', opts: ['风', '火', '水'], page: 1 },
      { t: '[火]怕水。', ask: '小风问：什么怕水呀？', opts: ['火', '土', '山'], page: 3 },
      { t: '大山的力气像[山]一样大。', ask: '大山的力气像什么一样大？', opts: ['山', '水', '风'], page: 5 }
    ],
    b: [
      { t: '火怕[水]。', ask: '火怕什么？', opts: ['水', '土', '风'], page: 3 },
      { t: '阿土最爱挖[土]。', ask: '阿土最爱挖什么？', opts: ['土', '水', '火'], page: 4 },
      { t: '你们都好大呀，我好[小]。', ask: '小风说：你们都好大呀，我好……？', opts: ['小', '大'], page: 6, hint: '小风和大山比，是大还是小？' }
    ]
  };
  def('learn-zh-w1a', { cat: 'zh', title: '认字：车 山 火 风', icon: '字', sub: '字是怎么来的；看图找字；读“火车”“风车”“火山”',
    run: api => L.learnZh(api, ['车', '山', '火', '风'], { words: ['火车', '风车', '火山'], read: READ.a, story: story }) });
  def('learn-zh-w1b', { cat: 'zh', title: '认字：大 小 水 土', icon: '字', sub: '字是怎么来的；大和小放在一起认；读“小风”“小火”“小水”“大山”',
    run: api => L.learnZh(api, ['大', '小', '水', '土'], { words: ['小风', '小火', '小水', '大山'], read: READ.b, story: story }) });
  def('en-vehicles', { cat: 'en', title: 'car, bus, truck', icon: 'ABC', sub: '三种车的英语', run: api => L.enLesson(api, ['car', 'bus', 'truck']) });
  def('en-colors', { cat: 'en', title: 'red, blue, yellow', icon: 'ABC', sub: '三种颜色的英语', run: api => L.enLesson(api, ['red', 'blue', 'yellow']) });

  /* ---------- 纸：这一周自己的打印材料。id 要写进上面的 prints，家长才能按周一次打印 ---------- */
  Pr.add('故事绘本', 'book-1', '绘本：小风来到车车镇（6 页纸）', () => Pr.book(story, 1));
  Pr.add('写字描红', 'roots-w1', '字是画出来的：车 大 小 山 火 水 土', () => Pr.roots('字是画出来的 · 第 1 周', story.chars,
    '先让他看左边的画猜是什么字，再看古时候的字和今天的字。自己画的那一格，画成什么样都行。' +
    '还可以随口玩“字交朋友”：火和车交朋友是“火车”，火和山是“火山”，车还能和谁交朋友？'));
  Pr.add('写字描红', 'trace-w1', '描红：车 大 小 山 火 水 土 风', () => Pr.trace('描红 · 第 1 周的字', story.chars));
  Pr.add('数学练习', 'count-1', '数一数，写数字', () => Pr.count([[3, 'car'], [5, 'bus'], [2, 'firetruck'], [6, 'truck'], [4, 'excavator'], [7, 'car']]));
  Pr.add('英语卡片', 'cards-en-1', '卡片：car bus truck red blue yellow', () => Pr.cards(['car', 'bus', 'truck', 'red', 'blue', 'yellow']));
})(window.CE);
