/**
 * Service & ServiceCategory Service - Data Access Layer
 */

import {
  collection,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
} from '@react-native-firebase/firestore';
import { firestore, COLLECTIONS } from '../firestore/firebase';
import { 
  fromFirestoreService, 
  fromFirestoreServiceCategory 
} from '../firestore/mappers/service.mapper';
import { Service, ServiceCategory, ServiceWithCategory } from '../types/service.types';

/**
 * Get all services for a shop
 */
export async function getServicesForShop(shopId: string): Promise<Service[]> {
  const servicesRef = collection(
    firestore,
    COLLECTIONS.SHOPS,
    shopId,
    COLLECTIONS.SERVICES
  );
  
  const q = query(servicesRef, orderBy('priority', 'asc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs
    .map(doc => fromFirestoreService(doc))
    .filter((service): service is Service => service !== null);
}

/**
 * Get visible services for a shop (not hidden_for_client)
 */
export async function getVisibleServicesForShop(shopId: string): Promise<Service[]> {
  const services = await getServicesForShop(shopId);
  return services.filter(service => !service.hidden_for_client);
}

/**
 * Get a specific service by ID
 */
export async function getServiceById(
  shopId: string,
  serviceId: string
): Promise<Service | null> {
  const serviceRef = doc(
    firestore,
    COLLECTIONS.SHOPS,
    shopId,
    COLLECTIONS.SERVICES,
    serviceId
  );
  
  const snapshot = await getDoc(serviceRef);
  return fromFirestoreService(snapshot);
}

/**
 * Get featured services for a shop
 */
export async function getFeaturedServicesForShop(shopId: string): Promise<Service[]> {
  const servicesRef = collection(
    firestore,
    COLLECTIONS.SHOPS,
    shopId,
    COLLECTIONS.SERVICES
  );
  
  const q = query(
    servicesRef,
    where('featured', '==', true),
    where('hidden_for_client', '==', false)
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs
    .map(doc => fromFirestoreService(doc))
    .filter((service): service is Service => service !== null);
}

/**
 * Get all service categories for a shop
 */
export async function getServiceCategoriesForShop(shopId: string): Promise<ServiceCategory[]> {
  const categoriesRef = collection(
    firestore,
    COLLECTIONS.SHOPS,
    shopId,
    COLLECTIONS.SERVICE_CATEGORIES
  );
  
  const q = query(categoriesRef, orderBy('priority', 'asc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs
    .map(doc => fromFirestoreServiceCategory(doc))
    .filter((category): category is ServiceCategory => category !== null);
}

/**
 * Get a specific category by ID
 */
export async function getServiceCategoryById(
  shopId: string,
  categoryId: string
): Promise<ServiceCategory | null> {
  const categoryRef = doc(
    firestore,
    COLLECTIONS.SHOPS,
    shopId,
    COLLECTIONS.SERVICE_CATEGORIES,
    categoryId
  );
  
  const snapshot = await getDoc(categoryRef);
  return fromFirestoreServiceCategory(snapshot);
}

/**
 * Get services grouped by category
 * Based on documentation section 4.2
 */
export async function getServicesGroupedByCategory(
  shopId: string
): Promise<{ category: ServiceCategory; services: Service[] }[]> {
  // Fetch categories and services in parallel
  const [categories, services] = await Promise.all([
    getServiceCategoriesForShop(shopId),
    getVisibleServicesForShop(shopId),
  ]);
  
  // Filter categories that have at least one visible service
  const categoriesWithServices = filterCategoriesHasServices(categories, services);
  
  // Group services by category
  return categoriesWithServices.map(category => ({
    category,
    services: services.filter(service => service.categoryId === category.id),
  }));
}

/**
 * Filter categories that have at least one visible service
 * Based on documentation section 4.2 - servicesPageController
 */
export function filterCategoriesHasServices(
  categories: ServiceCategory[],
  services: Service[]
): ServiceCategory[] {
  return categories.filter(category =>
    services.some(
      service => service.categoryId === category.id && !service.hidden_for_client
    )
  );
}

/**
 * Get services with their category info
 */
export async function getServicesWithCategories(
  shopId: string
): Promise<ServiceWithCategory[]> {
  const [services, categories] = await Promise.all([
    getVisibleServicesForShop(shopId),
    getServiceCategoriesForShop(shopId),
  ]);
  
  const categoryMap = new Map(categories.map(c => [c.id, c]));
  
  return services.map(service => ({
    ...service,
    category: categoryMap.get(service.categoryId),
  }));
}

/**
 * Get services by category
 */
export async function getServicesByCategory(
  shopId: string,
  categoryId: string
): Promise<Service[]> {
  const servicesRef = collection(
    firestore,
    COLLECTIONS.SHOPS,
    shopId,
    COLLECTIONS.SERVICES
  );
  
  const q = query(
    servicesRef,
    where('categoryId', '==', categoryId),
    where('hidden_for_client', '==', false),
    orderBy('priority', 'asc')
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs
    .map(doc => fromFirestoreService(doc))
    .filter((service): service is Service => service !== null);
}

