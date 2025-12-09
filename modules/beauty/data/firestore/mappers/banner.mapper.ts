/**
 * SearchBanner Firestore mappers
 */

import { DocumentSnapshot, DocumentData } from '../firebase';
import { SearchBanner, BannerByLanguage } from '../../types/banner.types';

/**
 * Convert Firestore document to SearchBanner
 */
export function fromFirestoreSearchBanner(doc: DocumentSnapshot): SearchBanner | null {
  if (!doc.exists) return null;
  
  const data = doc.data();
  if (!data) return null;
  
  return {
    id: doc.id,
    category: data.category ?? '',
    isActive: data.isActive ?? false,
    priority: data.priority ?? 0,
    banner: data.banner as BannerByLanguage ?? {},
    countClick: data.countClick,
    lastClick: data.lastClick,
  };
}

/**
 * Convert SearchBanner to Firestore document data
 */
export function toFirestoreSearchBanner(banner: Partial<SearchBanner>): DocumentData {
  const data: DocumentData = {};
  
  if (banner.category !== undefined) data.category = banner.category;
  if (banner.isActive !== undefined) data.isActive = banner.isActive;
  if (banner.priority !== undefined) data.priority = banner.priority;
  if (banner.banner !== undefined) data.banner = banner.banner;
  if (banner.countClick !== undefined) data.countClick = banner.countClick;
  if (banner.lastClick !== undefined) data.lastClick = banner.lastClick;
  
  return data;
}

