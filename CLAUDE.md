# 古诗词背诵 App

Capacitor + Vue 3 + Vite 应用，用于小学古诗词背诵学习。

## 构建命令

**优先使用 `build-apk.sh` 脚本，不要手动拼命令：**

```bash
./build-apk.sh --release   # 构建 Release APK
./build-apk.sh --debug     # 构建 Debug APK（含自动安装）
```

脚本已包含所有正确配置：Java 21 环境变量、gradlew wrapper、Vue 构建、cap sync、APK 构建。

## 关键规则

- **Release APK 必须有签名**：`android/app/build.gradle` 的 `buildTypes.release` 中必须包含 `signingConfig signingConfigs.debug`，否则安装后 `packageinfo is null` 无法运行
- 系统 `gradle` (7.5.1) 太旧，必须用 `./gradlew` wrapper (8.11.1)
- Java 需要 11+，推荐 Java 21
