#!/bin/bash

# Script pour corriger les erreurs Pods et builder

echo "🔧 Installation de CocoaPods..."
if ! command -v pod &> /dev/null; then
    echo "CocoaPods non trouvé. Installation..."
    sudo gem install cocoapods
else
    echo "✅ CocoaPods déjà installé"
fi

echo ""
echo "📦 Réinstallation des Pods..."
cd ios

# Nettoyer
echo "Nettoyage des anciens pods..."
rm -rf Pods Podfile.lock

# Installer
echo "Installation des pods (cela peut prendre 5-10 minutes)..."
pod install

if [ $? -eq 0 ]; then
    echo "✅ Pods installés avec succès!"
else
    echo "❌ Erreur lors de l'installation des pods"
    exit 1
fi

cd ..

echo ""
echo "📱 Ouverture de Xcode..."
open ios/SeeU.xcworkspace

echo ""
echo "✅ Terminé!"
echo ""
echo "📋 Prochaines étapes dans Xcode:"
echo "1. Cliquez sur 'SeeU' (icône bleue) dans le navigateur"
echo "2. Sélectionnez le target 'SeeU'"
echo "3. Onglet 'Signing & Capabilities'"
echo "4. Cochez 'Automatically manage signing'"
echo "5. Sélectionnez votre équipe Apple"
echo "6. Sélectionnez votre iPhone et cliquez Play ▶️"

