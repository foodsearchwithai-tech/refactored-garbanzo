#!/usr/bin/env tsx

/**
 * Script to geocode addresses for existing restaurants that don't have coordinates
 * Usage: npm run geocode-restaurants
 */

import { db, restaurants } from '../src/lib/db';
import { geocodeAddress, buildAddressString } from '../src/lib/geocoding';
import { isNull, or, eq } from 'drizzle-orm';

async function geocodeRestaurants() {
  console.log('Starting restaurant geocoding...');

  try {
    // Find all restaurants without coordinates
    const restaurantsToGeocode = await db
      .select()
      .from(restaurants)
      .where(
        or(
          isNull(restaurants.latitude),
          isNull(restaurants.longitude),
          eq(restaurants.latitude, '0'),
          eq(restaurants.longitude, '0')
        )
      );

    console.log(`Found ${restaurantsToGeocode.length} restaurants to geocode`);

    let successCount = 0;
    let failureCount = 0;

    for (const restaurant of restaurantsToGeocode) {
      const fullAddress = buildAddressString({
        address: restaurant.address,
        city: restaurant.city,
        state: restaurant.state,
        zipCode: restaurant.zipCode,
      });

      console.log(`Geocoding: ${restaurant.name} - ${fullAddress}`);

      const geocodeResult = await geocodeAddress(fullAddress);

      if (geocodeResult) {
        await db
          .update(restaurants)
          .set({
            latitude: geocodeResult.latitude.toString(),
            longitude: geocodeResult.longitude.toString(),
            updatedAt: new Date(),
          })
          .where(eq(restaurants.id, restaurant.id));

        console.log(
          `✓ Geocoded ${restaurant.name}: ${geocodeResult.latitude}, ${geocodeResult.longitude}`
        );
        successCount++;
      } else {
        console.warn(`✗ Failed to geocode ${restaurant.name}`);
        failureCount++;
      }

      // Add a small delay to avoid hitting API rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('\n=== Geocoding Complete ===');
    console.log(`Successfully geocoded: ${successCount} restaurants`);
    console.log(`Failed to geocode: ${failureCount} restaurants`);

    if (failureCount > 0) {
      console.log(
        '\nNote: Failed geocoding may be due to invalid addresses or missing Google Maps API key.'
      );
    }

    process.exit(0);
  } catch (error) {
    console.error('Error during geocoding:', error);
    process.exit(1);
  }
}

// Run the script
geocodeRestaurants();
