# 📚 Documentation - Requête Upcoming Appointments (Page Profile)

## 📋 Table des matières
1. [Vue d'ensemble](#1-vue-densemble)
2. [Requête principale (collectionGroup)](#2-requête-principale-collectiongroup)
3. [Filtrage Upcoming vs Past](#3-filtrage-upcoming-vs-past)
4. [Enrichissement des données (Shop Data)](#4-enrichissement-des-données-shop-data)
5. [Index Firestore nécessaires](#5-index-firestore-nécessaires)
6. [Code complet d'implémentation](#6-code-complet-dimplémentation)

---

## 1. Vue d'ensemble

La page Profile récupère **tous les bookings** d'un utilisateur via `collectionGroup`, puis filtre côté client pour séparer les rendez-vous **upcoming** (à venir) et **past** (passés).

**Flux :**
```
1. Requête collectionGroup → Tous les bookings de l'utilisateur
2. Enrichissement → Ajout des données Shop pour chaque booking
3. Tri → Par date et heure
4. Filtrage → Séparation upcoming / past
5. Affichage → Deux listes distinctes
```

---

## 2. Requête principale (collectionGroup)

### 2.1 Code de la requête

**Fichier :** `src/components/PageProfile/ContentAppointments.tsx`

```typescript
import { collectionGroup, query, where, onSnapshot } from 'firebase/firestore';
import { firebase_db as db } from '../../../config/firebase';

useEffect(() => {
    if (!user?.uid) return;

    // Requête collectionGroup pour récupérer tous les bookings de l'utilisateur
    const bookingsQuery = query(
        collectionGroup(db, 'Booking'),
        where('clientId', '==', user?.uid)
    );

    // Écoute en temps réel des changements
    const unsubscribe = onSnapshot(bookingsQuery, async (snapshot) => {
        // Traitement des résultats...
    });

    return () => unsubscribe();
}, [user?.uid]);
```

### 2.2 Détails de la requête

**Collection :** `Booking` (via `collectionGroup`)

**Structure Firestore :**
```
Shops/
  {shopId}/
    Booking/
      {bookingId}/
        - clientId: string
        - date: Timestamp
        - timeStart: string
        - timeEnd: string
        - statut: number
        - booking_id: string
        - ...
```

**Filtre :**
- `where('clientId', '==', user?.uid)` : Seulement les bookings de l'utilisateur connecté

**Méthode :**
- `collectionGroup` : Interroge toutes les sous-collections `Booking` de tous les shops
- `onSnapshot` : Écoute en temps réel (mise à jour automatique)

### 2.3 Traitement des résultats

```typescript
const unsubscribe = onSnapshot(bookingsQuery, async (snapshot) => {
    // 1. Mapper chaque document en Appointment
    const appointmentsPromises = snapshot.docs.map(async (doc) => {
        const appointmentData = {
            id: doc.id,
            ...doc.data(),
            date: doc.data().date.toDate(), // Conversion Timestamp → Date
        } as Appointment;

        // 2. Enrichir avec les données du shop
        if (appointmentData.booking_id) {
            const shopData = await fetchShopData(appointmentData.booking_id);
            if (shopData) {
                appointmentData.shopData = shopData;
            }
        }

        return appointmentData;
    });

    // 3. Attendre toutes les promesses
    const appointmentsData = await Promise.all(appointmentsPromises);

    // 4. Trier par date et heure
    const sortedAppointments = appointmentsData.sort((a, b) => {
        // Comparaison par date
        const dateComparison = a.date.getTime() - b.date.getTime();
        if (dateComparison !== 0) return dateComparison;

        // Si même date, comparaison par heure
        const [aHours, aMinutes] = a.timeStart.split(':').map(Number);
        const [bHours, bMinutes] = b.timeStart.split(':').map(Number);
        
        return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes);
    });

    setAppointments(sortedAppointments);
});
```

---

## 3. Filtrage Upcoming vs Past

### 3.1 Logique de filtrage

**Fichier :** `ContentAppointments.tsx` (lignes 147-189)

```typescript
useEffect(() => {
    const now = new Date();

    // ===== UPCOMING =====
    const upcoming = appointments.filter(app => {
        // Créer une date complète (date + heure)
        const appointmentDateTime = new Date(app.date);
        appointmentDateTime.setHours(
            parseInt(app.timeStart.split(':')[0]),
            parseInt(app.timeStart.split(':')[1])
        );
        
        // Garder uniquement :
        // - Rendez-vous futurs (date + heure >= maintenant)
        // - ET statut actif (1 = Confirmé, 2 = En attente)
        return appointmentDateTime >= now && ![3, 4, 5, 6, 7].includes(app.statut);
    }).sort((a, b) => {
        // Tri croissant (plus proche en premier)
        const aDateTime = new Date(a.date);
        const bDateTime = new Date(b.date);
        aDateTime.setHours(
            parseInt(a.timeStart.split(':')[0]),
            parseInt(a.timeStart.split(':')[1])
        );
        bDateTime.setHours(
            parseInt(b.timeStart.split(':')[0]),
            parseInt(b.timeStart.split(':')[1])
        );
        return aDateTime.getTime() - bDateTime.getTime();
    });

    // ===== PAST =====
    const past = appointments.filter(app => {
        // Créer une date complète (date + heure)
        const appointmentDateTime = new Date(app.date);
        appointmentDateTime.setHours(
            parseInt(app.timeStart.split(':')[0]),
            parseInt(app.timeStart.split(':')[1])
        );
        
        // Inclure :
        // - Rendez-vous passés (date + heure < maintenant)
        // - OU statut final (3, 4, 5, 6, 7)
        return appointmentDateTime < now || [3, 4, 5, 6, 7].includes(app.statut);
    }).sort((a, b) => {
        // Tri décroissant (plus récent en premier)
        const aDateTime = new Date(a.date);
        const bDateTime = new Date(b.date);
        aDateTime.setHours(
            parseInt(a.timeStart.split(':')[0]),
            parseInt(a.timeStart.split(':')[1])
        );
        bDateTime.setHours(
            parseInt(b.timeStart.split(':')[0]),
            parseInt(b.timeStart.split(':')[1])
        );
        return bDateTime.getTime() - aDateTime.getTime();
    });

    setUpcomingAppointments(upcoming);
    setPastAppointments(past);

    // Sélectionner automatiquement le premier upcoming si aucun n'est sélectionné
    if (upcoming.length > 0 && !selectedAppointment) {
        setSelectedAppointment(upcoming[0]);
    }
}, [appointments]);
```

### 3.2 Statuts des Bookings

| Statut | Valeur | Description | Inclus dans |
|--------|--------|-------------|-------------|
| Confirmé | `1` | Rendez-vous confirmé | ✅ Upcoming |
| En attente | `2` | En attente de confirmation | ✅ Upcoming |
| Annulé | `3` | Annulé | ❌ Past |
| Rejeté | `4` | Rejeté par le shop | ❌ Past |
| Terminé | `5` | Rendez-vous terminé | ❌ Past |
| Rebooked | `6` | Rebooké (annulé puis reprogrammé) | ❌ Past |
| Autre | `7` | Autre statut final | ❌ Past |

### 3.3 Logique de séparation

**Upcoming inclut :**
- ✅ `date + timeStart` >= maintenant
- ✅ ET statut `1` (Confirmé) ou `2` (En attente)
- ✅ Tri croissant (plus proche en premier)

**Past inclut :**
- ✅ `date + timeStart` < maintenant
- ✅ OU statut `3, 4, 5, 6, 7` (tous les statuts finaux)
- ✅ Tri décroissant (plus récent en premier)

---

## 4. Enrichissement des données (Shop Data)

### 4.1 Fonction fetchShopData

```typescript
const fetchShopData = async (booking_id: string) => {
    if (!booking_id) {
        return null;
    }

    try {
        // 1. Récupérer le shop
        const shopsRef = collection(db, "Shops");
        const q = query(shopsRef, where("booking_id", "==", booking_id));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const shopDoc = querySnapshot.docs[0];
            const shopData = {
                id: shopDoc.id,
                ...shopDoc.data()
            } as Shop;

            // 2. Récupérer les services
            const servicesRef = collection(db, "Shops", shopDoc.id, "Services");
            const servicesSnapshot = await getDocs(servicesRef);
            const services = servicesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ServiceType[];

            // 3. Récupérer les membres de l'équipe
            const teamsRef = collection(db, "Shops", shopDoc.id, "Teams");
            const teamsSnapshot = await getDocs(teamsRef);
            const teamMembers = teamsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as TeamMemberType[];

            return {
                ...shopData,
                services,
                teamMembers
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching shop data:", error);
        return null;
    }
};
```

### 4.2 Requêtes supplémentaires

Pour chaque booking, 3 requêtes sont effectuées :
1. **Shop** : `Shops` où `booking_id == booking_id`
2. **Services** : `Shops/{shopId}/Services`
3. **Team Members** : `Shops/{shopId}/Teams`

**Optimisation :** Les requêtes sont exécutées en parallèle via `Promise.all()` dans le mapping.

---

## 5. Index Firestore nécessaires

### 5.1 Index pour collectionGroup

**Index composite REQUIS** car `collectionGroup` avec `where` nécessite un index.

**Configuration :**

```json
{
  "collectionGroup": "Booking",
  "queryScope": "COLLECTION_GROUP",
  "fields": [
    {
      "fieldPath": "clientId",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "date",
      "order": "ASCENDING"
    }
  ]
}
```

**Comment créer l'index :**

1. **Via Firebase Console :**
   - Aller dans Firestore → Indexes
   - Cliquer sur "Create Index"
   - Collection ID : `Booking`
   - Query scope : `Collection group`
   - Fields :
     - `clientId` : Ascending
     - `date` : Ascending

2. **Via firestore.indexes.json :**
   ```json
   {
     "indexes": [
       {
         "collectionGroup": "Booking",
         "queryScope": "COLLECTION_GROUP",
         "fields": [
           { "fieldPath": "clientId", "order": "ASCENDING" },
           { "fieldPath": "date", "order": "ASCENDING" }
         ]
       }
     ]
   }
   ```
   Puis déployer : `firebase deploy --only firestore:indexes`

### 5.2 Index pour fetchShopData

**Aucun index composite nécessaire** car la requête utilise uniquement un filtre d'égalité sur `booking_id`.

Firestore crée automatiquement un index simple pour `booking_id`.

---

## 6. Code complet d'implémentation

### 6.1 Implémentation React/Next.js

```typescript
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collectionGroup, query, where, onSnapshot, collection, getDocs } from 'firebase/firestore';
import { firebase_db as db } from '../../../config/firebase';

interface Appointment {
    id: string;
    clientId: string;
    date: Date;
    timeStart: string;
    timeEnd: string;
    statut: number;
    booking_id: string;
    shopData?: Shop;
    // ... autres propriétés
}

interface Shop {
    id: string;
    booking_id: string;
    shopName: string;
    services?: ServiceType[];
    teamMembers?: TeamMemberType[];
    // ... autres propriétés
}

export default function ContentAppointments() {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
    const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);

    // Fonction pour récupérer les données du shop
    const fetchShopData = async (booking_id: string) => {
        if (!booking_id) return null;

        try {
            const shopsRef = collection(db, "Shops");
            const q = query(shopsRef, where("booking_id", "==", booking_id));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const shopDoc = querySnapshot.docs[0];
                const shopData = {
                    id: shopDoc.id,
                    ...shopDoc.data()
                } as Shop;

                // Récupérer services et team members en parallèle
                const [servicesSnapshot, teamsSnapshot] = await Promise.all([
                    getDocs(collection(db, "Shops", shopDoc.id, "Services")),
                    getDocs(collection(db, "Shops", shopDoc.id, "Teams"))
                ]);

                const services = servicesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                const teamMembers = teamsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                return {
                    ...shopData,
                    services,
                    teamMembers
                };
            }
            return null;
        } catch (error) {
            console.error("Error fetching shop data:", error);
            return null;
        }
    };

    // 1. Requête principale : Récupérer tous les bookings
    useEffect(() => {
        if (!user?.uid) return;

        const bookingsQuery = query(
            collectionGroup(db, 'Booking'),
            where('clientId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(bookingsQuery, async (snapshot) => {
            const appointmentsPromises = snapshot.docs.map(async (doc) => {
                const appointmentData = {
                    id: doc.id,
                    ...doc.data(),
                    date: doc.data().date.toDate(),
                } as Appointment;

                // Enrichir avec les données du shop
                if (appointmentData.booking_id) {
                    const shopData = await fetchShopData(appointmentData.booking_id);
                    if (shopData) {
                        appointmentData.shopData = shopData;
                    }
                }

                return appointmentData;
            });

            const appointmentsData = await Promise.all(appointmentsPromises);

            // Trier par date et heure
            const sortedAppointments = appointmentsData.sort((a, b) => {
                const dateComparison = a.date.getTime() - b.date.getTime();
                if (dateComparison !== 0) return dateComparison;

                const [aHours, aMinutes] = a.timeStart.split(':').map(Number);
                const [bHours, bMinutes] = b.timeStart.split(':').map(Number);
                return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes);
            });

            setAppointments(sortedAppointments);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    // 2. Filtrage Upcoming vs Past
    useEffect(() => {
        const now = new Date();

        const upcoming = appointments.filter(app => {
            const appointmentDateTime = new Date(app.date);
            appointmentDateTime.setHours(
                parseInt(app.timeStart.split(':')[0]),
                parseInt(app.timeStart.split(':')[1])
            );
            return appointmentDateTime >= now && ![3, 4, 5, 6, 7].includes(app.statut);
        }).sort((a, b) => {
            const aDateTime = new Date(a.date);
            const bDateTime = new Date(b.date);
            aDateTime.setHours(
                parseInt(a.timeStart.split(':')[0]),
                parseInt(a.timeStart.split(':')[1])
            );
            bDateTime.setHours(
                parseInt(b.timeStart.split(':')[0]),
                parseInt(b.timeStart.split(':')[1])
            );
            return aDateTime.getTime() - bDateTime.getTime();
        });

        const past = appointments.filter(app => {
            const appointmentDateTime = new Date(app.date);
            appointmentDateTime.setHours(
                parseInt(app.timeStart.split(':')[0]),
                parseInt(app.timeStart.split(':')[1])
            );
            return appointmentDateTime < now || [3, 4, 5, 6, 7].includes(app.statut);
        }).sort((a, b) => {
            const aDateTime = new Date(a.date);
            const bDateTime = new Date(b.date);
            aDateTime.setHours(
                parseInt(a.timeStart.split(':')[0]),
                parseInt(a.timeStart.split(':')[1])
            );
            bDateTime.setHours(
                parseInt(b.timeStart.split(':')[0]),
                parseInt(b.timeStart.split(':')[1])
            );
            return bDateTime.getTime() - aDateTime.getTime();
        });

        setUpcomingAppointments(upcoming);
        setPastAppointments(past);
    }, [appointments]);

    return (
        <div>
            <h2>Upcoming ({upcomingAppointments.length})</h2>
            {upcomingAppointments.map(app => (
                <div key={app.id}>{/* Afficher appointment */}</div>
            ))}

            <h2>Past ({pastAppointments.length})</h2>
            {pastAppointments.map(app => (
                <div key={app.id}>{/* Afficher appointment */}</div>
            ))}
        </div>
    );
}
```

### 6.2 Implémentation React Native

```typescript
import { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';

const fetchUpcomingAppointments = async (userId: string) => {
    // 1. Récupérer tous les bookings
    const snapshot = await firestore()
        .collectionGroup('Booking')
        .where('clientId', '==', userId)
        .get();

    const appointments = await Promise.all(
        snapshot.docs.map(async (doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date.toDate(),
            };
        })
    );

    // 2. Enrichir avec shop data (similaire à fetchShopData)
    // ...

    // 3. Trier
    appointments.sort((a, b) => {
        const dateComparison = a.date.getTime() - b.date.getTime();
        if (dateComparison !== 0) return dateComparison;
        const [aHours, aMinutes] = a.timeStart.split(':').map(Number);
        const [bHours, bMinutes] = b.timeStart.split(':').map(Number);
        return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes);
    });

    // 4. Filtrer upcoming
    const now = new Date();
    const upcoming = appointments.filter(app => {
        const appointmentDateTime = new Date(app.date);
        appointmentDateTime.setHours(
            parseInt(app.timeStart.split(':')[0]),
            parseInt(app.timeStart.split(':')[1])
        );
        return appointmentDateTime >= now && ![3, 4, 5, 6, 7].includes(app.statut);
    });

    return upcoming;
};
```

### 6.3 Implémentation Flutter

```dart
import 'package:cloud_firestore/cloud_firestore.dart';

Future<List<Map<String, dynamic>>> fetchUpcomingAppointments(String userId) async {
  // 1. Récupérer tous les bookings
  final snapshot = await FirebaseFirestore.instance
      .collectionGroup('Booking')
      .where('clientId', isEqualTo: userId)
      .get();

  final appointments = snapshot.docs.map((doc) {
    final data = doc.data();
    return {
      'id': doc.id,
      ...data,
      'date': (data['date'] as Timestamp).toDate(),
    };
  }).toList();

  // 2. Enrichir avec shop data
  // ...

  // 3. Trier
  appointments.sort((a, b) {
    final dateComparison = a['date'].compareTo(b['date']);
    if (dateComparison != 0) return dateComparison;
    
    final aTime = a['timeStart'].split(':');
    final bTime = b['timeStart'].split(':');
    final aMinutes = int.parse(aTime[0]) * 60 + int.parse(aTime[1]);
    final bMinutes = int.parse(bTime[0]) * 60 + int.parse(bTime[1]);
    return aMinutes.compareTo(bMinutes);
  });

  // 4. Filtrer upcoming
  final now = DateTime.now();
  final upcoming = appointments.where((app) {
    final appointmentDateTime = (app['date'] as DateTime).copyWith(
      hour: int.parse(app['timeStart'].split(':')[0]),
      minute: int.parse(app['timeStart'].split(':')[1]),
    );
    final status = app['statut'] as int;
    return appointmentDateTime.isAfter(now) && ![3, 4, 5, 6, 7].contains(status);
  }).toList();

  return upcoming;
}
```

---

## 7. Structure des données

### 7.1 Document Booking

```typescript
{
    id: string;                    // ID du document
    clientId: string;              // ID de l'utilisateur
    booking_id: string;            // ID du shop (booking_id)
    date: Timestamp;               // Date du rendez-vous
    timeStart: string;             // Heure de début ("HH:MM")
    timeEnd: string;               // Heure de fin ("HH:MM")
    statut: number;                // Statut (1-7)
    booking_number: number;        // Numéro de réservation
    services: string[];            // IDs des services
    teamMemberId: string[];        // IDs des membres d'équipe
    // ... autres propriétés
}
```

### 7.2 Interface Appointment (TypeScript)

```typescript
interface Appointment {
    id: string;
    clientId: string;
    date: Date;                    // Converti depuis Timestamp
    timeStart: string;
    timeEnd: string;
    statut: number;
    booking_id: string;
    booking_number: number;
    shopData?: Shop;               // Enrichi avec fetchShopData
    // ... autres propriétés
}
```

---

## 8. Résumé

### Requête principale

- **Collection :** `Booking` (via `collectionGroup`)
- **Filtre :** `where('clientId', '==', user.uid)`
- **Méthode :** `onSnapshot` (temps réel)

### Filtrage

- **Upcoming :** `date + timeStart >= now` ET `statut in [1, 2]`
- **Past :** `date + timeStart < now` OU `statut in [3, 4, 5, 6, 7]`

### Index requis

**Un seul index composite :**
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

**Dernière mise à jour :** 2025-01-21

