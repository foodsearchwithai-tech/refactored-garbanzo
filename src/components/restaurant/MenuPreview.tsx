import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Clock,
  Utensils,
  Flame,
  Leaf,
  Eye,
  Camera,
  Plus,
  Phone,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Image from 'next/image';

// Define database restaurant type to match actual API response
interface DbRestaurant {
  id: string;
  name: string;
  description: string | null;
  phone: string;
  deliveryPartners: {
    uberEats?: string;
    doorDash?: string;
    grubHub?: string;
    zomato?: string;
    other?: { name: string; url: string }[];
  };
  policies: {
    cancellation: string;
    delivery: string;
    reservation: string;
    dressCode?: string;
    accessibility: string[];
  };
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  images: string[];
  dietaryTags: string[];
  spiceLevel: string | null;
  preparationTime: number | null;
  availability: 'available' | 'limited' | 'sold_out';
  categoryName: string;
}

interface MenuCategory {
  id: string;
  name: string;
  description: string;
  items: MenuItem[];
}

interface MenuPreviewProps {
  restaurantId: string;
}

export default function MenuPreview({ restaurantId }: MenuPreviewProps) {
  const [menuData, setMenuData] = useState<MenuCategory[]>([]);
  const [restaurantData, setRestaurantData] = useState<DbRestaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullMenu, setShowFullMenu] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch menu data
        const menuResponse = await fetch(`/api/restaurants/${restaurantId}/menu`);
        if (menuResponse.ok) {
          const menuData = await menuResponse.json();
          
          // Limit to 1-2 random items per category for preview
          const limitedCategories = (menuData.categories || []).map((category: MenuCategory) => ({
            ...category,
            items: category.items
              .sort(() => Math.random() - 0.5) // Shuffle items
              .slice(0, 2) // Take first 2 items
          })).filter((category: MenuCategory) => category.items.length > 0); // Only show categories with items
          
          setMenuData(limitedCategories);
        }

        // Fetch restaurant data
        const restaurantResponse = await fetch(`/api/restaurant/${restaurantId}`);
        if (restaurantResponse.ok) {
          const restaurantData = await restaurantResponse.json();
          setRestaurantData(restaurantData.restaurant);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [restaurantId]);

  const openItemModal = (item: MenuItem) => {
    setSelectedItem(item);
    setCurrentImageIndex(0); // Reset to first image
  };

  const nextImage = () => {
    if (selectedItem && currentImageIndex < selectedItem.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (menuData.length === 0) {
    return (
      <div className="text-center py-8">
        <Utensils className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">Menu not available yet.</p>
      </div>
    );
  }

  // Show preview of top 3 categories with 2 items each
  const previewCategories = showFullMenu ? menuData : menuData.slice(0, 3);

  return (
    <div className="space-y-6">
      {previewCategories.map((category) => (
        <div key={category.id} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
            <Badge variant="outline">{category.items.length} items</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(showFullMenu ? category.items : category.items.slice(0, 2)).map((item) => (
              <Card 
                key={item.id} 
                className="border hover:border-orange-300 transition-colors cursor-pointer"
                onClick={() => openItemModal(item)}
              >
                <CardContent className="p-4">
                  <div className="flex space-x-3">
                    {/* Item Image */}
                    <div className="relative w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                      {item.images.length > 0 ? (
                        <Image
                          src={item.images[0]}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Utensils className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                        <span className="font-semibold text-orange-600 ml-2">${item.price}</span>
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{item.description}</p>
                      
                      {/* Tags and Info */}
                      <div className="flex items-center space-x-2 text-xs">
                        {item.preparationTime && (
                          <div className="flex items-center space-x-1 text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{item.preparationTime}min</span>
                          </div>
                        )}
                        
                        {item.spiceLevel && (
                          <div className="flex items-center space-x-1 text-red-500">
                            <Flame className="h-3 w-3" />
                            <span className="capitalize">{item.spiceLevel}</span>
                          </div>
                        )}
                        
                        {item.dietaryTags.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Leaf className="h-3 w-3 text-green-500" />
                            <span className="text-green-600">{item.dietaryTags[0]}</span>
                          </div>
                        )}
                        
                        {item.availability !== 'available' && (
                          <Badge 
                            variant={item.availability === 'limited' ? 'outline' : 'destructive'}
                            className="text-xs"
                          >
                            {item.availability === 'limited' ? 'Limited' : 'Sold Out'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {!showFullMenu && category.items.length > 2 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-orange-600 hover:text-orange-700"
              onClick={() => setShowFullMenu(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              View {category.items.length - 2} more items
            </Button>
          )}
        </div>
      ))}
      
      {!showFullMenu && menuData.length > 3 && (
        <div className="text-center pt-4 border-t">
          <Button 
            onClick={() => setShowFullMenu(true)}
            className="aharamm-gradient"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Complete Menu
          </Button>
        </div>
      )}

      {/* Item Detail Modal */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-orange-200 shadow-2xl">
          <DialogHeader className="border-b border-orange-100 pb-4">
            <DialogTitle className="text-2xl font-bold text-gray-900">{selectedItem?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-6 pt-4">
              {/* Images */}
              {selectedItem.images.length > 0 && (
                <div className="relative">
                  <div className="aspect-video relative bg-gray-100 rounded-xl overflow-hidden shadow-lg">
                    <Image
                      src={selectedItem.images[currentImageIndex]}
                      alt={selectedItem.name}
                      fill
                      className="object-contain p-4"
                    />
                    
                    {/* Navigation buttons for multiple images */}
                    {selectedItem.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors z-10"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors z-10"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        
                        {/* Image indicators */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                          {selectedItem.images.map((_, index) => (
                            <button
                              key={index}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                              }`}
                              onClick={() => setCurrentImageIndex(index)}
                            />
                          ))}
                        </div>
                      </>
                    )}
                    
                    {selectedItem.images.length > 1 && (
                      <div className="absolute bottom-4 right-4">
                        <Badge className="bg-black/70 text-white border-0 shadow-lg">
                          <Camera className="h-3 w-3 mr-1" />
                          {currentImageIndex + 1} of {selectedItem.images.length}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  {/* Additional Images Thumbnails */}
                  {selectedItem.images.length > 1 && (
                    <div className="flex space-x-3 mt-4 overflow-x-auto pb-2">
                      {selectedItem.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                            index === currentImageIndex ? 'border-orange-500' : 'border-gray-200 hover:border-orange-300'
                          }`}
                        >
                          <Image
                            src={image}
                            alt={`${selectedItem.name} ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Details */}
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl font-bold text-orange-600">${selectedItem.price}</span>
                      <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                        {selectedItem.categoryName}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-gray-600">
                      {selectedItem.preparationTime && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{selectedItem.preparationTime} min</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-1">
                        <span className="text-sm">Availability:</span>
                        <Badge 
                          className={`${
                            selectedItem.availability === 'available' 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : selectedItem.availability === 'limited'
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                              : 'bg-red-100 text-red-800 border-red-200'
                          }`}
                        >
                          {selectedItem.availability === 'available' ? 'Available' : 
                           selectedItem.availability === 'limited' ? 'Limited Stock' : 'Sold Out'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <p className="text-gray-800 leading-relaxed text-lg">{selectedItem.description}</p>
                </div>
                
                {/* Dietary Information */}
                {(selectedItem.dietaryTags.length > 0 || selectedItem.spiceLevel) && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 text-lg">Dietary Information</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.dietaryTags.map((tag) => (
                        <Badge key={tag} className="bg-green-100 text-green-800 border-green-200">
                          <Leaf className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                      {selectedItem.spiceLevel && (
                        <Badge className="bg-red-100 text-red-800 border-red-200">
                          <Flame className="h-3 w-3 mr-1" />
                          {selectedItem.spiceLevel} spice
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Delivery Options */}
                <div className="bg-white border border-orange-200 rounded-xl p-6 shadow-sm">
                  <h4 className="font-semibold text-gray-900 text-lg mb-4">Order Options</h4>
                  
                  {/* Delivery Partners from Restaurant Data */}
                  {restaurantData?.deliveryPartners && Object.keys(restaurantData.deliveryPartners).length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        {Object.entries(restaurantData.deliveryPartners).map(([partner, url]) => {
                          const getPartnerInfo = (partnerName: string) => {
                            switch (partnerName.toLowerCase()) {
                              case 'ubereats':
                              case 'uber_eats':
                                return { name: 'Uber Eats', color: 'bg-green-500', abbr: 'UE', time: '30-45 min' };
                              case 'doordash':
                              case 'door_dash':
                                return { name: 'DoorDash', color: 'bg-red-500', abbr: 'DD', time: '25-40 min' };
                              case 'grubhub':
                              case 'grub_hub':
                                return { name: 'Grubhub', color: 'bg-orange-500', abbr: 'GH', time: '35-50 min' };
                              case 'postmates':
                                return { name: 'Postmates', color: 'bg-black', abbr: 'PM', time: '30-45 min' };
                              default:
                                return { name: partner.charAt(0).toUpperCase() + partner.slice(1), color: 'bg-blue-500', abbr: partner.substring(0, 2).toUpperCase(), time: '30-45 min' };
                            }
                          };
                          
                          const partnerInfo = getPartnerInfo(partner);
                          
                          return (
                            <a
                              key={partner}
                              href={typeof url === 'string' ? url : '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-100 hover:bg-orange-100 transition-colors"
                            >
                              <div className={`w-10 h-10 ${partnerInfo.color} rounded-full flex items-center justify-center`}>
                                <span className="text-white font-bold text-sm">{partnerInfo.abbr}</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{partnerInfo.name}</p>
                                <p className="text-sm text-gray-600">{partnerInfo.time}</p>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4 mb-6">
                      <p className="text-gray-600 mb-2">No delivery partners available</p>
                      <p className="text-sm text-gray-500">Contact restaurant directly for delivery options</p>
                    </div>
                  )}
                  
                  {/* Direct Order */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Call Restaurant Directly</p>
                        <p className="text-sm text-gray-600">
                          {restaurantData?.policies?.delivery 
                            ? `Delivery fee: ${restaurantData.policies.delivery}` 
                            : 'Call for pickup or delivery information'
                          }
                        </p>
                      </div>
                      {restaurantData?.phone ? (
                        <a
                          href={`tel:${restaurantData.phone}`}
                          className="inline-flex items-center px-4 py-2 border border-orange-200 text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          {restaurantData.phone}
                        </a>
                      ) : (
                        <Button 
                          variant="outline"
                          className="border-gray-300 text-gray-500"
                          disabled
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          No Phone Listed
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
