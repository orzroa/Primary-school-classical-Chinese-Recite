# 古诗词背诵 App

一款用于小学古诗词背诵学习的 Android 应用，采用 Capacitor + Vue 3 + Vite 技术方案。

## 数据说明

- 收录小学1-6年级古诗词共 **200首**
- 所有诗文内容已与义务教育语文教材核对确认
- 每首诗文按年级顺序编号（order字段从1到200）

## 功能特性

- **年级分类**：支持 1-6 年级古诗词分类学习
- **学习记录**：记录每次学习过程，包括初学和复习时间
- **复习计划**：基于艾宾浩斯遗忘曲线，自动安排 1/4/8/15/30 天后的复习计划
- **隐藏原文**：支持隐藏原文背诵模式
- **学习历史**：按时间倒序展示每日学习记录

## 技术栈

- **前端**：Vue 3 + Vite
- **跨平台**：Capacitor
- **打包**：Android APK (gradle)

## 快速开始

### 环境要求

- Node.js 16+
- Java 21
- Android SDK

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev          # 启动 Vue 开发服务器
npx cap open android # 打开 Android Studio
```

### 构建 APK

```bash
./build-apk.sh --debug    # 构建 Debug APK（自动安装到设备）
./build-apk.sh --release  # 构建 Release APK
```

构建完成后，APK 文件位于 `android/app/build/outputs/apk/` 目录下。

## 项目结构

```
├── src/              # Vue 前端源码
├── android/          # Android 原生项目
├── public/           # 静态资源
├── build-apk.sh      # APK 构建脚本
└── package.json      # 项目依赖配置
```

## 学习算法

每首诗词的复习计划安排如下：

- 初次学习当天标记为"初学"
- 之后在第 1、4、8、15、30 天安排复习
- 每次点击"标记学习"按钮完成一次学习记录
- 每首诗词每天只能学习一次

## 许可证

MIT
