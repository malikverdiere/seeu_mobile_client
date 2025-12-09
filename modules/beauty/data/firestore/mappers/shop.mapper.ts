/**
 * Shop Firestore mappers
 * Converts between Firestore documents and Shop types
 */

import { DocumentSnapshot, DocumentData, timestampToDate } from '../firebase';
import { Shop, SettingCalendar, ShopWithDistance } from '../../types/shop.types';
import {
  Coordinate,
  Currency,
  ShopType,
  GoogleInfos,
  Highlight,
  Promotion,
  AboutUs,
  SeoMeta,
  DaySchedule,
} from '../../types/common.types';

/**
 * Convert Firestore document to Shop
 */
export function fromFirestoreShop(doc: DocumentSnapshot): Shop | null {
  if (!doc.exists) return null;
  
  const data = doc.data();
  if (!data) return null;
  
  return {
    id: doc.id,
    shopName: data.shopName ?? '',
    booking_id: data.booking_id ?? '',
    shopValid: data.shopValid ?? false,
    address: data.address ?? '',
    neighborhood: data.neighborhood,
    city: data.city ?? '',
    country: data.country ?? '',
    country_short: data.country_short,
    postalCode: data.postalCode,
    email: data.email ?? '',
    phone_number: data.phone_number,
    coordinate: fromFirestoreCoordinate(data.coordinate),
    GalleryPictureShop: data.GalleryPictureShop ?? [],
    galleryVideoShop: data.galleryVideoShop ?? [],
    currency: fromFirestoreCurrency(data.currency),
    shopType: fromFirestoreShopType(data.shopType),
    shop_type: data.shop_type ?? [],
    shopRating: data.shopRating,
    shopRatingNumber: data.shopRatingNumber,
    google_infos: fromFirestoreGoogleInfos(data.google_infos),
    about_us: data.about_us as AboutUs,
    seo_meta: data.seo_meta as SeoMeta,
    monday: data.monday as DaySchedule,
    tuesday: data.tuesday as DaySchedule,
    wednesday: data.wednesday as DaySchedule,
    thursday: data.thursday as DaySchedule,
    friday: data.friday as DaySchedule,
    saturday: data.saturday as DaySchedule,
    sunday: data.sunday as DaySchedule,
    stripeConnectId: data.stripeConnectId,
    userId: data.userId ?? '',
    adPosition: data.adPosition,
    promoLabel: data.promoLabel,
    highlight: fromFirestoreHighlight(data.highlight),
    promotion: fromFirestorePromotion(data.promotion),
    settingCalendar: fromFirestoreSettingCalendar(data.settingCalendar),
  };
}

/**
 * Convert Shop to Firestore document data
 */
export function toFirestoreShop(shop: Partial<Shop>): DocumentData {
  const data: DocumentData = {};
  
  if (shop.shopName !== undefined) data.shopName = shop.shopName;
  if (shop.booking_id !== undefined) data.booking_id = shop.booking_id;
  if (shop.shopValid !== undefined) data.shopValid = shop.shopValid;
  if (shop.address !== undefined) data.address = shop.address;
  if (shop.neighborhood !== undefined) data.neighborhood = shop.neighborhood;
  if (shop.city !== undefined) data.city = shop.city;
  if (shop.country !== undefined) data.country = shop.country;
  if (shop.country_short !== undefined) data.country_short = shop.country_short;
  if (shop.postalCode !== undefined) data.postalCode = shop.postalCode;
  if (shop.email !== undefined) data.email = shop.email;
  if (shop.phone_number !== undefined) data.phone_number = shop.phone_number;
  if (shop.coordinate !== undefined) data.coordinate = toFirestoreCoordinate(shop.coordinate);
  if (shop.GalleryPictureShop !== undefined) data.GalleryPictureShop = shop.GalleryPictureShop;
  if (shop.galleryVideoShop !== undefined) data.galleryVideoShop = shop.galleryVideoShop;
  if (shop.currency !== undefined) data.currency = toFirestoreCurrency(shop.currency);
  if (shop.shopType !== undefined) data.shopType = toFirestoreShopType(shop.shopType);
  if (shop.shop_type !== undefined) data.shop_type = shop.shop_type;
  if (shop.shopRating !== undefined) data.shopRating = shop.shopRating;
  if (shop.shopRatingNumber !== undefined) data.shopRatingNumber = shop.shopRatingNumber;
  if (shop.google_infos !== undefined) data.google_infos = shop.google_infos;
  if (shop.about_us !== undefined) data.about_us = shop.about_us;
  if (shop.seo_meta !== undefined) data.seo_meta = shop.seo_meta;
  if (shop.monday !== undefined) data.monday = shop.monday;
  if (shop.tuesday !== undefined) data.tuesday = shop.tuesday;
  if (shop.wednesday !== undefined) data.wednesday = shop.wednesday;
  if (shop.thursday !== undefined) data.thursday = shop.thursday;
  if (shop.friday !== undefined) data.friday = shop.friday;
  if (shop.saturday !== undefined) data.saturday = shop.saturday;
  if (shop.sunday !== undefined) data.sunday = shop.sunday;
  if (shop.stripeConnectId !== undefined) data.stripeConnectId = shop.stripeConnectId;
  if (shop.userId !== undefined) data.userId = shop.userId;
  if (shop.adPosition !== undefined) data.adPosition = shop.adPosition;
  if (shop.promoLabel !== undefined) data.promoLabel = shop.promoLabel;
  if (shop.highlight !== undefined) data.highlight = shop.highlight;
  if (shop.promotion !== undefined) data.promotion = shop.promotion;
  if (shop.settingCalendar !== undefined) data.settingCalendar = toFirestoreSettingCalendar(shop.settingCalendar);
  
  return data;
}

// Helper mappers for sub-objects

function fromFirestoreCoordinate(data: any): Coordinate {
  return {
    latitude: data?.latitude ?? 0,
    longitude: data?.longitude ?? 0,
    geohash: data?.geohash ?? '',
  };
}

function toFirestoreCoordinate(coord: Coordinate): DocumentData {
  return {
    latitude: coord.latitude,
    longitude: coord.longitude,
    geohash: coord.geohash,
  };
}

function fromFirestoreCurrency(data: any): Currency {
  return {
    id: data?.id ?? 0,
    text: data?.text ?? '',
    name: data?.name ?? '',
  };
}

function toFirestoreCurrency(currency: Currency): DocumentData {
  return {
    id: currency.id,
    text: currency.text,
    name: currency.name,
  };
}

function fromFirestoreShopType(data: any): ShopType {
  return {
    id: data?.id ?? '',
    type: data?.type ?? 0,
    en: data?.en,
    fr: data?.fr,
    th: data?.th,
  };
}

function toFirestoreShopType(shopType: ShopType): DocumentData {
  return {
    id: shopType.id,
    type: shopType.type,
    en: shopType.en,
    fr: shopType.fr,
    th: shopType.th,
  };
}

function fromFirestoreGoogleInfos(data: any): GoogleInfos | undefined {
  if (!data) return undefined;
  return {
    rating: data.rating,
    user_ratings_total: data.user_ratings_total,
    businessType: data.businessType,
  };
}

function fromFirestoreHighlight(data: any): Highlight | undefined {
  if (!data) return undefined;
  return {
    isActive: data.isActive ?? false,
    type: data.type,
  };
}

function fromFirestorePromotion(data: any): Promotion | undefined {
  if (!data) return undefined;
  return {
    doubleDay: data.doubleDay,
    code: data.code,
    newClient: data.newClient,
  };
}

function fromFirestoreSettingCalendar(data: any): SettingCalendar {
  return {
    interval_minutes: data?.interval_minutes ?? 30,
    timeZone: data?.timeZone ?? 'UTC',
    advancedNotice: data?.advancedNotice ?? 0,
    maxBookingPeriod: data?.maxBookingPeriod ?? 30,
    deposit_enabled: data?.deposit_enabled,
    deposit_percentage: data?.deposit_percentage,
    deposit_discount_amount: data?.deposit_discount_amount,
    deposit_refund_deadline_hours: data?.deposit_refund_deadline_hours,
    hideAtVenue: data?.hideAtVenue,
    autoConfirmed: data?.autoConfirmed,
    displaySelectMember: data?.displaySelectMember,
    displaySelectMemberAutoOpen: data?.displaySelectMemberAutoOpen,
    forceMemberSelection: data?.forceMemberSelection,
    sendBookingEmailToMember: data?.sendBookingEmailToMember,
    sendBookingEmailToSpecificEmail: data?.sendBookingEmailToSpecificEmail,
    emailNewBooking: data?.emailNewBooking,
    priceRange: data?.priceRange,
  };
}

function toFirestoreSettingCalendar(setting: SettingCalendar): DocumentData {
  return {
    interval_minutes: setting.interval_minutes,
    timeZone: setting.timeZone,
    advancedNotice: setting.advancedNotice,
    maxBookingPeriod: setting.maxBookingPeriod,
    deposit_enabled: setting.deposit_enabled,
    deposit_percentage: setting.deposit_percentage,
    deposit_discount_amount: setting.deposit_discount_amount,
    deposit_refund_deadline_hours: setting.deposit_refund_deadline_hours,
    hideAtVenue: setting.hideAtVenue,
    autoConfirmed: setting.autoConfirmed,
    displaySelectMember: setting.displaySelectMember,
    displaySelectMemberAutoOpen: setting.displaySelectMemberAutoOpen,
    forceMemberSelection: setting.forceMemberSelection,
    sendBookingEmailToMember: setting.sendBookingEmailToMember,
    sendBookingEmailToSpecificEmail: setting.sendBookingEmailToSpecificEmail,
    emailNewBooking: setting.emailNewBooking,
    priceRange: setting.priceRange,
  };
}

