# 构建环境

## 环境版本

| 组件 | 版本 |
|------|------|
| Java | 21 (OpenJDK 21.0.x) |
| Gradle Wrapper | 8.11.1 |
| AGP (Android Gradle Plugin) | 8.9.1 |
| Capacitor | 8.0.2 |
| Node.js | 当前系统版本 |
| Vue | 3.5.27 |
| Vite | 7.3.1 |

## 构建命令

```bash
# 1. 安装依赖
npm install

# 2. 构建 Web 资源
npx vite build

# 3. 同步到 Android 项目
npx cap sync android

# 4. 构建 Release APK
cd android
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
./gradlew assembleRelease

# APK 输出路径
# android/app/build/outputs/apk/release/poem-release.apk
```

## 注意事项

- 系统 `gradle` (7.5.1) 版本过旧，必须使用 `gradlew` wrapper (8.11.1)
- 需要 Java 11+，推荐 Java 21
- 签名配置在 `android/app/build.gradle` 中
