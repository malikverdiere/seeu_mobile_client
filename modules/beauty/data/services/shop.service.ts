/**
 * Shop Service - Data Access Layer
 * Based on DOCUMENTATION_FEATURE_BEAUTY.md sections 3.1, 3.2, 3.3
 */

import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getDoc,
} from '@react-native-firebase/firestore';
import { firestore, COLLECTIONS, DocumentSnapshot, QuerySnapshot } from '../firestore/firebase';
import { fromFirestoreShop } from '../firestore/mappers/shop.mapper';
import { Shop, ShopWithDistance, ShopFilters } from '../types/shop.types';
import { DayName, DAY_NAMES } from '../types/common.types';

/**
 * Get shop by booking_id (URL slug)
 * Used when navigating to a specific shop page
 */
export async function getShopByBookingId(booking_id: string): Promise<Shop | null> {
  const shopsRef = collection(firestore, COLLECTIONS.SHOPS);
  const q = query(
    shopsRef,
    where('booking_id', '==', booking_id),
    where('shopValid', '==', true),
    limit(1)
  );
  
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  return fromFirestoreShop(snapshot.docs[0]);
}

/**
 * Get shop by document ID
 */
export async function getShopById(shopId: string): Promise<Shop | null> {
  const shopRef = doc(firestore, COLLECTIONS.SHOPS, shopId);
  const snapshot = await getDoc(shopRef);
  
  return fromFirestoreShop(snapshot);
}

/**
 * Get highlighted shops for beauty category
 * Based on documentation section 3.1 - HomePage queries
 */
export async function getHighlightedShopsForBeauty(): Promise<Shop[]> {
  const shopsRef = collection(firestore, COLLECTIONS.SHOPS);
  
  // Query 1: Highlighted shops
  const q1 = query(
    shopsRef,
    where('highlight.isActive', '==', true),
    where('shopValid', '==', true),
    where('shopType.type', '==', 1) // 1 = beauty
  );
  
  // Query 2: Double day promos
  const q2 = query(
    shopsRef,
    where('promotion.doubleDay', '==', true),
    where('shopValid', '==', true),
    where('shopType.type', '==', 1)
  );
  
  // Execute both queries in parallel
  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  
  // Merge results without duplicates using Map
  const shopsMap = new Map<string, Shop>();
  
  snap1.docs.forEach(doc => {
    const shop = fromFirestoreShop(doc);
    if (shop) shopsMap.set(shop.id, shop);
  });
  
  snap2.docs.forEach(doc => {
    const shop = fromFirestoreShop(doc);
    if (shop && !shopsMap.has(shop.id)) {
      shopsMap.set(shop.id, shop);
    }
  });
  
  return Array.from(shopsMap.values());
}

/**
 * Get shops by highlight type
 * Types: "Trending", "Nail studio", "Massage salon", "Hair salon"
 */
export async function getShopsByHighlightType(highlightType: string): Promise<Shop[]> {
  const shopsRef = collection(firestore, COLLECTIONS.SHOPS);
  const q = query(
    shopsRef,
    where('highlight.isActive', '==', true),
    where('highlight.type', '==', highlightType),
    where('shopValid', '==', true),
    where('shopType.type', '==', 1)
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs
    .map(doc => fromFirestoreShop(doc))
    .filter((shop): shop is Shop => shop !== null);
}

/**
 * Search shops for beauty with filters
 * Based on documentation section 3.2 - SearchPage queries
 */
export async function searchShopsForBeauty(
  filters: ShopFilters,
  lastDoc?: DocumentSnapshot,
  limitCount: number = 20
): Promise<{ shops: Shop[]; lastDoc: DocumentSnapshot | null }> {
  const shopsRef = collection(firestore, COLLECTIONS.SHOPS);
  
  // Base constraints
  const constraints: any[] = [
    where('shopValid', '==', true),
    where('shopType.type', '==', filters.categoryType ?? 1), // Default to beauty
  ];
  
  // Filter by sub-category (array-contains)
  if (filters.category) {
    constraints.push(where('shop_type', 'array-contains', filters.category));
  }
  
  // Filter by day (shop open on this day)
  if (filters.date) {
    const dayIndex = filters.date.getDay();
    const dayName = DAY_NAMES[dayIndex];
    // Shop is open if the day array is not empty
    constraints.push(where(dayName, '>', []));
  }
  
  // Filter by promo code availability
  if (filters.promoCode) {
    constraints.push(where('promotion.code', '==', true));
  }
  
  // Filter by double day promo
  if (filters.doubleDay) {
    constraints.push(where('promotion.doubleDay', '==', true));
  }
  
  // Filter by new client promo
  if (filters.newClient) {
    constraints.push(where('promotion.newClient', '==', true));
  }
  
  // Order by adPosition then by rating
  constraints.push(orderBy('adPosition', 'asc'));
  constraints.push(orderBy('google_infos.user_ratings_total', 'desc'));
  
  // Pagination
  constraints.push(limit(limitCount));
  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }
  
  const q = query(shopsRef, ...constraints);
  const snapshot = await getDocs(q);
  
  const shops = snapshot.docs
    .map(doc => fromFirestoreShop(doc))
    .filter((shop): shop is Shop => shop !== null);
  
  const newLastDoc = snapshot.docs.length > 0 
    ? snapshot.docs[snapshot.docs.length - 1] 
    : null;
  
  return { shops, lastDoc: newLastDoc };
}

/**
 * Search shops with geolocation (GEO mode)
 * Uses geohash bounds for efficient geo queries
 * 
 * Note: This requires geofire-common for geohash bounds calculation
 * TODO: Install geofire-common and implement proper geohash query bounds
 */
export async function searchShopsWithGeo(
  lat: number,
  lng: number,
  radiusKm: number = 20,
  filters: Omit<ShopFilters, 'lat' | 'lng' | 'radius'> = {}
): Promise<ShopWithDistance[]> {
  // TODO: Implement geohash-based search using geofire-common
  // For now, fetch all and filter client-side (not optimal for production)
  
  const { shops } = await searchShopsForBeauty({ ...filters, categoryType: 1 }, undefined, 100);
  
  // Calculate distance and filter
  const shopsWithDistance: ShopWithDistance[] = shops
    .map(shop => ({
      ...shop,
      distance: calculateHaversineDistance(
        lat, lng,
        shop.coordinate.latitude,
        shop.coordinate.longitude
      ),
    }))
    .filter(shop => shop.distance !== undefined && shop.distance <= radiusKm)
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  
  return shopsWithDistance;
}

/**
 * Get nearby shops for a given shop (for "shops nearby" section)
 */
export async function getNearbyShops(
  shop: Shop,
  limitCount: number = 5
): Promise<ShopWithDistance[]> {
  const { latitude, longitude } = shop.coordinate;
  
  const shopsWithDistance = await searchShopsWithGeo(latitude, longitude, 10);
  
  // Exclude the current shop and limit results
  return shopsWithDistance
    .filter(s => s.id !== shop.id)
    .slice(0, limitCount);
}

/**
 * Calculate Haversine distance between two coordinates
 * Returns distance in kilometers
 */
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Get shop schedule for a specific day
 */
export function getShopScheduleForDay(shop: Shop, date: Date): string[] {
  const dayIndex = date.getDay();
  const dayName = DAY_NAMES[dayIndex];
  
  return shop[dayName] ?? [];
}

/**
 * Check if shop is open on a specific day
 */
export function isShopOpenOnDay(shop: Shop, date: Date): boolean {
  const schedule = getShopScheduleForDay(shop, date);
  return schedule.length > 0;
}

