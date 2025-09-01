import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { db, users, userPreferences, userLocations } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Get user ID from middleware header
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    const data = await request.json();
    
    // Get current user data from Clerk
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);
    
    // Check if user exists in our database
    const existingUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (existingUser.length === 0) {
      // Create new user record using Clerk data
      await db.insert(users).values({
        id: userId, // Use Clerk ID directly as primary key
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        profileImage: clerkUser.imageUrl || '',
        userType: 'customer',
        phone: data.phone,
        isOnboardingCompleted: true,
      });
    } else {
      // Update existing user with Clerk data
      await db.update(users)
        .set({
          email: clerkUser.emailAddresses[0]?.emailAddress || existingUser[0].email,
          firstName: clerkUser.firstName || existingUser[0].firstName,
          lastName: clerkUser.lastName || existingUser[0].lastName,
          profileImage: clerkUser.imageUrl || existingUser[0].profileImage,
          phone: data.phone,
          isOnboardingCompleted: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }

    // Save user preferences
    await db.insert(userPreferences).values({
      userId: userId,
      dietaryRestrictions: data.dietaryRestrictions,
      cuisinePreferences: data.cuisinePreferences,
      budgetMin: data.budgetMin,
      budgetMax: data.budgetMax,
      diningFrequency: data.diningFrequency,
      groupSizePreference: data.groupSizePreference,
      notificationSettings: data.notifications,
    }).onConflictDoUpdate({
      target: userPreferences.userId,
      set: {
        dietaryRestrictions: data.dietaryRestrictions,
        cuisinePreferences: data.cuisinePreferences,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        diningFrequency: data.diningFrequency,
        groupSizePreference: data.groupSizePreference,
        notificationSettings: data.notifications,
        updatedAt: new Date(),
      },
    });

    // Save location preferences if provided
    if (data.homeAddress) {
      await db.insert(userLocations).values({
        userId: userId,
        type: 'home',
        address: data.homeAddress,
        city: '', // These would be parsed from address in a real implementation
        state: '',
        zipCode: '',
      });
    }

    if (data.workAddress) {
      await db.insert(userLocations).values({
        userId: userId,
        type: 'work',
        address: data.workAddress,
        city: '',
        state: '',
        zipCode: '',
      });
    }

    // Update Clerk metadata to mark onboarding as completed
    await clerk.users.updateUser(userId, {
      unsafeMetadata: {
        userType: 'customer',
        isOnboardingCompleted: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Customer onboarding error:', error);
    return NextResponse.json(
      { error: 'Failed to save onboarding data' },
      { status: 500 }
    );
  }
}
