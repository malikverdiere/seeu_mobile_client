# Rapport d'Analyse du Projet SeeU Mobile Client

**Date**: Décembre 2024  
**Version du projet**: 4.0  
**Type**: Application mobile React Native

---

## 1. Vue d'ensemble

### 1.1 Description générale

**SeeU** est une application mobile de fidélité et de découverte de commerces locaux (boutiques, restaurants, salons de beauté, etc.). L'application permet aux utilisateurs de :

- Découvrir des commerces locaux par géolocalisation
- S'inscrire à des programmes de fidélité
- Gagner et utiliser des points de fidélité
- Recevoir des offres et campagnes marketing personnalisées
- Scanner des QR codes et tags NFC pour gagner des points
- Communiquer avec les commerces via un système de chat
- Gérer leur profil et historique

### 1.2 Architecture technique

- **Framework**: React Native 0.76.7
- **Langage**: JavaScript/TypeScript
- **Backend**: Firebase (Firestore, Auth, Storage, Functions, Messaging, Analytics)
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **Base de données**: Firestore (databaseId: "seeu-asia")
- **Plateformes**: iOS et Android

---

## 2. Structure du projet

### 2.1 Organisation des dossiers

```
SeeU-main/
├── Components/          # Composants React Native
│   ├── AGTools/         # Outils et utilitaires globaux
│   ├── Login/           # Authentification
│   ├── Screens/         # Écrans principaux
│   ├── Chat/            # Système de chat
│   └── img/             # Assets images
├── config/              # Configuration Firebase
├── android/             # Code natif Android
├── ios/                 # Code natif iOS
└── App.tsx              # Point d'entrée
```

### 2.2 Technologies principales

#### Backend & Services
- **Firebase Auth**: Authentification (Email, Google, Apple)
- **Firestore**: Base de données NoSQL
- **Firebase Storage**: Stockage d'images
- **Firebase Functions**: Cloud Functions
- **Firebase Messaging**: Notifications push
- **Firebase Analytics**: Analytics
- **Microsoft Clarity**: Tracking utilisateur (Android)

#### Navigation & UI
- **React Navigation**: Navigation Stack et Bottom Tabs
- **React Native Reanimated**: Animations
- **React Native Gesture Handler**: Gestes
- **React Native Safe Area Context**: Gestion des zones sûres

#### Fonctionnalités natives
- **NFC Manager**: Lecture de tags NFC
- **QR Code**: Génération et scan de QR codes
- **Géolocalisation**: Localisation GPS
- **Image Picker**: Sélection d'images
- **Permissions**: Gestion des permissions

#### Internationalisation
- Support multilingue (FR, EN, TH)
- Système de traduction via `Traductor`

---

## 3. Fonctionnalités principales

### 3.1 Authentification

**Méthodes supportées**:
- Email/Mot de passe
- Google Sign-In
- Apple Sign-In (iOS)

**Flux**:
1. Inscription (`SignUp.js`)
2. Connexion (`SignIn.js`)
3. Récupération de mot de passe (`PassLost.js`)
4. Gestion de session via `AuthContext`

**Collections Firestore**:
- `Clients/{userId}`: Profil utilisateur

### 3.2 Découverte de commerces

**Écran principal**: `Home.js`
- Affichage des campagnes marketing
- Liste des boutiques proches
- Offres spéciales (Lunch Deals, Lady Night, Student)
- Filtrage par géolocalisation

**Écran boutiques**: `Shops.js`
- Liste de toutes les boutiques
- Filtrage par type de commerce
- Recherche par localisation

**Écran boutique**: `Shop.js`
- Détails d'une boutique
- Services disponibles
- Avis clients
- Chat avec la boutique
- Récompenses disponibles

**Types de commerces supportés**:
- Bars, Barbiers, Coffee shop
- E-cigarette shop, Fleuristes
- Instituts de beauté
- Restauration rapide, Restaurants
- Boulangers, CBD Shop
- Salons de coiffure

### 3.3 Programme de fidélité

**Système de points**:
- Points gagnés par visite (scan NFC/QR)
- Points bonus pour VIP
- Points pour avis Google/Instagram
- Points pour parrainage

**Statuts clients**:
- **Nouveau**: Nouveau client
- **Standard**: Client régulier
- **VIP**: Client VIP (après X visites)

**Récompenses** (`Rewards.js`):
- Liste des récompenses disponibles par boutique
- Utilisation de points pour débloquer des récompenses
- Cadeaux d'anniversaire
- Cadeaux "Come Back" (retour après absence)

**Collections Firestore**:
- `Clients/{userId}/RegisteredShops/{shopId}`: Inscription boutique
- `Clients/{userId}/RewardsHistory/`: Historique récompenses
- `Clients/{userId}/Gifts/`: Cadeaux reçus
- `Rewards/{rewardId}`: Récompenses disponibles

### 3.4 Campagnes marketing

**Types de campagnes**:
- **Campagnes classiques**: Offres promotionnelles
- **Lunch Deals**: Offres déjeuner
- **Lady Night**: Soirées spéciales
- **Student**: Offres étudiants

**Écrans**:
- `CampaignsList.js`: Liste des campagnes
- `Campaign.js`: Détails d'une campagne
- `OffersList.js`: Liste des offres

**Collections Firestore**:
- `CampaignsShops/{campaignId}`: Campagnes
- `Pubs/{pubId}`: Publicités

### 3.5 Scan NFC et QR Code

**Fonctionnalités**:
- Scan de tags NFC pour enregistrer une visite
- Scan de QR codes de fidélité
- Scan de QR codes de coupons
- Limite de scan (anti-fraude)

**Composants**:
- `NFCRead.js`: Lecture NFC
- `ClientQrCode.js`: QR code client
- `TicketsQrCode.js`: QR code tickets/coupons

**Logique**:
- Vérification de validité du tag
- Calcul des points selon statut client
- Protection contre scans multiples (délai minimum)

### 3.6 Chat avec les boutiques

**Fonctionnalités**:
- Chat en temps réel avec les boutiques
- Notifications push pour nouveaux messages
- Statut de lecture des messages
- Historique des conversations

**Composants**:
- `Chat.js`: Interface de chat
- `ChatRoom.js`: Liste des conversations
- `NotifsChatRooms.js`: Notifications de chat

**Collections Firestore**:
- `Shops/{shopId}/ChatRoom/{chatRoomId}`: Conversations

### 3.7 Notifications

**Types de notifications**:
- Notifications push (Firebase Messaging)
- Notifications in-app
- Notifications de chat
- Notifications de campagnes

**Écran**: `Notifications.js`

**Collections Firestore**:
- `Clients/{userId}/Notifications/`: Notifications utilisateur

### 3.8 Profil utilisateur

**Écran**: `Account.js` et sous-écrans

**Fonctionnalités**:
- Modification des informations personnelles (`SetPersonnalInfos.js`)
- Changement de mot de passe (`SetPassword.js`)
- Historique des récompenses (`History.js`)
- Code partenaire (`PartnerCode.js`)
- Paramètres
- FAQ, Termes et conditions, Politique de confidentialité
- Suppression de compte

**Données utilisateur**:
- Prénom, Nom
- Email, Téléphone
- Date de naissance
- Genre
- Code postal
- Photo de profil
- Géolocalisation
- Langue préférée

---

## 4. Architecture des données Firestore

### 4.1 Collections principales

#### `Clients/{userId}`
Profil utilisateur principal
- `userId`, `email`, `device`
- `firstName`, `lastName`, `phone`
- `birthday`, `gender`
- `postalCode`, `geolocation`
- `user_lang`
- `creatAt`

#### `Clients/{userId}/RegisteredShops/{shopId}`
Inscription à une boutique
- `shopId`, `shopName`
- `points`: Points de fidélité
- `nbVisit`: Nombre de visites
- `lastVisit`: Dernière visite
- `clientNum`: Numéro client
- `googleReview`, `instaFollow`: Actions sociales
- `status`: Statut client (New, Standard, VIP)

#### `Clients/{userId}/RewardsHistory/{historyId}`
Historique d'utilisation de récompenses
- `reward`: Données de la récompense
- `shopId`, `shopName`
- `previousClientPoint`, `totalPoints`
- `creatAt`

#### `Clients/{userId}/Gifts/{giftId}`
Cadeaux reçus
- `shopId`, `shopName`
- `giftType`: Type de cadeau
- `isUsed`: Utilisé ou non
- `creatAt`

#### `Shops/{shopId}`
Informations boutique
- `shopName`, `userId`
- `address`, `coordinate`
- `shopType`, `shopValid`
- `clientRule_*`: Règles de fidélité
- `autoRule_*`: Règles automatiques (avis, etc.)
- `tokensFCM`: Tokens notifications

#### `Rewards/{rewardId}`
Récompenses disponibles
- `shopId`
- `points`: Coût en points
- `giftType`: Type de récompense
- `isActive`: Active ou non

#### `CampaignsShops/{campaignId}`
Campagnes marketing
- `campaign_Shop_Valid`
- `country_short`
- `isFinish`
- `campaignType`
- Dates de validité

#### `Pubs/{pubId}`
Publicités
- `country_short`
- `id`: Ordre d'affichage

### 4.2 Règles de fidélité

**Règles standard**:
- `clientRule_StandardClients_Points`: Points par visite (clients standard)
- `clientRule_Vip_Visit`: Nombre de visites pour devenir VIP
- `clientRule_Vip_Points`: Points par visite (clients VIP)
- `clientRule_Vip_IsActive`: Activation du statut VIP

**Règles automatiques**:
- `autoRule_googleReview_Points`: Points pour avis Google
- `autoRule_instaFollow_Points`: Points pour follow Instagram

---

## 5. Système de navigation

### 5.1 Structure de navigation

**Navigation principale**:
- **Bottom Tabs** (utilisateur connecté):
  - `Home`: Accueil
  - `Offers`: Offres
  - `Rewards`: Récompenses
  - `Account`: Compte

- **Stack Login** (utilisateur non connecté):
  - `LogHome`: Page d'accueil login
  - `SignIn`: Connexion
  - `SignUp`: Inscription
  - `PassLost`: Mot de passe oublié

- **Stack Home**:
  - `Home`, `CampaignsList`, `Campaign`
  - `Shops`, `Shop`, `ShopReview`
  - `Chat`, `ChatRoom`, `NotifsChatRooms`
  - `Notifications`, `ClientQrCode`
  - `SetPersonnalInfos`, `GeolocationView`

### 5.2 Gestion d'état

**Contextes React**:
- `AuthContext`: État d'authentification
- `UserContext`: Données utilisateur connecté
- `NoUserContext`: Données utilisateur non connecté
- `LoadingContext`: État de chargement global

**Synchronisation Firestore**:
- Utilisation de `onSnapshot` pour écouter les changements en temps réel
- Mise à jour automatique des données utilisateur, boutiques, récompenses

---

## 6. Fonctionnalités avancées

### 6.1 Géolocalisation

- Demande de permission de localisation
- Calcul de distance entre utilisateur et boutiques
- Filtrage des offres par localisation
- Géocodage d'adresses

### 6.2 Internationalisation

**Langues supportées**:
- Français (FR)
- Anglais (EN)
- Thaïlandais (TH)

**Système de traduction**:
- Fichiers JSON par langue (`Traductor/fr.json`, `en.json`, `th.json`)
- Fonction `traductor()` pour récupérer les traductions
- Détection automatique de la langue du système

### 6.3 Notifications push

- Configuration Firebase Cloud Messaging
- Souscription aux topics par langue
- Notifications de chat
- Notifications de campagnes
- Notifications de récompenses

### 6.4 Analytics

- **Firebase Analytics**: Suivi des événements
- **Microsoft Clarity**: Tracking utilisateur (Android uniquement)
- Tracking des écrans visités

---

## 7. Points d'attention et bonnes pratiques

### 7.1 Gestion Firestore

⚠️ **RÈGLES STRICTES** (selon les mémoires):
- **INTERDICTION TOTALE de suppression**: Jamais de `delete()`
- **Confirmation obligatoire** avant toute écriture
- **Vérifier l'existence** avant création
- **Proposer le code AVANT exécution**

### 7.2 Permissions

- Gestion des permissions caméra (QR code)
- Gestion des permissions localisation
- Gestion des permissions NFC
- Gestion des permissions bibliothèque (images)

### 7.3 Performance

- Pagination des listes (FlatList)
- Lazy loading des images
- Mise en cache des données boutiques
- Optimisation des requêtes Firestore (limites, index)

### 7.4 Sécurité

- Authentification Firebase sécurisée
- Validation des données côté client
- Protection contre scans multiples (délai minimum)
- Gestion des erreurs réseau

---

## 8. État actuel du projet

### 8.1 Fonctionnalités implémentées ✅

- Authentification complète (Email, Google, Apple)
- Découverte de boutiques avec géolocalisation
- Programme de fidélité avec points
- Scan NFC et QR Code
- Chat avec boutiques
- Campagnes marketing
- Notifications push
- Gestion de profil
- Internationalisation (FR, EN, TH)

### 8.2 Documentation disponible

- `DOCUMENTATION_FEATURE_BEAUTY.md`: Documentation pour porter la feature Beauty vers React Native (référence web)

### 8.3 Technologies natives

- **iOS**: Configuration Xcode complète
- **Android**: Configuration Gradle complète
- **Firebase**: Configuration pour iOS et Android

---

## 9. Recommandations

### 9.1 Améliorations possibles

1. **TypeScript**: Migration progressive vers TypeScript pour une meilleure maintenabilité
2. **Tests**: Ajout de tests unitaires et d'intégration
3. **Performance**: Optimisation des requêtes Firestore avec index
4. **Accessibilité**: Amélioration de l'accessibilité pour les utilisateurs handicapés
5. **Documentation**: Documentation API plus complète

### 9.2 Évolutions futures

- Feature Beauty (réservation de rendez-vous) - documentation disponible
- Paiement en ligne (Stripe)
- Système de parrainage amélioré
- Gamification avancée

---

## 10. Conclusion

**SeeU Mobile Client** est une application React Native complète et fonctionnelle qui offre un système de fidélité innovant pour les commerces locaux. L'application utilise Firebase comme backend, permettant une synchronisation en temps réel et une scalabilité importante.

L'architecture est bien structurée avec une séparation claire des responsabilités, et le code suit les bonnes pratiques React Native. Le système de fidélité est robuste avec gestion des points, statuts clients, et récompenses.

Le projet est prêt pour la production et peut être étendu avec de nouvelles fonctionnalités comme la réservation de rendez-vous (feature Beauty) qui est déjà documentée.

---

**Fin du rapport**

