# Documentation complète – Page Checkout (Confirm) : infos, paiement, bookings, Cloud Functions

## 1) Vue d’ensemble
- Écrans principaux : `ConfirmPage.tsx` (page active), `SaveConfirmPage.tsx` (ancienne version), `ConfirmCart`, formulaires perso/notes, modal de confirmation.
- Contrôleurs clés : `confirmPageController.ts` (validation, promo, enregistrement booking, e-mails), `stripeController.ts` (Stripe + Cloud Functions), utilitaires de disponibilité `memberAvailability` (double check).
- Données centrales :
  - `guestController` : services/guests sélectionnés (membres affectés ou `notSpecific`).
  - `shopData` : horaires, timezone, dépôt, Stripe Connect, e-mailing.
  - `teamMembers`, `bookings`, `daysOff` : pour valider la dernière dispo du créneau.

## 2) Parcours utilisateur (ConfirmPage)
1) Pré-remplissage : récupération params `lang/category/booking_id`, éventuel `booking_number_param` (rebooking).
2) Saisie infos client : prénom/nom/téléphone (validation regex), pays du numéro, notes, consentement marketing, CGU.
3) Choix paiement : `Pay at venue` ou `Pay online` (Stripe). Dépôt possible via `shopData.settingCalendar.deposit_percentage`.
4) Application de promo / package : via `DiscountModal` et `confirmPageController.applyPackage*`.
5) Vérification finale du créneau : `memberAvailability(...)` + re-scan du slot sélectionné juste avant de créer (anti race condition).
6) Paiement en ligne (optionnel) : `stripeController.processPayment()` qui s’appuie sur les Cloud Functions Stripe.
7) Création du booking Firestore : `addBooking()` (et marquage rebooking statut 7 si `booking_number_param`).
8) Envoi des e-mails (Cloud Functions) + enregistrement client dans le shop (`registerClientInShop`).

## 3) Construction du booking (ConfirmPage)
Exemple de payload (voir `ConfirmPage.tsx`, `DOCUMENTATION_FEATURE_BEAUTY.md`):
- Identité client : `clientId`, `clientEmail`, `firstName`, `lastName`, `phone`, `phoneNumberCountry`.
- Horodatage : `date` (UTC), `dateBooking` (JJ/MM/AAAA), `timeStart`, `timeEnd`, `duration`, `timezone`.
- Services : tableau `servicesWithCompletedMember` (durée, addons, prix/promo, option, memberId/name, guest).
- Equipe : `teamMemberId` (liste d’objets `{id,name}` uniques).
- Paiement : `paymentMethods`, `paymentIntent` (si Stripe), `depositAmount`, `depositDiscountAmount`, `promoCode`, `promoDiscount`, `finalPriceWithRebooking`, `totalPrice`, `subTotalPrice`, `subTotalPromo`.
- Statuts : `statut` = 2 si `autoConfirmed`, sinon 1 (pending). Rebooking : ancien booking passé à 7.
- Tracking : `session` (UTM), `booking_category`, `packageId/packageServices` si package appliqué.

## 4) Contrôleur checkout : `confirmPageController.ts`
- Validation utilisateur : `getLogRequired`, `getValidationFieldsRequired`, `validatePhone/handlePhoneChange`.
- Promo : `fetchPromoCodes`, `recordPromoCodeUsage` (dans `DiscountModal`), `applyPackageDiscount`, `applyPackageWithQuantity`, filtrage services package.
- Numérotation : `getLastBookingNumber` (max booking_number +1).
- Rebooking : `fetchOriginalBookingData` (récup montant initial, paymentIntent d’origine, package, UTM) ; `addBooking` met l’ancien en statut 7 avant de créer le nouveau.
- Enregistrement booking : `addBooking(booking, shopId, userId?, booking_number_param?)` → `addDoc` dans `Shops/{shopId}/Booking`, puis `updateDoc` pour l’id.
- Emails : `sendBookingEmails` appelle des Cloud Functions (region `asia-southeast1`):
  - client : `client_booking_comfirm_email` ou `client_booking_pending_email`
  - shop : `shop_booking_confirm_email` ou `shop_booking_pending_email`
  - membres (option `sendBookingEmailToMember`) : même fonction shop avec email du membre
  - email spécifique (`sendBookingEmailToSpecificEmail`) : `shop_booking_confirm_email`/`pending`
- Clients : `registerClientInShop` (ajoute dans `Clients/{userId}/RegisteredShops`) + compteur `getTotalClients`.
- Dates/format : `isDateValid` (timezone shop), `getEmailData` (payload email), `getGoogleCalendarData` (génère start/end ISO compressé).

## 5) Stripe / Paiement en ligne
- Contrôleur : `stripeController.ts`
- Clés : `STRIPE_PUBLISHABLE_KEY` prod, `STRIPE_PUBLISHABLE_KEY_TEST` si `isTest=true`.
- Cloud Functions (callable) utilisées :
  - `createPaymentIntentConnect` / `createPaymentIntentConnectTest`
  - `updatePaymentIntentConnect` / `updatePaymentIntentConnectTest`
  - `cancelPaymentIntentConnect` / `cancelPaymentIntentConnectTest`
  - `refundConnect` / `refundConnectTest`
- Métadonnées envoyées : currency, userId, shopName (source), isRebooking, originalBookingNumber, originalPaymentAmount, totalPrice, promoDiscount, serviceDiscount, finalPriceWithRebooking, amountToPay, isDeposit, depositPercentage, depositDiscountPercentage, stripeConnectId.
- Flow (ConfirmPage):
  1) `stripeController.createPaymentIntent(...)` (ou via `processPayment`) → récup `clientSecret`, `paymentIntentId`.
  2) Stripe Elements sur le formulaire.
  3) `processPayment` confirme côté client.
  4) Si succès, on rattache `paymentIntent` dans le booking Firestore.
  5) En cas d’échec/annulation, `update`/`cancel`/`refund` peuvent être appelées selon le cas (non automatisé dans le code courant).

## 6) Vérification finale de disponibilité
- Avant création : `memberAvailability(...)` recalculé avec `timeStart` et membres sélectionnés.
- Refus si le slot n’est plus disponible (message utilisateur).
- Recommande de déplacer la création dans une Cloud Function transactionnelle pour verrouiller serveur-side (cf. `RAPPORT_VERIFICATION_BOOKING.md`).

## 7) Données promo / packages
- Promo : `fetchPromoCodes` (collection `PromoCodes`), contraintes status=1, shopId, code.
- Usage : `recordPromoCodeUsage` stocke l’usage (non détaillé ici, voir `DiscountModal`).
- Packages : `getClientPackages` (ClientPackages valides pour le shop), `filterPackagesMatchingServices`, `applyPackageDiscount` (gratuit pour services ciblés), `applyPackageWithQuantity` (consomme des quantités).

## 8) Rebooking
- Si `booking_number_param` est passé :
  - Vérifie que le booking existe et appartient au client (`isBookingNumberValid`).
  - Récup données originales (`fetchOriginalBookingData`) pour remontée paiement/dépôt/promo.
  - Marque l’ancien booking statut 7 (`addBooking`).
  - Envoie metadata Stripe avec `isRebooking` + `originalBookingNumber`.

## 9) Emails & notifications (Cloud Functions)
- Fonctions appelées (region `asia-southeast1`) :
  - `client_booking_comfirm_email` / `client_booking_pending_email`
  - `shop_booking_confirm_email` / `shop_booking_pending_email`
  - (optionnel) même fonction pour chaque membre si `sendBookingEmailToMember`
  - (optionnel) même fonction pour email spécifique `emailNewBooking`
- Payload construit via `getEmailData`, inclut : identité client, shop, date/heure formatée TZ shop, services, prix/promo/dépôt, booking_number, UTM si rebooking.

## 10) Points d’attention / bonnes pratiques
- Double check dispo déjà présent, mais sécuriser côté backend avec une Cloud Function transactionnelle si risque de concurrence élevé.
- Empêcher double soumission : drapeau `isLoading` / `isStripeLoading` déjà utilisé, à conserver.
- Validation téléphone stricte (9 digits ou digits only) : peut nécessiter adaptation selon pays.
- Préavis / timezone : `isDateValid` convertit dans le TZ du shop avant comparaison.
- Dépôt : `amountToPay` = dépôt si activé, sinon montant final (gère rebooking et promo).
- Stripe Connect : `stripeConnectId` obligatoire pour reversement shop ; en absence, paiement peut échouer.
- Emails : région fixée `asia-southeast1` (important pour latence et clés).

## 11) Fichiers clés à connaître
- `src/components/PageConfirm/ConfirmPage.tsx` : flux principal checkout.
- `src/components/PageConfirm/controllers/confirmPageController.ts` : validation, promo, booking Firestore, emails, packages.
- `src/components/PageConfirm/controllers/stripeController.ts` : intégration Stripe + Cloud Functions.
- `src/components/PageConfirm/controllers/types.ts` : types payment/promo/forms.
- `src/components/PageTime/controllers/memberAvailability.ts` : vérification dispo finale (réutilisée).
- `DOCUMENTATION_FEATURE_BEAUTY.md` (section checkout) : modèle de payload booking.
- `RAPPORT_VERIFICATION_BOOKING.md` : recommandations anti race-condition.

---

Cette documentation résume le parcours checkout (infos client → paiement Stripe optionnel → création booking Firestore → envois e-mail) et l’ensemble des points d’intégration (Cloud Functions Stripe + e-mails) avec validations clés (disponibilité, téléphone, rebooking, promo/package).

