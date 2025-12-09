/**
 * Service and ServiceCategory Firestore mappers
 */

import { DocumentSnapshot, DocumentData } from '../firebase';
import {
  Service,
  ServiceCategory,
  ServiceOption,
  ServiceAddOn,
} from '../../types/service.types';
import { TranslatedText } from '../../types/common.types';

/**
 * Convert Firestore document to Service
 */
export function fromFirestoreService(doc: DocumentSnapshot): Service | null {
  if (!doc.exists) return null;
  
  const data = doc.data();
  if (!data) return null;
  
  return {
    id: doc.id,
    name: data.name ?? '',
    title_service: data.title_service as TranslatedText,
    description: data.description,
    description_service: data.description_service as TranslatedText,
    duration: data.duration ?? 0,
    durationText: data.durationText,
    price: data.price ?? 0,
    promotionPrice: data.promotionPrice,
    categoryId: data.categoryId ?? '',
    colorService: data.colorService,
    hidden_for_client: data.hidden_for_client ?? false,
    featured: data.featured ?? false,
    people: data.people,
    priority: data.priority,
    pictureUrl: data.pictureUrl,
    loyaltyPoint: data.loyaltyPoint,
    serviceOptions: fromFirestoreServiceOptions(data.serviceOptions),
    serviceAddons: fromFirestoreServiceAddons(data.serviceAddons),
  };
}

/**
 * Convert Service to Firestore document data
 */
export function toFirestoreService(service: Partial<Service>): DocumentData {
  const data: DocumentData = {};
  
  if (service.name !== undefined) data.name = service.name;
  if (service.title_service !== undefined) data.title_service = service.title_service;
  if (service.description !== undefined) data.description = service.description;
  if (service.description_service !== undefined) data.description_service = service.description_service;
  if (service.duration !== undefined) data.duration = service.duration;
  if (service.durationText !== undefined) data.durationText = service.durationText;
  if (service.price !== undefined) data.price = service.price;
  if (service.promotionPrice !== undefined) data.promotionPrice = service.promotionPrice;
  if (service.categoryId !== undefined) data.categoryId = service.categoryId;
  if (service.colorService !== undefined) data.colorService = service.colorService;
  if (service.hidden_for_client !== undefined) data.hidden_for_client = service.hidden_for_client;
  if (service.featured !== undefined) data.featured = service.featured;
  if (service.people !== undefined) data.people = service.people;
  if (service.priority !== undefined) data.priority = service.priority;
  if (service.pictureUrl !== undefined) data.pictureUrl = service.pictureUrl;
  if (service.loyaltyPoint !== undefined) data.loyaltyPoint = service.loyaltyPoint;
  if (service.serviceOptions !== undefined) data.serviceOptions = service.serviceOptions;
  if (service.serviceAddons !== undefined) data.serviceAddons = service.serviceAddons;
  
  return data;
}

/**
 * Convert Firestore document to ServiceCategory
 */
export function fromFirestoreServiceCategory(doc: DocumentSnapshot): ServiceCategory | null {
  if (!doc.exists) return null;
  
  const data = doc.data();
  if (!data) return null;
  
  return {
    id: doc.id,
    categoryName: data.categoryName ?? '',
    title: data.title as TranslatedText,
    Description: data.Description,
    color: data.color,
    priority: data.priority,
  };
}

/**
 * Convert ServiceCategory to Firestore document data
 */
export function toFirestoreServiceCategory(category: Partial<ServiceCategory>): DocumentData {
  const data: DocumentData = {};
  
  if (category.categoryName !== undefined) data.categoryName = category.categoryName;
  if (category.title !== undefined) data.title = category.title;
  if (category.Description !== undefined) data.Description = category.Description;
  if (category.color !== undefined) data.color = category.color;
  if (category.priority !== undefined) data.priority = category.priority;
  
  return data;
}

// Helper functions for arrays

function fromFirestoreServiceOptions(data: any[]): ServiceOption[] | undefined {
  if (!data || !Array.isArray(data)) return undefined;
  
  return data.map(opt => ({
    id: opt.id ?? '',
    name: opt.name ?? '',
    duration: opt.duration ?? 0,
    durationText: opt.durationText ?? '',
    price: opt.price ?? 0,
    promotionPrice: opt.promotionPrice,
  }));
}

function fromFirestoreServiceAddons(data: any[]): ServiceAddOn[] | undefined {
  if (!data || !Array.isArray(data)) return undefined;
  
  return data.map(addon => ({
    id: addon.id ?? '',
    name: addon.name as TranslatedText ?? {},
    description: addon.description as TranslatedText,
    duration: addon.duration ?? 0,
    durationText: addon.durationText ?? '',
    price: addon.price ?? 0,
    promotionPrice: addon.promotionPrice,
    maxQuantity: addon.maxQuantity,
    quantity: addon.quantity ?? 0,
  }));
}

