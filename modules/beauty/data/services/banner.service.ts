/**
 * Banner Service - Data Access Layer
 * Based on DOCUMENTATION_FEATURE_BEAUTY.md section 2.14 - SearchBanners
 */

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  doc,
  increment,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import { firestore } from '../firestore/firebase';

export interface SearchBanner {
  id: string;
  category: string;
  isActive: boolean;
  priority: number;
  banner: {
    [lang: string]: {
      url: {
        desktop: string;
        mobile: string;
        redirect: string;
      };
    };
  };
  countClick: number;
  lastClick?: Date;
}

/**
 * Get active banners for beauty category
 * @param lang - User language (en, fr, th)
 */
export async function getBeautyBanners(lang: string = 'en'): Promise<SearchBanner[]> {
  const bannersRef = collection(firestore, 'SearchBanners');
  const q = query(
    bannersRef,
    where('category', '==', 'beauty'),
    where('isActive', '==', true),
    orderBy('priority', 'asc')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs
    .map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        category: data.category,
        isActive: data.isActive,
        priority: data.priority,
        banner: data.banner,
        countClick: data.countClick || 0,
        lastClick: data.lastClick?.toDate?.() || undefined,
      } as SearchBanner;
    })
    .filter(banner => {
      // Only return banners that have the requested language
      return banner.banner && banner.banner[lang];
    });
}

/**
 * Get mobile banner URL for a specific language
 */
export function getBannerMobileUrl(banner: SearchBanner, lang: string): string | null {
  return banner.banner?.[lang]?.url?.mobile || null;
}

/**
 * Get redirect URL for a banner
 */
export function getBannerRedirectUrl(banner: SearchBanner, lang: string): string | null {
  return banner.banner?.[lang]?.url?.redirect || null;
}

/**
 * Track banner click
 */
export async function trackBannerClick(bannerId: string): Promise<void> {
  const bannerRef = doc(firestore, 'SearchBanners', bannerId);
  await updateDoc(bannerRef, {
    countClick: increment(1),
    lastClick: serverTimestamp(),
  });
}
