/* 预先生成好的朗读音频：句子 → voice/ 下的音频文件。
   仓库里是空的。合并到 main 时，GitHub Actions 用火山引擎生成音频并覆盖这个文件（见 tools/voice/），
   跟着安卓应用和热更新包发出去。查不到的句子照常用系统朗读，所以这里空着也能用。
   键是“语种|文字”（语种 zh 或 en，文字是 Speech.spoken 处理过的），值是文件名（不带 .mp3）。 */
window.CE = window.CE || {};
CE.VOICE = {};
