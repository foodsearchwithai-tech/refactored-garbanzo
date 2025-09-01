import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { UserLocationService } from '@/lib/user-location';

// GET - Get user's current location
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await UserLocationService.getUserLocation(userId);

    if (!result.success) {
      return NextResponse.json({
        error: result.message || 'Failed to get user location'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      location: result.data
    });

  } catch (error) {
    console.error('Error fetching user location:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user location' },
      { status: 500 }
    );
  }
}

// POST - Set user location from coordinates (auto-fetch address via geocoding)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { latitude, longitude, isFirstTime = false } = body;

    // Validate required fields
    if (!latitude || !longitude) {
      return NextResponse.json({
        error: 'Latitude and longitude are required'
      }, { status: 400 });
    }

    // Use the existing geocoding API to get address details
    const geocodingUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/geocoding/reverse?lat=${latitude}&lng=${longitude}`;
    
    try {
      const geocodingResponse = await fetch(geocodingUrl);
      
      if (!geocodingResponse.ok) {
        throw new Error('Geocoding failed');
      }

      const geocodingData = await geocodingResponse.json();
      
      // Prepare location data
      const locationData = {
        address: geocodingData.formattedAddress || `${latitude}, ${longitude}`,
        city: geocodingData.city || 'Unknown City',
        state: geocodingData.state || '',
        country: geocodingData.country || 'India',
        zipCode: geocodingData.zipCode || '',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        formattedAddress: geocodingData.formattedAddress,
        placeId: geocodingData.placeId
      };

      // Set location data (handles both origin and current location)
      const result = await UserLocationService.setUserLocationData(
        userId, 
        locationData, 
        isFirstTime
      );

      if (!result.success) {
        return NextResponse.json({
          error: result.message || 'Failed to set user location'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'User location set successfully',
        data: result.data,
        locationData
      });

    } catch (geocodingError) {
      console.error('Geocoding error:', geocodingError);
      
      // Fallback: Save with minimal data if geocoding fails
      const fallbackLocationData = {
        address: `${latitude}, ${longitude}`,
        city: 'Unknown City',
        state: '',
        country: 'India',
        zipCode: '',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        formattedAddress: `${latitude}, ${longitude}`
      };

      const result = await UserLocationService.setUserLocationData(
        userId, 
        fallbackLocationData, 
        isFirstTime
      );

      return NextResponse.json({
        success: true,
        message: 'User location set with coordinates only (geocoding failed)',
        data: result.data,
        locationData: fallbackLocationData,
        warning: 'Address details could not be fetched'
      });
    }

  } catch (error) {
    console.error('Error setting user location:', error);
    return NextResponse.json(
      { error: 'Failed to set user location' },
      { status: 500 }
    );
  }
}

// PUT - Update user location from address (forward geocoding)
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { address, type = 'frequent' } = body;

    if (!address) {
      return NextResponse.json({
        error: 'Address is required'
      }, { status: 400 });
    }

    // Use the existing geocoding API to get coordinates
    const geocodingUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/geocoding/reverse`;
    
    try {
      const geocodingResponse = await fetch(geocodingUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address })
      });
      
      if (!geocodingResponse.ok) {
        throw new Error('Geocoding failed');
      }

      const geocodingData = await geocodingResponse.json();
      
      if (!geocodingData.success) {
        return NextResponse.json({
          error: 'Could not find coordinates for this address'
        }, { status: 400 });
      }

      // Prepare location data
      const locationData = {
        address: geocodingData.address?.street || address,
        city: geocodingData.address?.city || '',
        state: geocodingData.address?.state || '',
        country: geocodingData.address?.country || 'India',
        zipCode: geocodingData.address?.zipCode || '',
        latitude: geocodingData.coordinates.latitude,
        longitude: geocodingData.coordinates.longitude,
        formattedAddress: geocodingData.formattedAddress
      };

      // Update user location only (not origin)
      const result = await UserLocationService.updateUserLocation(userId, locationData, type as 'home' | 'work' | 'frequent');

      if (!result.success) {
        return NextResponse.json({
          error: result.message || 'Failed to update user location'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'User location updated successfully',
        data: result.data,
        locationData
      });

    } catch (geocodingError) {
      console.error('Forward geocoding error:', geocodingError);
      return NextResponse.json({
        error: 'Failed to geocode address'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error updating user location:', error);
    return NextResponse.json(
      { error: 'Failed to update user location' },
      { status: 500 }
    );
  }
}