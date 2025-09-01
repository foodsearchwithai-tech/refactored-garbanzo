'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, X, Camera } from 'lucide-react';
import Image from 'next/image';

interface FoodReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  restaurantName: string;
  menuItemId: string;
  menuItemName: string;
  onReviewSubmitted: () => void;
}

export default function FoodReviewModal({
  isOpen,
  onClose,
  restaurantId,
  restaurantName,
  menuItemId,
  menuItemName,
  onReviewSubmitted
}: FoodReviewModalProps) {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    overallRating: 0,
    foodQualityRating: 0,
    serviceRating: 0,
    ambianceRating: 0,
    valueForMoneyRating: 0,
    title: '',
    content: '',
    images: [] as File[],
    reviewLocation: '',
    userCity: '',
    userState: '',
    userLatitude: null as number | null,
    userLongitude: null as number | null
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);

  // Detect user location when modal opens
  useEffect(() => {
    if (isOpen && !locationDetected) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setFormData(prev => ({
              ...prev,
              userLatitude: latitude,
              userLongitude: longitude
            }));
            
            // Try to get city/state from coordinates using reverse geocoding
            try {
              const response = await fetch(`/api/geocoding/reverse?lat=${latitude}&lng=${longitude}`);
              if (response.ok) {
                const data = await response.json();
                setFormData(prev => ({
                  ...prev,
                  userCity: data.city || '',
                  userState: data.state || '',
                  reviewLocation: data.city && data.state ? `${data.city}, ${data.state}` : ''
                }));
              }
            } catch (error) {
              console.log('Could not reverse geocode location:', error);
            }
            
            setLocationDetected(true);
          },
          (error) => {
            console.log('Location access denied:', error);
            setLocationDetected(true);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
        );
      } else {
        setLocationDetected(true);
      }
    }
  }, [isOpen, locationDetected]);

  const handleRatingChange = (field: string, rating: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: rating
    }));
  };

  const handleImageUpload = async (files: File[]) => {
    if (!files || files.length === 0) return [];

    setIsUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const timestamp = Date.now();
        const filename = `reviews/${timestamp}-${file.name}`;

        const response = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}&entityType=review`, {
          method: 'POST',
          headers: {
            'Content-Type': file.type,
          },
          body: file,
        });

        if (response.ok) {
          const data = await response.json();
          return data.url;
        } else {
          console.error('Upload failed:', await response.text());
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);
      return results.filter(url => url !== null);
    } catch (error) {
      console.error('Error uploading images:', error);
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please sign in to submit a review.');
      return;
    }

    if (formData.overallRating === 0) {
      alert('Please provide an overall rating.');
      return;
    }

    if (!formData.content.trim()) {
      alert('Please write a review.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload images first
      let imageUrls: string[] = [];
      if (formData.images.length > 0) {
        imageUrls = await handleImageUpload(formData.images);
      }

      const reviewData = {
        restaurantId,
        menuItemId,
        overallRating: formData.overallRating,
        foodQualityRating: formData.foodQualityRating || formData.overallRating,
        serviceRating: formData.serviceRating || formData.overallRating,
        ambianceRating: formData.ambianceRating || formData.overallRating,
        valueForMoneyRating: formData.valueForMoneyRating || formData.overallRating,
        title: formData.title,
        content: formData.content,
        images: imageUrls,
        reviewLocation: formData.reviewLocation,
        userCity: formData.userCity,
        userState: formData.userState,
        userLatitude: formData.userLatitude,
        userLongitude: formData.userLongitude
      };

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData),
      });

      if (response.ok) {
        alert('Review submitted successfully!');
        // Close modal first, then reset form
        onClose();
        setTimeout(() => {
          resetForm();
          onReviewSubmitted();
        }, 150);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      overallRating: 0,
      foodQualityRating: 0,
      serviceRating: 0,
      ambianceRating: 0,
      valueForMoneyRating: 0,
      title: '',
      content: '',
      images: [],
      reviewLocation: '',
      userCity: '',
      userState: '',
      userLatitude: null,
      userLongitude: null
    });
    setImagePreviews([]);
    setLocationDetected(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      // Reset form after a small delay to ensure modal closes properly
      setTimeout(() => {
        resetForm();
      }, 150);
    }
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, images: newImages }));
    setImagePreviews(newPreviews);
  };

  const RatingStars = ({ rating, onRatingChange, label }: { 
    rating: number; 
    onRatingChange: (rating: number) => void; 
    label: string; 
  }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className="transition-colors"
          >
            <Star
              className={`h-6 w-6 ${
                star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {rating > 0 ? `${rating}/5` : 'Not rated'}
        </span>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-0 shadow-2xl"
        showCloseButton={false}
      >
        <div className="p-6">
          <DialogHeader className="mb-6 border-b border-gray-200 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  Write a Review for {menuItemName}
                </DialogTitle>
                <DialogDescription className="text-gray-600">
                  Share your experience with this dish at {restaurantName}
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8 text-gray-500 hover:text-gray-700"
                type="button"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Overall Rating */}
            <div className="p-4 rounded-lg border border-gray-100">
              <RatingStars
                rating={formData.overallRating}
                onRatingChange={(rating) => handleRatingChange('overallRating', rating)}
                label="Overall Rating *"
              />
            </div>

            {/* Detailed Ratings */}
            <div className="p-4 rounded-lg border border-gray-100">
              <h4 className="font-medium text-gray-900 mb-4">Detailed Ratings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RatingStars
                  rating={formData.foodQualityRating}
                  onRatingChange={(rating) => handleRatingChange('foodQualityRating', rating)}
                  label="Food Quality"
                />
                <RatingStars
                  rating={formData.serviceRating}
                  onRatingChange={(rating) => handleRatingChange('serviceRating', rating)}
                  label="Service"
                />
                <RatingStars
                  rating={formData.ambianceRating}
                  onRatingChange={(rating) => handleRatingChange('ambianceRating', rating)}
                  label="Ambiance"
                />
                <RatingStars
                  rating={formData.valueForMoneyRating}
                  onRatingChange={(rating) => handleRatingChange('valueForMoneyRating', rating)}
                  label="Value for Money"
                />
              </div>
            </div>

            {/* Review Title */}
            <div className="p-4 rounded-lg border border-gray-100">
              <Label htmlFor="title" className="text-gray-700 font-medium">Review Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Summarize your experience"
                className="mt-2 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            {/* Review Content */}
            <div className="p-4 rounded-lg border border-gray-100">
              <Label htmlFor="content" className="text-gray-700 font-medium">Your Review *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Tell others about your experience with this dish..."
                rows={4}
                required
                className="mt-2 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            {/* Image Upload */}
            <div className="p-4 rounded-lg border border-gray-100">
              <Label className="text-gray-700 font-medium">Add Photos</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
                      
                      // Create previews
                      files.forEach((file) => {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          setImagePreviews(prev => [...prev, e.target?.result as string]);
                        };
                        reader.readAsDataURL(file);
                      });
                    }
                  }}
                  className="hidden"
                  id="review-images"
                />
                <label htmlFor="review-images" className="cursor-pointer">
                  <div className="flex flex-col items-center">
                    <Camera className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Click to upload food photos</p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 10MB each</p>
                  </div>
                </label>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <div className="relative h-24 w-full rounded-lg overflow-hidden border border-gray-200">
                        <Image 
                          src={preview} 
                          alt={`Preview ${index + 1}`} 
                          fill 
                          className="object-cover" 
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {isUploading && (
                <p className="text-sm text-blue-600 mt-2">Uploading images...</p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 p-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="aharamm-gradient" 
                disabled={isSubmitting || isUploading}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
