#!/bin/bash

echo "🔧 Configuration de CocoaPods avec Ruby Homebrew..."

# Ajouter Ruby Homebrew au PATH (en premier pour priorité)
if ! grep -q "/opt/homebrew/opt/ruby/bin" ~/.zshrc; then
    echo "" >> ~/.zshrc
    echo "# Ruby Homebrew pour CocoaPods" >> ~/.zshrc
    echo 'export PATH="/opt/homebrew/opt/ruby/bin:$PATH"' >> ~/.zshrc
    echo "✅ PATH ajouté à ~/.zshrc"
fi

# Charger le nouveau PATH
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"

# Vérifier les versions
echo ""
echo "📊 Versions:"
echo "  Ruby: $(ruby -v)"
echo "  CocoaPods: $(gem list cocoapods | grep cocoapods | head -1)"

# Supprimer l'ancien pod si possible (nécessite sudo)
echo ""
echo "⚠️  Pour utiliser CocoaPods 1.16.2, vous devez exécuter:"
echo "   sudo rm /usr/local/bin/pod"
echo "   sudo ln -sf /opt/homebrew/lib/ruby/gems/3.4.0/gems/cocoapods-1.16.2/bin/pod /usr/local/bin/pod"
echo ""
read -p "Voulez-vous que j'essaie maintenant? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo rm /usr/local/bin/pod 2>/dev/null && echo "✅ Ancien pod supprimé" || echo "⚠️  Impossible de supprimer (peut-être déjà supprimé)"
    sudo ln -sf /opt/homebrew/lib/ruby/gems/3.4.0/gems/cocoapods-1.16.2/bin/pod /usr/local/bin/pod && echo "✅ Nouveau pod lié" || echo "⚠️  Impossible de créer le lien"
fi

# Installer les pods
echo ""
echo "📦 Installation des pods..."
cd ios
pod install

if [ $? -eq 0 ]; then
    echo "✅ Pods installés avec succès!"
    cd ..
    echo ""
    echo "📱 Ouverture de Xcode..."
    open ios/SeeU.xcworkspace
else
    echo "❌ Erreur lors de l'installation"
    echo ""
    echo "💡 Solution alternative:"
    echo "   1. Ouvrez un nouveau terminal"
    echo "   2. cd $(pwd)/ios"
    echo "   3. export PATH=\"/opt/homebrew/opt/ruby/bin:\$PATH\""
    echo "   4. /opt/homebrew/lib/ruby/gems/3.4.0/gems/cocoapods-1.16.2/bin/pod install"
    exit 1
fi

