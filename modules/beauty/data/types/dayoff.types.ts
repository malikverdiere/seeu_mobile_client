/**
 * DayOff types based on DOCUMENTATION_FEATURE_BEAUTY.md
 * Collection: Shops/{shopId}/DayOff/{dayOffId}
 */

import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

/**
 * DayOff document structure
 * Represents a period when a team member is unavailable
 */
export interface DayOff {
  /** Document ID */
  id: string;
  /** Team member ID */
  memberId: string;
  /** Start date */
  dateStart: FirebaseFirestoreTypes.Timestamp | Date;
  /** End date */
  dateEnd: FirebaseFirestoreTypes.Timestamp | Date;
  /** Start date formatted text */
  dateStartText?: string;
  /** End date formatted text */
  dateEndText?: string;
  /** Start hour (HH:MM) - for partial day off */
  startHour?: string;
  /** End hour (HH:MM) - for partial day off */
  endHour?: string;
  /** Type of day off (vacation, sick, etc.) */
  type?: string;
  /** Description/notes */
  description?: string;
  /** Creation timestamp */
  createdAt?: FirebaseFirestoreTypes.Timestamp | Date;
}

/**
 * DayOff query filters
 */
export interface DayOffFilters {
  /** Filter by member ID */
  memberId?: string;
  /** Date range start */
  dateFrom?: Date;
  /** Date range end */
  dateTo?: Date;
}

/**
 * Check if a specific date/time is blocked by day off
 */
export interface DayOffCheck {
  date: Date;
  time?: string; // HH:MM
  memberId: string;
}

