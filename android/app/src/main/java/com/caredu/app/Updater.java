package com.caredu.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.ConnectException;
import java.net.HttpURLConnection;
import java.net.SocketTimeoutException;
import java.net.URL;
import java.net.UnknownHostException;
import java.nio.charset.StandardCharsets;
import java.security.PublicKey;
import java.security.cert.CertificateException;
import java.security.cert.CertificateFactory;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 热更新：从更新地址下载新的网页内容。一个更新地址下面放三个文件（GitHub Actions 打包，见 .github/workflows/android.yml）：
 * - version.json：内容版本 v、需要的外壳版本 shell、www.zip 的大小和 sha256；
 * - version.sig：version.json 的签名，用的是打 APK 的同一把钥匙；
 * - www.zip：网页（index.html、app/、content/）。
 * 签名对不上、外壳版本不够、摘要不对的，一律不换。下载好的内容先放着，下次加载页面时才换上（见 MainActivity）。
 */
final class Updater {
    interface Listener {
        void changed();
    }

    private static final long EVERY = 6 * 3600_000L;   // 自动检查的间隔
    private static final long MAX_ZIP = 50L << 20;
    private static final long MAX_UNZIPPED = 200L << 20;

    private final Context ctx;
    private final WebFiles files;
    private final Listener listener;
    private final SharedPreferences prefs;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    volatile boolean busy;

    Updater(Context ctx, WebFiles files, Listener listener) {
        this.ctx = ctx;
        this.files = files;
        this.listener = listener;
        this.prefs = ctx.getSharedPreferences("update", Context.MODE_PRIVATE);
    }

    /** 家长填的地址，一行一个。 */
    List<String> userSources() {
        List<String> out = new ArrayList<>();
        for (String line : prefs.getString("sources", "").split("\n")) {
            String s = line.trim();
            if (s.isEmpty()) continue;
            if (!s.matches("(?i)https?://.*")) s = "http://" + s;
            if (!s.endsWith("/")) s += "/";
            if (!out.contains(s)) out.add(s);
        }
        return out;
    }

    /** 打包时写进来的地址（GitHub 上这个仓库最新的发布）。家长的地址都连不上时才用。 */
    List<String> builtinSources() {
        List<String> out = new ArrayList<>();
        if (!BuildConfig.UPDATE_URL.isEmpty()) out.add(BuildConfig.UPDATE_URL);
        return out;
    }

    void setSources(String text) {
        prefs.edit().putString("sources", text == null ? "" : text).apply();
        check();
    }

    void put(JSONObject o) throws JSONException {
        o.put("checking", busy);
        long last = prefs.getLong("last", 0);
        if (last > 0) o.put("last", last);
        o.put("msg", prefs.getString("msg", ""));
        o.put("sources", new JSONArray(userSources()));
        o.put("builtin", new JSONArray(builtinSources()));
    }

    void maybeCheck() {
        if (System.currentTimeMillis() - prefs.getLong("last", 0) >= EVERY) check();
    }

    synchronized void check() {
        if (busy) return;
        busy = true;
        listener.changed();
        worker.execute(() -> {
            String msg;
            try {
                msg = run();
            } catch (Exception e) {
                msg = "检查失败：" + reason(e);
            }
            prefs.edit().putLong("last", System.currentTimeMillis()).putString("msg", msg).apply();
            busy = false;
            listener.changed();
        });
    }

    private String run() {
        List<String> all = userSources();
        all.addAll(builtinSources());
        if (all.isEmpty()) return "还没有填更新地址。";
        // 上次下到一半（比如应用被关掉）留下的文件
        File[] kids = files.dir.listFiles();
        if (kids != null) for (File f : kids) if (f.getName().endsWith(".part")) Pack.delete(f);
        List<String> fails = new ArrayList<>();
        for (String base : all) {
            try {
                return fetch(base);
            } catch (Exception e) {
                fails.add(host(base) + " " + reason(e));
            }
        }
        return "都没连上：" + String.join("；", fails) + "。";
    }

    private String fetch(String base) throws Exception {
        byte[] man = get(base + "version.json", 64 * 1024);
        byte[] sig = get(base + "version.sig", 16 * 1024);
        boolean ok = false;
        for (PublicKey k : keys()) ok |= Pack.verify(k, man, sig);
        if (!ok) throw new IOException("签名对不上");
        JSONObject m = new JSONObject(new String(man, StandardCharsets.UTF_8));
        long v = m.getLong("v");
        String from = "（来自 " + host(base) + "）";
        WebFiles.Version best = files.best();
        if (v <= best.v) return "已经是最新的" + from + "。";
        if (m.getInt("shell") > BuildConfig.VERSION_CODE) return "有新内容，但要先下载安装新的应用（APK）" + from + "。";
        if (files.isBad(v)) return "有新内容，但上次没能打开，先不换" + from + "。";

        File zip = new File(files.dir, v + ".zip.part");
        File tmp = new File(files.dir, v + ".part");
        try {
            long size = m.getLong("size");
            if (size > MAX_ZIP) throw new IOException("更新包太大");
            download(base + "www.zip", zip, size);
            if (!Pack.sha256(zip).equalsIgnoreCase(m.getString("sha256"))) throw new IOException("下载的文件不完整");
            Pack.delete(tmp);
            Pack.unzip(zip, tmp, MAX_UNZIPPED);
            if (!new File(tmp, "index.html").isFile()) throw new IOException("更新包里没有 index.html");
            File dest = new File(files.dir, String.valueOf(v));
            Pack.delete(dest);
            if (!tmp.renameTo(dest)) throw new IOException("保存失败");
            try (OutputStream o = new FileOutputStream(new File(files.dir, v + ".json"))) {
                o.write(man);
            }
        } finally {
            Pack.delete(zip);
            Pack.delete(tmp);
        }
        return "新内容已经下载好" + from + "，下次打开应用时换上。";
    }

    /** 应用自己的签名证书里的公钥：更新包必须是用同一把钥匙签的。 */
    private List<PublicKey> keys() throws PackageManager.NameNotFoundException, CertificateException {
        PackageManager pm = ctx.getPackageManager();
        android.content.pm.Signature[] sigs;
        if (Build.VERSION.SDK_INT >= 28) {
            PackageInfo pi = pm.getPackageInfo(ctx.getPackageName(), PackageManager.GET_SIGNING_CERTIFICATES);
            sigs = pi.signingInfo == null ? new android.content.pm.Signature[0] : pi.signingInfo.getApkContentsSigners();
        } else {
            //noinspection deprecation
            sigs = pm.getPackageInfo(ctx.getPackageName(), PackageManager.GET_SIGNATURES).signatures;
        }
        CertificateFactory cf = CertificateFactory.getInstance("X.509");
        List<PublicKey> out = new ArrayList<>();
        if (sigs != null) {
            for (android.content.pm.Signature s : sigs) {
                out.add(cf.generateCertificate(new ByteArrayInputStream(s.toByteArray())).getPublicKey());
            }
        }
        return out;
    }

    private static byte[] get(String url, int max) throws IOException {
        HttpURLConnection c = open(url);
        try (InputStream in = c.getInputStream()) {
            return Pack.read(in, max);
        } finally {
            c.disconnect();
        }
    }

    private static void download(String url, File to, long size) throws IOException {
        HttpURLConnection c = open(url);
        try (InputStream in = c.getInputStream(); OutputStream out = new FileOutputStream(to)) {
            byte[] buf = new byte[16384];
            long n = 0;
            for (int r; (r = in.read(buf)) > 0; ) {
                n += r;
                if (n > size) throw new IOException("下载的文件比说好的大");
                out.write(buf, 0, r);
            }
        } finally {
            c.disconnect();
        }
    }

    /** HttpURLConnection 不跟随 http 和 https 之间的跳转，这里自己跟（GitHub 的下载地址会跳转）。 */
    private static HttpURLConnection open(String url) throws IOException {
        for (int i = 0; i < 6; i++) {
            HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
            c.setConnectTimeout(10_000);
            c.setReadTimeout(30_000);
            c.setUseCaches(false);
            c.setInstanceFollowRedirects(false);
            c.setRequestProperty("Cache-Control", "no-cache");
            int code = c.getResponseCode();
            if (code >= 300 && code < 400) {
                String loc = c.getHeaderField("Location");
                c.disconnect();
                if (loc == null) throw new IOException("跳转没有地址");
                url = new URL(new URL(url), loc).toString();
                continue;
            }
            if (code != 200) {
                c.disconnect();
                throw new IOException("HTTP " + code);
            }
            return c;
        }
        throw new IOException("跳转太多");
    }

    private static String host(String url) {
        try {
            URL u = new URL(url);
            return u.getHost() + (u.getPort() > 0 ? ":" + u.getPort() : "");
        } catch (IOException e) {
            return url;
        }
    }

    private static String reason(Exception e) {
        if (e instanceof UnknownHostException) return "找不到这个地址";
        if (e instanceof SocketTimeoutException) return "连接超时";
        if (e instanceof ConnectException) return "连不上";
        if (e instanceof JSONException) return "version.json 不对";
        String m = e.getMessage();
        return m == null || m.isEmpty() ? e.getClass().getSimpleName() : m;
    }
}
