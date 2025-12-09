/**
 * PromoCode & Reward Service - Data Access Layer
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
import { 
  fromFirestorePromoCode, 
  fromFirestoreReward 
} from '../firestore/mappers/promo.mapper';
import { 
  PromoCode, 
  PromoCodeStatus, 
  PromoDiscountType,
  Reward,
  PromoCodeValidation,
  ApplyPromoCodeInput,
} from '../types/promo.types';

/**
 * Get all promo codes for a shop
 */
export async function getPromoCodesForShop(shopId: string): Promise<PromoCode[]> {
  const promoCodesRef = collection(firestore, COLLECTIONS.PROMO_CODES);
  
  const q = query(
    promoCodesRef,
    where('shopId', '==', shopId),
    where('status', '==', PromoCodeStatus.ACTIVE)
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs
    .map(doc => fromFirestorePromoCode(doc))
    .filter((promo): promo is PromoCode => promo !== null);
}

/**
 * Get a promo code by code string
 */
export async function getPromoCodeByCode(
  shopId: string,
  code: string
): Promise<PromoCode | null> {
  const promoCodesRef = collection(firestore, COLLECTIONS.PROMO_CODES);
  
  const q = query(
    promoCodesRef,
    where('shopId', '==', shopId),
    where('code', '==', code.toUpperCase()),
    where('status', '==', PromoCodeStatus.ACTIVE)
  );
  
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  return fromFirestorePromoCode(snapshot.docs[0]);
}

/**
 * Validate a promo code
 * Based on documentation section 2.12
 */
export async function validatePromoCode(
  input: ApplyPromoCodeInput
): Promise<PromoCodeValidation> {
  const promo = await getPromoCodeByCode(input.shopId, input.code);
  
  if (!promo) {
    return {
      isValid: false,
      errorMessage: 'Code promo invalide',
    };
  }
  
  // Check validity dates
  const now = new Date();
  
  if (promo.validFrom) {
    const validFrom = timestampToDate(promo.validFrom as any);
    if (validFrom && now < validFrom) {
      return {
        isValid: false,
        errorMessage: 'Ce code promo n\'est pas encore valide',
      };
    }
  }
  
  if (promo.validUntil) {
    const validUntil = timestampToDate(promo.validUntil as any);
    if (validUntil && now > validUntil) {
      return {
        isValid: false,
        errorMessage: 'Ce code promo a expiré',
      };
    }
  }
  
  // Check minimum order value
  if (promo.minOrderValue && input.orderTotal < promo.minOrderValue) {
    return {
      isValid: false,
      errorMessage: `Minimum de commande: ${promo.minOrderValue}`,
    };
  }
  
  // Check new users only
  if (promo.newUsersOnly && !input.isNewClient) {
    return {
      isValid: false,
      errorMessage: 'Ce code est réservé aux nouveaux clients',
    };
  }
  
  // Check specific services
  if (promo.specificServices && promo.specificServices.length > 0 && input.serviceIds) {
    const hasTargetedService = input.serviceIds.some(id => 
      promo.specificServices!.includes(id)
    );
    
    if (!hasTargetedService) {
      return {
        isValid: false,
        errorMessage: 'Ce code ne s\'applique pas à vos services sélectionnés',
      };
    }
  }
  
  // Calculate discount
  const calculatedDiscount = calculatePromoDiscount(promo, input.orderTotal);
  
  return {
    isValid: true,
    promoCode: promo,
    calculatedDiscount,
  };
}

/**
 * Calculate promo discount amount
 */
export function calculatePromoDiscount(
  promo: PromoCode,
  orderTotal: number
): number {
  let discount = 0;
  
  if (promo.discountType === PromoDiscountType.PERCENTAGE) {
    discount = (orderTotal * promo.discountValue) / 100;
  } else {
    // Fixed amount
    discount = promo.discountValue;
  }
  
  // Apply max discount cap
  if (promo.maxDiscount && discount > promo.maxDiscount) {
    discount = promo.maxDiscount;
  }
  
  // Don't exceed order total
  if (discount > orderTotal) {
    discount = orderTotal;
  }
  
  return Math.round(discount * 100) / 100;
}

/**
 * Get rewards for a shop
 */
export async function getRewardsForShop(shopId: string): Promise<Reward[]> {
  const rewardsRef = collection(firestore, COLLECTIONS.REWARDS);
  
  const q = query(
    rewardsRef,
    where('shopId', '==', shopId)
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs
    .map(doc => fromFirestoreReward(doc))
    .filter((reward): reward is Reward => reward !== null);
}

/**
 * Get active rewards for a shop
 */
export async function getActiveRewardsForShop(shopId: string): Promise<Reward[]> {
  const rewards = await getRewardsForShop(shopId);
  return rewards.filter(reward => reward.isActive !== false);
}

