/**
 * DayOff Service - Data Access Layer
 */

import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
} from '@react-native-firebase/firestore';
import { firestore, COLLECTIONS, timestampToDate } from '../firestore/firebase';
import { fromFirestoreDayOff } from '../firestore/mappers/dayoff.mapper';
import { DayOff, DayOffFilters } from '../types/dayoff.types';

/**
 * Get all day offs for a shop
 */
export async function getDayOffsForShop(
  shopId: string,
  filters?: DayOffFilters
): Promise<DayOff[]> {
  const dayOffsRef = collection(
    firestore,
    COLLECTIONS.SHOPS,
    shopId,
    COLLECTIONS.DAY_OFF
  );
  
  const constraints: any[] = [];
  
  // Filter by member ID
  if (filters?.memberId) {
    constraints.push(where('memberId', '==', filters.memberId));
  }
  
  const q = constraints.length > 0 
    ? query(dayOffsRef, ...constraints) 
    : query(dayOffsRef);
  
  const snapshot = await getDocs(q);
  
  let dayOffs = snapshot.docs
    .map(doc => fromFirestoreDayOff(doc))
    .filter((dayOff): dayOff is DayOff => dayOff !== null);
  
  // Filter by date range client-side (Firestore doesn't support range queries on different fields)
  if (filters?.dateFrom || filters?.dateTo) {
    dayOffs = dayOffs.filter(dayOff => {
      const startDate = timestampToDate(dayOff.dateStart as any);
      const endDate = timestampToDate(dayOff.dateEnd as any);
      
      if (!startDate || !endDate) return false;
      
      if (filters.dateFrom && endDate < filters.dateFrom) return false;
      if (filters.dateTo && startDate > filters.dateTo) return false;
      
      return true;
    });
  }
  
  return dayOffs;
}

/**
 * Get day offs for a specific member
 */
export async function getDayOffsForMember(
  shopId: string,
  memberId: string,
  dateRange?: { from: Date; to: Date }
): Promise<DayOff[]> {
  return getDayOffsForShop(shopId, {
    memberId,
    dateFrom: dateRange?.from,
    dateTo: dateRange?.to,
  });
}

/**
 * Get a specific day off by ID
 */
export async function getDayOffById(
  shopId: string,
  dayOffId: string
): Promise<DayOff | null> {
  const dayOffRef = doc(
    firestore,
    COLLECTIONS.SHOPS,
    shopId,
    COLLECTIONS.DAY_OFF,
    dayOffId
  );
  
  const snapshot = await getDoc(dayOffRef);
  return fromFirestoreDayOff(snapshot);
}

/**
 * Check if a member is on day off for a specific date
 */
export function isMemberOnDayOff(
  dayOffs: DayOff[],
  memberId: string,
  date: Date,
  time?: string
): boolean {
  const memberDayOffs = dayOffs.filter(d => d.memberId === memberId);
  
  for (const dayOff of memberDayOffs) {
    const startDate = timestampToDate(dayOff.dateStart as any);
    const endDate = timestampToDate(dayOff.dateEnd as any);
    
    if (!startDate || !endDate) continue;
    
    // Check if date falls within day off period
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const startOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    if (dateOnly < startOnly || dateOnly > endOnly) continue;
    
    // If partial day off (with hours), check time
    if (dayOff.startHour && dayOff.endHour && time) {
      const [dayOffStartH, dayOffStartM] = dayOff.startHour.split(':').map(Number);
      const [dayOffEndH, dayOffEndM] = dayOff.endHour.split(':').map(Number);
      const [timeH, timeM] = time.split(':').map(Number);
      
      const dayOffStartMinutes = dayOffStartH * 60 + dayOffStartM;
      const dayOffEndMinutes = dayOffEndH * 60 + dayOffEndM;
      const timeMinutes = timeH * 60 + timeM;
      
      if (timeMinutes >= dayOffStartMinutes && timeMinutes < dayOffEndMinutes) {
        return true;
      }
    } else {
      // Full day off
      return true;
    }
  }
  
  return false;
}

/**
 * Get all members on day off for a specific date
 */
export function getMembersOnDayOff(
  dayOffs: DayOff[],
  date: Date,
  memberIds: string[]
): string[] {
  return memberIds.filter(memberId => 
    isMemberOnDayOff(dayOffs, memberId, date)
  );
}

