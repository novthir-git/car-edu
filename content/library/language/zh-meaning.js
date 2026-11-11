/* 说得出 · 字的意思：来历、看图认的画、用学过的字组成的词。认字先认意思，再记样子（见 docs/learning.md）。

   CE.ZHM[字]：
     root  字的来历。只收公认的、孩子看得出来的象形字、指事字，和一个会意字（石）：
             pic 实物的画；old 古时候的写法（照甲骨文、金文的样子简化画的，不是拓片）；oldText 用一个字代替 old（车用繁体“車”）
             say 讲给他听的话
           没有看得出的来历的字（风、来、去……）不编来历，只用意思去认。
     see   看图找字时出的图，可以有好几张，每次换一张（同一个字，换个样子还认得）。没有 see 的字用 root.pic
     ask   看图找字时问的话（默认：这是什么？哪个是它的字？）
     pair  要放在一起认的反义字（大小、上下、来去）。看图找字时只给这两个选项
     say   没有来历的字，卡片上讲的话
     hint  答错时提醒的一句：提醒道理，不直接说答案
     got   答对以后说的话
   CE.ZHWORDS[词]：一张图。读词的时候不读出声，要他自己从字里读出意思来。
   每个字的画都在 100×100 的格子里。 */
(function (CE) {
  'use strict';
  const A = CE.Art;
  const INK = '#2b2b3a';
  const ST = `stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"`;
  // 古时候的字：粗墨线
  const ink = d => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;
  const box = (inner, cls) => `<svg class="zh-svg ${cls || ''}" viewBox="0 0 100 100" aria-hidden="true">${inner}</svg>`;
  const drop = (x, y, s) => `<path transform="translate(${x},${y}) scale(${s || 1})" d="M0 -10 C-4 -4 -7 0 -7 4 A7 7 0 0 0 7 4 C7 0 4 -4 0 -10 Z" fill="#4fc3f7" stroke="${INK}" stroke-width="1.8"/>`;
  const cloud = (x, y, s) => `<g transform="translate(${x},${y}) scale(${s})" fill="#e3e9f0" stroke="${INK}" stroke-width="2.5">` +
    `<path d="M-30 8 Q-36 -6 -22 -10 Q-18 -26 0 -24 Q14 -32 24 -18 Q38 -16 34 0 Q38 10 26 10 L-24 10 Q-32 12 -30 8 Z"/></g>`;

  /* ---------- 画：实物 ---------- */
  const PIC = {
    '山': `<path d="M4 86 L26 46 L36 62 L50 18 L64 62 L74 46 L96 86 Z" fill="#8ccf7e" ${ST}/>` +
      `<path d="M50 18 L43 35 L47 33 L50 37 L53 33 L57 35 Z" fill="#fff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` +
      `<path d="M2 86 H98" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
    '火': `<g transform="translate(48,94) scale(1.02)"><path d="M0 0 C-30 0 -34 -30 -16 -50 C-14 -38 -6 -36 -6 -46 C-6 -62 4 -70 8 -82 C28 -60 36 -40 30 -22 C26 -6 14 0 0 0 Z" fill="#ff7a2f" ${ST}/>` +
      `<path d="M2 -5 C-12 -5 -14 -20 -4 -32 C0 -22 8 -26 8 -38 C20 -26 22 -5 2 -5 Z" fill="#ffd23f"/></g>` +
      `<path d="M14 40 v0 M86 36 v0" stroke="#ff7a2f" stroke-width="7" stroke-linecap="round"/>`,
    '水': `<path d="M50 4 C30 24 70 40 50 56 C30 72 66 84 50 98" fill="none" stroke="#4fc3f7" stroke-width="16" stroke-linecap="round"/>` +
      `<path d="M50 4 C30 24 70 40 50 56 C30 72 66 84 50 98" fill="none" stroke="#bfe9ff" stroke-width="4" stroke-linecap="round" stroke-dasharray="9 12"/>` +
      drop(20, 30) + drop(16, 66) + drop(82, 38) + drop(84, 72),
    '土': `<path d="M20 82 Q24 44 50 36 Q76 44 80 82 Z" fill="#b8793e" ${ST}/>` +
      `<circle cx="40" cy="62" r="3.5" fill="#8d5a2b"/><circle cx="58" cy="52" r="4" fill="#8d5a2b"/><circle cx="62" cy="70" r="3" fill="#8d5a2b"/>` +
      `<path d="M4 82 H96" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="M8 82 l3 -8 l3 8 M84 82 l3 -8 l3 8" fill="none" stroke="#43b66b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    '大': `<path d="M12 41 Q50 33 88 41" fill="none" stroke="#3b8beb" stroke-width="7" stroke-linecap="round"/>` +
      `<path d="M50 60 L28 94 M50 60 L72 94" stroke="#2a67b5" stroke-width="8" stroke-linecap="round"/>` +
      `<path d="M50 32 V62" stroke="#3b8beb" stroke-width="10" stroke-linecap="round"/>` +
      `<circle cx="50" cy="20" r="12" fill="#ffd9b8" ${ST}/><circle cx="46" cy="18" r="1.7" fill="${INK}"/><circle cx="54" cy="18" r="1.7" fill="${INK}"/>` +
      `<path d="M45 23 q5 5 10 0" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`,
    '小': `<path d="M6 80 H94" stroke="#e0a868" stroke-width="3" stroke-dasharray="2 6" stroke-linecap="round"/>` +
      `<ellipse cx="50" cy="44" rx="5" ry="4.2" fill="#e0a868" ${ST}/><ellipse cx="34" cy="62" rx="4.4" ry="3.8" fill="#e0a868" ${ST}/>` +
      `<ellipse cx="66" cy="62" rx="4.6" ry="3.8" fill="#e0a868" ${ST}/>`,
    // 古时候的车，从天上往下看：中间一根车轴，两头各一个轮子，当中是坐人的车厢。
    // 甲骨文也是这样画的：把两个轮子摊平了画在车轴两头
    '车': `<path d="M50 6 V94" stroke="#8d5a2b" stroke-width="6" stroke-linecap="round"/>` +
      [17, 83].map(y => `<ellipse cx="50" cy="${y}" rx="22" ry="12" fill="#e3e9f0" ${ST}/>` +
        `<path d="M28 ${y}H72 M38 ${y - 9}L62 ${y + 9} M62 ${y - 9}L38 ${y + 9}" stroke="${INK}" stroke-width="2"/>` +
        `<ellipse cx="50" cy="${y}" rx="5" ry="3.5" fill="#8d5a2b" stroke="${INK}" stroke-width="2"/>`).join('') +
      `<rect x="31" y="34" width="38" height="32" rx="4" fill="#e0a868" ${ST}/><circle cx="50" cy="47" r="7" fill="#ffd9b8" ${ST}/>` +
      `<path d="M31 58 H69" stroke="${INK}" stroke-width="2"/>`,
    '石': `<path d="M6 10 H96 V24 H36 Q28 54 24 92 H6 Z" fill="#b7a58f" ${ST}/>` +
      `<path d="M14 32 l6 10 M12 62 l6 8 M60 16 l8 0" stroke="${INK}" stroke-width="2" opacity=".4" stroke-linecap="round"/>` +
      `<path d="M44 92 Q38 76 52 66 Q68 58 80 70 Q90 82 84 92 Z" fill="#aab0bd" ${ST}/>` +
      `<path d="M2 92 H98" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
    '上': `<path d="M8 74 H92" stroke="#8d5a2b" stroke-width="8" stroke-linecap="round"/>` +
      `<circle cx="50" cy="56" r="13" fill="#ef5350" ${ST}/><path d="M44 51 q4 -6 10 -4" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
    '下': `<path d="M8 28 H92" stroke="#8d5a2b" stroke-width="8" stroke-linecap="round"/><path d="M50 32 V45" stroke="${INK}" stroke-width="2"/>` +
      `<circle cx="50" cy="58" r="13" fill="#ef5350" ${ST}/><path d="M44 53 q4 -6 10 -4" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
    '日': [0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path d="M50 14 V4" transform="rotate(${a} 50 50)" stroke="#f5b82e" stroke-width="5" stroke-linecap="round"/>`).join('') +
      `<circle cx="50" cy="50" r="27" fill="#ffd95a" stroke="#f5b82e" stroke-width="4"/>`,
    '月': `<path d="M62 12 A38.5 38.5 0 0 0 62 88 A60 60 0 0 1 62 12 Z" fill="#ffd95a" stroke="#f5b82e" stroke-width="3" stroke-linejoin="round"/>`,
    '人': `<path d="M44 62 L32 92 M44 62 L58 90" stroke="#2a67b5" stroke-width="7" stroke-linecap="round"/>` +
      `<path d="M56 28 Q52 48 44 62" fill="none" stroke="#ef5350" stroke-width="10" stroke-linecap="round"/>` +
      `<path d="M54 38 Q64 48 74 54" fill="none" stroke="#ef5350" stroke-width="6" stroke-linecap="round"/>` +
      `<circle cx="58" cy="18" r="10" fill="#ffd9b8" ${ST}/><circle cx="62" cy="16" r="1.6" fill="${INK}"/>`,
    '口': `<path d="M12 40 Q50 28 88 40 Q82 86 50 88 Q18 86 12 40 Z" fill="#ef5350" ${ST}/>` +
      `<path d="M22 44 Q50 36 78 44 Q72 78 50 79 Q28 78 22 44 Z" fill="#5a1f2a"/>` +
      `<path d="M25 44 Q50 38 75 44 L73 51 Q50 46 27 51 Z" fill="#fff"/>` +
      `<path d="M35 72 Q50 62 65 72 Q58 79 50 79 Q42 79 35 72 Z" fill="#ff9aa2"/>`,
    '木': `<path d="M8 82 H92" stroke="#7ed07e" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="M50 40 L28 18 M50 40 L72 18 M50 52 L22 38 M50 52 L78 38" stroke="#9a6a3a" stroke-width="5" stroke-linecap="round"/>` +
      `<path d="M50 80 L32 95 M50 80 L68 95" stroke="#9a6a3a" stroke-width="5" stroke-linecap="round"/>` +
      `<path d="M50 12 V82" stroke="#9a6a3a" stroke-width="9" stroke-linecap="round"/>` +
      [[28, 16], [72, 16], [20, 36], [80, 36], [50, 10]].map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="8" fill="#55b86a" ${ST}/>`).join(''),
    '目': `<path d="M8 50 Q50 14 92 50 Q50 86 8 50 Z" fill="#fff" ${ST}/>` +
      `<circle cx="50" cy="50" r="17" fill="#6d4c41" ${ST}/><circle cx="50" cy="50" r="7.5" fill="${INK}"/><circle cx="56" cy="44" r="4" fill="#fff"/>` +
      `<path d="M30 31 l-4 -8 M50 25 v-9 M70 31 l4 -8" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
    '田': `<rect x="8" y="8" width="84" height="84" rx="4" fill="#b8793e" ${ST}/>` +
      [[13, 13], [53, 13], [13, 53], [53, 53]].map(p => `<rect x="${p[0]}" y="${p[1]}" width="34" height="34" rx="2" fill="#7fd08f"/>` +
        `<path d="M${p[0] + 7} ${p[1] + 6} v22 M${p[0] + 17} ${p[1] + 6} v22 M${p[0] + 27} ${p[1] + 6} v22" stroke="#43b66b" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="3 4"/>`).join(''),
    '雨': cloud(50, 24, 1.25) + drop(26, 54) + drop(50, 50) + drop(74, 56) + drop(36, 80) + drop(62, 82) + drop(84, 84, 0.8)
  };

  /* ---------- 古时候的写法 ---------- */
  const OLD = {
    '山': ink('M14 78 L28 48 L40 70 L50 22 L60 70 L72 48 L86 78 Z'),
    '火': ink('M18 72 Q50 94 82 72 M30 76 Q22 54 30 34 M50 84 Q42 52 50 14 M70 76 Q78 54 70 34') + ink('M15 42 v0 M85 42 v0'),
    '水': ink('M50 8 C38 26 62 40 50 54 C38 68 62 80 50 94') + ink('M26 24 l4 8 M22 48 l4 8 M28 72 l4 8 M74 24 l-4 8 M78 48 l-4 8 M72 72 l-4 8'),
    '土': ink('M50 22 Q32 44 38 64 Q42 74 50 74 Q58 74 62 64 Q68 44 50 22 Z M14 82 H86'),
    '大': ink('M50 12 V58 M16 40 Q50 32 84 40 M50 58 L26 90 M50 58 L74 90'),
    '小': ink('M50 24 V54 M32 46 L27 64 M68 46 L73 64'),
    '石': ink('M12 16 H88 M36 16 Q30 56 14 90') + `<rect x="46" y="56" width="32" height="28" rx="5" fill="none" stroke="${INK}" stroke-width="7"/>`,
    '上': ink('M14 72 H86 M36 44 H64'),
    '下': ink('M14 30 H86 M36 58 H64'),
    '日': `<circle cx="50" cy="50" r="30" fill="none" stroke="${INK}" stroke-width="7"/>` + ink('M50 50 v0'),
    '月': ink('M62 14 C30 22 24 70 58 88 M62 14 C46 30 44 66 58 88 M43 46 L48 58'),
    '人': ink('M60 12 Q56 46 30 90 M55 40 Q66 54 76 66'),
    '口': ink('M18 30 L26 70 Q50 80 74 70 L82 30'),
    '木': ink('M50 10 V92 M50 36 L26 14 M50 36 L74 14 M50 70 L28 92 M50 70 L72 92'),
    '目': ink('M10 50 Q50 18 90 50 Q50 82 10 50 Z') + `<circle cx="50" cy="50" r="10" fill="none" stroke="${INK}" stroke-width="6"/>`,
    '田': `<rect x="16" y="16" width="68" height="68" fill="none" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>` + ink('M50 16 V84 M16 50 H84'),
    '雨': ink('M12 16 H88 M50 16 V26') + ink('M28 32 v8 M50 34 v8 M72 32 v8 M28 54 v8 M50 56 v8 M72 54 v8 M28 76 v8 M50 78 v8 M72 76 v8')
  };

  /* ---------- 没有来历可讲的字：用意思认 ---------- */
  // 风：看不见，只能看见它吹动的东西
  const WIND = `<path d="M8 30 H58 M18 46 H76 M4 62 H46" stroke="#9fdcff" stroke-width="6" stroke-linecap="round"/>` +
    `<path d="M80 94 Q78 70 88 54" fill="none" stroke="#9a6a3a" stroke-width="7" stroke-linecap="round"/>` +
    `<ellipse cx="88" cy="40" rx="11" ry="17" transform="rotate(30 88 40)" fill="#55b86a" ${ST}/>` +
    `<ellipse cx="40" cy="18" rx="6" ry="3" transform="rotate(-30 40 18)" fill="#55b86a" stroke="${INK}" stroke-width="1.5"/>` +
    `<ellipse cx="64" cy="78" rx="6" ry="3" transform="rotate(20 64 78)" fill="#55b86a" stroke="${INK}" stroke-width="1.5"/>` +
    `<path d="M2 94 H98" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;

  // 换个样子的山：一大一小两座，山顶有雪，山脚下有路
  const HILLS = `<circle cx="80" cy="20" r="9" fill="#ffd95a" stroke="#f5b82e" stroke-width="2.5"/>` +
    `<path d="M40 84 L66 40 L92 84 Z" fill="#a7e09a" ${ST}/><path d="M2 84 L34 22 L66 84 Z" fill="#8ccf7e" ${ST}/>` +
    `<path d="M34 22 L26 38 L31 36 L35 40 L39 36 L43 38 Z" fill="#fff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` +
    `<rect x="0" y="84" width="100" height="14" fill="#6a707c"/><path d="M4 91 H96" stroke="#fff" stroke-width="2" stroke-dasharray="7 6"/>`;

  // 一大一小两辆车，箭头指着其中一辆
  const bigSmall = big => {
    const v = (k, x, s) => `<g transform="translate(${x},${150 - 136 * s}) scale(${s})">${A.vehicle(k, {})}</g>`;
    const ax = big ? 106 : 266, ay = big ? 22 : 74;
    return `<svg class="zh-svg wide" viewBox="0 0 320 170" aria-hidden="true">` +
      `<path d="M4 151 H316" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` +
      v('dumptruck', 20, 0.72) + v('car', 224, 0.35) +
      `<g transform="translate(${ax},${ay})"><g class="zh-arrow"><path d="M-13 -16 H13 L0 4 Z" fill="#ef5350" ${ST}/></g></g></svg>`;
  };
  // 大山在山上，还是在山下
  const onHill = top => A.scene('mountain', [top
    ? { k: 'dashan', x: 680, y: 206, s: 0.9, rot: -25 }
    : { k: 'dashan', x: 130, y: 405, s: 0.9 }], 'zh-scene');
  // 小风开上山、开下山：车在山坡上一遍一遍地开
  const onSlope = up => A.scene('mountain', [up
    ? { k: 'xiaofeng', x: 520, y: 283, s: 1, rot: -25, anim: 'go', dx: -110, dy: 52 }
    : { k: 'xiaofeng', x: 400, y: 340, s: 1, rot: -25, flip: true, anim: 'go', dx: 110, dy: -52 }], 'zh-scene');
  // 来、去：家门口站着一个人。小风朝家开过来，或者离开家开出去
  const comeGo = come => `<svg class="zh-svg wide" viewBox="0 0 200 110" aria-hidden="true">` +
    `<rect x="0" y="0" width="200" height="110" fill="#e8f7ff"/><rect x="0" y="84" width="200" height="26" fill="#6a707c"/>` +
    `<path d="M8 97 H192" stroke="#fff" stroke-width="2.5" stroke-dasharray="10 8"/>` +
    `<path d="M10 84 V50 L36 30 L62 50 V84 Z" fill="#ffe08a" ${ST}/><rect x="26" y="58" width="16" height="26" fill="#8d5a2b" ${ST}/>` +
    `<circle cx="52" cy="62" r="4.5" fill="#ffd9b8" stroke="${INK}" stroke-width="1.8"/><path d="M52 67 V77 M52 77 L49 84 M52 77 L55 84 M52 70 L58 64" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>` +
    `<g transform="translate(${come ? 72 : 76},62)"><g class="cg-car ${come ? 'come' : 'go'}">` +
      // 车后面的几道线：不放动画（系统设置了少动画）时，也看得出往哪边开
      `<path d="${come ? 'M64 12 h12 M66 20 h14 M64 28 h10' : 'M-4 12 h-12 M-6 20 h-14 M-4 28 h-10'}" stroke="${INK}" stroke-width="2" stroke-linecap="round" opacity=".5"/>` +
      `<g transform="${come ? 'translate(60,0) scale(-0.25,0.25)' : 'scale(0.25)'}">${A.vehicle('car', {})}</g></g></g></svg>`;
  const rain = big => box(cloud(50, 24, 1.25) + (big
    ? [[22, 52], [40, 58], [58, 50], [76, 56], [30, 78], [50, 84], [68, 76], [86, 82], [14, 86]].map(p => drop(p[0], p[1], 1.15)).join('')
    : drop(38, 62, 0.6) + drop(64, 78, 0.6)));

  const M = CE.ZHM = {
    '山': { root: { say: '看，这是山。中间高，两边低，有三个山尖。很久很久以前，人们照着山的样子画了这个字。后来越写越方便，就成了今天的“山”。' },
      see: [() => box(HILLS)], hint: '哪个字像三个山尖？', got: '对！山，就像三个山尖。' },
    '火': { root: { say: '这是一团火，火苗往上蹿。古时候的“火”字，就画着往上烧的火苗。今天的“火”还看得出来：中间是火苗，两边的点像蹦出来的火星。' },
      see: [() => A.prop('flame')], hint: '哪个字像往上烧的火苗，两边还有火星？', got: '对！火，像往上烧的火苗。' },
    '水': { root: { say: '这是流动的水。古时候的“水”字，中间弯弯的一道是水流，两边的点是溅起来的水花。' },
      see: [() => A.prop('drop')], hint: '哪个字像流动的水，两边有水花？', got: '对！水，中间是水流，两边是水花。' },
    '土': { root: { say: '这是地上的一个土堆。古时候的“土”字，就画了地面上的一个土堆；下面一长横，就是地面。' },
      see: [() => A.prop('dirt')], hint: '哪个字像地上的一个土堆？下面一长横是地面。', got: '对！土，像地上的土堆。' },
    '大': { root: { say: '一个人张开手臂，叉开两条腿：“我有这么大！”古时候的“大”字，就是这样一个张开手脚的人。' },
      pair: '小', see: [() => bigSmall(true)], ask: '箭头指着的这辆车，是大，还是小？', hint: '“大”像一个张开手脚的人，“小”是几个小点。', got: '对！这辆车很大。' },
    '小': { root: { say: '看，几粒小小的沙子。古时候的“小”字，就画了几个小点，表示东西很小。' },
      pair: '大', see: [() => bigSmall(false)], ask: '箭头指着的这辆车，是大，还是小？', hint: '“小”是几个小点，“大”像一个张开手脚的人。', got: '对！这辆车很小。' },
    '车': { root: { oldText: '車', say: '这是从天上往下看的一辆古时候的车：中间一根车轴，两头是两个轮子，当中是坐人的车厢。古时候的“车”字就照着它写。后来写得简单了，就成了今天的“车”。' },
      see: [() => A.v('bus'), () => A.v('truck'), () => A.v('train')], picSee: false, hint: '想一想：公共汽车、卡车、火车，它们都是什么？',
      got: '对！公共汽车、大卡车、火车，都是车。' },
    '风': { see: [() => box(WIND)], say: '风看不见，也摸不着。可是风一吹，树就摇，叶子就飞起来。小风的名字里，就有这个“风”字。',
      hint: '什么东西一吹，树就摇，叶子就飞？', got: '对！是风在吹。' },
    '石': { root: { say: '高高的山崖底下，有一块石头。“石”字上面的一横一撇，像山崖；下面的“口”，就是那块石头。' },
      see: [() => A.prop('stone')], hint: '哪个字像山崖底下有一块石头？', got: '对！石，山崖底下一块石头。' },
    '上': { root: { say: '先画一长横当地面。在它上面加一短横，表示“在上面”，就是“上”。后来中间又加了一竖，成了今天的“上”。' },
      pair: '下', see: [() => onHill(true)], ask: '大山在山上，还是在山下？', hint: '短的一横在长横上面，是“上”；在下面，是“下”。', got: '对！大山在山上。' },
    '下': { root: { say: '一长横在上面，下面加一短横，表示“在下面”，就是“下”。' },
      pair: '上', see: [() => onHill(false)], ask: '大山在山上，还是在山下？', hint: '短的一横在长横下面，是“下”；在上面，是“上”。', got: '对！大山在山下。' },
    '来': { pair: '去', see: [() => comeGo(true)], say: '看，小风朝家里开过来了。朝我们这边，就是“来”。“过来”“来了”，都用这个字。',
      ask: '小风是朝家里开过来，还是离开家开出去？', hint: '朝我们这边，是“来”；离开我们，是“去”。', got: '对！小风开过来了，是“来”。' },
    '去': { pair: '来', see: [() => comeGo(false)], say: '看，小风离开家，开到别的地方。离开我们这边，就是“去”。“出去”“去玩”，都用这个字。',
      ask: '小风是朝家里开过来，还是离开家开出去？', hint: '离开我们，是“去”；朝我们这边，是“来”。', got: '对！小风开出去了，是“去”。' },
    '日': { root: { say: '圆圆的太阳。古时候的“日”字，就画一个圆，中间一点；后来圆写成了方的，就是今天的“日”。“日”就是太阳。' },
      hint: '哪个字像圆圆的太阳？', got: '对！日，就是太阳。' },
    '月': { root: { say: '弯弯的月亮。古时候的“月”字，画的就是一个月牙。' }, hint: '哪个字像弯弯的月牙？', got: '对！月，就是月亮。' },
    '人': { root: { say: '一个侧着身子的人，弯着腰，伸着手。古时候的“人”字，就画了这样一个侧面的人。' },
      hint: '哪个字像一个侧着身子的人？', got: '对！人。' },
    '口': { root: { say: '这是张开的嘴巴。古时候的“口”字，就像一张张开的嘴。“口”就是嘴。' },
      hint: '哪个字像一张张开的嘴巴？', got: '对！口，就是嘴巴。' },
    '木': { root: { say: '一棵树：上面是树枝，中间是树干，下面是树根。古时候的“木”字，就画了一棵树。' },
      hint: '哪个字像一棵树，有树枝，也有树根？', got: '对！木，就是树。' },
    '目': { root: { say: '这是一只眼睛。古时候的“目”字，画的就是眼睛，横着放；后来竖起来写，就成了今天的“目”。“目”就是眼睛。' },
      hint: '哪个字像一只竖起来的眼睛？', got: '对！目，就是眼睛。' },
    '田': { root: { say: '从高处往下看田地：一块一块的，中间是走路的田埂。“田”字就是照着田地画的。' },
      hint: '哪个字像一块一块的田地？', got: '对！田，就是田地。' },
    '雨': { root: { say: '天上落下一滴一滴的雨。古时候的“雨”字，上面一横是天，下面的点是落下来的雨点。' },
      see: [() => rain(true)], hint: '哪个字像天上落下来的雨点？', got: '对！雨。' }
  };
  Object.keys(OLD).forEach(c => { M[c].root.old = OLD[c]; });
  Object.keys(PIC).forEach(c => { M[c].root.pic = PIC[c]; });

  // 看图找字用的图：see 里随便挑一张；有来历的字，实物的画也算一张（车的“实物”是古时候的车，不算）
  CE.zhSee = c => {
    const m = M[c];
    const all = (m.see || []).slice();
    if (m.root && !m.pair && m.picSee !== false) all.push(() => box(m.root.pic));
    return all.length ? CE.U.pick(all)() : '';
  };
  CE.zhBox = box;

  /* ---------- 词：用学过的字组成，配一张图 ---------- */
  CE.ZHWORDS = {
    '火车': () => A.v('train'),
    '风车': () => A.prop('pinwheel'),
    '火山': () => A.prop('volcano'),
    '小风': () => A.who('xiaofeng'),
    '小火': () => A.who('xiaohuo'),
    '小水': () => A.who('xiaoshui'),
    '大山': () => A.who('dashan'),
    '上山': () => onSlope(true),
    '下山': () => onSlope(false),
    '大雨': () => rain(true),
    '小雨': () => rain(false)
  };
})(window.CE);
