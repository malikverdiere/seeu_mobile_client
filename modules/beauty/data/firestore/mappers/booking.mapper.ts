/**
 * Booking Firestore mappers
 */

import { DocumentSnapshot, DocumentData, timestampToDate, dateToTimestamp } from '../firebase';
import {
  Booking,
  BookingService,
  BookingTeamMember,
  BookingStatus,
  PaymentMethod,
  CreateBookingInput,
  RebookingInput,
} from '../../types/booking.types';
import { ServiceAddOn } from '../../types/service.types';
import { TranslatedText, SessionData } from '../../types/common.types';

/**
 * Convert Firestore document to Booking
 */
export function fromFirestoreBooking(doc: DocumentSnapshot): Booking | null {
  if (!doc.exists) return null;
  
  const data = doc.data();
  if (!data) return null;
  
  return {
    id: doc.id,
    clientId: data.clientId ?? '',
    clientEmail: data.clientEmail ?? '',
    clientPhone: data.clientPhone,
    clientPhoneCountry: data.clientPhoneCountry,
    firstName: data.firstName ?? '',
    lastName: data.lastName ?? '',
    createdAt: data.createdAt,
    date: data.date,
    dateBooking: data.dateBooking ?? '',
    timeStart: data.timeStart ?? '',
    timeEnd: data.timeEnd ?? '',
    duration: data.duration ?? 0,
    statut: data.statut ?? BookingStatus.PENDING,
    services: fromFirestoreBookingServices(data.services),
    teamMemberId: fromFirestoreTeamMembers(data.teamMemberId),
    booking_id: data.booking_id ?? '',
    booking_number: data.booking_number ?? 0,
    booking_category: data.booking_category,
    booking_url: data.booking_url,
    paymentMethods: data.paymentMethods ?? 'Pay at venue',
    subTotalPrice: data.subTotalPrice ?? 0,
    subTotalPromo: data.subTotalPromo,
    totalPrice: data.totalPrice ?? 0,
    discountCode: data.discountCode,
    promoAmount: data.promoAmount,
    promoCodeId: data.promoCodeId,
    promoCode: data.promoCode,
    promoDiscountType: data.promoDiscountType,
    promoDiscountValue: data.promoDiscountValue,
    specificServices: data.specificServices,
    excludeDiscountedServices: data.excludeDiscountedServices,
    bookingNotes: data.bookingNotes,
    from: data.from ?? 'seeuapp.io',
    depositAmount: data.depositAmount,
    depositDiscountAmount: data.depositDiscountAmount,
    paymentIntent: data.paymentIntent,
    paymentIntentStatus: data.paymentIntentStatus,
    isRebooked: data.isRebooked,
    rebookedFrom: data.rebookedFrom,
    rebookingDate: data.rebookingDate,
    originalBookingNumber: data.originalBookingNumber,
    originalPaymentMethods: data.originalPaymentMethods,
    cancelledAt: data.cancelledAt,
    cancelledBy: data.cancelledBy,
    packageId: data.packageId,
    packageName: data.packageName as TranslatedText,
    packageServices: data.packageServices,
    session: data.session as SessionData,
  };
}

/**
 * Convert Booking to Firestore document data
 */
export function toFirestoreBooking(booking: Partial<Booking>): DocumentData {
  const data: DocumentData = {};
  
  if (booking.clientId !== undefined) data.clientId = booking.clientId;
  if (booking.clientEmail !== undefined) data.clientEmail = booking.clientEmail;
  if (booking.clientPhone !== undefined) data.clientPhone = booking.clientPhone;
  if (booking.clientPhoneCountry !== undefined) data.clientPhoneCountry = booking.clientPhoneCountry;
  if (booking.firstName !== undefined) data.firstName = booking.firstName;
  if (booking.lastName !== undefined) data.lastName = booking.lastName;
  if (booking.createdAt !== undefined) data.createdAt = booking.createdAt;
  if (booking.date !== undefined) data.date = booking.date;
  if (booking.dateBooking !== undefined) data.dateBooking = booking.dateBooking;
  if (booking.timeStart !== undefined) data.timeStart = booking.timeStart;
  if (booking.timeEnd !== undefined) data.timeEnd = booking.timeEnd;
  if (booking.duration !== undefined) data.duration = booking.duration;
  if (booking.statut !== undefined) data.statut = booking.statut;
  if (booking.services !== undefined) data.services = toFirestoreBookingServices(booking.services);
  if (booking.teamMemberId !== undefined) data.teamMemberId = booking.teamMemberId;
  if (booking.booking_id !== undefined) data.booking_id = booking.booking_id;
  if (booking.booking_number !== undefined) data.booking_number = booking.booking_number;
  if (booking.booking_category !== undefined) data.booking_category = booking.booking_category;
  if (booking.booking_url !== undefined) data.booking_url = booking.booking_url;
  if (booking.paymentMethods !== undefined) data.paymentMethods = booking.paymentMethods;
  if (booking.subTotalPrice !== undefined) data.subTotalPrice = booking.subTotalPrice;
  if (booking.subTotalPromo !== undefined) data.subTotalPromo = booking.subTotalPromo;
  if (booking.totalPrice !== undefined) data.totalPrice = booking.totalPrice;
  if (booking.discountCode !== undefined) data.discountCode = booking.discountCode;
  if (booking.promoAmount !== undefined) data.promoAmount = booking.promoAmount;
  if (booking.promoCodeId !== undefined) data.promoCodeId = booking.promoCodeId;
  if (booking.promoCode !== undefined) data.promoCode = booking.promoCode;
  if (booking.promoDiscountType !== undefined) data.promoDiscountType = booking.promoDiscountType;
  if (booking.promoDiscountValue !== undefined) data.promoDiscountValue = booking.promoDiscountValue;
  if (booking.specificServices !== undefined) data.specificServices = booking.specificServices;
  if (booking.excludeDiscountedServices !== undefined) data.excludeDiscountedServices = booking.excludeDiscountedServices;
  if (booking.bookingNotes !== undefined) data.bookingNotes = booking.bookingNotes;
  if (booking.from !== undefined) data.from = booking.from;
  if (booking.depositAmount !== undefined) data.depositAmount = booking.depositAmount;
  if (booking.depositDiscountAmount !== undefined) data.depositDiscountAmount = booking.depositDiscountAmount;
  if (booking.paymentIntent !== undefined) data.paymentIntent = booking.paymentIntent;
  if (booking.paymentIntentStatus !== undefined) data.paymentIntentStatus = booking.paymentIntentStatus;
  if (booking.isRebooked !== undefined) data.isRebooked = booking.isRebooked;
  if (booking.rebookedFrom !== undefined) data.rebookedFrom = booking.rebookedFrom;
  if (booking.rebookingDate !== undefined) data.rebookingDate = booking.rebookingDate;
  if (booking.originalBookingNumber !== undefined) data.originalBookingNumber = booking.originalBookingNumber;
  if (booking.originalPaymentMethods !== undefined) data.originalPaymentMethods = booking.originalPaymentMethods;
  if (booking.cancelledAt !== undefined) data.cancelledAt = booking.cancelledAt;
  if (booking.cancelledBy !== undefined) data.cancelledBy = booking.cancelledBy;
  if (booking.packageId !== undefined) data.packageId = booking.packageId;
  if (booking.packageName !== undefined) data.packageName = booking.packageName;
  if (booking.packageServices !== undefined) data.packageServices = booking.packageServices;
  if (booking.session !== undefined) data.session = booking.session;
  
  return data;
}

/**
 * Convert CreateBookingInput to Firestore data (for new booking)
 */
export function toFirestoreCreateBooking(input: CreateBookingInput, autoConfirmed: boolean): DocumentData {
  return {
    id: '',
    clientId: input.clientId,
    clientEmail: input.clientEmail,
    clientPhone: input.clientPhone,
    clientPhoneCountry: input.clientPhoneCountry,
    firstName: input.firstName,
    lastName: input.lastName,
    createdAt: new Date(),
    date: input.date,
    dateBooking: input.dateBooking,
    timeStart: input.timeStart,
    timeEnd: input.timeEnd,
    duration: input.duration,
    statut: autoConfirmed ? BookingStatus.CONFIRMED : BookingStatus.PENDING,
    services: toFirestoreBookingServices(input.services),
    teamMemberId: input.teamMemberId,
    booking_id: input.booking_id,
    paymentMethods: input.paymentMethods,
    subTotalPrice: input.subTotalPrice,
    subTotalPromo: input.subTotalPromo,
    totalPrice: input.totalPrice,
    discountCode: input.discountCode,
    promoAmount: input.promoAmount,
    promoCodeId: input.promoCodeId,
    promoCode: input.promoCode,
    promoDiscountType: input.promoDiscountType,
    promoDiscountValue: input.promoDiscountValue,
    specificServices: input.specificServices,
    excludeDiscountedServices: input.excludeDiscountedServices,
    bookingNotes: input.bookingNotes,
    from: 'seeuapp.io',
    depositAmount: input.depositAmount,
    depositDiscountAmount: input.depositDiscountAmount,
    packageId: input.packageId,
    packageName: input.packageName,
    packageServices: input.packageServices,
    session: input.session,
    booking_category: 'beauty',
  };
}

/**
 * Convert RebookingInput to Firestore data (for rebooking)
 */
export function toFirestoreRebooking(input: RebookingInput, autoConfirmed: boolean): DocumentData {
  const baseData = toFirestoreCreateBooking(input, autoConfirmed);
  
  return {
    ...baseData,
    isRebooked: true,
    rebookedFrom: String(input.originalBookingNumber),
    originalBookingNumber: input.originalBookingNumber,
    originalPaymentMethods: input.originalPaymentMethods,
  };
}

// Helper functions

function fromFirestoreBookingServices(data: any[]): BookingService[] {
  if (!data || !Array.isArray(data)) return [];
  
  return data.map(svc => ({
    id: svc.id ?? '',
    guestId: svc.guestId ?? '',
    guestName: svc.guestName ?? '',
    name: svc.name ?? '',
    optionId: svc.optionId,
    optionName: svc.optionName,
    duration: svc.duration ?? 0,
    durationFormatted: svc.durationFormatted ?? '',
    price: svc.price ?? 0,
    promotionPrice: svc.promotionPrice,
    priceUsed: svc.priceUsed ?? svc.price ?? 0,
    memberId: svc.memberId ?? '',
    memberName: svc.memberName ?? '',
    serviceAddons: svc.serviceAddons as ServiceAddOn[],
    dateBooking: svc.dateBooking ?? '',
    timeStart: svc.timeStart ?? '',
    timeEnd: svc.timeEnd ?? '',
    serviceColor: svc.serviceColor,
    people: svc.people,
    loyaltyPoint: svc.loyaltyPoint,
  }));
}

function toFirestoreBookingServices(services: BookingService[]): any[] {
  if (!services || !Array.isArray(services)) return [];
  
  return services.map(svc => ({
    id: svc.id,
    guestId: svc.guestId,
    guestName: svc.guestName,
    name: svc.name,
    optionId: svc.optionId,
    optionName: svc.optionName,
    duration: svc.duration,
    durationFormatted: svc.durationFormatted,
    price: svc.price,
    promotionPrice: svc.promotionPrice,
    priceUsed: svc.priceUsed,
    memberId: svc.memberId,
    memberName: svc.memberName,
    serviceAddons: svc.serviceAddons,
    dateBooking: svc.dateBooking,
    timeStart: svc.timeStart,
    timeEnd: svc.timeEnd,
    serviceColor: svc.serviceColor,
    people: svc.people,
    loyaltyPoint: svc.loyaltyPoint,
  }));
}

function fromFirestoreTeamMembers(data: any[]): BookingTeamMember[] {
  if (!data || !Array.isArray(data)) return [];
  
  return data.map(tm => ({
    id: tm.id ?? '',
    name: tm.name ?? '',
  }));
}

