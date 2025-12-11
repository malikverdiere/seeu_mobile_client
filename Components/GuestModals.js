/**
 * GuestModals - Modal components for managing guests
 * 
 * - AddGuestModal: Confirmation popup when adding a new guest
 * - SelectGuestModal: Popup to select/manage guests
 */

import React, { memo, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { primaryColor, setAppLang } from './AGTools';
import Svg, { Path, Circle } from 'react-native-svg';

// ============ CONSTANTS ============
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ============ TRANSLATIONS ============
const translations = {
    addGuest: { en: "Add Guest", fr: "Ajouter un invité", th: "เพิ่มแขก" },
    addGuestMessage: { en: "You are about to add a new guest", fr: "Vous êtes sur le point d'ajouter un nouvel invité", th: "คุณกำลังจะเพิ่มแขกใหม่" },
    cancel: { en: "Cancel", fr: "Annuler", th: "ยกเลิก" },
    selectGuest: { en: "Select Guest", fr: "Sélectionner un invité", th: "เลือกแขก" },
    me: { en: "Me", fr: "Moi", th: "ฉัน" },
    guest: { en: "Guest", fr: "Invité", th: "แขก" },
    services: { en: "service(s)", fr: "service(s)", th: "บริการ" },
    total: { en: "Total:", fr: "Total :", th: "ยอดรวม:" },
    guests: { en: "guests", fr: "invités", th: "แขก" },
    sorry: { en: "Sorry", fr: "Désolé", th: "ขอโทษ" },
    noMemberAvailable: { en: "Not enough team members available", fr: "Pas assez de membres disponibles", th: "ไม่มีสมาชิกทีมพอ" },
    ok: { en: "OK", fr: "OK", th: "ตกลง" },
};

const t = (key, lang) => translations[key]?.[lang] || translations[key]?.en || key;

// ============ SVG ICONS ============

const PersonIcon = ({ size = 20, color = "#666666" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.5" />
        <Path
            d="M4 20C4 17 7.5 14.5 12 14.5C16.5 14.5 20 17 20 20"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
        />
    </Svg>
);

const PersonPlusIcon = ({ size = 20, color = "#666666" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="10" cy="8" r="4" stroke={color} strokeWidth="1.5" />
        <Path
            d="M2 20C2 17 5.5 14.5 10 14.5C11.5 14.5 12.9 14.7 14.1 15.1"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
        />
        <Path d="M19 14V20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M16 17H22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
);

// Export as AddGuestIcon for external use
export const AddGuestIcon = PersonPlusIcon;

const CheckIcon = ({ size = 18, color = primaryColor }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M5 12L10 17L19 7"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

const TrashIcon = ({ size = 20, color = "#FF4444" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M3 6H21"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
        />
        <Path
            d="M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6"
            stroke={color}
            strokeWidth="1.5"
        />
        <Path
            d="M5 6L6 20C6 20.5523 6.44772 21 7 21H17C17.5523 21 18 20.5523 18 20L19 6"
            stroke={color}
            strokeWidth="1.5"
        />
        <Path d="M10 10V17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M14 10V17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
);

const ChevronDownIcon = ({ size = 16, color = "#000000" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M6 9L12 15L18 9"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

// ============ HELPER FUNCTIONS ============

const formatPrice = (price, currency) => {
    if (!price) return `${currency} 0`;
    return `${currency} ${price.toLocaleString()}`;
};

const calculateGuestTotal = (services) => {
    if (!services || services.length === 0) return 0;
    return services.reduce((sum, s) => sum + (s.totalPrice || s.promotionPrice || s.price || 0), 0);
};

// ============ ADD GUEST MODAL ============

export const AddGuestModal = memo(({
    visible,
    onClose,
    onConfirm,
}) => {
    const lang = setAppLang();

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.modalOverlay}>
                <View style={styles.addGuestModalContainer}>
                    {/* Header */}
                    <View style={styles.addGuestHeader}>
                        <Text style={styles.addGuestTitle}>{t('addGuest', lang)}</Text>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Text style={styles.closeIcon}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Message */}
                    <Text style={styles.addGuestMessage}>{t('addGuestMessage', lang)}</Text>

                    {/* Buttons */}
                    <View style={styles.addGuestButtons}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onClose}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.cancelButtonText}>{t('cancel', lang)}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.confirmButton}
                            onPress={onConfirm}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.confirmButtonText}>{t('addGuest', lang)}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
});

// ============ NO MEMBER ALERT MODAL ============

export const NoMemberAlertModal = memo(({
    visible,
    onClose,
}) => {
    const lang = setAppLang();

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.modalOverlay}>
                <View style={styles.alertModalContainer}>
                    {/* Title */}
                    <Text style={styles.alertTitle}>{t('sorry', lang)}</Text>

                    {/* Message */}
                    <Text style={styles.alertMessage}>{t('noMemberAvailable', lang)}</Text>

                    {/* OK Button */}
                    <TouchableOpacity
                        style={styles.alertButton}
                        onPress={onClose}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.alertButtonText}>{t('ok', lang)}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
});

// ============ SELECT GUEST MODAL ============

const GuestItem = memo(({ guest, isActive, canDelete, currency, lang, onSelect, onDelete }) => {
    const servicesCount = guest.services?.length || 0;
    const totalPrice = calculateGuestTotal(guest.services);
    const displayName = guest.id === 'me' ? t('me', lang) : guest.name;

    return (
        <TouchableOpacity
            style={[styles.guestItem, isActive && styles.guestItemActive]}
            onPress={() => onSelect(guest.id)}
            activeOpacity={0.7}
        >
            {/* Checkmark */}
            <View style={styles.guestCheckContainer}>
                {isActive && <CheckIcon />}
            </View>

            {/* Person Icon */}
            <View style={styles.guestIconContainer}>
                <PersonIcon size={24} color={isActive ? primaryColor : "#666666"} />
            </View>

            {/* Info */}
            <View style={styles.guestInfo}>
                <Text style={[styles.guestName, isActive && styles.guestNameActive]}>
                    {displayName}
                </Text>
                <Text style={styles.guestServicesText}>
                    {servicesCount} {t('services', lang)} - {formatPrice(totalPrice, currency)}
                </Text>
            </View>

            {/* Delete Button (not for "Me") */}
            {canDelete && (
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => onDelete(guest.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <TrashIcon />
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
});

export const SelectGuestModal = memo(({
    visible,
    onClose,
    guests = [],
    activeGuestId,
    currency = "THB",
    onSelectGuest,
    onDeleteGuest,
}) => {
    const lang = setAppLang();

    // Calculate totals
    const { totalPrice, guestCount } = useMemo(() => {
        let total = 0;
        guests.forEach(guest => {
            total += calculateGuestTotal(guest.services);
        });
        return {
            totalPrice: total,
            guestCount: guests.length,
        };
    }, [guests]);

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <View style={styles.selectGuestModalContainer}>
                    {/* Header */}
                    <View style={styles.selectGuestHeader}>
                        <View style={styles.selectGuestTitleRow}>
                            <PersonIcon size={22} color="#000000" />
                            <Text style={styles.selectGuestTitle}>{t('selectGuest', lang)}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Text style={styles.closeIcon}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Guests List */}
                    <ScrollView
                        style={styles.guestsList}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                    >
                        {guests.map((guest, index) => (
                            <GuestItem
                                key={guest.id}
                                guest={guest}
                                isActive={guest.id === activeGuestId}
                                canDelete={guest.id !== 'me'}
                                currency={currency}
                                lang={lang}
                                onSelect={onSelectGuest}
                                onDelete={onDeleteGuest}
                            />
                        ))}
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.selectGuestFooter}>
                        <Text style={styles.totalText}>
                            {t('total', lang)} {formatPrice(totalPrice, currency)}
                        </Text>
                        <Text style={styles.guestCountText}>
                            {guestCount} {t('guests', lang)}
                        </Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
});

// ============ GUEST SELECTOR BUTTON ============

export const GuestSelectorButton = memo(({
    activeGuest,
    hasGuests,
    onPress,
}) => {
    const lang = setAppLang();

    if (!hasGuests) return null;

    const displayName = activeGuest?.id === 'me' 
        ? t('me', lang) 
        : activeGuest?.name || t('guest', lang);

    return (
        <TouchableOpacity
            style={styles.guestSelectorButton}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <PersonIcon size={18} color="#000000" />
            <Text style={styles.guestSelectorText}>{displayName}</Text>
            <ChevronDownIcon size={14} color="#000000" />
        </TouchableOpacity>
    );
});

// ============ ADD GUEST BUTTON ============

export const AddGuestButton = memo(({
    isActive, // true = fond violet (Me a des services)
    onPress,
}) => {
    const lang = setAppLang();

    return (
        <TouchableOpacity
            style={[
                styles.addGuestButton,
                isActive ? styles.addGuestButtonActive : styles.addGuestButtonInactive
            ]}
            onPress={onPress}
            activeOpacity={isActive ? 0.8 : 1}
        >
            <PersonPlusIcon 
                size={18} 
                color={isActive ? "#FFFFFF" : primaryColor} 
            />
            <Text style={[
                styles.addGuestButtonText,
                isActive ? styles.addGuestButtonTextActive : styles.addGuestButtonTextInactive
            ]}>
                {t('guest', lang)}
            </Text>
        </TouchableOpacity>
    );
});

// ============ STYLES ============

const styles = StyleSheet.create({
    // Modal overlay
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },

    // Add Guest Modal
    addGuestModalContainer: {
        width: SCREEN_WIDTH - 60,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
    },
    addGuestHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    addGuestTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000000',
    },
    closeButton: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeIcon: {
        fontSize: 18,
        color: '#666666',
    },
    addGuestMessage: {
        fontSize: 15,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    addGuestButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        height: 48,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D9D9D9',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000000',
    },
    confirmButton: {
        flex: 1,
        height: 48,
        backgroundColor: primaryColor,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    // Alert Modal
    alertModalContainer: {
        width: SCREEN_WIDTH - 80,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
    },
    alertTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000000',
        marginBottom: 12,
    },
    alertMessage: {
        fontSize: 15,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    alertButton: {
        width: '100%',
        height: 48,
        backgroundColor: primaryColor,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    // Select Guest Modal
    selectGuestModalContainer: {
        width: SCREEN_WIDTH - 40,
        maxHeight: '70%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
    },
    selectGuestHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    selectGuestTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    selectGuestTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000000',
    },
    guestsList: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    guestItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 12,
        marginBottom: 10,
    },
    guestItemActive: {
        borderColor: primaryColor,
        backgroundColor: '#F8F5FF',
    },
    guestCheckContainer: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    guestIconContainer: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    guestInfo: {
        flex: 1,
    },
    guestName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 2,
    },
    guestNameActive: {
        color: primaryColor,
    },
    guestServicesText: {
        fontSize: 13,
        color: '#888888',
    },
    deleteButton: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectGuestFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    totalText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000000',
    },
    guestCountText: {
        fontSize: 14,
        color: '#888888',
    },

    // Guest Selector Button
    guestSelectorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D9D9D9',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        gap: 6,
    },
    guestSelectorText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000000',
    },

    // Add Guest Button
    addGuestButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        gap: 6,
    },
    addGuestButtonInactive: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: primaryColor,
    },
    addGuestButtonActive: {
        backgroundColor: primaryColor,
        borderWidth: 1,
        borderColor: primaryColor,
    },
    addGuestButtonText: {
        fontSize: 14,
        fontWeight: '500',
    },
    addGuestButtonTextInactive: {
        color: primaryColor,
    },
    addGuestButtonTextActive: {
        color: '#FFFFFF',
    },
});

export default {
    AddGuestModal,
    SelectGuestModal,
    GuestSelectorButton,
    AddGuestButton,
};

