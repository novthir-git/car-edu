/* 红绿灯：看亮的是什么灯，决定小风走还是停。 */
(function (CE) {
  'use strict';
  const U = CE.U, A = CE.Art;

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
})(window.CE);
