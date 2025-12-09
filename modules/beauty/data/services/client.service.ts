/**
 * Client Service - Data Access Layer
 */

import {
  collection,
  doc,
  query,
  where,
  getDocs,
  getDoc,
} from '@react-native-firebase/firestore';
import { firestore, COLLECTIONS } from '../firestore/firebase';
import { 
  fromFirestoreClient, 
  fromFirestoreRegisteredShop,
  fromFirestoreClientPackage,
} from '../firestore/mappers/client.mapper';
import { 
  Client, 
  RegisteredShop, 
  ClientPackage 
} from '../types/client.types';

/**
 * Get client by user ID
 */
export async function getClientById(userId: string): Promise<Client | null> {
  const clientRef = doc(firestore, COLLECTIONS.CLIENTS, userId);
  const snapshot = await getDoc(clientRef);
  return fromFirestoreClient(snapshot);
}

/**
 * Get client's registered shops
 */
export async function getClientRegisteredShops(userId: string): Promise<RegisteredShop[]> {
  const registeredShopsRef = collection(
    firestore,
    COLLECTIONS.CLIENTS,
    userId,
    COLLECTIONS.REGISTERED_SHOPS
  );
  
  const snapshot = await getDocs(registeredShopsRef);
  
  return snapshot.docs
    .map(doc => fromFirestoreRegisteredShop(doc))
    .filter((reg): reg is RegisteredShop => reg !== null);
}

/**
 * Get client's registration for a specific shop
 */
export async function getClientRegistrationForShop(
  userId: string,
  shopId: string
): Promise<RegisteredShop | null> {
  const registeredShopsRef = collection(
    firestore,
    COLLECTIONS.CLIENTS,
    userId,
    COLLECTIONS.REGISTERED_SHOPS
  );
  
  const q = query(registeredShopsRef, where('shopId', '==', shopId));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  return fromFirestoreRegisteredShop(snapshot.docs[0]);
}

/**
 * Check if client is registered with a shop
 */
export async function isClientRegisteredWithShop(
  userId: string,
  shopId: string
): Promise<boolean> {
  const registration = await getClientRegistrationForShop(userId, shopId);
  return registration !== null;
}

/**
 * Get client's packages
 */
export async function getClientPackages(userId: string): Promise<ClientPackage[]> {
  const packagesRef = collection(
    firestore,
    COLLECTIONS.CLIENTS,
    userId,
    COLLECTIONS.CLIENT_PACKAGES
  );
  
  const snapshot = await getDocs(packagesRef);
  
  return snapshot.docs
    .map(doc => fromFirestoreClientPackage(doc))
    .filter((pkg): pkg is ClientPackage => pkg !== null);
}

/**
 * Get client's valid packages for a specific shop
 */
export async function getClientValidPackagesForShop(
  userId: string,
  shopId: string
): Promise<ClientPackage[]> {
  const packagesRef = collection(
    firestore,
    COLLECTIONS.CLIENTS,
    userId,
    COLLECTIONS.CLIENT_PACKAGES
  );
  
  const q = query(
    packagesRef,
    where('shopId', '==', shopId),
    where('isValid', '==', true)
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs
    .map(doc => fromFirestoreClientPackage(doc))
    .filter((pkg): pkg is ClientPackage => pkg !== null);
}

/**
 * Check if client is a new client for a shop (never booked before)
 * Used for new client promos
 */
export async function isNewClientForShop(
  userId: string,
  shopId: string
): Promise<boolean> {
  const registration = await getClientRegistrationForShop(userId, shopId);
  
  if (!registration) return true;
  
  // If registered but never visited, still considered new
  return (registration.nbVisit ?? 0) === 0;
}

