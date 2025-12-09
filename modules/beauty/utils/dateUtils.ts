/**
 * Date utilities for Beauty module
 * Based on DOCUMENTATION_FEATURE_BEAUTY.md section 6.5
 * 
 * Handles timezone conversions, date formatting, and booking time calculations
 */

import { DayName, DAY_NAMES, DaySchedule } from '../data/types/common.types';

/**
 * Get the day name from a date
 */
export function getDayNameFromDate(date: Date): DayName {
  const dayIndex = date.getDay();
  return DAY_NAMES[dayIndex];
}

/**
 * Format date as DD/MM/YYYY (dateBooking format)
 */
export function formatDateBooking(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Parse dateBooking format (DD/MM/YYYY) to Date
 */
export function parseDateBooking(dateStr: string): Date {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format time as HH:MM
 */
export function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Parse time string (HH:MM) to minutes since midnight
 */
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Add minutes to a time string
 */
export function addMinutesToTime(time: string, minutesToAdd: number): string {
  const totalMinutes = parseTimeToMinutes(time) + minutesToAdd;
  return minutesToTime(totalMinutes % (24 * 60)); // Wrap around midnight
}

/**
 * Calculate duration between two time strings in minutes
 */
export function calculateDurationMinutes(startTime: string, endTime: string): number {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  
  // Handle overnight spans
  if (endMinutes < startMinutes) {
    return (24 * 60 - startMinutes) + endMinutes;
  }
  
  return endMinutes - startMinutes;
}

/**
 * Get timezone offset string for a timezone
 * Based on documentation section 6.5
 * 
 * @example getTimezoneOffsetString('Asia/Bangkok', '2025-01-15', '10:00') // "+07:00"
 */
export function getTimezoneOffsetString(
  timezone: string,
  dateStr: string,
  time: string
): string {
  try {
    // Create a date in the target timezone
    const date = new Date(`${dateStr}T${time}:00`);
    
    // Get the offset in minutes using Intl
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'longOffset',
    });
    
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    
    if (tzPart?.value) {
      // Extract offset from format like "GMT+07:00"
      const match = tzPart.value.match(/GMT([+-]\d{2}:\d{2})/);
      if (match) {
        return match[1];
      }
    }
    
    // Fallback: calculate manually
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    const diffMinutes = (tzDate.getTime() - utcDate.getTime()) / (1000 * 60);
    
    const sign = diffMinutes >= 0 ? '+' : '-';
    const absMinutes = Math.abs(diffMinutes);
    const hours = Math.floor(absMinutes / 60);
    const mins = absMinutes % 60;
    
    return `${sign}${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  } catch {
    // Default to UTC if timezone is invalid
    return '+00:00';
  }
}

/**
 * Convert a date/time to shop timezone
 * Based on documentation section 6.5
 */
export function convertToShopTimezone(
  date: Date,
  timezone: string
): Date {
  try {
    const dateStr = date.toLocaleString('en-US', { timeZone: timezone });
    return new Date(dateStr);
  } catch {
    return date;
  }
}

/**
 * Get current time in shop timezone
 */
export function getCurrentTimeInTimezone(timezone: string): Date {
  return convertToShopTimezone(new Date(), timezone);
}

/**
 * Create a booking date in UTC from local date/time and timezone
 * Based on documentation section 6.5
 * 
 * @example
 * createBookingDateUTC('2025-01-15', '10:30', 'Asia/Bangkok')
 * // Returns Date object representing 2025-01-15T10:30:00+07:00 in UTC
 */
export function createBookingDateUTC(
  dateStr: string,
  timeStart: string,
  timezone: string
): Date {
  const offsetString = getTimezoneOffsetString(timezone, dateStr, timeStart);
  const isoStringWithTimezone = `${dateStr}T${timeStart}:00${offsetString}`;
  return new Date(isoStringWithTimezone);
}

/**
 * Check if a date is today in a given timezone
 */
export function isToday(date: Date, timezone: string): boolean {
  const now = getCurrentTimeInTimezone(timezone);
  const target = convertToShopTimezone(date, timezone);
  
  return (
    now.getFullYear() === target.getFullYear() &&
    now.getMonth() === target.getMonth() &&
    now.getDate() === target.getDate()
  );
}

/**
 * Check if a time slot is in the past
 * Based on documentation section 6.4 - isTimeSlotInPast
 */
export function isTimeSlotInPast(
  date: Date,
  time: string,
  timezone: string,
  advancedNoticeHours: number = 0
): boolean {
  const now = getCurrentTimeInTimezone(timezone);
  const slotDate = convertToShopTimezone(date, timezone);
  
  // Set the time on the slot date
  const [hours, minutes] = time.split(':').map(Number);
  slotDate.setHours(hours, minutes, 0, 0);
  
  // Add advanced notice
  const advancedNoticeMs = advancedNoticeHours * 60 * 60 * 1000;
  const minBookingTime = new Date(now.getTime() + advancedNoticeMs);
  
  return slotDate.getTime() < minBookingTime.getTime();
}

/**
 * Check if a date is within the max booking period
 * Based on documentation section 6.1 - maxBookingPeriod
 */
export function isWithinMaxBookingPeriod(
  date: Date,
  maxBookingPeriodDays: number,
  timezone: string
): boolean {
  const now = getCurrentTimeInTimezone(timezone);
  const maxDate = new Date(now);
  maxDate.setDate(maxDate.getDate() + maxBookingPeriodDays);
  
  const target = convertToShopTimezone(date, timezone);
  
  return target.getTime() <= maxDate.getTime();
}

/**
 * Get dates available for booking (from now to maxBookingPeriod)
 */
export function getAvailableDatesForBooking(
  maxBookingPeriodDays: number,
  timezone: string
): Date[] {
  const dates: Date[] = [];
  const now = getCurrentTimeInTimezone(timezone);
  
  for (let i = 0; i <= maxBookingPeriodDays; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);
    dates.push(date);
  }
  
  return dates;
}

/**
 * Format date for display in a specific locale
 */
export function formatDateForDisplay(
  date: Date,
  locale: string = 'fr-FR',
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  };
  
  return date.toLocaleDateString(locale, defaultOptions);
}

/**
 * Format duration for display
 */
export function formatDuration(minutes: number, locale: string = 'fr'): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (locale === 'fr') {
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  }
  
  // English
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

/**
 * Get date as YYYY-MM-DD string (ISO format without time)
 */
export function getISODateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate the end time given start time and duration
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  return addMinutesToTime(startTime, durationMinutes);
}

/**
 * Check if time ranges overlap
 */
export function doTimeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = parseTimeToMinutes(start1);
  const e1 = parseTimeToMinutes(end1);
  const s2 = parseTimeToMinutes(start2);
  const e2 = parseTimeToMinutes(end2);
  
  return s1 < e2 && s2 < e1;
}

/**
 * Check if a time is within a schedule
 * Schedule format: ["09:00", "12:00", "14:00", "18:00"] = 2 time slots
 */
export function isTimeWithinSchedule(time: string, schedule: DaySchedule): boolean {
  if (!schedule || schedule.length === 0) return false;
  
  const timeMinutes = parseTimeToMinutes(time);
  
  // Process pairs of open/close times
  for (let i = 0; i < schedule.length; i += 2) {
    const openTime = schedule[i];
    const closeTime = schedule[i + 1];
    
    if (!openTime || !closeTime) continue;
    
    const openMinutes = parseTimeToMinutes(openTime);
    const closeMinutes = parseTimeToMinutes(closeTime);
    
    if (timeMinutes >= openMinutes && timeMinutes < closeMinutes) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get hours until a booking (for refund deadline check)
 */
export function getHoursUntilBooking(bookingDate: Date, timezone: string): number {
  const now = getCurrentTimeInTimezone(timezone);
  const diffMs = bookingDate.getTime() - now.getTime();
  return diffMs / (1000 * 60 * 60);
}

/**
 * Check if cancellation is allowed based on refund deadline
 */
export function isCancellationAllowed(
  bookingDate: Date,
  refundDeadlineHours: number,
  timezone: string
): boolean {
  const hoursUntil = getHoursUntilBooking(bookingDate, timezone);
  return hoursUntil >= refundDeadlineHours;
}

