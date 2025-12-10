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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NoUserContext, UserContext, goToScreen, primaryColor, setAppLang, traductor, getShopTypeLabel, bottomTarSpace, shopTypes } from '../AGTools';
import { AuthContext } from '../Login';
import { firestore } from '../../firebase.config';
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
} from '@react-native-firebase/firestore';

// ============ CONSTANTS ============
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 40 - 16) / 1.8;
const CARD_GAP = 16;
const CARD_IMAGE_HEIGHT = 105;
const CARD_INFO_HEIGHT = 105;
const ITEM_WIDTH = CARD_WIDTH + CARD_GAP;
const RECENTLY_VIEWED_KEY = '@beauty_recently_viewed';

// Images (cached at module level)
const appIcon = require("../img/logo/defaultImg.png");
const arrowBackImg = require("../img/arrow/arrowBackBg.png");
const searchIcon = require("../img/search.png");
const locationIcon = require("../img/btn/location.png");

// Beauty categories (type: 1)
const BEAUTY_CATEGORIES = shopTypes.filter(s => s.type === 1 && s.id !== "0-default");

// ============ SHOP CARD COMPONENT (MEMOIZED) ============
const ShopCard = memo(({ item, onPress, defaultIcon, lang }) => {
    // Get translated shop type label using helper
    const shopTypeLabel = getShopTypeLabel(item.shopTypeId, lang) || "Beauty";

    return (
        <TouchableOpacity
            style={styles.shopCard}
            onPress={() => onPress(item)}
            activeOpacity={0.9}
        >
            <View style={styles.cardImageContainer}>
                <Image
                    source={{ uri: item.galleryImage || defaultIcon }}
                    style={styles.cardImage}
                    resizeMode="cover"
                />
                {item.promoText && (
                    <View style={styles.promoBadge}>
                        <Text style={styles.promoBadgeText} numberOfLines={1}>{item.promoText}</Text>
                    </View>
                )}
            </View>
            <View style={styles.cardInfo}>
                <View style={styles.cardInfoContent}>
                    <Text style={styles.shopName} numberOfLines={1}>{item.shopName}</Text>
                    <View style={styles.ratingRow}>
                        <Text style={styles.ratingText}>{item.rating?.toFixed(1) || "0.0"}</Text>
                        <Text style={styles.starIcon}>★</Text>
                        <Text style={styles.reviewsText}>({item.totalReviews || 0} Reviews)</Text>
                    </View>
                    <Text style={styles.locationText} numberOfLines={1}>{item.neighborhood}</Text>
                </View>
                <View style={styles.typeTag}>
                    <Text style={styles.typeTagText}>{shopTypeLabel}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}, (prevProps, nextProps) => prevProps.item.id === nextProps.item.id);

// ============ SKELETON COMPONENTS ============
const CardSkeleton = memo(() => (
    <View style={styles.skeletonCard}>
        <View style={styles.skeletonImage} />
        <View style={styles.skeletonInfo}>
            <View style={styles.skeletonLine} />
            <View style={[styles.skeletonLine, { width: '60%' }]} />
            <View style={[styles.skeletonLine, { width: '40%' }]} />
        </View>
    </View>
));

const BannerSkeleton = memo(() => (
    <View style={styles.bannerContainer}>
        <View style={styles.skeletonBanner} />
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
export default function BeautyHome({ navigation }) {
    const authContext = useContext(AuthContext);
    const { user, noUserlocation } = useContext(authContext.user ? UserContext : NoUserContext);
    const mountedRef = useRef(true);

    // Loading states
    const [loadingHighlights, setLoadingHighlights] = useState(true);
    const [loadingRecent, setLoadingRecent] = useState(true);
    const [loadingBanners, setLoadingBanners] = useState(true);

    // Data states - filtered from highlights
    const [promoShops, setPromoShops] = useState([]);
    const [trendingShops, setTrendingShops] = useState([]);
    const [massageShops, setMassageShops] = useState([]);
    const [nailShops, setNailShops] = useState([]);
    const [hairShops, setHairShops] = useState([]);
    const [recentlyViewed, setRecentlyViewed] = useState([]);
    const [banners, setBanners] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [categoryDropdownVisible, setCategoryDropdownVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null); // null = All services

    const insets = useSafeAreaInsets();
    const lang = setAppLang();
    const defaultIcon = Image.resolveAssetSource(appIcon).uri;

    const userLocation = user?.docData?.geolocation || noUserlocation;
    const locationName = userLocation?.city || traductor("Current location");

    // ============ DATA TRANSFORMATION ============
    const transformShopDoc = useCallback((docSnap) => {
                const data = docSnap.data();
                const galleryImage = Array.isArray(data.GalleryPictureShop) && data.GalleryPictureShop.length > 0
                    ? data.GalleryPictureShop[0]
            : data.cover_Shop_Img || data.logo_Shop_Img || null;

        let promoText = null;
        if (data.promotion?.doubleDay && data.promotion?.promoCode) {
            const currency = data.currency?.text || "฿";
            if (data.promotion.type === 1) {
                promoText = `${data.promotion.value}% off: ${data.promotion.promoCode}`;
            } else if (data.promotion.type === 2) {
                promoText = `${currency}${data.promotion.value} off: ${data.promotion.promoCode}`;
            }
                }

                return {
                    id: docSnap.id,
                    shopName: data.shopName || "",
            galleryImage,
                    rating: data.google_infos?.rating || 0,
                    totalReviews: data.google_infos?.user_ratings_total || 0,
                    neighborhood: data.neighborhood || data.city || "",
            shopTypeId: data.shopType?.id,
            shopTypeLabel: "Beauty",
            promoText,
                    booking_id: data.booking_id || "",
        };
    }, []);

    // ============ FETCH HIGHLIGHTS (2 simple queries + client-side filter) ============
    // Based on DOCUMENTATION_HOME_HIGHLIGHTS.md
    // Query 1: highlight.isActive == true
    // Query 2: promotion.doubleDay == true
    // Then filter client-side by highlight.type
    const fetchHighlights = useCallback(async () => {
        setLoadingHighlights(true);
        try {
            const shopsRef = collection(firestore, "Shops");
            
            // 2 simple queries in parallel (no composite index needed)
            const q1 = query(shopsRef, where("highlight.isActive", "==", true));
            const q2 = query(shopsRef, where("promotion.doubleDay", "==", true));
            
            const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
            
            if (!mountedRef.current) return;
            
            // Merge without duplicates (dedupe by ID)
            const shopsMap = new Map();
            [...snap1.docs, ...snap2.docs].forEach(docSnap => {
                if (!shopsMap.has(docSnap.id)) {
                    const data = docSnap.data();
                    // Only include beauty shops (shopType.type == 1)
                    if (data.shopType?.type === 1) {
                        shopsMap.set(docSnap.id, { docSnap, data });
                    }
                }
            });
            
            // Transform all shops
            const allShops = Array.from(shopsMap.values()).map(({ docSnap, data }) => {
                const galleryImage = Array.isArray(data.GalleryPictureShop) && data.GalleryPictureShop.length > 0
                    ? data.GalleryPictureShop[0]
                    : data.cover_Shop_Img || data.logo_Shop_Img || null;
                
                let promoText = null;
                if (data.promotion?.doubleDay && data.promotion?.promoCode) {
                    const currency = data.currency?.text || "฿";
                    if (data.promotion.type === 1) {
                        promoText = `${data.promotion.value}% off: ${data.promotion.promoCode}`;
                    } else if (data.promotion.type === 2) {
                        promoText = `${currency}${data.promotion.value} off: ${data.promotion.promoCode}`;
                    }
                }

                return {
                    id: docSnap.id,
                    shopName: data.shopName || "",
                    galleryImage,
                    rating: data.google_infos?.rating || 0,
                    totalReviews: data.google_infos?.user_ratings_total || 0,
                    neighborhood: data.neighborhood || data.city || "",
                    shopTypeId: data.shopType?.id,
                    promoText,
                    booking_id: data.booking_id || "",
                    // Keep raw data for filtering
                    _highlightType: data.highlight?.type || null,
                    _hasPromo: data.promotion?.doubleDay === true,
                };
            });

            // Prefetch first images
            allShops.slice(0, 6).forEach(shop => {
                if (shop.galleryImage) Image.prefetch(shop.galleryImage);
            });
            
            // Filter by type (as per documentation)
            const promo = allShops.filter(s => s._hasPromo).slice(0, 10);
            const trending = allShops.filter(s => s._highlightType === "Trending").slice(0, 10);
            const nail = allShops.filter(s => s._highlightType === "Nail studio").slice(0, 10);
            const massage = allShops.filter(s => s._highlightType === "Massage salon").slice(0, 10);
            const hair = allShops.filter(s => s._highlightType === "Hair salon").slice(0, 10);
            
            if (mountedRef.current) {
                setPromoShops(promo);
                setTrendingShops(trending);
                setNailShops(nail);
                setMassageShops(massage);
                setHairShops(hair);
                setLoadingHighlights(false);
            }
        } catch (error) {
            console.error("Error fetching highlights:", error);
            if (mountedRef.current) setLoadingHighlights(false);
        }
    }, []);

    // Recently Viewed from AsyncStorage
    const fetchRecentlyViewed = useCallback(async () => {
        try {
            const storedIds = await AsyncStorage.getItem(RECENTLY_VIEWED_KEY);
            if (!storedIds) {
                if (mountedRef.current) setLoadingRecent(false);
                return;
            }

            const ids = JSON.parse(storedIds).slice(0, 10);
            if (ids.length === 0) {
                if (mountedRef.current) setLoadingRecent(false);
                return;
            }

            const shopsRef = collection(firestore, "Shops");
            // Fetch in batches of 10 (Firestore 'in' limit)
            const batches = [];
            for (let i = 0; i < ids.length; i += 10) {
                batches.push(ids.slice(i, i + 10));
            }

            const results = [];
            for (const batch of batches) {
                const q = query(shopsRef, where("__name__", "in", batch));
                const snapshot = await getDocs(q);
                snapshot.docs.forEach(doc => results.push(transformShopDoc(doc)));
            }

            // Sort by original order
            const orderedResults = ids
                .map(id => results.find(r => r.id === id))
                .filter(Boolean);

            if (mountedRef.current) {
                setRecentlyViewed(orderedResults);
                setLoadingRecent(false);
            }
        } catch (error) {
            if (mountedRef.current) setLoadingRecent(false);
            }
    }, [transformShopDoc]);

    // Banners
    const fetchBanners = useCallback(async () => {
        try {
            const bannersRef = collection(firestore, "SearchBanners");
            const q = query(
                bannersRef,
                where("category", "==", "beauty"),
                where("isActive", "==", true),
                orderBy("priority", "asc"),
                limit(3)
            );
            const snapshot = await getDocs(q);
            
            if (mountedRef.current) {
                const bannersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setBanners(bannersData);
                setLoadingBanners(false);
                // Prefetch banner images
                bannersData.forEach(b => {
                    const url = b.banner?.[lang]?.url?.mobile || b.banner?.en?.url?.mobile;
                    if (url) Image.prefetch(url);
                });
            }
        } catch (error) {
            if (mountedRef.current) setLoadingBanners(false);
        }
    }, [lang]);

    // ============ FETCH ALL DATA ============
    const fetchAllData = useCallback(async () => {
        // All sections fetch in parallel
        await Promise.all([
            fetchHighlights(),
            fetchRecentlyViewed(),
            fetchBanners(),
        ]);
    }, [fetchHighlights, fetchRecentlyViewed, fetchBanners]);

    // ============ EFFECTS ============
    useEffect(() => {
        mountedRef.current = true;
        fetchAllData();
        return () => { mountedRef.current = false; };
    }, [fetchAllData]);

    // ============ HANDLERS (MEMOIZED) ============
    const onPressBack = useCallback(() => navigation.goBack(), [navigation]);

    const onPressShop = useCallback((shop) => {
        // Save to recently viewed
        AsyncStorage.getItem(RECENTLY_VIEWED_KEY).then(stored => {
            const ids = stored ? JSON.parse(stored) : [];
            const filtered = ids.filter(id => id !== shop.id);
            const updated = [shop.id, ...filtered].slice(0, 20);
            AsyncStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
        });
        goToScreen(navigation, "Venue", { shopId: shop.id, booking_id: shop.booking_id });
    }, [navigation]);

    const onPressSearch = useCallback(() => {
        goToScreen(navigation, "BeautySearch", selectedCategory ? { category: selectedCategory.id } : {});
    }, [navigation, selectedCategory]);
    
    const onSelectCategory = useCallback((cat) => {
        setSelectedCategory(cat?.id === "all" ? null : cat);
        setCategoryDropdownVisible(false);
    }, []);
    
    // Selected category label
    const selectedCategoryLabel = useMemo(() => {
        if (!selectedCategory) {
            // Use same translations as BeautySearch
            return lang === "th" ? "บริการทั้งหมด" 
                : lang === "fr" ? "Tous les services"
                : "All services";
        }
        return lang === "th" ? (selectedCategory.textTh || selectedCategory.text)
            : lang === "fr" ? selectedCategory.text
            : (selectedCategory.textEn || selectedCategory.text);
    }, [selectedCategory, lang]);

    const onPressMore = useCallback((sectionId) => {
        goToScreen(navigation, "Shops", { filter: sectionId, shopType: 1 });
    }, [navigation]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchAllData();
        setRefreshing(false);
    }, [fetchAllData]);

    // ============ FLATLIST OPTIMIZATIONS ============
    const getItemLayout = useCallback((_, index) => ({
        length: ITEM_WIDTH,
        offset: ITEM_WIDTH * index,
        index,
    }), []);

    const keyExtractor = useCallback((item) => item.id, []);

    const renderShopItem = useCallback(({ item }) => (
        <ShopCard item={item} onPress={onPressShop} defaultIcon={defaultIcon} lang={lang} />
    ), [onPressShop, defaultIcon, lang]);

    // ============ RENDER HELPERS ============
    const getBannerUrl = useCallback((banner, type = 'mobile') => {
        if (!banner?.banner) return null;
        const langBanner = banner.banner[lang] || banner.banner['en'] || banner.banner['th'];
        return langBanner?.url?.[type] || null;
    }, [lang]);

    // ============ RENDER CATEGORY DROPDOWN ============
    const renderCategoryDropdown = () => {
        if (!categoryDropdownVisible) return null;
        
        return (
            <View style={styles.dropdownContainer}>
                <ScrollView style={styles.dropdownList} nestedScrollEnabled>
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
        );
    };

    const renderHeroSection = () => (
        <LinearGradient
            colors={['#8FE8D8', '#E8F0F8', '#F0D8F8']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.heroContainer}
        >
            <View style={[styles.heroContent, { paddingTop: insets.top }]}>
                <View style={styles.heroHeader}>
            <TouchableOpacity style={styles.backButton} onPress={onPressBack}>
                <Image source={arrowBackImg} style={styles.backIcon} resizeMode="contain" />
            </TouchableOpacity>
                    <Text style={styles.heroTitle}>Beauty</Text>
            <View style={styles.headerSpacer} />
        </View>
                <View style={styles.sloganContainer}>
                    <Text style={styles.sloganText}>Today's the day</Text>
                    <Text style={styles.sloganText}>to treat yourself</Text>
                </View>
                <View style={styles.searchBox}>
                    <View style={styles.categoryInputContainer}>
                        <TouchableOpacity 
                            style={styles.searchInput} 
                            onPress={() => setCategoryDropdownVisible(!categoryDropdownVisible)}
                            activeOpacity={0.9}
                        >
                            <Image source={searchIcon} style={styles.inputIcon} resizeMode="contain" />
                            <Text style={styles.inputText}>{selectedCategoryLabel}</Text>
                            <View style={styles.chevronDown} />
                        </TouchableOpacity>
                        {renderCategoryDropdown()}
                    </View>
                    <View style={styles.searchInput}>
                        <Image source={locationIcon} style={styles.inputIcon} resizeMode="contain" />
                        <Text style={styles.inputText} numberOfLines={1}>{locationName}</Text>
                    </View>
                    <TouchableOpacity style={styles.searchButton} onPress={onPressSearch}>
                        <Text style={styles.searchButtonText}>
                            {lang === "th" ? "ค้นหา" 
                                : lang === "fr" ? "Rechercher"
                                : "Search"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </LinearGradient>
    );

    const renderSectionHeader = (title, onPressFn) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {onPressFn && (
                <TouchableOpacity style={styles.moreButton} onPress={onPressFn}>
                    <Text style={styles.moreText}>More</Text>
                    <View style={styles.chevronRight} />
                        </TouchableOpacity>
            )}
        </View>
    );

    const renderSection = (title, data, sectionId, isLoading) => {
        if (isLoading) {
            return (
                <View style={styles.section}>
                    {renderSectionHeader(title, null)}
                    <FlatList
                        data={[1, 2]}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalList}
                        keyExtractor={(item) => `skeleton-${item}`}
                        renderItem={() => <CardSkeleton />}
                    />
                </View>
            );
        }

        if (data.length === 0) return null;

        return (
            <View style={styles.section}>
                {renderSectionHeader(title, () => onPressMore(sectionId))}
                <FlatList
                    data={data}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                    keyExtractor={keyExtractor}
                    renderItem={renderShopItem}
                    initialNumToRender={4}
                    maxToRenderPerBatch={4}
                    windowSize={3}
                    removeClippedSubviews
                    getItemLayout={getItemLayout}
                />
            </View>
        );
    };

    const renderBanner = (banner, index) => {
        if (!banner) return null;
        const imageUrl = getBannerUrl(banner, 'mobile');
        if (!imageUrl) return null;

        return (
            <View key={`banner-${index}`} style={styles.bannerContainer}>
                <TouchableOpacity onPress={() => {
                    const redirectUrl = getBannerUrl(banner, 'redirect');
                    // Handle redirect if needed
                }}>
                    <Image source={{ uri: imageUrl }} style={styles.bannerImage} resizeMode="cover" />
                </TouchableOpacity>
            </View>
        );
    };

    // ============ MAIN RENDER ============
    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: bottomTarSpace + insets.bottom + 20 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />
                }
            >
                {renderHeroSection()}

                <View style={styles.contentContainer}>
                    {loadingBanners ? <BannerSkeleton /> : banners[0] && renderBanner(banners[0], 0)}

                    {renderSection("Up to 50% off 🔥", promoShops, "promo", loadingHighlights)}
                    {renderSection("Recently viewed", recentlyViewed, "recently", loadingRecent)}

                    {loadingBanners ? <BannerSkeleton /> : banners[1] && renderBanner(banners[1], 1)}

                    {renderSection("Massage salon", massageShops, "massage", loadingHighlights)}
                    {renderSection("Nail studio", nailShops, "nail", loadingHighlights)}

                    {loadingBanners ? <BannerSkeleton /> : banners[2] && renderBanner(banners[2], 2)}

                    {renderSection("Hair Salon", hairShops, "hair", loadingHighlights)}
                    {renderSection("Trending", trendingShops, "trending", loadingHighlights)}
                </View>
            </ScrollView>
        </View>
    );
}

// ============ STYLES ============
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    heroContainer: {
        width: SCREEN_WIDTH,
        height: 406,
    },
    heroContent: {
        flex: 1,
        paddingHorizontal: 20,
    },
    heroHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        height: 60,
    },
    backButton: {
        width: 40,
        height: 30,
        justifyContent: "center",
    },
    backIcon: {
        width: 40,
        height: 30,
    },
    heroTitle: {
        fontSize: 20,
        fontWeight: "600",
        color: "#000000",
    },
    headerSpacer: {
        width: 40,
    },
    sloganContainer: {
        marginTop: 20,
        marginBottom: 15,
    },
    sloganText: {
        fontSize: 20,
        fontWeight: "600",
        color: "#000000",
        lineHeight: 28,
    },
    searchBox: {
        backgroundColor: "#FFFFFF",
        borderRadius: 17,
        borderWidth: 3.5,
        borderColor: "#A0F0E0",
        padding: 13,
        gap: 13,
    },
    searchInput: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 9,
        borderWidth: 0.9,
        borderColor: "#D9D9D9",
        height: 35,
        paddingHorizontal: 9,
    },
    inputIcon: {
        width: 13,
        height: 13,
        tintColor: "#000000",
        marginRight: 9,
    },
    inputText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#000000",
        flex: 1,
    },
    searchButton: {
        backgroundColor: primaryColor,
        borderRadius: 17,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
    },
    searchButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    contentContainer: {
        paddingTop: 20,
    },
    section: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#0F0E0E",
    },
    moreButton: {
        flexDirection: "row",
        alignItems: "center",
    },
    moreText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#767881",
        marginRight: 7,
    },
    chevronRight: {
        width: 5,
        height: 10,
        borderRightWidth: 1.5,
        borderTopWidth: 1.5,
        borderColor: "#767881",
        transform: [{ rotate: "45deg" }],
    },
    horizontalList: {
        paddingHorizontal: 20,
        gap: CARD_GAP,
    },
    shopCard: {
        width: CARD_WIDTH,
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        overflow: "hidden",
    },
    cardImageContainer: {
        width: "100%",
        height: CARD_IMAGE_HEIGHT,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        overflow: "hidden",
        position: "relative",
    },
    cardImage: {
        width: "100%",
        height: "100%",
    },
    promoBadge: {
        position: "absolute",
        top: 9,
        left: 9,
        right: 9,
        backgroundColor: primaryColor,
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 11,
        flexDirection: "row",
        alignItems: "center",
    },
    promoBadgeText: {
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: "500",
    },
    cardInfo: {
        minHeight: CARD_INFO_HEIGHT,
        borderWidth: 1,
        borderTopWidth: 0,
        borderColor: "#D9D9D9",
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        padding: 10,
        paddingBottom: 12,
        justifyContent: "space-between",
    },
    cardInfoContent: {
        gap: 4,
    },
    shopName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#000000",
    },
    ratingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: "500",
        color: "#000000",
    },
    starIcon: {
        fontSize: 10,
        color: "#FFD700",
        marginHorizontal: 2,
    },
    reviewsText: {
        fontSize: 12,
        fontWeight: "500",
        color: "#000000",
        marginLeft: 4,
    },
    locationText: {
        fontSize: 12,
        fontWeight: "500",
        color: "#747676",
    },
    typeTag: {
        alignSelf: "flex-start",
        borderWidth: 1,
        borderColor: "#D9D9D9",
        borderRadius: 8,
        paddingVertical: 5,
        paddingHorizontal: 7,
        backgroundColor: "#FFFFFF",
        marginTop: 8,
    },
    typeTagText: {
        fontSize: 10,
        fontWeight: "500",
        color: "#000000",
    },
    bannerContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    bannerImage: {
        width: "100%",
        height: 183,
        borderRadius: 12,
    },
    skeletonCard: {
        width: CARD_WIDTH,
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        overflow: "hidden",
    },
    skeletonImage: {
        width: "100%",
        height: CARD_IMAGE_HEIGHT,
        backgroundColor: "#E5E5E5",
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    skeletonInfo: {
        padding: 10,
        gap: 8,
        borderWidth: 1,
        borderTopWidth: 0,
        borderColor: "#E5E5E5",
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        minHeight: CARD_INFO_HEIGHT,
    },
    skeletonLine: {
        height: 12,
        backgroundColor: "#E5E5E5",
        borderRadius: 4,
        width: '80%',
    },
    skeletonBanner: {
        width: "100%",
        height: 183,
        backgroundColor: "#E5E5E5",
        borderRadius: 12,
    },
    categoryInputContainer: {
        position: "relative",
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
    dropdownContainer: {
        position: "absolute",
        top: 40,
        left: 0,
        right: 0,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#D9D9D9",
        borderRadius: 9,
        maxHeight: 300,
        zIndex: 1000,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    dropdownList: {
        maxHeight: 300,
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
