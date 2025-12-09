/**
 * Firebase configuration for Beauty module
 * Re-uses the existing firebase.config.js from the project
 */

// Re-export from existing config
export { auth, firestore, storage, functions, messaging, onHttpsCallable } from '../../../../firebase.config';

// Import firestore types
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

/**
 * Helper type for Firestore document snapshots
 */
export type DocumentSnapshot = FirebaseFirestoreTypes.DocumentSnapshot;
export type QuerySnapshot = FirebaseFirestoreTypes.QuerySnapshot;
export type DocumentData = FirebaseFirestoreTypes.DocumentData;
export type CollectionReference = FirebaseFirestoreTypes.CollectionReference;
export type DocumentReference = FirebaseFirestoreTypes.DocumentReference;
export type Query = FirebaseFirestoreTypes.Query;
export type Timestamp = FirebaseFirestoreTypes.Timestamp;

/**
 * Collection paths constants
 */
export const COLLECTIONS = {
  SHOPS: 'Shops',
  CLIENTS: 'Clients',
  PROMO_CODES: 'PromoCodes',
  REWARDS: 'Rewards',
  SEARCH_BANNERS: 'SearchBanners',
  // Subcollections
  SERVICES: 'Services',
  SERVICE_CATEGORIES: 'ServiceCategories',
  TEAMS: 'Teams',
  BOOKING: 'Booking',
  DAY_OFF: 'DayOff',
  SHOP_REVIEWS: 'ShopReviews',
  GOOGLE_REVIEWS: 'GoogleReviews',
  REGISTERED_SHOPS: 'RegisteredShops',
  CLIENT_PACKAGES: 'ClientPackages',
} as const;

/**
 * Convert Firestore Timestamp to Date
 */
export function timestampToDate(timestamp: Timestamp | Date | undefined | null): Date | undefined {
  if (!timestamp) return undefined;
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  return undefined;
}

/**
 * Convert Date to Firestore Timestamp
 */
export function dateToTimestamp(date: Date | undefined | null): Timestamp | undefined {
  if (!date) return undefined;
  // Use Firestore's Timestamp.fromDate
  const { Timestamp } = require('@react-native-firebase/firestore');
  return Timestamp.fromDate(date);
}

