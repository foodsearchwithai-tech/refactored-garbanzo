import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, restaurants } from '@/lib/db';
import { eq } from 'drizzle-orm';

// GET - Retrieve restaurant details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params;

    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, restaurantId))
      .limit(1);

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      restaurant
    });
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurant' },
      { status: 500 }
    );
  }
}

// PUT - Update restaurant information
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id: restaurantId } = await params;
    const body = await request.json();

    // Verify restaurant ownership
    const [restaurant] = await db
      .select({ ownerId: restaurants.ownerId })
      .from(restaurants)
      .where(eq(restaurants.id, restaurantId))
      .limit(1);

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    if (restaurant.ownerId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Prepare update data - only include fields that are provided
    const updateData: Partial<typeof restaurants.$inferInsert> = {
      updatedAt: new Date(),
    };

    // Only update fields that are provided in the request
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.isVerified !== undefined) updateData.isVerified = body.isVerified;
    if (body.cuisineTypes !== undefined) updateData.cuisineTypes = body.cuisineTypes;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.tagline !== undefined) updateData.tagline = body.tagline;
    if (body.profileImage !== undefined) updateData.profileImage = body.profileImage;
    if (body.coverImages !== undefined) updateData.coverImages = body.coverImages;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.state !== undefined) updateData.state = body.state;
    if (body.zipCode !== undefined) updateData.zipCode = body.zipCode;
    if (body.latitude !== undefined) updateData.latitude = body.latitude;
    if (body.longitude !== undefined) updateData.longitude = body.longitude;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.website !== undefined) updateData.website = body.website;
    if (body.socialMedia !== undefined) updateData.socialMedia = body.socialMedia;
    if (body.operatingHours !== undefined) updateData.operatingHours = body.operatingHours;
    if (body.policies !== undefined) updateData.policies = body.policies;
    if (body.features !== undefined) updateData.features = body.features;
    if (body.externalLinks !== undefined) updateData.externalLinks = body.externalLinks;
    if (body.businessLicense !== undefined) updateData.businessLicense = body.businessLicense;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.kitchenStory !== undefined) updateData.kitchenStory = body.kitchenStory;
    if (body.kitchenPhotos !== undefined) updateData.kitchenPhotos = body.kitchenPhotos;
    if (body.achievements !== undefined) updateData.achievements = body.achievements;
    if (body.achievementPhotos !== undefined) updateData.achievementPhotos = body.achievementPhotos;
    if (body.galleryImages !== undefined) updateData.galleryImages = body.galleryImages;
    if (body.bannerImages !== undefined) updateData.bannerImages = body.bannerImages;
    if (body.logoImage !== undefined) updateData.logoImage = body.logoImage;
    if (body.deliveryPartners !== undefined) updateData.deliveryPartners = body.deliveryPartners;

    // Update restaurant
    await db
      .update(restaurants)
      .set(updateData)
      .where(eq(restaurants.id, restaurantId));

    return NextResponse.json({
      success: true,
      message: 'Restaurant updated successfully'
    });
  } catch (error) {
    console.error('Error updating restaurant:', error);
    return NextResponse.json(
      { error: 'Failed to update restaurant' },
      { status: 500 }
    );
  }
}

// DELETE - Delete restaurant (optional)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id: restaurantId } = await params;

    // Verify restaurant ownership
    const [restaurant] = await db
      .select({ ownerId: restaurants.ownerId })
      .from(restaurants)
      .where(eq(restaurants.id, restaurantId))
      .limit(1);

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    if (restaurant.ownerId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Soft delete by setting isActive to false
    await db
      .update(restaurants)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(restaurants.id, restaurantId));

    return NextResponse.json({
      success: true,
      message: 'Restaurant deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    return NextResponse.json(
      { error: 'Failed to delete restaurant' },
      { status: 500 }
    );
  }
}
