# ⚡ Build Rapide sur iPhone

## 🎯 Méthode la Plus Simple (Depuis Xcode)

Xcode est déjà ouvert. Voici les étapes :

### 1. Dans Xcode (fenêtre actuelle)

1. **Sélectionnez votre iPhone** :
   - En haut à gauche, cliquez sur le sélecteur de device
   - Choisissez "iPhone de Malik" (même si iOS 18.5 n'est pas installé, ça fonctionnera)

2. **Cliquez sur Play ▶️** :
   - Le bouton Play est en haut à gauche de Xcode
   - Xcode va builder et installer l'app sur votre iPhone

3. **Si erreur de signature** :
   - Cliquez sur "SeeU" dans le navigateur de gauche
   - Onglet "Signing & Capabilities"
   - ✅ Cocher "Automatically manage signing"
   - Sélectionner votre équipe Apple

### 2. Alternative : Script Automatique

Si vous préférez utiliser le terminal :

```bash
cd "/Users/malikverdiere/Documents/SEEU/Application/CLIENT MOBILE/SeeU-main"
./build-xcode.sh
```

Le script va :
- Configurer xcode-select (demandera votre mot de passe)
- Ouvrir Xcode
- Vous donner les instructions

---

## ✅ Vérifications

- ✅ Xcode est ouvert
- ✅ Votre iPhone est détecté ("iPhone de Malik")
- ✅ Le projet SeeU est chargé
- ⚠️ iOS 18.5 SDK non installé (mais pas nécessaire pour builder)

---

## 🚀 Action Immédiate

**Dans Xcode, cliquez simplement sur le bouton Play ▶️ !**

L'app va se builder et s'installer sur votre iPhone automatiquement.

---

**Note** : Le premier build peut prendre 2-5 minutes. Les builds suivants seront plus rapides.

