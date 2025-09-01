# Geocoding Setup Guide

This document explains the geocoding implementation for restaurant addresses in the Aharamm AI platform.

## Overview

The application now automatically geocodes restaurant addresses to store latitude and longitude coordinates. This enables location-based features like:
- Finding nearby restaurants
- Distance calculations
- Map displays
- Location-based search

## Changes Made

### 1. Fixed TypeScript Errors
- **Menu Page Component**: Fixed missing imports for UI components and added proper type annotations for event handlers
- **HeroSection Component**: Fixed TypeScript errors including:
  - Added `restaurantId` property to `SearchResult` interface
  - Fixed `useRef` initialization
  - Added proper type annotations and escaped HTML entities
  - Added ESLint disable comment for exhaustive-deps
- **Dependencies**: Installed missing `@radix-ui/react-switch` package

### 2. Database Schema
The restaurant table already contains the necessary fields:
- `latitude`: Decimal field for storing latitude coordinates
- `longitude`: Decimal field for storing longitude coordinates
- `address`, `city`, `state`, `zipCode`: Address components

### 3. Geocoding Service
Created `/src/lib/geocoding.ts` with utilities for:
- **`geocodeAddress()`**: Converts addresses to coordinates using Google Maps API
- **`buildAddressString()`**: Builds full address strings from components
- **`calculateDistance()`**: Calculates distance between two coordinates
- **`isValidCoordinates()`**: Validates coordinate values

### 4. API Integration
Updated `/src/app/api/onboarding/restaurant-owner/route.ts` to:
- Automatically geocode addresses when restaurants are created
- Store coordinates in the database
- Log geocoding results for debugging

### 5. Scripts
Created `/scripts/geocode-restaurants.ts` to:
- Find existing restaurants without coordinates
- Batch geocode addresses
- Update database with coordinates

## Setup Instructions

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Geocoding API**
4. Go to **APIs & Services** > **Credentials**
5. Create an API key
6. (Optional) Restrict the key to the Geocoding API for security

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and add your API key:

```bash
# Google Maps API (for geocoding addresses)
GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### 3. Install Dependencies

The required dependencies have been installed:

```bash
npm install @radix-ui/react-switch  # UI component
npm install --save-dev tsx           # For running TypeScript scripts
```

### 4. Geocode Existing Restaurants

If you have existing restaurants without coordinates, run:

```bash
npm run geocode-restaurants
```

This will:
- Find all restaurants without coordinates
- Geocode their addresses using Google Maps
- Update the database with coordinates
- Show progress and results

## How It Works

### When Creating a Restaurant

1. User fills out the restaurant onboarding form with address details
2. The API endpoint receives the form data
3. Before saving to database:
   - Builds full address string from components
   - Calls Google Maps Geocoding API
   - Receives latitude/longitude coordinates
4. Saves restaurant with coordinates to database

### Example Code Usage

```typescript
import { geocodeAddress, buildAddressString } from '@/lib/geocoding';

// Build address string
const fullAddress = buildAddressString({
  address: "123 Main St",
  city: "New York",
  state: "NY",
  zipCode: "10001"
});

// Geocode address
const result = await geocodeAddress(fullAddress);
if (result) {
  console.log(`Coordinates: ${result.latitude}, ${result.longitude}`);
  console.log(`Formatted: ${result.formattedAddress}`);
}
```

## API Rate Limits

Google Maps Geocoding API has the following limits:
- **Free tier**: $200 monthly credit (40,000 geocoding requests)
- **Rate limit**: 50 requests per second
- The script includes a 200ms delay between requests to avoid rate limiting

## Fallback Behavior

If geocoding fails (e.g., invalid address, API key missing, rate limit):
- Restaurant is still saved with NULL coordinates
- Warning is logged to console
- Application continues to function
- Coordinates can be added later using the geocoding script

## Troubleshooting

### "Google Maps API key not configured"
- Ensure `GOOGLE_MAPS_API_KEY` is set in your `.env.local` file
- Restart the development server after adding the key

### "No geocoding results found"
- Verify the address is complete and valid
- Check that the address format is correct for the country
- Try a more specific address (include street number)

### "Geocoding API error: REQUEST_DENIED"
- Check that your API key is valid
- Ensure the Geocoding API is enabled in Google Cloud Console
- Check API key restrictions

### Build Errors
If you encounter build errors after these changes:
1. Delete `node_modules` and `.next` folders
2. Run `npm install`
3. Run `npm run build`

## Additional ESLint Issues

The project has some ESLint warnings that don't affect functionality:
- Unused variables in some API routes
- Unescaped HTML entities in some components

To fix these in production, you can:
1. Remove unused imports
2. Use HTML entities (`&apos;`, `&ldquo;`, etc.) for quotes
3. Or configure ESLint rules in `.eslintrc.json`

## Testing

To test the geocoding implementation:

1. **Create a new restaurant** through the onboarding flow
2. **Check the database** to verify coordinates are saved:
   ```bash
   npm run db:studio
   ```
3. **Check console logs** for geocoding results during development
4. **Run the geocoding script** to update existing restaurants

## Future Enhancements

Consider implementing:
- Autocomplete for address fields using Google Places API
- Interactive map for selecting restaurant location
- Reverse geocoding (coordinates to address)
- Address validation before submission
- Batch geocoding with progress UI
- Caching geocoding results to reduce API calls
