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

    // Find nearby restaurants using Haversine formula
    // This is a simplified version - in production you'd use PostGIS or similar
    const nearbyRestaurants = await db
      .select({
        id: restaurants.id,
        name: restaurants.name,
        description: restaurants.description,
        cuisineTypes: restaurants.cuisineTypes,
        address: restaurants.address,
        city: restaurants.city,
        state: restaurants.state,
        zipCode: restaurants.zipCode,
        phone: restaurants.phone,
        website: restaurants.website,
        latitude: restaurants.latitude,
        longitude: restaurants.longitude,
        isActive: restaurants.isActive,
        createdAt: restaurants.createdAt,
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