import { NextRequest, NextResponse } from 'next/server';

interface GoogleReverseGeocodingResponse {
  results: Array<{
    formatted_address: string;
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  }>;
  status: string;
}

interface GoogleGeocodingResponse {
  results: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  }>;
  status: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Maps API key not configured for reverse geocoding');
      return NextResponse.json({ 
        city: 'Unknown Location',
        state: '',
        country: 'USA',
        formattedAddress: `${lat}, ${lng}`
      });
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Reverse geocoding API request failed');
    }

    const data: GoogleReverseGeocodingResponse = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      let city = '';
      let state = '';
      let country = '';

      // Extract city, state, and country from address components
      for (const component of result.address_components) {
        if (component.types.includes('locality')) {
          city = component.long_name;
        } else if (component.types.includes('administrative_area_level_1')) {
          state = component.short_name;
        } else if (component.types.includes('country')) {
          country = component.long_name;
        }
      }

      return NextResponse.json({
        city: city || 'Unknown City',
        state: state || '',
        country: country || 'USA',
        formattedAddress: result.formatted_address,
      });
    } else {
      return NextResponse.json({
        city: 'Unknown Location',
        state: '',
        country: 'USA',
        formattedAddress: `${lat}, ${lng}`,
      });
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return NextResponse.json(
      { error: 'Failed to reverse geocode location' },
      { status: 500 }
    );
  }
}

// POST - Forward geocoding (address to coordinates)
export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Maps API key not configured for geocoding');
      return NextResponse.json({ 
        success: false,
        error: 'Geocoding service not available'
      }, { status: 503 });
    }

    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Geocoding API request failed');
    }

    const data: GoogleGeocodingResponse = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      const { lat, lng } = result.geometry.location;

      // Extract detailed address components
      let streetNumber = '';
      let streetName = '';
      let city = '';
      let state = '';
      let zipCode = '';
      let country = '';

      for (const component of result.address_components) {
        if (component.types.includes('street_number')) {
          streetNumber = component.long_name;
        } else if (component.types.includes('route')) {
          streetName = component.long_name;
        } else if (component.types.includes('locality')) {
          city = component.long_name;
        } else if (component.types.includes('administrative_area_level_1')) {
          state = component.short_name;
        } else if (component.types.includes('postal_code')) {
          zipCode = component.long_name;
        } else if (component.types.includes('country')) {
          country = component.short_name; // US, CA, etc.
        }
      }

      return NextResponse.json({
        success: true,
        coordinates: {
          latitude: lat,
          longitude: lng
        },
        address: {
          street: `${streetNumber} ${streetName}`.trim(),
          city: city || '',
          state: state || '',
          zipCode: zipCode || '',
          country: country || 'US'
        },
        formattedAddress: result.formatted_address
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'No coordinates found for this address'
      }, { status: 404 });
    }
  } catch (error) {
    console.error('Forward geocoding error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to geocode address'
    }, { status: 500 });
  }
}

