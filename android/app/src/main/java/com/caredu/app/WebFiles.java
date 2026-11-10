package com.caredu.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.net.Uri;
import android.webkit.WebResourceResponse;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * 把网页交给 WebView。网页有两份来源：
 * - 应用自带的，在 assets/www（打包时从仓库根目录复制进来）；
 * - 下载的更新，在 files/web/版本号/（Updater 下载、核对签名后放进来）。
 * 两份都用同一个地址 https://appassets.androidplatform.net/www/ 打开，所以学习记录（localStorage）不受影响。
 * 这个地址发布后不能改，改了记录就找不到了。
 */
final class WebFiles {
    static final String HOST = "appassets.androidplatform.net";
    static final String URL = "https://" + HOST + "/www/index.html";

    /** 一份网页内容。root 为 null 表示应用自带的那份。 */
    static final class Version {
        final long v;
        final String sha;
        final int shell;
        final File root;

        Version(JSONObject o, File root) {
            this.v = o.optLong("v");
            this.sha = o.optString("sha");
            this.shell = o.optInt("shell");
            this.root = root;
        }

        JSONObject json() throws JSONException {
            return new JSONObject().put("v", v).put("sha", sha).put("from", root == null ? "apk" : "update");
        }
    }

    private static final Map<String, String> TYPES = new HashMap<>();
    static {
        TYPES.put("html", "text/html");
        TYPES.put("js", "text/javascript");
        TYPES.put("css", "text/css");
        TYPES.put("json", "application/json");
        TYPES.put("svg", "image/svg+xml");
        TYPES.put("png", "image/png");
        TYPES.put("jpg", "image/jpeg");
        TYPES.put("webp", "image/webp");
        TYPES.put("woff2", "font/woff2");
    }

    final File dir;
    private final Context ctx;
    private final SharedPreferences prefs;
    private final Version bundled;
    /** 现在正在用的那一份。只在重新加载页面之前换，不会一页里混着两份。 */
    volatile Version cur;

    WebFiles(Context ctx) {
        this.ctx = ctx;
        this.dir = new File(ctx.getFilesDir(), "web");
        //noinspection ResultOfMethodCallIgnored
        dir.mkdirs();
        this.prefs = ctx.getSharedPreferences("web", Context.MODE_PRIVATE);
        Version b;
        try (InputStream in = ctx.getAssets().open("content.json")) {
            b = new Version(new JSONObject(new String(Pack.read(in, 4096), StandardCharsets.UTF_8)), null);
        } catch (IOException | JSONException e) {
            b = new Version(new JSONObject(), null);
        }
        bundled = b;
        cur = bundled;
    }

    /** 能用的最新一份：下载的更新要比自带的新、外壳版本够、上次没出过问题、文件齐。 */
    Version best() {
        Version best = bundled;
        File[] kids = dir.listFiles();
        if (kids == null) return best;
        Set<String> bad = bad();
        for (File d : kids) {
            if (!d.isDirectory() || !d.getName().matches("\\d+") || bad.contains(d.getName())) continue;
            File man = new File(dir, d.getName() + ".json");
            if (!man.isFile() || !new File(d, "index.html").isFile()) continue;
            try (InputStream in = new FileInputStream(man)) {
                Version v = new Version(new JSONObject(new String(Pack.read(in, 65536), StandardCharsets.UTF_8)), d);
                if (v.v > best.v && v.shell <= BuildConfig.SHELL) best = v;
            } catch (IOException | JSONException ignored) {
                // 坏掉的记录就当没有
            }
        }
        return best;
    }

    /** 换成最新的一份（下一次加载页面时生效），顺便删掉用不着的旧版本。 */
    void useBest() {
        cur = best();
        File[] kids = dir.listFiles();
        if (kids == null) return;
        String keep = cur.root == null ? "" : cur.root.getName();
        for (File f : kids) {
            String n = f.getName();
            // .part 是正在下载的，由 Updater 自己收拾
            if (n.equals(keep) || n.equals(keep + ".json") || n.endsWith(".part")) continue;
            Pack.delete(f);
        }
    }

    boolean hasNewer() {
        return best().v > cur.v;
    }

    /** 这一份下载的内容打不开：记下来，以后不再用它。 */
    void markBad(long v) {
        Set<String> s = new HashSet<>(bad());
        s.add(String.valueOf(v));
        prefs.edit().putStringSet("bad", s).apply();
    }

    boolean isBad(long v) {
        return bad().contains(String.valueOf(v));
    }

    private Set<String> bad() {
        return prefs.getStringSet("bad", Collections.emptySet());
    }

    /** WebView 要的每一个文件都从这里给。别的网址一律不放行：应用不需要联网打开网页。 */
    WebResourceResponse serve(Uri u) {
        String path = u.getPath();
        if (!HOST.equals(u.getHost()) || path == null || !path.startsWith("/www/") || path.contains("..")) return missing(403);
        String rel = path.substring(5);
        if (rel.isEmpty()) rel = "index.html";
        Version v = cur;
        try {
            InputStream in = v.root != null ? new FileInputStream(new File(v.root, rel)) : ctx.getAssets().open("www/" + rel);
            String ext = rel.substring(rel.lastIndexOf('.') + 1).toLowerCase();
            String type = TYPES.containsKey(ext) ? TYPES.get(ext) : "application/octet-stream";
            WebResourceResponse r = new WebResourceResponse(type, "utf-8", in);
            r.setResponseHeaders(Collections.singletonMap("Cache-Control", "no-cache"));
            return r;
        } catch (IOException e) {
            return missing(404);
        }
    }

    private static WebResourceResponse missing(int code) {
        return new WebResourceResponse("text/plain", "utf-8", code, code == 404 ? "Not Found" : "Forbidden",
                Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
    }
}
