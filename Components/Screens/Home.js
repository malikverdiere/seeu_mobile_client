import React, { useContext, useEffect, useRef, useState } from 'react';
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
    SafeAreaView, 
    Linking, 
    Platform 
} from 'react-native';
import { NoUserContext, UserContext, bottomTarSpace, boxShadowInput, campaignTypes, goToScreen, primaryColor, setAppLang, traductor, shopTypes } from '../AGTools';
import { CommonActions, useIsFocused } from "@react-navigation/native";
import { ModalBox } from '../ModalBox';
import { auth, firestore } from '../../firebase.config';
import {
    collection,
    collectionGroup,
    doc,
    query,
    where,
    orderBy,
    getDocs,
    getDoc,
    updateDoc,
    Timestamp,
} from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import NFCRead from '../NFCRead';
import MarketingCampaignResume from './MarketingCampaignResume';
import Notification, { addGift, addNotification, subTopic, updateRulesNotifReceived } from '../Notification';
import { AuthContext } from '../Login';
import { RenderListCampaigns } from './OffersList';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
    UpcomingSkeleton, 
    BannerSkeleton, 
    MyShopSkeleton, 
    TrendingSkeleton,
    SectionSkeleton 
} from '../SkeletonLoader';

// Images
const appIcon = require("../img/logo/defaultImg.png")
const qrCodeBtnImg = require("../img/btn/qrCode.png")
const notificationImg = require("../img/btn/notification.png")
const beautyIcon = require("../img/cat02.png")
const giftIcon = require("../img/reward.png")

const { width: SCREEN_WIDTH } = Dimensions.get("window")
const CARD_WIDTH = 243
const CARD_HEIGHT = 83
const SHOP_LOGO_SIZE = 88
const BANNER_HEIGHT = 183
const TRENDING_CARD_WIDTH = 180

export default function Home({ navigation }) {
    const authContext = useContext(AuthContext)
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
    } = useContext(authContext.user ? UserContext : NoUserContext)

    const [campaignPreview, setCampaignPreview] = useState(false)
    const [campaign, setCampaign] = useState(null)
    const [campaignCount, setCampaignCount] = useState(null)
    const [upcomingBookings, setUpcomingBookings] = useState([])
    const [trendingShops, setTrendingShops] = useState([])
    const [beautyBanners, setBeautyBanners] = useState([])
    const [loadingTrending, setLoadingTrending] = useState(true)
    const [loadingBanners, setLoadingBanners] = useState(true)
    const [loadingUpcoming, setLoadingUpcoming] = useState(true)

    const isFocused = useIsFocused()
    const modalBox = ModalBox()
    const pubScrollX = useRef(new Animated.Value(0)).current
    const defaultIcon = Image.resolveAssetSource(appIcon).uri
    const currentUser = auth.currentUser
    const userDoc = currentUser ? doc(firestore, "Clients", currentUser.uid) : null
    const registeredShopsCollection = currentUser ? collection(firestore, "Clients", currentUser.uid, "RegisteredShops") : null
    const campaignsCollection = collection(firestore, "CampaignsShops")
    const insets = useSafeAreaInsets()

    // Get user's first name
    const firstName = user?.docData?.firstname || user?.docData?.firstName || "there"

    // Notification count
    const chat_room_notification = user && chatRooms ? chatRooms.filter((chatRoom) => {
        return chatRoom?.docData?.status_client === 1 || chatRoom?.docData?.status_client === 2
    }) : []
    const notifCount = (notifications?.length || 0) + (chat_room_notification?.length || 0)

    // Location name
    const locationName = user?.docData?.geolocation?.city || noUserlocation?.city || "Localisation"

    const fetchCampaignCount = async () => {
        if (user?.docData?.geolocation || noUserlocation?.country) {
            if (user?.docData?.geolocation?.country_short !== "") {
                try {
                    const q = query(
                        campaignsCollection,
                        where("isFinish", "==", false),
                        where("campaign_Shop_Valid", "==", true),
                        where("country_short", "==", user?.docData?.geolocation?.country_short || noUserlocation?.country_short)
                    )
                    const querySnapshot = await getDocs(q)
                    setCampaignCount(querySnapshot.size)
                } catch (error) {
                    console.error("Error fetching campaign count:", error)
                }
            }
        }
    }

    // Fetch trending Beauty shops (highlight.type = "Trending")
    // Based on documentation: use shopTypes list to match shop.shopType.id
    const fetchTrendingShops = async () => {
        setLoadingTrending(true)
        try {
            const lang = setAppLang() // Get user's language (th, fr, en)
            const shopsRef = collection(firestore, "Shops")
            const q = query(
                shopsRef,
                where("shopType.type", "==", 1), // 1 = beauty
                where("shopValid", "==", true),
                where("highlight.isActive", "==", true)
            )
            const snapshot = await getDocs(q)
            
            const shops = snapshot.docs
                .map(docSnap => {
                    const data = docSnap.data()
                    // Get first image from GalleryPictureShop array
                    const galleryImage = Array.isArray(data.GalleryPictureShop) && data.GalleryPictureShop.length > 0
                        ? data.GalleryPictureShop[0]
                        : null
                    
                    // Get shopType label using shopTypes list (match by shopType.id)
                    // According to doc: categoriesList.find(cat => cat.id === shop?.shopType?.id)
                    // Then select translation: lang === "th" ? textTh : lang === "fr" ? text : textEn
                    const shopTypeMatch = shopTypes.find(cat => cat.id === data.shopType?.id)
                    let shopTypeLabel = ""
                    if (shopTypeMatch) {
                        // Select translation based on user's language
                        if (lang === "th") {
                            shopTypeLabel = shopTypeMatch.textTh || shopTypeMatch.text || ""
                        } else if (lang === "fr") {
                            shopTypeLabel = shopTypeMatch.text || ""
                        } else {
                            // en or default
                            shopTypeLabel = shopTypeMatch.textEn || shopTypeMatch.text || ""
                        }
                    }
                    
                    return {
                        id: docSnap.id,
                        shopName: data.shopName || "",
                        galleryImage: galleryImage || data.cover_Shop_Img || data.logo_Shop_Img || null,
                        logo: data.logo_Shop_Img || null,
                        rating: data.google_infos?.rating || 0,
                        totalReviews: data.google_infos?.user_ratings_total || 0,
                        address: data.address || "",
                        neighborhood: data.neighborhood || "",
                        shopTypeLabel: shopTypeLabel,
                        highlightType: data.highlight?.type || "Trending",
                        promoCode: data.activePromoCode || null,
                        promoText: data.activePromoText || null,
                        promoLabel: data.promoLabel || null,
                        shop_type: data.shop_type || [],
                        booking_id: data.booking_id || "",
                        currency: data.currency?.text || "฿",
                    }
                })
                .filter(shop => shop.highlightType === "Trending")
                .slice(0, 10) // Limit to 10 shops
            
            setTrendingShops(shops)
        } catch (error) {
            console.error("Error fetching trending shops:", error)
        } finally {
            setLoadingTrending(false)
        }
    }

    // Fetch Beauty banners from SearchBanners collection
    const fetchBeautyBanners = async () => {
        setLoadingBanners(true)
        try {
            const lang = setAppLang() // Get user's language (fr, en, th, etc.)
            const bannersRef = collection(firestore, "SearchBanners")
            const q = query(
                bannersRef,
                where("category", "==", "beauty"),
                where("isActive", "==", true),
                orderBy("priority", "asc")
            )
            const snapshot = await getDocs(q)
            
            const banners = snapshot.docs.map(docSnap => {
                const data = docSnap.data()
                // Get banner URL for user's language, fallback to 'en' if not available
                const bannerData = data.banner?.[lang] || data.banner?.en || data.banner?.fr || {}
                return {
                    id: docSnap.id,
                    imageUrl: bannerData.url?.mobile || bannerData.url?.desktop || null,
                    redirectUrl: bannerData.url?.redirect || null,
                    priority: data.priority || 0,
                }
            }).filter(banner => banner.imageUrl) // Only keep banners with images
            
            setBeautyBanners(banners)
        } catch (error) {
            console.error("Error fetching beauty banners:", error)
        } finally {
            setLoadingBanners(false)
        }
    }

    // Fetch upcoming bookings for current user
    // Based on doc: use collectionGroup + fetchShopData via booking_id
    const fetchUpcomingBookings = async () => {
        if (!currentUser?.uid) {
            setUpcomingBookings([])
            setLoadingUpcoming(false)
            return
        }
        
        setLoadingUpcoming(true)
        try {
            // Query all Booking collections using collectionGroup
            const bookingsRef = collectionGroup(firestore, "Booking")
            const q = query(
                bookingsRef,
                where("clientId", "==", currentUser.uid)
            )
            const snapshot = await getDocs(q)
            
            // Filter and enrich bookings
            const now = new Date()
            const bookingsPromises = snapshot.docs.map(async (docSnap) => {
                const data = docSnap.data()
                const bookingDate = data.date?.toDate?.() || new Date()
                
                // Set time on booking date
                if (data.timeStart) {
                    const [hours, minutes] = data.timeStart.split(':').map(Number)
                    bookingDate.setHours(hours, minutes)
                }
                
                // Filter: only upcoming bookings with status 1 or 2
                const isUpcoming = bookingDate >= now && [1, 2].includes(data.statut)
                if (!isUpcoming) return null
                
                // Fetch shop data using booking_id
                let shopData = null
                if (data.booking_id) {
                    try {
                        const shopsRef = collection(firestore, "Shops")
                        const shopQuery = query(shopsRef, where("booking_id", "==", data.booking_id))
                        const shopSnapshot = await getDocs(shopQuery)
                        if (!shopSnapshot.empty) {
                            shopData = shopSnapshot.docs[0].data()
                        }
                    } catch (e) {
                        console.log("Error fetching shop data:", e)
                    }
                }
                
                // Get first service name for display
                const firstService = data.services?.[0]
                const servicesCount = data.services?.length || 0
                
                return {
                    id: docSnap.id,
                    shopId: docSnap.ref.parent?.parent?.id || "",
                    shopName: shopData?.shopName || data.shopName || "Shop",
                    shopLogo: shopData?.logo_Shop_Img || null,
                    booking_id: data.booking_id || "",
                    date: data.date?.toDate?.() || new Date(),
                    dateBooking: data.dateBooking || "",
                    timeStart: data.timeStart || "",
                    timeEnd: data.timeEnd || "",
                    duration: data.duration || 0,
                    totalPrice: data.totalPrice || 0,
                    currency: shopData?.currency?.text || "฿",
                    services: data.services || [],
                    servicesCount,
                    firstServiceName: firstService?.name || "",
                    statut: data.statut,
                    booking_number: data.booking_number,
                }
            })
            
            const allBookings = await Promise.all(bookingsPromises)
            
            // Filter nulls and sort by date (ascending - closest first)
            const upcomingBookings = allBookings
                .filter(b => b !== null)
                .sort((a, b) => {
                    const aDate = new Date(a.date)
                    const bDate = new Date(b.date)
                    if (a.timeStart) {
                        const [aH, aM] = a.timeStart.split(':').map(Number)
                        aDate.setHours(aH, aM)
                    }
                    if (b.timeStart) {
                        const [bH, bM] = b.timeStart.split(':').map(Number)
                        bDate.setHours(bH, bM)
                    }
                    return aDate.getTime() - bDate.getTime()
                })
            
            setUpcomingBookings(upcomingBookings)
        } catch (error) {
            console.error("Error fetching upcoming bookings:", error)
        } finally {
            setLoadingUpcoming(false)
        }
    }

    // Format date for display
    const formatBookingDate = (date) => {
        if (!date) return ""
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const dayName = days[date.getDay()]
        const monthName = months[date.getMonth()]
        const day = date.getDate()
        const year = date.getFullYear()
        return `${dayName}, ${monthName} ${day}, ${year}`
    }

    // Get status label
    const getStatusLabel = (statut) => {
        switch (statut) {
            case 1: return "Pending"
            case 2: return "Getting there"
            default: return "Booked"
        }
    }

    function subLangue() {
        let lang = setAppLang()
        let topic = `user_lang_${lang}`
        subTopic(topic)

        if (lang !== user?.docData?.user_lang && userDoc) {
            updateDoc(userDoc, {
                user_lang: lang,
            }).then(() => {
                registeredShops.forEach(async (shop) => {
                    const shopDoc = doc(registeredShopsCollection, shop.docId)
                    await updateDoc(shopDoc, {
                        user_lang: lang,
                    })
                })
            })
        }
    }

    const onRefresh = () => {
        setShopsUpdate(true)
        setPubsUpdate(true)
        const resetAction = CommonActions.reset({
            index: 0,
            routes: [{ name: "Accueil" }]
        })
        navigation.dispatch(resetAction)
    }

    const onPressQrCodeVisible = () => goToScreen(navigation, "ClientQrCode")
    const onPressNotification = () => goToScreen(navigation, "NotifsChatRooms")
    const onPressGeolocation = () => {
        StatusBar.setBarStyle("light-content", true)
        goToScreen(navigation, "GeolocationView", { from: "Accueil" })
    }
    const onPressPubs = (item) => goToScreen(navigation, "Campaign", { shopId: item?.docData?.shopId, campaignId: item?.docData?.campaignId, pub: true })
    const onPressCampaignItem = (item) => {
        setCampaign(item?.docData)
        setCampaignPreview(true)
    }
    const onCloseCampaignItem = () => setCampaignPreview(false)
    const onPressShop = () => {
        goToScreen(navigation, "Shop", { shopId: campaign?.shopId })
        setTimeout(() => onCloseCampaignItem(), 1000)
    }
    const onPressLocation = () => {
        if (campaign?.address) {
            const url = Platform.select({
                ios: `maps:0,0?q=${campaign?.address}`,
                android: `geo:0,0?q=${campaign?.address}`,
            })
            Linking.openURL(url)
        }
    }
    const onConfirm = () => {
        goToScreen(navigation, "LogHome")
        setTimeout(() => onCloseCampaignItem(), 1000)
    }

    const handleOnScrollPub = (e) => {
        Animated.event([{
            nativeEvent: { contentOffset: { x: pubScrollX } },
        }], { useNativeDriver: false })(e)
    }

    const onPressBeauty = () => {
        goToScreen(navigation, "BeautyHome")
    }

    const onPressAllShops = () => goToScreen(navigation, "Shops")

    useEffect(() => {
        messaging().onNotificationOpenedApp(remoteMessage => {
            if (remoteMessage) {
                addNotification(remoteMessage, true)
                updateRulesNotifReceived(remoteMessage)
                addGift(remoteMessage)
                if (remoteMessage?.data?.type === "birthday" || remoteMessage?.data?.type === "lastVisit" || remoteMessage?.data?.type === "googleReview" || remoteMessage?.data?.type === "followInsta") {
                    goToScreen(navigation, "Shop", { shopId: remoteMessage?.data?.shopId })
                } else if (remoteMessage?.data?.shopId && remoteMessage?.data?.campaignId) {
                    goToScreen(navigation, "Campaign", { shopId: remoteMessage?.data?.shopId, campaignId: remoteMessage?.data?.campaignId, remoteMessage: remoteMessage })
                }
            }
        })
        messaging().getInitialNotification().then(remoteMessage => {
            if (remoteMessage) {
                addNotification(remoteMessage, true)
                updateRulesNotifReceived(remoteMessage)
                addGift(remoteMessage)
                if (remoteMessage?.data?.type === "birthday" || remoteMessage?.data?.type === "lastVisit" || remoteMessage?.data?.type === "googleReview" || remoteMessage?.data?.type === "followInsta") {
                    goToScreen(navigation, "Shop", { shopId: remoteMessage?.data?.shopId })
                } else if (remoteMessage?.data?.shopId && remoteMessage?.data?.campaignId) {
                    goToScreen(navigation, "Campaign", { shopId: remoteMessage?.data?.shopId, campaignId: remoteMessage?.data?.campaignId, remoteMessage: remoteMessage })
                }
            }
        })
    }, [])

    useEffect(() => {
        isFocused && StatusBar.setBarStyle("dark-content", true)
    }, [isFocused])

    useEffect(() => {
        setTimeout(() => {
            user && subLangue()
        }, 2000)
    }, [rewardsByShopUpdate])

    useEffect(() => {
        fetchCampaignCount()
        fetchTrendingShops()
        fetchBeautyBanners()
    }, [])

    useEffect(() => {
        fetchUpcomingBookings()
    }, [currentUser?.uid])

    Notification()

    // =============== RENDER COMPONENTS ===============

    // Header Component
    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity style={styles.headerLeft} onPress={onPressGeolocation}>
                <Text style={styles.headerLocationText}>{locationName}</Text>
                <View style={styles.chevronDown} />
            </TouchableOpacity>
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
    )

    // Greeting + Beauty Button Section
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
    )

    // Section Header with title and "More" button
    const renderSectionHeader = (title, count, onPressMore) => (
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
    )

    // Upcoming Bookings Section - Real data from Firestore
    const renderUpcomingSection = () => {
        if (loadingUpcoming) {
            return (
                <View style={styles.section}>
                    {renderSectionHeader("Upcoming", null, null)}
                    <UpcomingSkeleton count={2} />
                </View>
            )
        }

        if (upcomingBookings.length === 0) return null

        return (
            <View style={styles.section}>
                {renderSectionHeader("Upcoming", upcomingBookings.length, () => goToScreen(navigation, "Bookings"))}
                <FlatList
                    data={upcomingBookings}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => {
                        const dateStr = `${formatBookingDate(item.date)} at ${item.timeStart}`
                        const itemsCount = item.services?.length || 1
                        const priceDisplay = `${item.currency}${item.totalPrice}`
                        
                        return (
                            <TouchableOpacity 
                                style={styles.upcomingCard}
                                onPress={() => goToScreen(navigation, "BeautyBookingDetail", { 
                                    shopId: item.shopId, 
                                    bookingId: item.id,
                                    booking_id: item.booking_id 
                                })}
                            >
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
                                    <Text style={styles.upcomingAction}>{getStatusLabel(item.statut)}</Text>
                                </View>
                            </TouchableOpacity>
                        )
                    }}
                />
            </View>
        )
    }

    // Banner Section - Uses Beauty banners from SearchBanners collection
    const renderBannerSection = () => {
        // Use beautyBanners if available, fallback to pubs
        const bannersToShow = beautyBanners.length > 0 ? beautyBanners : pubs.map(p => ({
            id: p.docId,
            imageUrl: p.docData?.img,
            redirectUrl: null,
            legacy: true,
            docData: p.docData
        }))

        if (bannersToShow.length === 0) {
            if (loadingBanners) {
                return <BannerSkeleton />
            }
            return null
        }

        const handleBannerPress = (item) => {
            if (item.redirectUrl) {
                Linking.openURL(item.redirectUrl)
            } else if (item.legacy && item.docData?.pressable !== false) {
                onPressPubs({ docData: item.docData })
            }
        }

        return (
            <View style={styles.bannerSection}>
                <View style={styles.bannerWrapper}>
                    <FlatList
                        data={bannersToShow}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={handleOnScrollPub}
                        keyExtractor={(item, index) => item.id || index.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                style={styles.bannerContainer}
                                onPress={() => handleBannerPress(item)}
                                disabled={!item.redirectUrl && item.legacy && item.docData?.pressable === false}
                            >
                                <Image 
                                    style={styles.bannerImage} 
                                    source={{ uri: item.imageUrl || defaultIcon }} 
                                    resizeMode="cover"
                                />
                            </TouchableOpacity>
                        )}
                    />
                    {bannersToShow.length > 1 && (
                        <View style={styles.paginationContainer}>
                            {bannersToShow.map((_, index) => {
                                const dotWidth = pubScrollX.interpolate({
                                    inputRange: [(index - 1) * (SCREEN_WIDTH - 40), index * (SCREEN_WIDTH - 40), (index + 1) * (SCREEN_WIDTH - 40)],
                                    outputRange: [8, 20, 8],
                                    extrapolate: "clamp",
                                })
                                const dotBgColor = pubScrollX.interpolate({
                                    inputRange: [(index - 1) * (SCREEN_WIDTH - 40), index * (SCREEN_WIDTH - 40), (index + 1) * (SCREEN_WIDTH - 40)],
                                    outputRange: ["#FFFFFF", primaryColor, "#FFFFFF"],
                                    extrapolate: "clamp",
                                })
                                return (
                                    <Animated.View 
                                        key={index} 
                                        style={[styles.paginationDot, { width: dotWidth, backgroundColor: dotBgColor }]} 
                                    />
                                )
                            })}
                        </View>
                    )}
                </View>
            </View>
        )
    }

    // My Shop Section
    const renderMyShopSection = () => {
        if (!registeredShops || registeredShops.length === 0) return null

        return (
            <View style={styles.section}>
                {renderSectionHeader("My shop", null, onPressAllShops)}
                {currentShops.length <= 0 ? (
                    <MyShopSkeleton count={3} />
                ) : (
                    <FlatList
                        data={currentShops}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalList}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => {
                            const shopImg = item?.docData?.logo_Shop_Img && item?.docData?.shopValid === true 
                                ? item?.docData?.logo_Shop_Img 
                                : defaultIcon
                            const shopName = item?.docData?.shopName || ""
                            const displayName = shopName.length > 10 ? shopName.substring(0, 8) + "..." : shopName

                            return (
                                <TouchableOpacity 
                                    style={styles.shopItem}
                                    onPress={() => goToScreen(navigation, "Shop", { shopId: item?.docData?.userId })}
                                >
                                    <View style={styles.shopLogoContainer}>
                                        <Image 
                                            resizeMode="contain" 
                                            style={styles.shopLogo} 
                                            source={{ uri: shopImg }} 
                                        />
                                    </View>
                                    <Text style={styles.shopName} numberOfLines={1}>{displayName}</Text>
                                </TouchableOpacity>
                            )
                        }}
                    />
                )}
            </View>
        )
    }

    // My Gifts Section - Real data from rewards and gifts
    const renderMyGiftsSection = () => {
        // Helper to find shop by shopId
        const findShop = (shopId) => {
            return currentShops.find(shop => shop?.docData?.userId === shopId) || 
                   registeredShops.find(shop => shop?.docId === shopId)
        }
        
        // Combine rewards and gifts
        const allGifts = []
        
        // Add rewards from rewardsByShop
        if (rewardsByShop && rewardsByShop.length > 0) {
            rewardsByShop.forEach(reward => {
                const data = reward?.docData || {}
                // Find the client info for this shop
                const client = registeredShops?.find(r => r.docId === data.shopId)
                const userPoints = client?.docData?.points || 0
                
                if (userPoints >= (data.points || 0)) {
                    const shop = findShop(data.shopId)
                    const shopName = shop?.docData?.shopName || "Shop"
                    const currency = shop?.docData?.currency?.text || "฿"
                    
                    // Format offer text based on type (1=%, 2=fixe, 3=other)
                    let offerText = ""
                    if (data.type === 1) {
                        offerText = `${data.value}% ${traductor("offerts")}`
                    } else if (data.type === 2) {
                        offerText = `${data.value} ${currency} ${traductor("offerts")}`
                    } else if (data.type === 3) {
                        offerText = data.value || "Reward"
                    } else {
                        offerText = data.value || "Reward"
                    }
                    
                    allGifts.push({
                        id: reward.docId || reward.id,
                        type: 'reward',
                        shopId: data.shopId,
                        shopName: shopName,
                        offer: offerText,
                        points: data.points || 0,
                        description: data.description || traductor("Use on your next visit"),
                        giftType: data.giftType,
                    })
                }
            })
        }
        
        // Add gifts
        if (gifts && gifts.length > 0) {
            gifts.forEach(gift => {
                const data = gift?.docData || {}
                const shop = findShop(data.shopId)
                const shopName = shop?.docData?.shopName || "Shop"
                const currency = shop?.docData?.currency?.text || "฿"
                
                // Format offer text based on type
                let offerText = ""
                if (data.type === 1) {
                    offerText = `${data.value}% ${traductor("offerts")}`
                } else if (data.type === 2) {
                    offerText = `${data.value} ${currency} ${traductor("offerts")}`
                } else if (data.type === 3) {
                    offerText = data.value || "Gift"
                } else {
                    offerText = data.value || "Gift"
                }
                
                allGifts.push({
                    id: gift.docId || gift.id,
                    type: 'gift',
                    shopId: data.shopId,
                    shopName: shopName,
                    offer: offerText,
                    points: 0,
                    description: data.description || traductor("A gift for you!"),
                    giftType: data.giftType,
                })
            })
        }

        if (allGifts.length === 0) return null

        const onPressGift = (item) => {
            if (item.shopId) {
                goToScreen(navigation, "Shop", { shopId: item.shopId })
            } else {
                goToScreen(navigation, "Rewards")
            }
        }

        return (
            <View style={styles.section}>
                {renderSectionHeader("My gifts", null, () => goToScreen(navigation, "Rewards"))}
                <FlatList
                    data={allGifts.slice(0, 5)} // Limit to 5 gifts
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => {
                        const pointsText = item.points > 0 ? `(Use ${item.points} points)` : ""
                        
                        return (
                            <TouchableOpacity style={styles.giftCard} onPress={() => onPressGift(item)}>
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
                        )
                    }}
                />
            </View>
        )
    }

    // Beauty Trending Section - Real data from Firestore (highlight.type = "Trending")
    const renderBeautyTrendingSection = () => {
        if (loadingTrending) {
            return (
                <View style={styles.section}>
                    {renderSectionHeader("Beauty trending", null, onPressBeauty)}
                    <TrendingSkeleton count={2} />
                </View>
            )
        }

        if (trendingShops.length === 0) return null

        return (
            <View style={styles.section}>
                {renderSectionHeader("Beauty trending", null, onPressBeauty)}
                <FlatList
                    data={trendingShops}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => {
                        const categoryLabel = item.shopTypeLabel || item.categories?.[0] || "Beauty"
                        const locationDisplay = item.neighborhood || item.address || ""
                        
                        return (
                            <TouchableOpacity 
                                style={styles.trendingCard}
                                onPress={() => goToScreen(navigation, "Shop", { shopId: item.id })}
                            >
                                <View style={styles.trendingImageContainer}>
                                    <Image 
                                        style={styles.trendingImage} 
                                        source={{ uri: item.galleryImage || defaultIcon }} 
                                        resizeMode="cover"
                                    />
                                    {item.promoText && (
                                        <View style={styles.promoBadge}>
                                            <Text style={styles.promoBadgeText} numberOfLines={1}>{item.promoText}</Text>
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
                        )
                    }}
                />
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea} />
            
            {renderHeader()}

            <ScrollView
                contentContainerStyle={{ paddingBottom: bottomTarSpace + insets.bottom }}
                refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {renderGreetingSection()}
                {user && renderUpcomingSection()}
                {renderBannerSection()}
                {renderMyShopSection()}
                {user && renderMyGiftsSection()}
                {renderBeautyTrendingSection()}

                {/* Original campaign sections */}
                {campaignTypes.slice(1, 4).map((type, index) => {
                    if (user?.docData?.geolocation || noUserlocation) {
                        return (
                            <View key={index}>
                                <RenderListCampaigns
                                    type={type}
                                    imgSize={styles.campaignImg}
                                    maxSize={SCREEN_WIDTH * 0.5}
                                    onPressCampaignItem={onPressCampaignItem}
                                    onPressAll={() => {}}
                                />
                            </View>
                        )
                    }
                    return null
                })}
            </ScrollView>

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

            {modalBox.renderBoxInfos("")}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    safeArea: {
        backgroundColor: "#FFFFFF",
    },

    // Header Styles
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

    // Greeting Section
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

    // Section Header
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

    // Horizontal List
    horizontalList: {
        paddingLeft: 20,
        paddingRight: 10,
    },

    // Upcoming Cards
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

    // Banner Section
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
        width: SCREEN_WIDTH - 40,
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

    // My Shop Section
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

    // Gift Cards
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

    // Trending Cards
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
        top: 8,
        left: 8,
        right: 8,
        backgroundColor: primaryColor,
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 10,
        alignItems: "center",
    },
    promoBadgeText: {
        color: "#FFFFFF",
        fontSize: 10,
        fontWeight: "500",
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

    // Campaign image size
    campaignImg: {
        width: SCREEN_WIDTH * 0.5,
        height: SCREEN_WIDTH * 0.5,
    },
})
