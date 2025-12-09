# 📚 Documentation - Gestion des ShopTypes et Requêtes Bookings

## 📋 Table des matières
1. [Gestion des ShopTypes sur les cartes Home Page](#1-gestion-des-shoptypes-sur-les-cartes-home-page)
2. [Requêtes pour afficher les Bookings](#2-requêtes-pour-afficher-les-bookings)

---

## 1. Gestion des ShopTypes sur les cartes Home Page

### 1.1 Structure de données

Les types de shops sont définis dans `src/utils/categories.ts` via la constante `categoriesList`.

**Structure d'un élément de categoriesList :**
```typescript
{
    id: string;              // ID unique du type (ex: "salon-de-coiffure")
    idCollection: string;     // ID de la collection Firestore
    priority: number;         // Ordre d'affichage
    text: string;            // Texte par défaut (FR)
    textEn?: string;         // Texte anglais
    textTh?: string;         // Texte thaïlandais
    type?: number;            // Type de catégorie (1=Beauty, 2=Fitness, etc.)
    typeIcon?: string;       // URL de l'icône
    name?: {
        en?: string;
        th?: string;
        fr?: string;
    };
}
```

### 1.2 Récupération du ShopType depuis un Shop

Dans `HomePage.tsx`, lors de l'affichage des shops :

```typescript
// Ligne 206-207 et 249-250
const type = categoriesList.find(cat => cat.id === shop?.shopType?.id);
const type_lang = lang === "th" ? type?.textTh : lang === "fr" ? type?.text : type?.textEn;
```

**Explication :**
1. **Recherche** : On cherche dans `categoriesList` l'élément dont l'`id` correspond à `shop.shopType.id`
2. **Traduction** : Selon la langue (`lang`), on récupère :
   - `textTh` si `lang === "th"` (thaïlandais)
   - `text` si `lang === "fr"` (français)
   - `textEn` sinon (anglais par défaut)

**Exemple de données Shop :**
```typescript
shop = {
    id: "abc123",
    shopName: "Maison Hair",
    shopType: {
        id: "salon-de-coiffure"  // Correspond à un élément de categoriesList
    },
    // ... autres propriétés
}
```

### 1.3 Affichage dans TrendingCard

Le composant `TrendingCard` reçoit le `type` déjà traduit en prop :

```typescript
// HomePage.tsx - Ligne 220
<TrendingCard
    // ... autres props
    type={type_lang || ""}  // Texte traduit du type
/>
```

**Affichage dans TrendingCard :**
```typescript
// TrendingCard.tsx - Ligne 79-80
<div className="mt-auto pt-4">
    <p className="text-xs lg:text-sm text-gray-500 border border-gray-200 inline-block px-2 py-1 rounded-full">
        {type}
    </p>
</div>
```

Le type est affiché comme un **badge arrondi** en bas de la carte.

### 1.4 Flux complet

```
Shop (Firestore)
    └─ shopType.id = "salon-de-coiffure"
           ↓
categoriesList.find(cat => cat.id === "salon-de-coiffure")
    └─ { id: "salon-de-coiffure", text: "Salon de coiffure", textEn: "Hair salon", ... }
           ↓
Sélection selon lang:
    - lang === "th" → textTh
    - lang === "fr" → text
    - sinon → textEn
           ↓
TrendingCard.type = "Hair salon" (si lang = "en")
           ↓
Affichage: Badge avec texte "Hair salon"
```

### 1.5 Gestion des erreurs

- Si `shop.shopType` est `undefined` → `type` sera `undefined` → `type_lang` sera `undefined`
- Si `type_lang` est `undefined` → Le badge affichera une chaîne vide `""`
- Le badge sera toujours rendu mais vide si le type n'existe pas

---

## 2. Requêtes pour afficher les Bookings

### 2.1 Structure des Bookings dans Firestore

**Collection :** `Shops/{shopId}/Booking`

**Structure d'un Booking :**
```typescript
{
    id: string;              // ID du document
    clientId: string;        // ID de l'utilisateur
    booking_id: string;      // ID du shop (booking_id)
    date: Timestamp;         // Date du rendez-vous
    timeStart: string;       // Heure de début (format "HH:MM")
    timeEnd: string;         // Heure de fin (format "HH:MM")
    statut: number;          // Statut du booking (voir ci-dessous)
    services: string[];      // IDs des services
    // ... autres propriétés
}
```

**Statuts des Bookings :**
- `1` = Confirmé / Actif
- `2` = En attente
- `3` = Annulé
- `4` = Rejeté
- `5` = Terminé
- `6` = Rebooked
- `7` = Autre statut final

### 2.2 Requête pour récupérer tous les Bookings d'un utilisateur

**Fichier :** `src/components/PageProfile/ContentAppointments.tsx`

**Méthode :** Utilisation de `collectionGroup` pour interroger toutes les sous-collections `Booking` de tous les shops.

```typescript
// Lignes 105-108
const bookingsQuery = query(
    collectionGroup(db, 'Booking'),
    where('clientId', '==', user?.uid)
);

const unsubscribe = onSnapshot(bookingsQuery, async (snapshot) => {
    // Traitement des résultats
});
```

**Explication :**
- `collectionGroup(db, 'Booking')` : Interroge toutes les collections `Booking` dans tous les shops
- `where('clientId', '==', user?.uid)` : Filtre uniquement les bookings de l'utilisateur connecté
- `onSnapshot` : Écoute en temps réel les changements

### 2.3 Enrichissement des données (Shop Data)

Pour chaque booking, on récupère les informations du shop :

```typescript
// Lignes 111-126
const appointmentsPromises = snapshot.docs.map(async (doc) => {
    const appointmentData = {
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),  // Conversion Timestamp → Date
    } as Appointment;

    // Récupération des données du shop
    if (appointmentData.booking_id) {
        const shopData = await fetchShopData(appointmentData.booking_id);
        if (shopData) {
            appointmentData.shopData = shopData;
        }
    }

    return appointmentData;
});

const appointmentsData = await Promise.all(appointmentsPromises);
```

**Fonction `fetchShopData` :**
```typescript
// Lignes 46-91
const fetchShopData = async (booking_id: string) => {
    try {
        const shopsRef = collection(db, "Shops");
        const q = query(shopsRef, where("booking_id", "==", booking_id));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            return {
                id: snapshot.docs[0].id,
                ...snapshot.docs[0].data()
            };
        }
        return null;
    } catch (error) {
        console.error("Erreur lors de la récupération du shop:", error);
        return null;
    }
};
```

### 2.4 Tri des Bookings

**Tri initial (par date et heure) :**
```typescript
// Lignes 131-139
const sortedAppointments = appointmentsData.sort((a, b) => {
    // Comparaison par date
    const dateComparison = a.date.getTime() - b.date.getTime();
    if (dateComparison !== 0) return dateComparison;

    // Si même date, comparaison par heure
    const [aHours, aMinutes] = a.timeStart.split(':').map(Number);
    const [bHours, bMinutes] = b.timeStart.split(':').map(Number);
    
    return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes);
});
```

### 2.5 Séparation Upcoming vs Past

**Upcoming (À venir) :**
```typescript
// Lignes 150-164
const upcoming = appointments.filter(app => {
    const appointmentDateTime = new Date(app.date);
    appointmentDateTime.setHours(
        parseInt(app.timeStart.split(':')[0]),
        parseInt(app.timeStart.split(':')[1])
    );
    
    const now = new Date();
    
    // Garder uniquement les rendez-vous futurs qui ne sont pas annulés/rejetés/terminés/rebooked
    return appointmentDateTime >= now && ![3, 4, 5, 6, 7].includes(app.statut);
}).sort((a, b) => {
    // Tri croissant (plus proche en premier)
    const aDateTime = new Date(a.date);
    const bDateTime = new Date(b.date);
    aDateTime.setHours(parseInt(a.timeStart.split(':')[0]), parseInt(a.timeStart.split(':')[1]));
    bDateTime.setHours(parseInt(b.timeStart.split(':')[0]), parseInt(b.timeStart.split(':')[1]));
    return aDateTime.getTime() - bDateTime.getTime();
});
```

**Past (Passés) :**
```typescript
// Lignes 166-180
const past = appointments.filter(app => {
    const appointmentDateTime = new Date(app.date);
    appointmentDateTime.setHours(
        parseInt(app.timeStart.split(':')[0]),
        parseInt(app.timeStart.split(':')[1])
    );
    
    const now = new Date();
    
    // Inclure les rendez-vous passés OU ceux avec statut 3, 4, 5, 6, 7
    return appointmentDateTime < now || [3, 4, 5, 6, 7].includes(app.statut);
}).sort((a, b) => {
    // Tri décroissant (plus récent en premier)
    const aDateTime = new Date(a.date);
    const bDateTime = new Date(b.date);
    aDateTime.setHours(parseInt(a.timeStart.split(':')[0]), parseInt(a.timeStart.split(':')[1]));
    bDateTime.setHours(parseInt(b.timeStart.split(':')[0]), parseInt(b.timeStart.split(':')[1]));
    return bDateTime.getTime() - aDateTime.getTime();
});
```

### 2.6 Logique de séparation

**Upcoming inclut :**
- ✅ Rendez-vous avec `date + timeStart` >= maintenant
- ✅ ET statut `1` (Confirmé) ou `2` (En attente)

**Past inclut :**
- ✅ Rendez-vous avec `date + timeStart` < maintenant
- ✅ OU statut `3, 4, 5, 6, 7` (Annulé, Rejeté, Terminé, Rebooked, etc.)

### 2.7 Requête pour un Shop spécifique (BookingContext)

**Fichier :** `src/contexts/BookingContext.tsx`

Pour un shop spécifique, on utilise une collection normale (pas collectionGroup) :

```typescript
// Lignes 72-85
const setupBookingsListener = async (shopId: string) => {
    const bookingsRef = collection(db, "Shops", shopId, "Booking");
    const q = query(bookingsRef, where("statut", "in", [1, 2]));  // Seulement actifs

    unsubscribeBookings = onSnapshot(q, (snapshot) => {
        const bookingsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Booking[];
        setBookings(bookingsData);
        setLoadingBookings(false);
    });
};
```

**Différences :**
- `collectionGroup` : Tous les shops (pour profil utilisateur)
- `collection` : Un shop spécifique (pour page shop)

### 2.8 Index Firestore requis

Pour que `collectionGroup` fonctionne avec `where('clientId', '==', ...)`, un index composite est nécessaire.

**Fichier :** `firestore.indexes.json`

```json
{
    "collectionGroup": "Booking",
    "queryScope": "COLLECTION_GROUP",
    "fields": [
        { "fieldPath": "clientId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "ASCENDING" }
    ]
}
```

---

## 3. Résumé des points clés

### ShopTypes
- ✅ Utiliser `categoriesList.find(cat => cat.id === shop?.shopType?.id)`
- ✅ Sélectionner la traduction selon `lang` (th/fr/en)
- ✅ Passer `type_lang` à `TrendingCard`
- ✅ Gérer les cas où `shopType` est `undefined`

### Bookings
- ✅ Utiliser `collectionGroup` pour tous les shops d'un utilisateur
- ✅ Utiliser `collection` pour un shop spécifique
- ✅ Filtrer par `clientId` pour les bookings utilisateur
- ✅ Filtrer par `statut in [1, 2]` pour les bookings actifs
- ✅ Séparer upcoming/past selon date+heure ET statut
- ✅ Enrichir avec `shopData` via `fetchShopData`
- ✅ Trier upcoming (croissant) et past (décroissant)

---

## 4. Exemples d'utilisation

### Exemple 1 : Afficher le type d'un shop
```typescript
const shop = { shopType: { id: "salon-de-coiffure" } };
const lang = "en";

const type = categoriesList.find(cat => cat.id === shop?.shopType?.id);
const type_lang = lang === "th" ? type?.textTh : lang === "fr" ? type?.text : type?.textEn;

console.log(type_lang); // "Hair salon"
```

### Exemple 2 : Récupérer les bookings upcoming
```typescript
const bookingsQuery = query(
    collectionGroup(db, 'Booking'),
    where('clientId', '==', user.uid)
);

const snapshot = await getDocs(bookingsQuery);
const now = new Date();

const upcoming = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data(), date: doc.data().date.toDate() }))
    .filter(booking => {
        const bookingDate = new Date(booking.date);
        bookingDate.setHours(...booking.timeStart.split(':').map(Number));
        return bookingDate >= now && [1, 2].includes(booking.statut);
    });
```

---

**Dernière mise à jour :** 2025-01-21

