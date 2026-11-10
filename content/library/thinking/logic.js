/* 想得清 · 逻辑。现在只有找规律；以后按分类、排序、对应、空间、简单推理轮着加，每周固定用一项。 */
(function (CE) {
  'use strict';
  const U = CE.U, A = CE.Art, Q = CE.Quiz, S = CE.Store, def = CE.def;

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
})(window.CE);
