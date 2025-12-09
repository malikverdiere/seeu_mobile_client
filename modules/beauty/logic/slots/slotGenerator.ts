/**
 * Time slot generation logic
 * Based on DOCUMENTATION_FEATURE_BEAUTY.md section 6.3
 * 
 * Pure functions for generating time slots from shop schedules
 */

import { DaySchedule } from '../../data/types/common.types';
import { 
  parseTimeToMinutes, 
  minutesToTime,
  getDayNameFromDate,
} from '../../utils/dateUtils';

/**
 * Time slot structure
 */
export interface TimeSlot {
  time: string; // HH:MM format
  isAvailable: boolean;
  unavailableReason?: string;
}

/**
 * Generate time slots from a day schedule
 * Based on documentation section 6.3 - selectorTimeController.ts
 * 
 * @param schedule - Day schedule array (e.g., ["09:00", "12:00", "14:00", "18:00"])
 * @param intervalMinutes - Slot interval (15, 30, 60)
 * @param date - The date for these slots (used for labeling)
 * @returns Array of time slots
 * 
 * @example
 * generateTimeSlots(["09:00", "12:00", "14:00", "18:00"], 30)
 * // Returns slots from 09:00-12:00 and 14:00-18:00 with 30min intervals
 */
export function generateTimeSlots(
  schedule: DaySchedule,
  intervalMinutes: number,
  date?: Date
): TimeSlot[] {
  if (!schedule || schedule.length === 0) {
    return [];
  }
  
  const slots: TimeSlot[] = [];
  
  // Process pairs of open/close times
  for (let i = 0; i < schedule.length; i += 2) {
    const openTime = schedule[i];
    const closeTime = schedule[i + 1];
    
    if (!openTime || !closeTime) continue;
    
    const openMinutes = parseTimeToMinutes(openTime);
    const closeMinutes = parseTimeToMinutes(closeTime);
    
    // Generate slots for this time range
    for (let minutes = openMinutes; minutes < closeMinutes; minutes += intervalMinutes) {
      const time = minutesToTime(minutes);
      slots.push({
        time,
        isAvailable: true, // Will be validated later
      });
    }
  }
  
  return slots;
}

/**
 * Get the shop schedule for a specific date
 */
export function getScheduleForDate(
  shopSchedule: {
    monday?: DaySchedule;
    tuesday?: DaySchedule;
    wednesday?: DaySchedule;
    thursday?: DaySchedule;
    friday?: DaySchedule;
    saturday?: DaySchedule;
    sunday?: DaySchedule;
  },
  date: Date
): DaySchedule {
  const dayName = getDayNameFromDate(date);
  return shopSchedule[dayName] ?? [];
}

/**
 * Get the first available time slot for a date
 */
export function getFirstAvailableSlot(slots: TimeSlot[]): TimeSlot | null {
  return slots.find(slot => slot.isAvailable) ?? null;
}

/**
 * Get the last slot time (shop closing time)
 */
export function getLastSlotTime(schedule: DaySchedule): string | null {
  if (!schedule || schedule.length === 0) return null;
  
  // The last time in the schedule is the closing time
  return schedule[schedule.length - 1] ?? null;
}

/**
 * Check if a slot time can accommodate a service duration
 * (i.e., the service would end before shop closes)
 */
export function canSlotAccommodateDuration(
  slotTime: string,
  serviceDurationMinutes: number,
  schedule: DaySchedule
): boolean {
  if (!schedule || schedule.length === 0) return false;
  
  const slotMinutes = parseTimeToMinutes(slotTime);
  const serviceEndMinutes = slotMinutes + serviceDurationMinutes;
  
  // Check against each closing time in the schedule
  for (let i = 0; i < schedule.length; i += 2) {
    const openTime = schedule[i];
    const closeTime = schedule[i + 1];
    
    if (!openTime || !closeTime) continue;
    
    const openMinutes = parseTimeToMinutes(openTime);
    const closeMinutes = parseTimeToMinutes(closeTime);
    
    // If slot is in this range, check if service ends before close
    if (slotMinutes >= openMinutes && slotMinutes < closeMinutes) {
      return serviceEndMinutes <= closeMinutes;
    }
  }
  
  return false;
}

/**
 * Filter slots that can accommodate a service duration
 */
export function filterSlotsByDuration(
  slots: TimeSlot[],
  serviceDurationMinutes: number,
  schedule: DaySchedule
): TimeSlot[] {
  return slots.map(slot => {
    if (!slot.isAvailable) return slot;
    
    const canAccommodate = canSlotAccommodateDuration(
      slot.time,
      serviceDurationMinutes,
      schedule
    );
    
    if (!canAccommodate) {
      return {
        ...slot,
        isAvailable: false,
        unavailableReason: 'Service duration exceeds available time',
      };
    }
    
    return slot;
  });
}

/**
 * Group slots by hour for UI display
 */
export function groupSlotsByHour(slots: TimeSlot[]): Map<number, TimeSlot[]> {
  const grouped = new Map<number, TimeSlot[]>();
  
  slots.forEach(slot => {
    const hour = parseInt(slot.time.split(':')[0], 10);
    
    if (!grouped.has(hour)) {
      grouped.set(hour, []);
    }
    
    grouped.get(hour)!.push(slot);
  });
  
  return grouped;
}

/**
 * Get morning, afternoon, evening slots
 */
export function categorizeSlotsByTimeOfDay(slots: TimeSlot[]): {
  morning: TimeSlot[];
  afternoon: TimeSlot[];
  evening: TimeSlot[];
} {
  const morning: TimeSlot[] = [];
  const afternoon: TimeSlot[] = [];
  const evening: TimeSlot[] = [];
  
  slots.forEach(slot => {
    const hour = parseInt(slot.time.split(':')[0], 10);
    
    if (hour < 12) {
      morning.push(slot);
    } else if (hour < 17) {
      afternoon.push(slot);
    } else {
      evening.push(slot);
    }
  });
  
  return { morning, afternoon, evening };
}

