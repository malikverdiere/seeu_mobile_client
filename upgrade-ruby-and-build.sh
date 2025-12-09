#!/bin/bash

# Script pour mettre à jour Ruby et builder l'app

echo "🔧 Vérification de Ruby..."

CURRENT_RUBY=$(ruby -v | awk '{print $2}')
echo "Version actuelle: $CURRENT_RUBY"

# Vérifier si Ruby 3.x est disponible via Homebrew
if [ -f "/opt/homebrew/opt/ruby/bin/ruby" ]; then
    BREW_RUBY_VERSION=$(/opt/homebrew/opt/ruby/bin/ruby -v | awk '{print $2}')
    echo "✅ Ruby Homebrew trouvé: $BREW_RUBY_VERSION"
    
    # Ajouter au PATH si pas déjà fait
    if [[ ":$PATH:" != *":/opt/homebrew/opt/ruby/bin:"* ]]; then
        echo "Ajout de Ruby Homebrew au PATH..."
        export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
        echo 'export PATH="/opt/homebrew/opt/ruby/bin:$PATH"' >> ~/.zshrc
    fi
else
    echo "📦 Installation de Ruby via Homebrew..."
    brew install ruby
    
    # Ajouter au PATH
    export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
    echo 'export PATH="/opt/homebrew/opt/ruby/bin:$PATH"' >> ~/.zshrc
fi

# Vérifier la nouvelle version
source ~/.zshrc
NEW_RUBY=$(ruby -v | awk '{print $2}')
echo "Nouvelle version Ruby: $NEW_RUBY"

# Installer CocoaPods
echo ""
echo "📦 Installation de CocoaPods..."
gem install cocoapods

# Installer les pods
echo ""
echo "📦 Installation des pods..."
cd ios
rm -rf Pods Podfile.lock
pod install

if [ $? -eq 0 ]; then
    echo "✅ Pods installés avec succès!"
    cd ..
    echo ""
    echo "📱 Ouverture de Xcode..."
    open ios/SeeU.xcworkspace
    echo ""
    echo "✅ Terminé! Vous pouvez maintenant builder dans Xcode."
else
    echo "❌ Erreur lors de l'installation des pods"
    exit 1
fi

