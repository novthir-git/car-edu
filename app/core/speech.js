/* 语音朗读（浏览器自带的语音合成）和音效（WebAudio 现场合成，不需要音频文件）。
   孩子还不识字，所有提示都靠这里读出来。没有中文语音的设备上，屏幕会显示文字，请家长代读。 */
(function (CE) {
  'use strict';
  const S = CE.Speech = { supported: 'speechSynthesis' in window, zh: null, en: null, voices: [] };
  const keep = [];   // 保留引用，避免部分浏览器提前回收导致 onend 不触发
  let token = 0;

  const norm = l => String(l || '').replace('_', '-').toLowerCase();

  /* 给声音打分，自动选分最高的。同一台设备上常有好几个声音，音质差别很大：
     - 神经网络语音最自然：Edge 的 “… Online (Natural)”、苹果下载的“优化/高品质”版本（voiceURI 里带 premium、enhanced）。
     - Chrome 的 “Google 普通话 / Google US English” 是联网的，比系统自带的老声音好。
     - 苹果的 compact 版本、Windows 的 Huihui、Kangkang 这类老声音最机械。
     - 苹果还带一批搞怪的英文声音（Bubbles、Zarvox……），不能给孩子用。 */
  const NOVELTY = /albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|kathy|ralph|grandma|grandpa|eddy|flo\b|reed|rocko|sandy|shelley/i;
  function quality(v) {
    const id = (v.name + ' ' + (v.voiceURI || '')).toLowerCase();
    let q = 0;
    if (/natural|neural|premium/.test(id)) q += 10;
    else if (/enhanced|增强|优化|高品质|siri/.test(id)) q += 7;
    else if (/google/.test(id)) q += 5;
    if (/xiaoxiao|xiaoyi|yunxi|aria|jenny|ava|samantha/.test(id)) q += 2;
    if (/compact|huihui|kangkang|yaoyao|espeak/.test(id)) q -= 4;
    if (NOVELTY.test(v.name)) q -= 50;
    return q;
  }

  // 苹果设备上同名的声音可能有两个（普通版和优化版），所以用 voiceURI 认；旧记录里存的是名字，也认
  const chosen = (list, key) => (key ? list.find(v => v.voiceURI === key) || list.find(v => v.name === key) : null);

  S.refresh = function () {
    if (!S.supported) return;
    let vs = [];
    try { vs = speechSynthesis.getVoices() || []; } catch (e) { /* 忽略 */ }
    S.voices = vs;
    const st = CE.Store.data.settings;

    const zh = vs.filter(v => {
      const l = norm(v.lang);
      return (l.indexOf('zh') === 0 || l.indexOf('cmn') === 0) && !/hk|yue|mo/.test(l);   // 排除粤语
    });
    // 普通话（大陆）优先，其次看音质
    const rz = v => {
      const l = norm(v.lang);
      return (l.indexOf('zh-cn') === 0 || l.indexOf('hans') >= 0 || l === 'cmn-cn' ? 20 : 0) + quality(v);
    };
    S.zhList = zh;
    S.zh = chosen(zh, st.voiceZh) || zh.slice().sort((a, b) => rz(b) - rz(a))[0] || null;

    const en = vs.filter(v => norm(v.lang).indexOf('en') === 0);
    const re = v => {
      const l = norm(v.lang);
      return (l === 'en-us' ? 4 : l === 'en-gb' ? 2 : 0) + quality(v);
    };
    S.enList = en.filter(v => !NOVELTY.test(v.name));
    S.en = chosen(en, st.voiceEn) || en.slice().sort((a, b) => re(b) - re(a))[0] || null;
  };

  S.quality = quality;

  S.init = function () {
    if (!S.supported) return;
    S.refresh();
    try { speechSynthesis.addEventListener('voiceschanged', S.refresh); } catch (e) { /* 旧浏览器 */ }
  };

  S.stop = function () {
    token++;
    if (S.supported) { try { speechSynthesis.cancel(); } catch (e) { /* 忽略 */ } }
  };

  // parts: 字符串，或 [{t:'文字', lang:'en'}, ...]。返回 Promise，读完（或被打断）后结束。
  S.say = function (parts) {
    parts = [].concat(parts || []).map(p => (typeof p === 'string' ? { t: p } : p)).filter(p => p && p.t);
    S.stop();
    const my = token;
    if (CE.TEST || !S.supported || !parts.length) return Promise.resolve(false);
    const rate = Number(CE.Store.data.settings.rate) || 0.9;
    return new Promise(resolve => {
      let i = 0;
      const next = () => {
        if (my !== token) return resolve(false);
        if (i >= parts.length) return resolve(true);
        const p = parts[i++];
        const en = p.lang === 'en';
        const u = new SpeechSynthesisUtterance(p.t);
        u.lang = en ? 'en-US' : 'zh-CN';
        const v = en ? S.en : S.zh;
        if (v) u.voice = v;
        u.rate = en ? rate * 0.9 : rate;
        u.pitch = 1;   // 调高音调会让新式语音变假
        let done = false;
        // 有些设备不会触发 onend，用估算时长兜底，保证流程不会卡住
        const guess = 900 + p.t.length * (en ? 110 : 380) / rate;
        const fin = () => {
          if (done) return;
          done = true; clearTimeout(tm);
          setTimeout(next, p.gap || 150);
        };
        const tm = setTimeout(fin, guess);
        u.onend = fin; u.onerror = fin;
        keep.push(u); if (keep.length > 30) keep.shift();
        try { speechSynthesis.speak(u); } catch (e) { fin(); }
      };
      setTimeout(next, 70);   // cancel 之后立刻 speak 在部分浏览器会丢失
    });
  };

  /* ---------- 音效 ---------- */
  const X = CE.Sfx = {};
  let ac = null;
  const ctx = () => {
    if (CE.TEST || !CE.Store.data.settings.sfx) return null;
    if (!ac) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      try { ac = new C(); } catch (e) { return null; }
    }
    if (ac.state === 'suspended') { try { ac.resume(); } catch (e) { /* 忽略 */ } }
    return ac;
  };
  const tone = (f, at, dur, type, vol) => {
    const c = ctx(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.value = f;
    const t0 = c.currentTime + at;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.16, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  };
  X.unlock = () => { ctx(); };
  X.tap = () => tone(520, 0, 0.08, 'triangle', 0.1);
  X.ok = () => { tone(660, 0, 0.14, 'triangle'); tone(990, 0.1, 0.22, 'triangle'); };
  X.no = () => { tone(240, 0, 0.18, 'sine', 0.12); tone(200, 0.12, 0.2, 'sine', 0.1); };
  X.star = () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.28, 'triangle')); };
  X.horn = () => { tone(392, 0, 0.16, 'square', 0.06); tone(392, 0.22, 0.26, 'square', 0.06); };
  X.bump = () => tone(110, 0, 0.09, 'square', 0.07);
})(window.CE);
