/* 英语词库。每个词：w 单词，zh 中文，type 决定配图怎么画（车、色块、数字）。
   新词先加到这里，再在各周的文件里用 CE.Lib.enLesson 编成一课。 */
(function (CE) {
  'use strict';
  const A = CE.Art;

  const EN = CE.EN = {
    car: { w: 'car', zh: '小汽车', type: 'veh' }, bus: { w: 'bus', zh: '公共汽车', type: 'veh' }, truck: { w: 'truck', zh: '卡车', type: 'veh' },
    red: { w: 'red', zh: '红色', type: 'color', color: '#ef5350' }, blue: { w: 'blue', zh: '蓝色', type: 'color', color: '#3b8beb' },
    yellow: { w: 'yellow', zh: '黄色', type: 'color', color: '#ffca3a' }, green: { w: 'green', zh: '绿色', type: 'color', color: '#43b66b' },
    one: { w: 'one', zh: '一', type: 'num', n: 1 }, two: { w: 'two', zh: '二', type: 'num', n: 2 }, three: { w: 'three', zh: '三', type: 'num', n: 3 },
    four: { w: 'four', zh: '四', type: 'num', n: 4 }, five: { w: 'five', zh: '五', type: 'num', n: 5 }
  };
  const enPic = k => {
    const e = EN[k];
    if (e.type === 'veh') return A.v(k);
    if (e.type === 'color') return `<span class="blob" style="background:${e.color}"></span>`;
    return `<span class="num">${e.n}</span>`;
  };
  CE.enPic = enPic;
})(window.CE);
