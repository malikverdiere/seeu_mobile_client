#!/bin/bash

# Script de nettoyage complet et build iOS

set -e

echo "🧹 Nettoyage complet du projet iOS..."

cd "$(dirname "$0")"

# 1. Nettoyer les builds Xcode
echo "📦 Nettoyage des builds..."
rm -rf build DerivedData
xcodebuild clean -workspace SeeU.xcworkspace -scheme SeeU 2>/dev/null || true

# 2. Nettoyer le cache Metro
echo "🚇 Nettoyage du cache Metro..."
cd ..
rm -rf node_modules/.cache
npm start -- --reset-cache &
METRO_PID=$!

# 3. Nettoyer les pods
echo "📱 Nettoyage des pods..."
cd ios
rm -rf Pods Podfile.lock

# 4. Réinstaller les pods
echo "📥 Réinstallation des pods..."
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
export LANG=en_US.UTF-8
export COCOAPODS_NO_BUNDLER=1
/opt/homebrew/lib/ruby/gems/3.4.0/gems/cocoapods-1.16.2/bin/pod install

# 5. Nettoyer le cache Xcode
echo "🗑️  Nettoyage du cache Xcode..."
rm -rf ~/Library/Developer/Xcode/DerivedData/*

echo ""
echo "✅ Nettoyage terminé!"
echo ""
echo "📱 Ouverture de Xcode..."
open SeeU.xcworkspace

echo ""
echo "💡 Instructions:"
echo "1. Dans Xcode, sélectionnez votre iPhone dans la liste des devices"
echo "2. Cliquez sur le bouton Play ▶️ pour builder"
echo "3. Si les erreurs persistent, fermez et rouvrez Xcode"

# Arrêter Metro après 5 secondes
sleep 5
kill $METRO_PID 2>/dev/null || true

