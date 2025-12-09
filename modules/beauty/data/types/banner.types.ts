/**
 * Search Banner types based on DOCUMENTATION_FEATURE_BEAUTY.md
 * Collection: SearchBanners/{bannerId}
 */

import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

/**
 * Banner URL structure (by language)
 */
export interface BannerUrl {
  desktop?: string;
  mobile?: string;
  redirect?: string;
}

/**
 * Banner content by language
 */
export interface BannerByLanguage {
  [lang: string]: {
    url: BannerUrl;
  };
}

/**
 * Search banner document structure
 */
export interface SearchBanner {
  /** Document ID */
  id: string;
  /** Category (e.g., "beauty") */
  category: string;
  /** Is active */
  isActive: boolean;
  /** Display priority */
  priority: number;
  /** Banner content by language */
  banner: BannerByLanguage;
  /** Click counter */
  countClick?: number;
  /** Last click timestamp */
  lastClick?: FirebaseFirestoreTypes.Timestamp | Date;
}

/**
 * Banner filters
 */
export interface BannerFilters {
  category?: string;
  isActive?: boolean;
}

