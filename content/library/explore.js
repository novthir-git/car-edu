/* 基础课以外的探索：逻辑、交通安全、科学、美术。用来试探他还喜欢什么。 */
(function (CE) {
  'use strict';
  const U = CE.U, A = CE.Art, Q = CE.Quiz, S = CE.Store, def = CE.def, Pr = CE.Print;

  def('pattern', {
    cat: 'logic', title: '找规律', icon: '🧩', leveled: 2, sub: '接着排：AB → AAB、ABB、ABC',
    run: api => Q.run(api, {
      rounds: 6, make: () => {
        const units = U.shuffle([{ kind: 'car', color: '#ef5350' }, { kind: 'bus', color: '#ffca3a' }, { kind: 'truck', color: '#3b8beb' }]);
        const pat = S.lv('pattern') > 1 ? U.pick([[0, 0, 1], [0, 1, 1], [0, 1, 2]]) : [0, 1];
        const len = pat.length === 2 ? 5 : 6;
        const draw = u => A.v(units[u].kind, { color: units[u].color });
        return {
          say: '找规律：接下来是哪一辆车？', text: '找规律：接下来是哪一辆车？', cls: 'has-visual',
          visual: `<div class="pat">${U.range(0, len - 1).map(i => draw(pat[i % pat.length])).join('')}<span class="sign gap">?</span></div>`,
          opts: U.shuffle([0, 1, 2]).map(u => ({ k: String(u), html: draw(u) })), ans: String(pat[len % pat.length]),
          optCls: 'pic', item: 'pat'
        };
      }
    })
  });

  def('traffic', { cat: 'safety', title: '红绿灯', icon: '🚦', sub: '红灯停，绿灯行，黄灯等一等', run: api => CE.Traffic.run(api) });
  def('wheel-lab', { cat: 'sci', title: '轮子实验室', icon: '🔬', sub: '试试圆、方、三角三种轮子', run: api => CE.Wheel.run(api) });

  // 涂色以纸为主：每个角色一张打印的涂色页，屏幕上的活动只是让孩子去拿纸和笔。
  // 活动和打印页用同一个 id。
  Object.keys(A.CHARS).forEach(k => {
    const name = A.CHARS[k].name;
    def('color-' + k, { cat: 'art', title: '给' + name + '涂色', icon: '🖍️', sub: '在纸上涂，练握笔和控笔', run: api => CE.Coloring.paper(api, k) });
    Pr.add('涂色画画', 'color-' + k, '涂色：' + name, () => Pr.coloring(k));
  });
  // 列车：他也喜欢列车。还没有编进故事，先有一张涂色纸
  Pr.add('涂色画画', 'color-train', '涂色：列车', () => Pr.coloringKind('train', '列车', '呜——列车开来了！'));
  Pr.add('涂色画画', 'draw-car', '画一辆我自己的车', Pr.drawCar);
  Pr.add('写字描红', 'pen-roads', '控笔：沿着马路开车', Pr.roads);
})(window.CE);
