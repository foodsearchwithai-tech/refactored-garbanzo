import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, restaurants, menuItems, menuCategories, menus } from '@/lib/db';
import { eq, and, or, ilike, sql } from 'drizzle-orm';
import OpenAI from 'openai';

// Initialize OpenAI with custom base URL
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE,
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    const body = await request.json();
    const { 
      query, 
      imageData, // base64 encoded image for image search
      userLat, 
      userLng,
      radius = 10 // default 10km radius
    } = body;

    if (!query && !imageData) {
      return NextResponse.json({ error: 'Either text query or image is required' }, { status: 400 });
    }

    let aiAnalysis = '';
    let searchTerms: string[] = [];

    // Handle image search
    if (imageData) {
      try {
        const imageAnalysis = await openai.chat.completions.create({
          model: "openai/gpt-5-mini",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyze this food image and extract: 1) Name of the dish, 2) Type of cuisine, 3) Key ingredients, 4) Cooking style. Respond in JSON format with keys: dishName, cuisine, ingredients, cookingStyle, searchTerms (array of keywords for database search)."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${imageData}`
                  }
                }
              ]
            }
          ],
          max_tokens: 500
        });

        const analysisText = imageAnalysis.choices[0]?.message?.content;
        if (analysisText) {
          try {
            const parsed = JSON.parse(analysisText);
            aiAnalysis = `Detected: ${parsed.dishName} (${parsed.cuisine} cuisine)`;
            searchTerms = parsed.searchTerms || [parsed.dishName, parsed.cuisine];
          } catch {
            // Fallback if JSON parsing fails
            aiAnalysis = analysisText;
            searchTerms = analysisText.split(' ').slice(0, 5); // Use first 5 words
          }
        }
      } catch (error) {
        console.error('Image analysis failed:', error);
        return NextResponse.json({ error: 'Image analysis failed' }, { status: 500 });
      }
    }

    // Handle text search with AI enhancement
    if (query) {
      try {
        const textAnalysis = await openai.chat.completions.create({
          model: "openai/gpt-5-mini",
          messages: [
            {
              role: "system",
              content: "You are a food search assistant. Extract search keywords from user queries about food, restaurants, or cuisines. Return a JSON with keys: intent, searchTerms (array), cuisine, dietary (array of dietary preferences like vegan, gluten-free)."
            },
            {
              role: "user",
              content: query
            }
          ],
          max_tokens: 200
        });

        const analysisText = textAnalysis.choices[0]?.message?.content;
        if (analysisText) {
          try {
            const parsed = JSON.parse(analysisText);
            searchTerms = [...searchTerms, ...parsed.searchTerms];
            aiAnalysis = query;
          } catch {
            searchTerms = [...searchTerms, ...query.split(' ')];
            aiAnalysis = query;
          }
        }
      } catch (error) {
        console.error('Text analysis failed:', error);
        // Fallback to simple keyword extraction
        searchTerms = [...searchTerms, ...query.split(' ')];
        aiAnalysis = query;
      }
    }

    // Remove duplicates and filter empty terms
    const uniqueSearchTerms = [...new Set(searchTerms.filter(term => term && term.trim().length > 1))];

    // If no search terms from AI, fall back to splitting the original query
    if (uniqueSearchTerms.length === 0 && query) {
      const fallbackTerms = query.toLowerCase().split(' ').filter((term: string) => term.length > 1);
      uniqueSearchTerms.push(...fallbackTerms);
    }

    if (uniqueSearchTerms.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Please provide a search query',
        results: []
      }, { status: 400 });
    }

    // Search for both restaurants and menu items
    const menuItemConditions = [
      eq(menuItems.isActive, true),
      eq(menuItems.availability, 'available')
    ];

    // Create search conditions for menu items AND restaurants
    const searchConditions = uniqueSearchTerms.map(term =>
      or(
        // Menu item search
        ilike(menuItems.name, `%${term}%`),
        ilike(menuItems.description, `%${term}%`),
        sql`${menuItems.dietaryTags}::text ILIKE ${'%' + term + '%'}`,
        // Restaurant search
        ilike(restaurants.name, `%${term}%`),
        ilike(restaurants.description, `%${term}%`),
        sql`${restaurants.cuisineTypes}::text ILIKE ${'%' + term + '%'}`
      )
    ).filter(Boolean);

    if (searchConditions.length > 0) {
      const combinedCondition = or(...searchConditions);
      if (combinedCondition) {
        menuItemConditions.push(combinedCondition);
      }
    }

    // Get all matching menu items with their restaurants
    const matchingMenuItems = await db
      .select({
        itemId: menuItems.id,
        itemName: menuItems.name,
        itemDescription: menuItems.description,
        itemPrice: menuItems.price,
        itemImages: menuItems.images,
        itemDietaryTags: menuItems.dietaryTags,
        categoryName: menuCategories.name,
        restaurantId: restaurants.id,
        restaurantName: restaurants.name,
        restaurantDescription: restaurants.description,
        cuisineTypes: restaurants.cuisineTypes,
        profileImage: restaurants.profileImage,
        averageRating: restaurants.averageRating,
        reviewCount: restaurants.reviewCount,
        address: restaurants.address,
        city: restaurants.city,
        state: restaurants.state,
        latitude: restaurants.latitude,
        longitude: restaurants.longitude,
      })
      .from(menuItems)
      .leftJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
      .leftJoin(menus, eq(menuCategories.menuId, menus.id))
      .leftJoin(restaurants, eq(menus.restaurantId, restaurants.id))
      .where(and(
        eq(restaurants.isActive, true),
        ...menuItemConditions
      ))
      .limit(50);

    // Group menu items by restaurant
    const restaurantMap = new Map();

    for (const item of matchingMenuItems) {
      if (!item.restaurantId) continue;

      // Calculate distance if coordinates provided
      let distance = null;
      if (userLat && userLng && item.latitude && item.longitude) {
        distance = calculateDistance(
          parseFloat(userLat.toString()),
          parseFloat(userLng.toString()),
          parseFloat(item.latitude),
          parseFloat(item.longitude)
        );

        // Filter by radius if specified
        if (distance > radius) continue;
      }

      if (!restaurantMap.has(item.restaurantId)) {
        restaurantMap.set(item.restaurantId, {
          restaurant: {
            id: item.restaurantId,
            name: item.restaurantName,
            description: item.restaurantDescription,
            cuisineTypes: item.cuisineTypes,
            profileImage: item.profileImage,
            averageRating: item.averageRating,
            reviewCount: item.reviewCount,
            address: item.address,
            city: item.city,
            state: item.state,
            distance
          },
          menuItems: []
        });
      }

      restaurantMap.get(item.restaurantId).menuItems.push({
        id: item.itemId,
        name: item.itemName,
        description: item.itemDescription,
        price: item.itemPrice,
        imageUrl: item.itemImages?.[0] || null,
        categoryName: item.categoryName,
        isVegetarian: item.itemDietaryTags?.includes('vegetarian') || false,
        isVegan: item.itemDietaryTags?.includes('vegan') || false,
        isGlutenFree: item.itemDietaryTags?.includes('gluten-free') || false,
      });
    }

    // Convert to results array
    const results = Array.from(restaurantMap.values());

    // Sort results by rating first (like Amazon), then by distance
    results.sort((a, b) => {
      const ratingA = parseFloat(a.restaurant.averageRating || '0');
      const ratingB = parseFloat(b.restaurant.averageRating || '0');
      const reviewCountA = a.restaurant.reviewCount || 0;
      const reviewCountB = b.restaurant.reviewCount || 0;
      
      // Primary sort: Rating (higher is better)
      if (ratingB !== ratingA) {
        return ratingB - ratingA;
      }
      
      // Secondary sort: Review count (more reviews = more reliable)
      if (reviewCountB !== reviewCountA) {
        return reviewCountB - reviewCountA;
      }
      
      // Tertiary sort: Distance (closer is better) - only if coordinates available
      const distanceA = a.restaurant.distance || 999;
      const distanceB = b.restaurant.distance || 999;
      return distanceA - distanceB;
    });

    // Track analytics
    if (userId) {
      try {
        await fetch(`${request.nextUrl.origin}/api/analytics/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'ai_search',
            metadata: { 
              hasImage: !!imageData,
              hasText: !!query,
              searchTerms: uniqueSearchTerms,
              resultsCount: results.length,
              aiAnalysis
            }
          }),
        });
      } catch (error) {
        console.error('Failed to track AI search analytics:', error);
      }
    }

    return NextResponse.json({
      success: true,
      query: query || 'Image search',
      aiAnalysis,
      searchTerms: uniqueSearchTerms,
      results: results.slice(0, 20), // Return top 20 results like Amazon
      total: results.length
    });

  } catch (error) {
    console.error('AI Search error:', error);
    return NextResponse.json(
      { error: 'AI search failed' },
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
