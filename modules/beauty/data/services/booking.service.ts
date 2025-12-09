/**
 * Booking Service - Data Access Layer
 * Based on DOCUMENTATION_FEATURE_BEAUTY.md section 7
 */

import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
} from '@react-native-firebase/firestore';
import { firestore, COLLECTIONS } from '../firestore/firebase';
import { 
  fromFirestoreBooking,
  toFirestoreBooking,
  toFirestoreCreateBooking,
  toFirestoreRebooking,
} from '../firestore/mappers/booking.mapper';
import {
  Booking,
  BookingStatus,
  BookingFilters,
  CreateBookingInput,
  RebookingInput,
} from '../types/booking.types';

/**
 * Get all bookings for a shop
 */
export async function getBookingsForShop(
  shopId: string,
  filters?: BookingFilters
): Promise<Booking[]> {
  const bookingsRef = collection(
    firestore,
    COLLECTIONS.SHOPS,
    shopId,
    COLLECTIONS.BOOKING
  );
  
  const constraints: any[] = [];
  
  // Filter by client ID
  if (filters?.clientId) {
    constraints.push(where('clientId', '==', filters.clientId));
  }
  
  // Filter by status
  if (filters?.statut !== undefined) {
    if (Array.isArray(filters.statut)) {
      constraints.push(where('statut', 'in', filters.statut));
    } else {
      constraints.push(where('statut', '==', filters.statut));
    }
  }
  
  // Filter by booking number
  if (filters?.booking_number !== undefined) {
    constraints.push(where('booking_number', '==', filters.booking_number));
  }
  
  // Order by booking number (most recent first)
  constraints.push(orderBy('booking_number', 'desc'));
  
  const q = query(bookingsRef, ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs
    .map(doc => fromFirestoreBooking(doc))
    .filter((booking): booking is Booking => booking !== null);
}

/**
 * Get a specific booking by ID
 */
export async function getBookingById(
  shopId: string,
  bookingId: string
): Promise<Booking | null> {
  const bookingRef = doc(
    firestore,
    COLLECTIONS.SHOPS,
    shopId,
    COLLECTIONS.BOOKING,
    bookingId
  );
  
  const snapshot = await getDoc(bookingRef);
  return fromFirestoreBooking(snapshot);
}

/**
 * Get booking by booking number
 */
export async function getBookingByNumber(
  shopId: string,
  bookingNumber: number,
  clientId?: string
): Promise<Booking | null> {
  const bookingsRef = collection(
    firestore,
    COLLECTIONS.SHOPS,
    shopId,
    COLLECTIONS.BOOKING
  );
  
  const constraints: any[] = [
    where('booking_number', '==', bookingNumber),
  ];
  
  if (clientId) {
    constraints.push(where('clientId', '==', clientId));
  }
  
  constraints.push(limit(1));
  
  const q = query(bookingsRef, ...constraints);
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  return fromFirestoreBooking(snapshot.docs[0]);
}

/**
 * Get last booking number for a shop (to generate next one)
 */
export async function getLastBookingNumber(shopId: string): Promise<number> {
  const bookingsRef = collection(
    firestore,
    COLLECTIONS.SHOPS,
    shopId,
    COLLECTIONS.BOOKING
  );
  
  const q = query(
    bookingsRef,
    orderBy('booking_number', 'desc'),
    limit(1)
  );
  
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return 0;
  
  const booking = fromFirestoreBooking(snapshot.docs[0]);
  return booking?.booking_number ?? 0;
}

/**
 * Get active bookings (pending or confirmed) for slot validation
 * Statuses 1 (pending) and 2 (confirmed) block time slots
 */
export async function getActiveBookingsForShop(shopId: string): Promise<Booking[]> {
  return getBookingsForShop(shopId, {
    statut: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
  });
}

/**
 * Get bookings for a specific date (for availability checking)
 */
export async function getBookingsForDate(
  shopId: string,
  date: Date
): Promise<Booking[]> {
  // Format date as DD/MM/YYYY to match dateBooking field
  const dateBooking = formatDateBooking(date);
  
  const bookingsRef = collection(
    firestore,
    COLLECTIONS.SHOPS,
    shopId,
    COLLECTIONS.BOOKING
  );
  
  const q = query(
    bookingsRef,
    where('dateBooking', '==', dateBooking),
    where('statut', 'in', [BookingStatus.PENDING, BookingStatus.CONFIRMED])
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs
    .map(doc => fromFirestoreBooking(doc))
    .filter((booking): booking is Booking => booking !== null);
}

/**
 * Create a new booking
 * Based on documentation section 7.2
 */
export async function createBooking(
  shopId: string,
  bookingData: CreateBookingInput,
  autoConfirmed: boolean = false
): Promise<{ status: string; docId: string; bookingNumber: number }> {
  const bookingsRef = collection(
    firestore,
    COLLECTIONS.SHOPS,
    shopId,
    COLLECTIONS.BOOKING
  );
  
  // Get next booking number
  const lastNumber = await getLastBookingNumber(shopId);
  const bookingNumber = lastNumber + 1;
  
  // Prepare booking data
  const firestoreData = toFirestoreCreateBooking(bookingData, autoConfirmed);
  firestoreData.booking_number = bookingNumber;
  
  // Create the document
  const docRef = await addDoc(bookingsRef, firestoreData);
  
  // Update with document ID
  await updateDoc(docRef, { id: docRef.id });
  
  return {
    status: 'Success',
    docId: docRef.id,
    bookingNumber,
  };
}

/**
 * Create a rebooking (reschedule)
 * Based on documentation section 7.6
 */
export async function createRebooking(
  shopId: string,
  originalBookingNumber: number,
  clientId: string,
  rebookingData: RebookingInput,
  autoConfirmed: boolean = false
): Promise<{ status: string; docId: string; bookingNumber: number }> {
  const bookingsRef = collection(
    firestore,
    COLLECTIONS.SHOPS,
    shopId,
    COLLECTIONS.BOOKING
  );
  
  // Update original booking status to REBOOKED (7)
  const originalBooking = await getBookingByNumber(shopId, originalBookingNumber, clientId);
  
  if (originalBooking) {
    const originalRef = doc(bookingsRef, originalBooking.id);
    await updateDoc(originalRef, {
      statut: BookingStatus.REBOOKED,
      rebookingDate: new Date(),
    });
  }
  
  // Get next booking number
  const lastNumber = await getLastBookingNumber(shopId);
  const bookingNumber = lastNumber + 1;
  
  // Prepare rebooking data
  const firestoreData = toFirestoreRebooking(rebookingData, autoConfirmed);
  firestoreData.booking_number = bookingNumber;
  
  // Create the new booking
  const docRef = await addDoc(bookingsRef, firestoreData);
  
  // Update with document ID
  await updateDoc(docRef, { id: docRef.id });
  
  return {
    status: 'Success',
    docId: docRef.id,
    bookingNumber,
  };
}

/**
 * Update booking status
 */
export async function updateBookingStatus(
  shopId: string,
  bookingId: string,
  statut: BookingStatus | number,
  extraFields?: Partial<Booking>
): Promise<void> {
  const bookingRef = doc(
    firestore,
    COLLECTIONS.SHOPS,
    shopId,
    COLLECTIONS.BOOKING,
    bookingId
  );
  
  const updateData: any = { statut };
  
  if (extraFields) {
    Object.assign(updateData, toFirestoreBooking(extraFields));
  }
  
  await updateDoc(bookingRef, updateData);
}

/**
 * Cancel a booking
 * Based on documentation section 7.5
 */
export async function cancelBooking(
  shopId: string,
  bookingId: string,
  cancelledBy: 'client' | 'shop',
  withRefund: boolean = false
): Promise<void> {
  const statut = withRefund 
    ? BookingStatus.CANCELLED_WITH_REFUND 
    : BookingStatus.CANCELLED_BY_CLIENT;
  
  await updateBookingStatus(shopId, bookingId, statut, {
    cancelledAt: new Date() as any,
    cancelledBy,
  });
}

/**
 * Update booking with payment info
 */
export async function updateBookingPayment(
  shopId: string,
  bookingId: string,
  paymentIntent: string,
  paymentIntentStatus: string,
  depositAmount: number
): Promise<void> {
  const bookingRef = doc(
    firestore,
    COLLECTIONS.SHOPS,
    shopId,
    COLLECTIONS.BOOKING,
    bookingId
  );
  
  await updateDoc(bookingRef, {
    paymentIntent,
    paymentIntentStatus,
    depositAmount,
  });
}

/**
 * Get client's bookings for a shop
 */
export async function getClientBookingsForShop(
  shopId: string,
  clientId: string
): Promise<Booking[]> {
  return getBookingsForShop(shopId, { clientId });
}

// Helper function
function formatDateBooking(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

