'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, ChefHat, Navigation, Loader2 } from 'lucide-react';
import { DISCOVERY_CATEGORIES } from '@/lib/constants';
import { Restaurant } from '@/lib/types';

interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
}

export default function RestaurantDiscovery() {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(false);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get the best available image for restaurant
  const getBestRestaurantImage = (restaurant: Restaurant): string | null => {
    // Priority: banner > cover > gallery > profile
    if (restaurant.bannerImages && restaurant.bannerImages.length > 0) {
      return restaurant.bannerImages[0];
    }
    if (restaurant.coverImages && restaurant.coverImages.length > 0) {
      return restaurant.coverImages[0];
    }
    if (restaurant.galleryImages && restaurant.galleryImages.length > 0) {
      return restaurant.galleryImages[0];
    }
    if (restaurant.profileImage) {
      return restaurant.profileImage;
    }
    return null;
  };

  // Get user's current location
  const getUserLocation = async () => {
    setIsLoadingLocation(true);
    setError(null);
    
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setIsLoadingLocation(false);
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const location: UserLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      // Use reverse geocoding to get city/state if Google Maps API is available
      try {
        const response = await fetch(
          `/api/geocoding/reverse?lat=${location.latitude}&lng=${location.longitude}`
        );
        if (response.ok) {
          const data = await response.json();
          location.city = data.city;
          location.state = data.state;
        }
      } catch (geocodeError) {
        console.warn('Reverse geocoding failed:', geocodeError);
      }

      setUserLocation(location);
      setLocationPermissionDenied(false);
    } catch (error: unknown) {
      console.error('Error getting location:', error);
      if (error instanceof GeolocationPositionError && error.code === 1) {
        setLocationPermissionDenied(true);
        setError('Location access denied. Showing restaurants from major cities.');
      } else {
        setError('Unable to get your location. Showing popular restaurants.');
      }
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Fallback: fetch restaurants by city when GPS fails or no nearby results
  const fetchRestaurantsByCity = useCallback(async (city?: string, state?: string) => {
    try {
      const cityQuery = city && state ? `${city}, ${state}` : 'popular';
      const response = await fetch(`/api/restaurants/search?location=${encodeURIComponent(cityQuery)}&limit=20`);
      
      if (response.ok) {
        const data = await response.json();
        setRestaurants(data.restaurants || []);
      }
    } catch (error) {
      console.error('Error fetching restaurants by city:', error);
    }
  }, []);

  // Fetch nearby restaurants from database
  const fetchNearbyRestaurants = useCallback(async (location: UserLocation) => {
    setIsLoadingRestaurants(true);
    try {
      const response = await fetch(
        `/api/restaurants/nearby?lat=${location.latitude}&lng=${location.longitude}&radius=25&limit=20`
      );
      
      if (response.ok) {
        const data = await response.json();
        setRestaurants(data.restaurants || []);
      } else {
        throw new Error('Failed to fetch restaurants');
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setError('Failed to load nearby restaurants');
      // Fallback to city-based search
      await fetchRestaurantsByCity(location.city, location.state);
    } finally {
      setIsLoadingRestaurants(false);
    }
  }, [fetchRestaurantsByCity]);

  // Get location on component mount
  useEffect(() => {
    getUserLocation();
  }, []);

  // Fetch restaurants when location is available
  useEffect(() => {
    if (userLocation) {
      fetchNearbyRestaurants(userLocation);
    } else if (locationPermissionDenied) {
      // Fetch popular restaurants from major cities as fallback
      fetchRestaurantsByCity();
    }
  }, [userLocation, locationPermissionDenied, fetchNearbyRestaurants, fetchRestaurantsByCity]);

  // Function to get Google Maps direction URL
  const getDirectionsUrl = (restaurant: Restaurant) => {
    if (!userLocation) return '#';
    const destination = encodeURIComponent(`${restaurant.address}, ${restaurant.city}, ${restaurant.state}`);
    return `https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${destination}`;
  };

  return (
    <div className="space-y-8">
      {/* Header with Location Info */}
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {userLocation ? 'Restaurants Near You' : 'Popular Restaurants'}
        </h2>
        <div className="flex items-center justify-center gap-4 mb-4">
          {isLoadingLocation ? (
            <div className="flex items-center gap-2 text-orange-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Getting your location...</span>
            </div>
          ) : userLocation ? (
            <div className="flex items-center gap-2 text-green-600">
              <Navigation className="h-4 w-4" />
              <span>
                {userLocation.city && userLocation.state 
                  ? `${userLocation.city}, ${userLocation.state}` 
                  : 'Location detected'
                }
              </span>
            </div>
          ) : (
            <Button 
              onClick={getUserLocation} 
              variant="outline" 
              size="sm"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Enable Location
            </Button>
          )}
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {userLocation 
            ? 'Discover the best dining spots in your area, sorted by distance.'
            : 'Discover popular restaurants and enable location for personalized results.'
          }
        </p>
        {error && (
          <p className="text-orange-600 text-sm mt-2">{error}</p>
        )}
      </div>

      {/* Category Navigation */}
      <div className="flex overflow-x-auto gap-4 pb-4">
        {DISCOVERY_CATEGORIES.map((category, index) => (
          <Button
            key={index}
            variant={selectedCategory === index ? 'default' : 'outline'}
            className={`whitespace-nowrap flex-shrink-0 ${
              selectedCategory === index 
                ? 'aharamm-gradient text-white' 
                : 'hover:bg-orange-50 hover:border-orange-200'
            }`}
            onClick={() => setSelectedCategory(index)}
          >
            {category.title}
          </Button>
        ))}
      </div>

      {/* Selected Category Description */}
      <div className="text-center">
        <p className="text-gray-600">
          {DISCOVERY_CATEGORIES[selectedCategory].description}
        </p>
      </div>

      {/* Loading State */}
      {isLoadingRestaurants && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
            <p className="text-gray-600">Finding great restaurants for you...</p>
          </div>
        </div>
      )}

      {/* Restaurant Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
        {restaurants.length > 0 ? restaurants.map((restaurant) => (
          <Card 
            key={restaurant.id} 
            className="group cursor-pointer border-0 shadow-md hover:shadow-xl transition-all duration-300 restaurant-card-hover bg-white overflow-hidden"
          >
            <div className="relative">
              {/* Restaurant Image */}
              <Link href={`/restaurant/${restaurant.id}`}>
                <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden">
                  {getBestRestaurantImage(restaurant) ? (
                    <Image 
                      src={getBestRestaurantImage(restaurant)!} 
                      alt={restaurant.name}
                      fill
                      className="object-cover"
                      onError={() => {
                        // Handle image load error
                        console.log('Failed to load restaurant image');
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                      <ChefHat className="h-12 w-12 text-orange-400" />
                    </div>
                  )}
                  
                  {/* Restaurant Logo Circle - only show if logo exists */}
                  {restaurant.logoImage && (
                    <div className="absolute top-3 right-3 w-12 h-12 rounded-full bg-white p-1 shadow-lg">
                      <div className="relative w-full h-full">
                        <Image 
                          src={restaurant.logoImage} 
                          alt={`${restaurant.name} logo`}
                          fill
                          className="object-cover rounded-full"
                          onError={() => {
                            console.log('Failed to load restaurant logo');
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Distance indicator */}
                  {restaurant.distance && (
                    <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium">
                      {restaurant.distance.toFixed(1)} km
                    </div>
                  )}
                </div>
              </Link>

              {/* Verified Badge */}
              {restaurant.isVerified && (
                <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg">
                  ✓ Verified
                </div>
              )}

              {/* Distance & Directions */}
              {userLocation && (
                <div className="absolute bottom-3 left-3">
                  <a
                    href={getDirectionsUrl(restaurant)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-colors shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Navigation className="h-3 w-3" />
                    Directions
                  </a>
                </div>
              )}
            </div>

            <CardContent className="p-4 space-y-3">
              <Link href={`/restaurant/${restaurant.id}`}>
                {/* Restaurant Name & Description */}
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                    {restaurant.name}
                  </h3>
                  {restaurant.tagline && (
                    <p className="text-sm text-gray-600 line-clamp-1 font-medium">
                      {restaurant.tagline}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {restaurant.description}
                  </p>
                </div>

                {/* Rating & Location */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">
                      {restaurant.calculatedRating && restaurant.calculatedRating > 0 
                        ? Number(restaurant.calculatedRating).toFixed(1) 
                        : restaurant.averageRating 
                          ? Number(restaurant.averageRating).toFixed(1) 
                          : 'New'}
                    </span>
                    {((restaurant.actualReviewCount && restaurant.actualReviewCount > 0) || 
                      (restaurant.reviewCount && restaurant.reviewCount > 0)) && (
                      <span className="text-gray-500">
                        ({restaurant.actualReviewCount || restaurant.reviewCount})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate max-w-20">{restaurant.city}</span>
                  </div>
                </div>

                {/* Cuisine Types & Category */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {restaurant.category && (
                      <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 border-orange-200">
                        {restaurant.category}
                      </Badge>
                    )}
                    {restaurant.hasMenu && restaurant.menuItemCount && restaurant.menuItemCount > 0 && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                        Menu ({restaurant.menuItemCount})
                      </Badge>
                    )}
                    {restaurant.cuisineTypes.slice(0, 1).map((cuisine, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {cuisine}
                      </Badge>
                    ))}
                    {restaurant.cuisineTypes.length > 1 && (
                      <Badge variant="outline" className="text-xs">
                        +{restaurant.cuisineTypes.length - 1}
                      </Badge>
                    )}
                  </div>
                  {restaurant.distance && (
                    <span className="text-sm font-medium text-orange-600">
                      {restaurant.distance.toFixed(1)} km
                    </span>
                  )}
                </div>
              </Link>

              {/* View Menu Button */}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-3 group-hover:bg-orange-50 group-hover:border-orange-200 transition-colors"
                asChild
              >
                <Link href={`/restaurant/${restaurant.id}#menu`}>
                  View Menu
                </Link>
              </Button>
            </CardContent>
          </Card>
        )) : !isLoadingRestaurants && (
          <div className="col-span-full text-center py-12">
            <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Restaurants Found</h3>
            <p className="text-gray-600 mb-6">
              {userLocation 
                ? 'No restaurants found in your area. Try expanding your search radius or check back later.'
                : 'Enable location services to find restaurants near you, or browse our featured restaurants.'
              }
            </p>
            {!userLocation && (
              <Button 
                onClick={getUserLocation} 
                className="aharamm-gradient"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Find Restaurants Near Me
              </Button>
            )}
          </div>
        )}
      </div>

      {/* View All Button */}
      
    </div>
  );
}
