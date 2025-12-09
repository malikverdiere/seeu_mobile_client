#!/bin/bash

# Script pour construire et installer l'application Android sur un appareil connecté via ADB

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Fonction pour charger nvm
load_nvm() {
    if [ -s "$HOME/.nvm/nvm.sh" ]; then
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
        return 0
    fi
    return 1
}

# Fonction pour trouver node dans le PATH
find_node() {
    # Essayer de charger nvm
    load_nvm
    
    # Vérifier si node est maintenant dans le PATH
    if command -v node &> /dev/null; then
        return 0
    fi
    
    # Chercher dans les emplacements courants
    for path in \
        "/opt/homebrew/bin/node" \
        "/usr/local/bin/node" \
        "$HOME/.homebrew/bin/node" \
        "/usr/bin/node"
    do
        if [ -f "$path" ] && [ -x "$path" ]; then
            export PATH="$(dirname $path):$PATH"
            return 0
        fi
    done
    
    return 1
}

# Chercher node
if ! find_node; then
    echo "❌ Node.js n'est pas trouvé."
    echo ""
    echo "Options pour installer Node.js :"
    echo "  1. Via nvm (recommandé) :"
    echo "     curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo "     source ~/.nvm/nvm.sh && nvm install --lts"
    echo ""
    echo "  2. Via Homebrew :"
    echo "     brew install node"
    echo ""
    echo "  3. Télécharger depuis : https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Vérifier qu'un appareil Android est connecté
if ! command -v adb &> /dev/null; then
    echo "❌ ADB n'est pas trouvé dans le PATH."
    exit 1
fi

DEVICES=$(adb devices | grep -v "List" | grep "device$" | wc -l | tr -d ' ')
if [ "$DEVICES" -eq 0 ]; then
    echo "❌ Aucun appareil Android connecté. Veuillez connecter un appareil via USB ou activer le débogage USB."
    exit 1
fi

echo "✅ $DEVICES appareil(s) Android connecté(s)"

# Installer les dépendances npm si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances npm..."
    npm install
else
    echo "✅ node_modules existe déjà"
fi

# Construire et installer l'application
echo "🔨 Construction et installation de l'application Android..."
npm run android

echo "✅ Application installée avec succès sur votre appareil Android !"

