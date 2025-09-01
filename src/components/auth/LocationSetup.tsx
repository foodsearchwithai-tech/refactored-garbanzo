'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface LocationSetupProps {
  onLocationSet?: (success: boolean) => void;
  isOnboarding?: boolean;
}

export default function LocationSetup({ onLocationSet, isOnboarding = false }: LocationSetupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const requestLocation = async () => {
    setIsLoading(true);
    setError(null);
    setStatus('idle');

    try {
      // Get location from browser
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported by this browser'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            let errorMessage = 'Location access failed';
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Please allow location access to continue';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information is unavailable';
                break;
              case error.TIMEOUT:
                errorMessage = 'Location request timed out';
                break;
            }
            reject(new Error(errorMessage));
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000
          }
        );
      });

      // Save to database
      const response = await fetch('/api/user/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          isFirstTime: isOnboarding
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save location');
      }

      const result = await response.json();
      console.log('Location set successfully:', result);

      setStatus('success');
      onLocationSet?.(true);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      setStatus('error');
      onLocationSet?.(false);
      console.error('Location setup failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <span className="text-2xl">📍</span>
          {isOnboarding ? 'Set Your Location' : 'Update Location'}
        </CardTitle>
        <CardDescription>
          {isOnboarding 
            ? 'We need your location to show nearby restaurants and personalized recommendations'
            : 'Update your current location to get better recommendations'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {status === 'success' && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">
              ✅ Location {isOnboarding ? 'set' : 'updated'} successfully!
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <Button 
          onClick={requestLocation}
          disabled={isLoading || status === 'success'}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Getting Location...
            </span>
          ) : status === 'success' ? (
            'Location Set ✓'
          ) : (
            `${isOnboarding ? 'Allow' : 'Update'} Location Access`
          )}
        </Button>

        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>• Your location is used to find nearby restaurants</p>
          <p>• Location data is stored securely and privately</p>
          <p>• You can update your location anytime</p>
        </div>
      </CardContent>
    </Card>
  );
}
