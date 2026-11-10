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

  // 每个角色一个涂色游戏，再配一张同样线稿的打印涂色页
  Object.keys(A.CHARS).forEach(k => {
    const name = A.CHARS[k].name;
    def('color-' + k, { cat: 'art', title: '给' + name + '涂色', icon: '🎨', sub: '自由涂色，没有对错', run: api => CE.Coloring.run(api, k) });
    Pr.add('涂色画画', 'color-' + k, '涂色：' + name, () => Pr.coloring(k));
  });
  Pr.add('涂色画画', 'draw-car', '画一辆我自己的车', Pr.drawCar);
})(window.CE);
