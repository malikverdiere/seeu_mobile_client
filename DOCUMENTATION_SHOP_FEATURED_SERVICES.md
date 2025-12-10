# 📚 Documentation – Shop.featuredServices Structure

## Vue d'ensemble
Le champ `featuredServices` est un tableau de services (maps) stocké directement dans le document `Shops` pour éviter de faire des requêtes supplémentaires à la sous-collection `Services` lors de l'affichage des shops dans la recherche.

## Structure

### Emplacement
- **Collection**: `Shops/{shopId}`
- **Champ**: `featuredServices` (array of maps)

### Structure d'un service dans featuredServices

```javascript
{
  // Identifiants
  id: "0GfVoMnGFOO0ea5ZgeJH", // string - ID du service
  categoryId: "HZKb80twZet2VMwMQRpD", // string - ID de la catégorie
  name: "Cold Perm Starting Price", // string - Nom par défaut
  
  // Localisation des textes
  title_service: {
    en: {
      countryCode: "en",
      text: "Cold Perm Starting Price"
    },
    fr: {
      countryCode: "fr",
      text: "Permanente à froid (à partir de)"
    },
    th: {
      countryCode: "th",
      text: "ดัดเย็น (ราคาเริ่มต้น)"
    }
  },
  
  description_service: {
    en: {
      countryCode: "en",
      text: "Achieve beautiful, natural-looking curls with our professional cold perm service."
    },
    fr: {
      countryCode: "fr",
      text: "Obtenez des boucles naturelles et élégantes grâce à notre service de permanente à froid."
    },
    th: {
      countryCode: "th",
      text: "ดัดเย็นเพื่อผมลอนสวยอย่างเป็นธรรมชาติ โดยช่างมืออาชีพ"
    }
  },
  
  // Fallback (optionnel)
  description: "Achieve beautiful, natural-looking curls with our professional cold perm service.",
  
  // Prix
  price: 2000, // number - Prix de base
  promotionPrice: null, // number | null - Prix promotionnel (optionnel)
  
  // Durée
  duration: 120, // number - Durée en minutes
  durationText: "2h00", // string - Durée formatée
  
  // Métadonnées
  featured: true, // boolean - Toujours true pour featuredServices
  hidden_for_client: false, // boolean - Si false, le service est affiché
  people: 0, // number - Nombre de personnes
  priority: 0, // number - Priorité d'affichage
  
  // Style
  colorService: "#ffec78" // string - Couleur hexadécimale
}
```

## Champs obligatoires

- `id` (string) - Identifiant unique du service
- `price` (number) - Prix du service
- `duration` (number) - Durée en minutes
- `title_service` (map) - Au moins une langue doit être présente (en, fr, ou th)

## Champs optionnels

- `description_service` (map) - Description traduite
- `description` (string) - Description par défaut (fallback)
- `promotionPrice` (number) - Prix promotionnel
- `durationText` (string) - Durée formatée (ex: "2h00", "60 min")
- `categoryId` (string) - ID de la catégorie
- `colorService` (string) - Couleur hexadécimale
- `people` (number) - Nombre de personnes
- `priority` (number) - Priorité d'affichage
- `hidden_for_client` (boolean) - Si true, le service ne sera pas affiché

## Filtrage

Dans `BeautySearch.js`, seuls les services avec :
- `id` présent
- `hidden_for_client === false` (ou absent)

sont inclus dans `featuredServices`.

## Utilisation dans le code

```javascript
// Dans transformShopDoc
const featuredServices = Array.isArray(data.featuredServices) 
    ? data.featuredServices
        .filter(service => service && service.id && !service.hidden_for_client)
        .map(transformFeaturedService)
    : [];
```

## Affichage

Les services sont affichés dans `ShopSearchCard` avec :
- Nom du service (`title_service[lang].text`)
- Durée (`durationText` ou calculée depuis `duration`)
- Prix (`price` et `promotionPrice` si présent)

**Dernière mise à jour : 2025-01-21**

