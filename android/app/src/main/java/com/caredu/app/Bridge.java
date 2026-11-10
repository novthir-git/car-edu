package com.caredu.app;

import android.webkit.JavascriptInterface;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * 网页能用的外壳功能，在页面上是 window.CEAndroid。网页那边的约定写在 app/core/native.js，两边要一起改。
 * 网页要用到这里新加的功能时，外壳的版本（app/build.gradle.kts 的 shell）要加一。
 * 这些方法在 WebView 的后台线程里被调用，碰界面的事都转回主线程。
 */
final class Bridge {
    private final MainActivity a;

    Bridge(MainActivity a) {
        this.a = a;
    }

    /** 外壳和内容的版本、更新的状态、朗读引擎。 */
    @JavascriptInterface
    public String info() {
        JSONObject o = new JSONObject();
        try {
            o.put("shell", BuildConfig.VERSION_CODE);
            o.put("app", BuildConfig.VERSION_NAME);
            WebFiles.Version cur = a.files.cur, best = a.files.best();
            o.put("content", cur.json());
            if (best.v > cur.v) o.put("staged", best.json());
            o.put("engine", a.speech.engine());
            a.updater.put(o);
        } catch (JSONException ignored) {
            // 能放多少放多少
        }
        return o.toString();
    }

    @JavascriptInterface
    public String voices() {
        return a.speech.voices();
    }

    @JavascriptInterface
    public void speak(int id, String text, String lang, String voice, double rate) {
        a.speech.speak(id, text, lang, voice, (float) rate);
    }

    @JavascriptInterface
    public void stop() {
        a.speech.stop();
    }

    @JavascriptInterface
    public void openTtsSettings() {
        a.runOnUiThread(a::openTtsSettings);
    }

    @JavascriptInterface
    public void print(String name) {
        a.runOnUiThread(() -> a.print(name));
    }

    @JavascriptInterface
    public void saveText(String name, String mime, String text) {
        a.runOnUiThread(() -> a.saveText(name, mime, text));
    }

    @JavascriptInterface
    public void setSources(String text) {
        a.updater.setSources(text);
    }

    @JavascriptInterface
    public void checkUpdate() {
        a.updater.check();
    }

    @JavascriptInterface
    public void applyUpdate() {
        a.runOnUiThread(a::load);
    }
}
