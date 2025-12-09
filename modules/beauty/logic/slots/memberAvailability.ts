/**
 * Member availability calculation logic
 * Based on DOCUMENTATION_FEATURE_BEAUTY.md section 6.2
 * 
 * Main function: memberAvailability from PageTime/controllers/memberAvailability.ts
 */

import { Shop } from '../../data/types/shop.types';
import { TeamMember, MembersByService, SelectedMember } from '../../data/types/team.types';
import { Booking, BookingStatus } from '../../data/types/booking.types';
import { DayOff } from '../../data/types/dayoff.types';
import { GuestService, Guest } from '../../data/types/service.types';
import { DaySchedule, DAY_NAMES } from '../../data/types/common.types';
import {
  TimeSlot,
  generateTimeSlots,
  getScheduleForDate,
  filterSlotsByDuration,
} from './slotGenerator';
import {
  validateSlots,
  validateSlotForMember,
  validateMemberWorksOnDay,
  validateMemberNotOnDayOff,
} from './slotValidator';
import { formatDateBooking, parseTimeToMinutes, addMinutesToTime } from '../../utils/dateUtils';

/**
 * Member availability result
 */
export interface MemberAvailabilityResult {
  /** Valid time slots with availability info */
  validSlots: TimeSlot[];
  /** Whether the entire day is blocked (shop closed) */
  blockDay: boolean;
  /** Available members by service ID */
  availableMembersByService: MembersByService;
  /** Error message if any */
  error?: string;
}

/**
 * Get guest services from all guests
 */
export function getGuestServices(guests: Guest[]): GuestService[] {
  return guests.flatMap(guest => guest.services);
}

/**
 * Calculate total duration from guest services
 * Takes the maximum if services are done in parallel
 */
export function calculateTotalDuration(guests: Guest[]): number {
  if (guests.length === 0) return 0;
  
  // For each guest, sum their services' durations
  const durationsByGuest = guests.map(guest => 
    guest.services.reduce((sum, service) => {
      let duration = service.duration;
      
      // Add option duration if selected
      if (service.selectedOption) {
        duration = service.selectedOption.duration;
      }
      
      // Add add-ons durations
      if (service.selectedAddOns) {
        duration += service.selectedAddOns.reduce(
          (addOnSum, addOn) => addOnSum + (addOn.duration * addOn.quantity),
          0
        );
      }
      
      return sum + duration;
    }, 0)
  );
  
  // Return the max duration (services are done in parallel for different guests)
  // TODO: Clarify from doc if services should be sequential or parallel per guest
  return Math.max(...durationsByGuest);
}

/**
 * Calculate max duration across all guests
 */
export function calculateMaxDuration(guests: Guest[]): number {
  return calculateTotalDuration(guests);
}

/**
 * Get members who can perform all services for a guest
 */
export function getMembersForGuestServices(
  teamMembers: TeamMember[],
  guestServices: GuestService[]
): TeamMember[] {
  const serviceIds = guestServices.map(s => s.id);
  
  return teamMembers.filter(member =>
    serviceIds.every(serviceId => member.services.includes(serviceId))
  );
}

/**
 * Get fully available members for a date
 * Checks: works on day, not on day off
 */
export function getFullyAvailableMembers(
  teamMembers: TeamMember[],
  date: Date,
  guestServices: GuestService[],
  dayOffs: DayOff[],
  shop: Shop
): TeamMember[] {
  // First filter to members who can do the services
  const capableMembers = getMembersForGuestServices(teamMembers, guestServices);
  
  // Then filter to members who work on this day
  const dayIndex = date.getDay();
  const dayName = DAY_NAMES[dayIndex];
  
  return capableMembers.filter(member => {
    // Check if member works on this day
    const memberSchedule = member[dayName];
    if (!memberSchedule || memberSchedule.length === 0) {
      return false;
    }
    
    // Check if member is on day off (full day)
    const memberDayOffs = dayOffs.filter(d => d.memberId === member.id);
    for (const dayOff of memberDayOffs) {
      const startDate = dayOff.dateStart instanceof Date 
        ? dayOff.dateStart 
        : (dayOff.dateStart as any).toDate?.() ?? new Date(dayOff.dateStart as any);
      const endDate = dayOff.dateEnd instanceof Date 
        ? dayOff.dateEnd 
        : (dayOff.dateEnd as any).toDate?.() ?? new Date(dayOff.dateEnd as any);
      
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const startOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      
      if (dateOnly >= startOnly && dateOnly <= endOnly) {
        // Check if it's a partial day off with hours
        if (!dayOff.startHour || !dayOff.endHour) {
          // Full day off
          return false;
        }
      }
    }
    
    return true;
  });
}

/**
 * Get available members by service without conflicts
 * Based on documentation section 5.4
 */
export function getAvailableMembersByServiceWithoutConflict(
  teamMembers: TeamMember[],
  guestServices: GuestService[],
  numberOfGuests: number
): MembersByService {
  const result: MembersByService = {};
  
  const serviceIds = [...new Set(guestServices.map(gs => gs.id))];
  
  serviceIds.forEach(serviceId => {
    const membersForService = teamMembers.filter(member =>
      member.services.includes(serviceId)
    );
    
    result[serviceId] = membersForService;
  });
  
  return result;
}

/**
 * Get valid slots for a date
 * Main orchestration function
 * Based on documentation section 6.2
 */
export function getValidSlots(
  bookings: Booking[],
  numberOfServices: number,
  selectedMemberIds: string[],
  shop: Shop,
  date: Date,
  totalDuration: number,
  dayOffs: DayOff[],
  numberOfGuests: number,
  availableMembersByService: MembersByService
): TimeSlot[] {
  const { settingCalendar } = shop;
  const schedule = getScheduleForDate(shop, date);
  
  // If shop is closed this day
  if (!schedule || schedule.length === 0) {
    return [];
  }
  
  // Generate base slots
  let slots = generateTimeSlots(schedule, settingCalendar.interval_minutes, date);
  
  // Filter by duration (can the service fit before closing)
  slots = filterSlotsByDuration(slots, totalDuration, schedule);
  
  // Get members to validate against
  let membersToValidate: TeamMember[] = [];
  
  // If specific members are selected, only validate those
  if (selectedMemberIds.length > 0) {
    // Flatten all members from availableMembersByService
    const allMembers = Object.values(availableMembersByService).flat();
    membersToValidate = allMembers.filter(m => selectedMemberIds.includes(m.id));
  } else {
    // Use all available members
    membersToValidate = [...new Set(Object.values(availableMembersByService).flat())];
  }
  
  // Validate each slot
  slots = validateSlots(
    slots,
    date,
    totalDuration,
    shop,
    membersToValidate,
    dayOffs,
    bookings
  );
  
  return slots;
}

/**
 * Main member availability function
 * Based on documentation section 6.2 - memberAvailability
 * 
 * @param teamMembers - All team members of the shop
 * @param date - Selected date
 * @param dayOffs - Day offs for this shop
 * @param shop - Shop data
 * @param selectedTime - Currently selected time (optional)
 * @param selectedMembers - Currently selected members (optional)
 * @param guests - Guest data with selected services
 * @param bookings - Existing bookings
 */
export function computeValidSlotsForDate(
  shop: Shop,
  teamMembers: TeamMember[],
  bookings: Booking[],
  dayOffs: DayOff[],
  guests: Guest[],
  date: Date,
  numberOfGuests: number = 1
): MemberAvailabilityResult {
  // 1. Get guest services
  const guestServices = getGuestServices(guests);
  
  if (guestServices.length === 0) {
    return {
      validSlots: [],
      blockDay: true,
      availableMembersByService: {},
      error: 'Aucun service sélectionné',
    };
  }
  
  // 2. Calculate total duration
  const totalDuration = calculateMaxDuration(guests);
  
  // 3. Check if shop is open on this day
  const schedule = getScheduleForDate(shop, date);
  if (!schedule || schedule.length === 0) {
    return {
      validSlots: [],
      blockDay: true,
      availableMembersByService: {},
    };
  }
  
  // 4. Get fully available members for this day
  const availableMembers = getFullyAvailableMembers(
    teamMembers,
    date,
    guestServices,
    dayOffs,
    shop
  );
  
  if (availableMembers.length === 0) {
    return {
      validSlots: [],
      blockDay: true,
      availableMembersByService: {},
      error: 'Aucun membre disponible ce jour',
    };
  }
  
  // 5. Get available members by service (for conflict checking)
  const availableMembersByService = getAvailableMembersByServiceWithoutConflict(
    availableMembers,
    guestServices,
    numberOfGuests
  );
  
  // 6. Get valid slots
  const validSlots = getValidSlots(
    bookings,
    guestServices.length,
    [], // No pre-selected members
    shop,
    date,
    totalDuration,
    dayOffs,
    numberOfGuests,
    availableMembersByService
  );
  
  // 7. Check if any slot is available
  const hasAvailableSlot = validSlots.some(slot => slot.isAvailable);
  
  return {
    validSlots,
    blockDay: !hasAvailableSlot,
    availableMembersByService,
  };
}

/**
 * Get members available for a specific time slot
 */
export function getMembersAvailableForSlot(
  teamMembers: TeamMember[],
  date: Date,
  time: string,
  duration: number,
  dayOffs: DayOff[],
  bookings: Booking[]
): TeamMember[] {
  return teamMembers.filter(member => {
    const result = validateSlotForMember(member, date, time, duration, dayOffs, bookings);
    return result.isValid;
  });
}

/**
 * Check if a specific member is available for a slot
 */
export function isMemberAvailableForSlot(
  member: TeamMember,
  date: Date,
  time: string,
  duration: number,
  dayOffs: DayOff[],
  bookings: Booking[]
): boolean {
  const result = validateSlotForMember(member, date, time, duration, dayOffs, bookings);
  return result.isValid;
}

