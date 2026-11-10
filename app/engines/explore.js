/* 探索类活动：红绿灯（安全）、涂色（美术）、轮子实验室（科学）。 */
(function (CE) {
  'use strict';
  const U = CE.U, A = CE.Art;

  /* ================= 红绿灯 ================= */
  const T = CE.Traffic = {};
  const RULE = { red: '红灯亮了，要停下来。', yellow: '黄灯亮了，要等一等。', green: '绿灯亮了，可以走。' };

  T.run = async function (api) {
    const seq = U.shuffle(['red', 'green', 'red', 'green', 'yellow', 'green', 'red', 'yellow']);
    let ok = 0;
    for (let i = 0; i < seq.length; i++) {
      if (api.closed) return null;
      api.progress(i, seq.length);
      const r = await T.round(api, seq[i], i === 0);
      if (r === null) return null;
      if (r) ok++;
    }
    api.progress(seq.length, seq.length);
    return { score: ok, total: seq.length };
  };

  T.round = function (api, color, first) {
    return new Promise(resolve => {
      const want = color === 'green' ? 'go' : 'stop';
      let wrong = 0, locked = false;
      const scene = anim => A.scene('road', [
        { k: 'zebra', x: 560, y: 448 },
        { k: 'light', x: 660, y: 366, s: 0.9, on: color },
        Object.assign({ k: 'xiaofeng', x: 330, y: 405, s: 1.15 }, anim)
      ]);
      api.host.innerHTML =
        `<div class="traffic">` +
          `<div class="story-stage tl-stage">${scene({ anim: 'in', dx: -520 })}</div>` +
          `<div class="q-text">红灯停，绿灯行，黄灯等一等。小风应该走，还是停？</div>` +
          `<div class="tl-btns"><button class="btn tl-go" data-k="go">走 GO</button><button class="btn tl-stop" data-k="stop">停 STOP</button></div>` +
        `</div>`;
      const stage = U.$('.tl-stage', api.host);
      const ask = () => CE.Speech.say(first
        ? '红灯停，绿灯行，黄灯等一等。看一看，现在亮的是什么灯？小风应该走，还是停？'
        : '小风应该走，还是停？');
      api.replay(ask);
      api.onClose = () => resolve(null);
      U.$$('.tl-btns .btn', api.host).forEach(b => {
        if (CE.TEST && b.dataset.k === want) b.dataset.tn = '1';
        b.addEventListener('click', async () => {
          if (locked) return;
          if (b.dataset.k === want) {
            locked = true;
            CE.Sfx.ok();
            CE.Store.mark('tl:' + color, wrong === 0);
            if (want === 'go') {
              stage.innerHTML = scene({ anim: 'out', dx: 820 });
              await CE.Speech.say(['绿灯行！', { t: 'Go!', lang: 'en' }]);
            } else {
              stage.innerHTML = scene({ anim: 'bob' });
              await CE.Speech.say([color === 'red' ? '红灯停！' : '黄灯等一等！', { t: 'Stop!', lang: 'en' }]);
            }
            await U.wait(want === 'go' ? 500 : 300);
            if (!api.closed) resolve(wrong === 0);
          } else {
            wrong++;
            CE.Sfx.no();
            CE.Speech.say(RULE[color] + '再试一试。');
          }
        });
      });
      ask();
    });
  };

  /* ================= 涂色 ================= */
  const C = CE.Coloring = {};
  C.COLORS = ['#ef5350', '#ff8a3d', '#ffd23f', '#43b66b', '#4fc3f7', '#3b8beb', '#9b6bdf', '#f48fb1', '#a9744f', '#b8c2cc', '#3a3a4a', '#ffffff'];

  C.run = function (api, key) {
    return new Promise(resolve => {
      const who = A.CHARS[key];
      const saved = CE.Store.data.colors[key] || {};
      let cur = null;
      api.host.innerHTML =
        `<div class="coloring">` +
          `<div class="col-stage">${A.who(key, { line: true }, 'col-art')}</div>` +
          `<div class="col-palette">` +
            C.COLORS.map(c => `<button class="sw" data-c="${c}" style="background:${c}" aria-label="颜色"></button>`).join('') +
          `</div>` +
          `<div class="col-foot"><button class="btn done">画好了 ✓</button></div>` +
        `</div>`;
      const regions = U.$$('.rg', api.host), sws = U.$$('.sw', api.host), done = U.$('.done', api.host);
      regions.forEach(r => { if (saved[r.dataset.i]) r.setAttribute('fill', saved[r.dataset.i]); });
      const say = () => CE.Speech.say(`给${who.name}涂上你喜欢的颜色吧！先点颜色，再点车。`);
      api.replay(say);
      api.onClose = () => resolve(null);
      const tag = el => {
        if (!CE.TEST) return;
        U.$$('[data-tn]', api.host).forEach(e => e.removeAttribute('data-tn'));
        el.dataset.tn = '1';
      };
      const pick = b => {
        cur = b.dataset.c;
        sws.forEach(s => s.classList.toggle('on', s === b));
      };
      sws.forEach(b => b.addEventListener('click', () => { CE.Sfx.tap(); pick(b); tag(regions[0]); }));
      regions.forEach(r => r.addEventListener('click', () => {
        if (!cur) { CE.Speech.say('先点一个颜色。'); return; }
        CE.Sfx.tap();
        r.setAttribute('fill', cur);
        saved[r.dataset.i] = cur;
        CE.Store.data.colors[key] = saved;
        CE.Store.save();
        tag(done);
      }));
      done.addEventListener('click', async () => {
        if (!Object.keys(saved).length) { CE.Speech.say('先点一个颜色，再点一点车。'); return; }
        CE.Sfx.ok();
        await CE.Speech.say('真漂亮！');
        if (!api.closed) resolve({ score: 0, total: 0, stars: 3 });
      });
      pick(sws[0]);
      tag(sws[0]);
      say();
    });
  };

  /* 纸上涂色：涂色要练的是握笔和控笔，屏幕上点一下就填满，练不到。
     所以屏幕只负责把孩子交给纸——点一下蜡笔就结束，不用回来“交差”，也不弹星星。
     家里没有打印的纸时，可以改在屏幕上涂（C.run）。 */
  C.paper = function (api, key) {
    return new Promise(resolve => {
      const who = A.CHARS[key];
      api.host.innerHTML =
        `<div class="paper">` +
          `<div class="paper-sheet">${A.who(key, { line: true })}</div>` +
          `<p class="paper-say">拿出${who.name}的涂色纸，用蜡笔给它涂上颜色。</p>` +
          `<div class="paper-btns"><button class="btn crayon"><span>🖍️</span>去涂色</button>` +
            `<button class="btn sm plain">没有纸，在屏幕上涂</button></div>` +
          `<p class="paper-note">家长：涂色纸在“家长 → 打印”里，可以一周打印一次。</p>` +
        `</div>`;
      const say = () => CE.Speech.say(`这一样要用笔。请爸爸妈妈拿出${who.name}的涂色纸，你用蜡笔给它涂上颜色。准备好了，就点蜡笔。`);
      api.replay(say);
      api.onClose = () => resolve(null);
      const go = U.$('.crayon', api.host);
      if (CE.TEST) go.dataset.tn = '1';
      go.addEventListener('click', async () => {
        CE.Sfx.ok();
        await CE.Speech.say('去吧！慢慢涂，涂成什么样都可以。');
        if (!api.closed) resolve({ score: 0, total: 0, stars: 3, quiet: true });
      });
      U.$('.plain', api.host).addEventListener('click', () => {
        CE.Sfx.tap();
        CE.Speech.stop();
        C.run(api, key).then(resolve);
      });
      say();
    });
  };

  /* ================= 轮子实验室 ================= */
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
