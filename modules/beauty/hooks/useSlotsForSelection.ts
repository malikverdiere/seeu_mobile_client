/**
 * useSlotsForSelection hook
 * Computes available time slots for a given date and selection
 * Based on documentation section 6
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Shop } from '../data/types/shop.types';
import { TeamMember } from '../data/types/team.types';
import { DayOff } from '../data/types/dayoff.types';
import { Booking } from '../data/types/booking.types';
import { Guest } from '../data/types/service.types';
import { TimeSlot } from '../logic/slots/slotGenerator';
import { 
  computeValidSlotsForDate, 
  MemberAvailabilityResult,
  getMembersAvailableForSlot,
} from '../logic/slots/memberAvailability';
import { getAvailableDatesForBooking } from '../utils/dateUtils';

/**
 * Hook parameters
 */
interface UseSlotsParams {
  shop: Shop | null;
  teamMembers: TeamMember[];
  bookings: Booking[];
  dayOffs: DayOff[];
  guests: Guest[];
  selectedDate: Date | null;
  numberOfGuests?: number;
}

/**
 * Hook state
 */
interface UseSlotsState {
  slots: TimeSlot[];
  isLoading: boolean;
  isDayBlocked: boolean;
  availableMembersByService: MemberAvailabilityResult['availableMembersByService'];
  error: string | null;
}

/**
 * Hook return type
 */
interface UseSlotsReturn extends UseSlotsState {
  availableDates: Date[];
  computeSlots: (date: Date) => void;
  getMembersForSlot: (time: string, duration: number) => TeamMember[];
}

/**
 * useSlotsForSelection - Computes available time slots
 * 
 * @param params - Parameters for slot computation
 * @returns Available slots and helper functions
 * 
 * @example
 * const { slots, isLoading, availableDates } = useSlotsForSelection({
 *   shop,
 *   teamMembers,
 *   bookings,
 *   dayOffs,
 *   guests,
 *   selectedDate,
 * });
 */
export function useSlotsForSelection(params: UseSlotsParams): UseSlotsReturn {
  const {
    shop,
    teamMembers,
    bookings,
    dayOffs,
    guests,
    selectedDate,
    numberOfGuests = 1,
  } = params;
  
  const [state, setState] = useState<UseSlotsState>({
    slots: [],
    isLoading: false,
    isDayBlocked: false,
    availableMembersByService: {},
    error: null,
  });
  
  /**
   * Compute available dates for booking period
   */
  const availableDates = useMemo(() => {
    if (!shop) return [];
    
    return getAvailableDatesForBooking(
      shop.settingCalendar.maxBookingPeriod,
      shop.settingCalendar.timeZone
    );
  }, [shop]);
  
  /**
   * Compute slots for a specific date
   */
  const computeSlots = useCallback((date: Date) => {
    if (!shop) {
      setState(prev => ({
        ...prev,
        slots: [],
        isDayBlocked: true,
        error: 'Shop non chargé',
      }));
      return;
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = computeValidSlotsForDate(
        shop,
        teamMembers,
        bookings,
        dayOffs,
        guests,
        date,
        numberOfGuests
      );
      
      setState({
        slots: result.validSlots,
        isLoading: false,
        isDayBlocked: result.blockDay,
        availableMembersByService: result.availableMembersByService,
        error: result.error ?? null,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Erreur lors du calcul des créneaux',
      }));
    }
  }, [shop, teamMembers, bookings, dayOffs, guests, numberOfGuests]);
  
  /**
   * Get members available for a specific time slot
   */
  const getMembersForSlot = useCallback((time: string, duration: number): TeamMember[] => {
    if (!selectedDate) return [];
    
    return getMembersAvailableForSlot(
      teamMembers,
      selectedDate,
      time,
      duration,
      dayOffs,
      bookings
    );
  }, [teamMembers, selectedDate, dayOffs, bookings]);
  
  // Auto-compute when date changes
  useEffect(() => {
    if (selectedDate && shop) {
      computeSlots(selectedDate);
    }
  }, [selectedDate, shop, computeSlots]);
  
  return {
    ...state,
    availableDates,
    computeSlots,
    getMembersForSlot,
  };
}

/**
 * Helper hook to get only available slots
 */
export function useAvailableSlots(params: UseSlotsParams) {
  const { slots, ...rest } = useSlotsForSelection(params);
  
  const availableSlots = useMemo(
    () => slots.filter(slot => slot.isAvailable),
    [slots]
  );
  
  return {
    ...rest,
    slots: availableSlots,
    allSlots: slots,
  };
}

/**
 * Helper hook for checking if a date has any available slots
 */
export function useDateAvailability(
  shop: Shop | null,
  teamMembers: TeamMember[],
  bookings: Booking[],
  dayOffs: DayOff[],
  guests: Guest[]
) {
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [isChecking, setIsChecking] = useState(false);
  
  /**
   * Check multiple dates at once
   */
  const checkDates = useCallback(async (dates: Date[]) => {
    if (!shop) return;
    
    setIsChecking(true);
    const blocked = new Set<string>();
    
    for (const date of dates) {
      const result = computeValidSlotsForDate(
        shop,
        teamMembers,
        bookings,
        dayOffs,
        guests,
        date,
        1
      );
      
      if (result.blockDay) {
        blocked.add(date.toISOString().split('T')[0]);
      }
    }
    
    setBlockedDates(blocked);
    setIsChecking(false);
  }, [shop, teamMembers, bookings, dayOffs, guests]);
  
  /**
   * Check if a specific date is blocked
   */
  const isDateBlocked = useCallback((date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return blockedDates.has(dateStr);
  }, [blockedDates]);
  
  return {
    blockedDates,
    isChecking,
    checkDates,
    isDateBlocked,
  };
}

