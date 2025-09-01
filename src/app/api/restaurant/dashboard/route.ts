import { NextRequest, NextResponse } from 'next/server';
import { db, restaurants, menus, menuItems, menuCategories, reviews, favorites, images } from '@/lib/db';
import { eq, count, avg, desc, and, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from middleware header
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    // Get restaurant owned by this user
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.ownerId, userId))
      .limit(1);

    if (!restaurant) {
      return NextResponse.json({ 
        error: 'No restaurant found for this user',
        hasRestaurant: false 
      }, { status: 404 });
    }

    // Get restaurant analytics from analytics tables
    let analyticsData: {
      total_views: number;
      total_clicks: number;
      total_favorites: number;
      total_calls: number;
      total_directions: number;
      views_today: number;
      views_this_week: number;
      views_this_month: number;
      peak_hour: number;
      conversion_rate: number;
      last_view_at: string | null;
    } = {
      total_views: 0,
      total_clicks: 0,
      total_favorites: 0,
      total_calls: 0,
      total_directions: 0,
      views_today: 0,
      views_this_week: 0,
      views_this_month: 0,
      peak_hour: 12,
      conversion_rate: 0,
      last_view_at: null
    };

    try {
      const analyticsResult = await db.execute(sql`
        SELECT 
          COALESCE(total_views, 0) as total_views,
          COALESCE(total_clicks, 0) as total_clicks,
          COALESCE(total_favorites, 0) as total_favorites,
          COALESCE(total_calls, 0) as total_calls,
          COALESCE(total_directions, 0) as total_directions,
          COALESCE(views_today, 0) as views_today,
          COALESCE(views_this_week, 0) as views_this_week,
          COALESCE(views_this_month, 0) as views_this_month,
          COALESCE(peak_hour, 12) as peak_hour,
          COALESCE(conversion_rate, 0) as conversion_rate,
          last_view_at
        FROM restaurant_analytics 
        WHERE restaurant_id = ${restaurant.id}
      `);

      if (analyticsResult.rows.length > 0) {
        analyticsData = {
          total_views: Number(analyticsResult.rows[0].total_views) || 0,
          total_clicks: Number(analyticsResult.rows[0].total_clicks) || 0,
          total_favorites: Number(analyticsResult.rows[0].total_favorites) || 0,
          total_calls: Number(analyticsResult.rows[0].total_calls) || 0,
          total_directions: Number(analyticsResult.rows[0].total_directions) || 0,
          views_today: Number(analyticsResult.rows[0].views_today) || 0,
          views_this_week: Number(analyticsResult.rows[0].views_this_week) || 0,
          views_this_month: Number(analyticsResult.rows[0].views_this_month) || 0,
          peak_hour: Number(analyticsResult.rows[0].peak_hour) || 12,
          conversion_rate: Number(analyticsResult.rows[0].conversion_rate) || 0,
          last_view_at: analyticsResult.rows[0].last_view_at ? String(analyticsResult.rows[0].last_view_at) : null
        };
      } else {
        // Initialize analytics for this restaurant
        await db.execute(sql`
          INSERT INTO restaurant_analytics (restaurant_id, total_views, total_clicks, total_favorites)
          VALUES (${restaurant.id}, 0, 0, 0)
          ON CONFLICT (restaurant_id) DO NOTHING
        `);
      }
    } catch (analyticsError) {
      console.error('Analytics data fetch error:', analyticsError);
      // Continue with default values
    }

    // Get recent analytics events for activity feed
    let recentEventsResult = { rows: [] };
    let hourlyAnalyticsResult = { rows: [] };

    try {
      recentEventsResult = await db.execute(sql`
        SELECT 
          event_type,
          created_at,
          metadata,
          user_id
        FROM analytics_events 
        WHERE restaurant_id = ${restaurant.id}
        AND (user_id IS NULL OR user_id != ${userId})
        ORDER BY created_at DESC 
        LIMIT 10
      `);

      // Get hourly analytics for the chart (exclude owner events from public metrics)
      hourlyAnalyticsResult = await db.execute(sql`
        SELECT 
          EXTRACT(hour FROM created_at) as hour,
          COUNT(*) as total_events,
          COUNT(CASE WHEN event_type = 'view' AND (user_id IS NULL OR user_id != ${userId}) THEN 1 END) as views,
          COUNT(CASE WHEN event_type = 'click' AND (user_id IS NULL OR user_id != ${userId}) THEN 1 END) as clicks,
          COUNT(CASE WHEN event_type = 'favorite' AND (user_id IS NULL OR user_id != ${userId}) THEN 1 END) as favorites
        FROM analytics_events 
        WHERE restaurant_id = ${restaurant.id}
        AND created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY EXTRACT(hour FROM created_at)
        ORDER BY hour
      `);
    } catch (eventsError) {
      console.error('Events data fetch error:', eventsError);
      // Continue with empty arrays
    }

    // Get traditional restaurant data
    const [
      totalReviews,
      averageRating,
      totalMenuItems,
      totalFavoritesDB,
      recentReviews,
      restaurantImages
    ] = await Promise.all([
      // Total reviews count
      db
        .select({ count: count() })
        .from(reviews)
        .where(eq(reviews.restaurantId, restaurant.id)),
      
      // Average rating
      db
        .select({ avg: avg(reviews.overallRating) })
        .from(reviews)
        .where(eq(reviews.restaurantId, restaurant.id)),
      
      // Total menu items
      db
        .select({ count: count() })
        .from(menuItems)
        .leftJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
        .leftJoin(menus, eq(menuCategories.menuId, menus.id))
        .where(eq(menus.restaurantId, restaurant.id)),
      
      // Total favorites from DB
      db
        .select({ count: count() })
        .from(favorites)
        .where(eq(favorites.restaurantId, restaurant.id)),
      
      // Recent reviews (last 5)
      db
        .select({
          id: reviews.id,
          rating: reviews.overallRating,
          comment: reviews.content,
          createdAt: reviews.createdAt,
          userId: reviews.userId,
        })
        .from(reviews)
        .where(eq(reviews.restaurantId, restaurant.id))
        .orderBy(desc(reviews.createdAt))
        .limit(5),
      
      // Restaurant images
      db
        .select()
        .from(images)
        .where(and(
          eq(images.entityId, restaurant.id),
          eq(images.entityType, 'restaurant')
        ))
        .orderBy(desc(images.createdAt))
        .limit(10)
    ]);

    // Calculate trends
    const viewsGrowth = calculateGrowth(Number(analyticsData.views_this_week), Number(analyticsData.views_today) * 7);
    const engagementRate = Number(analyticsData.total_views) > 0 
      ? ((Number(analyticsData.total_clicks) + Number(analyticsData.total_favorites)) / Number(analyticsData.total_views) * 100).toFixed(2)
      : '0.00';

    const dashboardData = {
      hasRestaurant: true,
      restaurant: {
        // Include ALL restaurant table fields for editing
        id: restaurant.id,
        ownerId: restaurant.ownerId,
        name: restaurant.name,
        description: restaurant.description,
        isVerified: restaurant.isVerified,
        cuisineTypes: restaurant.cuisineTypes,
        category: restaurant.category,
        tagline: restaurant.tagline,
        profileImage: restaurant.profileImage,
        coverImages: restaurant.coverImages,
        averageRating: restaurant.averageRating,
        reviewCount: restaurant.reviewCount,
        address: restaurant.address,
        city: restaurant.city,
        state: restaurant.state,
        zipCode: restaurant.zipCode,
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
        phone: restaurant.phone,
        email: restaurant.email,
        website: restaurant.website,
        socialMedia: restaurant.socialMedia,
        operatingHours: restaurant.operatingHours,
        policies: restaurant.policies,
        features: restaurant.features,
        externalLinks: restaurant.externalLinks,
        businessLicense: restaurant.businessLicense,
        isActive: restaurant.isActive,
        createdAt: restaurant.createdAt,
        updatedAt: restaurant.updatedAt,
        kitchenStory: restaurant.kitchenStory,
        kitchenPhotos: restaurant.kitchenPhotos,
        achievements: restaurant.achievements,
        achievementPhotos: restaurant.achievementPhotos,
        categories: restaurant.category, // Fix: use category instead of categories
        galleryImages: restaurant.galleryImages,
        bannerImages: restaurant.bannerImages,
        logoImage: restaurant.logoImage,
        deliveryPartners: restaurant.deliveryPartners,
      },
      analytics: {
        // Real-time analytics from analytics table
        totalViews: Number(analyticsData.total_views),
        totalClicks: Number(analyticsData.total_clicks),
        totalCalls: Number(analyticsData.total_calls),
        totalDirections: Number(analyticsData.total_directions),
        viewsToday: Number(analyticsData.views_today),
        viewsThisWeek: Number(analyticsData.views_this_week),
        viewsThisMonth: Number(analyticsData.views_this_month),
        peakHour: Number(analyticsData.peak_hour),
        conversionRate: Number(analyticsData.conversion_rate),
        lastViewAt: analyticsData.last_view_at,
        
        // Traditional metrics
        totalReviews: totalReviews[0]?.count || 0,
        averageRating: Number(averageRating[0]?.avg) || 0,
        totalMenuItems: totalMenuItems[0]?.count || 0,
        totalFavorites: Math.max(totalFavoritesDB[0]?.count || 0, Number(analyticsData.total_favorites)),
        
        // Calculated metrics
        viewsGrowth,
        engagementRate: Number(engagementRate),
        
        // Detailed analytics from analytics_events table
        eventBreakdown: {
          views: Number(analyticsData.total_views),
          clicks: Number(analyticsData.total_clicks),
          favorites: Number(analyticsData.total_favorites), 
          calls: Number(analyticsData.total_calls),
          directions: Number(analyticsData.total_directions),
        },
        
        // Performance metrics
        performance: {
          peakTrafficHour: Number(analyticsData.peak_hour),
          conversionRate: Number(analyticsData.conversion_rate),
          averageSessionDuration: 0, // Can be calculated from events if needed
          bounceRate: 0, // Can be calculated from events if needed
        }
      },
      recentReviews: recentReviews || [],
      images: restaurantImages || [],
      recentEvents: recentEventsResult.rows || [],
      hourlyAnalytics: hourlyAnalyticsResult.rows || [],
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}
