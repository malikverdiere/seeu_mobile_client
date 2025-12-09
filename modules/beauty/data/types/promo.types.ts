/**
 * Promo code and Rewards types based on DOCUMENTATION_FEATURE_BEAUTY.md
 * Collection: PromoCodes/{promoCodeId}
 * Collection: Rewards/{rewardId}
 */

import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

/**
 * Promo code status enum
 */
export enum PromoCodeStatus {
  INACTIVE = 0,
  ACTIVE = 1,
}

/**
 * Promo discount type enum
 */
export enum PromoDiscountType {
  /** Percentage discount (%) */
  PERCENTAGE = 1,
  /** Fixed amount discount */
  FIXED = 2,
}

/**
 * Promo code document structure
 */
export interface PromoCode {
  /** Document ID */
  id: string;
  /** Shop ID */
  shopId: string;
  /** Promo code string */
  code: string;
  /** Display name */
  name?: string;
  /** Status (0=inactive, 1=active) */
  status: PromoCodeStatus | number;
  /** Discount type (1=%, 2=fixed) */
  discountType: PromoDiscountType | number;
  /** Discount value */
  discountValue: number;
  /** Maximum discount amount */
  maxDiscount?: number;
  /** Minimum order value */
  minOrderValue?: number;
  /** Valid from date */
  validFrom?: FirebaseFirestoreTypes.Timestamp | Date;
  /** Valid until date */
  validUntil?: FirebaseFirestoreTypes.Timestamp | Date;
  /** Total usage limit */
  usageLimit?: number;
  /** Usage limit per client */
  usageLimitPerClient?: number;
  /** New users only */
  newUsersOnly?: boolean;
  /** Specific services targeted */
  specificServices?: string[];
}

/**
 * Promo code validation result
 */
export interface PromoCodeValidation {
  isValid: boolean;
  errorMessage?: string;
  promoCode?: PromoCode;
  calculatedDiscount?: number;
}

/**
 * Reward document structure
 * Loyalty rewards for shops
 */
export interface Reward {
  /** Document ID */
  id: string;
  /** Shop ID */
  shopId: string;
  /** Reward name */
  name?: string;
  /** Description */
  description?: string;
  /** Points required */
  points?: number;
  /** Is active */
  isActive?: boolean;
  /** Additional reward data */
  [key: string]: unknown;
}

/**
 * Apply promo code input
 */
export interface ApplyPromoCodeInput {
  code: string;
  shopId: string;
  clientId: string;
  orderTotal: number;
  serviceIds?: string[];
  isNewClient?: boolean;
}

