import { NextRequest } from 'next/server';
import { db, restaurants } from '@/lib/db';
import { ilike, or, and, eq } from 'drizzle-orm';
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

    // Execute search
    const searchResults = await db
      .select({
        id: restaurants.id,
        name: restaurants.name,
        description: restaurants.description,
        cuisineTypes: restaurants.cuisineTypes,
        category: restaurants.category,
        address: restaurants.address,
        city: restaurants.city,
        state: restaurants.state,
        zipCode: restaurants.zipCode,
        phone: restaurants.phone,
        website: restaurants.website,
        latitude: restaurants.latitude,
        longitude: restaurants.longitude,
        averageRating: restaurants.averageRating,
        reviewCount: restaurants.reviewCount,
        isActive: restaurants.isActive,
        createdAt: restaurants.createdAt,
      })
      .from(restaurants)
      .where(finalWhereCondition)
      .orderBy(restaurants.averageRating, restaurants.reviewCount, restaurants.name)
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
          address: restaurants.address,
          city: restaurants.city,
          state: restaurants.state,
          zipCode: restaurants.zipCode,
          phone: restaurants.phone,
          website: restaurants.website,
          latitude: restaurants.latitude,
          longitude: restaurants.longitude,
          averageRating: restaurants.averageRating,
          reviewCount: restaurants.reviewCount,
          isActive: restaurants.isActive,
          createdAt: restaurants.createdAt,
        })
        .from(restaurants)
        .where(eq(restaurants.isActive, true))
        .orderBy(restaurants.averageRating, restaurants.reviewCount)
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

