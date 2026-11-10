/* 所有画面都是代码画的 SVG：原创的汽车角色、道具和场景。
   line 模式输出黑白线稿，用于涂色游戏和打印的涂色页。 */
(function (CE) {
  'use strict';
  const A = CE.Art = {};
  const U = CE.U;
  const INK = '#2b2b3a';
  const SW = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;

  const PAL = {
    car:        { body: '#3b8beb', glass: '#d9f1ff', trim: '#ffd23f', dark: '#2a67b5' },
    firetruck:  { body: '#ef5350', glass: '#d9f1ff', trim: '#ffd23f', dark: '#b8c2cc', lamp: '#4fc3f7' },
    excavator:  { body: '#ffc93c', glass: '#d9f1ff', trim: '#f29f05', dark: '#7a7f8c' },
    dumptruck:  { body: '#43b66b', glass: '#d9f1ff', trim: '#ff9f43', dark: '#7a7f8c' },
    watertruck: { body: '#29b6f6', glass: '#d9f1ff', trim: '#e3f6ff', dark: '#7a7f8c' },
    bus:        { body: '#ffca3a', glass: '#d9f1ff', trim: '#ff8a3d', dark: '#7a7f8c' },
    truck:      { body: '#9b6bdf', glass: '#d9f1ff', trim: '#f4f6fa', dark: '#7a7f8c' }
  };
  A.KINDS = Object.keys(PAL);

  // 五个主角。名字用的都是最基础的汉字，角色本身就是识字内容。
  A.CHARS = {
    xiaofeng: { kind: 'car',        name: '小风', job: '小汽车' },
    xiaohuo:  { kind: 'firetruck',  name: '小火', job: '消防车' },
    xiaoshui: { kind: 'watertruck', name: '小水', job: '洒水车' },
    atu:      { kind: 'excavator',  name: '阿土', job: '挖掘机' },
    dashan:   { kind: 'dumptruck',  name: '大山', job: '大卡车' }
  };

  function wheel(cx, r, line) {
    const cy = 136 - r;
    return `<g class="wheel" style="transform-origin:${cx}px ${cy}px">` +
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${line ? '#fff' : '#3a3a4a'}" ${SW}/>` +
      `<circle cx="${cx}" cy="${cy}" r="${r * 0.5}" fill="${line ? '#fff' : '#e3e9f0'}" stroke="${INK}" stroke-width="2"/>` +
      `<path d="M${cx - r * 0.5} ${cy}H${cx + r * 0.5}M${cx} ${cy - r * 0.5}V${cy + r * 0.5}" stroke="${INK}" stroke-width="2"/>` +
      `</g>`;
  }

  // 脸：一只大眼睛加嘴巴，画在车头
  function face(x, y, mood, line) {
    let s = '';
    if (!line) s += `<circle cx="${x - 13}" cy="${y + 9}" r="4.5" fill="#ff9aa2" opacity=".85"/>`;
    s += `<circle cx="${x}" cy="${y}" r="9" fill="#fff" stroke="${INK}" stroke-width="2.5"/>`;
    s += `<circle cx="${x + 2.5}" cy="${y + 0.5}" r="4.6" fill="${INK}"/><circle cx="${x + 4}" cy="${y - 1.5}" r="1.6" fill="#fff"/>`;
    const mx = x - 3, my = y + 13;
    const st = `fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"`;
    if (mood === 'sad') s += `<path d="M${mx} ${my + 5}q8 -8 16 0" ${st}/>`;
    else if (mood === 'wow') s += `<ellipse cx="${mx + 8}" cy="${my + 3}" rx="4" ry="5" fill="${INK}"/>`;
    else if (mood === 'effort') {
      s += `<path d="M${mx} ${my + 2}h15" ${st}/>`;
      s += `<path d="M${x - 16} ${y - 22}q-6 9 0 12q6 -3 0 -12z" fill="#7fd3ff" stroke="${INK}" stroke-width="1.5"/>`;
    } else s += `<path d="M${mx} ${my}q8 9 16 0" ${st}/>`;
    return s;
  }

  // 返回 240x140 坐标系里的车（车头朝右，轮子落在 y=136）
  function vehicle(kind, o) {
    o = o || {};
    const line = !!o.line;
    const pal = Object.assign({}, PAL[kind], o.pal || {});
    if (o.color) { pal.body = o.color; if (kind === 'truck') pal.trim = o.color; }
    let ri = 0;
    const sh = (part, tag, attrs) => line
      ? `<${tag} ${attrs} class="rg" data-i="${ri++}" fill="#ffffff" ${SW}/>`
      : `<${tag} ${attrs} fill="${pal[part] || part}" ${SW}/>`;
    const wh = (cx, r) => (o.noWheels ? '' : wheel(cx, r || 18, line));
    const fc = (x, y) => (o.noFace ? '' : face(x, y, o.mood, line));
    const cab = () =>
      sh('body', 'path', 'd="M158 118 L158 50 Q158 44 164 44 L198 44 Q208 44 213 55 L226 84 L226 112 Q226 118 220 118 Z"') +
      sh('glass', 'path', 'd="M168 54 L196 54 Q203 54 206 61 L214 80 L168 80 Z"');
    let s = '';

    switch (kind) {
      case 'car':
        s += sh('trim', 'path', 'd="M10 72 L44 72 L48 82 L16 82 Z"');
        s += sh('body', 'path', 'd="M18 110 Q18 84 46 80 L70 78 Q86 46 120 44 L150 44 Q176 46 192 76 L212 82 Q226 86 226 104 L226 112 Q226 118 220 118 L24 118 Q18 118 18 110 Z"');
        s += sh('glass', 'path', 'd="M84 78 Q94 55 116 53 L116 78 Z"');
        s += sh('glass', 'path', 'd="M124 53 L148 53 Q168 55 180 78 L124 78 Z"');
        s += sh('trim', 'path', 'd="M32 90 L128 90 L118 102 L32 102 Z"');
        s += wh(66) + wh(176) + fc(202, 94);
        break;

      case 'firetruck':
        s += sh('dark', 'rect', 'x="8" y="42" width="146" height="12" rx="4"');
        for (let x = 24; x <= 140; x += 16) s += `<path d="M${x} 42v12" stroke="${INK}" stroke-width="2"/>`;
        s += sh('body', 'rect', 'x="14" y="58" width="144" height="60" rx="6"');
        s += sh('trim', 'rect', 'x="14" y="86" width="144" height="10"');
        s += sh('trim', 'circle', 'cx="48" cy="72" r="9"');
        s += sh('lamp', 'path', 'd="M176 46 L176 38 Q184 28 192 38 L192 46 Z"');
        s += cab();
        s += wh(50) + wh(96) + wh(190) + fc(205, 96);
        break;

      case 'dumptruck':
        if (o.load) {
          for (let i = 0; i < Math.min(o.load, 5); i++) {
            const x = 40 + i * 23;
            s += `<circle cx="${x}" cy="${i % 2 ? 31 : 34}" r="12" fill="${line ? '#fff' : '#aab0bd'}" ${SW}/>`;
            if (o.nums) s += `<text x="${x}" y="14" text-anchor="middle" font-size="15" font-weight="800" fill="${INK}">${i + 1}</text>`;
          }
        }
        s += sh('trim', 'path', 'd="M8 100 L20 40 L152 40 L152 100 Z"');
        s += `<path d="M52 46L48 96M86 46L84 96M120 46L120 96" fill="none" stroke="${INK}" stroke-width="2" opacity=".45"/>`;
        s += sh('dark', 'rect', 'x="14" y="100" width="148" height="14" rx="4"');
        s += cab();
        s += wh(48, 20) + wh(100, 20) + wh(190, 20) + fc(205, 96);
        break;

      case 'watertruck':
        s += sh('dark', 'rect', 'x="14" y="102" width="148" height="12" rx="4"');
        s += sh('dark', 'rect', 'x="62" y="40" width="34" height="12" rx="4"');
        s += sh('body', 'rect', 'x="10" y="48" width="146" height="58" rx="29"');
        s += sh('trim', 'path', 'd="M83 58 C76 70 70 76 70 83 A13 13 0 0 0 96 83 C96 76 90 70 83 58 Z"');
        s += sh('dark', 'path', 'd="M186 44 L186 34 L222 30 L224 38 L198 40 L198 44 Z"');
        s += cab();
        s += wh(48) + wh(102) + wh(190) + fc(205, 96);
        break;

      case 'excavator':
        s += sh('body', 'path', 'd="M118 60 L184 10 L198 24 L134 76 Z"');
        s += sh('body', 'path', 'd="M182 18 L198 12 L222 68 L208 74 Z"');
        s += sh('dark', 'path', 'd="M202 66 L228 62 Q234 86 214 98 L204 98 Q196 82 202 66 Z"');
        s += sh('trim', 'rect', 'x="26" y="56" width="40" height="36" rx="5"');
        s += sh('body', 'path', 'd="M60 92 L60 36 Q60 30 66 30 L116 30 Q124 30 126 38 L132 92 Z"');
        s += sh('glass', 'path', 'd="M70 39 L112 39 Q116 39 117 43 L119 56 L70 56 Z"');
        s += sh('trim', 'rect', 'x="40" y="90" width="112" height="14" rx="4"');
        s += sh('dark', 'rect', 'x="22" y="104" width="156" height="32" rx="16"');
        [42, 71, 100, 129, 158].forEach(x => {
          s += `<circle cx="${x}" cy="120" r="9" fill="${line ? '#fff' : '#3a3a4a'}" stroke="${INK}" stroke-width="2"/>`;
        });
        s += fc(112, 69);
        break;

      case 'bus':
        s += sh('body', 'rect', 'x="12" y="38" width="216" height="80" rx="14"');
        s += sh('trim', 'rect', 'x="12" y="84" width="216" height="8"');
        [24, 64, 104, 144].forEach(x => { s += sh('glass', 'rect', `x="${x}" y="50" width="32" height="26" rx="5"`); });
        s += sh('glass', 'rect', 'x="186" y="50" width="32" height="26" rx="5"');
        s += wh(58) + wh(170) + fc(210, 102);
        break;

      case 'truck':
        s += sh('trim', 'rect', 'x="10" y="34" width="144" height="70" rx="5"');
        s += `<path d="M58 40v58M106 40v58" stroke="${INK}" stroke-width="2" opacity=".35"/>`;
        s += sh('dark', 'rect', 'x="14" y="102" width="148" height="12" rx="4"');
        s += cab();
        s += wh(48) + wh(190) + fc(205, 96);
        break;
    }
    return s;
  }
  A.vehicle = vehicle;

  // 独立的一辆车（放在按钮、卡片里）
  A.v = function (kind, o, cls) {
    return `<svg class="veh ${cls || ''}" viewBox="0 0 240 140" aria-hidden="true">${vehicle(kind, o)}</svg>`;
  };
  A.who = function (key, o, cls) { return A.v(A.CHARS[key].kind, o, cls); };

  /* ---------- 道具（原点在底边中点） ---------- */
  const PROP = {
    stone: () =>
      `<path d="M-36 0 Q-50 -26 -30 -48 Q-6 -68 26 -54 Q52 -36 40 -8 Q36 0 28 0 Z" fill="#aab0bd" ${SW}/>` +
      `<path d="M-18 -40 Q-4 -50 10 -44" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".75"/>` +
      `<path d="M8 -22l8 6l-4 8" fill="none" stroke="${INK}" stroke-width="2" opacity=".5"/>`,
    flame: () =>
      `<path d="M0 0 C-30 0 -34 -30 -16 -50 C-14 -38 -6 -36 -6 -46 C-6 -62 4 -70 8 -82 C28 -60 36 -40 30 -22 C26 -6 14 0 0 0 Z" fill="#ff7a2f" ${SW}/>` +
      `<path d="M2 -5 C-12 -5 -14 -20 -4 -32 C0 -22 8 -26 8 -38 C20 -26 22 -5 2 -5 Z" fill="#ffd23f"/>`,
    drop: () =>
      `<path d="M0 -72 C-10 -52 -24 -38 -24 -24 A24 24 0 0 0 24 -24 C24 -38 10 -52 0 -72 Z" fill="#4fc3f7" ${SW}/>` +
      `<path d="M-10 -26 a10 10 0 0 0 8 10" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`,
    spray: () => {
      let s = `<path d="M0 0 Q120 -150 250 10" fill="none" stroke="#4fc3f7" stroke-width="11" stroke-linecap="round" stroke-dasharray="3 24"/>` +
        `<path d="M0 6 Q100 -100 210 40" fill="none" stroke="#9fdcff" stroke-width="9" stroke-linecap="round" stroke-dasharray="3 22"/>`;
      [[236, 40], [262, 58], [214, 70]].forEach(p => {
        s += `<g transform="translate(${p[0]},${p[1]}) scale(.32)">${PROP.drop()}</g>`;
      });
      return s;
    },
    dirt: () =>
      `<path d="M-90 0 Q-56 -66 -14 -58 Q30 -86 62 -40 Q84 -30 96 0 Z" fill="#b8793e" ${SW}/>` +
      `<circle cx="-30" cy="-26" r="5" fill="#8d5a2b"/><circle cx="24" cy="-40" r="6" fill="#8d5a2b"/><circle cx="46" cy="-14" r="4" fill="#8d5a2b"/>`,
    wind: () =>
      `<path d="M0 0h130M30 -34h150M-14 34h110" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"/>`,
    cone: () =>
      `<path d="M-20 0 L-7 -46 L7 -46 L20 0 Z" fill="#ff8a3d" ${SW}/><path d="M-13 -24h26" stroke="#fff" stroke-width="7"/><rect x="-26" y="-4" width="52" height="8" rx="3" fill="#ff8a3d" ${SW}/>`,
    star: () =>
      `<path d="M0 -60 L14 -22 L54 -20 L22 4 L34 44 L0 20 L-34 44 L-22 4 L-54 -20 L-14 -22 Z" transform="translate(0,-44) scale(.7)" fill="#ffd23f" ${SW}/>`,
    // 红绿灯：sp.on 是当前亮的灯
    light: sp => {
      const lamp = (y, c, k) => `<circle cx="0" cy="${y}" r="19" fill="${sp.on === k ? c : '#59606d'}" ${SW}/>` +
        (sp.on === k ? `<circle cx="0" cy="${y}" r="28" fill="${c}" opacity=".28"/>` : '');
      return `<rect x="-7" y="-150" width="14" height="150" fill="#8b919e" ${SW}/>` +
        `<rect x="-34" y="-300" width="68" height="156" rx="16" fill="#3a3a4a" ${SW}/>` +
        lamp(-268, '#ff5148', 'red') + lamp(-222, '#ffd23f', 'yellow') + lamp(-176, '#3ddc6e', 'green');
    },
    zebra: () => U.range(0, 5).map(i => `<rect x="${-66 + i * 24}" y="-78" width="13" height="78" fill="#fff"/>`).join(''),
    bubble: sp =>
      `<ellipse cx="0" cy="-70" rx="78" ry="64" fill="#fff" ${SW}/><circle cx="-36" cy="6" r="11" fill="#fff" ${SW}/><circle cx="-50" cy="30" r="6" fill="#fff" ${SW}/>` +
      `<g transform="translate(0,-34)">${PROP[sp.icon || 'flame']()}</g>`,
    text: sp =>
      `<text x="0" y="0" text-anchor="middle" font-size="${sp.size || 44}" font-weight="800" fill="${sp.fill || INK}" stroke="#fff" stroke-width="6" paint-order="stroke">${CE.U.esc(sp.t)}</text>`
  };
  A.prop = function (k, sp, cls) {
    return `<svg class="prop ${cls || ''}" viewBox="-70 -100 140 110" aria-hidden="true">${PROP[k](sp || {})}</svg>`;
  };

  /* ---------- 背景 ---------- */
  // 背景色块故意画到 800x450 之外，这样屏幕比例不同时两侧和上方不会露白
  const SKY = '<rect x="-1200" y="-1500" width="3200" height="1960" fill="#bfe8ff"/>';
  const sun = (x, y) => `<circle cx="${x}" cy="${y}" r="46" fill="#ffd95a" stroke="#f5b82e" stroke-width="5"/>`;
  const cloud = (x, y, s) =>
    `<g transform="translate(${x},${y}) scale(${s || 1})" fill="#fff"><ellipse cx="0" cy="0" rx="46" ry="26"/><ellipse cx="-40" cy="10" rx="30" ry="20"/><ellipse cx="42" cy="10" rx="34" ry="20"/></g>`;
  const tree = (x, y, s) =>
    `<g transform="translate(${x},${y}) scale(${s || 1})"><rect x="-7" y="-40" width="14" height="42" rx="4" fill="#9a6a3a" ${SW}/><circle cx="0" cy="-66" r="36" fill="#55b86a" ${SW}/><circle cx="-12" cy="-74" r="7" fill="#7fd08f"/></g>`;
  const house = (x, y, c, s) =>
    `<g transform="translate(${x},${y}) scale(${s || 1})"><rect x="-50" y="-70" width="100" height="72" fill="${c}" ${SW}/><path d="M-62 -68 L0 -122 L62 -68 Z" fill="#e56b5d" ${SW}/>` +
    `<rect x="-12" y="-38" width="24" height="40" rx="3" fill="#8d5a2b" ${SW}/><rect x="-40" y="-56" width="20" height="20" rx="3" fill="#d9f1ff" ${SW}/><rect x="20" y="-56" width="20" height="20" rx="3" fill="#d9f1ff" ${SW}/></g>`;
  const road = y =>
    `<rect x="-1200" y="${y}" width="3200" height="600" fill="#6a707c"/><rect x="-1200" y="${y}" width="3200" height="6" fill="${INK}" opacity=".35"/>` +
    `<path d="M-1180 ${y + 62}H2000" stroke="#fff" stroke-width="6" stroke-dasharray="44 34" opacity=".9"/>`;
  const hills = c =>
    `<path d="M-1200 330 L0 330 Q150 230 320 310 Q480 220 640 300 Q730 260 800 300 L2000 300 L2000 420 L-1200 420 Z" fill="${c || '#a7e09a'}"/>`;

  const BG = {
    town: () => SKY + sun(700, 80) + cloud(140, 90, 1) + cloud(430, 56, 0.8) + hills() +
      house(90, 350, '#ffb4a2') + house(262, 350, '#ffe08a', 1.15) + house(560, 350, '#b8e0ff') + house(718, 350, '#d7c0ff', 0.95) +
      tree(176, 352, 0.9) + tree(420, 352, 1.05) + tree(640, 352, 0.85) +
      '<rect x="-1200" y="344" width="3200" height="30" fill="#7ed07e"/>' + road(366),
    road: () => SKY + sun(110, 86) + cloud(360, 70, 1) + cloud(640, 110, 0.8) + hills() +
      tree(90, 352, 1) + tree(700, 352, 1.1) +
      '<rect x="-1200" y="344" width="3200" height="30" fill="#7ed07e"/>' + road(366),
    site: () => SKY + cloud(160, 80, 1) + cloud(600, 60, 0.9) + sun(400, 70) + hills('#c9dc9a') +
      '<rect x="-1200" y="340" width="3200" height="600" fill="#e0a868"/><rect x="-1200" y="340" width="3200" height="6" fill="#2b2b3a" opacity=".3"/>' +
      [60, 210, 500, 720].map((x, i) => `<circle cx="${x}" cy="${430 - (i % 2) * 14}" r="6" fill="#c48a4a"/>`).join('') +
      `<g transform="translate(60,352)">${PROP.cone()}</g><g transform="translate(748,352)">${PROP.cone()}</g>`,
    // 右侧是一座山，山的斜边就是上山的路：从 (220,410) 到 (800,138)
    mountain: () => SKY + sun(110, 84) + cloud(330, 70, 0.9) + hills() +
      '<rect x="-1200" y="344" width="3200" height="30" fill="#7ed07e"/>' +
      '<path d="M220 410 L2000 -425 L2000 410 Z" fill="#8ccf7e"/>' +
      '<path d="M220 410 L2000 -425 L2000 -385 L300 410 Z" fill="#6a707c"/>' +
      tree(560, 410, 0.8) + tree(700, 400, 0.9) + road(404)
  };

  function sprite(sp) {
    const s = sp.s || 1, fx = sp.flip ? -1 : 1;
    let inner;
    if (A.CHARS[sp.k]) inner = `<g transform="translate(-120,-136)">${vehicle(A.CHARS[sp.k].kind, sp)}</g>`;
    else if (PAL[sp.k]) inner = `<g transform="translate(-120,-136)">${vehicle(sp.k, sp)}</g>`;
    else inner = PROP[sp.k](sp);
    if (sp.spin) inner = `<g class="an-spin">${inner}</g>`;
    const cls = sp.anim ? ` class="an an-${sp.anim}${sp.slow ? ' slow' : ''}"` : '';
    const st = [];
    if (sp.dx != null) st.push(`--dx:${sp.dx}px`);
    if (sp.dy != null) st.push(`--dy:${sp.dy}px`);
    if (sp.delay) st.push(`animation-delay:${sp.delay}s`);
    return `<g transform="translate(${sp.x},${sp.y})"><g${cls}${st.length ? ` style="${st.join(';')}"` : ''}>` +
      `<g transform="rotate(${sp.rot || 0}) scale(${s * fx},${s})">${inner}</g></g></g>`;
  }

  A.scene = function (bg, sprites, cls) {
    return `<svg class="scene ${cls || ''}" viewBox="0 0 800 450" preserveAspectRatio="xMidYMax meet" aria-hidden="true">` +
      BG[bg]() + (sprites || []).map(sprite).join('') + `</svg>`;
  };

  A.starIcon = on =>
    `<svg class="st ${on ? 'on' : ''}" viewBox="-60 -64 120 120" aria-hidden="true"><path d="M0 -60 L14 -22 L54 -20 L22 4 L34 44 L0 20 L-34 44 L-22 4 L-54 -20 L-14 -22 Z" fill="${on ? '#ffd23f' : '#e6e9ef'}" ${SW}/></svg>`;
  A.stars = n => [1, 2, 3].map(i => A.starIcon(i <= n)).join('');
})(window.CE);
