import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    Modal,
    Dimensions,
    StatusBar,
    Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { primaryColor, setAppLang } from './AGTools';

// ============ CONSTANTS ============
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const IMAGE_HEIGHT = 250;
const MAX_QUANTITY = 10;
const MODAL_BORDER_RADIUS = 20;

// Images
const defaultServiceImg = require("./img/logo/defaultImg.png");

// ============ TRANSLATIONS ============
const translations = {
    selectOption: { en: "Select an option", fr: "Sélectionnez une option", th: "เลือกตัวเลือก" },
    addOns: { en: "Add-ons", fr: "Suppléments", th: "บริการเสริม" },
    selectStaff: { en: "Select a staff member", fr: "Choisir un membre", th: "เลือกพนักงาน" },
    anyStaff: { en: "Any staff member", fr: "N'importe qui", th: "พนักงานคนใดก็ได้" },
    add: { en: "Add", fr: "Ajouter", th: "เพิ่ม" },
    modify: { en: "Modify", fr: "Modifier", th: "แก้ไข" },
    remove: { en: "Remove", fr: "Supprimer", th: "ลบ" },
    free: { en: "Free", fr: "Gratuit", th: "ฟรี" },
};

const t = (key, lang) => translations[key]?.[lang] || translations[key]?.en || key;

// ============ HELPER FUNCTIONS ============

/**
 * Get localized text from service fields
 */
const getLocalizedText = (field, lang, fallback = "") => {
    if (!field) return fallback;
    if (typeof field === 'string') return field;
    return field[lang]?.text || field.en?.text || field.fr?.text || field.th?.text || fallback;
};

/**
 * Format duration from minutes to display string
 */
const formatDuration = (minutes) => {
    if (!minutes) return "";
    if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
    return `${minutes} min`;
};

/**
 * Calculate effective price (considering promotionPrice)
 * promotionPrice === 0 means FREE
 */
const getEffectivePrice = (item) => {
    if (item.promotionPrice === 0) return 0;
    if (item.promotionPrice !== null && item.promotionPrice !== undefined) {
        return item.promotionPrice;
    }
    return item.price || 0;
};

/**
 * Calculate total price (service/option + add-ons)
 */
const calculateTotalPrice = (service, selectedOption, addOnQuantities) => {
    // Service/Option price
    let basePrice = 0;
    if (selectedOption) {
        basePrice = getEffectivePrice(selectedOption);
    } else {
        basePrice = getEffectivePrice(service);
    }

    // Add-ons price
    const addOnsPrice = service.serviceAddons?.reduce((total, addOn) => {
        const quantity = addOnQuantities[addOn.id] || 0;
        if (quantity > 0) {
            const addOnPrice = getEffectivePrice(addOn);
            return total + (addOnPrice * quantity);
        }
        return total;
    }, 0) || 0;

    return basePrice + addOnsPrice;
};

/**
 * Calculate total duration (service/option + add-ons)
 */
const calculateTotalDuration = (service, selectedOption, addOnQuantities) => {
    // Service/Option duration
    let baseDuration = selectedOption?.duration || service.duration || 0;

    // Add-ons duration
    const addOnsDuration = service.serviceAddons?.reduce((total, addOn) => {
        const quantity = addOnQuantities[addOn.id] || 0;
        return total + ((addOn.duration || 0) * quantity);
    }, 0) || 0;

    return baseDuration + addOnsDuration;
};

// ============ OPTION ITEM COMPONENT ============
const OptionItem = memo(({ option, isSelected, onSelect, currency, lang }) => {
    const hasPromo = option.promotionPrice !== null && option.promotionPrice !== undefined && option.promotionPrice < option.price;
    const isFree = option.promotionPrice === 0;
    const effectivePrice = getEffectivePrice(option);
    const durationText = option.durationText || formatDuration(option.duration);

    return (
        <TouchableOpacity
            style={[styles.optionItem, isSelected && styles.optionItemSelected]}
            onPress={() => onSelect(option)}
            activeOpacity={0.8}
        >
            <View style={styles.optionRadio}>
                <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                </View>
            </View>
            <View style={styles.optionContent}>
                <Text style={[styles.optionName, isSelected && styles.optionNameSelected]}>
                    {option.name}
                </Text>
                <Text style={styles.optionDuration}>{durationText}</Text>
            </View>
            <View style={styles.optionPriceContainer}>
                {isFree ? (
                    <Text style={styles.optionPriceFree}>{t('free', lang)}</Text>
                ) : hasPromo ? (
                    <>
                        <Text style={styles.optionOriginalPrice}>{currency} {option.price}</Text>
                        <Text style={styles.optionPromoPrice}>{currency} {effectivePrice}</Text>
                    </>
                ) : (
                    <Text style={styles.optionPrice}>{currency} {effectivePrice}</Text>
                )}
            </View>
        </TouchableOpacity>
    );
});

// ============ ADD-ON ITEM COMPONENT ============
const AddOnItem = memo(({ addOn, quantity, onQuantityChange, currency, lang }) => {
    const name = getLocalizedText(addOn.name, lang, "Add-on");
    const description = getLocalizedText(addOn.description, lang);
    const hasPromo = addOn.promotionPrice !== null && addOn.promotionPrice !== undefined && addOn.promotionPrice < addOn.price;
    const isFree = addOn.promotionPrice === 0;
    const effectivePrice = getEffectivePrice(addOn);
    const maxQuantity = addOn.maxQuantity || MAX_QUANTITY;
    const durationText = addOn.durationText || formatDuration(addOn.duration);

    const handleDecrease = () => {
        if (quantity > 0) {
            onQuantityChange(addOn.id, quantity - 1);
        }
    };

    const handleIncrease = () => {
        if (quantity < maxQuantity) {
            onQuantityChange(addOn.id, quantity + 1);
        }
    };

    return (
        <View style={styles.addOnItem}>
            <View style={styles.addOnInfo}>
                <Text style={styles.addOnName}>{name}</Text>
                {description ? (
                    <Text style={styles.addOnDescription} numberOfLines={2}>{description}</Text>
                ) : null}
                <View style={styles.addOnMeta}>
                    <Text style={styles.addOnDuration}>{durationText}</Text>
                    <View style={styles.addOnPriceContainer}>
                        {isFree ? (
                            <Text style={styles.addOnPriceFree}>{t('free', lang)}</Text>
                        ) : hasPromo ? (
                            <>
                                <Text style={styles.addOnOriginalPrice}>{currency} {addOn.price}</Text>
                                <Text style={styles.addOnPromoPrice}>{currency} {effectivePrice}</Text>
                            </>
                        ) : (
                            <Text style={styles.addOnPrice}>{currency} {effectivePrice}</Text>
                        )}
                    </View>
                </View>
            </View>
            <View style={styles.quantityContainer}>
                <TouchableOpacity
                    style={[styles.quantityButton, quantity === 0 && styles.quantityButtonDisabled]}
                    onPress={handleDecrease}
                    disabled={quantity === 0}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.quantityButtonText, quantity === 0 && styles.quantityButtonTextDisabled]}>−</Text>
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity}</Text>
                <TouchableOpacity
                    style={[styles.quantityButton, quantity >= maxQuantity && styles.quantityButtonDisabled]}
                    onPress={handleIncrease}
                    disabled={quantity >= maxQuantity}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.quantityButtonText, quantity >= maxQuantity && styles.quantityButtonTextDisabled]}>+</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});

// ============ STAFF MEMBER ITEM COMPONENT ============
const StaffMemberItem = memo(({ member, isSelected, onSelect, defaultIcon }) => (
    <TouchableOpacity
        style={[styles.staffItem, isSelected && styles.staffItemSelected]}
        onPress={() => onSelect(member)}
        activeOpacity={0.8}
    >
        <Image
            source={{ uri: member.picture || defaultIcon }}
            style={[styles.staffAvatar, isSelected && styles.staffAvatarSelected]}
            resizeMode="cover"
        />
        <Text style={[styles.staffName, isSelected && styles.staffNameSelected]} numberOfLines={2}>
            {member.name}
        </Text>
        {member.role ? (
            <Text style={styles.staffRole} numberOfLines={1}>{member.role}</Text>
        ) : null}
        {isSelected && (
            <View style={styles.staffCheckmark}>
                <Text style={styles.staffCheckmarkText}>✓</Text>
            </View>
        )}
    </TouchableOpacity>
));

// ============ MAIN SERVICE MODAL COMPONENT ============
const ServiceModal = ({
    visible,
    service,
    onClose,
    onAddService,
    onRemoveService,
    currency = "฿",
    isInCart = false,
    existingCartService = null,
    teamMembers = [],
    showMemberSelection = false,
    defaultIcon,
}) => {
    const insets = useSafeAreaInsets();
    const lang = setAppLang();
    const resolvedDefaultIcon = defaultIcon || Image.resolveAssetSource(defaultServiceImg).uri;

    // State
    const [selectedOption, setSelectedOption] = useState(null);
    const [addOnQuantities, setAddOnQuantities] = useState({});
    const [selectedMember, setSelectedMember] = useState(null);

    // Initialize state when modal opens
    useEffect(() => {
        if (visible && service) {
            // Initialize option (first one by default, or existing if editing)
            if (service.serviceOptions?.length > 0) {
                if (existingCartService?.selectedOption) {
                    setSelectedOption(existingCartService.selectedOption);
                } else {
                    setSelectedOption(service.serviceOptions[0]);
                }
            } else {
                setSelectedOption(null);
            }

            // Initialize add-on quantities
            const initialQuantities = {};
            if (existingCartService?.selectedAddOns?.length > 0) {
                existingCartService.selectedAddOns.forEach(addOn => {
                    initialQuantities[addOn.id] = addOn.quantity || 0;
                });
            }
            setAddOnQuantities(initialQuantities);

            // Initialize member selection
            if (existingCartService?.teamMemberId) {
                const member = teamMembers.find(m => m.id === existingCartService.teamMemberId);
                setSelectedMember(member || null);
            } else {
                setSelectedMember(null);
            }
        }
    }, [visible, service, existingCartService, teamMembers]);

    // Filter team members who can perform this service
    const availableMembers = useMemo(() => {
        if (!service || !teamMembers.length) return [];
        return teamMembers.filter(member =>
            member.services?.includes(service.id)
        );
    }, [service, teamMembers]);

    // Computed values
    const serviceTitle = useMemo(() => {
        if (!service) return "";
        return getLocalizedText(service.title_service, lang, service.name);
    }, [service, lang]);

    const serviceDescription = useMemo(() => {
        if (!service) return "";
        return getLocalizedText(service.description_service, lang, service.description);
    }, [service, lang]);

    const totalPrice = useMemo(() => {
        if (!service) return 0;
        return calculateTotalPrice(service, selectedOption, addOnQuantities);
    }, [service, selectedOption, addOnQuantities]);

    const totalDuration = useMemo(() => {
        if (!service) return 0;
        return calculateTotalDuration(service, selectedOption, addOnQuantities);
    }, [service, selectedOption, addOnQuantities]);

    const totalDurationText = useMemo(() => formatDuration(totalDuration), [totalDuration]);

    const hasPromo = useMemo(() => {
        if (!service) return false;
        if (selectedOption) {
            return selectedOption.promotionPrice !== null && selectedOption.promotionPrice !== undefined && selectedOption.promotionPrice < selectedOption.price;
        }
        return service.promotionPrice !== null && service.promotionPrice !== undefined && service.promotionPrice < service.price;
    }, [service, selectedOption]);

    // Handlers
    const handleOptionSelect = useCallback((option) => {
        setSelectedOption(option);
    }, []);

    const handleAddOnQuantityChange = useCallback((addOnId, quantity) => {
        setAddOnQuantities(prev => ({
            ...prev,
            [addOnId]: quantity,
        }));
    }, []);

    const handleMemberSelect = useCallback((member) => {
        setSelectedMember(prev => prev?.id === member?.id ? null : member);
    }, []);

    const handleAddService = useCallback(() => {
        if (!service || !onAddService) return;

        // Build selected add-ons array
        const selectedAddOns = service.serviceAddons
            ?.filter(addOn => (addOnQuantities[addOn.id] || 0) > 0)
            .map(addOn => ({
                ...addOn,
                quantity: addOnQuantities[addOn.id],
            })) || [];

        onAddService({
            service,
            selectedOption,
            selectedAddOns,
            selectedMember,
            totalPrice,
            totalDuration,
        });

        onClose();
    }, [service, selectedOption, addOnQuantities, selectedMember, totalPrice, totalDuration, onAddService, onClose]);

    const handleRemoveService = useCallback(() => {
        if (!service || !onRemoveService) return;
        onRemoveService(service.id);
        onClose();
    }, [service, onRemoveService, onClose]);

    if (!service) return null;

    const hasOptions = service.serviceOptions?.length > 0;
    const hasAddOns = service.serviceAddons?.length > 0;
    const hasImage = service.pictureUrl && service.pictureUrl.trim() !== "";
    const showStaffSection = showMemberSelection && availableMembers.length > 0;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContainer, { paddingBottom: insets.bottom }]}>
                    {/* Scrollable Content */}
                    <ScrollView
                        style={styles.scrollView}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                    >
                        {/* Image Header */}
                        <View style={styles.imageContainer}>
                            {hasImage ? (
                                <Image
                                    source={{ uri: service.pictureUrl }}
                                    style={styles.serviceImage}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={styles.noImagePlaceholder}>
                                    <Image
                                        source={defaultServiceImg}
                                        style={styles.placeholderIcon}
                                        resizeMode="contain"
                                    />
                                </View>
                            )}
                            {/* Close Button */}
                            <TouchableOpacity
                                style={[styles.closeButton, { top: insets.top + 12 }]}
                                onPress={onClose}
                                activeOpacity={0.8}
                                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                            >
                                <Text style={styles.closeIcon}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Service Info */}
                        <View style={styles.contentContainer}>
                            {/* Title, Duration & Price */}
                            <View style={styles.headerSection}>
                                <View style={styles.headerLeft}>
                                    <Text style={styles.serviceTitle}>{serviceTitle}</Text>
                                    <Text style={styles.serviceDuration}>{totalDurationText}</Text>
                                </View>
                                {/* Price (only if no options) */}
                                {!hasOptions && (
                                    <View style={styles.priceSection}>
                                        {hasPromo ? (
                                            <>
                                                <Text style={styles.originalPrice}>{currency} {service.price}</Text>
                                                <Text style={styles.promoPrice}>{currency} {getEffectivePrice(service)}</Text>
                                            </>
                                        ) : (
                                            <Text style={styles.price}>{currency} {service.price}</Text>
                                        )}
                                    </View>
                                )}
                            </View>

                            {/* Description */}
                            {serviceDescription ? (
                                <Text style={styles.serviceDescription}>{serviceDescription}</Text>
                            ) : null}

                            {/* Options Section */}
                            {hasOptions && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>{t('selectOption', lang)}</Text>
                                    {service.serviceOptions.map((option) => (
                                        <OptionItem
                                            key={option.id}
                                            option={option}
                                            isSelected={selectedOption?.id === option.id}
                                            onSelect={handleOptionSelect}
                                            currency={currency}
                                            lang={lang}
                                        />
                                    ))}
                                </View>
                            )}

                            {/* Add-ons Section */}
                            {hasAddOns && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>{t('addOns', lang)}</Text>
                                    {service.serviceAddons.map((addOn) => (
                                        <AddOnItem
                                            key={addOn.id}
                                            addOn={addOn}
                                            quantity={addOnQuantities[addOn.id] || 0}
                                            onQuantityChange={handleAddOnQuantityChange}
                                            currency={currency}
                                            lang={lang}
                                        />
                                    ))}
                                </View>
                            )}

                            {/* Staff Selection Section */}
                            {showStaffSection && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>{t('selectStaff', lang)}</Text>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.staffList}
                                    >
                                        {/* Any Staff option */}
                                        <TouchableOpacity
                                            style={[styles.staffItem, !selectedMember && styles.staffItemSelected]}
                                            onPress={() => setSelectedMember(null)}
                                            activeOpacity={0.8}
                                        >
                                            <View style={styles.anyStaffAvatar}>
                                                <Text style={styles.anyStaffIcon}>👤</Text>
                                            </View>
                                            <Text style={[styles.staffName, !selectedMember && styles.staffNameSelected]} numberOfLines={2}>
                                                {t('anyStaff', lang)}
                                            </Text>
                                            {!selectedMember && (
                                                <View style={styles.staffCheckmark}>
                                                    <Text style={styles.staffCheckmarkText}>✓</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                        {availableMembers.map((member) => (
                                            <StaffMemberItem
                                                key={member.id}
                                                member={member}
                                                isSelected={selectedMember?.id === member.id}
                                                onSelect={handleMemberSelect}
                                                defaultIcon={resolvedDefaultIcon}
                                            />
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    {/* Footer with Add/Modify Button */}
                    <View style={styles.footer}>
                        {isInCart && (
                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={handleRemoveService}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.removeButtonIcon}>🗑</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.addButton, isInCart && styles.modifyButton]}
                            onPress={handleAddService}
                            activeOpacity={0.9}
                        >
                            <Text style={styles.addButtonText}>
                                {isInCart ? t('modify', lang) : t('add', lang)} • {currency} {totalPrice}
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
        backgroundColor: "#FFFFFF",
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    scrollView: {
        flex: 1,
    },
    
    // Image Section
    imageContainer: {
        width: SCREEN_WIDTH,
        height: IMAGE_HEIGHT,
        position: "relative",
    },
    serviceImage: {
        width: "100%",
        height: "100%",
    },
    noImagePlaceholder: {
        width: "100%",
        height: "100%",
        backgroundColor: "#F5F5F5",
        justifyContent: "center",
        alignItems: "center",
    },
    placeholderIcon: {
        width: 60,
        height: 60,
        opacity: 0.4,
    },
    closeButton: {
        position: "absolute",
        right: 16,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    closeIcon: {
        fontSize: 14,
        fontWeight: "600",
        color: "#000000",
    },
    
    // Content
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
        gap: 12,
    },
    headerSection: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
    },
    headerLeft: {
        flex: 1,
        gap: 4,
    },
    serviceTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#000000",
        lineHeight: 24,
    },
    serviceDuration: {
        fontSize: 13,
        fontWeight: "500",
        color: "#747676",
    },
    serviceDescription: {
        fontSize: 13,
        fontWeight: "400",
        color: "#555555",
        lineHeight: 18,
    },
    priceSection: {
        alignItems: "flex-end",
        gap: 2,
    },
    price: {
        fontSize: 16,
        fontWeight: "700",
        color: "#000000",
    },
    originalPrice: {
        fontSize: 13,
        fontWeight: "500",
        color: "#999999",
        textDecorationLine: "line-through",
    },
    promoPrice: {
        fontSize: 16,
        fontWeight: "700",
        color: primaryColor,
    },
    
    // Section
    section: {
        marginTop: 12,
        gap: 10,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#000000",
    },
    
    // Options
    optionItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E5E5",
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 12,
    },
    optionItemSelected: {
        borderColor: primaryColor,
        borderWidth: 1.5,
        backgroundColor: "#FDFCFF",
    },
    optionRadio: {
        width: 22,
        height: 22,
        justifyContent: "center",
        alignItems: "center",
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "#D9D9D9",
        justifyContent: "center",
        alignItems: "center",
    },
    radioOuterSelected: {
        borderColor: primaryColor,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: primaryColor,
    },
    optionContent: {
        flex: 1,
        gap: 2,
    },
    optionName: {
        fontSize: 14,
        fontWeight: "500",
        color: "#000000",
    },
    optionNameSelected: {
        color: "#000000",
        fontWeight: "600",
    },
    optionDuration: {
        fontSize: 12,
        fontWeight: "400",
        color: "#747676",
    },
    optionPriceContainer: {
        alignItems: "flex-end",
        gap: 2,
    },
    optionPrice: {
        fontSize: 14,
        fontWeight: "600",
        color: "#000000",
    },
    optionOriginalPrice: {
        fontSize: 11,
        fontWeight: "500",
        color: "#999999",
        textDecorationLine: "line-through",
    },
    optionPromoPrice: {
        fontSize: 14,
        fontWeight: "600",
        color: primaryColor,
    },
    optionPriceFree: {
        fontSize: 14,
        fontWeight: "600",
        color: "#2DA755",
    },
    
    // Add-ons
    addOnItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E5E5",
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 14,
    },
    addOnInfo: {
        flex: 1,
        gap: 3,
    },
    addOnName: {
        fontSize: 14,
        fontWeight: "500",
        color: "#000000",
    },
    addOnDescription: {
        fontSize: 12,
        fontWeight: "400",
        color: "#747676",
        lineHeight: 16,
    },
    addOnMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 2,
    },
    addOnDuration: {
        fontSize: 12,
        fontWeight: "400",
        color: "#747676",
    },
    addOnPriceContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    addOnPrice: {
        fontSize: 13,
        fontWeight: "600",
        color: "#000000",
    },
    addOnOriginalPrice: {
        fontSize: 11,
        fontWeight: "500",
        color: "#999999",
        textDecorationLine: "line-through",
    },
    addOnPromoPrice: {
        fontSize: 13,
        fontWeight: "600",
        color: primaryColor,
    },
    addOnPriceFree: {
        fontSize: 13,
        fontWeight: "600",
        color: "#2DA755",
    },
    quantityContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    quantityButton: {
        width: 30,
        height: 30,
        borderRadius: 8,
        backgroundColor: "#F2F2F2",
        justifyContent: "center",
        alignItems: "center",
    },
    quantityButtonDisabled: {
        opacity: 0.35,
    },
    quantityButtonText: {
        fontSize: 18,
        fontWeight: "500",
        color: "#000000",
        marginTop: -1,
    },
    quantityButtonTextDisabled: {
        color: "#888888",
    },
    quantityText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#000000",
        minWidth: 20,
        textAlign: "center",
    },
    
    // Staff Selection
    staffList: {
        gap: 14,
        paddingVertical: 4,
    },
    staffItem: {
        alignItems: "center",
        width: 72,
        position: "relative",
    },
    staffItemSelected: {
        // Selected state handled by child elements
    },
    staffAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        marginBottom: 6,
        borderWidth: 2,
        borderColor: "transparent",
    },
    staffAvatarSelected: {
        borderColor: primaryColor,
    },
    anyStaffAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: "#F5F5F5",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 6,
    },
    anyStaffIcon: {
        fontSize: 22,
    },
    staffName: {
        fontSize: 11,
        fontWeight: "500",
        color: "#000000",
        textAlign: "center",
        lineHeight: 14,
    },
    staffNameSelected: {
        color: primaryColor,
        fontWeight: "600",
    },
    staffRole: {
        fontSize: 10,
        fontWeight: "400",
        color: "#888888",
        textAlign: "center",
        marginTop: 1,
    },
    staffCheckmark: {
        position: "absolute",
        top: -2,
        right: 6,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: primaryColor,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#FFFFFF",
    },
    staffCheckmarkText: {
        fontSize: 10,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    
    // Footer
    footer: {
        flexDirection: "row",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: "#F0F0F0",
        gap: 12,
        backgroundColor: "#FFFFFF",
    },
    removeButton: {
        width: 50,
        height: 50,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: "#FF4444",
        justifyContent: "center",
        alignItems: "center",
    },
    removeButtonIcon: {
        fontSize: 20,
        color: "#FF4444",
    },
    addButton: {
        flex: 1,
        height: 50,
        borderRadius: 16,
        backgroundColor: primaryColor,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: primaryColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    modifyButton: {
        flex: 1,
    },
    addButtonText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#FFFFFF",
    },
});

export default memo(ServiceModal);

