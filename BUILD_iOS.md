# 📱 Guide de Build iOS sur iPhone Physique

## ⚠️ Actions Requises (à exécuter dans votre terminal)

### 1. Configurer Xcode (nécessite votre mot de passe admin)

```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### 2. Installer CocoaPods (si pas déjà installé)

```bash
sudo gem install cocoapods
```

### 3. Installer les dépendances iOS

```bash
cd ios
pod install
cd ..
```

### 4. Vérifier que votre iPhone est connecté

```bash
xcrun xctrace list devices
```

Vous devriez voir votre iPhone dans la liste.

### 5. Builder et installer sur votre iPhone

**Option A : Via React Native CLI**
```bash
npx react-native run-ios --device
```

**Option B : Via Xcode (recommandé)**
1. Ouvrir `ios/SeeU.xcworkspace` dans Xcode
2. Sélectionner votre iPhone dans la liste des devices (en haut)
3. Cliquer sur le bouton "Play" ▶️ pour builder et installer

### 6. Si vous avez des erreurs de signature

Dans Xcode :
1. Sélectionner le projet "SeeU" dans le navigateur
2. Aller dans l'onglet "Signing & Capabilities"
3. Cocher "Automatically manage signing"
4. Sélectionner votre équipe de développement Apple

## 🔍 Vérifications Actuelles

- ✅ Xcode installé : `/Applications/Xcode.app`
- ❌ xcode-select : pointe vers CommandLineTools (à corriger)
- ❌ CocoaPods : non installé
- ✅ Podfile.lock : existe (pods déjà installés précédemment)
- ✅ Node.js : v20.19.6
- ✅ npm : v10.8.2

## 📝 Notes

- La première fois, Xcode peut demander d'accepter la licence
- Le build peut prendre plusieurs minutes
- Assurez-vous que votre iPhone est déverrouillé et que vous acceptez la confiance de l'ordinateur

## 🚀 Après le build

Une fois l'app installée sur votre iPhone, vous pourrez :
- Tester le module Beauty
- Vérifier que Firebase fonctionne
- Tester les fonctionnalités de réservation

---

**Commande rapide complète** (après avoir configuré xcode-select) :
```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer && \
cd ios && pod install && cd .. && \
npx react-native run-ios --device
```

