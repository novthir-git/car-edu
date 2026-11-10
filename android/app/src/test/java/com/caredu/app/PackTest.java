package com.caredu.app;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Signature;
import java.util.Locale;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/** 热更新里最要紧的几道关：签名、解压、大小上限。运行：cd android && ./gradlew testDebugUnitTest */
public class PackTest {
    @Rule
    public TemporaryFolder tmp = new TemporaryFolder();

    private static final byte[] MANIFEST = "{\"v\":1794294861,\"sha\":\"abc1234\",\"shell\":1}".getBytes(StandardCharsets.UTF_8);

    private static byte[] sign(KeyPair k, String alg, byte[] data) throws Exception {
        Signature s = Signature.getInstance(alg);
        s.initSign(k.getPrivate());
        s.update(data);
        return s.sign();
    }

    private static KeyPair keys(String alg, int size) throws Exception {
        KeyPairGenerator g = KeyPairGenerator.getInstance(alg);
        g.initialize(size);
        return g.generateKeyPair();
    }

    @Test
    public void acceptsOnlyTheSameKey() throws Exception {
        // 和 app/build.gradle.kts 的 webUpdate 一样：RSA 钥匙用 SHA256withRSA，EC 钥匙用 SHA256withECDSA
        for (String[] c : new String[][]{{"RSA", "2048", "SHA256withRSA"}, {"EC", "256", "SHA256withECDSA"}}) {
            KeyPair mine = keys(c[0], Integer.parseInt(c[1]));
            KeyPair other = keys(c[0], Integer.parseInt(c[1]));
            byte[] sig = sign(mine, c[2], MANIFEST);
            assertTrue(c[0], Pack.verify(mine.getPublic(), MANIFEST, sig));
            assertFalse("别人的钥匙签的不认", Pack.verify(mine.getPublic(), MANIFEST, sign(other, c[2], MANIFEST)));
            byte[] changed = MANIFEST.clone();
            changed[5]++;
            assertFalse("内容被改过不认", Pack.verify(mine.getPublic(), changed, sig));
            assertFalse("乱码不认", Pack.verify(mine.getPublic(), MANIFEST, new byte[]{1, 2, 3}));
        }
    }

    private File zip(String... entries) throws IOException {
        File f = tmp.newFile();
        try (ZipOutputStream z = new ZipOutputStream(new FileOutputStream(f))) {
            for (int i = 0; i < entries.length; i += 2) {
                z.putNextEntry(new ZipEntry(entries[i]));
                z.write(entries[i + 1].getBytes(StandardCharsets.UTF_8));
                z.closeEntry();
            }
        }
        return f;
    }

    @Test
    public void unzipsTheWebFiles() throws Exception {
        File out = new File(tmp.getRoot(), "web/123");
        Pack.unzip(zip("index.html", "<!doctype html>", "app/core/util.js", "x", "content/k2/w01.js", "y"), out, 1 << 20);
        assertEquals("<!doctype html>", new String(Files.readAllBytes(new File(out, "index.html").toPath()), StandardCharsets.UTF_8));
        assertTrue(new File(out, "app/core/util.js").isFile());
        assertTrue(new File(out, "content/k2/w01.js").isFile());
    }

    @Test
    public void refusesPathsOutsideTheFolder() throws Exception {
        File out = new File(tmp.getRoot(), "web/123");
        try {
            Pack.unzip(zip("index.html", "ok", "../../evil.js", "bad"), out, 1 << 20);
            fail("应该拒绝 ../");
        } catch (IOException expected) {
            assertFalse(new File(tmp.getRoot(), "evil.js").exists());
        }
    }

    @Test
    public void refusesTooBig() throws Exception {
        try {
            Pack.unzip(zip("index.html", "0123456789"), new File(tmp.getRoot(), "x"), 5);
            fail("应该拒绝太大的包");
        } catch (IOException expected) {
            // 好
        }
        try {
            Pack.read(new ByteArrayInputStream(new byte[100]), 50);
            fail("应该拒绝太大的文件");
        } catch (IOException expected) {
            // 好
        }
        assertArrayEquals(new byte[10], Pack.read(new ByteArrayInputStream(new byte[10]), 50));
    }

    @Test
    public void sha256() throws Exception {
        File f = tmp.newFile();
        Files.write(f.toPath(), "abc".getBytes(StandardCharsets.UTF_8));
        assertEquals("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", Pack.sha256(f));
    }

    @Test
    @SuppressWarnings("deprecation")
    public void voiceLanguageTags() {
        // speech.js 认 zh、cmn、en 开头的写法；有的引擎用三个字母的代码
        assertEquals("zh-CN", Speech.tag(Locale.SIMPLIFIED_CHINESE));
        assertEquals("zh-CN", Speech.tag(new Locale("zho", "CHN")));
        assertEquals("cmn-CN", Speech.tag(new Locale("cmn", "CN")));
        assertEquals("en-US", Speech.tag(new Locale("eng", "USA")));
        assertEquals("en", Speech.tag(Locale.ENGLISH));
    }
}
