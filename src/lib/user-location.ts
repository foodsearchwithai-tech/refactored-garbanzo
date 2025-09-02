import { db, userOrigin, userLocations, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { clerkClient } from '@clerk/nextjs/server';

interface LocationData {
  address: string;
  city: string;
  state: string;
  country?: string;
  zipCode?: string;
  latitude: number;
  longitude: number;
  formattedAddress?: string;
  placeId?: string;
}

/**
 * Ensure user exists in database by creating from Clerk data if needed
 */
async function ensureUserExists(userId: string) {
  try {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length > 0) {
      return { success: true, data: existingUser[0] };
    }

    // Get user data from Clerk
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);

    if (!clerkUser) {
      return { success: false, message: 'User not found in Clerk' };
    }

    try {
      // Try to create user record
      const newUser = await db
        .insert(users)
        .values({
          id: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          firstName: clerkUser.firstName || '',
          lastName: clerkUser.lastName || '',
          profileImage: clerkUser.imageUrl || '',
          userType: 'customer', // Default to customer, will be updated during onboarding
          phone: '',
          isOnboardingCompleted: false,
        })
        .returning();

      console.log(`✅ Created user record for ${userId} from Clerk data`);
      return { success: true, data: newUser[0] };
      
    } catch (insertError: unknown) {
      // If user already exists (race condition), just fetch and return
      if (insertError && typeof insertError === 'object' && 'code' in insertError && insertError.code === '23505') { // Unique constraint violation
        console.log(`User ${userId} already exists, fetching existing record`);
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        
        if (existingUser.length > 0) {
          return { success: true, data: existingUser[0] };
        }
      }
      throw insertError; // Re-throw if it's a different error
    }

  } catch (error) {
    console.error('Error ensuring user exists:', error);
    return { success: false, message: 'Failed to ensure user exists', error };
  }
}

export class UserLocationService {
  /**
   * Set user origin - Only called once per user, never updates
   */
  static async setUserOrigin(userId: string, locationData: LocationData) {
    try {
      // Check if origin already exists
      const existingOrigin = await db
        .select()
        .from(userOrigin)
        .where(eq(userOrigin.userId, userId))
        .limit(1);

      if (existingOrigin.length > 0) {
        console.log(`User origin already exists for user ${userId}`);
        return { success: false, message: 'User origin already set', data: existingOrigin[0] };
      }

      // Ensure user exists in database (create from Clerk if needed)
      const userResult = await ensureUserExists(userId);
      if (!userResult.success || !userResult.data) {
        return { success: false, message: userResult.message || 'User not found' };
      }

      const user = userResult.data;

      // Create origin record
      const originData = {
        userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
        userType: user.userType,
        phone: user.phone,
        isOnboardingCompleted: user.isOnboardingCompleted,
        originAddress: locationData.address,
        city: locationData.city,
        state: locationData.state,
        country: locationData.country || 'India',
        zipCode: locationData.zipCode,
        latitude: locationData.latitude.toString(),
        longitude: locationData.longitude.toString(),
        geocodingSource: 'api',
        geocodingAccuracy: 'high',
        placeId: locationData.placeId,
        formattedAddress: locationData.formattedAddress,
      };

      const created = await db
        .insert(userOrigin)
        .values(originData)
        .returning();

      return { success: true, message: 'User origin set successfully', data: created[0] };
    } catch (error) {
      console.error('Error setting user origin:', error);
      return { success: false, message: 'Failed to set user origin', error };
    }
  }

  /**
   * Update user current location - One record per user, gets updated each time
   */
  static async updateUserLocation(userId: string, locationData: LocationData, type: 'home' | 'work' | 'frequent' = 'frequent') {
    try {
      // Ensure user exists in database first
      const userResult = await ensureUserExists(userId);
      if (!userResult.success || !userResult.data) {
        return { success: false, message: userResult.message || 'User not found' };
      }

      // Check if user location already exists
      const existingLocation = await db
        .select()
        .from(userLocations)
        .where(eq(userLocations.userId, userId))
        .limit(1);

      const locationRecord = {
        userId,
        type,
        address: locationData.address,
        city: locationData.city,
        state: locationData.state,
        zipCode: locationData.zipCode || '',
        latitude: locationData.latitude.toString(),
        longitude: locationData.longitude.toString(),
      };

      if (existingLocation.length > 0) {
        // Update existing record
        const updated = await db
          .update(userLocations)
          .set({
            ...locationRecord,
            // Don't update createdAt, it stays the same
          })
          .where(eq(userLocations.userId, userId))
          .returning();

        return { success: true, message: 'User location updated successfully', data: updated[0] };
      } else {
        // Create new record
        const created = await db
          .insert(userLocations)
          .values(locationRecord)
          .returning();

        return { success: true, message: 'User location created successfully', data: created[0] };
      }
    } catch (error) {
      console.error('Error updating user location:', error);
      return { success: false, message: 'Failed to update user location', error };
    }
  }

  /**
   * Set both origin (if not exists) and update current location
   */
  static async setUserLocationData(userId: string, locationData: LocationData, isFirstTime: boolean = false) {
    try {
      type LocationResult = {
        success: boolean;
        message?: string;
        data?: unknown;
        error?: unknown;
      };

      const results: { origin: LocationResult | null; location: LocationResult | null } = {
        origin: null,
        location: null
      };

      // If this is first time or origin doesn't exist, set origin
      if (isFirstTime) {
        results.origin = await this.setUserOrigin(userId, locationData);
      }

      // Always update current location
      results.location = await this.updateUserLocation(userId, locationData);

      return {
        success: true,
        message: 'User location data processed successfully',
        data: results
      };
    } catch (error) {
      console.error('Error setting user location data:', error);
      return { success: false, message: 'Failed to process user location data', error };
    }
  }

  /**
   * Get user's origin location
   */
  static async getUserOrigin(userId: string) {
    try {
      const origin = await db
        .select()
        .from(userOrigin)
        .where(eq(userOrigin.userId, userId))
        .limit(1);

      return {
        success: true,
        data: origin.length > 0 ? origin[0] : null
      };
    } catch (error) {
      console.error('Error getting user origin:', error);
      return { success: false, message: 'Failed to get user origin', error };
    }
  }

  /**
   * Get user's current location
   */
  static async getUserLocation(userId: string) {
    try {
      const location = await db
        .select()
        .from(userLocations)
        .where(eq(userLocations.userId, userId))
        .limit(1);

      return {
        success: true,
        data: location.length > 0 ? location[0] : null
      };
    } catch (error) {
      console.error('Error getting user location:', error);
      return { success: false, message: 'Failed to get user location', error };
    }
  }

  /**
   * Check if user has origin set
   */
  static async hasUserOrigin(userId: string): Promise<boolean> {
    try {
      const origin = await db
        .select({ id: userOrigin.id })
        .from(userOrigin)
        .where(eq(userOrigin.userId, userId))
        .limit(1);

      return origin.length > 0;
    } catch (error) {
      console.error('Error checking user origin:', error);
      return false;
    }
  }
}
