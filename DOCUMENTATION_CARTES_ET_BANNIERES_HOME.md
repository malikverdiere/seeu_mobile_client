# 📚 Documentation - Affichage des Cartes et Bannières sur la Home Page

## 📋 Table des matières
1. [Vue d'ensemble](#1-vue-densemble)
2. [Affichage des Cartes (TrendingCard)](#2-affichage-des-cartes-trendingcard)
3. [Affichage des Bannières](#3-affichage-des-bannières)
4. [Sections de la Home Page](#4-sections-de-la-home-page)
5. [Système de Chargement (Skeletons)](#5-système-de-chargement-skeletons)
6. [Système de Scroll Horizontal](#6-système-de-scroll-horizontal)
7. [Requêtes de Données](#7-requêtes-de-données)

---

## 1. Vue d'ensemble

La home page (`HomePage.tsx`) affiche plusieurs sections avec des cartes de shops et des bannières promotionnelles. L'affichage est conditionnel selon le chargement des données et utilise des skeletons pendant le chargement.

**Structure de la page :**
```
Hero Section (SearchBar)
    ↓
Banner Section 1
    ↓
Section Promotions (cartes)
    ↓
Section Recently Viewed (cartes)
    ↓
Banner Section 2
    ↓
Section Massage Salon (cartes)
    ↓
Section Nail Studio (cartes)
    ↓
Banner Section 3
    ↓
Section Hair Salon (cartes)
    ↓
Section Trending (cartes)
```

---

## 2. Affichage des Cartes (TrendingCard)

### 2.1 Composant TrendingCard

**Fichier :** `src/components/PageHome/TrendingCard.tsx`

**Props :**
```typescript
interface TrendingCardProps {
    urlFrom: string;        // URL de base (ex: "en/beauty")
    id: string;             // booking_id du shop
    name: string;           // Nom du shop
    rating: number;         // Note Google
    reviewCount: number;    // Nombre d'avis
    type: string;           // Type de shop traduit (ex: "Hair salon")
    imageUrl: string;       // URL de l'image principale
    address: string;        // Adresse du shop
    lang: string;           // Langue (en/th/fr)
    city: string;           // Ville
    category: string;       // Catégorie (beauty/fitness/etc.)
    promoLabel: string;     // Label promotionnel (ex: "50% OFF")
}
```

### 2.2 Structure de la Carte

```typescript
<div className="group flex flex-col h-full bg-white shadow-sm hover:shadow-md rounded-2xl border border-gray-200 cursor-pointer">
    {/* 1. PromoLabel (si présent) */}
    <PromoLabel text={promoLabel} />
    
    {/* 2. Image */}
    <div className="relative aspect-[2/1]">
        <ImageSkeleton
            src={getCFImageUrl(imageUrl, 300)}
            alt={`${name} ${city} ${type} - SeeU ${category}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-all duration-500"
        />
    </div>
    
    {/* 3. Contenu */}
    <div className="p-4 flex flex-col flex-grow">
        {/* Nom */}
        <h3>{name}</h3>
        
        {/* Rating et Reviews */}
        <div>
            {rating} ★ ({reviewCount} Reviews)
        </div>
        
        {/* Adresse */}
        <p>{address}</p>
        
        {/* Type (badge) */}
        <p className="border border-gray-200 inline-block px-2 py-1 rounded-full">
            {type}
        </p>
    </div>
</div>
```

### 2.3 Comportement au Clic

```typescript
const onPress = () => {
    window.open(`/${urlFrom}/${id}`, "_self");
};
```

Redirige vers la page du shop : `/{lang}/{category}/{booking_id}`

### 2.4 Composant PromoLabel

**Fichier :** `src/components/PageHome/PromoLabel.tsx`

Affiche un badge promotionnel en haut à gauche de la carte si `promoLabel` est défini.

```typescript
if (!text) return null;

return (
    <div className="absolute top-3 left-3 bg-primary-color text-white text-xs font-normal py-1.5 px-4 rounded-[10px] z-10">
        {text}
    </div>
);
```

### 2.5 Optimisation des Images

Les images utilisent `getCFImageUrl()` pour optimiser via Cloudflare :
- **Mobile :** Largeur 300px, qualité 90%
- **Responsive :** Tailles adaptatives selon la largeur d'écran
- **Lazy loading :** `priority={false}` par défaut

---

## 3. Affichage des Bannières

### 3.1 Récupération des Bannières

**Fichier :** `src/components/PageSearch/controllers/searchPageController.ts`

```typescript
async getSearchBanners(category: string): Promise<SearchBannerProps[]> {
    const searchBannersRef = collection(db, 'SearchBanners');
    const constraints: any[] = [
        where('category', '==', category),
        where('isActive', '==', true),
        orderBy('priority', 'asc'),
    ];
    const querySnapshot = await getDocs(query(searchBannersRef, ...constraints));
    return querySnapshot.docs.map((doc) => doc.data() as SearchBannerProps);
}
```

**Collection Firestore :** `SearchBanners`

**Filtres :**
- `category` : Correspond à la catégorie de la page (ex: "beauty")
- `isActive` : Seulement les bannières actives
- `priority` : Tri par priorité croissante

### 3.2 Structure d'une Bannière

```typescript
interface SearchBannerProps {
    id: string;
    category: string;
    isActive: boolean;
    priority: number;
    shopId: string | null;
    countClick: number;
    banner: {
        [lang: string]: {  // "en" | "th" | "fr"
            url: {
                desktop: string;   // URL image desktop
                mobile: string;    // URL image mobile
                redirect: string;  // URL de redirection au clic
            };
        };
    };
}
```

### 3.3 Affichage d'une Bannière

**Fichier :** `HomePage.tsx` (lignes 319-344, 387-412, 462-487)

```typescript
{bannersLoading ? (
    <BannersSkeleton />
) : (
    banner_section_1 && (
        <div className="relative max-w-7xl mx-auto mb-10">
            <a
                href="#"
                onClick={(e) => {
                    e.preventDefault();
                    // Tracking
                    trackPageAction('home_banner_click', { banner_id: banner_section_1.id });
                    homePageController.trackBannerClick(banner_section_1.id);
                    // Redirection
                    window.open(
                        banner_section_1.banner[lang]?.url?.redirect,
                        '_blank',
                        'noopener,noreferrer'
                    );
                }}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full h-full"
            >
                <img
                    src={isMobile 
                        ? getCFImageUrl(banner_section_1.banner[lang]?.url?.mobile, 400, 90)
                        : getCFImageUrl(banner_section_1.banner[lang]?.url?.desktop, 1248, 90)
                    }
                    alt={`banner-${banner_section_1.id}`}
                    width={isMobile ? 800 : 3200}
                    height={isMobile ? 800 : 900}
                    className="rounded-3xl"
                />
            </a>
        </div>
    )
)}
```

### 3.4 Positionnement des Bannières

Les bannières sont réparties en 3 positions :
- **Banner Section 1** : `banners[0]` - Après le Hero, avant Promotions
- **Banner Section 2** : `banners[1]` - Après Recently Viewed, avant Massage Salon
- **Banner Section 3** : `banners[2]` - Après Nail Studio, avant Hair Salon

### 3.5 Tracking des Clics

```typescript
// Tracking analytics
trackPageAction('home_banner_click', { banner_id: banner_section_1.id });

// Mise à jour Firestore
homePageController.trackBannerClick(banner_section_1.id);
// → Incrémente countClick et met à jour lastClick
```

### 3.6 Images Responsives

- **Mobile :** `banner[lang].url.mobile` → Optimisé 400px, qualité 90%
- **Desktop :** `banner[lang].url.desktop` → Optimisé 1248px, qualité 90%
- **Dimensions :** 800×800 (mobile) / 3200×900 (desktop)

---

## 4. Sections de la Home Page

### 4.1 Section Promotions

**Filtre :** `shop.promotion.doubleDay === true`

```typescript
const highlight_promotion = highlightShops.filter(
    (shop: any) => shop?.promotion?.doubleDay
);
```

**Affichage :**
```typescript
{(loadingHighlight || highlight_promotion.length > 0) && (
    <section className="mb-12">
        <h2>Up to 50% off 🔥</h2>
        <div className="relative">
            {loadingHighlight ? (
                renderTrendingSkeleton()
            ) : (
                renderTrendingSlider(highlight_promotion, "promotion-slider")
            )}
        </div>
    </section>
)}
```

### 4.2 Section Recently Viewed

**Source :** Hook `useRecentlyViewed()` qui stocke les `booking_id` visités

```typescript
const { recentlyViewed } = useRecentlyViewed();
const [recentShops, setRecentShops] = useState<any[]>([]);
const [loadingRecent, setLoadingRecent] = useState(true);
```

**Récupération :**
```typescript
const fetchRecentShops = async () => {
    if (recentlyViewed.length === 0) {
        setLoadingRecent(false);
        return;
    }

    const shopsRef = collection(db, "Shops");
    const promises = recentlyViewed.map(async (booking_id) => {
        const q = query(shopsRef, where("booking_id", "==", booking_id));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            return {
                id: snapshot.docs[0].id,
                ...snapshot.docs[0].data()
            };
        }
        return null;
    });

    const shops = (await Promise.all(promises)).filter(shop => shop !== null);
    setRecentShops(shops);
};
```

**Affichage :**
```typescript
{(loadingRecent || recentShops.length > 0) && (
    <section className="mb-12">
        <h2>Recently viewed</h2>
        <div className="relative min-h-[300px]">
            {loadingRecent ? (
                renderTrendingSkeleton()
            ) : (
                renderTrendingSlider(recentShops, "recently-viewed-slider")
            )}
        </div>
    </section>
)}
```

### 4.3 Sections par Type de Shop

Toutes les sections suivantes utilisent le même pattern :

**Massage Salon :**
```typescript
const highlight_massage_salon = highlightShops.filter(
    (shop: any) => shop?.highlight?.type === "Massage salon"
);
```

**Nail Studio :**
```typescript
const highlight_nail_studio = highlightShops.filter(
    (shop: any) => shop?.highlight?.type === "Nail studio"
);
```

**Hair Salon :**
```typescript
const highlight_hair_salon = highlightShops.filter(
    (shop: any) => shop?.highlight?.type === "Hair salon"
);
```

**Trending :**
```typescript
const highlight_trending = highlightShops.filter(
    (shop: any) => shop?.highlight?.type === "Trending"
);
```

### 4.4 Récupération des Highlight Shops

```typescript
const fetchHighlightShops = async () => {
    // Requêtes parallèles
    const q1 = query(
        collection(db, "Shops"),
        where("highlight.isActive", "==", true)
    );
    const q2 = query(
        collection(db, "Shops"),
        where("promotion.doubleDay", "==", true)
    );

    const [snap1, snap2] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
    ]);

    // Fusion sans doublons
    const map = new Map();
    [...snap1.docs, ...snap2.docs].forEach(d => map.set(d.id, d));
    const shops = Array.from(map.values()).map(d => ({
        id: d.id,
        ...d.data()
    }));

    setHighlightShops(shops);
};
```

**Optimisation :** Les requêtes sont parallélisées pour améliorer le LCP (Largest Contentful Paint).

---

## 5. Système de Chargement (Skeletons)

### 5.1 TrendingCardSkeleton

**Fichier :** `src/components/PageHome/TrendingCardSkeleton.tsx`

Affiche un placeholder animé pendant le chargement des cartes.

```typescript
<div className="block bg-white shadow-sm rounded-2xl border border-gray-200">
    {/* Image skeleton */}
    <div className="relative aspect-[2/1]">
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
    </div>
    
    <div className="p-4">
        {/* Titre skeleton */}
        <div className="h-6 w-3/4 bg-gray-200 rounded-lg animate-pulse mb-2" />
        
        {/* Rating skeleton */}
        <div className="flex items-center gap-2 mt-1">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
        
        {/* Adresse skeleton */}
        <div className="h-3 w-full bg-gray-200 rounded animate-pulse mt-2" />
        
        {/* Type skeleton */}
        <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse mt-4" />
    </div>
</div>
```

**Utilisation :**
```typescript
const renderTrendingSkeleton = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, index) => (
                <TrendingCardSkeleton key={index} />
            ))}
        </div>
    );
};
```

### 5.2 BannersSkeleton

**Fichier :** `src/components/PageSearch/skeletons/BannersSkeleton.tsx`

Affiche un placeholder pour les bannières.

```typescript
<div className="relative max-w-7xl mx-auto mb-10 animate-pulse">
    <div className="mx-4">
        <div className="relative w-full overflow-hidden rounded-3xl bg-gray-200">
            <div
                className="w-full"
                style={{
                    paddingBottom: isMobile ? '100%' : '28.125%',
                }}
            />
            {/* Dots indicator skeleton */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-gray-300" />
                ))}
            </div>
        </div>
    </div>
</div>
```

### 5.3 États de Chargement

**Variables d'état :**
- `loadingRecent` : Chargement des shops récemment vus
- `loadingHighlight` : Chargement des highlight shops
- `bannersLoading` : Chargement des bannières

**Logique d'affichage :**
```typescript
{loadingHighlight ? (
    renderTrendingSkeleton()
) : (
    renderTrendingSlider(shops, "slider-id")
)}
```

---

## 6. Système de Scroll Horizontal

### 6.1 Fonction handleScroll

**Fichier :** `HomePage.tsx` (lignes 167-192)

```typescript
const handleScroll = (direction: 'left' | 'right', containerId: string) => {
    const container = document.getElementById(containerId);
    const items = container?.getElementsByClassName('flex-shrink-0');
    
    if (container && items?.length) {
        const containerWidth = container.clientWidth;
        const itemWidth = items[0].clientWidth;
        const itemWidthAndGap = itemWidth + itemGap; // itemGap = 32px

        // Calcul du nombre d'éléments à scroller selon la largeur
        let itemsToScroll;
        if (containerWidth >= 1024) {      // lg breakpoint
            itemsToScroll = 4;
        } else if (containerWidth >= 768) { // md breakpoint
            itemsToScroll = 2;
        } else {                            // mobile
            itemsToScroll = 1;
        }

        const scrollDistance = itemWidthAndGap * itemsToScroll;

        container.scrollBy({
            left: direction === 'left' ? -scrollDistance : scrollDistance,
            behavior: 'smooth'
        });
    }
};
```

### 6.2 Structure du Slider

```typescript
const renderTrendingSlider = (shops: any[], id: string) => {
    return (
        <>
            {/* Bouton gauche (desktop uniquement) */}
            <div className="absolute left-0 top-[35%] z-10 hidden md:block">
                <Button
                    variant="outline"
                    className="!p-2 rounded-full z-10 border-0 bg-white"
                    onClick={() => handleScroll('left', id)}
                >
                    <ChevronLeft className="w-5 h-5" />
                </Button>
            </div>

            {/* Container scrollable */}
            <div
                id={id}
                className="flex overflow-x-auto pb-2 scroll-smooth scrollbar-hide snap-x snap-mandatory gap-4 md:gap-8"
            >
                {shops.map((shop) => (
                    <div
                        key={shop?.id}
                        className="flex-shrink-0 w-[70%] md:w-[calc(50%-16px)] lg:w-[calc(25%-24px)]"
                    >
                        <TrendingCard {...props} />
                    </div>
                ))}
            </div>

            {/* Bouton droit (desktop uniquement) */}
            <div className="absolute right-0 top-[35%] z-10 hidden md:block">
                <Button
                    variant="outline"
                    className="!p-2 rounded-full z-10 border-0 bg-white"
                    onClick={() => handleScroll('right', id)}
                >
                    <ChevronRight className="w-5 h-5" />
                </Button>
            </div>
        </>
    );
};
```

### 6.3 Largeurs Responsives

- **Mobile :** `w-[70%]` - 70% de la largeur
- **Tablet (md) :** `w-[calc(50%-16px)]` - 2 cartes visibles
- **Desktop (lg) :** `w-[calc(25%-24px)]` - 4 cartes visibles

### 6.4 Classes CSS Importantes

- `overflow-x-auto` : Scroll horizontal activé
- `scroll-smooth` : Animation fluide
- `scrollbar-hide` : Masque la scrollbar
- `snap-x snap-mandatory` : Snap sur chaque carte
- `flex-shrink-0` : Empêche la réduction des cartes

---

## 7. Requêtes de Données

### 7.1 Cycle de Vie des Données

```typescript
useEffect(() => {
    fetchRecentShops();
}, [recentlyViewed]);

useEffect(() => {
    fetchHighlightShops();
}, []);

useEffect(() => {
    searchBanners();
}, []);
```

### 7.2 Requêtes Firestore

**1. Recent Shops :**
```typescript
Collection: "Shops"
Query: where("booking_id", "==", booking_id)
```

**2. Highlight Shops :**
```typescript
Collection: "Shops"
Query 1: where("highlight.isActive", "==", true)
Query 2: where("promotion.doubleDay", "==", true)
→ Fusion des résultats
```

**3. Banners :**
```typescript
Collection: "SearchBanners"
Query: 
  - where("category", "==", category)
  - where("isActive", "==", true)
  - orderBy("priority", "asc")
```

### 7.3 Gestion des Erreurs

```typescript
try {
    // Requête
} catch (error) {
    showError(traductor("Error fetching...", lang));
} finally {
    setLoading(false);
}
```

---

## 8. Résumé des Points Clés

### Cartes (TrendingCard)
- ✅ Composant réutilisable avec props complètes
- ✅ Image optimisée via Cloudflare
- ✅ Badge promotionnel conditionnel
- ✅ Redirection vers la page shop au clic
- ✅ Responsive avec largeurs adaptatives

### Bannières
- ✅ Récupération depuis Firestore `SearchBanners`
- ✅ Filtrage par catégorie et statut actif
- ✅ Tri par priorité
- ✅ Images responsive (mobile/desktop)
- ✅ Tracking des clics
- ✅ 3 positions fixes sur la page

### Sections
- ✅ Affichage conditionnel selon données disponibles
- ✅ Skeletons pendant le chargement
- ✅ Scroll horizontal avec boutons navigation
- ✅ Responsive (1/2/4 cartes selon breakpoint)

### Performance
- ✅ Requêtes parallélisées pour highlight shops
- ✅ Images optimisées et lazy loading
- ✅ Skeletons pour améliorer le LCP
- ✅ Déduplication des shops highlight

---

**Dernière mise à jour :** 2025-01-21

