/**
 * Checkout Controller
 * Based on DOCUMENTATION_FEATURE_BEAUTY.md section 7
 * 
 * Orchestrates the checkout process
 */

import { Shop } from '../../data/types/shop.types';
import { Client } from '../../data/types/client.types';
import { Booking, BookingStatus, PaymentMethod } from '../../data/types/booking.types';
import { Guest } from '../../data/types/service.types';
import { TeamMember } from '../../data/types/team.types';
import { PromoCode } from '../../data/types/promo.types';
import { SessionData } from '../../data/types/common.types';
import {
  buildBookingPayload,
  buildRebookingPayload,
  calculateDepositAmount,
} from '../booking/bookingBuilder';
import { calculateCartSummary, CartSummary } from '../booking/cartCalculations';

/**
 * Checkout state
 */
export interface CheckoutState {
  shop: Shop;
  client: Client;
  guests: Guest[];
  memberAssignments: Map<string, TeamMember>;
  selectedDate: Date;
  selectedTime: string;
  paymentMethod: PaymentMethod;
  promoCode: PromoCode | null;
  bookingNotes: string;
  cartSummary: CartSummary;
  // Rebooking
  isRebooking: boolean;
  originalBooking: Booking | null;
  // Payment
  depositAmount: number;
  depositDiscountAmount: number;
}

/**
 * Checkout result
 */
export interface CheckoutResult {
  success: boolean;
  bookingId?: string;
  bookingNumber?: number;
  error?: string;
}

/**
 * Validate checkout data before submission
 */
export function validateCheckout(state: CheckoutState): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Client validation
  if (!state.client.userId) {
    errors.push('Utilisateur non connecté');
  }
  if (!state.client.email) {
    errors.push('Email requis');
  }
  if (!state.client.firstName) {
    errors.push('Prénom requis');
  }
  if (!state.client.lastName) {
    errors.push('Nom requis');
  }
  
  // Services validation
  const hasServices = state.guests.some(g => g.services.length > 0);
  if (!hasServices) {
    errors.push('Aucun service sélectionné');
  }
  
  // Date/time validation
  if (!state.selectedDate) {
    errors.push('Date non sélectionnée');
  }
  if (!state.selectedTime) {
    errors.push('Heure non sélectionnée');
  }
  
  // Member validation (if shop requires it)
  if (state.shop.settingCalendar.forceMemberSelection) {
    const allServices = state.guests.flatMap(g => g.services);
    const hasUnassignedService = allServices.some(s => !s.teamMemberId);
    
    if (hasUnassignedService) {
      errors.push('Membre requis pour tous les services');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Prepare checkout data for booking creation
 */
export function prepareBookingData(state: CheckoutState) {
  const params = {
    client: state.client,
    shop: state.shop,
    guests: state.guests,
    memberAssignments: state.memberAssignments,
    selectedDate: state.selectedDate,
    selectedTime: state.selectedTime,
    paymentMethod: state.paymentMethod,
    promoCode: state.promoCode,
    bookingNotes: state.bookingNotes,
    // Session tracking could be added here
    session: undefined as SessionData | undefined,
  };
  
  if (state.isRebooking && state.originalBooking) {
    return buildRebookingPayload({
      ...params,
      originalBooking: state.originalBooking,
    });
  }
  
  return buildBookingPayload(params);
}

/**
 * Calculate deposit info for online payment
 */
export function calculateDepositInfo(
  totalPrice: number,
  shop: Shop
): { depositAmount: number; depositDiscountAmount: number; depositPercentage: number } {
  const { settingCalendar } = shop;
  
  if (!settingCalendar.deposit_enabled) {
    return {
      depositAmount: 0,
      depositDiscountAmount: 0,
      depositPercentage: 0,
    };
  }
  
  const depositPercentage = settingCalendar.deposit_percentage ?? 100;
  const discountAmount = settingCalendar.deposit_discount_amount ?? 0;
  
  const { depositAmount, depositDiscountAmount } = calculateDepositAmount(
    totalPrice,
    depositPercentage,
    discountAmount
  );
  
  return {
    depositAmount,
    depositDiscountAmount,
    depositPercentage,
  };
}

/**
 * Check if online payment is available
 */
export function isOnlinePaymentAvailable(shop: Shop): boolean {
  const { settingCalendar } = shop;
  
  return (
    settingCalendar.deposit_enabled === true &&
    !!shop.stripeConnectId
  );
}

/**
 * Check if "pay at venue" is available
 */
export function isPayAtVenueAvailable(shop: Shop): boolean {
  return shop.settingCalendar.hideAtVenue !== true;
}

/**
 * Get available payment methods for a shop
 */
export function getAvailablePaymentMethods(shop: Shop): PaymentMethod[] {
  const methods: PaymentMethod[] = [];
  
  if (isPayAtVenueAvailable(shop)) {
    methods.push('Pay at venue');
  }
  
  if (isOnlinePaymentAvailable(shop)) {
    methods.push('Pay online');
  }
  
  return methods;
}

/**
 * Get initial status for a new booking
 */
export function getInitialBookingStatus(shop: Shop): BookingStatus {
  return shop.settingCalendar.autoConfirmed 
    ? BookingStatus.CONFIRMED 
    : BookingStatus.PENDING;
}

/**
 * Check if cancellation is possible based on deadline
 * Based on documentation section 7.5
 */
export function canCancelBooking(
  booking: Booking,
  shop: Shop,
  currentDate: Date
): { canCancel: boolean; reason?: string } {
  // Can't cancel already cancelled/completed bookings
  if (
    booking.statut === BookingStatus.CANCELLED_BY_CLIENT ||
    booking.statut === BookingStatus.CANCELLED_WITH_REFUND ||
    booking.statut === BookingStatus.REJECTED_BY_SHOP ||
    booking.statut === BookingStatus.COMPLETED ||
    booking.statut === BookingStatus.REBOOKED
  ) {
    return { canCancel: false, reason: 'Cette réservation ne peut pas être annulée' };
  }
  
  // Check refund deadline for online payments
  if (booking.paymentMethods === 'Pay online' && booking.depositAmount) {
    const deadlineHours = shop.settingCalendar.deposit_refund_deadline_hours ?? 24;
    
    const bookingDate = booking.date instanceof Date 
      ? booking.date 
      : (booking.date as any).toDate?.() ?? new Date(booking.date as any);
    
    const hoursUntilBooking = (bookingDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilBooking < deadlineHours) {
      return { 
        canCancel: false, 
        reason: `L'annulation n'est possible que ${deadlineHours}h avant le rendez-vous` 
      };
    }
  }
  
  return { canCancel: true };
}

/**
 * Check if rebooking (reschedule) is possible
 */
export function canRebookBooking(
  booking: Booking,
  shop: Shop,
  currentDate: Date
): { canRebook: boolean; reason?: string } {
  // Same cancellation rules apply
  const cancelCheck = canCancelBooking(booking, shop, currentDate);
  
  if (!cancelCheck.canCancel) {
    return { canRebook: false, reason: cancelCheck.reason };
  }
  
  // Additional: can't rebook an already rebooked booking
  if (booking.isRebooked) {
    return { canRebook: false, reason: 'Cette réservation a déjà été reprogrammée' };
  }
  
  return { canRebook: true };
}

