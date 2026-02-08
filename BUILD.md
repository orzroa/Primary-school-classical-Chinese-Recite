# 古诗词背诵App - 构建说明

## 项目概述

一个用于背诵小学古诗词的安卓App，使用Vue.js + Capacitor开发。

## 技术栈

- **前端框架**: Vue.js 3
- **路由**: Vue Router
- **UI框架**: Bootstrap 5 + Material Design风格
- **跨平台**: Capacitor
- **构建工具**: Vite

## 功能特性

### 核心功能
- ✅ 112首完整古诗词（1-6年级部编版）
- ✅ 年级分类浏览
- ✅ 诗词详情展示
- ✅ 学习记录追踪（初学/复习）
- ✅ 复习计划（第1/4/8/15/30天）
- ✅ 隐藏原文功能
- ✅ 每日学习限制（每首诗每天只能标记一次）
- ✅ 学习当天不能复习

### UI设计
- 现代渐变背景动画
- 毛玻璃效果卡片
- 弹性动画过渡
- 响应式设计
- 精美的按钮和徽章样式

## 开发环境要求

### 必需软件
- Node.js 16+
- npm 或 yarn
- Java 11+ (用于Android构建)
- Android SDK
- Gradle 7.5.1+

## 安装依赖

```bash
npm install
```

## 开发运行

### Web版本（开发模式）
```bash
npm run dev
```
访问 http://localhost:8080

### 构建Web版本
```bash
npm run build
```
构建产物在 `dist/` 目录

## APK构建

### 前置条件
1. 配置Android SDK环境变量：
```bash
export ANDROID_HOME=~/Android/Sdk
export ANDROID_SDK_ROOT=/opt/android-sdk-linux
```

2. 同步到Android项目：
```bash
npx cap sync android
```

### 使用Android Studio构建（推荐）

1. 打开Android Studio项目：
```bash
npx cap open android
```

2. 在Android Studio中：
   - 等待Gradle同步完成
   - 点击 `Build` → `Generate Signed Bundle / APK`
   - 选择 `APK`
   - 选择 `debug` 签名
   - 点击 `Finish`

3. APK输出位置：
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### 使用命令行构建

```bash
cd android
gradle assembleDebug
```

**注意**: 命令行构建需要网络连接下载依赖。

## 网络依赖

构建APK需要访问以下网络资源：

1. **Google Android Maven仓库**
   - `https://dl.google.com/dl/android/maven2/`
   - 下载Android Gradle插件和相关工具

2. **Maven Central仓库**
   - `https://repo.maven.apache.org/maven2/`
   - 下载第三方依赖库

3. **Gradle分发**
   - `https://services.gradle.org/distributions/gradle-8.9-all.zip`
   - 或使用系统已安装的Gradle

### 网络问题解决方案

如果遇到网络问题，可以：

1. **配置代理**
   ```bash
   export http_proxy=http://proxy-server:port
   export https_proxy=http://proxy-server:port
   ```

2. **使用国内镜像**
   在 `android/build.gradle` 中添加阿里云镜像：
   ```gradle
   repositories {
       maven { url 'https://maven.aliyun.com/repository/google' }
       maven { url 'https://maven.aliyun.com/repository/public' }
       mavenCentral()
   }
   ```

3. **使用本地Gradle**
   - 确保系统已安装Gradle
   - 设置 `JAVA_HOME` 指向Java 11+版本
   - 直接使用系统Gradle命令构建

## 项目结构

```
poem/
├── src/
│   ├── views/           # 页面组件
│   │   ├── Home.vue      # 入口页
│   │   ├── PoemList.vue  # 诗词列表
│   │   └── PoemDetail.vue # 诗词详情
│   ├── data/
│   │   └── poems.js       # 古诗词数据
│   ├── utils/
│   │   └── storage.js     # 本地存储工具
│   ├── router/
│   │   └── index.js       # 路由配置
│   ├── App.vue            # 根组件
│   └── main.js            # 入口文件
├── android/              # Android项目
├── dist/                 # 构建产物
├── public/               # 静态资源
├── capacitor.config.json # Capacitor配置
├── package.json          # 项目配置
├── vite.config.js        # Vite配置
└── index.html            # HTML入口
```

## 数据存储

学习记录存储在浏览器的 `localStorage` 中：

- **存储键**: `poem_learning_records`
- **数据结构**:
```json
{
  "poemId": {
    "firstLearnDate": "2026-02-06",
    "reviewDates": ["2026-02-07", "2026-02-10"]
  }
}
```

## 复习计划算法

基于艾宾浩斯遗忘曲线，复习间隔为：
- 初学后第1天
- 初学后第4天
- 初学后第8天
- 初学后第15天
- 初学后第30天

## 常见问题

### 1. Generate APK菜单是灰色的
- 等待Gradle同步完成
- 查看Android Studio底部的同步进度

### 2. Gradle下载失败
- 检查网络连接
- 配置代理或使用镜像
- 或使用系统已安装的Gradle

### 3. Java版本错误
- 确保使用Java 11或更高版本
- 设置 `JAVA_HOME` 环境变量
- Android Gradle Plugin 7.4.2+ 需要Java 11

### 4. 依赖下载失败
- 检查是否能访问Maven仓库
- 配置镜像源
- 或使用离线模式（需要预先下载依赖）

## 版本信息

- Vue.js: 3.x
- Capacitor: 最新版
- Gradle: 8.9
- Android Gradle Plugin: 7.4.2
- Java: 11+
- Android SDK: API 34+

## 许可证

ISC