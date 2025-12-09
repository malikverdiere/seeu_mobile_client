/**
 * useBeautyShopData hook
 * Loads all data needed for a shop's booking flow
 * Based on documentation section 4.1
 */

import { useState, useEffect, useCallback } from 'react';
import { Shop } from '../data/types/shop.types';
import { Service, ServiceCategory } from '../data/types/service.types';
import { TeamMember } from '../data/types/team.types';
import { DayOff } from '../data/types/dayoff.types';
import { Booking } from '../data/types/booking.types';
import { PromoCode } from '../data/types/promo.types';
import { ShopReview, GoogleReview, ReviewsSummary } from '../data/types/review.types';
import { getShopByBookingId, getShopById } from '../data/services/shop.service';
import { getServicesForShop, getServiceCategoriesForShop, getServicesGroupedByCategory } from '../data/services/service.service';
import { getTeamMembersForShop } from '../data/services/team.service';
import { getDayOffsForShop } from '../data/services/dayoff.service';
import { getActiveBookingsForShop } from '../data/services/booking.service';
import { getPromoCodesForShop } from '../data/services/promo.service';
import { getReviewsSummary, getAllReviews } from '../data/services/review.service';

/**
 * Shop data state
 */
interface BeautyShopData {
  shop: Shop | null;
  services: Service[];
  categories: ServiceCategory[];
  servicesGroupedByCategory: { category: ServiceCategory; services: Service[] }[];
  teamMembers: TeamMember[];
  dayOffs: DayOff[];
  activeBookings: Booking[];
  promoCodes: PromoCode[];
  reviewsSummary: ReviewsSummary | null;
}

/**
 * Hook state
 */
interface UseBeautyShopDataState extends BeautyShopData {
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook return type
 */
interface UseBeautyShopDataReturn extends UseBeautyShopDataState {
  refresh: () => Promise<void>;
  refreshBookings: () => Promise<void>;
}

/**
 * useBeautyShopData - Loads all shop data for booking flow
 * 
 * @param bookingIdOrShopId - Either booking_id (URL slug) or shop document ID
 * @param useShopId - If true, treats the first param as shop ID
 * @returns All shop data needed for booking
 * 
 * @example
 * // Load by booking_id (URL slug)
 * const { shop, services, teamMembers, isLoading } = useBeautyShopData('salon-beauty-bangkok');
 * 
 * @example
 * // Load by shop ID
 * const { shop, services } = useBeautyShopData('abc123', true);
 */
export function useBeautyShopData(
  bookingIdOrShopId: string,
  useShopId: boolean = false
): UseBeautyShopDataReturn {
  const [state, setState] = useState<UseBeautyShopDataState>({
    shop: null,
    services: [],
    categories: [],
    servicesGroupedByCategory: [],
    teamMembers: [],
    dayOffs: [],
    activeBookings: [],
    promoCodes: [],
    reviewsSummary: null,
    isLoading: false,
    error: null,
  });
  
  /**
   * Load all shop data
   */
  const loadShopData = useCallback(async () => {
    if (!bookingIdOrShopId) return;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // 1. Get shop
      let shop: Shop | null = null;
      
      if (useShopId) {
        shop = await getShopById(bookingIdOrShopId);
      } else {
        shop = await getShopByBookingId(bookingIdOrShopId);
      }
      
      if (!shop) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Boutique non trouvée',
        }));
        return;
      }
      
      // 2. Load all related data in parallel
      const [
        services,
        categories,
        servicesGrouped,
        teamMembers,
        dayOffs,
        activeBookings,
        promoCodes,
        reviewsSummary,
      ] = await Promise.all([
        getServicesForShop(shop.id),
        getServiceCategoriesForShop(shop.id),
        getServicesGroupedByCategory(shop.id),
        getTeamMembersForShop(shop.id),
        getDayOffsForShop(shop.id),
        getActiveBookingsForShop(shop.id),
        getPromoCodesForShop(shop.id),
        getReviewsSummary(shop.id),
      ]);
      
      setState({
        shop,
        services,
        categories,
        servicesGroupedByCategory: servicesGrouped,
        teamMembers,
        dayOffs,
        activeBookings,
        promoCodes,
        reviewsSummary,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Erreur lors du chargement des données',
      }));
    }
  }, [bookingIdOrShopId, useShopId]);
  
  /**
   * Refresh all data
   */
  const refresh = useCallback(async () => {
    await loadShopData();
  }, [loadShopData]);
  
  /**
   * Refresh only bookings (for availability checking)
   */
  const refreshBookings = useCallback(async () => {
    if (!state.shop) return;
    
    try {
      const activeBookings = await getActiveBookingsForShop(state.shop.id);
      setState(prev => ({ ...prev, activeBookings }));
    } catch (error) {
      console.error('Error refreshing bookings:', error);
    }
  }, [state.shop]);
  
  // Load data on mount
  useEffect(() => {
    loadShopData();
  }, [loadShopData]);
  
  return {
    ...state,
    refresh,
    refreshBookings,
  };
}

/**
 * Simplified hook that returns only what's needed for service selection
 */
export function useShopServices(bookingIdOrShopId: string, useShopId: boolean = false) {
  const data = useBeautyShopData(bookingIdOrShopId, useShopId);
  
  return {
    shop: data.shop,
    services: data.services,
    categories: data.categories,
    servicesGroupedByCategory: data.servicesGroupedByCategory,
    teamMembers: data.teamMembers,
    isLoading: data.isLoading,
    error: data.error,
  };
}

/**
 * Simplified hook for time selection page
 */
export function useShopAvailability(bookingIdOrShopId: string, useShopId: boolean = false) {
  const data = useBeautyShopData(bookingIdOrShopId, useShopId);
  
  return {
    shop: data.shop,
    teamMembers: data.teamMembers,
    dayOffs: data.dayOffs,
    activeBookings: data.activeBookings,
    isLoading: data.isLoading,
    error: data.error,
    refreshBookings: data.refreshBookings,
  };
}

