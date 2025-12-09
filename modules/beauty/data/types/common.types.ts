/**
 * Common types shared across the beauty module
 * Based on DOCUMENTATION_FEATURE_BEAUTY.md
 */

import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

/**
 * Translated text structure used in multiple collections
 */
export interface TranslatedText {
  [lang: string]: {
    text: string;
  };
}

/**
 * Currency structure used in shops
 */
export interface Currency {
  id: number;
  text: string; // Symbol (฿, €, etc.)
  name: string;
}

/**
 * Coordinate structure for geolocation
 */
export interface Coordinate {
  latitude: number;
  longitude: number;
  geohash: string;
}

/**
 * Shop type structure
 */
export interface ShopType {
  id: string;
  type: number; // 1 = beauty
  en?: string;
  fr?: string;
  th?: string;
}

/**
 * Google business info structure
 */
export interface GoogleInfos {
  rating?: number;
  user_ratings_total?: number;
  businessType?: string;
}

/**
 * Highlight structure for featured shops
 */
export interface Highlight {
  isActive: boolean;
  type?: string; // "Trending", "Nail studio", "Massage salon", "Hair salon"
}

/**
 * Promotion structure
 */
export interface Promotion {
  doubleDay?: boolean;
  code?: boolean;
  newClient?: boolean;
}

/**
 * SEO meta structure (for reference, not used in RN)
 */
export interface SeoMeta {
  [lang: string]: {
    metaTitle?: string;
    metaDescription?: string;
  };
}

/**
 * About us structure
 */
export interface AboutUs {
  [lang: string]: {
    text?: string;
  };
}

/**
 * Day schedule - array of opening/closing times
 * Ex: ["09:00", "12:00", "14:00", "18:00"] = 2 time slots
 * Ex: ["09:00", "18:00"] = 1 continuous slot
 * Ex: [] = closed
 */
export type DaySchedule = string[];

/**
 * Weekly schedule structure
 */
export interface WeeklySchedule {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

/**
 * Session/UTM data for tracking
 */
export interface SessionData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
  landing_page?: string;
  [key: string]: string | undefined;
}

/**
 * Firestore document with ID
 */
export interface FirestoreDoc<T> {
  id: string;
  data: T;
}

/**
 * Supported languages
 */
export type SupportedLanguage = 'en' | 'fr' | 'th';

/**
 * Day names in lowercase
 */
export type DayName = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

/**
 * Helper to get day name from date
 */
export const DAY_NAMES: DayName[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

