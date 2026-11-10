/* 停车场：让正好 N 辆车开进去。
   能背着数到 49 不等于理解“7 就是七个东西”，这个游戏检查的就是后者。 */
(function (CE) {
  'use strict';
  const U = CE.U, A = CE.Art;
  const COLORS = ['#3b8beb', '#ef5350', '#ffca3a', '#43b66b', '#9b6bdf', '#ff8a3d', '#29b6f6', '#f06aa6'];
  const G = CE.GiveN = {};

  function round(api, n) {
    return new Promise(resolve => {
      const total = Math.min(16, n + U.rand(3, 5));
      let wrong = 0, locked = false;
      api.host.innerHTML =
        `<div class="given">` +
          `<div class="q-prompt gn-head"><span class="gn-num">${n}</span><div class="q-text">让 ${n} 辆车开进停车场</div></div>` +
          `<div class="gn-lot" aria-label="停车场"></div>` +
          `<div class="gn-street">` +
            U.range(1, total).map(i =>
              `<button class="gn-car" aria-label="车">${A.v('car', { color: COLORS[i % COLORS.length] })}</button>`).join('') +
          `</div>` +
          `<div class="gn-foot"><button class="btn check">停好了 ✓</button></div>` +
        `</div>`;
      const lot = U.$('.gn-lot', api.host), street = U.$('.gn-street', api.host), check = U.$('.check', api.host);
      const say = () => CE.Speech.say(`请让${n}辆车开进停车场。数好了，就点“停好了”。`);
      api.replay(say);
      api.onClose = () => resolve(null);

      const tag = () => {
        if (!CE.TEST) return;
        U.$$('[data-tn]', api.host).forEach(e => e.removeAttribute('data-tn'));
        if (lot.children.length < n) street.firstElementChild.dataset.tn = '1';
        else check.dataset.tn = '1';
      };
      U.$$('.gn-car', api.host).forEach(car => car.addEventListener('click', () => {
        if (locked) return;
        CE.Sfx.tap();
        (car.parentNode === street ? lot : street).appendChild(car);
        tag();
      }));
      check.addEventListener('click', async () => {
        if (locked) return;
        const have = lot.children.length;
        if (have === n) {
          locked = true;
          CE.Sfx.ok();
          CE.Store.mark('give:' + n, wrong === 0);
          Array.from(lot.children).forEach((c, i) => { c.style.animationDelay = (i * 0.12) + 's'; c.classList.add('counted'); });
          await CE.Speech.say(`${n}辆车，停好了！`);
          await U.wait(400);
          if (!api.closed) resolve(wrong === 0);
        } else {
          wrong++;
          CE.Sfx.no();
          CE.Speech.say(`现在有${have}辆。我们要${n}辆。` + (have > n ? '太多了，请开走几辆。' : '还不够，再开进来几辆。'));
        }
      });
      tag();
      say();
    });
  }

  G.run = async function (api, targets) {
    let ok = 0;
    for (let i = 0; i < targets.length; i++) {
      if (api.closed) return null;
      api.progress(i, targets.length);
      const r = await round(api, targets[i]);
      if (r === null) return null;
      if (r) ok++;
    }
    api.progress(targets.length, targets.length);
    return { score: ok, total: targets.length };
  };
})(window.CE);
