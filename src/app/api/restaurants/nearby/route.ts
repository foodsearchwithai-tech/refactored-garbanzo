import { NextRequest } from 'next/server';
import { db, restaurants } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { handleCors, corsJsonResponse } from '@/lib/cors';

export async function OPTIONS() {
  return handleCors();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseInt(searchParams.get('radius') || '10'); // km
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!lat || !lng) {
      return corsJsonResponse({ error: 'Latitude and longitude are required' }, { status: 400 });
    }

    // Find nearby restaurants with enhanced data using joins and aggregations
    const nearbyRestaurants = await db
      .select({
        id: restaurants.id,
        name: restaurants.name,
        description: restaurants.description,
        cuisineTypes: restaurants.cuisineTypes,
        category: restaurants.category,
        tagline: restaurants.tagline,
        profileImage: restaurants.profileImage,
        logoImage: restaurants.logoImage,
        coverImages: restaurants.coverImages,
        bannerImages: restaurants.bannerImages,
        galleryImages: restaurants.galleryImages,
        address: restaurants.address,
        city: restaurants.city,
        state: restaurants.state,
        zipCode: restaurants.zipCode,
        phone: restaurants.phone,
        email: restaurants.email,
        website: restaurants.website,
        features: restaurants.features,
        latitude: restaurants.latitude,
        longitude: restaurants.longitude,
        isActive: restaurants.isActive,
        isVerified: restaurants.isVerified,
        createdAt: restaurants.createdAt,
        // Calculate actual rating from reviews
        calculatedRating: sql<number>`
          COALESCE(
            (SELECT AVG(CAST(overall_rating AS DECIMAL(3,2))) 
             FROM reviews 
             WHERE reviews.restaurant_id = restaurants.id), 
            0
          )
        `.as('calculatedRating'),
        // Get actual review count
        actualReviewCount: sql<number>`
          COALESCE(
            (SELECT COUNT(*) 
             FROM reviews 
             WHERE reviews.restaurant_id = restaurants.id), 
            0
          )
        `.as('actualReviewCount'),
        // Check if restaurant has menu
        hasMenu: sql<boolean>`
          EXISTS(
            SELECT 1 
            FROM menus 
            WHERE menus.restaurant_id = restaurants.id 
            AND menus.is_active = true
          )
        `.as('hasMenu'),
        // Count menu items
        menuItemCount: sql<number>`
          COALESCE(
            (SELECT COUNT(mi.id) 
             FROM menus m
             INNER JOIN menu_categories mc ON m.id = mc.menu_id
             INNER JOIN menu_items mi ON mc.id = mi.category_id
             WHERE m.restaurant_id = restaurants.id 
             AND m.is_active = true 
             AND mc.is_active = true 
             AND mi.is_active = true), 
            0
          )
        `.as('menuItemCount'),
        // Calculate distance using Haversine formula
        distance: sql<number>`
          (6371 * acos(
            cos(radians(${lat})) * 
            cos(radians(${restaurants.latitude})) * 
            cos(radians(${restaurants.longitude}) - radians(${lng})) + 
            sin(radians(${lat})) * 
            sin(radians(${restaurants.latitude}))
          ))
        `.as('distance')
      })
      .from(restaurants)
      .where(sql`
        ${restaurants.isActive} = true AND
        ${restaurants.latitude} IS NOT NULL AND
        ${restaurants.longitude} IS NOT NULL AND
        (6371 * acos(
          cos(radians(${lat})) * 
          cos(radians(${restaurants.latitude})) * 
          cos(radians(${restaurants.longitude}) - radians(${lng})) + 
          sin(radians(${lat})) * 
          sin(radians(${restaurants.latitude}))
        )) <= ${radius}
      `)
      .orderBy(sql`distance`)
      .limit(limit);

    return corsJsonResponse({
      success: true,
      restaurants: nearbyRestaurants,
      userLocation: { lat, lng },
      searchRadius: radius,
      total: nearbyRestaurants.length
    });
  } catch (error) {
    console.error('Nearby restaurants search error:', error);
    return corsJsonResponse(
      { error: 'Failed to search nearby restaurants' },
      { status: 500 }
    );
  }
}