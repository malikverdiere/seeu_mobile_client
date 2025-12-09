/**
 * Team Service - Data Access Layer
 */

import {
  collection,
  doc,
  query,
  orderBy,
  getDocs,
  getDoc,
} from '@react-native-firebase/firestore';
import { firestore, COLLECTIONS } from '../firestore/firebase';
import { 
  fromFirestoreTeamMember, 
  toTeamMemberWithDisplayName 
} from '../firestore/mappers/team.mapper';
import { 
  TeamMember, 
  TeamMemberWithDisplayName, 
  MembersByService 
} from '../types/team.types';
import { GuestService } from '../types/service.types';

/**
 * Get all team members for a shop
 */
export async function getTeamMembersForShop(shopId: string): Promise<TeamMember[]> {
  const teamsRef = collection(
    firestore,
    COLLECTIONS.SHOPS,
    shopId,
    COLLECTIONS.TEAMS
  );
  
  const q = query(teamsRef, orderBy('first_name', 'asc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs
    .map(doc => fromFirestoreTeamMember(doc))
    .filter((member): member is TeamMember => member !== null);
}

/**
 * Get team members with display names
 */
export async function getTeamMembersWithDisplayNames(
  shopId: string
): Promise<TeamMemberWithDisplayName[]> {
  const members = await getTeamMembersForShop(shopId);
  return members.map(toTeamMemberWithDisplayName);
}

/**
 * Get a specific team member by ID
 */
export async function getTeamMemberById(
  shopId: string,
  memberId: string
): Promise<TeamMember | null> {
  const memberRef = doc(
    firestore,
    COLLECTIONS.SHOPS,
    shopId,
    COLLECTIONS.TEAMS,
    memberId
  );
  
  const snapshot = await getDoc(memberRef);
  return fromFirestoreTeamMember(snapshot);
}

/**
 * Get team members who can perform a specific service
 * Based on documentation section 5.4
 */
export function getMembersForService(
  teamMembers: TeamMember[],
  serviceId: string
): TeamMember[] {
  return teamMembers.filter(member => 
    member.services.includes(serviceId)
  );
}

/**
 * Get team members who can perform all selected services
 * Based on documentation section 5.4 - memberAvailability.ts
 */
export function getAvailableMembersForServices(
  teamMembers: TeamMember[],
  guestServices: GuestService[]
): TeamMember[] {
  return teamMembers.filter(member =>
    member.services.some(memberServiceId =>
      guestServices.some(gs => gs.id === memberServiceId)
    )
  );
}

/**
 * Get members grouped by service ID
 */
export function getMembersByService(
  teamMembers: TeamMember[],
  serviceIds: string[]
): MembersByService {
  const result: MembersByService = {};
  
  serviceIds.forEach(serviceId => {
    result[serviceId] = getMembersForService(teamMembers, serviceId);
  });
  
  return result;
}

/**
 * Get available members for services without conflicts
 * Based on documentation section 5.4
 * Checks that there are enough members available when multiple guests book
 */
export function getAvailableMembersByServiceWithoutConflict(
  teamMembers: TeamMember[],
  guestServices: GuestService[],
  numberOfGuests: number
): MembersByService {
  const serviceIds = [...new Set(guestServices.map(gs => gs.id))];
  const membersByService = getMembersByService(teamMembers, serviceIds);
  
  // For each service, check if there are enough unique members
  // to handle the number of guests at the same time
  const result: MembersByService = {};
  
  serviceIds.forEach(serviceId => {
    const availableMembers = membersByService[serviceId] || [];
    
    // If there are enough members for the number of guests
    if (availableMembers.length >= numberOfGuests) {
      result[serviceId] = availableMembers;
    } else {
      // Not enough members - return what we have
      // The slot validation will mark this as unavailable if needed
      result[serviceId] = availableMembers;
    }
  });
  
  return result;
}

