# Module Beauty - Feature de Réservation

Ce module contient toute l'architecture des données et la logique métier pour la feature Beauty, sans aucun composant UI.

## 📁 Structure

```
modules/beauty/
├── data/              # Couche d'accès aux données
│   ├── types/         # Interfaces TypeScript
│   ├── firestore/     # Mappers Firestore
│   └── services/      # Services de données
├── logic/             # Logique métier pure
│   ├── slots/         # Génération et validation des créneaux
│   ├── booking/       # Construction des réservations
│   └── checkout/      # Processus de checkout
├── hooks/             # Hooks React (sans UI)
└── utils/             # Utilitaires (dates, géo, catégories)
```

## 🚀 Utilisation

### Imports de base

```typescript
import { 
  useBeautyShopData, 
  useCreateBooking,
  useSlotsForSelection 
} from 'modules/beauty';
```

### Exemple : Charger les données d'un shop

```typescript
const { shop, services, teamMembers, isLoading } = useBeautyShopData('salon-slug');
```

### Exemple : Calculer les créneaux disponibles

```typescript
const { slots, availableDates, computeSlots } = useSlotsForSelection({
  shop,
  teamMembers,
  bookings,
  dayOffs,
  guests,
  selectedDate,
});
```

### Exemple : Créer une réservation

```typescript
const { createNewBooking, isCreating } = useCreateBooking();

const handleConfirm = async () => {
  const success = await createNewBooking({
    shop,
    client,
    guests,
    memberAssignments,
    selectedDate,
    selectedTime,
    paymentMethod: 'Pay at venue',
  });
};
```

## ✅ Vérifications

- ✅ Toutes les dépendances Firebase sont installées
- ✅ TypeScript configuré
- ✅ Pas d'erreurs de linting
- ✅ Imports corrects vers firebase.config.js
- ✅ Types complets pour toutes les collections Firestore

## 📝 Notes

- Ce module est **100% sans UI** - prêt à être utilisé dans des écrans React Native
- Toute la logique métier est **pure** (pas de dépendances React sauf dans les hooks)
- Les services Firestore utilisent l'API `@react-native-firebase/firestore`
- Les Cloud Functions Stripe sont appelées via `onHttpsCallable`

## 🔧 Prochaines étapes

1. Créer les écrans React Native qui utilisent ces hooks
2. Implémenter les composants UI pour la sélection de services
3. Implémenter le calendrier et la sélection de créneaux
4. Intégrer Stripe React Native pour les paiements

