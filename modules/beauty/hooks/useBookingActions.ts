/**
 * useBookingActions hook
 * Handles booking cancellation and reschedule actions
 * Based on documentation sections 7.5 and 7.6
 */

import { useState, useCallback } from 'react';
import { Shop } from '../data/types/shop.types';
import { Booking, BookingStatus } from '../data/types/booking.types';
import { 
  cancelBooking, 
  updateBookingStatus,
  getBookingByNumber,
} from '../data/services/booking.service';
import {
  canCancelBooking,
  canRebookBooking,
} from '../logic/checkout/checkoutController';
import {
  requestRefund,
} from '../logic/checkout/stripeController';

/**
 * Hook state
 */
interface UseBookingActionsState {
  isProcessing: boolean;
  error: string | null;
  success: boolean;
}

/**
 * Hook return type
 */
interface UseBookingActionsReturn extends UseBookingActionsState {
  cancelBooking: (booking: Booking, shop: Shop) => Promise<boolean>;
  checkCanCancel: (booking: Booking, shop: Shop) => { canCancel: boolean; reason?: string };
  checkCanRebook: (booking: Booking, shop: Shop) => { canRebook: boolean; reason?: string };
  fetchBookingForReschedule: (shopId: string, bookingNumber: number, clientId: string) => Promise<Booking | null>;
  reset: () => void;
}

/**
 * useBookingActions - Handles booking cancellation and reschedule
 * 
 * @returns State and actions for managing bookings
 * 
 * @example
 * const { cancelBooking, isProcessing, error } = useBookingActions();
 * 
 * const handleCancel = async () => {
 *   const { canCancel, reason } = checkCanCancel(booking, shop);
 *   if (!canCancel) {
 *     alert(reason);
 *     return;
 *   }
 *   
 *   const success = await cancelBooking(booking, shop);
 *   if (success) {
 *     // Show success message
 *   }
 * };
 */
export function useBookingActions(): UseBookingActionsReturn {
  const [state, setState] = useState<UseBookingActionsState>({
    isProcessing: false,
    error: null,
    success: false,
  });
  
  /**
   * Check if booking can be cancelled
   */
  const checkCanCancel = useCallback((
    booking: Booking,
    shop: Shop
  ): { canCancel: boolean; reason?: string } => {
    return canCancelBooking(booking, shop, new Date());
  }, []);
  
  /**
   * Check if booking can be rebooked
   */
  const checkCanRebook = useCallback((
    booking: Booking,
    shop: Shop
  ): { canRebook: boolean; reason?: string } => {
    return canRebookBooking(booking, shop, new Date());
  }, []);
  
  /**
   * Cancel a booking
   * Based on documentation section 7.5
   */
  const cancelBookingFn = useCallback(async (
    booking: Booking,
    shop: Shop
  ): Promise<boolean> => {
    setState({ isProcessing: true, error: null, success: false });
    
    try {
      // Check if cancellation is allowed
      const { canCancel, reason } = checkCanCancel(booking, shop);
      if (!canCancel) {
        setState({
          isProcessing: false,
          error: reason || 'Annulation impossible',
          success: false,
        });
        return false;
      }
      
      // Handle refund for online payments
      let withRefund = false;
      
      if (
        booking.paymentMethods === 'Pay online' &&
        booking.depositAmount &&
        booking.paymentIntent &&
        shop.stripeConnectId
      ) {
        const refundResult = await requestRefund(
          booking.paymentIntent,
          shop.stripeConnectId
        );
        
        if (!refundResult.success) {
          setState({
            isProcessing: false,
            error: refundResult.error || 'Erreur lors du remboursement',
            success: false,
          });
          return false;
        }
        
        withRefund = true;
      }
      
      // Update booking status
      await cancelBooking(shop.id, booking.id, 'client', withRefund);
      
      setState({
        isProcessing: false,
        error: null,
        success: true,
      });
      
      return true;
    } catch (error: any) {
      setState({
        isProcessing: false,
        error: error.message || 'Erreur lors de l\'annulation',
        success: false,
      });
      return false;
    }
  }, [checkCanCancel]);
  
  /**
   * Fetch booking for reschedule flow
   */
  const fetchBookingForReschedule = useCallback(async (
    shopId: string,
    bookingNumber: number,
    clientId: string
  ): Promise<Booking | null> => {
    try {
      return await getBookingByNumber(shopId, bookingNumber, clientId);
    } catch (error) {
      console.error('Error fetching booking:', error);
      return null;
    }
  }, []);
  
  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      error: null,
      success: false,
    });
  }, []);
  
  return {
    ...state,
    cancelBooking: cancelBookingFn,
    checkCanCancel,
    checkCanRebook,
    fetchBookingForReschedule,
    reset,
  };
}

/**
 * useCancelBooking - Simplified hook for cancellation only
 */
export function useCancelBooking() {
  const { cancelBooking, isProcessing, error, success, checkCanCancel, reset } = useBookingActions();
  
  return {
    cancel: cancelBooking,
    isProcessing,
    error,
    success,
    checkCanCancel,
    reset,
  };
}

/**
 * useRescheduleBooking - Simplified hook for reschedule flow
 */
export function useRescheduleBooking() {
  const { checkCanRebook, fetchBookingForReschedule, isProcessing, error, reset } = useBookingActions();
  
  return {
    checkCanRebook,
    fetchOriginalBooking: fetchBookingForReschedule,
    isProcessing,
    error,
    reset,
  };
}

