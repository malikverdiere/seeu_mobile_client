# 🔧 Fix des Erreurs Xcode

## Erreurs Actuelles

1. **"Could not compute dependency graph: PIF transfer session"**
2. **"Property with 'retain (or strong)' attribute must be of object type"** dans :
   - RCTBridgeModule
   - RCTModuleData
   - RCTReconnectingWebSocket

## ✅ Solutions

### Étape 1 : Nettoyer dans Xcode

1. **Fermer Xcode complètement** (⌘ + Q)
2. **Rouvrir Xcode** : `ios/SeeU.xcworkspace` (⚠️ PAS `.xcodeproj`)
3. Dans Xcode : **Product → Clean Build Folder** (⇧⌘K)
4. Dans Xcode : **File → Close Project**, puis rouvrir

### Étape 2 : Vérifier le Device

1. **Sélectionner votre iPhone** dans la barre d'outils (en haut)
2. Si votre iPhone n'apparaît pas :
   - Vérifiez qu'il est déverrouillé
   - Acceptez "Faire confiance à cet ordinateur" sur l'iPhone
   - Dans Xcode : **Window → Devices and Simulators** → Vérifier la connexion

### Étape 3 : Builder

1. **Cliquez sur le bouton Play ▶️** (ou ⌘R)
2. Si les erreurs persistent, essayez :
   - **Product → Build** (⌘B) d'abord
   - Puis **Product → Run** (⌘R)

### Étape 4 : Si les erreurs persistent

Les erreurs "retain (or strong)" sont souvent des faux positifs du cache. Essayez :

```bash
cd "/Users/malikverdiere/Documents/SEEU/Application/CLIENT MOBILE/SeeU-main"
./ios/clean-and-build.sh
```

Puis dans Xcode :
1. **Product → Clean Build Folder** (⇧⌘K)
2. **Quit Xcode** (⌘Q)
3. **Rouvrir Xcode**
4. **Product → Build** (⌘B)

## 🎯 Build Direct depuis Terminal (Alternative)

Si Xcode continue à avoir des problèmes, vous pouvez builder depuis le terminal :

```bash
cd "/Users/malikverdiere/Documents/SEEU/Application/CLIENT MOBILE/SeeU-main/ios"
xcodebuild -workspace SeeU.xcworkspace \
  -scheme SeeU \
  -configuration Debug \
  -destination 'platform=iOS,id=YOUR_DEVICE_ID' \
  build
```

Pour trouver votre Device ID :
```bash
xcrun xctrace list devices
```

## 📝 Notes

- ⚠️ Toujours utiliser **`.xcworkspace`** et jamais **`.xcodeproj`**
- Les erreurs de "retain (or strong)" sont souvent des warnings qui n'empêchent pas le build
- Si le build réussit malgré les erreurs, c'est normal (warnings)
