/**
 * Haversine distance calculation utilities
 * Based on DOCUMENTATION_FEATURE_BEAUTY.md section 4.5
 */

/**
 * Earth's radius in kilometers
 */
const EARTH_RADIUS_KM = 6371;

/**
 * Convert degrees to radians
 */
export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return EARTH_RADIUS_KM * c;
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number, locale: string = 'en'): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  
  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km`;
  }
  
  return `${Math.round(distanceKm)} km`;
}

/**
 * Check if a point is within a radius of another point
 */
export function isWithinRadius(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  radiusKm: number
): boolean {
  const distance = calculateHaversineDistance(lat1, lon1, lat2, lon2);
  return distance <= radiusKm;
}

/**
 * Sort locations by distance from a point
 */
export function sortByDistance<T extends { latitude: number; longitude: number }>(
  locations: T[],
  fromLat: number,
  fromLon: number
): Array<T & { distance: number }> {
  return locations
    .map(location => ({
      ...location,
      distance: calculateHaversineDistance(
        fromLat,
        fromLon,
        location.latitude,
        location.longitude
      ),
    }))
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Filter locations within a radius
 */
export function filterByRadius<T extends { latitude: number; longitude: number }>(
  locations: T[],
  fromLat: number,
  fromLon: number,
  radiusKm: number
): Array<T & { distance: number }> {
  return sortByDistance(locations, fromLat, fromLon).filter(
    location => location.distance <= radiusKm
  );
}

