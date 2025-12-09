# 📚 Documentation – Page Shop (données, requêtes, affichage)

## 1. Vue d’ensemble
Page : `src/components/PageShop/ShopPage.tsx`.  
Objectif : afficher un shop (infos, services, promos, galerie, équipe, avis), puis des shops proches (nearby) et des highlights.

## 2. Données chargées au montage
Dans `useEffect` (booking_id présent) :
- `fetchShopData(booking_id)` via `useShop()`
- `fetchTeamData(booking_id)` via `useTeam()`
- `fetchServiceData(booking_id)` via `useService()`
- `addRecentlyViewed(booking_id)`

Si `marketplace=true` : `fetchNearbyShops(shopData)` après chargement du shop (fonctionnalité côté app).

## 3. Requêtes / Contextes
### 3.1 Shop (useShop)
- Shop principal : `Shops` (filtré par `booking_id`)
- Promo codes du shop
- Reviews SeeU (si disponibles)
- Rewards/loyalty
- Google infos (rating, user_ratings_total)
- Nearby shops (si marketplace)

### 3.2 Services (useService)
- `getServicesByShopId` → `Shops/{shopId}/Services`
- Services enrichis (durationText, prix, promotionPrice, title_service[lang])
- Catégories de services : `categories` et `filterCategoriesHasServices`

### 3.3 Équipe (useTeam)
- `fetchTeamData(booking_id)` → `Shops/{shopId}/Teams`

### 3.4 Avis
- SeeU reviews (si présents) : affichés via composant `Reviews`
- Sinon bascule Google reviews (`google_infos`)
- Choix auto au chargement : si SeeU existe → SeeU, sinon Google (state `isGoogleReviews`)

### 3.5 Nearby / Highlights
- Nearby shops : `fetchNearbyShops(shopData)` (si `marketplace=true`)
- Slider `renderTrendingSlider` réutilise `TrendingCard` (exclut le shop courant)

## 4. Affichage principal
- Header : Nom, rating (SeeU/Google), statut d’ouverture (utils date, `isCurrentlyOpen`), adresse.
- Galerie : composant `Gallery` (desktop et mobile).
- Promo codes : liste avec `PromoItem`.
- Services : composant `ServicesCategory` + filtre catégories (si plusieurs catégories).
- Team : composant `Team` (dynamic import).
- Reviews : composant `Reviews` (SeeU) + `GoogleReviews` (choix via toggle auto/manuel).
- About : composant `About`.
- Loyalty : composant `LoyaltyProgram` (si rewards).
- Vidéos : `VideoList` (dynamic import).
- Carte Shop (Card) : infos shop, horaires, etc. (via `Card`, `formatOpeningHours`).
- Boutons : prise de RDV (selon CTA), navigation vers services détaillés.

## 5. Promotions / Options
- `promoCodes` : affichés en slider.
- `promoLabel` : badge sur `TrendingCard` (nearby/highlight).
- `promotionPrice` au niveau des services (affiché avec prix barré).
- `settingCalendar.displaySelectMember` : booléen pour afficher la sélection de membre (utile pour réservation).

## 6. Images / Médias
- `GalleryPictureShop` (tableau ou string) → `Gallery` + `ImageSkeleton`.
- Couverture dans la carte (Card) et les sliders.

## 7. Équipe (Team)
- Chargée via `fetchTeamData`.
- Utilisée dans réservation (select member) si `displaySelectMember` est true.
- Affichée via composant `Team` (dynamic import).

## 8. Avis (Reviews / GoogleReviews)
- Si SeeU reviews existent : `Reviews` prioritaire, Google en option.
- Sinon Google reviews par défaut (`google_infos.rating`, `user_ratings_total`).
- Toggle possible (state `isGoogleReviews`).

## 9. Nearby / Highlights
- Nearby (app/marketplace) : `fetchNearbyShops` avec shopData, rendu slider `renderTrendingSlider`.
- Exclusion du shop courant (booking_id check).
- Type affiché via `categoriesList` (mapping shopType.id → label lang).

## 12. Pop-up promo codes & Team (détails UX)
- Pop-up promo codes : affiche le détail du code promo (réduction, conditions) issu de `promoCodes` du shop.
- Team members : chargés via `fetchTeamData`; affichés dans le composant Team et utilisés pour la sélection de membre (si `settingCalendar.displaySelectMember`).

## 13. Structures de données (services, catégories, team)
### 13.1 Services (`ServiceType`)
- Champs principaux : `id`, `name`, `description`, `duration`, `durationText`, `price`, `promotionPrice?`, `categoryId`, `priority?`, `people?`, `pictureUrl?`, `loyaltyPoint?`.
- Localisation : `title_service?[lang].text`, `description_service?[lang].text`.
- Options (`serviceOptions` : `ServiceOption`) : `id`, `name`, `duration`, `durationText`, `price`, `promotionPrice?`, `isPromotion?`, `isSelected?`, `originalPrice?`.
- Add-ons (`serviceAddons` : `ServiceAddOn`) : `id`, `duration`, `durationText`, `price`, `promotionPrice?`, `maxQuantity?`, `quantity`, `name[lang].text`, `description?[lang].text`.

### 13.2 Catégories de services (`CategoryType`)
- Champs : `id`, `categoryName`, `color`, `Description`, `priority`, `title?[lang].text`.
- Groupement : `ServiceCategoryType` = { category: CategoryType; services: ServiceType[]; lang; guestController }.
- Filtre : `filterCategoriesHasServices(categories, services)` pour n’afficher que les catégories ayant des services.

### 13.3 Team members (interface dans types de services/Team)
- Import `TeamMemberType` depuis `PageServices/controllers/types` (même module).
- Champs usuels (non exhaustif dans ce doc) : `id`, `first_name/last_name`, `email?`, `phone?`, `picture?`, disponibilités (plages horaires par jour), rôle, etc. (dépend du modèle Firestore Teams).
- Utilisation : sélection de membre pour les services (si `displaySelectMember`), affichage dans le composant Team.

### 13.4 Calendar settings (Shop.settingCalendar)
Champs présents dans `Shop` (context `useShop`, interface `Shop` dans `PageProfile/types`) :
- `interval_minutes` : granularité des créneaux
- `timeZone` : timezone du shop
- `advancedNotice` : préavis minimal avant réservation
- `deposit_refund_deadline_hours` : délai de remboursement dépôt
- `sendBookingEmailToSpecificEmail` : bool (envoi à email spécifique)
- `emailNewBooking` : email cible si option activée
- `deposit_discount_amount` : montant remisé sur dépôt
- `deposit_percentage` : pourcentage de dépôt
- `deposit_enabled` : bool, dépôt actif
- `displaySelectMember` : bool, afficher sélection de membre
- `sendBookingEmailToMember` : bool, envoyer email au membre affecté
- `hideAtVenue` : bool, masque certains éléments sur place
- `priceRange` : fourchette de prix affichée
- `forceMemberSelection` : bool, forcer le choix de membre
- `displaySelectMemberAutoOpen` : bool, auto-ouverture de la sélection

### 13.5 Opening hours (horaires d’ouverture)
- Dans `Shop` : champs `monday`… `sunday` (tableaux d’horaires strings paire début/fin, ex: `["09:00","18:00","19:00","22:00"]`).
- Format : paires start/end (doivent être en nombre pair). Utilitaires :
  - `formatOpeningHours(shopData?.[day])` pour afficher.
  - `isCurrentlyOpen(shopData)` (depuis `Card`) pour savoir si ouvert et jusqu’à quelle heure :
    - Parse les paires horaires du jour courant.
    - Compare l’heure locale (ou timezone shop si gérée en amont) pour renvoyer `{ isOpen, endTime, nextDayName, startTime }`.
- Génération pour l’affichage :
  ```ts
  const openingHours = DAYS_OF_WEEK.map(day => ({
    day: capitalize(day),
    hours: formatOpeningHours(shopData?.[day]),
  }));
  ```
- Si un jour n’a pas d’horaires (tableau vide ou undefined) → considéré fermé ce jour-là.

## 10. Index / Firestore (rappels)
- Shop par booking_id : index simple sur `booking_id` (Shops).
- Services : sous-collection `Services` (pas d’index composite nécessaire pour `featured == true`).
- Teams : sous-collection `Teams` (pas d’index composite nécessaire).
- Promo codes / loyalty / reviews : sous-collections du shop (vérifier selon structures propres).

## 11. Points à porter dans une autre app React
- Reproduire les appels parallèles init : shop + services + team + recentlyViewed.
- Bascule auto des reviews (SeeU vs Google) selon présence de reviews SeeU.
- Rendu :
  - Galerie + Vidéos
  - Header (status open/close via horaires)
  - Services par catégories, avec prix promo
  - Team (optionnel), Reviews, About, Loyalty, Promo codes
  - Nearby slider (exclure shop courant)
- Utilitaires :
  - `isCurrentlyOpen`, `formatOpeningHours` (dateUtils)
  - `categoriesList` pour traduire le type
  - `getCFImageUrl` pour optimisation images

**Dernière mise à jour : 2025-01-21**

