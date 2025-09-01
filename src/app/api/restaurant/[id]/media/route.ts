import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, restaurants } from '@/lib/db';
import { eq } from 'drizzle-orm';

// GET - Retrieve restaurant media (kitchen photos, achievements, etc.)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params;

    const [restaurant] = await db
      .select({
        id: restaurants.id,
        name: restaurants.name,
        profileImage: restaurants.profileImage,
        coverImages: restaurants.coverImages,
        kitchenStory: restaurants.kitchenStory,
        kitchenPhotos: restaurants.kitchenPhotos,
        achievements: restaurants.achievements,
        achievementPhotos: restaurants.achievementPhotos,
      })
      .from(restaurants)
      .where(eq(restaurants.id, restaurantId))
      .limit(1);

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      restaurant: {
        ...restaurant,
        media: {
          coverImages: restaurant.coverImages || [],
          kitchenPhotos: restaurant.kitchenPhotos || [],
          achievementPhotos: restaurant.achievementPhotos || [],
        }
      }
    });
  } catch (error) {
    console.error('Error fetching restaurant media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurant media' },
      { status: 500 }
    );
  }
}

// PUT - Update restaurant media (kitchen story, achievements, photos)
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
    const { 
      kitchenStory, 
      kitchenPhotos, 
      achievements, 
      achievementPhotos, 
      coverImages 
    } = body;

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

    // Prepare update data
    const updateData: Partial<{
      kitchenStory: string | null;
      kitchenPhotos: string[];
      achievements: { title: string; description: string; year?: number; issuer?: string }[];
      achievementPhotos: string[];
      coverImages: string[];
      updatedAt: Date;
    }> = {
      updatedAt: new Date(),
    };

    if (kitchenStory !== undefined) updateData.kitchenStory = kitchenStory;
    if (kitchenPhotos !== undefined) updateData.kitchenPhotos = kitchenPhotos;
    if (achievements !== undefined) updateData.achievements = achievements;
    if (achievementPhotos !== undefined) updateData.achievementPhotos = achievementPhotos;
    if (coverImages !== undefined) updateData.coverImages = coverImages;

    // Update restaurant
    await db
      .update(restaurants)
      .set(updateData)
      .where(eq(restaurants.id, restaurantId));

    return NextResponse.json({
      success: true,
      message: 'Restaurant media updated successfully'
    });
  } catch (error) {
    console.error('Error updating restaurant media:', error);
    return NextResponse.json(
      { error: 'Failed to update restaurant media' },
      { status: 500 }
    );
  }
}
