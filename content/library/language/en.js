/* 说得出 · 英语练习。词从 en-words.js 的词库里取。
   CE.Lib.enLesson 留给各周的单词课用（见 content/k2/w01.js）。 */
(function (CE) {
  'use strict';
  const U = CE.U, A = CE.Art, Q = CE.Quiz, S = CE.Store, def = CE.def;
  const EN = CE.EN, enPic = CE.enPic;

  const enCard = k => ({
    cls: 'en-card', say: [{ t: EN[k].w, lang: 'en', gap: 400 }, { t: EN[k].zh, gap: 400 }, { t: EN[k].w, lang: 'en' }],
    html: `<span class="en-pic">${enPic(k)}</span><span class="en-word">${EN[k].w}</span><span class="en-zh">${EN[k].zh}</span>`
  });
  const listen = phrase => [{ t: '听一听，点一点：' }, { t: phrase, lang: 'en', gap: 600 }, { t: phrase, lang: 'en' }];

  // words 本次要学的词；pool 做题时的选项范围
  function enLesson(api, words, pool) {
    pool = pool || words;
    const fresh = words.filter(k => S.level('en:' + k) !== 'known');
    const targets = U.mix(words.concat(words).concat(U.sample(pool, 2))).slice(0, 8);
    const quiz = () => Q.run(api, {
      rounds: targets.length, make: i => {
        const k = targets[i];
        const others = U.sample(pool.filter(x => x !== k), 2);
        return {
          say: listen(EN[k].w), text: `Listen: ${EN[k].w}（${EN[k].zh}）`,
          opts: U.shuffle([k].concat(others)).map(x => ({ k: x, html: enPic(x) })), ans: k,
          optCls: EN[k].type === 'num' ? 'txt' : 'pic', item: 'en:' + k, after: [{ t: `Yes! ${EN[k].w}!`, lang: 'en' }]
        };
      }
    });
    if (!fresh.length) return quiz();
    return CE.Cards.run(api, fresh.map(enCard)).then(ok => (ok ? quiz() : null));
  }
  CE.Lib.enLesson = enLesson;

  // 颜色加车：a red bus。同时听懂两个词才能选对。
  def('en-phrases', {
    cat: 'en', title: 'a red car', icon: 'ABC', sub: '颜色 + 车的短语，新词 green',
    run: api => {
      const kinds = ['car', 'bus', 'truck'], colors = ['red', 'blue', 'yellow', 'green'];
      const quiz = () => Q.run(api, {
        rounds: 8, make: () => {
          const k = U.pick(kinds), c = U.pick(colors);
          const k2 = U.pick(kinds.filter(x => x !== k)), c2 = U.pick(colors.filter(x => x !== c));
          const phrase = `a ${c} ${k}`;
          const tile = (kk, cc) => ({ k: cc + '-' + kk, html: A.v(kk, { color: EN[cc].color }) });
          return {
            say: listen(phrase), text: `Listen: ${phrase}`,
            opts: U.shuffle([tile(k, c), tile(k, c2), tile(k2, c), tile(k2, c2)]), ans: c + '-' + k,
            optCls: 'pic', item: 'en:phrase', after: [{ t: `Yes! ${phrase}!`, lang: 'en' }]
          };
        }
      });
      if (S.level('en:green') === 'known') return quiz();
      return CE.Cards.run(api, [enCard('green')]).then(ok => (ok ? quiz() : null));
    }
  });
})(window.CE);
