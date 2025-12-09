# 🔧 Fix: Command PhaseScriptExecution failed

## 🔍 Identifier le script qui échoue

L'erreur "Command PhaseScriptExecution failed" est générique. Pour trouver le script exact :

### Dans Xcode :

1. **Ouvrez le panneau de rapport** :
   - `View` > `Navigators` > `Show Report Navigator` (⇧⌘9)
   - Ou cliquez sur l'icône ⚠️ en haut à droite

2. **Trouvez l'erreur** dans la liste des builds

3. **Cliquez sur l'erreur** pour voir les détails

4. **Cherchez le nom du script** qui échoue :
   - `Bundle React Native code and images`
   - `[CP] Embed Pods Frameworks`
   - `[CP] Check Pods Manifest.lock`
   - `[CP] Copy Pods Resources`
   - Autre script personnalisé

---

## 🛠️ Solutions par type d'erreur

### 1. "Bundle React Native code and images" échoue

**Causes possibles** :
- Node.js non trouvé
- React Native non installé
- Cache Metro corrompu

**Solutions** :

```bash
cd "/Users/malikverdiere/Documents/SEEU-App"

# Vérifier Node.js
which node
node --version

# Mettre à jour .xcode.env.local
echo "export NODE_BINARY=$(which node)" > ios/.xcode.env.local

# Réinstaller les dépendances
rm -rf node_modules
npm install

# Nettoyer le cache
rm -rf node_modules/.cache
rm -rf /tmp/metro-*

# Relancer Metro
npm start -- --reset-cache
```

**Dans Xcode** :
- `Product` > `Clean Build Folder` (⇧⌘K)
- Fermer et rouvrir Xcode
- Relancer le build

---

### 2. "[CP] Embed Pods Frameworks" échoue

**Causes possibles** :
- Pods non installés
- Podfile.lock désynchronisé
- Problème de permissions

**Solutions** :

```bash
cd "/Users/malikverdiere/Documents/SEEU-App/ios"

# Nettoyer les pods
rm -rf Pods Podfile.lock

# Réinstaller
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
export LANG=en_US.UTF-8
export COCOAPODS_NO_BUNDLER=1
/opt/homebrew/lib/ruby/gems/3.4.0/gems/cocoapods-1.16.2/bin/pod install

# Ou avec Bundler si vous l'utilisez
bundle exec pod install
```

**Dans Xcode** :
- Fermer Xcode
- Supprimer `ios/Pods` et `ios/Podfile.lock`
- Relancer `pod install`
- Rouvrir Xcode

---

### 3. "[CP] Check Pods Manifest.lock" échoue

**Cause** : `Podfile.lock` et `Pods/Manifest.lock` ne correspondent pas

**Solution** :

```bash
cd "/Users/malikverdiere/Documents/SEEU-App/ios"
pod install
```

---

### 4. Erreur liée à patch-package

**Si vous voyez une erreur avec patch-package** :

```bash
cd "/Users/malikverdiere/Documents/SEEU-App"

# Vérifier que patch-package est installé
npm list patch-package

# Réappliquer les patches manuellement
npx patch-package

# Si ça échoue, vérifier les patches
ls -la patches/
```

---

## 🚀 Solution rapide (script automatique)

J'ai créé un script qui corrige automatiquement les problèmes courants :

```bash
cd "/Users/malikverdiere/Documents/SEEU-App"
./fix-phase-script-error.sh
```

Puis :
1. Fermer Xcode complètement
2. Rouvrir : `open ios/SeeU.xcworkspace`
3. `Product` > `Clean Build Folder` (⇧⌘K)
4. Relancer le build (⌘R)

---

## 🔍 Vérifications supplémentaires

### Vérifier les chemins dans Xcode

1. Dans Xcode, sélectionnez le projet "SeeU"
2. Onglet "Build Settings"
3. Cherchez "REACT_NATIVE_PATH"
4. Vérifiez qu'il pointe vers : `$(SRCROOT)/../node_modules/react-native`

### Vérifier les variables d'environnement

Dans Xcode, ajoutez un script de build temporaire pour debugger :

1. `Build Phases` > `+` > `New Run Script Phase`
2. Ajoutez :
   ```bash
   echo "NODE_BINARY: $NODE_BINARY"
   echo "REACT_NATIVE_PATH: $REACT_NATIVE_PATH"
   echo "PATH: $PATH"
   which node
   node --version
   ```
3. Relancez le build et vérifiez les logs

---

## 📝 Logs détaillés

Pour voir les logs complets d'un script qui échoue :

1. Dans Xcode, allez dans le rapport de build
2. Cliquez sur le script qui échoue
3. Regardez la section "Build log" en bas
4. Copiez l'erreur complète pour plus d'aide

---

## ⚠️ Erreurs courantes spécifiques

### "node: command not found"
→ Vérifier `.xcode.env.local` et le PATH

### "Cannot find module 'react-native'"
→ `npm install` dans le dossier racine

### "Pod install failed"
→ Vérifier Ruby/CocoaPods version et réinstaller les pods

### "Permission denied"
→ Vérifier les permissions des fichiers et dossiers

---

**Dernière mise à jour** : 2025-01-21

