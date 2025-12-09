#!/bin/bash

# Script final pour installer CocoaPods avec Ruby 2.6

echo "🔧 Installation de Bundler (gestionnaire de gems)..."
sudo gem install bundler

echo ""
echo "📦 Installation de CocoaPods via Bundler..."
cd ios

# Installer les gems via Bundler
bundle install

if [ $? -eq 0 ]; then
    echo "✅ CocoaPods installé via Bundler!"
else
    echo "❌ Erreur lors de l'installation via Bundler"
    echo ""
    echo "Tentative avec version encore plus ancienne..."
    sudo gem install cocoapods -v 1.10.2
fi

echo ""
echo "🧹 Nettoyage des anciens pods..."
rm -rf Pods Podfile.lock

echo ""
echo "📦 Installation des pods..."
if command -v bundle &> /dev/null && [ -f Gemfile.lock ]; then
    bundle exec pod install
else
    pod install
fi

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

