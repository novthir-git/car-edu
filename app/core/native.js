/* 安卓应用的外壳（android/）。页面在安卓应用里打开时，外壳会在页面上放一个 window.CEAndroid，
   把 WebView 自己做不到的事交给系统：朗读、打印、保存文件、检查更新。在浏览器里打开时 CE.Native 是 null，
   其余代码照常走浏览器自己的路。
   这里是网页和外壳之间唯一的约定。改这里，要同时改外壳的 Bridge.java（android/app/src/main/java/.../Bridge.java）；
   网页要用到外壳的新能力时，外壳的版本（android/app/build.gradle.kts 里的 shell）要加一。 */
(function (CE) {
  'use strict';
  const A = window.CEAndroid;
  if (!A) { CE.Native = null; return; }

  const json = (s, d) => { try { return JSON.parse(s) || d; } catch (e) { return d; } };
  let ends = {}, seq = 0;   // 正在读的句子：外壳读完一句，按编号回调

  const N = CE.Native = {
    // 外壳和内容的版本、更新的状态、朗读引擎
    info: () => json(A.info(), {}),

    // 系统的朗读。WebView 不支持浏览器的语音合成，speech.js 在安卓应用里用这一套
    tts: {
      voices: () => json(A.voices(), []),
      speak(text, lang, voice, rate, done) {
        const id = ++seq;
        ends[id] = done;
        A.speak(id, text, lang, voice ? voice.voiceURI || '' : '', rate);
      },
      cancel() { ends = {}; A.stop(); },
      settings: () => A.openTtsSettings()
    },

    print: name => A.print(String(name || '')),
    saveText: (name, mime, text) => A.saveText(name, mime, text),

    // 更新：sources 是家长填的更新地址，一行一个
    setSources: text => A.setSources(String(text || '')),
    checkUpdate: () => A.checkUpdate(),
    applyUpdate: () => A.applyUpdate(),

    /* ---------- 下面这些由外壳调用 ---------- */
    ended(id) { const f = ends[id]; delete ends[id]; if (f) f(); },
    voicesChanged() { CE.Speech.refresh(); N.changed(); },
    updated() { N.changed(); },
    changed() { if (CE.Parent && CE.Parent.refresh) CE.Parent.refresh(); }
  };
})(window.CE);
