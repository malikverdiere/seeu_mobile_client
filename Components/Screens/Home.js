import React, { useContext, useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import { 
    FlatList, 
    Image, 
    ScrollView, 
    StyleSheet, 
    Text, 
    TouchableOpacity, 
    View, 
    Modal, 
    RefreshControl, 
    Dimensions, 
    Animated, 
    StatusBar, 
    Linking, 
    Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NoUserContext, UserContext, bottomTarSpace, goToScreen, primaryColor, setAppLang, traductor, getShopTypeLabel } from '../AGTools';
import { useIsFocused } from "@react-navigation/native";
import { ModalBox } from '../ModalBox';
import { auth, firestore } from '../../firebase.config';
import {
    collection,
    collectionGroup,
    doc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    updateDoc,
} from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import NFCRead from '../NFCRead';
import MarketingCampaignResume from './MarketingCampaignResume';
import Notification, { addGift, addNotification, subTopic, updateRulesNotifReceived } from '../Notification';
import { AuthContext } from '../Login';
import UseRewards from '../UseRewards';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
    UpcomingSkeleton, 
    BannerSkeleton, 
    MyShopSkeleton, 
    TrendingSkeleton,
} from '../SkeletonLoader';

// ============ CONSTANTS ============
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = 243;
const CARD_HEIGHT = 83;
const CARD_GAP = 10;
const SHOP_LOGO_SIZE = 88;
const SHOP_ITEM_WIDTH = SHOP_LOGO_SIZE + 16;
const BANNER_WIDTH = SCREEN_WIDTH - 40;
const BANNER_HEIGHT = 183;
const TRENDING_CARD_WIDTH = (SCREEN_WIDTH - 30 - 16) / 1.8;
const TRENDING_GAP = 16;

// Images (cached at module level)
const appIcon = require("../img/logo/defaultImg.png");
const qrCodeBtnImg = require("../img/btn/qrCode.png");
const notificationImg = require("../img/btn/notification.png");
const beautyIcon = require("../img/cat02.png");
const giftIcon = require("../img/reward.png");

// Cache for bookings
const bookingsCache = new Map();

// ============ MEMOIZED COMPONENTS ============

// Section Header Component
const SectionHeader = memo(({ title, count, onPressMore }) => (
    <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {count !== null && count !== undefined && (
                <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{count}</Text>
                </View>
            )}
        </View>
        {onPressMore && (
            <TouchableOpacity style={styles.moreButton} onPress={onPressMore}>
                <Text style={styles.moreText}>More</Text>
                <View style={styles.chevronRight} />
            </TouchableOpacity>
        )}
    </View>
));

// Upcoming Booking Card Component
const UpcomingBookingCard = memo(({ item, onPress, defaultIcon, formatDate, getStatus }) => {
    const dateStr = `${formatDate(item.date)} at ${item.timeStart}`;
    const itemsCount = item.services?.length || 1;
    const priceDisplay = `${item.currency}${item.totalPrice}`;

    return (
        <TouchableOpacity style={styles.upcomingCard} onPress={() => onPress(item)} activeOpacity={0.9}>
            <View style={styles.upcomingImageContainer}>
                <Image 
                    style={styles.upcomingImage} 
                    source={{ uri: item.shopLogo || defaultIcon }} 
                    resizeMode="cover"
                />
            </View>
            <View style={styles.upcomingInfo}>
                <Text style={styles.upcomingShopName} numberOfLines={1}>{item.shopName}</Text>
                <Text style={styles.upcomingDate} numberOfLines={1}>{dateStr}</Text>
                <Text style={styles.upcomingPrice}>{priceDisplay} • {itemsCount} item{itemsCount > 1 ? 's' : ''}</Text>
                <Text style={styles.upcomingAction}>{getStatus(item.statut)}</Text>
            </View>
        </TouchableOpacity>
    );
});

// My Shop Item Component
const MyShopItem = memo(({ item, onPress, defaultIcon }) => {
    const shopImg = item?.docData?.logo_Shop_Img && item?.docData?.shopValid === true 
        ? item?.docData?.logo_Shop_Img 
        : defaultIcon;
    const shopName = item?.docData?.shopName || "";
    const displayName = shopName.length > 10 ? shopName.substring(0, 8) + "..." : shopName;

    return (
        <TouchableOpacity style={styles.shopItem} onPress={() => onPress(item)} activeOpacity={0.9}>
            <View style={styles.shopLogoContainer}>
                <Image resizeMode="contain" style={styles.shopLogo} source={{ uri: shopImg }} />
            </View>
            <Text style={styles.shopName} numberOfLines={1}>{displayName}</Text>
        </TouchableOpacity>
    );
});

// Gift Card Component
const GiftCard = memo(({ item, onPress }) => {
    const pointsText = item.points > 0 ? `(Use ${item.points} points)` : "";

    return (
        <TouchableOpacity style={styles.giftCard} onPress={() => onPress(item)} activeOpacity={0.9}>
            <View style={styles.giftIconContainer}>
                <Image resizeMode="contain" style={styles.giftIcon} source={giftIcon} />
            </View>
            <View style={styles.giftInfo}>
                <Text style={styles.giftShopName} numberOfLines={1}>{item.shopName}</Text>
                <Text style={styles.giftOffer} numberOfLines={1}>
                    {item.offer} {pointsText && <Text style={styles.giftPoints}>{pointsText}</Text>}
                </Text>
                <Text style={styles.giftDescription} numberOfLines={1}>{item.description}</Text>
                <Text style={styles.giftAction}>Use now</Text>
            </View>
        </TouchableOpacity>
    );
});

// Trending Card Component
const TrendingCard = memo(({ item, onPress, defaultIcon }) => {
    const categoryLabel = item.shopTypeLabel || "Beauty";
    const locationDisplay = item.neighborhood || item.address || "";

    return (
        <TouchableOpacity style={styles.trendingCard} onPress={() => onPress(item)} activeOpacity={0.9}>
            <View style={styles.trendingImageContainer}>
                <Image 
                    style={styles.trendingImage} 
                    source={{ uri: item.galleryImage || defaultIcon }} 
                    resizeMode="cover"
                />
                {item.promoLabel && (
                    <View style={styles.promoBadge}>
                        <Text style={styles.promoBadgeText} numberOfLines={1}>{item.promoLabel}</Text>
                    </View>
                )}
            </View>
            <View style={styles.trendingInfo}>
                <Text style={styles.trendingName} numberOfLines={1}>{item.shopName}</Text>
                <View style={styles.ratingRow}>
                    <Text style={styles.ratingText}>{item.rating?.toFixed(1) || "0.0"}</Text>
                    <Text style={styles.starIcon}>★</Text>
                    <Text style={styles.reviewsText}>({item.totalReviews || 0} Reviews)</Text>
                </View>
                <Text style={styles.locationText} numberOfLines={1}>{locationDisplay}</Text>
                <View style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{categoryLabel}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
});

// Banner Carousel Component (isolated animation)
const BannerCarousel = memo(({ banners, onPressBanner, defaultIcon }) => {
    const scrollX = useRef(new Animated.Value(0)).current;

    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        { useNativeDriver: false }
    );

    // Prefetch banner images
    useEffect(() => {
        banners.slice(0, 2).forEach(b => {
            if (b.imageUrl) Image.prefetch(b.imageUrl);
        });
    }, [banners]);

    const renderBannerItem = useCallback(({ item }) => (
        <TouchableOpacity 
            style={styles.bannerContainer}
            onPress={() => onPressBanner(item)}
            disabled={!item.shopId && !item.redirectUrl && item.legacy && item.docData?.pressable === false}
            activeOpacity={0.9}
        >
            <Image 
                style={styles.bannerImage} 
                source={{ uri: item.imageUrl || defaultIcon }} 
                resizeMode="cover"
            />
        </TouchableOpacity>
    ), [onPressBanner, defaultIcon]);

    const keyExtractor = useCallback((item, index) => item.id || index.toString(), []);

    return (
        <View style={styles.bannerSection}>
            <View style={styles.bannerWrapper}>
                <FlatList
                    data={banners}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    keyExtractor={keyExtractor}
                    renderItem={renderBannerItem}
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
                            const dotBgColor = scrollX.interpolate({
                                inputRange: [(index - 1) * BANNER_WIDTH, index * BANNER_WIDTH, (index + 1) * BANNER_WIDTH],
                                outputRange: ["#FFFFFF", primaryColor, "#FFFFFF"],
                                extrapolate: "clamp",
                            });
                            return (
                                <Animated.View 
                                    key={index} 
                                    style={[styles.paginationDot, { width: dotWidth, backgroundColor: dotBgColor }]} 
                                />
                            );
                        })}
                    </View>
                )}
            </View>
        </View>
    );
});

// ============ MAIN COMPONENT ============
export default function Home({ navigation }) {
    const authContext = useContext(AuthContext);
    const {
        user,
        currentShops,
        setShopsUpdate,
        registeredShops,
        pubs,
        setPubsUpdate,
        noUserlocation,
        rewardsByShop,
        rewardsByShopUpdate,
        gifts,
        chatRooms,
        notifications,
    } = useContext(authContext.user ? UserContext : NoUserContext);

    // Refs
    const mountedRef = useRef(true);
    const subLangueTimerRef = useRef(null);
    const messagingUnsubRef = useRef(null);

    // State
    const [campaignPreview, setCampaignPreview] = useState(false);
    const [campaign, setCampaign] = useState(null);
    const [upcomingBookings, setUpcomingBookings] = useState([]);
    const [trendingShops, setTrendingShops] = useState([]);
    const [beautyBanners, setBeautyBanners] = useState([]);
    const [loadingTrending, setLoadingTrending] = useState(true);
    const [loadingBanners, setLoadingBanners] = useState(true);
    const [loadingUpcoming, setLoadingUpcoming] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [rewardSelectedVisible, setRewardSelectedVisible] = useState(false);
    const [rewardSelected, setRewardSelected] = useState(null);
    const [shopSelected, setShopSelected] = useState([]);

    const isFocused = useIsFocused();
    const modalBox = ModalBox();
    const insets = useSafeAreaInsets();
    const defaultIcon = useMemo(() => Image.resolveAssetSource(appIcon).uri, []);
    const currentUser = auth.currentUser;
    const userDoc = currentUser ? doc(firestore, "Clients", currentUser.uid) : null;
    const registeredShopsCollection = currentUser ? collection(firestore, "Clients", currentUser.uid, "RegisteredShops") : null;

    // Memoized derived data
    const firstName = useMemo(() => {
        if (!user) return traductor("there");
        return user?.docData?.firstname || user?.docData?.firstName || traductor("there");
    }, [user, user?.docData?.firstname, user?.docData?.firstName]);

    const locationName = useMemo(() => 
        user?.docData?.geolocation?.city || noUserlocation?.city || "Localisation",
        [user?.docData?.geolocation?.city, noUserlocation?.city]
    );

    const notifCount = useMemo(() => {
        const chatNotifs = user && chatRooms 
            ? chatRooms.filter(r => r?.docData?.status_client === 1 || r?.docData?.status_client === 2).length 
            : 0;
        return (notifications?.length || 0) + chatNotifs;
    }, [user, chatRooms, notifications]);

    const bannersToShow = useMemo(() => {
        if (beautyBanners.length > 0) return beautyBanners;
        return pubs.map(p => ({
            id: p.docId,
            imageUrl: p.docData?.img,
            redirectUrl: null,
            legacy: true,
            docData: p.docData
        }));
    }, [beautyBanners, pubs]);

    const allGifts = useMemo(() => {
        const result = [];
        const findShop = (shopId) => 
            currentShops.find(s => s?.docData?.userId === shopId) || 
            registeredShops.find(s => s?.docId === shopId);

        if (rewardsByShop?.length > 0) {
            rewardsByShop.forEach(reward => {
                const data = reward?.docData || {};
                const client = registeredShops?.find(r => r.docId === data.shopId);
                const userPoints = client?.docData?.points || 0;
                
                if (userPoints >= (data.points || 0)) {
                    const shop = findShop(data.shopId);
                    const currency = shop?.docData?.currency?.text || "฿";
                    let offerText = data.type === 1 ? `${data.value}% ${traductor("offerts")}` 
                        : data.type === 2 ? `${data.value} ${currency} ${traductor("offerts")}` 
                        : data.value || "Reward";
                    
                    result.push({
                        id: reward.docId || reward.id,
                        type: 'reward',
                        shopId: data.shopId,
                        shopName: shop?.docData?.shopName || "Shop",
                        offer: offerText,
                        points: data.points || 0,
                        description: data.description || traductor("Use on your next visit"),
                    });
                }
            });
        }

        if (gifts?.length > 0) {
            gifts.forEach(gift => {
                const data = gift?.docData || {};
                const shop = findShop(data.shopId);
                const currency = shop?.docData?.currency?.text || "฿";
                let offerText = data.type === 1 ? `${data.value}% ${traductor("offerts")}` 
                    : data.type === 2 ? `${data.value} ${currency} ${traductor("offerts")}` 
                    : data.value || "Gift";
                
                result.push({
                    id: gift.docId || gift.id,
                    type: 'gift',
                    shopId: data.shopId,
                    shopName: shop?.docData?.shopName || "Shop",
                    offer: offerText,
                    points: 0,
                    description: data.description || traductor("A gift for you!"),
                });
            });
        }
        return result.slice(0, 5);
    }, [rewardsByShop, gifts, registeredShops, currentShops]);

    // ============ HELPER FUNCTIONS ============
    const formatBookingDate = useCallback((date) => {
        if (!date) return "";
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }, []);

    const getStatusLabel = useCallback((statut) => {
        switch (statut) {
            case 1: return traductor("Booked"); // Réservé / Pending
            case 2: return traductor("Confirmed"); // Confirmé
            default: return traductor("Booked");
        }
    }, []);

    // ============ FETCH FUNCTIONS ============
    const fetchTrendingShops = useCallback(async () => {
        if (!mountedRef.current) return;
        setLoadingTrending(true);
        
        try {
            const lang = setAppLang();
            const shopsRef = collection(firestore, "Shops");
            
            // Server-side filter: no client filter needed
            const q = query(
                shopsRef,
                where("shopType.type", "==", 1),
                where("shopValid", "==", true),
                where("highlight.type", "==", "Trending"),
                limit(10)
            );
            
            const snapshot = await getDocs(q);
            
            if (!mountedRef.current) return;
            
            const shops = snapshot.docs.map(docSnap => {
                const data = docSnap.data();
                    const galleryImage = Array.isArray(data.GalleryPictureShop) && data.GalleryPictureShop.length > 0
                    ? data.GalleryPictureShop[0] : null;
                
                // Get translated shop type label using helper
                const shopTypeLabel = getShopTypeLabel(data.shopType?.id, lang);
                    
                    return {
                        id: docSnap.id,
                        shopName: data.shopName || "",
                        galleryImage: galleryImage || data.cover_Shop_Img || data.logo_Shop_Img || null,
                        rating: data.google_infos?.rating || 0,
                        totalReviews: data.google_infos?.user_ratings_total || 0,
                        address: data.address || "",
                        neighborhood: data.neighborhood || "",
                    shopTypeLabel,
                        promoLabel: data.promoLabel || null,
                };
            });
            
            setTrendingShops(shops);
            
            // Prefetch first images
            shops.slice(0, 3).forEach(s => s.galleryImage && Image.prefetch(s.galleryImage));
        } catch (error) {
            console.error("Error fetching trending shops:", error);
        } finally {
            if (mountedRef.current) setLoadingTrending(false);
        }
    }, []);

    const fetchBeautyBanners = useCallback(async () => {
        if (!mountedRef.current) return;
        setLoadingBanners(true);
        
        try {
            const lang = setAppLang();
            const bannersRef = collection(firestore, "SearchBanners");
            const q = query(
                bannersRef,
                where("category", "==", "beauty"),
                where("isActive", "==", true),
                orderBy("priority", "asc"),
                limit(5)
            );

            // SWR: Try cache first
            try {
                const cacheSnapshot = await getDocs(q, { source: 'cache' });
                if (cacheSnapshot.docs.length > 0 && mountedRef.current) {
                    const cachedBanners = cacheSnapshot.docs.map(docSnap => {
                        const data = docSnap.data();
                        const bannerData = data.banner?.[lang] || data.banner?.en || data.banner?.fr || {};
                return {
                    id: docSnap.id,
                    imageUrl: bannerData.url?.mobile || bannerData.url?.desktop || null,
                    redirectUrl: bannerData.url?.redirect || null,
                    shopId: data.shopId || null,
                    priority: data.priority || 0,
                        };
                    }).filter(b => b.imageUrl);
                    setBeautyBanners(cachedBanners);
                    setLoadingBanners(false);
                }
            } catch (cacheError) {
                // Cache miss, continue to network
            }

            // Fetch from network
            const snapshot = await getDocs(q);
            if (!mountedRef.current) return;
            
            const banners = snapshot.docs.map(docSnap => {
                const data = docSnap.data();
                const bannerData = data.banner?.[lang] || data.banner?.en || data.banner?.fr || {};
                return {
                    id: docSnap.id,
                    imageUrl: bannerData.url?.mobile || bannerData.url?.desktop || null,
                    redirectUrl: bannerData.url?.redirect || null,
                    shopId: data.shopId || null,
                    priority: data.priority || 0,
                };
            }).filter(b => b.imageUrl);
            
            setBeautyBanners(banners);
        } catch (error) {
            console.error("Error fetching beauty banners:", error);
        } finally {
            if (mountedRef.current) setLoadingBanners(false);
        }
    }, []);

    const fetchUpcomingBookings = useCallback(async () => {
        if (!currentUser?.uid) {
            setUpcomingBookings([]);
            setLoadingUpcoming(false);
            return;
        }
        
        // Check cache first
        const cacheKey = `upcoming_${currentUser.uid}`;
        const cached = bookingsCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 60000) { // Cache for 1 minute
            setUpcomingBookings(cached.data);
            setLoadingUpcoming(false);
            return;
        }
        
        if (!mountedRef.current) return;
        setLoadingUpcoming(true);
        
        try {
            const now = new Date();
            
            // Query only bookings with statut 1 (pending) or 2 (confirmed)
            const bookingsQuery = query(
                collectionGroup(firestore, 'Booking'),
                where('clientId', '==', currentUser.uid),
                where('statut', 'in', [1, 2])  // Only fetch pending/confirmed
            );
            const snapshot = await getDocs(bookingsQuery);
            
            if (!mountedRef.current) return;
            
            const bookingIds = new Set();
            const bookingsData = [];
            
            snapshot.docs.forEach((docSnap) => {
                const data = docSnap.data();
                const appointmentDateTime = data.date?.toDate?.() || new Date();
                if (data.timeStart) {
                    const [hours, minutes] = data.timeStart.split(':').map(Number);
                    appointmentDateTime.setHours(hours, minutes);
                }
                
                // Filter by date (statut already filtered in query)
                const isUpcoming = appointmentDateTime >= now;
                
                if (isUpcoming && data.booking_id) {
                    bookingIds.add(data.booking_id);
                    bookingsData.push({ doc: docSnap, data, appointmentDateTime });
                }
            });
            
            // Batch fetch shops
            const shopsMap = new Map();
            if (bookingIds.size > 0) {
                const shopsRef = collection(firestore, "Shops");
                const bookingIdsArray = Array.from(bookingIds);
                const batchSize = 10;
                const shopPromises = [];
                
                for (let i = 0; i < bookingIdsArray.length; i += batchSize) {
                    const batch = bookingIdsArray.slice(i, i + batchSize);
                    shopPromises.push(getDocs(query(shopsRef, where("booking_id", "in", batch))));
                }
                
                const shopSnapshots = await Promise.all(shopPromises);
                shopSnapshots.forEach(snap => {
                    snap.docs.forEach(shopDoc => {
                        const shopData = shopDoc.data();
                        if (shopData.booking_id) shopsMap.set(shopData.booking_id, shopData);
                    });
                });
            }
            
            if (!mountedRef.current) return;
            
            const enrichedBookings = bookingsData.map(({ doc: docSnap, data, appointmentDateTime }) => {
                const shopData = shopsMap.get(data.booking_id) || null;
                return {
                    id: docSnap.id,
                    shopId: docSnap.ref.parent?.parent?.id || "",
                    shopName: shopData?.shopName || data.shopName || "Shop",
                    shopLogo: shopData?.logo_Shop_Img || null,
                    booking_id: data.booking_id || "",
                    date: data.date?.toDate?.() || new Date(),
                    timeStart: data.timeStart || "",
                    totalPrice: data.totalPrice || 0,
                    currency: shopData?.currency?.text || "฿",
                    services: data.services || [],
                    statut: data.statut,
                    _sortDate: appointmentDateTime,
                };
            });
            
            enrichedBookings.sort((a, b) => a._sortDate.getTime() - b._sortDate.getTime());
            const limitedBookings = enrichedBookings.slice(0, 10);
            limitedBookings.forEach(b => delete b._sortDate);
            
            // Cache the result
            const cacheKey = `upcoming_${currentUser.uid}`;
            bookingsCache.set(cacheKey, {
                data: limitedBookings,
                timestamp: Date.now(),
            });
            
            setUpcomingBookings(limitedBookings);
        } catch (error) {
            console.error("Error fetching upcoming bookings:", error);
            if (mountedRef.current) setUpcomingBookings([]);
        } finally {
            if (mountedRef.current) setLoadingUpcoming(false);
        }
    }, [currentUser?.uid]);

    // ============ HANDLERS (MEMOIZED) ============
    const onPressQrCodeVisible = useCallback(() => goToScreen(navigation, "ClientQrCode"), [navigation]);
    const onPressNotification = useCallback(() => goToScreen(navigation, "NotifsChatRooms"), [navigation]);
    const onPressGeolocation = useCallback(() => {
        StatusBar.setBarStyle("light-content", true);
        goToScreen(navigation, "GeolocationView", { from: "Accueil" });
    }, [navigation]);
    const onPressBeauty = useCallback(() => goToScreen(navigation, "BeautyHome"), [navigation]);
    const onPressBeautySearch = useCallback(() => goToScreen(navigation, "BeautySearch"), [navigation]);
    const onPressAllShops = useCallback(() => goToScreen(navigation, "Shops"), [navigation]);
    const onCloseCampaignItem = useCallback(() => setCampaignPreview(false), []);

    const onPressUpcomingBooking = useCallback((item) => {
        goToScreen(navigation, "BeautyBookingDetail", { 
            shopId: item.shopId, 
            bookingId: item.id,
            booking_id: item.booking_id 
        });
    }, [navigation]);

    const onPressMyShop = useCallback((item) => {
        goToScreen(navigation, "Shop", { shopId: item?.docData?.userId });
    }, [navigation]);

    const onPressTrendingShop = useCallback((item) => {
        goToScreen(navigation, "Venue", { shopId: item.id });
    }, [navigation]);

    const onPressGift = useCallback((item) => {
        // Find shop data for this gift
        const shop = currentShops.find(s => s?.docData?.userId === item.shopId) || 
                     registeredShops.find(s => s?.docId === item.shopId);
        
        // Find reward/gift data
        let rewardData = null;
        if (item.type === 'reward') {
            rewardData = rewardsByShop.find(r => r.docId === item.id || r.id === item.id);
        } else if (item.type === 'gift') {
            rewardData = gifts.find(g => g.docId === item.id || g.id === item.id);
        }
        
        setShopSelected(shop ? [shop] : []);
        setRewardSelected(rewardData);
        setRewardSelectedVisible(true);
    }, [navigation, currentShops, registeredShops, rewardsByShop, gifts]);

    const onPressBanner = useCallback((item) => {
        if (item.shopId) {
            goToScreen(navigation, "Venue", { shopId: item.shopId });
        } else if (item.redirectUrl) {
            Linking.openURL(item.redirectUrl);
        } else if (item.legacy && item.docData?.pressable !== false) {
            goToScreen(navigation, "Campaign", { 
                shopId: item.docData?.shopId, 
                campaignId: item.docData?.campaignId, 
                pub: true 
            });
        }
    }, [navigation]);

    const onPressShop = useCallback(() => {
        goToScreen(navigation, "Shop", { shopId: campaign?.shopId });
        setTimeout(() => setCampaignPreview(false), 1000);
    }, [navigation, campaign?.shopId]);

    const onPressLocation = useCallback(() => {
        if (campaign?.address) {
            const url = Platform.select({
                ios: `maps:0,0?q=${campaign?.address}`,
                android: `geo:0,0?q=${campaign?.address}`,
            });
            Linking.openURL(url);
        }
    }, [campaign?.address]);

    const onConfirm = useCallback(() => {
        goToScreen(navigation, "LogHome");
        setTimeout(() => setCampaignPreview(false), 1000);
    }, [navigation]);

    // Refresh: just refetch, no reset
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        // Ces fonctions ne sont appelées que si l'utilisateur est connecté
        if (user) {
            setShopsUpdate(true);
            setPubsUpdate(true);
        }
        await Promise.all([
            fetchTrendingShops(),
            fetchBeautyBanners(),
            ...(user ? [fetchUpcomingBookings()] : []),
        ]);
        setRefreshing(false);
    }, [user, setShopsUpdate, setPubsUpdate, fetchTrendingShops, fetchBeautyBanners, fetchUpcomingBookings]);

    // ============ FLATLIST OPTIMIZATIONS ============
    const getItemLayoutUpcoming = useCallback((_, index) => ({
        length: CARD_WIDTH + CARD_GAP,
        offset: (CARD_WIDTH + CARD_GAP) * index,
        index,
    }), []);

    const getItemLayoutShop = useCallback((_, index) => ({
        length: SHOP_ITEM_WIDTH,
        offset: SHOP_ITEM_WIDTH * index,
        index,
    }), []);

    const getItemLayoutGift = useCallback((_, index) => ({
        length: CARD_WIDTH + CARD_GAP,
        offset: (CARD_WIDTH + CARD_GAP) * index,
        index,
    }), []);

    const getItemLayoutTrending = useCallback((_, index) => ({
        length: TRENDING_CARD_WIDTH + TRENDING_GAP,
        offset: (TRENDING_CARD_WIDTH + TRENDING_GAP) * index,
        index,
    }), []);

    const keyExtractorId = useCallback((item) => item.id, []);
    const keyExtractorDocId = useCallback((item) => item?.docId || item?.docData?.userId || item?.id, []);

    // Memoized render functions
    const renderUpcomingItem = useCallback(({ item }) => (
        <UpcomingBookingCard 
            item={item} 
            onPress={onPressUpcomingBooking} 
            defaultIcon={defaultIcon}
            formatDate={formatBookingDate}
            getStatus={getStatusLabel}
        />
    ), [onPressUpcomingBooking, defaultIcon, formatBookingDate, getStatusLabel]);

    const renderMyShopItem = useCallback(({ item }) => (
        <MyShopItem item={item} onPress={onPressMyShop} defaultIcon={defaultIcon} />
    ), [onPressMyShop, defaultIcon]);

    const renderGiftItem = useCallback(({ item }) => (
        <GiftCard item={item} onPress={onPressGift} />
    ), [onPressGift]);

    const renderTrendingItem = useCallback(({ item }) => (
        <TrendingCard item={item} onPress={onPressTrendingShop} defaultIcon={defaultIcon} />
    ), [onPressTrendingShop, defaultIcon]);

    // ============ SUB FUNCTIONS ============
    const subLangue = useCallback(() => {
        const lang = setAppLang();
        const topic = `user_lang_${lang}`;
        subTopic(topic);

        if (lang !== user?.docData?.user_lang && userDoc) {
            updateDoc(userDoc, { user_lang: lang }).then(() => {
                registeredShops.forEach(async (shop) => {
                    const shopDoc = doc(registeredShopsCollection, shop.docId);
                    await updateDoc(shopDoc, { user_lang: lang });
                });
            });
        }
    }, [user?.docData?.user_lang, userDoc, registeredShops, registeredShopsCollection]);

    // ============ EFFECTS ============
    useEffect(() => {
        mountedRef.current = true;
        
        // Messaging listeners
        const unsubOpen = messaging().onNotificationOpenedApp(remoteMessage => {
            if (remoteMessage) {
                addNotification(remoteMessage, true);
                updateRulesNotifReceived(remoteMessage);
                addGift(remoteMessage);
                const type = remoteMessage?.data?.type;
                if (["birthday", "lastVisit", "googleReview", "followInsta"].includes(type)) {
                    goToScreen(navigation, "Shop", { shopId: remoteMessage?.data?.shopId });
                } else if (remoteMessage?.data?.shopId && remoteMessage?.data?.campaignId) {
                    goToScreen(navigation, "Campaign", { 
                        shopId: remoteMessage?.data?.shopId, 
                        campaignId: remoteMessage?.data?.campaignId, 
                        remoteMessage 
                    });
                }
            }
        });
        
        messaging().getInitialNotification().then(remoteMessage => {
            if (remoteMessage && mountedRef.current) {
                addNotification(remoteMessage, true);
                updateRulesNotifReceived(remoteMessage);
                addGift(remoteMessage);
                const type = remoteMessage?.data?.type;
                if (["birthday", "lastVisit", "googleReview", "followInsta"].includes(type)) {
                    goToScreen(navigation, "Shop", { shopId: remoteMessage?.data?.shopId });
                } else if (remoteMessage?.data?.shopId && remoteMessage?.data?.campaignId) {
                    goToScreen(navigation, "Campaign", { 
                        shopId: remoteMessage?.data?.shopId, 
                        campaignId: remoteMessage?.data?.campaignId, 
                        remoteMessage 
                    });
                }
            }
        });
        
        messagingUnsubRef.current = unsubOpen;
        
        return () => {
            mountedRef.current = false;
            if (messagingUnsubRef.current) messagingUnsubRef.current();
        };
    }, [navigation]);

    useEffect(() => {
        if (isFocused) StatusBar.setBarStyle("dark-content", true);
    }, [isFocused]);

    useEffect(() => {
        subLangueTimerRef.current = setTimeout(() => {
            if (user && mountedRef.current) subLangue();
        }, 2000);
        
        return () => {
            if (subLangueTimerRef.current) clearTimeout(subLangueTimerRef.current);
        };
    }, [rewardsByShopUpdate, user, subLangue]);

    useEffect(() => {
        fetchTrendingShops();
        fetchBeautyBanners();
    }, [fetchTrendingShops, fetchBeautyBanners]);

    useEffect(() => {
        fetchUpcomingBookings();
    }, [fetchUpcomingBookings]);

    // Notification hook
    Notification();

    // ============ SECTION RENDER FUNCTIONS ============
    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <Text style={styles.headerLocationText}>Bangkok</Text>
            </View>
            <View style={styles.headerRight}>
                {user && (
                    <>
                        <TouchableOpacity style={styles.headerBtn} onPress={onPressNotification}>
                            <Image resizeMode="contain" style={styles.headerIcon} source={notificationImg} />
                            {notifCount > 0 && (
                                <View style={styles.notifBadge}>
                                    <Text style={styles.notifBadgeText}>{notifCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerBtn} onPress={onPressQrCodeVisible}>
                            <Image resizeMode="contain" style={styles.headerIcon} source={qrCodeBtnImg} />
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );

    const renderGreetingSection = () => (
        <View style={styles.greetingSection}>
            <Text style={styles.greetingText}>Hi, {firstName}.</Text>
            <View style={styles.categoryRow}>
                <TouchableOpacity style={styles.categoryButton} onPress={onPressBeauty}>
                    <View style={styles.categoryIconContainer}>
                        <Image resizeMode="contain" style={styles.categoryIcon} source={beautyIcon} />
                    </View>
                    <Text style={styles.categoryText}>Beauty</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderUpcomingSection = () => {
        if (loadingUpcoming) {
            return (
                <View style={styles.section}>
                    <SectionHeader title="Upcoming" count={null} onPressMore={null} />
                    <UpcomingSkeleton count={2} />
                </View>
            );
        }
        if (upcomingBookings.length === 0) return null;

        return (
            <View style={styles.section}>
                <SectionHeader 
                    title="Upcoming" 
                    count={upcomingBookings.length} 
                    onPressMore={() => goToScreen(navigation, "Activity")} 
                />
                <FlatList
                    data={upcomingBookings}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                    keyExtractor={keyExtractorId}
                    renderItem={renderUpcomingItem}
                    initialNumToRender={4}
                    maxToRenderPerBatch={4}
                    windowSize={3}
                    removeClippedSubviews
                    getItemLayout={getItemLayoutUpcoming}
                                    />
                                </View>
        );
    };

    const renderBannerSection = () => {
        if (bannersToShow.length === 0) {
            return loadingBanners ? <BannerSkeleton /> : null;
        }
        return <BannerCarousel banners={bannersToShow} onPressBanner={onPressBanner} defaultIcon={defaultIcon} />;
    };

    const renderMyShopSection = () => {
        // Section cachée si l'utilisateur n'est pas connecté
        if (!user || !registeredShops || registeredShops.length === 0) return null;

        return (
            <View style={styles.section}>
                <SectionHeader title={`${traductor("Loved")} 💜`} count={null} onPressMore={onPressAllShops} />
                {currentShops.length <= 0 ? (
                    <MyShopSkeleton count={3} />
                ) : (
                    <FlatList
                        data={currentShops}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalList}
                        keyExtractor={keyExtractorDocId}
                        renderItem={renderMyShopItem}
                        initialNumToRender={4}
                        maxToRenderPerBatch={4}
                        windowSize={3}
                        removeClippedSubviews
                        getItemLayout={getItemLayoutShop}
                    />
                )}
            </View>
        );
    };

    const renderMyGiftsSection = () => {
        if (allGifts.length === 0) return null;

        return (
            <View style={styles.section}>
                <SectionHeader title="My gifts" count={null} onPressMore={() => goToScreen(navigation, "Activity", { initialTab: 'gift' })} />
                <FlatList
                    data={allGifts}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                    keyExtractor={keyExtractorId}
                    renderItem={renderGiftItem}
                    initialNumToRender={4}
                    maxToRenderPerBatch={4}
                    windowSize={3}
                    removeClippedSubviews
                    getItemLayout={getItemLayoutGift}
                />
            </View>
        );
    };

    const renderBeautyTrendingSection = () => {
        if (loadingTrending) {
            return (
                <View style={styles.section}>
                    <SectionHeader title="Beauty trending" count={null} onPressMore={onPressBeautySearch} />
                    <TrendingSkeleton count={2} />
                </View>
            );
        }
        if (trendingShops.length === 0) return null;

        return (
            <View style={styles.section}>
                <SectionHeader title="Beauty trending" count={null} onPressMore={onPressBeautySearch} />
                <FlatList
                    data={trendingShops}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                    keyExtractor={keyExtractorId}
                    renderItem={renderTrendingItem}
                    initialNumToRender={4}
                    maxToRenderPerBatch={4}
                    windowSize={3}
                    removeClippedSubviews
                    getItemLayout={getItemLayoutTrending}
                />
                                        </View>
        );
    };

    // ============ MAIN RENDER ============
    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
            {renderHeader()}
            <ScrollView
                contentContainerStyle={{ paddingBottom: bottomTarSpace + insets.bottom }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {renderGreetingSection()}
                {user && renderUpcomingSection()}
                {renderBannerSection()}
                {renderMyShopSection()}
                {user && renderMyGiftsSection()}
                {renderBeautyTrendingSection()}
            </ScrollView>
            </SafeAreaView>

            {(isFocused && user) && <NFCRead navigation={navigation} modalBoxInfos={modalBox.openBoxInfos} />}

            <Modal
                style={{ backgroundColor: "#222222" }}
                animationType="fade"
                transparent={false}
                visible={campaignPreview}
                statusBarTranslucent={true}
                onRequestClose={onCloseCampaignItem}
            >
                <MarketingCampaignResume
                    navigation={navigation}
                    shopId={campaign?.shopId}
                    campaignId={campaign?.campaignShopId}
                    campaignProps={campaign}
                    onBack={onCloseCampaignItem}
                    onShopAction={onPressShop}
                    onLocationAction={onPressLocation}
                    onConfirm={onConfirm}
                />
            </Modal>

            {currentUser && (
                <UseRewards
                    navigation={navigation}
                    shop={shopSelected}
                    reward={rewardSelected}
                    visible={rewardSelectedVisible}
                    onVisible={setRewardSelectedVisible}
                    goToProfil={() => goToScreen(navigation, "SetPersonnalInfos")}
                />
            )}

            {modalBox.renderBoxInfos("")}
        </View>
    );
}

// ============ STYLES (UNCHANGED) ============
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    safeArea: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    headerLocationText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#1D1D1B",
        marginRight: 8,
    },
    chevronDown: {
        width: 8,
        height: 8,
        borderRightWidth: 2,
        borderBottomWidth: 2,
        borderColor: "#1D1D1B",
        transform: [{ rotate: "45deg" }],
        marginTop: -3,
    },
    headerRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    headerBtn: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    headerIcon: {
        width: 20,
        height: 20,
    },
    notifBadge: {
        position: "absolute",
        top: 2,
        right: 2,
        backgroundColor: primaryColor,
        borderRadius: 10,
        minWidth: 16,
        height: 16,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 4,
    },
    notifBadgeText: {
        color: "#FFFFFF",
        fontSize: 10,
        fontWeight: "600",
    },
    greetingSection: {
        paddingHorizontal: 20,
        marginTop: 8,
        marginBottom: 16,
    },
    greetingText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#000000",
        marginBottom: 16,
    },
    categoryRow: {
        flexDirection: "row",
    },
    categoryButton: {
        backgroundColor: "#F5F5F5",
        borderRadius: 8,
        padding: 15,
        alignItems: "center",
        minWidth: 80,
    },
    categoryIconContainer: {
        marginBottom: 8,
    },
    categoryIcon: {
        width: 32,
        height: 32,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: "500",
        color: "#1D1D1B",
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    sectionHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#000000",
    },
    countBadge: {
        backgroundColor: primaryColor,
        borderRadius: 15,
        width: 25,
        height: 25,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 8,
    },
    countBadgeText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "600",
    },
    moreButton: {
        flexDirection: "row",
        alignItems: "center",
    },
    moreText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#767881",
        marginRight: 6,
    },
    chevronRight: {
        width: 6,
        height: 6,
        borderRightWidth: 1.5,
        borderTopWidth: 1.5,
        borderColor: "#767881",
        transform: [{ rotate: "45deg" }],
    },
    horizontalList: {
        paddingLeft: 20,
        paddingRight: 10,
    },
    upcomingCard: {
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#D9D9D9",
        marginRight: 10,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        overflow: "hidden",
    },
    upcomingImageContainer: {
        width: CARD_HEIGHT,
        height: CARD_HEIGHT,
    },
    upcomingImage: {
        width: "100%",
        height: "100%",
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
    },
    upcomingInfo: {
        flex: 1,
        padding: 10,
        justifyContent: "center",
    },
    upcomingShopName: {
        fontSize: 12,
        fontWeight: "600",
        color: "#000000",
        marginBottom: 2,
    },
    upcomingDate: {
        fontSize: 10,
        fontWeight: "500",
        color: "#000000",
        marginBottom: 2,
    },
    upcomingPrice: {
        fontSize: 10,
        fontWeight: "500",
        color: "#747676",
        marginBottom: 6,
    },
    upcomingAction: {
        fontSize: 12,
        fontWeight: "600",
        color: primaryColor,
    },
    bannerSection: {
        marginBottom: 24,
        paddingHorizontal: 20,
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
    },
    bannerImage: {
        width: "100%",
        height: "100%",
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
    shopItem: {
        alignItems: "center",
        marginRight: 16,
    },
    shopLogoContainer: {
        width: SHOP_LOGO_SIZE,
        height: SHOP_LOGO_SIZE,
        borderRadius: SHOP_LOGO_SIZE / 2,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: primaryColor,
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 5,
    },
    shopLogo: {
        width: 70,
        height: 70,
        borderRadius: 35,
    },
    shopName: {
        fontSize: 14,
        fontWeight: "500",
        color: "#1D1D1B",
        marginTop: 8,
        textAlign: "center",
        maxWidth: SHOP_LOGO_SIZE,
    },
    giftCard: {
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#D9D9D9",
        marginRight: 10,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        padding: 12,
        alignItems: "center",
    },
    giftIconContainer: {
        marginRight: 16,
    },
    giftIcon: {
        width: 30,
        height: 30,
    },
    giftInfo: {
        flex: 1,
    },
    giftShopName: {
        fontSize: 12,
        fontWeight: "600",
        color: "#000000",
        marginBottom: 4,
    },
    giftOffer: {
        fontSize: 10,
        fontWeight: "500",
        color: "#000000",
    },
    giftPoints: {
        fontWeight: "600",
    },
    giftDescription: {
        fontSize: 10,
        fontWeight: "500",
        color: "#747676",
        marginTop: 4,
    },
    giftAction: {
        fontSize: 12,
        fontWeight: "600",
        color: primaryColor,
        marginTop: 8,
    },
    trendingCard: {
        width: TRENDING_CARD_WIDTH,
        marginRight: 16,
        backgroundColor: "#FFFFFF",
    },
    trendingImageContainer: {
        width: TRENDING_CARD_WIDTH,
        height: 120,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        overflow: "hidden",
    },
    trendingImage: {
        width: "100%",
        height: "100%",
    },
    promoBadge: {
        position: "absolute",
        top: 6,
        left: 6,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: primaryColor,
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 10,
        gap: 6,
        alignSelf: "flex-start",
        maxWidth: 120,
    },
    promoBadgeText: {
        flex: 1,
        color: "#FFFFFF",
        fontSize: 10,
        fontWeight: "500",
        textAlign: "center",
    },
    trendingInfo: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderTopWidth: 0,
        borderColor: "#D9D9D9",
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        padding: 10,
        minHeight: 105,
    },
    trendingName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#000000",
        marginBottom: 4,
    },
    ratingRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: "500",
        color: "#000000",
        marginRight: 2,
    },
    starIcon: {
        fontSize: 10,
        color: "#FFD700",
        marginRight: 4,
    },
    reviewsText: {
        fontSize: 12,
        fontWeight: "500",
        color: "#000000",
    },
    locationText: {
        fontSize: 12,
        fontWeight: "500",
        color: "#747676",
        marginBottom: 8,
    },
    categoryTag: {
        alignSelf: "flex-start",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#D9D9D9",
        borderRadius: 8,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    categoryTagText: {
        fontSize: 10,
        fontWeight: "500",
        color: "#000000",
    },
});
