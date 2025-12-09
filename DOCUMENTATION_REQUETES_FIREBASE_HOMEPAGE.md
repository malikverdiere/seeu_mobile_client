# 📚 Documentation - Requêtes Firebase pour la Home Page

## 📋 Table des matières
1. [Vue d'ensemble](#1-vue-densemble)
2. [Requête 1 : Recent Shops (Shops récemment vus)](#2-requête-1--recent-shops-shops-récemment-vus)
3. [Requête 2 : Highlight Shops (Shops mis en avant)](#3-requête-2--highlight-shops-shops-mis-en-avant)
4. [Requête 3 : Search Banners (Bannières)](#4-requête-3--search-banners-bannières)
5. [Index Firestore nécessaires](#5-index-firestore-nécessaires)
6. [Code complet d'implémentation](#6-code-complet-dimplémentation)

---

## 1. Vue d'ensemble

La home page effectue **3 requêtes principales** vers Firestore :

1. **Recent Shops** : Récupère les shops récemment visités par l'utilisateur
2. **Highlight Shops** : Récupère les shops mis en avant (highlight + promotions)
3. **Search Banners** : Récupère les bannières promotionnelles

**Collections utilisées :**
- `Shops` : Collection principale des shops
- `SearchBanners` : Collection des bannières

---

## 2. Requête 1 : Recent Shops (Shops récemment vus)

### 2.1 Description

Récupère les shops correspondant aux `booking_id` stockés dans l'historique de l'utilisateur.

### 2.2 Code de la requête

```typescript
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firebase_db as db } from '../../../config/firebase';

const fetchRecentShops = async (recentlyViewed: string[]) => {
    if (recentlyViewed.length === 0) {
        return [];
    }

    try {
        const shopsRef = collection(db, "Shops");
        
        // Créer une requête pour chaque booking_id
        const promises = recentlyViewed.map(async (booking_id) => {
            const q = query(
                shopsRef, 
                where("booking_id", "==", booking_id)
            );
            const snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
                return {
                    id: snapshot.docs[0].id,
                    ...snapshot.docs[0].data()
                };
            }
            return null;
        });

        // Exécuter toutes les requêtes en parallèle
        const shops = (await Promise.all(promises))
            .filter(shop => shop !== null);
        
        return shops;
    } catch (error) {
        console.error("Error fetching recent shops:", error);
        return [];
    }
};
```

### 2.3 Détails de la requête

**Collection :** `Shops`

**Filtre :**
- `where("booking_id", "==", booking_id)`

**Paramètres :**
- `recentlyViewed` : Tableau de `booking_id` (strings)

**Retour :**
- Tableau d'objets Shop avec `id` et toutes les données du document

### 2.4 Index Firestore

**Aucun index composite nécessaire** car la requête utilise uniquement un filtre d'égalité sur un champ simple.

Firestore crée automatiquement un index simple pour `booking_id`.

---

## 3. Requête 2 : Highlight Shops (Shops mis en avant)

### 3.1 Description

Récupère les shops mis en avant via deux requêtes parallèles :
1. Shops avec `highlight.isActive == true`
2. Shops avec `promotion.doubleDay == true`

Les résultats sont fusionnés sans doublons.

### 3.2 Code de la requête

```typescript
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firebase_db as db } from '../../../config/firebase';

const fetchHighlightShops = async () => {
    try {
        const shopsRef = collection(db, "Shops");
        
        // Requête 1 : Shops avec highlight actif
        const q1 = query(
            shopsRef,
            where("highlight.isActive", "==", true)
        );
        
        // Requête 2 : Shops avec promotion doubleDay
        const q2 = query(
            shopsRef,
            where("promotion.doubleDay", "==", true)
        );

        // Exécuter les deux requêtes en parallèle
        const [snap1, snap2] = await Promise.all([
            getDocs(q1),
            getDocs(q2)
        ]);

        // Fusionner les résultats sans doublons (par document ID)
        const map = new Map();
        [...snap1.docs, ...snap2.docs].forEach(d => {
            map.set(d.id, d);
        });
        
        // Convertir en tableau d'objets
        const shops = Array.from(map.values()).map(d => ({
            id: d.id,
            ...d.data()
        }));

        return shops;
    } catch (error) {
        console.error("Error fetching highlight shops:", error);
        return [];
    }
};
```

### 3.3 Détails des requêtes

**Collection :** `Shops`

**Requête 1 :**
- `where("highlight.isActive", "==", true)`

**Requête 2 :**
- `where("promotion.doubleDay", "==", true)`

**Optimisation :**
- Les deux requêtes sont exécutées en parallèle avec `Promise.all()`
- Déduplication par `Map` utilisant le document ID comme clé

### 3.4 Index Firestore

**Aucun index composite nécessaire** car chaque requête utilise uniquement un filtre d'égalité sur un champ simple.

Firestore crée automatiquement des index simples pour :
- `highlight.isActive`
- `promotion.doubleDay`

---

## 4. Requête 3 : Search Banners (Bannières)

### 4.1 Description

Récupère les bannières actives pour une catégorie donnée, triées par priorité.

### 4.2 Code de la requête

```typescript
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { firebase_db as db } from '../../../config/firebase';

interface SearchBannerProps {
    id: string;
    category: string;
    isActive: boolean;
    priority: number;
    shopId: string | null;
    countClick: number;
    banner: {
        [lang: string]: {
            url: {
                desktop: string;
                mobile: string;
                redirect: string;
            };
        };
    };
}

const getSearchBanners = async (category: string): Promise<SearchBannerProps[]> => {
    try {
        const searchBannersRef = collection(db, 'SearchBanners');
        
        const constraints = [
            where('category', '==', category),
            where('isActive', '==', true),
            orderBy('priority', 'asc'),
        ];
        
        const querySnapshot = await getDocs(
            query(searchBannersRef, ...constraints)
        );
        
        return querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        } as SearchBannerProps));
    } catch (error) {
        console.error("Error fetching banners:", error);
        return [];
    }
};
```

### 4.3 Détails de la requête

**Collection :** `SearchBanners`

**Filtres :**
- `where('category', '==', category)` : Filtre par catégorie (ex: "beauty")
- `where('isActive', '==', true)` : Seulement les bannières actives

**Tri :**
- `orderBy('priority', 'asc')` : Tri par priorité croissante

**Paramètres :**
- `category` : String (ex: "beauty", "fitness", etc.)

**Retour :**
- Tableau de `SearchBannerProps` trié par priorité

### 4.4 Structure des données

**Document SearchBanners :**
```typescript
{
    id: string;                    // ID du document
    category: string;              // "beauty", "fitness", etc.
    isActive: boolean;             // Statut actif/inactif
    priority: number;              // Ordre d'affichage (1, 2, 3...)
    shopId: string | null;         // ID du shop associé (optionnel)
    countClick: number;            // Nombre de clics
    banner: {
        "en": {                    // Langue
            url: {
                desktop: string;   // URL image desktop
                mobile: string;    // URL image mobile
                redirect: string;  // URL de redirection
            };
        };
        "th": { /* ... */ };
        "fr": { /* ... */ };
    };
}
```

### 4.5 Index Firestore

**Index composite REQUIS** car la requête combine :
- 2 filtres `where` (category + isActive)
- 1 tri `orderBy` (priority)

**Index à créer dans Firestore :**

```json
{
  "collectionGroup": "SearchBanners",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "category",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "isActive",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "priority",
      "order": "ASCENDING"
    }
  ]
}
```

**Comment créer l'index :**

1. **Via Firebase Console :**
   - Aller dans Firestore → Indexes
   - Cliquer sur "Create Index"
   - Collection ID : `SearchBanners`
   - Query scope : `Collection`
   - Fields :
     - `category` : Ascending
     - `isActive` : Ascending
     - `priority` : Ascending

2. **Via firestore.indexes.json :**
   ```json
   {
     "indexes": [
       {
         "collectionGroup": "SearchBanners",
         "queryScope": "COLLECTION",
         "fields": [
           { "fieldPath": "category", "order": "ASCENDING" },
           { "fieldPath": "isActive", "order": "ASCENDING" },
           { "fieldPath": "priority", "order": "ASCENDING" }
         ]
       }
     ]
   }
   ```
   Puis déployer avec : `firebase deploy --only firestore:indexes`

---

## 5. Index Firestore nécessaires

### 5.1 Résumé des index

| Requête | Index nécessaire | Type |
|---------|------------------|------|
| Recent Shops | ❌ Aucun | Index simple automatique |
| Highlight Shops | ❌ Aucun | Index simple automatique |
| Search Banners | ✅ **OUI** | Index composite |

### 5.2 Index SearchBanners (OBLIGATOIRE)

**Configuration complète :**

```json
{
  "indexes": [
    {
      "collectionGroup": "SearchBanners",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "category",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "isActive",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "priority",
          "order": "ASCENDING"
        }
      ]
    }
  ]
}
```

**Erreur si index manquant :**
```
The query requires an index. You can create it here: 
https://console.firebase.google.com/...
```

---

## 6. Code complet d'implémentation

### 6.1 Implémentation React/Next.js

```typescript
'use client';
import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { firebase_db as db } from '../../../config/firebase';

interface Shop {
    id: string;
    booking_id: string;
    shopName: string;
    // ... autres propriétés
}

interface SearchBanner {
    id: string;
    category: string;
    isActive: boolean;
    priority: number;
    banner: {
        [lang: string]: {
            url: {
                desktop: string;
                mobile: string;
                redirect: string;
            };
        };
    };
}

export default function HomePage() {
    const [recentShops, setRecentShops] = useState<Shop[]>([]);
    const [highlightShops, setHighlightShops] = useState<Shop[]>([]);
    const [banners, setBanners] = useState<SearchBanner[]>([]);
    const [loadingRecent, setLoadingRecent] = useState(true);
    const [loadingHighlight, setLoadingHighlight] = useState(true);
    const [loadingBanners, setLoadingBanners] = useState(true);

    // Hook pour récupérer les booking_id récemment vus
    // (à adapter selon votre implémentation)
    const recentlyViewed = useRecentlyViewed(); // ['booking_id_1', 'booking_id_2', ...]
    const category = 'beauty'; // ou depuis les params

    // 1. Fetch Recent Shops
    const fetchRecentShops = useCallback(async () => {
        if (recentlyViewed.length === 0) {
            setLoadingRecent(false);
            return;
        }

        try {
            const shopsRef = collection(db, "Shops");
            const promises = recentlyViewed.map(async (booking_id: string) => {
                const q = query(shopsRef, where("booking_id", "==", booking_id));
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    return {
                        id: snapshot.docs[0].id,
                        ...snapshot.docs[0].data()
                    } as Shop;
                }
                return null;
            });

            const shops = (await Promise.all(promises))
                .filter((shop): shop is Shop => shop !== null);
            setRecentShops(shops);
        } catch (error) {
            console.error("Error fetching recent shops:", error);
        } finally {
            setLoadingRecent(false);
        }
    }, [recentlyViewed]);

    // 2. Fetch Highlight Shops
    const fetchHighlightShops = useCallback(async () => {
        try {
            const shopsRef = collection(db, "Shops");
            
            const q1 = query(
                shopsRef,
                where("highlight.isActive", "==", true)
            );
            const q2 = query(
                shopsRef,
                where("promotion.doubleDay", "==", true)
            );

            const [snap1, snap2] = await Promise.all([
                getDocs(q1),
                getDocs(q2)
            ]);

            const map = new Map();
            [...snap1.docs, ...snap2.docs].forEach(d => map.set(d.id, d));
            const shops = Array.from(map.values()).map(d => ({
                id: d.id,
                ...d.data()
            })) as Shop[];

            setHighlightShops(shops);
        } catch (error) {
            console.error("Error fetching highlight shops:", error);
        } finally {
            setLoadingHighlight(false);
        }
    }, []);

    // 3. Fetch Banners
    const fetchBanners = useCallback(async () => {
        try {
            const searchBannersRef = collection(db, 'SearchBanners');
            const constraints = [
                where('category', '==', category),
                where('isActive', '==', true),
                orderBy('priority', 'asc'),
            ];
            const querySnapshot = await getDocs(
                query(searchBannersRef, ...constraints)
            );
            const bannersData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            })) as SearchBanner[];
            setBanners(bannersData);
        } catch (error) {
            console.error("Error fetching banners:", error);
        } finally {
            setLoadingBanners(false);
        }
    }, [category]);

    // Appels au montage
    useEffect(() => {
        fetchRecentShops();
    }, [fetchRecentShops]);

    useEffect(() => {
        fetchHighlightShops();
    }, [fetchHighlightShops]);

    useEffect(() => {
        fetchBanners();
    }, [fetchBanners]);

    // Utilisation des données...
    return (
        <div>
            {/* Afficher recentShops, highlightShops, banners */}
        </div>
    );
}
```

### 6.2 Implémentation React Native / Flutter

**React Native (avec @react-native-firebase/firestore) :**

```typescript
import firestore from '@react-native-firebase/firestore';

// 1. Recent Shops
const fetchRecentShops = async (recentlyViewed: string[]) => {
    if (recentlyViewed.length === 0) return [];
    
    const shopsRef = firestore().collection('Shops');
    const promises = recentlyViewed.map(async (booking_id) => {
        const snapshot = await shopsRef
            .where('booking_id', '==', booking_id)
            .get();
        
        if (!snapshot.empty) {
            return {
                id: snapshot.docs[0].id,
                ...snapshot.docs[0].data()
            };
        }
        return null;
    });
    
    return (await Promise.all(promises)).filter(shop => shop !== null);
};

// 2. Highlight Shops
const fetchHighlightShops = async () => {
    const shopsRef = firestore().collection('Shops');
    
    const [snap1, snap2] = await Promise.all([
        shopsRef.where('highlight.isActive', '==', true).get(),
        shopsRef.where('promotion.doubleDay', '==', true).get()
    ]);
    
    const map = new Map();
    [...snap1.docs, ...snap2.docs].forEach(d => map.set(d.id, d));
    
    return Array.from(map.values()).map(d => ({
        id: d.id,
        ...d.data()
    }));
};

// 3. Banners
const fetchBanners = async (category: string) => {
    const snapshot = await firestore()
        .collection('SearchBanners')
        .where('category', '==', category)
        .where('isActive', '==', true)
        .orderBy('priority', 'asc')
        .get();
    
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};
```

**Flutter (avec cloud_firestore) :**

```dart
import 'package:cloud_firestore/cloud_firestore.dart';

// 1. Recent Shops
Future<List<Map<String, dynamic>>> fetchRecentShops(List<String> recentlyViewed) async {
  if (recentlyViewed.isEmpty) return [];
  
  final shopsRef = FirebaseFirestore.instance.collection('Shops');
  final futures = recentlyViewed.map((bookingId) async {
    final snapshot = await shopsRef
        .where('booking_id', isEqualTo: bookingId)
        .get();
    
    if (snapshot.docs.isNotEmpty) {
      return {
        'id': snapshot.docs[0].id,
        ...snapshot.docs[0].data(),
      };
    }
    return null;
  });
  
  final results = await Future.wait(futures);
  return results.whereType<Map<String, dynamic>>().toList();
}

// 2. Highlight Shops
Future<List<Map<String, dynamic>>> fetchHighlightShops() async {
  final shopsRef = FirebaseFirestore.instance.collection('Shops');
  
  final snap1 = await shopsRef
      .where('highlight.isActive', isEqualTo: true)
      .get();
  final snap2 = await shopsRef
      .where('promotion.doubleDay', isEqualTo: true)
      .get();
  
  final map = <String, QueryDocumentSnapshot>{};
  [...snap1.docs, ...snap2.docs].forEach((doc) {
    map[doc.id] = doc;
  });
  
  return map.values.map((doc) => {
    return {
      'id': doc.id,
      ...doc.data(),
    };
  }).toList();
}

// 3. Banners
Future<List<Map<String, dynamic>>> fetchBanners(String category) async {
  final snapshot = await FirebaseFirestore.instance
      .collection('SearchBanners')
      .where('category', isEqualTo: category)
      .where('isActive', isEqualTo: true)
      .orderBy('priority')
      .get();
  
  return snapshot.docs.map((doc) => {
    return {
      'id': doc.id,
      ...doc.data(),
    };
  }).toList();
}
```

---

## 7. Checklist de déploiement

### 7.1 Avant de déployer

- [ ] Vérifier que la collection `Shops` existe
- [ ] Vérifier que la collection `SearchBanners` existe
- [ ] Vérifier que les champs suivants existent dans les documents :
  - `Shops.booking_id`
  - `Shops.highlight.isActive`
  - `Shops.promotion.doubleDay`
  - `SearchBanners.category`
  - `SearchBanners.isActive`
  - `SearchBanners.priority`

### 7.2 Création des index

- [ ] Créer l'index composite pour `SearchBanners` (voir section 4.5)
- [ ] Vérifier que l'index est actif dans Firebase Console
- [ ] Tester les requêtes en développement

### 7.3 Tests

- [ ] Tester `fetchRecentShops` avec un tableau vide
- [ ] Tester `fetchRecentShops` avec des booking_id valides
- [ ] Tester `fetchHighlightShops` (doit retourner des shops)
- [ ] Tester `fetchBanners` avec différentes catégories
- [ ] Vérifier la gestion des erreurs

---

## 8. Résumé

### Requêtes

1. **Recent Shops** : `where("booking_id", "==", booking_id)` - Pas d'index nécessaire
2. **Highlight Shops** : 2 requêtes parallèles - Pas d'index nécessaire
3. **Search Banners** : `where + where + orderBy` - **Index composite REQUIS**

### Index à créer

**Un seul index composite nécessaire :**

```json
{
  "collectionGroup": "SearchBanners",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "category", "order": "ASCENDING" },
    { "fieldPath": "isActive", "order": "ASCENDING" },
    { "fieldPath": "priority", "order": "ASCENDING" }
  ]
}
```

---

**Dernière mise à jour :** 2025-01-21

