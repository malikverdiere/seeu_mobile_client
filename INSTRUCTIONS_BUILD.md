# 📱 Instructions pour Builder sur iPhone

## ⚡ Méthode Rapide (Recommandée)

### Option 1 : Via Xcode (Le plus simple)

1. **Ouvrir Xcode** :
   ```bash
   open ios/SeeU.xcworkspace
   ```

2. **Dans Xcode** :
   - En haut à gauche, sélectionnez votre **iPhone** dans la liste des devices
   - Si votre iPhone n'apparaît pas :
     - Vérifiez qu'il est connecté et déverrouillé
     - Sur l'iPhone : accepter "Faire confiance à cet ordinateur"
   - Cliquez sur le bouton **Play ▶️** pour builder et installer

3. **Si erreur de signature** :
   - Sélectionner le projet "SeeU" dans le navigateur
   - Onglet "Signing & Capabilities"
   - Cocher "Automatically manage signing"
   - Sélectionner votre équipe Apple

---

### Option 2 : Via Terminal (Script automatique)

Exécutez dans votre terminal :

```bash
cd "/Users/malikverdiere/Documents/SEEU/Application/CLIENT MOBILE/SeeU-main"
./build-ios.sh
```

Le script va :
1. Configurer xcode-select (demandera votre mot de passe)
2. Installer les pods si nécessaire
3. Builder et installer sur votre iPhone

---

### Option 3 : Commandes manuelles

Si vous préférez exécuter les commandes une par une :

```bash
# 1. Configurer Xcode (demandera votre mot de passe)
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

# 2. Installer CocoaPods si nécessaire
sudo gem install cocoapods

# 3. Installer les dépendances iOS
cd ios
pod install
cd ..

# 4. Builder et installer
npx react-native run-ios --device
```

---

## 🔍 Vérifications

### Vérifier que votre iPhone est connecté :
```bash
xcrun xctrace list devices
```

Vous devriez voir votre iPhone dans la liste.

### Vérifier la configuration Xcode :
```bash
xcode-select -p
```

Devrait afficher : `/Applications/Xcode.app/Contents/Developer`

---

## ⚠️ Problèmes Courants

### "xcode-select: error: tool 'xcodebuild' requires Xcode"
→ Exécutez : `sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer`

### "pod: command not found"
→ Exécutez : `sudo gem install cocoapods`

### iPhone non détecté
→ Vérifiez que :
- L'iPhone est connecté et déverrouillé
- Vous avez accepté "Faire confiance à cet ordinateur" sur l'iPhone
- Le câble USB fonctionne

### Erreur de signature
→ Dans Xcode : Signing & Capabilities → Automatically manage signing → Sélectionner votre équipe

---

## ✅ Après le Build

Une fois l'app installée sur votre iPhone :
- L'app SeeU devrait s'ouvrir automatiquement
- Vous pouvez tester le module Beauty
- Les logs apparaîtront dans le terminal Metro

---

**Bonne chance ! 🚀**

