#!/bin/bash

# Script pour builder depuis Xcode directement
# Utilise le workspace Xcode au lieu de xcodebuild

echo "🔧 Configuration de Xcode..."
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

echo "📱 Recherche de votre iPhone..."
DEVICE=$(xcrun xctrace list devices 2>&1 | grep -i "iphone" | grep -v "Simulator" | head -1 | awk -F'[()]' '{print $1}' | xargs)

if [ -z "$DEVICE" ]; then
    echo "❌ Aucun iPhone trouvé. Vérifiez que votre iPhone est connecté et déverrouillé."
    exit 1
fi

echo "✅ iPhone trouvé: $DEVICE"

echo "🚀 Ouverture de Xcode pour builder..."
open ios/SeeU.xcworkspace

echo ""
echo "📋 Instructions:"
echo "1. Dans Xcode, sélectionnez votre iPhone dans la liste des devices (en haut)"
echo "2. Cliquez sur le bouton Play ▶️ pour builder et installer"
echo ""
echo "💡 Si vous voyez une erreur de signature:"
echo "   - Allez dans Signing & Capabilities"
echo "   - Cochez 'Automatically manage signing'"
echo "   - Sélectionnez votre équipe Apple"

