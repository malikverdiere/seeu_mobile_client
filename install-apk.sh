#!/bin/bash

# Script pour installer un APK existant sur un appareil Android connecté via ADB

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Vérifier qu'ADB est disponible
if ! command -v adb &> /dev/null; then
    echo "❌ ADB n'est pas trouvé dans le PATH."
    exit 1
fi

# Vérifier qu'un appareil est connecté
DEVICES=$(adb devices | grep -v "List" | grep "device$" | wc -l | tr -d ' ')
if [ "$DEVICES" -eq 0 ]; then
    echo "❌ Aucun appareil Android connecté. Veuillez connecter un appareil via USB ou activer le débogage USB."
    exit 1
fi

echo "✅ $DEVICES appareil(s) Android connecté(s)"

# Chercher l'APK
APK_PATH=""

# Chercher dans le dossier android/app/build/outputs/apk/debug
if [ -f "android/app/build/outputs/apk/debug/app-debug.apk" ]; then
    APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
# Chercher dans android/app/build/outputs/apk/release
elif [ -f "android/app/build/outputs/apk/release/app-release.apk" ]; then
    APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
# Chercher n'importe quel APK dans le dossier android
elif [ -n "$(find android -name "*.apk" -type f 2>/dev/null | head -1)" ]; then
    APK_PATH=$(find android -name "*.apk" -type f 2>/dev/null | head -1)
fi

# Si aucun APK n'est trouvé, demander le chemin
if [ -z "$APK_PATH" ]; then
    if [ -n "$1" ]; then
        APK_PATH="$1"
    else
        echo "❌ Aucun APK trouvé."
        echo ""
        echo "Usage: $0 [chemin/vers/votre/app.apk]"
        echo ""
        echo "Ou placez votre APK dans l'un de ces emplacements :"
        echo "  - android/app/build/outputs/apk/debug/app-debug.apk"
        echo "  - android/app/build/outputs/apk/release/app-release.apk"
        exit 1
    fi
fi

# Vérifier que le fichier existe
if [ ! -f "$APK_PATH" ]; then
    echo "❌ Le fichier APK n'existe pas : $APK_PATH"
    exit 1
fi

echo "📱 Installation de l'APK : $APK_PATH"
echo ""

# Désinstaller l'ancienne version si elle existe
echo "🗑️  Désinstallation de l'ancienne version (si elle existe)..."
adb uninstall com.seeu.client 2>/dev/null || true

# Installer le nouvel APK
echo "📥 Installation de l'application..."
adb install "$APK_PATH"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Application installée avec succès sur votre appareil Android !"
    echo ""
    echo "Pour lancer l'application :"
    echo "  adb shell am start -n com.seeu.client/.MainActivity"
else
    echo ""
    echo "❌ Erreur lors de l'installation de l'APK."
    exit 1
fi

