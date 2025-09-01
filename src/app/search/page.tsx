'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Star,
  MapPin,
  Camera,
  Mic,
  ArrowLeft
} from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  categoryName?: string;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
}

interface Restaurant {
  id: string;
  name: string;
  description?: string;
  cuisineTypes?: string[];
  profileImage?: string;
  averageRating?: string;
  reviewCount?: number;
  address?: string;
  city?: string;
  state?: string;
  distance?: number;
}

interface SearchResult {
  restaurant: Restaurant;
  menuItems: MenuItem[];
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  
  // Filter states
  const [sortBy, setSortBy] = useState('relevance');
  const [minRating, setMinRating] = useState('0');
  const [maxPrice, setMaxPrice] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState<string[]>([]);
  const [dietaryFilter, setDietaryFilter] = useState<string[]>([]);
  const [availableCuisines, setAvailableCuisines] = useState<string[]>([]);
  const [availableDietaryOptions, setAvailableDietaryOptions] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [searchPlaceholder, setSearchPlaceholder] = useState('Search for food, restaurants, or cuisines...');

  useEffect(() => {
    const query = searchParams.get('q');
    const imageParam = searchParams.get('image');
    
    const performInitialSearch = async (searchQuery: string, imageData?: string) => {
      setLoading(true);
      try {
        const response = await fetch('/api/ai-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: imageData ? undefined : searchQuery,
            imageData,
            radius: 50
          }),
        });
        
        const data = await response.json();
        if (data.success) {
          setResults(data.results);
          setTotalResults(data.total);
          setAiAnalysis(data.aiAnalysis);
          
          // Update search query to show what was actually searched
          if (imageData) {
            setSearchQuery(data.aiAnalysis || 'Image search results');
          } else {
            setSearchQuery(searchQuery);
          }
          
          // Extract dynamic filter options
          const cuisines = new Set<string>();
          const dietaryOptions = new Set<string>();
          let minPrice = Infinity;
          let maxPrice = 0;
          
          data.results.forEach((result: SearchResult) => {
            result.restaurant.cuisineTypes?.forEach((cuisine: string) => cuisines.add(cuisine));
            result.menuItems.forEach((item: MenuItem) => {
              const price = parseFloat(item.price.toString());
              minPrice = Math.min(minPrice, price);
              maxPrice = Math.max(maxPrice, price);
              
              if (item.isVegetarian) dietaryOptions.add('vegetarian');
              if (item.isVegan) dietaryOptions.add('vegan');
              if (item.isGlutenFree) dietaryOptions.add('gluten-free');
            });
          });
          
          setAvailableCuisines(Array.from(cuisines));
          setAvailableDietaryOptions(Array.from(dietaryOptions));
          setPriceRange({
            min: minPrice === Infinity ? 0 : Math.floor(minPrice),
            max: maxPrice === 0 ? 1000 : Math.ceil(maxPrice)
          });
        }
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (query && query !== 'image-search') {
      setSearchPlaceholder('Search for food, restaurants, or cuisines...');
      performInitialSearch(query);
    } else if (query === 'image-search' || imageParam) {
      setSearchQuery('');
      setSearchPlaceholder('Upload an image to search for similar food...');
    }
  }, [searchParams]);

  const performSearch = async (query: string, imageData?: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query,
          imageData,
          radius: 50 // Larger radius for more results
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setResults(data.results);
        setTotalResults(data.total);
        setAiAnalysis(data.aiAnalysis);
        
        // Update search query to show what was actually searched
        if (imageData) {
          setSearchQuery(data.aiAnalysis || 'Image search results');
          setSearchPlaceholder('Search for food, restaurants, or cuisines...');
        } else if (query && query !== searchQuery) {
          setSearchQuery(query);
          setSearchPlaceholder('Search for food, restaurants, or cuisines...');
        }
        
        // Clear processing states
        setIsListening(false);
        
        // Extract available cuisines from results
        const cuisines = new Set<string>();
        const dietaryOptions = new Set<string>();
        let minPrice = Infinity;
        let maxPrice = 0;
        
        data.results.forEach((result: SearchResult) => {
          result.restaurant.cuisineTypes?.forEach((cuisine: string) => cuisines.add(cuisine));
          
          result.menuItems.forEach((item: MenuItem) => {
            const price = parseFloat(item.price.toString());
            minPrice = Math.min(minPrice, price);
            maxPrice = Math.max(maxPrice, price);
            
            if (item.isVegetarian) dietaryOptions.add('vegetarian');
            if (item.isVegan) dietaryOptions.add('vegan');
            if (item.isGlutenFree) dietaryOptions.add('gluten-free');
          });
        });
        
        setAvailableCuisines(Array.from(cuisines));
        setAvailableDietaryOptions(Array.from(dietaryOptions));
        setPriceRange({
          min: minPrice === Infinity ? 0 : Math.floor(minPrice),
          max: maxPrice === 0 ? 1000 : Math.ceil(maxPrice)
        });
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('Voice search is not supported in your browser');
      return;
    }

    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    setIsListening(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setIsListening(false);
      
      // Auto-search after voice input
      setTimeout(() => {
        router.push(`/search?q=${encodeURIComponent(transcript)}`);
        performSearch(transcript);
      }, 500);
    };

    recognition.onerror = () => {
      setIsListening(false);
      alert('Voice search failed. Please try again.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleImageSearch = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          const imageData = base64.split(',')[1]; // Remove data:image/jpeg;base64, prefix
          
          setSearchQuery('Searching image...');
          router.push(`/search?q=image-search`);
          performSearch('', imageData);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      performSearch(searchQuery);
    }
  };

  const filteredAndSortedResults = () => {
    const filtered = results.filter(result => {
      // Rating filter
      const rating = parseFloat(result.restaurant.averageRating || '0');
      if (rating < parseFloat(minRating)) return false;

      // Price filter
      if (maxPrice) {
        const hasItemInRange = result.menuItems.some(item => 
          parseFloat(item.price.toString()) <= parseFloat(maxPrice)
        );
        if (!hasItemInRange) return false;
      }

      // Cuisine filter
      if (cuisineFilter.length > 0) {
        const hasCuisine = result.restaurant.cuisineTypes?.some(cuisine => 
          cuisineFilter.includes(cuisine)
        );
        if (!hasCuisine) return false;
      }

      // Dietary filter
      if (dietaryFilter.length > 0) {
        const hasDietaryOption = result.menuItems.some(item => {
          if (dietaryFilter.includes('vegetarian') && item.isVegetarian) return true;
          if (dietaryFilter.includes('vegan') && item.isVegan) return true;
          if (dietaryFilter.includes('gluten-free') && item.isGlutenFree) return true;
          return false;
        });
        if (!hasDietaryOption) return false;
      }

      return true;
    });

    // Sort results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return parseFloat(b.restaurant.averageRating || '0') - parseFloat(a.restaurant.averageRating || '0');
        case 'price-low':
          const aMinPrice = Math.min(...a.menuItems.map(item => parseFloat(item.price.toString())));
          const bMinPrice = Math.min(...b.menuItems.map(item => parseFloat(item.price.toString())));
          return aMinPrice - bMinPrice;
        case 'price-high':
          const aMaxPrice = Math.max(...a.menuItems.map(item => parseFloat(item.price.toString())));
          const bMaxPrice = Math.max(...b.menuItems.map(item => parseFloat(item.price.toString())));
          return bMaxPrice - aMaxPrice;
        case 'distance':
          return (a.restaurant.distance || 0) - (b.restaurant.distance || 0);
        default: // relevance
          return 0; // Keep original order from API
      }
    });

    return filtered;
  };

  const renderStars = (rating: string, reviewCount?: number) => {
    const numRating = parseFloat(rating || '0');
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= numRating 
              ? 'fill-orange-400 text-orange-400' 
              : 'fill-gray-200 text-gray-200'
          }`}
        />
      );
    }
    
    return (
      <div className="flex items-center gap-1">
        <div className="flex">{stars}</div>
        <span className="text-sm font-medium text-gray-900">{numRating.toFixed(1)}</span>
        {reviewCount && reviewCount > 0 && (
          <span className="text-sm text-gray-500">({reviewCount} reviews)</span>
        )}
      </div>
    );
  };

  const FilterSection = () => (
    <div className="w-full lg:w-64 bg-white">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </h3>
      </div>
      
      <div className="p-4 space-y-6">
        {/* Sort By */}
        <div>
          <label className="text-sm font-medium text-gray-900 mb-2 block">Sort By</label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="border-gray-300 focus:border-orange-500 focus:ring-orange-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="rating">Rating: High to Low</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="distance">Distance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Rating Filter */}
        <div>
          <label className="text-sm font-medium text-gray-900 mb-2 block">Minimum Rating</label>
          <Select value={minRating} onValueChange={setMinRating}>
            <SelectTrigger className="border-gray-300 focus:border-orange-500 focus:ring-orange-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Any Rating</SelectItem>
              <SelectItem value="1">1+ Stars</SelectItem>
              <SelectItem value="2">2+ Stars</SelectItem>
              <SelectItem value="3">3+ Stars</SelectItem>
              <SelectItem value="4">4+ Stars</SelectItem>
              <SelectItem value="4.5">4.5+ Stars</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Dynamic Price Filter */}
        <div>
          <label className="text-sm font-medium text-gray-900 mb-2 block">
            Max Price (₹{priceRange.min} - ₹{priceRange.max})
          </label>
          <Input
            type="number"
            placeholder={`Enter max price (up to ₹${priceRange.max})`}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            min={priceRange.min}
            max={priceRange.max}
            className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
          />
          {priceRange.max > 0 && (
            <div className="mt-1 text-xs text-gray-500">
              Average price range in results: ₹{priceRange.min} - ₹{priceRange.max}
            </div>
          )}
        </div>

        {/* Dynamic Cuisine Filter */}
        {availableCuisines.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-900 mb-2 block">Cuisine Type</label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {availableCuisines.map(cuisine => (
                <div key={cuisine} className="flex items-center space-x-2">
                  <Checkbox
                    id={`cuisine-${cuisine}`}
                    checked={cuisineFilter.includes(cuisine)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setCuisineFilter([...cuisineFilter, cuisine]);
                      } else {
                        setCuisineFilter(cuisineFilter.filter(c => c !== cuisine));
                      }
                    }}
                  />
                  <label htmlFor={`cuisine-${cuisine}`} className="text-sm text-gray-700">{cuisine}</label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Dietary Options Filter */}
        {availableDietaryOptions.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-900 mb-2 block">Dietary Options</label>
            <div className="space-y-2">
              {availableDietaryOptions.map(diet => (
                <div key={diet} className="flex items-center space-x-2">
                  <Checkbox
                    id={diet}
                    checked={dietaryFilter.includes(diet)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setDietaryFilter([...dietaryFilter, diet]);
                      } else {
                        setDietaryFilter(dietaryFilter.filter(d => d !== diet));
                      }
                    }}
                  />
                  <label htmlFor={diet} className="text-sm text-gray-700 capitalize">{diet.replace('-', ' ')}</label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clear Filters Button */}
        <Button 
          variant="outline" 
          onClick={() => {
            setMinRating('0');
            setMaxPrice('');
            setCuisineFilter([]);
            setDietaryFilter([]);
          }}
          className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
        >
          Clear All Filters
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Search */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex-1 max-w-2xl mx-auto">
              <div className="flex items-center bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500">
                <Search className="h-4 w-4 text-gray-400 mr-3" />
                <Input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="border-0 bg-transparent focus-visible:ring-0"
                />
                <div className="flex items-center gap-1 ml-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-gray-400 hover:text-gray-600"
                    onClick={handleImageSearch}
                    title="Search by image"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className={`${isListening ? 'text-orange-500' : 'text-gray-400'} hover:text-gray-600`}
                    onClick={handleVoiceSearch}
                    title="Voice search"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleSearch} 
              className="bg-orange-500 hover:bg-orange-600 text-white px-6"
            >
              Search
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block">
            <FilterSection />
          </div>

          {/* Mobile Filters */}
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="outline" size="sm" className="mb-4">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <FilterSection />
            </SheetContent>
          </Sheet>

          {/* Results Section */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Search Results {totalResults > 0 && `(${filteredAndSortedResults().length} of ${totalResults})`}
                </h1>
                {aiAnalysis && (
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">
                    Searching for: <span className="text-orange-600 font-medium">{aiAnalysis}</span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-orange-500 hover:bg-orange-600' : 'border-gray-300'}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-orange-500 hover:bg-orange-600' : 'border-gray-300'}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Searching for delicious food...</p>
              </div>
            )}

            {/* Results Grid/List */}
            {!loading && filteredAndSortedResults().length > 0 && (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-4'}>
                {filteredAndSortedResults().map((result) => (
                  <Card key={result.restaurant.id} className="hover:shadow-lg transition-shadow border border-gray-200">
                    <CardContent className="p-0">
                      <div className={viewMode === 'grid' ? 'p-4' : 'flex p-4'}>
                        {/* Restaurant Image */}
                        <div className={viewMode === 'grid' ? 'mb-4' : 'w-32 h-32 mr-4 flex-shrink-0'}>
                          <div className={`${viewMode === 'grid' ? 'h-48' : 'h-full'} bg-gray-100 rounded-lg overflow-hidden`}>
                            {result.restaurant.profileImage ? (
                              <Image
                                src={result.restaurant.profileImage}
                                alt={result.restaurant.name}
                                width={viewMode === 'grid' ? 400 : 128}
                                height={viewMode === 'grid' ? 192 : 128}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-orange-100 flex items-center justify-center">
                                <span className="text-4xl text-orange-300">🍽️</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Restaurant Info */}
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{result.restaurant.name}</h3>
                            {result.restaurant.distance && (
                              <div className="flex items-center text-sm text-gray-500">
                                <MapPin className="h-3 w-3 mr-1" />
                                {result.restaurant.distance}km away
                              </div>
                            )}
                          </div>

                          {/* Rating */}
                          {result.restaurant.averageRating && parseFloat(result.restaurant.averageRating) > 0 && (
                            <div className="mb-2">
                              {renderStars(result.restaurant.averageRating, result.restaurant.reviewCount)}
                            </div>
                          )}

                          {/* Cuisine Types */}
                          {result.restaurant.cuisineTypes && result.restaurant.cuisineTypes.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {result.restaurant.cuisineTypes.slice(0, 3).map((cuisine, index) => (
                                <Badge key={index} variant="secondary" className="bg-orange-100 text-orange-800">
                                  {cuisine}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Description */}
                          {result.restaurant.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{result.restaurant.description}</p>
                          )}

                          {/* Address */}
                          {(result.restaurant.address || result.restaurant.city) && (
                            <p className="text-sm text-gray-500 mb-3">
                              {[result.restaurant.address, result.restaurant.city, result.restaurant.state]
                                .filter(Boolean)
                                .join(', ')}
                            </p>
                          )}

                          {/* Matching Menu Items */}
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">
                              Matching Items ({result.menuItems.length})
                            </h4>
                            <div className="space-y-2">
                              {result.menuItems.slice(0, 3).map((item) => (
                                <Link
                                  key={item.id}
                                  href={`/restaurant/${result.restaurant.id}/menu#item-${item.id}`}
                                  className="flex justify-between items-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex-1">
                                    <h5 className="text-sm font-medium text-gray-900">{item.name}</h5>
                                    <p className="text-xs text-gray-600 line-clamp-1">{item.description}</p>
                                    <div className="flex gap-1 mt-1">
                                      {item.isVegetarian && (
                                        <Badge variant="outline" className="text-xs border-green-500 text-green-700">Veg</Badge>
                                      )}
                                      {item.isVegan && (
                                        <Badge variant="outline" className="text-xs border-green-600 text-green-800">Vegan</Badge>
                                      )}
                                      {item.isGlutenFree && (
                                        <Badge variant="outline" className="text-xs border-blue-500 text-blue-700">Gluten-Free</Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right ml-2">
                                    <p className="font-bold text-orange-600">₹{item.price}</p>
                                  </div>
                                </Link>
                              ))}
                              {result.menuItems.length > 3 && (
                                <p className="text-xs text-gray-500 text-center">
                                  +{result.menuItems.length - 3} more items
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Action Button */}
                          <Link href={`/restaurant/${result.restaurant.id}`}>
                            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                              View Restaurant
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* No Results */}
            {!loading && filteredAndSortedResults().length === 0 && searchQuery && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">No results found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search terms or filters to find what you&apos;re looking for.
                </p>
                <Button 
                  onClick={() => {
                    setMinRating('0');
                    setMaxPrice('');
                    setCuisineFilter([]);
                    setDietaryFilter([]);
                  }} 
                  variant="outline"
                  className="border-orange-500 text-orange-600 hover:bg-orange-50"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
