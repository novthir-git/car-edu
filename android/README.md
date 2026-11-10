# 安卓应用（外壳）

一个很薄的外壳（Kotlin）：全屏的 WebView，打开 APK 里自带的网页。网页就是仓库根目录的 `index.html`、`app/`、`content/`，打包时原样复制进 APK，这里不另存一份。

WebView 有四样做不到，由外壳补上：

| 做不到的 | 外壳怎么补 | 网页这边 |
| --- | --- | --- |
| 朗读：WebView 不支持浏览器的语音合成 | 系统的朗读引擎（TextToSpeech） | `app/core/speech.js` 用 `CE.Native.tts` |
| 打印：`window.print()` 没反应 | 系统打印（可以存成 PDF） | `app/ui/print.js` |
| 导出、导入记录：不能下载文件，选文件没反应 | 系统的“存到哪里”“选一个文件” | `app/ui/parent.js` |
| 更新：内容跟着 APK 走 | 热更新：下载签名的网页包 | 家长页 → 应用 |

网页和外壳之间的约定只有一处：网页这边是 `app/core/native.js`（`CE.Native`），外壳这边是 `Bridge`。在浏览器里打开时 `CE.Native` 是 null，网页照常走浏览器自己的路。

## 文件

```
app/build.gradle.kts        打包：版本、签名、把网页复制进 APK、打热更新包（webUpdate）
app/src/main/
  AndroidManifest.xml
  kotlin/com/caredu/app/    外壳用 Kotlin 写
    MainActivity            WebView、全屏、返回键、打印、存取文件、什么时候换上新内容
    Bridge                  网页能调用的方法（页面上的 window.CEAndroid）
    Speech                  朗读
    WebFiles                把网页交给 WebView：自带的一份，或者下载的更新
    Updater                 热更新：下载、核对签名、解压
    Pack                    不依赖安卓的部分：签名、摘要、安全解压（有单元测试）
  res/                      图标（和网页的 favicon 是同一辆车）、主题色、网络设置
app/src/test/               单元测试
```

## 编译和测试

需要 JDK 17 以上和 Android SDK（`local.properties` 里写 `sdk.dir=…`，或者设置 `ANDROID_HOME`）。

```bash
cd android && ./gradlew testDebugUnitTest
```

```bash
cd android && ./gradlew assembleDebug
```

调试版 APK 在 `app/build/outputs/apk/debug/`。调试版用的是本机的调试钥匙：不能覆盖安装正式版，也不接收热更新（签名对不上）。

网页这边的约定由 `tests/smoke.js` 检查：它在页面上放一个假的 `CEAndroid`，看朗读、打印、导出、更新是不是交给了外壳。改 `native.js` 的约定时，`Bridge` 和测试里的假外壳要一起改。

## 发布

不用在本机打正式版。`.github/workflows/android.yml` 做两件事：

- 每次推送：跑冒烟测试、外壳的单元测试，编译调试版。
- 合并到 main：打签名的 APK 和热更新包，发布到 GitHub Releases。最新一版的 APK 总在这个地址：`https://github.com/<仓库>/releases/latest/download/car-edu.apk`。

### 签名钥匙

APK 和热更新包用同一把钥匙签名。钥匙不进仓库（仓库是公开的），放在仓库的 Settings → Secrets and variables → Actions：

| 名字 | 内容 |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | 钥匙文件（PKCS12）的 base64 |
| `ANDROID_KEYSTORE_PASSWORD` | 钥匙的密码（钥匙密码和库密码相同，别名 `car-edu`） |

没配这两项，发布那一步会直接报错说明。

要自己生成一把（需要装了 Java 的电脑）：

```bash
keytool -genkeypair -keystore car-edu-release.keystore -storetype PKCS12 -alias car-edu -keyalg RSA -keysize 4096 -validity 36500 -dname "CN=car-edu"
```

```bash
base64 -w0 car-edu-release.keystore
```

钥匙文件和密码要另外备份。**换了钥匙**（丢了或者泄露了），新的 APK 就装不到旧的上面，热更新也不会被接收：要在家长页导出记录、卸载、装新的、再导入一次。

## 热更新

只更新网页（`index.html`、`app/`、`content/`），外壳本身的改动要重装 APK。

一个更新地址下面放三个文件，由 `./gradlew webUpdate` 生成：

| 文件 | 内容 |
| --- | --- |
| `version.json` | 内容版本 `v`（最后一次提交的时间）、提交 `sha`、需要的外壳版本 `shell`、`www.zip` 的大小和 sha256 |
| `version.sig` | `version.json` 的签名 |
| `www.zip` | 网页 |

应用这样处理：

1. 打开时在后台检查，最多每 6 小时一次；家长页 → 应用 里可以手动检查。
2. 先试家长填的地址，都连不上再试默认地址（这个仓库在 GitHub 上最新的发布）。
3. 签名对得上（和 APK 是同一把钥匙）、比现在的新、外壳版本够、大小和 sha256 都对，才解压保存。
4. 不在孩子玩到一半时换：下次打开应用，或者离开半小时以上再回来时才换上；家长页可以“现在换上”。
5. 换上以后页面没能启动，就记下这一版不再用，退回上一份能用的。

因为有签名，更新包放在哪里都可以：GitHub、家里的 NAS、任何静态文件服务器，用 http 也可以（应用允许 http，就是为了这个）。地址不可信也换不了内容，最坏是更新不了。

### 外壳版本

`app/build.gradle.kts` 里的 `shell`。只在改了外壳、而且网页要用到新能力（`native.js` 里新加的东西）时才加一。之后打的更新包只给新外壳：旧外壳的家长页会显示“要先下载安装新的应用（APK）”。

APK 的 `versionCode` 按提交时间自动增加，和 `shell` 无关。

## 发布后不能改的

- `applicationId`（`com.caredu.app`）：改了就是另一个应用，记录不会跟过去。
- 网页的地址 `https://appassets.androidplatform.net/www/`（`WebFiles`）：学习记录存在这个地址的 localStorage 里，改了记录就找不到了。
- 签名钥匙，见上面。

## 还没验证的

开发环境里没有真机，也跑不了模拟器。编译、单元测试、签名和核对、网页这边的约定都测过；朗读的声音、打印、安装、热更新的整个过程要在平板上试。
