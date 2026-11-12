/* 收集孩子会听到的每一句话，给 build.js 生成音频用。
   用无头浏览器把每个活动在每个难度下反复玩（有时故意先点错，好收集答错时的话），
   直到连着几轮都冒不出新句子；再走一遍主页、每一站、自由玩、休息、家长页的试听。
   随机出的题（几辆车、几加几）靠多玩几遍收集，偶尔漏掉的句子照常用系统朗读。

   运行：node tools/voice/collect.js voice-lines.json        （需要 playwright，几分钟）
         node tools/voice/collect.js voice-lines.json --quick （每个活动只玩一遍，检查脚本没坏）
   输出：[{ "lang": "zh" | "en", "text": "…" }, …]，文字和 speech.js 查表用的一样（已经把“2辆”换成“两辆”）。 */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const OUT = process.argv[2] || 'voice-lines.json';
const QUICK = process.argv.includes('--quick');
const DRY = QUICK ? 1 : 4;          // 连着几轮没有新句子就换下一个
const MAX = QUICK ? 1 : 40;         // 一个活动、一个难度最多玩几轮
const WRONG = 0.35;                 // 选择题先点错的机会
const PAGES = 4;                    // 同时开几个页面
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

const said = new Map();   // "zh|文字" → { lang, text }

async function newPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  await page.exposeFunction('__said', (lang, text) => {
    const k = lang + '|' + text;
    if (!said.has(k)) said.set(k, { lang, text });
  });
  // 在 main.js 启动之前换掉 Speech.say：记下每一段，再照常交给原来的 say（?test=1 时它不出声）
  await page.addInitScript(() => document.addEventListener('DOMContentLoaded', () => {
    const S = window.CE.Speech, orig = S.say;
    S.say = function (parts) {
      [].concat(parts || []).forEach(p => {
        const o = typeof p === 'string' ? { t: p } : p;
        if (!o || !o.t) return;
        const en = o.lang === 'en';
        window.__said(en ? 'en' : 'zh', en ? String(o.t) : S.spoken(o.t));
      });
      return orig.apply(this, arguments);
    };
  }));
  page.on('pageerror', e => console.error('页面出错：' + e.message));
  return page;
}

// 玩一遍：和 tests/smoke.js 一样跟着 data-tn 点，选择题有时先点一个错的
async function play(page, base, act) {
  await page.goto(`${base}/?test=1#/play/${act}?f=1`);
  await page.waitForFunction(() => document.querySelector('.act-body') && !document.querySelector('.result'), null, { timeout: 10000 });
  for (let i = 0; i < 600; i++) {
    if (await page.$('.result')) {
      await page.click('.result .ok');
      return;
    }
    if (!(await page.$('.act'))) return;
    const el = await page.$('[data-tn]');
    if (!el) { await page.waitForTimeout(15); continue; }
    try {
      if (Math.random() < WRONG) {
        const wrong = await page.$$('.opt:not([data-tn]):not([disabled])');
        if (wrong.length) await wrong[Math.floor(Math.random() * wrong.length)].click({ timeout: 300 });
      }
      await el.click({ timeout: 300 });
    } catch (e) {
      const isRegion = await el.evaluate(n => n.classList.contains('rg')).catch(() => false);
      if (isRegion) await el.dispatchEvent('click').catch(() => {});
    }
  }
  throw new Error('活动没有走到结束：' + act);
}

(async () => {
  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  const first = await newPage(browser);

  // 主页、每一站、自由玩、休息、家长页的试听
  await first.goto(base + '/?test=1#/');
  await first.waitForSelector('.home');
  const info = await first.evaluate(() => ({
    days: CE.Plan.days().map(d => d.id),
    acts: Object.keys(CE.ACTS).map(id => ({ id, lv: CE.ACTS[id].leveled || 1 }))
  }));
  for (const d of info.days) { await first.goto(`${base}/?test=1#/day/${d}`); await first.waitForTimeout(50); }
  await first.goto(base + '/?test=1#/free');
  await first.waitForSelector('.free-list');
  await first.evaluate(() => CE.Rest.show(document.querySelector('#app')));
  await first.goto(base + '/?test=1#/parent');
  await first.waitForSelector('[data-act="try-zh"]');
  await first.click('[data-act="try-zh"]');
  await first.click('[data-act="try-en"]');

  // 每个活动、每个难度反复玩
  const jobs = [];
  info.acts.forEach(a => { for (let lv = 1; lv <= a.lv; lv++) jobs.push({ id: a.id, lv }); });
  const pages = [first];
  while (pages.length < PAGES) pages.push(await newPage(browser));
  let rounds = 0;
  const worker = async page => {
    while (jobs.length) {
      const job = jobs.shift();
      let dry = 0;
      for (let r = 0; r < MAX && dry < DRY; r++) {
        const before = said.size;
        await page.goto(base + '/?test=1#/');
        await page.evaluate(j => { CE.Store.setLv(j.id, j.lv); CE.Store.flush(); }, job);
        try { await play(page, base, job.id); } catch (e) { console.error(`${job.id} 第 ${job.lv} 级：${e.message}`); break; }
        rounds++;
        dry = said.size > before ? 0 : dry + 1;
      }
    }
  };
  await Promise.all(pages.map(worker));
  await browser.close();
  srv.close();

  const list = [...said.values()].sort((a, b) => (a.lang + a.text).localeCompare(b.lang + b.text));
  fs.writeFileSync(OUT, JSON.stringify(list, null, 1));
  const chars = list.reduce((s, x) => s + x.text.length, 0);
  console.log(`玩了 ${rounds} 遍，收集到 ${list.length} 句（中文 ${list.filter(x => x.lang === 'zh').length}，英文 ${list.filter(x => x.lang === 'en').length}），共 ${chars} 字 → ${OUT}`);
})().catch(e => { console.error(e); process.exit(1); });
