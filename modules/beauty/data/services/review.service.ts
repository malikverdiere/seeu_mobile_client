/**
 * Review Service - Data Access Layer
 */

import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from '@react-native-firebase/firestore';
import { firestore, COLLECTIONS } from '../firestore/firebase';
import { 
  fromFirestoreShopReview, 
  fromFirestoreGoogleReview 
} from '../firestore/mappers/review.mapper';
import { 
  ShopReview, 
  GoogleReview, 
  ReviewsSummary,
  ReviewSource,
} from '../types/review.types';

/**
 * Get SeeU reviews for a shop
 */
export async function getShopReviews(
  shopId: string,
  limitCount: number = 50
): Promise<ShopReview[]> {
  const reviewsRef = collection(
    firestore,
    COLLECTIONS.SHOPS,
    shopId,
    COLLECTIONS.SHOP_REVIEWS
  );
  
  const q = query(
    reviewsRef,
    orderBy('created_at', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs
    .map(doc => fromFirestoreShopReview(doc))
    .filter((review): review is ShopReview => review !== null);
}

/**
 * Get Google reviews for a shop
 */
export async function getGoogleReviews(
  shopId: string,
  limitCount: number = 50
): Promise<GoogleReview[]> {
  const reviewsRef = collection(
    firestore,
    COLLECTIONS.SHOPS,
    shopId,
    COLLECTIONS.GOOGLE_REVIEWS
  );
  
  const q = query(
    reviewsRef,
    orderBy('time', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs
    .map(doc => fromFirestoreGoogleReview(doc))
    .filter((review): review is GoogleReview => review !== null);
}

/**
 * Get reviews summary
 * Based on documentation section 4.4 - Default to SeeU if available, else Google
 */
export async function getReviewsSummary(shopId: string): Promise<ReviewsSummary> {
  // Fetch both in parallel
  const [shopReviews, googleReviews] = await Promise.all([
    getShopReviews(shopId),
    getGoogleReviews(shopId),
  ]);
  
  // Prefer SeeU reviews if available
  if (shopReviews.length > 0) {
    const totalRating = shopReviews.reduce((sum, r) => sum + r.ratingNote, 0);
    const averageRating = totalRating / shopReviews.length;
    
    return {
      source: 'seeu',
      averageRating: Math.round(averageRating * 10) / 10,
      totalCount: shopReviews.length,
      reviews: shopReviews,
    };
  }
  
  // Fall back to Google reviews
  if (googleReviews.length > 0) {
    const totalRating = googleReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / googleReviews.length;
    
    return {
      source: 'google',
      averageRating: Math.round(averageRating * 10) / 10,
      totalCount: googleReviews.length,
      reviews: googleReviews,
    };
  }
  
  // No reviews
  return {
    source: 'seeu',
    averageRating: 0,
    totalCount: 0,
    reviews: [],
  };
}

/**
 * Get all reviews from both sources
 */
export async function getAllReviews(shopId: string): Promise<{
  shopReviews: ShopReview[];
  googleReviews: GoogleReview[];
}> {
  const [shopReviews, googleReviews] = await Promise.all([
    getShopReviews(shopId),
    getGoogleReviews(shopId),
  ]);
  
  return { shopReviews, googleReviews };
}

