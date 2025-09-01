'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Star,
  Camera,
  Upload,
  X,
  User,
  MessageSquare,
  Send
} from 'lucide-react';
import Image from 'next/image';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  restaurantName: string;
  onReviewSubmitted?: () => void;
}

export default function ReviewModal({ 
  isOpen, 
  onClose, 
  restaurantId, 
  restaurantName, 
  onReviewSubmitted 
}: ReviewModalProps) {
  const { user } = useUser();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = async (files: FileList) => {
    setIsUploading(true);
    const formData = new FormData();
    
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });
    formData.append('entityType', 'review');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setImages(prev => [...prev, ...data.urls]);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    if (rating === 0) return;
    if (!comment.trim()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          rating,
          comment: comment.trim(),
          images
        }),
      });

      if (response.ok) {
        // Reset form
        setRating(0);
        setComment('');
        setImages([]);
        onClose();
        onReviewSubmitted?.();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign In Required</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-6">Please sign in to write a review.</p>
            <Button onClick={() => window.location.href = '/sign-in'} className="aharamm-gradient">
              Sign In
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-orange-500" />
            <span>Write a Review for {restaurantName}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating Section */}
          <div className="space-y-3">
            <Label className="text-base font-medium">How was your experience? *</Label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 hover:scale-110 transition-transform"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <div className="ml-4">
                  <Badge variant="outline" className="text-yellow-600">
                    {rating} star{rating !== 1 ? 's' : ''}
                  </Badge>
                </div>
              )}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-600">
                {rating === 1 && "We're sorry to hear that. Your feedback helps us improve."}
                {rating === 2 && "We appreciate your feedback and will work to do better."}
                {rating === 3 && "Thank you for your feedback. We're always working to improve."}
                {rating === 4 && "Great! We're glad you had a good experience."}
                {rating === 5 && "Excellent! We're thrilled you loved your experience."}
              </p>
            )}
          </div>

          {/* Comment Section */}
          <div className="space-y-3">
            <Label htmlFor="comment" className="text-base font-medium">
              Tell us about your experience *
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share details about the food, service, atmosphere, or anything else that made your visit memorable..."
              rows={4}
              className="resize-none"
            />
            <div className="text-sm text-gray-500 text-right">
              {comment.length}/500 characters
            </div>
          </div>

          {/* Photo Upload Section */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Add Photos (Optional)</Label>
            <p className="text-sm text-gray-600">
              Share photos of your food, the restaurant, or your dining experience.
            </p>
            
            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-300 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                className="hidden"
                id="photo-upload"
                disabled={isUploading}
              />
              <label htmlFor="photo-upload" className="cursor-pointer">
                {isUploading ? (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-orange-500 mx-auto animate-pulse" />
                    <p className="text-orange-600">Uploading photos...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Camera className="h-8 w-8 text-gray-400 mx-auto" />
                    <p className="text-gray-600">Click to add photos</p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 10MB each</p>
                  </div>
                )}
              </label>
            </div>

            {/* Uploaded Photos Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {images.map((image, index) => (
                  <div key={index} className="relative aspect-square group">
                    <Image
                      src={image}
                      alt={`Review photo ${index + 1}`}
                      fill
                      className="object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-medium text-orange-800 mb-2">💡 Tips for a great review:</h4>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• Mention specific dishes you tried</li>
              <li>• Describe the service and atmosphere</li>
              <li>• Share what made your experience special</li>
              <li>• Be honest and constructive</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="aharamm-gradient"
              disabled={rating === 0 || !comment.trim() || isSubmitting || isUploading}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Review
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
