# 📚 Documentation - Modal Service (Détails Complets)

## 📋 Table des matières
1. [Vue d'ensemble](#1-vue-densemble)
2. [Structure complète des Services](#2-structure-complète-des-services)
3. [Structure des Options](#3-structure-des-options)
4. [Structure des Add-ons](#4-structure-des-add-ons)
5. [Gestion du Panier (Cart)](#5-gestion-du-panier-cart)
6. [Calcul des Prix](#6-calcul-des-prix)
7. [Gestion des Durées](#7-gestion-des-durées)
8. [Flux complet de la Modal](#8-flux-complet-de-la-modal)
9. [Code complet d'implémentation](#9-code-complet-dimplémentation)

---

## 1. Vue d'ensemble

La modal Service s'ouvre quand l'utilisateur clique sur un service. Elle permet de :
- ✅ Voir les détails du service (titre, description, image, prix)
- ✅ Sélectionner une option (si disponibles)
- ✅ Ajouter des add-ons avec quantités
- ✅ Calculer le prix total (service + option + add-ons)
- ✅ Ajouter/modifier le service dans le panier (GuestController)
- ✅ Gérer les promotions (promotionPrice)

**Fichiers principaux :**
- `src/components/PageServices/models/ServiceModal.tsx` : Composant modal
- `src/components/PageServices/controllers/serviceModalController.ts` : Logique métier
- `src/components/PageServices/controllers/guestController.ts` : Gestion du panier
- `src/components/PageServices/models/ServiceOptions.tsx` : Affichage options
- `src/components/PageServices/models/ServiceAddOns.tsx` : Affichage add-ons

---

## 2. Structure complète des Services

### 2.1 Interface ServiceType

```typescript
export interface ServiceType {
    // Identifiants
    id: string;                    // ID unique du service
    name: string;                  // Nom du service (par défaut)
    categoryId: string;            // ID de la catégorie
    
    // Description
    description: string;           // Description par défaut
    description_service?: {        // Description localisée
        [key: string]: {           // Langue (en, fr, th)
            text: string;
        };
    };
    title_service?: {              // Titre localisé
        [key: string]: {
            text: string;
        };
    };
    
    // Prix
    price: number;                 // Prix de base (obligatoire)
    promotionPrice?: number;       // Prix promotionnel (optionnel)
                                   // ⚠️ Si promotionPrice === 0 → service GRATUIT
    
    // Durée
    duration: number;              // Durée en minutes
    durationText: string;          // Durée formatée (ex: "1h 30min")
    
    // Options et Add-ons
    serviceOptions?: ServiceOption[];  // Options disponibles (ex: "Court", "Long")
    serviceAddons?: ServiceAddOn[];   // Add-ons disponibles (ex: "Shampooing", "Masque")
    
    // Métadonnées
    colorService?: string;         // Couleur pour l'affichage
    hidden_for_client?: boolean;   // Masquer du client
    people?: number;               // Nombre de personnes
    priority?: number;             // Priorité d'affichage
    pictureUrl?: string;           // URL de l'image
    loyaltyPoint?: number | null;  // Points de fidélité
}
```

### 2.2 Exemple de Service

```typescript
const exampleService: ServiceType = {
    id: "service_123",
    name: "Coupe de cheveux",
    categoryId: "cat_hair",
    description: "Coupe de cheveux classique",
    description_service: {
        en: { text: "Classic haircut" },
        fr: { text: "Coupe de cheveux classique" },
        th: { text: "ตัดผมแบบคลาสสิก" }
    },
    title_service: {
        en: { text: "Haircut" },
        fr: { text: "Coupe" },
        th: { text: "ตัดผม" }
    },
    price: 500,
    promotionPrice: 400,           // 20% de réduction
    duration: 60,
    durationText: "1h",
    serviceOptions: [
        {
            id: "opt_short",
            name: "Court",
            duration: 45,
            durationText: "45min",
            price: 400,
            promotionPrice: 350
        },
        {
            id: "opt_long",
            name: "Long",
            duration: 90,
            durationText: "1h 30min",
            price: 600,
            promotionPrice: 500
        }
    ],
    serviceAddons: [
        {
            id: "addon_shampoo",
            name: { en: { text: "Shampooing" } },
            duration: 10,
            durationText: "10min",
            price: 50,
            promotionPrice: 40,
            maxQuantity: 2,
            quantity: 0
        }
    ],
    pictureUrl: "https://example.com/image.jpg",
    loyaltyPoint: 10
};
```

---

## 3. Structure des Options

### 3.1 Interface ServiceOption

```typescript
export interface ServiceOption {
    id: string;                    // ID unique de l'option
    name: string;                  // Nom de l'option (ex: "Court", "Long")
    duration: number;              // Durée en minutes
    durationText: string;          // Durée formatée
    price: number;                 // Prix de base
    promotionPrice?: number;       // Prix promotionnel
                                   // ⚠️ Si promotionPrice === 0 → option GRATUITE
    originalPrice?: number;        // Prix original (pour calculer les économies)
    isPromotion?: boolean;         // Indicateur de promotion
    isSelected?: boolean;          // Option sélectionnée
}
```

### 3.2 Gestion des Options

**Fichier :** `src/components/PageServices/controllers/serviceOptionsController.ts`

```typescript
export const useServiceOptions = (
    initialOptions: ServiceOption[] = [],
    initialSelectedOptionId?: number
): ServiceOptionsController => {
    const [optionsState, setOptionsState] = useState<ServiceOptionsState>({
        options: initialOptions,
        selectedOption: initialSelectedOptionId 
            ? initialOptions[Number(initialSelectedOptionId)] 
            : initialOptions[0]  // Par défaut : première option
    });

    const selectOption = useCallback((optionId: string) => {
        setOptionsState(prev => {
            const selectedOption = prev.options.find(option => option.id === optionId) || null;
            return {
                ...prev,
                selectedOption
            };
        });
    }, []);

    const getSelectedPrice = useCallback(() => {
        return optionsState.selectedOption?.price || 0;
    }, [optionsState.selectedOption]);

    return {
        options: optionsState.options,
        selectedOption: optionsState.selectedOption,
        selectOption,
        getSelectedPrice
    };
};
```

### 3.3 Logique de sélection

**Dans la modal :**
- Si le service a des options → afficher `ServiceOptions`
- L'utilisateur peut sélectionner une option (radio buttons)
- Si une option est sélectionnée → utiliser son prix et durée
- Si aucune option → utiliser le prix et durée du service de base

**Calcul du prix avec option :**
```typescript
if (selectedOption) {
    // Utiliser le prix de l'option
    if (selectedOption.promotionPrice === 0) {
        servicePrice = 0; // Gratuit
    } else if (selectedOption.promotionPrice !== null && selectedOption.promotionPrice !== undefined) {
        servicePrice = selectedOption.promotionPrice;
    } else {
        servicePrice = selectedOption.price;
    }
} else {
    // Utiliser le prix du service de base
    if (service.promotionPrice === 0) {
        servicePrice = 0;
    } else if (service.promotionPrice !== null && service.promotionPrice !== undefined) {
        servicePrice = service.promotionPrice;
    } else {
        servicePrice = service.price;
    }
}
```

---

## 4. Structure des Add-ons

### 4.1 Interface ServiceAddOn

```typescript
export interface ServiceAddOn {
    id: string;                    // ID unique de l'add-on
    duration: number;              // Durée en minutes
    durationText: string;          // Durée formatée
    maxQuantity?: number;          // Quantité maximale (défaut: 10)
    price: number;                 // Prix unitaire
    promotionPrice?: number | null; // Prix promotionnel unitaire
                                   // ⚠️ Si promotionPrice === 0 → add-on GRATUIT
    quantity: number;              // Quantité actuelle (état initial)
    name: {                        // Nom localisé
        [key: string]: {
            text: string;
        };
    };
    description?: {                // Description localisée
        [key: string]: {
            text: string;
        };
    };
}
```

### 4.2 Gestion des Add-ons

**Fichier :** `src/components/PageServices/controllers/serviceAddOnsController.ts`

```typescript
export const useServiceAddOns = (
    initialAddOns: ServiceAddOn[] = [],
    initialQuantities: { [key: string]: number } = {}
): ServiceAddOnsController => {
    const [addOnsState, setAddOnsState] = useState<ServiceAddOnsState>({
        addOns: initialAddOns,
        selectedAddOns: initialQuantities  // { "addon_id": quantity }
    });

    const updateQuantity = useCallback((addOnId: string, quantity: number) => {
        setAddOnsState(prev => {
            const addOn = prev.addOns.find(a => a.id === addOnId);
            const maxQuantity = addOn?.maxQuantity || 10;
            const validQuantity = Math.max(0, Math.min(quantity, maxQuantity)); // Clamp entre 0 et max

            const newSelectedAddOns = { ...prev.selectedAddOns };
            
            if (validQuantity === 0) {
                delete newSelectedAddOns[addOnId]; // Supprimer si quantité = 0
            } else {
                newSelectedAddOns[addOnId] = validQuantity;
            }

            return {
                ...prev,
                selectedAddOns: newSelectedAddOns
            };
        });
    }, []);

    const getAddOnQuantity = useCallback((addOnId: string) => {
        return addOnsState.selectedAddOns[addOnId] || 0;
    }, [addOnsState.selectedAddOns]);

    const getTotalAddOnsPrice = useCallback(() => {
        return addOnsState.addOns.reduce((total, addOn) => {
            const quantity = addOnsState.selectedAddOns[addOn.id] || 0;
            return total + (addOn.price * quantity);
        }, 0);
    }, [addOnsState.addOns, addOnsState.selectedAddOns]);

    return {
        addOns: addOnsState.addOns,
        selectedAddOns: addOnsState.selectedAddOns,
        updateQuantity,
        getAddOnQuantity,
        getTotalAddOnsPrice,
        clearAllAddOns
    };
};
```

### 4.3 Calcul du prix des Add-ons

**Dans `calculateTotalPrice` :**
```typescript
const addOnsPrice = service.serviceAddons?.reduce((total, addOn) => {
    const quantity = addOnQuantities[addOn.id] || 0;
    if (quantity > 0) {
        let addOnPrice = 0;
        if (addOn.promotionPrice === 0) {
            addOnPrice = 0; // Gratuit
        } else if (addOn.promotionPrice !== null && addOn.promotionPrice !== undefined) {
            addOnPrice = addOn.promotionPrice;
        } else {
            addOnPrice = addOn.price;
        }
        return total + (addOnPrice * quantity);
    }
    return total;
}, 0) || 0;
```

**Exemple :**
- Add-on "Shampooing" : prix = 50, promotionPrice = 40, quantity = 2
- Prix total add-on = 40 × 2 = 80

---

## 5. Gestion du Panier (Cart)

### 5.1 GuestController

Le panier est géré par `GuestController` qui maintient une liste d'invités (guests), chacun avec ses services.

**Structure :**
```typescript
export interface Guest {
    id: string;                    // ID unique de l'invité
    name: string;                  // Nom (ex: "Me", "Guest1")
    services: GuestService[];       // Services sélectionnés
    isActive: boolean;             // Invité actuellement actif
}

export interface GuestService {
    // Copie des données du service
    id: string;
    name: string;
    description: string;
    duration: number;
    durationText: string;
    price: number;
    promotionPrice?: number | null;
    
    // Option et Add-ons sélectionnés
    selectedOption?: ServiceOption;
    selectedAddOns?: ServiceAddOn[];
    
    // Prix total calculé
    totalPrice: number;
    
    // Métadonnées
    guestId: string;
    guestName: string;
    categoryId: string;
    // ... autres champs
}
```

### 5.2 Ajout d'un Service au Panier

**Fichier :** `src/components/PageServices/controllers/serviceModalController.ts`

```typescript
export const handleAddService = (
    service: ServiceType,
    selectedOption: ServiceOption | null,
    addOnQuantities: { [key: string]: number },
    guestController: GuestController
): void => {
    if (!service || !guestController) return;

    // 1. Récupérer l'invité actif
    const activeGuest = guestController.getActiveGuest();
    const existingService = activeGuest?.services.find(s => s.id === service.id);

    // 2. Préparer les add-ons (fusionner avec existants si service déjà présent)
    let finalAddOns: ServiceAddOn[] | undefined;
    
    if (existingService && existingService.selectedAddOns && existingService.selectedAddOns.length > 0) {
        // Fusionner les add-ons existants avec les nouveaux
        const existingAddOnsMap = new Map(existingService.selectedAddOns.map(addon => [addon.id, addon]));

        service?.serviceAddons?.forEach(addOn => {
            const newQuantity = addOnQuantities[addOn.id] || 0;
            if (newQuantity > 0) {
                existingAddOnsMap.set(addOn.id, {
                    ...addOn,
                    quantity: newQuantity
                });
            } else {
                existingAddOnsMap.delete(addOn.id);
            }
        });

        finalAddOns = Array.from(existingAddOnsMap.values());
    } else {
        // Nouveau service : seulement les add-ons avec quantité > 0
        finalAddOns = service?.serviceAddons?.map(addOn => ({
            ...addOn,
            quantity: addOnQuantities[addOn.id] || 0,
        })).filter(addOn => addOn.quantity > 0);
    }

    // 3. Créer le GuestService
    const guestService = guestController.createGuestService(
        activeGuest?.id || '',
        activeGuest?.name || '',
        service,
        selectedOption,
        finalAddOns
    );

    // 4. Ajouter au panier (remplace si existe déjà)
    guestController.addServiceToActiveGuest(guestService);
};
```

### 5.3 Création d'un GuestService

**Dans `GuestController.createGuestService` :**
```typescript
createGuestService(
    guestId: string,
    guestName: string,
    service: ServiceType,
    selectedOption?: ServiceOption,
    addOns?: ServiceAddOn[],
): GuestService {
    // Calculer le prix de l'option ou du service
    const optionPrice = selectedOption?.promotionPrice 
        || selectedOption?.price 
        || service.promotionPrice 
        || service.price;
    
    // Calculer le prix total des add-ons
    const addOnsPrice = addOns?.reduce((total: number, addOn: any) => {
        const addonPrice = addOn.promotionPrice === 0 ? 0 : (addOn.promotionPrice || addOn.price);
        return total + (addonPrice * addOn.quantity);
    }, 0) || 0;

    const totalPrice = optionPrice + addOnsPrice;
    
    return {
        id: service.id,
        name: service.name,
        description: service.description,
        duration: selectedOption?.duration || service.duration,
        durationText: selectedOption?.durationText || service.durationText,
        price: service.price,
        promotionPrice: service.promotionPrice === 0 ? 0 : (service.promotionPrice || null),
        selectedOption: selectedOption,
        selectedAddOns: addOns,
        totalPrice: totalPrice,
        // ... autres champs
    };
}
```

### 5.4 Suppression d'un Service

```typescript
export const handleRemoveService = (
    serviceId: string,
    guestController: GuestController
): void => {
    if (!guestController) return;
    guestController.removeServiceFromActiveGuest(serviceId);
};
```

---

## 6. Calcul des Prix

### 6.1 Fonction calculateTotalPrice

**Fichier :** `src/components/PageServices/controllers/serviceModalController.ts`

```typescript
export const calculateTotalPrice = (
    service: ServiceType,
    selectedOption: ServiceOption | null,
    addOnQuantities: { [key: string]: number }
): number => {
    // 1. Prix du service principal
    let servicePrice = 0;
    
    if (selectedOption) {
        // Option sélectionnée → utiliser son prix
        if (selectedOption.promotionPrice === 0) {
            servicePrice = 0; // Gratuit
        } else if (selectedOption.promotionPrice !== null && selectedOption.promotionPrice !== undefined) {
            servicePrice = selectedOption.promotionPrice;
        } else {
            servicePrice = selectedOption.price;
        }
    } else {
        // Pas d'option → utiliser le prix du service
        if (service.promotionPrice === 0) {
            servicePrice = 0; // Gratuit
        } else if (service.promotionPrice !== null && service.promotionPrice !== undefined) {
            servicePrice = service.promotionPrice;
        } else {
            servicePrice = service.price;
        }
    }

    // 2. Prix des add-ons
    const addOnsPrice = service.serviceAddons?.reduce((total, addOn) => {
        const quantity = addOnQuantities[addOn.id] || 0;
        if (quantity > 0) {
            let addOnPrice = 0;
            if (addOn.promotionPrice === 0) {
                addOnPrice = 0; // Gratuit
            } else if (addOn.promotionPrice !== null && addOn.promotionPrice !== undefined) {
                addOnPrice = addOn.promotionPrice;
            } else {
                addOnPrice = addOn.price;
            }
            return total + (addOnPrice * quantity);
        }
        return total;
    }, 0) || 0;

    // 3. Total
    return servicePrice + addOnsPrice;
};
```

### 6.2 Règles de Prix

**Priorité des prix :**
1. Si `promotionPrice === 0` → **GRATUIT**
2. Si `promotionPrice !== null && !== undefined` → utiliser `promotionPrice`
3. Sinon → utiliser `price`

**Exemples :**
```typescript
// Service avec promotion
price: 500, promotionPrice: 400 → Prix = 400

// Service gratuit
price: 500, promotionPrice: 0 → Prix = 0

// Service sans promotion
price: 500, promotionPrice: null → Prix = 500

// Option avec promotion
selectedOption.price: 600, selectedOption.promotionPrice: 500 → Prix = 500

// Add-on avec quantité
addOn.price: 50, addOn.promotionPrice: 40, quantity: 2 → Prix = 40 × 2 = 80
```

### 6.3 Calcul des Économies

```typescript
export const calculateSavings = (selectedOption: ServiceOption | null): number => {
    if (selectedOption?.originalPrice) {
        return selectedOption.originalPrice - selectedOption.price;
    }
    return 0;
};
```

**Affichage dans la modal :**
```tsx
{savings > 0 && (
    <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-green-700 text-sm">
            <Traductor keyWord="You'll save" forcedLang={lang} /> 
            <span className="font-semibold">{savings.toLocaleString()}</span>
        </p>
    </div>
)}
```

---

## 7. Gestion des Durées

### 7.1 Durée du Service

**Champs :**
- `duration: number` : Durée en minutes
- `durationText: string` : Durée formatée (ex: "1h 30min")

**Calcul de la durée totale :**
```typescript
// Durée du service ou de l'option
const serviceDuration = selectedOption?.duration || service.duration;

// Durée des add-ons
const addOnsDuration = addOns?.reduce((total, addOn) => {
    return total + (addOn.duration * addOn.quantity);
}, 0) || 0;

// Durée totale
const totalDuration = serviceDuration + addOnsDuration;
```

### 7.2 Exemple

```typescript
// Service : 60min
// Option "Long" : 90min (remplace la durée du service)
// Add-on "Shampooing" (×2) : 10min × 2 = 20min
// Total = 90 + 20 = 110min = "1h 50min"
```

---

## 8. Flux complet de la Modal

### 8.1 Ouverture

1. **Clic sur un service** → `ServiceModal` s'ouvre avec `service` en props
2. **Initialisation** :
   - Vérifier si le service est déjà dans le panier
   - Charger les valeurs initiales depuis l'URL (si présentes)
   - Initialiser `selectedOption` et `addOnQuantities`

### 8.2 Interaction

1. **Sélection d'option** :
   - `handleOptionChange(option)` → met à jour `selectedOption`
   - Recalcule le prix total

2. **Modification des add-ons** :
   - `handleAddOnQuantityChange(addOnId, quantity)` → met à jour `addOnQuantities`
   - Recalcule le prix total

3. **Affichage du prix** :
   - `calculateTotalPrice(service, selectedOption, addOnQuantities)` → prix total en temps réel

### 8.3 Ajout au Panier

1. **Clic sur "Add" ou "Modify"** :
   - `handleAddServiceClick()` → appelle `handleAddService()`
   - Crée un `GuestService` avec option et add-ons
   - Ajoute au `GuestController` (remplace si existe déjà)
   - Met à jour l'URL avec les données
   - Ferme la modal

### 8.4 Suppression

1. **Clic sur "Remove"** :
   - `handleRemoveServiceClick()` → appelle `handleRemoveService()`
   - Retire le service du panier
   - Ferme la modal

---

## 9. Code complet d'implémentation

### 9.1 ServiceModal.tsx (Simplifié)

```typescript
'use client';
import { useState, useEffect, useCallback } from 'react';
import { ServiceType, ServiceOption, ServiceModalProps } from '../controllers/types';
import { calculateTotalPrice, handleAddService, handleRemoveService } from '../controllers/serviceModalController';

export default function ServiceModal({
    isOpen,
    service,
    onClose,
    lang,
    guestController,
}: ServiceModalProps) {
    const [selectedOption, setSelectedOption] = useState<ServiceOption | null>(null);
    const [addOnQuantities, setAddOnQuantities] = useState<{ [key: string]: number }>({});
    const [isServiceSelected, setIsServiceSelected] = useState(false);

    // Vérifier si le service est déjà sélectionné
    useEffect(() => {
        if (isOpen && service && guestController) {
            const activeGuest = guestController.getActiveGuest();
            const selected = activeGuest?.services.some(s => s.id === service.id);
            setIsServiceSelected(selected || false);
        }
    }, [isOpen, service, guestController]);

    // Charger les valeurs initiales depuis l'URL
    const getInitialValues = () => {
        // ... parsing URL ...
        return { initialOptionId, initialAddOnQuantities: {} };
    };

    const handleOptionChange = useCallback((option: ServiceOption | null) => {
        setSelectedOption(option);
    }, []);

    const handleAddOnQuantityChange = useCallback((addOnId: string, quantity: number) => {
        setAddOnQuantities(prev => ({
            ...prev,
            [addOnId]: quantity
        }));
    }, []);

    const handleAddServiceClick = () => {
        if (!service || !guestController) return;
        handleAddService(service, selectedOption, addOnQuantities, guestController);
        onClose();
    };

    const handleRemoveServiceClick = () => {
        if (!service || !guestController) return;
        handleRemoveService(service.id, guestController);
        onClose();
    };

    if (!isOpen || !service) return null;

    const totalPrice = calculateTotalPrice(service, selectedOption, addOnQuantities);
    const title = service?.title_service?.[lang]?.text || service?.name;
    const description = service?.description_service?.[lang]?.text || service?.description;

    return (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header avec image */}
                {service.pictureUrl && (
                    <div className="relative w-full h-48">
                        <img src={service.pictureUrl} alt={title} />
                        <button onClick={onClose}>×</button>
                    </div>
                )}

                {/* Contenu scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                    <h2>{title}</h2>
                    <p>{service.durationText}</p>
                    {description && <p>{description}</p>}

                    {/* Prix (si pas d'options) */}
                    {!service.serviceOptions && (
                        <div>
                            {service.promotionPrice ? (
                                <>
                                    <span className="line-through">{service.price}</span>
                                    <span className="text-red-500">{service.promotionPrice}</span>
                                </>
                            ) : (
                                <span>{service.price}</span>
                            )}
                        </div>
                    )}

                    {/* Options */}
                    {service.serviceOptions && service.serviceOptions.length > 0 && (
                        <ServiceOptions
                            options={service.serviceOptions}
                            onSelectionChange={handleOptionChange}
                            lang={lang}
                        />
                    )}

                    {/* Add-ons */}
                    {service.serviceAddons && service.serviceAddons.length > 0 && (
                        <ServiceAddOns
                            addOns={service.serviceAddons}
                            onQuantityChange={handleAddOnQuantityChange}
                            lang={lang}
                        />
                    )}
                </div>

                {/* Footer avec boutons */}
                <div className="border-t p-6">
                    {isServiceSelected ? (
                        <>
                            <button onClick={handleRemoveServiceClick}>Remove</button>
                            <button onClick={handleAddServiceClick}>
                                Modify {totalPrice}
                            </button>
                        </>
                    ) : (
                        <button onClick={handleAddServiceClick}>
                            Add {totalPrice}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
```

### 9.2 ServiceOptions.tsx (Simplifié)

```typescript
import { ServiceOption, ServiceOptionsProps } from '../controllers/types';

export default function ServiceOptions({
    options,
    onSelectionChange,
    lang,
    initialSelectedOptionId,
}: ServiceOptionsProps) {
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(
        initialSelectedOptionId || options[0]?.id || null
    );

    useEffect(() => {
        if (initialSelectedOptionId) {
            const option = options.find(opt => opt.id === initialSelectedOptionId);
            if (option) {
                setSelectedOptionId(option.id);
                onSelectionChange?.(option);
            }
        } else if (options[0]) {
            setSelectedOptionId(options[0].id);
            onSelectionChange?.(options[0]);
        }
    }, [initialSelectedOptionId, options]);

    const handleSelect = (option: ServiceOption) => {
        setSelectedOptionId(option.id);
        onSelectionChange?.(option);
    };

    return (
        <div className="space-y-2">
            {options.map((option) => (
                <div
                    key={option.id}
                    onClick={() => handleSelect(option)}
                    className={`border rounded-lg p-4 cursor-pointer ${
                        selectedOptionId === option.id ? 'border-primary-color bg-primary/10' : ''
                    }`}
                >
                    <div className="flex justify-between">
                        <span>{option.name}</span>
                        <div>
                            {option.promotionPrice ? (
                                <>
                                    <span className="line-through text-sm">{option.price}</span>
                                    <span className="text-red-500 font-bold">{option.promotionPrice}</span>
                                </>
                            ) : (
                                <span>{option.price}</span>
                            )}
                        </div>
                    </div>
                    <p className="text-sm text-gray-500">{option.durationText}</p>
                </div>
            ))}
        </div>
    );
}
```

### 9.3 ServiceAddOns.tsx (Simplifié)

```typescript
import { ServiceAddOn, ServiceAddOnsProps } from '../controllers/types';
import { Plus, Minus } from 'lucide-react';

export default function ServiceAddOns({
    addOns,
    onQuantityChange,
    lang,
    initialQuantities,
}: ServiceAddOnsProps) {
    const [quantities, setQuantities] = useState<{ [key: string]: number }>(
        initialQuantities || {}
    );

    const handleQuantityChange = (addOnId: string, newQuantity: number) => {
        const addOn = addOns.find(a => a.id === addOnId);
        const maxQuantity = addOn?.maxQuantity || 10;
        const validQuantity = Math.max(0, Math.min(newQuantity, maxQuantity));
        
        setQuantities(prev => ({
            ...prev,
            [addOnId]: validQuantity
        }));
        onQuantityChange?.(addOnId, validQuantity);
    };

    return (
        <div className="space-y-4">
            {addOns.map((addOn) => {
                const quantity = quantities[addOn.id] || 0;
                const price = addOn.promotionPrice !== null && addOn.promotionPrice !== undefined
                    ? addOn.promotionPrice
                    : addOn.price;

                return (
                    <div key={addOn.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <h4>{addOn.name[lang]?.text || addOn.name.en?.text}</h4>
                                {addOn.description && (
                                    <p className="text-sm text-gray-500">
                                        {addOn.description[lang]?.text || addOn.description.en?.text}
                                    </p>
                                )}
                            </div>
                            <div className="text-right">
                                <span className="font-semibold">{price}</span>
                                <p className="text-xs text-gray-500">{addOn.durationText}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => handleQuantityChange(addOn.id, quantity - 1)}
                                disabled={quantity === 0}
                                className="p-1 rounded border"
                            >
                                <Minus size={16} />
                            </button>
                            <span className="font-semibold">{quantity}</span>
                            <button
                                onClick={() => handleQuantityChange(addOn.id, quantity + 1)}
                                disabled={quantity >= (addOn.maxQuantity || 10)}
                                className="p-1 rounded border"
                            >
                                <Plus size={16} />
                            </button>
                            {quantity > 0 && (
                                <span className="ml-auto text-sm">
                                    Total: {price * quantity}
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
```

---

## 10. Résumé

### Structure des données
- **ServiceType** : Service de base avec prix, durée, options, add-ons
- **ServiceOption** : Option avec prix et durée propres
- **ServiceAddOn** : Add-on avec quantité et prix unitaire

### Calcul des prix
1. **Service/Option** : `promotionPrice` si présent, sinon `price`
2. **Add-ons** : `(promotionPrice || price) × quantity`
3. **Total** : `servicePrice + addOnsPrice`

### Gestion du panier
- **GuestController** : Gère les invités et leurs services
- **GuestService** : Service avec option et add-ons sélectionnés
- **Ajout** : Remplace si existe déjà, sinon ajoute
- **Suppression** : Retire du panier

### Durées
- **Service** : `duration` (minutes) + `durationText` (formaté)
- **Option** : Remplace la durée du service si sélectionnée
- **Add-ons** : Ajoutent à la durée totale

---

**Dernière mise à jour :** 2025-01-21

