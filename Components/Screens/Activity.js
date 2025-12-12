/**
 * Activity.js - Page principale pour voir les bookings et gifts
 * Design from Figma: node-id=4537-1385
 */

import React, { useContext, useEffect, useState, useCallback, useMemo, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    SectionList,
    FlatList,
    StatusBar,
    RefreshControl,
    Dimensions,
    Modal,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NoUserContext, UserContext, goToScreen, primaryColor, setAppLang, traductor } from '../AGTools';
import { AuthContext } from '../Login';
import { auth, firestore } from '../../firebase.config';
import UseRewards from '../UseRewards';
import Svg, { Path } from 'react-native-svg';
import {
    collection,
    collectionGroup,
    query,
    where,
    getDocs,
    doc,
    addDoc,
    updateDoc,
    getDoc,
    Timestamp,
} from '@react-native-firebase/firestore';

// ============ CONSTANTS ============
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const appIcon = require("../img/logo/defaultImg.png");

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

const StarIcon = ({ size = 45, filled = false }) => {
    const fillColor = filled ? primaryColor : "white";
    const strokeColor = primaryColor;
    
    return (
        <Svg width={size} height={size * 43 / 45} viewBox="0 0 45 43" fill="none">
            <Path 
                d="M20.734 2.17053C20.8379 1.8495 21.0426 1.56937 21.3186 1.3706C21.5945 1.17182 21.9274 1.0647 22.2691 1.0647C22.6108 1.0647 22.9436 1.17182 23.2196 1.3706C23.4955 1.56937 23.7002 1.8495 23.8042 2.17053L27.7055 14.0053C27.8104 14.3252 28.0156 14.6041 28.2914 14.8017C28.5673 14.9993 28.8996 15.1056 29.2405 15.1052H41.8604C42.2016 15.1039 42.5344 15.2094 42.8108 15.4066C43.0873 15.6038 43.2931 15.8824 43.3988 16.2023C43.5044 16.5222 43.5043 16.867 43.3986 17.1868C43.2928 17.5067 43.0868 17.7853 42.8103 17.9823L32.5948 25.2965C32.3194 25.4938 32.1145 25.772 32.0093 26.0913C31.9042 26.4106 31.9043 26.7546 32.0096 27.0738L35.9109 38.9086C36.0147 39.2281 36.0135 39.5718 35.9075 39.8907C35.8016 40.2095 35.5962 40.4873 35.3208 40.6843C35.0454 40.8813 34.7139 40.9875 34.3736 40.9878C34.0334 40.9881 33.7017 40.8824 33.426 40.6859L23.2147 33.3759C22.9393 33.1784 22.6075 33.072 22.267 33.072C21.9264 33.072 21.5946 33.1784 21.3192 33.3759L11.1164 40.6901C10.8412 40.8896 10.5088 40.9977 10.1672 40.9987C9.82562 40.9998 9.49253 40.8938 9.21601 40.696C8.9395 40.4983 8.73386 40.219 8.62879 39.8984C8.52372 39.5779 8.52465 39.2327 8.63145 38.9128L12.5285 27.078C12.6338 26.7587 12.6339 26.4148 12.5288 26.0955C12.4237 25.7762 12.2187 25.498 11.9433 25.3007L1.73207 17.9823C1.45554 17.7853 1.24957 17.5067 1.14382 17.1868C1.03807 16.867 1.038 16.5222 1.14362 16.2023C1.24924 15.8824 1.4551 15.6038 1.73156 15.4066C2.00801 15.2094 2.34079 15.1039 2.68196 15.1052H15.2976C15.6386 15.1056 15.9709 14.9993 16.2467 14.8017C16.5225 14.6041 16.7277 14.3252 16.8327 14.0053L20.734 2.17053Z" 
                fill={fillColor} 
                stroke={strokeColor} 
                strokeWidth="2.1294"
            />
        </Svg>
    );
};

// ============ SKELETON LOADERS ============
const BookingCardSkeleton = memo(() => (
    <View style={styles.bookingCard}>
        <View style={[styles.bookingImage, styles.skeleton]} />
        <View style={styles.bookingContent}>
            <View style={[styles.skeletonText, { width: '70%', height: 16, marginBottom: 8 }]} />
            <View style={[styles.skeletonText, { width: '90%', height: 14, marginBottom: 6 }]} />
            <View style={[styles.skeletonText, { width: '60%', height: 14 }]} />
        </View>
    </View>
));

// ============ BOOKING CARD ============
const BookingCard = memo(({ item, onPress, onPressAction, defaultIcon }) => {
    const now = new Date();
    const bookingDate = item.date;
    const isUpcoming = bookingDate >= now;
    const isPast = bookingDate < now;
    
    // Format date
    const formatDateFull = (date) => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const dayName = days[date.getDay()];
        const monthName = months[date.getMonth()];
        const day = date.getDate();
        const year = date.getFullYear();
        return `${dayName}, ${monthName} ${day}, ${year}`;
    };

    // Get status label, background color, and text color (white)
    const getStatusInfo = (statut) => {
        switch (statut) {
            case 1: // Réservé / Pending
                return { label: traductor("Booked"), bgColor: "#F97316", color: "#FFFFFF" }; // Orange
            case 2: // Confirmé / Confirmed
                return { label: traductor("Confirmed"), bgColor: "#10B981", color: "#FFFFFF" }; // Vert
            case 3: // Annulé par le client
                return { label: traductor("Cancelled"), bgColor: "#EF4444", color: "#FFFFFF" }; // Rouge
            case 4: // Annulé
                return { label: traductor("Cancelled"), bgColor: "#EF4444", color: "#FFFFFF" }; // Rouge
            case 5: // Terminé / Completed
                return { label: traductor("Completed"), bgColor: "#7C3AED", color: "#FFFFFF" }; // Violet
            case 6: // Remboursé / Refunded
                return { label: traductor("Refunded"), bgColor: "#6B7280", color: "#FFFFFF" }; // Gris
            case 7: // Replanifié / Rescheduled
                return { label: traductor("Rescheduled"), bgColor: "#1A1A2E", color: "#FFFFFF" }; // Noir
            case 8: // Commencé / Started
                return { label: traductor("Started"), bgColor: "#6B7280", color: "#FFFFFF" }; // Gris
            case 9: // Pas venu / No-show
                return { label: traductor("No-show"), bgColor: "#6B7280", color: "#FFFFFF" }; // Gris
            default:
                return { label: traductor("Booked"), bgColor: "#6B7280", color: "#FFFFFF" }; // Gris
        }
    };

    const statusInfo = getStatusInfo(item.statut);
    
    // Helper variables for specific status checks
    const isUpcomingStatus = item.statut === 1 || item.statut === 2; // Booked or Confirmed
    const isCancelled = item.statut === 3 || item.statut === 4; // Cancelled by client (3) or Cancelled (4)
    const isCompleted = item.statut === 5; // Completed
    const isRefunded = item.statut === 6; // Refunded
    const isRescheduled = item.statut === 7; // Rescheduled
    const isStarted = item.statut === 8; // Started
    const isNoShow = item.statut === 9; // No-show

    return (
        <TouchableOpacity 
            style={styles.bookingCard} 
            onPress={() => onPress(item)} 
            activeOpacity={0.7}
        >
            <Image 
                style={styles.bookingImage} 
                source={{ uri: item.shopLogo || defaultIcon }} 
                resizeMode="cover"
            />
            <View style={styles.bookingContent}>
                {/* Status - Only shown for past bookings, above shop name */}
                {isPast && (
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>
                            {statusInfo.label}
                        </Text>
                    </View>
                )}
                
                <Text style={styles.bookingShopName} numberOfLines={1}>{item.shopName}</Text>
                <Text style={styles.bookingDate}>
                    {formatDateFull(bookingDate)} at {item.timeStart}
                </Text>
                <Text style={styles.bookingPrice}>
                    {item.currency} {item.totalPrice} · {item.services?.length || 1} item{(item.services?.length || 1) > 1 ? 's' : ''}
                </Text>
                
                {/* Actions */}
                <View style={styles.bookingActions}>
                    {isUpcoming && !isCancelled && (
                        <TouchableOpacity 
                            onPress={() => onPressAction('directions', item)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Text style={styles.actionLink}>Get directions</Text>
                        </TouchableOpacity>
                    )}
                    
                    {isPast && (
                        <>
                            {/* Additional actions for completed bookings - only show if no review exists */}
                            {isCompleted && !item.reviewData && (
                                <>
                                    <TouchableOpacity 
                                        onPress={() => onPressAction('review', item)}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Text style={styles.actionLink}>Leave a review</Text>
                                    </TouchableOpacity>
 
                                </>
                            )}
                            
                            {/* Book again - Always shown for past bookings */}
                            <TouchableOpacity 
                                onPress={() => onPressAction('book-again', item)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Text style={styles.actionLink}>Book again</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
});

// ============ GIFT CARD ============
const GiftCard = memo(({ item, onPress }) => {
    const pointsText = item.points > 0 ? `(Use ${item.points} points)` : "";
    const giftIconImage = require("../img/reward.png");

    return (
        <TouchableOpacity 
            style={styles.giftCard} 
            onPress={() => onPress(item)} 
            activeOpacity={0.9}
        >
            <View style={styles.giftIconContainer}>
                <Image resizeMode="contain" style={styles.giftIcon} source={giftIconImage} />
            </View>
            <View style={styles.giftContent}>
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

// ============ SECTION HEADER ============
const SectionHeader = memo(({ title, count }) => (
    <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {count > 0 && (
            <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{count}</Text>
            </View>
        )}
    </View>
));

// ============ EMPTY STATE ============
const EmptyState = memo(({ message }) => (
    <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{message}</Text>
    </View>
));

// ============ REVIEW MODAL ============
const ReviewModal = memo(({ 
    visible, 
    onClose, 
    booking, 
    rating, 
    onRatingChange, 
    reviewText, 
    onReviewTextChange,
    onSubmit,
    submitting 
}) => {
    const lang = setAppLang();
    
    const starLabels = [
        traductor("Terrible"),
        traductor("Bad"),
        traductor("Okay"),
        traductor("Good"),
        traductor("Great"),
    ];

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.reviewModalContainer}
            >
                <TouchableOpacity
                    style={styles.reviewModalOverlay}
                    activeOpacity={1}
                    onPress={onClose}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={styles.reviewModalContent}
                        onPress={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <TouchableOpacity
                            style={styles.reviewModalClose}
                            onPress={onClose}
                        >
                            <Text style={styles.reviewModalCloseText}>×</Text>
                        </TouchableOpacity>

                        {/* Title */}
                        <Text style={styles.reviewModalTitle}>
                            {traductor("Rate your experience at")} {booking?.shopName || ''}
                        </Text>

                        {/* Stars */}
                        <View style={styles.reviewStarsContainer}>
                            {[1, 2, 3, 4, 5].map((starValue) => (
                                <TouchableOpacity
                                    key={starValue}
                                    style={styles.reviewStarWrapper}
                                    onPress={() => onRatingChange(starValue)}
                                    activeOpacity={0.7}
                                >
                                    <StarIcon
                                        size={45}
                                        filled={starValue <= rating}
                                    />
                                    <Text style={[
                                        styles.reviewStarLabel,
                                        starValue <= rating && styles.reviewStarLabelActive
                                    ]}>
                                        {starLabels[starValue - 1]}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Review text */}
                        <View style={styles.reviewTextContainer}>
                            <View style={styles.reviewTextHeader}>
                                <Text style={styles.reviewTextLabel}>
                                    {traductor("Review")}
                                </Text>
                                <Text style={styles.reviewTextCounter}>
                                    {reviewText.length}/600
                                </Text>
                            </View>
                            <TextInput
                                style={styles.reviewTextInput}
                                placeholder={traductor("How was your experience?")}
                                placeholderTextColor="#999"
                                value={reviewText}
                                onChangeText={onReviewTextChange}
                                multiline
                                maxLength={600}
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Submit button */}
                        <TouchableOpacity
                            style={[
                                styles.reviewSubmitButton,
                                (rating === 0 || submitting) && styles.reviewSubmitButtonDisabled
                            ]}
                            onPress={onSubmit}
                            disabled={rating === 0 || submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.reviewSubmitButtonText}>
                                    {traductor("Send")}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </Modal>
    );
});

// ============ MAIN COMPONENT ============
export default function Activity({ navigation, route }) {
    const authContext = useContext(AuthContext);
    const {
        user,
        currentShops,
        registeredShops,
        rewardsByShop,
        gifts,
    } = useContext(authContext.user ? UserContext : NoUserContext);

    const initialTab = route?.params?.initialTab || 'beauty';
    const [activeTab, setActiveTab] = useState(initialTab); // 'gift' or 'beauty'
    const [bookings, setBookings] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [rewardSelectedVisible, setRewardSelectedVisible] = useState(false);
    const [rewardSelected, setRewardSelected] = useState(null);
    const [shopSelected, setShopSelected] = useState([]);
    
    // Review modal states
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    const currentUser = auth.currentUser;
    const defaultIcon = useMemo(() => Image.resolveAssetSource(appIcon).uri, []);

    // ============ ALL GIFTS ============
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
                    let offerText = data.type === 1 ? `${data.value}% off` 
                        : data.type === 2 ? `${data.value} ${currency} off` 
                        : data.value || "Reward";
                    
                    result.push({
                        id: reward.docId || reward.id,
                        type: 'reward',
                        shopId: data.shopId,
                        shopName: shop?.docData?.shopName || "Shop",
                        offer: offerText,
                        points: data.points || 0,
                        description: data.description || "Use on your next visit",
                    });
                }
            });
        }

        if (gifts?.length > 0) {
            gifts.forEach(gift => {
                const data = gift?.docData || {};
                const shop = findShop(data.shopId);
                const currency = shop?.docData?.currency?.text || "฿";
                let offerText = data.type === 1 ? `${data.value}% off` 
                    : data.type === 2 ? `${data.value} ${currency} off` 
                    : data.value || "Gift";
                
                result.push({
                    id: gift.docId || gift.id,
                    type: 'gift',
                    shopId: data.shopId,
                    shopName: shop?.docData?.shopName || "Shop",
                    offer: offerText,
                    points: 0,
                    description: data.description || "A gift for you!",
                });
            });
        }
        return result;
    }, [rewardsByShop, gifts, registeredShops, currentShops]);

    // ============ FETCH BOOKINGS ============
    const fetchAllBookings = useCallback(async () => {
        if (!currentUser?.uid) {
            setBookings([]);
            setLoadingBookings(false);
            return;
        }
        
        setLoadingBookings(true);
        
        try {
            const bookingsQuery = query(
                collectionGroup(firestore, 'Booking'),
                where('clientId', '==', currentUser.uid)
            );
            const snapshot = await getDocs(bookingsQuery);
            
            const bookingIds = new Set();
            const bookingsData = [];
            
            snapshot.docs.forEach((docSnap) => {
                const data = docSnap.data();
                const appointmentDateTime = data.date?.toDate?.() || new Date();
                if (data.timeStart) {
                    const [hours, minutes] = data.timeStart.split(':').map(Number);
                    appointmentDateTime.setHours(hours, minutes);
                }
                
                if (data.booking_id) {
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
            
            const enrichedBookings = bookingsData.map(({ doc: docSnap, data, appointmentDateTime }) => {
                const shopData = shopsMap.get(data.booking_id) || null;
                return {
                    id: docSnap.id,
                    shopId: docSnap.ref.parent?.parent?.id || "",
                    shopName: shopData?.shopName || data.shopName || "Shop",
                    shopLogo: shopData?.logo_Shop_Img || null,
                    booking_id: data.booking_id || "",
                    date: appointmentDateTime,
                    timeStart: data.timeStart || "",
                    totalPrice: data.totalPrice || 0,
                    currency: shopData?.currency?.text || "THB",
                    services: data.services || [],
                    statut: data.statut,
                    teamMemberId: data.teamMemberId || [],
                };
            });
            
            // Sort by date (most recent first)
            enrichedBookings.sort((a, b) => b.date.getTime() - a.date.getTime());
            
            setBookings(enrichedBookings);
        } catch (error) {
            console.error("Error fetching bookings:", error);
            setBookings([]);
        } finally {
            setLoadingBookings(false);
        }
    }, [currentUser?.uid]);

    // ============ FILTER BOOKINGS INTO SECTIONS ============
    const bookingSections = useMemo(() => {
        const now = new Date();
        // Upcoming: date >= now AND (statut === 1 or statut === 2)
        const upcoming = bookings.filter(b => b.date >= now && (b.statut === 1 || b.statut === 2));
        // Past: date < now OR statut not in [1, 2]
        const past = bookings.filter(b => b.date < now || (b.statut !== 1 && b.statut !== 2));
        
        const sections = [];
        if (upcoming.length > 0) {
            sections.push({ title: 'Upcoming', count: upcoming.length, data: upcoming });
        }
        if (past.length > 0) {
            sections.push({ title: 'Past', count: past.length, data: past });
        }
        return sections;
    }, [bookings]);

    // ============ HANDLERS ============
    const onPressBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    const onPressBooking = useCallback((item) => {
        goToScreen(navigation, "BeautyBookingDetail", { 
            shopId: item.shopId, 
            bookingId: item.id,
            booking_id: item.booking_id 
        });
    }, [navigation]);

    const onPressAction = useCallback((action, item) => {
        switch (action) {
            case 'directions':
                // Open directions
                goToScreen(navigation, "Venue", { shopId: item.shopId });
                break;
            case 'review':
                // Open review modal
                setSelectedBooking(item);
                setRating(0);
                setReviewText('');
                setReviewModalVisible(true);
                break;
            case 'book-again':
                // Navigate to BeautyServices to book again
                goToScreen(navigation, "BeautyServices", { 
                    shopId: item.shopId,
                    cart: [], // Start with empty cart
                    fromActivity: true, // Flag to know we came from Activity
                });
                break;
        }
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
    }, [currentShops, registeredShops, rewardsByShop, gifts]);

    const onSubmitReview = useCallback(async () => {
        if (!selectedBooking || rating === 0) {
            return; // Rating is required
        }

        setSubmittingReview(true);
        try {
            const shopId = selectedBooking.shopId;
            const bookingId = selectedBooking.id;
            const userId = currentUser?.uid;

            if (!shopId || !bookingId || !userId) {
                console.error('[Activity] Missing required data for review');
                return;
            }

            const reviewsRef = collection(firestore, "Shops", shopId, "ShopReviews");
            const bookingRef = doc(firestore, "Shops", shopId, "Booking", bookingId);
            const shopDocument = doc(firestore, "Shops", shopId);

            // Check if review already exists
            const existingReviewsQuery = query(
                reviewsRef,
                where("appointmentId", "==", bookingId),
                where("clientId", "==", userId)
            );
            const existingReviewsSnapshot = await getDocs(existingReviewsQuery);

            const now = Timestamp.now();
            const existingReviewData = selectedBooking.reviewData;
            
            const reviewData = {
                createdAt: existingReviewsSnapshot.empty 
                    ? now 
                    : (existingReviewData?.createdAt || now),
                updatedAt: existingReviewsSnapshot.empty ? null : now,
                clientId: userId,
                ratingNote: rating,
                ratingCommentary: reviewText.trim() || '',
                shopId: shopId,
                appointmentId: bookingId,
                booking_id: selectedBooking.booking_id || '',
                services: selectedBooking.services || [],
                booking_number: selectedBooking.booking_number || null,
                teamMemberId: selectedBooking.teamMemberId || selectedBooking.teamMembers || [],
            };

            // Create or update review
            if (existingReviewsSnapshot.empty) {
                await addDoc(reviewsRef, reviewData);
            } else {
                const existingReview = existingReviewsSnapshot.docs[0];
                await updateDoc(doc(reviewsRef, existingReview.id), reviewData);
            }

            // Update booking with reviewData
            await updateDoc(bookingRef, { reviewData: reviewData });

            // Calculate and update shop rating
            const shopReviewsSnapshot = await getDocs(reviewsRef);
            const totalRating = shopReviewsSnapshot.docs.reduce(
                (acc, docSnap) => acc + (docSnap.data().ratingNote || 0),
                0
            );
            const avg = shopReviewsSnapshot.docs.length > 0 
                ? (totalRating / shopReviewsSnapshot.docs.length).toFixed(1)
                : 0;

            await updateDoc(shopDocument, {
                shopRating: Number(avg),
                shopRatingNumber: shopReviewsSnapshot.docs.length,
            });

            // Close modal and refresh bookings
            setReviewModalVisible(false);
            setSelectedBooking(null);
            setRating(0);
            setReviewText('');
            await fetchAllBookings();
        } catch (error) {
            console.error('[Activity] Error submitting review:', error);
        } finally {
            setSubmittingReview(false);
        }
    }, [selectedBooking, rating, reviewText, currentUser, fetchAllBookings]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchAllBookings();
        setRefreshing(false);
    }, [fetchAllBookings]);

    // ============ EFFECTS ============
    useEffect(() => {
        fetchAllBookings();
    }, [fetchAllBookings]);

    // ============ RENDER FUNCTIONS ============
    const keyExtractor = useCallback((item) => item.id, []);

    const renderBookingItem = useCallback(({ item }) => (
        <BookingCard 
            item={item} 
            onPress={onPressBooking}
            onPressAction={onPressAction}
            defaultIcon={defaultIcon}
        />
    ), [onPressBooking, onPressAction, defaultIcon]);

    const renderGiftItem = useCallback(({ item }) => (
        <GiftCard item={item} onPress={onPressGift} />
    ), [onPressGift]);

    const renderSectionHeader = useCallback(({ section }) => (
        <SectionHeader title={section.title} count={section.count} />
    ), []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            
            {/* Header */}
            <SafeAreaView edges={['top']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={onPressBack}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <ArrowBackIcon size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Activity</Text>
                    <View style={styles.headerSpacer} />
                </View>
            </SafeAreaView>

            {/* Tabs: Gift / Beauty */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'gift' && styles.tabActive]}
                    onPress={() => setActiveTab('gift')}
                >
                    <Text style={[styles.tabText, activeTab === 'gift' && styles.tabTextActive]}>
                        Gift
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'beauty' && styles.tabActive]}
                    onPress={() => setActiveTab('beauty')}
                >
                    <Text style={[styles.tabText, activeTab === 'beauty' && styles.tabTextActive]}>
                        Beauty
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {activeTab === 'beauty' ? (
                loadingBookings ? (
                    <View style={styles.listContent}>
                        <BookingCardSkeleton />
                        <BookingCardSkeleton />
                        <BookingCardSkeleton />
                    </View>
                ) : bookingSections.length === 0 ? (
                    <EmptyState message="No bookings yet" />
                ) : (
                    <SectionList
                        sections={bookingSections}
                        keyExtractor={keyExtractor}
                        renderItem={renderBookingItem}
                        renderSectionHeader={renderSectionHeader}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                        stickySectionHeadersEnabled={false}
                    />
                )
            ) : (
                allGifts.length === 0 ? (
                    <EmptyState message="No gifts available" />
                ) : (
                    <FlatList
                        data={allGifts}
                        keyExtractor={keyExtractor}
                        renderItem={renderGiftItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                )
            )}

            <ReviewModal
                visible={reviewModalVisible}
                onClose={() => {
                    setReviewModalVisible(false);
                    setSelectedBooking(null);
                    setRating(0);
                    setReviewText('');
                }}
                booking={selectedBooking}
                rating={rating}
                onRatingChange={setRating}
                reviewText={reviewText}
                onReviewTextChange={setReviewText}
                onSubmit={onSubmitReview}
                submitting={submittingReview}
            />

            <UseRewards
                navigation={navigation}
                shop={shopSelected}
                reward={rewardSelected}
                visible={rewardSelectedVisible}
                onVisible={setRewardSelectedVisible}
                goToProfil={() => goToScreen(navigation, "SetPersonnalInfos")}
            />
        </View>
    );
}

// ============ STYLES ============
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
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
    tabsContainer: {
        flexDirection: "row",
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    tab: {
        paddingHorizontal: 24,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#1D1D1B",
        backgroundColor: "#FFFFFF",
    },
    tabActive: {
        backgroundColor: "#1D1D1B",
        borderColor: "#1D1D1B",
    },
    tabText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#1D1D1B",
    },
    tabTextActive: {
        color: "#FFFFFF",
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1D1D1B",
    },
    sectionBadge: {
        backgroundColor: primaryColor,
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 8,
    },
    sectionBadgeText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "700",
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    bookingCard: {
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E0E0E0",
        marginBottom: 12,
        overflow: "hidden",
    },
    bookingImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignSelf: 'flex-start',
        overflow: 'hidden',
        marginHorizontal: 10,
        marginTop: 10,
    },
    bookingContent: {
        flex: 1,
        padding: 12,
        justifyContent: "space-between",
    },
    bookingShopName: {
        fontSize: 15,
        fontWeight: "600",
        color: "#1D1D1B",
        marginBottom: 4,
    },
    bookingDate: {
        fontSize: 13,
        color: "#666",
        marginBottom: 4,
    },
    bookingPrice: {
        fontSize: 13,
        color: "#666",
        marginBottom: 8,
    },
    bookingActions: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
    },
    actionLink: {
        fontSize: 13,
        fontWeight: "600",
        color: primaryColor,
    },
    statusBadge: {
        alignSelf: "flex-start",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        marginBottom: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    memberBadges: {
        flexDirection: "row",
        gap: 6,
        marginLeft: 'auto',
    },
    memberBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "#FFFFFF",
    },
    memberBadgeText: {
        color: "#FFFFFF",
        fontSize: 10,
        fontWeight: "700",
    },
    giftCard: {
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#D9D9D9",
        padding: 12,
        marginBottom: 12,
        alignItems: "center",
    },
    giftIconContainer: {
        marginRight: 16,
    },
    giftIcon: {
        width: 30,
        height: 30,
    },
    giftContent: {
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
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 15,
        color: "#999",
    },
    skeleton: {
        backgroundColor: "#E0E0E0",
    },
    skeletonText: {
        backgroundColor: "#E0E0E0",
        borderRadius: 4,
    },
    // Review Modal
    reviewModalContainer: {
        flex: 1,
    },
    reviewModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    reviewModalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        position: 'relative',
    },
    reviewModalClose: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    reviewModalCloseText: {
        fontSize: 32,
        color: '#999',
        lineHeight: 32,
        fontWeight: '300',
    },
    reviewModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1D1D1B',
        marginTop: 16,
        marginBottom: 24,
        textAlign: 'center',
    },
    reviewStarsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        paddingHorizontal: 8,
    },
    reviewStarWrapper: {
        alignItems: 'center',
        gap: 8,
    },
    reviewStarLabel: {
        fontSize: 10,
        fontWeight: '500',
        color: '#999',
        marginTop: 4,
    },
    reviewStarLabelActive: {
        color: primaryColor,
        fontWeight: '600',
    },
    reviewTextContainer: {
        marginBottom: 24,
    },
    reviewTextHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    reviewTextLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1D1D1B',
    },
    reviewTextCounter: {
        fontSize: 12,
        fontWeight: '500',
        color: '#999',
    },
    reviewTextInput: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        padding: 16,
        minHeight: 120,
        fontSize: 14,
        color: '#1D1D1B',
        backgroundColor: '#FFFFFF',
    },
    reviewSubmitButton: {
        backgroundColor: primaryColor,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reviewSubmitButtonDisabled: {
        opacity: 0.5,
    },
    reviewSubmitButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
