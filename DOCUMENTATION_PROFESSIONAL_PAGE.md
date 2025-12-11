# 📚 Documentation - Page Professional (Sélection des Membres d'Équipe)

## 📋 Table des matières
1. [Vue d'ensemble](#1-vue-densemble)
2. [Quand la page s'affiche](#2-quand-la-page-saffiche)
3. [Structure de la Page](#3-structure-de-la-page)
4. [Sélection des Membres](#4-sélection-des-membres)
5. [Cas d'Affichage](#5-cas-daffichage)
6. [Validation et Navigation](#6-validation-et-navigation)
7. [Code complet d'implémentation](#7-code-complet-dimplémentation)

---

## 1. Vue d'ensemble

La page Professional permet de sélectionner un membre d'équipe (professionnel) pour chaque service sélectionné. Elle s'affiche **uniquement** si `displaySelectMemberAutoOpen === true` dans les paramètres du shop.

**Fichiers principaux :**
- `src/components/PageProfessional/ProfessionalPage.tsx` : Page principale
- `src/components/PageProfessional/models/ProfessionalSelector.tsx` : Sélecteur de membres
- `src/components/PageProfessional/models/ProfessionalSummary.tsx` : Résumé (non utilisé actuellement)

**URL :** `/{lang}/{category}/{booking_id}/professional?guests={guestData}`

---

## 2. Quand la page s'affiche

### 2.1 Condition d'affichage

La page Professional s'affiche **SEULEMENT** si :

```typescript
shopData?.settingCalendar?.displaySelectMemberAutoOpen === true
```

**Si `displaySelectMemberAutoOpen === false` :**
- La page redirige automatiquement vers `/time`
- La sélection des membres se fait directement sur la page Time (si `displaySelectMember === true`)

### 2.2 Redirection automatique

**Dans `ProfessionalPage.tsx` :**
```typescript
useEffect(() => {
    if (shopData && shopData.settingCalendar) {
        const displaySelectMemberAutoOpen = shopData.settingCalendar.displaySelectMemberAutoOpen;
        if (!displaySelectMemberAutoOpen) {
            // Rediriger vers time si displaySelectMemberAutoOpen est false
            const guestData = guestController.getDataForUrl();
            const query = guestData ? `?guests=${guestData}` : (guestsParam ? `?guests=${guestsParam}` : '');
            router.replace(`/${lang}/${category}/${booking_id}/time${query}`);
        }
    }
}, [shopData, router, lang, category, booking_id, guestController, guestsParam]);
```

### 2.3 Navigation depuis Services

**Dans `servicesCartController.ts` :**
```typescript
export const navigateToNextStep = (
    guestController: any,
    router: any,
    lang: string,
    category: string,
    booking_id: string,
    goServicesPage?: boolean,
    shopData?: any
) => {
    const guestData = guestController.getDataForUrl();
    if (guestData) {
        // Vérifier si displaySelectMemberAutoOpen est activé
        const displaySelectMemberAutoOpen = shopData?.settingCalendar?.displaySelectMemberAutoOpen;
        if (displaySelectMemberAutoOpen) {
            // Rediriger vers professional
            const nextUrl = `/${lang}/${category}/${booking_id}/professional?guests=${guestData}`;
            router.push(nextUrl);
        } else {
            // Rediriger directement vers time
            const nextUrl = `/${lang}/${category}/${booking_id}/time?guests=${guestData}`;
            router.push(nextUrl);
        }
    }
};
```

### 2.4 Paramètres du Shop

**Dans `Shop.settingCalendar` :**
```typescript
{
    displaySelectMember: boolean;              // Afficher la sélection de membre (sur Time page)
    displaySelectMemberAutoOpen: boolean;      // Afficher la page Professional dédiée
    forceMemberSelection: boolean;            // Forcer la sélection d'un membre (pas "Any professional")
}
```

**Logique :**
- `displaySelectMemberAutoOpen === true` → Page Professional dédiée
- `displaySelectMemberAutoOpen === false` → Pas de page Professional, sélection sur Time (si `displaySelectMember === true`)

---

## 3. Structure de la Page

### 3.1 Layout

```
┌─────────────────────────────────────────┐
│  NavigationHeader (Back/Close)          │
├─────────────────────────────────────────┤
│  Breadcrumbs (Services > Professional)  │
├─────────────────────────────────────────┤
│  ┌──────────────────┬─────────────────┐│
│  │  Professional     │  ServicesCart   ││
│  │  Selector         │  (Desktop)      ││
│  │  (Left Panel)     │  (Right Panel)  ││
│  └──────────────────┴─────────────────┘│
│                                         │
│  ServicesCartButtons (Mobile/Tablet)    │
│  (Sticky Bottom)                        │
└─────────────────────────────────────────┘
```

### 3.2 Composants

**Desktop :**
- **Left Panel** : `ProfessionalSelector` (flex-1)
- **Right Panel** : `ServicesCart` (w-[450px], sticky)

**Mobile/Tablet :**
- **Main Content** : `ProfessionalSelector` (full width)
- **Bottom Bar** : `ServicesCartButtons` (sticky)

### 3.3 Code Structure

```typescript
<div className="flex flex-col min-h-screen">
    <div className="relative flex-1">
        <div className="mt-4 max-w-7xl mx-auto px-4 mb-12">
            {/* NavigationHeader */}
            <NavigationHeader />
            
            {/* Breadcrumbs */}
            <Breadcrumbs currentStep="professional" />
            
            {/* Main Content */}
            <div className="flex flex-col lg:flex-row gap-8 mt-6">
                {/* Left Panel - Professional Selector */}
                <div className="flex-1 min-w-0">
                    <h2>Select professional</h2>
                    <ProfessionalSelector />
                </div>
                
                {/* Right Panel - Cart (Desktop only) */}
                {!isMobile && !isTablet && (
                    <div className="w-full lg:w-[450px] shrink-0">
                        <ServicesCart />
                    </div>
                )}
            </div>
        </div>
    </div>
    
    {/* Bottom Bar (Mobile/Tablet) */}
    {(isMobile || isTablet) && (
        <ServicesCartButtons />
    )}
</div>
```

---

## 4. Sélection des Membres

### 4.1 Filtrage des Membres Disponibles

**Logique :**
1. Si **aucun service** sélectionné → Afficher **tous les membres**
2. Si **services sélectionnés** → Filtrer les membres qui peuvent faire **au moins un service**

```typescript
const allGuestServices = guestController.getAllGuests().flatMap(guest => guest.services);

const availableMembers = allGuestServices.length === 0 
    ? (teamMembers || [])  // Tous les membres
    : (teamMembers?.filter(member => {
        if (!member.services || member.services.length === 0) return false;
        // Membre peut faire au moins un service sélectionné
        return allGuestServices.some(service => member.services.includes(service.id));
    }) || []);
```

### 4.2 Option "Any Professional"

**Toujours disponible en premier :**
```typescript
const allMembers = [
    { id: 'notSpecific', first_name: 'Any professional', job_title: 'for maximum availability' },
    ...availableMembers
];
```

**Valeur :** `'notSpecific'` (pas un ID de membre réel)

**Affichage :**
- Image : `/anyPro.webp`
- Texte : "Any professional" (ou "Any stylist" pour salons de coiffure/barbiers)
- Description : "for maximum availability"

### 4.3 Assignation d'un Membre

**Fonction :**
```typescript
const handleSelectMember = (guestId: string, serviceId: string, memberId: string) => {
    const guests = guestController.getAllGuests();
    const guest = guests.find(g => g.id === guestId);
    
    if (guest) {
        const service = guest.services.find(s => s.id === serviceId);
        if (service) {
            // Mettre à jour le membre
            service.teamMemberId = memberId;
            
            // Forcer la mise à jour
            forceUpdate();
            
            // Notifier le parent
            onSelectionChange?.();
            
            // Mettre à jour l'URL
            urlController?.updateURL();
        }
    }
    
    // Fermer la sélection
    setSelectingFor(null);
};
```

**Stockage :**
- Dans `GuestService.teamMemberId`
- Valeur : ID du membre ou `'notSpecific'`

---

## 5. Cas d'Affichage

### 5.1 Cas 1 : Aucun Service

**Affichage :**
```tsx
<div className="text-center py-8">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <User className="w-8 h-8 text-gray-400" />
    </div>
    <p className="text-gray-500">
        No services selected
    </p>
</div>
```

### 5.2 Cas 2 : Un Seul Service

**Affichage direct de la liste des membres :**
```typescript
const singleServiceInfo = useMemo(() => {
    if (totalServices === 1 && guestsWithServices.length === 1) {
        const { guest, servicesWithMembers } = guestsWithServices[0];
        if (servicesWithMembers.length === 1) {
            return {
                guestId: guest.id,
                service: servicesWithMembers[0].service,
                member: servicesWithMembers[0].member
            };
        }
    }
    return null;
}, [totalServices, guestsWithServices]);

// Si un seul service → afficher directement la liste
if (singleServiceInfo) {
    return renderMemberList(singleServiceInfo.guestId, singleServiceInfo.service, true);
}
```

**Interface :**
- Liste complète des membres disponibles
- Option "Any professional" en premier
- Sélection directe (pas de navigation)

### 5.3 Cas 3 : Plusieurs Services (Vue Principale)

**Affichage par invité :**
```tsx
{guestsWithServices.map(({ guest, servicesWithMembers }) => (
    <div className="border border-gray-200 rounded-xl">
        {/* Guest Header */}
        <div className="bg-gray-50 px-4 py-3 border-b">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-color text-white rounded-full">
                    {guest.name === 'Me' ? 'M' : guest.name.charAt(0)}
                </div>
                <div>
                    <h3>{guest.name === 'Me' ? 'Me' : guest.name}</h3>
                    <p>{servicesWithMembers.length} services</p>
                </div>
            </div>
            <p>{formatDuration(totalDuration)}</p>
        </div>
        
        {/* Services List */}
        <div className="divide-y">
            {servicesWithMembers.map(({ service, member }) => (
                <div className="p-4">
                    {/* Service Info */}
                    <div>
                        <h4>{service.name}</h4>
                        <p>{formatDuration(service.duration)}</p>
                    </div>
                    
                    {/* Member Selection Button */}
                    <Button onClick={() => setSelectingFor({ guestId: guest.id, serviceId: service.id })}>
                        <Image src={getMemberDisplayImage(member)} />
                        <span>{member ? member.first_name : 'Any professional'}</span>
                        <ChevronRight />
                    </Button>
                </div>
            ))}
        </div>
    </div>
))}
```

### 5.4 Cas 4 : Sélection d'un Membre (Vue Détail)

**Quand on clique sur un service :**
```typescript
if (selectingFor) {
    const guest = guests.find(g => g.id === selectingFor.guestId);
    const service = guest?.services.find(s => s.id === selectingFor.serviceId);
    
    return (
        <div className="space-y-4">
            {/* Header avec bouton retour */}
            <div className="flex items-center gap-3">
                <button onClick={() => setSelectingFor(null)}>
                    <ArrowLeft />
                </button>
                <div>
                    <h3>Choose stylist</h3>
                    <p>{service.name} - {guest?.name}</p>
                </div>
            </div>
            
            {/* Liste des membres */}
            {renderMemberList(selectingFor.guestId, service, false)}
        </div>
    );
}
```

---

## 6. Validation et Navigation

### 6.1 Validation (forceMemberSelection)

**Si `forceMemberSelection === true` :**
- **Tous les services** doivent avoir un membre sélectionné (pas "Any professional")
- Le bouton "Continue" est **désactivé** si un service n'a pas de membre

```typescript
const forceMemberSelection = shopData?.settingCalendar?.forceMemberSelection;
const allGuests = guestController.getAllGuests();
const allServicesWithMember = allGuests.every(guest => 
    guest.services.every(service => service.teamMemberId !== "notSpecific")
);
const canContinue = !forceMemberSelection || allServicesWithMember;
```

**Si `forceMemberSelection === false` :**
- Les services peuvent avoir "Any professional"
- Le bouton "Continue" est toujours activé (si services présents)

### 6.2 Navigation Continue

**Action :**
```typescript
const handleContinue = () => {
    const guestData = guestController.getDataForUrl();
    const query = guestData ? `?guests=${guestData}` : '';
    router.push(`/${lang}/${category}/${booking_id}/time${query}`);
};
```

**Redirection :** Vers `/time` avec les données des invités dans l'URL

### 6.3 Blocage des Doublons (Multi-invités)

**Si plusieurs invités :**
- Un membre **ne peut pas** être assigné à plusieurs invités en même temps
- Les membres déjà assignés sont **désactivés** pour les autres invités

```typescript
const getMembersSelectedByOtherGuests = (currentGuestId: string): Set<string> => {
    const selectedMembers = new Set<string>();
    
    // Si un seul guest, pas de restriction
    if (numberOfGuests <= 1) return selectedMembers;
    
    const guests = guestController.getAllGuests();
    guests.forEach(guest => {
        if (guest.id !== currentGuestId) {
            guest.services.forEach(service => {
                if (service.teamMemberId && service.teamMemberId !== 'notSpecific') {
                    selectedMembers.add(service.teamMemberId);
                }
            });
        }
    });
    
    return selectedMembers;
};
```

**Affichage :**
- Membre désactivé : Opacité réduite, icône Ban, texte "Already assigned to another guest"

---

## 7. Code complet d'implémentation

### 7.1 ProfessionalPage.tsx

```typescript
"use client";
import { useEffect, useState, useCallback } from 'react';
import { useService } from '@/contexts/ServiceContext';
import { useShop } from '@/contexts/ShopContext';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTeam } from '@/contexts/TeamContext';
import { setAppLang, Traductor } from '../../../location';
import { URLController } from '../PageServices/controllers/servicesPageController';
import { GuestController } from '../PageServices/controllers/guestController';
import NavigationHeader from '../NavigationHeader/NavigationHeader';
import Breadcrumbs from '../Breadcrumbs/Breadcrumbs';
import ProfessionalSelector from './models/ProfessionalSelector';
import ServicesCart, { ServicesCartButtons } from '../PageServices/models/ServicesCart';
import { TeamMemberType } from '../PageServices/controllers/types';
import { useIsMobile, useIsTablet } from '@/utils/isMobile';

export default function ProfessionalPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const lang = params?.lang as string || setAppLang();
    const category = params?.category as string;
    const booking_id = params?.booking_id as string;
    const guestsParam = searchParams.get('guests');
    const booking_number_param = searchParams.get('set');

    const { shopData, fetchShopData } = useShop();
    const { services, fetchServiceData, loadingServices } = useService();
    const { teamMembers, fetchTeamData } = useTeam();
    const [guestController] = useState(() => new GuestController());
    const [urlController] = useState(() => new URLController());
    const isStylist = ["salon-de-coiffure", "barbiers"].includes(shopData?.shopType?.id || '');
    const isMobile = useIsMobile();
    const isTablet = useIsTablet();
    
    const [isRestored, setIsRestored] = useState(false);
    const [, forceUpdate] = useState({});

    // Initialiser les données
    useEffect(() => {
        if (booking_id) {
            if (!shopData || Object.keys(shopData).length === 0) {
                fetchShopData(booking_id);
            }
            if (!services || services.length === 0) {
                fetchServiceData(booking_id);
            }
            if (!teamMembers || Object.keys(teamMembers).length === 0) {
                fetchTeamData(booking_id);
            }
        }
    }, [booking_id]);

    // Restaurer les données depuis l'URL
    useEffect(() => {
        if (services && services.length > 0 && guestsParam && !isRestored) {
            try {
                const existingGuests = guestController.getAllGuests();
                const hasGuestsWithServices = existingGuests.some((guest: any) => guest.services.length > 0);

                if (!hasGuestsWithServices) {
                    guestController.restoreFromUrl(guestsParam, services);
                    setIsRestored(true);
                    forceUpdate({});
                } else {
                    setIsRestored(true);
                }
            } catch (error) {
                console.error('Error restoring from URL:', error);
                setIsRestored(true);
            }
        } else if (!guestsParam) {
            setIsRestored(true);
        }
    }, [services, guestsParam, isRestored, guestController]);

    // ⚠️ REDIRECTION SI displaySelectMemberAutoOpen === false
    useEffect(() => {
        if (shopData && shopData.settingCalendar) {
            const displaySelectMemberAutoOpen = shopData.settingCalendar.displaySelectMemberAutoOpen;
            if (!displaySelectMemberAutoOpen) {
                const guestData = guestController.getDataForUrl();
                const query = guestData ? `?guests=${guestData}` : (guestsParam ? `?guests=${guestsParam}` : '');
                router.replace(`/${lang}/${category}/${booking_id}/time${query}`);
            }
        }
    }, [shopData, router, lang, category, booking_id, guestController, guestsParam]);

    // Configurer le contrôleur d'URL
    useEffect(() => {
        urlController.configure(guestController, router, searchParams, lang, category, booking_id, 'professional');
        guestController.setURLController(urlController);
    }, [guestController, urlController, router, searchParams, lang, category, booking_id]);

    const onSelectionChange = useCallback(() => {
        forceUpdate({});
    }, []);

    // Obtenir les membres disponibles
    const allGuestServices = guestController.getAllGuests().flatMap(guest => guest.services);
    
    const availableMembers = allGuestServices.length === 0 
        ? (teamMembers || [])
        : (teamMembers?.filter(member => {
            if (!member.services || member.services.length === 0) return false;
            return allGuestServices.some(service => member.services.includes(service.id));
        }) || []);

    // Ajouter "Any professional"
    const allMembers: (TeamMemberType | { id: 'notSpecific'; first_name: string; job_title?: string })[] = [
        { id: 'notSpecific', first_name: 'Any professional', job_title: 'for maximum availability' },
        ...availableMembers
    ];

    const backUrl = () => {
        if (booking_number_param) {
            return `/${lang}/profile`;
        } else {
            const guestData = guestController.getDataForUrl() || guestsParam;
            return `/${lang}/${category}/${booking_id}/services${guestData ? `?guests=${guestData}` : ''}`;
        }
    };

    const handleContinue = () => {
        const guestData = guestController.getDataForUrl();
        const query = guestData ? `?guests=${guestData}` : '';
        router.push(`/${lang}/${category}/${booking_id}/time${query}`);
    };

    // Validation
    const forceMemberSelection = shopData?.settingCalendar?.forceMemberSelection;
    const allGuests = guestController.getAllGuests();
    const allServicesWithMember = allGuests.every(guest => 
        guest.services.every(service => service.teamMemberId !== "notSpecific")
    );
    const canContinue = !forceMemberSelection || allServicesWithMember;

    const isLoading = loadingServices || !isRestored;

    return (
        <div className="flex flex-col min-h-screen">
            <div className="relative flex-1">
                <div className="mt-4 max-w-7xl mx-auto px-4 mb-12">
                    <NavigationHeader
                        backUrl={backUrl()}
                        onClose={() => router.push(`/${lang}/${category}/${booking_id}`)}
                        shopData={shopData}
                    />

                    <Breadcrumbs
                        currentStep="professional"
                        booking_id={booking_id}
                        lang={lang}
                        category={category}
                        displaySelectMemberAutoOpen={shopData?.settingCalendar?.displaySelectMemberAutoOpen || false}
                    />

                    <div className="flex flex-col lg:flex-row gap-8 mt-6">
                        {/* Left Panel */}
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-semibold mb-4">
                                <Traductor keyWord="Select professional" forcedLang={lang} />
                            </h2>

                            {isLoading ? (
                                <div className="space-y-4">
                                    <div className="animate-pulse">
                                        <div className="h-24 bg-gray-200 rounded-xl mb-3"></div>
                                        <div className="h-16 bg-gray-200 rounded-xl mb-3"></div>
                                    </div>
                                </div>
                            ) : (
                                <ProfessionalSelector
                                    guestController={guestController}
                                    teamMembers={teamMembers || []}
                                    lang={lang}
                                    isStylist={isStylist}
                                    urlController={urlController}
                                    onSelectionChange={onSelectionChange}
                                />
                            )}
                        </div>

                        {/* Right Panel (Desktop) */}
                        {(!isMobile && !isTablet) && (
                            <div className="w-full lg:w-[450px] shrink-0">
                                <div className="lg:sticky lg:top-4">
                                    <ServicesCart
                                        lang={lang}
                                        shopData={shopData}
                                        guestController={guestController}
                                        category={category}
                                        booking_id={booking_id}
                                        closeModal={undefined}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Bottom Bar (Mobile/Tablet) */}
            {(isMobile || isTablet) && (
                <div className="border border-gray-200 sticky bottom-0 z-30 bg-white">
                    <ServicesCartButtons
                        lang={lang}
                        shopData={shopData}
                        guestController={guestController}
                        category={category}
                        booking_id={booking_id}
                    />
                </div>
            )}
        </div>
    );
}
```

### 7.2 ProfessionalSelector.tsx (Simplifié - Cas Multi-services)

```typescript
export default function ProfessionalSelector({
    guestController,
    teamMembers,
    lang,
    isStylist,
    urlController,
    onSelectionChange,
}: ProfessionalSelectorProps) {
    const [selectingFor, setSelectingFor] = useState<{ guestId: string; serviceId: string } | null>(null);
    const [updateKey, setUpdateKey] = useState(0);

    const forceUpdate = useCallback(() => {
        setUpdateKey(prev => prev + 1);
    }, []);

    const guestsWithServices = useMemo(() => {
        const guests = guestController.getAllGuests();
        return guests.map(guest => ({
            guest,
            servicesWithMembers: guest.services.map(service => {
                const member = service.teamMemberId && service.teamMemberId !== 'notSpecific'
                    ? teamMembers.find(m => m.id === service.teamMemberId) || null
                    : null;
                return { service, member };
            })
        }));
    }, [guestController, teamMembers, updateKey]);

    const handleSelectMember = useCallback((guestId: string, serviceId: string, memberId: string) => {
        const guests = guestController.getAllGuests();
        const guest = guests.find(g => g.id === guestId);
        
        if (guest) {
            const service = guest.services.find(s => s.id === serviceId);
            if (service) {
                service.teamMemberId = memberId;
                forceUpdate();
                onSelectionChange?.();
                urlController?.updateURL();
            }
        }
        setSelectingFor(null);
    }, [guestController, forceUpdate, onSelectionChange, urlController]);

    const getAvailableMembersForService = useCallback((serviceId: string) => {
        return teamMembers.filter(member =>
            member.services && member.services.includes(serviceId)
        );
    }, [teamMembers]);

    const getMembersSelectedByOtherGuests = useCallback((currentGuestId: string): Set<string> => {
        const selectedMembers = new Set<string>();
        const numberOfGuests = guestsWithServices.length;
        
        if (numberOfGuests <= 1) return selectedMembers;
        
        const guests = guestController.getAllGuests();
        guests.forEach(guest => {
            if (guest.id !== currentGuestId) {
                guest.services.forEach(service => {
                    if (service.teamMemberId && service.teamMemberId !== 'notSpecific') {
                        selectedMembers.add(service.teamMemberId);
                    }
                });
            }
        });
        
        return selectedMembers;
    }, [guestController, guestsWithServices.length]);

    // Vue de sélection d'un membre
    if (selectingFor) {
        const guests = guestController.getAllGuests();
        const guest = guests.find(g => g.id === selectingFor.guestId);
        const service = guest?.services.find(s => s.id === selectingFor.serviceId);
        
        if (!service) return null;

        const availableMembers = getAvailableMembersForService(service.id);
        const membersSelectedByOthers = getMembersSelectedByOtherGuests(selectingFor.guestId);
        const currentMemberId = service.teamMemberId;

        return (
            <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => setSelectingFor(null)}>
                        <ArrowLeft />
                    </button>
                    <div>
                        <h3>Choose stylist</h3>
                        <p>{service.name} - {guest?.name}</p>
                    </div>
                </div>

                {/* Option "Any professional" */}
                <button
                    onClick={() => handleSelectMember(selectingFor.guestId, selectingFor.serviceId, 'notSpecific')}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl ${
                        !currentMemberId || currentMemberId === 'notSpecific'
                            ? 'bg-primary-color/10 border-2 border-primary-color'
                            : 'bg-white border border-gray-200'
                    }`}
                >
                    <Image src="/anyPro.webp" width={48} height={48} />
                    <div className="flex-1 text-left">
                        <p className="font-medium">
                            <Traductor keyWord={isStylist ? "Any stylist" : "Any professional"} forcedLang={lang} />
                        </p>
                        <p className="text-sm text-gray-500">
                            <Traductor keyWord="for maximum availability" forcedLang={lang} />
                        </p>
                    </div>
                    {(!currentMemberId || currentMemberId === 'notSpecific') && (
                        <Check className="w-5 h-5 text-primary-color" />
                    )}
                </button>

                {/* Liste des membres */}
                {availableMembers.map((member) => {
                    const isSelected = currentMemberId === member.id;
                    const isSelectedByOther = membersSelectedByOthers.has(member.id);
                    const isDisabled = isSelectedByOther && !isSelected;
                    
                    return (
                        <button
                            key={member.id}
                            onClick={() => !isDisabled && handleSelectMember(selectingFor.guestId, selectingFor.serviceId, member.id)}
                            disabled={isDisabled}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl ${
                                isSelected
                                    ? 'bg-primary-color/10 border-2 border-primary-color'
                                    : isDisabled
                                    ? 'bg-gray-100 opacity-50 cursor-not-allowed'
                                    : 'bg-white border border-gray-200'
                            }`}
                        >
                            <Image src={member.photo_url || '/default-avatar.png'} width={48} height={48} />
                            <div className="flex-1 text-left">
                                <p className="font-medium">{member.first_name}</p>
                                <p className="text-sm text-gray-500">
                                    {isDisabled ? (
                                        <Traductor keyWord="Already assigned to another guest" forcedLang={lang} />
                                    ) : (
                                        member.job_title || ''
                                    )}
                                </p>
                            </div>
                            {isSelected && <Check />}
                        </button>
                    );
                })}
            </div>
        );
    }

    // Vue principale (plusieurs services)
    return (
        <div className="space-y-4">
            {guestsWithServices.map(({ guest, servicesWithMembers }) => (
                <div key={guest.id} className="border border-gray-200 rounded-xl">
                    {/* Guest Header */}
                    <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary-color text-white rounded-full">
                                {guest.name === 'Me' ? 'M' : guest.name.charAt(0)}
                            </div>
                            <div>
                                <h3>{guest.name === 'Me' ? 'Me' : guest.name}</h3>
                                <p>{servicesWithMembers.length} services</p>
                            </div>
                        </div>
                        <p>{formatDuration(totalDuration)}</p>
                    </div>

                    {/* Services */}
                    <div className="divide-y">
                        {servicesWithMembers.map(({ service, member }) => (
                            <div key={service.id} className="p-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4>{service.name}</h4>
                                        <p>{formatDuration(service.duration)}</p>
                                    </div>
                                    <Button
                                        onClick={() => setSelectingFor({ guestId: guest.id, serviceId: service.id })}
                                    >
                                        <Image src={getMemberDisplayImage(member)} width={28} height={28} />
                                        <span>{member ? member.first_name : 'Any professional'}</span>
                                        <ChevronRight />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
```

---

## 8. Résumé

### Conditions d'affichage
- **Afficher** : `displaySelectMemberAutoOpen === true`
- **Rediriger** : `displaySelectMemberAutoOpen === false` → `/time`

### Fonctionnalités
- Sélection d'un membre par service
- Option "Any professional" toujours disponible
- Blocage des doublons (multi-invités)
- Validation avec `forceMemberSelection`

### Navigation
- **Back** : Vers `/services` ou `/profile` (si `set` param)
- **Continue** : Vers `/time` avec données dans l'URL

### Responsive
- **Desktop** : 2 colonnes (Selector + Cart)
- **Mobile/Tablet** : 1 colonne + Bottom bar

---

**Dernière mise à jour :** 2025-01-21

