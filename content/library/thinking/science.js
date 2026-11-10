/* 想得清 · 科学：先动手试，再说出看到了什么。 */
(function (CE) {
  'use strict';
  const def = CE.def;

  def('wheel-lab', { cat: 'sci', title: '轮子实验室', icon: '🔬', sub: '试试圆、方、三角三种轮子', run: api => CE.Wheel.run(api) });
})(window.CE);
