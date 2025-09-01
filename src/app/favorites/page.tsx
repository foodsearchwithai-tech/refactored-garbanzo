'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MapPin, Star, Utensils, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface FavoriteItem {
  id: string;
  type: 'restaurant' | 'menu_item';
  createdAt: string;
  restaurant?: {
    id: string;
    name: string;
    description: string;
    address: string;
    city: string;
    state: string;
    rating: number;
    priceRange: string;
    cuisine: string;
    images: string[];
    isActive: boolean;
  };
  menuItem?: {
    id: string;
    name: string;
    description: string;
    price: number;
    images: string[];
    category: string;
    restaurantId: string;
    restaurantName: string;
  };
}

export default function FavoritesPage() {
  const { userId } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'restaurants' | 'menu_items'>('all');

  const fetchFavorites = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/favorites?filter=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || []);
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, filter]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const removeFavorite = async (favoriteId: string) => {
    try {
      const response = await fetch(`/api/favorites/${favoriteId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
      }
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  };

  const filteredFavorites = favorites.filter(fav => {
    if (filter === 'restaurants') return fav.type === 'restaurant';
    if (filter === 'menu_items') return fav.type === 'menu_item';
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="h-48 bg-gray-200"></Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Favorites</h1>
            <p className="text-gray-600">Your saved restaurants and menu items</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-red-500" />
            <span className="text-lg font-semibold text-gray-700">
              {filteredFavorites.length} items
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'aharamm-gradient text-white' : 'border-orange-200 text-gray-700 hover:bg-orange-50'}
          >
            All Favorites ({favorites.length})
          </Button>
          <Button
            variant={filter === 'restaurants' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('restaurants')}
            className={filter === 'restaurants' ? 'aharamm-gradient text-white' : 'border-orange-200 text-gray-700 hover:bg-orange-50'}
          >
            Restaurants ({favorites.filter(f => f.type === 'restaurant').length})
          </Button>
          <Button
            variant={filter === 'menu_items' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('menu_items')}
            className={filter === 'menu_items' ? 'aharamm-gradient text-white' : 'border-orange-200 text-gray-700 hover:bg-orange-50'}
          >
            Menu Items ({favorites.filter(f => f.type === 'menu_item').length})
          </Button>
        </div>

        {/* Favorites Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFavorites.length === 0 ? (
            <div className="col-span-full">
              <Card className="text-center py-12 border-orange-200">
                <CardContent>
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
                  <p className="text-gray-500 mb-4">
                    Start exploring restaurants and save your favorites here.
                  </p>
                  <Link href="/restaurants">
                    <Button className="aharamm-gradient text-white">
                      Discover Restaurants
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredFavorites.map((favorite) => (
              <Card key={favorite.id} className="group hover:shadow-lg transition-shadow duration-200 border-orange-100">
                {favorite.type === 'restaurant' && favorite.restaurant && (
                  <>
                    <CardHeader className="p-0">
                      <div className="relative h-48 overflow-hidden rounded-t-lg">
                        <Image
                          src={favorite.restaurant.images?.[0] || '/placeholder-restaurant.jpg'}
                          alt={favorite.restaurant.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute top-3 right-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFavorite(favorite.id)}
                            className="bg-white/90 hover:bg-white text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {!favorite.restaurant.isActive && (
                          <div className="absolute top-3 left-3">
                            <Badge variant="destructive">Closed</Badge>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-lg font-bold text-gray-900 line-clamp-1">
                          {favorite.restaurant.name}
                        </CardTitle>
                        <div className="flex items-center gap-1 ml-2">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium text-gray-700">
                            {favorite.restaurant.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {favorite.restaurant.description}
                      </p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 text-orange-500" />
                          <span className="line-clamp-1">
                            {favorite.restaurant.address}, {favorite.restaurant.city}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Utensils className="h-4 w-4 text-orange-500" />
                            <span className="text-sm text-gray-600">{favorite.restaurant.cuisine}</span>
                          </div>
                          <Badge variant="outline" className="border-orange-200 text-orange-700">
                            {favorite.restaurant.priceRange}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Link href={`/restaurant/${favorite.restaurant.id}`} className="flex-1">
                          <Button className="w-full aharamm-gradient text-white hover:opacity-90">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Restaurant
                          </Button>
                        </Link>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          Added {new Date(favorite.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </>
                )}

                {favorite.type === 'menu_item' && favorite.menuItem && (
                  <>
                    <CardHeader className="p-0">
                      <div className="relative h-40 overflow-hidden rounded-t-lg">
                        <Image
                          src={favorite.menuItem.images?.[0] || '/placeholder-restaurant.jpg'}
                          alt={favorite.menuItem.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute top-3 right-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFavorite(favorite.id)}
                            className="bg-white/90 hover:bg-white text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-lg font-bold text-gray-900 line-clamp-1">
                          {favorite.menuItem.name}
                        </CardTitle>
                        <div className="text-lg font-bold text-orange-600 ml-2">
                          ₹{favorite.menuItem.price}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {favorite.menuItem.description}
                      </p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Utensils className="h-4 w-4 text-orange-500" />
                          <span>{favorite.menuItem.category}</span>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          from <span className="font-medium">{favorite.menuItem.restaurantName}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Link href={`/restaurant/${favorite.menuItem.restaurantId}`} className="flex-1">
                          <Button className="w-full aharamm-gradient text-white hover:opacity-90">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Restaurant
                          </Button>
                        </Link>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          Added {new Date(favorite.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Load More Button (for pagination if needed) */}
        {filteredFavorites.length > 0 && filteredFavorites.length % 20 === 0 && (
          <div className="text-center mt-8">
            <Button 
              variant="outline" 
              className="border-orange-200 text-gray-700 hover:bg-orange-50"
            >
              Load More Favorites
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
