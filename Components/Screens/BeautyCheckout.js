/**
 * BeautyCheckout.js - Page de confirmation de réservation
 * 
 * Cette page permet de finaliser la réservation avec :
 * - Informations personnelles (prénom, nom, téléphone)
 * - Code promo
 * - Méthode de paiement (Pay at venue / Pay now)
 * - Notes de réservation
 * - Résumé des services et prix
 * - Acceptation des CGU
 */

import React, { useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    Dimensions,
    StatusBar,
    Modal,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NoUserContext, UserContext, goToScreen, primaryColor, setAppLang } from '../AGTools';
import { AuthContext } from '../Login';
import { auth } from '../../firebase.config';
import Svg, { Path, Circle, G, Rect } from 'react-native-svg';
import { firestore, onHttpsCallableAsiaSoutheast } from '../../firebase.config';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    orderBy,
    limit,
    getDoc,
    setDoc,
} from '@react-native-firebase/firestore';

// ============ CONSTANTS ============
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Country codes list with most common countries
const COUNTRY_CODES = [
    { code: '+66', country: 'Thailand', flag: '🇹🇭' },
    { code: '+33', country: 'France', flag: '🇫🇷' },
    { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
    { code: '+44', country: 'UK', flag: '🇬🇧' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+81', country: 'Japan', flag: '🇯🇵' },
    { code: '+82', country: 'South Korea', flag: '🇰🇷' },
    { code: '+65', country: 'Singapore', flag: '🇸🇬' },
    { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
    { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
    { code: '+63', country: 'Philippines', flag: '🇵🇭' },
    { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
    { code: '+852', country: 'Hong Kong', flag: '🇭🇰' },
    { code: '+61', country: 'Australia', flag: '🇦🇺' },
    { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
    { code: '+971', country: 'UAE', flag: '🇦🇪' },
    { code: '+49', country: 'Germany', flag: '🇩🇪' },
    { code: '+39', country: 'Italy', flag: '🇮🇹' },
    { code: '+34', country: 'Spain', flag: '🇪🇸' },
    { code: '+7', country: 'Russia', flag: '🇷🇺' },
    { code: '+55', country: 'Brazil', flag: '🇧🇷' },
];

// ============ TRANSLATIONS ============
const translations = {
    confirm: { en: "Confirm", fr: "Confirmer", th: "ยืนยัน" },
    personalInfo: { en: "Personal Information", fr: "Informations personnelles", th: "ข้อมูลส่วนตัว" },
    firstName: { en: "First name*", fr: "Prénom*", th: "ชื่อ*" },
    lastName: { en: "Last name*", fr: "Nom*", th: "นามสกุล*" },
    mobileNumber: { en: "Mobile number*", fr: "Numéro de téléphone*", th: "เบอร์โทรศัพท์*" },
    discountCodes: { en: "Discount Codes", fr: "Codes de réduction", th: "รหัสส่วนลด" },
    selectPromoCode: { en: "Select promo code", fr: "Sélectionner un code promo", th: "เลือกรหัสโปรโมชั่น" },
    none: { en: "None", fr: "Aucun", th: "ไม่มี" },
    codeSelected: { en: "code selected", fr: "code sélectionné", th: "เลือกรหัส" },
    codesSelected: { en: "codes selected", fr: "codes sélectionnés", th: "เลือกรหัส" },
    apply: { en: "Apply", fr: "Appliquer", th: "ใช้งาน" },
    enterPromoCode: { en: "Enter promo code here", fr: "Entrez le code promo ici", th: "ใส่รหัสโปรโมชั่นที่นี่" },
    confirmBookingQuestion: { en: "Are you sure you want to confirm this booking?", fr: "Êtes-vous sûr de vouloir confirmer cette réservation ?", th: "คุณแน่ใจหรือไม่ว่าต้องการยืนยันการจองนี้?" },
    no: { en: "No", fr: "Non", th: "ไม่" },
    yes: { en: "Yes", fr: "Oui", th: "ใช่" },
    confirmingBooking: { en: "Confirming your booking", fr: "Confirmation de votre réservation en cours", th: "กำลังยืนยันการจองของคุณ" },
    paymentMethod: { en: "Payment Method", fr: "Mode de paiement", th: "วิธีการชำระเงิน" },
    payAtVenue: { en: "Pay at venue", fr: "Payer sur place", th: "ชำระที่ร้าน" },
    payWhenArrive: { en: "Pay when you arrive", fr: "Payez à votre arrivée", th: "ชำระเมื่อมาถึง" },
    payNow: { en: "Pay now", fr: "Payer maintenant", th: "ชำระเลย" },
    onlyToGuarantee: { en: "Only {percent}% to guarantee your booking", fr: "Seulement {percent}% pour garantir votre réservation", th: "เพียง {percent}% เพื่อยืนยันการจอง" },
    bookingNotes: { en: "Booking Notes", fr: "Notes de réservation", th: "หมายเหตุการจอง" },
    notesPlaceholder: { en: "Include comment or requests about your booking", fr: "Ajoutez un commentaire ou une demande concernant votre réservation", th: "เพิ่มความคิดเห็นหรือคำขอเกี่ยวกับการจองของคุณ" },
    note: { en: "Note", fr: "Note", th: "หมายเหตุ" },
    noteText: { en: "To ensure smooth service, please arrive on time. Appointments may be cancelled after 15 minutes.", fr: "Pour garantir un service fluide, veuillez arriver à l'heure. Les rendez-vous peuvent être annulés après 15 minutes.", th: "เพื่อให้บริการราบรื่น กรุณามาตรงเวลา การนัดหมายอาจถูกยกเลิกหลัง 15 นาที" },
    servicesSummary: { en: "Services Summary", fr: "Résumé des services", th: "สรุปบริการ" },
    me: { en: "Me", fr: "Moi", th: "ฉัน" },
    guest: { en: "Guest", fr: "Invité", th: "ผู้เข้าพัก" },
    with: { en: "with", fr: "avec", th: "กับ" },
    addOn: { en: "Add-on", fr: "Supplément", th: "เสริม" },
    subtotal: { en: "Subtotal", fr: "Sous-total", th: "ยอดรวมย่อย" },
    discountsOnServices: { en: "Discounts on services", fr: "Réductions sur les services", th: "ส่วนลดบริการ" },
    discountsOnDeposit: { en: "Discounts on deposit", fr: "Réductions sur l'acompte", th: "ส่วนลดมัดจำ" },
    promoCode: { en: "PROMO CODE", fr: "CODE PROMO", th: "รหัสโปรโมชั่น" },
    total: { en: "Total", fr: "Total", th: "ยอดรวม" },
    agreeToTerms: { en: "I agree to the", fr: "J'accepte la", th: "ฉันยอมรับ" },
    privacyPolicy: { en: "Privacy Policy", fr: "Politique de confidentialité", th: "นโยบายความเป็นส่วนตัว" },
    termsOfUse: { en: "Terms of Use", fr: "Conditions d'utilisation", th: "ข้อกำหนดการใช้งาน" },
    termsOfService: { en: "Terms of Service", fr: "Conditions de service", th: "ข้อกำหนดการบริการ" },
    and: { en: "and", fr: "et", th: "และ" },
    agreeMarketing: { en: "I agree to receive marketing notifications with offers and news", fr: "J'accepte de recevoir des notifications marketing avec des offres et des actualités", th: "ฉันยอมรับการรับการแจ้งเตือนการตลาดพร้อมข้อเสนอและข่าวสาร" },
    youllSave: { en: "You'll save", fr: "Vous économiserez", th: "คุณจะประหยัด" },
    afterDiscount: { en: "after the discount.", fr: "après la réduction.", th: "หลังส่วนลด" },
    durationFormat: { en: "{hours} hour {minutes} minutes duration", fr: "{hours} heure {minutes} minutes", th: "{hours} ชั่วโมง {minutes} นาที" },
};

const t = (key, lang) => translations[key]?.[lang] || translations[key]?.en || key;

// ============ SVG ICONS ============

const ArrowBackIcon = ({ size = 24, color = "#333333" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M15 19L8 12L15 5"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

const CalendarIcon = ({ size = 15, color = "#333333" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z"
            stroke={color}
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

const ClockIcon = ({ size = 15, color = "#333333" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12Z"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <Path
            d="M15.71 15.18L12.61 13.33C12.07 13.01 11.63 12.24 11.63 11.61V7.51"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

const ChevronDownIcon = ({ size = 12, color = "#333333" }) => (
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

const ChevronRightIcon = ({ size = 12, color = "#333333" }) => (
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

const CreditCardIcon = ({ size = 20, color = "#333333" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M2 8.5H22M6 16.5H8M10.5 16.5H14.5M6 19.5H18C20 19.5 22 17.5 22 15.5V8.5C22 6.5 20 4.5 18 4.5H6C4 4.5 2 6.5 2 8.5V15.5C2 17.5 4 19.5 6 19.5Z"
            stroke={color}
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

const CheckboxIcon = ({ checked = false, size = 21, color = primaryColor }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect
            x="2"
            y="2"
            width="20"
            height="20"
            rx="4"
            stroke={checked ? color : "#D9D9D9"}
            strokeWidth="2"
            fill={checked ? color : "none"}
        />
        {checked && (
            <Path
                d="M7 12L10.5 15.5L17 9"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        )}
    </Svg>
);

const BulletIcon = ({ size = 5, color = "#333333" }) => (
    <Svg width={size} height={10} viewBox="0 0 5 10" fill="none">
        <Circle cx="2.5" cy="5" r="2.5" fill={color} />
    </Svg>
);

const TicketIcon = ({ size = 20, color = primaryColor }) => (
    <Svg width={size} height={size * 0.5} viewBox="0 0 24 12" fill="none">
        <Path
            d="M22 5.25C21.59 5.25 21.25 4.91 21.25 4.5C21.25 3.26 20.24 2.25 19 2.25H5C3.76 2.25 2.75 3.26 2.75 4.5C2.75 4.91 2.41 5.25 2 5.25C1.59 5.25 1.25 5.59 1.25 6C1.25 6.41 1.59 6.75 2 6.75C2.41 6.75 2.75 7.09 2.75 7.5C2.75 8.74 3.76 9.75 5 9.75H19C20.24 9.75 21.25 8.74 21.25 7.5C21.25 7.09 21.59 6.75 22 6.75C22.41 6.75 22.75 6.41 22.75 6C22.75 5.59 22.41 5.25 22 5.25Z"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

const CloseIcon = ({ size = 24, color = "#333333" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M18 6L6 18M6 6L18 18"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

// ============ HELPER FUNCTIONS ============

const formatDuration = (minutes) => {
    if (!minutes) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h${mins.toString().padStart(2, '0')}`;
};

const formatPrice = (price, currency = "THB") => {
    if (price === undefined || price === null) return "";
    const formatted = price.toLocaleString();
    return `${currency} ${formatted}`;
};

const formatDate = (date, lang = 'en') => {
    const days = {
        en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
        th: ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'],
    };
    const months = {
        en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
        th: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'],
    };
    
    const d = new Date(date);
    const dayName = days[lang]?.[d.getDay()] || days.en[d.getDay()];
    const day = d.getDate();
    const monthName = months[lang]?.[d.getMonth()] || months.en[d.getMonth()];
    const year = d.getFullYear();
    
    return `${dayName} ${day} ${monthName} ${year}`;
};

// ============ SUB-COMPONENTS ============

/**
 * Input Field Component
 */
const InputField = ({ 
    placeholder, 
    value, 
    onChangeText, 
    keyboardType = 'default',
    multiline = false,
    numberOfLines = 1,
    style = {},
}) => (
    <View style={[styles.inputContainer, multiline && styles.inputMultiline, style]}>
        <TextInput
            style={[styles.input, multiline && styles.inputTextMultiline]}
            placeholder={placeholder}
            placeholderTextColor="#747676"
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            multiline={multiline}
            numberOfLines={numberOfLines}
            textAlignVertical={multiline ? 'top' : 'center'}
        />
    </View>
);

/**
 * Phone Input Component
 */
const PhoneInput = ({ countryCode, phoneNumber, onChangeCountryCode, onChangePhoneNumber, placeholder, onPressCountryCode }) => {
    const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode);
    
    return (
        <View style={styles.phoneInputRow}>
            <TouchableOpacity 
                style={styles.countryCodeContainer} 
                activeOpacity={0.7}
                onPress={onPressCountryCode}
            >
                <Text style={styles.flagText}>{selectedCountry?.flag || '🌍'}</Text>
                <Text style={styles.countryCodeText}>{countryCode}</Text>
                <ChevronDownIcon size={10} color="#333" />
            </TouchableOpacity>
            <View style={styles.phoneNumberContainer}>
                <TextInput
                    style={styles.phoneNumberInput}
                    placeholder={placeholder}
                    placeholderTextColor="#747676"
                    value={phoneNumber}
                    onChangeText={onChangePhoneNumber}
                    keyboardType="phone-pad"
                />
            </View>
        </View>
    );
};

/**
 * Payment Option Component
 */
const PaymentOption = ({ selected, title, subtitle, onPress }) => (
    <TouchableOpacity
        style={[styles.paymentOption, selected && styles.paymentOptionSelected]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={styles.paymentOptionContent}>
            <CreditCardIcon size={20} color="#333" />
            <View style={styles.paymentOptionText}>
                <Text style={styles.paymentOptionTitle}>{title}</Text>
                <Text style={styles.paymentOptionSubtitle}>{subtitle}</Text>
            </View>
        </View>
    </TouchableOpacity>
);

/**
 * Service Item Component
 */
const ServiceItem = ({ service, lang }) => {
    const hasPromo = service.promotionPrice && service.promotionPrice < service.price;
    const memberName = service.teamMemberName || service.memberName || 'Any professional';
    
    return (
        <View style={styles.serviceItem}>
            <View style={styles.serviceItemLeft}>
                <View style={styles.serviceNameRow}>
                    <BulletIcon size={5} color="#333" />
                    <Text style={styles.serviceName}>{service.name || service.title}</Text>
                </View>
                {service.optionName && (
                    <Text style={styles.serviceOption}>{service.optionName}</Text>
                )}
                <View style={styles.serviceMemberRow}>
                    <Text style={styles.serviceDuration}>{formatDuration(service.duration)}</Text>
                    <Text style={styles.serviceWith}>{t('with', lang)}</Text>
                    <View style={styles.memberBadge}>
                        <Text style={styles.memberBadgeText}>{memberName}</Text>
                    </View>
                </View>
            </View>
            <View style={styles.serviceItemRight}>
                {hasPromo ? (
                    <>
                        <Text style={styles.priceOriginal}>{formatPrice(service.price)}</Text>
                        <Text style={styles.pricePromo}>{formatPrice(service.promotionPrice)}</Text>
                    </>
                ) : (
                    <Text style={styles.priceNormal}>{formatPrice(service.price)}</Text>
                )}
            </View>
        </View>
    );
};

/**
 * Add-on Item Component
 */
const AddOnItem = ({ addon }) => (
    <View style={styles.addonItem}>
        <View style={styles.addonLeft}>
            <Text style={styles.addonName}>{addon.name}</Text>
            <Text style={styles.addonDuration}>{formatDuration(addon.duration)}</Text>
        </View>
        <Text style={styles.addonPrice}>{formatPrice(addon.price)}</Text>
        <Text style={styles.addonQuantity}>X{addon.quantity || 1}</Text>
    </View>
);

/**
 * Guest Section Component
 */
const GuestSection = ({ guest, services, lang }) => {
    const guestName = guest.id === 'me' ? t('me', lang) : `${t('guest', lang)} ${guest.name?.replace('Guest ', '')}`;
    
    // Group addons from all services
    const allAddons = services.flatMap(s => s.serviceAddons || []);
    
    return (
        <View style={styles.guestSection}>
            <Text style={styles.guestName}>{guestName}</Text>
            {services.map((service, index) => (
                <ServiceItem key={`service-${index}`} service={service} lang={lang} />
            ))}
            {allAddons.length > 0 && (
                <View style={styles.addonsContainer}>
                    <Text style={styles.addonsTitle}>{t('addOn', lang)} :</Text>
                    {allAddons.map((addon, index) => (
                        <AddOnItem key={`addon-${index}`} addon={addon} />
                    ))}
                </View>
            )}
            <View style={styles.separator} />
        </View>
    );
};

/**
 * Summary Row Component
 */
const SummaryRow = ({ label, value, isDiscount = false, isBold = false, isTotal = false }) => (
    <View style={styles.summaryRow}>
        <Text style={[
            styles.summaryLabel,
            isDiscount && styles.summaryLabelDiscount,
            isBold && styles.summaryLabelBold,
            isTotal && styles.summaryLabelTotal,
        ]}>
            {label}
        </Text>
        <Text style={[
            styles.summaryValue,
            isDiscount && styles.summaryValueDiscount,
            isBold && styles.summaryValueBold,
            isTotal && styles.summaryValueTotal,
        ]}>
            {isDiscount && value > 0 ? `- ${formatPrice(value)}` : formatPrice(value)}
        </Text>
    </View>
);

/**
 * Promo Code Item Component
 */
const PromoCodeItem = ({ promo, isSelected, isEligible, onPress, currency = 'THB' }) => {
    // Special rendering for "None" option
    if (promo.isNone) {
        return (
            <View style={styles.promoCodeItemContainer}>
                <TouchableOpacity
                    style={styles.promoCodeItem}
                    onPress={() => onPress(promo)}
                    activeOpacity={0.7}
                >
                    <View style={styles.promoCodeLeft}>
                        <Text style={styles.promoCodeText}>{promo.name}</Text>
                    </View>
                    <View style={styles.promoCodeRight}>
                        {isSelected && (
                            <View style={styles.promoCodeCheckmark}>
                                <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <Circle cx="7" cy="7" r="7" fill={primaryColor} />
                                    <Path
                                        d="M4 7L6 9L10 5"
                                        stroke="white"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </Svg>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
                <View style={styles.promoCodeSeparator} />
            </View>
        );
    }
    
    const discountText = promo.type === 1 
        ? `${promo.value}% off` 
        : `${currency}${promo.value} off`;
    
    const displayText = promo.code ? `${currency}${promo.value} off: ${promo.code}` : promo.name || discountText;
    
    return (
        <View style={styles.promoCodeItemContainer}>
            <TouchableOpacity
                style={[
                    styles.promoCodeItem,
                    !isEligible && styles.promoCodeItemDisabled,
                ]}
                onPress={() => isEligible && onPress(promo)}
                activeOpacity={isEligible ? 0.7 : 1}
                disabled={!isEligible}
            >
                <View style={styles.promoCodeLeft}>
                    <View style={styles.promoCodeTop}>
                        <TicketIcon size={20} color={isEligible ? primaryColor : '#D9D9D9'} />
                        <Text style={[
                            styles.promoCodeText,
                            !isEligible && styles.promoCodeTextDisabled,
                        ]}>
                            {displayText}
                        </Text>
                    </View>
                    <View style={styles.promoCodeBottom}>
                        <TicketIcon size={12} color={isEligible ? primaryColor : '#D9D9D9'} />
                        <Text style={[
                            styles.promoCodeUsage,
                            !isEligible && styles.promoCodeUsageDisabled,
                        ]}>
                            x1
                        </Text>
                    </View>
                    {!isEligible && promo.minOrder > 0 && (
                        <Text style={styles.promoCodeMinSpend}>
                            Min spend {currency}{promo.minOrder}
                        </Text>
                    )}
                </View>
                <View style={styles.promoCodeRight}>
                    {isSelected ? (
                        <View style={styles.promoCodeCheckmark}>
                            <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <Circle cx="7" cy="7" r="7" fill={primaryColor} />
                                <Path
                                    d="M4 7L6 9L10 5"
                                    stroke="white"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </Svg>
                        </View>
                    ) : (
                        <View style={[
                            styles.promoCodeAddButton,
                            !isEligible && styles.promoCodeAddButtonDisabled,
                        ]}>
                            <Text style={[
                                styles.promoCodeAddButtonText,
                                !isEligible && styles.promoCodeAddButtonTextDisabled,
                            ]}>
                                +
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
            <View style={styles.promoCodeSeparator} />
        </View>
    );
};

/**
 * Promo Code Modal Component
 */
const PromoCodeModal = ({ 
    visible, 
    onClose, 
    promoCodes, 
    selectedPromo, 
    onApplyPromo, 
    currency = 'THB',
    subtotal = 0,
    lang = 'en',
}) => {
    const [manualCode, setManualCode] = useState('');
    const [localSelectedPromo, setLocalSelectedPromo] = useState(selectedPromo);
    
    // Reset when modal opens
    useEffect(() => {
        if (visible) {
            setLocalSelectedPromo(selectedPromo);
            setManualCode('');
        }
    }, [visible, selectedPromo]);
    
    const eligiblePromoCodes = useMemo(() => {
        // Add "None" option at the beginning
        const noneOption = {
            id: 'none',
            code: 'none',
            name: t('none', lang),
            type: 2,
            value: 0,
            minOrder: 0,
            isEligible: true,
            isNone: true,
        };
        
        const codesWithEligibility = promoCodes.map(promo => ({
            ...promo,
            isEligible: !promo.minOrder || subtotal >= promo.minOrder,
        }));
        
        return [noneOption, ...codesWithEligibility];
    }, [promoCodes, subtotal, lang]);
    
    const handleSelectPromo = useCallback((promo) => {
        if (promo.isNone) {
            setLocalSelectedPromo(null);
        } else {
            setLocalSelectedPromo(prev => prev?.id === promo.id ? null : promo);
        }
    }, []);
    
    const handleApply = useCallback(() => {
        onApplyPromo(localSelectedPromo);
        onClose();
    }, [localSelectedPromo, onApplyPromo, onClose]);
    
    const selectedCount = localSelectedPromo ? 1 : 0;
    
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.promoModalOverlay}>
                <View style={styles.promoModalContainer}>
                    {/* Drag Indicator */}
                    <View style={styles.promoModalDragIndicator} />
                    
                    {/* Header */}
                    <View style={styles.promoModalHeader}>
                        <TouchableOpacity 
                            onPress={onClose}
                            style={styles.promoModalBackButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <ArrowBackIcon size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.promoModalTitle}>{t('discountCodes', lang)}</Text>
                        <TouchableOpacity 
                            onPress={onClose}
                            style={styles.promoModalCloseButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <CloseIcon size={20} color="#333" />
                        </TouchableOpacity>
                    </View>
                    
                    {/* Manual Code Input */}
                    <View style={styles.promoModalInputContainer}>
                        <TextInput
                            style={styles.promoModalInput}
                            placeholder={t('enterPromoCode', lang)}
                            placeholderTextColor="#747676"
                            value={manualCode}
                            onChangeText={setManualCode}
                            autoCapitalize="characters"
                        />
                    </View>
                    
                    {/* Promo Codes List */}
                    <ScrollView
                        style={styles.promoModalList}
                        contentContainerStyle={styles.promoModalListContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {eligiblePromoCodes.map((promo) => (
                            <PromoCodeItem
                                key={promo.id}
                                promo={promo}
                                isSelected={localSelectedPromo?.id === promo.id}
                                isEligible={promo.isEligible}
                                onPress={handleSelectPromo}
                                currency={currency}
                            />
                        ))}
                    </ScrollView>
                    
                    {/* Bottom Bar */}
                    <View style={styles.promoModalBottomBar}>
                        <Text style={styles.promoModalSelectedCount}>
                            {selectedCount} {selectedCount > 1 ? t('codesSelected', lang) : t('codeSelected', lang)}
                        </Text>
                        <TouchableOpacity
                            style={styles.promoModalApplyButton}
                            onPress={handleApply}
                            activeOpacity={0.9}
                        >
                            <Text style={styles.promoModalApplyButtonText}>{t('apply', lang)}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

/**
 * Confirmation Modal Component
 */
const ConfirmBookingModal = ({ visible, onClose, onConfirm, lang = 'en' }) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.confirmModalOverlay}>
                <View style={styles.confirmModalContainer}>
                    {/* Close button */}
                    <TouchableOpacity 
                        style={styles.confirmModalCloseButton}
                        onPress={onClose}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <CloseIcon size={10} color="#333" />
                    </TouchableOpacity>
                    
                    {/* Question Text */}
                    <Text style={styles.confirmModalText}>
                        {t('confirmBookingQuestion', lang)}
                    </Text>
                    
                    {/* Buttons */}
                    <View style={styles.confirmModalButtons}>
                        <TouchableOpacity
                            style={styles.confirmModalNoButton}
                            onPress={onClose}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.confirmModalNoButtonText}>{t('no', lang)}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.confirmModalYesButton}
                            onPress={onConfirm}
                            activeOpacity={0.9}
                        >
                            <Text style={styles.confirmModalYesButtonText}>{t('yes', lang)}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

/**
 * Loading Modal Component with animated dots
 */
const LoadingModal = ({ visible, lang = 'en' }) => {
    const [dots, setDots] = useState('');
    
    useEffect(() => {
        if (visible) {
            const interval = setInterval(() => {
                setDots(prev => {
                    if (prev.length >= 3) return '';
                    return prev + '.';
                });
            }, 500);
            
            return () => clearInterval(interval);
        }
    }, [visible]);
    
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
        >
            <View style={styles.loadingModalOverlay}>
                <View style={styles.loadingModalContainer}>
                    <ActivityIndicator size="large" color={primaryColor} />
                    <Text style={styles.loadingModalText}>
                        {t('confirmingBooking', lang)}
                        <Text style={{ color: primaryColor }}>{dots}</Text>
                    </Text>
                </View>
            </View>
        </Modal>
    );
};

/**
 * Country Code Picker Modal
 */
const CountryCodePickerModal = ({ visible, onClose, onSelectCountry, selectedCode }) => {
    const [searchQuery, setSearchQuery] = useState('');
    
    const filteredCountries = useMemo(() => {
        if (!searchQuery.trim()) return COUNTRY_CODES;
        const query = searchQuery.toLowerCase();
        return COUNTRY_CODES.filter(country => 
            country.country.toLowerCase().includes(query) ||
            country.code.includes(query)
        );
    }, [searchQuery]);
    
    // Reset search when modal closes
    useEffect(() => {
        if (!visible) {
            setSearchQuery('');
        }
    }, [visible]);
    
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.countryPickerModal}>
                    <View style={styles.countryPickerHeader}>
                        <Text style={styles.countryPickerTitle}>Select Country Code</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Text style={styles.countryPickerClose}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    
                    {/* Search Bar */}
                    <View style={styles.countrySearchContainer}>
                        <TextInput
                            style={styles.countrySearchInput}
                            placeholder="Search country..."
                            placeholderTextColor="#747676"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>
                    
                    <ScrollView 
                        style={styles.countryPickerList}
                        keyboardShouldPersistTaps="handled"
                    >
                        {filteredCountries.length > 0 ? (
                            filteredCountries.map((country) => (
                                <TouchableOpacity
                                    key={country.code}
                                    style={[
                                        styles.countryPickerItem,
                                        selectedCode === country.code && styles.countryPickerItemSelected,
                                    ]}
                                    onPress={() => {
                                        onSelectCountry(country.code);
                                        onClose();
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.countryPickerFlag}>{country.flag}</Text>
                                    <Text style={styles.countryPickerName}>{country.country}</Text>
                                    <Text style={styles.countryPickerCode}>{country.code}</Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.countryPickerEmpty}>
                                <Text style={styles.countryPickerEmptyText}>No countries found</Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

// ============ HELPER FUNCTIONS ============
/**
 * Remove undefined values from object recursively
 * Firestore doesn't accept undefined values
 */
const removeUndefinedValues = (obj) => {
    if (Array.isArray(obj)) {
        return obj.map(item => removeUndefinedValues(item));
    }
    if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
        return Object.entries(obj).reduce((acc, [key, value]) => {
            if (value !== undefined) {
                acc[key] = removeUndefinedValues(value);
            }
            return acc;
        }, {});
    }
    return obj;
};

// ============ MAIN COMPONENT ============

const BeautyCheckout = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const lang = setAppLang();
    const authContext = useContext(AuthContext);
    const currentUser = auth.currentUser;
    
    // Get user data from UserContext or NoUserContext
    const contextUser = useContext(authContext?.user ? UserContext : NoUserContext);
    const userFirestore = contextUser?.user; // { docId, docData }
    
    // Console log user info
    useEffect(() => {
        console.log('[BeautyCheckout] Auth user:', {
            uid: currentUser?.uid,
            email: currentUser?.email,
        });
        console.log('[BeautyCheckout] Firestore user:', {
            docId: userFirestore?.docId,
            firstName: userFirestore?.docData?.firstName,
            lastName: userFirestore?.docData?.lastName,
            phone: userFirestore?.docData?.phone,
            phoneNumberCountry: userFirestore?.docData?.phoneNumberCountry,
            user_lang: userFirestore?.docData?.user_lang,
            marketingConsent: userFirestore?.docData?.marketingConsent,
            termsAccepted: userFirestore?.docData?.termsAccepted,
        });
    }, [currentUser, userFirestore]);
    
    // Route params
    const shopId = route?.params?.shopId;
    const shopData = route?.params?.shopData || {};
    const settingCalendar = route?.params?.settingCalendar || shopData?.settingCalendar || {};
    const guests = route?.params?.guests || [];
    const team = route?.params?.team || [];
    const selectedDate = route?.params?.selectedDate || new Date();
    const selectedTime = route?.params?.selectedTime || '';
    
    // Format selectedDate as DD/MM/YYYY string for display and booking
    const formattedDate = useMemo(() => {
        const date = typeof selectedDate === 'string' ? new Date(selectedDate) : selectedDate;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }, [selectedDate]);
    
    // Form state - Initialize from Firestore user data
    const [firstName, setFirstName] = useState(userFirestore?.docData?.firstName || '');
    const [lastName, setLastName] = useState(userFirestore?.docData?.lastName || '');
    const [countryCode, setCountryCode] = useState(userFirestore?.docData?.phoneNumberCountry || '+66');
    const [phoneNumber, setPhoneNumber] = useState(userFirestore?.docData?.phone || '');
    const [bookingNotes, setBookingNotes] = useState('');
    const [promoCode, setPromoCode] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('pay_at_venue');
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [agreeMarketing, setAgreeMarketing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [countryPickerVisible, setCountryPickerVisible] = useState(false);
    const [promoModalVisible, setPromoModalVisible] = useState(false);
    const [promoCodes, setPromoCodes] = useState([]);
    const [loadingPromoCodes, setLoadingPromoCodes] = useState(false);
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const [loadingModalVisible, setLoadingModalVisible] = useState(false);
    
    // Update form when Firestore user data loads
    useEffect(() => {
        if (userFirestore?.docData) {
            if (userFirestore.docData.firstName && !firstName) {
                setFirstName(userFirestore.docData.firstName);
            }
            if (userFirestore.docData.lastName && !lastName) {
                setLastName(userFirestore.docData.lastName);
            }
            if (userFirestore.docData.phone && !phoneNumber) {
                setPhoneNumber(userFirestore.docData.phone);
            }
            if (userFirestore.docData.phoneNumberCountry && countryCode === '+66') {
                setCountryCode(userFirestore.docData.phoneNumberCountry);
            }
        }
    }, [userFirestore?.docData]);
    
    // Check if personal info is already complete
    const hasPersonalInfo = useMemo(() => {
        return !!(firstName?.trim() && lastName?.trim() && phoneNumber?.trim());
    }, [firstName, lastName, phoneNumber]);
    
    // Deposit settings
    const depositPercentage = settingCalendar?.deposit_percentage || 0;
    const hasDeposit = depositPercentage > 0;
    
    // Calculate cart from guests
    const cart = useMemo(() => {
        return guests.flatMap(guest => guest.services || []);
    }, [guests]);
    
    // Calculate totals
    const calculations = useMemo(() => {
        let subtotal = 0;
        let serviceDiscount = 0;
        
        cart.forEach(service => {
            const price = service.price || 0;
            const promoPrice = service.promotionPrice || price;
            subtotal += price;
            if (promoPrice < price) {
                serviceDiscount += (price - promoPrice);
            }
            
            // Add addons
            (service.serviceAddons || []).forEach(addon => {
                subtotal += (addon.price || 0) * (addon.quantity || 1);
            });
        });
        
        // Calculate promo discount based on type
        const promoDiscount = promoCode 
            ? (promoCode.type === 1 
                ? Math.round(subtotal * promoCode.value / 100) 
                : promoCode.value)
            : 0;
        
        const depositDiscount = 0; // Could be calculated based on promo
        const total = subtotal - serviceDiscount - promoDiscount - depositDiscount;
        const payNowAmount = hasDeposit ? Math.round(total * depositPercentage / 100) : 0;
        const payAtVenueAmount = hasDeposit ? total - payNowAmount : total;
        const savings = serviceDiscount + promoDiscount + depositDiscount;
        
        return {
            subtotal,
            serviceDiscount,
            promoDiscount,
            depositDiscount,
            total,
            payNowAmount,
            payAtVenueAmount,
            savings,
        };
    }, [cart, promoCode, hasDeposit, depositPercentage]);
    
    // Calculate total duration
    const totalDuration = useMemo(() => {
        return cart.reduce((sum, s) => sum + (s.duration || 0), 0);
    }, [cart]);
    
    // Format time range
    const timeRange = useMemo(() => {
        if (!selectedTime) return '';
        const startMinutes = parseInt(selectedTime.split(':')[0]) * 60 + parseInt(selectedTime.split(':')[1]);
        const endMinutes = startMinutes + totalDuration;
        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;
        const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
        return `${selectedTime}-${endTime}`;
    }, [selectedTime, totalDuration]);
    
    // Fetch promo codes
    const fetchPromoCodes = useCallback(async () => {
        if (!shopId) return;
        
        setLoadingPromoCodes(true);
        try {
            const promoCodesRef = collection(firestore, "PromoCodes");
            const q = query(
                promoCodesRef,
                where("shopId", "==", shopId),
                where("status", "==", 1) // ACTIVE status
            );
            
            const snapshot = await getDocs(q);
            
            const promoCodesData = snapshot.docs.map(docSnap => {
                const data = docSnap.data();
                return {
                    code: data.code || "",
                    type: data.discountType || 1, // 1 = percentage, 2 = fixed
                    value: data.discountValue || 0,
                    minOrder: data.minOrderValue || 0,
                    id: docSnap.id,
                    name: data.name || "",
                };
            });
            
            console.log('[BeautyCheckout] Promo codes fetched:', promoCodesData.length);
            setPromoCodes(promoCodesData);
        } catch (error) {
            console.error('[BeautyCheckout] Error fetching promo codes:', error);
        } finally {
            setLoadingPromoCodes(false);
        }
    }, [shopId]);
    
    // Fetch promo codes on mount
    useEffect(() => {
        if (shopId) {
            fetchPromoCodes();
        }
    }, [fetchPromoCodes, shopId]);
    
    // Handlers
    const onPressBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);
    
    const onSelectPromoCode = useCallback(() => {
        setPromoModalVisible(true);
    }, []);
    
    const onApplyPromoCode = useCallback((promo) => {
        setPromoCode(promo);
        console.log('[BeautyCheckout] Promo code applied:', promo);
    }, []);
    
    const onPressCountryCode = useCallback(() => {
        setCountryPickerVisible(true);
    }, []);
    
    const onSelectCountryCode = useCallback((code) => {
        setCountryCode(code);
        console.log('[BeautyCheckout] Selected country code:', code);
    }, []);
    
    const onPressConfirm = useCallback(() => {
        if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim()) {
            // TODO: Show validation error
            console.log('[BeautyCheckout] Missing required fields');
            return;
        }
        
        if (!agreeTerms) {
            // TODO: Show validation error
            console.log('[BeautyCheckout] Terms not accepted');
            return;
        }
        
        setConfirmModalVisible(true);
    }, [firstName, lastName, phoneNumber, agreeTerms]);
    
    const getLastBookingNumber = useCallback(async (shopId) => {
        try {
            const bookingsRef = collection(firestore, `Shops/${shopId}/Booking`);
            const q = query(bookingsRef, orderBy('booking_number', 'desc'), limit(1));
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) return 0;
            return snapshot.docs[0].data().booking_number || 0;
        } catch (error) {
            console.error('[BeautyCheckout] Error getting last booking number:', error);
            return 0;
        }
    }, []);
    
    const getTotalClients = useCallback(async (shopId) => {
        try {
            const registeredShopsRef = collection(firestore, 'Clients');
            const q = query(registeredShopsRef);
            const snapshot = await getDocs(q);
            
            let total = 0;
            for (const clientDoc of snapshot.docs) {
                const shopRef = doc(firestore, `Clients/${clientDoc.id}/RegisteredShops/${shopId}`);
                const shopSnap = await getDoc(shopRef);
                // In React Native Firebase, exists is a property, not a function
                if (shopSnap.exists) total++;
            }
            return total;
        } catch (error) {
            console.error('[BeautyCheckout] Error getting total clients:', error);
            return 0;
        }
    }, []);
    
    const registerClientInShop = useCallback(async (userId, shopId, userDetails, userEmail) => {
        try {
            const registeredShopRef = doc(firestore, `Clients/${userId}/RegisteredShops/${shopId}`);
            const registeredShopSnap = await getDoc(registeredShopRef);
            
            // In React Native Firebase, exists is a property, not a function
            if (!registeredShopSnap.exists) {
                const totalClients = await getTotalClients(shopId);
                
                await setDoc(registeredShopRef, {
                    createAt: new Date(),
                    lastVisit: new Date(),
                    shopId,
                    clientId: userId,
                    points: 0,
                    nbVisit: 1,
                    user_img: userDetails?.user_img || "",
                    user_img_Valid: userDetails?.user_img_Valid || false,
                    firstName: userDetails?.firstName || "",
                    lastName: userDetails?.lastName || "",
                    gender: userDetails?.gender || 0,
                    phone: userDetails?.phone || "",
                    phoneNumberCountry: userDetails?.phoneNumberCountry || "",
                    postalCode: userDetails?.postalCode || "",
                    address: userDetails?.address || "",
                    email: userEmail,
                    birthday: userDetails?.birthday || new Date("1950-01-28"),
                    clientNum: totalClients + 1,
                    notificationsActive: true,
                    from: "https://seeuapp.io/",
                });
                
                console.log('[BeautyCheckout] Client registered in shop');
            } else {
                console.log('[BeautyCheckout] Client already registered in shop');
            }
        } catch (error) {
            console.error('[BeautyCheckout] Error registering client in shop:', error);
        }
    }, [getTotalClients]);
    
    const sendBookingEmails = useCallback(async (bookingData, shopData, isConfirmed) => {
        try {
            const emailData = {
                userFirstName: bookingData.firstName,
                userLastName: bookingData.lastName,
                userEmail: bookingData.clientEmail,
                userLang: lang,
                userPhone: `${bookingData.clientPhoneCountry}${bookingData.clientPhone}`,
                shopName: shopData.shopName,
                shopEmail: shopData.email,
                shopAddress: shopData.address,
                shopCurrency: shopData.currency?.text || 'THB',
                shopBookingId: shopData.booking_id,
                booking_date: `${bookingData.dateBooking} ${bookingData.timeStart}`,
                booking_number: bookingData.booking_number,
                booking_category: 'beauty',
                servicesDetails: bookingData.services,
                subTotalPrice: bookingData.subTotalPrice,
                subTotalPromo: bookingData.subTotalPromo,
                promoCode: bookingData.promoCode || '',
                promoAmount: bookingData.promoAmount || 0,
                totalPrice: bookingData.totalPrice,
                depositAmount: bookingData.depositAmount || null,
                depositDiscountAmount: bookingData.depositDiscountAmount || 0,
            };
            
            console.log('[BeautyCheckout] Sending booking emails with data:', emailData);
            
            // Client email (region: asia-southeast1)
            const clientEmailFunction = isConfirmed 
                ? 'client_booking_comfirm_email' 
                : 'client_booking_pending_email';
            
            console.log(`[BeautyCheckout] Calling client function: ${clientEmailFunction}`);
            const clientEmailCallable = onHttpsCallableAsiaSoutheast(clientEmailFunction);
            await clientEmailCallable(emailData);
            
            // Shop email (region: asia-southeast1)
            const shopEmailFunction = isConfirmed 
                ? 'shop_booking_confirm_email' 
                : 'shop_booking_pending_email';
            
            console.log(`[BeautyCheckout] Calling shop function: ${shopEmailFunction}`);
            const shopEmailCallable = onHttpsCallableAsiaSoutheast(shopEmailFunction);
            await shopEmailCallable(emailData);
            
            console.log('[BeautyCheckout] Booking emails sent successfully');
        } catch (error) {
            console.error('[BeautyCheckout] Error sending booking emails:', error);
            // Don't throw - email failures shouldn't block booking creation
        }
    }, [lang]);
    
    const onConfirmBooking = useCallback(async () => {
        setConfirmModalVisible(false);
        setLoadingModalVisible(true);
        
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');
            
            // Get last booking number
            const lastBookingNumber = await getLastBookingNumber(shopId);
            const bookingNumber = lastBookingNumber + 1;
            
            // Determine status: 2 if autoConfirmed, 1 if pending
            const isAutoConfirmed = shopData?.settingCalendar?.autoConfirmed || false;
            const bookingStatus = isAutoConfirmed ? 2 : 1;
            
            // Prepare services with complete member info - remove undefined values
            const servicesWithCompletedMember = cart.map(service => {
                const serviceData = {
                    id: service.id || "",
                    guestId: service.guestId || 'me',
                    guestName: guests.find(g => g.id === service.guestId)?.name || 'Me',
                    serviceId: service.id || "",
                    serviceName: service.name || "",
                    duration: service.duration || 0,
                    price: service.price || 0,
                    priceUsed: service.promotionPrice || service.price || 0,
                    memberName: team.find(m => m.id === service.teamMemberId)?.name || 'Any professional',
                    addons: service.selectedAddons || [],
                    color: service.color || '#6857E5',
                    loyaltyPoint: service.loyaltyPoint || 0,
                    dateBooking: formattedDate,
                    timeStart: selectedTime || "",
                    timeEnd: service.timeEnd || selectedTime || "",
                };
                
                // Only add optional fields if they have values
                if (service.promotionPrice) {
                    serviceData.promotionPrice = service.promotionPrice;
                }
                if (service.teamMemberId) {
                    serviceData.memberId = service.teamMemberId;
                }
                if (service.selectedOption) {
                    serviceData.option = service.selectedOption;
                }
                
                return serviceData;
            });
            
            // Get unique team members - only include if they have valid IDs
            const uniqueTeamMembers = Array.from(
                new Map(
                    servicesWithCompletedMember
                        .filter(s => s.memberId)
                        .map(s => [s.memberId, { id: s.memberId || "", name: s.memberName || "" }])
                ).values()
            );
            
            // Calculate booking date in UTC
            const [day, month, year] = formattedDate.split('/');
            const [hours, minutes] = selectedTime.split(':');
            const bookingDateUTC = new Date(Date.UTC(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day),
                parseInt(hours),
                parseInt(minutes)
            ));
            
            // Create booking document - remove undefined values
            const bookingData = {
                id: "",
                clientId: user.uid || "",
                clientEmail: user.email || '',
                clientPhone: phoneNumber || "",
                clientPhoneCountry: countryCode || "+66",
                firstName: firstName || "",
                lastName: lastName || "",
                createdAt: new Date(),
                date: bookingDateUTC,
                dateBooking: formattedDate,
                timeStart: selectedTime || "",
                timeEnd: timeRange.split('-')[1]?.trim() || selectedTime || "",
                duration: totalDuration || 0,
                statut: bookingStatus,
                services: servicesWithCompletedMember,
                teamMemberId: uniqueTeamMembers,
                booking_id: shopData?.booking_id || "",
                paymentMethods: paymentMethod || "pay_at_venue",
                discountCode: promoCode?.code || "",
                promoAmount: calculations.promoDiscount || 0,
                bookingNotes: bookingNotes || "",
                from: "https://seeuapp.io/",
                booking_number: bookingNumber,
                booking_category: 'beauty',
                subTotalPrice: calculations.subtotal || 0,
                subTotalPromo: calculations.discount || 0,
                totalPrice: calculations.total || 0,
                booking_url: `/beauty/${shopData?.booking_id || ""}/time`,
            };
            
            // Add promo details if present
            if (promoCode) {
                bookingData.promoCodeId = promoCode.id || "";
                bookingData.promoCode = promoCode.code || "";
                bookingData.promoDiscountType = promoCode.type || 1;
                bookingData.promoDiscountValue = promoCode.value || 0;
            }
            
            // Clean booking data - remove all undefined values
            const cleanedBookingData = removeUndefinedValues(bookingData);
            
            console.log('[BeautyCheckout] Creating booking with data:', cleanedBookingData);
            
            // Save booking to Firestore
            const bookingsRef = collection(firestore, `Shops/${shopId}/Booking`);
            const docRef = await addDoc(bookingsRef, cleanedBookingData);
            
            // Update with document ID
            await updateDoc(doc(firestore, `Shops/${shopId}/Booking/${docRef.id}`), {
                id: docRef.id,
            });
            
            console.log('[BeautyCheckout] Booking created:', docRef.id);
            
            // Register client in shop
            await registerClientInShop(user.uid, shopId, userFirestore?.docData, user.email);
            
            // Send booking emails
            await sendBookingEmails({ ...bookingData, id: docRef.id }, shopData, isAutoConfirmed);
            
            setLoadingModalVisible(false);
            
            // Navigate to success page
            navigation.navigate('BeautyBookingSuccess', {
                shopId,
                shopData,
                selectedDate: formattedDate,
                selectedTime,
                bookingNumber,
            });
        } catch (error) {
            console.error('[BeautyCheckout] Error creating booking:', error);
            setLoadingModalVisible(false);
            // TODO: Show error message to user
            alert('Error creating booking. Please try again.');
        }
    }, [
        shopId,
        shopData,
        formattedDate,
        selectedTime,
        navigation,
        cart,
        guests,
        team,
        firstName,
        lastName,
        phoneNumber,
        countryCode,
        bookingNotes,
        paymentMethod,
        promoCode,
        calculations,
        totalDuration,
        timeRange,
        getLastBookingNumber,
        registerClientInShop,
        sendBookingEmails,
        userFirestore,
        lang,
    ]);
    
    // Group services by guest for display
    const guestSections = useMemo(() => {
        return guests.map(guest => ({
            guest,
            services: guest.services || [],
        })).filter(g => g.services.length > 0);
    }, [guests]);
    
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
                    <Text style={styles.headerTitle}>{t('confirm', lang)}</Text>
                    <View style={styles.headerSpacer} />
                </View>
            </SafeAreaView>
            
            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Date & Time Info */}
                    <View style={styles.dateTimeSection}>
                        <View style={styles.dateTimeRow}>
                            <CalendarIcon size={15} color="#333" />
                            <Text style={styles.dateTimeText}>{formatDate(selectedDate, lang)}</Text>
                        </View>
                        <View style={styles.dateTimeRow}>
                            <ClockIcon size={15} color="#333" />
                            <Text style={styles.dateTimeText}>
                                {timeRange} ({formatDuration(totalDuration)} duration)
                            </Text>
                        </View>
                    </View>
                    
                    {/* Personal Information - Only show if info is missing */}
                    {!hasPersonalInfo && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{t('personalInfo', lang)}</Text>
                            <View style={styles.inputsContainer}>
                                <InputField
                                    placeholder={t('firstName', lang)}
                                    value={firstName}
                                    onChangeText={setFirstName}
                                />
                                <InputField
                                    placeholder={t('lastName', lang)}
                                    value={lastName}
                                    onChangeText={setLastName}
                                />
                                <PhoneInput
                                    countryCode={countryCode}
                                    phoneNumber={phoneNumber}
                                    onChangeCountryCode={setCountryCode}
                                    onChangePhoneNumber={setPhoneNumber}
                                    placeholder={t('mobileNumber', lang)}
                                    onPressCountryCode={onPressCountryCode}
                                />
                            </View>
                        </View>
                    )}
                    
                    {/* Discount Codes */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('discountCodes', lang)}</Text>
                        <TouchableOpacity 
                            style={styles.promoCodeButton}
                            onPress={onSelectPromoCode}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.promoCodeText}>
                                {promoCode ? promoCode.code : t('selectPromoCode', lang)}
                            </Text>
                            <ChevronRightIcon size={12} color="#747676" />
                        </TouchableOpacity>
                    </View>
                    
                    {/* Payment Method */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('paymentMethod', lang)}</Text>
                        <PaymentOption
                            selected={paymentMethod === 'pay_at_venue'}
                            title={t('payAtVenue', lang)}
                            subtitle={t('payWhenArrive', lang)}
                            onPress={() => setPaymentMethod('pay_at_venue')}
                        />
                        {hasDeposit && (
                            <PaymentOption
                                selected={paymentMethod === 'pay_now'}
                                title={`${t('payNow', lang)} ${depositPercentage}%`}
                                subtitle={t('onlyToGuarantee', lang).replace('{percent}', depositPercentage)}
                                onPress={() => setPaymentMethod('pay_now')}
                            />
                        )}
                    </View>
                    
                    {/* Booking Notes */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('bookingNotes', lang)}</Text>
                        <InputField
                            placeholder={t('notesPlaceholder', lang)}
                            value={bookingNotes}
                            onChangeText={setBookingNotes}
                            multiline
                            numberOfLines={4}
                        />
                    </View>
                    
                    {/* Note */}
                    <View style={styles.noteContainer}>
                        <Text style={styles.noteText}>
                            <Text style={styles.noteBold}>{t('note', lang)} : </Text>
                            {t('noteText', lang)}
                        </Text>
                    </View>
                    
                    {/* Services Summary */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('servicesSummary', lang)}</Text>
                        {guestSections.map((section, index) => (
                            <GuestSection
                                key={`guest-${index}`}
                                guest={section.guest}
                                services={section.services}
                                lang={lang}
                            />
                        ))}
                        
                        {/* Totals */}
                        <View style={styles.totalsContainer}>
                            <SummaryRow label={t('subtotal', lang)} value={calculations.subtotal} />
                            {calculations.serviceDiscount > 0 && (
                                <SummaryRow 
                                    label={t('discountsOnServices', lang)} 
                                    value={calculations.serviceDiscount} 
                                    isDiscount 
                                />
                            )}
                            {calculations.depositDiscount > 0 && (
                                <SummaryRow 
                                    label={t('discountsOnDeposit', lang)} 
                                    value={calculations.depositDiscount} 
                                    isDiscount 
                                />
                            )}
                            {promoCode && (
                                <SummaryRow 
                                    label={`${t('promoCode', lang)} : ${promoCode.code}`} 
                                    value={calculations.promoDiscount} 
                                    isDiscount 
                                />
                            )}
                        </View>
                        
                        <View style={styles.separator} />
                        
                        {/* Final Totals */}
                        <View style={styles.finalTotalsContainer}>
                            <SummaryRow label={t('total', lang)} value={calculations.total} isBold isTotal />
                            {hasDeposit && paymentMethod === 'pay_now' && (
                                <>
                                    <View style={styles.payNowRow}>
                                        <Text style={styles.payNowLabel}>{`${t('payNow', lang)} ${depositPercentage}%`}</Text>
                                        <Text style={styles.payNowValue}>{formatPrice(calculations.payNowAmount)}</Text>
                                    </View>
                                    <SummaryRow label={t('payAtVenue', lang)} value={calculations.payAtVenueAmount} />
                                </>
                            )}
                        </View>
                        
                        <View style={styles.separator} />
                    </View>
                    
                    {/* Terms & Marketing Checkboxes */}
                    <View style={styles.checkboxesContainer}>
                        <TouchableOpacity 
                            style={styles.checkboxRow}
                            onPress={() => setAgreeTerms(!agreeTerms)}
                            activeOpacity={0.7}
                        >
                            <CheckboxIcon checked={agreeTerms} />
                            <Text style={styles.checkboxText}>
                                {t('agreeToTerms', lang)}{' '}
                                <Text style={styles.linkText}>{t('privacyPolicy', lang)}</Text>,{' '}
                                <Text style={styles.linkText}>{t('termsOfUse', lang)}</Text>{' '}
                                {t('and', lang)}{' '}
                                <Text style={styles.linkText}>{t('termsOfService', lang)}</Text>
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.checkboxRow}
                            onPress={() => setAgreeMarketing(!agreeMarketing)}
                            activeOpacity={0.7}
                        >
                            <CheckboxIcon checked={agreeMarketing} />
                            <Text style={styles.checkboxText}>
                                {t('agreeMarketing', lang)}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    
                    {/* Savings Message */}
                    {calculations.savings > 0 && (
                        <View style={styles.savingsContainer}>
                            <View style={styles.savingsSeparator} />
                            <Text style={styles.savingsText}>
                                {t('youllSave', lang)}{' '}
                                <Text style={styles.savingsAmount}>{formatPrice(calculations.savings)}</Text>
                                {' '}{t('afterDiscount', lang)}
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
            
            {/* Bottom Bar */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
                <TouchableOpacity
                    style={[
                        styles.confirmButton,
                        (!agreeTerms || isLoading) && styles.confirmButtonDisabled,
                    ]}
                    onPress={onPressConfirm}
                    activeOpacity={0.9}
                    disabled={!agreeTerms || isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text style={styles.confirmButtonText}>{t('confirm', lang)}</Text>
                    )}
                </TouchableOpacity>
            </View>
            
            {/* Promo Code Modal */}
            <PromoCodeModal
                visible={promoModalVisible}
                onClose={() => setPromoModalVisible(false)}
                promoCodes={promoCodes}
                selectedPromo={promoCode}
                onApplyPromo={onApplyPromoCode}
                currency="THB"
                subtotal={calculations.subtotal}
                lang={lang}
            />
            
            {/* Country Code Picker Modal */}
            <CountryCodePickerModal
                visible={countryPickerVisible}
                onClose={() => setCountryPickerVisible(false)}
                onSelectCountry={onSelectCountryCode}
                selectedCode={countryCode}
            />
            
            {/* Confirm Booking Modal */}
            <ConfirmBookingModal
                visible={confirmModalVisible}
                onClose={() => setConfirmModalVisible(false)}
                onConfirm={onConfirmBooking}
                lang={lang}
            />
            
            {/* Loading Modal */}
            <LoadingModal
                visible={loadingModalVisible}
                lang={lang}
            />
        </View>
    );
};

// ============ STYLES ============

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        backgroundColor: '#FFFFFF',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 50,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000000',
    },
    headerSpacer: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 20,
    },
    
    // Date & Time
    dateTimeSection: {
        marginBottom: 20,
    },
    dateTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 6,
    },
    dateTimeText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000000',
    },
    
    // Section
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 12,
    },
    
    // Inputs
    inputsContainer: {
        gap: 14,
    },
    inputContainer: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D9D9D9',
        borderRadius: 20,
        height: 55,
        paddingHorizontal: 20,
        justifyContent: 'center',
    },
    inputMultiline: {
        height: 100,
        paddingVertical: 15,
        justifyContent: 'flex-start',
    },
    input: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000000',
    },
    inputTextMultiline: {
        textAlignVertical: 'top',
        height: '100%',
    },
    
    // Phone Input
    phoneInputRow: {
        flexDirection: 'row',
        gap: 10,
    },
    countryCodeContainer: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D9D9D9',
        borderRadius: 20,
        height: 55,
        width: 100,
        paddingHorizontal: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    flagText: {
        fontSize: 20,
    },
    countryCodeText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000000',
        marginLeft: 4,
    },
    phoneNumberContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D9D9D9',
        borderRadius: 20,
        height: 55,
        paddingHorizontal: 14,
        justifyContent: 'center',
    },
    phoneNumberInput: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000000',
    },
    
    // Promo Code
    promoCodeButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D9D9D9',
        borderRadius: 20,
        height: 55,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    promoCodeText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#747676',
    },
    
    // Payment Option
    paymentOption: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D9D9D9',
        borderRadius: 20,
        height: 55,
        paddingHorizontal: 20,
        justifyContent: 'center',
        marginBottom: 12,
    },
    paymentOptionSelected: {
        borderColor: primaryColor,
    },
    paymentOptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    paymentOptionText: {
        gap: 4,
    },
    paymentOptionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000000',
    },
    paymentOptionSubtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#747676',
    },
    
    // Note
    noteContainer: {
        marginBottom: 20,
    },
    noteText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#747676',
        lineHeight: 20,
    },
    noteBold: {
        fontWeight: '600',
    },
    
    // Guest Section
    guestSection: {
        marginBottom: 10,
    },
    guestName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 10,
    },
    
    // Service Item
    serviceItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    serviceItemLeft: {
        flex: 1,
        marginRight: 10,
    },
    serviceNameRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 4,
    },
    serviceName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000000',
        flex: 1,
    },
    serviceOption: {
        fontSize: 12,
        fontWeight: '500',
        color: '#000000',
        marginLeft: 9,
        marginTop: 4,
    },
    serviceMemberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
    },
    serviceDuration: {
        fontSize: 12,
        fontWeight: '500',
        color: '#000000',
    },
    serviceWith: {
        fontSize: 12,
        fontWeight: '500',
        color: '#000000',
    },
    memberBadge: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#747676',
        borderRadius: 26,
        paddingHorizontal: 14,
        paddingVertical: 4,
    },
    memberBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#000000',
    },
    serviceItemRight: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    priceOriginal: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000000',
        textDecorationLine: 'line-through',
    },
    pricePromo: {
        fontSize: 14,
        fontWeight: '600',
        color: '#E60000',
        marginTop: 4,
    },
    priceNormal: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000000',
    },
    
    // Addons
    addonsContainer: {
        marginTop: 10,
        marginBottom: 10,
    },
    addonsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#777978',
        marginBottom: 10,
    },
    addonItem: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    addonLeft: {
        flex: 1,
    },
    addonName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000000',
    },
    addonDuration: {
        fontSize: 12,
        fontWeight: '500',
        color: '#000000',
        marginTop: 5,
    },
    addonPrice: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000000',
        marginHorizontal: 20,
    },
    addonQuantity: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000000',
    },
    
    // Separator
    separator: {
        height: 1,
        backgroundColor: '#E5E5E5',
        marginVertical: 10,
    },
    
    // Totals
    totalsContainer: {
        gap: 5,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#000000',
    },
    summaryLabelDiscount: {
        color: primaryColor,
    },
    summaryLabelBold: {
        fontWeight: '600',
        fontSize: 14,
    },
    summaryLabelTotal: {
        fontSize: 14,
    },
    summaryValue: {
        fontSize: 12,
        fontWeight: '500',
        color: '#000000',
    },
    summaryValueDiscount: {
        color: primaryColor,
    },
    summaryValueBold: {
        fontWeight: '600',
        fontSize: 14,
    },
    summaryValueTotal: {
        fontSize: 14,
    },
    
    // Final Totals
    finalTotalsContainer: {
        gap: 8,
    },
    payNowRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    payNowLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: primaryColor,
    },
    payNowValue: {
        fontSize: 14,
        fontWeight: '600',
        color: primaryColor,
    },
    
    // Checkboxes
    checkboxesContainer: {
        gap: 10,
        marginBottom: 20,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    checkboxText: {
        fontSize: 10.6,
        fontWeight: '500',
        color: '#000000',
        flex: 1,
    },
    linkText: {
        color: primaryColor,
    },
    
    // Savings
    savingsContainer: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    savingsSeparator: {
        height: 1,
        backgroundColor: '#E5E5E5',
        width: '100%',
        marginBottom: 15,
    },
    savingsText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000000',
        textAlign: 'center',
    },
    savingsAmount: {
        fontWeight: '600',
        color: primaryColor,
    },
    
    // Bottom Bar
    bottomBar: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 27,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    confirmButton: {
        backgroundColor: primaryColor,
        borderRadius: 20,
        height: 55,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        opacity: 0.5,
    },
    confirmButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    
    // Promo Code Modal
    promoModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        justifyContent: 'flex-end',
    },
    promoModalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        height: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 8.72,
        elevation: 8,
    },
    promoModalDragIndicator: {
        width: 40,
        height: 4,
        backgroundColor: '#D9D9D9',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 12,
    },
    promoModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    promoModalBackButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    promoModalTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000000',
    },
    promoModalCloseButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    promoModalInputContainer: {
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    promoModalInput: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D9D9D9',
        borderRadius: 17,
        height: 48,
        paddingHorizontal: 18,
        fontSize: 12,
        color: '#000000',
    },
    promoModalList: {
        flex: 1,
    },
    promoModalListContent: {
        paddingHorizontal: 24,
        paddingTop: 17,
        paddingBottom: 20,
    },
    
    // Promo Code Item
    promoCodeItemContainer: {
        marginBottom: 17,
    },
    promoCodeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
    },
    promoCodeItemDisabled: {
        opacity: 0.4,
    },
    promoCodeLeft: {
        flex: 1,
        gap: 13,
    },
    promoCodeTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },
    promoCodeText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000000',
    },
    promoCodeTextDisabled: {
        color: '#D9D9D9',
    },
    promoCodeBottom: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },
    promoCodeUsage: {
        fontSize: 12,
        fontWeight: '500',
        color: primaryColor,
    },
    promoCodeUsageDisabled: {
        color: '#D9D9D9',
    },
    promoCodeMinSpend: {
        fontSize: 10.5,
        fontWeight: '500',
        color: '#D9D9D9',
        marginTop: 2,
    },
    promoCodeRight: {
        marginLeft: 10,
    },
    promoCodeCheckmark: {
        width: 26,
        height: 26,
        justifyContent: 'center',
        alignItems: 'center',
    },
    promoCodeAddButton: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: primaryColor,
        justifyContent: 'center',
        alignItems: 'center',
    },
    promoCodeAddButtonDisabled: {
        borderColor: '#D9D9D9',
    },
    promoCodeAddButtonText: {
        fontSize: 19,
        fontWeight: '600',
        color: primaryColor,
        marginTop: -2,
    },
    promoCodeAddButtonTextDisabled: {
        color: '#D9D9D9',
    },
    promoCodeSeparator: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginTop: 10,
    },
    
    // Promo Modal Bottom Bar
    promoModalBottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: '#D9D9D9',
    },
    promoModalSelectedCount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000000',
    },
    promoModalApplyButton: {
        backgroundColor: primaryColor,
        borderRadius: 17,
        height: 48,
        width: 87,
        justifyContent: 'center',
        alignItems: 'center',
    },
    promoModalApplyButtonDisabled: {
        opacity: 0.5,
    },
    promoModalApplyButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    
    // Confirm Booking Modal
    confirmModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    confirmModalContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 17,
        padding: 26,
        width: '100%',
        maxWidth: 350,
        position: 'relative',
    },
    confirmModalCloseButton: {
        position: 'absolute',
        top: 26,
        right: 26,
        zIndex: 10,
    },
    confirmModalText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 20,
        paddingRight: 20,
    },
    confirmModalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
    },
    confirmModalNoButton: {
        flex: 1,
        height: 40,
        backgroundColor: '#F5F5F5',
        borderWidth: 1.5,
        borderColor: primaryColor,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmModalNoButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: primaryColor,
    },
    confirmModalYesButton: {
        flex: 1,
        height: 40,
        backgroundColor: primaryColor,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmModalYesButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    
    // Loading Modal
    loadingModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingModalContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 17,
        padding: 30,
        alignItems: 'center',
        gap: 16,
        minWidth: 200,
    },
    loadingModalText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333333',
        textAlign: 'center',
    },
    
    // Country Code Picker Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    countryPickerModal: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '70%',
        overflow: 'hidden',
    },
    countryPickerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    countryPickerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000000',
    },
    countryPickerClose: {
        fontSize: 24,
        color: '#747676',
    },
    countrySearchContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    countrySearchInput: {
        backgroundColor: '#F5F5F5',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 10,
        fontSize: 16,
        color: '#000000',
    },
    countryPickerList: {
        flex: 1,
    },
    countryPickerEmpty: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    countryPickerEmptyText: {
        fontSize: 16,
        color: '#747676',
        textAlign: 'center',
    },
    countryPickerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    countryPickerItemSelected: {
        backgroundColor: '#F5F0FF',
    },
    countryPickerFlag: {
        fontSize: 24,
        marginRight: 12,
    },
    countryPickerName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: '#000000',
    },
    countryPickerCode: {
        fontSize: 16,
        fontWeight: '500',
        color: '#747676',
    },
});

export default BeautyCheckout;

