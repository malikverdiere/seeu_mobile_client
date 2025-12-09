/**
 * Client Firestore mappers
 */

import { DocumentSnapshot, DocumentData } from '../firebase';
import { Client, RegisteredShop, ClientPackage, PackageServiceSummary } from '../../types/client.types';
import { TranslatedText } from '../../types/common.types';

/**
 * Convert Firestore document to Client
 */
export function fromFirestoreClient(doc: DocumentSnapshot): Client | null {
  if (!doc.exists) return null;
  
  const data = doc.data();
  if (!data) return null;
  
  return {
    userId: doc.id,
    email: data.email ?? '',
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    phoneNumberCountry: data.phoneNumberCountry,
    user_img: data.user_img,
    user_img_Valid: data.user_img_Valid,
    user_lang: data.user_lang,
    creatAt: data.creatAt,
    from: data.from ?? '',
    marketingConsent: data.marketingConsent,
    termsAccepted: data.termsAccepted,
  };
}

/**
 * Convert Client to Firestore document data
 */
export function toFirestoreClient(client: Partial<Client>): DocumentData {
  const data: DocumentData = {};
  
  if (client.email !== undefined) data.email = client.email;
  if (client.firstName !== undefined) data.firstName = client.firstName;
  if (client.lastName !== undefined) data.lastName = client.lastName;
  if (client.phone !== undefined) data.phone = client.phone;
  if (client.phoneNumberCountry !== undefined) data.phoneNumberCountry = client.phoneNumberCountry;
  if (client.user_img !== undefined) data.user_img = client.user_img;
  if (client.user_img_Valid !== undefined) data.user_img_Valid = client.user_img_Valid;
  if (client.user_lang !== undefined) data.user_lang = client.user_lang;
  if (client.from !== undefined) data.from = client.from;
  if (client.marketingConsent !== undefined) data.marketingConsent = client.marketingConsent;
  if (client.termsAccepted !== undefined) data.termsAccepted = client.termsAccepted;
  
  return data;
}

/**
 * Convert Firestore document to RegisteredShop
 */
export function fromFirestoreRegisteredShop(doc: DocumentSnapshot): RegisteredShop | null {
  if (!doc.exists) return null;
  
  const data = doc.data();
  if (!data) return null;
  
  return {
    shopId: data.shopId ?? '',
    clientId: data.clientId ?? '',
    createAt: data.createAt,
    lastVisit: data.lastVisit,
    points: data.points,
    nbVisit: data.nbVisit,
    clientNum: data.clientNum,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
  };
}

/**
 * Convert RegisteredShop to Firestore document data
 */
export function toFirestoreRegisteredShop(registration: Partial<RegisteredShop>): DocumentData {
  const data: DocumentData = {};
  
  if (registration.shopId !== undefined) data.shopId = registration.shopId;
  if (registration.clientId !== undefined) data.clientId = registration.clientId;
  if (registration.createAt !== undefined) data.createAt = registration.createAt;
  if (registration.lastVisit !== undefined) data.lastVisit = registration.lastVisit;
  if (registration.points !== undefined) data.points = registration.points;
  if (registration.nbVisit !== undefined) data.nbVisit = registration.nbVisit;
  if (registration.clientNum !== undefined) data.clientNum = registration.clientNum;
  if (registration.firstName !== undefined) data.firstName = registration.firstName;
  if (registration.lastName !== undefined) data.lastName = registration.lastName;
  if (registration.email !== undefined) data.email = registration.email;
  if (registration.phone !== undefined) data.phone = registration.phone;
  
  return data;
}

/**
 * Convert Firestore document to ClientPackage
 */
export function fromFirestoreClientPackage(doc: DocumentSnapshot): ClientPackage | null {
  if (!doc.exists) return null;
  
  const data = doc.data();
  if (!data) return null;
  
  return {
    id: doc.id,
    shopId: data.shopId ?? '',
    isValid: data.isValid ?? false,
    name: data.name as TranslatedText ?? {},
    serviceSummary: fromFirestoreServiceSummary(data.serviceSummary),
  };
}

/**
 * Convert ClientPackage to Firestore document data
 */
export function toFirestoreClientPackage(pkg: Partial<ClientPackage>): DocumentData {
  const data: DocumentData = {};
  
  if (pkg.shopId !== undefined) data.shopId = pkg.shopId;
  if (pkg.isValid !== undefined) data.isValid = pkg.isValid;
  if (pkg.name !== undefined) data.name = pkg.name;
  if (pkg.serviceSummary !== undefined) data.serviceSummary = pkg.serviceSummary;
  
  return data;
}

// Helper functions

function fromFirestoreServiceSummary(data: any[]): PackageServiceSummary[] {
  if (!data || !Array.isArray(data)) return [];
  
  return data.map(item => ({
    serviceId: item.serviceId ?? '',
    quantity: item.quantity ?? 0,
  }));
}

