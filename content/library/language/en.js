/* 说得出 · 英语练习。词从 en-words.js 的词库里取。
   CE.Lib.enLesson 留给各周的单词课用（见 content/k2/w01.js）。
   不背单词表（见 docs/learning.md）：
     - 新词先“见一见”：看图听英语，读出来的只有英语，不夹中文翻译（中文只写在屏幕上给家长看）。
       数字词对着数量（three 是三辆车），不只对着阿拉伯数字
     - 练的时候词放在一句话里：Where is the bus? / Find the red one. / Show me three cars.
       点对了，车会开走。听懂一句话，就能让一件事发生
     - 答错一次才用中文提示一下 */
(function (CE) {
  'use strict';
  const U = CE.U, A = CE.Art, Q = CE.Quiz, S = CE.Store, def = CE.def;
  const EN = CE.EN;
  const en = t => ({ t: t, lang: 'en' });
  const cap = w => w[0].toUpperCase() + w.slice(1);

  // 词的意思：车画车，颜色画一辆这个颜色的车，数字画这么多辆车
  const group = n => `<span class="en-cars">${U.range(1, n).map(() => A.v('car', { color: '#3b8beb' })).join('')}</span>`;
  const meetPic = k => {
    const e = EN[k];
    if (e.type === 'veh') return A.v(k);
    if (e.type === 'color') return A.v('car', { color: e.color });
    return group(e.n) + `<span class="num">${e.n}</span>`;
  };
  const MEET = {
    veh: e => [en(`Look! A ${e.w}.`), Object.assign(en(`${cap(e.w)}!`), { gap: 300 }), en(`A ${e.w}.`)],
    color: e => [en(`Look! ${cap(e.w)}!`), en(`A ${e.w} car.`)],
    num: e => [en(`${cap(e.w)}!`)].concat(e.n === 1 ? [en('One car.')]
      : [en(U.range(1, e.n).map(i => ['one', 'two', 'three', 'four', 'five'][i - 1]).join(', ') + '.'), en(`${cap(e.w)} cars.`)])
  };
  const meet = k => ({
    cls: 'en-card', say: MEET[EN[k].type](EN[k]),
    html: `<span class="en-pic">${meetPic(k)}</span><span class="en-word">${EN[k].w}</span><span class="en-zh">${EN[k].zh}</span>`
  });

  // 一句话里听懂这个词，点对了车就开走
  function useQ(k, pool) {
    const e = EN[k], others = U.sample(pool.filter(x => x !== k && EN[x].type === e.type), 2);
    const keys = U.shuffle([k].concat(others));
    let say, opts, after;
    if (e.type === 'veh') {
      say = `Where is the ${e.w}?`;
      opts = keys.map(x => ({ k: x, html: A.v(x) }));
      after = [en(`Here it is! The ${e.w}.`), en('Beep beep!')];
    } else if (e.type === 'color') {
      say = `Find the ${e.w} one.`;
      opts = keys.map(x => ({ k: x, html: A.v('car', { color: EN[x].color }) }));
      after = [en(`Yes! The ${e.w} car.`)];
    } else {
      say = `Show me ${e.w} ${e.n === 1 ? 'car' : 'cars'}.`;
      opts = keys.map(x => ({ k: x, html: group(EN[x].n) }));
      after = [en(e.n === 1 ? 'Yes! One car!' : `Yes! ${U.range(1, e.n).map(i => ['One', 'two', 'three', 'four', 'five'][i - 1]).join(', ')}. ${cap(e.w)} cars!`)];
    }
    return {
      say: [en(say), Object.assign(en(say), { gap: 200 })], text: `${say}（${e.zh}）`, cls: 'en-use',
      opts: opts, ans: k, optCls: e.type === 'num' ? 'pic en-num' : 'pic', item: 'en:' + k, after: after,
      hint: [en(say), en(e.w), { t: `就是${e.zh}。` }]
    };
  }

  // words 本次要学的词；pool 做题时的选项范围
  function enLesson(api, words, pool) {
    pool = pool || words;
    const fresh = words.filter(k => S.level('en:' + k) !== 'known');
    const targets = U.mix(words.concat(words).concat(U.sample(pool, 2))).slice(0, 8);
    const quiz = () => Q.run(api, { rounds: targets.length, make: i => useQ(targets[i], pool) });
    if (!fresh.length) return quiz();
    return CE.Cards.run(api, fresh.map(meet)).then(ok => (ok ? quiz() : null));
  }
  CE.Lib.enLesson = enLesson;

  // 颜色加车：a red bus。同时听懂两个词才能选对。
  const listen = phrase => [en('Listen.'), Object.assign(en(phrase), { gap: 600 }), en(phrase)];
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
            say: listen(phrase), text: `Listen: ${phrase}（${EN[c].zh}的${EN[k].zh}）`, cls: 'en-use',
            opts: U.shuffle([tile(k, c), tile(k, c2), tile(k2, c), tile(k2, c2)]), ans: c + '-' + k,
            optCls: 'pic', item: 'en:phrase', after: [en(`Yes! ${phrase}!`)],
            hint: [en(phrase), en(c), en(k)]
          };
        }
      });
      if (S.level('en:green') === 'known') return quiz();
      return CE.Cards.run(api, [meet('green')]).then(ok => (ok ? quiz() : null));
    }
  });
})(window.CE);
