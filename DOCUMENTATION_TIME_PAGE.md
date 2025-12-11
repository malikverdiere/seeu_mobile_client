# Documentation Complète - Page Time et Génération des Slots

## Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Architecture de la Page Time](#architecture-de-la-page-time)
3. [Génération des Slots de Base](#génération-des-slots-de-base)
4. [Impact de la Sélection de Professionnel](#impact-de-la-sélection-de-professionnel)
5. [Filtrage par Disponibilité](#filtrage-par-disponibilité)
6. [Validation des Slots](#validation-des-slots)
7. [Pagination et Chargement Progressif](#pagination-et-chargement-progressif)
8. [Exemples Concrets](#exemples-concrets)
9. [Code Complet](#code-complet)

---

## Vue d'Ensemble

La page **Time** est l'étape où l'utilisateur sélectionne la date et l'heure de sa réservation. La génération des slots disponibles est un processus complexe qui prend en compte :

- ✅ Les horaires d'ouverture du shop
- ✅ Les horaires de travail de chaque membre d'équipe
- ✅ Les congés (days off) des membres
- ✅ Les réservations existantes (bookings)
- ✅ La sélection de professionnel (spécifique ou "Any professional")
- ✅ Le nombre d'invités et leurs services
- ✅ Les conflits entre services (même membre pour plusieurs services simultanés)
- ✅ La durée totale des services
- ✅ Le préavis minimum (advanced notice)

---

## Architecture de la Page Time

### Composants Principaux

```
TimePage.tsx
├── SelectorDateSlider (sélection de date)
├── SelectorTime (affichage des créneaux horaires)
├── SelectorTeamMember (sélection de membre - optionnel)
├── TimeCart (résumé de la réservation)
└── Modals (sélection de membres par service)
```

### Contrôleurs

```
controllers/
├── timePageController.ts (gestion de la date/heure sélectionnée)
├── selectorTimeController.ts (génération des slots de base)
├── memberAvailability.ts (logique de disponibilité)
├── usePaginatedAvailabilities.ts (chargement progressif)
└── selectorTeamMemberController.ts (gestion des membres sélectionnés)
```

---

## Génération des Slots de Base

### 1. Génération Initiale des Slots

**Fichier :** `selectorTimeController.ts`

**Fonction :** `generateTimeSlots()`

```typescript
export function generateTimeSlots(
    schedule: string[],        // Ex: ["09:00", "12:00", "14:00", "18:00"]
    interval: number = 15,      // Intervalle en minutes (15, 30, 60, etc.)
    selectedDate: Date,          // Date sélectionnée
): TimeSlot[] {
    const slots: TimeSlot[] = [];
    let slotIndex = 0;

    // Format de date : YYYY-MM-DD
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
    const day = selectedDate.getDate().toString().padStart(2, "0");
    const date = selectedDate.getFullYear() + "-" + month + "-" + day;

    // Parcourir les paires [start, end]
    for (let i = 0; i < schedule.length; i += 2) {
        const start = timeToMinutes(schedule[i]);      // Ex: "09:00" → 540
        const end = timeToMinutes(schedule[i + 1]);    // Ex: "12:00" → 720

        // Générer les slots avec l'intervalle
        for (let current = start; current <= end; current += interval) {
            const hours = Math.floor(current / 60).toString().padStart(2, "0");
            const minutes = (current % 60).toString().padStart(2, "0");
            const time = `${hours}:${minutes}`;

            slots.push({
                time,                                    // "09:00"
                id: `${date}-${slotIndex++}`,           // "2024-01-15-0"
                isAvailable: true,                      // Par défaut disponible
                timeInMinutes: current,                 // 540
                interval: interval,                      // 15
            });
        }
    }

    return slots;
}
```

**Exemple :**
- Schedule : `["09:00", "12:00", "14:00", "18:00"]`
- Interval : `15` minutes
- Résultat : `["09:00", "09:15", "09:30", ..., "11:45", "14:00", "14:15", ..., "17:45"]`

### 2. Source des Horaires

Les horaires proviennent de **deux sources** selon le contexte :

#### A. Horaires du Shop (par défaut)

```typescript
const dayOfWeek = (date.getDay() + 6) % 7;  // 0 = lundi, 6 = dimanche
const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const dayName = days[dayOfWeek];
const shopSchedule = shopData?.[dayName];  // Ex: ["09:00", "12:00", "14:00", "18:00"]
```

**Exemple de structure :**
```json
{
  "monday": ["09:00", "12:00", "14:00", "18:00"],
  "tuesday": ["09:00", "12:00", "14:00", "18:00"],
  "wednesday": [],
  "thursday": ["09:00", "18:00"],
  ...
}
```

#### B. Horaires des Membres (si sélection spécifique)

Si un membre spécifique est sélectionné, on utilise ses horaires personnels :
```typescript
const memberSchedule = member[dayName];  // Ex: ["10:00", "13:00", "15:00", "19:00"]
```

---

## Impact de la Sélection de Professionnel

### 1. Valeurs Possibles

Chaque service peut avoir :
- **`'notSpecific'`** : "Any professional" (professionnel non spécifique)
- **`'member-id-123'`** : ID d'un membre spécifique

**Stockage :**
```typescript
service.teamMemberId = 'notSpecific' | 'member-id-123'
```

### 2. Récupération des Membres Sélectionnés

**Fichier :** `TimePage.tsx`

```typescript
const allGuestServices = guestController.getAllGuests().flatMap(guest => guest.services);
const selectedMembers = getSelectedMembers(allGuestServices, teamMembers, { 
    onlyWithMemberId: true  // Exclut 'notSpecific'
});
```

**Fonction :** `getSelectedMembers()`

```typescript
export function getSelectedMembers(
    guestServices: Array<{ teamMemberId?: string }>,
    teamMembers: TeamMemberType[],
    options?: { onlyWithMemberId?: boolean }
): SelectedMemberDisplayType[] {
    const memberCounts: Record<string, number> = {};

    // Compter les occurrences
    guestServices.forEach(service => {
        const memberId = service.teamMemberId || 'notSpecific';
        memberCounts[memberId] = (memberCounts[memberId] || 0) + 1;
    });

    // Convertir en format d'affichage
    const display = Object.entries(memberCounts).map(([memberId, count]) => {
        const member = memberId === 'notSpecific'
            ? null
            : teamMembers.find(m => m.id === memberId) || null;

        return { member, count };
    });

    // Filtrer 'notSpecific' si demandé
    if (options?.onlyWithMemberId) {
        return display.filter(item => Boolean(item.member?.id));
    }

    return display;
}
```

**Exemple :**
```typescript
// Services :
// - Service 1 : teamMemberId = 'notSpecific'
// - Service 2 : teamMemberId = 'member-123'
// - Service 3 : teamMemberId = 'member-123'
// - Service 4 : teamMemberId = 'notSpecific'

// Résultat (onlyWithMemberId: true) :
[
    { member: { id: 'member-123', first_name: 'John' }, count: 2 }
]

// Résultat (onlyWithMemberId: false) :
[
    { member: null, count: 2 },  // 'notSpecific'
    { member: { id: 'member-123', first_name: 'John' }, count: 2 }
]
```

### 3. Impact sur la Génération des Slots

#### A. Cas 1 : Tous les Services avec "Any Professional" (`notSpecific`)

**Comportement :**
- ✅ Tous les membres capables de faire les services sont considérés
- ✅ Maximum de flexibilité
- ✅ Plus de slots disponibles

**Code :**
```typescript
// Dans getValidSlots()
if (selectedMemberIds.length === 0) {
    // Pas de membres spécifiques sélectionnés
    // On retourne tous les slots où au moins 1 membre est disponible pour chaque service
    return { ...slot, isAvailable: true, availableMembersByService: filteredByService };
}
```

**Exemple :**
- 3 services sélectionnés
- 5 membres peuvent faire ces services
- Résultat : Tous les slots où au moins 1 membre est disponible pour chaque service

#### B. Cas 2 : Membre(s) Spécifique(s) Sélectionné(s)

**Comportement :**
- ✅ Seuls les membres sélectionnés sont considérés
- ✅ Moins de flexibilité
- ✅ Moins de slots disponibles (mais plus précis)

**Code :**
```typescript
// Dans getValidSlots()
if (selectedMemberIds.length > 0) {
    // Vérifier que chaque service a au moins un membre sélectionné disponible
    const ok = filteredByService.some((s: any) => 
        s.availableMembers.some((m: any) => selectedMemberIds.includes(m.id))
    );
    return { ...slot, isAvailable: ok, availableMembersByService: filteredByService };
}
```

**Exemple :**
- Service 1 : Membre A sélectionné
- Service 2 : Membre B sélectionné
- Service 3 : "Any professional"
- Résultat : Slots où Membre A est disponible pour Service 1, Membre B pour Service 2, et n'importe quel membre pour Service 3

#### C. Cas 3 : Mix (Certains Services avec Membre, Autres avec "Any")

**Comportement :**
- ✅ Services avec membre : seuls ces membres sont considérés
- ✅ Services avec "Any" : tous les membres capables sont considérés
- ✅ Validation : chaque service doit avoir au moins 1 membre disponible

**Exemple :**
```typescript
// Services :
// - Service 1 (Coupe) : Membre A sélectionné
// - Service 2 (Coloration) : "Any professional"
// - Service 3 (Brushing) : Membre B sélectionné

// Pour un slot à 10:00 :
// - Membre A disponible pour Service 1 ? ✅
// - Au moins 1 membre disponible pour Service 2 ? ✅ (Membre C disponible)
// - Membre B disponible pour Service 3 ? ✅
// → Slot disponible ✅
```

---

## Filtrage par Disponibilité

### 1. Fonction Principale : `getValidSlots()`

**Fichier :** `memberAvailability.ts`

**Paramètres :**
```typescript
getValidSlots(
    membersBookings: any[],                    // Réservations des membres
    numberOfServices: number,                  // Nombre de services
    selectedMemberIds: string[] = [],          // IDs des membres sélectionnés (exclut 'notSpecific')
    shopData: Shop,                            // Données du shop
    date: Date,                                // Date à vérifier
    serviceDurationMinutes: number,            // Durée totale des services
    daysOff: DayOff[] = [],                    // Liste des congés
    numberOfGuests: number,                    // Nombre d'invités
    availableMembersByServiceWithoutConflict: any[]  // Membres disponibles par service (sans conflits)
)
```

### 2. Étapes de Filtrage

#### Étape 1 : Génération des Slots de Base

```typescript
const dayOfWeek = (date.getDay() + 6) % 7;
const days = DAYS_OF_WEEK;
const dayName = days[dayOfWeek];
const shopSchedule = shopData?.[dayName];
const interval_minutes = shopData?.settingCalendar?.interval_minutes;

const shopTimeSlots = generateTimeSlots(shopSchedule ?? [], interval_minutes, date);
```

#### Étape 2 : Vérification des Horaires d'Ouverture du Shop

```typescript
const rawRanges = shopData?.[dayName] ?? [];
const shopOpeningRanges = rawRanges.length ? getRangesFromStrings(rawRanges) : [];

// Jour de congé → tout fermé
if (shopOpeningRanges.length === 0) {
    return shopTimeSlots.map(s => ({ ...s, isAvailable: false }));
}
```

**Exemple :**
```typescript
// shopData.monday = ["09:00", "12:00", "14:00", "18:00"]
// shopOpeningRanges = [
//   { start: 540, end: 720 },   // 09:00 - 12:00
//   { start: 840, end: 1080 }  // 14:00 - 18:00
// ]
```

#### Étape 3 : Vérification du Passé et du Préavis

```typescript
const tz = shopData?.settingCalendar?.timeZone || 'Asia/Bangkok';
const adv = shopData?.settingCalendar?.advancedNotice;  // En minutes

// Créneau dans le passé ?
if (isTimeSlotInPast(date, slot.time, tz, adv)) {
    return { ...slot, isAvailable: false };
}
```

**Exemple :**
- Date : Aujourd'hui à 14:00
- Préavis : 2 heures
- Heure actuelle : 12:30
- Slot 14:00 : ✅ Disponible (14:00 - 12:30 = 1h30 < 2h → non disponible)
- Slot 15:00 : ✅ Disponible (15:00 - 12:30 = 2h30 > 2h → disponible)

#### Étape 4 : Vérification des Horaires d'Ouverture

```typescript
const slotStart = slot.timeInMinutes;
const slotEnd = slotStart + Math.max(slot.interval, serviceDurationMinutes);

// Le slot est-il dans une plage d'ouverture ?
if (!shopOpeningRanges.some(r => slotStart >= r.start && slotEnd <= r.end)) {
    return { ...slot, isAvailable: false };
}
```

**Exemple :**
- Slot : 13:00 - 13:30 (durée service : 30 min)
- Plages d'ouverture : 09:00-12:00, 14:00-18:00
- Résultat : ❌ Non disponible (13:00 n'est pas dans une plage d'ouverture)

#### Étape 5 : Filtrage des Membres Libres par Service

**Fonction Helper :** `isMemberFree()`

```typescript
const isMemberFree = (member: any, slotStart: number, slotEnd: number, slot: any) => {
    // 1. Vérifier les congés (day-off)
    const today = dayUTC(new Date());
    const filteredDaysOff = daysOff.filter(doff => {
        const end = dayUTC(doff.dateEnd.toDate());
        return (doff.memberId === member.id) && (today <= end);
    });
    
    if (isMemberOnDayOff(slot, filteredDaysOff, slotEnd)) return false;

    // 2. Vérifier les horaires de travail du membre
    const memberRanges = getRangesFromStrings(member[dayName] ?? []);
    if (!memberRanges.some(r => slotStart >= r.start && slotEnd <= r.end)) return false;
    
    // 3. Vérifier les conflits de réservation
    const memberWithbookings = membersBookings.find((m: any) => m.id === member.id);
    return !memberWithbookings.bookingsForDate?.some((b: any) => {
        const memberServices = b.services.filter((s: any) => s.memberId === member.id);
        if (!memberServices.length) return false;

        const starts = memberServices.map((s: any) => timeToMinutes(s.timeStart));
        const ends = memberServices.map((s: any) => timeToMinutes(s.timeEnd));
        const bStart = Math.min(...starts);
        const bEnd = Math.max(...ends);

        // Chevauchement ?
        return slotStart < bEnd && slotEnd > bStart;
    });
};
```

**Filtrage par service :**
```typescript
const filteredByService = availableMembersByServiceWithoutConflict.map((srv: any) => {
    const valid = srv.availableMembers.filter((m: any) => 
        isMemberFree(m, slotStart, slotEnd, slot)
    );
    return { ...srv, availableMembers: valid };
});
```

**Exemple :**
```typescript
// Service 1 (Coupe) : Membres disponibles [A, B, C]
// Service 2 (Coloration) : Membres disponibles [B, C, D]
// Service 3 (Brushing) : Membres disponibles [A, C, E]

// Pour slot 10:00-10:30 :
// - Membre A : ✅ Libre (pas de congé, horaires OK, pas de booking)
// - Membre B : ❌ Occupé (booking 10:00-11:00)
// - Membre C : ✅ Libre
// - Membre D : ❌ Congé
// - Membre E : ✅ Libre

// Résultat :
// Service 1 : [A, C]
// Service 2 : [C]
// Service 3 : [A, C, E]
```

#### Étape 6 : Vérification de la Couverture des Services

```typescript
// Au moins 1 membre par service ?
const allServicesCovered = filteredByService.every((s: any) => s.availableMembers.length > 0);
if (!allServicesCovered) return { ...slot, isAvailable: false };
```

**Exemple :**
- Service 1 : [A, C] ✅
- Service 2 : [C] ✅
- Service 3 : [] ❌
- Résultat : Slot non disponible (Service 3 n'a aucun membre disponible)

#### Étape 7 : Filtrage par Membres Sélectionnés (si applicable)

```typescript
if (selectedMemberIds.length > 0) {
    // Vérifier que chaque service a au moins un membre sélectionné disponible
    const ok = filteredByService.some((s: any) => 
        s.availableMembers.some((m: any) => selectedMemberIds.includes(m.id))
    );
    return { ...slot, isAvailable: ok, availableMembersByService: filteredByService };
}
```

**Exemple :**
```typescript
// Membres sélectionnés : [A, B]
// Service 1 : [A, C] → ✅ (A est sélectionné)
// Service 2 : [B, D] → ✅ (B est sélectionné)
// Service 3 : [C, E] → ❌ (Aucun membre sélectionné disponible)
// Résultat : Slot non disponible
```

#### Étape 8 : Retour Final

```typescript
// Pas de sélection → on retourne les données filtrées
return { ...slot, isAvailable: true, availableMembersByService: filteredByService };
```

---

## Validation des Slots

### 1. Vérification du Nombre de Membres Uniques

**Fichier :** `SelectorTime.tsx`

**Problème :** Un slot peut avoir des membres disponibles pour chaque service, mais pas assez de membres **uniques** pour tous les invités.

**Solution :** Compter les membres uniques disponibles

```typescript
const hasAvailableSlots = validSlots.some((slot: TimeSlot) => {
    if (!slot.isAvailable) return false;
    
    // Compter les membres uniques disponibles pour ce slot
    const members: string[] = [];
    slot.availableMembersByService?.forEach((service: any) => {
        service?.availableMembers?.forEach((member: any) => 
            members.push(member.first_name)
        );
    });
    const membersUnique = [...new Set(members)];
    
    // Le slot est disponible seulement s'il y a assez de membres pour tous les guests
    return membersUnique.length >= numberOfGuests;
});
```

**Exemple :**
- 3 invités
- Service 1 : [A, B]
- Service 2 : [A, C]
- Service 3 : [B, C]
- Membres uniques : [A, B, C] = 3 membres
- Résultat : ✅ Disponible (3 membres ≥ 3 invités)

**Exemple 2 :**
- 3 invités
- Service 1 : [A]
- Service 2 : [A]
- Service 3 : [A]
- Membres uniques : [A] = 1 membre
- Résultat : ❌ Non disponible (1 membre < 3 invités)

### 2. Affichage des Slots

**Fichier :** `SelectorTime.tsx`

```typescript
{validSlots.map((slot: TimeSlot) => {
    if (!slot.isAvailable) return;
    
    const idIndexLess = slot.id.split("-").slice(0, 3).join("-");
    const timeId = idIndexLess + "-" + slot.time;
    const members: string[] = [];

    slot.availableMembersByService?.map((service: any) => {
        return service?.availableMembers?.map((member: any) => 
            members.push(member.first_name)
        );
    });
    const membersUnique = [...new Set(members)];

    // Filtrer les slots avec pas assez de membres
    if (membersUnique?.length < numberOfGuests) return;

    return (
        <Button onClick={() => handleClick(timeId)}>
            {slot.time}
        </Button>
    );
})}
```

---

## Pagination et Chargement Progressif

### 1. Hook : `usePaginatedAvailabilities`

**Fichier :** `usePaginatedAvailabilities.ts`

**Objectif :** Charger les disponibilités par batch de 7 jours pour optimiser les performances.

### 2. Mécanisme de Cache

```typescript
const availabilityCacheRef = useRef<Record<string, DayAvailType>>({});
const availabilitiesStateRef = useRef<Record<string, DayAvailType>>({});
```

**Clé de cache :**
```typescript
const baseCacheKey = useMemo(() => {
    return JSON.stringify({
        teamMembers: teamMembers?.map(m => m.id).sort(),
        daysOff: daysOff?.map(d => d.id).sort(),
        shopData: shopData?.id,
        selectedMembers: selectedMembers.map(m => m.id).sort(),
        bookings: bookings?.map(b => b.id).sort(),
    });
}, [teamMembers, daysOff, shopData, selectedMembers, bookings]);
```

**Note :** `selectedTime` n'est **PAS** dans la clé de cache pour éviter les recalculs inutiles.

### 3. Chargement Initial

```typescript
const BATCH_SIZE = 7; // Nombre de jours à charger à la fois

// Charger les premiers 7 jours
useEffect(() => {
    if (!teamMembers || !shopData || !bookings || availableDates.length === 0) return;

    const initialDates = availableDates.slice(0, BATCH_SIZE);
    
    // Calculer les disponibilités
    initialDates.forEach(date => {
        const dateKey = date.toDateString();
        const availability = calculateAvailabilityForDate(date, false); // Pas de selectedTime
        availabilityCacheRef.current[dateKey] = availability;
    });
}, [teamMembers, shopData, bookings, availableDates.length]);
```

### 4. Chargement Progressif

```typescript
const loadMoreDays = useCallback(() => {
    if (isLoadingMore || loadedDaysCount >= availableDates.length) return;

    setIsLoadingMore(true);

    const nextBatchStart = loadedDaysCount;
    const nextBatchEnd = Math.min(loadedDaysCount + BATCH_SIZE, availableDates.length);
    const nextDates = availableDates.slice(nextBatchStart, nextBatchEnd);

    // Calculer de manière asynchrone
    const calculateNextBatch = () => {
        nextDates.forEach(date => {
            const dateKey = date.toDateString();
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const availability = calculateAvailabilityForDate(date, isSelected);
            availabilityCacheRef.current[dateKey] = availability;
        });
        
        setLoadedDaysCount(nextBatchEnd);
        setIsLoadingMore(false);
    };

    // Utiliser requestIdleCallback si disponible
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(calculateNextBatch, { timeout: 100 });
    } else {
        setTimeout(calculateNextBatch, 0);
    }
}, [loadedDaysCount, availableDates, selectedDate]);
```

### 5. Recalcul de la Date Sélectionnée

Quand `selectedTime` change, on recalcule **uniquement** la date sélectionnée :

```typescript
useEffect(() => {
    if (!selectedTime || !teamMembers || !shopData || !bookings) return;

    const selectedDateKey = selectedDate.toDateString();
    const cached = availabilityCacheRef.current[selectedDateKey];
    
    if (cached) {
        // Recalculer avec le nouveau selectedTime
        const availability = calculateAvailabilityForDate(selectedDate, true);
        availabilityCacheRef.current[selectedDateKey] = availability;
        setAvailabilitiesState(prev => ({ ...prev, [selectedDateKey]: availability }));
    }
}, [selectedTime, selectedDate]);
```

### 6. Lazy Loading

```typescript
const loadDateIfNeeded = useCallback((date: Date) => {
    if (!teamMembers || !shopData || !bookings) return;

    const dateKey = date.toDateString();
    
    // Si déjà en cache, ne rien faire
    if (availabilityCacheRef.current[dateKey]) return;

    // Marquer comme en cours de chargement
    setLoadingDates(prev => new Set(prev).add(dateKey));

    // Calculer de manière asynchrone
    setTimeout(() => {
        const isSelected = date.toDateString() === selectedDate.toDateString();
        const availability = calculateAvailabilityForDate(date, isSelected);
        availabilityCacheRef.current[dateKey] = availability;
        setAvailabilitiesState(prev => ({ ...prev, [dateKey]: availability }));
        setLoadingDates(prev => {
            const newSet = new Set(prev);
            newSet.delete(dateKey);
            return newSet;
        });
    }, 0);
}, [teamMembers, shopData, bookings, selectedDate]);
```

---

## Exemples Concrets

### Exemple 1 : Tous les Services avec "Any Professional"

**Configuration :**
- 2 invités
- Invité 1 : Service A (Coupe, 30 min)
- Invité 2 : Service B (Coloration, 60 min)
- Tous les services : `teamMemberId = 'notSpecific'`
- Shop : Ouvert 09:00-18:00
- Membres : A, B, C (tous peuvent faire Service A et B)
- Intervalle : 15 minutes

**Génération des slots :**
1. Génération de base : `["09:00", "09:15", "09:30", ..., "17:45"]`
2. Pour chaque slot :
   - Vérifier horaires shop : ✅
   - Vérifier passé/préavis : ✅
   - Filtrer membres libres :
     - Service A : Membres disponibles [A, B, C] → Filtrer par disponibilité
     - Service B : Membres disponibles [A, B, C] → Filtrer par disponibilité
   - Vérifier couverture : ✅ (au moins 1 membre par service)
   - Pas de membres sélectionnés → ✅ Disponible

**Résultat :** Tous les slots où au moins 1 membre est disponible pour chaque service

### Exemple 2 : Membre Spécifique Sélectionné

**Configuration :**
- 2 invités
- Invité 1 : Service A (Coupe, 30 min) → Membre A sélectionné
- Invité 2 : Service B (Coloration, 60 min) → Membre B sélectionné
- Shop : Ouvert 09:00-18:00
- Membre A : Horaires 09:00-12:00, 14:00-18:00
- Membre B : Horaires 10:00-13:00, 15:00-19:00
- Intervalle : 15 minutes

**Génération des slots :**
1. Génération de base : `["09:00", "09:15", "09:30", ..., "17:45"]`
2. Pour chaque slot :
   - Vérifier horaires shop : ✅
   - Vérifier passé/préavis : ✅
   - Filtrer membres libres :
     - Service A : [A] → Vérifier disponibilité de A
     - Service B : [B] → Vérifier disponibilité de B
   - Vérifier couverture : ✅ (A disponible pour Service A, B pour Service B)
   - Membres sélectionnés : [A, B] → Vérifier que A et B sont disponibles

**Résultat :** Slots où Membre A ET Membre B sont disponibles simultanément
- 10:00-10:30 : ✅ (A disponible 09:00-12:00, B disponible 10:00-13:00)
- 11:00-11:30 : ✅
- 15:00-15:30 : ✅ (A disponible 14:00-18:00, B disponible 15:00-19:00)
- 13:00-13:30 : ❌ (B non disponible 13:00-15:00)

### Exemple 3 : Mix (Membre + "Any Professional")

**Configuration :**
- 3 invités
- Invité 1 : Service A (Coupe, 30 min) → Membre A sélectionné
- Invité 2 : Service B (Coloration, 60 min) → "Any professional"
- Invité 3 : Service C (Brushing, 20 min) → "Any professional"
- Shop : Ouvert 09:00-18:00
- Membre A : Horaires 09:00-12:00
- Membres B, C : Peuvent faire Service B et C, horaires 09:00-18:00
- Intervalle : 15 minutes

**Génération des slots :**
1. Génération de base : `["09:00", "09:15", "09:30", ..., "17:45"]`
2. Pour chaque slot :
   - Vérifier horaires shop : ✅
   - Vérifier passé/préavis : ✅
   - Filtrer membres libres :
     - Service A : [A] → Vérifier disponibilité de A
     - Service B : [B, C] → Filtrer par disponibilité
     - Service C : [B, C] → Filtrer par disponibilité
   - Vérifier couverture : ✅
   - Membres sélectionnés : [A] → Vérifier que A est disponible

**Résultat :** Slots où Membre A est disponible ET au moins 1 membre (B ou C) est disponible pour Service B et C
- 10:00-10:30 : ✅ (A disponible, B/C disponibles)
- 13:00-13:30 : ❌ (A non disponible 13:00-14:00)

### Exemple 4 : Conflit de Réservation

**Configuration :**
- 1 invité
- Service A (Coupe, 30 min) → "Any professional"
- Shop : Ouvert 09:00-18:00
- Membres : A, B (peuvent faire Service A)
- Booking existant : Membre A, 10:00-11:00

**Génération des slots :**
1. Génération de base : `["09:00", "09:15", "09:30", ..., "17:45"]`
2. Pour slot 10:00-10:30 :
   - Vérifier horaires shop : ✅
   - Vérifier passé/préavis : ✅
   - Filtrer membres libres :
     - Service A : [A, B]
     - Membre A : ❌ Occupé (booking 10:00-11:00)
     - Membre B : ✅ Libre
   - Résultat : [B]
   - Vérifier couverture : ✅ (B disponible)
   - Pas de membres sélectionnés → ✅ Disponible

**Résultat :** Slot 10:00 disponible (Membre B disponible)

### Exemple 5 : Pas Assez de Membres Uniques

**Configuration :**
- 3 invités
- Invité 1 : Service A (Coupe, 30 min)
- Invité 2 : Service B (Coloration, 60 min)
- Invité 3 : Service C (Brushing, 20 min)
- Tous les services : "Any professional"
- Membres : A, B (peuvent faire tous les services)
- Shop : Ouvert 09:00-18:00

**Génération des slots :**
1. Génération de base : `["09:00", "09:15", "09:30", ..., "17:45"]`
2. Pour chaque slot :
   - Filtrer membres libres :
     - Service A : [A, B]
     - Service B : [A, B]
     - Service C : [A, B]
   - Vérifier couverture : ✅ (au moins 1 membre par service)
   - **Vérification nombre de membres uniques :**
     - Membres uniques : [A, B] = 2 membres
     - Nombre d'invités : 3
     - 2 < 3 → ❌ **Slot non disponible**

**Résultat :** Aucun slot disponible (pas assez de membres uniques pour 3 invités)

---

## Code Complet

### 1. Fonction Principale : `memberAvailability()`

```typescript
export function memberAvailability(
    teamMembers: TeamMemberType[],
    date: Date,
    daysOff: DayOff[],
    shopData: Shop,
    selectedTime: string | null,
    selectedMembers: TeamMemberType[],
    guestController: GuestController,
    controller: ModalMemberSelectorController,
    bookings?: BookingType[],
) {
    const guestServices = getGuestServices(guestController);
    const numberOfGuests = getNumberOfGuests(guestController);
    const totalDuration = calculateMaxDuration(guestController);

    // 1. Obtenir les membres entièrement disponibles
    let availableMembers = teamMembers && daysOff ?
        getFullyAvailableMembers(
            teamMembers, 
            date, 
            guestServices, 
            daysOff, 
            shopData, 
            selectedTime?.split(' - ')[0], 
            selectedTime?.split(' - ')[1], 
            bookings, 
            totalDuration
        ) : [];

    // 2. Vérifier le statut des membres sélectionnés
    const selectedMembersStatus = selectedMembers.length > 0 ?
        selectedMembers.map((member: any) => {
            if (member.member) {
                return getMemberAvailabilityStatus(member.member, date, guestServices, daysOff);
            }
            return null;
        }) : [];

    const AllSelectedMembersFullyAvailable = selectedMembersStatus.every((status: any) => status?.isFullyAvailable);

    // 3. Vérifier si c'est un jour travaillé
    const workingDay = availableMembers.length > 0;

    // 4. Obtenir les membres disponibles par service (sans conflits)
    const availableMembersByServiceWithoutConflict = getAvailableMembersByServiceWithoutConflict(
        controller, 
        guestController, 
        guestServices, 
        availableMembers
    );

    // 5. Vérifier qu'il y a au moins 1 membre disponible pour chaque service
    const availableMembersByServiceWithoutConflictWorking = 
        availableMembersByServiceWithoutConflict.every(service => service.availableMembers.length > 0);

    // 6. Obtenir les membres sans conflit
    const membersWithoutConflict = getMembersWithoutConflict(availableMembersByServiceWithoutConflict);

    // 7. Obtenir les bookings des membres pour la date
    const membersBookings = getMembersBookingsForDate(membersWithoutConflict, date, bookings || []);

    // 8. Générer les slots valides
    const validSlots = getValidSlots(
        membersBookings, 
        guestServices.length, 
        selectedMembers.map((member: any) => member.member.id),  // IDs des membres sélectionnés (exclut 'notSpecific')
        shopData, 
        date, 
        totalDuration, 
        daysOff, 
        numberOfGuests, 
        availableMembersByServiceWithoutConflict
    );

    // 9. Déterminer si le jour est bloqué
    const blockDay = !workingDay || 
                     !AllSelectedMembersFullyAvailable || 
                     availableMembers.length < numberOfGuests || 
                     !availableMembersByServiceWithoutConflictWorking;

    return {
        availableMembers,
        selectedMembersStatus,
        AllSelectedMembersFullyAvailable,
        workingDay,
        numberOfGuests,
        blockDay,
        availableMembersByServiceWithoutConflict,
        availableMembersByServiceWithoutConflictWorking,
        validSlots,
    };
}
```

### 2. Fonction de Génération des Slots : `getValidSlots()`

```typescript
export function getValidSlots(
    membersBookings: any[],
    numberOfServices: number,
    selectedMemberIds: string[] = [],  // IDs des membres sélectionnés (exclut 'notSpecific')
    shopData: Shop,
    date: Date,
    serviceDurationMinutes: number,
    daysOff: DayOff[] = [],
    numberOfGuests: number,
    availableMembersByServiceWithoutConflict: any[],
) {
    const dayOfWeek = (date.getDay() + 6) % 7;
    const days = DAYS_OF_WEEK;
    const dayName = days[dayOfWeek];
    const shopSchedule = shopData?.[dayName];
    const interval_minutes = shopData?.settingCalendar?.interval_minutes;

    // 1. Générer les slots de base
    const shopTimeSlots = generateTimeSlots(shopSchedule ?? [], interval_minutes, date);

    // 2. Obtenir les plages d'ouverture du shop
    const rawRanges = shopData?.[dayName] ?? [];
    const shopOpeningRanges = rawRanges.length ? getRangesFromStrings(rawRanges) : [];

    // Jour de congé → tout fermé
    if (shopOpeningRanges.length === 0) {
        return shopTimeSlots.map(s => ({ ...s, isAvailable: false }));
    }

    const tz = shopData?.settingCalendar?.timeZone || 'Asia/Bangkok';
    const adv = shopData?.settingCalendar?.advancedNotice;

    // 3. Helper : vérifier si un membre est libre
    const isMemberFree = (member: any, slotStart: number, slotEnd: number, slot: any) => {
        // Congé ?
        const today = dayUTC(new Date());
        const filteredDaysOff = daysOff.filter(doff => {
            const end = dayUTC(doff.dateEnd.toDate());
            return (doff.memberId === member.id) && (today <= end);
        });
        const memberWithbookings = membersBookings.find((m: any) => m.id === member.id);

        if (isMemberOnDayOff(slot, filteredDaysOff, slotEnd)) return false;

        // Le créneau est-il dans une plage travaillée ?
        const memberRanges = getRangesFromStrings(member[dayName] ?? []);
        if (!memberRanges.some(r => slotStart >= r.start && slotEnd <= r.end)) return false;
        
        // Conflit de réservation ?
        return !memberWithbookings.bookingsForDate?.some((b: any) => {
            const memberServices = b.services.filter((s: any) => s.memberId === member.id);
            if (!memberServices.length) return false;

            const starts = memberServices.map((s: any) => timeToMinutes(s.timeStart));
            const ends = memberServices.map((s: any) => timeToMinutes(s.timeEnd));
            const bStart = Math.min(...starts);
            const bEnd = Math.max(...ends);

            return slotStart < bEnd && slotEnd > bStart;
        });
    };

    // 4. Créer une map des membres sélectionnés par service
    const serviceSelectedMap = new Map<string, string[]>();
    availableMembersByServiceWithoutConflict.forEach((s: any) => {
        const ids = s.availableMembers
            .filter((m: any) => selectedMemberIds.includes(m.id))
            .map((m: any) => m.id);
        serviceSelectedMap.set(s.serviceId, ids);
    });

    // 5. Filtrer chaque slot
    return shopTimeSlots.map(slot => {
        const slotStart = slot.timeInMinutes;
        const slotEnd = slotStart + Math.max(slot.interval, serviceDurationMinutes);

        // Créneau dans le passé ?
        if (isTimeSlotInPast(date, slot.time, tz, adv)) {
            return { ...slot, isAvailable: false };
        }

        // Horaires d'ouverture ?
        if (!shopOpeningRanges.some(r => slotStart >= r.start && slotEnd <= r.end)) {
            return { ...slot, isAvailable: false };
        }

        // 6. Filtrer les membres libres pour chaque service
        const filteredByService = availableMembersByServiceWithoutConflict.map((srv: any) => {
            const valid = srv.availableMembers.filter((m: any) => 
                isMemberFree(m, slotStart, slotEnd, slot)
            );
            return { ...srv, availableMembers: valid };
        });

        // 7. Au moins 1 membre par service ?
        const allServicesCovered = filteredByService.every((s: any) => s.availableMembers.length > 0);
        if (!allServicesCovered) {
            return { ...slot, isAvailable: false };
        }

        // 8. Si des membres sont sélectionnés, on ne garde que les slots où chaque service contient au moins un d'eux
        if (selectedMemberIds.length > 0) {
            const ok = filteredByService.some((s: any) => 
                s.availableMembers.some((m: any) => selectedMemberIds.includes(m.id))
            );
            return { ...slot, isAvailable: ok, availableMembersByService: filteredByService };
        }

        // 9. Pas de sélection → on retourne les données filtrées
        return { ...slot, isAvailable: true, availableMembersByService: filteredByService };
    });
}
```

---

## Résumé des Points Clés

### 1. Génération des Slots
- ✅ Basée sur les horaires du shop (ou du membre si sélectionné)
- ✅ Utilise l'intervalle configuré (15, 30, 60 minutes)
- ✅ Génère tous les slots possibles dans les plages d'ouverture

### 2. Impact de "Any Professional" vs Membre Spécifique
- ✅ **"Any professional"** (`notSpecific`) : Maximum de flexibilité, tous les membres capables sont considérés
- ✅ **Membre spécifique** : Moins de flexibilité, seuls les membres sélectionnés sont considérés
- ✅ **Mix** : Services avec membre + services avec "Any" → validation hybride

### 3. Filtrage par Disponibilité
- ✅ Horaires d'ouverture du shop
- ✅ Horaires de travail des membres
- ✅ Congés (days off)
- ✅ Réservations existantes (bookings)
- ✅ Préavis minimum (advanced notice)
- ✅ Passé (slots dans le passé)

### 4. Validation des Slots
- ✅ Au moins 1 membre disponible pour chaque service
- ✅ Si membres sélectionnés : chaque service doit avoir au moins un membre sélectionné disponible
- ✅ Assez de membres uniques pour tous les invités

### 5. Performance
- ✅ Chargement progressif par batch de 7 jours
- ✅ Cache des disponibilités calculées
- ✅ Recalcul uniquement de la date sélectionnée quand `selectedTime` change
- ✅ Lazy loading des dates non visibles

---

**Fin de la Documentation**

