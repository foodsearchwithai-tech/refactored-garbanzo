import { db, userOrigin, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

interface LocationData {
  address: string;
  city: string;
  state: string;
  country?: string;
  zipCode?: string;
  latitude: number;
  longitude: number;
  geocodingSource?: string;
  geocodingAccuracy?: string;
  placeId?: string;
  formattedAddress?: string;
}

/**
 * Save or update user origin location automatically
 * This should be called whenever a user provides location data for the first time
 */
export async function saveUserOrigin(userId: string, locationData: LocationData): Promise<boolean> {
  try {
    // First check if user origin already exists
    const existingOrigin = await db
      .select()
      .from(userOrigin)
      .where(eq(userOrigin.userId, userId))
      .limit(1);

    // If origin already exists, don't update it (origin should be fixed)
    if (existingOrigin.length > 0) {
      console.log(`User origin already exists for user ${userId}, skipping update`);
      return true;
    }

    // Get user data to copy into origin table
    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userData.length === 0) {
      console.error(`User not found: ${userId}`);
      return false;
    }

    const user = userData[0];

    // Create new origin record
    await db.insert(userOrigin).values({
      userId,
      // Copy user data
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImage: user.profileImage,
      userType: user.userType,
      phone: user.phone,
      isOnboardingCompleted: user.isOnboardingCompleted,
      // Location data
      originAddress: locationData.address,
      city: locationData.city,
      state: locationData.state,
      country: locationData.country || 'India',
      zipCode: locationData.zipCode,
      latitude: locationData.latitude.toString(),
      longitude: locationData.longitude.toString(),
      // Geocoding metadata
      geocodingSource: locationData.geocodingSource || 'api',
      geocodingAccuracy: locationData.geocodingAccuracy,
      placeId: locationData.placeId,
      formattedAddress: locationData.formattedAddress,
    });

    console.log(`User origin saved successfully for user ${userId}`);
    return true;

  } catch (error) {
    console.error('Error saving user origin:', error);
    return false;
  }
}

/**
 * Get user's current location from IP or browser geolocation and save as origin
 */
export async function initializeUserOriginFromLocation(
  userId: string, 
  latitude: number, 
  longitude: number
): Promise<boolean> {
  try {
    // Use reverse geocoding to get address details
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/geocoding/reverse?lat=${latitude}&lng=${longitude}`);
    
    if (!response.ok) {
      console.error('Reverse geocoding failed');
      return false;
    }

    const geocodingData = await response.json();
    
    const locationData: LocationData = {
      address: geocodingData.formattedAddress || `${latitude}, ${longitude}`,
      city: geocodingData.city || 'Unknown City',
      state: geocodingData.state || '',
      country: geocodingData.country || 'India',
      latitude,
      longitude,
      geocodingSource: 'browser_geolocation',
      geocodingAccuracy: 'medium',
      formattedAddress: geocodingData.formattedAddress,
    };

    return await saveUserOrigin(userId, locationData);

  } catch (error) {
    console.error('Error initializing user origin from location:', error);
    return false;
  }
}

/**
 * Check if user has origin data, if not try to initialize it
 */
export async function ensureUserOrigin(userId: string): Promise<boolean> {
  try {
    const existingOrigin = await db
      .select()
      .from(userOrigin)
      .where(eq(userOrigin.userId, userId))
      .limit(1);

    return existingOrigin.length > 0;
  } catch (error) {
    console.error('Error checking user origin:', error);
    return false;
  }
}
