import React, { useContext, useEffect, useState, useCallback, useRef, memo, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    FlatList,
    ScrollView,
    Dimensions,
    StatusBar,
    RefreshControl,
    Animated,
    ActivityIndicator,
    Linking,
    Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NoUserContext, UserContext, goToScreen, primaryColor, setAppLang, traductor, getShopTypeLabel, bottomTarSpace } from '../AGTools';
import { AuthContext } from '../Login';
import { firestore } from '../../firebase.config';
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    getDoc,
    doc,
} from '@react-native-firebase/firestore';

// ============ CONSTANTS ============
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const GALLERY_HEIGHT = 267;
const SERVICE_CARD_HEIGHT = 104;
const TEAM_AVATAR_SIZE = 52;
const REVIEW_BOX_SIZE = 131;

// Images
const appIcon = require("../img/logo/defaultImg.png");
const locationIcon = require("../img/btn/icons_Location.png");
const promoIcon = require("../img/promo.png");
const googleLogo = require("../img/social/google.png");
const seeuLogo = require("../img/logo/logo.png");

// ============ DAYS OF WEEK ============
const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// ============ TRANSLATIONS ============
const translations = {
    availablePromoCode: { en: "Available promo code", fr: "Code promo disponible", th: "รหัสโปรโมชั่นที่ใช้ได้" },
    services: { en: "Services", fr: "Services", th: "บริการ" },
    team: { en: "Team", fr: "Équipe", th: "ทีม" },
    reviews: { en: "Reviews", fr: "Avis", th: "รีวิว" },
    about: { en: "About", fr: "À propos", th: "เกี่ยวกับ" },
    open: { en: "Open", fr: "Ouvert", th: "เปิด" },
    closed: { en: "Closed", fr: "Fermé", th: "ปิด" },
    until: { en: "until", fr: "jusqu'à", th: "จนถึง" },
    readMore: { en: "Read more", fr: "Lire plus", th: "อ่านเพิ่มเติม" },
    continue: { en: "Continue", fr: "Continuer", th: "ดำเนินการต่อ" },
    noMin: { en: "No min.", fr: "Pas de minimum", th: "ไม่มีขั้นต่ำ" },
    off: { en: "off", fr: "de réduction", th: "ส่วนลด" },
    monday: { en: "Monday", fr: "Lundi", th: "จันทร์" },
    tuesday: { en: "Tuesday", fr: "Mardi", th: "อังคาร" },
    wednesday: { en: "Wednesday", fr: "Mercredi", th: "พุธ" },
    thursday: { en: "Thursday", fr: "Jeudi", th: "พฤหัสบดี" },
    friday: { en: "Friday", fr: "Vendredi", th: "ศุกร์" },
    saturday: { en: "Saturday", fr: "Samedi", th: "เสาร์" },
    sunday: { en: "Sunday", fr: "Dimanche", th: "อาทิตย์" },
    close: { en: "Close", fr: "Fermé", th: "ปิด" },
    min: { en: "min", fr: "min", th: "นาที" },
    selectMember: { en: "Select a staff member", fr: "Choisir un membre", th: "เลือกพนักงาน" },
};

const t = (key, lang) => translations[key]?.[lang] || translations[key]?.en || key;

// ============ DATA CLASSES / HELPERS ============

/**
 * Transform raw Firestore service data to ServiceType
 * Based on doc: id, name, description, duration, durationText, price, promotionPrice, categoryId, etc.
 */
const transformService = (docSnap, lang) => {
    const data = docSnap.data();
    
    // Get localized title: title_service?[lang].text or name
    const getLocalizedTitle = () => {
        if (data.title_service?.[lang]?.text) return data.title_service[lang].text;
        if (data.title_service?.en?.text) return data.title_service.en.text;
        if (data.title_service?.fr?.text) return data.title_service.fr.text;
        return data.name || "";
    };
    
    // Get localized description: description_service?[lang].text or description
    const getLocalizedDescription = () => {
        if (data.description_service?.[lang]?.text) return data.description_service[lang].text;
        if (data.description_service?.en?.text) return data.description_service.en.text;
        if (data.description?.[lang]) return data.description[lang];
        if (typeof data.description === 'string') return data.description;
        return "";
    };
    
    // Format duration text
    const formatDuration = (minutes) => {
        if (!minutes) return "";
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
        }
        return `${minutes} min`;
    };
    
    return {
        id: docSnap.id,
        name: getLocalizedTitle(),
        description: getLocalizedDescription(),
        duration: data.duration || 0,
        durationText: data.durationText || formatDuration(data.duration),
        price: data.price || 0,
        promotionPrice: data.promotionPrice || null,
        isPromotion: data.promotionPrice && data.promotionPrice < data.price,
        categoryId: data.categoryId || null,
        categoryName: data.categoryName || null,
        priority: data.priority || 0,
        people: data.people || 1,
        pictureUrl: data.pictureUrl || data.image || null,
        loyaltyPoint: data.loyaltyPoint || 0,
        featured: data.featured || false,
        // Service options (add-ons)
        serviceOptions: data.serviceOptions || [],
        serviceAddons: data.serviceAddons || [],
    };
};

/**
 * Transform raw Firestore category data to CategoryType
 * Based on doc: id, categoryName, color, Description, priority, title?[lang].text
 */
const transformCategory = (data, lang) => {
    // Get localized title
    const getLocalizedTitle = () => {
        if (data.title?.[lang]?.text) return data.title[lang].text;
        if (data.title?.en?.text) return data.title.en.text;
        return data.categoryName || data.name || "";
    };
    
    return {
        id: data.id || data.categoryId,
        name: getLocalizedTitle(),
        categoryName: data.categoryName || "",
        color: data.color || primaryColor,
        description: data.Description || "",
        priority: data.priority || 0,
    };
};

/**
 * Transform raw Firestore team member data to TeamMemberType
 * Based on doc: id, first_name/last_name, email, phone, picture, role, etc.
 */
const transformTeamMember = (docSnap) => {
    const data = docSnap.data();
    
    // Get full name
    const getFullName = () => {
        if (data.first_name && data.last_name) return `${data.first_name} ${data.last_name}`;
        if (data.firstName && data.lastName) return `${data.firstName} ${data.lastName}`;
        if (data.name) return data.name;
        if (data.first_name) return data.first_name;
        if (data.firstName) return data.firstName;
        return "";
    };
    
    return {
        id: docSnap.id,
        name: getFullName(),
        firstName: data.first_name || data.firstName || "",
        lastName: data.last_name || data.lastName || "",
        email: data.email || null,
        phone: data.phone || null,
        picture: data.picture || data.photo || data.image || null,
        role: data.role || data.specialty || data.position || "",
        // Availability data (if needed for booking)
        availability: data.availability || null,
    };
};

/**
 * Format opening hours from array pairs to display string
 * Input: ["09:00","18:00","19:00","22:00"] → "09:00 - 18:00 • 19:00 - 22:00"
 * Empty or undefined → "Closed"
 */
const formatOpeningHours = (hoursArray) => {
    if (!hoursArray || !Array.isArray(hoursArray) || hoursArray.length === 0) {
        return null; // Closed
    }
    
    const pairs = [];
    for (let i = 0; i < hoursArray.length; i += 2) {
        if (hoursArray[i] && hoursArray[i + 1]) {
            pairs.push(`${hoursArray[i]} - ${hoursArray[i + 1]}`);
        }
    }
    
    return pairs.length > 0 ? pairs.join(' • ') : null;
};

/**
 * Check if shop is currently open based on opening hours
 * Returns: { isOpen: boolean, endTime: string | null, nextDayName: string | null, startTime: string | null }
 */
const isCurrentlyOpen = (shopData) => {
    if (!shopData) return { isOpen: false, endTime: null };
    
    const now = new Date();
    const currentDayIndex = now.getDay(); // 0 = Sunday
    const currentDay = DAYS_OF_WEEK[currentDayIndex];
    const hoursArray = shopData[currentDay];
    
    if (!hoursArray || !Array.isArray(hoursArray) || hoursArray.length === 0) {
        return { isOpen: false, endTime: null };
    }
    
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    // Check each time pair
    for (let i = 0; i < hoursArray.length; i += 2) {
        const startStr = hoursArray[i];
        const endStr = hoursArray[i + 1];
        
        if (startStr && endStr) {
            const [startH, startM] = startStr.split(':').map(Number);
            const [endH, endM] = endStr.split(':').map(Number);
            
            const startMinutes = startH * 60 + (startM || 0);
            const endMinutes = endH * 60 + (endM || 0);
            
            if (currentTimeInMinutes >= startMinutes && currentTimeInMinutes <= endMinutes) {
                return { isOpen: true, endTime: endStr, startTime: startStr };
            }
        }
    }
    
    return { isOpen: false, endTime: null };
};

/**
 * Get opening hours for all days with formatted display
 */
const getOpeningHoursDisplay = (shopData, lang) => {
    return DAYS_ORDER.map(day => ({
        day,
        dayName: t(day, lang),
        hours: formatOpeningHours(shopData?.[day]),
        isClosed: !shopData?.[day] || shopData[day].length === 0,
    }));
};

/**
 * Filter categories that have at least one service
 */
const filterCategoriesHasServices = (categories, services) => {
    const categoryIdsWithServices = new Set(services.map(s => s.categoryId).filter(Boolean));
    return categories.filter(cat => categoryIdsWithServices.has(cat.id));
};

/**
 * Extract settingCalendar from shop data
 * Based on doc: interval_minutes, timeZone, displaySelectMember, hideAtVenue, deposit_enabled, etc.
 */
const extractSettingCalendar = (shopData) => {
    const settings = shopData?.settingCalendar || {};
    
    return {
        intervalMinutes: settings.interval_minutes || 30,
        timeZone: settings.timeZone || 'Asia/Bangkok',
        advancedNotice: settings.advancedNotice || 0,
        depositEnabled: settings.deposit_enabled || false,
        depositPercentage: settings.deposit_percentage || 0,
        depositDiscountAmount: settings.deposit_discount_amount || 0,
        depositRefundDeadlineHours: settings.deposit_refund_deadline_hours || 24,
        displaySelectMember: settings.displaySelectMember || false,
        forceMemberSelection: settings.forceMemberSelection || false,
        displaySelectMemberAutoOpen: settings.displaySelectMemberAutoOpen || false,
        hideAtVenue: settings.hideAtVenue || false,
        priceRange: settings.priceRange || null,
        sendBookingEmailToMember: settings.sendBookingEmailToMember || false,
        sendBookingEmailToSpecificEmail: settings.sendBookingEmailToSpecificEmail || false,
        emailNewBooking: settings.emailNewBooking || null,
    };
};

// ============ MEMOIZED COMPONENTS ============

// Back Button Component
const BackButton = memo(({ onPress }) => (
    <TouchableOpacity style={styles.backButton} onPress={onPress}>
        <View style={styles.backButtonCircle}>
            <View style={styles.chevronLeft} />
        </View>
    </TouchableOpacity>
));

// Gallery Counter Badge
const GalleryCounter = memo(({ current, total }) => (
    <View style={styles.galleryCounter}>
        <Text style={styles.galleryCounterText}>{current}/{total}</Text>
    </View>
));

// Star Rating Component
const StarRating = memo(({ rating, size = 8 }) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
        stars.push(
            <Text key={i} style={[styles.starIcon, { fontSize: size, color: i < fullStars || (i === fullStars && hasHalf) ? "#FFD700" : "#D9D9D9" }]}>
                ★
            </Text>
        );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
});

// Promo Code Card Component
const PromoCodeCard = memo(({ promo, currency, onPress }) => {
    const valueText = promo.type === 1 
        ? `${promo.value}% off` 
        : `${currency}${promo.value} off`;
    
    return (
        <TouchableOpacity style={styles.promoCard} onPress={() => onPress?.(promo)} activeOpacity={0.9}>
            <View style={styles.promoCardHeader}>
                <Image source={promoIcon} style={styles.promoCardIcon} resizeMode="contain" />
                <Text style={styles.promoCardValue}>{valueText}</Text>
            </View>
            <Text style={styles.promoCardCondition}>{promo.minOrder ? `Min. ${currency}${promo.minOrder}` : "No min."}</Text>
        </TouchableOpacity>
    );
});

// Service Category Tab Component
const CategoryTab = memo(({ category, isActive, onPress }) => (
    <TouchableOpacity 
        style={[styles.categoryTab, isActive && styles.categoryTabActive]} 
        onPress={() => onPress(category)}
        activeOpacity={0.8}
    >
        <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>{category.name}</Text>
    </TouchableOpacity>
));

// Service Card Component
const ServiceCard = memo(({ service, currency, isInCart, onAdd, onRemove, defaultIcon, lang }) => {
    return (
        <View style={styles.serviceCard}>
            <Image 
                source={{ uri: service.pictureUrl || defaultIcon }} 
                style={styles.serviceImage} 
                resizeMode="cover"
            />
            <View style={styles.serviceInfo}>
                <Text style={styles.serviceName} numberOfLines={1}>{service.name}</Text>
                <Text style={styles.serviceDescription} numberOfLines={2}>{service.description}</Text>
                <View style={styles.serviceFooter}>
                    <View style={styles.servicePriceContainer}>
                        {service.isPromotion ? (
                            <>
                                <Text style={styles.serviceOriginalPrice}>{currency} {service.price}</Text>
                                <Text style={styles.servicePromoPrice}>{currency} {service.promotionPrice}</Text>
                            </>
                        ) : (
                            <Text style={styles.servicePrice}>{currency} {service.price}</Text>
                        )}
                        {service.durationText && (
                            <Text style={styles.serviceDuration}> • {service.durationText}</Text>
                        )}
                    </View>
                    <TouchableOpacity 
                        style={[styles.addButton, isInCart && styles.addButtonActive]}
                        onPress={() => isInCart ? onRemove(service) : onAdd(service)}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.addButtonText, isInCart && styles.addButtonTextActive]}>
                            {isInCart ? "−" : "+"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
});

// Team Member Component
const TeamMember = memo(({ member, defaultIcon, onPress, isSelectable }) => (
    <TouchableOpacity 
        style={styles.teamMember} 
        onPress={() => onPress?.(member)}
        disabled={!isSelectable}
        activeOpacity={isSelectable ? 0.7 : 1}
    >
        <Image 
            source={{ uri: member.picture || defaultIcon }} 
            style={styles.teamAvatar} 
            resizeMode="cover"
        />
        <Text style={styles.teamName} numberOfLines={1}>{member.name}</Text>
        <Text style={styles.teamRole} numberOfLines={1}>{member.role}</Text>
    </TouchableOpacity>
));

// Review Platform Box Component
const ReviewPlatformBox = memo(({ platform, rating, reviewCount, isActive, onPress, logo }) => (
    <TouchableOpacity 
        style={[styles.reviewPlatformBox, isActive && styles.reviewPlatformBoxActive]} 
        onPress={onPress}
        activeOpacity={0.9}
    >
        <Image source={logo} style={styles.reviewPlatformLogo} resizeMode="contain" />
        <View style={styles.reviewPlatformRating}>
            <Text style={styles.reviewPlatformScore}>{rating?.toFixed(1) || "0.0"}</Text>
            <StarRating rating={rating || 0} size={11} />
        </View>
        <Text style={styles.reviewPlatformCount}>{reviewCount || 0} reviews</Text>
    </TouchableOpacity>
));

// Review Card Component
const ReviewCard = memo(({ review, defaultIcon }) => {
    const initial = (review.author_name || review.authorName)?.charAt(0)?.toUpperCase() || "U";
    const authorName = review.author_name || review.authorName || "User";
    const reviewText = review.text || "";
    const reviewRating = review.rating || 5;
    const relativeTime = review.relative_time_description || review.relativeTime || "";
    
    return (
        <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
                <View style={styles.reviewAuthorSection}>
                    <View style={styles.reviewAvatar}>
                        <Text style={styles.reviewAvatarText}>{initial}</Text>
                    </View>
                    <View style={styles.reviewAuthorInfo}>
                        <Text style={styles.reviewAuthorName}>{authorName}</Text>
                        <View style={styles.reviewRatingRow}>
                            <StarRating rating={reviewRating} size={7} />
                            <Text style={styles.reviewDate}>{relativeTime}</Text>
                        </View>
                    </View>
                </View>
                <Image source={googleLogo} style={styles.reviewPlatformIcon} resizeMode="contain" />
            </View>
            {reviewText.length > 0 && (
                <View style={styles.reviewContent}>
                    <Text style={styles.reviewText} numberOfLines={3}>{reviewText}</Text>
                    {reviewText.length > 150 && (
                        <Text style={styles.reviewReadMore}>Read more</Text>
                    )}
                </View>
            )}
        </View>
    );
});

// Opening Hours Row Component
const OpeningHoursRow = memo(({ dayData, isToday }) => {
    return (
        <View style={styles.hoursRow}>
            <View style={styles.hoursDay}>
                <View style={[styles.hoursDot, dayData.isClosed ? styles.hoursDotClosed : styles.hoursDotOpen]} />
                <Text style={[styles.hoursDayText, isToday && styles.hoursDayTextToday]}>
                    {dayData.dayName}
                </Text>
            </View>
            <Text style={[styles.hoursTime, isToday && styles.hoursTimeToday, dayData.isClosed && styles.hoursTimeClosed]}>
                {dayData.isClosed ? t('close', 'en') : dayData.hours}
            </Text>
        </View>
    );
});

// Skeleton Components
const GallerySkeleton = memo(() => (
    <View style={[styles.galleryContainer, styles.skeleton]} />
));

const ServiceSkeleton = memo(() => (
    <View style={[styles.serviceCard, styles.skeleton, { height: SERVICE_CARD_HEIGHT }]} />
));

// ============ MAIN COMPONENT ============
export default function Venue({ navigation, route }) {
    const authContext = useContext(AuthContext);
    const { user, noUserlocation } = useContext(authContext?.user ? UserContext : NoUserContext);
    const mountedRef = useRef(true);
    const galleryScrollRef = useRef(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    // Route params
    const shopId = route?.params?.shopId;
    const bookingId = route?.params?.booking_id;

    // ============ STATE ============
    // Shop data
    const [shopData, setShopData] = useState(null);
    const [settingCalendar, setSettingCalendar] = useState(null);
    
    // Services & Categories
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    
    // Team
    const [team, setTeam] = useState([]);
    const [selectedTeamMember, setSelectedTeamMember] = useState(null);
    
    // Promo codes
    const [promoCodes, setPromoCodes] = useState([]);
    
    // Reviews
    const [reviews, setReviews] = useState([]);
    const [showGoogleReviews, setShowGoogleReviews] = useState(true);
    
    // Opening hours
    const [openingHours, setOpeningHours] = useState([]);
    const [openStatus, setOpenStatus] = useState(null);
    
    // Cart
    const [cart, setCart] = useState([]);
    
    // Gallery
    const [currentGalleryIndex, setCurrentGalleryIndex] = useState(1);
    
    // Loading states
    const [loadingShop, setLoadingShop] = useState(true);
    const [loadingServices, setLoadingServices] = useState(true);
    const [loadingTeam, setLoadingTeam] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const insets = useSafeAreaInsets();
    const lang = setAppLang();
    const defaultIcon = Image.resolveAssetSource(appIcon).uri;

    // ============ DERIVED VALUES ============
    const currency = useMemo(() => shopData?.currency?.text || "THB", [shopData]);
    
    const galleryImages = useMemo(() => {
        if (!shopData) return [];
        const gallery = shopData.GalleryPictureShop || [];
        if (Array.isArray(gallery) && gallery.length > 0) return gallery;
        if (shopData.cover_Shop_Img) return [shopData.cover_Shop_Img];
        if (shopData.logo_Shop_Img) return [shopData.logo_Shop_Img];
        return [defaultIcon];
    }, [shopData, defaultIcon]);

    const filteredServices = useMemo(() => {
        if (!selectedCategory) return services;
        return services.filter(s => s.categoryId === selectedCategory.id);
    }, [services, selectedCategory]);

    const cartItemIds = useMemo(() => cart.map(item => item.id), [cart]);
    const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.promotionPrice || item.price), 0), [cart]);
    
    // Check if team selection should be shown (from settingCalendar)
    const shouldShowTeamSelection = useMemo(() => {
        return settingCalendar?.displaySelectMember && team.length > 0;
    }, [settingCalendar, team]);
    
    // Today's day name for highlighting
    const todayDay = useMemo(() => DAYS_OF_WEEK[new Date().getDay()], []);

    // ============ FETCH FUNCTIONS ============
    const fetchShopData = useCallback(async () => {
        if (!shopId && !bookingId) return;
        setLoadingShop(true);
        
        try {
            let shopDoc = null;
            let shopDocId = null;
            
            if (shopId) {
                const shopRef = doc(firestore, "Shops", shopId);
                const docSnapshot = await getDoc(shopRef);
                if (docSnapshot.exists) {
                    shopDoc = docSnapshot.data();
                    shopDocId = docSnapshot.id;
                }
            } else if (bookingId) {
                const shopsRef = collection(firestore, "Shops");
                const q = query(shopsRef, where("booking_id", "==", bookingId), limit(1));
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const docSnap = snapshot.docs[0];
                    shopDoc = docSnap.data();
                    shopDocId = docSnap.id;
                }
            }
            
            if (shopDoc && shopDocId && mountedRef.current) {
                const fullShopData = { id: shopDocId, ...shopDoc };
                setShopData(fullShopData);
                
                // Extract settingCalendar
                setSettingCalendar(extractSettingCalendar(shopDoc));
                
                // Calculate open status
                setOpenStatus(isCurrentlyOpen(shopDoc));
                
                // Get opening hours display
                setOpeningHours(getOpeningHoursDisplay(shopDoc, lang));
                
                // Extract promo codes
                if (shopDoc.promoCodes && Array.isArray(shopDoc.promoCodes)) {
                    setPromoCodes(shopDoc.promoCodes);
                } else if (shopDoc.promotion?.promoCode) {
                    setPromoCodes([{
                        code: shopDoc.promotion.promoCode,
                        type: shopDoc.promotion.type,
                        value: shopDoc.promotion.value,
                        minOrder: shopDoc.promotion.minOrder || 0,
                    }]);
                }
                
                // Extract Google reviews
                if (shopDoc.google_infos?.reviews && Array.isArray(shopDoc.google_infos.reviews)) {
                    setReviews(shopDoc.google_infos.reviews.slice(0, 5));
                }
            }
        } catch (error) {
            console.error("Error fetching shop data:", error);
        } finally {
            if (mountedRef.current) setLoadingShop(false);
        }
    }, [shopId, bookingId, lang]);

    const fetchServices = useCallback(async () => {
        if (!shopId && !shopData?.id) return;
        setLoadingServices(true);
        
        try {
            const targetShopId = shopId || shopData?.id;
            const servicesRef = collection(firestore, "Shops", targetShopId, "Services");
            const q = query(servicesRef, orderBy("priority", "asc"));
            const snapshot = await getDocs(q);
            
            // Transform services
            const servicesData = snapshot.docs.map(docSnap => transformService(docSnap, lang));
            
            if (mountedRef.current) {
                setServices(servicesData);
                
                // Extract and transform categories from services
                const uniqueCategories = [];
                const categoryIds = new Set();
                
                servicesData.forEach(service => {
                    if (service.categoryId && !categoryIds.has(service.categoryId)) {
                        categoryIds.add(service.categoryId);
                        uniqueCategories.push(transformCategory({
                            id: service.categoryId,
                            categoryName: service.categoryName,
                        }, lang));
                    }
                });
                
                // Sort categories by priority
                uniqueCategories.sort((a, b) => a.priority - b.priority);
                
                // Filter to only show categories with services
                const filteredCategories = filterCategoriesHasServices(uniqueCategories, servicesData);
                setCategories(filteredCategories);
                
                // Select first category by default
                if (filteredCategories.length > 0) {
                    setSelectedCategory(filteredCategories[0]);
                }
            }
        } catch (error) {
            console.error("Error fetching services:", error);
        } finally {
            if (mountedRef.current) setLoadingServices(false);
        }
    }, [shopId, shopData?.id, lang]);

    const fetchTeam = useCallback(async () => {
        if (!shopId && !shopData?.id) return;
        setLoadingTeam(true);
        
        try {
            const targetShopId = shopId || shopData?.id;
            const teamRef = collection(firestore, "Shops", targetShopId, "Teams");
            const snapshot = await getDocs(teamRef);
            
            // Transform team members
            const teamData = snapshot.docs.map(docSnap => transformTeamMember(docSnap));
            
            if (mountedRef.current) {
                setTeam(teamData);
            }
        } catch (error) {
            console.error("Error fetching team:", error);
        } finally {
            if (mountedRef.current) setLoadingTeam(false);
        }
    }, [shopId, shopData?.id]);

    const addRecentlyViewed = useCallback(async () => {
        if (!shopId && !shopData?.id) return;
        
        try {
            const targetShopId = shopId || shopData?.id;
            const recentKey = "recentlyViewedShops";
            const stored = await AsyncStorage.getItem(recentKey);
            let recentIds = stored ? JSON.parse(stored) : [];
            
            recentIds = recentIds.filter(id => id !== targetShopId);
            recentIds.unshift(targetShopId);
            recentIds = recentIds.slice(0, 10);
            
            await AsyncStorage.setItem(recentKey, JSON.stringify(recentIds));
        } catch (error) {
            console.error("Error saving recently viewed:", error);
        }
    }, [shopId, shopData?.id]);

    // ============ HANDLERS ============
    const onPressBack = useCallback(() => {
        goToScreen(navigation, "goBack");
    }, [navigation]);

    const onAddToCart = useCallback((service) => {
        setCart(prev => [...prev, service]);
    }, []);

    const onRemoveFromCart = useCallback((service) => {
        setCart(prev => prev.filter(item => item.id !== service.id));
    }, []);

    const onSelectTeamMember = useCallback((member) => {
        setSelectedTeamMember(prev => prev?.id === member.id ? null : member);
    }, []);

    const onPressContinue = useCallback(() => {
        if (cart.length === 0) return;
        
        goToScreen(navigation, "Booking", { 
            shopId: shopId || shopData?.id, 
            services: cart,
            shopData: shopData,
            selectedMember: selectedTeamMember,
            settingCalendar: settingCalendar,
        });
    }, [navigation, shopId, shopData, cart, selectedTeamMember, settingCalendar]);

    const onPressLocation = useCallback(() => {
        if (!shopData?.address) return;
        const url = Platform.select({
            ios: `maps:0,0?q=${shopData.address}`,
            android: `geo:0,0?q=${shopData.address}`,
        });
        Linking.openURL(url);
    }, [shopData?.address]);

    const onGalleryScroll = useCallback((event) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / SCREEN_WIDTH) + 1;
        setCurrentGalleryIndex(index);
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([fetchShopData(), fetchServices(), fetchTeam()]);
        if (mountedRef.current) setRefreshing(false);
    }, [fetchShopData, fetchServices, fetchTeam]);

    // ============ EFFECTS ============
    useEffect(() => {
        mountedRef.current = true;
        fetchShopData();
        return () => { mountedRef.current = false; };
    }, [fetchShopData]);

    useEffect(() => {
        if (shopData?.id || shopId) {
            fetchServices();
            fetchTeam();
            addRecentlyViewed();
        }
    }, [shopData?.id, shopId, fetchServices, fetchTeam, addRecentlyViewed]);

    // ============ RENDER GALLERY ============
    const renderGallery = () => {
        if (loadingShop) return <GallerySkeleton />;
        
        return (
            <View style={styles.galleryContainer}>
                <FlatList
                    ref={galleryScrollRef}
                    data={galleryImages}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={onGalleryScroll}
                    scrollEventThrottle={16}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={({ item }) => (
                        <Image source={{ uri: item }} style={styles.galleryImage} resizeMode="cover" />
                    )}
                    getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
                />
                <BackButton onPress={onPressBack} />
                {galleryImages.length > 1 && (
                    <GalleryCounter current={currentGalleryIndex} total={galleryImages.length} />
                )}
            </View>
        );
    };

    // ============ RENDER SHOP INFO ============
    const renderShopInfo = () => {
        if (!shopData) return null;
        
        const rating = shopData.google_infos?.rating || shopData.rating || 0;
        const reviewCount = shopData.google_infos?.user_ratings_total || shopData.reviewCount || 0;
        
        return (
            <View style={styles.shopInfoContainer}>
                <Text style={styles.shopName}>{shopData.shopName}</Text>
                <View style={styles.shopDetails}>
                    <View style={styles.ratingRow}>
                        <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                        <StarRating rating={rating} size={8} />
                        <Text style={styles.reviewCountText}>({reviewCount} Reviews)</Text>
                    </View>
                    {openStatus && (
                        <Text style={styles.openStatusText}>
                            <Text style={openStatus.isOpen ? styles.openText : styles.closedText}>
                                {openStatus.isOpen ? t('open', lang) : t('closed', lang)}
                            </Text>
                            {openStatus.isOpen && openStatus.endTime && (
                                <Text style={styles.untilText}> {t('until', lang)} {openStatus.endTime}</Text>
                            )}
                        </Text>
                    )}
                    <TouchableOpacity style={styles.locationRow} onPress={onPressLocation}>
                        <Image source={locationIcon} style={styles.locationIcon} resizeMode="contain" />
                        <Text style={styles.locationText} numberOfLines={1}>
                            {shopData.neighborhood || shopData.city || shopData.address}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // ============ RENDER PROMO CODES ============
    const renderPromoCodes = () => {
        if (promoCodes.length === 0) return null;
        
        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('availablePromoCode', lang)}</Text>
                <FlatList
                    data={promoCodes}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.promoList}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={({ item }) => (
                        <PromoCodeCard promo={item} currency={currency} />
                    )}
                />
            </View>
        );
    };

    // ============ RENDER SERVICES ============
    const renderServices = () => {
        return (
            <View style={styles.section}>
                <View style={styles.servicesHeader}>
                    <Text style={styles.sectionTitle}>{t('services', lang)}</Text>
                    {categories.length > 1 && (
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.categoriesScroll}
                        >
                            {categories.map(cat => (
                                <CategoryTab 
                                    key={cat.id}
                                    category={cat}
                                    isActive={selectedCategory?.id === cat.id}
                                    onPress={setSelectedCategory}
                                />
                            ))}
                        </ScrollView>
                    )}
                </View>
                
                {selectedCategory && categories.length > 1 && (
                    <Text style={styles.categoryTitle}>{selectedCategory.name}</Text>
                )}
                
                {loadingServices ? (
                    <>
                        <ServiceSkeleton />
                        <ServiceSkeleton />
                    </>
                ) : (
                    filteredServices.map(service => (
                        <ServiceCard
                            key={service.id}
                            service={service}
                            currency={currency}
                            isInCart={cartItemIds.includes(service.id)}
                            onAdd={onAddToCart}
                            onRemove={onRemoveFromCart}
                            defaultIcon={defaultIcon}
                            lang={lang}
                        />
                    ))
                )}
            </View>
        );
    };

    // ============ RENDER TEAM ============
    const renderTeam = () => {
        if (loadingTeam || team.length === 0) return null;
        
        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('team', lang)}</Text>
                {shouldShowTeamSelection && (
                    <Text style={styles.teamSubtitle}>{t('selectMember', lang)}</Text>
                )}
                <FlatList
                    data={team}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.teamList}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TeamMember 
                            member={item} 
                            defaultIcon={defaultIcon}
                            onPress={shouldShowTeamSelection ? onSelectTeamMember : null}
                            isSelectable={shouldShowTeamSelection}
                        />
                    )}
                />
            </View>
        );
    };

    // ============ RENDER REVIEWS ============
    const renderReviews = () => {
        const googleRating = shopData?.google_infos?.rating || 0;
        const googleCount = shopData?.google_infos?.user_ratings_total || 0;
        const seeuRating = shopData?.seeuRating || 0;
        const seeuCount = shopData?.seeuReviewCount || 0;
        
        const hasGoogleReviews = (googleRating > 0 || googleCount > 0);
        const hasSeeUReviews = (seeuRating > 0 || seeuCount > 0);
        const hasReviewsList = reviews && reviews.length > 0;
        
        if (!hasGoogleReviews && !hasSeeUReviews && !hasReviewsList) {
            return null;
        }
        
        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('reviews', lang)}</Text>
                
                {(hasGoogleReviews || hasSeeUReviews) && (
                    <View style={styles.reviewPlatforms}>
                        {hasGoogleReviews && (
                            <ReviewPlatformBox 
                                platform="google"
                                rating={googleRating}
                                reviewCount={googleCount}
                                isActive={showGoogleReviews}
                                onPress={() => setShowGoogleReviews(true)}
                                logo={googleLogo}
                            />
                        )}
                        {hasSeeUReviews && (
                            <ReviewPlatformBox 
                                platform="seeu"
                                rating={seeuRating}
                                reviewCount={seeuCount}
                                isActive={!showGoogleReviews}
                                onPress={() => setShowGoogleReviews(false)}
                                logo={seeuLogo}
                            />
                        )}
                    </View>
                )}
                
                {hasReviewsList && reviews.map((review, index) => (
                    <ReviewCard key={index} review={review} defaultIcon={defaultIcon} />
                ))}
            </View>
        );
    };

    // ============ RENDER ABOUT ============
    const renderAbout = () => {
        if (!shopData) return null;
        
        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('about', lang)} {shopData.shopName}</Text>
                {shopData.description && (
                    <Text style={styles.aboutText}>{shopData.description}</Text>
                )}
                
                {/* Opening Hours */}
                {openingHours.length > 0 && (
                    <View style={styles.hoursSection}>
                        <View style={styles.hoursHeader}>
                            <Text style={[styles.openStatusIndicator, openStatus?.isOpen ? styles.openText : styles.closedText]}>
                                {openStatus?.isOpen ? t('open', lang) : t('closed', lang)}
                            </Text>
                            {openStatus?.endTime && (
                                <Text style={styles.hoursHeaderTime}> {openingHours.find(h => h.day === todayDay)?.hours}</Text>
                            )}
                        </View>
                        
                        {openingHours.map(dayData => (
                            <OpeningHoursRow 
                                key={dayData.day}
                                dayData={dayData}
                                isToday={dayData.day === todayDay}
                            />
                        ))}
                    </View>
                )}
                
                {/* Address & Map */}
                {shopData.address && (
                    <View style={styles.addressSection}>
                        <TouchableOpacity style={styles.addressRow} onPress={onPressLocation}>
                            <Image source={locationIcon} style={styles.addressIcon} resizeMode="contain" />
                            <Text style={styles.addressText}>{shopData.address}</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.mapContainer} onPress={onPressLocation}>
                            <View style={styles.mapPlaceholder}>
                                <Text style={styles.mapPlaceholderText}>📍 Tap to open in Maps</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    // ============ RENDER BOTTOM BAR ============
    const renderBottomBar = () => {
        return (
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
                <View style={styles.bottomBarContent}>
                    <TouchableOpacity style={styles.cartButton} activeOpacity={0.9}>
                        <View style={styles.cartIconContainer}>
                            <Text style={styles.cartIcon}>🛒</Text>
                        </View>
                        {cart.length > 0 && (
                            <View style={styles.cartBadge}>
                                <Text style={styles.cartBadgeText}>{cart.length}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.continueButton, cart.length === 0 && styles.continueButtonDisabled]}
                        onPress={onPressContinue}
                        activeOpacity={0.9}
                        disabled={cart.length === 0}
                    >
                        <Text style={styles.continueButtonText}>{t('continue', lang)}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // ============ MAIN RENDER ============
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />
                }
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {renderGallery()}
                {renderShopInfo()}
                {renderPromoCodes()}
                {renderServices()}
                {renderTeam()}
                {renderReviews()}
                {renderAbout()}
            </ScrollView>
            
            {renderBottomBar()}
        </View>
    );
}

// ============ STYLES ============
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    scrollView: {
        flex: 1,
    },
    skeleton: {
        backgroundColor: "#E8E8E8",
    },
    
    // Gallery
    galleryContainer: {
        width: SCREEN_WIDTH,
        height: GALLERY_HEIGHT,
        position: "relative",
    },
    galleryImage: {
        width: SCREEN_WIDTH,
        height: GALLERY_HEIGHT,
    },
    backButton: {
        position: "absolute",
        top: 50,
        left: 20,
        zIndex: 10,
    },
    backButtonCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: "rgba(255,255,255,0.9)",
        justifyContent: "center",
        alignItems: "center",
    },
    chevronLeft: {
        width: 8,
        height: 8,
        borderLeftWidth: 2,
        borderBottomWidth: 2,
        borderColor: "#000000",
        transform: [{ rotate: "45deg" }],
        marginLeft: 3,
    },
    galleryCounter: {
        position: "absolute",
        bottom: 10,
        right: 20,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#D9D9D9",
        borderRadius: 9,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    galleryCounterText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#000000",
    },
    
    // Shop Info
    shopInfoContainer: {
        padding: 20,
        gap: 10,
    },
    shopName: {
        fontSize: 20,
        fontWeight: "600",
        color: "#000000",
    },
    shopDetails: {
        gap: 8,
    },
    ratingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    starsContainer: {
        flexDirection: "row",
        gap: 2,
    },
    starIcon: {
        color: "#FFD700",
    },
    ratingText: {
        fontSize: 12,
        fontWeight: "500",
        color: "#000000",
    },
    reviewCountText: {
        fontSize: 12,
        fontWeight: "500",
        color: "#000000",
    },
    openStatusText: {
        fontSize: 12,
        fontWeight: "500",
    },
    openText: {
        color: "#2DA755",
        fontWeight: "600",
    },
    closedText: {
        color: "#FF4444",
        fontWeight: "600",
    },
    untilText: {
        color: "#000000",
        fontWeight: "500",
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    locationIcon: {
        width: 9,
        height: 10,
        tintColor: "#000000",
    },
    locationText: {
        fontSize: 12,
        fontWeight: "500",
        color: "#000000",
        textDecorationLine: "underline",
    },
    
    // Section
    section: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        gap: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#000000",
    },
    
    // Promo Codes
    promoList: {
        gap: 10,
    },
    promoCard: {
        backgroundColor: "#FFFFFF",
        borderWidth: 0.87,
        borderColor: "#D9D9D9",
        borderRadius: 11,
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 8,
        minWidth: 120,
    },
    promoCardHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    promoCardIcon: {
        width: 23,
        height: 12,
        tintColor: primaryColor,
    },
    promoCardValue: {
        fontSize: 14,
        fontWeight: "500",
        color: primaryColor,
    },
    promoCardCondition: {
        fontSize: 12,
        fontWeight: "500",
        color: "#000000",
    },
    
    // Services
    servicesHeader: {
        gap: 13,
    },
    categoriesScroll: {
        gap: 9,
    },
    categoryTab: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#D9D9D9",
        borderRadius: 15,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    categoryTabActive: {
        backgroundColor: primaryColor,
        borderColor: primaryColor,
    },
    categoryTabText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#000000",
    },
    categoryTabTextActive: {
        color: "#FFFFFF",
    },
    categoryTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#000000",
        marginTop: 10,
    },
    serviceCard: {
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        borderWidth: 0.89,
        borderColor: "#D9D9D9",
        borderRadius: 7,
        padding: 12,
        gap: 11,
        minHeight: SERVICE_CARD_HEIGHT,
    },
    serviceImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    serviceInfo: {
        flex: 1,
        justifyContent: "center",
        gap: 6,
    },
    serviceName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#000000",
    },
    serviceDescription: {
        fontSize: 10,
        fontWeight: "500",
        color: "#000000",
    },
    serviceFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    servicePriceContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    servicePrice: {
        fontSize: 12,
        fontWeight: "600",
        color: "#000000",
    },
    serviceOriginalPrice: {
        fontSize: 12,
        fontWeight: "500",
        color: "#747676",
        textDecorationLine: "line-through",
    },
    servicePromoPrice: {
        fontSize: 12,
        fontWeight: "600",
        color: primaryColor,
    },
    serviceDuration: {
        fontSize: 10,
        fontWeight: "500",
        color: "#747676",
    },
    addButton: {
        width: 27,
        height: 27,
        borderRadius: 7,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#D9D9D9",
        justifyContent: "center",
        alignItems: "center",
    },
    addButtonActive: {
        backgroundColor: primaryColor,
        borderColor: primaryColor,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#000000",
    },
    addButtonTextActive: {
        color: "#FFFFFF",
    },
    
    // Team
    teamList: {
        gap: 10,
    },
    teamSubtitle: {
        fontSize: 12,
        fontWeight: "500",
        color: "#747676",
    },
    teamMember: {
        alignItems: "center",
        gap: 10,
        width: 70,
    },
    teamAvatar: {
        width: TEAM_AVATAR_SIZE,
        height: TEAM_AVATAR_SIZE,
        borderRadius: TEAM_AVATAR_SIZE / 2,
    },
    teamName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#000000",
        textAlign: "center",
    },
    teamRole: {
        fontSize: 11,
        fontWeight: "500",
        color: "#000000",
        textAlign: "center",
    },
    
    // Reviews
    reviewPlatforms: {
        flexDirection: "row",
        gap: 11,
    },
    reviewPlatformBox: {
        width: REVIEW_BOX_SIZE,
        height: REVIEW_BOX_SIZE,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#D9D9D9",
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        padding: 9,
        gap: 10,
    },
    reviewPlatformBoxActive: {
        borderColor: primaryColor,
    },
    reviewPlatformLogo: {
        width: 42,
        height: 42,
    },
    reviewPlatformRating: {
        alignItems: "center",
        gap: 5,
    },
    reviewPlatformScore: {
        fontSize: 16,
        fontWeight: "500",
        color: "#000000",
    },
    reviewPlatformCount: {
        fontSize: 16,
        fontWeight: "500",
        color: "#000000",
    },
    reviewCard: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#D9D9D9",
        borderRadius: 15,
        padding: 20,
        gap: 15,
    },
    reviewHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    reviewAuthorSection: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    reviewAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: primaryColor,
        justifyContent: "center",
        alignItems: "center",
    },
    reviewAvatarText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    reviewAuthorInfo: {
        gap: 2,
    },
    reviewAuthorName: {
        fontSize: 10,
        fontWeight: "600",
        color: "#5E98FF",
    },
    reviewRatingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    reviewDate: {
        fontSize: 8,
        fontWeight: "500",
        color: "#000000",
    },
    reviewPlatformIcon: {
        width: 20,
        height: 20,
    },
    reviewContent: {
        gap: 5,
    },
    reviewText: {
        fontSize: 8,
        fontWeight: "500",
        color: "#000000",
        lineHeight: 12,
    },
    reviewReadMore: {
        fontSize: 10,
        fontWeight: "500",
        color: "#5E98FF",
    },
    
    // About
    aboutText: {
        fontSize: 12,
        fontWeight: "500",
        color: "#000000",
        lineHeight: 18,
    },
    hoursSection: {
        marginTop: 10,
        gap: 10,
    },
    hoursHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    openStatusIndicator: {
        fontSize: 12,
        fontWeight: "600",
    },
    hoursHeaderTime: {
        fontSize: 12,
        fontWeight: "500",
        color: "#000000",
    },
    hoursRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    hoursDay: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    hoursDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    hoursDotOpen: {
        backgroundColor: "#2DA755",
    },
    hoursDotClosed: {
        backgroundColor: "#FF4444",
    },
    hoursDayText: {
        fontSize: 12,
        fontWeight: "500",
        color: "#000000",
    },
    hoursDayTextToday: {
        fontWeight: "600",
    },
    hoursTime: {
        fontSize: 12,
        fontWeight: "500",
        color: "#000000",
        textAlign: "right",
    },
    hoursTimeToday: {
        fontWeight: "600",
    },
    hoursTimeClosed: {
        color: "#FF4444",
    },
    addressSection: {
        marginTop: 10,
        gap: 10,
    },
    addressRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    addressIcon: {
        width: 11,
        height: 13,
        tintColor: "#000000",
    },
    addressText: {
        fontSize: 12,
        fontWeight: "500",
        color: "#000000",
        textDecorationLine: "underline",
        flex: 1,
    },
    mapContainer: {
        height: 215,
        borderRadius: 9,
        overflow: "hidden",
    },
    mapPlaceholder: {
        flex: 1,
        backgroundColor: "#E8E8E8",
        justifyContent: "center",
        alignItems: "center",
    },
    mapPlaceholderText: {
        fontSize: 14,
        color: "#747676",
    },
    
    // Bottom Bar
    bottomBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 0.87,
        borderTopColor: "#D9D9D9",
        paddingHorizontal: 24,
        paddingTop: 9,
    },
    bottomBarContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 15,
    },
    cartButton: {
        width: 57,
        height: 44,
        backgroundColor: "#FFFFFF",
        borderWidth: 1.3,
        borderColor: primaryColor,
        borderRadius: 13,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    cartIconContainer: {
        width: 30,
        height: 30,
        justifyContent: "center",
        alignItems: "center",
    },
    cartIcon: {
        fontSize: 20,
    },
    cartBadge: {
        position: "absolute",
        top: -5,
        right: -5,
        width: 21,
        height: 21,
        borderRadius: 11,
        backgroundColor: primaryColor,
        justifyContent: "center",
        alignItems: "center",
    },
    cartBadgeText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#FFFFFF",
    },
    continueButton: {
        flex: 1,
        height: 44,
        backgroundColor: primaryColor,
        borderRadius: 13,
        justifyContent: "center",
        alignItems: "center",
    },
    continueButtonDisabled: {
        opacity: 0.5,
    },
    continueButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#FFFFFF",
    },
});
