'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface LocationTrackerProps {
  autoSetOrigin?: boolean; // Set to true for first-time users
  updateInterval?: number; // How often to update location in milliseconds (default: 5 minutes)
}

export default function LocationTracker({ 
  autoSetOrigin = false, 
  updateInterval = 5 * 60 * 1000 // 5 minutes default
}: LocationTrackerProps) {
  const { user, isLoaded } = useUser();
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'success' | 'error'>('idle');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get user's current location
  const getCurrentLocation = (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          let errorMessage = 'Unknown location error';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000 // Cache for 1 minute
        }
      );
    });
  };

  // Save location to database using existing API
  const saveLocation = useCallback(async (locationData: LocationData, isFirstTime: boolean = false) => {
    try {
      const response = await fetch('/api/user/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          isFirstTime: isFirstTime || autoSetOrigin
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save location');
      }

      const result = await response.json();
      console.log('Location saved successfully:', result);
      return result;
    } catch (error) {
      console.error('Error saving location:', error);
      throw error;
    }
  }, [autoSetOrigin]);

  // Check if user has origin set
  const checkUserOrigin = useCallback(async () => {
    try {
      const response = await fetch('/api/user/origin');
      if (response.ok) {
        const result = await response.json();
        return result.success && result.origin !== null;
      }
      return false;
    } catch (error) {
      console.error('Error checking user origin:', error);
      return false;
    }
  }, []);

  // Main function to update user location
  const updateUserLocation = useCallback(async () => {
    if (!user || !isLoaded) return;

    setLocationStatus('requesting');
    setError(null);

    try {
      // Get current location
      const locationData = await getCurrentLocation();
      
      // Check if this is first time (no origin set)
      const hasOrigin = await checkUserOrigin();
      const isFirstTime = !hasOrigin || autoSetOrigin;

      // Save location (will save to both origin and location tables if first time)
      await saveLocation(locationData, isFirstTime);

      setLocationStatus('success');
      setLastUpdate(new Date());
      
      console.log('Location updated:', {
        lat: locationData.latitude,
        lng: locationData.longitude,
        isFirstTime,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      setLocationStatus('error');
      setError(error instanceof Error ? error.message : 'Unknown error');
      console.error('Location update failed:', error);
    }
  }, [user, isLoaded, autoSetOrigin, saveLocation, checkUserOrigin]);

  // Auto-update location on component mount and at intervals
  useEffect(() => {
    if (!user || !isLoaded) return;

    // Initial location update
    updateUserLocation();

    // Set up interval for regular updates
    const interval = setInterval(() => {
      updateUserLocation();
    }, updateInterval);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [user, isLoaded, updateInterval, updateUserLocation]);

  // Manual refresh function
  const refreshLocation = () => {
    updateUserLocation();
  };

  // Don't render anything if user is not loaded
  if (!isLoaded || !user) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-xs">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            Location Status
          </h3>
          <button
            onClick={refreshLocation}
            disabled={locationStatus === 'requesting'}
            className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {locationStatus === 'requesting' ? 'Updating...' : 'Refresh'}
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            locationStatus === 'success' ? 'bg-green-500' :
            locationStatus === 'requesting' ? 'bg-yellow-500 animate-pulse' :
            locationStatus === 'error' ? 'bg-red-500' : 'bg-gray-300'
          }`} />
          <span className="text-xs text-gray-600 dark:text-gray-300">
            {locationStatus === 'success' && lastUpdate ? 
              `Updated ${lastUpdate.toLocaleTimeString()}` :
            locationStatus === 'requesting' ? 'Getting location...' :
            locationStatus === 'error' ? 'Location failed' :
            'Location idle'
            }
          </span>
        </div>

        {error && (
          <div className="mt-2 text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {autoSetOrigin && (
          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
            Setting origin location...
          </div>
        )}
      </div>
    </div>
  );
}
