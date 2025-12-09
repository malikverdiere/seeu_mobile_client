/**
 * Team types based on DOCUMENTATION_FEATURE_BEAUTY.md
 * Collection: Shops/{shopId}/Teams/{memberId}
 */

import { DaySchedule } from './common.types';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

/**
 * Team member document structure
 */
export interface TeamMember {
  /** Document ID */
  id: string;
  /** Firebase Auth UID (if linked to a user account) */
  uid?: string;
  /** First name */
  first_name: string;
  /** Last name */
  last_name?: string;
  /** Email */
  email?: string;
  /** Phone number */
  phone_number?: string;
  /** Profile photo URL */
  photo_url?: string;
  /** Job title */
  job_title?: string;
  /** Biography */
  bio?: string;
  /** IDs of services this member can perform */
  services: string[];
  
  // Weekly working hours
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
  
  /** Creation timestamp */
  created_time?: FirebaseFirestoreTypes.Timestamp;
}

/**
 * Team member with display name (computed)
 */
export interface TeamMemberWithDisplayName extends TeamMember {
  displayName: string; // first_name + last_name
}

/**
 * Selected member for booking
 */
export interface SelectedMember {
  id: string;
  name: string;
}

/**
 * Member availability result
 */
export interface MemberAvailability {
  memberId: string;
  memberName: string;
  isAvailable: boolean;
  availableSlots?: string[]; // Time slots where member is available
}

/**
 * Members grouped by service ID
 * Used to check which members can perform which services
 */
export interface MembersByService {
  [serviceId: string]: TeamMember[];
}

