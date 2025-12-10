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
    ActivityIndicator,
    Animated,
    Linking,
    Modal,
    Platform,
    PermissionsAndroid,
    Alert,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NoUserContext, UserContext, goToScreen, primaryColor, setAppLang, traductor, getShopTypeLabel, shopTypes, shopCategoryType, bottomTarSpace } from '../AGTools';
import { AuthContext } from '../Login';
import { firestore } from '../../firebase.config';
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    startAfter,
    doc,
    updateDoc,
    increment,
    Timestamp,
} from '@react-native-firebase/firestore';

// ============ CONSTANTS ============
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BANNER_WIDTH = SCREEN_WIDTH - 40;
const BANNER_HEIGHT = 183;
const PAGE_SIZE = 10;

// Images
const appIcon = require("../img/logo/defaultImg.png");
const searchIcon = require("../img/search.png");
const locationIcon = require("../img/btn/location.png");
const promoIcon = require("../img/ticket.png");

// Beauty categories (type: 1)
const BEAUTY_CATEGORIES = shopTypes.filter(s => s.type === 1 && s.id !== "0-default");

// ============ TRANSLATIONS ============
const translations = {
    allServices: { fr: "Tous les services", en: "All services", th: "บริการทั้งหมด" },
    shopsNearby: { fr: "commerces à proximité", en: "shops nearby", th: "ร้านค้าใกล้เคียง" },
    nearMe: { fr: "Près de moi", en: "Near me", th: "ใกล้ฉัน" },
    havePromoCode: { fr: "Code promo", en: "Have promo code", th: "มีรหัสโปรโมชั่น" },
    sales: { fr: "soldes", en: "sales", th: "ลดราคา" },
    loading: { fr: "Chargement...", en: "Loading...", th: "กำลังโหลด..." },
    loadMore: { fr: "Charger plus...", en: "Load more...", th: "โหลดเพิ่ม..." },
    allLoaded: { fr: "Tous les commerces ont été chargés", en: "All shops have been loaded", th: "โหลดร้านค้าทั้งหมดแล้ว" },
    noShop: { fr: "Aucun commerce trouvé", en: "No shop found", th: "ไม่พบร้านค้า" },
    from: { fr: "À partir de", en: "From", th: "จาก" },
    makeAppointment: { fr: "Prendre rendez-vous", en: "Make an appointment", th: "นัดหมาย" },
    selectService: { fr: "Sélectionner un service", en: "Select a service", th: "เลือกบริการ" },
};

const t = (key, lang) => translations[key]?.[lang] || translations[key]?.en || key;

// ============ FILTER CHIP COMPONENT ============
const FilterChip = memo(({ label, icon, isActive, onPress }) => (
    <TouchableOpacity
        style={[styles.filterChip, isActive && styles.filterChipActive]}
        onPress={onPress}
        activeOpacity={0.8}
    >
        {icon && <Image source={icon} style={[styles.filterIcon, isActive && styles.filterIconActive]} resizeMode="contain" />}
        <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{label}</Text>
    </TouchableOpacity>
));

// ============ SERVICE CARD COMPONENT ============
const ServiceCard = memo(({ service, currency, lang }) => {
    const durationText = service.durationText || (service.duration ? `${Math.floor(service.duration / 60)}h${service.duration % 60 > 0 ? (service.duration % 60) : ''}` : '');
    const hasPromo = service.promoPrice && service.promoPrice < service.price;
    
    // Get service name with language fallback
    const serviceName = service.title_service?.[lang]?.text 
        || service.title_service?.en?.text 
        || service.title_service?.fr?.text 
        || service.title_service?.th?.text
        || service.name || "";

    return (
        <View style={styles.serviceCard}>
            <Text style={styles.serviceName} numberOfLines={1}>{serviceName}</Text>
            <View style={styles.serviceRow}>
                <Text style={styles.serviceDuration}>{durationText}</Text>
                <View style={styles.priceContainer}>
                    {hasPromo ? (
                        <>
                            <Text style={styles.originalPrice}>{t('from', lang)} {currency} {service.price}</Text>
                            <Text style={styles.promoPrice}>{service.promoPrice} {currency}</Text>
                        </>
                    ) : (
                        <Text style={styles.servicePrice}>{currency} {service.price}</Text>
                    )}
                </View>
            </View>
        </View>
    );
});

// ============ SHOP SEARCH CARD COMPONENT ============
const ShopSearchCard = memo(({ shop, onPress, onPressBook, defaultIcon, lang, userLocation }) => {
    const shopTypeLabel = getShopTypeLabel(shop.shopTypeId, lang) || "Beauty";
    
    // Calculate distance if user location available
    const distanceText = useMemo(() => {
        if (!userLocation?.lat || !shop.lat) return null;
        const R = 6371; // km
        const dLat = (shop.lat - userLocation.lat) * Math.PI / 180;
        const dLon = (shop.lng - userLocation.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(shop.lat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const d = R * c;
        return d < 0.1 ? '<0.1 km' : `${d.toFixed(1)} km`;
    }, [userLocation, shop.lat, shop.lng]);

    return (
        <View style={styles.shopCard}>
            {/* Image Container */}
            <TouchableOpacity onPress={() => onPress(shop)} activeOpacity={0.9}>
                <View style={styles.shopImageContainer}>
                    <Image
                        source={{ uri: shop.galleryImage || defaultIcon }}
                        style={styles.shopImage}
                        resizeMode="cover"
                    />
                    {shop.promoLabel && (
                        <View style={styles.promoBadge}>
                            <Image source={promoIcon} style={styles.promoIconBadge} resizeMode="contain" />
                            <Text style={styles.promoBadgeText} numberOfLines={1}>{shop.promoLabel}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>

            {/* Info Container */}
            <View style={styles.shopInfoContainer}>
                {/* Header: Name + Rating */}
                <View style={styles.shopHeader}>
                    <Text style={styles.shopName} numberOfLines={1}>{shop.shopName}</Text>
                    <View style={styles.ratingContainer}>
                        <Text style={styles.starIcon}>★</Text>
                        <Text style={styles.ratingText}>{shop.rating?.toFixed(1) || "0.0"}</Text>
                        <Text style={styles.reviewsText}>({shop.totalReviews || 0})</Text>
                    </View>
                </View>

                {/* Location */}
                <View style={styles.locationRow}>
                    <Image source={locationIcon} style={styles.locationIcon} resizeMode="contain" />
                    <Text style={styles.locationText} numberOfLines={1}>{shop.neighborhood}</Text>
                    {distanceText && (
                        <>
                            <View style={styles.dot} />
                            <Text style={styles.distanceText}>{distanceText}</Text>
                        </>
                    )}
                </View>

                {/* Featured Services */}
                {shop.featuredServices?.length > 0 && (
                    <View style={styles.servicesContainer}>
                        {shop.featuredServices.slice(0, 2).map((service, idx) => (
                            <ServiceCard key={service.id || idx} service={service} currency={shop.currency} lang={lang} />
                        ))}
                    </View>
                )}

                {/* Book Button */}
                <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => onPressBook(shop)}
                    activeOpacity={0.9}
                >
                    <Text style={styles.bookButtonText}>{t('makeAppointment', lang)}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});

// ============ SKELETON COMPONENTS ============
const ShopCardSkeleton = memo(() => (
    <View style={styles.shopCard}>
        <View style={[styles.shopImageContainer, styles.skeleton]} />
        <View style={styles.shopInfoContainer}>
            <View style={[styles.skeletonLine, { width: '60%', height: 20 }]} />
            <View style={[styles.skeletonLine, { width: '40%', height: 14, marginTop: 8 }]} />
            <View style={[styles.skeletonLine, { width: '100%', height: 50, marginTop: 12, borderRadius: 14 }]} />
            <View style={[styles.skeletonLine, { width: '100%', height: 50, marginTop: 8, borderRadius: 14 }]} />
            <View style={[styles.skeletonLine, { width: '100%', height: 48, marginTop: 16, borderRadius: 17 }]} />
        </View>
    </View>
));

const BannerSkeleton = memo(() => (
    <View style={styles.bannerWrapper}>
        <View style={[styles.bannerImage, styles.skeleton]} />
    </View>
));

// ============ CATEGORY DROPDOWN ITEM ============
const CategoryItem = memo(({ item, isSelected, onPress, lang }) => {
    const label = lang === "th" ? (item.textTh || item.text) 
        : lang === "fr" ? item.text 
        : (item.textEn || item.text);
    
    return (
        <TouchableOpacity 
            style={[styles.categoryItem, isSelected && styles.categoryItemSelected]} 
            onPress={() => onPress(item)}
            activeOpacity={0.8}
        >
            <Text style={[styles.categoryItemText, isSelected && styles.categoryItemTextSelected]}>
                {label}
            </Text>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
    );
});

// ============ MAIN COMPONENT ============
export default function BeautySearch({ navigation, route }) {
    const authContext = useContext(AuthContext);
    const { user, noUserlocation } = useContext(authContext.user ? UserContext : NoUserContext);
    const mountedRef = useRef(true);
    const scrollX = useRef(new Animated.Value(0)).current;
    const lastDocRef = useRef(null);
    const cacheRef = useRef({}); // Cache en mémoire

    // States
    const [shops, setShops] = useState([]);
    const [banners, setBanners] = useState([]);
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loadingBanners, setLoadingBanners] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    
    // Initialize selectedCategory from route params if provided
    const categoryFromRoute = route?.params?.category;
    const initialCategory = useMemo(() => {
        if (categoryFromRoute && categoryFromRoute !== 'beauty') {
            return BEAUTY_CATEGORIES.find(cat => cat.id === categoryFromRoute) || null;
        }
        return null;
    }, [categoryFromRoute]);
    
    const [selectedCategory, setSelectedCategory] = useState(initialCategory); // null = All services
    
    // Filters - nearMe disabled by default
    const [filters, setFilters] = useState({
        nearMe: false,
        hasPromo: false,
        doubleDay: false,
    });
    
    // GPS location state
    const [gpsLocation, setGpsLocation] = useState(null);
    const [loadingLocation, setLoadingLocation] = useState(false);

    const insets = useSafeAreaInsets();
    const lang = setAppLang();
    const defaultIcon = Image.resolveAssetSource(appIcon).uri;
    const category = categoryFromRoute || 'beauty';
    
    // categoryType: use shopTypes.type if category is a subcategory, else use shopCategoryType
    // Ex: "beauty" → shopCategoryType("beauty") = 1
    // Ex: "nail-studio" → shopTypes.find(s => s.id === "nail-studio").type = 1
    const shopTypeInfo = shopTypes.find(s => s.id === category);
    const categoryType = shopTypeInfo?.type || shopCategoryType(category);

    // Current month for sales badge
    const currentMonth = new Date().getMonth() + 1;
    const salesBadge = `🔥 ${currentMonth}.${currentMonth} ${t('sales', lang)}`;

    // User location (from context or GPS)
    const userLocation = useMemo(() => {
        // If nearMe filter is active and we have GPS location, use it
        if (filters.nearMe && gpsLocation) {
            return gpsLocation;
        }
        // Otherwise use location from context
        const loc = user?.docData?.geolocation || noUserlocation;
        return loc ? { lat: loc.lat || loc.latitude, lng: loc.lng || loc.longitude } : null;
    }, [user?.docData?.geolocation, noUserlocation, filters.nearMe, gpsLocation]);

    // Selected category label
    const selectedCategoryLabel = useMemo(() => {
        if (!selectedCategory) return t('allServices', lang);
        return lang === "th" ? (selectedCategory.textTh || selectedCategory.text)
            : lang === "fr" ? selectedCategory.text
            : (selectedCategory.textEn || selectedCategory.text);
    }, [selectedCategory, lang]);

    // ============ FETCH BANNERS ============
    const fetchBanners = useCallback(async () => {
        setLoadingBanners(true);
        try {
            const bannersRef = collection(firestore, "SearchBanners");
            const q = query(
                bannersRef,
                where("category", "==", "beauty"),
                where("isActive", "==", true),
                orderBy("priority", "asc")
            );
            const snapshot = await getDocs(q);
            
            if (mountedRef.current) {
                const bannersData = snapshot.docs.map(docSnap => {
                    const data = docSnap.data();
                    const bannerData = data.banner?.[lang] || data.banner?.en || data.banner?.th || {};
                    return {
                        id: docSnap.id,
                        imageUrl: bannerData.url?.mobile || bannerData.url?.desktop || null,
                        redirectUrl: bannerData.url?.redirect || null,
                        shopId: data.shopId || null,
                    };
                }).filter(b => b.imageUrl);
                
                setBanners(bannersData);
                // Prefetch images
                bannersData.slice(0, 2).forEach(b => b.imageUrl && Image.prefetch(b.imageUrl));
            }
        } catch (error) {
            console.error("Error fetching banners:", error);
        } finally {
            if (mountedRef.current) setLoadingBanners(false);
        }
    }, [lang]);

    // ============ TRACK BANNER CLICK ============
    const trackBannerClick = useCallback(async (bannerId) => {
        try {
            const bannerRef = doc(firestore, "SearchBanners", bannerId);
            await updateDoc(bannerRef, {
                countClick: increment(1),
                lastClick: Timestamp.now(),
            });
        } catch (error) {
            console.error("Error tracking banner click:", error);
        }
    }, []);

    // ============ TRANSFORM FEATURED SERVICE ============
    const transformFeaturedService = useCallback((serviceData) => {
        // Get service name based on language
        const serviceName = serviceData.title_service?.[lang]?.text 
            || serviceData.title_service?.en?.text 
            || serviceData.title_service?.fr?.text 
            || serviceData.title_service?.th?.text
            || serviceData.name || "";
        
        // Get service description based on language
        const serviceDescription = serviceData.description_service?.[lang]?.text 
            || serviceData.description_service?.en?.text 
            || serviceData.description_service?.fr?.text 
            || serviceData.description_service?.th?.text
            || serviceData.description || "";
        
        return {
            id: serviceData.id || "",
            name: serviceData.name || "",
            title_service: serviceData.title_service || {},
            description_service: serviceData.description_service || {},
            description: serviceDescription,
            price: serviceData.price || 0,
            promoPrice: serviceData.promotionPrice || null,
            duration: serviceData.duration || 0,
            durationText: serviceData.durationText || "",
            categoryId: serviceData.categoryId || "",
            colorService: serviceData.colorService || "#000000",
            people: serviceData.people || 0,
            priority: serviceData.priority || 0,
            featured: serviceData.featured || false,
            hidden_for_client: serviceData.hidden_for_client || false,
        };
    }, [lang]);

    // ============ TRANSFORM SHOP DOC ============
    const transformShopDoc = useCallback((docSnap) => {
        const data = docSnap.data();
        const galleryImage = Array.isArray(data.GalleryPictureShop) && data.GalleryPictureShop.length > 0
            ? data.GalleryPictureShop[0]
            : data.cover_Shop_Img || data.logo_Shop_Img || null;

        // Extract featuredServices from shop document
        const featuredServices = Array.isArray(data.featuredServices) 
            ? data.featuredServices
                .filter(service => service && service.id && !service.hidden_for_client)
                .map(transformFeaturedService)
            : [];

        return {
            id: docSnap.id,
            shopName: data.shopName || "",
            galleryImage,
            rating: data.google_infos?.rating || 0,
            totalReviews: data.google_infos?.user_ratings_total || 0,
            neighborhood: data.neighborhood || data.city || "",
            shopTypeId: data.shopType?.id,
            promoLabel: data.promoLabel || null,
            booking_id: data.booking_id || "",
            currency: data.currency?.text || "฿",
            lat: data.coordinate?.lat || data.lat,
            lng: data.coordinate?.lng || data.lng,
            adPosition: data.adPosition || 999,
            _lastRate: data.google_infos?.user_ratings_total || 0,
            featuredServices,
        };
    }, [transformFeaturedService]);

    // ============ FETCH SHOPS (Section 3 + Section 10 Mode RATING) with Cache ============
    const fetchShops = useCallback(async (isLoadMore = false, forceRefresh = false) => {
        // Générer la clé de cache unique basée sur les filtres
        const cacheKey = `${selectedCategory?.id || 'all'}_${filters.hasPromo}_${filters.doubleDay}`;

        // Ne pas utiliser le cache lors de la pagination
        if (!isLoadMore && !forceRefresh) {
            const cachedData = cacheRef.current[cacheKey];
            if (cachedData) {
                // Charger depuis le cache immédiatement
                setShops(cachedData.shops);
                setHasMore(cachedData.hasMore);
                lastDocRef.current = cachedData.lastDoc;
                if (mountedRef.current) {
                    setLoadingInitial(false);
                }
                return;
            }
        }

        if (isLoadMore) {
            setLoadingMore(true);
        } else {
            setLoadingInitial(true);
            lastDocRef.current = null;
        }

        try {
            const shopsRef = collection(firestore, "Shops");
            
            // Contraintes de base (Section 3)
            // Note: booking_id != null filtré côté client (limitation RN Firebase)
            // All services → "all", sinon la catégorie sélectionnée
            const shopTypeFilter = selectedCategory ? selectedCategory.id : "all";
            const constraints = [
                where("shopValid", "==", true),
                where("shopType.type", "==", categoryType),
                where("shop_type", "array-contains", shopTypeFilter),
            ];

            // Filtres optionnels (Section 3)
            if (filters.hasPromo) {
                constraints.push(where("promotion.code", "==", true));
            }
            if (filters.doubleDay) {
                constraints.push(where("promotion.doubleDay", "==", true));
            }

            // Mode RATING (Section 10)
            const rateConstraints = [
                ...constraints,
                orderBy("adPosition", "asc"),
                orderBy("google_infos.user_ratings_total", "desc"),
            ];
            if (isLoadMore && lastDocRef.current) {
                rateConstraints.push(startAfter(lastDocRef.current));
            }
            rateConstraints.push(limit(PAGE_SIZE));

            const snap = await getDocs(query(shopsRef, ...rateConstraints));

            if (!mountedRef.current) return;

            // Transform shops + filter booking_id != null côté client
            // featuredServices are now included in transformShopDoc directly from shop document
            const shops = snap.docs
                .filter(doc => doc.data().booking_id != null)
                .map(transformShopDoc);

            // Update last doc for pagination (this.lastRate = lastVis)
            const lastVis = snap.docs.at(-1) ?? null;
            lastDocRef.current = lastVis;

            // Set state
            if (isLoadMore) {
                setShops(prev => [...prev, ...shops]);
            } else {
                setShops(shops);
                // Mettre en cache seulement lors du chargement initial
                cacheRef.current[cacheKey] = {
                    shops: shops,
                    hasMore: shops.length === PAGE_SIZE,
                    lastDoc: lastVis,
                };
                // Prefetch first images
                shops.slice(0, 3).forEach(s => s.galleryImage && Image.prefetch(s.galleryImage));
            }

            // hasMore = shops.length === limitCount
            setHasMore(shops.length === PAGE_SIZE);
        } catch (error) {
            console.error("Error fetching shops:", error);
        } finally {
            if (mountedRef.current) {
                setLoadingInitial(false);
                setLoadingMore(false);
            }
        }
    }, [categoryType, category, selectedCategory, filters, transformShopDoc]);


    // ============ INITIAL LOAD ============
    useEffect(() => {
        mountedRef.current = true;
        fetchBanners();
        fetchShops();
        return () => { mountedRef.current = false; };
    }, []);

    // Update selectedCategory when route params change
    useEffect(() => {
        if (categoryFromRoute && categoryFromRoute !== 'beauty') {
            const foundCategory = BEAUTY_CATEGORIES.find(cat => cat.id === categoryFromRoute);
            if (foundCategory && foundCategory.id !== selectedCategory?.id) {
                setSelectedCategory(foundCategory);
            }
        } else if (!categoryFromRoute && selectedCategory !== null) {
            // Reset to "All services" if no category in params
            setSelectedCategory(null);
        }
    }, [categoryFromRoute]);

    // ============ FILTER/CATEGORY CHANGE ============
    useEffect(() => {
        // Ne pas refaire l'appel si les données sont déjà en cache (fetchShops vérifie le cache)
        fetchShops(false, false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory, filters]);

    // ============ HANDLERS ============
    const onPressBack = useCallback(() => navigation.goBack(), [navigation]);

    const onPressShop = useCallback((shop) => {
        goToScreen(navigation, "Venue", { shopId: shop.id, booking_id: shop.booking_id });
    }, [navigation]);

    const onPressBook = useCallback((shop) => {
        goToScreen(navigation, "Venue", { shopId: shop.id, booking_id: shop.booking_id, openBooking: true });
    }, [navigation]);

    const onPressBanner = useCallback((banner) => {
        trackBannerClick(banner.id);
        if (banner.shopId) {
            goToScreen(navigation, "Venue", { shopId: banner.shopId });
        } else if (banner.redirectUrl) {
            Linking.openURL(banner.redirectUrl);
        }
    }, [navigation, trackBannerClick]);

    // Request location permission and get GPS position
    const requestLocationPermission = useCallback(async () => {
        try {
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: traductor("Location Permission"),
                        message: traductor("This app needs access to your location to show nearby shops."),
                        buttonNeutral: traductor("Ask Me Later"),
                        buttonNegative: traductor("Cancel"),
                        buttonPositive: traductor("OK"),
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            }
            // iOS - permission is requested automatically by Geolocation
            return true;
        } catch (err) {
            console.warn(err);
            return false;
        }
    }, []);

    const getCurrentPosition = useCallback(() => {
        return new Promise((resolve, reject) => {
            Geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                (error) => {
                    reject(error);
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );
        });
    }, []);

    const onPressFilter = useCallback(async (filterKey) => {
        if (filterKey === 'nearMe') {
            const currentValue = filters.nearMe;
            
            if (!currentValue) {
                // Activating "Near me" - request permission and get location
                setLoadingLocation(true);
                try {
                    const hasPermission = await requestLocationPermission();
                    if (hasPermission) {
                        const position = await getCurrentPosition();
                        setGpsLocation(position);
                        setFilters(prev => ({ ...prev, nearMe: true }));
                    } else {
                        Alert.alert(
                            traductor("Permission Denied"),
                            traductor("Please enable location permission in settings to use this feature.")
                        );
                    }
                } catch (error) {
                    console.error("Error getting location:", error);
                    Alert.alert(
                        traductor("Location Error"),
                        traductor("Could not get your location. Please try again.")
                    );
                } finally {
                    setLoadingLocation(false);
                }
            } else {
                // Deactivating "Near me"
                setFilters(prev => ({ ...prev, nearMe: false }));
                setGpsLocation(null);
            }
        } else {
            setFilters(prev => ({ ...prev, [filterKey]: !prev[filterKey] }));
        }
    }, [filters.nearMe, requestLocationPermission, getCurrentPosition]);

    const onLoadMore = useCallback(() => {
        if (!loadingMore && hasMore) {
            fetchShops(true);
        }
    }, [loadingMore, hasMore, fetchShops]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        // Force refresh : ne pas utiliser le cache
        await Promise.all([fetchBanners(), fetchShops(false, true)]);
        setRefreshing(false);
    }, [fetchBanners, fetchShops]);

    const onSelectCategory = useCallback((cat) => {
        setSelectedCategory(cat?.id === "all" ? null : cat);
        setCategoryModalVisible(false);
    }, []);

    // ============ RENDER BANNER CAROUSEL (same pattern as Home.js) ============
    const renderBannerCarousel = () => {
        if (loadingBanners) {
            return (
                <View style={styles.bannerSection}>
                    <BannerSkeleton />
                </View>
            );
        }
        if (banners.length === 0) return null;

        return (
            <View style={styles.bannerSection}>
                <View style={styles.bannerWrapper}>
                    <FlatList
                        data={banners}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                            { useNativeDriver: false }
                        )}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.bannerContainer}
                                onPress={() => onPressBanner(item)}
                                disabled={!item.shopId && !item.redirectUrl}
                                activeOpacity={0.9}
                            >
                                <Image source={{ uri: item.imageUrl }} style={styles.bannerImage} resizeMode="cover" />
                            </TouchableOpacity>
                        )}
                        initialNumToRender={2}
                        maxToRenderPerBatch={2}
                        windowSize={3}
                        removeClippedSubviews
                        getItemLayout={(_, index) => ({ length: BANNER_WIDTH, offset: BANNER_WIDTH * index, index })}
                    />
                    {banners.length > 1 && (
                        <View style={styles.paginationContainer}>
                            {banners.map((_, index) => {
                                const dotWidth = scrollX.interpolate({
                                    inputRange: [(index - 1) * BANNER_WIDTH, index * BANNER_WIDTH, (index + 1) * BANNER_WIDTH],
                                    outputRange: [8, 20, 8],
                                    extrapolate: "clamp",
                                });
                                const dotColor = scrollX.interpolate({
                                    inputRange: [(index - 1) * BANNER_WIDTH, index * BANNER_WIDTH, (index + 1) * BANNER_WIDTH],
                                    outputRange: ["#FFFFFF", primaryColor, "#FFFFFF"],
                                    extrapolate: "clamp",
                                });
                                return (
                                    <Animated.View
                                        key={index}
                                        style={[styles.paginationDot, { width: dotWidth, backgroundColor: dotColor }]}
                                    />
                                );
                            })}
                        </View>
                    )}
                </View>
            </View>
        );
    };

    // ============ RENDER FILTERS ============
    const renderFilters = () => (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContainer}
        >
            <FilterChip
                label={loadingLocation ? t('loading', lang) : t('nearMe', lang)}
                icon={locationIcon}
                isActive={filters.nearMe}
                onPress={() => !loadingLocation && onPressFilter('nearMe')}
            />
            <FilterChip
                label={t('havePromoCode', lang)}
                icon={promoIcon}
                isActive={filters.hasPromo}
                onPress={() => onPressFilter('hasPromo')}
            />
            <FilterChip
                label={salesBadge}
                isActive={filters.doubleDay}
                onPress={() => onPressFilter('doubleDay')}
            />
        </ScrollView>
    );

    // ============ RENDER SHOP ITEM ============
    const renderShopItem = useCallback(({ item }) => (
        <ShopSearchCard
            shop={item}
            onPress={onPressShop}
            onPressBook={onPressBook}
            defaultIcon={defaultIcon}
            lang={lang}
            userLocation={userLocation}
        />
    ), [onPressShop, onPressBook, defaultIcon, lang, userLocation]);

    // ============ RENDER FOOTER ============
    const renderFooter = () => {
        if (loadingMore) {
            return (
                <View style={styles.loadingMore}>
                    <ActivityIndicator size="small" color={primaryColor} />
                    <Text style={styles.loadingText}>{t('loading', lang)}</Text>
                </View>
            );
        }

        if (shops.length > 0 && !hasMore) {
            return (
                <Text style={styles.allLoadedText}>{t('allLoaded', lang)}</Text>
            );
        }

        return null;
    };

    // ============ RENDER CATEGORY MODAL ============
    const renderCategoryModal = () => (
        <Modal
            visible={categoryModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setCategoryModalVisible(false)}
        >
            <TouchableOpacity 
                style={styles.modalOverlay} 
                activeOpacity={1} 
                onPress={() => setCategoryModalVisible(false)}
            >
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{t('selectService', lang)}</Text>
                        <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                            <Text style={styles.modalClose}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.categoryList}>
                        {/* All Services option */}
                        <CategoryItem 
                            item={{ id: "all", text: "Tous les services", textEn: "All services", textTh: "บริการทั้งหมด" }}
                            isSelected={!selectedCategory}
                            onPress={() => onSelectCategory({ id: "all" })}
                            lang={lang}
                        />
                        {/* Beauty categories */}
                        {BEAUTY_CATEGORIES.map(cat => (
                            <CategoryItem 
                                key={cat.id}
                                item={cat}
                                isSelected={selectedCategory?.id === cat.id}
                                onPress={onSelectCategory}
                                lang={lang}
                            />
                        ))}
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </Modal>
    );

    // ============ MAIN RENDER ============
    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
            
            <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity style={styles.backButton} onPress={onPressBack}>
                            <View style={styles.backIconContainer}>
                                <View style={styles.chevronLeft} />
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.searchBar} 
                            onPress={() => setCategoryModalVisible(true)}
                            activeOpacity={0.9}
                        >
                            <Image source={searchIcon} style={styles.searchIcon} resizeMode="contain" />
                            <Text style={styles.searchPlaceholder} numberOfLines={1}>{selectedCategoryLabel}</Text>
                        </TouchableOpacity>
                    </View>
                    {renderFilters()}
                </View>

                {/* Content */}
                <FlatList
                    data={loadingInitial ? [] : shops}
                    keyExtractor={(item) => item.id}
                    renderItem={renderShopItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingBottom: bottomTarSpace + insets.bottom + 20 }
                    ]}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />
                    }
                    ListHeaderComponent={() => (
                        <View>
                            {renderBannerCarousel()}
                            {shops.length > 0 && (
                                <Text style={styles.countText}>{shops.length} {t('shopsNearby', lang)}</Text>
                            )}
                        </View>
                    )}
                    ListEmptyComponent={() => (
                        loadingInitial ? (
                            <View>
                                <ShopCardSkeleton />
                                <ShopCardSkeleton />
                            </View>
                        ) : (
                            <Text style={styles.emptyText}>{t('noShop', lang)}</Text>
                        )
                    )}
                    ListFooterComponent={renderFooter}
                    onEndReached={onLoadMore}
                    onEndReachedThreshold={0.5}
                    initialNumToRender={5}
                    maxToRenderPerBatch={5}
                    windowSize={5}
                />
            </SafeAreaView>

            {renderCategoryModal()}
        </View>
    );
}

// ============ STYLES ============
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9F9F9",
    },
    safeArea: {
        flex: 1,
        backgroundColor: "#F9F9F9",
    },
    header: {
        backgroundColor: "#F9F9F9",
        paddingTop: 24,
        paddingBottom: 10,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        gap: 20,
    },
    backButton: {
        width: 24,
        height: 24,
        justifyContent: "center",
        alignItems: "center",
    },
    backIconContainer: {
        width: 24,
        height: 24,
        justifyContent: "center",
        alignItems: "center",
    },
    chevronLeft: {
        width: 10,
        height: 10,
        borderLeftWidth: 2,
        borderBottomWidth: 2,
        borderColor: "#000000",
        transform: [{ rotate: "45deg" }],
    },
    chevronDown: {
        width: 8,
        height: 8,
        borderRightWidth: 2,
        borderBottomWidth: 2,
        borderColor: "#000000",
        transform: [{ rotate: "45deg" }],
        marginLeft: 8,
    },
    searchBar: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#D9D9D9",
        borderRadius: 9,
        height: 35,
        paddingHorizontal: 9,
    },
    searchIcon: {
        width: 13,
        height: 13,
        tintColor: "#000000",
        marginRight: 9,
    },
    searchPlaceholder: {
        flex: 1,
        fontSize: 14,
        fontWeight: "500",
        color: "#000000",
    },
    listContent: {
        paddingHorizontal: 20,
    },
    bannerSection: {
        marginBottom: 10,
    },
    bannerWrapper: {
        position: "relative",
        height: BANNER_HEIGHT,
        borderRadius: 12,
        overflow: "hidden",
    },
    bannerContainer: {
        width: BANNER_WIDTH,
        height: BANNER_HEIGHT,
        borderRadius: 12,
        overflow: "hidden",
    },
    bannerImage: {
        width: "100%",
        height: "100%",
        borderRadius: 12,
    },
    paginationContainer: {
        position: "absolute",
        bottom: 12,
        left: 0,
        right: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    paginationDot: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 3,
    },
    filtersContainer: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        gap: 12,
    },
    filterChip: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
        borderWidth: 0.6,
        borderColor: "#D9D9D9",
        borderRadius: 18,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 6,
    },
    filterChipActive: {
        backgroundColor: primaryColor,
        borderColor: primaryColor,
    },
    filterIcon: {
        width: 12,
        height: 12,
        tintColor: "#000000",
    },
    filterIconActive: {
        tintColor: "#FFFFFF",
    },
    filterText: {
        fontSize: 12,
        fontWeight: "500",
        color: "#000000",
    },
    filterTextActive: {
        color: "#FFFFFF",
    },
    countText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#000000",
        marginBottom: 20,
    },
    shopCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 17,
        marginBottom: 20,
        overflow: "hidden",
    },
    shopImageContainer: {
        width: "100%",
        height: 188,
        borderTopLeftRadius: 17,
        borderTopRightRadius: 17,
        overflow: "hidden",
    },
    shopImage: {
        width: "100%",
        height: "100%",
    },
    promoBadge: {
        position: "absolute",
        top: 8,
        left: 8,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: primaryColor,
        borderRadius: 11,
        paddingVertical: 8,
        paddingHorizontal: 15,
        gap: 8,
        alignSelf: "flex-start",
        maxWidth: 150,
    },
    promoIconBadge: {
        width: 23,
        height: 12,
        tintColor: "#FFFFFF",
        display: "none",
    },
    promoBadgeText: {
        flex: 1,
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "500",
        textAlign: "center",
    },
    shopInfoContainer: {
        borderWidth: 1,
        borderTopWidth: 0,
        borderColor: "#D9D9D9",
        borderBottomLeftRadius: 17,
        borderBottomRightRadius: 17,
        padding: 19,
        gap: 19,
    },
    shopHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    shopName: {
        flex: 1,
        fontSize: 18,
        fontWeight: "600",
        color: "#000000",
        marginRight: 10,
    },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    starIcon: {
        fontSize: 14,
        color: "#FFD700",
    },
    ratingText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#000000",
    },
    reviewsText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#000000",
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: -10,
    },
    locationIcon: {
        width: 15,
        height: 17,
        tintColor: "#747676",
        marginRight: 5,
    },
    locationText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#747676",
        flex: 1,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#747676",
        marginHorizontal: 5,
    },
    distanceText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#747676",
    },
    servicesContainer: {
        gap: 9,
    },
    serviceCard: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#D9D9D9",
        borderRadius: 14,
        paddingHorizontal: 15,
        paddingVertical: 10,
        gap: 11,
    },
    serviceName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#000000",
    },
    serviceRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    serviceDuration: {
        fontSize: 12,
        fontWeight: "500",
        color: "#777978",
    },
    priceContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 9,
    },
    servicePrice: {
        fontSize: 12,
        fontWeight: "500",
        color: "#000000",
    },
    originalPrice: {
        fontSize: 12,
        fontWeight: "500",
        color: "#000000",
        textDecorationLine: "line-through",
    },
    promoPrice: {
        fontSize: 12,
        fontWeight: "500",
        color: "#E60000",
    },
    bookButton: {
        backgroundColor: primaryColor,
        borderRadius: 17,
        height: 48,
        alignItems: "center",
        justifyContent: "center",
    },
    bookButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    loadingMore: {
        paddingVertical: 20,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
        gap: 10,
    },
    loadingText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#747676",
    },
    loadMoreButton: {
        alignSelf: "center",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: primaryColor,
        borderRadius: 13,
        paddingHorizontal: 18,
        paddingVertical: 9,
        marginVertical: 10,
    },
    loadMoreText: {
        fontSize: 14,
        fontWeight: "600",
        color: primaryColor,
    },
    allLoadedText: {
        textAlign: "center",
        fontSize: 14,
        fontWeight: "500",
        color: "#747676",
        paddingVertical: 20,
    },
    emptyText: {
        textAlign: "center",
        fontSize: 16,
        fontWeight: "500",
        color: "#747676",
        paddingVertical: 40,
    },
    skeleton: {
        backgroundColor: "#E5E5E5",
    },
    skeletonLine: {
        backgroundColor: "#E5E5E5",
        borderRadius: 4,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: "70%",
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#000000",
    },
    modalClose: {
        fontSize: 20,
        color: "#747676",
        padding: 5,
    },
    categoryList: {
        padding: 10,
    },
    categoryItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderRadius: 10,
        marginBottom: 5,
    },
    categoryItemSelected: {
        backgroundColor: "#F0EEFF",
    },
    categoryItemText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#000000",
    },
    categoryItemTextSelected: {
        color: primaryColor,
        fontWeight: "600",
    },
    checkmark: {
        fontSize: 16,
        color: primaryColor,
        fontWeight: "600",
    },
});
