'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Star, 
  Clock, 
  Phone, 
  Globe, 
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Utensils,
  Award,
  Users,
  Navigation,
  Truck,
  Mail,
  Facebook,
  Instagram,
  Twitter,
  ExternalLink,
  Shield,
  CheckCircle
} from 'lucide-react';
import Image from 'next/image';
import MenuPreview from '@/components/restaurant/MenuPreview';
import ReviewModal from '@/components/restaurant/ReviewModal';

interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine_types: string[];
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  website: string;
  operating_hours: Record<string, unknown>;
  average_rating: number;
  review_count: number;
  is_active: boolean;
  tagline?: string;
  category?: string;
  kitchen_story?: string;
  kitchen_photos?: string[];
  achievements?: Array<{
    title: string;
    description: string;
    issuer: string;
  }>;
  achievement_photos?: string[];
  policies?: {
    cancellation?: string;
    delivery?: string;
    reservation?: string;
    dressCode?: string;
    accessibility?: string[];
  };
  features?: string[];
  logoImage?: string;
  profileImage?: string;
  coverImages?: string[];
  galleryImages?: string[];
  bannerImages?: string[];
  socialMedia?: Record<string, string>;
  deliveryPartners?: Record<string, string>;
  externalLinks?: {
    other?: string[];
  };
  email?: string;
  businessLicense?: string;
  isVerified?: boolean;
  // For compatibility with frontend expectations
  cuisineType?: string[];
  averageRating?: number;
  totalReviews?: number;
  isActive?: boolean;
  operatingHours?: Record<string, unknown>;
  zipCode?: string;
  images?: {
    id: string;
    url: string;
    alt: string;
  }[];
  reviews?: {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    userName: string;
  }[];
}

export default function RestaurantProfile() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const response = await fetch(`/api/restaurants/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Restaurant API Response:', data.restaurant);
          console.log('Rating values - averageRating:', data.restaurant.averageRating, 'average_rating:', data.restaurant.average_rating);
          setRestaurant(data.restaurant);
          setIsFavorited(data.isFavorited || false);
          // Reset image index when restaurant changes
          setCurrentImageIndex(0);
        } else {
          console.error('Failed to fetch restaurant');
        }
      } catch (error) {
        console.error('Error fetching restaurant:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchRestaurant();
    }
  }, [params.id]);

  const handleFavorite = async () => {
    if (!user) {
      router.push('/sign-in');
      return;
    }

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          restaurantId: restaurant?.id,
          type: 'restaurant'
        }),
      });

      if (response.ok) {
        setIsFavorited(!isFavorited);
      }
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

const trackAnalytics = async (eventType: string, metadata?: Record<string, unknown>) => {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant?.id,
          eventType,
          metadata: {
            ...metadata,
            source: 'restaurant_profile'
          }
        }),
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  };

  const handleCall = () => {
    if (restaurant?.phone) {
      window.open(`tel:${restaurant.phone}`);
      trackAnalytics('call', { phone: restaurant.phone });
    }
  };

  const handleDirections = () => {
    const address = `${restaurant?.address}, ${restaurant?.city}, ${restaurant?.state} ${restaurant?.zipCode}`;
    const encoded = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`);
    trackAnalytics('directions', { address });
  };

  // Get all available images from restaurant data
  const getAvailableImages = () => {
    const images = [];
    
    // Add profile image
    if (restaurant?.profileImage) {
      images.push({ url: restaurant.profileImage, alt: `${restaurant.name} profile` });
    }
    
    // Add cover images
    if (restaurant?.coverImages && restaurant.coverImages.length > 0) {
      restaurant.coverImages.forEach((url, index) => {
        images.push({ url, alt: `${restaurant.name} cover ${index + 1}` });
      });
    }
    
    // Add banner images
    if (restaurant?.bannerImages && restaurant.bannerImages.length > 0) {
      restaurant.bannerImages.forEach((url, index) => {
        images.push({ url, alt: `${restaurant.name} banner ${index + 1}` });
      });
    }
    
    // Add gallery images
    if (restaurant?.galleryImages && restaurant.galleryImages.length > 0) {
      restaurant.galleryImages.forEach((url, index) => {
        images.push({ url, alt: `${restaurant.name} gallery ${index + 1}` });
      });
    }
    
    // Add legacy images if they exist
    if (restaurant?.images && restaurant.images.length > 0) {
      restaurant.images.forEach((img) => {
        images.push({ url: img.url, alt: img.alt });
      });
    }
    
    return images;
  };

  const availableImages = getAvailableImages();

  const nextImage = () => {
    if (availableImages.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === availableImages.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (availableImages.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? availableImages.length - 1 : prev - 1
      );
    }
  };

  // Touch handlers for swipe functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && availableImages.length > 1) {
      nextImage();
    }
    if (isRightSwipe && availableImages.length > 1) {
      prevImage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading restaurant...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Utensils className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Restaurant Not Found</h2>
            <p className="text-gray-600 mb-6">
              The restaurant you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Button onClick={() => router.push('/')} className="aharamm-gradient">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50">
      {/* Header with Image Slider */}
      <div 
        className="relative h-48 sm:h-64 lg:h-80 bg-gradient-to-br from-orange-400 to-orange-600"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {availableImages && availableImages.length > 0 ? (
          <>
            <div 
              className="relative w-full h-full cursor-pointer"
              onClick={(e) => {
                // Only open modal if click is not on navigation buttons
                if (!e.defaultPrevented) {
                  setIsImageModalOpen(true);
                }
              }}
            >
              <Image
                src={availableImages[currentImageIndex]?.url || '/placeholder-restaurant.jpg'}
                alt={availableImages[currentImageIndex]?.alt || restaurant.name}
                fill
                className="object-cover transition-all duration-300 hover:scale-105"
                priority
              />
            </div>
            <div 
              className="absolute inset-0 bg-black/40 cursor-pointer" 
              onClick={(e) => {
                // Only open modal if click is not on navigation buttons
                if (!e.defaultPrevented) {
                  setIsImageModalOpen(true);
                }
              }}
            />
            
            {/* Image Navigation */}
            {availableImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-black/60 text-white hover:bg-black/80 transition-all duration-200 z-10 pointer-events-auto"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    prevImage();
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-black/60 text-white hover:bg-black/80 transition-all duration-200 z-10 pointer-events-auto"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    nextImage();
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
                
                {/* Image counter */}
                <div className="absolute top-2 right-2 bg-black/50 text-white px-1.5 py-0.5 rounded text-xs z-10 pointer-events-none">
                  {currentImageIndex + 1}/{availableImages.length}
                </div>
              </>
            )}
          </>
        ) : (
          // Orange banner placeholder when no images
          <div className="relative h-full bg-gradient-to-br from-orange-400 to-orange-600">
            <div className="absolute inset-0 bg-black/20" />
            <div className="flex items-center justify-center h-full">
              <Utensils className="h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 text-white/80" />
            </div>
          </div>
        )}

        {/* Overlay Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-2 sm:p-4 lg:p-6 pointer-events-none">
          <div className="max-w-6xl mx-auto w-full">
            <div className="flex items-end justify-between mb-2 sm:mb-3 gap-2 sm:gap-3">
              <div className="flex items-end space-x-2 sm:space-x-3 flex-1 min-w-0">
                {/* Circular Logo */}
                <div className="flex-shrink-0">
                  {restaurant.logoImage ? (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full overflow-hidden bg-white p-1 shadow-lg">
                      <Image
                        src={restaurant.logoImage}
                        alt={`${restaurant.name} logo`}
                        width={48}
                        height={48}
                        className="w-full h-full object-contain rounded-full"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center">
                      <Utensils className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
                    </div>
                  )}
                </div>

                {/* Restaurant Info */}
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl lg:text-3xl font-bold text-white mb-0.5 sm:mb-1 truncate leading-tight">
                    {restaurant.name}
                  </h1>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-0.5 sm:space-y-0 text-white/90">
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-current" />
                      <span className="font-medium text-xs sm:text-sm">
                        {(() => {
                          const rating = restaurant.averageRating || restaurant.average_rating || 0;
                          return rating > 0 ? rating.toFixed(1) : 'New';
                        })()}
                      </span>
                      <span className="text-xs sm:text-sm">
                        ({restaurant.totalReviews || restaurant.review_count || 0} reviews)
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm truncate">
                        {restaurant.city}, {restaurant.state}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0 pointer-events-auto">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-black/60 text-white hover:bg-black/80 w-8 h-8 sm:w-9 sm:h-9"
                  onClick={handleFavorite}
                >
                  <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current text-red-500' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-black/60 text-white hover:bg-black/80 w-8 h-8 sm:w-9 sm:h-9"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4 lg:space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              <Button 
                onClick={handleCall}
                className="aharamm-gradient shadow-lg h-10 sm:h-12 text-sm"
                disabled={!restaurant.phone}
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Restaurant
              </Button>
              <Button 
                onClick={handleDirections}
                variant="outline" 
                className="h-10 sm:h-12 border-orange-200 text-orange-700 hover:bg-orange-50 text-sm"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Get Directions
              </Button>
              <Button 
                variant="outline" 
                className="h-10 sm:h-12 text-sm"
                onClick={() => router.push(`/restaurant/${restaurant.id}/menu`)}
              >
                <Utensils className="h-4 w-4 mr-2" />
                View Menu
              </Button>
            </div>

            {/* Menu Preview */}
            <Card className="shadow-lg border-0" id="menu">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <Utensils className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                    <span className="text-base sm:text-lg">Menu Highlights</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs sm:text-sm w-full sm:w-auto"
                    onClick={() => router.push(`/restaurant/${restaurant.id}/menu`)}
                  >
                    View Full Menu
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <MenuPreview restaurantId={restaurant.id} />
              </CardContent>
            </Card>

            {/* Kitchen Story */}
            {restaurant.kitchen_story && (
              <Card className="shadow-lg border-0">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                    <span className="text-base sm:text-lg">Our Kitchen Story</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <p className="text-gray-700 leading-relaxed mb-3 sm:mb-4 text-sm sm:text-base">{restaurant.kitchen_story}</p>
                  {restaurant.kitchen_photos && restaurant.kitchen_photos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                      {restaurant.kitchen_photos.slice(0, 3).map((photo: string, index: number) => (
                        <div key={index} className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
                          <Image
                            src={photo}
                            alt={`Kitchen photo ${index + 1}`}
                            fill
                            className="object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Achievements */}
            {restaurant.achievements && restaurant.achievements.length > 0 && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-orange-500" />
                    <span>Awards & Achievements</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {restaurant.achievements.map((achievement, index: number) => (
                      <div key={index} className="flex items-start space-x-4 p-4 bg-orange-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <Award className="h-6 w-6 text-orange-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{achievement.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                          <p className="text-xs text-orange-600 font-medium">- {achievement.issuer}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {restaurant.achievement_photos && restaurant.achievement_photos.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-900 mb-3">Achievement Photos</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {restaurant.achievement_photos.map((photo: string, index: number) => (
                          <div key={index} className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
                            <Image
                              src={photo}
                              alt={`Achievement photo ${index + 1}`}
                              fill
                              className="object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Policies */}
            {restaurant.policies && Object.keys(restaurant.policies).length > 0 && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-orange-500" />
                    <span>Restaurant Policies</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {restaurant.policies.cancellation && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Cancellation Policy</h4>
                        <p className="text-sm text-gray-600">{restaurant.policies.cancellation}</p>
                      </div>
                    )}
                    {restaurant.policies.delivery && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Delivery Policy</h4>
                        <p className="text-sm text-gray-600">{restaurant.policies.delivery}</p>
                      </div>
                    )}
                    {restaurant.policies.reservation && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Reservation Policy</h4>
                        <p className="text-sm text-gray-600">{restaurant.policies.reservation}</p>
                      </div>
                    )}
                    {restaurant.policies.dressCode && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Dress Code</h4>
                        <p className="text-sm text-gray-600">{restaurant.policies.dressCode}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            {restaurant.description && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-orange-500" />
                    <span>About {restaurant.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{restaurant.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                    <span className="text-base sm:text-lg">Customer Reviews</span>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Badge variant="outline" className="text-xs sm:text-sm">
                      {restaurant.totalReviews || restaurant.review_count || 0} reviews
                    </Badge>
                    <Button 
                      size="sm" 
                      className="aharamm-gradient text-xs sm:text-sm flex-1 sm:flex-none"
                      onClick={() => setIsReviewModalOpen(true)}
                    >
                      Write Review
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                {restaurant.reviews && restaurant.reviews.length > 0 ? (
                  <div className="space-y-4 sm:space-y-6">
                    {restaurant.reviews.slice(0, 3).map((review) => (
                      <div key={review.id} className="border-b border-gray-100 last:border-0 pb-4 sm:pb-6 last:pb-0">
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <div className="h-6 w-6 sm:h-8 sm:w-8 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                            </div>
                            <span className="font-medium text-gray-900 text-sm sm:text-base truncate">{review.userName}</span>
                          </div>
                          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 sm:h-4 sm:w-4 ${
                                    i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm sm:text-base line-clamp-3">{review.comment}</p>
                        <span className="text-xs text-gray-500 sm:hidden block mt-1">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                    
                    {(restaurant.totalReviews || restaurant.review_count || 0) > 3 && (
                      <Button variant="outline" className="w-full text-sm">
                        View All {restaurant.totalReviews || restaurant.review_count || 0} Reviews
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <Star className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
                    <p className="text-gray-600 text-sm sm:text-base mb-3 sm:mb-4">No reviews yet. Be the first to review!</p>
                    <Button 
                      className="aharamm-gradient text-sm"
                      onClick={() => setIsReviewModalOpen(true)}
                    >
                      Write a Review
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-3 sm:space-y-4">
            {/* Restaurant Details */}
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  <span className="text-sm sm:text-base">Restaurant Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 px-3 sm:px-4">{/* Rest of sidebar content remains the same */}
                <div>
                  <p className="font-medium text-gray-900 mb-1 text-sm sm:text-base">Address</p>
                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                    {restaurant.address}<br />
                    {restaurant.city}, {restaurant.state} {restaurant.zipCode || restaurant.zip_code}
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <p className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Cuisine Type</p>
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {(restaurant.cuisineType || restaurant.cuisine_types) && (restaurant.cuisineType || restaurant.cuisine_types)!.length > 0 ? (
                      (restaurant.cuisineType || restaurant.cuisine_types)!.map((cuisine, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {cuisine}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-600 text-xs sm:text-sm">Not specified</span>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Restaurant Category */}
                {restaurant.category && (
                  <>
                    <div>
                      <p className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Category</p>
                      <Badge variant="outline" className="text-xs capitalize">
                        {restaurant.category.replace('_', ' ')}
                      </Badge>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Tagline */}
                {restaurant.tagline && (
                  <>
                    <div>
                      <p className="font-medium text-gray-900 mb-1 text-sm sm:text-base">Tagline</p>
                      <p className="text-gray-600 text-xs sm:text-sm italic">&ldquo;{restaurant.tagline}&rdquo;</p>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Features */}
                {restaurant.features && restaurant.features.length > 0 && (
                  <>
                    <div>
                      <p className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Features</p>
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {restaurant.features.map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs capitalize">
                            {feature.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                <div>
                  <p className="font-medium text-gray-900 mb-1 text-sm sm:text-base">Phone</p>
                  <p className="text-gray-600 text-xs sm:text-sm">{restaurant.phone || 'Not available'}</p>
                </div>

                {restaurant.website && (
                  <>
                    <Separator />
                    <div>
                      <p className="font-medium text-gray-900 mb-1 text-sm sm:text-base">Website</p>
                      <a 
                        href={restaurant.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-700 text-xs sm:text-sm flex items-center"
                      >
                        <Globe className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Visit Website
                      </a>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Operating Hours */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <span>Hours</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(restaurant.operatingHours || restaurant.operating_hours) ? (
                    Object.entries((restaurant.operatingHours || restaurant.operating_hours)!).map(([day, hours]) => {
                      // Handle both string format and object format
                      let hoursDisplay = 'Closed';
                      
                      if (typeof hours === 'string') {
                        hoursDisplay = hours;
                      } else if (typeof hours === 'object' && hours !== null) {
                        const hourObj = hours as { isOpen?: boolean; openTime?: string; closeTime?: string };
                        if (hourObj.isOpen && hourObj.openTime && hourObj.closeTime) {
                          hoursDisplay = `${hourObj.openTime} - ${hourObj.closeTime}`;
                        }
                      }
                      
                      return (
                        <div key={day} className="flex justify-between text-sm">
                          <span className="capitalize font-medium">{day}</span>
                          <span className="text-gray-600">{hoursDisplay}</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-600 text-sm">Hours not available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Partners */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Truck className="h-5 w-5 text-orange-500" />
                  <span>Delivery Partners</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {restaurant.deliveryPartners && Object.keys(restaurant.deliveryPartners).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(restaurant.deliveryPartners).map(([partner, url]) => (
                      <div key={partner} className="flex items-center justify-between">
                        <span className="capitalize font-medium text-gray-900">{partner}</span>
                        {url ? (
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-orange-600 hover:text-orange-700 text-sm flex items-center"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Order
                          </a>
                        ) : (
                          <span className="text-gray-500 text-sm">Not available</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">No delivery partners available</p>
                )}
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Share2 className="h-5 w-5 text-orange-500" />
                  <span>Social Media</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {restaurant.socialMedia && Object.keys(restaurant.socialMedia).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(restaurant.socialMedia).map(([platform, url]) => {
                      const getSocialIcon = (platform: string) => {
                        switch (platform.toLowerCase()) {
                          case 'facebook': return <Facebook className="h-4 w-4" />;
                          case 'instagram': return <Instagram className="h-4 w-4" />;
                          case 'twitter': return <Twitter className="h-4 w-4" />;
                          default: return <ExternalLink className="h-4 w-4" />;
                        }
                      };

                      return (
                        <div key={platform} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getSocialIcon(platform)}
                            <span className="capitalize font-medium text-gray-900">{platform}</span>
                          </div>
                          {url ? (
                            <a 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-orange-600 hover:text-orange-700 text-sm"
                            >
                              Follow
                            </a>
                          ) : (
                            <span className="text-gray-500 text-sm">Not available</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">No social media links available</p>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-orange-500" />
                  <span>Contact Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium text-gray-900 mb-1">Email</p>
                  {restaurant.email ? (
                    <a 
                      href={`mailto:${restaurant.email}`}
                      className="text-orange-600 hover:text-orange-700 text-sm flex items-center"
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      {restaurant.email}
                    </a>
                  ) : (
                    <p className="text-gray-600 text-sm">Email not available</p>
                  )}
                </div>

                <div>
                  <p className="font-medium text-gray-900 mb-1">Business License</p>
                  {restaurant.businessLicense ? (
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="text-gray-600 text-sm">{restaurant.businessLicense}</span>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">License information not available</p>
                  )}
                </div>

                <div>
                  <p className="font-medium text-gray-900 mb-1">Verification Status</p>
                  <div className="flex items-center space-x-2">
                    {restaurant.isVerified ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-green-600 text-sm font-medium">Verified Restaurant</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span className="text-yellow-600 text-sm font-medium">Verification Pending</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {restaurant && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          restaurantId={restaurant.id}
          restaurantName={restaurant.name}
          onReviewSubmitted={() => {
            // Refresh restaurant data to show new review
            const fetchRestaurant = async () => {
              try {
                const response = await fetch(`/api/restaurants/${params.id}`);
                if (response.ok) {
                  const data = await response.json();
                  setRestaurant(data.restaurant);
                }
              } catch (error) {
                console.error('Error refreshing restaurant:', error);
              }
            };
            fetchRestaurant();
          }}
        />
      )}

      {/* Full-Screen Image Modal */}
      {isImageModalOpen && availableImages.length > 0 && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Close button */}
            <button
              className="absolute top-4 right-4 text-white bg-black/70 rounded-full p-3 z-20 hover:bg-black/90 transition-colors"
              onClick={() => setIsImageModalOpen(false)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Navigation arrows */}
            {availableImages.length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white bg-black/70 rounded-full p-3 z-20 hover:bg-black/90 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    prevImage();
                  }}
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-black/70 rounded-full p-3 z-20 hover:bg-black/90 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    nextImage();
                  }}
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
            
            {/* Full image - responsive sizing */}
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={availableImages[currentImageIndex]?.url || '/placeholder-restaurant.jpg'}
                alt={availableImages[currentImageIndex]?.alt || restaurant.name}
                fill
                className="object-contain max-w-full max-h-full"
                onClick={(e) => e.stopPropagation()}
                priority
              />
            </div>
            
            {/* Image info */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-center z-20">
              <div className="bg-black/70 rounded-lg px-4 py-2">
                <p className="text-sm font-medium">
                  {currentImageIndex + 1} of {availableImages.length}
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  {availableImages[currentImageIndex]?.alt || restaurant.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
