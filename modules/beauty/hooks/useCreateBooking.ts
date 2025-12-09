/**
 * useCreateBooking hook
 * Handles booking creation logic
 * Based on documentation section 7
 */

import { useState, useCallback } from 'react';
import { Shop } from '../data/types/shop.types';
import { Client } from '../data/types/client.types';
import { Booking, PaymentMethod } from '../data/types/booking.types';
import { Guest } from '../data/types/service.types';
import { TeamMember } from '../data/types/team.types';
import { PromoCode } from '../data/types/promo.types';
import { SessionData } from '../data/types/common.types';
import { createBooking, createRebooking } from '../data/services/booking.service';
import { 
  buildBookingPayload, 
  buildRebookingPayload,
  determineInitialStatus,
} from '../logic/booking/bookingBuilder';
import { 
  calculateCartSummary, 
  CartSummary 
} from '../logic/booking/cartCalculations';

/**
 * Booking creation params
 */
interface CreateBookingParams {
  shop: Shop;
  client: Client;
  guests: Guest[];
  memberAssignments: Map<string, TeamMember>;
  selectedDate: Date;
  selectedTime: string;
  paymentMethod: PaymentMethod;
  promoCode?: PromoCode | null;
  bookingNotes?: string;
  session?: SessionData;
}

/**
 * Rebooking params
 */
interface RebookingParams extends CreateBookingParams {
  originalBooking: Booking;
}

/**
 * Hook state
 */
interface UseCreateBookingState {
  isCreating: boolean;
  error: string | null;
  createdBooking: {
    docId: string;
    bookingNumber: number;
  } | null;
}

/**
 * Hook return type
 */
interface UseCreateBookingReturn extends UseCreateBookingState {
  createNewBooking: (params: CreateBookingParams) => Promise<boolean>;
  createRebooking: (params: RebookingParams) => Promise<boolean>;
  calculateSummary: (
    guests: Guest[],
    promo: PromoCode | null | undefined,
    shop: Shop,
    payOnline: boolean
  ) => CartSummary;
  reset: () => void;
}

/**
 * useCreateBooking - Handles booking creation
 * 
 * @returns State and actions for creating bookings
 * 
 * @example
 * const { createNewBooking, isCreating, error } = useCreateBooking();
 * 
 * const handleConfirm = async () => {
 *   const success = await createNewBooking({
 *     shop,
 *     client,
 *     guests,
 *     memberAssignments,
 *     selectedDate,
 *     selectedTime,
 *     paymentMethod: 'Pay at venue',
 *   });
 *   
 *   if (success) {
 *     // Navigate to confirmation
 *   }
 * };
 */
export function useCreateBooking(): UseCreateBookingReturn {
  const [state, setState] = useState<UseCreateBookingState>({
    isCreating: false,
    error: null,
    createdBooking: null,
  });
  
  /**
   * Create a new booking
   */
  const createNewBooking = useCallback(async (params: CreateBookingParams): Promise<boolean> => {
    setState({ isCreating: true, error: null, createdBooking: null });
    
    try {
      // Build booking payload
      const bookingData = buildBookingPayload({
        client: params.client,
        shop: params.shop,
        guests: params.guests,
        memberAssignments: params.memberAssignments,
        selectedDate: params.selectedDate,
        selectedTime: params.selectedTime,
        paymentMethod: params.paymentMethod,
        promoCode: params.promoCode,
        bookingNotes: params.bookingNotes,
        session: params.session,
      });
      
      // Determine auto-confirm status
      const autoConfirmed = params.shop.settingCalendar.autoConfirmed ?? false;
      
      // Create booking in Firestore
      const result = await createBooking(
        params.shop.id,
        bookingData,
        autoConfirmed
      );
      
      setState({
        isCreating: false,
        error: null,
        createdBooking: {
          docId: result.docId,
          bookingNumber: result.bookingNumber,
        },
      });
      
      return true;
    } catch (error: any) {
      setState({
        isCreating: false,
        error: error.message || 'Erreur lors de la création de la réservation',
        createdBooking: null,
      });
      return false;
    }
  }, []);
  
  /**
   * Create a rebooking (reschedule)
   */
  const createRebookingFn = useCallback(async (params: RebookingParams): Promise<boolean> => {
    setState({ isCreating: true, error: null, createdBooking: null });
    
    try {
      // Build rebooking payload
      const rebookingData = buildRebookingPayload({
        client: params.client,
        shop: params.shop,
        guests: params.guests,
        memberAssignments: params.memberAssignments,
        selectedDate: params.selectedDate,
        selectedTime: params.selectedTime,
        paymentMethod: params.paymentMethod,
        promoCode: params.promoCode,
        bookingNotes: params.bookingNotes,
        session: params.session,
        originalBooking: params.originalBooking,
      });
      
      // Determine auto-confirm status
      const autoConfirmed = params.shop.settingCalendar.autoConfirmed ?? false;
      
      // Create rebooking in Firestore
      const result = await createRebooking(
        params.shop.id,
        params.originalBooking.booking_number,
        params.client.userId,
        rebookingData,
        autoConfirmed
      );
      
      setState({
        isCreating: false,
        error: null,
        createdBooking: {
          docId: result.docId,
          bookingNumber: result.bookingNumber,
        },
      });
      
      return true;
    } catch (error: any) {
      setState({
        isCreating: false,
        error: error.message || 'Erreur lors de la reprogrammation',
        createdBooking: null,
      });
      return false;
    }
  }, []);
  
  /**
   * Calculate cart summary (convenience function)
   */
  const calculateSummary = useCallback((
    guests: Guest[],
    promo: PromoCode | null | undefined,
    shop: Shop,
    payOnline: boolean
  ): CartSummary => {
    return calculateCartSummary(guests, promo, shop, payOnline);
  }, []);
  
  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      isCreating: false,
      error: null,
      createdBooking: null,
    });
  }, []);
  
  return {
    ...state,
    createNewBooking,
    createRebooking: createRebookingFn,
    calculateSummary,
    reset,
  };
}

/**
 * useBookingStatus - Helper hook for checking booking status
 */
export function useBookingConfirmation(booking: Booking | null) {
  if (!booking) {
    return {
      isPending: false,
      isConfirmed: false,
      statusLabel: '',
    };
  }
  
  const isPending = booking.statut === 1;
  const isConfirmed = booking.statut === 2;
  
  let statusLabel = '';
  switch (booking.statut) {
    case 1:
      statusLabel = 'En attente de confirmation';
      break;
    case 2:
      statusLabel = 'Confirmé';
      break;
    case 3:
      statusLabel = 'Annulé';
      break;
    case 4:
      statusLabel = 'Rejeté';
      break;
    case 5:
      statusLabel = 'Terminé';
      break;
    case 6:
      statusLabel = 'Remboursé';
      break;
    case 7:
      statusLabel = 'Reprogrammé';
      break;
    default:
      statusLabel = 'Inconnu';
  }
  
  return {
    isPending,
    isConfirmed,
    statusLabel,
  };
}

