#!/bin/bash

# Script pour corriger l'erreur "Command PhaseScriptExecution failed"

set -e

echo "🔧 Correction de l'erreur PhaseScriptExecution..."

cd "$(dirname "$0")"

# 1. Vérifier que Node.js est accessible
echo "📦 Vérification de Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas dans le PATH"
    exit 1
fi

NODE_PATH=$(command -v node)
echo "✅ Node.js trouvé: $NODE_PATH"

# 2. Mettre à jour .xcode.env.local avec le bon chemin Node
echo "📝 Mise à jour de .xcode.env.local..."
cat > ios/.xcode.env.local << EOF
export NODE_BINARY=$NODE_PATH
EOF
echo "✅ .xcode.env.local mis à jour"

# 3. Vérifier que patch-package fonctionne
echo "🔨 Vérification de patch-package..."
if [ -d "patches" ] && [ "$(ls -A patches/*.patch 2>/dev/null)" ]; then
    echo "📋 Application des patches..."
    npx patch-package || echo "⚠️  Erreur lors de l'application des patches (peut être ignorée)"
else
    echo "ℹ️  Aucun patch à appliquer"
fi

# 4. Nettoyer le cache Metro
echo "🧹 Nettoyage du cache Metro..."
rm -rf node_modules/.cache
rm -rf /tmp/metro-*

# 5. Vérifier les pods
echo "📱 Vérification des pods..."
cd ios
if [ ! -d "Pods" ]; then
    echo "📥 Installation des pods..."
    export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
    export LANG=en_US.UTF-8
    export COCOAPODS_NO_BUNDLER=1
    /opt/homebrew/lib/ruby/gems/3.4.0/gems/cocoapods-1.16.2/bin/pod install || {
        echo "⚠️  Erreur lors de l'installation des pods"
        echo "💡 Essayez manuellement: cd ios && pod install"
    }
else
    echo "✅ Pods déjà installés"
fi
cd ..

# 6. Nettoyer DerivedData
echo "🗑️  Nettoyage de DerivedData..."
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# 7. Vérifier que REACT_NATIVE_PATH est défini
echo "🔍 Vérification de REACT_NATIVE_PATH..."
if [ -d "node_modules/react-native" ]; then
    REACT_NATIVE_PATH="$(pwd)/node_modules/react-native"
    echo "✅ React Native trouvé: $REACT_NATIVE_PATH"
else
    echo "❌ React Native non trouvé dans node_modules"
    echo "💡 Exécutez: npm install"
    exit 1
fi

echo ""
echo "✅ Corrections terminées!"
echo ""
echo "📱 Prochaines étapes:"
echo "1. Fermez Xcode complètement"
echo "2. Relancez Xcode: open ios/SeeU.xcworkspace"
echo "3. Dans Xcode: Product > Clean Build Folder (⇧⌘K)"
echo "4. Relancez le build (⌘R)"
echo ""
echo "💡 Si l'erreur persiste, vérifiez les logs Xcode pour voir quel script échoue exactement"

