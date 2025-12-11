/**
 * useGuestController - Hook pour gérer les guests (invités) et leurs services
 * 
 * Chaque guest peut sélectionner ses propres services indépendamment.
 * Le système gère automatiquement la disponibilité des membres d'équipe
 * pour éviter les conflits (pas plus de guests que de membres disponibles pour un service).
 */

import { useState, useCallback, useMemo } from 'react';

// ============ TYPES ============
/**
 * @typedef {Object} GuestService
 * @property {string} id - Service ID
 * @property {string} name - Service name
 * @property {number} price - Original price
 * @property {number|null} promotionPrice - Promo price if any
 * @property {number} duration - Duration in minutes
 * @property {string} durationText - Formatted duration
 * @property {Object|null} selectedOption - Selected option
 * @property {Array} selectedAddOns - Selected add-ons
 * @property {string|null} teamMemberId - Assigned team member ID
 * @property {string|null} teamMemberName - Assigned team member name
 * @property {number} totalPrice - Total price with options/addons
 * @property {string} guestId - ID of the guest who selected this service
 */

/**
 * @typedef {Object} Guest
 * @property {string} id - Guest ID ('me' or 'guest-1', 'guest-2', etc.)
 * @property {string} name - Display name ('Me', 'Guest 1', etc.)
 * @property {Array<GuestService>} services - Services selected by this guest
 */

/**
 * @typedef {Object} TeamMember
 * @property {string} id - Member ID
 * @property {string} name - Member name
 * @property {Array<string>} services - IDs of services this member can perform
 */

// ============ HELPER FUNCTIONS ============

/**
 * Get team members who can perform a specific service
 * @param {string} serviceId 
 * @param {Array<TeamMember>} teamMembers 
 * @returns {Array<TeamMember>}
 */
export const getTeamMembersForService = (serviceId, teamMembers) => {
    if (!teamMembers || teamMembers.length === 0) return [];
    return teamMembers.filter(member => 
        member.services && member.services.includes(serviceId)
    );
};

/**
 * Get all services from all guests (flattened with guestId)
 * @param {Array<Guest>} guests 
 * @returns {Array<GuestService>}
 */
export const getAllGuestsServices = (guests) => {
    const allServices = [];
    guests.forEach(guest => {
        guest.services.forEach(service => {
            allServices.push({
                ...service,
                guestId: guest.id,
            });
        });
    });
    return allServices;
};

/**
 * Group services by service ID for availability calculation
 * @param {Array<GuestService>} allGuestsServices 
 * @param {Array<TeamMember>} teamMembers 
 * @returns {{ groupedArray: Array, groupedObjects: Array }}
 */
export const buildServiceGroup = (allGuestsServices, teamMembers) => {
    // Group services by ID
    const grouped = {};
    allGuestsServices.forEach(service => {
        if (!grouped[service.id]) {
            grouped[service.id] = [];
        }
        grouped[service.id].push(service);
    });
    
    const groupedArray = Object.values(grouped);
    
    const groupedObjects = groupedArray.map(group => ({
        id: group[0].id,
        services: group,
        maxBook: getTeamMembersForService(group[0].id, teamMembers).length,
        availableTeamMembers: getTeamMembersForService(group[0].id, teamMembers),
        guests: group.map(s => s.guestId),
    }));
    
    return { groupedArray, groupedObjects };
};

/**
 * Propagate member removal restrictions
 * When a guest needs a specific member, remove that member from other guests' options
 * @param {{ groupedObjects: Array }} servicesGrouped 
 * @param {Record<string, string[]>} guestsAssigned 
 */
const propagateMemberRemoval = (servicesGrouped, guestsAssigned) => {
    let changed;
    
    do {
        changed = false;
        
        for (const group of servicesGrouped.groupedObjects) {
            for (const guestId of group.guests) {
                // Members available for this guest
                const availableHere = group.availableTeamMembers.filter(
                    m => guestsAssigned[guestId]?.includes(m.id)
                );
                
                let toBanNow = [];
                let protectIds = [];
                
                // CASE 1: Exactly enough members for all guests in the group
                // → Block these members for other guests (outside the group)
                if (availableHere.length === group.guests.length) {
                    toBanNow = availableHere.map(m => m.id);
                    protectIds = group.guests; // Protect the entire group
                }
                // CASE 2: Only one member available for this guest (but not the only one for the service)
                // → Block this member for other guests (except current)
                else if (availableHere.length === 1 && availableHere.length !== group.availableTeamMembers.length) {
                    toBanNow = availableHere.map(m => m.id);
                    protectIds = [guestId]; // Protect only this guest
                }
                
                // Apply restrictions
                for (const otherGuestId of Object.keys(guestsAssigned)) {
                    if (protectIds.includes(otherGuestId)) continue; // Don't touch protected
                    
                    const before = guestsAssigned[otherGuestId].length;
                    guestsAssigned[otherGuestId] = guestsAssigned[otherGuestId].filter(
                        id => !toBanNow.includes(id)
                    );
                    if (guestsAssigned[otherGuestId].length !== before) {
                        changed = true;
                    }
                }
            }
        }
    } while (changed); // Repeat until stabilization
};

/**
 * Check if a service is fully booked (no available team members for active guest)
 * @param {string} serviceId 
 * @param {Array<Guest>} guests 
 * @param {string} activeGuestId 
 * @param {Array<TeamMember>} teamMembers 
 * @returns {boolean} true = blocked, false = available
 */
export const isServiceFullyBooked = (serviceId, guests, activeGuestId, teamMembers) => {
    if (!activeGuestId) return true;
    if (!teamMembers || teamMembers.length === 0) return false; // No team = no restriction
    
    // 1. Get members who can do this service
    const availableTeamMembersForService = getTeamMembersForService(serviceId, teamMembers);
    
    // 2. If no member can do the service → unavailable
    if (availableTeamMembersForService.length === 0) {
        return true;
    }
    
    // 3. Get all services from all guests
    const allGuestsServices = getAllGuestsServices(guests);
    
    // 4. Build service groups
    const servicesGrouped = buildServiceGroup(allGuestsServices, teamMembers);
    
    // 5. Initialize: all guests can have all members
    const guestsAssigned = {};
    guests.forEach(guest => {
        guestsAssigned[guest.id] = teamMembers.map(m => m.id);
    });
    
    // 6. Propagate restrictions
    propagateMemberRemoval(servicesGrouped, guestsAssigned);
    
    // 7. Filter available members for active guest
    const availableMembers = availableTeamMembersForService.filter(
        member => guestsAssigned[activeGuestId]?.includes(member.id)
    );
    
    // If no members available → service blocked
    return availableMembers.length <= 0;
};

/**
 * Get available team members for a service for the active guest
 * @param {string} serviceId 
 * @param {Array<Guest>} guests 
 * @param {string} activeGuestId 
 * @param {Array<TeamMember>} teamMembers 
 * @returns {Array<TeamMember>}
 */
export const getAvailableTeamMembersForGuest = (serviceId, guests, activeGuestId, teamMembers) => {
    if (!activeGuestId || !teamMembers || teamMembers.length === 0) return teamMembers || [];
    
    const availableTeamMembersForService = getTeamMembersForService(serviceId, teamMembers);
    
    if (availableTeamMembersForService.length === 0) {
        return [];
    }
    
    const allGuestsServices = getAllGuestsServices(guests);
    const servicesGrouped = buildServiceGroup(allGuestsServices, teamMembers);
    
    const guestsAssigned = {};
    guests.forEach(guest => {
        guestsAssigned[guest.id] = teamMembers.map(m => m.id);
    });
    
    propagateMemberRemoval(servicesGrouped, guestsAssigned);
    
    return availableTeamMembersForService.filter(
        member => guestsAssigned[activeGuestId]?.includes(member.id)
    );
};

// ============ MAIN HOOK ============

/**
 * Hook to manage guests and their services
 * @param {Array<Object>} initialCart - Initial cart items (will be assigned to 'me' guest)
 * @returns {Object} Guest controller methods and state
 */
const useGuestController = (initialCart = []) => {
    // Initialize with 'me' guest and initial cart services
    const [guests, setGuests] = useState(() => [{
        id: 'me',
        name: 'Me',
        services: initialCart.map(item => ({ ...item, guestId: 'me' })),
    }]);
    
    const [activeGuestId, setActiveGuestId] = useState('me');
    
    // ============ GETTERS ============
    
    /**
     * Get all guests
     */
    const getAllGuests = useCallback(() => guests, [guests]);
    
    /**
     * Get the active guest
     */
    const getActiveGuest = useCallback(() => {
        return guests.find(g => g.id === activeGuestId) || null;
    }, [guests, activeGuestId]);
    
    /**
     * Get services of the active guest
     */
    const getActiveGuestServices = useCallback(() => {
        const activeGuest = guests.find(g => g.id === activeGuestId);
        return activeGuest?.services || [];
    }, [guests, activeGuestId]);
    
    /**
     * Get all services from all guests (flattened)
     */
    const getAllServices = useCallback(() => {
        return getAllGuestsServices(guests);
    }, [guests]);
    
    /**
     * Get total number of services across all guests
     */
    const getTotalServicesCount = useCallback(() => {
        return guests.reduce((sum, guest) => sum + guest.services.length, 0);
    }, [guests]);
    
    /**
     * Check if a service is in the active guest's cart
     */
    const isServiceInCart = useCallback((serviceId) => {
        const activeGuest = guests.find(g => g.id === activeGuestId);
        return activeGuest?.services.some(s => s.id === serviceId) || false;
    }, [guests, activeGuestId]);
    
    /**
     * Get a service from the active guest's cart
     */
    const getServiceFromCart = useCallback((serviceId) => {
        const activeGuest = guests.find(g => g.id === activeGuestId);
        return activeGuest?.services.find(s => s.id === serviceId) || null;
    }, [guests, activeGuestId]);
    
    // ============ SETTERS ============
    
    /**
     * Set the active guest by ID
     */
    const setActiveGuest = useCallback((guestId) => {
        if (guests.some(g => g.id === guestId)) {
            setActiveGuestId(guestId);
        }
    }, [guests]);
    
    /**
     * Add a new guest
     * @returns {string} New guest ID
     */
    const addGuest = useCallback(() => {
        const guestNumber = guests.filter(g => g.id !== 'me').length + 1;
        const newGuest = {
            id: `guest-${guestNumber}`,
            name: `Guest ${guestNumber}`,
            services: [],
        };
        
        setGuests(prev => [...prev, newGuest]);
        return newGuest.id;
    }, [guests]);
    
    /**
     * Add a new guest and immediately activate it
     * @returns {string} New guest ID
     */
    const addGuestAndActivate = useCallback(() => {
        const guestNumber = guests.filter(g => g.id !== 'me').length + 1;
        const newGuestId = `guest-${guestNumber}`;
        const newGuest = {
            id: newGuestId,
            name: `Guest ${guestNumber}`,
            services: [],
        };
        
        setGuests(prev => [...prev, newGuest]);
        setActiveGuestId(newGuestId); // Activate immediately
        return newGuestId;
    }, [guests]);
    
    /**
     * Remove a guest by ID
     */
    const removeGuest = useCallback((guestId) => {
        if (guestId === 'me') return; // Can't remove 'me'
        
        setGuests(prev => prev.filter(g => g.id !== guestId));
        
        // If removed guest was active, switch to 'me'
        if (activeGuestId === guestId) {
            setActiveGuestId('me');
        }
    }, [activeGuestId]);
    
    /**
     * Add a service to the active guest's cart
     */
    const addService = useCallback((service) => {
        setGuests(prev => prev.map(guest => {
            if (guest.id !== activeGuestId) return guest;
            
            // Check if service already exists
            const existingIndex = guest.services.findIndex(s => s.id === service.id);
            
            if (existingIndex >= 0) {
                // Update existing service
                const updatedServices = [...guest.services];
                updatedServices[existingIndex] = { ...service, guestId: guest.id };
                return { ...guest, services: updatedServices };
            }
            
            // Add new service
            return {
                ...guest,
                services: [...guest.services, { ...service, guestId: guest.id }],
            };
        }));
    }, [activeGuestId]);
    
    /**
     * Remove a service from the active guest's cart
     */
    const removeService = useCallback((serviceId) => {
        setGuests(prev => prev.map(guest => {
            if (guest.id !== activeGuestId) return guest;
            return {
                ...guest,
                services: guest.services.filter(s => s.id !== serviceId),
            };
        }));
    }, [activeGuestId]);
    
    /**
     * Update a service in the active guest's cart
     */
    const updateService = useCallback((serviceId, updates) => {
        setGuests(prev => prev.map(guest => {
            if (guest.id !== activeGuestId) return guest;
            return {
                ...guest,
                services: guest.services.map(s => 
                    s.id === serviceId ? { ...s, ...updates } : s
                ),
            };
        }));
    }, [activeGuestId]);
    
    /**
     * Clear all services for the active guest
     */
    const clearActiveGuestServices = useCallback(() => {
        setGuests(prev => prev.map(guest => {
            if (guest.id !== activeGuestId) return guest;
            return { ...guest, services: [] };
        }));
    }, [activeGuestId]);
    
    /**
     * Clear all services for all guests
     */
    const clearAllServices = useCallback(() => {
        setGuests(prev => prev.map(guest => ({ ...guest, services: [] })));
    }, []);
    
    /**
     * Replace all guests (for restoring state from navigation)
     */
    const setAllGuests = useCallback((newGuests) => {
        setGuests(newGuests);
        // Ensure active guest exists
        if (!newGuests.some(g => g.id === activeGuestId)) {
            setActiveGuestId('me');
        }
    }, [activeGuestId]);
    
    // ============ AVAILABILITY CHECKS ============
    
    /**
     * Check if a service is fully booked for the active guest
     */
    const checkServiceAvailability = useCallback((serviceId, teamMembers) => {
        return !isServiceFullyBooked(serviceId, guests, activeGuestId, teamMembers);
    }, [guests, activeGuestId]);
    
    /**
     * Get available team members for a service for the active guest
     */
    const getAvailableMembers = useCallback((serviceId, teamMembers) => {
        return getAvailableTeamMembersForGuest(serviceId, guests, activeGuestId, teamMembers);
    }, [guests, activeGuestId]);
    
    // ============ COMPUTED VALUES ============
    
    /**
     * Flat cart array (all services from all guests)
     */
    const cart = useMemo(() => getAllGuestsServices(guests), [guests]);
    
    /**
     * Cart item IDs for the active guest
     */
    const activeGuestCartIds = useMemo(() => {
        const activeGuest = guests.find(g => g.id === activeGuestId);
        return activeGuest?.services.map(s => s.id) || [];
    }, [guests, activeGuestId]);
    
    /**
     * Total price across all guests
     */
    const totalPrice = useMemo(() => {
        return cart.reduce((sum, service) => sum + (service.totalPrice || service.promotionPrice || service.price || 0), 0);
    }, [cart]);
    
    /**
     * Total services count
     */
    const totalServicesCount = useMemo(() => cart.length, [cart]);
    
    // ============ SERIALIZATION ============
    
    /**
     * Get data for URL params (for navigation)
     */
    const getDataForUrl = useCallback(() => {
        try {
            return encodeURIComponent(JSON.stringify(guests));
        } catch (e) {
            return '';
        }
    }, [guests]);
    
    /**
     * Restore data from URL params
     */
    const restoreFromUrl = useCallback((encodedData) => {
        try {
            const decoded = JSON.parse(decodeURIComponent(encodedData));
            if (Array.isArray(decoded) && decoded.length > 0) {
                setGuests(decoded);
            }
        } catch (e) {
            console.error('Failed to restore guests from URL:', e);
        }
    }, []);
    
    return {
        // State
        guests,
        activeGuestId,
        cart,
        activeGuestCartIds,
        totalPrice,
        totalServicesCount,
        
        // Getters
        getAllGuests,
        getActiveGuest,
        getActiveGuestServices,
        getAllServices,
        getTotalServicesCount,
        isServiceInCart,
        getServiceFromCart,
        
        // Setters
        setActiveGuest,
        addGuest,
        addGuestAndActivate,
        removeGuest,
        addService,
        removeService,
        updateService,
        clearActiveGuestServices,
        clearAllServices,
        setAllGuests,
        
        // Availability
        checkServiceAvailability,
        getAvailableMembers,
        
        // Serialization
        getDataForUrl,
        restoreFromUrl,
    };
};

export default useGuestController;

