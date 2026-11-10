package com.caredu.app;

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.PublicKey;
import java.security.Signature;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/** 更新包里不依赖安卓的部分：核对签名、算摘要、安全地解压。 */
final class Pack {
    private Pack() {}

    /** version.json 的签名对不对。签名用的是打 APK 的同一把钥匙（见 app/build.gradle.kts 的 webUpdate）。 */
    static boolean verify(PublicKey key, byte[] data, byte[] sig) {
        try {
            Signature s = Signature.getInstance("EC".equals(key.getAlgorithm()) ? "SHA256withECDSA" : "SHA256withRSA");
            s.initVerify(key);
            s.update(data);
            return s.verify(sig);
        } catch (GeneralSecurityException | RuntimeException e) {
            return false;
        }
    }

    static String sha256(File f) throws IOException {
        try (InputStream in = new FileInputStream(f)) {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] buf = new byte[16384];
            for (int n; (n = in.read(buf)) > 0; ) md.update(buf, 0, n);
            StringBuilder sb = new StringBuilder();
            for (byte b : md.digest()) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (GeneralSecurityException e) {
            throw new IOException(e);
        }
    }

    /** 读完一个流，超过 max 字节就放弃（更新地址可能不可信，不能让它塞进来没完没了的数据）。 */
    static byte[] read(InputStream in, int max) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[8192];
        for (int n; (n = in.read(buf)) > 0; ) {
            if (out.size() + n > max) throw new IOException("文件太大");
            out.write(buf, 0, n);
        }
        return out.toByteArray();
    }

    /** 解压到 dir。每个文件都必须落在 dir 里面（防止 ../ 写到别处），解压后总大小不超过 max。 */
    static void unzip(File zip, File dir, long max) throws IOException {
        String root = dir.getCanonicalPath() + File.separator;
        long total = 0;
        byte[] buf = new byte[16384];
        try (ZipInputStream in = new ZipInputStream(new BufferedInputStream(new FileInputStream(zip)))) {
            for (ZipEntry e; (e = in.getNextEntry()) != null; ) {
                File out = new File(dir, e.getName());
                if (!out.getCanonicalPath().startsWith(root)) throw new IOException("更新包里的路径不对：" + e.getName());
                if (e.isDirectory()) {
                    if (!out.isDirectory() && !out.mkdirs()) throw new IOException("建不了目录");
                    continue;
                }
                File parent = out.getParentFile();
                if (parent != null && !parent.isDirectory() && !parent.mkdirs()) throw new IOException("建不了目录");
                try (OutputStream o = new FileOutputStream(out)) {
                    for (int n; (n = in.read(buf)) > 0; ) {
                        total += n;
                        if (total > max) throw new IOException("更新包太大");
                        o.write(buf, 0, n);
                    }
                }
            }
        }
    }

    static void delete(File f) {
        File[] kids = f.listFiles();
        if (kids != null) for (File k : kids) delete(k);
        //noinspection ResultOfMethodCallIgnored
        f.delete();
    }
}
