'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Star, 
  Clock, 
  ChevronLeft,
  Heart,
  Share2,
  Utensils,
  Camera,
  MessageCircle
} from 'lucide-react';
import Image from 'next/image';
import FoodReviewModal from '@/components/restaurant/FoodReviewModal';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  categoryId: string;
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  spiceLevel: number;
  preparationTime: number;
  calories?: number;
  imageUrl?: string;
  imageUrls?: string[];
  reviews?: {
    id: string;
    rating: number;
    foodQualityRating: number;
    serviceRating: number;
    ambianceRating: number;
    valueForMoneyRating: number;
    title?: string;
    comment: string;
    images?: string[];
    tags?: string[];
    helpfulVotes: number;
    isVerified: boolean;
    reviewLocation?: string;
    userLocation?: string;
    userLatitude?: number;
    userLongitude?: number;
    createdAt: string;
    userName: string;
    userImage?: string;
  }[];
  averageRating?: number;
  totalReviews?: number;
}

interface MenuCategory {
  id: string;
  name: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
}

interface Restaurant {
  id: string;
  name: string;
  description: string;
  averageRating: number;
  totalReviews: number;
}

export default function RestaurantMenuPage() {
  const params = useParams();
  const router = useRouter();
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch reviews for a specific menu item
  const fetchItemReviews = async (itemId: string) => {
    try {
      const response = await fetch(`/api/menu-items/${itemId}/reviews`);
      if (response.ok) {
        const data = await response.json();
        return {
          reviews: data.reviews || [],
          averageRating: data.averageRating || 0,
          totalReviews: data.totalReviews || 0
        };
      }
    } catch (error) {
      console.error('Error fetching item reviews:', error);
    }
    return { reviews: [], averageRating: 0, totalReviews: 0 };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [restaurantRes, itemsRes, categoriesRes] = await Promise.all([
          fetch(`/api/restaurants/${params.id}`),
          fetch(`/api/restaurants/${params.id}/menu/items`),
          fetch(`/api/restaurants/${params.id}/menu/categories`)
        ]);

        if (restaurantRes.ok) {
          const restaurantData = await restaurantRes.json();
          setRestaurant(restaurantData.restaurant);
        }

        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          setMenuItems(itemsData.items || []);
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData.categories || []);
        }
      } catch (error) {
        console.error('Error fetching menu data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  // Handle URL hash navigation for menu items
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#item-')) {
      const itemId = hash.substring(6);
      const item = menuItems.find(i => i.id === itemId);
      if (item) {
        setSelectedItem(item);
        setIsDetailModalOpen(true);
      }
    }
  }, [menuItems]);

  const openItemDetail = async (item: MenuItem) => {
    setSelectedItem(item);
    setCurrentImageIndex(0);
    setIsDetailModalOpen(true);
    // Update URL hash
    window.history.pushState(null, '', `#item-${item.id}`);
    
    // Fetch reviews for this item
    const reviewData = await fetchItemReviews(item.id);
    setSelectedItem(prevItem => prevItem ? {
      ...prevItem,
      reviews: reviewData.reviews,
      averageRating: reviewData.averageRating,
      totalReviews: reviewData.totalReviews
    } : null);
  };

  const closeItemDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedItem(null);
    // Remove hash from URL
    window.history.pushState(null, '', window.location.pathname);
  };

  const openReviewModal = (item: MenuItem) => {
    setSelectedItem(item);
    setIsReviewModalOpen(true);
  };

  const filteredItems = menuItems.filter(item => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  const groupedItems = categories.reduce((acc, category) => {
    const categoryItems = filteredItems.filter(item => item.category === category.name);
    if (categoryItems.length > 0) {
      acc[category.name] = categoryItems;
    }
    return acc;
  }, {} as Record<string, MenuItem[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/restaurant/${params.id}`)}
                className="shrink-0"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                  {restaurant?.name} Menu
                </h1>
                <p className="text-sm text-gray-600 hidden sm:block">Explore our delicious offerings</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Heart className="h-4 w-4 mr-2" />
                Save Menu
              </Button>
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              {/* Mobile icons only */}
              <Button variant="outline" size="icon" className="sm:hidden">
                <Heart className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="sm:hidden">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Category Navigation */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto pb-4 scrollbar-hide">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('all')}
              className={`shrink-0 text-sm ${selectedCategory === 'all' ? 'aharamm-gradient' : ''}`}
            >
              All Items
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.name ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category.name)}
                className={`shrink-0 text-sm whitespace-nowrap ${selectedCategory === category.name ? 'aharamm-gradient' : ''}`}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        {Object.keys(groupedItems).length > 0 ? (
          <div className="space-y-6 sm:space-y-8">
            {Object.entries(groupedItems).map(([categoryName, items]) => (
              <div key={categoryName} id={`category-${categoryName.toLowerCase().replace(/\s+/g, '-')}`}>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 px-1">{categoryName}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {items.map((item) => (
                    <Card 
                      key={item.id} 
                      className="cursor-pointer hover:shadow-lg transition-all duration-200 border-0 shadow-md hover:scale-[1.02] overflow-hidden"
                      onClick={() => openItemDetail(item)}
                    >
                      <div className="relative h-40 sm:h-48 bg-gray-100 overflow-hidden">
                        {item.imageUrls && item.imageUrls.length > 0 ? (
                          <Image
                            src={item.imageUrls[0]}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Utensils className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                          </div>
                        )}
                        
                        {/* Image count indicator */}
                        {item.imageUrls && item.imageUrls.length > 1 && (
                          <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-full flex items-center">
                            <Camera className="h-3 w-3 mr-1" />
                            {item.imageUrls.length}
                          </div>
                        )}
                        
                        {/* Availability badge */}
                        {!item.isAvailable && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Badge variant="destructive" className="bg-red-600 text-white border-0 text-sm">Sold Out</Badge>
                          </div>
                        )}
                      </div>

                      <CardContent className="p-3 sm:p-4">
                        <div className="space-y-2 sm:space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2 flex-1 min-w-0">{item.name}</h3>
                            <div className="flex items-center space-x-1 shrink-0">
                              <span className="font-semibold text-orange-600 text-sm sm:text-base">${item.price.toFixed(2)}</span>
                            </div>
                          </div>

                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{item.description}</p>

                          {/* Ratings and Reviews */}
                          {item.averageRating && item.averageRating > 0 && (
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center">
                                <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-current" />
                                <span className="text-xs sm:text-sm font-medium ml-1">{item.averageRating.toFixed(1)}</span>
                              </div>
                              <span className="text-xs sm:text-sm text-gray-500">({item.totalReviews} reviews)</span>
                            </div>
                          )}

                          {/* Dietary badges */}
                          <div className="flex flex-wrap gap-1">
                            {item.isVegetarian && (
                              <Badge variant="outline" className="text-xs px-1 py-0 bg-green-50 text-green-700 border-green-200">
                                Vegetarian
                              </Badge>
                            )}
                            {item.isVegan && (
                              <Badge variant="outline" className="text-xs px-1 py-0 bg-green-50 text-green-700 border-green-200">
                                Vegan
                              </Badge>
                            )}
                            {item.isGlutenFree && (
                              <Badge variant="outline" className="text-xs px-1 py-0 bg-blue-50 text-blue-700 border-blue-200">
                                Gluten-Free
                              </Badge>
                            )}
                            {item.spiceLevel > 0 && (
                              <Badge variant="outline" className="text-xs px-1 py-0 bg-red-50 text-red-700 border-red-200">
                                🌶️ {item.spiceLevel}/5
                              </Badge>
                            )}
                          </div>

                          {/* Prep time */}
                          {item.preparationTime > 0 && (
                            <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-500">
                              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>{item.preparationTime} min</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="shadow-lg border-0">
            <CardContent className="p-12 text-center">
              <Utensils className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Menu Items Found</h3>
              <p className="text-gray-600">
                {selectedCategory !== 'all' 
                  ? `No items found in the ${selectedCategory} category.`
                  : 'This restaurant hasn\'t added any menu items yet.'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Food Item Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={closeItemDetail}>
        <DialogContent className="max-w-4xl max-h-[95vh] w-[95vw] sm:w-auto overflow-y-auto bg-white border-0 shadow-2xl p-0">
          {selectedItem && (
            <>
              <DialogHeader className="border-b border-gray-200 pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
                <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 pr-8">{selectedItem.name}</DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6">
                {/* Images */}
                <div className="space-y-3 sm:space-y-4">
                  {selectedItem.imageUrls && selectedItem.imageUrls.length > 0 ? (
                    <>
                      <div className="relative h-48 sm:h-64 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                        <Image
                          src={selectedItem.imageUrls[currentImageIndex]}
                          alt={selectedItem.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      
                      {selectedItem.imageUrls.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                          {selectedItem.imageUrls.map((url, index) => (
                            <button
                              key={index}
                              className={`relative h-12 sm:h-16 bg-gray-100 rounded overflow-hidden border-2 transition-colors ${
                                index === currentImageIndex ? 'border-orange-500' : 'border-gray-200 hover:border-orange-300'
                              }`}
                              onClick={() => setCurrentImageIndex(index)}
                            >
                              <Image
                                src={url}
                                alt={`${selectedItem.name} ${index + 1}`}
                                fill
                                className="object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-48 sm:h-64 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                      <Utensils className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl sm:text-3xl font-bold text-orange-600">
                          ${selectedItem.price.toFixed(2)}
                        </span>
                      </div>
                      <Badge 
                        variant={selectedItem.isAvailable ? 'outline' : 'destructive'}
                        className={`text-sm ${selectedItem.isAvailable ? 'border-green-500 text-green-700 bg-green-50' : ''}`}
                      >
                        {selectedItem.isAvailable ? 'Available' : 'Sold Out'}
                      </Badge>
                    </div>

                    <p className="text-gray-700 leading-relaxed mb-3 sm:mb-4 text-sm sm:text-base">{selectedItem.description}</p>

                    {/* Dietary Info */}
                    <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                      {selectedItem.isVegetarian && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                          Vegetarian
                        </Badge>
                      )}
                      {selectedItem.isVegan && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                          Vegan
                        </Badge>
                      )}
                      {selectedItem.isGlutenFree && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                          Gluten-Free
                        </Badge>
                      )}
                      {selectedItem.spiceLevel > 0 && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                          🌶️ Spice Level {selectedItem.spiceLevel}/5
                        </Badge>
                      )}
                    </div>

                    {/* Additional Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                      {selectedItem.preparationTime > 0 && (
                        <div className="flex items-center space-x-2 text-gray-700">
                          <Clock className="h-4 w-4 text-orange-500" />
                          <span>Prep: {selectedItem.preparationTime} min</span>
                        </div>
                      )}
                      {selectedItem.calories && (
                        <div className="flex items-center space-x-2 text-gray-700">
                          <span className="text-orange-500">🔥</span>
                          <span>{selectedItem.calories} calories</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reviews Section */}
                  <div className="border-t border-gray-200 pt-3 sm:pt-4">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <h4 className="font-semibold text-gray-900 text-base sm:text-lg">Customer Reviews</h4>
                      <Button
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600 text-white border-0 text-xs sm:text-sm"
                        onClick={() => {
                          closeItemDetail();
                          openReviewModal(selectedItem);
                        }}
                      >
                        <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Write Review
                      </Button>
                    </div>

                    {selectedItem.averageRating && selectedItem.averageRating > 0 ? (
                      <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
                        <div className="flex items-center space-x-2">
                          <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 fill-current" />
                          <span className="text-base sm:text-lg font-semibold text-gray-900">{selectedItem.averageRating.toFixed(1)}</span>
                        </div>
                        <span className="text-sm sm:text-base text-gray-600">({selectedItem.totalReviews} reviews)</span>
                      </div>
                    ) : (
                      <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">No reviews yet. Be the first to review!</p>
                    )}

                    {selectedItem.reviews && selectedItem.reviews.length > 0 && (
                      <div className="space-y-3 sm:space-y-4 max-h-40 sm:max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                        {selectedItem.reviews.slice(0, 5).map((review) => (
                          <div key={review.id} className="border-b border-gray-100 last:border-0 pb-3 sm:pb-4 last:pb-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2 min-w-0 flex-1">
                                {review.userImage ? (
                                  <Image
                                    src={review.userImage}
                                    alt={review.userName}
                                    width={20}
                                    height={20}
                                    className="rounded-full sm:w-6 sm:h-6"
                                  />
                                ) : (
                                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-300 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-medium text-gray-600">
                                      {review.userName.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                <span className="font-medium text-xs sm:text-sm text-gray-900 truncate">{review.userName}</span>
                                {review.isVerified && (
                                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-0 hidden sm:inline-flex">
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-3 w-3 ${
                                        i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                {review.userLocation && (
                                  <span className="text-xs text-gray-500 hidden sm:inline">{review.userLocation}</span>
                                )}
                              </div>
                            </div>
                            {review.title && (
                              <h5 className="font-medium text-xs sm:text-sm text-gray-900 mb-1">{review.title}</h5>
                            )}
                            <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-3">{review.comment}</p>
                            {review.tags && review.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {review.tags.slice(0, 3).map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                              {review.helpfulVotes > 0 && (
                                <span className="hidden sm:inline">{review.helpfulVotes} found helpful</span>
                              )}
                            </div>
                          </div>
                        ))}
                        {selectedItem.reviews.length > 5 && (
                          <div className="text-center pt-2">
                            <Button variant="ghost" size="sm" className="text-orange-600 text-xs sm:text-sm">
                              View all {selectedItem.totalReviews} reviews
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-3 sm:pt-4 border-t border-gray-200">
                    <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 text-sm flex-1 sm:flex-none">
                      <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Food Review Modal */}
      {selectedItem && (
        <FoodReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          restaurantId={params.id as string}
          restaurantName={restaurant?.name || ''}
          menuItemId={selectedItem.id}
          menuItemName={selectedItem.name}
          onReviewSubmitted={async () => {
            // Refresh reviews for the current item after modal closes
            if (selectedItem) {
              const reviewData = await fetchItemReviews(selectedItem.id);
              setSelectedItem(prevItem => prevItem ? {
                ...prevItem,
                reviews: reviewData.reviews,
                averageRating: reviewData.averageRating,
                totalReviews: reviewData.totalReviews
              } : null);
            }
          }}
        />
      )}
    </div>
  );
}
