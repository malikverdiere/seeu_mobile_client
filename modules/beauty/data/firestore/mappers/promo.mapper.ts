/**
 * PromoCode and Reward Firestore mappers
 */

import { DocumentSnapshot, DocumentData } from '../firebase';
import { PromoCode, Reward, PromoCodeStatus, PromoDiscountType } from '../../types/promo.types';

/**
 * Convert Firestore document to PromoCode
 */
export function fromFirestorePromoCode(doc: DocumentSnapshot): PromoCode | null {
  if (!doc.exists) return null;
  
  const data = doc.data();
  if (!data) return null;
  
  return {
    id: doc.id,
    shopId: data.shopId ?? '',
    code: data.code ?? '',
    name: data.name,
    status: data.status ?? PromoCodeStatus.INACTIVE,
    discountType: data.discountType ?? PromoDiscountType.PERCENTAGE,
    discountValue: data.discountValue ?? 0,
    maxDiscount: data.maxDiscount,
    minOrderValue: data.minOrderValue,
    validFrom: data.validFrom,
    validUntil: data.validUntil,
    usageLimit: data.usageLimit,
    usageLimitPerClient: data.usageLimitPerClient,
    newUsersOnly: data.newUsersOnly,
    specificServices: data.specificServices,
  };
}

/**
 * Convert PromoCode to Firestore document data
 */
export function toFirestorePromoCode(promo: Partial<PromoCode>): DocumentData {
  const data: DocumentData = {};
  
  if (promo.shopId !== undefined) data.shopId = promo.shopId;
  if (promo.code !== undefined) data.code = promo.code;
  if (promo.name !== undefined) data.name = promo.name;
  if (promo.status !== undefined) data.status = promo.status;
  if (promo.discountType !== undefined) data.discountType = promo.discountType;
  if (promo.discountValue !== undefined) data.discountValue = promo.discountValue;
  if (promo.maxDiscount !== undefined) data.maxDiscount = promo.maxDiscount;
  if (promo.minOrderValue !== undefined) data.minOrderValue = promo.minOrderValue;
  if (promo.validFrom !== undefined) data.validFrom = promo.validFrom;
  if (promo.validUntil !== undefined) data.validUntil = promo.validUntil;
  if (promo.usageLimit !== undefined) data.usageLimit = promo.usageLimit;
  if (promo.usageLimitPerClient !== undefined) data.usageLimitPerClient = promo.usageLimitPerClient;
  if (promo.newUsersOnly !== undefined) data.newUsersOnly = promo.newUsersOnly;
  if (promo.specificServices !== undefined) data.specificServices = promo.specificServices;
  
  return data;
}

/**
 * Convert Firestore document to Reward
 */
export function fromFirestoreReward(doc: DocumentSnapshot): Reward | null {
  if (!doc.exists) return null;
  
  const data = doc.data();
  if (!data) return null;
  
  return {
    id: doc.id,
    shopId: data.shopId ?? '',
    name: data.name,
    description: data.description,
    points: data.points,
    isActive: data.isActive,
    // Spread remaining fields
    ...data,
  };
}

/**
 * Convert Reward to Firestore document data
 */
export function toFirestoreReward(reward: Partial<Reward>): DocumentData {
  const { id, ...data } = reward;
  return data as DocumentData;
}

