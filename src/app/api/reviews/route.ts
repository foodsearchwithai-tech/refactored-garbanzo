import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reviews, restaurants, menuItems } from '@/lib/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from middleware header
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';

    // Base conditions
    let conditions = eq(reviews.userId, userId);
    
    if (filter === 'recent') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      conditions = and(
        eq(reviews.userId, userId),
        gte(reviews.createdAt, weekAgo)
      ) ?? eq(reviews.userId, userId);
    }

    // Build query
    const userReviews = await db
      .select({
        id: reviews.id,
        restaurantId: reviews.restaurantId,
        restaurantName: restaurants.name,
        menuItemId: reviews.menuItemId,
        menuItemName: menuItems.name,
        overallRating: reviews.overallRating,
        foodQualityRating: reviews.foodQualityRating,
        serviceRating: reviews.serviceRating,
        ambianceRating: reviews.ambianceRating,
        valueForMoneyRating: reviews.valueForMoneyRating,
        title: reviews.title,
        content: reviews.content,
        images: reviews.images,
        tags: reviews.tags,
        isVerified: reviews.isVerified,
        helpfulVotes: reviews.helpfulVotes,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        reviewLocation: reviews.reviewLocation,
        restaurantImages: restaurants.coverImages,
      })
      .from(reviews)
      .leftJoin(restaurants, eq(reviews.restaurantId, restaurants.id))
      .leftJoin(menuItems, eq(reviews.menuItemId, menuItems.id))
      .where(conditions)
      .orderBy(desc(reviews.createdAt));

    return NextResponse.json({
      success: true,
      reviews: userReviews
    });

  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user ID from middleware header
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    const body = await request.json();
    const { 
      restaurantId, 
      menuItemId,
      overallRating, 
      foodQualityRating,
      serviceRating,
      ambianceRating,
      valueForMoneyRating,
      title,
      content, 
      images,
      reviewLocation,
      userCity,
      userState,
      userLatitude,
      userLongitude
    } = body;

    // Validate required fields
    if (!restaurantId || !overallRating || !content) {
      return NextResponse.json(
        { error: 'Restaurant ID, rating, and content are required' },
        { status: 400 }
      );
    }

    // Validate rating range
    if (overallRating < 1 || overallRating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Create review
    const newReview = await db.insert(reviews).values({
      restaurantId,
      menuItemId: menuItemId || null,
      userId: userId,
      overallRating: parseInt(overallRating),
      foodQualityRating: parseInt(foodQualityRating || overallRating),
      serviceRating: parseInt(serviceRating || overallRating),
      ambianceRating: parseInt(ambianceRating || overallRating),
      valueForMoneyRating: parseInt(valueForMoneyRating || overallRating),
      title: title || null,
      content: content.trim(),
      images: images || [],
      reviewLocation: reviewLocation || null,
      userCity: userCity || null,
      userState: userState || null,
      userLatitude: userLatitude ? userLatitude.toString() : null,
      userLongitude: userLongitude ? userLongitude.toString() : null,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    return NextResponse.json({
      success: true,
      review: newReview[0]
    });

  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}
