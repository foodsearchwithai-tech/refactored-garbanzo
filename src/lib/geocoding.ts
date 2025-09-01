// Geocoding service for converting addresses to coordinates using Google Maps API

interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress?: string;
}

interface GoogleGeocodingResponse {
  results: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    place_id: string;
  }>;
  status: string;
}

/**
 * Geocode an address using Google Maps Geocoding API
 * @param address The full address string to geocode
 * @param apiKey Google Maps API key (optional, will use environment variable if not provided)
 * @returns Promise with latitude, longitude and formatted address
 */
export async function geocodeAddress(
  address: string,
  apiKey?: string
): Promise<GeocodingResult | null> {
  try {
    const key = apiKey || process.env.GOOGLE_MAPS_API_KEY;
    
    if (!key) {
      console.warn('Google Maps API key not configured. Geocoding will be skipped.');
      return null;
    }

    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${key}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Geocoding API request failed:', response.statusText);
      return null;
    }

    const data: GoogleGeocodingResponse = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
      };
    } else if (data.status === 'ZERO_RESULTS') {
      console.warn('No geocoding results found for address:', address);
      return null;
    } else {
      console.error('Geocoding API error:', data.status);
      return null;
    }
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}

/**
 * Build a full address string from components
 * @param components Address components
 * @returns Full address string
 */
export function buildAddressString(components: {
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}): string {
  const parts = [
    components.address,
    components.city,
    components.state,
    components.zipCode,
    components.country || 'USA'
  ].filter(Boolean);
  
  return parts.join(', ');
}

/**
 * Calculate distance between two coordinates in kilometers
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

/**
 * Validate coordinates
 * @param lat Latitude
 * @param lng Longitude
 * @returns True if coordinates are valid
 */
export function isValidCoordinates(lat: number | null | undefined, lng: number | null | undefined): boolean {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return false;
  }
  
  // Valid latitude range: -90 to 90
  // Valid longitude range: -180 to 180
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
