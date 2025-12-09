# :books: Documentation – Requêtes Firestore Search Page (code exact)
## 1. Initialisation (mount)
- Appels déclenchés au montage dans `SearchPage.tsx` :
  ```ts
  useEffect(() => { searchBanners(); }, []);
  useEffect(() => { loadInitialShops(); }, [loadInitialShops]);
  ```
- Filters construits depuis params/query :
  ```ts
  const filters = {
    category: categorySearch,   // query param ?category=... ou ‘all’
    categoryType,               // shopCategoryType(category)
    date,
    lat, lng,
    promoCode,
    doubleDay,
    newClient,
  };
  ```
## 2. Requête bannières
```ts
// searchPageController.ts
const searchBannersRef = collection(db, ‘SearchBanners’);
const constraints = [
  where(‘category’, ‘==’, category),
  where(‘isActive’, ‘==’, true),
  orderBy(‘priority’, ‘asc’),
];
const querySnapshot = await getDocs(query(searchBannersRef, ...constraints));
return querySnapshot.docs.map(doc => doc.data() as SearchBannerProps);
```
## 3. Requête shops (getShops)
```ts
// searchPageController.ts
const shopsRef = collection(db, ‘Shops’);
const constraints: any[] = [
  where(‘shopValid’, ‘==’, true),
  where(‘booking_id’, ‘!=’, null),
  where(‘shopType.type’, ‘==’, filters.categoryType),
  where(‘shop_type’, ‘array-contains’, filters.category),
];
// Filtres optionnels
if (filters.date) {
  const dayOfWeek = (new Date(filters.date as string).getDay() + 6) % 7;
  const dayName = DAYS_OF_WEEK[dayOfWeek];
  constraints.push(where(dayName, ‘>’, []));
}
if (filters.promoCode)   constraints.push(where(‘promotion.code’, ‘==’, true));
if (filters.doubleDay)   constraints.push(where(‘promotion.doubleDay’, ‘==’, true));
if (filters.newClient)   constraints.push(where(‘promotion.newClient’, ‘==’, true));
```
### 3.1 Mode GEO (lat/lng fournis)
```ts
const bounds = geofire.geohashQueryBounds([filters.lat, filters.lng], radiusKm * 1000);
const promises = bounds.map(([min, max]) =>
  getDocs(query(
    shopsRef,
    ...constraints,
    orderBy(‘adPosition’, ‘asc’),
    orderBy(‘coordinate.geohash’),
    where(‘coordinate.geohash’, ‘>=’, min),
    where(‘coordinate.geohash’, ‘<=’, max),
  ))
);
const snaps = await Promise.all(promises);
// fusion, déduplication, tri distance client-side, pagination client
```
### 3.2 Mode RATING (sans GEO)
```ts
const rateConstraints = [
  ...constraints,
  orderBy(‘adPosition’, ‘asc’),
  orderBy(‘google_infos.user_ratings_total’, ‘desc’),
];
if (this.lastRate) rateConstraints.push(startAfter(this.lastRate));
rateConstraints.push(limit(limitCount));
const snap = await getDocs(query(shopsRef, ...rateConstraints));
const shops = snap.docs.map(d => ({ id: d.id, ...d.data() }));
const lastVis = snap.docs.at(-1) ?? null;
this.lastRate = lastVis; this.lastGeo = null;
hasMore = shops.length === limitCount;
```
## 4. Compteur de shops (getCountShops)
Même contraintes que `getShops`.
- GEO : loop sur bounds geohash, déduplication, distance <= radius.
- Sinon : `getDocs(query(shopsRef, ...constraints, orderBy(‘adPosition’,‘asc’)))`, puis `snap.size`.
## 5. Load More
`loadMoreShops` ré-appelle `getShops(limit, filters)` + `getCountShops(filters)` puis concatène.
- En mode RATING : pagination serveur via `startAfter(this.lastRate)`.
- En mode GEO : pagination client (slice).
## 6. Services d’un shop (services dropdown dans les cartes)
```ts
// searchPageController.ts
const servicesRef = collection(db, ‘Shops’, shopId, ‘Services’);
const q = query(servicesRef, where(‘featured’, ‘==’, true));
const querySnapshot = await getDocs(q);
return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```
## 7. Ads (shops sponsorisés)
```ts
const constraints = [
  where(‘shopValid’, ‘==’, true),
  where(‘adPosition’, ‘!=’, null),
  where(‘shopType.type’, ‘==’, filters.categoryType),
  where(‘shop_type’, ‘array-contains’, filters.category),
  orderBy(‘adPosition’, ‘asc’),
];
const withAdSnap = await getDocs(query(shopsRef, ...constraints));
```
## 8. Index Firestore à créer/valider
- SearchBanners : `category ASC`, `isActive ASC`, `priority ASC`.
- Shops (selon filtres) :
  - `shop_type` (array-contains) + `shopType.type` (+ optionnels `shopValid`, `adPosition`, `google_infos.user_ratings_total`).
  - Si date : champs jour (monday… sunday) > [].
  - GEO : `adPosition` + `coordinate.geohash` (orderBy + where geohash).
  - `booking_id` (égalité) : index simple auto.
## 9. Résumé express
- Initial load : `getShops + getCountShops` (contraintes ci-dessus), `getSearchBanners`.
- Load more : même `getShops` avec curseur (rating) ou pagination client (geo).
- Services dropdown sur les cartes : `Shops/{shopId}/Services` where `featured == true`.
- Ads : shops avec `adPosition` et mêmes filtres catégorie.
## 10. Cas sans lat/lng (mode RATING uniquement)
- Seul le mode RATING est exécuté (aucun geohash, aucun tri distance).
- Requête `getShops` :
  ```ts
  const constraints = [
    where(“shopValid”, “==“, true),
    where(“booking_id”, “!=“, null),
    where(“shopType.type”, “==“, filters.categoryType),
    where(“shop_type”, “array-contains”, filters.category),
    // optionnels :
    // if (filters.date)        where(dayName, “>”, [])
    // if (filters.promoCode)   where(“promotion.code”, “==“, true)
    // if (filters.doubleDay)   where(“promotion.doubleDay”, “==“, true)
    // if (filters.newClient)   where(“promotion.newClient”, “==“, true)
  ];
  const rateConstraints = [
    ...constraints,
    orderBy(“adPosition”, “asc”),
    orderBy(“google_infos.user_ratings_total”, “desc”),
  ];
  if (this.lastRate) rateConstraints.push(startAfter(this.lastRate));
  rateConstraints.push(limit(limitCount));
  const snap = await getDocs(query(shopsRef, ...rateConstraints));
  ```
- Requête `getCountShops` (non-GEO) :
  ```ts
  const snap = await getDocs(
    query(shopsRef, ...constraints, orderBy(“adPosition”,“asc”))
  );
  const count = snap.size;
  ```
- `loadMoreShops` réutilise exactement `getShops` ci-dessus + `getCountShops`.
## 11. Explication simple (pourquoi adPosition quand pas de GEO ?)
- Si on n’a pas ta position (pas de lat/lng), on ne peut pas trier par distance.
- Du coup on trie d’abord par `adPosition` (les shops sponsorisés ou poussés en premier), puis par le nombre d’avis Google (`google_infos.user_ratings_total`) pour le reste.
- Les shops sans adPosition ne sont pas filtrés : ils apparaissent après ceux qui en ont, classés par nombre d’avis.
- Dès que lat/lng sont fournis, on bascule en mode GEO : on utilise la distance (geohash) et on ignore ce tri “adPosition + avis”.
**Dernière mise à jour : 2025-01-21**


Jot something down









