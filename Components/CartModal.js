import React, { useMemo, useCallback, memo } from 'react';
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

// ============ CONSTANTS ============
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ============ TRANSLATIONS ============
const translations = {
    appointmentDetails: { en: "Appointment details", fr: "Détails du rendez-vous", th: "รายละเอียดการนัดหมาย" },
    edit: { en: "Edit", fr: "Modifier", th: "แก้ไข" },
    me: { en: "Me", fr: "Moi", th: "ฉัน" },
    guest: { en: "Guest", fr: "Invité", th: "แขก" },
    addOn: { en: "Add-on", fr: "Supplément", th: "บริการเสริม" },
    subtotal: { en: "Subtotal", fr: "Sous-total", th: "ยอดรวมย่อย" },
    discount: { en: "Discount", fr: "Réduction", th: "ส่วนลด" },
    total: { en: "Total", fr: "Total", th: "ยอดรวม" },
    continue: { en: "Continue", fr: "Continuer", th: "ดำเนินการต่อ" },
    payAtVenue: { en: "Pay at the venue — no online payment required.", fr: "Payez sur place — aucun paiement en ligne requis.", th: "ชำระเงินที่สถานที่ — ไม่ต้องชำระเงินออนไลน์" },
    depositNote: { en: "Some shops may require a small deposit at the final step.", fr: "Certains établissements peuvent demander un petit acompte à la dernière étape.", th: "บางร้านอาจต้องการเงินมัดจำเล็กน้อยในขั้นตอนสุดท้าย" },
    youllSave: { en: "You'll save", fr: "Vous économiserez", th: "คุณจะประหยัด" },
    afterDiscount: { en: "after the discount.", fr: "après la réduction.", th: "หลังจากส่วนลด" },
    selectServices: { en: "Select services to continue", fr: "Sélectionnez des services pour continuer", th: "เลือกบริการเพื่อดำเนินการต่อ" },
    free: { en: "Free", fr: "Gratuit", th: "ฟรี" },
};

const t = (key, lang) => translations[key]?.[lang] || translations[key]?.en || key;

// ============ HELPER FUNCTIONS ============

/**
 * Format price with currency
 */
const formatPrice = (price, currency, lang) => {
    if (price === 0) return t('free', lang);
    const formattedPrice = price.toLocaleString();
    if (lang === 'th') {
        return `${currency} ${formattedPrice}`;
    }
    return `${currency} ${formattedPrice}`;
};

/**
 * Format duration from minutes to display string
 */
const formatDuration = (minutes) => {
    if (!minutes) return "";
    if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${hours}h00`;
    }
    return `${minutes} mins`;
};

/**
 * Calculate cart totals
 */
const calculateCartTotals = (cart) => {
    let subtotal = 0;
    let discount = 0;

    cart.forEach(item => {
        // Service/Option original price
        const originalServicePrice = item.selectedOption
            ? item.selectedOption.price
            : item.price;

        // Service/Option effective price (with promotion)
        const effectiveServicePrice = item.selectedOption
            ? (item.selectedOption.promotionPrice ?? item.selectedOption.price)
            : (item.promotionPrice ?? item.price);

        subtotal += originalServicePrice;

        // Calculate service discount
        if (item.selectedOption?.promotionPrice !== null && item.selectedOption?.promotionPrice !== undefined) {
            discount += originalServicePrice - item.selectedOption.promotionPrice;
        } else if (item.promotionPrice !== null && item.promotionPrice !== undefined) {
            discount += originalServicePrice - item.promotionPrice;
        }

        // Add-ons
        if (item.selectedAddOns && item.selectedAddOns.length > 0) {
            item.selectedAddOns.forEach(addOn => {
                const quantity = addOn.quantity || 1;
                const originalAddOnPrice = addOn.price * quantity;
                subtotal += originalAddOnPrice;

                // Add-on discount
                if (addOn.promotionPrice !== null && addOn.promotionPrice !== undefined) {
                    discount += (addOn.price - addOn.promotionPrice) * quantity;
                }
            });
        }
    });

    const total = subtotal - discount;

    return { subtotal, discount, total };
};

// ============ SUB-COMPONENTS ============

/**
 * Service Item Row
 */
const ServiceItem = memo(({ service, currency, lang, isLast }) => {
    const hasPromotion = service.selectedOption
        ? service.selectedOption.promotionPrice !== null && service.selectedOption.promotionPrice !== undefined
        : service.promotionPrice !== null && service.promotionPrice !== undefined;

    const originalPrice = service.selectedOption
        ? service.selectedOption.price
        : service.price;

    const effectivePrice = service.selectedOption
        ? (service.selectedOption.promotionPrice ?? service.selectedOption.price)
        : (service.promotionPrice ?? service.price);

    const duration = service.selectedOption?.duration || service.duration;
    const durationText = service.selectedOption?.durationText || service.durationText || formatDuration(duration);
    const optionName = service.selectedOption?.name;

    return (
        <View style={styles.serviceItem}>
            {/* Service Name and Price */}
            <View style={styles.serviceRow}>
                <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    {optionName && (
                        <Text style={styles.optionName}>{optionName}</Text>
                    )}
                    <Text style={styles.serviceDuration}>{durationText}</Text>
                </View>
                <View style={styles.priceContainer}>
                    {hasPromotion && (
                        <Text style={styles.originalPrice}>
                            {formatPrice(originalPrice, currency, lang)}
                        </Text>
                    )}
                    <Text style={[styles.effectivePrice, hasPromotion && styles.promoPrice]}>
                        {formatPrice(effectivePrice, currency, lang)}
                    </Text>
                </View>
            </View>

            {/* Add-ons */}
            {service.selectedAddOns && service.selectedAddOns.length > 0 && (
                <View style={styles.addOnsContainer}>
                    <Text style={styles.addOnLabel}>{t('addOn', lang)} :</Text>
                    {service.selectedAddOns.map((addOn, index) => {
                        const addOnName = addOn.name?.[lang]?.text || addOn.name?.en?.text || addOn.name || "";
                        const addOnDuration = formatDuration(addOn.duration);
                        const addOnQuantity = addOn.quantity || 1;
                        const addOnPrice = addOn.promotionPrice ?? addOn.price;
                        const addOnHasPromo = addOn.promotionPrice !== null && addOn.promotionPrice !== undefined;

                        return (
                            <View key={addOn.id || index} style={styles.addOnRow}>
                                <View style={styles.addOnInfo}>
                                    <Text style={styles.addOnName}>{addOnName}</Text>
                                    {addOnDuration && (
                                        <Text style={styles.addOnDuration}>{addOnDuration}</Text>
                                    )}
                                </View>
                                <Text style={styles.addOnQuantity}>X{addOnQuantity}</Text>
                                <View style={styles.addOnPriceContainer}>
                                    {addOnHasPromo && (
                                        <Text style={styles.addOnOriginalPrice}>
                                            {formatPrice(addOn.price * addOnQuantity, currency, lang)}
                                        </Text>
                                    )}
                                    <Text style={styles.addOnPrice}>
                                        {formatPrice(addOnPrice * addOnQuantity, currency, lang)}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            )}

            {/* Separator */}
            {!isLast && <View style={styles.serviceSeparator} />}
        </View>
    );
});

/**
 * Guest Section
 */
const GuestSection = memo(({ guest, services, currency, lang, onEdit, showEditButton, isLast }) => {
    return (
        <View style={styles.guestSection}>
            {/* Guest Header */}
            <View style={styles.guestHeader}>
                <Text style={styles.guestName}>{guest.name}</Text>
                {showEditButton && (
                    <TouchableOpacity onPress={() => onEdit(guest.id)} activeOpacity={0.7}>
                        <Text style={styles.editButton}>{t('edit', lang)}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Services */}
            {services.length === 0 ? (
                <Text style={{ color: '#999', fontSize: 14, marginBottom: 10 }}>
                    Aucun service sélectionné
                </Text>
            ) : (
                services.map((service, index) => (
                    <ServiceItem
                        key={service.id}
                        service={service}
                        currency={currency}
                        lang={lang}
                        isLast={index === services.length - 1}
                    />
                ))
            )}

            {/* Guest Separator */}
            {!isLast && <View style={styles.guestSeparator} />}
        </View>
    );
});

// ============ MAIN COMPONENT ============

const CartModal = ({
    visible,
    onClose,
    onContinue,
    onEditGuest,
    cart = [],
    guests = null, // Array of guests with their services, or null for single user
    currency = "THB",
    hideAtVenue = false,
}) => {
    const insets = useSafeAreaInsets();
    const lang = setAppLang();

    // Calculate totals
    const { subtotal, discount, total } = useMemo(() => calculateCartTotals(cart), [cart]);

    // Organize services by guest
    const guestSections = useMemo(() => {
        if (guests && guests.length > 0) {
            // Multi-guest mode
            return guests.map(guest => ({
                id: guest.id,
                name: guest.name === "Me" ? t('me', lang) : guest.name,
                services: guest.services || [],
            }));
        }

        // Single user mode - all services belong to "Me"
        return [{
            id: 'me',
            name: t('me', lang),
            services: cart,
        }];
    }, [guests, cart, lang]);

    const totalServices = cart.length;
    const hasServices = totalServices > 0;
    // Always show guest header (at least "Me" with Edit button)
    const showGuestHeaders = true;

    const handleContinue = useCallback(() => {
        onContinue?.();
    }, [onContinue]);

    const handleEditGuest = useCallback((guestId) => {
        onEditGuest?.(guestId);
        onClose?.();
    }, [onEditGuest, onClose]);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.modalOverlay}>
                {/* Backdrop */}
                <TouchableOpacity 
                    style={styles.backdrop} 
                    activeOpacity={1} 
                    onPress={onClose}
                />

                {/* Modal Content */}
                <View style={[styles.modalContainer, { paddingBottom: insets.bottom + 16 }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{t('appointmentDetails', lang)}</Text>
                        <TouchableOpacity 
                            onPress={onClose} 
                            style={styles.closeButton}
                            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        >
                            <Text style={styles.closeIcon}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Separator */}
                    <View style={styles.headerSeparator} />

                    {/* Scrollable Content */}
                    <ScrollView 
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                    >
                        {!hasServices ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>{t('selectServices', lang)}</Text>
                            </View>
                        ) : (
                            <>
                                {/* Guest Sections */}
                                {guestSections.map((guest, index) => (
                                    <GuestSection
                                        key={guest.id}
                                        guest={guest}
                                        services={guest.services}
                                        currency={currency}
                                        lang={lang}
                                        onEdit={handleEditGuest}
                                        showEditButton={showGuestHeaders}
                                        isLast={index === guestSections.length - 1}
                                    />
                                ))}

                                {/* Totals Section */}
                                <View style={styles.totalsSection}>
                                    <View style={styles.totalsSeparator} />

                                    {/* Subtotal */}
                                    <View style={styles.totalRow}>
                                        <Text style={styles.totalLabel}>{t('subtotal', lang)}</Text>
                                        <Text style={styles.totalValue}>
                                            {formatPrice(subtotal, currency, lang)}
                                        </Text>
                                    </View>

                                    {/* Discount */}
                                    {discount > 0 && (
                                        <View style={styles.totalRow}>
                                            <Text style={styles.totalLabel}>{t('discount', lang)}</Text>
                                            <Text style={styles.discountValue}>
                                                -{formatPrice(discount, currency, lang)}
                                            </Text>
                                        </View>
                                    )}

                                    <View style={styles.totalsSeparator} />

                                    {/* Total */}
                                    <View style={styles.totalRow}>
                                        <Text style={styles.grandTotalLabel}>{t('total', lang)}</Text>
                                        <Text style={styles.grandTotalValue}>
                                            {formatPrice(total, currency, lang)}
                                        </Text>
                                    </View>
                                </View>

                                {/* Payment Note */}
                                {!hideAtVenue && (
                                    <View style={styles.paymentNote}>
                                        <Text style={styles.paymentNoteTitle}>{t('payAtVenue', lang)}</Text>
                                    </View>
                                )}
                            </>
                        )}
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        {/* Savings Message */}
                        {discount > 0 && (
                            <>
                                <View style={styles.savingsSeparator} />
                                <Text style={styles.savingsText}>
                                    {t('youllSave', lang)}{' '}
                                    <Text style={styles.savingsAmount}>
                                        {formatPrice(discount, currency, lang)}
                                    </Text>
                                    {' '}{t('afterDiscount', lang)}
                                </Text>
                            </>
                        )}

                        {/* Continue Button */}
                        <TouchableOpacity
                            style={[styles.continueButton, !hasServices && styles.continueButtonDisabled]}
                            onPress={handleContinue}
                            activeOpacity={0.9}
                            disabled={!hasServices}
                        >
                            <Text style={styles.continueButtonText}>
                                {formatPrice(total, currency, lang)} - {t('continue', lang)}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// ============ STYLES ============
const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    backdrop: {
        flex: 1,
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        minHeight: SCREEN_HEIGHT * 0.5,
        maxHeight: SCREEN_HEIGHT * 0.85,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: 20,
        paddingBottom: 15,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000000',
    },
    closeButton: {
        padding: 5,
    },
    closeIcon: {
        fontSize: 14,
        color: '#000000',
        fontWeight: '300',
    },
    headerSeparator: {
        height: 1,
        backgroundColor: '#E5E5E5',
        marginHorizontal: 15,
    },

    // ScrollView
    scrollView: {
        flexGrow: 1,
        flexShrink: 1,
    },
    scrollContent: {
        paddingHorizontal: 15,
        paddingTop: 20,
        paddingBottom: 10,
        flexGrow: 1,
    },

    // Empty State
    emptyContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: '#999999',
    },

    // Guest Section
    guestSection: {
        marginBottom: 10,
    },
    guestHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    guestName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000000',
    },
    editButton: {
        fontSize: 16,
        fontWeight: '500',
        color: primaryColor,
    },
    guestSeparator: {
        height: 1,
        backgroundColor: '#000000',
        marginVertical: 20,
    },

    // Service Item
    serviceItem: {
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 8,
        padding: 10,
        backgroundColor: '#f9f9f9',
    },
    serviceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    serviceInfo: {
        flex: 1,
        marginRight: 10,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 5,
    },
    optionName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000000',
        marginBottom: 5,
    },
    serviceDuration: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000000',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    originalPrice: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000000',
        textDecorationLine: 'line-through',
    },
    effectivePrice: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
    },
    promoPrice: {
        color: '#E60000',
    },
    serviceSeparator: {
        height: 0.5,
        backgroundColor: '#D9D9D9',
        marginVertical: 15,
        marginHorizontal: 60,
    },

    // Add-ons
    addOnsContainer: {
        marginTop: 15,
    },
    addOnLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#777978',
        marginBottom: 8,
    },
    addOnRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    addOnInfo: {
        flex: 1,
    },
    addOnName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 2,
    },
    addOnDuration: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000000',
    },
    addOnQuantity: {
        fontSize: 16,
        fontWeight: '600',
        color: primaryColor,
        marginHorizontal: 15,
    },
    addOnPriceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    addOnOriginalPrice: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000000',
        textDecorationLine: 'line-through',
    },
    addOnPrice: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
    },

    // Totals
    totalsSection: {
        marginTop: 10,
    },
    totalsSeparator: {
        height: 1,
        backgroundColor: '#E5E5E5',
        marginVertical: 15,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000000',
    },
    totalValue: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000000',
    },
    discountValue: {
        fontSize: 16,
        fontWeight: '500',
        color: '#E60000',
    },
    grandTotalLabel: {
        fontSize: 24,
        fontWeight: '600',
        color: '#000000',
    },
    grandTotalValue: {
        fontSize: 24,
        fontWeight: '600',
        color: '#000000',
    },

    // Payment Note
    paymentNote: {
        marginTop: 10,
        marginBottom: 10,
    },
    paymentNoteTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#747676',
        marginBottom: 8,
    },
    paymentNoteSubtitle: {
        fontSize: 14,
        fontWeight: '500',
        fontStyle: 'italic',
        color: '#747676',
        lineHeight: 20,
    },

    // Footer
    footer: {
        paddingHorizontal: 15,
        paddingTop: 10,
    },
    savingsSeparator: {
        height: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        marginBottom: 10,
    },
    savingsText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000000',
        textAlign: 'center',
        marginBottom: 15,
    },
    savingsAmount: {
        fontWeight: '600',
        color: primaryColor,
    },
    continueButton: {
        backgroundColor: primaryColor,
        borderRadius: 20,
        paddingVertical: 15,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    continueButtonDisabled: {
        backgroundColor: '#CCCCCC',
    },
    continueButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default memo(CartModal);

