import java.security.KeyStore
import java.security.MessageDigest
import java.security.PrivateKey
import java.security.Signature
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

plugins {
    id("com.android.application")
}

/* 外壳的版本。只在改了外壳的代码、而且网页要用到新能力（app/core/native.js 里新加的东西）时才加一。
   打出来的更新包只给这个版本以上的外壳用：旧外壳的家长页会提示先装新的 APK。 */
val shell = 1

// 网页就是仓库根目录的 index.html、app/、content/。打包时复制进 APK，不在 android/ 里另存一份
val web: File = rootDir.parentFile
val webFiles = listOf("index.html", "app/**", "content/**")

// 内容的版本：最后一次提交的时间（秒）和短哈希。更新时只换成比现在新的
val stamp = providers.exec {
    commandLine("git", "-C", web.path, "log", "-1", "--format=%ct %h")
    isIgnoreExitValue = true
}.standardOutput.asText.get().trim().split(" ")
val contentV = stamp.getOrNull(0)?.toLongOrNull() ?: 0L
val contentSha = stamp.getOrNull(1)?.takeIf { contentV > 0 } ?: "local"
val contentJson = """{"v":$contentV,"sha":"$contentSha","shell":$shell}"""

// 默认的更新地址：在 GitHub Actions 里打包时，是这个仓库最新发布的文件。家长还可以在家长页加自己的地址（NAS）
val repo = providers.environmentVariable("GITHUB_REPOSITORY").orNull
val updateUrl = if (repo != null) "https://github.com/$repo/releases/latest/download/" else ""

// 签名用的钥匙从环境变量来，不进仓库。没有时 release 包不签名（GitHub Actions 会直接报错）
val keystore = providers.environmentVariable("CE_KEYSTORE").orNull

android {
    namespace = "com.caredu.app"
    compileSdk = 36

    defaultConfig {
        // 发布后不能改：应用的身份和孩子的学习记录都跟着它
        applicationId = "com.caredu.app"
        minSdk = 24
        targetSdk = 36
        // 每次打包都比上一次大（按提交时间算，单位分钟），装新的 APK 时系统才认作“更新”
        versionCode = maxOf(1L, contentV / 60).toInt()
        versionName = "$shell ($contentSha)"
        buildConfigField("int", "SHELL", "$shell")
        buildConfigField("String", "UPDATE_URL", "\"$updateUrl\"")
    }

    buildFeatures {
        buildConfig = true
    }

    signingConfigs {
        if (keystore != null) {
            create("release") {
                storeFile = file(keystore)
                storePassword = providers.environmentVariable("CE_KEYSTORE_PASSWORD").orNull
                keyAlias = providers.environmentVariable("CE_KEY_ALIAS").orNull ?: "car-edu"
                keyPassword = providers.environmentVariable("CE_KEY_PASSWORD").orNull ?: storePassword
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            if (keystore != null) signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

/* 把网页放进 APK 的 assets：www/ 是网页，content.json 记着这一份的版本 */
abstract class WebAssets : DefaultTask() {
    @get:InputFiles
    @get:PathSensitive(PathSensitivity.RELATIVE)
    abstract val sources: ConfigurableFileCollection

    @get:Input
    abstract val manifest: Property<String>

    @get:OutputDirectory
    abstract val outputDir: DirectoryProperty

    @get:Inject
    abstract val fs: FileSystemOperations

    @TaskAction
    fun run() {
        val out = outputDir.get().asFile
        fs.sync {
            from(sources)
            into(File(out, "www"))
        }
        File(out, "content.json").writeText(manifest.get())
    }
}

androidComponents {
    onVariants { variant ->
        val task = tasks.register<WebAssets>("${variant.name}WebAssets") {
            sources.from(fileTree(web) { include(webFiles) })
            manifest.set(contentJson)
        }
        variant.sources.assets?.addGeneratedSourceDirectory(task, WebAssets::outputDir)
    }
}

/* 热更新包：www.zip（和 APK 里的网页一样）、version.json（版本、大小、摘要）、version.sig（用打 APK 的同一把钥匙签名）。
   应用只换上签名对得上的包，所以更新包放在哪里（GitHub、家里的 NAS）都不怕被改。 */
abstract class WebUpdate : DefaultTask() {
    @get:InputFiles
    @get:PathSensitive(PathSensitivity.RELATIVE)
    abstract val sources: ConfigurableFileCollection

    @get:Input
    abstract val manifest: Property<String>

    @get:OutputDirectory
    abstract val outputDir: DirectoryProperty

    @TaskAction
    fun run() {
        val env = { k: String -> System.getenv(k)?.takeIf { it.isNotEmpty() } }
        val ks = env("CE_KEYSTORE") ?: throw GradleException("没有签名钥匙：请设置 CE_KEYSTORE 和 CE_KEYSTORE_PASSWORD（见 android/README.md）")
        val pass = env("CE_KEYSTORE_PASSWORD") ?: throw GradleException("没有设置 CE_KEYSTORE_PASSWORD")

        val out = outputDir.get().asFile
        out.deleteRecursively()
        out.mkdirs()
        val zip = File(out, "www.zip")
        ZipOutputStream(zip.outputStream()).use { z ->
            sources.asFileTree.visit {
                if (!isDirectory) {
                    z.putNextEntry(ZipEntry(relativePath.pathString).apply { time = 315532800000L })
                    file.inputStream().use { it.copyTo(z) }
                    z.closeEntry()
                }
            }
        }
        val sha = MessageDigest.getInstance("SHA-256").digest(zip.readBytes()).joinToString("") { "%02x".format(it) }
        val text = manifest.get().dropLast(1) + ""","size":${zip.length()},"sha256":"$sha"}"""
        File(out, "version.json").writeText(text)

        val store = KeyStore.getInstance(File(ks), pass.toCharArray())
        val alias = env("CE_KEY_ALIAS") ?: "car-edu"
        val key = store.getKey(alias, (env("CE_KEY_PASSWORD") ?: pass).toCharArray()) as? PrivateKey
            ?: throw GradleException("钥匙库里没有 $alias 这把钥匙")
        val sig = Signature.getInstance(if (key.algorithm == "EC") "SHA256withECDSA" else "SHA256withRSA")
        sig.initSign(key)
        sig.update(text.toByteArray())
        File(out, "version.sig").writeBytes(sig.sign())
        logger.lifecycle("更新包：${out.path}（内容版本 ${manifest.get()}）")
    }
}

tasks.register<WebUpdate>("webUpdate") {
    sources.from(fileTree(web) { include(webFiles) })
    manifest.set(contentJson)
    outputDir.set(layout.buildDirectory.dir("outputs/web-update"))
    outputs.upToDateWhen { false }
}

dependencies {
    testImplementation("junit:junit:4.13.2")
}
