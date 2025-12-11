# 📚 Documentation - Modal Cart (Panier)

## 📋 Table des matières
1. [Vue d'ensemble](#1-vue-densemble)
2. [Structure de la Modal](#2-structure-de-la-modal)
3. [Affichage des Services](#3-affichage-des-services)
4. [Calculs des Prix](#4-calculs-des-prix)
5. [Boutons et Interactions](#5-boutons-et-interactions)
6. [Design Responsive](#6-design-responsive)
7. [Code complet d'implémentation](#7-code-complet-dimplémentation)

---

## 1. Vue d'ensemble

La modal Cart (panier) affiche tous les services sélectionnés par tous les invités (guests). Elle permet de :
- ✅ Voir tous les services groupés par invité
- ✅ Afficher les options et add-ons sélectionnés
- ✅ Calculer le subtotal, les réductions et le total
- ✅ Continuer vers l'étape suivante (sélection du temps/membre)
- ✅ Modifier les services d'un invité spécifique

**Fichiers principaux :**
- `src/components/PageServices/models/ServicesCart.tsx` : Composant principal du panier
- `src/components/PageServices/controllers/servicesCartController.ts` : Logique de calcul
- `src/components/PageServices/models/NoteForPay.tsx` : Note de paiement

---

## 2. Structure de la Modal

### 2.1 Ouverture de la Modal

**Composant :** `ServicesCartButtons`

La modal s'ouvre via un bouton panier avec badge :
```typescript
<button onClick={openModal}>
    <ShoppingCart />
    {totalServices > 0 && (
        <div className="badge">{totalServices}</div>
    )}
</button>
```

**Hook :** `useCartModal()`
```typescript
const { isModalOpen, isClosing, openModal, closeModal } = useCartModal();
```

### 2.2 Structure HTML de la Modal

```tsx
<div className="fixed inset-0 bg-black/50 flex items-end z-50">
    {/* Backdrop avec animation */}
    <div className="bg-white w-full rounded-t-3xl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
            <h2>Appointment details</h2>
            <button onClick={closeModal}>×</button>
        </div>

        {/* Contenu - ServicesCart */}
        <ServicesCart
            lang={lang}
            shopData={shopData}
            guestController={guestController}
            category={category}
            booking_id={booking_id}
            closeModal={closeModal}
        />
    </div>
</div>
```

### 2.3 Animations

- **Ouverture** : `animate-slideInUp` (slide depuis le bas)
- **Fermeture** : `animate-slideOutDown` (slide vers le bas)
- **Backdrop** : `animate-fadeIn` / `animate-fadeOut`
- **Durée** : 300ms

---

## 3. Affichage des Services

### 3.1 Organisation par Invité

Les services sont groupés par invité (guest) :

```typescript
const servicesByGuest = guestController.getAllGuests();

servicesByGuest.map((guest, guestIndex) => {
    // Afficher le nom de l'invité
    // Afficher ses services
    // Bouton "Edit" si plusieurs invités
});
```

### 3.2 Structure d'un Service

Pour chaque service, on affiche :

1. **Titre du service** (avec point coloré)
   ```tsx
   <div className="flex items-center gap-2">
       <div className="w-2 h-2 rounded-full bg-primary-color" />
       <h4>{service.title_service?.[lang]?.text || service.name}</h4>
   </div>
   ```

2. **Option sélectionnée** (si présente)
   ```tsx
   {service.selectedOption?.name && (
       <h5>({service.selectedOption.name})</h5>
   )}
   ```

3. **Durée et Prix**
   ```tsx
   <div className="flex justify-between">
       <span>{service.selectedOption?.durationText || service.durationText}</span>
       <div>
           {/* Prix barré si promotion */}
           {service.promotionPrice && (
               <span className="line-through">{service.price}</span>
           )}
           {/* Prix promotionnel */}
           <span className="text-red-500">{service.promotionPrice || service.price}</span>
       </div>
   </div>
   ```

4. **Add-ons** (si présents)
   ```tsx
   {service.selectedAddOns?.map((addOn) => (
       <div>
           <h4>Add-on :</h4>
           <div className="flex justify-between">
               <div>
                   <h5>{addOn.name[lang].text}</h5>
                   <span>X{addOn.quantity}</span>
               </div>
               <div>
                   {/* Prix barré si promotion */}
                   {addOn.promotionPrice && (
                       <span className="line-through">{addOn.price}</span>
                   )}
                   {/* Prix promotionnel */}
                   <span className="text-red-500">
                       {addOn.promotionPrice === 0 ? "Free" : addOn.promotionPrice}
                   </span>
               </div>
           </div>
       </div>
   ))}
   ```

### 3.3 Séparateurs

- **Entre services** : Ligne fine (`border-t-[0.5px]`)
- **Entre invités** : Ligne épaisse (`border-t-[1px]`)

### 3.4 Tri des Services

Les services sont triés par durée (croissante) :
```typescript
guest.services.sort((a, b) => a.duration - b.duration)
```

---

## 4. Calculs des Prix

### 4.1 Hook useCartCalculations

**Fichier :** `src/components/PageServices/controllers/servicesCartController.ts`

```typescript
const { subtotal, serviceDiscount, total, totalDiscount } = useCartCalculations(allServices);
```

**Retourne :**
- `subtotal` : Prix total sans promotions
- `serviceDiscount` : Réduction totale des promotions automatiques
- `total` : Prix final après toutes les réductions
- `totalDiscount` : Total des économies (serviceDiscount + promoDiscount)

### 4.2 Calcul du Subtotal

```typescript
export const calculateSubtotal = (allServices: GuestService[]): number => {
    return allServices.reduce((total, service) => {
        // Prix du service principal (option si présente, sinon service)
        const servicePrice = service.selectedOption
            ? service.selectedOption.price
            : service.price;

        // Prix des add-ons (prix normal × quantité)
        const addOnsPrice = service.selectedAddOns?.reduce((addOnTotal, addOn) => {
            return addOnTotal + (addOn.price * addOn.quantity);
        }, 0) || 0;

        return total + servicePrice + addOnsPrice;
    }, 0);
};
```

### 4.3 Calcul de la Réduction des Services

```typescript
export const calculateServiceDiscount = (allServices: GuestService[]): number => {
    return allServices.reduce((totalDiscount, service) => {
        let serviceDiscount = 0;

        // Réduction sur le service principal
        if (service.selectedOption) {
            const originalPrice = service.selectedOption.price;
            const promoPrice = service.selectedOption.promotionPrice;
            if (promoPrice === 0) {
                serviceDiscount = originalPrice; // Gratuit = réduction totale
            } else if (promoPrice !== null && promoPrice < originalPrice) {
                serviceDiscount = originalPrice - promoPrice;
            }
        } else {
            const originalPrice = service.price;
            const promoPrice = service.promotionPrice;
            if (promoPrice === 0) {
                serviceDiscount = originalPrice;
            } else if (promoPrice !== null && promoPrice < originalPrice) {
                serviceDiscount = originalPrice - promoPrice;
            }
        }

        // Réduction sur les add-ons
        const addOnsDiscount = service.selectedAddOns?.reduce((addOnDiscount, addOn) => {
            const originalPrice = addOn.price;
            const promoPrice = addOn.promotionPrice;
            if (promoPrice === 0) {
                addOnDiscount = originalPrice;
            } else if (promoPrice !== null && promoPrice < originalPrice) {
                addOnDiscount = originalPrice - promoPrice;
            }
            return addOnDiscount;
        }, 0) || 0;

        return totalDiscount + serviceDiscount + addOnsDiscount;
    }, 0);
};
```

### 4.4 Affichage des Calculs (Desktop/Tablet)

```tsx
{/* Subtotal */}
<div className="flex justify-between">
    <h4>Subtotal</h4>
    <span>{subtotal}</span>
</div>

{/* Discount (si > 0) */}
{serviceDiscount > 0 && (
    <div className="flex justify-between">
        <h4>Discount</h4>
        <span className="text-red-500">- {serviceDiscount}</span>
    </div>
)}

{/* Total */}
<div className="flex justify-between">
    <h4 className="font-bold">Total</h4>
    <span className="font-bold">{total}</span>
</div>
```

### 4.5 Message d'Économies

```tsx
{totalDiscount > 0 && (
    <div className="text-center">
        <span>
            You'll save <span className="text-red-500 font-bold">{totalDiscount}</span> after the discount.
        </span>
    </div>
)}
```

---

## 5. Boutons et Interactions

### 5.1 Bouton Panier (Header)

**Position :** En haut de la page (sticky)

```tsx
<button onClick={openModal} className="relative">
    <ShoppingCart />
    {totalServices > 0 && (
        <div className="badge">{totalServices}</div>
    )}
</button>
```

**Badge :** Affiche le nombre total de services de tous les invités

### 5.2 Bouton "Edit" (Multi-invités)

Si plusieurs invités, chaque section affiche un bouton "Edit" :

```tsx
{allGuests.length > 1 && (
    <div className="flex justify-between">
        <h3>{guestName}</h3>
        <Button onClick={() => {
            guestController.setActiveGuest(guest.id);
            closeModal?.();
        }}>
            Edit
        </Button>
    </div>
)}
```

**Action :** Active l'invité et ferme la modal pour permettre l'édition

### 5.3 Bouton "Continue"

**Position :** En bas de la modal (sticky)

```tsx
<Button
    onClick={handleContinue}
    disabled={allServices.length === 0}
    className="w-full bg-primary-color"
>
    {/* Mobile/Tablet : Affiche le prix */}
    {(isMobile || isTablet) && (
        <span>{total} - </span>
    )}
    Continue
</Button>
```

**Action :** Navigue vers l'étape suivante :
- Si `/professional` → `/time`
- Sinon → `/professional` (si `displaySelectMemberAutoOpen`) ou `/time`

**Désactivé si :** Aucun service dans le panier

### 5.4 Note de Paiement

**Affichage :** Si `hideAtVenue === false`

```tsx
{!hideAtVenue && (
    <NoteForPay lang={lang} />
)}
```

**Message :** "Pay at the venue — no online payment required."

---

## 6. Design Responsive

### 6.1 Mobile

- **Modal :** Plein écran depuis le bas (`rounded-t-3xl`)
- **Header :** Fixe en haut avec bouton fermer
- **Contenu :** Scrollable (`max-h-[61vh]`)
- **Bouton Continue :** Affiche le prix : `"{total} - Continue"`

### 6.2 Tablet

- **Modal :** Même comportement que mobile
- **Contenu :** Scrollable (`max-h-[70vh]`)
- **Bouton Continue :** Affiche le prix

### 6.3 Desktop

- **Modal :** Composant intégré (pas de modal overlay)
- **Contenu :** Scrollable (`max-h-[61vh]`)
- **Calculs :** Affichés dans le footer (Subtotal, Discount, Total)
- **Bouton Continue :** N'affiche pas le prix

### 6.4 Détection

```typescript
const isMobile = useIsMobile();
const isTablet = useIsTablet();
const isDesktop = !isMobile && !isTablet;
```

---

## 7. Code complet d'implémentation

### 7.1 ServicesCart.tsx (Simplifié)

```typescript
'use client';
import { Traductor } from '../../../../location';
import { ServicesCartType } from '../controllers/types';
import { useCartCalculations, getAllServicesFromGuests, navigateToNextStep } from '../controllers/servicesCartController';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { useIsMobile, useIsTablet } from '@/utils/isMobile';
import NoteForPay from './NoteForPay';

export default function ServicesCart({
    lang,
    shopData,
    guestController,
    category,
    booking_id,
    closeModal,
}: ServicesCartType) {
    const router = useRouter();
    const servicesByGuest = guestController.getAllGuests();
    const currency = shopData?.currency?.text || "THB";
    const isThaiLang = lang === "th";
    const isMobile = useIsMobile();
    const isTablet = useIsTablet();
    const isDesktop = !isMobile && !isTablet;
    const hideAtVenue = shopData?.settingCalendar?.hideAtVenue;

    // Obtenir tous les services
    const allServices = getAllServicesFromGuests(servicesByGuest);
    const allGuests = guestController.getAllGuests();

    // Calculs
    const { subtotal, serviceDiscount, total, totalDiscount } = useCartCalculations(allServices);

    const handleContinue = () => {
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
        if (currentPath.includes('/professional')) {
            const guestData = guestController.getDataForUrl();
            const query = guestData ? `?guests=${guestData}` : '';
            router.push(`/${lang}/${category}/${booking_id}/time${query}`);
        } else {
            navigateToNextStep(guestController, router, lang, category, booking_id, false, shopData);
        }
    };

    return (
        <div className="bg-white lg:rounded-3xl lg:shadow-lg lg:border lg:border-gray-100 py-4">
            {/* Header Desktop */}
            {isDesktop && (
                <div className="flex justify-between items-center pb-2 pl-4 mb-1 border-b border-gray-200">
                    <h2 className="text-lg font-semibold">
                        <Traductor keyWord="Appointment details" forcedLang={lang} />
                    </h2>
                </div>
            )}

            {/* Liste des services */}
            <div className={`overflow-y-auto scrollbar-thin ${isTablet ? "max-h-[70vh]" : "max-h-[61vh]"} px-4`}>
                {servicesByGuest.map((guest, guestIndex) => {
                    const guestName = guest.name === "Me" ? guest.name : wordSpaceLastLetter(guest.name);

                    return (
                        <div key={guest.id}>
                            {/* Message si vide */}
                            {allServices.length === 0 && (
                                <div className="flex items-center justify-center text-gray-500 text-sm my-4">
                                    <Traductor keyWord="Select services to continue" forcedLang={lang} />
                                </div>
                            )}

                            {/* Header invité (si plusieurs) */}
                            {allGuests.length > 1 && (
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">{guestName}</h3>
                                    <Button
                                        onClick={() => {
                                            guestController.setActiveGuest(guest.id);
                                            closeModal?.();
                                        }}
                                    >
                                        <Traductor keyWord="Edit" forcedLang={lang} />
                                    </Button>
                                </div>
                            )}

                            {/* Services de l'invité */}
                            {guest.services.sort((a, b) => a.duration - b.duration).map((service, serviceIndex) => (
                                <div key={service.id}>
                                    {/* Titre du service */}
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-primary-color" />
                                            <h4 className="text-sm font-semibold">
                                                {service.title_service?.[lang]?.text || service.name}
                                            </h4>
                                        </div>
                                    </div>

                                    {/* Option sélectionnée */}
                                    {service.selectedOption?.name && (
                                        <h5 className="text-sm font-medium">
                                            ({service.selectedOption.name})
                                        </h5>
                                    )}

                                    {/* Durée et Prix */}
                                    <div className="flex justify-between items-center gap-2 mb-4">
                                        <span className="text-sm font-medium text-[#000000AA]">
                                            {service.selectedOption?.durationText || service.durationText}
                                        </span>
                                        <div className="flex flex-1 justify-end items-center gap-2">
                                            {service.selectedOption ? (
                                                <>
                                                    {service.selectedOption.promotionPrice && (
                                                        <span className="text-gray-500 line-through text-sm">
                                                            {service.selectedOption.price}
                                                        </span>
                                                    )}
                                                    <span className="text-sm font-medium text-red-500">
                                                        {service.selectedOption.promotionPrice || service.selectedOption.price}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    {service.promotionPrice && (
                                                        <span className="text-gray-500 line-through text-sm">
                                                            {service.price}
                                                        </span>
                                                    )}
                                                    <span className="text-base font-medium text-red-500">
                                                        {service.promotionPrice === 0 ? "Free" : (service.promotionPrice || service.price)}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Add-ons */}
                                    {service.selectedAddOns && service.selectedAddOns.map((addOn, addOnIndex) => (
                                        <div key={addOn.id}>
                                            {addOnIndex === 0 && (
                                                <h4 className="text-sm font-semibold text-[#777978]">
                                                    <Traductor keyWord="Add-on" forcedLang={lang} /> :
                                                </h4>
                                            )}
                                            <div className="flex justify-between items-center">
                                                <div className="flex flex-1 justify-between items-center">
                                                    <h5 className="text-sm font-medium">
                                                        {addOn.name[lang]?.text || ""}
                                                    </h5>
                                                    <span className="text-xs font-semibold">X{addOn.quantity}</span>
                                                </div>
                                                <div className="flex flex-1 justify-end items-center gap-2">
                                                    {addOn.promotionPrice && (
                                                        <span className="text-gray-500 line-through">
                                                            {addOn.price}
                                                        </span>
                                                    )}
                                                    <span className="text-base font-medium text-red-500">
                                                        {addOn.promotionPrice === 0 ? "Free" : (addOn.promotionPrice || addOn.price)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Séparateur entre services */}
                                    {serviceIndex !== guest.services.length - 1 && (
                                        <div className="border-t-[0.5px] border-[#D9D9D9] my-2 mx-20" />
                                    )}
                                </div>
                            ))}

                            {/* Séparateur entre invités */}
                            {guestIndex !== servicesByGuest.length - 1 && (
                                <div className="border-t-[1px] border-[#000000] my-6" />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer avec calculs et bouton */}
            <div className="px-4">
                {/* Séparateur Desktop */}
                {isDesktop && <div className="border-t-[1px] border-[#000000] my-4" />}

                {/* Subtotal Desktop */}
                {isDesktop && (
                    <div className="flex justify-between items-center">
                        <h4 className="text-sm font-semibold">
                            <Traductor keyWord="Subtotal" forcedLang={lang} />
                        </h4>
                        <span className="text-sm font-medium">
                            {isThaiLang && currency} {subtotal} {!isThaiLang && currency}
                        </span>
                    </div>
                )}

                {/* Discount Desktop */}
                {serviceDiscount > 0 && isDesktop && (
                    <div className="flex justify-between items-center">
                        <h4 className="text-sm font-semibold">
                            <Traductor keyWord="Discount" forcedLang={lang} />
                        </h4>
                        <span className="text-sm font-medium text-red-500">
                            - {isThaiLang && currency} {serviceDiscount} {!isThaiLang && currency}
                        </span>
                    </div>
                )}

                {/* Séparateur Desktop */}
                {isDesktop && <div className="border-t-[1px] border-[#000000] my-4" />}

                {/* Total Desktop */}
                {isDesktop && (
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-base font-bold">
                            <Traductor keyWord="Total" forcedLang={lang} />
                        </h4>
                        <span className="text-base font-bold">
                            {isThaiLang && currency} {total} {!isThaiLang && currency}
                        </span>
                    </div>
                )}

                {/* Note de paiement */}
                {!hideAtVenue && <NoteForPay lang={lang} />}

                {/* Message d'économies */}
                {totalDiscount > 0 && (
                    <>
                        <div className="border-t-[1px] border-[#000000]/20 mt-4" />
                        <div className="text-center my-1">
                            <span className="text-xs font-medium">
                                <Traductor keyWord="You'll save" forcedLang={lang} />
                                <span className="text-xs font-bold text-red-500">
                                    {isThaiLang && currency} {totalDiscount} {!isThaiLang && currency}
                                </span>
                                <Traductor keyWord="after the discount" forcedLang={lang} />.
                            </span>
                        </div>
                    </>
                )}

                {/* Bouton Continue */}
                <Button
                    onClick={handleContinue}
                    disabled={allServices.length === 0}
                    className="w-full bg-primary-color rounded-xl py-3 px-6 font-medium"
                >
                    {(isMobile || isTablet) && (
                        <span className="text-base font-medium">
                            {isThaiLang && currency} {total} {!isThaiLang && currency} - 
                        </span>
                    )}
                    <Traductor keyWord="Continue" forcedLang={lang} />
                </Button>
            </div>
        </div>
    );
}
```

### 7.2 ServicesCartButtons.tsx (Bouton Panier + Modal)

```typescript
export const ServicesCartButtons = ({
    lang,
    shopData,
    guestController,
    category,
    booking_id
}: ServicesCartType & { category: string; booking_id: string }) => {
    const router = useRouter();
    const { isModalOpen, isClosing, openModal, closeModal } = useCartModal();
    const servicesByGuest = guestController.getAllGuests();
    const allServices = getAllServicesFromGuests(servicesByGuest);
    const totalServices = allServices.length;

    useModalScrollLock(isModalOpen, closeModal);

    const handleContinue = () => {
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
        if (currentPath.includes('/professional')) {
            const guestData = guestController.getDataForUrl();
            const query = guestData ? `?guests=${guestData}` : '';
            router.push(`/${lang}/${category}/${booking_id}/time${query}`);
        } else {
            navigateToNextStep(guestController, router, lang, category, booking_id, false, shopData);
        }
    };

    return (
        <>
            {/* Boutons principaux */}
            <div className="flex items-center gap-4 bg-white px-4 py-2">
                {/* Bouton panier avec badge */}
                <button
                    onClick={openModal}
                    className="relative bg-white border border-primary-color rounded-lg p-3 hover:bg-gray-50"
                >
                    <ShoppingCart className="w-6 h-6 text-primary-color" />
                    {totalServices > 0 && (
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {totalServices}
                        </div>
                    )}
                </button>

                {/* Bouton continuer */}
                <Button
                    onClick={handleContinue}
                    disabled={totalServices <= 0}
                    className="flex-1 bg-primary-color text-white rounded-xl py-3 px-6"
                >
                    <Traductor keyWord="Continue" forcedLang={lang} />
                </Button>
            </div>

            {/* Modal du panier */}
            {(isModalOpen || isClosing) && (
                <div
                    className={`fixed inset-0 bg-black/50 flex items-end z-50 transition-opacity duration-300
                        ${isClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
                    onClick={closeModal}
                >
                    <div
                        className={`bg-white w-full rounded-t-3xl transition-transform duration-300
                            ${isClosing ? 'animate-slideOutDown' : 'animate-slideInUp'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold">
                                <Traductor keyWord="Appointment details" forcedLang={lang} />
                            </h2>
                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Contenu */}
                        <div className="relative">
                            <ServicesCart
                                lang={lang}
                                shopData={shopData}
                                guestController={guestController}
                                category={category}
                                booking_id={booking_id}
                                closeModal={closeModal}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
```

---

## 8. Résumé

### Structure
- **Modal** : Slide depuis le bas (mobile/tablet) ou intégrée (desktop)
- **Services** : Groupés par invité, triés par durée
- **Affichage** : Titre, option, durée, prix, add-ons

### Calculs
- **Subtotal** : Prix sans promotions
- **Service Discount** : Réductions automatiques
- **Total** : Prix final après réductions
- **Total Discount** : Économies totales

### Interactions
- **Bouton Panier** : Ouvre la modal avec badge
- **Bouton Edit** : Active un invité pour modification
- **Bouton Continue** : Navigue vers l'étape suivante

### Responsive
- **Mobile/Tablet** : Modal plein écran, prix dans le bouton
- **Desktop** : Composant intégré, calculs détaillés

---

**Dernière mise à jour :** 2025-01-21

