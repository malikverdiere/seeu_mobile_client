#!/bin/bash

# Script final pour installer les pods avec CocoaPods 1.16.2

set -e

echo "🔧 Configuration de l'environnement..."

# Utiliser Ruby Homebrew
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
export LANG=en_US.UTF-8
export COCOAPODS_NO_BUNDLER=1

# Vérifier Xcode
echo "📱 Vérification de Xcode..."
if ! xcode-select -p &>/dev/null; then
    echo "⚠️  Xcode n'est pas configuré. Exécutez:"
    echo "   sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer"
    exit 1
fi

# Vérifier le SDK
if ! xcrun --show-sdk-path --sdk iphoneos &>/dev/null; then
    echo "⚠️  SDK iOS non trouvé. Configuration de Xcode..."
    sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
fi

echo "✅ Xcode configuré: $(xcode-select -p)"
echo "✅ SDK iOS: $(xcrun --show-sdk-path --sdk iphoneos 2>/dev/null | head -1 || echo 'Non trouvé')"

# Installer les pods
echo ""
echo "📦 Installation des pods avec CocoaPods 1.16.2..."
cd "$(dirname "$0")"
/opt/homebrew/lib/ruby/gems/3.4.0/gems/cocoapods-1.16.2/bin/pod install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Pods installés avec succès!"
    echo ""
    echo "📱 Ouverture de Xcode..."
    open SeeU.xcworkspace
else
    echo ""
    echo "❌ Erreur lors de l'installation des pods"
    exit 1
fi

