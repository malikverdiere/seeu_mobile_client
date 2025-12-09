#!/bin/bash

# Script de build iOS pour iPhone
# À exécuter dans le terminal

echo "🔧 Configuration de Xcode..."
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

echo "📦 Installation des pods..."
cd ios
if command -v pod &> /dev/null; then
    pod install
else
    echo "⚠️  CocoaPods non trouvé. Installation..."
    sudo gem install cocoapods
    pod install
fi
cd ..

echo "📱 Vérification des devices connectés..."
xcrun xctrace list devices

echo "🚀 Build et installation sur iPhone..."
npx react-native run-ios --device

echo "✅ Terminé!"

