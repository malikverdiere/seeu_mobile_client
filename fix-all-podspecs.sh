#!/bin/bash

# Script pour corriger tous les podspecs incompatibles avec CocoaPods 1.10.2

echo "🔧 Correction des podspecs pour compatibilité CocoaPods 1.10.2..."

cd "/Users/malikverdiere/Documents/SEEU/Application/CLIENT MOBILE/SeeU-main"

# 1. react-native-safe-area-context - retirer visionos
if [ -f "node_modules/react-native-safe-area-context/react-native-safe-area-context.podspec" ]; then
    echo "Correction de react-native-safe-area-context..."
    sed -i '' 's/s\.visionos\.deployment_target = "1.0"/# s.visionos.deployment_target = "1.0"  # Commenté pour compatibilité/' \
        node_modules/react-native-safe-area-context/react-native-safe-area-context.podspec
fi

# 2. react-native-screens - retirer visionos et corriger project_header_files
if [ -f "node_modules/react-native-screens/RNScreens.podspec" ]; then
    echo "Correction de react-native-screens..."
    sed -i '' 's/:visionos => "1.0"//' \
        node_modules/react-native-screens/RNScreens.podspec
    sed -i '' 's/s\.project_header_files/s.private_header_files/' \
        node_modules/react-native-screens/RNScreens.podspec
fi

# 3. Chercher et corriger tous les autres podspecs avec visionos
echo "Recherche d'autres podspecs avec visionos..."
find node_modules -name "*.podspec" -exec grep -l "visionos" {} \; | while read podspec; do
    echo "Correction de $podspec..."
    sed -i '' '/visionos/d' "$podspec"
done

# 4. Chercher et corriger project_header_files
echo "Recherche de project_header_files..."
find node_modules -name "*.podspec" -exec grep -l "project_header_files" {} \; | while read podspec; do
    echo "Correction de $podspec..."
    sed -i '' 's/s\.project_header_files/s.private_header_files/g' "$podspec"
done

echo "✅ Corrections terminées!"
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
    echo "❌ Erreur lors de l'installation des pods"
    exit 1
fi

