/* 冒烟测试：用无头浏览器把已做好的每一周、每个活动都真的玩一遍，再打开家长页和每一份打印材料，
   最后换一个假的安卓外壳，看朗读、打印、导出、更新有没有交给外壳。
   运行：node tests/smoke.js   （需要 playwright）
   ?test=1 会关闭语音和等待，并给“下一步该点的地方”打上 data-tn 标记。 */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };

function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split('?')[0]);
      const file = path.join(ROOT, rel === '/' ? 'index.html' : rel);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

// 新文件忘了在 index.html 里加 <script> 不会报错，只是内容悄悄不出现，所以单独查
function notLoaded() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const walk = dir => [].concat(...fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).map(e =>
    (e.isDirectory() ? walk(dir + '/' + e.name) : /\.js$/.test(e.name) ? [dir + '/' + e.name] : [])));
  return walk('app').concat(walk('content')).filter(f => html.indexOf(`src="${f}"`) < 0);
}

// first：进活动后先点一下的按钮（用来走不是默认的那条路）
async function play(page, base, act, query, first) {
  await page.goto(`${base}/?test=1#/play/${act}?${query}`);
  // 页面切换是异步的：等上一个活动的结果弹窗消失、这个活动真的打开了再开始点
  await page.waitForFunction(() => document.querySelector('.act-body') && !document.querySelector('.result'));
  if (first) await page.click(first);
  for (let i = 0; i < 600; i++) {
    if (await page.$('.result')) {
      await page.click('.result .ok');
      await page.waitForFunction(() => !document.querySelector('.result'));
      return;
    }
    // 有的活动结束时不弹结果（去纸上涂色），直接回到上一页
    if (!(await page.$('.act'))) return;
    const el = await page.$('[data-tn]');
    // 点击可能失败（题目刚换、元素已被替换），下一轮会重新找
    if (!el) { await page.waitForTimeout(15); continue; }
    try { await el.click({ timeout: 300 }); } catch (e) {
      // 涂色线稿里有的色块中心被轮子挡住，真人会点露出来的部分；这里直接派发点击
      const isRegion = await el.evaluate(n => n.classList.contains('rg')).catch(() => false);
      if (isRegion) await el.dispatchEvent('click').catch(() => {});
    }
  }
  throw new Error('活动没有走到结束：' + act);
}

/* 安卓应用：外壳（android/）会在页面上放一个 window.CEAndroid。这里换成一个假的，记下网页交给外壳的事，
   看朗读、打印、导出、更新是不是都交给了外壳（约定见 app/core/native.js）。外壳本身的测试在 android/ 里。 */
async function androidShell(browser, base, fail) {
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  await ctx.addInitScript(() => {
    const calls = window.__calls = [];
    const rec = name => function () { calls.push([name].concat([].slice.call(arguments))); };
    window.CEAndroid = {
      info: () => JSON.stringify({
        shell: 1, app: '1 (test)', engine: '测试引擎', checking: false, msg: '', sources: [], builtin: ['https://example.com/'],
        content: { v: 1794294861, sha: 'abc1234', from: 'apk' }, staged: { v: 1794300000, sha: 'def5678', from: 'update' }
      }),
      voices: () => JSON.stringify([
        { name: '中文（台湾）1', voiceURI: 'cmn-tw-x-a', lang: 'cmn-TW', q: 400 },
        { name: '中文（中国）1', voiceURI: 'cmn-cn-x-b', lang: 'cmn-CN', q: 300 },
        { name: '中文（中国）2', voiceURI: 'cmn-cn-x-c', lang: 'cmn-CN', q: 400 },
        { name: '英语（美国）1', voiceURI: 'en-us-x-d', lang: 'en-US', q: 400 }
      ]),
      // 外壳读完一句会回调 CE.Native.ended(编号)
      speak(id, text, lang, voice) { calls.push(['speak', text, lang, voice]); setTimeout(() => window.CE.Native.ended(id), 5); },
      stop: rec('stop'), print: rec('print'), saveText: rec('saveText'), setSources: rec('setSources'),
      checkUpdate: rec('checkUpdate'), applyUpdate: rec('applyUpdate'), openTtsSettings: rec('openTtsSettings')
    };
    // 假的音频播放器：记下放了哪个文件；文件名里带 broken 的当作放不出来
    window.Audio = function (src) {
      calls.push(['audio', src]);
      this.play = () => {
        setTimeout(() => (/broken/.test(src) ? this.onerror && this.onerror() : this.onended && this.onended()), 5);
        return Promise.resolve();
      };
      this.pause = () => {};
    };
  });
  const p = await ctx.newPage();
  p.on('pageerror', e => fail('安卓 pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') fail('安卓 console: ' + m.text()); });
  const calls = name => p.evaluate(n => window.__calls.filter(c => c[0] === n), name);

  // 朗读：不带 ?test=1 才会真的交出去。自动挑中国大陆、音质高的声音；一句读完才读下一句
  await p.goto(base + '/#/');
  await p.waitForSelector('.home');
  const spoke = await p.evaluate(async () => ({
    ok: await CE.Speech.say(['有2辆车', { t: 'car', lang: 'en' }]), zh: CE.Speech.zh.voiceURI, en: CE.Speech.en.voiceURI
  }));
  const said = (await calls('speak')).map(c => c.slice(1).join(' '));
  if (!spoke.ok || spoke.zh !== 'cmn-cn-x-c' || spoke.en !== 'en-us-x-d' ||
      said.join(' | ') !== '有两辆车 zh-CN cmn-cn-x-c | car en-US en-us-x-d') {
    fail('安卓：朗读没有正确交给外壳：' + JSON.stringify({ spoke, said }));
  }

  // 预生成的音频（voice/lines.js）：有音频的句子放音频；没有的、放不出来的，改用外壳的朗读
  const voiced = await p.evaluate(async () => {
    CE.VOICE = { 'zh|有两辆车': 'aaa', 'en|car': 'broken' };
    window.__calls.length = 0;
    const ok = await CE.Speech.say(['有2辆车', { t: 'car', lang: 'en' }, '这句没有音频']);
    return { ok, order: window.__calls.filter(c => c[0] === 'audio' || c[0] === 'speak').map(c => c[0] + ' ' + c[1]) };
  });
  if (!voiced.ok || voiced.order.join(' | ') !== 'audio voice/aaa.mp3 | audio voice/broken.mp3 | speak car | speak 这句没有音频') {
    fail('朗读没有先用预生成的音频、再退回系统朗读：' + JSON.stringify(voiced));
  }

  // 家长页的“应用”一节，和交给外壳的几件事
  await p.goto(base + '/?test=1#/parent');
  await p.waitForSelector('#sec-ap [data-act="apply"]');
  await p.click('#sec-ap [data-act="apply"]');
  await p.click('#sec-ap [data-act="check"]');
  await p.fill('#sec-ap textarea[data-k="sources"]', 'http://192.168.1.10:38080/');
  await p.$eval('#sec-ap textarea[data-k="sources"]', t => t.dispatchEvent(new Event('change')));
  await p.click('[data-act="tts"]');
  await p.click('[data-act="export"]');
  const saved = await calls('saveText');
  let record = null;
  try { record = JSON.parse(saved[0][3]); } catch (e) { /* 下面报错 */ }
  if (!saved.length || saved[0][1] !== 'car-edu-record.json' || !record || record.v !== 1) fail('安卓：导出记录没有交给外壳');
  for (const n of ['applyUpdate', 'checkUpdate', 'openTtsSettings']) if (!(await calls(n)).length) fail('安卓：没有调用 ' + n);
  if ((await calls('setSources'))[0]?.[1] !== 'http://192.168.1.10:38080/') fail('安卓：更新地址没有交给外壳');
  // 外壳说状态变了：家长页重画
  await p.evaluate(() => { document.querySelector('#sec-ap').dataset.old = '1'; CE.Native.updated(); });
  if (await p.$('#sec-ap[data-old]')) fail('安卓：外壳通知以后家长页没有重画');

  // 打印交给系统
  await p.goto(base + '/?test=1#/print/week-w1');
  await p.click('.print-bar .go');
  const printed = await calls('print');
  if (!printed.length || !/第 1 周/.test(printed[0][1])) fail('安卓：打印没有交给外壳');
  await ctx.close();
}

(async () => {
  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const fail = msg => { errors.push(msg); };

  await page.goto(base + '/?test=1#/');
  await page.waitForSelector('.home');
  const days = await page.evaluate(() => CE.Plan.days().map(d => ({ id: d.id, acts: d.acts })));

  const missing = notLoaded();
  if (missing.length) throw new Error('index.html 里没有加载：' + missing.join(', '));
  const unknown = await page.evaluate(() =>
    [].concat(...CE.WEEKS.map(w => [].concat(...w.days, w.extra))).filter(a => !CE.ACTS[a]));
  if (unknown.length) throw new Error('周安排里用了没登记的活动：' + unknown.join(', '));
  const noPrint = await page.evaluate(() =>
    [].concat(...CE.WEEKS.map(w => w.prints)).filter(id => !CE.Print.LIST.some(p => p.id === id)));
  if (noPrint.length) throw new Error('周文件的 prints 里有没登记的打印材料：' + noPrint.join(', '));
  // 每一周都要有三条路：屏幕（五天）、纸、给家长的一页
  const thin = await page.evaluate(() => CE.WEEKS.filter(w => {
    const f = w.family || {};
    return w.days.length !== 5 || !w.prints.length || !w.idea ||
      !(f.talk || []).length || !(f.play || []).length || !(f.watch || []).length;
  }).map(w => w.id));
  if (thin.length) throw new Error('这几周缺了屏幕、纸或给家长的一页：' + thin.join(', '));

  let played = 0;
  for (const d of days) {
    for (const a of d.acts) { await play(page, base, a, 'd=' + d.id); played++; }
    await page.waitForSelector('.day-done');
  }
  // 只在“自由玩”里出现的活动，从自由玩入口再玩一遍
  const inDays = [].concat(...days.map(d => d.acts));
  const extras = (await page.evaluate(() => CE.Plan.freeActs())).filter(a => inDays.indexOf(a) < 0);
  await page.goto(base + '/?test=1#/free');
  await page.waitForSelector('.free-list .acard');
  for (const a of extras) { await play(page, base, a, 'f=1'); played++; }
  // 涂色默认是去纸上涂；屏幕上涂是备用的路，单独走一遍
  await play(page, base, 'color-xiaofeng', 'f=1', '.paper .plain'); played++;
  const painted = await page.evaluate(() => Object.keys(CE.Store.data.colors.xiaofeng || {}).length);
  if (!painted) fail('屏幕上涂色没有记录下颜色');

  const state = await page.evaluate(() => ({
    left: CE.Plan.current(), stars: CE.Store.stars(), log: CE.Store.data.log.length,
    acts: Object.keys(CE.ACTS).length, zh: Object.keys(CE.Store.data.items).filter(k => k.indexOf('zh:') === 0).length
  }));
  if (state.left) fail('还有没完成的日子：' + state.left.id);
  if (state.stars < days.length * 3) fail('星星数不对：' + state.stars);
  if (state.log < played) fail('活动流水少于实际次数');
  if (!state.zh) fail('没有记录到识字结果');

  // 每个登记的活动都应该出现在计划或自由玩里
  const orphan = await page.evaluate(() => Object.keys(CE.ACTS).filter(a => CE.Plan.freeActs().indexOf(a) < 0));
  if (orphan.length) fail('有活动没有入口：' + orphan.join(', '));

  await page.goto(base + '/?test=1#/parent');
  await page.waitForSelector('.doc .zgrid');
  await page.click('.zc');   // 手动标记一个字
  // 每一份打印材料，再加上每一周合在一起的那一份
  const prints = await page.evaluate(() => CE.Print.items().map(p => p.id).concat(CE.WEEKS.map(w => 'week-' + w.id)));
  for (const id of prints) {
    await page.goto(`${base}/?test=1#/print/${id}`);
    await page.waitForSelector('.sheet');
    // 每张纸高度固定（296mm），内容超出会被裁掉，印出来才发现就晚了。离下边不到 4mm 的地方多数打印机也印不到
    const over = await page.evaluate(() => [...document.querySelectorAll('.sheet')].filter(s => {
      const r = s.getBoundingClientRect(), edge = r.bottom - 4 * r.height / 296;
      // 只看网页元素：场景图里的背景色块本来就画到画布外面，会被裁掉，不算超出
      return [...s.querySelectorAll('*')].some(e => e instanceof HTMLElement && e.getBoundingClientRect().bottom > edge + 1);
    }).length);
    if (over) fail(`打印材料 ${id} 有 ${over} 页的内容超出了纸面`);
  }
  if (await page.evaluate(() => CE.Native !== null)) fail('在浏览器里打开时 CE.Native 应该是 null');

  await androidShell(browser, base, fail);

  await browser.close();
  srv.close();
  console.log(`玩了 ${played} 次活动（共 ${state.acts} 个活动），${state.stars} 颗星，记录了 ${state.zh} 个字，打开了 ${prints.length} 份打印材料（含按周合并的）。`);
  if (errors.length) { console.error('失败：\n' + errors.join('\n')); process.exit(1); }
  console.log('通过');
})().catch(e => { console.error(e); process.exit(1); });
