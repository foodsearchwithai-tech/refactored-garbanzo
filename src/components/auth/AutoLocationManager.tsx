'use client';

import { useLocationManager } from './useLocationManager';
import { useUser } from '@clerk/nextjs';

export default function AutoLocationManager() {
  const { user, isLoaded } = useUser();

  // Only track location for authenticated users
  useLocationManager({
    autoSetOrigin: false, // Let the system determine if origin needs to be set
    updateInterval: 5 * 60 * 1000, // Update every 5 minutes
    onLocationUpdate: (data) => {
      console.log('Location updated automatically:', {
        timestamp: new Date().toISOString(),
        success: data.success
      });
    },
    onError: (error) => {
      console.warn('Location update failed:', error);
    }
  });

  // This component doesn't render anything - it just manages location in the background
  if (!isLoaded || !user) return null;
  
  return null;
}
