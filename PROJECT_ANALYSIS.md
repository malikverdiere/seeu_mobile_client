# Analyse Complète du Projet SeeU Mobile

Ce document détaille l'architecture, les technologies et les concepts fondamentaux de l'application mobile SeeU. Il a pour but de servir de référence pour les développeurs travaillant sur le projet.

## 1. Synthèse Globale

SeeU est une application mobile pour iOS et Android développée avec **React Native** (en mode "Bare", non-Expo) et **TypeScript**. Son backend est entièrement géré par les services de **Firebase**, notamment Firestore, Authentication et Storage.

L'application est structurée autour de trois piliers architecturaux :
1.  **Authentification centralisée** via un `AuthProvider`.
2.  **Navigation complexe** gérée par `React Navigation`.
3.  **Couche de données unifiée** grâce à un `UserProvider` qui distribue les données de Firestore en temps réel à toute l'application via l'API Context de React.

Il n'y a **pas de bibliothèque de gestion d'état externe** (comme Redux ou Zustand). La logique métier et l'état global sont gérés par des `Context Providers` React.

## 2. Architecture et Technologies

- **Framework** : React Native & TypeScript
- **Backend** : Firebase (Auth, Firestore, Storage)
- **Navigation** : `react-navigation`
- **Gestion de l'état** : React Context API
- **Dépendances clés** (extraites de `package.json`):
    - `@react-native-firebase/app`, `auth`, `firestore`, `storage`
    - `@react-navigation/native`, `bottom-tabs`, `stack`
    - `react-native-vector-icons`
    - `moment` pour la gestion des dates

## 3. Piliers de l'Architecture

L'essentiel de la logique de l'application réside dans les dossiers `Components/Login` et `Components/AGTools`.

### a. Authentification (`Components/Login/LoginContext.js`)

- Le composant `AuthProvider` est le cœur de l'authentification. Il est placé à la racine de l'application dans `App.tsx`.
- Il utilise l'écouteur `onAuthStateChanged` de Firebase Auth pour surveiller en temps réel le statut de connexion de l'utilisateur.
- Il expose l'objet `user` et le statut de connexion (`isLoggedIn`) à toute l'application via le `AuthContext`.
- Le composant `LandingView.js` consomme ce contexte pour afficher soit les écrans de connexion/inscription, soit l'application principale.

### b. Navigation (`Components/AGTools/AGNavigator.js`)

Ce fichier définit toute la hiérarchie de navigation de l'application.
- **`StackLogin`**: Une `StackNavigator` qui contient les écrans pour les utilisateurs non connectés (Login, Signup, Forgot Password, etc.).
- **`TabNavigator`**: Une `BottomTabNavigator` qui constitue l'interface principale pour les utilisateurs connectés. Elle contient les différentes sections de l'app (Accueil, Recherche, Compte, etc.).
- **Stacks internes** (ex: `StackHome`, `StackAccount`): Chaque onglet du `TabNavigator` est lui-même une `StackNavigator`, permettant une navigation profonde à l'intérieur de chaque section.

C'est le meilleur fichier à consulter pour avoir une vue d'ensemble de toutes les pages et fonctionnalités de l'application.

### c. Couche de Données (`Components/AGTools/AGContext.js`)

C'est le composant le plus critique de l'application.
- Le `UserProvider` agit comme un service central de récupération de données. Il est encapsulé autour du `TabNavigator`, donc il n'est actif que si l'utilisateur est connecté.
- **Récupération des données** : Dès son montage, il s'abonne en temps réel (avec `onSnapshot`) à de multiples collections Firestore :
    - Profil de l'utilisateur (`users`)
    - Boutiques (`shops`)
    - Services (`services`)
    - Rendez-vous (`appointments`)
    - Discussions (`chats`)
    - Et bien d'autres...
- **Distribution des données** : Toutes ces données sont ensuite stockées dans l'état du `UserProvider` et distribuées à l'ensemble des composants enfants via le `UserContext`. N'importe quel composant de l'application peut donc accéder à ces informations en temps réel avec le hook `useContext(UserContext)`.

## 4. Flux de Données et d'UI (Démarrage de l'app)

1.  **`App.tsx`** : L'application se lance, et le `AuthProvider` est initialisé.
2.  **`LoginContext.js`** : `onAuthStateChanged` vérifie si un utilisateur est déjà connecté.
3.  **`LandingView.js`** :
    - Si l'utilisateur **n'est pas** connecté, il affiche le `StackLogin`.
    - Si l'utilisateur **est** connecté, il affiche le `UserProvider`.
4.  **`AGContext.js`** : Le `UserProvider` récupère toutes les données de l'utilisateur depuis Firestore. Pendant ce temps, un indicateur de chargement global (`LoadingProvider`) est probablement affiché.
5.  **`AGNavigator.js`** : Une fois les données initiales chargées, le `UserProvider` affiche son composant enfant : le `TabNavigator`, qui donne accès à l'application.

## 5. Structure des Dossiers Clés

- `Components/AGTools/` : Contient la logique la plus centrale de l'application (Navigation et Contexte de données). **AG** est probablement un préfixe pour "Application Global".
- `Components/Screens/` : (Présumé) Contient les composants qui représentent des écrans/pages entiers listés dans `AGNavigator.js`.
- `config/` : Configuration de la connexion à Firebase.
- `ios/` & `android/` : Code natif et configuration spécifique à chaque plateforme.
- `*.sh` (scripts) : Ensemble de scripts utilitaires pour gérer les dépendances (notamment CocoaPods avec Ruby), nettoyer le projet et lancer les builds. La présence de nombreux scripts `fix-*` suggère que le projet a des dépendances fragiles qui nécessitent une maintenance manuelle.

## 6. Guide pour les Nouveaux Développeurs

Pour comprendre le projet, suivez ce chemin :
1.  **`App.tsx`**: Point d'entrée.
2.  **`Components/Login/LoginContext.js`**: Comprendre comment l'état de connexion est géré.
3.  **`Components/LandingView.js`**: Comprendre comment l'app bascule entre les vues connectées et non connectées.
4.  **`Components/AGTools/AGNavigator.js`**: Obtenir une carte de toutes les fonctionnalités et de tous les écrans.
5.  **`Components/AGTools/AGContext.js`**: **Le plus important.** Comprendre comment les données sont récupérées de Firestore et rendues disponibles dans toute l'application.

Toute nouvelle fonctionnalité nécessitant des données de Firestore passera très probablement par une modification du `UserProvider` pour ajouter une nouvelle souscription `onSnapshot`.
