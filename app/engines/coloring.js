/* 涂色：以纸为主（C.paper 把孩子交给纸），屏幕上涂（C.run）只是没有打印时的备用。 */
(function (CE) {
  'use strict';
  const U = CE.U, A = CE.Art;

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
})(window.CE);
