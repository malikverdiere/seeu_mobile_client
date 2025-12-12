/**
 * BeautyBookingDetail.js - Page de détail d'un booking
 * Design from Figma: node-id=4748-2327
 */

import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    StatusBar,
    ActivityIndicator,
    Dimensions,
    Linking,
    Platform,
    Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { goToScreen, primaryColor, setAppLang, traductor } from '../AGTools';
import { auth, firestore } from '../../firebase.config';
import {
    doc,
    getDoc,
    updateDoc,
} from '@react-native-firebase/firestore';
import Svg, { Path } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

const AddCalendarIcon = ({ size = 27, color = primaryColor }) => (
    <Svg width={size} height={size * 28 / 27} viewBox="0 0 27 28" fill="none">
        <Path d="M17.2744 0.87207V4.65782" stroke={color} strokeWidth="1.74419" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M7.18848 0.87207V4.65782" stroke={color} strokeWidth="1.74419" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M22.9531 9.81696H1.50488" stroke={color} strokeWidth="1.74419" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M13.6709 25.7895H6.42381C3.35753 25.7895 0.87207 23.3695 0.87207 20.3869V8.48025C0.87207 5.49508 3.35753 3.07764 6.42381 3.07764H18.0296C21.0959 3.07764 23.5813 5.49769 23.5813 8.48025V14.9346" stroke={color} strokeWidth="1.74419" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M12.2332 16.6432C12.7905 16.6432 13.2483 16.1932 13.2483 15.6334C13.2483 15.0735 12.8036 14.6235 12.2437 14.6235H12.2306C11.6733 14.6235 11.2207 15.0735 11.2207 15.6334C11.2207 16.1932 11.6707 16.6432 12.2306 16.6432H12.2332Z" fill={color}/>
        <Path d="M6.5291 16.6432C7.08637 16.6432 7.54422 16.1932 7.54422 15.6334C7.54422 15.0735 7.09945 14.6235 6.53957 14.6235H6.52648C5.96922 14.6235 5.5166 15.0735 5.5166 15.6334C5.5166 16.1932 5.9666 16.6432 6.52648 16.6432H6.5291Z" fill={color}/>
        <Path d="M6.5291 20.4259C7.08637 20.4259 7.54422 19.9759 7.54422 19.416C7.54422 18.8561 7.09945 18.4061 6.53957 18.4061H6.52648C5.96922 18.4061 5.5166 18.8561 5.5166 19.416C5.5166 19.9759 5.9666 20.4259 6.52648 20.4259H6.5291Z" fill={color}/>
        <Path d="M20.7762 27.035C23.3977 27.035 25.5221 24.9106 25.5221 22.2891C25.5221 19.6676 23.3977 17.5432 20.7762 17.5432C18.1547 17.5432 16.0303 19.6676 16.0303 22.2891C16.0303 24.9106 18.1547 27.035 20.7762 27.035Z" stroke={color} strokeWidth="1.74419" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M22.5434 22.349H19.0088" stroke={color} strokeWidth="1.74419" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M20.7764 20.6174V24.165" stroke={color} strokeWidth="1.74419" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
);

const DirectionIcon = ({ size = 28, color = primaryColor }) => (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
        <Path d="M9.76424 6.62234L19.6276 9.68339C21.9692 10.4159 22.0084 13.6994 19.6799 14.4712L16.9721 15.3869C16.2265 15.6354 15.6247 16.2241 15.3892 16.9697L14.4735 19.6907C13.7017 22.0061 10.3922 21.9668 9.68576 19.6252L6.61163 9.76188C6.02296 7.82583 7.84128 6.00751 9.76424 6.62234Z" stroke={color} strokeWidth="1.74419" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M19.7093 0.87207H8.19765C4.15184 0.87207 0.87207 4.15184 0.87207 8.19765V19.7093C0.87207 23.7551 4.15184 27.0349 8.19765 27.0349H19.7093C23.7551 27.0349 27.0349 23.7551 27.0349 19.7093V8.19765C27.0349 4.15184 23.7551 0.87207 19.7093 0.87207Z" stroke={color} strokeWidth="1.74419"/>
    </Svg>
);

const CalendarEditIcon = ({ size = 27, color = primaryColor }) => (
    <Svg width={size} height={size * 28 / 27} viewBox="0 0 27 28" fill="none">
        <Path d="M7.40723 0.87207V4.79283" stroke={color} strokeWidth="1.74419" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M17.8613 0.87207V4.79283" stroke={color} strokeWidth="1.74419" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M1.52539 10.1384H23.743" stroke={color} strokeWidth="1.74419" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M22.0552 18.8676L17.4287 23.4941C17.2458 23.6771 17.0758 24.0169 17.0366 24.2652L16.7883 26.0295C16.6968 26.6699 17.1412 27.1143 17.7816 27.0228L19.5459 26.7745C19.7942 26.7353 20.1471 26.5653 20.317 26.3824L24.9435 21.7559C25.7407 20.9587 26.1197 20.0308 24.9435 18.8545C23.7803 17.6914 22.8524 18.0704 22.0552 18.8676Z" stroke={color} strokeWidth="1.74419" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M21.3896 19.5344C21.7817 20.9459 22.8795 22.0437 24.291 22.4358" stroke={color} strokeWidth="1.74419" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M12.6343 27.0111H7.40666C2.83245 27.0111 0.87207 24.3972 0.87207 20.4765V9.36766C0.87207 5.44691 2.83245 2.83307 7.40666 2.83307H17.862C22.4362 2.83307 24.3966 5.44691 24.3966 9.36766V13.9419" stroke={color} strokeWidth="1.74419" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M12.6253 16.1624H12.6371" stroke={color} strokeWidth="1.74419" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M7.79331 16.1624H7.80504" stroke={color} strokeWidth="1.74419" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M7.79331 20.0822H7.80504" stroke={color} strokeWidth="1.74419" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
);

const InfoIcon = ({ size = 20, color = primaryColor }) => (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{
            width: size * 0.8,
            height: size * 0.8,
            borderRadius: size * 0.4,
            borderWidth: 2,
            borderColor: color,
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <Text style={{ fontSize: size * 0.6, fontWeight: '700', color, marginTop: -2 }}>i</Text>
        </View>
    </View>
);

// Cache
const bookingCache = new Map();

// ============ MAIN COMPONENT ============
export default function BeautyBookingDetail({ navigation, route }) {
    const lang = setAppLang();
    const insets = useSafeAreaInsets();
    const currentUser = auth.currentUser;
    
    const shopId = route?.params?.shopId;
    const bookingId = route?.params?.bookingId;
    const isRescheduled = route?.params?.isRescheduled || false;
    
    const [booking, setBooking] = useState(null);
    const [shopData, setShopData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [manageModalVisible, setManageModalVisible] = useState(false);
    const [cancelConfirmVisible, setCancelConfirmVisible] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    // ============ HELPER FUNCTIONS ============
    const formatDate = useCallback((date) => {
        if (!date) return "";
        const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }, []);

    const getStatusInfo = useCallback((statut) => {
        switch (statut) {
            case 1: // Réservé / Pending
                return { label: traductor("Booked"), color: "#FFFFFF", bgColor: "#F97316" }; // Orange
            case 2: // Confirmé / Confirmed
                return { label: traductor("Confirmed"), color: "#FFFFFF", bgColor: "#10B981" }; // Vert
            case 3: // Annulé par le client
                return { label: traductor("Cancelled"), color: "#FFFFFF", bgColor: "#EF4444" }; // Rouge
            case 4: // Annulé
                return { label: traductor("Cancelled"), color: "#FFFFFF", bgColor: "#EF4444" }; // Rouge
            case 5: // Terminé / Completed
                return { label: traductor("Completed"), color: "#FFFFFF", bgColor: "#7C3AED" }; // Violet
            case 6: // Remboursé / Refunded
                return { label: traductor("Refunded"), color: "#FFFFFF", bgColor: "#6B7280" }; // Gris
            case 7: // Replanifié / Rescheduled
                return { label: traductor("Rescheduled"), color: "#FFFFFF", bgColor: "#1A1A2E" }; // Noir
            case 8: // Commencé / Started
                return { label: traductor("Started"), color: "#FFFFFF", bgColor: "#6B7280" }; // Gris
            case 9: // Pas venu / No-show
                return { label: traductor("No-show"), color: "#FFFFFF", bgColor: "#6B7280" }; // Gris
            default:
                return { label: traductor("Booked"), color: "#FFFFFF", bgColor: "#6B7280" }; // Gris
        }
    }, []);

    // ============ FETCH BOOKING ============
    const fetchBookingDetails = useCallback(async () => {
        if (!shopId || !bookingId) {
            setLoading(false);
            return;
        }

        const cacheKey = `${shopId}_${bookingId}`;
        if (bookingCache.has(cacheKey)) {
            const cached = bookingCache.get(cacheKey);
            setBooking(cached.booking);
            setShopData(cached.shop);
            setLoading(false);
            return;
        }

        setLoading(true);
        
        try {
            const bookingRef = doc(firestore, `Shops/${shopId}/Booking/${bookingId}`);
            const bookingSnap = await getDoc(bookingRef);
            
            if (!bookingSnap.exists) {
                setLoading(false);
                return;
            }

            const bookingData = {
                id: bookingSnap.id,
                ...bookingSnap.data(),
                date: bookingSnap.data().date?.toDate?.() || new Date(),
            };

            const shopRef = doc(firestore, `Shops/${shopId}`);
            const shopSnap = await getDoc(shopRef);
            const shopInfo = shopSnap.exists ? shopSnap.data() : null;

            bookingCache.set(cacheKey, {
                booking: bookingData,
                shop: shopInfo,
                timestamp: Date.now(),
            });

            setBooking(bookingData);
            setShopData(shopInfo);
        } catch (error) {
            console.error('[BeautyBookingDetail] Error:', error);
        } finally {
            setLoading(false);
        }
    }, [shopId, bookingId]);

    useEffect(() => {
        fetchBookingDetails();
    }, [fetchBookingDetails]);

    // ============ HANDLERS ============
    const onPressBack = useCallback(() => {
        // If coming from rescheduled booking, navigate to Activity instead of going back
        if (isRescheduled) {
            goToScreen(navigation, 'Activity');
        } else {
            // Since we use replace() from checkout, goBack() will skip checkout and go to previous page
            navigation.goBack();
        }
    }, [navigation, isRescheduled]);

    const onPressAddToCalendar = useCallback(() => {
        // Add to calendar functionality
        console.log('Add to calendar');
    }, []);

    const onPressGettingThere = useCallback(() => {
        if (shopData?.address) {
            const url = Platform.select({
                ios: `maps:0,0?q=${encodeURIComponent(shopData.address)}`,
                android: `geo:0,0?q=${encodeURIComponent(shopData.address)}`,
            });
            Linking.openURL(url);
        }
    }, [shopData?.address]);

    const onPressManageAppointment = useCallback(() => {
        setManageModalVisible(true);
    }, []);

    const buildGuestsParam = useCallback(() => {
        if (!booking?.services || !Array.isArray(booking.services)) return '';
        
        // Format: GuestName-serviceId-optionId-teamMemberId-addons
        const guestsData = booking.services.map((service, index) => {
            const guestName = service.guestName || `Guest${index + 1}`;
            const serviceId = service.serviceId || service.id || '';
            const optionId = service.selectedOption?.id || service.option?.id || service.optionId || 'none';
            const teamMemberId = service.teamMemberId || 'notSpecific';
            const addons = service.selectedAddOns && service.selectedAddOns.length > 0
                ? service.selectedAddOns.map(addon => `${addon.id}-${addon.quantity || 1}`).join('.')
                : service.addons && service.addons.length > 0
                    ? service.addons.map(addon => `${addon.id}-${addon.quantity || 1}`).join('.')
                    : 'none';
            
            return `${guestName}-${serviceId}-${optionId}-${teamMemberId}-${addons}`;
        });
        
        return guestsData.join('_');
    }, [booking?.services]);

    const onPressReschedule = useCallback(() => {
        setManageModalVisible(false);
        
        if (!booking || !shopData) {
            console.error('[BeautyBookingDetail] Missing booking or shop data for reschedule');
            return;
        }
        
        // Build guests parameter from booking services
        const guestsParam = buildGuestsParam();
        
        console.log('[BeautyBookingDetail] Rescheduling booking:', {
            bookingNumber: booking.booking_number,
            bookingId: booking.booking_id,
            guestsParam,
            shopId,
            services: booking.services,
        });
        
        // Navigate to BeautyTime with reschedule parameters
        goToScreen(navigation, "BeautyTime", { 
            shopId,
            booking_id: booking.booking_id,
            guestsParam,
            bookingNumberParam: booking.booking_number?.toString(),
        });
    }, [navigation, shopId, booking, shopData, buildGuestsParam]);

    const onPressCancel = useCallback(() => {
        setManageModalVisible(false);
        setCancelConfirmVisible(true);
    }, []);

    const onConfirmCancel = useCallback(async () => {
        setCancelling(true);
        try {
            // Update booking status to 3 (cancelled)
            const bookingRef = doc(firestore, `Shops/${shopId}/Booking/${bookingId}`);
            await updateDoc(bookingRef, {
                statut: 3,
                cancelledAt: new Date(),
            });

            // Update local state
            setBooking(prev => ({ ...prev, statut: 3 }));

            // Clear cache
            const cacheKey = `${shopId}_${bookingId}`;
            bookingCache.delete(cacheKey);

            setCancelConfirmVisible(false);
            console.log('[BeautyBookingDetail] Booking cancelled successfully');
        } catch (error) {
            console.error('[BeautyBookingDetail] Error cancelling booking:', error);
            alert('Error cancelling booking. Please try again.');
        } finally {
            setCancelling(false);
        }
    }, [shopId, bookingId]);

    const onPressShopDetail = useCallback(() => {
        if (shopId) {
            goToScreen(navigation, "Venue", { shopId });
        }
    }, [navigation, shopId]);

    const onPressMakeAppointment = useCallback(() => {
        if (shopId) {
            goToScreen(navigation, "BeautyServices", { 
                shopId,
                cart: [], // Start with empty cart
                fromBookingDetail: true,
                bookingId: bookingId,
            });
        }
    }, [navigation, shopId, bookingId]);

    // ============ RENDER ============
    if (loading) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
                <SafeAreaView edges={['top']} style={styles.headerAbsolute}>
                    <TouchableOpacity style={styles.backButtonAbsolute} onPress={onPressBack}>
                        <ArrowBackIcon size={24} color="#FFF" />
                    </TouchableOpacity>
                </SafeAreaView>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={primaryColor} />
                </View>
            </View>
        );
    }

    if (!booking || !shopData) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
                <SafeAreaView edges={['top']} style={styles.headerAbsolute}>
                    <TouchableOpacity style={styles.backButtonAbsolute} onPress={onPressBack}>
                        <ArrowBackIcon size={24} color="#FFF" />
                    </TouchableOpacity>
                </SafeAreaView>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Booking not found</Text>
                </View>
            </View>
        );
    }

    const statusInfo = getStatusInfo(booking.statut);
    const currency = shopData?.currency?.text || "THB";
    const coverImage = shopData?.cover_Shop_Img || shopData?.GalleryPictureShop?.[0] || shopData?.logo_Shop_Img;
    const canManageAppointment = booking.statut === 1 || booking.statut === 2; // Only allow manage for pending (1) or confirmed (2)

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            
            <ScrollView 
                style={styles.scrollView} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={!canManageAppointment ? { paddingBottom: 100 } : undefined}
            >
                {/* Cover Image */}
                <View style={styles.coverContainer}>
                    <Image 
                        source={{ uri: coverImage }} 
                        style={styles.coverImage}
                        resizeMode="cover"
                    />
                    <View style={styles.coverOverlay} />
                    <SafeAreaView edges={['top']} style={styles.headerAbsolute}>
                        <TouchableOpacity style={styles.backButtonAbsolute} onPress={onPressBack}>
                            <ArrowBackIcon size={24} color="#FFF" />
                        </TouchableOpacity>
                    </SafeAreaView>
                    <View style={styles.shopNameOverlay}>
                        <Text style={styles.shopNameText}>{shopData.shopName}</Text>
                    </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Status Badge */}
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>
                            {statusInfo.label}
                        </Text>
                    </View>

                    {/* Date & Time */}
                    <View style={styles.dateTimeSection}>
                        <Text style={styles.dateText}>{formatDate(booking.date)} at {booking.timeStart}</Text>
                        <Text style={styles.durationText}>{booking.duration}-minutes duration</Text>
                    </View>

                    {/* Quick Actions */}
                    <View style={styles.actionsSection}>
                        <TouchableOpacity style={styles.actionItem} onPress={onPressAddToCalendar}>
                            <AddCalendarIcon size={24} />
                            <View style={styles.actionTextContainer}>
                                <Text style={styles.actionText}>{traductor('Add to calendar')}</Text>
                                <Text style={styles.actionSubtext}>{traductor('Set yourself a reminder')}</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionItem} onPress={onPressGettingThere}>
                            <DirectionIcon size={24} />
                            <View style={styles.actionTextContainer}>
                                <Text style={styles.actionText}>{traductor('Getting there')}</Text>
                                {shopData?.address && (
                                    <Text style={styles.actionSubtext} numberOfLines={1}>
                                        {shopData.address}
                                    </Text>
                                )}
                            </View>
                        </TouchableOpacity>

                        {canManageAppointment && (
                            <TouchableOpacity style={styles.actionItem} onPress={onPressManageAppointment}>
                                <CalendarEditIcon size={24} />
                                <View style={styles.actionTextContainer}>
                                    <Text style={styles.actionText}>{traductor('Manage Appointment')}</Text>
                                    <Text style={styles.actionSubtext}>Reschedule or cancel anytime</Text>
                                </View>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={styles.actionItem} onPress={onPressShopDetail}>
                            <InfoIcon size={20} />
                            <View style={styles.actionTextContainer}>
                                <Text style={styles.actionText}>{traductor('Shop Detail')}</Text>
                                <Text style={styles.actionSubtext}>{shopData.shopName}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Overview Section */}
                    <View style={styles.overviewSection}>
                        <Text style={styles.sectionTitle}>Overview</Text>

                        {/* Services List */}
                        {booking.services?.map((service, index) => (
                            <View key={index} style={styles.serviceItem}>
                                <View style={styles.serviceLeft}>
                                    <Text style={styles.serviceName}>{service.name || service.serviceName}</Text>
                                    <View style={styles.serviceDetails}>
                                        <Text style={styles.serviceDetailText}>{service.duration} mins with </Text>
                                        <View style={styles.professionalBadge}>
                                            <Text style={styles.professionalBadgeText}>
                                                {service.memberName || 'Any professional'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <Text style={styles.servicePrice}>
                                    {currency} {service.priceUsed || service.price}
                                </Text>
                            </View>
                        ))}

                        {/* Total */}
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>{currency} {booking.totalPrice || 0}</Text>
                        </View>

                        {/* Booking ID */}
                        <Text style={styles.bookingId}>
                            Booking ref: {booking.booking_number || bookingId}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Manage Appointment Modal */}
            <Modal
                visible={manageModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setManageModalVisible(false)}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1}
                    onPress={() => setManageModalVisible(false)}
                >
                    <TouchableOpacity 
                        activeOpacity={1}
                        style={styles.modalContent}
                    >
                        {/* Close button */}
                        <TouchableOpacity 
                            style={styles.modalCloseButton}
                            onPress={() => setManageModalVisible(false)}
                        >
                            <Text style={styles.modalCloseText}>×</Text>
                        </TouchableOpacity>

                        {/* Title */}
                        <Text style={styles.modalTitle}>
                            {traductor('Manage appointment')}
                        </Text>

                        {/* Booking Info */}
                        <View style={styles.modalBookingInfo}>
                            <Image 
                                source={{ uri: shopData?.logo_Shop_Img || shopData?.cover_Shop_Img }} 
                                style={styles.modalShopImage}
                                resizeMode="cover"
                            />
                            <View style={styles.modalBookingDetails}>
                                <Text style={styles.modalBookingDate}>
                                    {formatDate(booking.date)} at {booking.timeStart}
                                </Text>
                                <Text style={styles.modalBookingDuration}>
                                    {currency} {booking.totalPrice} · {booking.services?.length || 1} item{(booking.services?.length || 1) > 1 ? 's' : ''}
                                </Text>
                            </View>
                        </View>

                        {/* Actions */}
                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={styles.modalActionItem}
                                onPress={onPressReschedule}
                            >
                                <CalendarEditIcon size={24} />
                                <Text style={styles.modalActionText}>
                                    {traductor('Reschedule appointment')}
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.modalDivider} />

                            <TouchableOpacity 
                                style={styles.modalActionItem}
                                onPress={onPressCancel}
                            >
                                <CalendarEditIcon size={24} color="#F44336" />
                                <Text style={[styles.modalActionText, { color: '#F44336' }]}>
                                    {traductor('Cancel appointment')}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <SafeAreaView edges={['bottom']} />
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* Cancel Confirmation Modal */}
            <Modal
                visible={cancelConfirmVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setCancelConfirmVisible(false)}
            >
                <View style={styles.confirmOverlay}>
                    <View style={styles.confirmBox}>
                        {/* Close button */}
                        <TouchableOpacity 
                            style={styles.confirmCloseButton}
                            onPress={() => setCancelConfirmVisible(false)}
                        >
                            <Text style={styles.confirmCloseText}>×</Text>
                        </TouchableOpacity>

                        {/* Title */}
                        <Text style={styles.confirmTitle}>
                            {traductor('Are you sure you want to cancel?')}
                        </Text>

                        {/* Message */}
                        <Text style={styles.confirmMessage}>
                            {traductor('If you want to change the appointment, you can reschedule your appointment.')}
                        </Text>
                        <Text style={styles.confirmMessage}>
                            {traductor('Are you sure you want to cancel your appointment?')}
                        </Text>

                        {/* Cancel button */}
                        <TouchableOpacity 
                            style={[styles.confirmButton, cancelling && styles.confirmButtonDisabled]}
                            onPress={onConfirmCancel}
                            disabled={cancelling}
                        >
                            {cancelling ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.confirmButtonText}>
                                    {traductor('Yes, cancel')}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Bottom Bar - Make an appointment (only if statut is not 1 or 2) */}
            {!canManageAppointment && (
                <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
                    <TouchableOpacity 
                        style={styles.makeAppointmentButton}
                        onPress={onPressMakeAppointment}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.makeAppointmentButtonText}>
                            {traductor('Make an appointment')}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
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
    coverContainer: {
        width: SCREEN_WIDTH,
        height: 200,
        position: 'relative',
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    coverOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    headerAbsolute: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    backButtonAbsolute: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 16,
        marginTop: 8,
    },
    shopNameOverlay: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
    },
    shopNameText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        color: "#999",
    },
    content: {
        padding: 20,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 16,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
    },
    dateTimeSection: {
        marginBottom: 24,
    },
    dateText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1D1D1B',
        marginBottom: 4,
    },
    durationText: {
        fontSize: 14,
        color: '#666',
    },
    actionsSection: {
        marginBottom: 24,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    actionTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    actionText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1D1D1B',
        marginLeft: 12,
    },
    actionSubtext: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    overviewSection: {
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1D1D1B',
        marginBottom: 16,
    },
    serviceItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    serviceLeft: {
        flex: 1,
        marginRight: 12,
    },
    serviceName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1D1D1B',
        marginBottom: 6,
    },
    serviceDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    serviceDetailText: {
        fontSize: 13,
        color: '#666',
    },
    professionalBadge: {
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    professionalBadgeText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    servicePrice: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1D1D1B',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        marginTop: 8,
        borderTopWidth: 2,
        borderTopColor: '#1D1D1B',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1D1D1B',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1D1D1B',
    },
    bookingId: {
        fontSize: 13,
        color: '#999',
        marginTop: 12,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    modalCloseButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    modalCloseText: {
        fontSize: 32,
        color: '#999',
        lineHeight: 32,
        fontWeight: '300',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1D1D1B',
        marginBottom: 20,
    },
    modalBookingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F8F8',
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
    },
    modalShopImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
        marginRight: 12,
    },
    modalBookingDetails: {
        flex: 1,
    },
    modalBookingDate: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1D1D1B',
        marginBottom: 4,
    },
    modalBookingDuration: {
        fontSize: 13,
        color: '#666',
    },
    modalActions: {
        backgroundColor: '#FFFFFF',
    },
    modalActionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    modalActionText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1D1D1B',
        marginLeft: 12,
    },
    modalDivider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 8,
    },
    // Cancel Confirmation Modal styles
    confirmOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    confirmBox: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        position: 'relative',
    },
    confirmCloseButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    confirmCloseText: {
        fontSize: 32,
        color: '#999',
        lineHeight: 32,
        fontWeight: '300',
    },
    confirmTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1D1D1B',
        marginBottom: 16,
        paddingRight: 24,
    },
    confirmMessage: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 12,
    },
    confirmButton: {
        backgroundColor: '#E31837',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 20,
    },
    confirmButtonDisabled: {
        opacity: 0.6,
    },
    confirmButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    // Bottom Bar
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 0.87,
        borderTopColor: '#D9D9D9',
        paddingHorizontal: 24,
        paddingTop: 9,
    },
    makeAppointmentButton: {
        flex: 1,
        height: 48,
        backgroundColor: primaryColor,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    makeAppointmentButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
