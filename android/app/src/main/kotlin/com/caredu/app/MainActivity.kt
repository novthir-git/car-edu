package com.caredu.app

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.print.PrintAttributes
import android.print.PrintManager
import android.provider.Settings
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.webkit.RenderProcessGoneDetail
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.Toast
import android.window.OnBackInvokedDispatcher
import java.io.IOException

/**
 * 安卓应用的外壳：一个全屏的 WebView，打开仓库里的网页（index.html、app/、content/）。
 * WebView 自己做不到的事由外壳补上：朗读（Speech）、打印、保存和选择文件、热更新（Updater）。
 */
class MainActivity : Activity(), Speech.Host {

    internal lateinit var files: WebFiles
    internal lateinit var speech: Speech
    internal lateinit var updater: Updater
    private lateinit var root: FrameLayout
    private var web: WebView? = null
    private var openCallback: ValueCallback<Array<Uri>>? = null
    private var saveTextPending: String? = null
    private var pausedAt = 0L
    private var freshLoad = false
    private var ttsSettings = false

    override fun onCreate(state: Bundle?) {
        super.onCreate(state)
        files = WebFiles(this)
        updater = Updater(applicationContext, files, ::pageChanged)
        speech = Speech(applicationContext, this)
        volumeControlStream = AudioManager.STREAM_MUSIC

        root = FrameLayout(this).apply { setBackgroundColor(SKY) }
        setContentView(root)
        fullscreen()
        createWeb()
        if (Build.VERSION.SDK_INT >= 33) {
            onBackInvokedDispatcher.registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT) { back() }
        }
        load()
        updater.check()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun createWeb() {
        val w = WebView(this)
        web = w
        w.setBackgroundColor(SKY)
        root.addView(w, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
        w.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true                  // 学习记录存在 localStorage
            mediaPlaybackRequiresUserGesture = false  // 音效用 WebAudio
            allowFileAccess = false
            allowContentAccess = false
            textZoom = 100                            // 系统字体调大时版面不乱
        }
        if (applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE != 0) WebView.setWebContentsDebuggingEnabled(true)
        w.addJavascriptInterface(Bridge(this), "CEAndroid")
        w.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(v: WebView, r: WebResourceRequest): WebResourceResponse = files.serve(r.url)

            // 不离开自己的页面
            override fun shouldOverrideUrlLoading(v: WebView, r: WebResourceRequest): Boolean = r.url.host != WebFiles.HOST

            override fun onPageFinished(v: WebView, url: String?) {
                if (!freshLoad) return
                freshLoad = false
                v.clearHistory()
                checkBoot()
            }

            override fun onRenderProcessGone(v: WebView, d: RenderProcessGoneDetail): Boolean {
                // 网页的进程崩了（多半是系统内存不够）：整个重来，不让应用跟着退出
                root.removeView(v)
                v.destroy()
                web = null
                recreate()
                return true
            }
        }
        w.webChromeClient = object : WebChromeClient() {
            // 家长页的“导入记录”
            override fun onShowFileChooser(v: WebView, cb: ValueCallback<Array<Uri>>, p: FileChooserParams): Boolean {
                openCallback?.onReceiveValue(null)
                openCallback = cb
                val i = Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*")
                return try {
                    startActivityForResult(i, REQ_OPEN)
                    true
                } catch (e: ActivityNotFoundException) {
                    openCallback = null
                    false
                }
            }
        }
    }

    /** 从头打开页面（会回到开场画面）。有下载好的新内容就在这时换上。 */
    internal fun load() {
        val w = web ?: return
        files.useBest()
        freshLoad = true
        w.loadUrl(WebFiles.URL)
    }

    /** 下载的内容打开后没能启动（程序出错），就记下来，退回上一份能用的。 */
    private fun checkBoot() {
        val v = files.cur
        val w = web
        if (v.root == null || w == null) return
        w.evaluateJavascript("(window.CE&&CE.route&&CE.Store)?1:0") { r ->
            if (r == "1") return@evaluateJavascript
            files.markBad(v.v)
            load()
        }
    }

    private fun js(code: String) = runOnUiThread { web?.evaluateJavascript(code, null) }

    private fun pageChanged() = js("window.CE&&CE.Native&&CE.Native.updated()")

    override fun spoken(id: Int) = js("window.CE&&CE.Native&&CE.Native.ended($id)")

    override fun voicesChanged() = js("window.CE&&CE.Native&&CE.Native.voicesChanged()")

    /* ---------- 全屏和返回 ---------- */

    private fun fullscreen() {
        if (Build.VERSION.SDK_INT < 30) return   // 旧系统保留状态栏，输入法弹出时由系统调整页面大小
        // Android 15 起系统强制这样（页面铺满全屏），之前要自己设
        if (Build.VERSION.SDK_INT < 35) {
            @Suppress("DEPRECATION")
            window.setDecorFitsSystemWindows(false)
        }
        // 状态栏、导航栏、刘海和输入法占的地方留出来，页面不被挡住
        root.setOnApplyWindowInsetsListener { view, insets ->
            val i = insets.getInsets(WindowInsets.Type.systemBars() or WindowInsets.Type.displayCutout() or WindowInsets.Type.ime())
            view.setPadding(i.left, i.top, i.right, i.bottom)
            WindowInsets.CONSUMED
        }
        hideBars()
    }

    private fun hideBars() {
        if (Build.VERSION.SDK_INT < 30) return
        window.insetsController?.apply {
            hide(WindowInsets.Type.systemBars())
            systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }
    }

    override fun onWindowFocusChanged(focus: Boolean) {
        super.onWindowFocusChanged(focus)
        if (focus) hideBars()
    }

    /** 返回键：网页里能后退就后退（和浏览器一样），退到主页再按就回到桌面。 */
    private fun back() {
        val w = web
        if (w != null && w.canGoBack()) w.goBack() else moveTaskToBack(true)
    }

    @Deprecated("Deprecated in Java")
    @Suppress("DEPRECATION")
    override fun onBackPressed() = back()   // Android 13 以下

    /* ---------- 打印、文件、系统设置 ---------- */

    internal fun print(name: String) {
        val pm = getSystemService(PRINT_SERVICE) as? PrintManager ?: return
        val w = web ?: return
        val job = name.ifEmpty { getString(R.string.app_name) }
        val a4 = PrintAttributes.Builder()
            .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
            .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
            .build()
        pm.print(job, w.createPrintDocumentAdapter(job), a4)
    }

    internal fun saveText(name: String, mime: String, text: String) {
        saveTextPending = text
        val i = Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE)
            .setType(mime).putExtra(Intent.EXTRA_TITLE, name)
        try {
            startActivityForResult(i, REQ_SAVE)
        } catch (e: ActivityNotFoundException) {
            saveTextPending = null
            Toast.makeText(this, "这台设备不能保存文件", Toast.LENGTH_LONG).show()
        }
    }

    internal fun openTtsSettings() {
        ttsSettings = true
        try {
            startActivity(Intent("com.android.settings.TTS_SETTINGS"))
        } catch (e: ActivityNotFoundException) {
            try {
                startActivity(Intent(Settings.ACTION_SETTINGS))
            } catch (e2: ActivityNotFoundException) {
                ttsSettings = false
            }
        }
    }

    override fun onActivityResult(req: Int, res: Int, data: Intent?) {
        super.onActivityResult(req, res, data)
        val uri = if (res == RESULT_OK) data?.data else null
        when (req) {
            REQ_OPEN -> {
                openCallback?.onReceiveValue(uri?.let { arrayOf(it) })
                openCallback = null
            }
            REQ_SAVE -> {
                val text = saveTextPending
                saveTextPending = null
                if (uri == null || text == null) return
                try {
                    (contentResolver.openOutputStream(uri, "w") ?: throw IOException()).use { it.write(text.toByteArray()) }
                    Toast.makeText(this, "记录已经保存", Toast.LENGTH_SHORT).show()
                } catch (e: Exception) {
                    Toast.makeText(this, "保存失败", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    /* ---------- 生命周期 ---------- */

    override fun onPause() {
        super.onPause()
        pausedAt = System.currentTimeMillis()
        speech.stop()
        web?.let {
            // 离开应用时停下朗读，马上把学习记录存好（系统可能随时关掉后台的应用）
            it.evaluateJavascript("window.CE&&CE.Speech&&CE.Speech.stop();window.CE&&CE.Store&&CE.Store.flush()", null)
            it.onPause()
        }
    }

    override fun onResume() {
        super.onResume()
        hideBars()
        web?.onResume()
        if (ttsSettings) {
            ttsSettings = false
            speech.recheck(true)
        } else if (pausedAt > 0) {
            speech.recheck(false)
        }
        if (pausedAt > 0) {
            if (System.currentTimeMillis() - pausedAt >= APPLY_AFTER && files.hasNewer()) load()
            updater.maybeCheck()
        }
    }

    override fun onDestroy() {
        speech.shutdown()
        web?.let {
            root.removeView(it)
            it.destroy()
        }
        web = null
        super.onDestroy()
    }

    companion object {
        private const val REQ_OPEN = 1
        private const val REQ_SAVE = 2

        /** 离开应用超过这么久再回来，有下载好的新内容就换上（不在孩子玩到一半时换）。 */
        private const val APPLY_AFTER = 30 * 60_000L
        private const val SKY = 0xFFBFE8FF.toInt()
    }
}
