import { NextRequest } from 'next/server';
import { db, reviews, users } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { handleCors, corsJsonResponse } from '@/lib/cors';

export async function OPTIONS() {
  return handleCors();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;

    // Get reviews for the menu item with user information
    const menuItemReviews = await db
      .select({
        id: reviews.id,
        rating: reviews.overallRating,
        foodQualityRating: reviews.foodQualityRating,
        serviceRating: reviews.serviceRating,
        ambianceRating: reviews.ambianceRating,
        valueForMoneyRating: reviews.valueForMoneyRating,
        title: reviews.title,
        comment: reviews.content,
        images: reviews.images,
        tags: reviews.tags,
        helpfulVotes: reviews.helpfulVotes,
        isVerified: reviews.isVerified,
        reviewLocation: reviews.reviewLocation,
        userCity: reviews.userCity,
        userState: reviews.userState,
        userLatitude: reviews.userLatitude,
        userLongitude: reviews.userLongitude,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        userName: users.firstName,
        userLastName: users.lastName,
        userImage: users.profileImage,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.menuItemId, itemId))
      .orderBy(desc(reviews.createdAt));

    // Calculate average rating and total count
    const totalReviews = menuItemReviews.length;
    const averageRating = totalReviews > 0 
      ? menuItemReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;

    // Format reviews for frontend
    const formattedReviews = menuItemReviews.map(review => ({
      id: review.id,
      rating: review.rating,
      foodQualityRating: review.foodQualityRating,
      serviceRating: review.serviceRating,
      ambianceRating: review.ambianceRating,
      valueForMoneyRating: review.valueForMoneyRating,
      title: review.title,
      comment: review.comment,
      images: review.images || [],
      tags: review.tags || [],
      helpfulVotes: review.helpfulVotes || 0,
      isVerified: review.isVerified || false,
      reviewLocation: review.reviewLocation,
      userLocation: review.userCity && review.userState 
        ? `${review.userCity}, ${review.userState}` 
        : null,
      userLatitude: review.userLatitude ? parseFloat(review.userLatitude) : null,
      userLongitude: review.userLongitude ? parseFloat(review.userLongitude) : null,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      userName: review.userName && review.userLastName 
        ? `${review.userName} ${review.userLastName.charAt(0)}.`
        : review.userName || 'Anonymous',
      userImage: review.userImage,
    }));

    return corsJsonResponse({
      success: true,
      reviews: formattedReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      summary: {
        5: menuItemReviews.filter(r => r.rating === 5).length,
        4: menuItemReviews.filter(r => r.rating === 4).length,
        3: menuItemReviews.filter(r => r.rating === 3).length,
        2: menuItemReviews.filter(r => r.rating === 2).length,
        1: menuItemReviews.filter(r => r.rating === 1).length,
      }
    });

  } catch (error) {
    console.error('Error fetching menu item reviews:', error);
    return corsJsonResponse(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
