# 📚 Documentation - Page Services (Sélection des Services)

## 📋 Table des matières
1. [Vue d'ensemble](#1-vue-densemble)
2. [Système de Disponibilité des Membres d'Équipe](#2-système-de-disponibilité-des-membres-déquipe)
3. [Logique de Blocage des Services](#3-logique-de-blocage-des-services)
4. [Structure de la Page](#4-structure-de-la-page)
5. [Affichage des Services](#5-affichage-des-services)
6. [Code complet d'implémentation](#6-code-complet-dimplémentation)

---

## 1. Vue d'ensemble

La page Services permet de sélectionner des services pour un ou plusieurs invités (guests). Elle gère automatiquement la disponibilité des membres d'équipe pour éviter les conflits.

**Fichiers principaux :**
- `src/components/PageServices/ServicesPage.tsx` : Page principale
- `src/components/PageServices/models/ServiceItem.tsx` : Composant d'un service
- `src/components/PageServices/controllers/serviceItemController.ts` : Logique de disponibilité
- `src/components/PageServices/models/ServicesCategory.tsx` : Groupement par catégorie

**URL :** `/{lang}/{category}/{booking_id}/services?guests={guestData}`

---

## 2. Système de Disponibilité des Membres d'Équipe

### 2.1 Problème à Résoudre

**Scénario :**
- 3 invités (Guest1, Guest2, Guest3)
- 1 service "Coupe de cheveux"
- 2 membres d'équipe peuvent faire ce service (MemberA, MemberB)

**Question :** Le 3ème invité peut-il sélectionner le service ?

**Réponse :** ❌ **NON** - Le service est **bloqué** pour le 3ème invité car il n'y a pas assez de membres disponibles.

### 2.2 Règle de Base

**Un service est disponible pour un invité SI :**
- Il existe **au moins un membre d'équipe** disponible pour cet invité
- Le membre doit pouvoir faire le service (`member.services.includes(serviceId)`)
- Le membre ne doit pas être déjà assigné à un autre invité pour le même service

### 2.3 Fonction `isServiceFullyBooked`

**Fichier :** `src/components/PageServices/controllers/serviceItemController.ts`

```typescript
export const isServiceFullyBooked = (
    serviceId: string,
    guestController: GuestController,
    teamMembers: TeamMemberType[],
): boolean => {
    const activeGuestId = guestController.getActiveGuest()?.id;
    if (!activeGuestId) return true;

    // 1. Récupérer tous les membres qui peuvent faire ce service
    const availableTeamMembersForService = getTeamMembersForService(serviceId, teamMembers);

    // 2. Si aucun membre ne peut faire le service → indisponible
    if (availableTeamMembersForService.length === 0) {
        return true;
    }

    // 3. Vérifier si on peut assigner un membre à l'invité actif
    return assigneMembersToGuests(serviceId, guestController, teamMembers);
};
```

**Retourne :**
- `true` : Service **indisponible** (bloqué)
- `false` : Service **disponible** (sélectionnable)

---

## 3. Logique de Blocage des Services

### 3.1 Algorithme `assigneMembersToGuests`

**Objectif :** Vérifier si l'invité actif peut avoir un membre disponible après avoir assigné les membres aux autres invités.

**Étapes :**

1. **Grouper les services par ID**
   ```typescript
   // Exemple : 3 invités ont sélectionné le même service
   // Group = { id: "service_123", services: [service1, service2, service3], guests: ["guest1", "guest2", "guest3"] }
   ```

2. **Initialiser les membres disponibles pour chaque invité**
   ```typescript
   // Au début, tous les invités peuvent avoir tous les membres
   guestsAssigned = {
       "guest1": ["memberA", "memberB"],
       "guest2": ["memberA", "memberB"],
       "guest3": ["memberA", "memberB"]
   }
   ```

3. **Propager les restrictions** (`propagateMemberRemoval`)
   - Si un invité a besoin d'un membre spécifique, le retirer des autres invités
   - Répéter jusqu'à stabilisation

4. **Vérifier si l'invité actif a encore des membres disponibles**
   ```typescript
   availableMembers = availableTeamMembersForService.filter(
       member => guestsAssigned[activeGuestId].includes(member.id)
   );
   
   return availableMembers.length <= 0; // true = bloqué
   ```

### 3.2 Fonction `propagateMemberRemoval`

**Logique de propagation des restrictions :**

```typescript
function propagateMemberRemoval(
    servicesGrouped: { groupedObjects: any[] },
    guestsAssigned: Record<string, string[]>
): void {
    let changed: boolean;

    do {
        changed = false;

        for (const group of servicesGrouped.groupedObjects) {
            for (const guestId of group.guests) {
                // Membres disponibles pour cet invité
                const availableHere = group.availableTeamMembers.filter(
                    (m: any) => guestsAssigned[guestId]?.includes(m.id)
                );
                
                let toBanNow: string[] = [];
                let protectIds: string[] = [];

                // CAS 1: Exactement assez de membres pour tous les invités du groupe
                // → Bloquer ces membres pour les autres invités (hors groupe)
                if (availableHere.length === group.guests.length) {
                    toBanNow = availableHere.map((m: any) => m.id);
                    protectIds = group.guests; // Protéger tout le groupe
                }
                
                // CAS 2: Un seul membre disponible pour cet invité (mais pas le seul du service)
                // → Bloquer ce membre pour les autres invités (sauf l'actuel)
                else if (availableHere.length === 1 && availableHere.length !== group.availableTeamMembers.length) {
                    toBanNow = availableHere.map((m: any) => m.id);
                    protectIds = [guestId]; // Protéger seulement cet invité
                }

                // Appliquer les restrictions
                for (const otherGuestId of Object.keys(guestsAssigned)) {
                    if (protectIds.includes(otherGuestId)) continue; // Ne pas toucher les protégés

                    const before = guestsAssigned[otherGuestId].length;
                    guestsAssigned[otherGuestId] = guestsAssigned[otherGuestId].filter(
                        (id: any) => !toBanNow.includes(id)
                    );
                    if (guestsAssigned[otherGuestId].length !== before) changed = true;
                }
            }
        }
    } while (changed); // Répéter jusqu'à stabilisation
}
```

### 3.3 Exemples Concrets

#### Exemple 1 : 3 Invités, 2 Membres

**Situation :**
- Guest1, Guest2, Guest3
- Service "Coupe" (2 membres : MemberA, MemberB)
- Guest1 et Guest2 ont déjà sélectionné le service

**Calcul :**
1. **Groupe :** `{ id: "coupe", guests: ["guest1", "guest2"] }`
2. **Membres disponibles :** `[MemberA, MemberB]` (2 membres)
3. **Nombre d'invités :** 2
4. **Condition :** `availableHere.length === group.guests.length` → `2 === 2` ✅
5. **Action :** Bloquer MemberA et MemberB pour Guest3
6. **Résultat :** Guest3 n'a plus de membres disponibles → Service **bloqué**

#### Exemple 2 : 2 Invités, 3 Membres

**Situation :**
- Guest1, Guest2
- Service "Massage" (3 membres : MemberA, MemberB, MemberC)
- Guest1 a déjà sélectionné le service

**Calcul :**
1. **Groupe :** `{ id: "massage", guests: ["guest1"] }`
2. **Membres disponibles :** `[MemberA, MemberB, MemberC]` (3 membres)
3. **Nombre d'invités :** 1
4. **Condition :** `availableHere.length === group.guests.length` → `3 === 1` ❌
5. **Pas de blocage** → Guest2 peut sélectionner (il reste 2 membres)

#### Exemple 3 : 2 Invités, 1 Membre

**Situation :**
- Guest1, Guest2
- Service "Soin spécial" (1 membre : MemberA)
- Guest1 a déjà sélectionné le service

**Calcul :**
1. **Groupe :** `{ id: "soin", guests: ["guest1"] }`
2. **Membres disponibles :** `[MemberA]` (1 membre)
3. **Nombre d'invités :** 1
4. **Condition :** `availableHere.length === 1 && availableHere.length !== group.availableTeamMembers.length` → `1 === 1 && 1 !== 1` ❌
5. **Condition alternative :** `availableHere.length === group.guests.length` → `1 === 1` ✅
6. **Action :** Bloquer MemberA pour Guest2
7. **Résultat :** Guest2 n'a plus de membres disponibles → Service **bloqué**

---

## 4. Structure de la Page

### 4.1 Layout

```
┌─────────────────────────────────────────┐
│  NavigationHeader (Back/Close)          │
├─────────────────────────────────────────┤
│  Breadcrumbs (Services)                  │
├─────────────────────────────────────────┤
│  ┌──────────────────┬─────────────────┐│
│  │  Services         │  ServicesCart   ││
│  │  (Left Panel)     │  (Right Panel)  ││
│  │  - Par catégorie  │  (Desktop)      ││
│  │  - ServiceItem    │                  ││
│  └──────────────────┴─────────────────┘│
│                                         │
│  ServicesCartButtons (Mobile/Tablet)    │
│  (Sticky Bottom)                        │
└─────────────────────────────────────────┘
```

### 4.2 Composants

**Desktop :**
- **Left Panel** : Liste des services groupés par catégorie
- **Right Panel** : `ServicesCart` (sticky)

**Mobile/Tablet :**
- **Main Content** : Liste des services (full width)
- **Bottom Bar** : `ServicesCartButtons` (sticky)

---

## 5. Affichage des Services

### 5.1 ServiceItem

**États visuels :**

1. **Service disponible** (non sélectionné)
   - Bouton : `bg-primary-color` (vert)
   - Icône : `Plus`
   - Action : Ouvre la modal

2. **Service sélectionné**
   - Bouton : `bg-[#D41639]` (rouge)
   - Icône : `Minus`
   - Action : Ouvre la modal (pour modifier)

3. **Service bloqué** (`isFullyBooked === true`)
   - Bouton : `bg-gray-400` (gris)
   - Icône : `Plus` (désactivé)
   - Action : Affiche une alerte (ne peut pas sélectionner)

### 5.2 Code ServiceItem

```typescript
const isFullyBooked = guestController 
    ? isServiceFullyBooked(service.id, guestController, teamMembers) 
    : false;

const handleItemClick = () => {
    // Vérifier si le service est complètement réservé
    if (guestController && isFullyBooked && !isSelected) {
        const line1 = "All team members are already booked for this service";
        const line2 = "Please select another service or modify your existing reservations";
        showAlert(line1, line2);
        return;
    }
    serviceModal.openModal(service);
};

return (
    <div
        className={`... ${isFullyBooked && !isSelected ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={handleItemClick}
    >
        {/* ... contenu du service ... */}
        
        <div
            className={`rounded-lg p-2 ${
                isSelected
                    ? 'bg-[#D41639] text-white'
                    : isFullyBooked && !isSelected
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-primary-color text-white'
            }`}
        >
            {isSelected ? <Minus /> : <Plus />}
        </div>
    </div>
);
```

### 5.3 Modal d'Alerte

**Composant :** `TeamMemberAlertModal`

**Affichage :**
- Message : "All team members are already booked for this service"
- Sous-message : "Please select another service or modify your existing reservations"
- Fermeture automatique après 10 secondes

---

## 6. Code complet d'implémentation

### 6.1 serviceItemController.ts (Fonctions clés)

```typescript
// Récupérer les membres qui peuvent faire un service
export const getTeamMembersForService = (
    serviceId: string,
    teamMembers: TeamMemberType[]
): TeamMemberType[] => {
    return teamMembers.filter(member =>
        member.services.includes(serviceId)
    );
};

// Vérifier si un service est complètement réservé
export const isServiceFullyBooked = (
    serviceId: string,
    guestController: GuestController,
    teamMembers: TeamMemberType[],
): boolean => {
    const activeGuestId = guestController.getActiveGuest()?.id;
    if (!activeGuestId) return true;

    const availableTeamMembersForService = getTeamMembersForService(serviceId, teamMembers);

    if (availableTeamMembersForService.length === 0) {
        return true; // Aucun membre disponible
    }

    return assigneMembersToGuests(serviceId, guestController, teamMembers);
};

// Grouper les services par ID
export function buildServiceGroup(allGuestsServices: any[], teamMembers: TeamMemberType[]) {
    const groupedArray = Object.values(
        allGuestsServices.reduce<Record<string, any[]>>((acc, s) => {
            (acc[s.id] ||= []).push(s);
            return acc;
        }, {})
    );

    const groupedObjects = groupedArray.map(group => ({
        id: group[0].id,
        services: group,
        maxBook: getTeamMembersForService(group[0].id, teamMembers).length,
        availableTeamMembers: getTeamMembersForService(group[0].id, teamMembers),
        guests: group.map(s => s.guestId),
    }));

    return { groupedArray, groupedObjects };
}

// Assigner les membres aux invités (algorithme principal)
export function assigneMembersToGuests(
    serviceId: string,
    guestController: GuestController,
    teamMembers: TeamMemberType[],
): boolean {
    const activeGuestId = guestController.getActiveGuest()?.id;
    const availableTeamMembersForService = getTeamMembersForService(serviceId, teamMembers);
    const allGuests = guestController.getAllGuests();
    const allGuestsServices = getAllGuestsServices(guestController);
    const servicesGrouped = buildServiceGroup(allGuestsServices, teamMembers);
    
    // Initialiser : tous les invités peuvent avoir tous les membres
    const guestsAssigned = Object.fromEntries(
        allGuests.map(g => [g.id, teamMembers.map(m => m.id)])
    ) as any;
    
    let availableMembers = availableTeamMembersForService;
    
    // Propager les restrictions
    propagateMemberRemoval(servicesGrouped, guestsAssigned);
    
    // Filtrer les membres disponibles pour l'invité actif
    availableMembers = availableMembers.filter(
        member => guestsAssigned[activeGuestId ?? ''].includes(member.id)
    );

    // Si aucun membre disponible → service bloqué
    return availableMembers.length <= 0;
}

// Propager les restrictions de membres
function propagateMemberRemoval(
    servicesGrouped: { groupedObjects: any[] },
    guestsAssigned: Record<string, string[]>
): void {
    let changed: boolean;

    do {
        changed = false;

        for (const group of servicesGrouped.groupedObjects) {
            for (const guestId of group.guests) {
                const availableHere = group.availableTeamMembers.filter(
                    (m: any) => guestsAssigned[guestId]?.includes(m.id)
                );
                
                let toBanNow: string[] = [];
                let protectIds: string[] = [];

                // CAS 1: Exactement assez de membres pour tous les invités
                if (availableHere.length === group.guests.length) {
                    toBanNow = availableHere.map((m: any) => m.id);
                    protectIds = group.guests; // Protéger tout le groupe
                }
                // CAS 2: Un seul membre disponible (mais pas le seul du service)
                else if (availableHere.length === 1 && availableHere.length !== group.availableTeamMembers.length) {
                    toBanNow = availableHere.map((m: any) => m.id);
                    protectIds = [guestId]; // Protéger seulement cet invité
                }

                // Appliquer les restrictions
                for (const otherGuestId of Object.keys(guestsAssigned)) {
                    if (protectIds.includes(otherGuestId)) continue;

                    const before = guestsAssigned[otherGuestId].length;
                    guestsAssigned[otherGuestId] = guestsAssigned[otherGuestId].filter(
                        (id: any) => !toBanNow.includes(id)
                    );
                    if (guestsAssigned[otherGuestId].length !== before) changed = true;
                }
            }
        }
    } while (changed); // Répéter jusqu'à stabilisation
}
```

### 6.2 ServiceItem.tsx (Affichage)

```typescript
const ServiceItem = memo(function ServiceItem({
    service,
    lang,
    guestController,
    teamMembers = [],
    activeGuestId,
}: ServiceItemType) {
    const { isAlertOpen, alertLine1, alertLine2, showAlert, hideAlert } = useTeamMemberAlert();
    const [isSelected, setIsSelected] = useState(false);

    // Vérifier si le service est bloqué
    const isFullyBooked = guestController 
        ? isServiceFullyBooked(service.id, guestController, teamMembers) 
        : false;

    const handleItemClick = () => {
        // Si bloqué et non sélectionné → afficher alerte
        if (guestController && isFullyBooked && !isSelected) {
            showAlert(
                "All team members are already booked for this service",
                "Please select another service or modify your existing reservations"
            );
            return;
        }
        serviceModal.openModal(service);
    };

    return (
        <>
            <div
                className={`... ${isFullyBooked && !isSelected ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={handleItemClick}
            >
                {/* ... contenu ... */}
                
                <div
                    className={`rounded-lg p-2 ${
                        isSelected
                            ? 'bg-[#D41639] text-white'
                            : isFullyBooked && !isSelected
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-primary-color text-white'
                    }`}
                >
                    {isSelected ? <Minus /> : <Plus />}
                </div>
            </div>

            <TeamMemberAlertModal
                isOpen={isAlertOpen}
                onClose={hideAlert}
                alertLine1={alertLine1}
                alertLine2={alertLine2}
                lang={lang}
            />
        </>
    );
});
```

---

## 7. Résumé

### Système de disponibilité

**Règle :** Un service est disponible pour un invité s'il existe au moins un membre d'équipe disponible après avoir assigné les membres aux autres invités.

**Algorithme :**
1. Grouper les services par ID
2. Initialiser les membres disponibles pour chaque invité
3. Propager les restrictions (si un invité a besoin d'un membre, le retirer des autres)
4. Vérifier si l'invité actif a encore des membres disponibles

**Exemple :**
- 3 invités, 2 membres → Le 3ème invité ne peut pas sélectionner (bloqué)
- 2 invités, 3 membres → Les deux peuvent sélectionner (disponible)

### Affichage

- **Disponible** : Bouton vert avec `Plus`
- **Sélectionné** : Bouton rouge avec `Minus`
- **Bloqué** : Bouton gris avec `Plus` (désactivé) + Alerte au clic

---

**Dernière mise à jour :** 2025-01-21

