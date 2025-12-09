# 📚 Documentation – Gestion des Shop Types

## 1. Rôle des données locales
- Fichier : `src/utils/categories.ts`
- Ressources :
  - `categoriesList`: table de référence des types (id, textes FR/EN/TH, type numérique, icône, priorité, idCollection).
  - Helpers :
    - `shopTypeCategory(type: number) -> "beauty" | "fitness" | "work" | "girlsNight" | "event"`
    - `shopCategoryType(slug: string) -> 1..5` (inverse)
  - `categoryList`: liste courte des macro catégories (beauty, fitness, etc.).

## 2. Champs Firestore utilisés
- Dans chaque shop (`Shops/{shopId}`) :
  - `shopType.id` (string) : clé qui correspond à `categoriesList.id`
  - `shopType.type` (number) : macro catégorie (1=beauty, 2=fitness, 3=work, 4=girlsNight, 5=event)
  - `shop_type` (string[]) : tags de catégories (utilisé pour `array-contains`)
  - `booking_id` : slug du shop (navigation et jointure)

## 3. Affichage sur la home (cartes)
1. Recherche du type :
   ```ts
   const type = categoriesList.find(cat => cat.id === shop?.shopType?.id);
   const type_lang = lang === "th" ? type?.textTh : lang === "fr" ? type?.text : type?.textEn;
   ```
2. Passage à la carte :
   ```tsx
   <TrendingCard type={type_lang || ""} ... />
   ```
3. Badge : simple texte (type traduit).

## 4. Requêtes Firestore liées aux types
- Highlight & promos (HomePage) :
  ```ts
  where("highlight.isActive", "==", true)
  where("promotion.doubleDay", "==", true)
  ```
- Bannières (SearchBanners) :
  ```ts
  where("category", "==", category)
  where("isActive", "==", true)
  orderBy("priority", "asc")
  ```
- Recherche shops (SearchPageController.getShops) :
  ```ts
  where("shopValid", "==", true)
  where("booking_id", "!=", null)
  where("shopType.type", "==", filters.categoryType)        // ex: 1 pour beauty
  where("shop_type", "array-contains", filters.category)    // ex: "salon-de-coiffure"
  orderBy("adPosition", "asc") // ou google_infos.user_ratings_total
  ```

## 5. Index nécessaires (minimum)
- **SearchBanners** (obligatoire) :
  ```
  collection: SearchBanners
  fields: category ASC, isActive ASC, priority ASC
  ```
- **Shops** (selon vos filtres) :
  - `shop_type` (array-contains) + `shopType.type` (+ optionnel `shopValid`, `adPosition`, `google_infos.user_ratings_total`)
  - `booking_id` égalité → index simple auto

## 6. Ce qu’il faut porter dans une autre app React
- Copier `categoriesList` et les helpers `shopTypeCategory` / `shopCategoryType`.
- S’attendre à la structure Firestore des shops : `shopType.id`, `shopType.type`, `shop_type[]`, `booking_id`.
- Requêtes à reproduire (filters `where` ci-dessus) et créer les index correspondants.
- Affichage : badge = libellé traduit depuis `categoriesList` (langue courante).

## 7. Résumé ultra-court
- Référentiel local : `categoriesList` (mapping id → labels multilingues + type numérique).
- Firestore stocke `shopType` (id + type) et `shop_type` (array) pour filtrer.
- Aucun autre cache local.
- Un index composite requis pour `SearchBanners`; pour `Shops`, index selon combinaisons de `where`.

## 8. Contenu détaillé de `categories.ts`

### 8.1 Interface et helpers
```ts
export interface CategoryInCodeProps {
  id: string;
  idCollection: string;
  priority: number;
  text: string;
  textEn?: string;
  textTh?: string;
  type?: number;      // 1 beauty, 2 fitness, 3 work, 4 girlsNight, 5 event
  typeIcon?: string;  // URL icône
  name?: { en?: string; th?: string; fr?: string; };
}

// slug -> type number
shopCategoryType("beauty" | "fitness" | "work" | "girlsNight" | "event") -> 1..5
// type number -> slug
shopTypeCategory(1..5) -> "beauty" | "fitness" | "work" | "girlsNight" | "event"
```

### 8.2 `categoryList` (macro catégories)
- Liste courte pour les filtres principaux (actuellement seulement `beauty` activé dans le fichier, les autres sont commentés).
  ```ts
  [{ id: "beauty", text: "Beauty", type: 1, icon: "/category_beauty.webp" }, ...]
  ```

### 8.3 `categoriesList` (toutes les sous-catégories)
- Tableau complet de `CategoryInCodeProps`. Champs clés par entrée :
  - `id` (slug, ex: `"salon-de-coiffure"`, `"barbiers"`, `"nail-studio"`)
  - `idCollection` (id Firestore de la collection pour cette catégorie)
  - `priority` (ordre d’affichage)
  - `text` / `textEn` / `textTh` (labels localisés)
  - `type` (1=beauty, 2=fitness, 3=work, 4=girlsNight, 5=event)
  - `typeIcon` (URL icône si présente)
  - `name` (objets de labels localisés, doublon plus structuré)

#### Exemples d’entrées (représentatives)
- Beauté (type 1) : `barbiers`, `instituts-de-beaute`, `salon-de-coiffure`, `nail-studio`, `wellness-center`, `eyebrows-eyelashes`, `dental-center`
- Food/Bar (type 2) : `bar`, `coffee_shop`, `restaurants`, `restauration-rapide`, `boulangers`
- Work/Retail (type 3) : `mode`, `cigarette_shop`, `fleuristes`, `commercants`, `cbd_shop`

> Remarque : la liste complète est dans `categories.ts`; si tu dois la copier dans un autre projet, récupère directement ce tableau pour garder tous les id/labels/priorités/icônes.

### 8.4 Contenu complet de `categories.ts`
```ts
export interface CategoryInCodeProps {
    id: string;
    idCollection: string;
    priority: number;
    text: string;
    textEn?: string;
    textTh?: string;
    type?: number;
    typeIcon?: string;
    name?: {
        en?: string;
        th?: string;
        fr?: string;
    };
}

export const shopCategoryType = (category: string)=>{
    switch(category){
        case "beauty":
            return 1;
        case "fitness":
            return 2;
        case "work":
            return 3;
        case "girlsNight":
            return 4;
        case "event":
            return 5;
    }
}
export const shopTypeCategory = (type: number)=>{
    switch(type){
        case 1:
            return "beauty";
        case 2:
            return "fitness";
        case 3:
            return "work";
        case 4:
            return "girlsNight";
        case 5:
            return "event";
    }
}

export const categoryList = [
    // {
    //     id: "girlsNight",
    //     text: "Girls Night",
    //     type: 4,
    //     icon: "/category_girls.webp",
    // },
    {
        id: "beauty",
        text: "Beauty",
        type: 1,
        icon: "/category_beauty.webp",
    },
    // {
    //     id: "event",
    //     text: "Event",
    //     type: 5,
    //     icon: "/category_event.webp",
    // },
    // {
    //     id: "work",
    //     text: "Work",
    //     type: 3,
    //     icon: "/category_work.webp",
    // },
    // {
    //     id: "fitness",
    //     text: "Fitness",
    //     type: 2,
    //     icon: "/category_fitness.webp",
    // },
]

export const categoriesList: CategoryInCodeProps[] = [
    {
        id: "mode",
        idCollection: "2SXXnWF9CvJlf0VObLDR",
        priority: 1,
        text: "Mode",
        textEn: "Fashion",
        textTh: "แฟชั่น",
        name:{
            en: "Fashion",
            th: "แฟชั่น",
            fr: "Mode",
        },
        type: 3,
        typeIcon: "https://firebasestorage.googleapis.com/v0/b/seeu-d028c.appspot.com/o/Shops_type_img%2FFashion.png?alt=media&token=e6fba8e9-d0f6-41e0-b8cb-c86620659863"
    },
    {
        id: "bar",
        idCollection: "GPGFgKuCwNBSSLFX4JPH",
        priority: 2,
        text: "Bars",
        textEn: "Bars",
        textTh: "Bars",
        name:{
            en: "Bars",
            th: "ร้านคาเฟ่",
            fr: "Bars",
        },
        type: 2,
        typeIcon: "https://firebasestorage.googleapis.com/v0/b/seeu-d028c.appspot.com/o/Shops_type_img%2FBar.png?alt=media&token=c8af14a4-bde2-4290-a9ef-ad610e93888f"
    },
    {
        id: "barbiers",
        idCollection: "Gq0i9Uijb9eGRlC8xX5h",
        priority: 3,
        text: "Barbiers",
        textEn: "Barbers",
        textTh: "ช่างตัดผม",
        name:{
            en: "Barbers",
            th: "ช่างตัดผม",
            fr: "Barbiers",
        },
        type: 1,
        typeIcon: "https://firebasestorage.googleapis.com/v0/b/seeu-d028c.appspot.com/o/Shops_type_img%2FBarber.png?alt=media&token=5bd25e2c-7808-47a8-87e4-bc11b644d339"
    },
    {
        id: "coffee_shop",
        idCollection: "Hv0tKmfdopcXhRJigctJ",
        priority: 4,
        text: "Coffee shop",
        textEn: "Coffee shop",
        textTh: "ร้านกาแฟ",
        name:{
            en: "Coffee shop",
            th: "ร้านกาแฟ",
            fr: "Coffee shop",
        },
        type: 2,
        typeIcon: "https://firebasestorage.googleapis.com/v0/b/seeu-d028c.appspot.com/o/Shops_type_img%2FCoffee_Shop.png?alt=media&token=74283217-d0b2-44b6-9007-0b6e0b9e4757"
    },
    {
        id: "salon-de-massage",
        idCollection: "KzCTmTv44OwbH5CtkscI",
        priority: 15,
        text: "Salon de massage",
        textEn: "Massage salon",
        textTh: "ร้านนวด",
        name:{
            en: "Massage salon",
            th: "ร้านนวด",
            fr: "Salon de massage",
        },
        type: 1,
        typeIcon: "https://firebasestorage.googleapis.com/v0/b/seeu-d028c.appspot.com/o/Shops_type_img%2FHairdresser.png?alt=media&token=43b1d902-a94d-4ee7-b712-ac5db59ba5ff"
    },
    {
        id: "cigarette_shop",
        idCollection: "M0281ocwxLX68a48pO8x",
        priority: 5,
        text: "E-cigarette shop",
        textEn: "E-cigarette store",
        textTh: "E-cigarette store",
        name:{
            en: "E-cigarette store",
            th: "E-cigarette store",
            fr: "E-cigarette shop",
        },
        type: 3,
        typeIcon: "https://firebasestorage.googleapis.com/v0/b/seeu-d028c.appspot.com/o/Shops_type_img%2FElectronics_Cigarette.png?alt=media&token=87e3faba-8809-4edf-a14b-26c4aeb6494f"
    },
    {
        id: "fleuristes",
        idCollection: "N3W4NRhDaanlibtF8Osp",
        priority: 6,
        text: "Fleuristes",
        textEn: "Florists",
        textTh: "คนขายดอกไม้",
        name:{
            en: "Florists",
            th: "คนขายดอกไม้",
            fr: "Fleuristes",
        },
        type: 3,
        typeIcon: "https://firebasestorage.googleapis.com/v0/b/seeu-d028c.appspot.com/o/Shops_type_img%2FFlower_Shop.png?alt=media&token=12428a2e-0607-4739-ad90-85a847cb1183"
    },
    {
        id: "commercants",
        idCollection: "OLJbXkO0pcjQcdpF4e7R",
        priority: 7,
        text: "Commerçants",
        textEn: "Grocery store",
        textTh: "ร้านขายของชำ",
        name:{
            en: "Grocery store",
            th: "ร้านขายของชำ",
            fr: "Commerçants",
        },
        type: 3,
        typeIcon: "https://firebasestorage.googleapis.com/v0/b/seeu-d028c.appspot.com/o/Shops_type_img%2FGrocery.png?alt=media&token=700516e3-bf7c-4d32-8ec0-33eb93f59ccb"
    },
    {
        id: "instituts-de-beaute",
        idCollection: "Q0J07JEPPIyWolAedOBG",
        priority: 8,
        text: "Instituts de beauté",
        textEn: "Beauty salons",
        textTh: " สถานเสริมความงาม",
        name:{
            en: "Beauty salons",
            th: " สถานเสริมความงาม",
            fr: "Instituts de beauté",
        },
        type: 1,
        typeIcon: "https://firebasestorage.googleapis.com/v0/b/seeu-d028c.appspot.com/o/Shops_type_img%2FBeauty.png?alt=media&token=2fc7e899-125b-4b61-a8ba-d854319773f0"
    },
    {
        id: "restauration-rapide",
        idCollection: "YLe0qobdzRIIu8EDtzPJ",
        priority: 9,
        text: "Restauration rapide",
        textEn: "Fast Food",
        textTh: "Fast Food",
        name:{
            en: "Fast Food",
            th: "Fast Food",
            fr: "Restauration rapide",
        },
        type: 2,
        typeIcon: "https://firebasestorage.googleapis.com/v0/b/seeu-d028c.appspot.com/o/Shops_type_img%2FFastfood.png?alt=media&token=93779da8-ff9b-4dc5-85f8-7d9cb9121621"
    },
    {
        id: "restaurants",
        idCollection: "YTfwQeakCND3r75SSMAa",
        priority: 10,
        text: "Restaurants",
        textEn: "Restaurants",
        textTh: " ร้านอาหาร",
        name:{
            en: "Restaurants",
            th: " ร้านอาหาร",
            fr: "Restaurants",
        },
        type: 2,
        typeIcon: "https://firebasestorage.googleapis.com/v0/b/seeu-d028c.appspot.com/o/Shops_type_img%2FRestaurant.png?alt=media&token=266e71ad-f8e5-4d41-9697-d4b42594b4f3"
    },
    {
        id: "boulangers",
        idCollection: "nWuOmPoy0ERP6nYEAETB",
        priority: 11,
        text: "Boulangers",
        textEn: "Bakers",
        textTh: "คนทำขนมปัง",
        name:{
            en: "Bakers",
            th: "คนทำขนมปัง",
            fr: "Boulangers",
        },
        type: 2,
        typeIcon: "https://firebasestorage.googleapis.com/v0/b/seeu-d028c.appspot.com/o/Shops_type_img%2FBakery.png?alt=media&token=eddaa105-14b7-4444-9ff7-2fae5e23fd77"
    },
    {
        id: "cbd_shop",
        idCollection: "oTpzBPg7KeLnrE1INkir",
        priority: 12,
        text: "CBD Shop",
        textEn: "CBD Shop",
        textTh: "CBD Shop",
        name:{
            en: "CBD Shop",
            th: "CBD Shop",
            fr: "CBD Shop",
        },
        type: 3,
        typeIcon: "https://firebasestorage.googleapis.com/v0/b/seeu-d028c.appspot.com/o/Shops_type_img%2FCBD_Shop.png?alt=media&token=299e83a5-06f1-4d2b-b82d-7f1c29dad6c4"
    },
    {
        id: "salon-de-coiffure",
        idCollection: "wKCXiQwS7H3qOJUoz65r",
        priority: 13,
        text: "Salon de coiffure",
        textEn: "Hair salon",
        textTh: "ร้านทำผม",
        name:{
            en: "Hair salon",
            th: "ร้านทำผม",
            fr: "Salon de coiffure",
        },
        type: 1,
        typeIcon: "https://firebasestorage.googleapis.com/v0/b/seeu-d028c.appspot.com/o/Shops_type_img%2FHairdresser.png?alt=media&token=43b1d902-a94d-4ee7-b712-ac5db59ba5ff"
    },
    {
        id: "dental-center",
        idCollection: "1L3NKuSGHJJHVYbPbzC1",
        priority: 17,
        text: "Centre dentaire",
        textEn: "Dental Center",
        textTh: "ศูนย์ทันตกรรม",
        name:{
            en: "Dental Center",
            th: "ศูนย์ทันตกรรม",
            fr: "Centre dentaire",
        },
        type: 1,
        typeIcon: ""
    },
    {
        id: "nail-studio",
        idCollection: "SmMGxXLjRW0vw1G4s2b4",
        priority: 14,
        text: "Salon de manucure",
        textEn: "Nail Studio",
        textTh: "ร้านทำเล็บ",
        name:{
            en: "Nail Studio",
            th: "ร้านทำเล็บ",
            fr: "Salon de manucure",
        },
        type: 1,
        typeIcon: ""
    },
    {
        id: "wellness-center",
        idCollection: "GA3ULROtuDuQ3N0WLUql",
        priority: 16,
        text: "Centre de bien-être",
        textEn: "Wellness Center",
        textTh: "ศูนย์สุขภาพ",
        name:{
            en: "Wellness Center",
            th: "ศูนย์สุขภาพ",
            fr: "Centre de bien-être",
        },
        type: 1,
        typeIcon: ""
    },
    {
        id: "eyebrows-eyelashes",
        idCollection: "1U0gozDZrOjKlIVp0ZMD",
        priority: 4,
        text: "Soins sourcils et cils",
        textEn: "Eyebrows & eyelashes",
        textTh: "คิ้วและขนตา",
        name:{
            en: "Eyebrows & eyelashes",
            th: "คิ้วและขนตา",
            fr: "Soins sourcils et cils",
        },
        type: 1,
        typeIcon: ""
    },
];
```

**Dernière mise à jour : 2025-01-21**

