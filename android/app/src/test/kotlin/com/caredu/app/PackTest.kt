package com.caredu.app

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import java.io.File
import java.io.IOException
import java.security.KeyPair
import java.security.KeyPairGenerator
import java.security.Signature
import java.util.Locale
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

/** 热更新里最要紧的几道关：签名、解压、大小上限。运行：cd android && ./gradlew testDebugUnitTest */
class PackTest {
    @get:Rule
    val tmp = TemporaryFolder()

    private val manifest = """{"v":1794294861,"sha":"abc1234","shell":1}""".toByteArray()

    private fun keys(alg: String, size: Int): KeyPair =
        KeyPairGenerator.getInstance(alg).apply { initialize(size) }.generateKeyPair()

    private fun sign(k: KeyPair, alg: String, data: ByteArray): ByteArray =
        Signature.getInstance(alg).run {
            initSign(k.private)
            update(data)
            sign()
        }

    @Test
    fun acceptsOnlyTheSameKey() {
        // 和 app/build.gradle.kts 的 webUpdate 一样：RSA 钥匙用 SHA256withRSA，EC 钥匙用 SHA256withECDSA
        for ((alg, size, sigAlg) in listOf(Triple("RSA", 2048, "SHA256withRSA"), Triple("EC", 256, "SHA256withECDSA"))) {
            val mine = keys(alg, size)
            val other = keys(alg, size)
            val sig = sign(mine, sigAlg, manifest)
            assertTrue(alg, Pack.verify(mine.public, manifest, sig))
            assertFalse("别人的钥匙签的不认", Pack.verify(mine.public, manifest, sign(other, sigAlg, manifest)))
            val changed = manifest.clone().also { it[5]++ }
            assertFalse("内容被改过不认", Pack.verify(mine.public, changed, sig))
            assertFalse("乱码不认", Pack.verify(mine.public, manifest, byteArrayOf(1, 2, 3)))
        }
    }

    private fun zip(vararg entries: Pair<String, String>): File {
        val f = tmp.newFile()
        ZipOutputStream(f.outputStream()).use { z ->
            for ((name, text) in entries) {
                z.putNextEntry(ZipEntry(name))
                z.write(text.toByteArray())
                z.closeEntry()
            }
        }
        return f
    }

    @Test
    fun unzipsTheWebFiles() {
        val out = File(tmp.root, "web/123")
        Pack.unzip(zip("index.html" to "<!doctype html>", "app/core/util.js" to "x", "content/k2/w01.js" to "y"), out, 1L shl 20)
        assertEquals("<!doctype html>", File(out, "index.html").readText())
        assertTrue(File(out, "app/core/util.js").isFile)
        assertTrue(File(out, "content/k2/w01.js").isFile)
    }

    @Test
    fun refusesPathsOutsideTheFolder() {
        val out = File(tmp.root, "web/123")
        assertThrows(IOException::class.java) {
            Pack.unzip(zip("index.html" to "ok", "../../evil.js" to "bad"), out, 1L shl 20)
        }
        assertFalse(File(tmp.root, "evil.js").exists())
    }

    @Test
    fun refusesTooBig() {
        assertThrows(IOException::class.java) { Pack.unzip(zip("index.html" to "0123456789"), File(tmp.root, "x"), 5) }
        assertThrows(IOException::class.java) { Pack.read(ByteArray(100).inputStream(), 50) }
        assertArrayEquals(ByteArray(10), Pack.read(ByteArray(10).inputStream(), 50))
    }

    @Test
    fun sha256() {
        val f = tmp.newFile().apply { writeText("abc") }
        assertEquals("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", Pack.sha256(f))
    }

    @Test
    @Suppress("DEPRECATION")
    fun voiceLanguageTags() {
        // speech.js 认 zh、cmn、en 开头的写法；有的引擎用三个字母的代码
        assertEquals("zh-CN", Speech.tag(Locale.SIMPLIFIED_CHINESE))
        assertEquals("zh-CN", Speech.tag(Locale("zho", "CHN")))
        assertEquals("cmn-CN", Speech.tag(Locale("cmn", "CN")))
        assertEquals("en-US", Speech.tag(Locale("eng", "USA")))
        assertEquals("en", Speech.tag(Locale.ENGLISH))
    }
}
