'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Store, ChefHat, Heart } from 'lucide-react';
import Image from 'next/image';

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [selectedUserType, setSelectedUserType] = useState<'customer' | 'restaurant_owner' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUserTypeSelection = async (userType: 'customer' | 'restaurant_owner') => {
    setIsLoading(true);
    setSelectedUserType(userType);
    
    try {
      // Update user metadata with selected type
      await user?.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          userType,
        },
      });

      // Small delay to ensure metadata is updated
      await new Promise(resolve => setTimeout(resolve, 500));

      // Navigate to appropriate onboarding form
      if (userType === 'customer') {
        router.push('/onboarding/customer');
      } else {
        router.push('/onboarding/restaurant-owner');
      }
    } catch (error) {
      console.error('Error updating user type:', error);
      
      // Even if metadata update fails, we can still proceed with onboarding
      // The specific onboarding pages will handle metadata updates
      if (userType === 'customer') {
        router.push('/onboarding/customer');
      } else {
        router.push('/onboarding/restaurant-owner');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Top-left corner logo */}
      <div className="absolute top-6 left-6 z-10">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full  shadow-md flex items-center justify-center p-1">
            <Image 
              src="/192x192 Logo.png" 
              alt="Aharamm AI Logo" 
              width={24} 
              height={24}
              className="rounded-full"
              priority
            />
          </div>
          <span className="font-bold text-lg text-gray-900">Aharamm AI</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex items-center justify-center min-h-screen p-4 pt-20">
        <div className="w-full max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Welcome to Aharam AI! 👋
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
Let&apos;s personalize your food discovery experience. Tell us how you&apos;d like to use our platform.
            </p>
          </div>

        {/* User Type Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Customer Card */}
          <Card 
            className={`group cursor-pointer transition-all duration-300 hover:shadow-xl border-2 ${
              selectedUserType === 'customer' 
                ? 'border-orange-500 shadow-lg ring-2 ring-orange-200' 
                : 'border-gray-200 hover:border-orange-200'
            }`}
            onClick={() => setSelectedUserType('customer')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 group-hover:scale-110 transition-transform">
                <Users className="h-12 w-12 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
I&apos;m a Food Lover
              </CardTitle>
              <p className="text-gray-600">
                Discover amazing restaurants and dishes
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-500" />
                  <span className="text-sm text-gray-700">Discover personalized restaurant recommendations</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChefHat className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-gray-700">Explore cuisines and food experiences</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-700">Read and write authentic reviews</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-4">
                <Badge variant="outline" className="text-xs">AI Recommendations</Badge>
                <Badge variant="outline" className="text-xs">Save Favorites</Badge>
                <Badge variant="outline" className="text-xs">Share Reviews</Badge>
              </div>

              <Button
                className={`w-full mt-6 ${
                  selectedUserType === 'customer' 
                    ? 'aharamm-gradient' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                onClick={() => handleUserTypeSelection('customer')}
                disabled={isLoading}
              >
                {isLoading && selectedUserType === 'customer' ? 'Setting up...' : 'Get Started as Food Lover'}
              </Button>
            </CardContent>
          </Card>

          {/* Restaurant Owner Card */}
          <Card 
            className={`group cursor-pointer transition-all duration-300 hover:shadow-xl border-2 ${
              selectedUserType === 'restaurant_owner' 
                ? 'border-orange-500 shadow-lg ring-2 ring-orange-200' 
                : 'border-gray-200 hover:border-orange-200'
            }`}
            onClick={() => setSelectedUserType('restaurant_owner')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 group-hover:scale-110 transition-transform">
                <Store className="h-12 w-12 text-orange-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
I&apos;m a Restaurant Owner
              </CardTitle>
              <p className="text-gray-600">
                Showcase your restaurant to food enthusiasts
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-gray-700">Create and manage your restaurant profile</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChefHat className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-gray-700">Upload and organize your menu</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-700">Connect with customers and get reviews</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-4">
                <Badge variant="outline" className="text-xs">Menu Management</Badge>
                <Badge variant="outline" className="text-xs">Customer Analytics</Badge>
                <Badge variant="outline" className="text-xs">Review Responses</Badge>
              </div>

              <Button
                className={`w-full mt-6 ${
                  selectedUserType === 'restaurant_owner' 
                    ? 'aharamm-gradient' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                onClick={() => handleUserTypeSelection('restaurant_owner')}
                disabled={isLoading}
              >
                {isLoading && selectedUserType === 'restaurant_owner' ? 'Setting up...' : 'Get Started as Restaurant Owner'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">
Don&apos;t worry, you can always change this later in your profile settings.
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}
