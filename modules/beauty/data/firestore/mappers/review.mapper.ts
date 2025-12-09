/**
 * Review Firestore mappers
 */

import { DocumentSnapshot, DocumentData } from '../firebase';
import { ShopReview, GoogleReview } from '../../types/review.types';

/**
 * Convert Firestore document to ShopReview
 */
export function fromFirestoreShopReview(doc: DocumentSnapshot): ShopReview | null {
  if (!doc.exists) return null;
  
  const data = doc.data();
  if (!data) return null;
  
  return {
    id: doc.id,
    clientId: data.clientId,
    ratingNote: data.ratingNote ?? 0,
    ratingCommentary: data.ratingCommentary,
    created_at: data.created_at,
  };
}

/**
 * Convert ShopReview to Firestore document data
 */
export function toFirestoreShopReview(review: Partial<ShopReview>): DocumentData {
  const data: DocumentData = {};
  
  if (review.clientId !== undefined) data.clientId = review.clientId;
  if (review.ratingNote !== undefined) data.ratingNote = review.ratingNote;
  if (review.ratingCommentary !== undefined) data.ratingCommentary = review.ratingCommentary;
  if (review.created_at !== undefined) data.created_at = review.created_at;
  
  return data;
}

/**
 * Convert Firestore document to GoogleReview
 */
export function fromFirestoreGoogleReview(doc: DocumentSnapshot): GoogleReview | null {
  if (!doc.exists) return null;
  
  const data = doc.data();
  if (!data) return null;
  
  return {
    id: doc.id,
    author_name: data.author_name,
    profile_photo_url: data.profile_photo_url,
    rating: data.rating ?? 0,
    text: data.text,
    relative_time_description: data.relative_time_description,
    time: data.time,
  };
}

/**
 * Convert GoogleReview to Firestore document data
 */
export function toFirestoreGoogleReview(review: Partial<GoogleReview>): DocumentData {
  const data: DocumentData = {};
  
  if (review.author_name !== undefined) data.author_name = review.author_name;
  if (review.profile_photo_url !== undefined) data.profile_photo_url = review.profile_photo_url;
  if (review.rating !== undefined) data.rating = review.rating;
  if (review.text !== undefined) data.text = review.text;
  if (review.relative_time_description !== undefined) data.relative_time_description = review.relative_time_description;
  if (review.time !== undefined) data.time = review.time;
  
  return data;
}

