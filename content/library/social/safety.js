/* 处得来 · 安全和规则。 */
(function (CE) {
  'use strict';
  const def = CE.def;

  def('traffic', { cat: 'safety', title: '红绿灯', icon: '🚦', sub: '红灯停，绿灯行，黄灯等一等', run: api => CE.Traffic.run(api) });
})(window.CE);
