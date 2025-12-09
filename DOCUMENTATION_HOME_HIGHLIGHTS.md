# 📚 Documentation – Highlights Home Page

## 1. Vue d’ensemble
La Home Page affiche plusieurs sections de “highlights” construites à partir des shops. Les données sont chargées en deux requêtes Firestore parallèles puis filtrées par type :
- Promotions (`promotion.doubleDay === true`)
- Highlights (`highlight.isActive === true`) avec sous-types : Trending, Nail studio, Massage salon, Hair salon.

## 2. Chargement des données
**Fichier :** `src/components/PageHome/HomePage.tsx`

```ts
const q1 = query(collection(db, "Shops"), where("highlight.isActive", "==", true));
const q2 = query(collection(db, "Shops"), where("promotion.doubleDay", "==", true));

const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
// fusion sans doublons
const map = new Map();
[...snap1.docs, ...snap2.docs].forEach(d => map.set(d.id, d));
const shops = Array.from(map.values()).map(d => ({ id: d.id, ...d.data() }));
```
- Aucune requête composite : deux filtres d’égalité simples (`highlight.isActive`, `promotion.doubleDay`).
- Déduplication par ID avant filtrage par type.

## 3. Sections et filtres
Après fusion, on filtre en mémoire :
- `highlight_promotion` : `shop?.promotion?.doubleDay`
- `highlight_trending` : `shop?.highlight?.type === "Trending"`
- `highlight_nail_studio` : `shop?.highlight?.type === "Nail studio"`
- `highlight_massage_salon` : `shop?.highlight?.type === "Massage salon"`
- `highlight_hair_salon` : `shop?.highlight?.type === "Hair salon"`

Chaque section est rendue via `renderTrendingSlider` (slider horizontal avec boutons desktop et scroll).

## 4. Affichage et UX
- Composant carte : `TrendingCard` (image, rating, adresse, badge type, promoLabel).
- Skeletons : `TrendingCardSkeleton` (affiché quand `loadingHighlight` est true).
- Boutons scroll (desktop) et snap horizontal (`overflow-x-auto`, `scroll-smooth`) pour mobile.
- Condition d’affichage : la section s’affiche si `loadingHighlight` ou si la liste filtrée est non vide.

## 5. Champs Firestore requis côté Shop
- `highlight.isActive` : boolean
- `highlight.type` : string parmi `"Trending" | "Nail studio" | "Massage salon" | "Hair salon" | ...`
- `promotion.doubleDay` : boolean
- (général) `booking_id`, `shopName`, `shopType`, `gallery/cover image`, `google_infos.rating/user_ratings_total`, `neighborhood` (adresse), `promoLabel` (facultatif).

## 6. Index Firestore
- Pas d’index composite requis pour ces deux requêtes (égalité simple).
- Vérifier que des index simples existent par Firestore par défaut sur `highlight.isActive` et `promotion.doubleDay`.

## 7. Points à porter dans une app React
- Reprendre les deux requêtes Firestore en parallèle.
- Fusion/déduplication avant filtrage par type.
- Appliquer les mêmes filtres de sous-types (`highlight.type`) et de promotion (`promotion.doubleDay`).
- Réutiliser le composant carte (ou équivalent) et le slider horizontal.
- Prévoir un skeleton lors du chargement.

**Dernière mise à jour : 2025-01-21**

