package com.caredu.app

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.io.File
import java.io.IOException
import java.net.ConnectException
import java.net.HttpURLConnection
import java.net.SocketTimeoutException
import java.net.URL
import java.net.UnknownHostException
import java.security.PublicKey
import java.security.cert.CertificateFactory
import java.util.concurrent.Executors

/**
 * 热更新：从更新地址下载新的网页内容。一个更新地址下面放三个文件（GitHub Actions 打包，见 .github/workflows/android.yml）：
 * - version.json：内容版本 v、需要的外壳版本 shell、www.zip 的大小和 sha256；
 * - version.sig：version.json 的签名，用的是打 APK 的同一把钥匙；
 * - www.zip：网页（index.html、app/、content/）。
 * 签名对不上、外壳版本不够、摘要不对的，一律不换。下载好的内容先放着，下次加载页面时才换上（见 MainActivity）。
 */
internal class Updater(
    private val ctx: Context,
    private val files: WebFiles,
    private val changed: () -> Unit,
) {
    private val prefs = ctx.getSharedPreferences("update", Context.MODE_PRIVATE)
    private val worker = Executors.newSingleThreadExecutor()

    @Volatile
    var busy = false
        private set

    /** 家长填的地址，一行一个。 */
    fun userSources(): List<String> =
        prefs.getString("sources", "").orEmpty().lines()
            .map { it.trim() }
            .filter { it.isNotEmpty() }
            .map { if (Regex("(?i)https?://.*").matches(it)) it else "http://$it" }
            .map { if (it.endsWith("/")) it else "$it/" }
            .distinct()

    /** 打包时写进来的地址（GitHub 上这个仓库最新的发布）。家长的地址都连不上时才用。 */
    fun builtinSources(): List<String> = listOf(BuildConfig.UPDATE_URL).filter { it.isNotEmpty() }

    fun setSources(text: String?) {
        prefs.edit().putString("sources", text.orEmpty()).apply()
        check()
    }

    fun put(o: JSONObject) {
        o.put("checking", busy)
        prefs.getLong("last", 0).takeIf { it > 0 }?.let { o.put("last", it) }
        o.put("msg", prefs.getString("msg", ""))
        o.put("sources", JSONArray(userSources()))
        o.put("builtin", JSONArray(builtinSources()))
    }

    fun maybeCheck() {
        if (System.currentTimeMillis() - prefs.getLong("last", 0) >= EVERY) check()
    }

    @Synchronized
    fun check() {
        if (busy) return
        busy = true
        changed()
        worker.execute {
            val msg = try {
                run()
            } catch (e: Exception) {
                "检查失败：${reason(e)}"
            }
            prefs.edit().putLong("last", System.currentTimeMillis()).putString("msg", msg).apply()
            busy = false
            changed()
        }
    }

    private fun run(): String {
        val all = userSources() + builtinSources()
        if (all.isEmpty()) return "还没有填更新地址。"
        // 上次下到一半（比如应用被关掉）留下的文件
        files.dir.listFiles().orEmpty().filter { it.name.endsWith(".part") }.forEach { it.deleteRecursively() }
        val fails = mutableListOf<String>()
        for (base in all) {
            try {
                return fetch(base)
            } catch (e: Exception) {
                fails += "${host(base)} ${reason(e)}"
            }
        }
        return "都没连上：${fails.joinToString("；")}。"
    }

    private fun fetch(base: String): String {
        val man = get(base + "version.json", 64 * 1024)
        val sig = get(base + "version.sig", 16 * 1024)
        if (keys().none { Pack.verify(it, man, sig) }) throw IOException("签名对不上")
        val m = JSONObject(String(man, Charsets.UTF_8))
        val v = m.getLong("v")
        val from = "（来自 ${host(base)}）"
        if (v <= files.best().v) return "已经是最新的$from。"
        if (m.getInt("shell") > BuildConfig.SHELL) return "有新内容，但要先下载安装新的应用（APK）$from。"
        if (files.isBad(v)) return "有新内容，但上次没能打开，先不换$from。"

        val zip = File(files.dir, "$v.zip.part")
        val tmp = File(files.dir, "$v.part")
        try {
            val size = m.getLong("size")
            if (size > MAX_ZIP) throw IOException("更新包太大")
            download(base + "www.zip", zip, size)
            if (!Pack.sha256(zip).equals(m.getString("sha256"), ignoreCase = true)) throw IOException("下载的文件不完整")
            tmp.deleteRecursively()
            Pack.unzip(zip, tmp, MAX_UNZIPPED)
            if (!File(tmp, "index.html").isFile) throw IOException("更新包里没有 index.html")
            val dest = File(files.dir, v.toString())
            dest.deleteRecursively()
            if (!tmp.renameTo(dest)) throw IOException("保存失败")
            File(files.dir, "$v.json").writeBytes(man)
        } finally {
            zip.delete()
            tmp.deleteRecursively()
        }
        return "新内容已经下载好$from，下次打开应用时换上。"
    }

    /** 应用自己的签名证书里的公钥：更新包必须是用同一把钥匙签的。 */
    private fun keys(): List<PublicKey> {
        val pm = ctx.packageManager
        val sigs = if (Build.VERSION.SDK_INT >= 28) {
            pm.getPackageInfo(ctx.packageName, PackageManager.GET_SIGNING_CERTIFICATES).signingInfo?.apkContentsSigners
        } else {
            @Suppress("DEPRECATION")
            pm.getPackageInfo(ctx.packageName, PackageManager.GET_SIGNATURES).signatures
        }
        val cf = CertificateFactory.getInstance("X.509")
        return sigs.orEmpty().map { cf.generateCertificate(it.toByteArray().inputStream()).publicKey }
    }

    companion object {
        private const val EVERY = 6 * 3600_000L   // 自动检查的间隔
        private const val MAX_ZIP = 50L shl 20
        private const val MAX_UNZIPPED = 200L shl 20

        private fun get(url: String, max: Int): ByteArray {
            val c = open(url)
            try {
                return c.inputStream.use { Pack.read(it, max) }
            } finally {
                c.disconnect()
            }
        }

        private fun download(url: String, to: File, size: Long) {
            val c = open(url)
            try {
                c.inputStream.use { input ->
                    to.outputStream().use { out ->
                        val buf = ByteArray(16384)
                        var n = 0L
                        while (true) {
                            val r = input.read(buf)
                            if (r < 0) break
                            n += r
                            if (n > size) throw IOException("下载的文件比说好的大")
                            out.write(buf, 0, r)
                        }
                    }
                }
            } finally {
                c.disconnect()
            }
        }

        /** HttpURLConnection 不跟随 http 和 https 之间的跳转，这里自己跟（GitHub 的下载地址会跳转）。 */
        private fun open(start: String): HttpURLConnection {
            var url = start
            repeat(6) {
                val c = URL(url).openConnection() as HttpURLConnection
                c.connectTimeout = 10_000
                c.readTimeout = 30_000
                c.useCaches = false
                c.instanceFollowRedirects = false
                c.setRequestProperty("Cache-Control", "no-cache")
                val code = c.responseCode
                if (code in 300..399) {
                    val loc = c.getHeaderField("Location")
                    c.disconnect()
                    url = URL(URL(url), loc ?: throw IOException("跳转没有地址")).toString()
                    return@repeat
                }
                if (code != 200) {
                    c.disconnect()
                    throw IOException("HTTP $code")
                }
                return c
            }
            throw IOException("跳转太多")
        }

        private fun host(url: String): String = try {
            URL(url).let { it.host + if (it.port > 0) ":${it.port}" else "" }
        } catch (e: IOException) {
            url
        }

        private fun reason(e: Exception): String = when (e) {
            is UnknownHostException -> "找不到这个地址"
            is SocketTimeoutException -> "连接超时"
            is ConnectException -> "连不上"
            is JSONException -> "version.json 不对"
            else -> e.message?.takeIf { it.isNotEmpty() } ?: e.javaClass.simpleName
        }
    }
}
