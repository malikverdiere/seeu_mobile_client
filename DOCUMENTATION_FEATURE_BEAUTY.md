# Documentation Technique - Feature Beauty SeeU Web Client

**Version**: 1.0  
**Date**: Décembre 2025  
**Objectif**: Porter la feature Beauty vers React Native

---

## 1. Vue d'ensemble de la Feature Beauty

### 1.1 Objectif fonctionnel

La feature Beauty permet aux utilisateurs finaux de :
- **Découvrir** des salons de beauté (coiffure, spa, manucure, massage, etc.)
- **Rechercher** des établissements par localisation, catégorie, disponibilité
- **Consulter** les détails d'un shop (services, équipe, avis, horaires)
- **Sélectionner** des services avec options et add-ons
- **Choisir** un membre d'équipe (optionnel)
- **Réserver** un créneau horaire disponible
- **Payer** en ligne (Stripe) ou sur place
- **Gérer** ses rendez-vous (annulation, reschedule)

### 1.2 Pages / Écrans principaux

| Page | Route | Fichier source | Composant principal |
|------|-------|----------------|---------------------|
| Landing Page | `/{lang}` | `src/app/[lang]/page.tsx` | `LandingPage.tsx` |
| Home Beauty | `/{lang}/beauty` | `src/app/[lang]/[category]/page.tsx` | `HomePage.tsx` |
| Search | `/{lang}/beauty/search` | `src/app/[lang]/[category]/search/page.tsx` | `SearchPage.tsx` |
| Shop Page | `/{lang}/beauty/{booking_id}` | `src/app/[lang]/[category]/[booking_id]/page.tsx` | `ShopPage.tsx` |
| Services | `/{lang}/beauty/{booking_id}/services` | `src/app/[lang]/[category]/[booking_id]/services/page.tsx` | `ServicesPage.tsx` |
| Professional | `/{lang}/beauty/{booking_id}/professional` | `src/app/[lang]/[category]/[booking_id]/professional/page.tsx` | `ProfessionalPage.tsx` |
| Time | `/{lang}/beauty/{booking_id}/time` | `src/app/[lang]/[category]/[booking_id]/time/page.tsx` | `TimePage.tsx` |
| Confirm | `/{lang}/beauty/{booking_id}/confirm` | `src/app/[lang]/[category]/[booking_id]/confirm/page.tsx` | `ConfirmPage.tsx` |
| Thank You | `/{lang}/thank-you` | `src/app/[lang]/thank-you/page.tsx` | `ThankYouPage.tsx` |
| Profile | `/{lang}/profile` | `src/app/[lang]/profile/page.tsx` | `ProfilePage.tsx` |
| Landing Pages | `/{lang}/beauty/lp/{lp_id}` | `src/app/[lang]/[category]/lp/[lp_id]/page.tsx` | `LPPage.tsx` |

### 1.3 Flow de réservation

```
Home/Search → Shop Page → Services → [Professional] → Time → Confirm → Thank You
                                                        ↓
                                                    Profile (Manage)
                                                        ↓
                                                  Cancel / Reschedule
```

---

## 2. Modèle de données Firebase / Firestore

### 2.1 Collection `Shops`

**Chemin**: `Shops/{shopId}`

| Champ | Type | Obligatoire | Indexé | Description |
|-------|------|-------------|--------|-------------|
| `id` | string | ✓ | - | ID du document |
| `shopName` | string | ✓ | - | Nom du salon |
| `booking_id` | string | ✓ | ✓ `where` | Identifiant URL unique (slug) |
| `shopValid` | boolean | ✓ | ✓ `where` | Shop actif/visible |
| `address` | string | ✓ | - | Adresse complète |
| `neighborhood` | string | - | - | Quartier |
| `city` | string | ✓ | - | Ville |
| `country` | string | ✓ | - | Pays |
| `country_short` | string | - | - | Code pays (ex: TH) |
| `postalCode` | string | - | - | Code postal |
| `email` | string | ✓ | - | Email du shop |
| `phone_number` | string | - | - | Téléphone |
| `coordinate.latitude` | number | ✓ | - | Latitude |
| `coordinate.longitude` | number | ✓ | - | Longitude |
| `coordinate.geohash` | string | ✓ | ✓ `orderBy`, `where` | Geohash pour recherche géo |
| `GalleryPictureShop` | array<string> | - | - | URLs des images |
| `galleryVideoShop` | array<string> | - | - | URLs des vidéos |
| `currency.id` | number | ✓ | - | ID devise |
| `currency.text` | string | ✓ | - | Symbole (฿, €) |
| `currency.name` | string | ✓ | - | Nom devise |
| `shopType.id` | string | ✓ | ✓ `where` | ID type de shop |
| `shopType.type` | number | ✓ | ✓ `where` | Type numérique (1=beauty) |
| `shopType.en/fr/th` | string | - | - | Labels traduits |
| `shop_type` | array<string> | ✓ | ✓ `array-contains` | Catégories du shop |
| `shopRating` | number | - | - | Note SeeU |
| `shopRatingNumber` | number | - | - | Nombre d'avis SeeU |
| `google_infos.rating` | number | - | ✓ `orderBy` | Note Google |
| `google_infos.user_ratings_total` | number | - | ✓ `orderBy` | Nombre avis Google |
| `google_infos.businessType` | string | - | - | Type business Google |
| `about_us.{lang}.text` | string | - | - | Description traduite |
| `seo_meta.{lang}.metaTitle` | string | - | - | Titre SEO |
| `seo_meta.{lang}.metaDescription` | string | - | - | Description SEO |
| `monday` à `sunday` | array<string> | - | ✓ `where` | Horaires ["09:00", "18:00"] |
| `stripeConnectId` | string | - | - | ID Stripe Connect |
| `userId` | string | ✓ | - | ID propriétaire |
| `adPosition` | number | - | ✓ `orderBy` | Position publicitaire |
| `promoLabel` | string | - | - | Label promo affiché |
| `highlight.isActive` | boolean | - | ✓ `where` | Shop mis en avant |
| `highlight.type` | string | - | - | Type highlight |
| `promotion.doubleDay` | boolean | - | ✓ `where` | Promo double jour |
| `promotion.code` | boolean | - | ✓ `where` | A un code promo |
| `promotion.newClient` | boolean | - | ✓ `where` | Promo nouveau client |
| `settingCalendar` | map | ✓ | - | Paramètres calendrier (voir ci-dessous) |

**Sous-objet `settingCalendar`**:

| Champ | Type | Description |
|-------|------|-------------|
| `interval_minutes` | number | Granularité slots (15, 30, 60) |
| `timeZone` | string | Timezone du shop (ex: Asia/Bangkok) |
| `advancedNotice` | number | Délai minimum avant réservation (heures) |
| `maxBookingPeriod` | number | Période max de réservation (jours) |
| `deposit_enabled` | boolean | Paiement en ligne activé |
| `deposit_percentage` | number | Pourcentage acompte |
| `deposit_discount_amount` | number | Réduction si paiement en ligne |
| `deposit_refund_deadline_hours` | number | Délai remboursement (heures) |
| `hideAtVenue` | boolean | Masquer "payer sur place" |
| `autoConfirmed` | boolean | Confirmation automatique |
| `displaySelectMember` | boolean | Afficher sélection membre |
| `displaySelectMemberAutoOpen` | boolean | Page dédiée pour sélection |
| `forceMemberSelection` | boolean | Sélection membre obligatoire |
| `sendBookingEmailToMember` | boolean | Envoyer email aux membres |
| `sendBookingEmailToSpecificEmail` | boolean | Email vers adresse spécifique |
| `emailNewBooking` | string | Email spécifique réservations |
| `priceRange` | string | Fourchette de prix |

### 2.2 Sous-collection `Services`

**Chemin**: `Shops/{shopId}/Services/{serviceId}`

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `id` | string | ✓ | ID du service |
| `name` | string | ✓ | Nom par défaut |
| `title_service.{lang}.text` | string | - | Nom traduit |
| `description` | string | - | Description par défaut |
| `description_service.{lang}.text` | string | - | Description traduite |
| `duration` | number | ✓ | Durée en minutes |
| `durationText` | string | - | Durée formatée |
| `price` | number | ✓ | Prix normal |
| `promotionPrice` | number | - | Prix promo (0 = gratuit) |
| `categoryId` | string | ✓ | Référence catégorie |
| `colorService` | string | - | Couleur affichage |
| `hidden_for_client` | boolean | - | Masqué pour clients |
| `featured` | boolean | - | Service mis en avant |
| `people` | number | - | Nombre de personnes |
| `priority` | number | - | Ordre d'affichage |
| `pictureUrl` | string | - | Image du service |
| `loyaltyPoint` | number | - | Points fidélité |
| `serviceOptions` | array<ServiceOption> | - | Options du service |
| `serviceAddons` | array<ServiceAddOn> | - | Add-ons disponibles |

**Type `ServiceOption`**:
```typescript
interface ServiceOption {
  id: string;
  name: string;
  duration: number;
  durationText: string;
  price: number;
  promotionPrice?: number;
}
```

**Type `ServiceAddOn`**:
```typescript
interface ServiceAddOn {
  id: string;
  name: { [lang: string]: { text: string } };
  description?: { [lang: string]: { text: string } };
  duration: number;
  durationText: string;
  price: number;
  promotionPrice?: number | null;
  maxQuantity?: number;
  quantity: number; // Quantité sélectionnée
}
```

### 2.3 Sous-collection `ServiceCategories`

**Chemin**: `Shops/{shopId}/ServiceCategories/{categoryId}`

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `id` | string | ✓ | ID catégorie |
| `categoryName` | string | ✓ | Nom par défaut |
| `title.{lang}.text` | string | - | Nom traduit |
| `Description` | string | - | Description |
| `color` | string | - | Couleur |
| `priority` | number | - | Ordre d'affichage |

### 2.4 Sous-collection `Teams`

**Chemin**: `Shops/{shopId}/Teams/{memberId}`

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `id` | string | ✓ | ID membre |
| `uid` | string | - | UID Firebase Auth |
| `first_name` | string | ✓ | Prénom |
| `last_name` | string | - | Nom |
| `email` | string | - | Email |
| `phone_number` | string | - | Téléphone |
| `photo_url` | string | - | Photo profil |
| `job_title` | string | - | Titre poste |
| `bio` | string | - | Biographie |
| `services` | array<string> | ✓ | IDs services réalisables |
| `monday` à `sunday` | array<string> | - | Horaires de travail |
| `created_time` | timestamp | - | Date création |

### 2.5 Sous-collection `Booking`

**Chemin**: `Shops/{shopId}/Booking/{bookingId}`

| Champ | Type | Obligatoire | Indexé | Description |
|-------|------|-------------|--------|-------------|
| `id` | string | ✓ | - | ID réservation |
| `clientId` | string | ✓ | ✓ `where` | UID client |
| `clientEmail` | string | ✓ | - | Email client |
| `clientPhone` | string | - | - | Téléphone |
| `clientPhoneCountry` | string | - | - | Indicatif pays |
| `firstName` | string | ✓ | - | Prénom client |
| `lastName` | string | ✓ | - | Nom client |
| `createdAt` | timestamp | ✓ | - | Date création |
| `date` | timestamp | ✓ | - | Date RDV (UTC) |
| `dateBooking` | string | ✓ | - | Date formatée (DD/MM/YYYY) |
| `timeStart` | string | ✓ | - | Heure début (HH:MM) |
| `timeEnd` | string | ✓ | - | Heure fin (HH:MM) |
| `duration` | number | ✓ | - | Durée totale (min) |
| `statut` | number | ✓ | ✓ `where` | Statut (voir enum) |
| `services` | array<BookingService> | ✓ | - | Services réservés |
| `teamMemberId` | array<{id, name}> | ✓ | - | Membres assignés |
| `booking_id` | string | ✓ | - | Slug du shop |
| `booking_number` | number | ✓ | ✓ `where`, `orderBy` | Numéro séquentiel |
| `booking_category` | string | - | - | Catégorie (beauty) |
| `booking_url` | string | - | - | URL de réservation |
| `paymentMethods` | string | ✓ | - | "Pay at venue" / "Pay online" |
| `subTotalPrice` | number | ✓ | - | Sous-total |
| `subTotalPromo` | number | - | - | Total remises |
| `totalPrice` | number | ✓ | - | Total final |
| `discountCode` | string | - | - | Code promo utilisé |
| `promoAmount` | number | - | - | Montant remise |
| `promoCodeId` | string | - | - | ID code promo |
| `promoCode` | string | - | - | Code promo |
| `promoDiscountType` | number | - | - | Type remise (1=%, 2=fixe) |
| `promoDiscountValue` | number | - | - | Valeur remise |
| `specificServices` | array<string> | - | - | Services ciblés par promo |
| `excludeDiscountedServices` | boolean | - | - | Exclure services en promo |
| `bookingNotes` | string | - | - | Notes client |
| `from` | string | ✓ | - | Source (seeuapp.io) |
| `depositAmount` | number | - | - | Montant acompte payé |
| `depositDiscountAmount` | number | - | - | Remise acompte |
| `paymentIntent` | string | - | - | ID Stripe PaymentIntent |
| `paymentIntentStatus` | string | - | - | Statut paiement |
| `isRebooked` | boolean | - | - | Est un rebooking |
| `rebookedFrom` | string | - | - | Booking_number original |
| `rebookingDate` | timestamp | - | - | Date du rebooking |
| `originalBookingNumber` | number | - | - | Numéro booking original |
| `originalPaymentMethods` | string | - | - | Méthode paiement original |
| `cancelledAt` | timestamp | - | - | Date annulation |
| `cancelledBy` | string | - | - | Qui a annulé |
| `packageId` | string | - | - | ID package utilisé |
| `packageName` | map | - | - | Nom package traduit |
| `packageServices` | array | - | - | Services du package |
| `session` | map | - | - | Données session/UTM |

**Enum `statut`**:
- `1` = En attente de confirmation
- `2` = Confirmé
- `3` = Annulé par le client
- `4` = Rejeté par le shop
- `5` = Terminé
- `6` = Annulé avec remboursement
- `7` = Rebooked (remplacé)

**Type `BookingService`**:
```typescript
interface BookingService {
  id: string;
  guestId: string;
  guestName: string;
  name: string;
  optionId?: string;
  optionName?: string;
  duration: number;
  durationFormatted: string;
  price: number;
  promotionPrice?: number | null;
  priceUsed: number;
  memberId: string;
  memberName: string;
  serviceAddons?: ServiceAddOn[];
  dateBooking: string;
  timeStart: string;
  timeEnd: string;
  serviceColor?: string;
  people?: number;
  loyaltyPoint?: number | null;
}
```

### 2.6 Sous-collection `DayOff`

**Chemin**: `Shops/{shopId}/DayOff/{dayOffId}`

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `id` | string | ✓ | ID |
| `memberId` | string | ✓ | ID membre concerné |
| `dateStart` | timestamp | ✓ | Date début |
| `dateEnd` | timestamp | ✓ | Date fin |
| `dateStartText` | string | - | Date début formatée |
| `dateEndText` | string | - | Date fin formatée |
| `startHour` | string | - | Heure début (HH:MM) |
| `endHour` | string | - | Heure fin (HH:MM) |
| `type` | string | - | Type de congé |
| `description` | string | - | Description |
| `createdAt` | timestamp | - | Date création |

### 2.7 Sous-collection `ShopReviews`

**Chemin**: `Shops/{shopId}/ShopReviews/{reviewId}`

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `id` | string | ✓ | ID avis |
| `clientId` | string | - | UID client |
| `ratingNote` | number | ✓ | Note (1-5) |
| `ratingCommentary` | string | - | Commentaire |
| `created_at` | timestamp | ✓ | Date création |

### 2.8 Sous-collection `GoogleReviews`

**Chemin**: `Shops/{shopId}/GoogleReviews/{reviewId}`

Avis importés depuis Google Places API.

### 2.9 Collection `Clients`

**Chemin**: `Clients/{userId}`

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `userId` | string | ✓ | UID Firebase Auth |
| `email` | string | ✓ | Email |
| `firstName` | string | - | Prénom |
| `lastName` | string | - | Nom |
| `phone` | string | - | Téléphone |
| `phoneNumberCountry` | string | - | Indicatif |
| `user_img` | string | - | Photo profil |
| `user_img_Valid` | boolean | - | Photo validée |
| `user_lang` | string | - | Langue préférée |
| `creatAt` | timestamp | ✓ | Date inscription |
| `from` | string | ✓ | Source inscription |
| `marketingConsent` | boolean | - | Consentement marketing |
| `termsAccepted` | boolean | - | CGU acceptées |

### 2.10 Sous-collection `RegisteredShops`

**Chemin**: `Clients/{userId}/RegisteredShops/{registrationId}`

Enregistrement d'un client dans un shop spécifique.

| Champ | Type | Description |
|-------|------|-------------|
| `shopId` | string | ID du shop |
| `clientId` | string | UID client |
| `createAt` | timestamp | Date enregistrement |
| `lastVisit` | timestamp | Dernière visite |
| `points` | number | Points fidélité |
| `nbVisit` | number | Nombre de visites |
| `clientNum` | number | Numéro client dans le shop |
| `firstName/lastName/email/phone` | string | Infos client |

### 2.11 Sous-collection `ClientPackages`

**Chemin**: `Clients/{userId}/ClientPackages/{packageId}`

Packages achetés par un client.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | string | ID package |
| `shopId` | string | ID shop |
| `isValid` | boolean | Package valide |
| `name` | map | Nom traduit |
| `serviceSummary` | array | Services inclus `{serviceId, quantity}` |

### 2.12 Collection `PromoCodes`

**Chemin**: `PromoCodes/{promoCodeId}`

| Champ | Type | Indexé | Description |
|-------|------|--------|-------------|
| `id` | string | - | ID |
| `shopId` | string | ✓ `where` | ID shop |
| `code` | string | ✓ `where` | Code promo |
| `name` | string | - | Nom affiché |
| `status` | number | ✓ `where` | 1=actif |
| `discountType` | number | - | 1=%, 2=fixe |
| `discountValue` | number | - | Valeur |
| `maxDiscount` | number | - | Plafond |
| `minOrderValue` | number | - | Minimum commande |
| `validFrom` | timestamp | - | Date début validité |
| `validUntil` | timestamp | - | Date fin validité |
| `usageLimit` | number | - | Limite utilisations totales |
| `usageLimitPerClient` | number | - | Limite par client |
| `newUsersOnly` | boolean | - | Nouveaux clients seulement |
| `specificServices` | array<string> | - | Services ciblés |

### 2.13 Collection `Rewards`

**Chemin**: `Rewards/{rewardId}`

Récompenses fidélité par shop.

| Champ | Type | Indexé | Description |
|-------|------|--------|-------------|
| `id` | string | - | ID |
| `shopId` | string | ✓ `where` | ID shop |
| ... | ... | ... | Détails récompense |

### 2.14 Collection `SearchBanners`

**Chemin**: `SearchBanners/{bannerId}`

Bannières publicitaires sur les pages de recherche/home.

| Champ | Type | Indexé | Description |
|-------|------|--------|-------------|
| `id` | string | - | ID |
| `category` | string | ✓ `where` | Catégorie (beauty) |
| `isActive` | boolean | ✓ `where` | Actif |
| `priority` | number | ✓ `orderBy` | Ordre affichage |
| `banner.{lang}.url.desktop` | string | - | Image desktop |
| `banner.{lang}.url.mobile` | string | - | Image mobile |
| `banner.{lang}.url.redirect` | string | - | URL clic |
| `countClick` | number | - | Compteur clics |
| `lastClick` | timestamp | - | Dernier clic |

---

## 3. Logique d'affichage des shops

### 3.1 Page Home Beauty (`HomePage.tsx`)

**Requêtes Firebase**:

```typescript
// Requête 1: Shops mis en avant (highlight)
const q1 = query(
  collection(db, "Shops"),
  where("highlight.isActive", "==", true)
);

// Requête 2: Promos double jour
const q2 = query(
  collection(db, "Shops"),
  where("promotion.doubleDay", "==", true)
);

// Exécution parallèle
const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
```

**Tri et filtrage**:
- Fusion des deux listes sans doublons (Map par ID)
- Filtrage par `highlight.type` pour les sections :
  - `Trending`
  - `Nail studio`
  - `Massage salon`
  - `Hair salon`
- Section "Recently viewed" depuis `localStorage`

**Fichiers**:
- `src/components/PageHome/HomePage.tsx`
- `src/utils/useRecentlyViewed.ts`

### 3.2 Page Search (`SearchPage.tsx`)

**Contrôleur**: `SearchPageController` (`src/components/PageSearch/controllers/searchPageController.ts`)

**Requêtes avec filtres**:

```typescript
const constraints = [
  where('shopValid', '==', true),
  where('booking_id', '!=', null),
  where("shopType.type", "==", filters.categoryType), // 1 pour beauty
  where('shop_type', 'array-contains', filters.category)
];

// Filtres optionnels
if (filters.date) {
  constraints.push(where(dayName, '>', [])); // Shop ouvert ce jour
}
if (filters.promoCode) {
  constraints.push(where('promotion.code', '==', true));
}
if (filters.doubleDay) {
  constraints.push(where('promotion.doubleDay', '==', true));
}
if (filters.newClient) {
  constraints.push(where('promotion.newClient', '==', true));
}
```

**Mode GÉO (si lat/lng fournis)**:
- Utilise `geofire-common` pour calculer les bounds du geohash
- Tri par distance calculée côté client
- Rayon par défaut: 20km

```typescript
const bounds = geofire.geohashQueryBounds([filters.lat, filters.lng], radiusMeters);
// Une requête par bound avec orderBy('coordinate.geohash')
```

**Mode RATING (sans géolocalisation)**:
- `orderBy('adPosition', 'asc')` puis `orderBy('google_infos.user_ratings_total', 'desc')`
- Pagination via `startAfter(lastDoc)` et `limit(limitCount)`

**Pagination**:
- Scroll infini avec bouton "Load more"
- `resetPagination()` quand les filtres changent

### 3.3 Filtres disponibles

| Filtre | Paramètre URL | Champ Firestore |
|--------|--------------|-----------------|
| Catégorie | `category` | `shop_type` (array-contains) |
| Date | `date` | `{dayName}` (jour ouvert) |
| Localisation | `lat`, `lng` | `coordinate.geohash` |
| Code promo | `promoCode` | `promotion.code` |
| Double jour | `doubleDay` | `promotion.doubleDay` |
| Nouveau client | `newClient` | `promotion.newClient` |

---

## 4. Logique d'affichage de la Page Shop

### 4.1 Chargement des données (`ShopPage.tsx`)

**Contexts utilisés**:
- `useShop()` → `ShopContext.tsx`
- `useService()` → `ServiceContext.tsx`
- `useTeam()` → `TeamContext.tsx`

**Parallélisation des requêtes**:

```typescript
await Promise.all([
  fetchShopData(booking_id),    // Shop + Reviews + GoogleReviews + Rewards + PromoCodes
  fetchTeamData(booking_id),    // Teams
  fetchServiceData(booking_id)  // ServiceCategories + Services
]);
```

### 4.2 Services par catégorie

**Filtrage**:

```typescript
// servicesPageController.ts
export function filterCategoriesHasServices(categories, services) {
  return categories.filter(category => 
    services.some(service => 
      service.categoryId === category.id && !service.hidden_for_client
    )
  );
}
```

**Tri des catégories** par `priority` croissant.

### 4.3 Horaires d'ouverture

**Structure des horaires** dans le shop:
```typescript
{
  monday: ["09:00", "12:00", "14:00", "18:00"], // 2 plages
  tuesday: ["09:00", "18:00"], // 1 plage continue
  sunday: [] // Fermé
}
```

**Calcul "Ouvert/Fermé"** (`Card.tsx` → `isCurrentlyOpen`):
- Compare l'heure actuelle dans le timezone du shop
- Trouve la prochaine plage d'ouverture si fermé

### 4.4 Avis (Reviews)

**Double source**:
1. `ShopReviews` (avis SeeU) avec enrichissement client depuis `Clients/{clientId}`
2. `GoogleReviews` (avis Google importés)

**Sélection par défaut**: SeeU si des avis existent, sinon Google.

### 4.5 Autres blocs

| Bloc | Source | Composant |
|------|--------|-----------|
| Galerie photos | `GalleryPictureShop` | `Gallery.tsx` |
| Vidéos | `galleryVideoShop` | `VideoList.tsx` |
| Équipe | `Teams` | `Team.tsx` |
| About | `about_us.{lang}.text` | `About.tsx` |
| Fidélité | `Rewards` | `LoyaltyProgram.tsx` |
| Promos | `PromoCodes` | `PromoItem.tsx` |
| Shops à proximité | Calculé via Haversine | `TrendingCard.tsx` |

---

## 5. Sélection de services, add-ons et membre

### 5.1 Gestion de l'état: `GuestController`

**Fichier**: `src/components/PageServices/controllers/guestController.ts`

Le `GuestController` est une **classe stateful** qui gère:
- Liste des invités (guests)
- Services sélectionnés par invité
- Options et add-ons par service
- Membre d'équipe par service

**Structure interne**:

```typescript
interface Guest {
  id: string;           // "guest_1", "guest_2"...
  name: string;         // "Me", "Guest 1", "Guest 2"...
  services: GuestService[];
  isActive: boolean;    // Un seul actif à la fois
}

interface GuestService {
  id: string;
  guestId: string;
  guestName: string;
  name: string;
  duration: number;
  price: number;
  promotionPrice?: number | null;
  selectedOption?: ServiceOption;
  selectedAddOns?: ServiceAddOn[];
  teamMemberId?: string;
  totalPrice: number;
  // ... autres champs du service
}
```

**Méthodes principales**:

```typescript
class GuestController {
  addNewGuest(): string;
  setActiveGuest(guestId: string): void;
  getActiveGuest(): Guest | null;
  addServiceToActiveGuest(service: GuestService): void;
  removeServiceFromActiveGuest(serviceId: string): void;
  removeGuest(guestId: string): void;
  getAllGuests(): Guest[];
  getTotalPrice(): number;
  createGuestService(guestId, guestName, service, selectedOption?, addOns?): GuestService;
  getDataForUrl(): string;           // Sérialisation pour URL
  restoreFromUrl(guestDataString, services): void;  // Restauration depuis URL
}
```

### 5.2 Stockage de l'état

**Pas de Redux/Context global** - L'état est:
1. Stocké dans l'instance `GuestController` (class)
2. Synchronisé dans l'URL via `URLController`

**Format URL**:
```
?guests=Me-serviceId-optionId-memberId-addonId-qty.addonId2-qty2|serviceId2-..._Guest1-...
```

### 5.3 Sélection d'un membre (`ServiceMemberContext`)

**Fichier**: `src/contexts/ServiceMemberContext.tsx`

Gère le mapping `{ [serviceId]: memberId }` pour la sélection par service.

### 5.4 Contraintes métier

**Membres disponibles pour un service**:
```typescript
// memberAvailability.ts
function getAvailableMembersForServices(teamMembers, guestServices) {
  return teamMembers.filter(member => 
    member.services.some(memberServiceId => 
      guestServices.some(gs => gs.id === memberServiceId)
    )
  );
}
```

**Conflits entre invités**:
- Si plusieurs invités réservent en même temps, on vérifie qu'il y a assez de membres disponibles
- Fonction `getAvailableMembersByServiceWithoutConflict` dans `memberAvailability.ts`

---

## 6. Construction des créneaux horaires (Time Slots)

### 6.1 Données utilisées

| Donnée | Source | Description |
|--------|--------|-------------|
| Horaires shop | `shopData.{day}` | Ex: ["09:00", "18:00"] |
| Horaires membre | `member.{day}` | Idem par membre |
| Jours de congé | `DayOff` collection | Congés/indisponibilités |
| Bookings existants | `Booking` collection | RDV déjà pris (statut 1 ou 2) |
| Timezone | `settingCalendar.timeZone` | Ex: "Asia/Bangkok" |
| Granularité | `settingCalendar.interval_minutes` | 15, 30, ou 60 min |
| Délai minimum | `settingCalendar.advancedNotice` | Heures avant RDV |
| Période max | `settingCalendar.maxBookingPeriod` | Jours à l'avance |

### 6.2 Algorithme principal

**Fichier**: `src/components/PageTime/controllers/memberAvailability.ts`

```typescript
function memberAvailability(
  teamMembers,
  date,
  daysOff,
  shopData,
  selectedTime,
  selectedMembers,
  guestController,
  controller,
  bookings
) {
  // 1. Récupérer les services sélectionnés
  const guestServices = getGuestServices(guestController);
  
  // 2. Calculer la durée totale
  const totalDuration = calculateMaxDuration(guestController);
  
  // 3. Filtrer les membres disponibles ce jour-là
  let availableMembers = getFullyAvailableMembers(
    teamMembers, date, guestServices, daysOff, shopData
  );
  
  // 4. Exclure les conflits entre invités
  const availableMembersByService = getAvailableMembersByServiceWithoutConflict(...);
  
  // 5. Générer les slots avec disponibilité
  const validSlots = getValidSlots(
    membersBookings,
    guestServices.length,
    selectedMembers.map(m => m.id),
    shopData,
    date,
    totalDuration,
    daysOff,
    numberOfGuests,
    availableMembersByService
  );
  
  return { validSlots, blockDay, ... };
}
```

### 6.3 Génération des slots

**Fichier**: `src/components/PageTime/controllers/selectorTimeController.ts`

```typescript
function generateTimeSlots(schedule, intervalMinutes, date): TimeSlot[] {
  // schedule = ["09:00", "12:00", "14:00", "18:00"]
  // Génère slots de 09:00 à 12:00 et de 14:00 à 18:00
  // Avec granularité intervalMinutes
}
```

### 6.4 Validation d'un slot

Pour chaque slot, on vérifie:

1. **Pas dans le passé** (`isTimeSlotInPast`)
2. **Dans les horaires du shop** (plages d'ouverture)
3. **Au moins 1 membre disponible par service**
4. **Membre pas en congé** (`isMemberOnDayOff`)
5. **Membre pas déjà réservé** (`isMemberAvailableForTimeSlot`)
6. **Membre travaille ce jour** (`isNoWorkingDay`)

### 6.5 Gestion du timezone

**Fichier**: `src/utils/dateUtils.ts`

```typescript
// Convertir une date/heure vers le timezone du shop
function convertToShopTimezone(date: Date, time: string, timezone: string): Date;

// Obtenir l'offset timezone
function getTimezoneOffsetString(timezone: string, date: string, time: string): string;
// Ex: "+07:00" pour Bangkok

// Créer une date ISO avec timezone
const isoStringWithTimezone = `${date}T${timeStart}:00${offsetString}`;
const bookingDateUTC = new Date(isoStringWithTimezone);
```

---

## 7. Checkout, enregistrement et cycle de vie du booking

### 7.1 Confirmation de réservation (`ConfirmPage.tsx`)

**Données envoyées** au moment du checkout:

```typescript
const booking = {
  id: "",
  clientId: user.uid,
  clientEmail: user.email,
  clientPhone: phone,
  clientPhoneCountry: phoneNumberCountry,
  firstName: firstName,
  lastName: lastName,
  createdAt: new Date(),
  date: bookingDateUTC,              // Date en UTC
  dateBooking: "28/11/2025",          // Format local
  timeStart: "10:30",
  timeEnd: "12:00",
  duration: 90,                        // minutes
  statut: shopData.settingCalendar.autoConfirmed ? 2 : 1,
  services: servicesWithCompletedMember,
  teamMemberId: uniqueTeamMembers,
  booking_id: "shop_slug",
  booking_number: lastBookingNumber + 1,
  paymentMethods: "Pay at venue" | "Pay online",
  subTotalPrice: 1500,
  subTotalPromo: 200,
  totalPrice: 1300,
  // ... promo, deposit, session, package si applicable
};
```

### 7.2 Fonction d'enregistrement

**Fichier**: `src/components/PageConfirm/controllers/confirmPageController.ts`

```typescript
async function addBooking(booking, shopId, userId, booking_number_param?) {
  const bookingCollectionRef = collection(doc(db, "Shops", shopId), "Booking");
  
  // Si rebooking: mettre à jour l'ancien booking (statut 7)
  if (booking_number_param) {
    const q = query(bookingCollectionRef, 
      where("booking_number", "==", Number(booking_number_param)),
      where("clientId", "==", userId)
    );
    // updateDoc → statut: 7, rebookingDate: new Date()
  }
  
  // Créer le nouveau booking
  const docRef = await addDoc(bookingCollectionRef, booking);
  await updateDoc(docRef, { id: docRef.id });
  
  return { status: 'Success', docId: docRef.id };
}
```

### 7.3 Paiement Stripe

**Contrôleur**: `StripeController` (`src/components/PageConfirm/controllers/stripeController.ts`)

**Flow**:
1. `createPaymentIntent` → Cloud Function `createStripePaymentIntent`
2. Retourne `clientSecret`, `paymentIntentId`
3. Affichage du `<PaymentForm>` avec Stripe Elements
4. `processPayment` → Confirm le paiement côté client
5. Si succès: enregistrer le booking avec `paymentIntent.id`

**Cloud Functions Stripe** (appelées via `httpsCallable`):
- `createStripePaymentIntent`
- `updateStripePaymentIntent`
- `cancelPaymentIntent`
- `refundConnect`

### 7.4 Envoi des emails

**Cloud Functions emails** (asia-southeast1):
- `client_booking_comfirm_email` / `client_booking_pending_email`
- `shop_booking_confirm_email` / `shop_booking_pending_email`
- `client_booking_canceled_email` / `shop_booking_canceled_email`

### 7.5 Annulation de booking

**Fichier**: `src/components/PageProfile/ContentAppointments.tsx`

```typescript
async function handleCancelAppointment() {
  // 1. Vérifier le délai (deposit_refund_deadline_hours)
  const deadlineHours = appointment.shopData.settingCalendar.deposit_refund_deadline_hours;
  if (diffHours < deadlineHours) {
    // Annulation impossible
    return;
  }
  
  // 2. Remboursement Stripe si paiement en ligne
  if (paymentMethods === "Pay online" && depositAmount && paymentIntent) {
    const refundFunction = httpsCallable(getFunctions(), 'refundConnect');
    await refundFunction({ paymentIntentId, stripeAccountId });
  }
  
  // 3. Mise à jour statut → 3 (annulé) ou 6 (annulé + remboursé)
  await updateDoc(bookingRef, {
    statut: paymentMethods === "Pay online" ? 6 : 3,
    cancelledAt: new Date(),
    cancelledBy: "client"
  });
  
  // 4. Emails d'annulation
  await cancelEmailFunction(data);
  await cancelShopEmailFunction(data);
}
```

### 7.6 Reschedule (reprogrammation)

**Flow**:
1. Depuis `ManageAppointment`, clic sur "Reschedule"
2. Redirection vers: `/{booking_url}&set={booking_number}`
3. Le paramètre `set` indique un reschedule
4. Sur `ConfirmPage`:
   - `fetchOriginalBookingData` récupère les infos originales
   - Le booking original passe en statut 7 lors de la création
   - Le nouveau booking a `isRebooked: true`, `rebookedFrom: originalNumber`

---

## 8. Composants, hooks et services réutilisables

### 8.1 Contexts (réutilisables après adaptation)

| Context | Fichier | Rôle | Dépendances web |
|---------|---------|------|-----------------|
| `AuthContext` | `src/contexts/AuthContext.tsx` | Auth Firebase | Firebase Auth (compatible RN) |
| `ShopContext` | `src/contexts/ShopContext.tsx` | Données shop | Firestore (compatible RN) |
| `ServiceContext` | `src/contexts/ServiceContext.tsx` | Services/catégories | Firestore |
| `TeamContext` | `src/contexts/TeamContext.tsx` | Membres équipe | Firestore |
| `BookingContext` | `src/contexts/BookingContext.tsx` | Bookings + DayOff | Firestore listeners |
| `ServiceMemberContext` | `src/contexts/ServiceMemberContext.tsx` | Sélection membres | Pure JS ✓ |
| `NotificationContext` | `src/contexts/NotificationContext.tsx` | Toasts | UI web (à adapter) |
| `ProfileContext` | `src/contexts/ProfileContext.tsx` | Navigation profil | Pure JS ✓ |

### 8.2 Controllers (logique pure - réutilisables)

| Controller | Fichier | Rôle |
|------------|---------|------|
| `GuestController` | `PageServices/controllers/guestController.ts` | Gestion invités/services |
| `URLController` | `PageServices/controllers/servicesPageController.ts` | Sync URL (à adapter) |
| `SearchPageController` | `PageSearch/controllers/searchPageController.ts` | Requêtes recherche |
| `StripeController` | `PageConfirm/controllers/stripeController.ts` | Paiements Stripe |
| Fonctions `memberAvailability` | `PageTime/controllers/memberAvailability.ts` | Calcul disponibilités |
| Fonctions `confirmPageController` | `PageConfirm/controllers/confirmPageController.ts` | Logique booking |

### 8.3 Utilitaires (100% réutilisables)

| Utilitaire | Fichier | Rôle |
|------------|---------|------|
| `dateUtils` | `src/utils/dateUtils.ts` | Conversions dates/timezone |
| `haversine` | `src/utils/haversine.ts` | Calcul distances |
| `categories` | `src/utils/categories.ts` | Liste catégories |
| `memberUtils` | `src/utils/memberUtils.ts` | Utilitaires membres |
| `imgUrlFormat` | `src/utils/imgUrlFormat.ts` | URLs images Cloudflare |

### 8.4 Composants UI (à réécrire pour RN)

| Composant | Fichier | Équivalent RN |
|-----------|---------|---------------|
| `Button` | `src/components/ui/Button.tsx` | `TouchableOpacity` custom |
| `Rating` | `src/components/Rating/Rating.tsx` | Lib `react-native-ratings` |
| `ImageSkeleton` | `src/components/ImageSkeleton.tsx` | `Image` + placeholder |
| `DatePicker` | `src/components/SearchBar/DatePicker.tsx` | `react-native-calendars` |
| `Slider` | `src/components/Slider/Slider.tsx` | `FlatList` horizontal |
| `Carousel` | `src/components/Carousel/Carousel.tsx` | `react-native-snap-carousel` |

### 8.5 Hooks personnalisés

| Hook | Fichier | Rôle | Réutilisable |
|------|---------|------|--------------|
| `useIsMobile` | `src/utils/isMobile.ts` | Détection mobile | Non (Dimensions RN) |
| `useRecentlyViewed` | `src/utils/useRecentlyViewed.ts` | Shops vus récemment | Adapter (AsyncStorage) |
| `useModalScrollLock` | `src/utils/useModalScrollLock.ts` | Lock scroll modal | Non (pas nécessaire RN) |
| `useCategoryScroll` | `PageServices/controllers/categoriesSliderController.ts` | Scroll catégories | Non (impl. différente) |
| `usePaginatedAvailabilities` | `PageTime/controllers/usePaginatedAvailabilities.ts` | Cache slots | Partiellement |
| `useCartCalculations` | `PageServices/controllers/servicesCartController.ts` | Calculs panier | Oui ✓ |
| `useSessionTracking` | `SessionTracker/sessionManager.ts` | Tracking sessions | Adapter |

---

## 9. Plan de portage vers React Native

### 9.1 Modules réutilisables (peu ou pas de modifications)

| Module | Effort | Notes |
|--------|--------|-------|
| `GuestController` | Très faible | Pure class JS |
| `memberAvailability.ts` | Très faible | Pure functions |
| `confirmPageController.ts` | Faible | Adapter Cloud Functions |
| `dateUtils.ts` | Très faible | Pure functions |
| `categories.ts` | Aucun | Constantes |
| `servicesCartController.ts` | Très faible | Pure functions |
| Types (`types.ts`) | Aucun | TypeScript interfaces |

### 9.2 Modules à adapter

| Module | Modifications nécessaires |
|--------|---------------------------|
| `AuthContext` | Remplacer `signInWithPopup` par flow natif (Google Sign-In, Apple Sign-In) |
| `ShopContext` | Remplacer cache `Map` par AsyncStorage |
| `ServiceContext` | Idem cache |
| `BookingContext` | Idem + vérifier listeners Firestore |
| `StripeController` | Utiliser `@stripe/stripe-react-native` |
| `sessionManager.ts` | Remplacer localStorage par AsyncStorage |
| `useRecentlyViewed` | AsyncStorage au lieu de localStorage |

### 9.3 Modules à réécrire complètement

| Module | Raison |
|--------|--------|
| Navigation (Next.js router) | → React Navigation |
| Tous les composants UI | → React Native components |
| `URLController` | → State management (Zustand/Redux) ou params React Navigation |
| SEO / SSR | Non applicable en app native |
| Skeleton loaders | → Shimmer RN |

### 9.4 Plan d'implémentation étape par étape

#### Phase 1: Configuration de base
1. Initialiser projet React Native (Expo ou CLI)
2. Configurer Firebase pour RN (`@react-native-firebase/*`)
3. Configurer Stripe RN (`@stripe/stripe-react-native`)
4. Configurer React Navigation
5. Mettre en place la structure de dossiers similaire

#### Phase 2: Logique métier
1. Copier les controllers purs (`guestController.ts`, `memberAvailability.ts`, etc.)
2. Copier les types TypeScript
3. Copier les utilitaires (`dateUtils.ts`, `categories.ts`, etc.)
4. Adapter les contexts Firebase (AsyncStorage pour cache)

#### Phase 3: Authentification
1. Implémenter `AuthContext` avec Google/Apple Sign-In natif
2. Tester le flow d'inscription/connexion

#### Phase 4: Écrans principaux
1. **Home/Search**: Adapter les requêtes, créer les composants liste
2. **Shop Page**: Créer les composants galerie, services preview
3. **Services**: Adapter `GuestController`, composants sélection
4. **Time**: Adapter le calendrier et les slots
5. **Confirm**: Intégrer Stripe RN, formulaire
6. **Profile**: Liste bookings, modals action

#### Phase 5: Tests et polish
1. Tester le flow complet: recherche → booking → paiement
2. Tester annulation et reschedule
3. Optimiser les performances (FlatList, mémoisation)
4. Notifications push

### 9.5 Dépendances RN recommandées

```json
{
  "@react-native-firebase/app": "^18.x",
  "@react-native-firebase/auth": "^18.x",
  "@react-native-firebase/firestore": "^18.x",
  "@stripe/stripe-react-native": "^0.x",
  "@react-navigation/native": "^6.x",
  "@react-navigation/stack": "^6.x",
  "react-native-calendars": "^1.x",
  "react-native-maps": "^1.x",
  "@react-native-async-storage/async-storage": "^1.x",
  "react-native-reanimated": "^3.x",
  "react-native-gesture-handler": "^2.x"
}
```

---

## Annexes

### A. Statuts de booking

| Code | Label | Description |
|------|-------|-------------|
| 1 | Pending | En attente de confirmation |
| 2 | Confirmed | Confirmé |
| 3 | Cancelled | Annulé par client |
| 4 | Rejected | Rejeté par shop |
| 5 | Completed | Terminé |
| 6 | Refunded | Annulé + remboursé |
| 7 | Rebooked | Remplacé par reschedule |

### B. Types de discount promo

| Code | Description |
|------|-------------|
| 1 | Pourcentage (%) |
| 2 | Montant fixe |

### C. Cloud Functions utilisées

| Fonction | Région | Rôle |
|----------|--------|------|
| `createStripePaymentIntent` | default | Créer PaymentIntent Stripe |
| `updateStripePaymentIntent` | default | MAJ montant PaymentIntent |
| `cancelPaymentIntent` | default | Annuler PaymentIntent |
| `refundConnect` | default | Rembourser via Stripe Connect |
| `client_booking_comfirm_email` | asia-southeast1 | Email confirmation client |
| `client_booking_pending_email` | asia-southeast1 | Email pending client |
| `shop_booking_confirm_email` | asia-southeast1 | Email confirmation shop |
| `shop_booking_pending_email` | asia-southeast1 | Email pending shop |
| `client_booking_canceled_email` | asia-southeast1 | Email annulation client |
| `shop_booking_canceled_email` | asia-southeast1 | Email annulation shop |
| `readShopsDataJson` | default | Cache JSON shops |
| `forceRebuildShopsDataJson` | default | Rebuild cache |

### D. Incertitudes / Points à clarifier

1. **Logique de `adPosition`**: L'ordre exact de priorité entre publicités et résultats organiques n'est pas documenté explicitement.

2. **Refresh des listeners Firestore**: La gestion du cleanup des listeners dans `BookingContext` pourrait nécessiter une revue pour éviter les memory leaks.

3. **Validation côté serveur**: Certaines validations (ex: slot encore disponible) sont doublées front + Cloud Functions, mais le code back n'est pas accessible dans ce repo.

4. **Logique packages complète**: La gestion des `ClientPackages` (achat, consommation, expiration) semble partiellement gérée côté back-office.

---

**Fin de la documentation technique Feature Beauty v1.0**

