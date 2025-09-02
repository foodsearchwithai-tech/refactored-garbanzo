import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { db, users, restaurants } from '@/lib/db';
import { eq } from 'drizzle-orm';

// Configure longer timeout for this API route
export const maxDuration = 60; // 60 seconds timeout

// Retry helper function
async function retryOperation<T>(operation: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`Attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  throw new Error('Max retries exceeded');
}

export async function POST(request: NextRequest) {
  try {
    // Get user ID from middleware header
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    const data = await request.json();
    
    // Debug: Log the incoming data for social media and delivery partners
    console.log('📋 Onboarding Data Debug:');
    console.log('Social Media:', JSON.stringify(data.socialMedia, null, 2));
    console.log('Delivery Partners:', JSON.stringify(data.deliveryPartners, null, 2));
    console.log('External Links:', JSON.stringify(data.externalLinks, null, 2));
    
    // Get current user data from Clerk with retry
    const clerkUser = await retryOperation(async () => {
      const clerk = await clerkClient();
      return await clerk.users.getUser(userId);
    });
    
    // Check if user exists in our database with retry
    const existingUser = await retryOperation(async () => {
      return await db.select().from(users).where(eq(users.id, userId)).limit(1);
    });
    
    if (existingUser.length === 0) {
      // Create new user record using Clerk data with retry
      await retryOperation(async () => {
        return await db.insert(users).values({
          id: userId, // Use Clerk ID directly as primary key
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          firstName: clerkUser.firstName || '',
          lastName: clerkUser.lastName || '',
          profileImage: clerkUser.imageUrl || '',
          userType: 'restaurant_owner',
          phone: data.ownerPhone,
          isOnboardingCompleted: true,
        });
      });
    } else {
      // Update existing user with Clerk data with retry
      await retryOperation(async () => {
        return await db.update(users)
          .set({
            email: clerkUser.emailAddresses[0]?.emailAddress || existingUser[0].email,
            firstName: clerkUser.firstName || existingUser[0].firstName,
            lastName: clerkUser.lastName || existingUser[0].lastName,
            profileImage: clerkUser.imageUrl || existingUser[0].profileImage,
            phone: data.ownerPhone,
            isOnboardingCompleted: true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      });
    }

    // Use manual coordinates provided by user (no automatic geocoding)
    let latitude = null;
    let longitude = null;
    
    // Use manually entered coordinates if provided
    if (data.latitude && data.longitude) {
      latitude = data.latitude.toString();
      longitude = data.longitude.toString();
      console.log(`Using manual coordinates for ${data.restaurantName}: ${latitude}, ${longitude}`);
    } else {
      console.warn(`No coordinates provided for ${data.restaurantName}`);
    }

    // Create restaurant record with retry
    const [restaurant] = await retryOperation(async () => {
      return await db.insert(restaurants).values({
        ownerId: userId, // Add ownerId as required by schema
        name: data.restaurantName,
        description: data.description,
        isVerified: false, // Requires manual verification
        cuisineTypes: data.cuisineTypes,
        category: data.categories && data.categories.length > 0 ? data.categories[0] : 'restaurant', // Use first category or default
        tagline: data.tagline || null,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        latitude: latitude,
        longitude: longitude,
        phone: data.phone,
        email: data.email || null,
        website: data.website || null,
        socialMedia: data.socialMedia || {},
        // Save delivery partners data properly
        deliveryPartners: data.deliveryPartners || {},
        operatingHours: data.operatingHours,
        policies: {
          cancellation: data.policies?.cancellation || '',
          delivery: data.policies?.delivery || '',
          reservation: data.policies?.reservation || '',
          dressCode: data.policies?.dressCode || undefined,
          accessibility: [], // Will be populated later
        },
        features: data.features,
        externalLinks: data.externalLinks || {
          other: [],
        },
        businessLicense: data.businessLicense,
        kitchenStory: data.kitchenStory || null,
        kitchenPhotos: data.kitchenPhotos || [],
        achievements: data.achievements || [],
        achievementPhotos: data.achievementPhotos || [],
        // Add new image fields
        profileImage: data.profileImage || null,
        logoImage: data.logoImage || null,
        galleryImages: data.galleryImages || [],
        bannerImages: data.bannerImages || [],
        coverImages: data.coverImages || [],
        isActive: true,
      }).returning();
    });

    // Debug: Log what was actually saved
    console.log('💾 Saved Restaurant Data:');
    console.log('Social Media:', JSON.stringify(restaurant.socialMedia, null, 2));
    console.log('Delivery Partners:', JSON.stringify(restaurant.deliveryPartners, null, 2));
    console.log('External Links:', JSON.stringify(restaurant.externalLinks, null, 2));

    // Update Clerk metadata to mark onboarding as completed with retry
    await retryOperation(async () => {
      const clerk = await clerkClient();
      return await clerk.users.updateUser(userId, {
        unsafeMetadata: {
          userType: 'restaurant_owner',
          isOnboardingCompleted: true,
        },
      });
    });

    return NextResponse.json({ 
      success: true, 
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      message: `🎉 Congratulations! Your restaurant "${restaurant.name}" has been successfully added to Aharam AI!`
    });
  } catch (error) {
    console.error('Restaurant onboarding error:', error);
    return NextResponse.json(
      { error: 'Failed to save restaurant data' },
      { status: 500 }
    );
  }
}
