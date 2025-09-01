'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { MapPin, User, Heart, DollarSign, Bell, ArrowLeft } from 'lucide-react';
import { CUISINE_TYPES, DIETARY_TAGS } from '@/lib/constants';
import Link from 'next/link';

interface CustomerOnboardingData {
  // Personal Info
  displayName: string;
  phone: string;
  
  // Location Preferences
  homeAddress: string;
  workAddress: string;
  
  // Dietary Preferences
  dietaryRestrictions: string[];
  cuisinePreferences: string[];
  
  // Dining Preferences
  budgetMin: number;
  budgetMax: number;
  diningFrequency: 'rarely' | 'occasionally' | 'frequently' | 'daily';
  groupSizePreference: number;
  
  // Notification Settings
  notifications: {
    deals: boolean;
    newRestaurants: boolean;
    friendActivity: boolean;
    reviewReminders: boolean;
    marketingEmails: boolean;
  };
}

export default function CustomerOnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CustomerOnboardingData>({
    displayName: user?.firstName + ' ' + user?.lastName || '',
    phone: '',
    homeAddress: '',
    workAddress: '',
    dietaryRestrictions: [],
    cuisinePreferences: [],
    budgetMin: 15,
    budgetMax: 50,
    diningFrequency: 'occasionally',
    groupSizePreference: 2,
    notifications: {
      deals: true,
      newRestaurants: true,
      friendActivity: false,
      reviewReminders: true,
      marketingEmails: false,
    },
  });

  const totalSteps = 5;

  const handleInputChange = (field: keyof CustomerOnboardingData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleArrayToggle = (field: 'dietaryRestrictions' | 'cuisinePreferences', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value],
    }));
  };

  const handleNotificationChange = (key: keyof CustomerOnboardingData['notifications'], value: boolean) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value,
      },
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Save customer data to database
      const response = await fetch('/api/onboarding/customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Update user metadata to mark onboarding as complete
        await user?.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            userType: 'customer',
            isOnboardingCompleted: true,
          },
        });
        
        // Small delay to ensure metadata is updated
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Redirect to home with welcome message
        router.push('/?welcome=true');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save onboarding data');
      }
    } catch (error) {
      console.error('Customer onboarding error:', error);
      alert('Failed to complete setup. Please try again.');
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-orange-500" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  placeholder="How should we call you?"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="For restaurant reservations and updates"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-500" />
                Location Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="homeAddress">Home Address (Optional)</Label>
                <Input
                  id="homeAddress"
                  value={formData.homeAddress}
                  onChange={(e) => handleInputChange('homeAddress', e.target.value)}
                  placeholder="For personalized nearby restaurant recommendations"
                />
              </div>
              <div>
                <Label htmlFor="workAddress">Work Address (Optional)</Label>
                <Input
                  id="workAddress"
                  value={formData.workAddress}
                  onChange={(e) => handleInputChange('workAddress', e.target.value)}
                  placeholder="For lunch and after-work dining suggestions"
                />
              </div>
              <p className="text-sm text-gray-500">
                We&lsquo;ll use these locations to suggest restaurants near you. You can always update or remove them later.
              </p>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-orange-500" />
                Food Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Dietary Restrictions</Label>
                <p className="text-sm text-gray-500 mb-3">Select any that apply to you</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {DIETARY_TAGS.map((tag) => (
                    <Badge
                      key={tag.value}
                      variant={formData.dietaryRestrictions.includes(tag.value) ? 'default' : 'outline'}
                      className={`cursor-pointer p-2 text-center justify-center ${
                        formData.dietaryRestrictions.includes(tag.value) 
                          ? 'aharamm-gradient text-white' 
                          : 'hover:bg-orange-50'
                      }`}
                      onClick={() => handleArrayToggle('dietaryRestrictions', tag.value)}
                    >
                      {tag.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Favorite Cuisines</Label>
                <p className="text-sm text-gray-500 mb-3">Choose your favorite types of food (select up to 5)</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {CUISINE_TYPES.slice(0, 20).map((cuisine) => (
                    <Badge
                      key={cuisine}
                      variant={formData.cuisinePreferences.includes(cuisine) ? 'default' : 'outline'}
                      className={`cursor-pointer p-2 text-center justify-center ${
                        formData.cuisinePreferences.includes(cuisine) 
                          ? 'aharamm-gradient text-white' 
                          : 'hover:bg-orange-50'
                      } ${formData.cuisinePreferences.length >= 5 && !formData.cuisinePreferences.includes(cuisine) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => {
                        if (formData.cuisinePreferences.length < 5 || formData.cuisinePreferences.includes(cuisine)) {
                          handleArrayToggle('cuisinePreferences', cuisine);
                        }
                      }}
                    >
                      {cuisine}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Selected: {formData.cuisinePreferences.length}/5
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-orange-500" />
                Dining Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Budget Range (per person)</Label>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <Label htmlFor="budgetMin">Minimum ($)</Label>
                    <Input
                      id="budgetMin"
                      type="number"
                      value={formData.budgetMin}
                      onChange={(e) => handleInputChange('budgetMin', parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="budgetMax">Maximum ($)</Label>
                    <Input
                      id="budgetMax"
                      type="number"
                      value={formData.budgetMax}
                      onChange={(e) => handleInputChange('budgetMax', parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Current range: ${formData.budgetMin} - ${formData.budgetMax} per person
                </p>
              </div>

              <div>
                <Label className="text-base font-medium">How often do you dine out?</Label>
                <RadioGroup
                  value={formData.diningFrequency}
                  onValueChange={(value: string) => handleInputChange('diningFrequency', value)}
                  className="mt-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="rarely" id="rarely" />
                    <Label htmlFor="rarely">Rarely (once a month or less)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="occasionally" id="occasionally" />
                    <Label htmlFor="occasionally">Occasionally (2-4 times a month)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="frequently" id="frequently" />
                    <Label htmlFor="frequently">Frequently (1-2 times a week)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="daily" id="daily" />
                    <Label htmlFor="daily">Daily (almost every day)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="groupSize" className="text-base font-medium">
                  Typical group size
                </Label>
                <Input
                  id="groupSize"
                  type="number"
                  value={formData.groupSizePreference}
                  onChange={(e) => handleInputChange('groupSizePreference', parseInt(e.target.value) || 1)}
                  min="1"
                  max="20"
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">
                  How many people do you usually dine with (including yourself)?
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-500" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 mb-4">
                Stay updated with personalized recommendations and restaurant updates. You can change these anytime.
              </p>
              
              {[
                { key: 'deals', label: 'Special deals and offers', description: 'Get notified about discounts at your favorite restaurants' },
                { key: 'newRestaurants', label: 'New restaurants in your area', description: 'Be the first to discover new dining spots' },
                { key: 'friendActivity', label: 'Friend activity (coming soon)', description: 'See what your friends are dining' },
                { key: 'reviewReminders', label: 'Review reminders', description: 'Gentle reminders to review places you\'ve visited' },
                { key: 'marketingEmails', label: 'Marketing emails', description: 'Food trends, tips, and platform updates' },
              ].map((item) => (
                <div key={item.key} className="flex items-start space-x-3 p-3 rounded-lg border">
                  <Checkbox
                    id={item.key}
                    checked={formData.notifications[item.key as keyof typeof formData.notifications]}
                    onCheckedChange={(checked) => 
                      handleNotificationChange(item.key as keyof typeof formData.notifications, !!checked)
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor={item.key} className="font-medium cursor-pointer">
                      {item.label}
                    </Label>
                    <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/onboarding" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to user type selection
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Let&lsquo;s personalize your experience
          </h1>
          <p className="text-gray-600">
            Step {currentStep} of {totalSteps} - Help us tailor restaurant recommendations just for you
          </p>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div 
              className="aharamm-gradient h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Step */}
        <div className="mb-8">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          
          {currentStep === totalSteps ? (
            <Button 
              onClick={handleSubmit}
              disabled={isLoading}
              className="aharamm-gradient"
            >
              {isLoading ? 'Setting up your account...' : 'Complete Setup'}
            </Button>
          ) : (
            <Button 
              onClick={handleNext}
              className="aharamm-gradient"
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
