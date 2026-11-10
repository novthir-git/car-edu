/* 手上稳 · 控笔和写数字。都是纸，没有屏幕上的活动。每周新字的描红在各周自己的文件里。 */
(function (CE) {
  'use strict';
  const Pr = CE.Print;

  Pr.add('写字描红', 'pen-roads', '控笔：沿着马路开车', Pr.roads);
  Pr.add('写字描红', 'trace-num', '写数字 1–10（2 页纸）', Pr.traceNum);
})(window.CE);
