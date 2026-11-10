/* 手上稳 · 涂色。每个角色一张涂色纸，屏幕上的活动只负责让孩子去拿纸和蜡笔。 */
(function (CE) {
  'use strict';
  const A = CE.Art, def = CE.def, Pr = CE.Print;

  // 活动和打印页用同一个 id
  Object.keys(A.CHARS).forEach(k => {
    const name = A.CHARS[k].name;
    def('color-' + k, { cat: 'art', title: '给' + name + '涂色', icon: '🖍️', sub: '在纸上涂，练握笔和控笔', run: api => CE.Coloring.paper(api, k) });
    Pr.add('涂色画画', 'color-' + k, '涂色：' + name, () => Pr.coloring(k));
  });
  // 列车：他也喜欢列车。还没有编进故事，先有一张涂色纸
  Pr.add('涂色画画', 'color-train', '涂色：列车', () => Pr.coloringKind('train', '列车', '呜——列车开来了！'));
})(window.CE);
