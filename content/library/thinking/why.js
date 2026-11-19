/* 想得清 · 问为什么：他挑一个想知道的，小风讲给他听（玩法见 app/engines/why.js）。
   怎么讲：
   - 站在他那边讲。拿他自己的身体和见过的事来比（饿了没力气、推箱子好费劲、手指按沙子），不讲术语；
     要用的新词（履带、空气）先说它是什么样子的，再说名字。
   - 讲真的道理，讲浅不讲错。说不清楚的地方宁可少说一句，也不编一个好听的说法。
   - 一页一两句，最后留一件在家能试的事：屏幕讲完了，道理要他自己用手试出来才是他的。
   - 题目跟着已经开放的周：现在是第 1、2 周的车、风、火、水、石头、轮子。
     他自己问出来的为什么（家长记在观察笔记里），做下一批时优先做。不一次做很多。 */
(function (CE) {
  'use strict';
  const A = CE.Art;
  const car = (k, x, o) => Object.assign({ k: k, x: x, y: 410 }, o || {});

  const WHYS = CE.WHYS = [
    {
      k: 'wheel', q: '车为什么有轮子？', pic: () => CE.Wheel.icon('circle'),
      pages: [
        { bg: 'road', sp: [car('xiaofeng', 400, { s: 1.2, anim: 'bob' })] },
        { bg: 'road', t: '大箱子贴着地，推起来好费劲，只能一点一点地蹭。',
          sp: [{ k: 'box', x: 470, y: 410, s: 1.3 }, car('xiaofeng', 300, { mood: 'effort', anim: 'push' })] },
        { bg: 'road', t: '给箱子装上轮子，轻轻一推，它就骨碌骨碌滚起来了。',
          sp: [{ k: 'box', x: 560, y: 410, s: 1.3, wheels: true, anim: 'in', dx: -260 }, car('xiaofeng', 370, { anim: 'in', dx: -260 })] },
        { bg: 'road', t: '滚着走，比贴着地拖着走轻松多了。所以车都有轮子。',
          sp: [car('xiaofeng', 420, { s: 1.2, anim: 'in', dx: -500 })] }
      ],
      try: '在桌上推一本书。再在书下面垫几支圆铅笔，推一推。哪一次更轻松？'
    },
    {
      k: 'fuel', q: '车为什么要加油？', pic: () => A.prop('pump'),
      pages: [
        { bg: 'town', sp: [{ k: 'pump', x: 560, y: 400, s: 1.3 }, car('xiaofeng', 330, { y: 420 })] },
        { bg: 'road', t: '你跑了好久，肚子饿了，是不是就跑不动了？', sp: [car('xiaofeng', 400, { s: 1.2, mood: 'sad' })] },
        { bg: 'town', t: '车也一样。车跑起来要力气，力气是从油里来的。',
          sp: [{ k: 'pump', x: 560, y: 400, s: 1.3 }, car('xiaofeng', 330, { y: 420, mood: 'happy', anim: 'bob' })] },
        { bg: 'road', t: '油用完了，车就停下来；加满了油，又能跑了。还有的车不喝油，喝电，要去充电。',
          sp: [car('xiaofeng', 420, { s: 1.2, anim: 'in', dx: -500 })] }
      ],
      try: '下次坐车去加油或者充电的时候，看一看：油和电是从哪里进到车里去的？'
    },
    {
      k: 'red', q: '消防车为什么是红色的？', pic: () => A.who('xiaohuo'),
      pages: [
        { bg: 'town', sp: [car('xiaohuo', 400, { y: 428, s: 1.2, anim: 'bob' })] },
        { bg: 'road', t: '你看，路上有好多车。你一眼先看见了谁？',
          sp: [car('car', 135, { s: 0.7, color: '#9aa3ad' }), car('xiaohuo', 400, { s: 0.7 }), car('bus', 665, { s: 0.7, color: '#b8c2cc' })] },
        { bg: 'road', t: '红色特别显眼，老远老远就能看见。', sp: [car('xiaohuo', 400, { s: 1.3, anim: 'bob' })] },
        { bg: 'road', t: '消防车要赶去救火。大家一看见红红的它，就知道要让路。它还会“呜——呜——”地叫，看不见也能听见。',
          sp: [car('car', 660, { y: 392, s: 0.6, color: '#9aa3ad' }), car('xiaohuo', 330, { s: 1.0, anim: 'in', dx: -500 })] }
      ],
      try: '出门的时候玩一个游戏：看谁先找到一样红色的东西。'
    },
    {
      k: 'water', q: '水为什么能把火浇灭？', pic: () => A.prop('drop'),
      pages: [
        { bg: 'town', sp: [{ k: 'flame', x: 560, y: 410, s: 1.4, anim: 'bob' }, car('xiaohuo', 250, { mood: 'wow' })] },
        { bg: 'road', t: '火要烧起来，要热热的，还要有空气。', sp: [{ k: 'flame', x: 400, y: 410, s: 2.0, anim: 'bob' }] },
        { bg: 'road', t: '水凉凉的。浇上去，烧着的东西就凉下来了。',
          sp: [{ k: 'flame', x: 600, y: 410, s: 1.2 }, { k: 'spray', x: 330, y: 320, s: 1.0 }, car('xiaohuo', 210, { mood: 'effort' })] },
        { bg: 'road', t: '水还把火盖住，空气进不去。又凉，又没有空气，火就灭了。',
          sp: [{ k: 'drop', x: 560, y: 410, s: 0.8, anim: 'bob' }, car('xiaohuo', 300, { anim: 'bob' })] },
        { bg: 'town', t: '火很危险。小朋友不玩火，看见着火了，快告诉大人。', sp: [car('xiaohuo', 400, { y: 428, s: 1.1 })] }
      ],
      try: '请大人点一根小蜡烛，用玻璃杯把它罩住。看一看，火会怎么样？要大人来做哦。'
    },
    {
      k: 'wind', q: '风为什么看不见？', pic: () => A.prop('pinwheel'),
      pages: [
        { bg: 'road', sp: [{ k: 'wind', x: 180, y: 300, s: 1.2 }, car('xiaofeng', 480, { s: 1.1, anim: 'bob' })] },
        { bg: 'road', t: '我们身边到处都是空气。空气是透明的，看不见，也摸不着。', sp: [car('xiaofeng', 400, { s: 1.1, mood: 'wow' })] },
        { bg: 'road', t: '空气跑起来，就是风。', sp: [{ k: 'wind', x: 300, y: 290, s: 1.4, anim: 'in', dx: -500 }] },
        { bg: 'road', t: '风看不见，可是风车被它吹得呼呼转，树叶也沙沙响。看见这些，就知道风来了。',
          sp: [{ k: 'pinwheel', x: 260, y: 400, s: 1.8 }, { k: 'pinwheel', x: 540, y: 400, s: 1.8 }] }
      ],
      try: '对着手心呼一口气，感觉到了吗？这就是一点点风。再用扇子扇一扇小纸片。'
    },
    {
      k: 'roll', q: '石头为什么会滚下山？', pic: () => A.prop('stone'),
      pages: [
        { bg: 'mountain', sp: [{ k: 'stone', x: 600, y: 238, s: 0.9 }] },
        { bg: 'mountain', t: '山是斜斜的，一边高，一边低。', sp: [car('xiaofeng', 130, { y: 405, s: 0.8, mood: 'wow' })] },
        { bg: 'mountain', t: '圆圆的石头在斜坡上站不住，就骨碌骨碌，往低的地方滚。',
          sp: [{ k: 'stone', x: 330, y: 405, s: 1.0, anim: 'in', dx: 240, dy: -150, spin: true, slow: true }] },
        { bg: 'road', t: '滚到平平的地上，没有坡了，它就慢慢停下来。',
          sp: [{ k: 'stone', x: 520, y: 410, s: 1.1 }, car('xiaofeng', 250, { mood: 'happy' })] }
      ],
      try: '用书搭一个小斜坡，放一个球，再放一块积木。谁滚下去了？'
    },
    {
      k: 'wheels', q: '大卡车为什么有那么多轮子？', pic: () => A.who('dashan', { load: 5 }),
      pages: [
        { bg: 'site', sp: [car('dashan', 400, { s: 1.6, load: 5, anim: 'bob' })] },
        { bg: 'site', t: '大山要运好重好重的石头。', sp: [car('dashan', 400, { s: 1.6, load: 5, mood: 'effort' })] },
        { bg: 'site', t: '一个人搬大箱子，好累呀。好多人一起搬，每个人就轻松了。',
          sp: [{ k: 'box', x: 400, y: 410, s: 1.3 }, car('xiaofeng', 205, { s: 0.75, mood: 'effort', anim: 'push' }),
            car('xiaoshui', 595, { s: 0.75, flip: true, mood: 'effort', anim: 'push' })] },
        { bg: 'site', t: '轮子也一样。轮子多，大家一起分着扛，每个轮子都不太累，路也不会被压坏。',
          sp: [car('dashan', 400, { s: 1.6, load: 5, anim: 'bob' })] }
      ],
      try: '在路上数一数：小汽车有几个轮子？大卡车有几个？'
    },
    {
      k: 'track', q: '阿土为什么不用轮子？', pic: () => A.who('atu'),
      pages: [
        { bg: 'site', sp: [car('atu', 400, { s: 1.5, anim: 'bob' })] },
        { bg: 'site', t: '阿土常常在软软的泥地里干活。', sp: [{ k: 'dirt', x: 560, y: 410, s: 1.2 }, car('atu', 280, { s: 1.1 })] },
        { bg: 'site', t: '你用一根手指按沙子，一下就陷进去了；用整个手掌按，就不太陷。', sp: [car('atu', 400, { s: 1.3, mood: 'wow' })] },
        { bg: 'site', t: '阿土脚下这一圈长长的带子，叫履带。它又宽又长，像一只大手掌，在泥地里也不会陷下去。',
          sp: [car('atu', 400, { s: 1.6, anim: 'bob' })] }
      ],
      try: '在沙子或者橡皮泥上，用一根手指按一按，再用整个手掌按一按。哪个陷得深？'
    }
  ];

  CE.def('why', {
    cat: 'sci', title: '问为什么', icon: '❓', sub: '他挑一个想知道的，小风用他听得懂的话讲，最后留一件在家试一试的事',
    run: api => CE.Why.run(api, WHYS)
  });
})(window.CE);
