/**
 * useBeautyShops hook
 * Fetches shops for beauty category with filters
 * Based on documentation sections 3.1 and 3.2
 */

import { useState, useEffect, useCallback } from 'react';
import { Shop, ShopWithDistance, ShopFilters } from '../data/types/shop.types';
import {
  getHighlightedShopsForBeauty,
  getShopsByHighlightType,
  searchShopsForBeauty,
  searchShopsWithGeo,
} from '../data/services/shop.service';
import { DocumentSnapshot } from '../data/firestore/firebase';
import { HighlightType } from '../utils/categories';

/**
 * Hook state
 */
interface UseBeautyShopsState {
  shops: Shop[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
}

/**
 * Hook options
 */
interface UseBeautyShopsOptions {
  filters?: ShopFilters;
  highlightType?: HighlightType;
  useGeo?: boolean;
  autoFetch?: boolean;
}

/**
 * Hook return type
 */
interface UseBeautyShopsReturn extends UseBeautyShopsState {
  fetchShops: () => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * useBeautyShops - Fetches shops for beauty category
 * 
 * @param options - Configuration options
 * @returns State and actions for shops
 * 
 * @example
 * // Fetch highlighted shops
 * const { shops, isLoading } = useBeautyShops();
 * 
 * @example
 * // Fetch with filters
 * const { shops, loadMore } = useBeautyShops({
 *   filters: { category: 'hair', promoCode: true }
 * });
 * 
 * @example
 * // Fetch by highlight type
 * const { shops } = useBeautyShops({
 *   highlightType: 'Trending'
 * });
 */
export function useBeautyShops(options: UseBeautyShopsOptions = {}): UseBeautyShopsReturn {
  const { filters, highlightType, useGeo = false, autoFetch = true } = options;
  
  const [state, setState] = useState<UseBeautyShopsState>({
    shops: [],
    isLoading: false,
    error: null,
    hasMore: true,
  });
  
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  
  /**
   * Fetch shops based on options
   */
  const fetchShops = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      let shops: Shop[] = [];
      
      // Fetch by highlight type
      if (highlightType) {
        shops = await getShopsByHighlightType(highlightType);
        setState({
          shops,
          isLoading: false,
          error: null,
          hasMore: false, // Highlight queries return all results
        });
        return;
      }
      
      // Fetch with geo filters
      if (useGeo && filters?.lat && filters?.lng) {
        const shopsWithDistance = await searchShopsWithGeo(
          filters.lat,
          filters.lng,
          filters.radius ?? 20,
          filters
        );
        setState({
          shops: shopsWithDistance,
          isLoading: false,
          error: null,
          hasMore: false, // Geo queries return all results
        });
        return;
      }
      
      // Fetch with standard filters
      if (filters) {
        const result = await searchShopsForBeauty(filters, undefined, 20);
        setState({
          shops: result.shops,
          isLoading: false,
          error: null,
          hasMore: result.shops.length === 20,
        });
        setLastDoc(result.lastDoc);
        return;
      }
      
      // Default: fetch highlighted shops
      shops = await getHighlightedShopsForBeauty();
      setState({
        shops,
        isLoading: false,
        error: null,
        hasMore: false,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Erreur lors du chargement des boutiques',
      }));
    }
  }, [filters, highlightType, useGeo]);
  
  /**
   * Load more shops (pagination)
   */
  const loadMore = useCallback(async () => {
    if (!state.hasMore || state.isLoading || !lastDoc) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const result = await searchShopsForBeauty(filters ?? {}, lastDoc, 20);
      
      setState(prev => ({
        ...prev,
        shops: [...prev.shops, ...result.shops],
        isLoading: false,
        hasMore: result.shops.length === 20,
      }));
      setLastDoc(result.lastDoc);
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Erreur lors du chargement',
      }));
    }
  }, [filters, lastDoc, state.hasMore, state.isLoading]);
  
  /**
   * Refresh shops
   */
  const refresh = useCallback(async () => {
    setLastDoc(null);
    await fetchShops();
  }, [fetchShops]);
  
  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchShops();
    }
  }, [autoFetch, fetchShops]);
  
  return {
    ...state,
    fetchShops,
    loadMore,
    refresh,
  };
}

/**
 * useHighlightedShops - Convenience hook for highlighted shops
 */
export function useHighlightedShops() {
  return useBeautyShops({ autoFetch: true });
}

/**
 * useShopsByCategory - Convenience hook for category-filtered shops
 */
export function useShopsByCategory(category: string) {
  return useBeautyShops({
    filters: { category, categoryType: 1 },
    autoFetch: true,
  });
}

/**
 * useNearbyShops - Convenience hook for geo-filtered shops
 */
export function useNearbyShops(lat: number, lng: number, radiusKm: number = 20) {
  return useBeautyShops({
    filters: { lat, lng, radius: radiusKm, categoryType: 1 },
    useGeo: true,
    autoFetch: true,
  });
}

