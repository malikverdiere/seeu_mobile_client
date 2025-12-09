/**
 * Booking types based on DOCUMENTATION_FEATURE_BEAUTY.md
 * Collection: Shops/{shopId}/Booking/{bookingId}
 */

import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { ServiceAddOn } from './service.types';
import { TranslatedText, SessionData } from './common.types';

/**
 * Booking status enum
 */
export enum BookingStatus {
  /** En attente de confirmation */
  PENDING = 1,
  /** Confirmé */
  CONFIRMED = 2,
  /** Annulé par le client */
  CANCELLED_BY_CLIENT = 3,
  /** Rejeté par le shop */
  REJECTED_BY_SHOP = 4,
  /** Terminé */
  COMPLETED = 5,
  /** Annulé avec remboursement */
  CANCELLED_WITH_REFUND = 6,
  /** Rebooked (remplacé par reschedule) */
  REBOOKED = 7,
}

/**
 * Payment method type
 */
export type PaymentMethod = 'Pay at venue' | 'Pay online';

/**
 * Promo discount type
 */
export enum PromoDiscountType {
  /** Percentage discount */
  PERCENTAGE = 1,
  /** Fixed amount discount */
  FIXED = 2,
}

/**
 * Booking service structure
 * Represents a service within a booking
 */
export interface BookingService {
  id: string;
  guestId: string;
  guestName: string;
  name: string;
  optionId?: string;
  optionName?: string;
  duration: number;
  durationFormatted: string;
  price: number;
  promotionPrice?: number | null;
  /** Actual price used (normal or promo) */
  priceUsed: number;
  memberId: string;
  memberName: string;
  serviceAddons?: ServiceAddOn[];
  dateBooking: string; // DD/MM/YYYY
  timeStart: string; // HH:MM
  timeEnd: string; // HH:MM
  serviceColor?: string;
  people?: number;
  loyaltyPoint?: number | null;
}

/**
 * Team member reference in booking
 */
export interface BookingTeamMember {
  id: string;
  name: string;
}

/**
 * Booking document structure
 */
export interface Booking {
  /** Document ID */
  id: string;
  /** Client UID */
  clientId: string;
  /** Client email */
  clientEmail: string;
  /** Client phone */
  clientPhone?: string;
  /** Phone country code */
  clientPhoneCountry?: string;
  /** Client first name */
  firstName: string;
  /** Client last name */
  lastName: string;
  /** Creation timestamp */
  createdAt: FirebaseFirestoreTypes.Timestamp | Date;
  /** Booking date (UTC) */
  date: FirebaseFirestoreTypes.Timestamp | Date;
  /** Formatted date (DD/MM/YYYY) */
  dateBooking: string;
  /** Start time (HH:MM) */
  timeStart: string;
  /** End time (HH:MM) */
  timeEnd: string;
  /** Total duration in minutes */
  duration: number;
  /** Booking status */
  statut: BookingStatus | number;
  /** Services in this booking */
  services: BookingService[];
  /** Assigned team members */
  teamMemberId: BookingTeamMember[];
  /** Shop booking_id (slug) */
  booking_id: string;
  /** Sequential booking number */
  booking_number: number;
  /** Booking category (e.g., "beauty") */
  booking_category?: string;
  /** Booking URL */
  booking_url?: string;
  /** Payment method */
  paymentMethods: PaymentMethod;
  /** Subtotal before discounts */
  subTotalPrice: number;
  /** Total promo discount */
  subTotalPromo?: number;
  /** Final total price */
  totalPrice: number;
  /** Discount code used */
  discountCode?: string;
  /** Promo amount applied */
  promoAmount?: number;
  /** Promo code document ID */
  promoCodeId?: string;
  /** Promo code string */
  promoCode?: string;
  /** Promo discount type (1=%, 2=fixed) */
  promoDiscountType?: PromoDiscountType | number;
  /** Promo discount value */
  promoDiscountValue?: number;
  /** Services targeted by promo */
  specificServices?: string[];
  /** Exclude already discounted services */
  excludeDiscountedServices?: boolean;
  /** Client notes */
  bookingNotes?: string;
  /** Booking source */
  from: string; // "seeuapp.io"
  /** Deposit amount paid */
  depositAmount?: number;
  /** Deposit discount amount */
  depositDiscountAmount?: number;
  /** Stripe PaymentIntent ID */
  paymentIntent?: string;
  /** Stripe payment status */
  paymentIntentStatus?: string;
  /** Is a rebooked appointment */
  isRebooked?: boolean;
  /** Original booking number (if rebooked) */
  rebookedFrom?: string;
  /** Rebooking timestamp */
  rebookingDate?: FirebaseFirestoreTypes.Timestamp | Date;
  /** Original booking number */
  originalBookingNumber?: number;
  /** Original payment method */
  originalPaymentMethods?: PaymentMethod;
  /** Cancellation timestamp */
  cancelledAt?: FirebaseFirestoreTypes.Timestamp | Date;
  /** Who cancelled */
  cancelledBy?: 'client' | 'shop';
  /** Package ID if using a package */
  packageId?: string;
  /** Package name (translated) */
  packageName?: TranslatedText;
  /** Package services */
  packageServices?: Array<{ serviceId: string; quantity: number }>;
  /** Session/UTM tracking data */
  session?: SessionData;
}

/**
 * Booking creation input (without generated fields)
 */
export interface CreateBookingInput {
  clientId: string;
  clientEmail: string;
  clientPhone?: string;
  clientPhoneCountry?: string;
  firstName: string;
  lastName: string;
  date: Date;
  dateBooking: string;
  timeStart: string;
  timeEnd: string;
  duration: number;
  services: BookingService[];
  teamMemberId: BookingTeamMember[];
  booking_id: string;
  paymentMethods: PaymentMethod;
  subTotalPrice: number;
  subTotalPromo?: number;
  totalPrice: number;
  // Optional promo fields
  discountCode?: string;
  promoAmount?: number;
  promoCodeId?: string;
  promoCode?: string;
  promoDiscountType?: PromoDiscountType | number;
  promoDiscountValue?: number;
  specificServices?: string[];
  excludeDiscountedServices?: boolean;
  bookingNotes?: string;
  // Optional deposit fields
  depositAmount?: number;
  depositDiscountAmount?: number;
  // Optional package fields
  packageId?: string;
  packageName?: TranslatedText;
  packageServices?: Array<{ serviceId: string; quantity: number }>;
  // Session tracking
  session?: SessionData;
}

/**
 * Rebooking input (extends CreateBookingInput)
 */
export interface RebookingInput extends CreateBookingInput {
  originalBookingNumber: number;
  originalPaymentMethods?: PaymentMethod;
}

/**
 * Booking filters for queries
 */
export interface BookingFilters {
  clientId?: string;
  statut?: BookingStatus | BookingStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  booking_number?: number;
}

