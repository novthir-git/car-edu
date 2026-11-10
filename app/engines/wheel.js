/* 轮子实验室：圆、方、三角三种轮子都试一遍，再回答哪一种跑得最稳。 */
(function (CE) {
  'use strict';
  const U = CE.U, A = CE.Art;

  const W = CE.Wheel = {};
  const R = 22;                               // 轮子半径（车身坐标）
  const SIDES = { circle: 0, square: 4, tri: 3 };
  const TALK = {
    circle: '圆轮子，跑得又快又稳！',
    square: '方轮子，咯噔咯噔，好颠呀！',
    tri: '三角轮子，一跳一跳，跑不动！'
  };
  const INK = '#2b2b3a';

  function wheelShape(shape) {
    const st = `fill="#3a3a4a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"`;
    const hub = `<circle r="${R * 0.4}" fill="#e3e9f0" stroke="${INK}" stroke-width="2"/><path d="M${-R * 0.4} 0H${R * 0.4}" stroke="${INK}" stroke-width="2"/>`;
    const n = SIDES[shape];
    if (!n) return `<circle r="${R}" ${st}/>` + hub;
    // 多边形：初始时一条边贴地
    const start = Math.PI / 2 - Math.PI / n, pts = [];
    for (let i = 0; i < n; i++) {
      const a = start + i * 2 * Math.PI / n;
      pts.push((R * Math.cos(a)).toFixed(2) + ',' + (R * Math.sin(a)).toFixed(2));
    }
    return `<polygon points="${pts.join(' ')}" ${st}/>` + hub;
  }
  W.icon = shape => `<svg class="wl-ic" viewBox="-30 -30 60 60" aria-hidden="true">${wheelShape(shape)}</svg>`;

  // 轮心离地高度：多边形滚动时，轮心会随着棱角一上一下，这就是“颠”的来源
  function height(shape, theta) {
    const n = SIDES[shape];
    if (!n) return R;
    const step = 2 * Math.PI / n;
    const phi = ((theta % step) + step) % step;
    return R * Math.cos(Math.PI / n - phi);
  }

  W.run = function (api) {
    return new Promise(resolve => {
      const tried = {};
      let raf = 0, running = false;
      api.host.innerHTML =
        `<div class="wheel-lab">` +
          `<div class="story-stage wl-stage">` +
            `<svg class="scene" viewBox="0 0 800 300" preserveAspectRatio="xMidYMax meet">` +
              `<rect x="-1200" y="-1500" width="3200" height="1760" fill="#bfe8ff"/>` +
              `<rect x="-1200" y="256" width="3200" height="600" fill="#6a707c"/><rect x="-1200" y="256" width="3200" height="5" fill="${INK}" opacity=".35"/>` +
              `<g class="wl-car"></g>` +
            `</svg>` +
          `</div>` +
          `<div class="q-text">点一点下面的轮子，看看小车怎么跑。</div>` +
          `<div class="wl-btns">` +
            ['circle', 'square', 'tri'].map(s => `<button class="opt wl-opt" data-s="${s}">${W.icon(s)}</button>`).join('') +
          `</div>` +
        `</div>`;
      const car = U.$('.wl-car', api.host);
      const S = 1.1, GROUND = 256, START = 160;

      const draw = (shape, x, theta, mood) => {
        const h = height(shape, theta), deg = theta * 180 / Math.PI;
        const w = cx => `<g transform="translate(${cx},${136 - h}) rotate(${deg})">${wheelShape(shape)}</g>`;
        car.setAttribute('transform', `translate(${x - 120 * S},${GROUND - 136 * S}) scale(${S})`);
        car.innerHTML = `<g transform="translate(0,${18 - h})">${A.vehicle('car', { noWheels: true, mood: mood })}</g>` + w(66) + w(176);
      };
      draw('circle', START, 0, 'happy');

      const intro = () => CE.Speech.say('轮子为什么是圆的？点一点下面的轮子，看看小车怎么跑。');
      api.replay(intro);
      api.onClose = () => { cancelAnimationFrame(raf); resolve(null); };

      const tag = () => {
        if (!CE.TEST) return;
        U.$$('[data-tn]', api.host).forEach(e => e.removeAttribute('data-tn'));
        const next = ['circle', 'square', 'tri'].find(s => !tried[s]);
        if (next) U.$(`.wl-opt[data-s="${next}"]`, api.host).dataset.tn = '1';
      };

      const question = async () => {
        const r = await CE.Quiz.ask(api, {
          say: '哪一种轮子，跑得最稳？', text: '哪一种轮子跑得最稳？',
          opts: ['square', 'circle', 'tri'].map(s => ({ k: s, html: W.icon(s) })), ans: 'circle', optCls: 'pic',
          item: 'sci:wheel', after: '对！圆圆的轮子最会滚。大石头也是圆的，所以会滚下山。'
        });
        if (r === null) return;
        resolve({ score: r ? 1 : 0, total: 1, stars: r ? 3 : 2 });
      };

      const go = shape => {
        if (running) return;
        running = true;
        const n = SIDES[shape];
        const speed = n === 0 ? 250 : n === 4 ? 150 : 100;      // 每秒移动的距离（画布单位）
        const dur = CE.TEST ? 40 : (n === 0 ? 2000 : 3000);
        const mood = n === 0 ? 'happy' : n === 4 ? 'wow' : 'sad';
        const step = n ? 2 * Math.PI / n : 0;
        let last = -1;
        const t0 = performance.now();
        CE.Speech.say(TALK[shape]);
        const frame = now => {
          if (api.closed) return;
          const t = Math.min(1, (now - t0) / dur);
          const dist = speed * (dur / 1000) * t;
          const theta = dist / (R * S);
          if (n) {
            const k = Math.floor(theta / step);
            if (k !== last) { last = k; if (k > 0) CE.Sfx.bump(); }
          }
          draw(shape, START + dist, theta, mood);
          if (t < 1) { raf = requestAnimationFrame(frame); return; }
          running = false;
          tried[shape] = true;
          U.$(`.wl-opt[data-s="${shape}"]`, api.host).classList.add('tried');
          tag();
          if (tried.circle && tried.square && tried.tri) setTimeout(() => { if (!api.closed) question(); }, CE.TEST ? 0 : 1400);
        };
        raf = requestAnimationFrame(frame);
      };
      U.$$('.wl-opt', api.host).forEach(b => b.addEventListener('click', () => { CE.Sfx.tap(); go(b.dataset.s); }));
      tag();
      intro();
    });
  };
})(window.CE);
