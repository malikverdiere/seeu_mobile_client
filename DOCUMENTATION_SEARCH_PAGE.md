# 📚 Documentation – Search Page (Next/React)  

## 1. Vue d’ensemble
- Page : `src/components/PageSearch/SearchPage.tsx`
- Contrôleur : `src/components/PageSearch/controllers/searchPageController.ts`
- Objectif : lister les shops d’une catégorie (`/lang/:category/search`) avec bannières, filtres et pagination “Load more”.

## 2. Paramètres et filtres
- URL params : `:lang`, `:category` (slug ex: `beauty`)
- Query params : `category` (sous-catégorie ou `all`), `date`, `lat`, `lng`, `promoCode`, `doubleDay`, `newClient`, `utm_source`
- Conversion catégorie → type numérique : `shopCategoryType(category)` (beauty→1, fitness→2, …)
- Objet `filters` passé au contrôleur : `{ category, categoryType, date, lat, lng, promoCode, doubleDay, newClient }`

## 3. Cycle de données (SearchPage)
1) `searchBanners()` → récupère les bannières (category, isActive, orderBy priority)
2) `loadInitialShops()` :
   - `controller.resetPagination()`
   - En parallèle : `getShops(limit, filters)` et `getCountShops(filters)`
   - Met à jour : `shops`, `hasMore`, `countShops`
3) `loadMoreShops()` :
   - Même requête `getShops` + `getCountShops`
   - Append des nouveaux shops, MAJ `hasMore`
4) Tracking UTM via `useSessionTracking`

## 4. Requêtes Firestore (SearchPageController)
### 4.1 getShops(limit, filters, radiusKm=20)
- Base constraints :
  - `where('shopValid', '==', true)`
  - `where('booking_id', '!=', null)`
  - `where('shopType.type', '==', filters.categoryType)`
  - `where('shop_type', 'array-contains', filters.category)`
- Filtres optionnels :
  - `date` → `where(dayName, '>', [])` (le shop a des horaires ce jour)
  - `promoCode` → `where('promotion.code', '==', true)`
  - `doubleDay` → `where('promotion.doubleDay', '==', true)`
  - `newClient` → `where('promotion.newClient', '==', true)`
- Mode GEO (si lat/lng) :
  - Bounds geohash via `geofire.geohashQueryBounds`
  - `orderBy('adPosition','asc')`, `orderBy('coordinate.geohash')`, geohash min/max
  - Fusion/déduplication + tri distance (_dist), pagination côté client
- Mode RATING (sinon GEO) :
  - `orderBy('adPosition','asc')`
  - `orderBy('google_infos.user_ratings_total','desc')`
  - Pagination serveur avec `startAfter(lastRate)`

### 4.2 getCountShops(filters, radiusKm=20)
- Même contraintes que `getShops`
- Mode GEO : boucle sur bounds geohash et déduplication
- Mode non GEO : `orderBy('adPosition','asc')`, `snap.size`

### 4.3 Bannières
- `getSearchBanners(category)` :
  - `where('category','==',category)`
  - `where('isActive','==',true)`
  - `orderBy('priority','asc')`
- `trackBannerClick(bannerId)` : `updateDoc` countClick++, lastClick

### 4.4 Ads / Services utilitaires
- `getAdShops(filters)` : shops sponsorisés (`adPosition` asc) avec mêmes contraintes
- `getServicesByShopId(shopId)` : `Shops/{shopId}/Services` where `featured == true`
- Helpers : `filterOut`, `resetPagination`

## 5. Affichage (SearchPage)
- **Navbar**, puis **Carousel bannières** (autoplay, dots). Image responsive : mobile 400x90, desktop 1248x90 (via `getCFImageUrl`), clic → track + redirect.
- **FilterBar** (UI) – hook de filtres non détaillé ici.
- **Compteur** : `{countShops} shops nearby`
- **Grille** : `ShopItem` cartes (3 colonnes desktop, 1 mobile) :
  - props : `shop`, `lang`, `category`, `currentLocation {lat,lng}`, `customItemLink="/{lang}/{category}/{booking_id}?marketplace=true&utm_source=..."`
- **Load more** : bouton si `hasMore`, sinon message “All shops loaded”.
- Skeletons : `ShopItemSkeleton` (12 éléments) et `BannersSkeleton`.

## 6. Index Firestore à prévoir
- **SearchBanners** (obligatoire) : `category ASC`, `isActive ASC`, `priority ASC`.
- **Shops** (selon filtres) – typiquement :
  - `shop_type` array-contains + `shopType.type` (+ optionnel `shopValid`, `adPosition`, `google_infos.user_ratings_total`)
  - Si filtrage date : champs de jour (monday, tuesday, …) > []
  - `booking_id` (égalité) : index simple auto
  - Si GEO : `coordinate.geohash` + `adPosition` (ordre)

## 7. Adaptation à une app React (non Next)
- Reprendre la logique du contrôleur en services JS/TS :
  - `getShops`, `getCountShops`, `getSearchBanners`, `trackBannerClick`, `getAdShops`
  - Copier l’objet `filters` et `shopCategoryType` (depuis `categories.ts`)
- Gérer la pagination :
  - Mode RATING : conserver `lastRate` (curseur)
  - Mode GEO : fusion/déduplication client, pas de curseur serveur
- Recréer les composants :
  - Carousel bannières + tracking clic
  - Grille de cartes `ShopItem`
  - Bouton “Load more”
  - Skeletons de chargement
- Prévoir les index dans le projet Firebase cible.

## 8. Résumé express
- Filtres : `category` (array-contains) + `shopType.type` + options (date, promo, doubleDay, newClient).
- Deux modes getShops : GEO (geohash + distance) ou RATING (adPosition + reviews).
- Bannières : `category & isActive`, tri priority, index composite requis.
- Pagination : curseur Firestore (rating) ou client (geo).
- UI : Carousel bannières, FilterBar, grille ShopItem, load more, skeletons.

**Dernière mise à jour : 2025-01-21**

