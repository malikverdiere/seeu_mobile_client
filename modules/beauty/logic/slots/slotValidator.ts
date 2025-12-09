/**
 * Time slot validation logic
 * Based on DOCUMENTATION_FEATURE_BEAUTY.md section 6.4
 * 
 * Pure functions for validating time slots
 */

import { DaySchedule } from '../../data/types/common.types';
import { Shop, SettingCalendar } from '../../data/types/shop.types';
import { TeamMember } from '../../data/types/team.types';
import { Booking, BookingStatus } from '../../data/types/booking.types';
import { DayOff } from '../../data/types/dayoff.types';
import { GuestService } from '../../data/types/service.types';
import {
  parseTimeToMinutes,
  isTimeSlotInPast,
  isWithinMaxBookingPeriod,
  isTimeWithinSchedule,
  doTimeRangesOverlap,
  formatDateBooking,
  addMinutesToTime,
} from '../../utils/dateUtils';
import { TimeSlot } from './slotGenerator';

/**
 * Validation result for a slot
 */
export interface SlotValidationResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Check if a slot is not in the past (considering advanced notice)
 * Based on documentation section 6.4 - isTimeSlotInPast
 */
export function validateSlotNotInPast(
  date: Date,
  time: string,
  timezone: string,
  advancedNoticeHours: number
): SlotValidationResult {
  const isInPast = isTimeSlotInPast(date, time, timezone, advancedNoticeHours);
  
  return {
    isValid: !isInPast,
    reason: isInPast ? 'Ce créneau est dans le passé' : undefined,
  };
}

/**
 * Check if a slot is within shop's opening hours
 */
export function validateSlotWithinOpeningHours(
  time: string,
  schedule: DaySchedule
): SlotValidationResult {
  const isWithin = isTimeWithinSchedule(time, schedule);
  
  return {
    isValid: isWithin,
    reason: !isWithin ? 'Boutique fermée à cette heure' : undefined,
  };
}

/**
 * Check if a date is within max booking period
 * Based on documentation section 6.1 - maxBookingPeriod
 */
export function validateSlotWithinMaxPeriod(
  date: Date,
  maxBookingPeriodDays: number,
  timezone: string
): SlotValidationResult {
  const isWithin = isWithinMaxBookingPeriod(date, maxBookingPeriodDays, timezone);
  
  return {
    isValid: isWithin,
    reason: !isWithin ? 'Date trop éloignée' : undefined,
  };
}

/**
 * Check if a member works on a specific day
 * Based on documentation section 6.4 - isNoWorkingDay
 */
export function validateMemberWorksOnDay(
  member: TeamMember,
  date: Date,
  time: string
): SlotValidationResult {
  const dayIndex = date.getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const dayName = dayNames[dayIndex];
  
  const memberSchedule = member[dayName];
  
  if (!memberSchedule || memberSchedule.length === 0) {
    return {
      isValid: false,
      reason: 'Membre ne travaille pas ce jour',
    };
  }
  
  const isWithin = isTimeWithinSchedule(time, memberSchedule);
  
  return {
    isValid: isWithin,
    reason: !isWithin ? 'Membre ne travaille pas à cette heure' : undefined,
  };
}

/**
 * Check if a member is on day off
 * Based on documentation section 6.4 - isMemberOnDayOff
 */
export function validateMemberNotOnDayOff(
  memberId: string,
  date: Date,
  time: string,
  dayOffs: DayOff[]
): SlotValidationResult {
  const memberDayOffs = dayOffs.filter(d => d.memberId === memberId);
  
  for (const dayOff of memberDayOffs) {
    const startDate = dayOff.dateStart instanceof Date 
      ? dayOff.dateStart 
      : (dayOff.dateStart as any).toDate?.() ?? new Date(dayOff.dateStart as any);
    const endDate = dayOff.dateEnd instanceof Date 
      ? dayOff.dateEnd 
      : (dayOff.dateEnd as any).toDate?.() ?? new Date(dayOff.dateEnd as any);
    
    // Check if date falls within day off period
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const startOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    if (dateOnly < startOnly || dateOnly > endOnly) continue;
    
    // If partial day off (with hours), check time
    if (dayOff.startHour && dayOff.endHour) {
      const [dayOffStartH, dayOffStartM] = dayOff.startHour.split(':').map(Number);
      const [dayOffEndH, dayOffEndM] = dayOff.endHour.split(':').map(Number);
      const [timeH, timeM] = time.split(':').map(Number);
      
      const dayOffStartMinutes = dayOffStartH * 60 + dayOffStartM;
      const dayOffEndMinutes = dayOffEndH * 60 + dayOffEndM;
      const timeMinutes = timeH * 60 + timeM;
      
      if (timeMinutes >= dayOffStartMinutes && timeMinutes < dayOffEndMinutes) {
        return {
          isValid: false,
          reason: 'Membre en congé',
        };
      }
    } else {
      // Full day off
      return {
        isValid: false,
        reason: 'Membre en congé',
      };
    }
  }
  
  return { isValid: true };
}

/**
 * Check if a member is available for a time slot (not already booked)
 * Based on documentation section 6.4 - isMemberAvailableForTimeSlot
 */
export function validateMemberNotBooked(
  memberId: string,
  date: Date,
  time: string,
  duration: number,
  bookings: Booking[]
): SlotValidationResult {
  const dateBooking = formatDateBooking(date);
  const endTime = addMinutesToTime(time, duration);
  
  // Filter bookings for this date with blocking statuses (1 or 2)
  const dateBookings = bookings.filter(
    b => b.dateBooking === dateBooking && 
         (b.statut === BookingStatus.PENDING || b.statut === BookingStatus.CONFIRMED)
  );
  
  // Check each booking for conflicts
  for (const booking of dateBookings) {
    // Check if this member is assigned to this booking
    const memberAssigned = booking.teamMemberId.some(tm => tm.id === memberId);
    
    if (!memberAssigned) continue;
    
    // Check for time overlap
    const overlaps = doTimeRangesOverlap(
      time,
      endTime,
      booking.timeStart,
      booking.timeEnd
    );
    
    if (overlaps) {
      return {
        isValid: false,
        reason: 'Membre déjà réservé',
      };
    }
  }
  
  return { isValid: true };
}

/**
 * Validate a slot for a specific member
 * Combines all member-related validations
 */
export function validateSlotForMember(
  member: TeamMember,
  date: Date,
  time: string,
  duration: number,
  dayOffs: DayOff[],
  bookings: Booking[]
): SlotValidationResult {
  // Check if member works on this day/time
  const worksResult = validateMemberWorksOnDay(member, date, time);
  if (!worksResult.isValid) return worksResult;
  
  // Check if member is on day off
  const dayOffResult = validateMemberNotOnDayOff(member.id, date, time, dayOffs);
  if (!dayOffResult.isValid) return dayOffResult;
  
  // Check if member is already booked
  const bookedResult = validateMemberNotBooked(member.id, date, time, duration, bookings);
  if (!bookedResult.isValid) return bookedResult;
  
  return { isValid: true };
}

/**
 * Check if at least one member is available for a slot
 */
export function validateAtLeastOneMemberAvailable(
  members: TeamMember[],
  date: Date,
  time: string,
  duration: number,
  dayOffs: DayOff[],
  bookings: Booking[]
): SlotValidationResult {
  for (const member of members) {
    const result = validateSlotForMember(member, date, time, duration, dayOffs, bookings);
    if (result.isValid) {
      return { isValid: true };
    }
  }
  
  return {
    isValid: false,
    reason: 'Aucun membre disponible',
  };
}

/**
 * Full slot validation
 * Based on documentation section 6.4
 */
export function isSlotValid(
  date: Date,
  time: string,
  duration: number,
  shop: Shop,
  members: TeamMember[],
  dayOffs: DayOff[],
  bookings: Booking[]
): SlotValidationResult {
  const { settingCalendar } = shop;
  
  // 1. Check not in past (with advanced notice)
  const pastResult = validateSlotNotInPast(
    date,
    time,
    settingCalendar.timeZone,
    settingCalendar.advancedNotice
  );
  if (!pastResult.isValid) return pastResult;
  
  // 2. Check within max booking period
  const periodResult = validateSlotWithinMaxPeriod(
    date,
    settingCalendar.maxBookingPeriod,
    settingCalendar.timeZone
  );
  if (!periodResult.isValid) return periodResult;
  
  // 3. Check at least one member is available
  const memberResult = validateAtLeastOneMemberAvailable(
    members,
    date,
    time,
    duration,
    dayOffs,
    bookings
  );
  if (!memberResult.isValid) return memberResult;
  
  return { isValid: true };
}

/**
 * Validate and update slots with availability info
 */
export function validateSlots(
  slots: TimeSlot[],
  date: Date,
  duration: number,
  shop: Shop,
  members: TeamMember[],
  dayOffs: DayOff[],
  bookings: Booking[]
): TimeSlot[] {
  return slots.map(slot => {
    if (!slot.isAvailable) return slot;
    
    const validation = isSlotValid(
      date,
      slot.time,
      duration,
      shop,
      members,
      dayOffs,
      bookings
    );
    
    return {
      ...slot,
      isAvailable: validation.isValid,
      unavailableReason: validation.reason,
    };
  });
}

