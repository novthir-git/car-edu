package com.caredu.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.graphics.Insets;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.provider.Settings;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;
import android.window.OnBackInvokedDispatcher;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * 安卓应用的外壳：一个全屏的 WebView，打开仓库里的网页（index.html、app/、content/）。
 * WebView 自己做不到的事由外壳补上：朗读（Speech）、打印、保存和选择文件、热更新（Updater）。
 */
public class MainActivity extends Activity implements Speech.Host {
    private static final int REQ_OPEN = 1;
    private static final int REQ_SAVE = 2;
    /** 离开应用超过这么久再回来，有下载好的新内容就换上（不在孩子玩到一半时换）。 */
    private static final long APPLY_AFTER = 30 * 60_000L;
    private static final int SKY = 0xFFBFE8FF;

    WebFiles files;
    Speech speech;
    Updater updater;
    private WebView web;
    private FrameLayout root;
    private ValueCallback<Uri[]> openCallback;
    private String saveTextPending;
    private long pausedAt;
    private boolean freshLoad;
    private boolean ttsSettings;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        files = new WebFiles(this);
        updater = new Updater(getApplicationContext(), files, this::pageChanged);
        speech = new Speech(getApplicationContext(), this);
        setVolumeControlStream(AudioManager.STREAM_MUSIC);

        root = new FrameLayout(this);
        root.setBackgroundColor(SKY);
        setContentView(root);
        fullscreen();
        createWeb();
        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::back);
        }
        load();
        updater.check();
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void createWeb() {
        web = new WebView(this);
        web.setBackgroundColor(SKY);
        root.addView(web, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);                    // 学习记录存在 localStorage
        s.setMediaPlaybackRequiresUserGesture(false);    // 音效用 WebAudio
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setTextZoom(100);                              // 系统字体调大时版面不乱
        if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) WebView.setWebContentsDebuggingEnabled(true);
        web.addJavascriptInterface(new Bridge(this), "CEAndroid");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                return files.serve(r.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                return !WebFiles.HOST.equals(r.getUrl().getHost());   // 不离开自己的页面
            }

            @Override
            public void onPageFinished(WebView v, String url) {
                if (!freshLoad) return;
                freshLoad = false;
                v.clearHistory();
                checkBoot();
            }

            @Override
            public boolean onRenderProcessGone(WebView v, RenderProcessGoneDetail d) {
                // 网页的进程崩了（多半是系统内存不够）：整个重来，不让应用跟着退出
                root.removeView(web);
                web.destroy();
                web = null;
                recreate();
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                // 家长页的“导入记录”
                if (openCallback != null) openCallback.onReceiveValue(null);
                openCallback = cb;
                Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*");
                try {
                    startActivityForResult(i, REQ_OPEN);
                    return true;
                } catch (ActivityNotFoundException e) {
                    openCallback = null;
                    return false;
                }
            }
        });
    }

    /** 从头打开页面（会回到开场画面）。有下载好的新内容就在这时换上。 */
    void load() {
        if (web == null) return;
        files.useBest();
        freshLoad = true;
        web.loadUrl(WebFiles.URL);
    }

    /** 下载的内容打开后没能启动（程序出错），就记下来，退回上一份能用的。 */
    private void checkBoot() {
        final WebFiles.Version v = files.cur;
        if (v.root == null || web == null) return;
        web.evaluateJavascript("(window.CE&&CE.route&&CE.Store)?1:0", r -> {
            if ("1".equals(r)) return;
            files.markBad(v.v);
            load();
        });
    }

    private void js(String code) {
        runOnUiThread(() -> {
            if (web != null) web.evaluateJavascript(code, null);
        });
    }

    private void pageChanged() {
        js("window.CE&&CE.Native&&CE.Native.updated()");
    }

    @Override
    public void spoken(int id) {
        js("window.CE&&CE.Native&&CE.Native.ended(" + id + ")");
    }

    @Override
    public void voicesChanged() {
        js("window.CE&&CE.Native&&CE.Native.voicesChanged()");
    }

    /* ---------- 全屏和返回 ---------- */

    private void fullscreen() {
        if (Build.VERSION.SDK_INT < 30) return;   // 旧系统保留状态栏，输入法弹出时由系统调整页面大小
        Window w = getWindow();
        w.setDecorFitsSystemWindows(false);
        // 状态栏、导航栏、刘海和输入法占的地方留出来，页面不被挡住
        root.setOnApplyWindowInsetsListener((View view, WindowInsets in) -> {
            Insets i = in.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
            view.setPadding(i.left, i.top, i.right, i.bottom);
            return WindowInsets.CONSUMED;
        });
        hideBars();
    }

    private void hideBars() {
        if (Build.VERSION.SDK_INT < 30) return;
        WindowInsetsController c = getWindow().getInsetsController();
        if (c == null) return;
        c.hide(WindowInsets.Type.systemBars());
        c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }

    @Override
    public void onWindowFocusChanged(boolean focus) {
        super.onWindowFocusChanged(focus);
        if (focus) hideBars();
    }

    /** 返回键：网页里能后退就后退（和浏览器一样），退到主页再按就回到桌面。 */
    private void back() {
        if (web != null && web.canGoBack()) web.goBack();
        else moveTaskToBack(true);
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        back();   // Android 13 以下
    }

    /* ---------- 打印、文件、系统设置 ---------- */

    void print(String name) {
        PrintManager pm = (PrintManager) getSystemService(PRINT_SERVICE);
        if (pm == null || web == null) return;
        String job = name == null || name.isEmpty() ? getString(R.string.app_name) : name;
        PrintAttributes a4 = new PrintAttributes.Builder()
                .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                .build();
        pm.print(job, web.createPrintDocumentAdapter(job), a4);
    }

    void saveText(String name, String mime, String text) {
        saveTextPending = text;
        Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE)
                .setType(mime).putExtra(Intent.EXTRA_TITLE, name);
        try {
            startActivityForResult(i, REQ_SAVE);
        } catch (ActivityNotFoundException e) {
            saveTextPending = null;
            Toast.makeText(this, "这台设备不能保存文件", Toast.LENGTH_LONG).show();
        }
    }

    void openTtsSettings() {
        ttsSettings = true;
        try {
            startActivity(new Intent("com.android.settings.TTS_SETTINGS"));
        } catch (ActivityNotFoundException e) {
            try {
                startActivity(new Intent(Settings.ACTION_SETTINGS));
            } catch (ActivityNotFoundException ignored) {
                ttsSettings = false;
            }
        }
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        Uri uri = res == RESULT_OK && data != null ? data.getData() : null;
        if (req == REQ_OPEN && openCallback != null) {
            openCallback.onReceiveValue(uri == null ? null : new Uri[]{uri});
            openCallback = null;
        } else if (req == REQ_SAVE) {
            String text = saveTextPending;
            saveTextPending = null;
            if (uri == null || text == null) return;
            try (OutputStream o = getContentResolver().openOutputStream(uri, "w")) {
                if (o == null) throw new IOException();
                o.write(text.getBytes(StandardCharsets.UTF_8));
                Toast.makeText(this, "记录已经保存", Toast.LENGTH_SHORT).show();
            } catch (IOException | SecurityException e) {
                Toast.makeText(this, "保存失败", Toast.LENGTH_LONG).show();
            }
        }
    }

    /* ---------- 生命周期 ---------- */

    @Override
    protected void onPause() {
        super.onPause();
        pausedAt = System.currentTimeMillis();
        speech.stop();
        if (web != null) {
            // 离开应用时停下朗读，马上把学习记录存好（系统可能随时关掉后台的应用）
            web.evaluateJavascript("window.CE&&CE.Speech&&CE.Speech.stop();window.CE&&CE.Store&&CE.Store.flush()", null);
            web.onPause();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        hideBars();
        if (web != null) web.onResume();
        if (ttsSettings) {
            ttsSettings = false;
            speech.recheck(true);
        } else if (pausedAt > 0) {
            speech.recheck(false);
        }
        if (pausedAt > 0 && System.currentTimeMillis() - pausedAt >= APPLY_AFTER && files.hasNewer()) load();
        if (pausedAt > 0) updater.maybeCheck();
    }

    @Override
    protected void onDestroy() {
        speech.shutdown();
        if (web != null) {
            root.removeView(web);
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }
}
