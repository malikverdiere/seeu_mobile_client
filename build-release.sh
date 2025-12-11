#!/bin/bash
set -e

echo "🔧 Nettoyage précédent..."
cd android
./gradlew clean
cd ..

echo "🏗️ Génération de l'APK Release..."
cd android
./gradlew assembleRelease
cd ..

APK_PATH="android/app/build/outputs/apk/release/app-release.apk"

if [ ! -f "$APK_PATH" ]; then
  echo "❌ APK Release introuvable !"
  exit 1
fi

echo "📱 Vérification appareil Android..."
adb devices

DEVICE=$(adb devices | grep -v "List" | grep "device$" | wc -l | tr -d ' ')
if [ "$DEVICE" -eq 0 ]; then
    echo "❌ Aucun appareil connecté !"
    exit 1
fi

echo "📥 Installation APK Release sur l'appareil..."
adb install -r $APK_PATH

echo "✅ Installation terminée !"
