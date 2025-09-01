import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, restaurants, reviews, images, favorites, users } from '@/lib/db';
import { eq, avg, count, desc, and } from 'drizzle-orm';
import { handleCors, corsJsonResponse } from '@/lib/cors';

export async function OPTIONS() {
  return handleCors();
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Try to get user ID but don't require authentication
    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch {
      // User not authenticated, continue without user ID
    }
    
    const { id: restaurantId } = await context.params;

    if (!restaurantId) {
      return corsJsonResponse({ error: 'Restaurant ID is required' }, { status: 400 });
    }

    // Get restaurant details
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, restaurantId))
      .limit(1);

    if (!restaurant) {
      return corsJsonResponse({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Get restaurant analytics
    const [
      averageRating,
      totalReviews,
      restaurantImages,
      recentReviews,
      isFavorited
    ] = await Promise.all([
      // Average rating
      db
        .select({ avg: avg(reviews.overallRating) })
        .from(reviews)
        .where(eq(reviews.restaurantId, restaurantId)),
      
      // Total reviews count
      db
        .select({ count: count() })
        .from(reviews)
        .where(eq(reviews.restaurantId, restaurantId)),
      
      // Restaurant images (from both images table AND restaurant JSON columns)
      db
        .select({
          id: images.id,
          url: images.url,
          alt: images.originalName,
          createdAt: images.createdAt
        })
        .from(images)
        .where(and(
          eq(images.entityId, restaurantId),
          eq(images.entityType, 'restaurant')
        ))
        .orderBy(desc(images.createdAt))
        .limit(10),
      
      // Recent reviews with user names
      db
        .select({
          id: reviews.id,
          score: reviews.overallRating,
          content: reviews.content,
          createdAt: reviews.createdAt,
          userId: reviews.userId,
          userName: users.firstName
        })
        .from(reviews)
        .leftJoin(users, eq(reviews.userId, users.id))
        .where(eq(reviews.restaurantId, restaurantId))
        .orderBy(desc(reviews.createdAt))
        .limit(5),
      
      // Check if current user has favorited this restaurant
      userId ? db
        .select({ count: count() })
        .from(favorites)
        .where(and(
          eq(favorites.restaurantId, restaurantId),
          eq(favorites.userId, userId),
          eq(favorites.type, 'restaurant')
        ))
        .then((result: { count: number }[]) => result[0]?.count > 0) : false
    ]);

    // Track view analytics (only if user is not the restaurant owner)
    if (userId) {
      try {
        // Track the view event
        await fetch(`${request.nextUrl.origin}/api/analytics/track`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userId}` // Pass user ID for owner checking
          },
          body: JSON.stringify({
            restaurantId,
            eventType: 'view',
            metadata: { 
              source: 'profile_page',
              timestamp: new Date().toISOString()
            }
          }),
        });
      } catch (trackingError) {
        console.warn('Analytics tracking failed:', trackingError);
        // Continue with the response even if tracking fails
      }
    }

    const restaurantData = {
      ...restaurant,
      averageRating: Number(averageRating[0]?.avg) || 0,
      totalReviews: totalReviews[0]?.count || 0,
      // Combine images from multiple sources
      images: [
        // Images from the images table
        ...(restaurantImages || []).map(img => ({
          id: img.id,
          url: img.url,
          alt: img.alt || restaurant.name,
          createdAt: img.createdAt
        })),
        // Kitchen photos from restaurant table
        ...(restaurant.kitchenPhotos || []).map((url: string, index: number) => ({
          id: `kitchen-${index}`,
          url,
          alt: `${restaurant.name} kitchen photo ${index + 1}`,
          createdAt: restaurant.createdAt
        })),
        // Achievement photos from restaurant table
        ...(restaurant.achievementPhotos || []).map((url: string, index: number) => ({
          id: `achievement-${index}`,
          url,
          alt: `${restaurant.name} achievement photo ${index + 1}`,
          createdAt: restaurant.createdAt
        })),
        // Cover images from restaurant table
        ...(restaurant.coverImages || []).map((url: string, index: number) => ({
          id: `cover-${index}`,
          url,
          alt: `${restaurant.name} cover image ${index + 1}`,
          createdAt: restaurant.createdAt
        }))
      ],
      reviews: recentReviews.map((review: {
        id: string;
        score: number;
        content: string;
        createdAt: Date;
        userId: string;
        userName: string | null;
      }) => ({
        ...review,
        rating: review.score,
        comment: review.content,
        userName: review.userName || 'Anonymous User'
      })) || [],
    };

    return corsJsonResponse({
      success: true,
      restaurant: restaurantData,
      isFavorited: isFavorited || false
    });
  } catch (error) {
    console.error('Restaurant fetch error:', error);
    return corsJsonResponse(
      { error: 'Failed to fetch restaurant details' },
      { status: 500 }
    );
  }
}
