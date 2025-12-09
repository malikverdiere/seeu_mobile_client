/**
 * Guest Controller
 * Based on DOCUMENTATION_FEATURE_BEAUTY.md section 5.1
 * 
 * Manages guests and their selected services
 * This is a pure class (no React dependencies)
 */

import { Guest, GuestService, Service, ServiceOption, ServiceAddOn } from '../../data/types/service.types';
import { TeamMember } from '../../data/types/team.types';

/**
 * Guest Controller Class
 * Manages the state of guests and their service selections
 */
export class GuestController {
  private guests: Guest[] = [];
  private nextGuestNumber: number = 1;
  
  constructor() {
    // Initialize with the main user ("Me")
    this.guests = [{
      id: 'guest_0',
      name: 'Me',
      services: [],
      isActive: true,
    }];
  }
  
  /**
   * Add a new guest
   */
  addNewGuest(): string {
    // Deactivate current active guest
    this.guests = this.guests.map(g => ({ ...g, isActive: false }));
    
    const guestId = `guest_${this.nextGuestNumber}`;
    const guestName = `Guest ${this.nextGuestNumber}`;
    
    this.guests.push({
      id: guestId,
      name: guestName,
      services: [],
      isActive: true,
    });
    
    this.nextGuestNumber++;
    
    return guestId;
  }
  
  /**
   * Set the active guest
   */
  setActiveGuest(guestId: string): void {
    this.guests = this.guests.map(g => ({
      ...g,
      isActive: g.id === guestId,
    }));
  }
  
  /**
   * Get the currently active guest
   */
  getActiveGuest(): Guest | null {
    return this.guests.find(g => g.isActive) ?? null;
  }
  
  /**
   * Get a guest by ID
   */
  getGuest(guestId: string): Guest | null {
    return this.guests.find(g => g.id === guestId) ?? null;
  }
  
  /**
   * Get all guests
   */
  getAllGuests(): Guest[] {
    return [...this.guests];
  }
  
  /**
   * Get number of guests
   */
  getGuestCount(): number {
    return this.guests.length;
  }
  
  /**
   * Create a GuestService from a Service
   */
  createGuestService(
    guestId: string,
    guestName: string,
    service: Service,
    selectedOption?: ServiceOption,
    selectedAddOns?: ServiceAddOn[],
    teamMember?: TeamMember
  ): GuestService {
    // Calculate total price
    let price = service.price;
    let promotionPrice = service.promotionPrice;
    let duration = service.duration;
    
    // Apply option if selected
    if (selectedOption) {
      price = selectedOption.price;
      promotionPrice = selectedOption.promotionPrice;
      duration = selectedOption.duration;
    }
    
    // Add add-on prices and durations
    let totalPrice = promotionPrice ?? price;
    if (selectedAddOns) {
      selectedAddOns.forEach(addOn => {
        const addOnPrice = addOn.promotionPrice ?? addOn.price;
        totalPrice += addOnPrice * addOn.quantity;
        duration += addOn.duration * addOn.quantity;
      });
    }
    
    return {
      id: service.id,
      guestId,
      guestName,
      name: service.name,
      duration,
      price,
      promotionPrice,
      selectedOption,
      selectedAddOns,
      teamMemberId: teamMember?.id,
      teamMemberName: teamMember ? `${teamMember.first_name} ${teamMember.last_name ?? ''}`.trim() : undefined,
      totalPrice,
      categoryId: service.categoryId,
      colorService: service.colorService,
      people: service.people,
      loyaltyPoint: service.loyaltyPoint,
    };
  }
  
  /**
   * Add a service to the active guest
   */
  addServiceToActiveGuest(service: GuestService): void {
    const activeGuest = this.getActiveGuest();
    if (!activeGuest) return;
    
    // Check if service already exists for this guest
    const existingIndex = activeGuest.services.findIndex(s => s.id === service.id);
    
    if (existingIndex >= 0) {
      // Replace existing service
      activeGuest.services[existingIndex] = service;
    } else {
      // Add new service
      activeGuest.services.push(service);
    }
    
    // Update guests array
    this.guests = this.guests.map(g => 
      g.id === activeGuest.id ? activeGuest : g
    );
  }
  
  /**
   * Add a service from a Service object
   */
  addService(
    service: Service,
    selectedOption?: ServiceOption,
    selectedAddOns?: ServiceAddOn[],
    teamMember?: TeamMember
  ): void {
    const activeGuest = this.getActiveGuest();
    if (!activeGuest) return;
    
    const guestService = this.createGuestService(
      activeGuest.id,
      activeGuest.name,
      service,
      selectedOption,
      selectedAddOns,
      teamMember
    );
    
    this.addServiceToActiveGuest(guestService);
  }
  
  /**
   * Remove a service from the active guest
   */
  removeServiceFromActiveGuest(serviceId: string): void {
    const activeGuest = this.getActiveGuest();
    if (!activeGuest) return;
    
    activeGuest.services = activeGuest.services.filter(s => s.id !== serviceId);
    
    this.guests = this.guests.map(g => 
      g.id === activeGuest.id ? activeGuest : g
    );
  }
  
  /**
   * Remove a guest
   */
  removeGuest(guestId: string): void {
    // Can't remove the main guest (Me)
    if (guestId === 'guest_0') return;
    
    const removedGuest = this.guests.find(g => g.id === guestId);
    const wasActive = removedGuest?.isActive;
    
    this.guests = this.guests.filter(g => g.id !== guestId);
    
    // If removed guest was active, activate the main guest
    if (wasActive && this.guests.length > 0) {
      this.guests[0].isActive = true;
    }
  }
  
  /**
   * Get all services from all guests
   */
  getAllServices(): GuestService[] {
    return this.guests.flatMap(g => g.services);
  }
  
  /**
   * Get total price across all guests
   */
  getTotalPrice(): number {
    return this.getAllServices().reduce((sum, s) => sum + s.totalPrice, 0);
  }
  
  /**
   * Get total duration across all guests (max of all guests)
   */
  getTotalDuration(): number {
    if (this.guests.length === 0) return 0;
    
    const durationsByGuest = this.guests.map(guest =>
      guest.services.reduce((sum, service) => sum + service.duration, 0)
    );
    
    return Math.max(...durationsByGuest, 0);
  }
  
  /**
   * Check if any guest has services
   */
  hasServices(): boolean {
    return this.guests.some(g => g.services.length > 0);
  }
  
  /**
   * Get services count
   */
  getServicesCount(): number {
    return this.getAllServices().length;
  }
  
  /**
   * Update member for a service
   */
  updateServiceMember(guestId: string, serviceId: string, member: TeamMember): void {
    const guest = this.getGuest(guestId);
    if (!guest) return;
    
    const serviceIndex = guest.services.findIndex(s => s.id === serviceId);
    if (serviceIndex < 0) return;
    
    guest.services[serviceIndex] = {
      ...guest.services[serviceIndex],
      teamMemberId: member.id,
      teamMemberName: `${member.first_name} ${member.last_name ?? ''}`.trim(),
    };
    
    this.guests = this.guests.map(g => 
      g.id === guestId ? guest : g
    );
  }
  
  /**
   * Update add-ons for a service
   */
  updateServiceAddOns(guestId: string, serviceId: string, addOns: ServiceAddOn[]): void {
    const guest = this.getGuest(guestId);
    if (!guest) return;
    
    const serviceIndex = guest.services.findIndex(s => s.id === serviceId);
    if (serviceIndex < 0) return;
    
    const service = guest.services[serviceIndex];
    
    // Recalculate total price and duration
    let totalPrice = service.promotionPrice ?? service.price;
    let duration = service.selectedOption?.duration ?? service.duration;
    
    addOns.forEach(addOn => {
      const addOnPrice = addOn.promotionPrice ?? addOn.price;
      totalPrice += addOnPrice * addOn.quantity;
      duration += addOn.duration * addOn.quantity;
    });
    
    guest.services[serviceIndex] = {
      ...service,
      selectedAddOns: addOns,
      totalPrice,
      duration,
    };
    
    this.guests = this.guests.map(g => 
      g.id === guestId ? guest : g
    );
  }
  
  /**
   * Clear all services from all guests
   */
  clearAllServices(): void {
    this.guests = this.guests.map(g => ({
      ...g,
      services: [],
    }));
  }
  
  /**
   * Reset to initial state
   */
  reset(): void {
    this.guests = [{
      id: 'guest_0',
      name: 'Me',
      services: [],
      isActive: true,
    }];
    this.nextGuestNumber = 1;
  }
  
  /**
   * Serialize data for storage/URL
   * Based on documentation section 5.2
   */
  getDataForUrl(): string {
    // Format: guestName-serviceId-optionId-memberId-addonId:qty.addonId2:qty2|serviceId2-...
    // Guests separated by _
    return this.guests
      .filter(g => g.services.length > 0)
      .map(guest => {
        const servicesStr = guest.services
          .map(service => {
            let str = `${service.id}`;
            if (service.selectedOption) {
              str += `-${service.selectedOption.id}`;
            } else {
              str += '-';
            }
            if (service.teamMemberId) {
              str += `-${service.teamMemberId}`;
            } else {
              str += '-';
            }
            if (service.selectedAddOns && service.selectedAddOns.length > 0) {
              const addOnsStr = service.selectedAddOns
                .map(a => `${a.id}:${a.quantity}`)
                .join('.');
              str += `-${addOnsStr}`;
            }
            return str;
          })
          .join('|');
        
        return `${guest.name}-${servicesStr}`;
      })
      .join('_');
  }
  
  /**
   * Restore from URL data
   * Based on documentation section 5.2
   */
  restoreFromUrl(dataString: string, servicesMap: Map<string, Service>): void {
    // TODO: Implement URL parsing logic
    // This is complex and depends on the exact URL format used
    console.log('TODO: Implement restoreFromUrl', dataString, servicesMap);
  }
}

/**
 * Create a new GuestController instance
 */
export function createGuestController(): GuestController {
  return new GuestController();
}

