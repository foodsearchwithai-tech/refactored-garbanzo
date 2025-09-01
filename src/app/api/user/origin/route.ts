import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, userOrigin, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

// GET - Retrieve user origin
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const origin = await db
      .select()
      .from(userOrigin)
      .where(eq(userOrigin.userId, userId))
      .limit(1);

    if (origin.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'User origin not found',
        origin: null
      }, { status: 200 }); // Changed from 404 to 200 for better UX
    }

    return NextResponse.json({
      success: true,
      origin: origin[0]
    });

  } catch (error) {
    console.error('Error fetching user origin:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user origin' },
      { status: 500 }
    );
  }
}

// POST - Create or update user origin
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      originAddress,
      city,
      state,
      country = 'India',
      zipCode,
      latitude,
      longitude,
      geocodingSource = 'api',
      geocodingAccuracy,
      placeId,
      formattedAddress
    } = body;

    // Validate required fields
    if (!originAddress || !city || !state || !latitude || !longitude) {
      return NextResponse.json({
        error: 'Missing required fields: originAddress, city, state, latitude, longitude'
      }, { status: 400 });
    }

    // First get user data from users table
    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userData.length === 0) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 });
    }

    const user = userData[0];

    // Check if origin already exists
    const existingOrigin = await db
      .select()
      .from(userOrigin)
      .where(eq(userOrigin.userId, userId))
      .limit(1);

    const originData = {
      userId,
      // Copy user data
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImage: user.profileImage,
      userType: user.userType,
      phone: user.phone,
      isOnboardingCompleted: user.isOnboardingCompleted,
      // Origin location data
      originAddress,
      city,
      state,
      country,
      zipCode,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      // Geocoding metadata
      geocodingSource,
      geocodingAccuracy,
      placeId,
      formattedAddress,
    };

    if (existingOrigin.length > 0) {
      // Update existing origin
      const updated = await db
        .update(userOrigin)
        .set({
          ...originData,
          updatedAt: new Date()
        })
        .where(eq(userOrigin.userId, userId))
        .returning();

      return NextResponse.json({
        success: true,
        message: 'User origin updated successfully',
        origin: updated[0]
      });
    } else {
      // Create new origin
      const created = await db
        .insert(userOrigin)
        .values(originData)
        .returning();

      return NextResponse.json({
        success: true,
        message: 'User origin created successfully',
        origin: created[0]
      });
    }

  } catch (error) {
    console.error('Error creating/updating user origin:', error);
    return NextResponse.json(
      { error: 'Failed to create/update user origin' },
      { status: 500 }
    );
  }
}

// PUT - Update user origin (same as POST for this use case)
export async function PUT(request: NextRequest) {
  return POST(request);
}

// DELETE - Remove user origin
export async function DELETE() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deleted = await db
      .delete(userOrigin)
      .where(eq(userOrigin.userId, userId))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'User origin not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'User origin deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user origin:', error);
    return NextResponse.json(
      { error: 'Failed to delete user origin' },
      { status: 500 }
    );
  }
}
