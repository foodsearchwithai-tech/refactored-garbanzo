import { NextRequest } from 'next/server';
import { db, restaurants } from '@/lib/db';
import { ilike, or, and, eq, sql } from 'drizzle-orm';
import { handleCors, corsJsonResponse } from '@/lib/cors';

export async function OPTIONS() {
  return handleCors();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    const limit = parseInt(searchParams.get('limit') || '20');
    const cuisine = searchParams.get('cuisine');
    const category = searchParams.get('category');

    // Build search conditions
    const conditions = [eq(restaurants.isActive, true)];

    // Location-based search
    if (location && location !== 'popular') {
      const locationWords = location.toLowerCase().split(/[,\s]+/);
      const locationConditions = locationWords
        .map(word => 
          or(
            ilike(restaurants.city, `%${word}%`),
            ilike(restaurants.state, `%${word}%`),
            ilike(restaurants.address, `%${word}%`)
          )
        )
        .filter(Boolean);
      
      if (locationConditions.length > 0) {
        const locationFilter = locationConditions.length === 1 
          ? locationConditions[0] 
          : or(...locationConditions);
        if (locationFilter) {
          conditions.push(locationFilter);
        }
      }
    }

    // Cuisine filter
    if (cuisine) {
      conditions.push(ilike(restaurants.cuisineTypes, `%${cuisine}%`));
    }

    // Category filter - handle string type properly
    if (category) {
      // Cast the category to the proper enum type
      const validCategories = ['fine_dining', 'casual_dining', 'fast_food', 'cafe', 'bakery', 'bar', 'food_truck', 'catering', 'ghost_kitchen'];
      if (validCategories.includes(category)) {
        conditions.push(eq(restaurants.category, category as 'fine_dining' | 'casual_dining' | 'fast_food' | 'cafe' | 'bakery' | 'bar' | 'food_truck' | 'catering' | 'ghost_kitchen'));
      }
    }

    // Build final where condition
    const finalWhereCondition = conditions.length === 1 ? conditions[0] : and(...conditions);

    // Execute search with enhanced data
    const searchResults = await db
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
        `.as('menuItemCount')
      })
      .from(restaurants)
      .where(finalWhereCondition)
      .orderBy(sql`"calculatedRating" DESC, "actualReviewCount" DESC, ${restaurants.name}`)
      .limit(limit);

    // If no results found and searching by location, fall back to popular restaurants
    if (searchResults.length === 0 && location && location !== 'popular') {
      const fallbackResults = await db
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
          `.as('menuItemCount')
        })
        .from(restaurants)
        .where(eq(restaurants.isActive, true))
        .orderBy(sql`"calculatedRating" DESC, "actualReviewCount" DESC`)
        .limit(limit);

      return corsJsonResponse({
        success: true,
        restaurants: fallbackResults,
        searchQuery: location,
        fallback: true,
        message: `No restaurants found for "${location}". Showing popular restaurants instead.`,
        total: fallbackResults.length
      });
    }

    return corsJsonResponse({
      success: true,
      restaurants: searchResults,
      searchQuery: location || 'all',
      total: searchResults.length,
      filters: {
        location,
        cuisine,
        category
      }
    });
  } catch (error) {
    console.error('Restaurant search error:', error);
    return corsJsonResponse(
      { error: 'Failed to search restaurants' },
      { status: 500 }
    );
  }
}

