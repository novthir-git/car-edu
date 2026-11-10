package com.caredu.app

import android.webkit.JavascriptInterface
import org.json.JSONException
import org.json.JSONObject

/**
 * 网页能用的外壳功能，在页面上是 window.CEAndroid。网页那边的约定写在 app/core/native.js，两边要一起改。
 * 网页要用到这里新加的功能时，外壳的版本（app/build.gradle.kts 的 shell）要加一。
 * 这些方法在 WebView 的后台线程里被调用，碰界面的事都转回主线程。
 * 字符串参数都写成可空的：网页传来 null 时不能让应用崩掉。
 */
internal class Bridge(private val a: MainActivity) {

    /** 外壳和内容的版本、更新的状态、朗读引擎。 */
    @JavascriptInterface
    fun info(): String {
        val o = JSONObject()
        try {
            o.put("shell", BuildConfig.SHELL)
            o.put("app", BuildConfig.VERSION_NAME)
            val cur = a.files.cur
            val best = a.files.best()
            o.put("content", cur.json())
            if (best.v > cur.v) o.put("staged", best.json())
            o.put("engine", a.speech.engine)
            a.updater.put(o)
        } catch (e: JSONException) {
            // 能放多少放多少
        }
        return o.toString()
    }

    @JavascriptInterface
    fun voices(): String = a.speech.voices()

    @JavascriptInterface
    fun speak(id: Int, text: String?, lang: String?, voice: String?, rate: Double) =
        a.speech.speak(id, text.orEmpty(), lang ?: "zh-CN", voice.orEmpty(), rate.toFloat())

    @JavascriptInterface
    fun stop() = a.speech.stop()

    @JavascriptInterface
    fun openTtsSettings() = a.runOnUiThread { a.openTtsSettings() }

    @JavascriptInterface
    fun print(name: String?) = a.runOnUiThread { a.print(name.orEmpty()) }

    @JavascriptInterface
    fun saveText(name: String?, mime: String?, text: String?) =
        a.runOnUiThread { a.saveText(name.orEmpty(), mime ?: "application/octet-stream", text.orEmpty()) }

    @JavascriptInterface
    fun setSources(text: String?) = a.updater.setSources(text)

    @JavascriptInterface
    fun checkUpdate() = a.updater.check()

    @JavascriptInterface
    fun applyUpdate() = a.runOnUiThread { a.load() }
}
