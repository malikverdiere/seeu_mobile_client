/**
 * Review types based on DOCUMENTATION_FEATURE_BEAUTY.md
 * Collection: Shops/{shopId}/ShopReviews/{reviewId}
 * Collection: Shops/{shopId}/GoogleReviews/{reviewId}
 */

import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

/**
 * Shop review document structure (SeeU reviews)
 */
export interface ShopReview {
  /** Document ID */
  id: string;
  /** Client UID */
  clientId?: string;
  /** Rating (1-5) */
  ratingNote: number;
  /** Review text */
  ratingCommentary?: string;
  /** Creation timestamp */
  created_at: FirebaseFirestoreTypes.Timestamp | Date;
}

/**
 * Shop review with client info (enriched)
 */
export interface ShopReviewWithClient extends ShopReview {
  clientName?: string;
  clientPhoto?: string;
}

/**
 * Google review document structure
 * Imported from Google Places API
 */
export interface GoogleReview {
  /** Document ID */
  id: string;
  /** Author name */
  author_name?: string;
  /** Author profile photo URL */
  profile_photo_url?: string;
  /** Rating (1-5) */
  rating: number;
  /** Review text */
  text?: string;
  /** Relative time description */
  relative_time_description?: string;
  /** Review timestamp */
  time?: number;
}

/**
 * Combined review type for display
 */
export type Review = ShopReview | GoogleReview;

/**
 * Review source type
 */
export type ReviewSource = 'seeu' | 'google';

/**
 * Reviews summary
 */
export interface ReviewsSummary {
  source: ReviewSource;
  averageRating: number;
  totalCount: number;
  reviews: Review[];
}

