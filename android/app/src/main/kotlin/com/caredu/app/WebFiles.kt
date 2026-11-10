package com.caredu.app

import android.content.Context
import android.net.Uri
import android.webkit.WebResourceResponse
import org.json.JSONObject
import java.io.ByteArrayInputStream
import java.io.File
import java.io.FileInputStream
import java.io.IOException

/**
 * 把网页交给 WebView。网页有两份来源：
 * - 应用自带的，在 assets/www（打包时从仓库根目录复制进来）；
 * - 下载的更新，在 files/web/版本号/（Updater 下载、核对签名后放进来）。
 * 两份都用同一个地址 https://appassets.androidplatform.net/www/ 打开，所以学习记录（localStorage）不受影响。
 * 这个地址发布后不能改，改了记录就找不到了。
 */
internal class WebFiles(private val ctx: Context) {

    /** 一份网页内容。root 为 null 表示应用自带的那份。 */
    class Version(o: JSONObject, val root: File?) {
        val v: Long = o.optLong("v")
        val sha: String = o.optString("sha")
        val shell: Int = o.optInt("shell")

        fun json(): JSONObject = JSONObject().put("v", v).put("sha", sha).put("from", if (root == null) "apk" else "update")
    }

    val dir = File(ctx.filesDir, "web").apply { mkdirs() }
    private val prefs = ctx.getSharedPreferences("web", Context.MODE_PRIVATE)
    private val bundled: Version = try {
        ctx.assets.open("content.json").use { Version(JSONObject(String(Pack.read(it, 4096), Charsets.UTF_8)), null) }
    } catch (e: Exception) {
        Version(JSONObject(), null)
    }

    /** 现在正在用的那一份。只在重新加载页面之前换，不会一页里混着两份。 */
    @Volatile
    var cur: Version = bundled
        private set

    /** 能用的最新一份：下载的更新要比自带的新、外壳版本够、上次没出过问题、文件齐。 */
    fun best(): Version {
        var best = bundled
        val bad = bad()
        for (d in dir.listFiles().orEmpty()) {
            if (!d.isDirectory || !d.name.all { it.isDigit() } || d.name in bad) continue
            val man = File(dir, d.name + ".json")
            if (!man.isFile || !File(d, "index.html").isFile) continue
            try {
                val v = Version(JSONObject(String(man.inputStream().use { Pack.read(it, 65536) }, Charsets.UTF_8)), d)
                if (v.v > best.v && v.shell <= BuildConfig.SHELL) best = v
            } catch (e: Exception) {
                // 坏掉的记录就当没有
            }
        }
        return best
    }

    /** 换成最新的一份（下一次加载页面时生效），顺便删掉用不着的旧版本。 */
    fun useBest() {
        val now = best()
        cur = now
        val keep = now.root?.name ?: ""
        for (f in dir.listFiles().orEmpty()) {
            // .part 是正在下载的，由 Updater 自己收拾
            if (f.name == keep || f.name == "$keep.json" || f.name.endsWith(".part")) continue
            f.deleteRecursively()
        }
    }

    fun hasNewer(): Boolean = best().v > cur.v

    /** 这一份下载的内容打不开：记下来，以后不再用它。 */
    fun markBad(v: Long) {
        prefs.edit().putStringSet("bad", bad() + v.toString()).apply()
    }

    fun isBad(v: Long): Boolean = v.toString() in bad()

    private fun bad(): Set<String> = prefs.getStringSet("bad", null).orEmpty()

    /** WebView 要的每一个文件都从这里给。别的网址一律不放行：应用不需要联网打开网页。 */
    fun serve(u: Uri): WebResourceResponse {
        val path = u.path
        if (u.host != HOST || path == null || !path.startsWith("/www/") || ".." in path) return missing(403)
        val rel = path.removePrefix("/www/").ifEmpty { "index.html" }
        val root = cur.root
        return try {
            val input = if (root != null) FileInputStream(File(root, rel)) else ctx.assets.open("www/$rel")
            val type = TYPES[rel.substringAfterLast('.').lowercase()] ?: "application/octet-stream"
            WebResourceResponse(type, "utf-8", input).apply { responseHeaders = mapOf("Cache-Control" to "no-cache") }
        } catch (e: IOException) {
            missing(404)
        }
    }

    companion object {
        const val HOST = "appassets.androidplatform.net"
        const val URL = "https://$HOST/www/index.html"

        private val TYPES = mapOf(
            "html" to "text/html", "js" to "text/javascript", "css" to "text/css", "json" to "application/json",
            "svg" to "image/svg+xml", "png" to "image/png", "jpg" to "image/jpeg", "webp" to "image/webp", "woff2" to "font/woff2",
        )

        private fun missing(code: Int) = WebResourceResponse(
            "text/plain", "utf-8", code, if (code == 404) "Not Found" else "Forbidden",
            emptyMap(), ByteArrayInputStream(ByteArray(0)),
        )
    }
}
