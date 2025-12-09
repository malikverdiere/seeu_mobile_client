import React, { useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    FlatList,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Dimensions,
    StatusBar,
    SafeAreaView,
    RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NoUserContext, UserContext, goToScreen, primaryColor, setAppLang, traductor, shopTypes } from '../AGTools';
import { AuthContext } from '../Login';
import { auth, firestore } from '../../firebase.config';
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    getDocs,
} from '@react-native-firebase/firestore';

// Images
const appIcon = require("../img/logo/defaultImg.png");
const searchIcon = require("../img/btn/search.png");
const filterIcon = require("../img/btn/filter.png");
const arrowBackImg = require("../img/btn/arrowBack.png");
const locationIcon = require("../img/btn/location.png");

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SHOP_CARD_HEIGHT = 280;
const ITEMS_PER_PAGE = 10;

// Beauty subcategories for filter chips
const BEAUTY_CATEGORIES = [
    { id: "all", text: "All", textEn: "All", textTh: "ทั้งหมด" },
    { id: "salon-de-coiffure", text: "Coiffure", textEn: "Hair salon", textTh: "ร้านทำผม" },
    { id: "barbiers", text: "Barbiers", textEn: "Barbers", textTh: "ช่างตัดผม" },
    { id: "instituts-de-beaute", text: "Beauté", textEn: "Beauty", textTh: "ความงาม" },
    { id: "spa", text: "Spa", textEn: "Spa", textTh: "สปา" },
    { id: "nail", text: "Nails", textEn: "Nails", textTh: "เล็บ" },
    { id: "massage", text: "Massage", textEn: "Massage", textTh: "นวด" },
];

export default function BeautyHome({ navigation, route }) {
    const authContext = useContext(AuthContext);
    const {
        user,
        noUserlocation,
    } = useContext(authContext.user ? UserContext : NoUserContext);

    const [searchText, setSearchText] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const insets = useSafeAreaInsets();
    const lang = setAppLang();
    const defaultIcon = Image.resolveAssetSource(appIcon).uri;

    // Location
    const userLocation = user?.docData?.geolocation || noUserlocation;
    const locationName = userLocation?.city || "Location";

    // Get translated category text
    const getCategoryText = (category) => {
        if (lang === "th") return category.textTh || category.text;
        if (lang === "en") return category.textEn || category.text;
        return category.text;
    };

    // Fetch Beauty shops from Firestore
    const fetchShops = async (isLoadMore = false, isRefresh = false) => {
        if (isLoadMore && !hasMore) return;
        if (isLoadMore) setLoadingMore(true);
        else if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const shopsRef = collection(firestore, "Shops");
            let constraints = [
                where("shopValid", "==", true),
                where("shopType.type", "==", 1), // 1 = beauty
            ];

            // Filter by subcategory if not "all"
            if (selectedCategory !== "all") {
                constraints.push(where("shop_type", "array-contains", selectedCategory));
            }

            // Order by rating
            constraints.push(orderBy("google_infos.user_ratings_total", "desc"));
            constraints.push(limit(ITEMS_PER_PAGE));

            // Pagination
            if (isLoadMore && lastDoc) {
                constraints.push(startAfter(lastDoc));
            }

            const q = query(shopsRef, ...constraints);
            const snapshot = await getDocs(q);

            const newShops = snapshot.docs.map(docSnap => {
                const data = docSnap.data();
                const galleryImage = Array.isArray(data.GalleryPictureShop) && data.GalleryPictureShop.length > 0
                    ? data.GalleryPictureShop[0]
                    : null;

                // Get shopType label
                const shopTypeMatch = shopTypes.find(cat => cat.id === data.shopType?.id);
                let shopTypeLabel = "";
                if (shopTypeMatch) {
                    if (lang === "th") shopTypeLabel = shopTypeMatch.textTh || shopTypeMatch.text || "";
                    else if (lang === "fr") shopTypeLabel = shopTypeMatch.text || "";
                    else shopTypeLabel = shopTypeMatch.textEn || shopTypeMatch.text || "";
                }

                return {
                    id: docSnap.id,
                    shopName: data.shopName || "",
                    galleryImage: galleryImage || data.cover_Shop_Img || data.logo_Shop_Img || null,
                    logo: data.logo_Shop_Img || null,
                    rating: data.google_infos?.rating || 0,
                    totalReviews: data.google_infos?.user_ratings_total || 0,
                    neighborhood: data.neighborhood || data.city || "",
                    shopTypeLabel,
                    promoLabel: data.promoLabel || null,
                    booking_id: data.booking_id || "",
                    currency: data.currency?.text || "฿",
                };
            });

            // Update state
            if (isLoadMore) {
                setShops(prev => [...prev, ...newShops]);
            } else {
                setShops(newShops);
            }

            // Update pagination
            if (snapshot.docs.length > 0) {
                setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            }
            setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);

        } catch (error) {
            console.error("Error fetching beauty shops:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    };

    // Reset and fetch when category changes
    useEffect(() => {
        setShops([]);
        setLastDoc(null);
        setHasMore(true);
        fetchShops();
    }, [selectedCategory]);

    // Handle refresh
    const onRefresh = useCallback(() => {
        setLastDoc(null);
        setHasMore(true);
        fetchShops(false, true);
    }, [selectedCategory]);

    // Handle load more
    const onLoadMore = () => {
        if (!loadingMore && hasMore) {
            fetchShops(true);
        }
    };

    // Filter shops by search text
    const filteredShops = searchText.trim()
        ? shops.filter(shop =>
            shop.shopName.toLowerCase().includes(searchText.toLowerCase()) ||
            shop.neighborhood.toLowerCase().includes(searchText.toLowerCase())
        )
        : shops;

    // Navigate to shop
    const onPressShop = (shop) => {
        goToScreen(navigation, "Shop", { shopId: shop.id });
    };

    // Go back
    const onPressBack = () => {
        navigation.goBack();
    };

    // Go to location selection
    const onPressLocation = () => {
        StatusBar.setBarStyle("light-content", true);
        goToScreen(navigation, "GeolocationView", { from: "BeautyHome" });
    };

    // Navigate to search page
    const onPressSearch = () => {
        goToScreen(navigation, "BeautySearch", { searchText });
    };

    // Render header
    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onPressBack}>
                <Image source={arrowBackImg} style={styles.backIcon} resizeMode="contain" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.locationButton} onPress={onPressLocation}>
                <Image source={locationIcon} style={styles.locationIcon} resizeMode="contain" />
                <Text style={styles.locationText} numberOfLines={1}>{locationName}</Text>
                <View style={styles.chevronDown} />
            </TouchableOpacity>
            <View style={styles.headerSpacer} />
        </View>
    );

    // Render search bar
    const renderSearchBar = () => (
        <TouchableOpacity style={styles.searchContainer} onPress={onPressSearch} activeOpacity={0.8}>
            <View style={styles.searchBar}>
                <Image source={searchIcon} style={styles.searchIcon} resizeMode="contain" />
                <Text style={styles.searchPlaceholder}>{traductor("Search beauty shops...")}</Text>
            </View>
            <TouchableOpacity style={styles.filterButton}>
                <Image source={filterIcon} style={styles.filterIcon} resizeMode="contain" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    // Render category chips
    const renderCategories = () => (
        <View style={styles.categoriesContainer}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesScroll}
            >
                {BEAUTY_CATEGORIES.map((category) => {
                    const isSelected = selectedCategory === category.id;
                    return (
                        <TouchableOpacity
                            key={category.id}
                            style={[
                                styles.categoryChip,
                                isSelected && styles.categoryChipSelected
                            ]}
                            onPress={() => setSelectedCategory(category.id)}
                        >
                            <Text style={[
                                styles.categoryChipText,
                                isSelected && styles.categoryChipTextSelected
                            ]}>
                                {getCategoryText(category)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );

    // Render shop card
    const renderShopCard = ({ item }) => (
        <TouchableOpacity
            style={styles.shopCard}
            onPress={() => onPressShop(item)}
            activeOpacity={0.9}
        >
            <View style={styles.shopImageContainer}>
                <Image
                    source={{ uri: item.galleryImage || defaultIcon }}
                    style={styles.shopImage}
                    resizeMode="cover"
                />
                {item.promoLabel && (
                    <View style={styles.promoBadge}>
                        <Text style={styles.promoBadgeText}>{item.promoLabel}</Text>
                    </View>
                )}
            </View>
            <View style={styles.shopInfo}>
                <Text style={styles.shopName} numberOfLines={1}>{item.shopName}</Text>
                <View style={styles.ratingRow}>
                    <Text style={styles.ratingText}>{item.rating?.toFixed(1) || "0.0"}</Text>
                    <Text style={styles.starIcon}>★</Text>
                    <Text style={styles.reviewsText}>({item.totalReviews || 0} Reviews)</Text>
                </View>
                <Text style={styles.locationText2} numberOfLines={1}>{item.neighborhood}</Text>
                {item.shopTypeLabel ? (
                    <View style={styles.typeTag}>
                        <Text style={styles.typeTagText}>{item.shopTypeLabel}</Text>
                    </View>
                ) : null}
            </View>
        </TouchableOpacity>
    );

    // Render footer (loading more)
    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={styles.loadingMore}>
                <ActivityIndicator color={primaryColor} />
            </View>
        );
    };

    // Render empty state
    const renderEmpty = () => {
        if (loading) return null;
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{traductor("No beauty shops found")}</Text>
                <Text style={styles.emptySubtext}>{traductor("Try changing your filters")}</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea} />
            <StatusBar barStyle="dark-content" />

            {renderHeader()}
            {renderSearchBar()}
            {renderCategories()}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={primaryColor} />
                </View>
            ) : (
                <FlatList
                    data={filteredShops}
                    renderItem={renderShopCard}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingBottom: insets.bottom + 20 }
                    ]}
                    showsVerticalScrollIndicator={false}
                    onEndReached={onLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderFooter}
                    ListEmptyComponent={renderEmpty}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={primaryColor}
                        />
                    }
                />
            )}
        </View>
    );
}

const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    safeArea: {
        backgroundColor: "#FFFFFF",
    },

    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    backIcon: {
        width: 20,
        height: 20,
        tintColor: "#1D1D1B",
    },
    locationButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 12,
    },
    locationIcon: {
        width: 16,
        height: 16,
        tintColor: primaryColor,
        marginRight: 6,
    },
    locationText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1D1D1B",
        maxWidth: 150,
    },
    chevronDown: {
        width: 8,
        height: 8,
        borderRightWidth: 2,
        borderBottomWidth: 2,
        borderColor: "#1D1D1B",
        transform: [{ rotate: "45deg" }],
        marginLeft: 8,
        marginTop: -2,
    },
    headerSpacer: {
        width: 40,
    },

    // Search
    searchContainer: {
        flexDirection: "row",
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    searchBar: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F5F5F5",
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 48,
    },
    searchIcon: {
        width: 18,
        height: 18,
        tintColor: "#999",
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: "#1D1D1B",
    },
    searchPlaceholder: {
        flex: 1,
        fontSize: 15,
        color: "#999",
    },
    filterButton: {
        width: 48,
        height: 48,
        backgroundColor: "#F5F5F5",
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 10,
    },
    filterIcon: {
        width: 20,
        height: 20,
        tintColor: "#1D1D1B",
    },

    // Categories
    categoriesContainer: {
        marginBottom: 16,
    },
    categoriesScroll: {
        paddingHorizontal: 16,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: "#F5F5F5",
        borderRadius: 20,
        marginRight: 8,
    },
    categoryChipSelected: {
        backgroundColor: primaryColor,
    },
    categoryChipText: {
        fontSize: 13,
        fontWeight: "500",
        color: "#1D1D1B",
    },
    categoryChipTextSelected: {
        color: "#FFFFFF",
    },

    // List
    listContent: {
        paddingHorizontal: 16,
    },
    row: {
        justifyContent: "space-between",
        marginBottom: 16,
    },

    // Shop Card
    shopCard: {
        width: CARD_WIDTH,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#E5E5E5",
    },
    shopImageContainer: {
        width: "100%",
        height: 140,
        position: "relative",
    },
    shopImage: {
        width: "100%",
        height: "100%",
    },
    promoBadge: {
        position: "absolute",
        top: 8,
        left: 8,
        right: 8,
        backgroundColor: primaryColor,
        borderRadius: 8,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    promoBadgeText: {
        color: "#FFFFFF",
        fontSize: 10,
        fontWeight: "600",
        textAlign: "center",
    },
    shopInfo: {
        padding: 12,
    },
    shopName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1D1D1B",
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
        color: "#1D1D1B",
    },
    starIcon: {
        fontSize: 11,
        color: "#FFD700",
        marginHorizontal: 3,
    },
    reviewsText: {
        fontSize: 11,
        color: "#666",
    },
    locationText2: {
        fontSize: 12,
        color: "#666",
        marginBottom: 8,
    },
    typeTag: {
        alignSelf: "flex-start",
        backgroundColor: "#F5F5F5",
        borderRadius: 6,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    typeTagText: {
        fontSize: 10,
        fontWeight: "500",
        color: "#666",
    },

    // Loading
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    loadingMore: {
        paddingVertical: 20,
        alignItems: "center",
    },

    // Empty
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1D1D1B",
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: "#666",
    },
});

