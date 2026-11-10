package com.caredu.app

import java.io.ByteArrayOutputStream
import java.io.File
import java.io.IOException
import java.io.InputStream
import java.security.GeneralSecurityException
import java.security.MessageDigest
import java.security.PublicKey
import java.security.Signature
import java.util.zip.ZipInputStream

/** 更新包里不依赖安卓的部分：核对签名、算摘要、安全地解压。 */
internal object Pack {

    /** version.json 的签名对不对。签名用的是打 APK 的同一把钥匙（见 app/build.gradle.kts 的 webUpdate）。 */
    fun verify(key: PublicKey, data: ByteArray, sig: ByteArray): Boolean = try {
        Signature.getInstance(if (key.algorithm == "EC") "SHA256withECDSA" else "SHA256withRSA").run {
            initVerify(key)
            update(data)
            verify(sig)
        }
    } catch (e: GeneralSecurityException) {
        false
    } catch (e: RuntimeException) {
        false
    }

    fun sha256(f: File): String {
        val md = MessageDigest.getInstance("SHA-256")
        f.inputStream().use { input ->
            val buf = ByteArray(16384)
            while (true) {
                val n = input.read(buf)
                if (n < 0) break
                md.update(buf, 0, n)
            }
        }
        return md.digest().joinToString("") { "%02x".format(it) }
    }

    /** 读完一个流，超过 max 字节就放弃（更新地址可能不可信，不能让它塞进来没完没了的数据）。 */
    fun read(input: InputStream, max: Int): ByteArray {
        val out = ByteArrayOutputStream()
        val buf = ByteArray(8192)
        while (true) {
            val n = input.read(buf)
            if (n < 0) break
            if (out.size() + n > max) throw IOException("文件太大")
            out.write(buf, 0, n)
        }
        return out.toByteArray()
    }

    /** 解压到 dir。每个文件都必须落在 dir 里面（防止 ../ 写到别处），解压后总大小不超过 max。 */
    fun unzip(zip: File, dir: File, max: Long) {
        val root = dir.canonicalPath + File.separator
        var total = 0L
        val buf = ByteArray(16384)
        ZipInputStream(zip.inputStream().buffered()).use { input ->
            while (true) {
                val e = input.nextEntry ?: break
                val out = File(dir, e.name)
                if (!out.canonicalPath.startsWith(root)) throw IOException("更新包里的路径不对：${e.name}")
                if (e.isDirectory) {
                    if (!out.isDirectory && !out.mkdirs()) throw IOException("建不了目录")
                    continue
                }
                out.parentFile?.let { if (!it.isDirectory && !it.mkdirs()) throw IOException("建不了目录") }
                out.outputStream().use { o ->
                    while (true) {
                        val n = input.read(buf)
                        if (n < 0) break
                        total += n
                        if (total > max) throw IOException("更新包太大")
                        o.write(buf, 0, n)
                    }
                }
            }
        }
    }
}
