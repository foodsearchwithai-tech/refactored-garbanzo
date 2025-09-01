'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MessagingManager from '@/components/restaurant/MessagingManager';
import { 
  Eye,
  MousePointer, 
  Heart,
  Phone,
  Navigation,
  Star,
  TrendingUp,
  TrendingDown,
  Clock,
  BarChart3,
  Save,
  Edit,
  X,
  Camera,
  MapPin,
  Globe,
  Building,
  Award,
  ChefHat,
  Image as ImageIcon,
  Activity,
  Users,
  Utensils,
  ExternalLink,
  DollarSign,
  MessageCircle
} from 'lucide-react';

interface RestaurantData {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  isVerified: boolean | null;
  cuisineTypes: string[];
  category: string;
  tagline: string | null;
  profileImage: string | null;
  coverImages: string[];
  averageRating: number;
  reviewCount: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  socialMedia: Record<string, string> | null;
  operatingHours: Record<string, { isOpen: boolean; openTime?: string; closeTime?: string }> | null;
  policies: Record<string, string> | null;
  features: string[];
  externalLinks: Record<string, string> | null;
  businessLicense: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  kitchenStory: string | null;
  kitchenPhotos: string[];
  achievements: { title: string; description: string; issuer: string; year?: number }[];
  achievementPhotos: string[];
  galleryImages: string[];
  bannerImages: string[];
  logoImage: string | null;
  deliveryPartners: string[];
}

interface AnalyticsData {
  totalViews: number;
  totalClicks: number;
  totalCalls: number;
  totalDirections: number;
  viewsToday: number;
  viewsThisWeek: number;
  viewsThisMonth: number;
  peakHour: number;
  conversionRate: number;
  lastViewAt: string | null;
  totalReviews: number;
  averageRating: number;
  totalMenuItems: number;
  totalFavorites: number;
  viewsGrowth: number;
  engagementRate: number;
  eventBreakdown: {
    views: number;
    clicks: number;
    favorites: number;
    calls: number;
    directions: number;
  };
  performance: {
    peakTrafficHour: number;
    conversionRate: number;
    averageSessionDuration: number;
    bounceRate: number;
  };
}

interface DashboardData {
  hasRestaurant: boolean;
  restaurant: RestaurantData;
  analytics: AnalyticsData;
  recentReviews: { id: string; rating: number; comment: string; createdAt: string; userId: string }[];
  images: { id: string; url: string; alt: string; entityType: string; entityId: string }[];
  recentEvents: { event_type: string; created_at: string; metadata: Record<string, unknown>; user_id: string | null }[];
  hourlyAnalytics: { hour: number; total_events: number; views: number; clicks: number; favorites: number }[];
}

export default function RestaurantDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editedData, setEditedData] = useState<Partial<RestaurantData>>({});
  const [activeSection, setActiveSection] = useState('overview');
  const [tempUploadedImages, setTempUploadedImages] = useState<{logo?: string, banner?: string}>({});
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch('/api/restaurant/dashboard', {
        headers: {
          'x-user-id': user?.id || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        setEditedData(data.restaurant);
      } else {
        console.error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
      return;
    }

    if (isLoaded && user) {
      fetchDashboardData();
    }
  }, [isLoaded, user, router, fetchDashboardData]);

  const cleanupUnusedImages = async (imagesToDelete: string[]) => {
    for (const imageUrl of imagesToDelete) {
      try {
        await fetch(`/api/upload?url=${encodeURIComponent(imageUrl)}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }
  };

  const handleSave = async () => {
    if (!dashboardData?.restaurant.id) return;
    
    setIsSaving(true);
    try {
      // Apply temporary images to edited data before saving
      const dataToSave = { ...editedData };
      
      if (tempUploadedImages.logo) {
        dataToSave.logoImage = tempUploadedImages.logo;
      }
      
      if (tempUploadedImages.banner) {
        const currentImages = restaurant.coverImages || [];
        dataToSave.coverImages = [tempUploadedImages.banner, ...currentImages.slice(1)];
      }

      const response = await fetch(`/api/restaurant/${dashboardData.restaurant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
      });

      if (response.ok) {
        setIsEditing(false);
        // Clear temporary states on successful save
        setTempUploadedImages({});
        setUploadedImageUrls([]);
        await fetchDashboardData(); // Refresh data
      } else {
        console.error('Failed to save restaurant data');
      }
    } catch (error) {
      console.error('Error saving restaurant data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof RestaurantData, value: string | boolean | string[] | Record<string, unknown> | { title: string; description: string; issuer: string; year?: number }[] | null) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCancelEdit = async () => {
    // Clean up any uploaded images that weren't saved
    if (uploadedImageUrls.length > 0) {
      await cleanupUnusedImages(uploadedImageUrls);
    }
    
    setIsEditing(false);
    setEditedData({});
    setTempUploadedImages({});
    setUploadedImageUrls([]);
  };

  const handleImageUpload = async (file: File, type: 'logo' | 'banner') => {
    setIsUploading(true);
    try {
      const timestamp = Date.now();
      const filename = `restaurant-${type}/${timestamp}-${file.name}`;

      const response = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}&entityType=restaurant`, {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store temporary preview and track uploaded URL for cleanup
        setTempUploadedImages(prev => ({
          ...prev,
          [type]: data.url
        }));
        
        setUploadedImageUrls(prev => [...prev, data.url]);
        
        return data.url;
      } else {
        console.error('Upload failed:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData?.hasRestaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md border-orange-200">
          <CardContent className="p-8 text-center">
            <ChefHat className="h-16 w-16 text-orange-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Restaurant Found</h2>
            <p className="text-gray-600 mb-6">
              You haven&apos;t created a restaurant profile yet. Complete your onboarding to get started.
            </p>
            <Button 
              onClick={() => router.push('/onboarding/restaurant-owner')} 
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            >
              Complete Onboarding
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { restaurant, analytics } = dashboardData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-orange-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 space-y-3 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{restaurant.name}</h1>
                <p className="text-sm sm:text-base text-gray-600">Restaurant Dashboard</p>
              </div>
              {restaurant.isVerified && (
                <Badge className="bg-green-100 text-green-800 border-green-200 self-start sm:self-auto">
                  <Award className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              {isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleCancelEdit}
                    className="border-gray-300 w-full sm:w-auto"
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white w-full sm:w-auto"
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white w-full sm:w-auto"
                    size="sm"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Edit Restaurant</span>
                    <span className="sm:hidden">Edit</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => router.push(`/restaurant/${restaurant.id}`)}
                    className="border-orange-300 text-orange-700 hover:bg-orange-50 w-full sm:w-auto"
                    size="sm"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">View Public</span>
                    <span className="sm:hidden">View</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-2 sm:space-x-8 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            {[
              { id: 'overview', label: 'Analytics', icon: BarChart3 },
              { id: 'basic', label: 'Basic Info', icon: Building },
              { id: 'contact', label: 'Contact', icon: MapPin },
              { id: 'features', label: 'Features', icon: Star },
              { id: 'media', label: 'Media', icon: ImageIcon },
              { id: 'menu', label: 'Menu', icon: Utensils },
              { id: 'messaging', label: 'Messages', icon: MessageCircle },
              { id: 'activity', label: 'Activity', icon: Activity }
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-2 sm:px-4 border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeSection === section.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <section.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm font-medium">{section.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Analytics Overview */}
        {activeSection === 'overview' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
              <Card className="border-orange-100 bg-gradient-to-br from-white to-orange-50">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-gray-600 truncate">Total Views</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{analytics.totalViews.toLocaleString()}</p>
                    </div>
                    <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 flex-shrink-0" />
                  </div>
                  <div className="flex items-center mt-2">
                    <span className="text-xs text-gray-500">Today: {analytics.viewsToday}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-100 bg-gradient-to-br from-white to-orange-50">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-gray-600 truncate">Total Clicks</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{analytics.totalClicks.toLocaleString()}</p>
                    </div>
                    <MousePointer className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 flex-shrink-0" />
                  </div>
                  <div className="flex items-center mt-2">
                    <span className="text-xs text-gray-500">CTR: {analytics.totalViews > 0 ? ((analytics.totalClicks / analytics.totalViews) * 100).toFixed(1) : 0}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-100 bg-gradient-to-br from-white to-orange-50">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-gray-600 truncate">Favorites</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{analytics.totalFavorites.toLocaleString()}</p>
                    </div>
                    <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 flex-shrink-0" />
                  </div>
                  <div className="flex items-center mt-2">
                    <span className="text-xs text-gray-500">Customer Interest</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-100 bg-gradient-to-br from-white to-orange-50">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-gray-600 truncate">Phone Calls</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{analytics.totalCalls.toLocaleString()}</p>
                    </div>
                    <Phone className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 flex-shrink-0" />
                  </div>
                  <div className="flex items-center mt-2">
                    <span className="text-xs text-gray-500">Direct Contact</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-100 bg-gradient-to-br from-white to-orange-50">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-gray-600 truncate">Directions</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{analytics.totalDirections.toLocaleString()}</p>
                    </div>
                    <Navigation className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 flex-shrink-0" />
                  </div>
                  <div className="flex items-center mt-2">
                    <span className="text-xs text-gray-500">Visit Intent</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-100 bg-gradient-to-br from-white to-orange-50">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-gray-600 truncate">Reviews</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{analytics.totalReviews}</p>
                    </div>
                    <Star className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 flex-shrink-0" />
                  </div>
                  <div className="flex items-center mt-2">
                    <span className="text-xs text-gray-500">Avg: {Number(analytics.averageRating || 0).toFixed(1)} ⭐</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card className="border-orange-100">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center text-gray-900 text-base sm:text-lg">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 mr-2" />
                    Views Trend
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Today</span>
                      <span className="font-semibold text-gray-900">{analytics.viewsToday}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">This Week</span>
                      <span className="font-semibold text-gray-900">{analytics.viewsThisWeek}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">This Month</span>
                      <span className="font-semibold text-gray-900">{analytics.viewsThisMonth}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Growth</span>
                      <div className="flex items-center">
                        {analytics.viewsGrowth > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                        )}
                        <span className={`font-semibold ${analytics.viewsGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {analytics.viewsGrowth}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-100">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center text-gray-900 text-base sm:text-lg">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 mr-2" />
                    Performance Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Peak Traffic Hour</span>
                      <span className="font-semibold text-gray-900">{analytics.peakHour}:00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Conversion Rate</span>
                      <span className="font-semibold text-gray-900">{analytics.conversionRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Engagement Rate</span>
                      <span className="font-semibold text-gray-900">{analytics.engagementRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Menu Items</span>
                      <span className="font-semibold text-gray-900">{analytics.totalMenuItems}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Basic Information */}
        {activeSection === 'basic' && (
          <div className="space-y-4 sm:space-y-6">
            <Card className="border-orange-100">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center text-gray-900 text-base sm:text-lg">
                  <Building className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 mr-2" />
                  Basic Restaurant Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Restaurant Name *</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={editedData.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="border-orange-200 focus:border-orange-500"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{restaurant.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    {isEditing ? (
                      <Select
                        value={editedData.category || ''}
                        onValueChange={(value) => handleInputChange('category', value)}
                      >
                        <SelectTrigger className="border-orange-200 focus:border-orange-500">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fine_dining">Fine Dining</SelectItem>
                          <SelectItem value="casual_dining">Casual Dining</SelectItem>
                          <SelectItem value="fast_food">Fast Food</SelectItem>
                          <SelectItem value="cafe">Cafe</SelectItem>
                          <SelectItem value="bakery">Bakery</SelectItem>
                          <SelectItem value="bar">Bar</SelectItem>
                          <SelectItem value="food_truck">Food Truck</SelectItem>
                          <SelectItem value="ghost_kitchen">Ghost Kitchen</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-gray-700 capitalize">{restaurant.category?.replace('_', ' ')}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  {isEditing ? (
                    <Input
                      id="tagline"
                      value={editedData.tagline || ''}
                      onChange={(e) => handleInputChange('tagline', e.target.value)}
                      placeholder="A catchy tagline for your restaurant"
                      className="border-orange-200 focus:border-orange-500"
                    />
                  ) : (
                    <p className="text-gray-700">{restaurant.tagline || 'No tagline set'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  {isEditing ? (
                    <Textarea
                      id="description"
                      value={editedData.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={4}
                      className="border-orange-200 focus:border-orange-500"
                    />
                  ) : (
                    <p className="text-gray-700">{restaurant.description || 'No description provided'}</p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-8">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="isActive">Active Listing</Label>
                    {isEditing ? (
                      <Switch
                        id="isActive"
                        checked={editedData.isActive ?? restaurant.isActive}
                        onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                      />
                    ) : (
                      <Badge variant={restaurant.isActive ? "default" : "destructive"} className={restaurant.isActive ? "bg-green-100 text-green-800" : ""}>
                        {restaurant.isActive ? "Active" : "Inactive"}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Label>Verified Status</Label>
                    <Badge variant={restaurant.isVerified ? "default" : "secondary"} className={restaurant.isVerified ? "bg-green-100 text-green-800" : ""}>
                      {restaurant.isVerified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Contact & Location */}
        {activeSection === 'contact' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-orange-100">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <Phone className="h-5 w-5 text-orange-500 mr-2" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={editedData.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="border-orange-200 focus:border-orange-500"
                      />
                    ) : (
                      <p className="text-gray-900">{restaurant.phone || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={editedData.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="contact@restaurant.com"
                        className="border-orange-200 focus:border-orange-500"
                      />
                    ) : (
                      <p className="text-gray-900">{restaurant.email || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    {isEditing ? (
                      <Input
                        id="website"
                        value={editedData.website || ''}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="https://restaurant.com"
                        className="border-orange-200 focus:border-orange-500"
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-gray-500" />
                        <p className="text-gray-900">{restaurant.website || 'Not provided'}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessLicense">Business License</Label>
                    {isEditing ? (
                      <Input
                        id="businessLicense"
                        value={editedData.businessLicense || ''}
                        onChange={(e) => handleInputChange('businessLicense', e.target.value)}
                        placeholder="License number"
                        className="border-orange-200 focus:border-orange-500"
                      />
                    ) : (
                      <p className="text-gray-900">{restaurant.businessLicense || 'Not provided'}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-100">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <MapPin className="h-5 w-5 text-orange-500 mr-2" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    {isEditing ? (
                      <Input
                        id="address"
                        value={editedData.address || ''}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="border-orange-200 focus:border-orange-500"
                      />
                    ) : (
                      <p className="text-gray-900">{restaurant.address}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      {isEditing ? (
                        <Input
                          id="city"
                          value={editedData.city || ''}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className="border-orange-200 focus:border-orange-500"
                        />
                      ) : (
                        <p className="text-gray-900">{restaurant.city}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      {isEditing ? (
                        <Input
                          id="state"
                          value={editedData.state || ''}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          className="border-orange-200 focus:border-orange-500"
                        />
                      ) : (
                        <p className="text-gray-900">{restaurant.state}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code *</Label>
                    {isEditing ? (
                      <Input
                        id="zipCode"
                        value={editedData.zipCode || ''}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                        className="border-orange-200 focus:border-orange-500"
                      />
                    ) : (
                      <p className="text-gray-900">{restaurant.zipCode}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Coordinates</Label>
                    <p className="text-gray-700 text-sm">
                      {restaurant.latitude && restaurant.longitude 
                        ? `${Number(restaurant.latitude).toFixed(6)}, ${Number(restaurant.longitude).toFixed(6)}`
                        : 'Not set - will be geocoded automatically'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Features & Services */}
        {activeSection === 'features' && (
          <div className="space-y-6">
            <Card className="border-orange-100">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <ChefHat className="h-5 w-5 text-orange-500 mr-2" />
                  Features & Services
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Cuisine Types</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {restaurant.cuisineTypes?.length > 0 ? restaurant.cuisineTypes.map((cuisine, index) => (
                        <Badge key={index} variant="outline" className="border-orange-200">
                          {cuisine}
                        </Badge>
                      )) : (
                        <span className="text-sm text-gray-500">No cuisine types set</span>
                      )}
                    </div>
                    {isEditing && (
                      <p className="text-xs text-gray-500 mt-1">
                        Editing cuisine types requires backend implementation
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="text-base font-medium">Restaurant Features</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {restaurant.features?.length > 0 ? restaurant.features.map((feature, index) => (
                        <Badge key={index} variant="secondary" className="bg-orange-100 text-orange-800">
                          {feature.replace('_', ' ')}
                        </Badge>
                      )) : (
                        <span className="text-sm text-gray-500">No features set</span>
                      )}
                    </div>
                    {isEditing && (
                      <p className="text-xs text-gray-500 mt-1">
                        Editing features requires backend implementation
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="text-base font-medium">Delivery Partners</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {restaurant.deliveryPartners?.length > 0 ? restaurant.deliveryPartners.map((partner, index) => (
                        <Badge key={index} variant="outline" className="border-orange-200">
                          {partner}
                        </Badge>
                      )) : (
                        <span className="text-sm text-gray-500">No delivery partners set</span>
                      )}
                    </div>
                    {isEditing && (
                      <p className="text-xs text-gray-500 mt-1">
                        Editing delivery partners requires backend implementation
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Media & Story */}
        {activeSection === 'media' && (
          <div className="space-y-6">
            {/* Logo and Banner Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Logo Upload */}
              <Card className="border-orange-100">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <Building className="h-5 w-5 text-orange-500 mr-2" />
                    Restaurant Logo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    {(tempUploadedImages.logo || restaurant.logoImage) ? (
                      <div className="relative aspect-square max-w-[200px] mx-auto rounded-lg overflow-hidden border-2 border-orange-200 bg-white">
                        <Image
                          src={tempUploadedImages.logo || restaurant.logoImage || ''}
                          alt="Restaurant Logo"
                          width={200}
                          height={200}
                          className="w-full h-full object-contain p-2"
                        />
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => {
                              if (tempUploadedImages.logo) {
                                // Remove from temp images and uploaded URLs for cleanup
                                const urlToRemove = tempUploadedImages.logo;
                                setTempUploadedImages(prev => ({ ...prev, logo: undefined }));
                                setUploadedImageUrls(prev => prev.filter(url => url !== urlToRemove));
                                // Clean up the uploaded file immediately
                                cleanupUnusedImages([urlToRemove]);
                              } else {
                                handleInputChange('logoImage', null);
                              }
                            }}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                        {tempUploadedImages.logo && (
                          <div className="absolute bottom-0 left-0 right-0 bg-orange-500 text-white text-xs px-2 py-1">
                            Preview (not saved)
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="aspect-square max-w-[200px] mx-auto rounded-lg border-2 border-dashed border-orange-300 bg-orange-50 flex items-center justify-center">
                        <div className="text-center">
                          <Building className="h-12 w-12 text-orange-400 mx-auto mb-2" />
                          <p className="text-orange-600 font-medium">No Logo</p>
                          <p className="text-sm text-orange-500">Upload your restaurant logo</p>
                        </div>
                      </div>
                    )}
                    
                    {isEditing && (
                      <div className="mt-4 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file && !isUploading) {
                              await handleImageUpload(file, 'logo');
                            }
                          }}
                          className="hidden"
                          id="logo-upload"
                          disabled={isUploading}
                        />
                        <label
                          htmlFor="logo-upload"
                          className={`inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 cursor-pointer transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          {isUploading ? 'Uploading...' : tempUploadedImages.logo ? 'Change Logo' : restaurant.logoImage ? 'Change Logo' : 'Upload Logo'}
                        </label>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Banner Upload */}
              <Card className="border-orange-100">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <ImageIcon className="h-5 w-5 text-orange-500 mr-2" />
                    Cover Banner
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    {(tempUploadedImages.banner || (restaurant.coverImages && restaurant.coverImages.length > 0)) ? (
                      <div className="relative aspect-[3/1] rounded-lg overflow-hidden border-2 border-orange-200">
                        <Image
                          src={tempUploadedImages.banner || restaurant.coverImages?.[0] || ''}
                          alt="Restaurant Banner"
                          width={400}
                          height={133}
                          className="w-full h-full object-cover"
                        />
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => {
                              if (tempUploadedImages.banner) {
                                // Remove from temp images and uploaded URLs for cleanup
                                const urlToRemove = tempUploadedImages.banner;
                                setTempUploadedImages(prev => ({ ...prev, banner: undefined }));
                                setUploadedImageUrls(prev => prev.filter(url => url !== urlToRemove));
                                // Clean up the uploaded file immediately
                                cleanupUnusedImages([urlToRemove]);
                              } else {
                                const newCoverImages = restaurant.coverImages?.slice(1) || [];
                                handleInputChange('coverImages', newCoverImages);
                              }
                            }}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                        {tempUploadedImages.banner && (
                          <div className="absolute bottom-0 left-0 right-0 bg-orange-500 text-white text-xs px-2 py-1">
                            Preview (not saved)
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="aspect-[3/1] rounded-lg border-2 border-dashed border-orange-300 bg-orange-50 flex items-center justify-center">
                        <div className="text-center">
                          <ImageIcon className="h-12 w-12 text-orange-400 mx-auto mb-2" />
                          <p className="text-orange-600 font-medium">No Banner</p>
                          <p className="text-sm text-orange-500">Upload a cover banner for your restaurant</p>
                        </div>
                      </div>
                    )}
                    
                    {isEditing && (
                      <div className="mt-4 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file && !isUploading) {
                              await handleImageUpload(file, 'banner');
                            }
                          }}
                          className="hidden"
                          id="banner-upload"
                          disabled={isUploading}
                        />
                        <label
                          htmlFor="banner-upload"
                          className={`inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 cursor-pointer transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          {isUploading ? 'Uploading...' : tempUploadedImages.banner ? 'Change Banner' : (restaurant.coverImages && restaurant.coverImages.length > 0) ? 'Change Banner' : 'Upload Banner'}
                        </label>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Kitchen Story */}
              <Card className="border-orange-100">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <ChefHat className="h-5 w-5 text-orange-500 mr-2" />
                    Kitchen Story
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <Textarea
                      value={editedData.kitchenStory || ''}
                      onChange={(e) => handleInputChange('kitchenStory', e.target.value)}
                      rows={6}
                      placeholder="Tell your restaurant's story..."
                      className="border-orange-200 focus:border-orange-500"
                    />
                  ) : (
                    <p className="text-gray-700 leading-relaxed">
                      {restaurant.kitchenStory || 'No kitchen story provided'}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Media Overview */}
              <Card className="border-orange-100">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <Camera className="h-5 w-5 text-orange-500 mr-2" />
                    Media Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <Building className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900">{restaurant.logoImage ? 1 : 0}</p>
                      <p className="text-sm text-gray-600">Logo</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <ImageIcon className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900">{restaurant.coverImages?.length || 0}</p>
                      <p className="text-sm text-gray-600">Cover Banners</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <ImageIcon className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900">{restaurant.galleryImages?.length || 0}</p>
                      <p className="text-sm text-gray-600">Gallery Images</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <ChefHat className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900">{restaurant.kitchenPhotos?.length || 0}</p>
                      <p className="text-sm text-gray-600">Kitchen Photos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Kitchen Photos Section */}
            <Card className="border-orange-100">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-gray-900">
                  <div className="flex items-center">
                    <Camera className="h-5 w-5 text-orange-500 mr-2" />
                    Kitchen Photos ({restaurant.kitchenPhotos?.length || 0})
                  </div>
                  {isEditing && (
                    <Button 
                      size="sm"
                      variant="outline"
                      className="border-orange-300 text-orange-700 hover:bg-orange-50"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.multiple = true;
                        input.onchange = async (e) => {
                          const files = Array.from((e.target as HTMLInputElement).files || []);
                          if (files.length > 0) {
                            console.log('Upload kitchen photos:', files);
                            // Here you would handle file upload
                            // For now, just show an alert
                            alert(`Selected ${files.length} files for upload. Integration with upload API needed.`);
                          }
                        };
                        input.click();
                      }}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Add Photos
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {restaurant.kitchenPhotos && restaurant.kitchenPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {restaurant.kitchenPhotos.map((photo, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-orange-200 group">
                        <Image 
                          src={photo} 
                          alt={`Kitchen photo ${index + 1}`}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                        />
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => {
                              const newPhotos = restaurant.kitchenPhotos?.filter((_, i) => i !== index) || [];
                              handleInputChange('kitchenPhotos', newPhotos);
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Camera className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No kitchen photos yet</h3>
                    <p className="text-gray-500 mb-4">Share your kitchen with potential customers</p>
                    {isEditing && (
                      <Button 
                        variant="outline"
                        className="border-orange-300 text-orange-700 hover:bg-orange-50"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.multiple = true;
                          input.click();
                        }}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Upload Kitchen Photos
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Achievements Section */}
            <Card className="border-orange-100">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-gray-900">
                  <div className="flex items-center">
                    <Award className="h-5 w-5 text-orange-500 mr-2" />
                    Achievements ({restaurant.achievements?.length || 0})
                  </div>
                  {isEditing && (
                    <Button 
                      size="sm"
                      variant="outline"
                      className="border-orange-300 text-orange-700 hover:bg-orange-50"
                      onClick={() => {
                        const newAchievement = {
                          title: 'New Achievement',
                          description: '',
                          issuer: ''
                        };
                        const currentAchievements = restaurant.achievements || [];
                        handleInputChange('achievements', [...currentAchievements, newAchievement]);
                      }}
                    >
                      <Award className="h-4 w-4 mr-2" />
                      Add Achievement
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {restaurant.achievements && restaurant.achievements.length > 0 ? (
                  <div className="space-y-4">
                    {restaurant.achievements.map((achievement, index) => (
                      <div key={index} className="p-4 border border-orange-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            {isEditing ? (
                              <>
                                <Input
                                  value={achievement.title}
                                  onChange={(e) => {
                                    const newAchievements = [...(restaurant.achievements || [])];
                                    newAchievements[index] = { ...achievement, title: e.target.value };
                                    handleInputChange('achievements', newAchievements);
                                  }}
                                  placeholder="Achievement title"
                                  className="font-semibold border-orange-200 focus:border-orange-500"
                                />
                                <Input
                                  value={achievement.description}
                                  onChange={(e) => {
                                    const newAchievements = [...(restaurant.achievements || [])];
                                    newAchievements[index] = { ...achievement, description: e.target.value };
                                    handleInputChange('achievements', newAchievements);
                                  }}
                                  placeholder="Description"
                                  className="border-orange-200 focus:border-orange-500"
                                />
                                <Input
                                  value={achievement.issuer || ''}
                                  onChange={(e) => {
                                    const newAchievements = [...(restaurant.achievements || [])];
                                    newAchievements[index] = { ...achievement, issuer: e.target.value };
                                    handleInputChange('achievements', newAchievements);
                                  }}
                                  placeholder="Issued by"
                                  className="border-orange-200 focus:border-orange-500"
                                />
                              </>
                            ) : (
                              <>
                                <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
                                <p className="text-gray-700">{achievement.description}</p>
                                {achievement.issuer && (
                                  <p className="text-sm text-gray-500">Issued by: {achievement.issuer}</p>
                                )}
                              </>
                            )}
                          </div>
                          {isEditing && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const newAchievements = restaurant.achievements?.filter((_, i) => i !== index) || [];
                                handleInputChange('achievements', newAchievements);
                              }}
                              className="ml-2 text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Award className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No achievements yet</h3>
                    <p className="text-gray-500 mb-4">Showcase your restaurant&apos;s accomplishments</p>
                    {isEditing && (
                      <Button 
                        variant="outline"
                        className="border-orange-300 text-orange-700 hover:bg-orange-50"
                        onClick={() => {
                          const newAchievement = {
                            title: 'New Achievement',
                            description: '',
                            issuer: ''
                          };
                          handleInputChange('achievements', [newAchievement]);
                        }}
                      >
                        <Award className="h-4 w-4 mr-2" />
                        Add First Achievement
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Achievement Photos Section */}
            <Card className="border-orange-100">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-gray-900">
                  <div className="flex items-center">
                    <ImageIcon className="h-5 w-5 text-orange-500 mr-2" />
                    Achievement Photos ({restaurant.achievementPhotos?.length || 0})
                  </div>
                  {isEditing && (
                    <Button 
                      size="sm"
                      variant="outline"
                      className="border-orange-300 text-orange-700 hover:bg-orange-50"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.multiple = true;
                        input.onchange = async (e) => {
                          const files = Array.from((e.target as HTMLInputElement).files || []);
                          if (files.length > 0) {
                            console.log('Upload achievement photos:', files);
                            alert(`Selected ${files.length} files for upload. Integration with upload API needed.`);
                          }
                        };
                        input.click();
                      }}
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Add Photos
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {restaurant.achievementPhotos && restaurant.achievementPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {restaurant.achievementPhotos.map((photo, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-orange-200 group">
                        <Image 
                          src={photo} 
                          alt={`Achievement photo ${index + 1}`}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                        />
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => {
                              const newPhotos = restaurant.achievementPhotos?.filter((_, i) => i !== index) || [];
                              handleInputChange('achievementPhotos', newPhotos);
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No achievement photos yet</h3>
                    <p className="text-gray-500 mb-4">Upload photos of certificates, awards, and recognitions</p>
                    {isEditing && (
                      <Button 
                        variant="outline"
                        className="border-orange-300 text-orange-700 hover:bg-orange-50"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.multiple = true;
                          input.click();
                        }}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Upload Achievement Photos
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Menu Management */}
        {activeSection === 'menu' && (
          <div className="space-y-6">
            <Card className="border-orange-100">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <Utensils className="h-5 w-5 text-orange-500 mr-2" />
                  Menu Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Utensils className="h-16 w-16 text-orange-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Manage Your Menu</h3>
                  <p className="text-gray-600 mb-6">
                    Add, edit, and organize your menu items and categories
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      onClick={() => router.push('/restaurant-dashboard/menu')}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                    >
                      <Utensils className="h-4 w-4 mr-2" />
                      Manage Menu Items
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => router.push(`/restaurant/${restaurant.id}/menu`)}
                      className="border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Preview Public Menu
                    </Button>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <DollarSign className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900">{analytics.totalMenuItems}</p>
                      <p className="text-sm text-gray-600">Menu Items</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <Users className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900">{analytics.totalReviews}</p>
                      <p className="text-sm text-gray-600">Reviews</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <Star className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900">{Number(analytics.averageRating || 0).toFixed(1)}</p>
                      <p className="text-sm text-gray-600">Average Rating</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Messaging */}
        {activeSection === 'messaging' && (
          <MessagingManager restaurantId={restaurant.id} />
        )}

        {/* Recent Activity */}
        {activeSection === 'activity' && (
          <div className="space-y-6">
            <Card className="border-orange-100">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <Activity className="h-5 w-5 text-orange-500 mr-2" />
                  Recent Customer Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData.recentEvents?.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.recentEvents.map((event, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {event.event_type === 'view' && <Eye className="h-5 w-5 text-orange-500" />}
                          {event.event_type === 'click' && <MousePointer className="h-5 w-5 text-orange-500" />}
                          {event.event_type === 'favorite' && <Heart className="h-5 w-5 text-orange-500" />}
                          {event.event_type === 'call' && <Phone className="h-5 w-5 text-orange-500" />}
                          {event.event_type === 'directions' && <Navigation className="h-5 w-5 text-orange-500" />}
                          <div>
                            <p className="font-medium text-gray-900 capitalize">
                              {event.event_type.replace('_', ' ')}
                            </p>
                            <p className="text-sm text-gray-600">
                              {event.user_id ? 'Registered User' : 'Anonymous User'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {new Date(event.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(event.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No recent activity to display</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
