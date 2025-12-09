/**
 * Booking payload builder
 * Based on DOCUMENTATION_FEATURE_BEAUTY.md section 7.1 and 7.2
 * 
 * Builds booking payloads for creation and rebooking
 */

import {
  Booking,
  BookingService,
  BookingTeamMember,
  BookingStatus,
  PaymentMethod,
  CreateBookingInput,
  RebookingInput,
} from '../../data/types/booking.types';
import { Shop } from '../../data/types/shop.types';
import { Client } from '../../data/types/client.types';
import { Guest, GuestService, ServiceAddOn } from '../../data/types/service.types';
import { TeamMember } from '../../data/types/team.types';
import { PromoCode, PromoDiscountType } from '../../data/types/promo.types';
import { SessionData } from '../../data/types/common.types';
import {
  formatDateBooking,
  createBookingDateUTC,
  addMinutesToTime,
  formatDuration,
} from '../../utils/dateUtils';
import { calculateMaxDuration, getGuestServices } from '../slots/memberAvailability';

/**
 * Build booking services from guests
 * Converts guest services to booking service format
 */
export function buildBookingServices(
  guests: Guest[],
  memberAssignments: Map<string, TeamMember>, // guestId -> member
  dateBooking: string,
  timeStart: string
): BookingService[] {
  const services: BookingService[] = [];
  let currentTime = timeStart;
  
  for (const guest of guests) {
    for (const guestService of guest.services) {
      const member = memberAssignments.get(guest.id) || 
                     (guestService.teamMemberId ? { id: guestService.teamMemberId, first_name: guestService.teamMemberName } as any : null);
      
      // Calculate actual duration (with option and add-ons)
      let duration = guestService.duration;
      let optionId: string | undefined;
      let optionName: string | undefined;
      
      if (guestService.selectedOption) {
        duration = guestService.selectedOption.duration;
        optionId = guestService.selectedOption.id;
        optionName = guestService.selectedOption.name;
      }
      
      // Add add-on durations
      let addOnsDuration = 0;
      if (guestService.selectedAddOns) {
        addOnsDuration = guestService.selectedAddOns.reduce(
          (sum, addOn) => sum + (addOn.duration * addOn.quantity),
          0
        );
      }
      
      const totalDuration = duration + addOnsDuration;
      const timeEnd = addMinutesToTime(currentTime, totalDuration);
      
      // Determine price used
      const priceUsed = guestService.promotionPrice !== null && guestService.promotionPrice !== undefined
        ? guestService.promotionPrice
        : guestService.price;
      
      services.push({
        id: guestService.id,
        guestId: guest.id,
        guestName: guest.name,
        name: guestService.name,
        optionId,
        optionName,
        duration: totalDuration,
        durationFormatted: formatDuration(totalDuration),
        price: guestService.price,
        promotionPrice: guestService.promotionPrice,
        priceUsed,
        memberId: member?.id ?? '',
        memberName: member?.first_name ?? '',
        serviceAddons: guestService.selectedAddOns,
        dateBooking,
        timeStart: currentTime,
        timeEnd,
        serviceColor: guestService.colorService,
        people: guestService.people,
        loyaltyPoint: guestService.loyaltyPoint,
      });
      
      // Move time forward for next service
      currentTime = timeEnd;
    }
  }
  
  return services;
}

/**
 * Extract unique team members from booking services
 */
export function extractUniqueTeamMembers(services: BookingService[]): BookingTeamMember[] {
  const memberMap = new Map<string, BookingTeamMember>();
  
  services.forEach(service => {
    if (service.memberId && !memberMap.has(service.memberId)) {
      memberMap.set(service.memberId, {
        id: service.memberId,
        name: service.memberName,
      });
    }
  });
  
  return Array.from(memberMap.values());
}

/**
 * Calculate subtotal price from services
 */
export function calculateSubtotalPrice(services: BookingService[]): number {
  return services.reduce((sum, service) => {
    let serviceTotal = service.priceUsed;
    
    // Add add-on prices
    if (service.serviceAddons) {
      serviceTotal += service.serviceAddons.reduce(
        (addOnSum, addOn) => {
          const addOnPrice = addOn.promotionPrice ?? addOn.price;
          return addOnSum + (addOnPrice * addOn.quantity);
        },
        0
      );
    }
    
    return sum + serviceTotal;
  }, 0);
}

/**
 * Calculate promo discount amount
 */
export function calculatePromoDiscount(
  promo: PromoCode | null,
  subtotal: number,
  services: BookingService[]
): number {
  if (!promo) return 0;
  
  // Check specific services filter
  let eligibleAmount = subtotal;
  
  if (promo.specificServices && promo.specificServices.length > 0) {
    eligibleAmount = services
      .filter(s => promo.specificServices!.includes(s.id))
      .reduce((sum, s) => sum + s.priceUsed, 0);
  }
  
  let discount = 0;
  
  if (promo.discountType === PromoDiscountType.PERCENTAGE) {
    discount = (eligibleAmount * promo.discountValue) / 100;
  } else {
    discount = promo.discountValue;
  }
  
  // Apply max discount cap
  if (promo.maxDiscount && discount > promo.maxDiscount) {
    discount = promo.maxDiscount;
  }
  
  // Don't exceed subtotal
  if (discount > subtotal) {
    discount = subtotal;
  }
  
  return Math.round(discount * 100) / 100;
}

/**
 * Calculate deposit amount
 */
export function calculateDepositAmount(
  totalPrice: number,
  depositPercentage: number,
  depositDiscountAmount?: number
): { depositAmount: number; depositDiscountAmount: number } {
  const depositAmount = Math.round((totalPrice * depositPercentage / 100) * 100) / 100;
  const actualDiscount = depositDiscountAmount ?? 0;
  
  return {
    depositAmount: Math.max(0, depositAmount - actualDiscount),
    depositDiscountAmount: actualDiscount,
  };
}

/**
 * Build booking payload
 * Based on documentation section 7.1
 */
export interface BuildBookingParams {
  client: Client;
  shop: Shop;
  guests: Guest[];
  memberAssignments: Map<string, TeamMember>;
  selectedDate: Date;
  selectedTime: string;
  paymentMethod: PaymentMethod;
  promoCode?: PromoCode | null;
  bookingNotes?: string;
  session?: SessionData;
  packageId?: string;
  packageName?: { [lang: string]: { text: string } };
  packageServices?: Array<{ serviceId: string; quantity: number }>;
}

export function buildBookingPayload(params: BuildBookingParams): CreateBookingInput {
  const {
    client,
    shop,
    guests,
    memberAssignments,
    selectedDate,
    selectedTime,
    paymentMethod,
    promoCode,
    bookingNotes,
    session,
    packageId,
    packageName,
    packageServices,
  } = params;
  
  // Format date
  const dateBooking = formatDateBooking(selectedDate);
  const dateISOString = selectedDate.toISOString().split('T')[0];
  
  // Build services
  const services = buildBookingServices(guests, memberAssignments, dateBooking, selectedTime);
  
  // Calculate end time
  const totalDuration = calculateMaxDuration(guests);
  const timeEnd = addMinutesToTime(selectedTime, totalDuration);
  
  // Extract team members
  const teamMemberId = extractUniqueTeamMembers(services);
  
  // Calculate prices
  const subTotalPrice = calculateSubtotalPrice(services);
  const promoAmount = calculatePromoDiscount(promoCode ?? null, subTotalPrice, services);
  const subTotalPromo = promoAmount;
  const totalPrice = Math.max(0, subTotalPrice - promoAmount);
  
  // Create booking date in UTC
  const date = createBookingDateUTC(dateISOString, selectedTime, shop.settingCalendar.timeZone);
  
  return {
    clientId: client.userId,
    clientEmail: client.email,
    clientPhone: client.phone,
    clientPhoneCountry: client.phoneNumberCountry,
    firstName: client.firstName ?? '',
    lastName: client.lastName ?? '',
    date,
    dateBooking,
    timeStart: selectedTime,
    timeEnd,
    duration: totalDuration,
    services,
    teamMemberId,
    booking_id: shop.booking_id,
    paymentMethods: paymentMethod,
    subTotalPrice,
    subTotalPromo,
    totalPrice,
    // Promo fields
    discountCode: promoCode?.code,
    promoAmount,
    promoCodeId: promoCode?.id,
    promoCode: promoCode?.code,
    promoDiscountType: promoCode?.discountType,
    promoDiscountValue: promoCode?.discountValue,
    specificServices: promoCode?.specificServices,
    // Notes
    bookingNotes,
    // Package
    packageId,
    packageName,
    packageServices,
    // Session tracking
    session,
  };
}

/**
 * Build rebooking payload
 * Based on documentation section 7.6
 */
export interface BuildRebookingParams extends BuildBookingParams {
  originalBooking: Booking;
}

export function buildRebookingPayload(params: BuildRebookingParams): RebookingInput {
  const basePayload = buildBookingPayload(params);
  
  return {
    ...basePayload,
    originalBookingNumber: params.originalBooking.booking_number,
    originalPaymentMethods: params.originalBooking.paymentMethods,
  };
}

/**
 * Determine initial booking status
 */
export function determineInitialStatus(shop: Shop): BookingStatus {
  return shop.settingCalendar.autoConfirmed 
    ? BookingStatus.CONFIRMED 
    : BookingStatus.PENDING;
}

