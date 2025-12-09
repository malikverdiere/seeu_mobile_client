/**
 * Team member Firestore mappers
 */

import { DocumentSnapshot, DocumentData, timestampToDate } from '../firebase';
import { TeamMember, TeamMemberWithDisplayName } from '../../types/team.types';
import { DaySchedule } from '../../types/common.types';

/**
 * Convert Firestore document to TeamMember
 */
export function fromFirestoreTeamMember(doc: DocumentSnapshot): TeamMember | null {
  if (!doc.exists) return null;
  
  const data = doc.data();
  if (!data) return null;
  
  return {
    id: doc.id,
    uid: data.uid,
    first_name: data.first_name ?? '',
    last_name: data.last_name,
    email: data.email,
    phone_number: data.phone_number,
    photo_url: data.photo_url,
    job_title: data.job_title,
    bio: data.bio,
    services: data.services ?? [],
    monday: data.monday as DaySchedule,
    tuesday: data.tuesday as DaySchedule,
    wednesday: data.wednesday as DaySchedule,
    thursday: data.thursday as DaySchedule,
    friday: data.friday as DaySchedule,
    saturday: data.saturday as DaySchedule,
    sunday: data.sunday as DaySchedule,
    created_time: data.created_time,
  };
}

/**
 * Convert TeamMember to Firestore document data
 */
export function toFirestoreTeamMember(member: Partial<TeamMember>): DocumentData {
  const data: DocumentData = {};
  
  if (member.uid !== undefined) data.uid = member.uid;
  if (member.first_name !== undefined) data.first_name = member.first_name;
  if (member.last_name !== undefined) data.last_name = member.last_name;
  if (member.email !== undefined) data.email = member.email;
  if (member.phone_number !== undefined) data.phone_number = member.phone_number;
  if (member.photo_url !== undefined) data.photo_url = member.photo_url;
  if (member.job_title !== undefined) data.job_title = member.job_title;
  if (member.bio !== undefined) data.bio = member.bio;
  if (member.services !== undefined) data.services = member.services;
  if (member.monday !== undefined) data.monday = member.monday;
  if (member.tuesday !== undefined) data.tuesday = member.tuesday;
  if (member.wednesday !== undefined) data.wednesday = member.wednesday;
  if (member.thursday !== undefined) data.thursday = member.thursday;
  if (member.friday !== undefined) data.friday = member.friday;
  if (member.saturday !== undefined) data.saturday = member.saturday;
  if (member.sunday !== undefined) data.sunday = member.sunday;
  
  return data;
}

/**
 * Add display name to team member
 */
export function toTeamMemberWithDisplayName(member: TeamMember): TeamMemberWithDisplayName {
  const displayName = member.last_name 
    ? `${member.first_name} ${member.last_name}`.trim()
    : member.first_name;
  
  return {
    ...member,
    displayName,
  };
}

