# 📚 Documentation – Traductions Search Page & Filtres Services

## 1. Clés de traduction (Search Page)
Chemins : `SearchPage.tsx`, `ShopItem.tsx`, `FilterBar.tsx`.

- `shops nearby` (compteur des shops)
- `Loading...` (bouton Load more en cours)
- `Load more...` (bouton pagination)
- `All shops have been loaded` (fin de pagination)
- `No shop found` (aucun résultat)
- `From` (prix service “From …”)
- `Make an appointment` (CTA sur la carte ShopItem)

## 2. Filtres (FilterBar)
- `All services` (libellé du dropdown service ; l’item par défaut aussi)
- `Near me` (bouton localisation)
- `Have promo code` (filtre promo)
- `sales` (pour le badge “🔥 {MM}.{MM} sales”)
- `New client` (filtre client nouveau – actuellement commenté)

## 3. Services affichés dans les cartes (ShopItem)
- `From` (clé vue plus haut)
- Prix barré et promo : pas de clé dédiée, juste formatage numérique.
- Bouton CTA : `Make an appointment`

## 4. Bannières (SearchPage)
- Images et URLs ; pas de clé de traduction spécifique, mais redirections et tracking :
  - `banner_click` (événement de tracking)

## 5. Rappels d’implémentation
- Le composant `Traductor` est utilisé pour les clés ci-dessus ; aucune autre clé n’est cachée côté Search page/filtres/services.
- Les labels de services dans le dropdown sont pris depuis `categoriesByType(category)` → `service.name?.[lang]`.
- Les titres de services dans la carte viennent de `service.title_service?.[lang]?.text`.

## 6. Requêtes Firestore utilisées (Search)
**Fichier :** `searchPageController.ts`

- `getShops(limit, filters)` :  
  - where `shopValid == true`  
  - where `booking_id != null`  
  - where `shopType.type == filters.categoryType`  
  - where `shop_type array-contains filters.category`  
  - optionnels : date (dayName > []), promoCode (promotion.code == true), doubleDay (promotion.doubleDay == true), newClient (promotion.newClient == true)  
  - mode GEO : geohash bounds + orderBy adPosition + geohash, fusion/déduplication + tri distance  
  - mode RATING : orderBy adPosition asc, orderBy google_infos.user_ratings_total desc, pagination startAfter(lastRate)

- `getCountShops(filters)` : mêmes contraintes que `getShops`, compte (mode GEO : déduplication, sinon count simple).

- `getSearchBanners(category)` : where category == category, isActive == true, orderBy priority asc.

- `trackBannerClick` : update countClick + lastClick sur `SearchBanners/{id}`.

- `getAdShops(filters)` : shops sponsorisés (adPosition asc) avec mêmes contraintes category/shop_type.

- `getServicesByShopId(shopId)` : `Shops/{shopId}/Services` where featured == true.

## 7. Index Firestore (Search)
- SearchBanners (obligatoire) : category ASC, isActive ASC, priority ASC.
- Shops : selon filtres combinés (shop_type array-contains + shopType.type + éventuellement shopValid/adPosition/google_infos.user_ratings_total).  
  - `booking_id` égalité → index simple auto.  
  - Si date : dayName > [] (un index simple par champ jour suffit en général).  
  - Si GEO : orderBy adPosition + coordinate.geohash + geohash bounds (prévoir index adPosition + coordinate.geohash).

**Dernière mise à jour : 2025-01-21**

