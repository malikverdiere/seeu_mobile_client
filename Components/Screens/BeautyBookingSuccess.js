/**
 * BeautyBookingSuccess.js - Page de confirmation de réservation réussie
 * 
 * Cette page affiche la confirmation du booking avec options pour :
 * - Ajouter au calendrier
 * - Gérer le rendez-vous
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Dimensions,
} from 'react-native';
import Svg, { Path, Circle, G, Rect, Ellipse } from 'react-native-svg';
import { primaryColor, goToScreen } from '../AGTools';

// ============ CONSTANTS ============
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ============ TRANSLATIONS ============
const t = (key, lang) => translations[key]?.[lang] || translations[key]?.en || key;

const translations = {
    appointmentConfirmed: { 
        en: "Your appointment has\nbeen confirmed!", 
        fr: "Votre rendez-vous a\nété confirmé !", 
        th: "การนัดหมายของคุณได้รับการยืนยันแล้ว!" 
    },
    addToCalendar: { en: "Add to calendar", fr: "Ajouter au calendrier", th: "เพิ่มในปฏิทิน" },
    setReminder: { en: "Set yourself a reminder", fr: "Définir un rappel", th: "ตั้งเตือนตนเอง" },
    manageAppointment: { en: "Manage Appointment", fr: "Gérer le rendez-vous", th: "จัดการการนัดหมาย" },
    rescheduleOrCancel: { en: "Re-schedule or cancel", fr: "Reporter ou annuler", th: "เลื่อนหรือยกเลิก" },
};

// ============ HAPPY FACE ICON ============
const HappyFaceIcon = () => (
    <Svg width="182" height="133" viewBox="0 0 182 133" fill="none">
        {/* Ears */}
        <Path
            d="M135.2 66.4C135.2 72.8 130.6 78 125 78C119.4 78 114.8 72.8 114.8 66.4C114.8 60 119.4 54.8 125 54.8C130.6 54.8 135.2 60 135.2 66.4Z"
            fill={primaryColor}
        />
        <Path
            d="M67.2 66.4C67.2 72.8 62.6 78 57 78C51.4 78 46.8 72.8 46.8 66.4C46.8 60 51.4 54.8 57 54.8C62.6 54.8 67.2 60 67.2 66.4Z"
            fill={primaryColor}
        />
        
        {/* Head */}
        <Circle cx="91" cy="66.5" r="50" fill={primaryColor} />
        
        {/* Face details */}
        <Path
            d="M91 83C96.5 83 101 86.5 101 90.8C101 95.1 96.5 98.6 91 98.6C85.5 98.6 81 95.1 81 90.8C81 86.5 85.5 83 91 83Z"
            fill="#FFFFFF"
        />
        
        {/* Eyes */}
        <Circle cx="73" cy="66" r="5" fill="#333333" />
        <Circle cx="109" cy="66" r="5" fill="#333333" />
        
        {/* Nose */}
        <Path
            d="M91 72L88 78H94L91 72Z"
            fill="#FF9B9B"
        />
        
        {/* Mouth - smile */}
        <Path
            d="M78 85C78 85 84 92 91 92C98 92 104 85 104 85"
            stroke="#FF6B6B"
            strokeWidth="3"
            strokeLinecap="round"
        />
        
        {/* Cheeks */}
        <Circle cx="68" cy="76" r="8" fill="#FFB8B8" opacity="0.4" />
        <Circle cx="114" cy="76" r="8" fill="#FFB8B8" opacity="0.4" />
    </Svg>
);

// ============ CALENDAR ICON ============
const CalendarIcon = ({ size = 40, color = primaryColor }) => (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <Rect x="5" y="8" width="30" height="26" rx="4" stroke={color} strokeWidth="2" fill="none" />
        <Path d="M5 14H35" stroke={color} strokeWidth="2" />
        <Path d="M12 6V10" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <Path d="M28 6V10" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <Circle cx="28" cy="26" r="7" fill={color} />
        <Path d="M28 22V26L31 28" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
);

// ============ MANAGE ICON ============
const ManageIcon = ({ size = 40, color = primaryColor }) => (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <Rect x="5" y="8" width="30" height="26" rx="4" stroke={color} strokeWidth="2" fill="none" />
        <Path d="M5 14H35" stroke={color} strokeWidth="2" />
        <Path d="M12 6V10" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <Path d="M28 6V10" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <Circle cx="28" cy="26" r="7" fill={color} />
        <Path d="M28 24V28M26 26H30" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
);

// ============ MAIN COMPONENT ============
export default function BeautyBookingSuccess({ route, navigation }) {
    const { shopData, selectedDate, selectedTime } = route?.params || {};
    const lang = 'en'; // TODO: Get from context
    
    const onPressAddToCalendar = () => {
        // TODO: Implement add to calendar functionality
        console.log('[BeautyBookingSuccess] Add to calendar');
    };
    
    const onPressManageAppointment = () => {
        // Navigate to My Bookings screen
        navigation.navigate('MyBookings');
    };
    
    const onPressBack = () => {
        // Reset navigation to Home
        navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
        });
    };
    
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            
            <View style={styles.content}>
                {/* Happy Face Icon */}
                <View style={styles.iconContainer}>
                    <HappyFaceIcon />
                </View>
                
                {/* Confirmation Text */}
                <Text style={styles.confirmationText}>
                    {t('appointmentConfirmed', lang)}
                </Text>
                
                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                    {/* Add to Calendar Button */}
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={onPressAddToCalendar}
                        activeOpacity={0.7}
                    >
                        <CalendarIcon size={40} color={primaryColor} />
                        <View style={styles.actionTextContainer}>
                            <Text style={styles.actionTitle}>{t('addToCalendar', lang)}</Text>
                            <Text style={styles.actionSubtitle}>{t('setReminder', lang)}</Text>
                        </View>
                    </TouchableOpacity>
                    
                    {/* Manage Appointment Button */}
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={onPressManageAppointment}
                        activeOpacity={0.7}
                    >
                        <ManageIcon size={40} color={primaryColor} />
                        <View style={styles.actionTextContainer}>
                            <Text style={styles.actionTitle}>{t('manageAppointment', lang)}</Text>
                            <Text style={styles.actionSubtitle}>{t('rescheduleOrCancel', lang)}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

// ============ STYLES ============
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        gap: 50,
    },
    iconContainer: {
        marginBottom: 20,
    },
    confirmationText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#000000',
        textAlign: 'center',
        lineHeight: 32,
    },
    actionsContainer: {
        width: '100%',
        gap: 20,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: primaryColor,
        borderRadius: 30,
        paddingVertical: 20,
        paddingHorizontal: 40,
        gap: 20,
    },
    actionTextContainer: {
        flex: 1,
        gap: 5,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
    },
    actionSubtitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#747676',
    },
});

