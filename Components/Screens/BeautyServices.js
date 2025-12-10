import React, { useContext, useEffect, useState, useCallback, useRef, memo, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    Dimensions,
    StatusBar,
    RefreshControl,
    SectionList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NoUserContext, UserContext, goToScreen, primaryColor, setAppLang } from '../AGTools';
import ServiceModal from '../ServiceModal';
import { AuthContext } from '../Login';
import { firestore } from '../../firebase.config';
import {
    collection,
    query,
    orderBy,
    getDocs,
} from '@react-native-firebase/firestore';

// ============ CONSTANTS ============
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SERVICE_CARD_HEIGHT = 104;

// Images
const appIcon = require("../img/logo/defaultImg.png");
const arrowBack = require("../img/arrow/arrowBackBg.png");

// ============ TRANSLATIONS ============
const translations = {
    services: { en: "Services", fr: "Services", th: "บริการ" },
    allServices: { en: "All Services", fr: "Tous les services", th: "บริการทั้งหมด" },
    continue: { en: "Continue", fr: "Continuer", th: "ดำเนินการต่อ" },
    servicesSelected: { en: "services selected", fr: "services sélectionnés", th: "บริการที่เลือก" },
    serviceSelected: { en: "service selected", fr: "service sélectionné", th: "บริการที่เลือก" },
};

const t = (key, lang) => translations[key]?.[lang] || translations[key]?.en || key;

// ============ HELPERS ============

/**
 * Transform raw Firestore service data
 */
const transformService = (docSnap, lang) => {
    const data = docSnap.data();
    
    const getLocalizedTitle = () => {
        if (data.title_service?.[lang]?.text) return data.title_service[lang].text;
        if (data.title_service?.en?.text) return data.title_service.en.text;
        if (data.title_service?.fr?.text) return data.title_service.fr.text;
        return data.name || "";
    };
    
    const getLocalizedDescription = () => {
        if (data.description_service?.[lang]?.text) return data.description_service[lang].text;
        if (data.description_service?.en?.text) return data.description_service.en.text;
        if (data.description?.[lang]) return data.description[lang];
        if (typeof data.description === 'string') return data.description;
        return "";
    };
    
    const formatDuration = (minutes) => {
        if (!minutes) return "";
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
        }
        return `${minutes} min`;
    };
    
    return {
        id: docSnap.id,
        name: getLocalizedTitle(),
        description: getLocalizedDescription(),
        duration: data.duration || 0,
        durationText: data.durationText || formatDuration(data.duration),
        price: data.price || 0,
        promotionPrice: data.promotionPrice || null,
        isPromotion: data.promotionPrice && data.promotionPrice < data.price,
        categoryId: data.categoryId || null,
        categoryName: data.categoryName || null,
        priority: data.priority || 0,
        pictureUrl: data.pictureUrl || data.image || null,
        serviceOptions: data.serviceOptions || [],
        serviceAddons: data.serviceAddons || [],
    };
};

/**
 * Transform raw Firestore category document
 */
const transformCategory = (docSnap) => {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        name: data.categoryName || "",
        color: data.color || primaryColor,
        priority: data.priority || 0,
    };
};

// ============ MEMOIZED COMPONENTS ============

// Back Button
const BackButton = memo(({ onPress, insets }) => (
    <TouchableOpacity 
        style={[styles.backButton, { top: insets.top + 10 }]} 
        onPress={onPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
        <View style={styles.backButtonCircle}>
            <View style={styles.chevronLeft} />
        </View>
    </TouchableOpacity>
));

// Category Tab
const CategoryTab = memo(({ category, isActive, onPress }) => (
    <TouchableOpacity 
        style={[styles.categoryTab, isActive && styles.categoryTabActive]} 
        onPress={() => onPress(category)}
        activeOpacity={0.8}
    >
        <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>
            {category.name}
        </Text>
    </TouchableOpacity>
));

// Service Card
const ServiceCard = memo(({ service, currency, isInCart, onPress, lang }) => {
    const hasImage = service.pictureUrl && service.pictureUrl.trim() !== "";
    
    return (
        <TouchableOpacity 
            style={styles.serviceCard}
            onPress={() => onPress(service)}
            activeOpacity={0.9}
        >
            {hasImage && (
                <Image 
                    source={{ uri: service.pictureUrl }} 
                    style={styles.serviceImage} 
                    resizeMode="cover"
                />
            )}
            <View style={[styles.serviceInfo, !hasImage && styles.serviceInfoNoImage]}>
                <Text style={styles.serviceName} numberOfLines={1}>{service.name}</Text>
                <Text style={styles.serviceDescription} numberOfLines={2}>{service.description}</Text>
                <View style={styles.serviceFooter}>
                    <View style={styles.servicePriceContainer}>
                        {service.isPromotion ? (
                            <>
                                <Text style={styles.serviceOriginalPrice}>{currency} {service.price}</Text>
                                <Text style={styles.servicePromoPrice}>{currency} {service.promotionPrice}</Text>
                            </>
                        ) : (
                            <Text style={styles.servicePrice}>{currency} {service.price}</Text>
                        )}
                        {service.durationText && (
                            <Text style={styles.serviceDuration}> • {service.durationText}</Text>
                        )}
                    </View>
                    <View style={[styles.addButton, isInCart && styles.addButtonActive]}>
                        <Text style={[styles.addButtonText, isInCart && styles.addButtonTextActive]}>
                            {isInCart ? "✓" : "+"}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
});

// Section Header
const SectionHeader = memo(({ title }) => (
    <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
));

// Skeleton
const ServiceSkeleton = memo(() => (
    <View style={[styles.serviceCard, styles.skeleton, { height: SERVICE_CARD_HEIGHT }]} />
));

// ============ MAIN COMPONENT ============
export default function BeautyServices({ navigation, route }) {
    const authContext = useContext(AuthContext);
    const { user } = useContext(authContext?.user ? UserContext : NoUserContext);
    const mountedRef = useRef(true);
    const sectionListRef = useRef(null);
    const categoryScrollRef = useRef(null);

    // Route params
    const shopId = route?.params?.shopId;
    const shopData = route?.params?.shopData;
    const initialCart = route?.params?.cart || [];
    const settingCalendar = route?.params?.settingCalendar;
    // Pre-fetched data from Venue.js to avoid redundant Firestore queries
    const initialServices = route?.params?.services || [];
    const initialCategories = route?.params?.categories || [];
    const initialTeam = route?.params?.team || [];

    // ============ STATE ============
    const [services, setServices] = useState(initialServices);
    const [categories, setCategories] = useState(initialCategories);
    const [selectedCategory, setSelectedCategory] = useState(initialCategories.length > 0 ? initialCategories[0] : null);
    const [team, setTeam] = useState(initialTeam);
    const [cart, setCart] = useState(initialCart);
    
    // Service Modal
    const [serviceModalVisible, setServiceModalVisible] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    
    // Loading - start as false if we have pre-fetched data
    const [loading, setLoading] = useState(initialServices.length === 0);
    const [refreshing, setRefreshing] = useState(false);

    const insets = useSafeAreaInsets();
    const lang = setAppLang();
    const defaultIcon = Image.resolveAssetSource(appIcon).uri;

    // ============ DERIVED VALUES ============
    const currency = useMemo(() => shopData?.currency?.text || "THB", [shopData]);
    const cartItemIds = useMemo(() => cart.map(item => item.id), [cart]);
    const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.totalPrice || item.promotionPrice || item.price), 0), [cart]);

    // Group services by category for SectionList
    const sections = useMemo(() => {
        if (categories.length === 0) return [];
        
        return categories
            .map(category => ({
                id: category.id,
                title: category.name,
                data: services.filter(s => s.categoryId === category.id),
            }))
            .filter(section => section.data.length > 0);
    }, [categories, services]);

    // Category index map for scrolling
    const categoryIndexMap = useMemo(() => {
        const map = {};
        sections.forEach((section, index) => {
            map[section.id] = index;
        });
        return map;
    }, [sections]);

    // ============ FETCH FUNCTIONS ============
    // Only fetch if data wasn't passed from Venue.js
    const fetchServices = useCallback(async (force = false) => {
        if (!shopId) return;
        // Skip if we already have data and not forcing refresh
        if (services.length > 0 && !force) return;
        
        setLoading(true);
        
        try {
            const servicesRef = collection(firestore, "Shops", shopId, "Services");
            const q = query(servicesRef, orderBy("priority", "asc"));
            const snapshot = await getDocs(q);
            
            const servicesData = snapshot.docs.map(docSnap => transformService(docSnap, lang));
            
            if (mountedRef.current) {
                setServices(servicesData);
            }
        } catch (error) {
            console.error("Error fetching services:", error);
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, [shopId, lang, services.length]);

    const fetchCategories = useCallback(async (force = false) => {
        if (!shopId) return;
        // Skip if we already have data and not forcing refresh
        if (categories.length > 0 && !force) return;
        
        try {
            const categoriesRef = collection(firestore, "Shops", shopId, "ServiceCategories");
            const q = query(categoriesRef, orderBy("priority", "asc"));
            const snapshot = await getDocs(q);
            
            const categoriesData = snapshot.docs.map(docSnap => transformCategory(docSnap));
            
            if (mountedRef.current) {
                setCategories(categoriesData);
                // Set first category only on initial load
                setSelectedCategory(prev => prev || (categoriesData.length > 0 ? categoriesData[0] : null));
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    }, [shopId, categories.length]);

    const fetchTeam = useCallback(async (force = false) => {
        if (!shopId) return;
        // Skip if we already have data and not forcing refresh
        if (team.length > 0 && !force) return;
        
        try {
            const teamRef = collection(firestore, "Shops", shopId, "Teams");
            const snapshot = await getDocs(teamRef);
            
            const teamData = snapshot.docs.map(docSnap => {
                const data = docSnap.data();
                const getFullName = () => {
                    if (data.first_name && data.last_name) return `${data.first_name} ${data.last_name}`;
                    if (data.name) return data.name;
                    return data.first_name || "";
                };
                return {
                    id: docSnap.id,
                    name: getFullName(),
                    picture: data.photo_url || null,
                    role: data.job_title || "",
                    services: Array.isArray(data.services) ? data.services : [],
                };
            });
            
            if (mountedRef.current) {
                setTeam(teamData);
            }
        } catch (error) {
            console.error("Error fetching team:", error);
        }
    }, [shopId, team.length]);

    // ============ HANDLERS ============
    const onPressBack = useCallback(() => {
        goToScreen(navigation, "goBack");
    }, [navigation]);

    const onPressCategory = useCallback((category) => {
        setSelectedCategory(category);
        
        // Scroll to section
        const sectionIndex = categoryIndexMap[category.id];
        if (sectionIndex !== undefined && sectionListRef.current) {
            sectionListRef.current.scrollToLocation({
                sectionIndex,
                itemIndex: 0,
                viewOffset: 120, // Account for header
                animated: true,
            });
        }
    }, [categoryIndexMap]);

    const onPressService = useCallback((service) => {
        setSelectedService(service);
        setServiceModalVisible(true);
    }, []);

    const onCloseServiceModal = useCallback(() => {
        setServiceModalVisible(false);
        setSelectedService(null);
    }, []);

    const onAddServiceFromModal = useCallback(({ service, selectedOption, selectedAddOns, selectedMember, totalPrice, totalDuration }) => {
        const cartItem = {
            id: service.id,
            name: service.name,
            description: service.description,
            duration: totalDuration,
            durationText: service.durationText,
            price: service.price,
            promotionPrice: service.promotionPrice,
            categoryId: service.categoryId,
            pictureUrl: service.pictureUrl,
            selectedOption,
            selectedAddOns,
            teamMemberId: selectedMember?.id || null,
            teamMemberName: selectedMember?.name || null,
            totalPrice,
        };

        setCart(prev => {
            const existingIndex = prev.findIndex(item => item.id === service.id);
            if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = cartItem;
                return updated;
            }
            return [...prev, cartItem];
        });
    }, []);

    const onRemoveServiceFromModal = useCallback((serviceId) => {
        setCart(prev => prev.filter(item => item.id !== serviceId));
    }, []);

    const onPressContinue = useCallback(() => {
        if (cart.length === 0) return;
        
        // Navigate to next step (will handle guests later)
        goToScreen(navigation, "Booking", { 
            shopId,
            services: cart,
            shopData,
            settingCalendar,
        });
    }, [navigation, shopId, cart, shopData, settingCalendar]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        // Force refresh all data
        await Promise.all([fetchServices(true), fetchCategories(true), fetchTeam(true)]);
        if (mountedRef.current) setRefreshing(false);
    }, [fetchServices, fetchCategories, fetchTeam]);

    // ============ EFFECTS ============
    useEffect(() => {
        mountedRef.current = true;
        // Only fetch if data wasn't passed from Venue.js
        if (initialServices.length === 0) {
            fetchServices();
        }
        if (initialCategories.length === 0) {
            fetchCategories();
        }
        if (initialTeam.length === 0) {
            fetchTeam();
        }
        return () => { mountedRef.current = false; };
    }, []);

    // ============ RENDER ============
    const renderItem = useCallback(({ item }) => (
        <ServiceCard
            service={item}
            currency={currency}
            isInCart={cartItemIds.includes(item.id)}
            onPress={onPressService}
            lang={lang}
        />
    ), [currency, cartItemIds, onPressService, lang]);

    const renderSectionHeader = useCallback(({ section }) => (
        <SectionHeader title={section.title} />
    ), []);

    const keyExtractor = useCallback((item) => item.id, []);

    const getItemLayout = useCallback((data, index) => ({
        length: SERVICE_CARD_HEIGHT + 12,
        offset: (SERVICE_CARD_HEIGHT + 12) * index,
        index,
    }), []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
            
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
                    <Text style={styles.headerTitle}>{t('services', lang)}</Text>
                    <View style={styles.headerPlaceholder} />
                </View>
                
                {/* Category Tabs */}
                {categories.length > 0 && (
                    <ScrollView 
                        ref={categoryScrollRef}
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesContainer}
                    >
                        {categories.map(cat => (
                            <CategoryTab 
                                key={cat.id}
                                category={cat}
                                isActive={selectedCategory?.id === cat.id}
                                onPress={onPressCategory}
                            />
                        ))}
                    </ScrollView>
                )}
            </SafeAreaView>

            {/* Services List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ServiceSkeleton />
                    <ServiceSkeleton />
                    <ServiceSkeleton />
                </View>
            ) : (
                <SectionList
                    ref={sectionListRef}
                    sections={sections}
                    renderItem={renderItem}
                    renderSectionHeader={renderSectionHeader}
                    keyExtractor={keyExtractor}
                    stickySectionHeadersEnabled={false}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />
                    }
                    ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
                    SectionSeparatorComponent={() => <View style={styles.sectionSeparator} />}
                />
            )}

            {/* Bottom Bar - Same as Venue.js */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
                <View style={styles.bottomBarContent}>
                    <TouchableOpacity style={styles.cartButton} activeOpacity={0.9}>
                        <View style={styles.cartIconContainer}>
                            <Text style={styles.cartIcon}>🛒</Text>
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

            {/* Service Modal */}
            <ServiceModal
                visible={serviceModalVisible}
                service={selectedService}
                onClose={onCloseServiceModal}
                onAddService={onAddServiceFromModal}
                onRemoveService={onRemoveServiceFromModal}
                currency={currency}
                isInCart={selectedService ? cartItemIds.includes(selectedService.id) : false}
                existingCartService={selectedService ? cart.find(item => item.id === selectedService.id) : null}
                teamMembers={team}
                showMemberSelection={settingCalendar?.displaySelectMember || false}
                defaultIcon={defaultIcon}
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
    
    // Categories
    categoriesContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 10,
    },
    categoryTab: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#D9D9D9",
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 10,
    },
    categoryTabActive: {
        backgroundColor: primaryColor,
        borderColor: primaryColor,
    },
    categoryTabText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#000000",
    },
    categoryTabTextActive: {
        color: "#FFFFFF",
    },
    
    // Loading
    loadingContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
        gap: 12,
    },
    skeleton: {
        backgroundColor: "#E8E8E8",
        borderRadius: 7,
    },
    
    // List
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 120,
    },
    itemSeparator: {
        height: 12,
    },
    sectionSeparator: {
        height: 8,
    },
    
    // Section Header
    sectionHeader: {
        paddingVertical: 12,
        backgroundColor: "#FFFFFF",
    },
    sectionHeaderText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#000000",
    },
    
    // Service Card
    serviceCard: {
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        borderWidth: 0.89,
        borderColor: "#D9D9D9",
        borderRadius: 7,
        padding: 12,
        gap: 11,
        minHeight: SERVICE_CARD_HEIGHT,
    },
    serviceImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    serviceInfo: {
        flex: 1,
        justifyContent: "center",
        gap: 6,
    },
    serviceInfoNoImage: {
        marginLeft: 0,
    },
    serviceName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#000000",
    },
    serviceDescription: {
        fontSize: 11,
        fontWeight: "500",
        color: "#000000",
    },
    serviceFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    servicePriceContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    servicePrice: {
        fontSize: 12,
        fontWeight: "600",
        color: "#000000",
    },
    serviceOriginalPrice: {
        fontSize: 12,
        fontWeight: "500",
        color: "#747676",
        textDecorationLine: "line-through",
    },
    servicePromoPrice: {
        fontSize: 12,
        fontWeight: "600",
        color: primaryColor,
    },
    serviceDuration: {
        fontSize: 10,
        fontWeight: "500",
        color: "#747676",
    },
    addButton: {
        width: 27,
        height: 27,
        borderRadius: 7,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#D9D9D9",
        justifyContent: "center",
        alignItems: "center",
    },
    addButtonActive: {
        backgroundColor: primaryColor,
        borderColor: primaryColor,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#000000",
    },
    addButtonTextActive: {
        color: "#FFFFFF",
    },
    
    // Bottom Bar - Same as Venue.js
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
    cartIcon: {
        fontSize: 20,
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
    
    // Back Button (for overlay use)
    backButton: {
        position: "absolute",
        left: 20,
        zIndex: 10,
    },
    backButtonCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: "rgba(255,255,255,0.9)",
        justifyContent: "center",
        alignItems: "center",
    },
});

