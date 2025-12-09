/**
 * Beauty Module - Main Entry Point
 * 
 * This module contains all the data layer, business logic, and hooks
 * for the Beauty booking feature in the SeeU mobile app.
 * 
 * Based on DOCUMENTATION_FEATURE_BEAUTY.md
 * 
 * Architecture:
 * - data/types: TypeScript interfaces for all Firestore collections
 * - data/firestore: Mappers and Firebase configuration
 * - data/services: Data access layer (Firestore queries)
 * - logic/slots: Time slot generation and validation
 * - logic/booking: Booking payload construction and cart calculations
 * - logic/checkout: Checkout flow and Stripe integration
 * - hooks: React hooks encapsulating business logic
 * - utils: Pure utility functions (dates, geo, categories)
 * 
 * Usage:
 * ```typescript
 * import { useBeautyShopData, useCreateBooking } from 'modules/beauty';
 * 
 * // In a React component
 * const { shop, services, teamMembers } = useBeautyShopData('salon-slug');
 * const { createNewBooking, isCreating } = useCreateBooking();
 * ```
 */

// Types
export * from './data/types';

// Firestore (mappers and firebase)
export * from './data/firestore';

// Services (data access layer)
export * from './data/services';

// Logic - Slots
export * from './logic/slots';

// Logic - Booking
export * from './logic/booking';

// Logic - Checkout
export * from './logic/checkout';

// Hooks
export * from './hooks';

// Utils
export * from './utils';

