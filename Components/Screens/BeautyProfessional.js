/**
 * BeautyProfessional.js - Page de sélection des professionnels
 * 
 * Cette page permet de sélectionner un membre d'équipe pour chaque service.
 * Elle s'affiche uniquement si settingCalendar.displaySelectMemberAutoOpen === true
 */

import React, { useContext, useEffect, useState, useCallback, useMemo, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    Dimensions,
    StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NoUserContext, UserContext, goToScreen, primaryColor, setAppLang } from '../AGTools';
import { AuthContext } from '../Login';
import { ShoppingCart } from '../img/svg';
import CartModal from '../CartModal';
import Svg, { Path, Circle } from 'react-native-svg';

// ============ CONSTANTS ============
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Images
const appIcon = require("../img/logo/defaultImg.png");

// ============ TRANSLATIONS ============
const translations = {
    selectProfessional: { en: "Select professional", fr: "Sélectionner un professionnel", th: "เลือกช่างผม" },
    professional: { en: "Professional", fr: "Professionnel", th: "ช่างผม" },
    continue: { en: "Continue", fr: "Continuer", th: "ดำเนินการต่อ" },
    anyStylist: { en: "Any stylist", fr: "N'importe quel styliste", th: "ช่างผมคนใดก็ได้" },
    anyProfessional: { en: "Any professional", fr: "N'importe quel professionnel", th: "ช่างคนใดก็ได้" },
    forMaxAvailability: { en: "for maximum availability", fr: "pour une disponibilité maximale", th: "เพื่อความพร้อมสูงสุด" },
    me: { en: "Me", fr: "Moi", th: "ฉัน" },
    services: { en: "services", fr: "services", th: "บริการ" },
    service: { en: "service", fr: "service", th: "บริการ" },
    stylistsAvailable: { en: "stylists available", fr: "stylistes disponibles", th: "ช่างที่พร้อมให้บริการ" },
    professionalsAvailable: { en: "professionals available", fr: "professionnels disponibles", th: "ช่างที่พร้อมให้บริการ" },
    alreadyAssigned: { en: "Already assigned to another guest", fr: "Déjà assigné à un autre invité", th: "ถูกกำหนดให้แขกคนอื่นแล้ว" },
    back: { en: "Back", fr: "Retour", th: "กลับ" },
};

const t = (key, lang) => translations[key]?.[lang] || translations[key]?.en || key;

// ============ SVG ICONS ============

const PersonGroupIcon = ({ size = 40, color = primaryColor }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="9" cy="7" r="3" stroke={color} strokeWidth="1.5" />
        <Path
            d="M3 18C3 15.5 5.5 13.5 9 13.5C12.5 13.5 15 15.5 15 18"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
        />
        <Circle cx="17" cy="8" r="2.5" stroke={color} strokeWidth="1.5" />
        <Path
            d="M17 13C19 13 21 14.5 21 16.5"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
        />
    </Svg>
);

const ChevronRightIcon = ({ size = 20, color = "#999999" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M9 6L15 12L9 18"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

const CheckIcon = ({ size = 24, color = primaryColor }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M5 12L10 17L19 7"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

// ============ HELPER FUNCTIONS ============

const formatDuration = (minutes) => {
    if (!minutes) return "";
    if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${hours}h`;
    }
    return `${minutes}min`;
};

/**
 * Get team members who can perform a specific service
 */
const getTeamMembersForService = (serviceId, teamMembers) => {
    if (!teamMembers || teamMembers.length === 0) return [];
    return teamMembers.filter(member =>
        member.services && member.services.includes(serviceId)
    );
};

/**
 * Calculate total duration for a guest's services
 */
const calculateGuestDuration = (services) => {
    return services.reduce((sum, s) => sum + (s.duration || 0), 0);
};

// ============ COMPONENTS ============

/**
 * Guest Section - Shows a guest with their services
 */
const GuestSection = memo(({ 
    guest, 
    teamMembers, 
    lang, 
    isStylist,
    onSelectMember,
    getMembersSelectedByOtherGuests,
    hideMemberButton = false,
}) => {
    const servicesCount = guest.services?.length || 0;
    const totalDuration = calculateGuestDuration(guest.services || []);
    const displayName = guest.id === 'me' ? t('me', lang) : guest.name;
    const initial = guest.id === 'me' ? 'M' : guest.name?.charAt(0) || 'G';

    return (
        <View style={styles.guestSection}>
            {/* Guest Header */}
            <View style={styles.guestHeader}>
                <View style={styles.guestHeaderLeft}>
                    <View style={styles.guestAvatar}>
                        <Text style={styles.guestAvatarText}>{initial}</Text>
                    </View>
                    <View>
                        <Text style={styles.guestName}>{displayName}</Text>
                        <Text style={styles.guestServicesCount}>
                            {servicesCount} {servicesCount > 1 ? t('services', lang) : t('service', lang)}
                        </Text>
                    </View>
                </View>
                <Text style={styles.guestDuration}>{formatDuration(totalDuration)}</Text>
            </View>

            {/* Services List */}
            <View style={styles.servicesList}>
                {guest.services?.map((service, index) => (
                    <ServiceRow
                        key={service.id}
                        service={service}
                        guest={guest}
                        teamMembers={teamMembers}
                        lang={lang}
                        isStylist={isStylist}
                        onSelectMember={onSelectMember}
                        getMembersSelectedByOtherGuests={getMembersSelectedByOtherGuests}
                        isLast={index === guest.services.length - 1}
                        hideMemberButton={hideMemberButton}
                    />
                ))}
            </View>
        </View>
    );
});

/**
 * Service Row - Shows a service with member selection button
 */
const ServiceRow = memo(({ 
    service, 
    guest,
    teamMembers, 
    lang, 
    isStylist,
    onSelectMember,
    getMembersSelectedByOtherGuests,
    isLast,
    hideMemberButton = false,
}) => {
    const selectedMember = service.teamMemberId && service.teamMemberId !== 'notSpecific'
        ? teamMembers.find(m => m.id === service.teamMemberId)
        : null;

    const memberDisplayName = selectedMember 
        ? selectedMember.first_name || selectedMember.name 
        : (isStylist ? t('anyStylist', lang) : t('anyProfessional', lang));

    const memberPhoto = selectedMember?.picture;

    return (
        <View style={[styles.serviceRow, !isLast && styles.serviceRowBorder]}>
            {/* Service Info */}
            <View style={styles.serviceInfo}>
                <View style={styles.serviceDot} />
                <View>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.serviceDuration}>{formatDuration(service.duration)}</Text>
                </View>
            </View>

            {/* Member Selection Button - hidden for single service view */}
            {!hideMemberButton && onSelectMember && (
                <TouchableOpacity
                    style={styles.memberButton}
                    onPress={() => onSelectMember(guest.id, service.id)}
                    activeOpacity={0.7}
                >
                    {memberPhoto ? (
                        <Image source={{ uri: memberPhoto }} style={styles.memberPhoto} />
                    ) : (
                        <View style={styles.memberIconContainer}>
                            <PersonGroupIcon size={24} color={primaryColor} />
                        </View>
                    )}
                    <Text style={styles.memberName} numberOfLines={1}>{memberDisplayName}</Text>
                    <ChevronRightIcon />
                </TouchableOpacity>
            )}
        </View>
    );
});

/**
 * Member Selection View - Shows list of available members for a service
 */
const MemberSelectionView = memo(({
    service,
    guest,
    teamMembers,
    lang,
    isStylist,
    onSelect,
    onBack,
    getMembersSelectedByOtherGuests,
    numberOfGuests,
}) => {
    const availableMembers = getTeamMembersForService(service.id, teamMembers);
    const membersSelectedByOthers = getMembersSelectedByOtherGuests(guest.id);
    const currentMemberId = service.teamMemberId;

    const anyProfessionalLabel = isStylist ? t('anyStylist', lang) : t('anyProfessional', lang);
    const availableLabel = isStylist ? t('stylistsAvailable', lang) : t('professionalsAvailable', lang);

    return (
        <View style={styles.selectionContainer}>
            {/* Service Name */}
            <Text style={styles.selectionServiceName}>{service.name}</Text>

            {/* Any Professional Option */}
            <TouchableOpacity
                style={[
                    styles.memberOption,
                    (!currentMemberId || currentMemberId === 'notSpecific') && styles.memberOptionSelected
                ]}
                onPress={() => onSelect(guest.id, service.id, 'notSpecific')}
                activeOpacity={0.7}
            >
                <View style={styles.memberOptionIcon}>
                    <PersonGroupIcon size={40} color={primaryColor} />
                </View>
                <View style={styles.memberOptionInfo}>
                    <Text style={styles.memberOptionName}>{anyProfessionalLabel}</Text>
                    <Text style={styles.memberOptionSubtitle}>{t('forMaxAvailability', lang)}</Text>
                </View>
                {(!currentMemberId || currentMemberId === 'notSpecific') && (
                    <View style={styles.memberOptionCheck}>
                        <CheckIcon />
                    </View>
                )}
            </TouchableOpacity>

            {/* Available Members */}
            {availableMembers.map((member) => {
                const isSelected = currentMemberId === member.id;
                const isSelectedByOther = membersSelectedByOthers.has(member.id);
                const isDisabled = isSelectedByOther && !isSelected && numberOfGuests > 1;

                return (
                    <TouchableOpacity
                        key={member.id}
                        style={[
                            styles.memberOption,
                            isSelected && styles.memberOptionSelected,
                            isDisabled && styles.memberOptionDisabled,
                        ]}
                        onPress={() => !isDisabled && onSelect(guest.id, service.id, member.id)}
                        activeOpacity={isDisabled ? 1 : 0.7}
                        disabled={isDisabled}
                    >
                        {member.picture ? (
                            <Image source={{ uri: member.picture }} style={styles.memberOptionPhoto} />
                        ) : (
                            <View style={styles.memberOptionPhotoPlaceholder}>
                                <Text style={styles.memberOptionPhotoText}>
                                    {(member.first_name || member.name || '?').charAt(0)}
                                </Text>
                            </View>
                        )}
                        <View style={styles.memberOptionInfo}>
                            <Text style={[styles.memberOptionName, isDisabled && styles.textDisabled]}>
                                {member.first_name || member.name}
                            </Text>
                            <Text style={[styles.memberOptionSubtitle, isDisabled && styles.textDisabled]}>
                                {isDisabled ? t('alreadyAssigned', lang) : (member.job_title || '')}
                            </Text>
                        </View>
                        {isSelected && (
                            <View style={styles.memberOptionCheck}>
                                <CheckIcon />
                            </View>
                        )}
                    </TouchableOpacity>
                );
            })}

            {/* Available Count */}
            <Text style={styles.availableCount}>
                {availableMembers.length} {availableLabel}
            </Text>
        </View>
    );
});

// ============ MAIN COMPONENT ============

export default function BeautyProfessional({ navigation, route }) {
    const authContext = useContext(AuthContext);
    const { user } = useContext(authContext?.user ? UserContext : NoUserContext);

    // ============ ROUTE PARAMS ============
    const shopId = route?.params?.shopId;
    const shopData = route?.params?.shopData;
    const settingCalendar = route?.params?.settingCalendar;
    const initialGuests = route?.params?.guests || [];
    const initialTeam = route?.params?.team || [];
    const initialServices = route?.params?.services || [];
    const initialCategories = route?.params?.categories || [];

    // ============ STATE ============
    const [guests, setGuests] = useState(initialGuests);
    const [team, setTeam] = useState(initialTeam);
    
    // Selection state: { guestId, serviceId } or null
    const [selectingFor, setSelectingFor] = useState(null);
    
    // Cart Modal
    const [cartModalVisible, setCartModalVisible] = useState(false);

    const insets = useSafeAreaInsets();
    const lang = setAppLang();

    // ============ DERIVED VALUES ============
    const currency = useMemo(() => shopData?.currency?.text || "THB", [shopData]);
    
    // Check if shop is a hair salon/barbershop
    const isStylist = useMemo(() => {
        const shopType = shopData?.shopType?.id || '';
        return ["salon-de-coiffure", "barbiers"].includes(shopType);
    }, [shopData]);

    // Total services count
    const totalServices = useMemo(() => {
        return guests.reduce((sum, g) => sum + (g.services?.length || 0), 0);
    }, [guests]);

    // Flatten all services for cart
    const cart = useMemo(() => {
        return guests.flatMap(g => g.services || []);
    }, [guests]);

    // Get the service and guest being selected
    const selectionContext = useMemo(() => {
        if (!selectingFor) return null;
        const guest = guests.find(g => g.id === selectingFor.guestId);
        const service = guest?.services?.find(s => s.id === selectingFor.serviceId);
        return { guest, service };
    }, [selectingFor, guests]);

    // Check if only one service (show member list directly below the guest card)
    const isSingleService = useMemo(() => {
        return totalServices === 1 && guests.length === 1;
    }, [totalServices, guests]);

    // Get single service info for inline member list
    const singleServiceInfo = useMemo(() => {
        if (!isSingleService) return null;
        const guest = guests[0];
        const service = guest?.services?.[0];
        return { guest, service };
    }, [isSingleService, guests]);

    // ============ CALLBACKS ============

    /**
     * Get members already selected by other guests (for blocking)
     */
    const getMembersSelectedByOtherGuests = useCallback((currentGuestId) => {
        const selectedMembers = new Set();
        
        if (guests.length <= 1) return selectedMembers;
        
        guests.forEach(guest => {
            if (guest.id !== currentGuestId) {
                guest.services?.forEach(service => {
                    if (service.teamMemberId && service.teamMemberId !== 'notSpecific') {
                        selectedMembers.add(service.teamMemberId);
                    }
                });
            }
        });
        
        return selectedMembers;
    }, [guests]);

    /**
     * Open member selection for a service
     */
    const onSelectMember = useCallback((guestId, serviceId) => {
        setSelectingFor({ guestId, serviceId });
    }, []);

    /**
     * Select a member for a service
     */
    const onMemberSelected = useCallback((guestId, serviceId, memberId) => {
        setGuests(prev => prev.map(guest => {
            if (guest.id !== guestId) return guest;
            return {
                ...guest,
                services: guest.services.map(service => {
                    if (service.id !== serviceId) return service;
                    return {
                        ...service,
                        teamMemberId: memberId,
                        teamMemberName: memberId === 'notSpecific' 
                            ? null 
                            : team.find(m => m.id === memberId)?.first_name || null,
                    };
                }),
            };
        }));
        
        // Go back to main view
        setSelectingFor(null);
    }, [team]);

    /**
     * Go back from member selection
     */
    const onBackFromSelection = useCallback(() => {
        setSelectingFor(null);
    }, []);

    /**
     * Navigate back to BeautyServices
     */
    const onPressBack = useCallback(() => {
        goToScreen(navigation, "BeautyServices", {
            shopId,
            shopData,
            settingCalendar,
            guests,
            team,
            services: initialServices,
            categories: initialCategories,
        });
    }, [navigation, shopId, shopData, settingCalendar, guests, team, initialServices, initialCategories]);

    /**
     * Continue to next step (Time selection)
     */
    const onPressContinue = useCallback(() => {
        if (cart.length === 0) return;
        
        goToScreen(navigation, "BeautyTime", {
            shopId,
            shopData,
            settingCalendar,
            guests,
            team,
            services: initialServices,
            categories: initialCategories,
        });
    }, [navigation, guests, cart, shopId, shopData, settingCalendar, team, initialServices, initialCategories]);

    // Cart Modal handlers
    const onOpenCartModal = useCallback(() => {
        setCartModalVisible(true);
    }, []);

    const onCloseCartModal = useCallback(() => {
        setCartModalVisible(false);
    }, []);

    const onContinueFromCart = useCallback(() => {
        setCartModalVisible(false);
        onPressContinue();
    }, [onPressContinue]);

    // ============ EFFECTS ============
    // No auto-open needed - single service shows inline member list

    // ============ RENDER ============

    // Member Selection View
    if (selectingFor && selectionContext?.service) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                
                {/* Header */}
                <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
                    <View style={styles.header}>
                        <TouchableOpacity 
                            style={styles.headerBackButton} 
                            onPress={isSingleService ? onPressBack : onBackFromSelection}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <View style={styles.chevronLeft} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{t('selectProfessional', lang)}</Text>
                        <View style={styles.headerPlaceholder} />
                    </View>
                </SafeAreaView>

                {/* Member Selection */}
                <ScrollView 
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <MemberSelectionView
                        service={selectionContext.service}
                        guest={selectionContext.guest}
                        teamMembers={team}
                        lang={lang}
                        isStylist={isStylist}
                        onSelect={onMemberSelected}
                        onBack={onBackFromSelection}
                        getMembersSelectedByOtherGuests={getMembersSelectedByOtherGuests}
                        numberOfGuests={guests.length}
                    />
                </ScrollView>

                {/* Bottom Bar */}
                <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
                    <View style={styles.bottomBarContent}>
                        <TouchableOpacity style={styles.cartButton} onPress={onOpenCartModal} activeOpacity={0.9}>
                            <View style={styles.cartIconContainer}>
                                <ShoppingCart width={24} height={24} colorIcon={primaryColor} />
                            </View>
                            {cart.length > 0 && (
                                <View style={styles.cartBadge}>
                                    <Text style={styles.cartBadgeText}>{cart.length}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.continueButton, cart.length === 0 && styles.continueButtonDisabled]}
                            onPress={onPressContinue}
                            activeOpacity={0.9}
                            disabled={cart.length === 0}
                        >
                            <Text style={styles.continueButtonText}>{t('continue', lang)}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Cart Modal */}
                <CartModal
                    visible={cartModalVisible}
                    onClose={onCloseCartModal}
                    onContinue={onContinueFromCart}
                    cart={cart}
                    guests={guests}
                    currency={currency}
                    hideAtVenue={settingCalendar?.hideAtVenue || false}
                />
            </View>
        );
    }

    // Main View (Guests with services)
    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            
            {/* Header */}
            <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.headerBackButton} 
                        onPress={onPressBack}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <View style={styles.chevronLeft} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('selectProfessional', lang)}</Text>
                    <View style={styles.headerPlaceholder} />
                </View>
            </SafeAreaView>

            {/* Content */}
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Single Service: Show only member list */}
                {isSingleService && singleServiceInfo ? (
                    <MemberSelectionView
                        service={singleServiceInfo.service}
                        guest={singleServiceInfo.guest}
                        teamMembers={team}
                        lang={lang}
                        isStylist={isStylist}
                        onSelect={onMemberSelected}
                        onBack={null}
                        getMembersSelectedByOtherGuests={getMembersSelectedByOtherGuests}
                        numberOfGuests={guests.length}
                    />
                ) : (
                    /* Multiple Services/Guests: Show guest cards */
                    guests.map((guest, index) => (
                        <GuestSection
                            key={guest.id}
                            guest={guest}
                            teamMembers={team}
                            lang={lang}
                            isStylist={isStylist}
                            onSelectMember={onSelectMember}
                            getMembersSelectedByOtherGuests={getMembersSelectedByOtherGuests}
                        />
                    ))
                )}
            </ScrollView>

            {/* Bottom Bar */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
                <View style={styles.bottomBarContent}>
                    <TouchableOpacity style={styles.cartButton} onPress={onOpenCartModal} activeOpacity={0.9}>
                        <View style={styles.cartIconContainer}>
                            <ShoppingCart width={24} height={24} colorIcon={primaryColor} />
                        </View>
                        {cart.length > 0 && (
                            <View style={styles.cartBadge}>
                                <Text style={styles.cartBadgeText}>{cart.length}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.continueButton, cart.length === 0 && styles.continueButtonDisabled]}
                        onPress={onPressContinue}
                        activeOpacity={0.9}
                        disabled={cart.length === 0}
                    >
                        <Text style={styles.continueButtonText}>{t('continue', lang)}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Cart Modal */}
            <CartModal
                visible={cartModalVisible}
                onClose={onCloseCartModal}
                onContinue={onContinueFromCart}
                cart={cart}
                guests={guests}
                currency={currency}
                hideAtVenue={settingCalendar?.hideAtVenue || false}
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
    
    // Header
    headerSafeArea: {
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    headerBackButton: {
        width: 30,
        height: 30,
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#000000",
    },
    headerPlaceholder: {
        width: 30,
    },
    chevronLeft: {
        width: 10,
        height: 10,
        borderLeftWidth: 2,
        borderBottomWidth: 2,
        borderColor: "#000000",
        transform: [{ rotate: "45deg" }],
        marginLeft: 4,
    },
    
    // Scroll View
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 100,
    },
    
    // Guest Section
    guestSection: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E5E5",
        borderRadius: 12,
        marginBottom: 16,
        overflow: "hidden",
    },
    guestHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#FAFAFA",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
    },
    guestHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    guestAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: primaryColor,
        justifyContent: "center",
        alignItems: "center",
    },
    guestAvatarText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    guestName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#000000",
    },
    guestServicesCount: {
        fontSize: 13,
        color: "#888888",
    },
    guestDuration: {
        fontSize: 15,
        fontWeight: "600",
        color: "#000000",
    },
    
    // Services List
    servicesList: {
        paddingHorizontal: 16,
    },
    serviceRow: {
        paddingVertical: 16,
    },
    serviceRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    serviceInfo: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    serviceDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: primaryColor,
        marginTop: 6,
        marginRight: 10,
    },
    serviceName: {
        fontSize: 15,
        fontWeight: "600",
        color: "#000000",
        marginBottom: 2,
    },
    serviceDuration: {
        fontSize: 13,
        color: "#888888",
    },
    
    // Member Button
    memberButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E5E5",
        borderRadius: 25,
        paddingVertical: 8,
        paddingHorizontal: 12,
        gap: 10,
    },
    memberPhoto: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    memberIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#F5F0FF",
        justifyContent: "center",
        alignItems: "center",
    },
    memberName: {
        flex: 1,
        fontSize: 14,
        color: "#000000",
    },
    
    // Member Selection View
    selectionContainer: {
        paddingBottom: 20,
    },
    selectionServiceName: {
        fontSize: 15,
        color: "#888888",
        marginBottom: 16,
    },
    memberOption: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E5E5",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        gap: 14,
    },
    memberOptionSelected: {
        borderColor: primaryColor,
        borderWidth: 2,
        backgroundColor: "#F8F5FF",
    },
    memberOptionDisabled: {
        opacity: 0.5,
    },
    memberOptionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#F5F0FF",
        justifyContent: "center",
        alignItems: "center",
    },
    memberOptionPhoto: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    memberOptionPhotoPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#E5E5E5",
        justifyContent: "center",
        alignItems: "center",
    },
    memberOptionPhotoText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#888888",
    },
    memberOptionInfo: {
        flex: 1,
    },
    memberOptionName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#000000",
        marginBottom: 2,
    },
    memberOptionSubtitle: {
        fontSize: 13,
        color: "#888888",
    },
    memberOptionCheck: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#F5F0FF",
        justifyContent: "center",
        alignItems: "center",
    },
    textDisabled: {
        color: "#AAAAAA",
    },
    availableCount: {
        fontSize: 13,
        color: "#888888",
        textAlign: "center",
        marginTop: 8,
    },
    
    // Bottom Bar
    bottomBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 0.87,
        borderTopColor: "#D9D9D9",
        paddingHorizontal: 24,
        paddingTop: 9,
    },
    bottomBarContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 15,
    },
    cartButton: {
        width: 57,
        height: 44,
        backgroundColor: "#FFFFFF",
        borderWidth: 1.3,
        borderColor: primaryColor,
        borderRadius: 13,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    cartIconContainer: {
        width: 30,
        height: 30,
        justifyContent: "center",
        alignItems: "center",
    },
    cartBadge: {
        position: "absolute",
        top: -5,
        right: -5,
        width: 21,
        height: 21,
        borderRadius: 11,
        backgroundColor: primaryColor,
        justifyContent: "center",
        alignItems: "center",
    },
    cartBadgeText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#FFFFFF",
    },
    continueButton: {
        flex: 1,
        height: 44,
        backgroundColor: primaryColor,
        borderRadius: 13,
        justifyContent: "center",
        alignItems: "center",
    },
    continueButtonDisabled: {
        opacity: 0.5,
    },
    continueButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#FFFFFF",
    },
});

