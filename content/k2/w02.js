/* 中班 · 第 2 周　大石头挡路了
   一个文件就是一周，都按同一个顺序写：这一周（三条路的总表）→ 故事 → 屏幕上这一周自己的活动 → 这一周自己的纸。 */
(function (CE) {
  'use strict';
  const def = CE.def, L = CE.Lib, Pr = CE.Print;

  /* ---------- 这一周：屏幕、纸、家长三条路都登记在这里 ---------- */
  CE.addWeek({
    id: 'w2', grade: 'k2', n: 2, title: '大石头挡路了',
    idea: '自己做不到的事，可以请人帮忙，也可以换个办法。',
    // 屏幕：五天，每天三个活动，大约十分钟
    days: [
      ['story-2', 'learn-zh-w2', 'wheel-lab'],
      ['compare', 'en-numbers', 'find-zh'],
      ['story-2-quiz', 'num-road', 'pattern'],
      ['add-intro', 'en-phrases', 'learn-zh-more'],
      ['find-zh', 'give-n', 'color-atu']
    ],
    // 只在“自由玩”里出现的活动
    extra: ['color-dashan', 'color-xiaoshui'],
    // 纸：这一周要打印的。给家长的那一页会自动排在最前面，不用写在这里
    prints: ['color-atu', 'color-dashan', 'color-xiaoshui', 'draw-car', 'book-2', 'trace-w2', 'trace-num', 'count-2', 'cards-en-2'],
    // 家长：给家长的一页（写法见 app/ui/print.js 的 Pr.family）
    family: {
      talk: [
        { q: '大石头是怎么挡住路的？谁先来帮忙，谁最后来？',
          a: '这是在练按先后把一件事讲下来。他讲乱了不用纠正，翻着绘本一页一页再讲一遍。' },
        { q: '大家一起推都推不动，为什么阿土一来就行了？',
          a: '等他说出“因为阿土有大铲子”。再接着问：要是阿土没有来，还有什么办法？这一问没有标准答案，越奇怪越好。' },
        { q: '你有没有一个人做不了、要请别人帮忙的事？你会怎么说？',
          a: '帮他把话说完整，比如“请帮帮我，我够不着”。' }
      ],
      play: [
        { t: '什么会滚', aim: '先猜，再试',
          how: '找几样东西：球、积木、瓶子、书、玩具车。用书或枕头搭一个小斜坡。每样东西先让他猜会不会滚下去，再放上去试。试完问他：为什么这个会滚，那个不会？' },
        { t: '玩具车排队', aim: '找规律，比多少，轮流',
          how: '用玩具车或积木排“红、蓝、红、蓝”，请他接着排。再换他出题，你来接。排完分成两堆，比一比哪堆多，多几个。' }
      ],
      watch: [
        '得一颗星和三颗星，他在不在意？有没有因为星星少不高兴，或者只挑简单的玩？',
        '轮到你出题、你来排的时候：他肯不肯等？',
        '说“为什么”的时候：他会不会自己用“因为”？'
      ]
    }
  });

  /* ---------- 故事和回忆题（写法见 app/engines/story.js 开头） ---------- */
  const story = CE.addStory('story-2', {
    title: '大石头挡路了',
    chars: ['石', '上', '下', '来', '去'],
    pages: [
      { bg: 'mountain', t: '早上，大山要把石头运到山上去。', hi: ['石', '上', '去'],
        sp: [{ k: 'dashan', x: 190, y: 405, s: 1.2, load: 5, anim: 'in', dx: -420 }] },
      { bg: 'site', t: '一、二、三、四、五！大山装了五块石头。', hi: ['石'],
        sp: [{ k: 'dashan', x: 400, y: 410, s: 1.9, load: 5, nums: true }] },
      { bg: 'mountain', t: '大山往山上开。上坡好累呀！', hi: ['上'],
        sp: [{ k: 'dashan', x: 500, y: 279, s: 1.15, rot: -25, load: 5, mood: 'effort', anim: 'shake' }] },
      { bg: 'mountain', t: '哎呀！一块大石头滚下来了！', hi: ['下', '石'],
        sp: [{ k: 'dashan', x: 640, y: 213, s: 1.0, rot: -25, load: 4, mood: 'wow' },
             { k: 'stone', x: 330, y: 405, s: 1.0, anim: 'in', dx: 240, dy: -150, spin: true, slow: true }] },
      { bg: 'mountain', t: '大石头停在路中间，把路挡住了。', hi: ['石'],
        sp: [{ k: 'dashan', x: 640, y: 213, s: 1.0, rot: -25, load: 4, mood: 'sad' }, { k: 'stone', x: 330, y: 405, s: 1.3 }] },
      { bg: 'mountain', t: '小风来了。他推呀推，石头一动也不动。', hi: ['来', '石'],
        sp: [{ k: 'stone', x: 400, y: 405, s: 1.3 }, { k: 'xiaofeng', x: 215, y: 405, s: 1.0, mood: 'effort', anim: 'push' }] },
      { bg: 'mountain', t: '小火来了，小水也来了。大家一起推，还是推不动。', hi: ['来'],
        sp: [{ k: 'stone', x: 590, y: 405, s: 1.3 }, { k: 'xiaoshui', x: 95, y: 405, s: 0.72, mood: 'effort', anim: 'push' },
             { k: 'xiaohuo', x: 265, y: 405, s: 0.72, mood: 'effort', anim: 'push' }, { k: 'xiaofeng', x: 435, y: 405, s: 0.72, mood: 'effort', anim: 'push' }] },
      { bg: 'mountain', t: '阿土来了。“看我的！”他用大铲子把石头铲了起来。', hi: ['来', '石'],
        sp: [{ k: 'stone', x: 452, y: 352, s: 0.8, anim: 'bob' }, { k: 'atu', x: 300, y: 405, s: 1.5, anim: 'bob' }] },
      { bg: 'site', t: '石头回到了大山的车上。“谢谢大家！”', hi: ['石', '大', '山'],
        sp: [{ k: 'xiaofeng', x: 100, y: 410, s: 0.7 }, { k: 'dashan', x: 390, y: 410, s: 1.6, load: 5, anim: 'bob' },
             { k: 'atu', x: 690, y: 410, s: 0.78, flip: true }] },
      { bg: 'mountain', t: '路通了！大山上山去，小风下山去。明天见！', hi: ['上', '下', '去'],
        sp: [{ k: 'dashan', x: 600, y: 232, s: 1.0, rot: -25, load: 5 }, { k: 'xiaofeng', x: 170, y: 405, s: 1.0, flip: true, anim: 'bob' }] }
    ],
    quiz: [
      { q: '大山要把什么运到山上去？', prop: ['drop', 'stone', 'flame'], ans: 'stone' },
      { q: '大山装了几块石头？', num: [3, 5, 8], ans: 5 },
      { q: '谁第一个来帮忙？', who: ['xiaohuo', 'xiaofeng', 'atu'], ans: 'xiaofeng' },
      { q: '最后是谁把大石头铲起来的？', who: ['atu', 'xiaoshui', 'xiaofeng'], ans: 'atu' }
    ]
  });
  def('story-2', { cat: 'story', title: '大石头挡路了', icon: '📖', sub: '第 2 周故事', run: api => CE.Story.run(api, story) });
  def('story-2-quiz', { cat: 'story', title: '故事问答：石头', icon: '❓', sub: '回忆故事的经过', run: api => CE.Story.quiz(api, story) });

  /* ---------- 屏幕：这一周新教的字和词。反复出现的练习在 content/library/ 里 ---------- */
  def('learn-zh-w2', { cat: 'zh', title: '认字：石 上 下 来 去', icon: '字', sub: '第 2 周故事里的字', run: api => L.learnZh(api, ['石', '上', '下', '来', '去']) });
  def('en-numbers', { cat: 'en', title: 'one to five', icon: 'ABC', sub: '数字 1–5 的英语', run: api => L.enLesson(api, ['one', 'two', 'three', 'four', 'five']) });

  /* ---------- 纸：这一周自己的打印材料。id 要写进上面的 prints，家长才能按周一次打印 ---------- */
  Pr.add('故事绘本', 'book-2', '绘本：大石头挡路了（6 页纸）', () => Pr.book(story, 2));
  Pr.add('写字描红', 'trace-w2', '描红：石 上 下 来 去', () => Pr.trace('描红 · 第 2 周的字', story.chars));
  Pr.add('数学练习', 'count-2', '比多少，接着写', () => Pr.compare([[3, 5], [6, 4], [2, 6], [5, 6]], [1, 2, 3, 0, 0, 6, 0, 8, 0, 10]));
  Pr.add('英语卡片', 'cards-en-2', '卡片：green one two three four five', () => Pr.cards(['green', 'one', 'two', 'three', 'four', 'five']));
})(window.CE);
