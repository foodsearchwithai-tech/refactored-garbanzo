import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, restaurants, menuItems, menuCategories, menus, userLocations } from '@/lib/db';
import { eq, and, or, ilike, sql, desc, asc } from 'drizzle-orm';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      query, 
      filters = {}, 
      limit = 20, 
      offset = 0,
      searchType = 'all' // 'restaurants', 'dishes', 'all'
    } = body;

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const { userId } = await auth();
    let userLocation = null;

    // Get user's location if authenticated
    if (userId) {
      const [userLoc] = await db
        .select()
        .from(userLocations)
        .where(and(
          eq(userLocations.userId, userId),
          eq(userLocations.type, 'home')
        ))
        .limit(1);

      if (userLoc) {
        userLocation = {
          latitude: parseFloat(userLoc.latitude || '0'),
          longitude: parseFloat(userLoc.longitude || '0')
        };
      }
    }

    const searchTerm = `%${query.trim().toLowerCase()}%`;

type RestaurantResult = {
  id: string;
  name: string;
  description: string | null;
  cuisineTypes: string[];
  category: string;
  tagline: string | null;
  profileImage: string | null;
  coverImages: string[] | null;
  averageRating: string | null;
  reviewCount: number | null;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: string | null;
  longitude: string | null;
  phone: string;
  website: string | null;
  operatingHours: Record<string, unknown>;
  isActive: boolean | null;
  createdAt: Date;
  distance?: number | null;
  type?: string;
  relevanceScore?: number;
};

type DishResult = {
  id: string;
  name: string;
  description: string;
  price: string;
  images: string[] | null;
  dietaryTags: string[] | null;
  spiceLevel: string | null;
  preparationTime: number | null;
  availability: string | null;
  restaurantId: string | null;
  restaurantName: string | null;
  restaurantImage: string | null;
  restaurantRating: string | null;
  restaurantAddress: string | null;
  restaurantCity: string | null;
  restaurantState: string | null;
  categoryName: string | null;
  imageUrl?: string | null;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  type?: string;
  distance?: number | null;
  relevanceScore?: number;
};

const results: {
  restaurants: RestaurantResult[];
  dishes: DishResult[];
  total: number;
} = { restaurants: [], dishes: [], total: 0 };

    // Search Restaurants
    if (searchType === 'restaurants' || searchType === 'all') {
      const restaurantQuery = db
        .select({
          id: restaurants.id,
          name: restaurants.name,
          description: restaurants.description,
          cuisineTypes: restaurants.cuisineTypes,
          category: restaurants.category,
          tagline: restaurants.tagline,
          profileImage: restaurants.profileImage,
          coverImages: restaurants.coverImages,
          averageRating: restaurants.averageRating,
          reviewCount: restaurants.reviewCount,
          address: restaurants.address,
          city: restaurants.city,
          state: restaurants.state,
          zipCode: restaurants.zipCode,
          latitude: restaurants.latitude,
          longitude: restaurants.longitude,
          phone: restaurants.phone,
          website: restaurants.website,
          operatingHours: restaurants.operatingHours,
          isActive: restaurants.isActive,
          createdAt: restaurants.createdAt,
        })
        .from(restaurants);

      // Apply filters
      const conditions = [
        eq(restaurants.isActive, true),
        or(
          ilike(restaurants.name, searchTerm),
          ilike(restaurants.description, searchTerm),
          ilike(restaurants.tagline, searchTerm),
          sql`${restaurants.cuisineTypes}::text ILIKE ${searchTerm}`
        )
      ];

      if (filters.cuisineTypes && filters.cuisineTypes.length > 0) {
        conditions.push(
          sql`${restaurants.cuisineTypes} && ${JSON.stringify(filters.cuisineTypes)}`
        );
      }

      if (filters.rating && filters.rating > 0) {
        conditions.push(sql`${restaurants.averageRating} >= ${filters.rating}`);
      }

      // Apply location-based filtering if user location is available
      if (userLocation && filters.distance) {
        const { latitude, longitude } = userLocation;
        const distanceKm = filters.distance;
        
        conditions.push(
          sql`(
            6371 * acos(
              cos(radians(${latitude})) * 
              cos(radians(${restaurants.latitude}::float)) * 
              cos(radians(${restaurants.longitude}::float) - radians(${longitude})) + 
              sin(radians(${latitude})) * 
              sin(radians(${restaurants.latitude}::float))
            )
          ) <= ${distanceKm}`
        );
      }

      const restaurantResults = await restaurantQuery
        .where(and(...conditions))
        .orderBy(desc(restaurants.averageRating), asc(restaurants.name))
        .limit(limit)
        .offset(offset);

      // Calculate distance for each restaurant if user location is available
      if (userLocation) {
        results.restaurants = restaurantResults.map((restaurant) => ({
          ...restaurant,
          distance: restaurant.latitude && restaurant.longitude ? 
            calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              parseFloat(restaurant.latitude),
              parseFloat(restaurant.longitude)
            ) : null,
          type: 'restaurant'
        }));
      } else {
        results.restaurants = restaurantResults.map((restaurant) => ({
          ...restaurant,
          distance: null,
          type: 'restaurant'
        }));
      }
    }

    // Search Menu Items
    if (searchType === 'dishes' || searchType === 'all') {
      const dishResults = await db
        .select({
          id: menuItems.id,
          name: menuItems.name,
          description: menuItems.description,
          price: menuItems.price,
          images: menuItems.images,
          dietaryTags: menuItems.dietaryTags,
          spiceLevel: menuItems.spiceLevel,
          preparationTime: menuItems.preparationTime,
          availability: menuItems.availability,
          restaurantId: restaurants.id,
          restaurantName: restaurants.name,
          restaurantImage: restaurants.profileImage,
          restaurantRating: restaurants.averageRating,
          restaurantAddress: restaurants.address,
          restaurantCity: restaurants.city,
          restaurantState: restaurants.state,
          categoryName: menuCategories.name,
        })
        .from(menuItems)
        .leftJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
        .leftJoin(menus, eq(menuCategories.menuId, menus.id))
        .leftJoin(restaurants, eq(menus.restaurantId, restaurants.id))
        .where(
          and(
            eq(restaurants.isActive, true),
            eq(menuItems.isActive, true),
            eq(menuItems.availability, 'available'),
            or(
              ilike(menuItems.name, searchTerm),
              ilike(menuItems.description, searchTerm),
              sql`${menuItems.dietaryTags}::text ILIKE ${searchTerm}`
            )
          )
        )
        .limit(limit)
        .offset(offset);

      results.dishes = dishResults.map(dish => ({
        ...dish,
        imageUrl: dish.images?.[0] || null,
        isVegetarian: dish.dietaryTags?.includes('vegetarian') || false,
        isVegan: dish.dietaryTags?.includes('vegan') || false,
        isGlutenFree: dish.dietaryTags?.includes('gluten-free') || false,
        type: 'dish'
      }));
    }

    // Apply AI-powered ranking/scoring (simplified for now)
    const allResults = [...results.restaurants, ...results.dishes];
    
    // Score results based on relevance
    const scoredResults = allResults.map((item) => {
      let score = 0;
      const lowerQuery = query.toLowerCase();
      const itemName = item.name.toLowerCase();
      const itemDescription = (item.description || '').toLowerCase();

      // Exact name match gets highest score
      if (itemName === lowerQuery) score += 100;
      else if (itemName.includes(lowerQuery)) score += 50;
      
      // Description match
      if (itemDescription.includes(lowerQuery)) score += 25;

      // Restaurant rating boost
      if (item.type === 'restaurant') {
        const restaurantItem = item as RestaurantResult;
        if (restaurantItem.averageRating) {
          score += parseFloat(restaurantItem.averageRating) * 5;
        }
      } else if (item.type === 'dish') {
        const dishItem = item as DishResult;
        if (dishItem.restaurantRating) {
          score += parseFloat(dishItem.restaurantRating) * 3;
        }
      }

      // Distance penalty (closer is better)
      if ('distance' in item && item.distance) {
        score -= item.distance * 2;
      }

      return { ...item, relevanceScore: score };
    });

    // Sort by relevance score
    const sortedResults = scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    results.total = sortedResults.length;

    // Track search analytics
    if (userId) {
      try {
        await fetch(`${request.nextUrl.origin}/api/analytics/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'search',
            metadata: { 
              query, 
              searchType, 
              resultsCount: results.total,
              filters 
            }
          }),
        });
      } catch (error) {
        console.error('Failed to track search analytics:', error);
      }
    }

    return NextResponse.json({
      success: true,
      query,
      results: sortedResults,
      total: results.total,
      filters: filters,
      searchType
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in kilometers
  return Math.round(d * 10) / 10; // Round to 1 decimal place
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
