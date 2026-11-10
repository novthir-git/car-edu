package com.caredu.app

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.speech.tts.Voice
import org.json.JSONArray
import org.json.JSONObject
import java.util.Locale

/**
 * 朗读。WebView 不支持浏览器的语音合成（speechSynthesis），所以由外壳用系统的 TextToSpeech 来读。
 * 网页那边（app/core/speech.js、native.js）一句一句地交过来，每读完一句回调 CE.Native.ended(编号)。
 * 用的是系统设置里的首选引擎；家长在系统设置里换了引擎、下载了语音包，回到应用时会重新连接。
 * 除了 voices()，所有操作都在主线程里做。
 */
internal class Speech(private val ctx: Context, private val host: Host) {

    interface Host {
        /** 一句读完了（或读不出来）。在任意线程调用。 */
        fun spoken(id: Int)

        /** 能用的声音变了。在任意线程调用。 */
        fun voicesChanged()
    }

    /** 引擎还没连上时交过来的最后一句，连上后再读。 */
    private class Line(val id: Int, val text: String, val lang: String, val voice: String, val rate: Float)

    private val main = Handler(Looper.getMainLooper())
    private val byName = HashMap<String, Voice>()
    private var tts: TextToSpeech? = null
    private var generation = 0
    private var enginePkg = ""
    private var pending: Line? = null

    @Volatile
    private var ready = false

    @Volatile
    private var failed = false

    /** 正在用的朗读引擎的名字，给家长看。 */
    @Volatile
    var engine = ""
        private set

    init {
        start()
    }

    private fun start() {
        ready = false
        failed = false
        byName.clear()
        val gen = ++generation
        // 没有任何引擎时，回调可能在构造函数里就同步发生，这时 tts 还没赋值，所以用 gen 认是哪一次
        tts = TextToSpeech(ctx) { status -> if (gen == generation) onInit(status) }
    }

    private fun onInit(status: Int) {
        val t = tts
        if (status != TextToSpeech.SUCCESS || t == null) {
            failed = true
            engine = ""
            dropPending()
            host.voicesChanged()
            return
        }
        enginePkg = t.defaultEngine.orEmpty()
        engine = try {
            t.engines.firstOrNull { it.name == enginePkg }?.label ?: enginePkg
        } catch (e: RuntimeException) {
            enginePkg   // 有的引擎会在这里出错，名字用包名就行
        }
        t.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(id: String?) {}
            override fun onDone(id: String?) = end(id)
            @Deprecated("Deprecated in Java")
            override fun onError(id: String?) = end(id)
            override fun onError(id: String?, code: Int) = end(id)
            override fun onStop(id: String?, interrupted: Boolean) = end(id)
        })
        ready = true
        host.voicesChanged()
        pending?.let {
            pending = null
            speakNow(it)
        }
    }

    private fun end(id: String?) {
        id?.toIntOrNull()?.let(host::spoken)   // 不是数字的不是我们交过去的句子
    }

    private fun dropPending() {
        pending?.let { host.spoken(it.id) }
        pending = null
    }

    /** 从系统设置回来时：换了首选引擎，或者装了新的语音包，就重新连接。 */
    fun recheck(force: Boolean) {
        main.post {
            val now = tts?.defaultEngine
            if (force || failed || now == null || now != enginePkg) {
                shutdown()
                start()
            }
        }
    }

    fun speak(id: Int, text: String, lang: String, voice: String, rate: Float) {
        main.post { speakNow(Line(id, text, lang, voice, rate)) }
    }

    private fun speakNow(line: Line) {
        val t = tts
        if (failed || t == null) {
            host.spoken(line.id)
            return
        }
        if (!ready) {
            dropPending()
            pending = line
            return
        }
        val v = find(line.voice)
        if (v != null) t.voice = v else t.language = Locale.forLanguageTag(line.lang)
        t.setSpeechRate(line.rate)
        t.setPitch(1f)
        if (t.speak(line.text, TextToSpeech.QUEUE_FLUSH, null, line.id.toString()) != TextToSpeech.SUCCESS) host.spoken(line.id)
    }

    fun stop() {
        main.post {
            dropPending()
            if (ready) tts?.stop()
        }
    }

    fun shutdown() {
        generation++
        pending = null
        ready = false
        try {
            tts?.stop()
            tts?.shutdown()
        } catch (e: RuntimeException) {
            // 引擎已经断开
        }
        tts = null
    }

    private fun find(name: String): Voice? {
        if (name.isEmpty() || name.startsWith("lang:")) return null
        if (byName.isEmpty()) voiceSet().forEach { byName[it.name] = it }
        return byName[name]
    }

    private fun voiceSet(): Set<Voice> = try {
        tts?.voices.orEmpty()
    } catch (e: RuntimeException) {
        emptySet()   // 有的引擎没实现这个接口
    }

    /** 中文和英文的声音，给 speech.js 挑。name 是给家长看的，voiceURI 是系统里的名字，q 是系统给的音质等级。 */
    fun voices(): String {
        val out = JSONArray()
        if (!ready) return out.toString()
        try {
            val count = HashMap<String, Int>()
            var zh = false
            var en = false
            for (v in voiceSet().sortedBy { it.name }) {
                if (v.features?.contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED) == true) continue
                val tag = tag(v.locale)
                val isZh = tag.startsWith("zh") || tag.startsWith("cmn")
                val isEn = tag.startsWith("en")
                if (!isZh && !isEn) continue
                zh = zh || isZh
                en = en || isEn
                val lang = v.locale.getDisplayName(Locale.SIMPLIFIED_CHINESE)
                val n = (count[lang] ?: 0) + 1
                count[lang] = n
                out.put(
                    JSONObject()
                        .put("name", "$lang $n" + if (v.isNetworkConnectionRequired) "（联网）" else "")
                        .put("voiceURI", v.name)
                        .put("lang", tag)
                        .put("q", v.quality)
                        .put("net", v.isNetworkConnectionRequired),
                )
            }
            // 有的引擎（不少手机厂商自带的）不列出具体的声音，只能按语言读
            if (!zh) fallback(out, Locale.SIMPLIFIED_CHINESE, "zh-CN", "系统默认（中文）")
            if (!en) fallback(out, Locale.US, "en-US", "系统默认（英文）")
        } catch (e: Exception) {
            // 列不出来就当没有
        }
        return out.toString()
    }

    private fun fallback(out: JSONArray, l: Locale, tag: String, name: String) {
        val t = tts ?: return
        if (t.isLanguageAvailable(l) >= TextToSpeech.LANG_AVAILABLE) {
            out.put(JSONObject().put("name", name).put("voiceURI", "lang:$tag").put("lang", tag))
        }
    }

    companion object {
        /** 统一成 zh-CN、cmn-CN、en-US 这样的写法。有的引擎用三个字母的代码（zho、CHN）。 */
        fun tag(l: Locale): String {
            var lang = l.language.lowercase(Locale.ROOT)
            if (lang == "zho" || lang == "chi") lang = "zh" else if (lang == "eng") lang = "en"
            var c = l.country
            if (c.length == 3) {
                c = Locale.getISOCountries().firstOrNull {
                    try {
                        Locale.Builder().setRegion(it).build().isO3Country.equals(c, ignoreCase = true)
                    } catch (e: RuntimeException) {
                        false   // 没有三个字母代码的地区
                    }
                } ?: c
            }
            return if (c.isEmpty()) lang else "$lang-${c.uppercase(Locale.ROOT)}"
        }
    }
}
