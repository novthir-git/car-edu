/* 想得清 · 逻辑。现在只有找规律；以后按分类、排序、对应、空间、简单推理轮着加，每周固定用一项。
   找规律不只是接下一个：答对以后，把一直重复的那一组框出来，说出“几辆一组，一直重复”。
   规律的要紧处是那个重复的单元，看出单元，才会自己编规律（家长那页的“玩具车排队”就是让他自己编）。 */
(function (CE) {
  'use strict';
  const U = CE.U, A = CE.Art, Q = CE.Quiz, S = CE.Store, def = CE.def;

  def('pattern', {
    cat: 'logic', title: '找规律', icon: '🧩', leveled: 2, sub: '接着排：AB → AAB、ABB、ABC。答对以后把重复的那一组框出来',
    run: api => Q.run(api, {
      rounds: 6, make: () => {
        const units = U.shuffle([{ kind: 'car', color: '#ef5350', name: '红车' }, { kind: 'bus', color: '#ffca3a', name: '黄车' }, { kind: 'truck', color: '#3b8beb', name: '蓝车' }]);
        const pat = S.lv('pattern') > 1 ? U.pick([[0, 0, 1], [0, 1, 1], [0, 1, 2]]) : [0, 1];
        const len = pat.length === 2 ? 5 : 6;
        const draw = u => A.v(units[u].kind, { color: units[u].color });
        // 答对以后：补上那一辆，每一组用底色框起来
        const full = U.range(0, len).map(i => pat[i % pat.length]), groups = [];
        for (let i = 0; i < full.length; i += pat.length) groups.push(full.slice(i, i + pat.length));
        const unit = pat.map(u => units[u].name).join('、');
        return {
          say: '找规律：接下来是哪一辆车？', text: '找规律：接下来是哪一辆车？', cls: 'has-visual',
          visual: `<div class="pat">${U.range(0, len - 1).map(i => draw(pat[i % pat.length])).join('')}<span class="sign gap">?</span></div>`,
          reveal: `<div class="pat solved">${groups.map((g, i) => `<span class="pu ${i % 2 ? 'b' : 'a'}">${g.map(draw).join('')}</span>`).join('')}</div>`,
          opts: U.shuffle([0, 1, 2]).map(u => ({ k: String(u), html: draw(u) })), ans: String(pat[len % pat.length]),
          optCls: 'pic', item: 'pat', hint: '从头看：哪几辆是一组，一直在重复？',
          after: `对！${unit}，${unit}……${pat.length === 2 ? '两' : '三'}辆一组，一直重复。`
        };
      }
    })
  });
})(window.CE);
