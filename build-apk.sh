#!/bin/bash

# Capacitor APK 构建脚本
# 支持 Debug 和 Release 模式构建

set -e

# 解析参数
MODE="debug"
for arg in "$@"; do
    case $arg in
        --release)
            MODE="release"
            ;;
        --debug)
            MODE="debug"
            ;;
    esac
done

echo "========================================="
if [ "$MODE" = "release" ]; then
    echo "开始构建 Capacitor APK (Release 模式)"
else
    echo "开始构建 Capacitor APK (Debug 模式)"
fi
echo "========================================="

# 设置环境变量（关键！）
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export ANDROID_HOME=$HOME/Android/Sdk
export ANDROID_SDK_ROOT=$HOME/Android/Sdk

echo "✅ 环境变量已设置："
echo "   JAVA_HOME=$JAVA_HOME"
echo "   ANDROID_HOME=$ANDROID_HOME"
echo ""

# 1. 构建 Vue 项目
echo "📦 步骤 1/3: 构建 Vue 项目..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Vue 项目构建失败"
    exit 1
fi
echo "✅ Vue 项目构建完成"
echo ""

# 2. 同步到 Android 项目
echo "📱 步骤 2/3: 同步到 Android 项目..."
npx cap sync android

if [ $? -ne 0 ]; then
    echo "❌ Android 同步失败"
    exit 1
fi
echo "✅ Android 同步完成"
echo ""

# 3. 构建 APK
echo "📱 步骤 3/3: 构建 Android APK ($MODE)..."

cd android

if [ "$MODE" = "release" ]; then
    # 清理之前的构建
    echo "🧹 清理构建缓存..."
    ./gradlew clean

    # 构建 Release APK
    echo "🔨 构建 Release APK..."
    ./gradlew assembleRelease

    APK_PATH="app/build/outputs/apk/release/app-release.apk"
else
    # 构建 Debug APK
    echo "🔨 构建 Debug APK..."
    ./gradlew assembleDebug

    APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
fi

cd ..

if [ -f "android/$APK_PATH" ]; then
    echo ""
    echo "========================================="
    echo "🎉 $MODE APK 构建成功！"
    echo "========================================="
    echo "APK 位置: android/$APK_PATH"
    echo ""
    echo "📌 安装命令:"
    echo "   adb install -r android/$APK_PATH"

    # 自动安装（如果设备连接）
    if [ "$MODE" = "debug" ]; then
        echo ""
        echo "📱 正在安装到设备..."
        adb install -r "android/$APK_PATH"
        if [ $? -eq 0 ]; then
            echo "✅ 安装完成"
        else
            echo "⚠️  安装失败（可能是没有连接设备）"
        fi
    fi
else
    echo "❌ APK 构建失败"
    exit 1
fi

echo ""