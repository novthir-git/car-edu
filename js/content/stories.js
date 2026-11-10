/* 故事。每页一两句话，配一幅场景。
   bg 背景；sp 画面里的角色和道具（x,y 是底边中点，画布 800x450）；
   t 正文；hi 本页要突出的字（可点读）。
   quiz 是讲完故事之后的回忆题。 */
(function (CE) {
  'use strict';
  CE.STORIES = {
    'story-1': {
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
    },

    'story-2': {
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
    }
  };
})(window.CE);
