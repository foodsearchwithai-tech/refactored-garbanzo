'use client';

import { useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';

/**
 * Custom hook to automatically manage user location
 * - Saves origin location (fixed, once per user)
 * - Updates current location frequently (one row per user, gets updated)
 */
export function useLocationManager(options: {
  autoSetOrigin?: boolean;
  updateInterval?: number; // in milliseconds
  onLocationUpdate?: (data: {success: boolean; message?: string; data?: unknown}) => void;
  onError?: (error: string) => void;
} = {}) {
  const { 
    autoSetOrigin = false, 
    updateInterval = 5 * 60 * 1000, // 5 minutes
    onLocationUpdate,
    onError 
  } = options;
  
  const { user, isLoaded } = useUser();

  // Get current location from browser
  const getCurrentLocation = useCallback((): Promise<{latitude: number; longitude: number}> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        () => {
          reject(new Error('Location access denied or unavailable'));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }, []);

  // Check if user origin exists
  const checkUserOrigin = useCallback(async () => {
    try {
      const response = await fetch('/api/user/origin');
      if (response.ok) {
        const result = await response.json();
        return result.success && result.origin;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // Save location using existing API
  const saveLocation = useCallback(async (lat: number, lng: number, isFirstTime: boolean = false) => {
    try {
      const response = await fetch('/api/user/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          isFirstTime: isFirstTime || autoSetOrigin
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save location');
      }

      const result = await response.json();
      onLocationUpdate?.(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onError?.(errorMessage);
      throw error;
    }
  }, [autoSetOrigin, onLocationUpdate, onError]);

  // Main location update function
  const updateLocation = useCallback(async () => {
    try {
      // Get current coordinates
      const coords = await getCurrentLocation();
      
      // Check if origin exists
      const hasOrigin = await checkUserOrigin();
      const isFirstTime = !hasOrigin || autoSetOrigin;

      // Save to database (handles both origin and current location)
      await saveLocation(coords.latitude, coords.longitude, isFirstTime);
      
    } catch (error) {
      console.error('Location update failed:', error);
    }
  }, [getCurrentLocation, checkUserOrigin, autoSetOrigin, saveLocation]);

  // Auto-update effect
  useEffect(() => {
    if (!user || !isLoaded) return;

    // Initial update
    updateLocation();

    // Set up interval
    const interval = setInterval(updateLocation, updateInterval);

    return () => clearInterval(interval);
  }, [user, isLoaded, updateLocation, updateInterval]);

  return {
    updateLocation,
    getCurrentLocation,
    checkUserOrigin
  };
}
