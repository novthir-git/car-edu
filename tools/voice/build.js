/* 用火山引擎给 collect.js 收集到的句子生成音频，写出 voice/<文件名>.mp3 和 voice/lines.js（句子 → 文件名）。
   只给新句子生成：上一次发布的音频放在 cacheDir，文件名由“声音 + 语速 + 语种 + 文字”算出来，没变的直接拿来用。
   每次最多生成 VOICE_MAX_CHARS 个字（默认 3000）。超出的句子这次先不生成，照常用系统朗读，下次发布接着补；
   不带数字的句子（故事、提示、夸奖）排在前面，数字组合排在后面。额度用完、Key 不对时也不让发布失败，只是少生成一些。

   运行：VOLC_TTS_API_KEY=… node tools/voice/build.js voice-lines.json <cacheDir> voice
         加 --dry 只看要生成多少，不调用接口。
   环境变量：VOLC_TTS_API_KEY（必需，放在 GitHub Secrets）、VOICE_MAX_CHARS、VOICE_SPEAKER。 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const os = require('os');

const [linesFile, cacheDir, outDir] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const DRY = process.argv.includes('--dry');
const KEY = process.env.VOLC_TTS_API_KEY || '';
const MAX = Number(process.env.VOICE_MAX_CHARS || 3000);
const SPEAKER = process.env.VOICE_SPEAKER || 'zh_female_xiaoxue_uranus_bigtts';   // 儿童绘本 2.0，中英文都用它
const BITRATE = process.env.VOICE_BITRATE || '32k';   // 存成单声道、这个码率的 mp3：人声听不出差别，大小是默认的一半
const RATE = 0;   // 火山引擎的语速，0 是正常速度；对应家长页设置里的 0.9（speech.js 按比例调播放速度）
const API = process.env.VOICE_API || 'https://openspeech.bytedance.com/api/v3/tts/unidirectional';   // VOICE_API 只在测试时换成假服务器

if (!linesFile || !outDir) {
  console.error('用法：node tools/voice/build.js voice-lines.json <cacheDir> voice [--dry]');
  process.exit(2);
}

const name = l => crypto.createHash('sha1').update([SPEAKER, RATE, l.lang, l.text].join('|')).digest('hex').slice(0, 16);

async function tts(l) {
  const body = { user: { uid: 'car-edu' }, req_params: { text: l.text, speaker: SPEAKER, audio_params: { format: 'mp3', sample_rate: 24000, speech_rate: RATE } } };
  const res = await fetch(API, {
    method: 'POST', body: JSON.stringify(body),
    headers: { 'X-Api-Key': KEY, 'X-Api-Resource-Id': 'seed-tts-2.0', 'X-Api-Request-Id': crypto.randomUUID(),
      'X-Control-Require-Usage-Tokens-Return': '*', 'Content-Type': 'application/json' }
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} ${text.slice(0, 200)}`);
    err.fatal = res.status === 401 || res.status === 403 || res.status === 429 && /quota|余额|额度/i.test(text);
    throw err;
  }
  // 返回的是一行一个 JSON，data 是 base64 的音频片段
  const chunks = [];
  let usage = null;
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    const o = JSON.parse(line);
    if (o.code !== 0 && o.code !== 20000000) {
      const err = new Error(`${o.code} ${o.message}`);
      err.fatal = /quota|余额|额度|not granted|Invalid X-Api-Key/i.test(o.message || '');
      throw err;
    }
    if (o.data) chunks.push(Buffer.from(o.data, 'base64'));
    if (o.usage) usage = o.usage;
  }
  const audio = Buffer.concat(chunks);
  if (!audio.length) throw new Error('没有返回音频');
  return { audio: shrink(audio), usage };
}

// 用 ffmpeg 压成单声道、BITRATE 码率。没有 ffmpeg 就原样保存
let ffmpeg = true;
function shrink(audio) {
  if (!ffmpeg) return audio;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'voice-'));
  try {
    fs.writeFileSync(path.join(dir, 'in.mp3'), audio);
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', path.join(dir, 'in.mp3'), '-ac', '1', '-b:a', BITRATE, path.join(dir, 'out.mp3')]);
    return fs.readFileSync(path.join(dir, 'out.mp3'));
  } catch (e) {
    if (e.code === 'ENOENT') { ffmpeg = false; console.error('没有 ffmpeg，音频不压缩'); }
    else console.error('压缩失败，原样保存：' + e.message);
    return audio;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

async function withRetry(l) {
  for (let i = 0; ; i++) {
    try { return await tts(l); } catch (e) {
      if (e.fatal || i >= 2) throw e;
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
}

(async () => {
  const lines = JSON.parse(fs.readFileSync(linesFile, 'utf8'));
  // 上次发布已经有音频的句子一直留着：随机出的题这次没抽到，下次抽到时就不用再花钱生成
  const prev = cacheDir && path.join(cacheDir, 'lines.js');
  if (prev && fs.existsSync(prev)) {
    const sandbox = { window: {} };
    try {
      new Function('window', 'CE', fs.readFileSync(prev, 'utf8').replace(/^window\.CE = window\.CE \|\| \{\};$/m, ''))(sandbox.window, sandbox.window.CE = {});
    } catch (e) { console.error('上次的 lines.js 读不出来，忽略：' + e.message); }
    const old = sandbox.window.CE.VOICE || {};
    const seen = new Set(lines.map(l => l.lang + '|' + l.text));
    for (const k of Object.keys(old)) {
      const i = k.indexOf('|'), l = { lang: k.slice(0, i), text: k.slice(i + 1) };
      if (!seen.has(k) && fs.existsSync(path.join(cacheDir, name(l) + '.mp3'))) { lines.push(l); seen.add(k); }
    }
  }
  fs.mkdirSync(outDir, { recursive: true });
  const have = new Set();
  for (const l of lines) {
    const f = name(l) + '.mp3';
    const from = cacheDir && path.join(cacheDir, f);
    if (fs.existsSync(path.join(outDir, f))) have.add(f);
    else if (from && fs.existsSync(from)) { fs.copyFileSync(from, path.join(outDir, f)); have.add(f); }
  }
  const todo = lines.filter(l => !have.has(name(l) + '.mp3'))
    .sort((a, b) => (/\d/.test(a.text) - /\d/.test(b.text)) || a.text.length - b.text.length);
  const todoChars = todo.reduce((s, l) => s + l.text.length, 0);

  let budget = MAX, made = 0, madeChars = 0, billed = 0, stop = '';
  const batch = [];
  for (const l of todo) { if (l.text.length > budget) break; budget -= l.text.length; batch.push(l); }
  if (DRY) {
    console.log(`共 ${lines.length} 句；已有音频 ${have.size} 句；要生成 ${todo.length} 句、${todoChars} 字；这次上限 ${MAX} 字，能生成 ${batch.length} 句`);
    return;
  }
  if (!KEY && batch.length) stop = '没有 VOLC_TTS_API_KEY，这次不生成';
  // 同时发 3 个请求
  let next = 0;
  const work = async () => {
    while (!stop && next < batch.length) {
      const l = batch[next++];
      try {
        const { audio, usage } = await withRetry(l);
        const f = name(l) + '.mp3';
        fs.writeFileSync(path.join(outDir, f), audio);
        have.add(f);
        made++; madeChars += l.text.length;
        billed += Number(usage && (usage.text_words || usage.text_tokens || usage.chars)) || 0;
      } catch (e) {
        if (e.fatal) stop = `火山引擎拒绝了请求（${e.message}）：Key 不对、服务没开通或额度用完，这次先生成到这里`;
        else console.error(`“${l.text}” 生成失败：${e.message}`);
      }
    }
  };
  if (!stop) await Promise.all([work(), work(), work()]);

  // 对照表只写有音频的句子；不再用到的旧音频删掉
  const map = {};
  for (const l of lines) { const f = name(l) + '.mp3'; if (have.has(f)) map[l.lang + '|' + l.text] = f.slice(0, -4); }
  const keep = new Set(Object.values(map).map(f => f + '.mp3'));
  for (const f of fs.readdirSync(outDir)) if (f.endsWith('.mp3') && !keep.has(f)) fs.unlinkSync(path.join(outDir, f));
  fs.writeFileSync(path.join(outDir, 'lines.js'),
    '/* 由 tools/voice/build.js 生成，不要手改。句子 → voice/ 下的音频文件。见仓库里的空白版说明。 */\n' +
    'window.CE = window.CE || {};\nCE.VOICE = ' + JSON.stringify(map) + ';\n');

  const left = lines.length - Object.keys(map).length;
  const report = [
    `朗读音频：${lines.length} 句里 ${Object.keys(map).length} 句有音频，${left} 句先用系统朗读。`,
    `这次生成 ${made} 句、${madeChars} 字${billed ? `（火山引擎计费 ${billed}）` : ''}；上限 ${MAX} 字。`,
    left ? `还差 ${todoChars - madeChars} 字。下次发布会接着补；想一次补齐，在 Actions 里手动运行“安卓应用”，把字数上限填大一些。` : '',
    stop
  ].filter(Boolean).join('\n');
  console.log(report);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, report.replace(/\n/g, '\n\n') + '\n');
})().catch(e => { console.error(e); process.exit(1); });
