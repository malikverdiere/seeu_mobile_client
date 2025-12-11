# Documentation – Création des bookings, RegisteredShops et données envoyées aux Cloud Functions

## 1) Vue d’ensemble
- Page / flux : `ConfirmPage.tsx` (checkout principal) s’appuie sur `confirmPageController.ts`, `stripeController.ts`, `memberAvailability`.
- Base de données : Firestore (collections `Shops/{shopId}/Booking` et `Clients/{userId}/RegisteredShops`).
- Cloud Functions :
  - Stripe (paiement) : `createPaymentIntentConnect`, `updatePaymentIntentConnect`, `cancelPaymentIntentConnect`, `refundConnect` (versions *Test* si `isTest`).
  - Emails : `client_booking_comfirm_email` / `client_booking_pending_email`, `shop_booking_confirm_email` / `shop_booking_pending_email` (+ envois optionnels aux membres et e-mail spécifique).
- Double vérification de dispo avant création : `memberAvailability(...)` sur le slot choisi.

## 2) Payload du document Booking (créé dans `ConfirmPage.tsx`)
Champ → valeur exacte envoyée :
- `id`: `""` puis mis à jour avec le docId après `addDoc`.
- `clientId`: `user?.uid`
- `clientEmail`: `user?.email || ''`
- `clientPhone`: `phone || userDetails?.phone || ''`
- `clientPhoneCountry`: `phoneNumberCountry || userDetails?.phoneNumberCountry || ''`
- `firstName`: `firstName || userDetails?.firstName || ''`
- `lastName`: `lastName || userDetails?.lastName || ''`
- `createdAt`: `new Date()`
- `date`: `bookingDateUTC` (Date UTC)
- `dateBooking`: `shopDate?.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' })`
- `timeStart`: `timeStart` (ex: "10:00")
- `timeEnd`: `timeEnd`
- `duration`: `totalDuration` (minutes)
- `statut`: `2` si `shopData.settingCalendar.autoConfirmed` sinon `1`
- `services`: `servicesWithCompletedMember` (objets service enrichis : id, guestId/name, option, duration, addons, price/promotionPrice/priceUsed, memberId/name, color, people, loyaltyPoint, dateBooking, timeStart/timeEnd…)
- `teamMemberId`: `uniqueTeamMembers` = tableau d’objets `{ id, name }` (uniques)
- `booking_id`: `booking_id` (slug du shop)
- `paymentMethods`: si rebooking avec ancien paiement en ligne → `originalPaymentMethods` sinon `selectedPaymentMethod || 'pay-at-venue'`
- `discountCode`: `discountCode`
- `promoAmount`: `promoDiscount`
- `bookingNotes`: `bookingNotes`
- `from`: `"https://seeuapp.io/"`
- `booking_number`: `lastBookingNumber + 1`
- `booking_category`: `category` (depuis l’URL)
- `subTotalPrice`: `subtotal`
- `subTotalPromo`: `totalDiscount || 0`
- `totalPrice`: si paiement en ligne (ou rebooking avec paiement déjà pris) → `totalAfterDepositDiscount` sinon `total`
- `booking_url`: `/${lang}/${category}/${booking_id}/time?guests=${guestsParam}`
- **Promo (si présent)** :
  - `promoCodeId`: `promoCode.id`
  - `promoCode`: `promoCode.code`
  - `promoDiscountType`: `promoCode.discountType || null`
  - `promoDiscountValue`: `promoCode.discountValue || null`
  - `specificServices`: `promoCode.specificServices || []`
  - `excludeDiscountedServices`: `promoCode.excludeDiscountedServices || false`
- **Rebooking (si `booking_number_param`)** :
  - `isRebooked`: `true`
  - `rebookedFrom`: `booking_number_param`
  - `originalBookingNumber`: `booking_number_param`
  - `rebookingDate`: `new Date()`
  - `depositAmount`: `originalPaymentAmount || null`
  - `paymentIntent`: `originalPaymentIntent`
  - `originalPaymentMethods`: `originalPaymentMethods`
  - `depositDiscountAmount`: `originalDepositDiscountAmount || 0`
- **Paiement en ligne (si `selectedPaymentMethod === "Pay online"` et intent OK)** :
  - `paymentIntent`: `paymentIntent.id`
  - `paymentIntentStatus`: `paymentIntent.status`
  - `depositAmount`: `depositAmount`
  - `depositDiscountAmount`: `depositDiscount || 0`
- **Session / tracking** (`getStoredSession()`) :
  - `session.sessionId`
  - `session.sessionActionsCount`
  - `session.lastActivity`
  - `session.utm`, `utm_campaign`, `utm_content`, `utm_id`, `utm_medium`, `utm_source`
- **Package (si sélectionné)** :
  - `packageId`: `selectedPackageId`
  - `packageName`: `selectedPackage.name`
  - `packageServices`: map de `selectedPackage.serviceSummary` → `{ id, name, quantity }`

## 3) Enregistrement Firestore (Booking)
- Fonction : `addBooking(booking, shopId, userId?, booking_number_param?)` dans `confirmPageController.ts`.
- Si `booking_number_param` : recherche le booking existant (même clientId + booking_number), le passe `statut:7`, `rebookingDate`, `updatedAt`.
- Ajout : `addDoc` dans `Shops/{shopId}/Booking`, puis `updateDoc` pour ajouter `id` (docId).
- Retour : `{ status: 'Success' | 'BookingNotFound' | 'Error', docId? }`.

## 4) Enregistrement RegisteredShops (client) – `registerClientInShop`
Créé sous `Clients/{userId}/RegisteredShops` si absent :
- `createAt`: `new Date()`
- `lastVisit`: `new Date()`
- `shopId`: `shopData.id`
- `clientId`: `userId`
- `points`: `0`
- `nbVisit`: `1`
- `user_img`: `userDetails?.user_img || ""`
- `user_img_Valid`: `userDetails?.user_img_Valid || false`
- `firstName`: `userDetails?.firstName || ""`
- `lastName`: `userDetails?.lastName || ""`
- `gender`: `userDetails?.gender || 0`
- `phone`: `userDetails?.phone || ""`
- `phoneNumberCountry`: `userDetails?.phoneNumberCountry || ""`
- `postalCode`: `userDetails?.postalCode || ""`
- `address`: `userDetails?.address || ""`
- `email`: `userEmail`
- `birthday`: `userDetails?.birthday || new Date("1950-01-28")`
- `clientNum`: `totalClients ? totalClients + 1 : 1` (compteur par shop via `getTotalClients`)
- `notificationsActive`: `true`
- `from`: `"https://seeuapp.io/"`

## 5) Données envoyées aux Cloud Functions (Stripe)
### Fonctions appelées (callable)
- `createPaymentIntentConnect` (prod) / `createPaymentIntentConnectTest` (test)
- `updatePaymentIntentConnect` / `updatePaymentIntentConnectTest`
- `cancelPaymentIntentConnect` / `cancelPaymentIntentConnectTest`
- `refundConnect` / `refundConnectTest`

### Payload `createPaymentIntent...`
- `email`: user email
- `price`: `amountToPay * 100` (centimes)
- `stripeConnectId`: `shopData?.stripeConnectId`
- `metadata` (tous envoyés) :
  - `currency`: `shopData?.currency?.text || null`
  - `userId`: `user?.uid`
  - `source`: `shopData?.shopName || null`
  - `isRebooking`: bool (`booking_number_param ? true : false`)
  - `originalBookingNumber`: `booking_number_param || null`
  - `originalPaymentAmount`: montant paiement initial (si rebooking) ou `null`
  - `totalPrice`: `totalPrice || null`
  - `promoDiscount`: `promoDiscount || null`
  - `serviceDiscount`: (présent dans `stripeController`, non dans `ConfirmPage`) éventuel discount service
  - `finalPriceWithRebooking`: `finalPriceWithRebooking || null`
  - `amountToPay`: montant effectivement payé (dépôt ou total) || null
  - `isDeposit`: bool dépôt
  - `depositPercentage`: `shopData?.settingCalendar?.deposit_percentage || null`
  - `depositDiscountPercentage`: `shopData?.settingCalendar?.deposit_discount_amount || null`

### Payload `update/cancel/refund`
- Identifiants : `paymentIntentId`, `stripeConnectId`, et pour refund le montant n’est pas exposé dans le code, la fonction côté CF gère le total.

## 6) Données envoyées aux Cloud Functions (Emails)
Fonctions (region `asia-southeast1`) appelées via `sendBookingEmails` :
- Client : `client_booking_comfirm_email` ou `client_booking_pending_email` (selon autoConfirmed).
- Shop : `shop_booking_confirm_email` ou `shop_booking_pending_email`.
- Membres (option `sendBookingEmailToMember`) : même fonction shop avec `shopEmail` = email du membre.
- Email spécifique (option `sendBookingEmailToSpecificEmail`) : même fonction shop avec `shopEmail` = `shopData.settingCalendar.emailNewBooking`.

### Payload `getEmailData` (toujours inclus dans chaque appel)
- `userFirstName`, `userLastName`, `userEmail`
- `userLang`
- `userPhone`: concat pays + phone
- `shopName`, `shopEmail`, `shopAddress`, `shopCurrency`, `shopBookingId`
- `booking_date`: date/heure formatée dans le TZ shop
- `booking_number`
- `booking_category`
- `servicesDetails`: `booking.services` (le tableau complet des services enrichis)
- `subTotalPrice`, `subTotalPromo`, `promoCode`, `promoAmount`
- `totalPrice`
- `depositAmount`: montant de dépôt payé (ou null)
- `depositDiscountAmount`
- `packageId`, `packageName`, `packageServices`

### Options d’envoi conditionnelles
- Envoi aux membres : uniquement si `shopData.settingCalendar.sendBookingEmailToMember` ET si `booking.teamMemberId` contient des emails trouvés dans `teamMembers`.
- Envoi à email spécifique : si `shopData.settingCalendar.sendBookingEmailToSpecificEmail` (champ `emailNewBooking`).

## 7) Vérifications préalables clés
- `isBookingNumberValid` : vérifie qu’un rebooking cible bien le booking du client.
- Double check dispo juste avant création : `memberAvailability(..., timeStart, ...)`.
- `isDateValid` : compare date/heure du shop vs maintenant (TZ shop).
- Validation téléphone : regex digits (9 ou plus) dans `validatePhone`.
- CGU / consentement : `getValidationFieldsRequired`.

## 8) Où trouver quoi (fichiers)
- Booking payload & flow : `src/components/PageConfirm/ConfirmPage.tsx`.
- Firestore / promo / packages / RegisteredShops / emails helpers : `src/components/PageConfirm/controllers/confirmPageController.ts`.
- Stripe (Cloud Functions) : `src/components/PageConfirm/controllers/stripeController.ts`.
- Types promo/paiement/forms : `src/components/PageConfirm/controllers/types.ts`.
- Disponibilité finale : `src/components/PageTime/controllers/memberAvailability.ts`.

---

Cette fiche liste tous les champs créés dans les documents Booking et RegisteredShops, ainsi que l’intégralité des données envoyées aux Cloud Functions Stripe et Email.***

