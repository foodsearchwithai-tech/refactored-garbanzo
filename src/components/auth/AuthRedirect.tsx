'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthRedirectProps {
  children: React.ReactNode;
}

export default function AuthRedirect({ children }: AuthRedirectProps) {
  const { isSignedIn, user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return; // Wait for Clerk to load

    // Check if we're on the home page with welcome=true (just completed onboarding)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const welcomeParam = urlParams.get('welcome');
      
      // If welcome=true, user just completed onboarding - don't redirect
      if (welcomeParam === 'true') {
        return;
      }
    }

    if (isSignedIn && user) {
      // Check if user has completed onboarding
      const isOnboardingCompleted = user.unsafeMetadata?.isOnboardingCompleted;
      const userType = user.unsafeMetadata?.userType;

      // Skip redirect if we're already on an onboarding page
      const pathname = window.location.pathname;
      if (pathname.startsWith('/onboarding')) {
        return;
      }

      // If authenticated but haven't completed onboarding, redirect to onboarding
      if (!isOnboardingCompleted && !userType) {
        router.push('/onboarding');
        return;
      }

      // If user has selected type but hasn't completed specific onboarding
      if (userType && !isOnboardingCompleted) {
        if (userType === 'customer') {
          router.push('/onboarding/customer');
        } else if (userType === 'restaurant_owner') {
          router.push('/onboarding/restaurant-owner');
        }
        return;
      }
    }
  }, [isSignedIn, user, isLoaded, router]);

  // Show loading while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
