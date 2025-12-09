/**
 * Cart calculations
 * Based on DOCUMENTATION_FEATURE_BEAUTY.md section 8.5 - useCartCalculations
 * 
 * Pure functions for calculating cart totals, discounts, etc.
 */

import { GuestService, ServiceAddOn } from '../../data/types/service.types';
import { Guest } from '../../data/types/service.types';
import { PromoCode, PromoDiscountType } from '../../data/types/promo.types';
import { Shop } from '../../data/types/shop.types';

/**
 * Cart summary structure
 */
export interface CartSummary {
  /** Total service count */
  serviceCount: number;
  /** Total guests count */
  guestCount: number;
  /** Subtotal before any discounts */
  subtotal: number;
  /** Promo code discount amount */
  promoDiscount: number;
  /** Online payment discount amount */
  depositDiscount: number;
  /** Total price after discounts */
  total: number;
  /** Total duration in minutes */
  totalDuration: number;
  /** Deposit amount (if paying online) */
  depositAmount: number;
  /** Savings breakdown */
  savings: {
    fromPromo: number;
    fromDeposit: number;
    fromPromotionPrices: number;
    total: number;
  };
}

/**
 * Calculate subtotal from guest services
 */
export function calculateSubtotal(services: GuestService[]): number {
  return services.reduce((sum, service) => {
    let serviceTotal = service.promotionPrice ?? service.price;
    
    // Add option price if selected
    if (service.selectedOption) {
      serviceTotal = service.selectedOption.promotionPrice ?? service.selectedOption.price;
    }
    
    // Add add-on prices
    if (service.selectedAddOns) {
      serviceTotal += service.selectedAddOns.reduce(
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
 * Calculate savings from promotion prices
 */
export function calculatePromotionSavings(services: GuestService[]): number {
  return services.reduce((sum, service) => {
    let savings = 0;
    
    // Service promotion price savings
    if (service.promotionPrice !== null && service.promotionPrice !== undefined) {
      savings += service.price - service.promotionPrice;
    }
    
    // Option promotion price savings
    if (service.selectedOption?.promotionPrice !== null && service.selectedOption?.promotionPrice !== undefined) {
      savings += service.selectedOption.price - service.selectedOption.promotionPrice;
    }
    
    // Add-on promotion price savings
    if (service.selectedAddOns) {
      savings += service.selectedAddOns.reduce(
        (addOnSum, addOn) => {
          if (addOn.promotionPrice !== null && addOn.promotionPrice !== undefined) {
            return addOnSum + ((addOn.price - addOn.promotionPrice) * addOn.quantity);
          }
          return addOnSum;
        },
        0
      );
    }
    
    return sum + savings;
  }, 0);
}

/**
 * Calculate promo code discount
 */
export function calculatePromoDiscount(
  promo: PromoCode | null | undefined,
  subtotal: number,
  services: GuestService[]
): number {
  if (!promo) return 0;
  
  // Check specific services filter
  let eligibleAmount = subtotal;
  
  if (promo.specificServices && promo.specificServices.length > 0) {
    eligibleAmount = services
      .filter(s => promo.specificServices!.includes(s.id))
      .reduce((sum, s) => sum + (s.promotionPrice ?? s.price), 0);
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
 * Calculate deposit discount (for online payment)
 */
export function calculateDepositDiscount(
  shop: Shop,
  payOnline: boolean
): number {
  if (!payOnline) return 0;
  
  const { settingCalendar } = shop;
  
  if (!settingCalendar.deposit_enabled) return 0;
  
  return settingCalendar.deposit_discount_amount ?? 0;
}

/**
 * Calculate deposit amount
 */
export function calculateDeposit(
  total: number,
  shop: Shop,
  payOnline: boolean
): number {
  if (!payOnline) return 0;
  
  const { settingCalendar } = shop;
  
  if (!settingCalendar.deposit_enabled) return 0;
  
  const percentage = settingCalendar.deposit_percentage ?? 100;
  const depositAmount = (total * percentage) / 100;
  
  return Math.round(depositAmount * 100) / 100;
}

/**
 * Calculate total duration from services
 */
export function calculateTotalDuration(services: GuestService[]): number {
  return services.reduce((sum, service) => {
    let duration = service.duration;
    
    // Use option duration if selected
    if (service.selectedOption) {
      duration = service.selectedOption.duration;
    }
    
    // Add add-on durations
    if (service.selectedAddOns) {
      duration += service.selectedAddOns.reduce(
        (addOnSum, addOn) => addOnSum + (addOn.duration * addOn.quantity),
        0
      );
    }
    
    return sum + duration;
  }, 0);
}

/**
 * Calculate max duration across guests (for parallel services)
 */
export function calculateMaxDurationAcrossGuests(guests: Guest[]): number {
  if (guests.length === 0) return 0;
  
  const durationsByGuest = guests.map(guest =>
    calculateTotalDuration(guest.services)
  );
  
  return Math.max(...durationsByGuest, 0);
}

/**
 * Calculate full cart summary
 * Based on documentation section 8.5 - useCartCalculations
 */
export function calculateCartSummary(
  guests: Guest[],
  promo: PromoCode | null | undefined,
  shop: Shop,
  payOnline: boolean = false
): CartSummary {
  const allServices = guests.flatMap(g => g.services);
  
  // Basic counts
  const serviceCount = allServices.length;
  const guestCount = guests.filter(g => g.services.length > 0).length;
  
  // Calculate subtotal
  const subtotal = calculateSubtotal(allServices);
  
  // Calculate discounts
  const promoDiscount = calculatePromoDiscount(promo, subtotal, allServices);
  const depositDiscount = calculateDepositDiscount(shop, payOnline);
  const promotionSavings = calculatePromotionSavings(allServices);
  
  // Calculate total
  const total = Math.max(0, subtotal - promoDiscount - depositDiscount);
  
  // Calculate deposit
  const depositAmount = calculateDeposit(total, shop, payOnline);
  
  // Calculate duration
  const totalDuration = calculateMaxDurationAcrossGuests(guests);
  
  return {
    serviceCount,
    guestCount,
    subtotal,
    promoDiscount,
    depositDiscount,
    total,
    totalDuration,
    depositAmount,
    savings: {
      fromPromo: promoDiscount,
      fromDeposit: depositDiscount,
      fromPromotionPrices: promotionSavings,
      total: promoDiscount + depositDiscount + promotionSavings,
    },
  };
}

/**
 * Format price for display
 */
export function formatPrice(price: number, currencySymbol: string = '฿'): string {
  return `${currencySymbol}${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * Check if cart meets minimum order value for promo
 */
export function meetsMinimumOrderValue(
  subtotal: number,
  promo: PromoCode | null | undefined
): boolean {
  if (!promo || !promo.minOrderValue) return true;
  return subtotal >= promo.minOrderValue;
}

