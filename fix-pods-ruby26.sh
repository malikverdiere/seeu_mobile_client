#!/bin/bash

# Script pour installer CocoaPods compatible avec Ruby 2.6

echo "🔧 Installation de CocoaPods compatible avec Ruby 2.6..."
echo ""

# Installer une version compatible de CocoaPods
echo "Installation de CocoaPods 1.11.3 (compatible Ruby 2.6)..."
sudo gem install cocoapods -v 1.11.3

if [ $? -eq 0 ]; then
    echo "✅ CocoaPods installé avec succès!"
else
    echo "❌ Erreur lors de l'installation"
    exit 1
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
echo "5. Cliquez 'Add Account...' et connectez-vous avec votre Apple ID"
echo "6. Sélectionnez votre équipe"
echo "7. Sélectionnez votre iPhone et cliquez Play ▶️"

