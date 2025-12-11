/**
 * BeautyTime.js - Page de sélection de date et heure
 * 
 * Cette page permet de sélectionner la date et l'heure du rendez-vous.
 * Elle affiche les créneaux horaires disponibles en fonction des services sélectionnés,
 * des membres d'équipe, des réservations existantes et des congés.
 */

import React, { useContext, useEffect, useState, useCallback, useMemo, memo, useRef } from 'react';
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
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NoUserContext, UserContext, goToScreen, primaryColor, setAppLang } from '../AGTools';
import { AuthContext } from '../Login';
import { ShoppingCart } from '../img/svg';
import CartModal from '../CartModal';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { firestore } from '../../firebase.config';
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    getDoc,
    doc,
} from '@react-native-firebase/firestore';

// ============ CONSTANTS ============
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BATCH_SIZE = 7; // Load 7 days at a time
const VISIBLE_DAYS = 5; // Show 5 days at a time in slider
const DATE_CHIP_WIDTH = 54;
const DATE_CHIP_GAP = 15;

// Days of week names
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_LABELS = {
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    fr: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
    th: ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'],
};

const MONTH_NAMES = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
    th: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'],
};

// ============ TRANSLATIONS ============
const translations = {
    selectTime: { en: "Select time", fr: "Sélectionner l'heure", th: "เลือกเวลา" },
    continue: { en: "Continue", fr: "Continuer", th: "ดำเนินการต่อ" },
    services: { en: "services", fr: "services", th: "บริการ" },
    service: { en: "service", fr: "service", th: "บริการ" },
    noSlotsAvailable: { en: "No slots available", fr: "Aucun créneau disponible", th: "ไม่มีช่วงเวลาว่าง" },
    shopClosed: { en: "Shop closed this day", fr: "Fermé ce jour", th: "ร้านปิดวันนี้" },
    loading: { en: "Loading...", fr: "Chargement...", th: "กำลังโหลด..." },
    selectDate: { en: "Select date", fr: "Sélectionner la date", th: "เลือกวันที่" },
};

const t = (key, lang) => translations[key]?.[lang] || translations[key]?.en || key;

// ============ SVG ICONS ============

const CalendarIcon = ({ size = 24, color = "#333333" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z"
            stroke={color}
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <Path
            d="M15.6947 13.7H15.7037M15.6947 16.7H15.7037M11.9955 13.7H12.0045M11.9955 16.7H12.0045M8.29431 13.7H8.30329M8.29431 16.7H8.30329"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

const ChevronLeftIcon = ({ size = 16, color = "#333333" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M15 18L9 12L15 6"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

const ChevronRightIcon = ({ size = 16, color = "#333333" }) => (
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

const CloseIcon = ({ size = 20, color = "#333333" }) => (
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

// ============ HELPER FUNCTIONS ============

/**
 * Parse time string (HH:MM) to minutes since midnight
 */
const parseTimeToMinutes = (time) => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

/**
 * Convert minutes since midnight to time string (HH:MM)
 */
const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

/**
 * Get day name from date
 */
const getDayNameFromDate = (date) => {
    return DAY_NAMES[date.getDay()];
};

/**
 * Generate time slots from schedule
 */
const generateTimeSlots = (schedule, intervalMinutes = 60) => {
    if (!schedule || schedule.length === 0) {
        return [];
    }
    
    const slots = [];
    
    // Process pairs of open/close times
    for (let i = 0; i < schedule.length; i += 2) {
        const openTime = schedule[i];
        const closeTime = schedule[i + 1];
        
        if (!openTime || !closeTime) continue;
        
        const openMinutes = parseTimeToMinutes(openTime);
        const closeMinutes = parseTimeToMinutes(closeTime);
        
        // Generate slots for this time range
        for (let minutes = openMinutes; minutes < closeMinutes; minutes += intervalMinutes) {
            const time = minutesToTime(minutes);
            slots.push({
                time,
                isAvailable: true,
            });
        }
    }
    
    return slots;
};

/**
 * Get current time in a specific timezone
 */
const getCurrentTimeInTimezone = (timezone = 'Asia/Bangkok') => {
    try {
        const now = new Date();
        const options = {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        };
        const timeStr = now.toLocaleTimeString('en-US', options);
        const [hours, minutes] = timeStr.split(':').map(Number);
        return { hours, minutes, totalMinutes: hours * 60 + minutes };
    } catch (e) {
        // Fallback to local time
        const now = new Date();
        return { 
            hours: now.getHours(), 
            minutes: now.getMinutes(), 
            totalMinutes: now.getHours() * 60 + now.getMinutes() 
        };
    }
};

/**
 * Check if a time slot is in the past (based on shop timezone)
 */
const isTimeSlotInPast = (date, time, timezone = 'Asia/Bangkok', advancedNoticeMinutes = 0) => {
    // Get current time in shop's timezone
    const shopTime = getCurrentTimeInTimezone(timezone);
    const currentMinutes = shopTime.totalMinutes;
    
    // Get slot time in minutes
    const [slotHours, slotMinutes] = time.split(':').map(Number);
    const slotTotalMinutes = slotHours * 60 + slotMinutes;
    
    // Add advanced notice to current time
    const minBookingMinutes = currentMinutes + advancedNoticeMinutes;
    
    // Slot is in past if it's before (current time + advanced notice)
    return slotTotalMinutes < minBookingMinutes;
};

/**
 * Format duration for display
 */
const formatDuration = (minutes) => {
    if (!minutes) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
};

/**
 * Get available dates for the next N days
 */
const getAvailableDates = (maxDays = 30) => {
    const dates = [];
    const now = new Date();
    
    for (let i = 0; i < maxDays; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() + i);
        date.setHours(0, 0, 0, 0);
        dates.push(date);
    }
    
    return dates;
};

/**
 * Check if two dates are the same day
 */
const isSameDay = (date1, date2) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};

/**
 * Get date as UTC day (for comparison)
 */
const dayUTC = (date) => {
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
};

/**
 * Parse schedule array to ranges
 * Input: ["09:00", "12:00", "14:00", "18:00"]
 * Output: [{ start: 540, end: 720 }, { start: 840, end: 1080 }]
 */
const getRangesFromStrings = (schedule) => {
    const ranges = [];
    for (let i = 0; i < schedule.length; i += 2) {
        if (schedule[i] && schedule[i + 1]) {
            ranges.push({
                start: parseTimeToMinutes(schedule[i]),
                end: parseTimeToMinutes(schedule[i + 1]),
            });
        }
    }
    return ranges;
};

/**
 * Get members that can perform a specific service
 */
const getMembersForService = (serviceId, teamMembers) => {
    if (!teamMembers || !serviceId) return [];
    return teamMembers.filter(member => 
        member.services && 
        Array.isArray(member.services) && 
        member.services.includes(serviceId)
    );
};

/**
 * Check if a member is working on a specific day
 * Returns their working ranges or null if not working
 */
const getMemberWorkingRanges = (member, dayName) => {
    if (!member || !member[dayName]) return null;
    const schedule = member[dayName];
    if (!schedule || schedule.length === 0) return null;
    return getRangesFromStrings(schedule);
};

/**
 * Check if a slot time is within any of the ranges
 */
const isSlotInRanges = (slotStartMinutes, slotEndMinutes, ranges) => {
    if (!ranges || ranges.length === 0) return false;
    return ranges.some(range => 
        slotStartMinutes >= range.start && slotEndMinutes <= range.end
    );
};

/**
 * Check if a member is on day off for a specific date and slot
 * @param {Object} member - Team member
 * @param {Date} date - Selected date
 * @param {Array} daysOff - Array of day off records
 * @param {number} slotStartMinutes - Slot start time in minutes (optional for full day check)
 * @param {number} slotEndMinutes - Slot end time in minutes (optional for full day check)
 * @returns {boolean} - True if member is on day off
 */
const isMemberOnDayOff = (member, date, daysOff, slotStartMinutes = null, slotEndMinutes = null) => {
    if (!daysOff || !member) return false;
    
    const dateUTC = dayUTC(date);
    
    return daysOff.some(dayOff => {
        // Check if this day off belongs to this member
        if (dayOff.memberId !== member.id) return false;
        
        // Get start and end dates
        let startDate, endDate;
        try {
            startDate = dayOff.dateStart?.toDate ? dayUTC(dayOff.dateStart.toDate()) : dayUTC(new Date(dayOff.dateStart));
            endDate = dayOff.dateEnd?.toDate ? dayUTC(dayOff.dateEnd.toDate()) : dayUTC(new Date(dayOff.dateEnd));
        } catch (e) {
            return false;
        }
        
        // Check if selected date is within day off period
        if (dateUTC < startDate || dateUTC > endDate) return false;
        
        // If no slot times provided, just check date range
        if (slotStartMinutes === null || slotEndMinutes === null) return true;
        
        // If day off has specific hours, check them
        if (dayOff.startHour && dayOff.endHour) {
            const dayOffStart = parseTimeToMinutes(dayOff.startHour);
            const dayOffEnd = parseTimeToMinutes(dayOff.endHour);
            
            // Check if slot overlaps with day off hours
            return slotStartMinutes < dayOffEnd && slotEndMinutes > dayOffStart;
        }
        
        // No specific hours = full day off
        return true;
    });
};

/**
 * Check if a member has a booking conflict at a specific slot
 * @param {Object} member - Team member
 * @param {Array} bookings - Array of bookings for the date
 * @param {number} slotStartMinutes - Slot start time in minutes
 * @param {number} slotEndMinutes - Slot end time in minutes
 * @returns {boolean} - True if there's a conflict
 */
const isMemberBookedAtSlot = (member, bookings, slotStartMinutes, slotEndMinutes) => {
    if (!bookings || bookings.length === 0 || !member) return false;
    
    return bookings.some(booking => {
        // Only check confirmed (2) or pending (1) bookings
        if (![1, 2].includes(booking.statut)) return false;
        
        // Check if this booking has services for this member
        const memberServices = booking.services?.filter(s => s.memberId === member.id) || [];
        if (memberServices.length === 0) return false;
        
        // Get the earliest start and latest end for this member's services
        const starts = memberServices.map(s => parseTimeToMinutes(s.timeStart));
        const ends = memberServices.map(s => parseTimeToMinutes(s.timeEnd));
        const bookingStart = Math.min(...starts);
        const bookingEnd = Math.max(...ends);
        
        // Check overlap: slot overlaps if slotStart < bookingEnd AND slotEnd > bookingStart
        return slotStartMinutes < bookingEnd && slotEndMinutes > bookingStart;
    });
};

/**
 * Get available members for a service at a specific slot
 * @param {Object} service - The service
 * @param {Array} teamMembers - Team members
 * @param {string} dayName - Day name (monday, tuesday, etc.)
 * @param {Array} daysOff - Days off records
 * @param {Array} bookings - Bookings for the date
 * @param {Date} selectedDate - Selected date
 * @param {number} slotStartMinutes - Slot start time in minutes
 * @param {number} slotEndMinutes - Slot end time in minutes
 * @param {Array} shopOpeningRanges - Shop opening ranges (optional, used as fallback)
 */
const getAvailableMembersForServiceAtSlot = (
    service,
    teamMembers,
    dayName,
    daysOff,
    bookings,
    selectedDate,
    slotStartMinutes,
    slotEndMinutes,
    shopOpeningRanges = null
) => {
    // Get all members who can perform this service
    const capableMembers = getMembersForService(service.serviceId || service.id, teamMembers);
    
    // Filter by availability
    return capableMembers.filter(member => {
        // Check 1: Is member working this day?
        // If member has their own schedule, use it. Otherwise, assume they follow shop hours.
        const memberWorkingRanges = getMemberWorkingRanges(member, dayName);
        const workingRanges = memberWorkingRanges || shopOpeningRanges;
        
        // If still no working ranges, assume member is available (no schedule = follows shop)
        if (!workingRanges) {
            // No schedule defined anywhere, consider member available
            // (will be filtered by other checks like day off)
        } else {
            // Check 2: Is slot within member's working hours?
            if (!isSlotInRanges(slotStartMinutes, slotEndMinutes, workingRanges)) return false;
        }
        
        // Check 3: Is member on day off?
        if (isMemberOnDayOff(member, selectedDate, daysOff, slotStartMinutes, slotEndMinutes)) return false;
        
        // Check 4: Is member booked at this slot?
        if (isMemberBookedAtSlot(member, bookings, slotStartMinutes, slotEndMinutes)) return false;
        
        return true;
    });
};

/**
 * Check if a slot is valid considering all constraints
 * Returns: { isAvailable: boolean, availableMembersByService: [...], reason?: string }
 */
const validateSlot = (
    slot,
    guestServices,
    teamMembers,
    dayName,
    daysOff,
    bookings,
    selectedDate,
    serviceDurationMinutes,
    shopOpeningRanges,
    numberOfGuests,
    selectedMemberIds = []
) => {
    const slotStartMinutes = parseTimeToMinutes(slot.time);
    
    // Use serviceDurationMinutes only if > 0, otherwise just check start time
    const effectiveDuration = serviceDurationMinutes > 0 ? serviceDurationMinutes : 0;
    const slotEndMinutes = slotStartMinutes + effectiveDuration;
    
    // Check 1: Is slot START within shop opening hours?
    // We check if the slot starts within any opening range
    const slotStartInRange = shopOpeningRanges.some(range => 
        slotStartMinutes >= range.start && slotStartMinutes < range.end
    );
    
    if (!slotStartInRange) {
        return { isAvailable: false, reason: 'outside_shop_hours' };
    }
    
    // Check 1b: If we have a duration, verify the service can finish before closing
    if (effectiveDuration > 0) {
        const canFinishInTime = shopOpeningRanges.some(range => 
            slotStartMinutes >= range.start && slotEndMinutes <= range.end
        );
        if (!canFinishInTime) {
            return { isAvailable: false, reason: 'service_exceeds_closing' };
        }
    }
    
    // IMPORTANT: If no team members data, skip member validation
    // This happens when shop doesn't use member management or data isn't loaded yet
    if (!teamMembers || teamMembers.length === 0) {
        return { isAvailable: true, availableMembersByService: [] };
    }
    
    // Check if team members have the required data (services array and schedule)
    // If members don't have proper data, skip member validation
    const membersHaveData = teamMembers.some(member => 
        (member.services && member.services.length > 0) || 
        (member[dayName] && member[dayName].length > 0)
    );
    
    if (!membersHaveData) {
        return { isAvailable: true, availableMembersByService: [] };
    }
    
    // Check 2: Get available members for each service
    const availableMembersByService = guestServices.map(service => {
        const availableMembers = getAvailableMembersForServiceAtSlot(
            service,
            teamMembers,
            dayName,
            daysOff,
            bookings,
            selectedDate,
            slotStartMinutes,
            slotEndMinutes,
            shopOpeningRanges // Pass shop hours as fallback for members without personal schedule
        );
        
        return {
            serviceId: service.serviceId || service.id,
            serviceName: service.name || service.title,
            guestId: service.guestId,
            teamMemberId: service.teamMemberId, // Selected member if any
            availableMembers,
        };
    });
    
    // Check 3: Every service must have at least one available member
    // BUT: If a service has no capable members at all (not just unavailable), skip this check
    const servicesWithCapableMembers = availableMembersByService.filter(s => {
        const capableMembers = getMembersForService(s.serviceId, teamMembers);
        return capableMembers.length > 0;
    });
    
    // Only check coverage for services that have capable members defined
    if (servicesWithCapableMembers.length > 0) {
        const allServicesCovered = servicesWithCapableMembers.every(s => s.availableMembers.length > 0);
        if (!allServicesCovered) {
            return { isAvailable: false, availableMembersByService, reason: 'no_member_for_service' };
        }
    }
    
    // Check 4: If specific members are selected, verify they're available
    if (selectedMemberIds.length > 0 && servicesWithCapableMembers.length > 0) {
        const selectedMembersAvailable = availableMembersByService.some(s => 
            s.availableMembers.some(m => selectedMemberIds.includes(m.id))
        );
        if (!selectedMembersAvailable) {
            return { isAvailable: false, availableMembersByService, reason: 'selected_member_unavailable' };
        }
    }
    
    // Check 5: For services with specific teamMemberId, verify that member is available
    for (const serviceInfo of availableMembersByService) {
        if (serviceInfo.teamMemberId && serviceInfo.teamMemberId !== 'notSpecific') {
            // Only check if this member is in our team
            const memberExists = teamMembers.some(m => m.id === serviceInfo.teamMemberId);
            if (memberExists) {
                const isSelectedMemberAvailable = serviceInfo.availableMembers.some(
                    m => m.id === serviceInfo.teamMemberId
                );
                if (!isSelectedMemberAvailable) {
                    return { isAvailable: false, availableMembersByService, reason: 'assigned_member_unavailable' };
                }
            }
        }
    }
    
    // Check 6: Verify enough unique members for all guests
    // Only if we have services with capable members
    if (servicesWithCapableMembers.length > 0 && numberOfGuests > 1) {
        const allAvailableMemberIds = new Set();
        availableMembersByService.forEach(s => {
            s.availableMembers.forEach(m => allAvailableMemberIds.add(m.id));
        });
        
        if (allAvailableMemberIds.size < numberOfGuests) {
            return { isAvailable: false, availableMembersByService, reason: 'not_enough_members_for_guests' };
        }
    }
    
    // All checks passed
    return { isAvailable: true, availableMembersByService };
};

// ============ SUB-COMPONENTS ============

/**
 * Date Chip Component
 */
const DateChip = memo(({ date, isSelected, isBlocked, onPress, lang }) => {
    const dayLabel = DAY_LABELS[lang]?.[date.getDay()] || DAY_LABELS.en[date.getDay()];
    const dayNumber = date.getDate();
    
    return (
        <TouchableOpacity
            style={[
                styles.dateChip,
                isSelected && styles.dateChipSelected,
                isBlocked && styles.dateChipBlocked,
            ]}
            onPress={() => !isBlocked && onPress(date)}
            activeOpacity={isBlocked ? 1 : 0.7}
            disabled={isBlocked}
        >
            <Text style={[
                styles.dateChipDay,
                isSelected && styles.dateChipDaySelected,
                isBlocked && styles.dateChipDayBlocked,
            ]}>
                {dayLabel}
            </Text>
            <Text style={[
                styles.dateChipNumber,
                isSelected && styles.dateChipNumberSelected,
                isBlocked && styles.dateChipNumberBlocked,
            ]}>
                {dayNumber}
            </Text>
        </TouchableOpacity>
    );
});

/**
 * Time Slot Component
 */
const TimeSlot = memo(({ slot, isSelected, onPress }) => {
    if (!slot.isAvailable) return null;
    
    return (
        <TouchableOpacity
            style={[
                styles.timeSlot,
                isSelected && styles.timeSlotSelected,
            ]}
            onPress={() => onPress(slot)}
            activeOpacity={0.7}
        >
            <Text style={[
                styles.timeSlotText,
                isSelected && styles.timeSlotTextSelected,
            ]}>
                {slot.time}
            </Text>
        </TouchableOpacity>
    );
});

/**
 * Calendar Modal Component
 */
const CalendarModal = memo(({ 
    visible, 
    onClose, 
    selectedDate, 
    onSelectDate, 
    lang,
    blockedDates = [],
    minDate,
    maxDate,
}) => {
    const insets = useSafeAreaInsets();
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
    
    const monthName = MONTH_NAMES[lang]?.[currentMonth.getMonth()] || MONTH_NAMES.en[currentMonth.getMonth()];
    const year = currentMonth.getFullYear();
    
    // Get days in current month
    const daysInMonth = useMemo(() => {
        const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        const days = [];
        
        // Add empty slots for days before first day of month
        const startDayOfWeek = firstDay.getDay();
        // Adjust for week starting on Monday
        const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
        for (let i = 0; i < adjustedStartDay; i++) {
            const prevMonthDay = new Date(firstDay);
            prevMonthDay.setDate(prevMonthDay.getDate() - (adjustedStartDay - i));
            days.push({ date: prevMonthDay, isOtherMonth: true });
        }
        
        // Add days of current month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({ 
                date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i),
                isOtherMonth: false,
            });
        }
        
        // Add remaining days to complete the grid (6 rows x 7 days)
        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            const nextMonthDay = new Date(lastDay);
            nextMonthDay.setDate(nextMonthDay.getDate() + i);
            days.push({ date: nextMonthDay, isOtherMonth: true });
        }
        
        return days;
    }, [currentMonth]);
    
    const goToPreviousMonth = () => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() - 1);
        if (minDate && newMonth < new Date(minDate.getFullYear(), minDate.getMonth(), 1)) {
            return;
        }
        setCurrentMonth(newMonth);
    };
    
    const goToNextMonth = () => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() + 1);
        if (maxDate && newMonth > new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0)) {
            return;
        }
        setCurrentMonth(newMonth);
    };
    
    const isDateBlocked = (date) => {
        if (minDate && date < minDate) return true;
        if (maxDate && date > maxDate) return true;
        return blockedDates.some(d => isSameDay(d, date));
    };
    
    const dayLabels = lang === 'en' 
        ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        : lang === 'fr'
        ? ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
        : ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];
    
    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.calendarModalOverlay}>
                <View style={[styles.calendarModalContainer, { marginTop: insets.top + 100 }]}>
                    {/* Header */}
                    <View style={styles.calendarHeader}>
                        <TouchableOpacity onPress={goToPreviousMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <ChevronLeftIcon size={20} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.calendarTitle}>{monthName} {year}</Text>
                        <TouchableOpacity onPress={goToNextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <ChevronRightIcon size={20} color="#333" />
                        </TouchableOpacity>
                    </View>
                    
                    {/* Close button */}
                    <TouchableOpacity 
                        style={styles.calendarCloseButton} 
                        onPress={onClose}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <CloseIcon size={16} color="#333" />
                    </TouchableOpacity>
                    
                    {/* Day labels */}
                    <View style={styles.calendarDayLabels}>
                        {dayLabels.map((label, index) => (
                            <Text key={index} style={styles.calendarDayLabel}>{label}</Text>
                        ))}
                    </View>
                    
                    {/* Calendar grid */}
                    <View style={styles.calendarGrid}>
                        {daysInMonth.map((dayInfo, index) => {
                            const { date, isOtherMonth } = dayInfo;
                            const isSelected = isSameDay(date, selectedDate);
                            const isBlocked = isDateBlocked(date);
                            
                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.calendarDay,
                                        isSelected && styles.calendarDaySelected,
                                    ]}
                                    onPress={() => {
                                        if (!isBlocked && !isOtherMonth) {
                                            onSelectDate(date);
                                            onClose();
                                        }
                                    }}
                                    disabled={isBlocked || isOtherMonth}
                                    activeOpacity={0.7}
                                >
                                    {isSelected && (
                                        <View style={styles.calendarDayHalo} />
                                    )}
                                    <View style={[
                                        styles.calendarDayInner,
                                        isSelected && styles.calendarDayInnerSelected,
                                    ]}>
                                        <Text style={[
                                            styles.calendarDayText,
                                            isOtherMonth && styles.calendarDayTextOther,
                                            isBlocked && styles.calendarDayTextBlocked,
                                            isSelected && styles.calendarDayTextSelected,
                                        ]}>
                                            {date.getDate()}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </View>
        </Modal>
    );
});

// ============ MAIN COMPONENT ============

const BeautyTime = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const lang = setAppLang();
    const dateSliderRef = useRef(null);
    
    // Route params
    const shopId = route?.params?.shopId;
    const guests = route?.params?.guests || [];
    const shopData = route?.params?.shopData || null;
    const settingCalendar = route?.params?.settingCalendar || shopData?.settingCalendar || {};
    const team = route?.params?.team || [];
    const services = route?.params?.services || [];
    const categories = route?.params?.categories || [];
    
    // State
    const [selectedDate, setSelectedDate] = useState(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return now;
    });
    const [selectedTime, setSelectedTime] = useState(null);
    const [timeSlots, setTimeSlots] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [calendarModalVisible, setCalendarModalVisible] = useState(false);
    const [cartModalVisible, setCartModalVisible] = useState(false);
    const [blockedDates, setBlockedDates] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [daysOff, setDaysOff] = useState([]);
    const [loadedDaysCount, setLoadedDaysCount] = useState(BATCH_SIZE);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [currentSliderIndex, setCurrentSliderIndex] = useState(0);
    
    // Cache for availability
    const availabilityCacheRef = useRef({});
    
    // Track if first available date search has been done
    const hasSearchedFirstAvailableDateRef = useRef(false);
    
    // Available dates (next N days)
    const availableDates = useMemo(() => {
        const maxDays = settingCalendar?.maxBookingPeriod || 30;
        return getAvailableDates(maxDays);
    }, [settingCalendar?.maxBookingPeriod]);
    
    // Loaded dates (for lazy loading)
    const loadedDates = useMemo(() => {
        return availableDates.slice(0, loadedDaysCount);
    }, [availableDates, loadedDaysCount]);
    
    // Current month display based on selected date
    const currentMonthDisplay = useMemo(() => {
        const monthName = MONTH_NAMES[lang]?.[selectedDate.getMonth()] || MONTH_NAMES.en[selectedDate.getMonth()];
        return `${monthName} ${selectedDate.getFullYear()}`;
    }, [selectedDate, lang]);
    
    // Cart calculations
    const cart = useMemo(() => {
        return guests.flatMap(guest => guest.services || []);
    }, [guests]);
    
    const cartTotal = useMemo(() => {
        return cart.reduce((sum, service) => sum + (service.totalPrice || service.promotionPrice || service.price || 0), 0);
    }, [cart]);
    
    const totalDuration = useMemo(() => {
        return cart.reduce((sum, service) => sum + (service.duration || 0), 0);
    }, [cart]);
    
    // Load more days when reaching end of list
    const loadMoreDays = useCallback(() => {
        if (isLoadingMore || loadedDaysCount >= availableDates.length) return;
        
        setIsLoadingMore(true);
        
        setTimeout(() => {
            setLoadedDaysCount(prev => Math.min(prev + BATCH_SIZE, availableDates.length));
            setIsLoadingMore(false);
        }, 100);
    }, [isLoadingMore, loadedDaysCount, availableDates.length]);
    
    // Fetch bookings for selected date
    const fetchBookings = useCallback(async () => {
        if (!shopId || !selectedDate) {
            console.log('[BeautyTime] fetchBookings skipped - shopId:', shopId, 'selectedDate:', selectedDate);
            return;
        }
        
        try {
            // Format date for query
            const dateStr = `${String(selectedDate.getDate()).padStart(2, '0')}/${String(selectedDate.getMonth() + 1).padStart(2, '0')}/${selectedDate.getFullYear()}`;
            
            console.log('[BeautyTime] ========== FETCH BOOKINGS START ==========');
            console.log('[BeautyTime] shopId:', shopId);
            console.log('[BeautyTime] selectedDate:', selectedDate);
            console.log('[BeautyTime] dateStr (formatted):', dateStr);
            
            const bookingsRef = collection(firestore, 'Shops', shopId, 'Booking');
            console.log('[BeautyTime] Collection path: Shops/' + shopId + '/Booking');
            
            // First, get ALL bookings for the day (no status filter)
            const qAll = query(
                bookingsRef,
                where('dateBooking', '==', dateStr)
            );
            
            console.log('[BeautyTime] Querying ALL bookings with dateBooking ==', dateStr);
            const snapshotAll = await getDocs(qAll);
            console.log('[BeautyTime] Snapshot ALL size:', snapshotAll.size);
            
            const allBookingsList = snapshotAll.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            
            // Log first booking structure if exists
            if (allBookingsList.length > 0) {
                console.log('[BeautyTime] First booking sample:', JSON.stringify(allBookingsList[0], null, 2));
            }
            
            // Then, filter for status 1 or 2 only
            const q = query(
                bookingsRef,
                where('dateBooking', '==', dateStr),
                where('statut', 'in', [1, 2]) // 1 = pending, 2 = confirmed
            );
            
            console.log('[BeautyTime] Querying bookings with dateBooking ==', dateStr, 'AND statut in [1, 2]');
            const snapshot = await getDocs(q);
            console.log('[BeautyTime] Snapshot filtered size:', snapshot.size);
            
            const bookingsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            
            // Log booking information
            console.log('[BeautyTime] ========== BOOKINGS INFO ==========');
            console.log('[BeautyTime] Date:', dateStr);
            console.log('[BeautyTime] Total bookings for day:', allBookingsList.length);
            console.log('[BeautyTime] Bookings with statut 1 or 2:', bookingsList.length);
            
            // Log detailed booking structure
            if (bookingsList.length > 0) {
                console.log('[BeautyTime] Detailed bookings:');
                bookingsList.forEach((booking, index) => {
                    console.log(`[BeautyTime]   Booking ${index + 1}:`);
                    console.log(`[BeautyTime]     - ID: ${booking.id}`);
                    console.log(`[BeautyTime]     - Statut: ${booking.statut}`);
                    console.log(`[BeautyTime]     - Booking timeStart: ${booking.timeStart || 'N/A'}`);
                    console.log(`[BeautyTime]     - Booking timeEnd: ${booking.timeEnd || 'N/A'}`);
                    console.log(`[BeautyTime]     - Number of services: ${booking.services?.length || 0}`);
                    
                    if (booking.services && booking.services.length > 0) {
                        booking.services.forEach((service, sIdx) => {
                            console.log(`[BeautyTime]       Service ${sIdx + 1}:`);
                            console.log(`[BeautyTime]         - memberId: ${service.memberId || 'N/A'}`);
                            console.log(`[BeautyTime]         - timeStart: ${service.timeStart || 'N/A'}`);
                            console.log(`[BeautyTime]         - timeEnd: ${service.timeEnd || 'N/A'}`);
                            console.log(`[BeautyTime]         - serviceId: ${service.id || service.serviceId || 'N/A'}`);
                        });
                    }
                });
            } else {
                console.log('[BeautyTime] No bookings with statut 1 or 2');
            }
            
            // Log all bookings with their statuts
            if (allBookingsList.length > 0) {
                console.log('[BeautyTime] All bookings statuts:');
                allBookingsList.forEach((booking, index) => {
                    console.log(`[BeautyTime]   Booking ${index + 1}: statut=${booking.statut}, timeStart=${booking.timeStart || 'N/A'}`);
                });
            }
            
            console.log('[BeautyTime] ===================================');
            
            setBookings(bookingsList);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        }
    }, [shopId, selectedDate]);
    
    // Fetch days off
    const fetchDaysOff = useCallback(async () => {
        if (!shopId) return;
        
        try {
            const daysOffRef = collection(firestore, 'Shops', shopId, 'DaysOff');
            const snapshot = await getDocs(daysOffRef);
            const daysOffList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            
            setDaysOff(daysOffList);
        } catch (error) {
            console.error('Error fetching days off:', error);
        }
    }, [shopId]);
    
    // Get all services from all guests (flattened with guestId)
    const guestServices = useMemo(() => {
        const services = [];
        guests.forEach(guest => {
            (guest.services || []).forEach(service => {
                services.push({
                    ...service,
                    guestId: guest.id,
                });
            });
        });
        return services;
    }, [guests]);
    
    // Get number of guests
    const numberOfGuests = useMemo(() => {
        return guests.filter(g => g.services && g.services.length > 0).length;
    }, [guests]);
    
    // Get selected member IDs (excluding 'notSpecific')
    const selectedMemberIds = useMemo(() => {
        const ids = new Set();
        guestServices.forEach(service => {
            if (service.teamMemberId && service.teamMemberId !== 'notSpecific') {
                ids.add(service.teamMemberId);
            }
        });
        return Array.from(ids);
    }, [guestServices]);
    
    // Generate time slots for selected date with full validation
    const generateSlotsForDate = useCallback(() => {
        if (!shopData || !selectedDate) {
            console.log('[BeautyTime] No shopData or selectedDate');
            setTimeSlots([]);
            return;
        }
        
        setIsLoading(true);
        
        try {
            // Get shop schedule for this day
            const dayName = getDayNameFromDate(selectedDate);
            const schedule = shopData[dayName];
            
            console.log('[BeautyTime] ========== SLOT GENERATION START ==========');
            console.log('[BeautyTime] Date:', selectedDate.toDateString());
            console.log('[BeautyTime] Day name:', dayName);
            console.log('[BeautyTime] Schedule for day:', schedule);
            console.log('[BeautyTime] Total duration:', totalDuration);
            console.log('[BeautyTime] Number of guests:', numberOfGuests);
            console.log('[BeautyTime] Guest services:', guestServices.length);
            console.log('[BeautyTime] Team members:', team.length);
            console.log('[BeautyTime] Bookings:', bookings.length);
            console.log('[BeautyTime] Days off:', daysOff.length);
            console.log('[BeautyTime] Selected member IDs:', selectedMemberIds);
            
            if (!schedule || schedule.length === 0) {
                console.log('[BeautyTime] No schedule for this day - shop closed');
                setTimeSlots([]);
                setIsLoading(false);
                return;
            }
            
            // Get shop opening ranges
            const shopOpeningRanges = getRangesFromStrings(schedule);
            console.log('[BeautyTime] Shop opening ranges:', shopOpeningRanges);
            
            // Get interval from settings
            const intervalMinutes = settingCalendar?.interval_minutes || 60;
            console.log('[BeautyTime] Interval minutes:', intervalMinutes);
            
            // Generate base slots
            let slots = generateTimeSlots(schedule, intervalMinutes);
            console.log('[BeautyTime] Generated base slots:', slots.length);
            
            // Get timezone and advanced notice
            const shopTimezone = settingCalendar?.timeZone || 'Asia/Bangkok';
            const advancedNoticeMinutes = settingCalendar?.advancedNotice || 0;
            
            // Check if date is today or in the past
            const now = new Date();
            const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
            const isToday = selectedDateOnly.getTime() === todayDate.getTime();
            const isPastDate = selectedDateOnly.getTime() < todayDate.getTime();
            
            console.log('[BeautyTime] Is today:', isToday);
            console.log('[BeautyTime] Is past date:', isPastDate);
            console.log('[BeautyTime] Advanced notice (minutes):', advancedNoticeMinutes);
            
            // Process each slot
            slots = slots.map(slot => {
                // Check 1: If date is in the past, mark as unavailable
                if (isPastDate) {
                    return { ...slot, isAvailable: false, reason: 'past_date' };
                }
                
                // Check 2: For today, check if slot is in the past (+ advanced notice)
                if (isToday) {
                    const isPast = isTimeSlotInPast(
                        selectedDate,
                        slot.time,
                        shopTimezone,
                        advancedNoticeMinutes
                    );
                    if (isPast) {
                        return { ...slot, isAvailable: false, reason: 'past_slot' };
                    }
                }
                
                // Check 3: If no services selected, just show base availability
                if (guestServices.length === 0) {
                    return { ...slot, isAvailable: true };
                }
                
                // Check 4: Verify slot can accommodate service duration
                if (totalDuration > 0) {
                    const slotMinutes = parseTimeToMinutes(slot.time);
                    const endMinutes = slotMinutes + totalDuration;
                    
                    // Check if service can finish within shop hours
                    const canFinish = shopOpeningRanges.some(range => 
                        slotMinutes >= range.start && endMinutes <= range.end
                    );
                    
                    if (!canFinish) {
                        return { ...slot, isAvailable: false, reason: 'service_exceeds_closing' };
                    }
                }
                
                // Check 5: Full member validation (only if team has data)
                // Skip member validation if team is empty or has no schedule/services data
                if (team.length === 0) {
                    return { ...slot, isAvailable: true };
                }
                
                const membersHaveData = team.some(member => 
                    (member.services && member.services.length > 0) || 
                    (member[dayName] && member[dayName].length > 0)
                );
                
                if (!membersHaveData) {
                    return { ...slot, isAvailable: true };
                }
                
                // Full validation with members
                const validation = validateSlot(
                    slot,
                    guestServices,
                    team,
                    dayName,
                    daysOff,
                    bookings,
                    selectedDate,
                    totalDuration,
                    shopOpeningRanges,
                    numberOfGuests,
                    selectedMemberIds
                );
                
                return {
                    ...slot,
                    isAvailable: validation.isAvailable,
                    availableMembersByService: validation.availableMembersByService,
                    reason: validation.reason,
                };
            });
            
            // Log stats
            const availableSlots = slots.filter(s => s.isAvailable);
            console.log('[BeautyTime] Available slots:', availableSlots.length);
            
            if (availableSlots.length === 0) {
                // Log reasons for debugging
                const reasons = {};
                slots.forEach(s => {
                    if (!s.isAvailable && s.reason) {
                        reasons[s.reason] = (reasons[s.reason] || 0) + 1;
                    }
                });
                console.log('[BeautyTime] Unavailable reasons:', reasons);
            }
            
            console.log('[BeautyTime] ========== SLOT GENERATION END ==========');
            setTimeSlots(slots);
        } catch (error) {
            console.error('[BeautyTime] Error generating slots:', error);
            setTimeSlots([]);
        } finally {
            setIsLoading(false);
        }
    }, [shopData, selectedDate, settingCalendar, totalDuration, guestServices, team, bookings, daysOff, numberOfGuests, selectedMemberIds]);
    
    // Effects
    useEffect(() => {
        fetchDaysOff();
    }, [fetchDaysOff]);
    
    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);
    
    useEffect(() => {
        generateSlotsForDate();
    }, [generateSlotsForDate]);
    
    // Auto-select first available date on mount
    useEffect(() => {
        const findFirstAvailableDate = async () => {
            // Only run once
            if (hasSearchedFirstAvailableDateRef.current) return;
            
            // Wait for initial data to load
            if (!shopData || !bookings || !daysOff) return;
            
            // Wait for timeSlots to be generated at least once
            if (timeSlots.length === 0 && !isLoading) return;
            
            // Mark as searched
            hasSearchedFirstAvailableDateRef.current = true;
            
            console.log('[BeautyTime] Looking for first available date...');
            
            // Check if current selected date has available slots
            const currentDateHasSlots = timeSlots.some(slot => slot.isAvailable);
            
            if (currentDateHasSlots) {
                console.log('[BeautyTime] Current date has available slots');
                return;
            }
            
            console.log('[BeautyTime] Current date has no available slots, searching...');
            
            // Search through next dates
            for (let i = 0; i < availableDates.length; i++) {
                const testDate = availableDates[i];
                
                // Skip if same as current selected date (already tested)
                if (isSameDay(testDate, selectedDate)) continue;
                
                // Check if shop is open
                const dayName = getDayNameFromDate(testDate);
                const schedule = shopData[dayName];
                
                if (!schedule || schedule.length === 0) continue;
                
                // Quick check: generate slots for this date
                const shopOpeningRanges = getRangesFromStrings(schedule);
                const intervalMinutes = settingCalendar?.interval_minutes || 60;
                let testSlots = generateTimeSlots(schedule, intervalMinutes);
                
                // Filter past slots if today
                const now = new Date();
                const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const testDateOnly = new Date(testDate.getFullYear(), testDate.getMonth(), testDate.getDate());
                const isToday = testDateOnly.getTime() === todayDate.getTime();
                
                if (isToday) {
                    const shopTimezone = settingCalendar?.timeZone || 'Asia/Bangkok';
                    const advancedNoticeMinutes = settingCalendar?.advancedNotice || 0;
                    
                    testSlots = testSlots.filter(slot => {
                        return !isTimeSlotInPast(testDate, slot.time, shopTimezone, advancedNoticeMinutes);
                    });
                }
                
                // Filter slots that can't fit total duration
                testSlots = testSlots.filter(slot => {
                    const slotMinutes = parseTimeToMinutes(slot.time);
                    const lastSlotMinutes = parseTimeToMinutes(shopOpeningRanges[shopOpeningRanges.length - 1].end);
                    return (slotMinutes + totalDuration) <= lastSlotMinutes;
                });
                
                // If we have at least one slot, this date is good
                if (testSlots.length > 0) {
                    console.log('[BeautyTime] Found first available date:', testDate.toDateString(), 'with', testSlots.length, 'slots');
                    setSelectedDate(testDate);
                    
                    // Scroll to this date in the slider
                    const dateIndex = availableDates.findIndex(d => isSameDay(d, testDate));
                    if (dateIndex !== -1 && dateSliderRef.current) {
                        setTimeout(() => {
                            dateSliderRef.current?.scrollToIndex({
                                index: dateIndex,
                                animated: true,
                            });
                        }, 100);
                    }
                    return;
                }
            }
            
            console.log('[BeautyTime] No available dates found in the next', availableDates.length, 'days');
        };
        
        // Run when initial data is loaded and slots are generated
        findFirstAvailableDate();
    }, [shopData, bookings?.length, daysOff?.length, timeSlots.length, isLoading]);
    
    // Handlers
    const onPressBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);
    
    const onSelectDate = useCallback((date) => {
        setSelectedDate(date);
        setSelectedTime(null);
        
        // Find index and scroll to it
        const index = availableDates.findIndex(d => isSameDay(d, date));
        if (index >= 0 && dateSliderRef.current) {
            dateSliderRef.current.scrollToIndex({ 
                index: Math.max(0, index - 2), 
                animated: true 
            });
        }
    }, [availableDates]);
    
    const onSelectTime = useCallback((slot) => {
        setSelectedTime(slot.time);
    }, []);
    
    const onPressCalendar = useCallback(() => {
        setCalendarModalVisible(true);
    }, []);
    
    const onCloseCalendar = useCallback(() => {
        setCalendarModalVisible(false);
    }, []);
    
    // Navigate 5 days forward/backward
    const goToPreviousDays = useCallback(() => {
        const newIndex = Math.max(0, currentSliderIndex - VISIBLE_DAYS);
        setCurrentSliderIndex(newIndex);
        if (dateSliderRef.current) {
            dateSliderRef.current.scrollToIndex({ index: newIndex, animated: true });
        }
    }, [currentSliderIndex]);
    
    const goToNextDays = useCallback(() => {
        const newIndex = Math.min(loadedDates.length - 1, currentSliderIndex + VISIBLE_DAYS);
        setCurrentSliderIndex(newIndex);
        if (dateSliderRef.current) {
            dateSliderRef.current.scrollToIndex({ index: newIndex, animated: true });
        }
        
        // Load more if needed
        if (newIndex >= loadedDaysCount - BATCH_SIZE) {
            loadMoreDays();
        }
    }, [currentSliderIndex, loadedDates.length, loadedDaysCount, loadMoreDays]);
    
    const onOpenCartModal = useCallback(() => {
        setCartModalVisible(true);
    }, []);
    
    const onCloseCartModal = useCallback(() => {
        setCartModalVisible(false);
    }, []);
    
    const onPressContinue = useCallback(() => {
        if (!selectedTime || cart.length === 0) return;
        
        // Navigate to checkout page
        goToScreen(navigation, "BeautyCheckout", {
            shopId,
            guests,
            shopData,
            settingCalendar,
            team,
            selectedDate: selectedDate.toISOString(),
            selectedTime,
            services,
            categories,
        });
    }, [navigation, shopId, guests, shopData, settingCalendar, team, selectedDate, selectedTime, services, categories, cart]);
    
    // Check if day is blocked (shop closed)
    // Note: Full member availability is checked in generateSlotsForDate
    // This function only checks if the SHOP is open on this day
    const isDayBlocked = useCallback((date) => {
        if (!shopData) return false;
        
        const dayName = getDayNameFromDate(date);
        const schedule = shopData[dayName];
        
        // Only check if shop is open this day
        // Member availability is checked when generating slots
        return !schedule || schedule.length === 0;
    }, [shopData]);
    
    const hasAvailableSlots = timeSlots.some(slot => slot.isAvailable);
    
    // Render date chip for FlatList
    const renderDateChip = useCallback(({ item: date, index }) => (
        <DateChip
            date={date}
            isSelected={isSameDay(date, selectedDate)}
            isBlocked={isDayBlocked(date)}
            onPress={onSelectDate}
            lang={lang}
        />
    ), [selectedDate, isDayBlocked, onSelectDate, lang]);
    
    const getItemLayout = useCallback((data, index) => ({
        length: DATE_CHIP_WIDTH + DATE_CHIP_GAP,
        offset: (DATE_CHIP_WIDTH + DATE_CHIP_GAP) * index,
        index,
    }), []);
    
    const onEndReached = useCallback(() => {
        loadMoreDays();
    }, [loadMoreDays]);
    
    const onScrollToIndexFailed = useCallback((info) => {
        setTimeout(() => {
            if (dateSliderRef.current) {
                dateSliderRef.current.scrollToIndex({ 
                    index: info.highestMeasuredFrameIndex, 
                    animated: true 
                });
            }
        }, 100);
    }, []);
    
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
                    <Text style={styles.headerTitle}>{t('selectTime', lang)}</Text>
                    <View style={styles.headerSpacer} />
                </View>
            </SafeAreaView>
            
            {/* Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Calendar button */}
                <View style={styles.calendarButtonRow}>
                    <TouchableOpacity
                        style={styles.calendarButton}
                        onPress={onPressCalendar}
                        activeOpacity={0.7}
                    >
                        <CalendarIcon size={16} color="#333" />
                    </TouchableOpacity>
                </View>
                
                {/* Month and navigation arrows */}
                <View style={styles.monthRow}>
                    <Text style={styles.monthText}>{currentMonthDisplay}</Text>
                    <View style={styles.monthNavigation}>
                        <TouchableOpacity
                            onPress={goToPreviousDays}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            disabled={currentSliderIndex === 0}
                            style={currentSliderIndex === 0 ? styles.arrowDisabled : null}
                        >
                            <ChevronLeftIcon size={16} color={currentSliderIndex === 0 ? "#CCCCCC" : "#333"} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={goToNextDays}
                            style={[{ marginLeft: 16 }, currentSliderIndex >= loadedDates.length - VISIBLE_DAYS ? styles.arrowDisabled : null]}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            disabled={currentSliderIndex >= loadedDates.length - VISIBLE_DAYS}
                        >
                            <ChevronRightIcon size={16} color={currentSliderIndex >= loadedDates.length - VISIBLE_DAYS ? "#CCCCCC" : "#333"} />
                        </TouchableOpacity>
                    </View>
                </View>
                
                {/* Date selector slider */}
                <FlatList
                    ref={dateSliderRef}
                    data={loadedDates}
                    renderItem={renderDateChip}
                    keyExtractor={(item, index) => `date-${index}`}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.dateSelector}
                    getItemLayout={getItemLayout}
                    onEndReached={onEndReached}
                    onEndReachedThreshold={0.5}
                    onScrollToIndexFailed={onScrollToIndexFailed}
                    initialNumToRender={BATCH_SIZE}
                    maxToRenderPerBatch={BATCH_SIZE}
                    windowSize={3}
                    ItemSeparatorComponent={() => <View style={{ width: DATE_CHIP_GAP }} />}
                    ListFooterComponent={isLoadingMore ? (
                        <View style={styles.loadingMoreContainer}>
                            <ActivityIndicator size="small" color={primaryColor} />
                        </View>
                    ) : null}
                />
                
                {/* Time slots */}
                <View style={styles.timeSlotsContainer}>
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={primaryColor} />
                            <Text style={styles.loadingText}>{t('loading', lang)}</Text>
                        </View>
                    ) : !hasAvailableSlots ? (
                        <View style={styles.noSlotsContainer}>
                            <Text style={styles.noSlotsText}>
                                {isDayBlocked(selectedDate) 
                                    ? t('shopClosed', lang)
                                    : t('noSlotsAvailable', lang)
                                }
                            </Text>
                        </View>
                    ) : (
                        timeSlots.map((slot, index) => (
                            <TimeSlot
                                key={index}
                                slot={slot}
                                isSelected={selectedTime === slot.time}
                                onPress={onSelectTime}
                            />
                        ))
                    )}
                </View>
            </ScrollView>
            
            {/* Bottom bar - Same as BeautyServices */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
                <View style={styles.bottomBarContent}>
                    {/* Cart Button */}
                    <TouchableOpacity 
                        style={styles.cartButton} 
                        onPress={onOpenCartModal} 
                        activeOpacity={0.9}
                    >
                        <View style={styles.cartIconContainer}>
                            <ShoppingCart width={24} height={24} colorIcon={primaryColor} />
                        </View>
                        {cart.length > 0 && (
                            <View style={styles.cartBadge}>
                                <Text style={styles.cartBadgeText}>{cart.length}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    
                    {/* Continue Button */}
                    <TouchableOpacity
                        style={[
                            styles.continueButton,
                            (!selectedTime || cart.length === 0) && styles.continueButtonDisabled,
                        ]}
                        onPress={onPressContinue}
                        activeOpacity={0.9}
                        disabled={!selectedTime || cart.length === 0}
                    >
                        <Text style={styles.continueButtonText}>{t('continue', lang)}</Text>
                    </TouchableOpacity>
                </View>
            </View>
            
            {/* Calendar Modal */}
            <CalendarModal
                visible={calendarModalVisible}
                onClose={onCloseCalendar}
                selectedDate={selectedDate}
                onSelectDate={onSelectDate}
                lang={lang}
                minDate={availableDates[0]}
                maxDate={availableDates[availableDates.length - 1]}
                blockedDates={blockedDates}
            />
            
            {/* Cart Modal */}
            <CartModal
                visible={cartModalVisible}
                onClose={onCloseCartModal}
                onContinue={onCloseCartModal}
                cart={cart}
                guests={guests}
                currency="THB"
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
        borderBottomWidth: 0,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 56,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000000',
        fontFamily: 'Montserrat-SemiBold',
    },
    headerSpacer: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    calendarButtonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 20,
    },
    calendarButton: {
        width: 34,
        height: 30,
        borderWidth: 1,
        borderColor: '#D9D9D9',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    monthRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    monthText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000000',
        fontFamily: 'Montserrat-SemiBold',
    },
    monthNavigation: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    arrowDisabled: {
        opacity: 0.5,
    },
    dateSelector: {
        paddingVertical: 5,
        marginBottom: 20,
    },
    dateChip: {
        width: DATE_CHIP_WIDTH,
        height: DATE_CHIP_WIDTH,
        borderRadius: DATE_CHIP_WIDTH / 2,
        borderWidth: 1,
        borderColor: '#D9D9D9',
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
    },
    dateChipSelected: {
        backgroundColor: primaryColor,
        borderColor: primaryColor,
    },
    dateChipBlocked: {
        backgroundColor: '#F5F5F5',
        borderColor: '#E0E0E0',
    },
    dateChipDay: {
        fontSize: 12,
        fontWeight: '500',
        color: '#000000',
        fontFamily: 'Montserrat-Medium',
    },
    dateChipDaySelected: {
        color: '#FFFFFF',
    },
    dateChipDayBlocked: {
        color: '#BDBDBD',
    },
    dateChipNumber: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        fontFamily: 'Montserrat-SemiBold',
    },
    dateChipNumberSelected: {
        color: '#FFFFFF',
    },
    dateChipNumberBlocked: {
        color: '#BDBDBD',
    },
    loadingMoreContainer: {
        width: 40,
        height: DATE_CHIP_WIDTH,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timeSlotsContainer: {
        gap: 10,
    },
    timeSlot: {
        height: 35,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: '#D9D9D9',
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    timeSlotSelected: {
        borderColor: primaryColor,
        borderWidth: 1.5,
    },
    timeSlotText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#000000',
        fontFamily: 'Montserrat-SemiBold',
    },
    timeSlotTextSelected: {
        color: '#000000',
    },
    loadingContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: '#777978',
        fontFamily: 'Montserrat-Medium',
    },
    noSlotsContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    noSlotsText: {
        fontSize: 14,
        color: '#777978',
        fontFamily: 'Montserrat-Medium',
    },
    // Bottom Bar - Same as BeautyServices
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
    bottomBarContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    cartButton: {
        width: 57,
        height: 44,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.3,
        borderColor: primaryColor,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    cartIconContainer: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        width: 21,
        height: 21,
        borderRadius: 11,
        backgroundColor: primaryColor,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBadgeText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#FFFFFF',
    },
    continueButton: {
        flex: 1,
        backgroundColor: primaryColor,
        height: 44,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
    },
    continueButtonDisabled: {
        backgroundColor: '#CCCCCC',
    },
    continueButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: 'Montserrat-SemiBold',
    },
    // Calendar Modal styles
    calendarModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    calendarModalContainer: {
        width: SCREEN_WIDTH - 26,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        position: 'relative',
    },
    calendarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingHorizontal: 40,
    },
    calendarTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000000',
        fontFamily: 'Montserrat-SemiBold',
    },
    calendarCloseButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    calendarDayLabels: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    calendarDayLabel: {
        flex: 1,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '500',
        color: '#747676',
        fontFamily: 'Montserrat-Medium',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    calendarDay: {
        width: (SCREEN_WIDTH - 66) / 7,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    calendarDaySelected: {
        zIndex: 1,
    },
    calendarDayHalo: {
        position: 'absolute',
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(104, 87, 229, 0.15)',
    },
    calendarDayInner: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
    calendarDayInnerSelected: {
        backgroundColor: primaryColor,
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
    },
    calendarDayText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000000',
        fontFamily: 'Montserrat-SemiBold',
    },
    calendarDayTextOther: {
        color: '#747676',
    },
    calendarDayTextBlocked: {
        color: '#BDBDBD',
    },
    calendarDayTextSelected: {
        color: '#FFFFFF',
    },
});

export default BeautyTime;
