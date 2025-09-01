'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Calendar, ThumbsUp, Edit2, ExternalLink, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Review {
  id: string;
  restaurantId: string;
  restaurantName: string;
  menuItemId?: string;
  menuItemName?: string;
  overallRating: number;
  foodQualityRating: number;
  serviceRating: number;
  ambianceRating: number;
  valueForMoneyRating: number;
  title?: string;
  content: string;
  images: string[];
  tags: string[];
  isVerified: boolean;
  helpfulVotes: number;
  createdAt: string;
  updatedAt: string;
  reviewLocation?: string;
  restaurantImages?: string[];
}

export default function ReviewHistoryPage() {
  const { userId } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'recent' | 'top_rated'>('all');

  const fetchReviews = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/reviews?filter=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, filter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const deleteReview = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setReviews(prev => prev.filter(review => review.id !== reviewId));
      }
    } catch (error) {
      console.error('Failed to delete review:', error);
    }
  };

  const StarRating = ({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) => {
    const sizeClass = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
    
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`${sizeClass} ${
              i < rating 
                ? 'text-yellow-500 fill-current' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className={`ml-1 font-medium ${size === 'md' ? 'text-base' : 'text-sm'} text-gray-700`}>
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  const filteredReviews = reviews.filter(review => {
    if (filter === 'recent') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(review.createdAt) > weekAgo;
    }
    if (filter === 'top_rated') return review.overallRating >= 4;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="h-64 bg-gray-200"></Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Reviews</h1>
            <p className="text-gray-600">Your dining experiences and feedback</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Star className="h-6 w-6 text-yellow-500" />
            <span className="text-lg font-semibold text-gray-700">
              {filteredReviews.length} reviews
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
            All Reviews ({reviews.length})
          </Button>
          <Button
            variant={filter === 'recent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('recent')}
            className={filter === 'recent' ? 'aharamm-gradient text-white' : 'border-orange-200 text-gray-700 hover:bg-orange-50'}
          >
            Recent (Last 7 days)
          </Button>
          <Button
            variant={filter === 'top_rated' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('top_rated')}
            className={filter === 'top_rated' ? 'aharamm-gradient text-white' : 'border-orange-200 text-gray-700 hover:bg-orange-50'}
          >
            Top Rated (4+ Stars)
          </Button>
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
          {filteredReviews.length === 0 ? (
            <Card className="text-center py-12 border-orange-200">
              <CardContent>
                <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                <p className="text-gray-500 mb-4">
                  Start dining and share your experiences with the community.
                </p>
                <Link href="/restaurants">
                  <Button className="aharamm-gradient text-white">
                    Find Restaurants
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            filteredReviews.map((review) => (
              <Card key={review.id} className="border-orange-100 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Restaurant Image */}
                    <div className="lg:w-48 h-32 lg:h-48 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image
                        src={review.restaurantImages?.[0] || '/placeholder-restaurant.jpg'}
                        alt={review.restaurantName}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Review Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-gray-900 truncate">
                              {review.restaurantName}
                            </h3>
                            {review.isVerified && (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                Verified
                              </Badge>
                            )}
                          </div>
                          
                          {review.menuItemName && (
                            <p className="text-sm text-gray-600 mb-2">
                              Review for: <span className="font-medium">{review.menuItemName}</span>
                            </p>
                          )}
                          
                          <StarRating rating={review.overallRating} size="md" />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Link href={`/restaurant/${review.restaurantId}`}>
                            <Button size="sm" variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Visit
                            </Button>
                          </Link>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-blue-200 text-blue-600 hover:bg-blue-50"
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => deleteReview(review.id)}
                            className="border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Review Title & Content */}
                      {review.title && (
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          {review.title}
                        </h4>
                      )}
                      
                      <p className="text-gray-700 mb-4 line-clamp-3">
                        {review.content}
                      </p>

                      {/* Detailed Ratings */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Food Quality</p>
                          <StarRating rating={review.foodQualityRating} />
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Service</p>
                          <StarRating rating={review.serviceRating} />
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Ambiance</p>
                          <StarRating rating={review.ambianceRating} />
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Value</p>
                          <StarRating rating={review.valueForMoneyRating} />
                        </div>
                      </div>

                      {/* Tags */}
                      {review.tags && review.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {review.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="border-orange-200 text-orange-700">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                          </div>
                          {review.reviewLocation && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{review.reviewLocation}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {review.helpfulVotes > 0 && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <ThumbsUp className="h-4 w-4 text-green-600" />
                              <span>{review.helpfulVotes} helpful</span>
                            </div>
                          )}
                          {review.createdAt !== review.updatedAt && (
                            <span className="text-xs text-gray-400">
                              (edited)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Load More Button (for pagination if needed) */}
        {filteredReviews.length > 0 && filteredReviews.length % 10 === 0 && (
          <div className="text-center mt-8">
            <Button 
              variant="outline" 
              className="border-orange-200 text-gray-700 hover:bg-orange-50"
            >
              Load More Reviews
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
