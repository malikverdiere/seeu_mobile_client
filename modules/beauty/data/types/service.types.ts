/**
 * Service types based on DOCUMENTATION_FEATURE_BEAUTY.md
 * Collection: Shops/{shopId}/Services/{serviceId}
 * Collection: Shops/{shopId}/ServiceCategories/{categoryId}
 */

import { TranslatedText } from './common.types';

/**
 * Service option structure
 * Represents a variant of a service (e.g., different durations)
 */
export interface ServiceOption {
  id: string;
  name: string;
  duration: number;
  durationText: string;
  price: number;
  promotionPrice?: number;
}

/**
 * Service add-on structure
 * Additional services that can be added to a main service
 */
export interface ServiceAddOn {
  id: string;
  name: TranslatedText;
  description?: TranslatedText;
  duration: number;
  durationText: string;
  price: number;
  promotionPrice?: number | null;
  maxQuantity?: number;
  /** Selected quantity (used in cart) */
  quantity: number;
}

/**
 * Service document structure
 */
export interface Service {
  /** Document ID */
  id: string;
  /** Default name */
  name: string;
  /** Translated title */
  title_service?: TranslatedText;
  /** Default description */
  description?: string;
  /** Translated description */
  description_service?: TranslatedText;
  /** Duration in minutes */
  duration: number;
  /** Formatted duration text */
  durationText?: string;
  /** Normal price */
  price: number;
  /** Promo price (0 = free) */
  promotionPrice?: number;
  /** Reference to category */
  categoryId: string;
  /** Display color */
  colorService?: string;
  /** Hidden from clients */
  hidden_for_client?: boolean;
  /** Featured service */
  featured?: boolean;
  /** Number of people */
  people?: number;
  /** Display priority/order */
  priority?: number;
  /** Service image URL */
  pictureUrl?: string;
  /** Loyalty points earned */
  loyaltyPoint?: number;
  /** Available options */
  serviceOptions?: ServiceOption[];
  /** Available add-ons */
  serviceAddons?: ServiceAddOn[];
}

/**
 * Service category document structure
 */
export interface ServiceCategory {
  /** Document ID */
  id: string;
  /** Default category name */
  categoryName: string;
  /** Translated title */
  title?: TranslatedText;
  /** Description */
  Description?: string;
  /** Display color */
  color?: string;
  /** Display priority/order */
  priority?: number;
}

/**
 * Service with category info (for display)
 */
export interface ServiceWithCategory extends Service {
  category?: ServiceCategory;
}

/**
 * Guest service structure (selected service in cart)
 * Used by GuestController
 */
export interface GuestService {
  id: string;
  guestId: string;
  guestName: string;
  name: string;
  duration: number;
  price: number;
  promotionPrice?: number | null;
  selectedOption?: ServiceOption;
  selectedAddOns?: ServiceAddOn[];
  teamMemberId?: string;
  teamMemberName?: string;
  totalPrice: number;
  // Additional fields from Service
  categoryId?: string;
  colorService?: string;
  people?: number;
  loyaltyPoint?: number;
}

/**
 * Guest structure (person making the booking)
 */
export interface Guest {
  id: string; // "guest_1", "guest_2"...
  name: string; // "Me", "Guest 1", "Guest 2"...
  services: GuestService[];
  isActive: boolean; // Only one active at a time
}

