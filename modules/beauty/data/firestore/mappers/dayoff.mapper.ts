/**
 * DayOff Firestore mappers
 */

import { DocumentSnapshot, DocumentData, timestampToDate, dateToTimestamp } from '../firebase';
import { DayOff } from '../../types/dayoff.types';

/**
 * Convert Firestore document to DayOff
 */
export function fromFirestoreDayOff(doc: DocumentSnapshot): DayOff | null {
  if (!doc.exists) return null;
  
  const data = doc.data();
  if (!data) return null;
  
  return {
    id: doc.id,
    memberId: data.memberId ?? '',
    dateStart: data.dateStart,
    dateEnd: data.dateEnd,
    dateStartText: data.dateStartText,
    dateEndText: data.dateEndText,
    startHour: data.startHour,
    endHour: data.endHour,
    type: data.type,
    description: data.description,
    createdAt: data.createdAt,
  };
}

/**
 * Convert DayOff to Firestore document data
 */
export function toFirestoreDayOff(dayOff: Partial<DayOff>): DocumentData {
  const data: DocumentData = {};
  
  if (dayOff.memberId !== undefined) data.memberId = dayOff.memberId;
  if (dayOff.dateStart !== undefined) data.dateStart = dayOff.dateStart;
  if (dayOff.dateEnd !== undefined) data.dateEnd = dayOff.dateEnd;
  if (dayOff.dateStartText !== undefined) data.dateStartText = dayOff.dateStartText;
  if (dayOff.dateEndText !== undefined) data.dateEndText = dayOff.dateEndText;
  if (dayOff.startHour !== undefined) data.startHour = dayOff.startHour;
  if (dayOff.endHour !== undefined) data.endHour = dayOff.endHour;
  if (dayOff.type !== undefined) data.type = dayOff.type;
  if (dayOff.description !== undefined) data.description = dayOff.description;
  if (dayOff.createdAt !== undefined) data.createdAt = dayOff.createdAt;
  
  return data;
}

