/**
 * Client types based on DOCUMENTATION_FEATURE_BEAUTY.md
 * Collection: Clients/{userId}
 * Subcollection: Clients/{userId}/RegisteredShops/{registrationId}
 * Subcollection: Clients/{userId}/ClientPackages/{packageId}
 */

import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { TranslatedText } from './common.types';

/**
 * Client document structure
 */
export interface Client {
  /** Firebase Auth UID */
  userId: string;
  /** Email */
  email: string;
  /** First name */
  firstName?: string;
  /** Last name */
  lastName?: string;
  /** Phone number */
  phone?: string;
  /** Phone country code */
  phoneNumberCountry?: string;
  /** Profile photo URL */
  user_img?: string;
  /** Photo validated */
  user_img_Valid?: boolean;
  /** Preferred language */
  user_lang?: string;
  /** Registration timestamp */
  creatAt: FirebaseFirestoreTypes.Timestamp | Date;
  /** Registration source */
  from: string;
  /** Marketing consent */
  marketingConsent?: boolean;
  /** Terms accepted */
  termsAccepted?: boolean;
}

/**
 * Registered shop structure
 * Client's registration in a specific shop
 */
export interface RegisteredShop {
  /** Shop ID */
  shopId: string;
  /** Client UID */
  clientId: string;
  /** Registration timestamp */
  createAt: FirebaseFirestoreTypes.Timestamp | Date;
  /** Last visit timestamp */
  lastVisit?: FirebaseFirestoreTypes.Timestamp | Date;
  /** Loyalty points */
  points?: number;
  /** Number of visits */
  nbVisit?: number;
  /** Client number in this shop */
  clientNum?: number;
  /** Client first name (snapshot) */
  firstName?: string;
  /** Client last name (snapshot) */
  lastName?: string;
  /** Client email (snapshot) */
  email?: string;
  /** Client phone (snapshot) */
  phone?: string;
}

/**
 * Package service summary
 */
export interface PackageServiceSummary {
  serviceId: string;
  quantity: number;
}

/**
 * Client package document structure
 */
export interface ClientPackage {
  /** Document ID */
  id: string;
  /** Shop ID */
  shopId: string;
  /** Package is valid/active */
  isValid: boolean;
  /** Package name (translated) */
  name: TranslatedText;
  /** Services included with quantities */
  serviceSummary: PackageServiceSummary[];
}

/**
 * Client with booking count (for display)
 */
export interface ClientWithBookingInfo extends Client {
  totalBookings?: number;
  lastBookingDate?: Date;
}

