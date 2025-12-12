import React, { useContext, useEffect, useState, useMemo, useCallback, memo } from 'react';
import { Dimensions, FlatList, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserContext, goToScreen, primaryColor, shopTypes, traductor, getShopTypeLabel, setAppLang } from '../AGTools';
import { RefreshControl } from 'react-native-gesture-handler';
import { useIsFocused } from '@react-navigation/native';
import { ModalBox } from '../ModalBox';
import NFCRead from '../NFCRead';

const defaultShopLogo = require("../img/logo/defaultImg.png")

// ============ ICONS ============
const ArrowBackIcon = ({ size = 24, color = "#000" }) => (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{
            width: size * 0.4,
            height: size * 0.4,
            borderLeftWidth: 2,
            borderBottomWidth: 2,
            borderColor: color,
            transform: [{ rotate: '45deg' }],
            marginLeft: size * 0.1,
        }} />
    </View>
);

const widthW = Dimensions.get("window").width
const CARD_WIDTH = (widthW - 48) / 2; // 2 columns with padding and gap
const CARD_GAP = 16;

// ============ FILTER TAB COMPONENT ============
const FilterTab = memo(({ type, isActive, onPress, label }) => (
    <TouchableOpacity 
        style={[styles.filterTab, isActive && styles.filterTabActive]} 
        onPress={() => onPress(type)}
        activeOpacity={0.8}
        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
    >
        <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>{label}</Text>
    </TouchableOpacity>
));

// ============ SHOP CARD COMPONENT ============
const ShopCard = memo(({ item, onPress, defaultIcon }) => {
    const lang = setAppLang();
    const shopData = item?.docData || {};
    
    // Get gallery image or fallback
    const galleryImage = Array.isArray(shopData.GalleryPictureShop) && shopData.GalleryPictureShop.length > 0
        ? shopData.GalleryPictureShop[0]
        : (shopData.cover_Shop_Img || shopData.logo_Shop_Img || defaultIcon);
    
    // Get shop type label
    const shopTypeLabel = getShopTypeLabel(shopData.shopType?.id, lang);
    
    // Location display
    const locationDisplay = shopData.neighborhood || shopData.address || "";
    
    // Rating from shop reviews
    const rating = shopData.shopRating || 0;
    const totalReviews = shopData.shopRatingNumber || 0;

    return (
        <TouchableOpacity 
            style={styles.shopCard} 
            onPress={() => onPress(shopData.userId)}
            activeOpacity={0.9}
        >
            <View style={styles.shopImageContainer}>
                <Image 
                    style={styles.shopImage} 
                    source={{ uri: typeof galleryImage === 'string' ? galleryImage : defaultIcon }} 
                    resizeMode="cover"
                />
                {shopData.promoLabel && (
                    <View style={styles.promoBadge}>
                        <Text style={styles.promoBadgeText} numberOfLines={1}>{shopData.promoLabel}</Text>
                    </View>
                )}
            </View>
            <View style={styles.shopInfo}>
                <Text style={styles.shopName} numberOfLines={1}>{shopData.shopName || ""}</Text>
                <View style={styles.ratingRow}>
                    <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                    <Text style={styles.starIcon}>★</Text>
                    <Text style={styles.reviewsText}>({totalReviews} Reviews)</Text>
                </View>
                <Text style={styles.locationText} numberOfLines={1}>{locationDisplay}</Text>
                <View style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{shopTypeLabel}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
});

export default function Shops({
    navigation,
}){
    const {
        user,
        currentShops,
        setShopsUpdate,
    } = useContext(UserContext)

    const [shopType, setShopType] = useState({id: "0-default",text: traductor("Tout")})
    const defaultIcon = useMemo(() => Image.resolveAssetSource(defaultShopLogo).uri, []);
    const insets = useSafeAreaInsets();

    const typeDocData = []
    currentShops.map((shop)=>{
        shopTypes.map((type)=>{
            if(type?.id === shop?.docData?.shopType?.id || type?.docData?.id === "0-default"){
                typeDocData.push(type)
            }
        })
    })
    typeDocData.sort((a, b)=>{
        if(a.id < b.id) { return -1 }
        if(a.id > b.id) { return 1 }
        return 0;
    })
    let typesExist = typeDocData.filter((x, i) => typeDocData.indexOf(x) === i)
    
    // Prepare filter tabs with "All" first
    const lang = setAppLang();
    const filterTabs = useMemo(() => {
        const allTab = { id: "0-default", text: traductor("Tout") };
        const otherTabs = typesExist.filter(type => type.id !== "0-default").map(type => ({
            id: type.id,
            text: getShopTypeLabel(type.id, lang)
        }));
        return [allTab, ...otherTabs];
    }, [typesExist, lang]);

    const shopsFilter = useMemo(() => {
        return currentShops.filter((shop)=>{
            if(shopType?.id === "0-default" || shopType === null){
                return shop
            } else {
                return shop?.docData?.shopType?.id === shopType?.id
            }
        })
    }, [currentShops, shopType]);

    const isFocused = useIsFocused()
    const modalBox = ModalBox()

    const onRefresh = useCallback(() => {
        setShopsUpdate(true)
    }, [setShopsUpdate])

    const onBack = useCallback(() => {
        goToScreen(navigation,"goBack")
    }, [navigation])

    const onPressShop = useCallback((shopId) => {
        if(user){
            goToScreen(navigation,"Shop",{shopId:shopId})
        } else {
            modalBox.openBoxConfirm("",traductor("Vous devez avoir un compte pour accéder à ce contenu"))
        }
    }, [navigation, user, modalBox])

    const onConfirm = useCallback(() => {
        goToScreen(navigation,"Compte")
    }, [navigation])

    const onPressFilterTab = useCallback((type) => {
        setShopType(type)
    }, [])

    const renderShopItem = useCallback(({ item }) => (
        <ShopCard 
            item={item} 
            onPress={onPressShop} 
            defaultIcon={defaultIcon}
        />
    ), [onPressShop, defaultIcon]);

    const keyExtractor = useCallback((item, index) => item?.docData?.userId || index.toString(), []);

    useEffect(() => {
        if (isFocused) StatusBar.setBarStyle("dark-content", true)
    },[isFocused])

    return(
        <View style={styles.viewContainer}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            
            {/* Header */}
            <SafeAreaView edges={['top']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={onBack}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <ArrowBackIcon size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{`${traductor("Loved")} 💜`}</Text>
                    <View style={styles.headerSpacer} />
                </View>
            </SafeAreaView>

            {/* Filter Tabs */}
            {filterTabs.length > 1 && (
                <View style={styles.filterTabsWrapper}>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterTabsContainer}
                    >
                        {filterTabs.map((tab, index) => (
                            <FilterTab 
                                key={tab.id || index}
                                type={tab}
                                isActive={shopType?.id === tab.id}
                                onPress={onPressFilterTab}
                                label={tab.text}
                            />
                        ))}
                    </ScrollView>
                </View>
            )}

            <FlatList
                data={shopsFilter}
                contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
                keyExtractor={keyExtractor}
                renderItem={renderShopItem}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
                refreshControl={
                    <RefreshControl 
                        refreshing={currentShops.length <= 0 ? true : false} 
                        onRefresh={onRefresh} 
                    />
                }
                ListFooterComponent={<View style={styles.footer} />}
            />

            {(isFocused && user) && <NFCRead navigation={navigation} modalBoxInfos={modalBox.openBoxInfos} />}

            {modalBox.renderBoxInfos("")}
            {modalBox.renderBoxConfirm(traductor("Ok"),traductor("Me connecter"),onConfirm)}
        </View>
    )
}

const styles = StyleSheet.create({
    viewContainer:{
        flex:1,
        backgroundColor:"#fff",
    },
    header: {
        backgroundColor: "#FFFFFF",
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: -10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1D1D1B",
        flex: 1,
        textAlign: "center",
    },
    headerSpacer: {
        width: 40,
    },
    filterTabsWrapper: {
        backgroundColor: "#FFFFFF",
    },
    filterTabsContainer: {
        paddingHorizontal: 20,
        paddingRight: 20,
        paddingVertical: 12,
        gap: 9,
    },
    filterTab: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#D9D9D9",
        borderRadius: 15,
        paddingHorizontal: 12,
        paddingVertical: 6,
        alignSelf: 'flex-start',
    },
    filterTabActive: {
        backgroundColor: primaryColor,
        borderColor: primaryColor,
    },
    filterTabText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#000000",
    },
    filterTabTextActive: {
        color: "#FFFFFF",
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: CARD_GAP,
    },
    footer: {
        marginBottom: 20,
    },
    // Shop Card Styles (similar to TrendingCard)
    shopCard: {
        width: CARD_WIDTH,
        backgroundColor: "#FFFFFF",
    },
    shopImageContainer: {
        width: CARD_WIDTH,
        height: 120,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        overflow: "hidden",
        position: 'relative',
    },
    shopImage: {
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
        maxWidth: CARD_WIDTH - 12,
    },
    promoBadgeText: {
        flex: 1,
        color: "#FFFFFF",
        fontSize: 10,
        fontWeight: "500",
        textAlign: "center",
    },
    shopInfo: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderTopWidth: 0,
        borderColor: "#D9D9D9",
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        padding: 10,
        minHeight: 105,
    },
    shopName: {
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
})
