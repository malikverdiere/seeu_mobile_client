/**
 * Stripe Controller
 * Based on DOCUMENTATION_FEATURE_BEAUTY.md section 7.3
 * 
 * Handles Stripe payment integration
 * Note: Uses Cloud Functions for server-side operations
 */

import { onHttpsCallable } from '../../data/firestore/firebase';

/**
 * Payment intent creation result
 */
export interface CreatePaymentIntentResult {
  success: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  error?: string;
}

/**
 * Payment processing result
 */
export interface ProcessPaymentResult {
  success: boolean;
  paymentIntentStatus?: string;
  error?: string;
}

/**
 * Refund result
 */
export interface RefundResult {
  success: boolean;
  refundId?: string;
  error?: string;
}

/**
 * Create a payment intent via Cloud Function
 * Based on documentation section 7.3
 */
export async function createPaymentIntent(
  amount: number,
  currency: string,
  stripeAccountId: string,
  description?: string
): Promise<CreatePaymentIntentResult> {
  try {
    const createPaymentIntentFn = onHttpsCallable('createStripePaymentIntent');
    
    const result = await createPaymentIntentFn({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      stripeAccountId,
      description,
    });
    
    const data = result.data as any;
    
    if (data.clientSecret && data.paymentIntentId) {
      return {
        success: true,
        clientSecret: data.clientSecret,
        paymentIntentId: data.paymentIntentId,
      };
    }
    
    return {
      success: false,
      error: data.error || 'Failed to create payment intent',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Payment intent creation failed',
    };
  }
}

/**
 * Update a payment intent amount
 */
export async function updatePaymentIntent(
  paymentIntentId: string,
  amount: number,
  stripeAccountId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const updatePaymentIntentFn = onHttpsCallable('updateStripePaymentIntent');
    
    const result = await updatePaymentIntentFn({
      paymentIntentId,
      amount: Math.round(amount * 100),
      stripeAccountId,
    });
    
    const data = result.data as any;
    
    return {
      success: data.success === true,
      error: data.error,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Payment intent update failed',
    };
  }
}

/**
 * Cancel a payment intent
 */
export async function cancelPaymentIntent(
  paymentIntentId: string,
  stripeAccountId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cancelPaymentIntentFn = onHttpsCallable('cancelPaymentIntent');
    
    const result = await cancelPaymentIntentFn({
      paymentIntentId,
      stripeAccountId,
    });
    
    const data = result.data as any;
    
    return {
      success: data.success === true,
      error: data.error,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Payment intent cancellation failed',
    };
  }
}

/**
 * Request a refund via Cloud Function
 * Based on documentation section 7.5
 */
export async function requestRefund(
  paymentIntentId: string,
  stripeAccountId: string,
  amount?: number // Optional partial refund amount
): Promise<RefundResult> {
  try {
    const refundFn = onHttpsCallable('refundConnect');
    
    const params: any = {
      paymentIntentId,
      stripeAccountId,
    };
    
    if (amount !== undefined) {
      params.amount = Math.round(amount * 100);
    }
    
    const result = await refundFn(params);
    const data = result.data as any;
    
    if (data.success) {
      return {
        success: true,
        refundId: data.refundId,
      };
    }
    
    return {
      success: false,
      error: data.error || 'Refund failed',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Refund request failed',
    };
  }
}

/**
 * Calculate payment amount in cents
 */
export function calculateAmountInCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Format amount from cents to display
 */
export function formatAmountFromCents(cents: number, currencySymbol: string = '฿'): string {
  const amount = cents / 100;
  return `${currencySymbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * Get payment method label for display
 */
export function getPaymentMethodLabel(method: 'Pay at venue' | 'Pay online', lang: string = 'fr'): string {
  const labels = {
    'Pay at venue': {
      en: 'Pay at venue',
      fr: 'Payer sur place',
      th: 'ชำระที่ร้าน',
    },
    'Pay online': {
      en: 'Pay online',
      fr: 'Payer en ligne',
      th: 'ชำระออนไลน์',
    },
  };
  
  return labels[method]?.[lang] || labels[method]?.['en'] || method;
}

/**
 * Payment status labels
 */
export function getPaymentStatusLabel(status: string, lang: string = 'fr'): string {
  const labels: Record<string, Record<string, string>> = {
    succeeded: {
      en: 'Paid',
      fr: 'Payé',
      th: 'ชำระแล้ว',
    },
    processing: {
      en: 'Processing',
      fr: 'En cours',
      th: 'กำลังดำเนินการ',
    },
    requires_payment_method: {
      en: 'Payment required',
      fr: 'Paiement requis',
      th: 'ต้องการการชำระเงิน',
    },
    canceled: {
      en: 'Cancelled',
      fr: 'Annulé',
      th: 'ยกเลิก',
    },
  };
  
  return labels[status]?.[lang] || labels[status]?.['en'] || status;
}

