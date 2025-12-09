/**
 * Shop types based on DOCUMENTATION_FEATURE_BEAUTY.md
 * Collection: Shops/{shopId}
 */

import {
  Coordinate,
  Currency,
  ShopType,
  GoogleInfos,
  Highlight,
  Promotion,
  SeoMeta,
  AboutUs,
  DaySchedule,
} from './common.types';

/**
 * Setting Calendar structure (sub-object of Shop)
 * Contains booking/calendar configuration
 */
export interface SettingCalendar {
  /** Slot granularity in minutes (15, 30, 60) */
  interval_minutes: number;
  /** Shop timezone (e.g., "Asia/Bangkok") */
  timeZone: string;
  /** Minimum hours before a booking can be made */
  advancedNotice: number;
  /** Maximum days in advance for booking */
  maxBookingPeriod: number;
  /** Online payment enabled */
  deposit_enabled?: boolean;
  /** Deposit percentage */
  deposit_percentage?: number;
  /** Discount for online payment */
  deposit_discount_amount?: number;
  /** Refund deadline in hours before appointment */
  deposit_refund_deadline_hours?: number;
  /** Hide "pay at venue" option */
  hideAtVenue?: boolean;
  /** Auto-confirm bookings */
  autoConfirmed?: boolean;
  /** Display member selection */
  displaySelectMember?: boolean;
  /** Dedicated page for member selection */
  displaySelectMemberAutoOpen?: boolean;
  /** Force member selection */
  forceMemberSelection?: boolean;
  /** Send booking email to assigned member */
  sendBookingEmailToMember?: boolean;
  /** Send booking email to specific address */
  sendBookingEmailToSpecificEmail?: boolean;
  /** Specific email for new bookings */
  emailNewBooking?: string;
  /** Price range display */
  priceRange?: string;
}

/**
 * Shop document structure
 */
export interface Shop {
  /** Document ID */
  id: string;
  /** Shop name */
  shopName: string;
  /** URL slug (unique identifier for URLs) */
  booking_id: string;
  /** Shop is active/visible */
  shopValid: boolean;
  /** Full address */
  address: string;
  /** Neighborhood/district */
  neighborhood?: string;
  /** City */
  city: string;
  /** Country */
  country: string;
  /** Country code (e.g., "TH") */
  country_short?: string;
  /** Postal code */
  postalCode?: string;
  /** Shop email */
  email: string;
  /** Phone number */
  phone_number?: string;
  /** GPS coordinates */
  coordinate: Coordinate;
  /** Gallery images URLs */
  GalleryPictureShop?: string[];
  /** Gallery videos URLs */
  galleryVideoShop?: string[];
  /** Currency settings */
  currency: Currency;
  /** Shop type (beauty, etc.) */
  shopType: ShopType;
  /** Categories array for filtering */
  shop_type: string[];
  /** SeeU rating */
  shopRating?: number;
  /** Number of SeeU reviews */
  shopRatingNumber?: number;
  /** Google business info */
  google_infos?: GoogleInfos;
  /** About us text (translated) */
  about_us?: AboutUs;
  /** SEO meta (translated) */
  seo_meta?: SeoMeta;
  
  // Weekly schedule
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
  
  /** Stripe Connect ID for payments */
  stripeConnectId?: string;
  /** Owner user ID */
  userId: string;
  /** Ad position for sorting */
  adPosition?: number;
  /** Promo label text */
  promoLabel?: string;
  /** Highlight/featured settings */
  highlight?: Highlight;
  /** Promotion flags */
  promotion?: Promotion;
  /** Calendar settings */
  settingCalendar: SettingCalendar;
}

/**
 * Shop with calculated distance (for search results)
 */
export interface ShopWithDistance extends Shop {
  distance?: number; // in km
}

/**
 * Shop filters for search
 */
export interface ShopFilters {
  /** Category type (1 for beauty) */
  categoryType?: number;
  /** Sub-category (hair, nails, etc.) */
  category?: string;
  /** Filter by specific date */
  date?: Date;
  /** Latitude for geo search */
  lat?: number;
  /** Longitude for geo search */
  lng?: number;
  /** Search radius in km */
  radius?: number;
  /** Has promo code */
  promoCode?: boolean;
  /** Has double day promo */
  doubleDay?: boolean;
  /** Has new client promo */
  newClient?: boolean;
}

