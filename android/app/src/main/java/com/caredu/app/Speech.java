package com.caredu.app;

import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * 朗读。WebView 不支持浏览器的语音合成（speechSynthesis），所以由外壳用系统的 TextToSpeech 来读。
 * 网页那边（app/core/speech.js、native.js）一句一句地交过来，每读完一句回调 CE.Native.ended(编号)。
 * 用的是系统设置里的首选引擎；家长在系统设置里换了引擎、下载了语音包，回到应用时会重新连接。
 */
final class Speech {
    interface Host {
        /** 一句读完了（或读不出来）。在任意线程调用。 */
        void spoken(int id);

        /** 能用的声音变了。在任意线程调用。 */
        void voicesChanged();
    }

    private final android.content.Context ctx;
    private final Host host;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final Map<String, Voice> byName = new HashMap<>();

    private TextToSpeech tts;
    private int generation;
    private volatile boolean ready;
    private volatile boolean failed;
    private volatile String engine = "";
    private String enginePkg = "";
    /** 引擎还没连上时交过来的最后一句，连上后再读。 */
    private Object[] pending;

    Speech(android.content.Context ctx, Host host) {
        this.ctx = ctx;
        this.host = host;
        start();
    }

    private void start() {
        ready = false;
        failed = false;
        byName.clear();
        final int gen = ++generation;
        // 没有任何引擎时，回调可能在构造函数里就同步发生，这时 tts 还没赋值，所以用 gen 认是哪一次
        tts = new TextToSpeech(ctx, status -> {
            if (gen == generation) onInit(status);
        });
    }

    private void onInit(int status) {
        if (status != TextToSpeech.SUCCESS || tts == null) {
            failed = true;
            engine = "";
            dropPending();
            host.voicesChanged();
            return;
        }
        enginePkg = tts.getDefaultEngine();
        engine = enginePkg;
        try {
            for (TextToSpeech.EngineInfo e : tts.getEngines()) {
                if (e.name.equals(enginePkg)) engine = e.label;
            }
        } catch (RuntimeException ignored) {
            // 有的引擎会在这里出错，名字用包名就行
        }
        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override public void onStart(String id) {}
            @Override public void onDone(String id) { end(id); }
            @Override public void onError(String id) { end(id); }
            @Override public void onError(String id, int code) { end(id); }
            @Override public void onStop(String id, boolean interrupted) { end(id); }
        });
        ready = true;
        host.voicesChanged();
        if (pending != null) {
            Object[] p = pending;
            pending = null;
            speakNow((Integer) p[0], (String) p[1], (String) p[2], (String) p[3], (Float) p[4]);
        }
    }

    private void end(String id) {
        try {
            host.spoken(Integer.parseInt(id));
        } catch (NumberFormatException ignored) {
            // 不是我们交过去的句子
        }
    }

    private void dropPending() {
        if (pending != null) host.spoken((Integer) pending[0]);
        pending = null;
    }

    String engine() {
        return engine;
    }

    /** 从系统设置回来时：换了首选引擎，或者装了新的语音包，就重新连接。 */
    void recheck(boolean force) {
        main.post(() -> {
            String now = tts == null ? null : tts.getDefaultEngine();
            if (force || failed || now == null || !now.equals(enginePkg)) {
                shutdown();
                start();
            }
        });
    }

    void speak(int id, String text, String lang, String voice, float rate) {
        main.post(() -> speakNow(id, text, lang, voice, rate));
    }

    private void speakNow(int id, String text, String lang, String voice, float rate) {
        if (failed || tts == null) {
            host.spoken(id);
            return;
        }
        if (!ready) {
            dropPending();
            pending = new Object[]{id, text, lang, voice, rate};
            return;
        }
        Voice v = find(voice);
        if (v != null) tts.setVoice(v);
        else tts.setLanguage(Locale.forLanguageTag(lang));
        tts.setSpeechRate(rate);
        tts.setPitch(1f);
        if (tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, String.valueOf(id)) != TextToSpeech.SUCCESS) host.spoken(id);
    }

    void stop() {
        main.post(() -> {
            dropPending();
            if (tts != null && ready) tts.stop();
        });
    }

    void shutdown() {
        generation++;
        pending = null;
        ready = false;
        if (tts != null) {
            try {
                tts.stop();
                tts.shutdown();
            } catch (RuntimeException ignored) {
                // 引擎已经断开
            }
            tts = null;
        }
    }

    private Voice find(String name) {
        if (name == null || name.isEmpty() || name.startsWith("lang:")) return null;
        if (byName.isEmpty()) {
            Set<Voice> all = voiceSet();
            if (all != null) for (Voice v : all) byName.put(v.getName(), v);
        }
        return byName.get(name);
    }

    private Set<Voice> voiceSet() {
        try {
            return tts == null ? null : tts.getVoices();
        } catch (RuntimeException e) {
            return null;   // 有的引擎没实现这个接口
        }
    }

    /** 中文和英文的声音，给 speech.js 挑。name 是给家长看的，voiceURI 是系统里的名字，q 是系统给的音质等级。 */
    String voices() {
        JSONArray out = new JSONArray();
        if (!ready) return out.toString();
        try {
            List<Voice> list = new ArrayList<>();
            Set<Voice> all = voiceSet();
            if (all != null) list.addAll(all);
            list.sort(Comparator.comparing(Voice::getName));
            Map<String, Integer> count = new HashMap<>();
            boolean zh = false, en = false;
            for (Voice v : list) {
                Set<String> f = v.getFeatures();
                if (f != null && f.contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED)) continue;
                String tag = tag(v.getLocale());
                boolean isZh = tag.startsWith("zh") || tag.startsWith("cmn");
                boolean isEn = tag.startsWith("en");
                if (!isZh && !isEn) continue;
                zh |= isZh;
                en |= isEn;
                String lang = v.getLocale().getDisplayName(Locale.SIMPLIFIED_CHINESE);
                int n = count.merge(lang, 1, Integer::sum);
                out.put(new JSONObject()
                        .put("name", lang + " " + n + (v.isNetworkConnectionRequired() ? "（联网）" : ""))
                        .put("voiceURI", v.getName())
                        .put("lang", tag)
                        .put("q", v.getQuality())
                        .put("net", v.isNetworkConnectionRequired()));
            }
            // 有的引擎（不少手机厂商自带的）不列出具体的声音，只能按语言读
            if (!zh) fallback(out, Locale.SIMPLIFIED_CHINESE, "zh-CN", "系统默认（中文）");
            if (!en) fallback(out, Locale.US, "en-US", "系统默认（英文）");
        } catch (JSONException | RuntimeException ignored) {
            // 列不出来就当没有
        }
        return out.toString();
    }

    private void fallback(JSONArray out, Locale l, String tag, String name) throws JSONException {
        if (tts != null && tts.isLanguageAvailable(l) >= TextToSpeech.LANG_AVAILABLE) {
            out.put(new JSONObject().put("name", name).put("voiceURI", "lang:" + tag).put("lang", tag));
        }
    }

    /** 统一成 zh-CN、cmn-CN、en-US 这样的写法。有的引擎用三个字母的代码（zho、CHN）。 */
    @SuppressWarnings("deprecation")
    static String tag(Locale l) {
        String lang = l.getLanguage().toLowerCase(Locale.ROOT);
        String c = l.getCountry();
        if (lang.equals("zho") || lang.equals("chi")) lang = "zh";
        else if (lang.equals("eng")) lang = "en";
        if (c.length() == 3) {
            for (String iso : Locale.getISOCountries()) {
                try {
                    if (new Locale("", iso).getISO3Country().equalsIgnoreCase(c)) {
                        c = iso;
                        break;
                    }
                } catch (RuntimeException ignored) {
                    // 没有三个字母代码的地区
                }
            }
        }
        return c.isEmpty() ? lang : lang + "-" + c.toUpperCase(Locale.ROOT);
    }
}
