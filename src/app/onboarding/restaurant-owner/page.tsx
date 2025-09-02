'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Store, Clock, Phone, ArrowLeft, FileText, Camera, Award, ChefHat, X, Plus } from 'lucide-react';
import { CUISINE_TYPES, RESTAURANT_CATEGORIES, DEFAULT_HOURS } from '@/lib/constants';
import Link from 'next/link';
import Image from 'next/image';
import ImageWithFallback from '@/components/ImageWithFallback';


interface RestaurantOnboardingData {
  // Business Information
  restaurantName: string;
  businessLicense: string;
  description: string;
  cuisineTypes: string[];
  categories: string[]; // Changed from single category to multiple categories
  tagline: string;
  
  // Image Fields
  profileImage: File | string | null; // Restaurant logo/profile image
  coverImages: (File | string)[]; // Banner/cover images
  galleryImages: (File | string)[]; // Additional gallery photos
  bannerImages: (File | string)[]; // Specific banner images
  logoImage: File | string | null; // Dedicated logo field
  
  // Owner Details
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  
  // Restaurant Location
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude: string;
  longitude: string;
  
  // Contact Information
  phone: string;
  email: string;
  website: string;
  socialMedia: {
    facebook: string;
    instagram: string;
    twitter: string;
    youtube: string;
    tiktok: string;
    linkedin: string;
    whatsapp: string;
    googleBusiness: string;
    yelp: string;
    tripadvisor: string;
  };
  
  // Social Media Icons
  socialMediaIcons: {
    facebook: string;
    instagram: string;
    twitter: string;
    youtube: string;
    tiktok: string;
    linkedin: string;
    whatsapp: string;
    googleBusiness: string;
    yelp: string;
    tripadvisor: string;
  };
  
  // Delivery Partners
  deliveryPartners: {
    zomato: string;
    swiggy: string;
    uberEats: string;
    doorDash: string;
    grubHub: string;
    other: string;
  };
  
  // Delivery Partner Icons
  deliveryPartnerIcons: {
    zomato: string;
    swiggy: string;
    uberEats: string;
    doorDash: string;
    grubHub: string;
    other: string;
  };
  
  // Custom URLs for social media and external links
  customSocialUrls: Array<{
    label: string;
    url: string;
    icon?: string;
  }>;
  
  // Custom URLs for delivery partners
  customDeliveryUrls: Array<{
    label: string;
    url: string;
    icon?: string;
  }>;
  
  // Operating Hours with additional slots support
  operatingHours: {
    [K in keyof typeof DEFAULT_HOURS]: {
      isOpen: boolean;
      openTime: string;
      closeTime: string;
      additionalSlots?: Array<{
        openTime: string;
        closeTime: string;
      }>;
    };
  };
  
  // Features & Policies
  features: string[];
  policies: {
    cancellation: string;
    delivery: string;
    reservation: string;
    dressCode: string;
  };

  // Kitchen Story & Media
  kitchenStory: string;
  kitchenPhotos: (File | string)[];
  
  // Achievements
  achievements: {
    title: string;
    description: string;
    year?: number;
    issuer?: string;
  }[];
  achievementPhotos: (File | string)[];
}

const RESTAURANT_FEATURES = [
  'delivery', 'dine_in', 'takeout', 'reservation', 'parking', 
  'wifi', 'outdoor_seating', 'live_music', 'pet_friendly', 'wheelchair_accessible'
];

export default function RestaurantOwnerOnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCoordinates, setIsLoadingCoordinates] = useState(false);
  const [loadingIcons, setLoadingIcons] = useState<Record<string, boolean>>({});
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [otherCategorySelected, setOtherCategorySelected] = useState(false);
  const [showCustomCuisine, setShowCustomCuisine] = useState(false);
  const [customCuisine, setCustomCuisine] = useState('');
  const [showCustomFeature, setShowCustomFeature] = useState(false);
  const [customFeature, setCustomFeature] = useState('');
  const [showDeliveryPartners, setShowDeliveryPartners] = useState(true);
  const [kitchenPhotoPreviews, setKitchenPhotoPreviews] = useState<string[]>([]);
  const [achievementPhotoPreviews, setAchievementPhotoPreviews] = useState<string[]>([]);
  
  // New image preview states
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [coverImagePreviews, setCoverImagePreviews] = useState<string[]>([]);
  const [galleryImagePreviews, setGalleryImagePreviews] = useState<string[]>([]);
  const [bannerImagePreviews, setBannerImagePreviews] = useState<string[]>([]);
  const [logoImagePreview, setLogoImagePreview] = useState<string | null>(null);
  
  const [isKitchenPhotoUploading, setIsKitchenPhotoUploading] = useState(false);
  const [isAchievementPhotoUploading, setIsAchievementPhotoUploading] = useState(false);
  
  // New upload states
  const [isProfileImageUploading, setIsProfileImageUploading] = useState(false);
  const [isCoverImagesUploading, setIsCoverImagesUploading] = useState(false);
  const [isGalleryImagesUploading, setIsGalleryImagesUploading] = useState(false);
  const [isBannerImagesUploading, setIsBannerImagesUploading] = useState(false);
  const [isLogoImageUploading, setIsLogoImageUploading] = useState(false);
  const [formData, setFormData] = useState<RestaurantOnboardingData>({
    // Business Information
    restaurantName: '',
    businessLicense: '', // Hidden field, set to null by default
    description: '',
    cuisineTypes: [],
    categories: [], // Changed from single category to multiple categories
    tagline: '',
    
    // Image Fields
    profileImage: null,
    coverImages: [],
    galleryImages: [],
    bannerImages: [],
    logoImage: null,
    
    // Owner Details
    ownerName: user?.firstName + ' ' + user?.lastName || '',
    ownerPhone: '',
    ownerEmail: user?.primaryEmailAddress?.emailAddress || '',
    
    // Restaurant Location
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    latitude: '',
    longitude: '',
    
    // Contact Information
    phone: '',
    email: '',
    website: '',
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: '',
      youtube: '',
      tiktok: '',
      linkedin: '',
      whatsapp: '',
      googleBusiness: '',
      yelp: '',
      tripadvisor: '',
    },
    
    // Social Media Icons
    socialMediaIcons: {
      facebook: '',
      instagram: '',
      twitter: '',
      youtube: '',
      tiktok: '',
      linkedin: '',
      whatsapp: '',
      googleBusiness: '',
      yelp: '',
      tripadvisor: '',
    },
    
    // Delivery Partners
    deliveryPartners: {
      zomato: '',
      swiggy: '',
      uberEats: '',
      doorDash: '',
      grubHub: '',
      other: '',
    },
    
    // Delivery Partner Icons
    deliveryPartnerIcons: {
      zomato: '',
      swiggy: '',
      uberEats: '',
      doorDash: '',
      grubHub: '',
      other: '',
    },
    
    // Custom URLs for social media and external links
    customSocialUrls: [],
    
    // Custom URLs for delivery partners  
    customDeliveryUrls: [],
    
    // Operating Hours
    operatingHours: {
      monday: { isOpen: true, openTime: '09:00', closeTime: '22:00', additionalSlots: [] },
      tuesday: { isOpen: true, openTime: '09:00', closeTime: '22:00', additionalSlots: [] },
      wednesday: { isOpen: true, openTime: '09:00', closeTime: '22:00', additionalSlots: [] },
      thursday: { isOpen: true, openTime: '09:00', closeTime: '22:00', additionalSlots: [] },
      friday: { isOpen: true, openTime: '09:00', closeTime: '23:00', additionalSlots: [] },
      saturday: { isOpen: true, openTime: '09:00', closeTime: '23:00', additionalSlots: [] },
      sunday: { isOpen: true, openTime: '10:00', closeTime: '21:00', additionalSlots: [] },
    },
    
    // Features & Policies
    features: ['dine_in'],
    policies: {
      cancellation: '',
      delivery: '',
      reservation: '',
      dressCode: '',
    },

    // Kitchen Story & Media
    kitchenStory: '',
    kitchenPhotos: [],
    
    // Achievements
    achievements: [],
    achievementPhotos: [],
  });

  const totalSteps = 9;

const handleInputChange = <K extends keyof RestaurantOnboardingData>(field: K, value: RestaurantOnboardingData[K]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

const handleNestedChange = <P extends keyof RestaurantOnboardingData, K extends keyof RestaurantOnboardingData[P] & string>(parent: P, field: K, value: RestaurantOnboardingData[P][K]) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as Record<string, unknown>),
        [field]: value,
      },
    }));
  };

  const handleArrayToggle = (field: 'cuisineTypes' | 'features', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value],
    }));
  };

  const handleCategoryChange = (value: string) => {
    if (value === 'other') {
      if (otherCategorySelected) {
        // If already selected, toggle it off
        setOtherCategorySelected(false);
        setShowCustomCategory(false);
        setCustomCategory('');
      } else {
        // If not selected, turn it on
        setShowCustomCategory(true);
        setOtherCategorySelected(true);
      }
    } else {
      // Toggle category selection
      setFormData(prev => ({
        ...prev,
        categories: prev.categories.includes(value)
          ? prev.categories.filter(cat => cat !== value)
          : [...prev.categories, value]
      }));
    }
  };

  const handleCustomCategoryChange = (value: string) => {
    setCustomCategory(value);
  };

  const handleCustomCategoryAdd = () => {
    const trimmedCategory = customCategory.trim();
    
    // Check if it's already selected or empty
    if (!trimmedCategory || formData.categories.includes(trimmedCategory)) {
      setCustomCategory('');
      return;
    }
    
    // Add custom category but keep "Other" selected for adding more
    setFormData(prev => ({ 
      ...prev, 
      categories: [...prev.categories, trimmedCategory] 
    }));
    setCustomCategory('');
    // Keep showCustomCategory and otherCategorySelected true so user can add more
  };

  const handleCustomCuisineAdd = () => {
    const trimmedCuisine = customCuisine.trim();
    
    // Check if it's already selected
    if (!trimmedCuisine || formData.cuisineTypes.includes(trimmedCuisine)) {
      setCustomCuisine('');
      setShowCustomCuisine(false);
      return;
    }
    
    // Check if it exists in predefined list (case insensitive)
    const existsInPredefined = CUISINE_TYPES.some(
      cuisine => cuisine.toLowerCase() === trimmedCuisine.toLowerCase()
    );
    
    if (existsInPredefined) {
      // Find the exact match from predefined list to maintain consistent casing
      const exactMatch = CUISINE_TYPES.find(
        cuisine => cuisine.toLowerCase() === trimmedCuisine.toLowerCase()
      );
      
      setFormData(prev => ({
        ...prev,
        cuisineTypes: [...prev.cuisineTypes, exactMatch!],
      }));
    } else {
      // Add as custom cuisine with proper casing
      const properCasedCuisine = trimmedCuisine
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      setFormData(prev => ({
        ...prev,
        cuisineTypes: [...prev.cuisineTypes, properCasedCuisine],
      }));
    }
    
    setCustomCuisine('');
    setShowCustomCuisine(false);
  };

  const handleCustomFeatureAdd = () => {
    if (customFeature.trim() && !formData.features.includes(customFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, customFeature.trim()],
      }));
      setCustomFeature('');
      setShowCustomFeature(false);
    }
  };

  const handleKitchenPhotoUpload = async (files: FileList | null) => {
    if (!files || isKitchenPhotoUploading) return;
    
    setIsKitchenPhotoUploading(true);
    
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        try {
          // Create a unique filename
          const filename = `kitchen/${Date.now()}-${file.name}`;
          
          // Upload to API with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
          
          const response = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}&entityType=restaurant`, {
            method: 'POST',
            headers: {
              'Content-Type': file.type,
              'Content-Length': file.size.toString(),
            },
            body: file,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
          }

          const { url } = await response.json();
          
          // Add to previews and form data
          setKitchenPhotoPreviews(prev => [...prev, url]);
          setFormData(prev => ({
            ...prev,
            kitchenPhotos: [...prev.kitchenPhotos, url]
          }));
          
          return url;
        } catch (error) {
          console.error('Failed to upload kitchen photo:', error);
          
          // Show more specific error messages
          if (typeof error === 'object' && error !== null && 'name' in error && (error as { name?: string }).name === 'AbortError') {
            console.error('Kitchen photo upload timed out');
          }
          
          // Fallback to local preview if upload fails
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            setKitchenPhotoPreviews(prev => [...prev, result]);
            setFormData(prev => ({
              ...prev,
              kitchenPhotos: [...prev.kitchenPhotos, result]
            }));
          };
          reader.readAsDataURL(file);
        }
      });

      await Promise.all(uploadPromises);
    } finally {
      setIsKitchenPhotoUploading(false);
    }
  };

  const handleAchievementPhotoUpload = async (files: FileList | null) => {
    if (!files || isAchievementPhotoUploading) return;
    
    setIsAchievementPhotoUploading(true);
    
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        try {
          // Create a unique filename
          const filename = `achievements/${Date.now()}-${file.name}`;
          
          // Upload to API with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
          
          const response = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}&entityType=restaurant`, {
            method: 'POST',
            headers: {
              'Content-Type': file.type,
              'Content-Length': file.size.toString(),
            },
            body: file,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
          }

          const { url } = await response.json();
          
          // Add to previews and form data
          setAchievementPhotoPreviews(prev => [...prev, url]);
          setFormData(prev => ({
            ...prev,
            achievementPhotos: [...prev.achievementPhotos, url]
          }));
          
          return url;
        } catch (error) {
          console.error('Failed to upload achievement photo:', error);
          
          // Show more specific error messages
          if (typeof error === 'object' && error !== null && 'name' in error && (error as { name?: string }).name === 'AbortError') {
            console.error('Achievement photo upload timed out');
          }
          
          // Fallback to local preview if upload fails
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            setAchievementPhotoPreviews(prev => [...prev, result]);
            setFormData(prev => ({
              ...prev,
              achievementPhotos: [...prev.achievementPhotos, result]
            }));
          };
          reader.readAsDataURL(file);
        }
      });

      await Promise.all(uploadPromises);
    } finally {
      setIsAchievementPhotoUploading(false);
    }
  };

  // New image upload handlers
  const handleProfileImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || isProfileImageUploading) return;

    setIsProfileImageUploading(true);
    try {
      const file = files[0];
      
      // Create a unique filename
      const filename = `restaurant/profile/${Date.now()}-${file.name}`;
      
      // Upload to API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}&entityType=restaurant`, {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
          'Content-Length': file.size.toString(),
        },
        body: file,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const { url } = await response.json();
      
      // Set preview and form data
      setProfileImagePreview(url);
      setFormData(prev => ({
        ...prev,
        profileImage: url,
      }));
    } catch (error) {
      console.error('Failed to upload profile image:', error);
      
      // Fallback to local preview if upload fails
      const reader = new FileReader();
      reader.onload = () => {
        setProfileImagePreview(reader.result as string);
        setFormData(prev => ({
          ...prev,
          profileImage: reader.result as string,
        }));
      };
      reader.readAsDataURL(files[0]);
    } finally {
      setIsProfileImageUploading(false);
    }
  };

  const handleLogoImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || isLogoImageUploading) return;

    setIsLogoImageUploading(true);
    try {
      const file = files[0];
      
      // Create a unique filename
      const filename = `restaurant/logo/${Date.now()}-${file.name}`;
      
      // Upload to API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}&entityType=restaurant`, {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
          'Content-Length': file.size.toString(),
        },
        body: file,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const { url } = await response.json();
      
      // Set preview and form data
      setLogoImagePreview(url);
      setFormData(prev => ({
        ...prev,
        logoImage: url,
      }));
    } catch (error) {
      console.error('Failed to upload logo image:', error);
      
      // Fallback to local preview if upload fails
      const reader = new FileReader();
      reader.onload = () => {
        setLogoImagePreview(reader.result as string);
        setFormData(prev => ({
          ...prev,
          logoImage: reader.result as string,
        }));
      };
      reader.readAsDataURL(files[0]);
    } finally {
      setIsLogoImageUploading(false);
    }
  };

  const handleCoverImagesUpload = async (files: FileList | null) => {
    if (!files || isCoverImagesUploading) return;

    setIsCoverImagesUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        try {
          // Create a unique filename
          const filename = `restaurant/cover/${Date.now()}-${file.name}`;
          
          // Upload to API with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
          
          const response = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}&entityType=restaurant`, {
            method: 'POST',
            headers: {
              'Content-Type': file.type,
              'Content-Length': file.size.toString(),
            },
            body: file,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
          }

          const { url } = await response.json();
          
          // Add to previews and form data
          setCoverImagePreviews(prev => [...prev, url]);
          setFormData(prev => ({
            ...prev,
            coverImages: [...prev.coverImages, url]
          }));
          
          return url;
        } catch (error) {
          console.error('Failed to upload cover image:', error);
          
          // Fallback to local preview if upload fails
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            setCoverImagePreviews(prev => [...prev, result]);
            setFormData(prev => ({
              ...prev,
              coverImages: [...prev.coverImages, result]
            }));
          };
          reader.readAsDataURL(file);
        }
      });

      await Promise.all(uploadPromises);
    } finally {
      setIsCoverImagesUploading(false);
    }
  };

  const handleGalleryImagesUpload = async (files: FileList | null) => {
    if (!files || isGalleryImagesUploading) return;

    setIsGalleryImagesUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        try {
          // Create a unique filename
          const filename = `restaurant/gallery/${Date.now()}-${file.name}`;
          
          // Upload to API with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
          
          const response = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}&entityType=restaurant`, {
            method: 'POST',
            headers: {
              'Content-Type': file.type,
              'Content-Length': file.size.toString(),
            },
            body: file,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
          }

          const { url } = await response.json();
          
          // Add to previews and form data
          setGalleryImagePreviews(prev => [...prev, url]);
          setFormData(prev => ({
            ...prev,
            galleryImages: [...prev.galleryImages, url]
          }));
          
          return url;
        } catch (error) {
          console.error('Failed to upload gallery image:', error);
          
          // Fallback to local preview if upload fails
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            setGalleryImagePreviews(prev => [...prev, result]);
            setFormData(prev => ({
              ...prev,
              galleryImages: [...prev.galleryImages, result]
            }));
          };
          reader.readAsDataURL(file);
        }
      });

      await Promise.all(uploadPromises);
    } finally {
      setIsGalleryImagesUploading(false);
    }
  };

  const handleBannerImagesUpload = async (files: FileList | null) => {
    if (!files || isBannerImagesUploading) return;

    setIsBannerImagesUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        try {
          // Create a unique filename
          const filename = `restaurant/banner/${Date.now()}-${file.name}`;
          
          // Upload to API with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
          
          const response = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}&entityType=restaurant`, {
            method: 'POST',
            headers: {
              'Content-Type': file.type,
              'Content-Length': file.size.toString(),
            },
            body: file,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
          }

          const { url } = await response.json();
          
          // Add to previews and form data
          setBannerImagePreviews(prev => [...prev, url]);
          setFormData(prev => ({
            ...prev,
            bannerImages: [...prev.bannerImages, url]
          }));
          
          return url;
        } catch (error) {
          console.error('Failed to upload banner image:', error);
          
          // Fallback to local preview if upload fails
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            setBannerImagePreviews(prev => [...prev, result]);
            setFormData(prev => ({
              ...prev,
              bannerImages: [...prev.bannerImages, result]
            }));
          };
          reader.readAsDataURL(file);
        }
      });

      await Promise.all(uploadPromises);
    } finally {
      setIsBannerImagesUploading(false);
    }
  };

  // Remove image handlers
  const removeProfileImage = async () => {
    const imageUrl = formData.profileImage;
    
    // If it's a real URL (not a data URL), delete from server
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
      try {
        await fetch(`/api/upload?url=${encodeURIComponent(imageUrl)}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Failed to delete profile image:', error);
      }
    }
    
    setFormData(prev => ({ ...prev, profileImage: null }));
    setProfileImagePreview(null);
  };

  const removeLogoImage = async () => {
    const imageUrl = formData.logoImage;
    
    // If it's a real URL (not a data URL), delete from server
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
      try {
        await fetch(`/api/upload?url=${encodeURIComponent(imageUrl)}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Failed to delete logo image:', error);
      }
    }
    
    setFormData(prev => ({ ...prev, logoImage: null }));
    setLogoImagePreview(null);
  };

  const removeCoverImage = async (index: number) => {
    const imageUrl = formData.coverImages[index];
    
    // If it's a real URL (not a data URL), delete from server
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
      try {
        await fetch(`/api/upload?url=${encodeURIComponent(imageUrl)}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Failed to delete cover image:', error);
      }
    }
    
    setFormData(prev => ({
      ...prev,
      coverImages: prev.coverImages.filter((_, i) => i !== index),
    }));
    setCoverImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeGalleryImage = async (index: number) => {
    const imageUrl = formData.galleryImages[index];
    
    // If it's a real URL (not a data URL), delete from server
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
      try {
        await fetch(`/api/upload?url=${encodeURIComponent(imageUrl)}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Failed to delete gallery image:', error);
      }
    }
    
    setFormData(prev => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index),
    }));
    setGalleryImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeBannerImage = async (index: number) => {
    const imageUrl = formData.bannerImages[index];
    
    // If it's a real URL (not a data URL), delete from server
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
      try {
        await fetch(`/api/upload?url=${encodeURIComponent(imageUrl)}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Failed to delete banner image:', error);
      }
    }
    
    setFormData(prev => ({
      ...prev,
      bannerImages: prev.bannerImages.filter((_, i) => i !== index),
    }));
    setBannerImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeKitchenPhoto = async (index: number) => {
    const photoUrl = kitchenPhotoPreviews[index];
    
    // If it's a real URL (not a data URL), delete from server
    if (photoUrl && photoUrl.startsWith('http')) {
      try {
        await fetch(`/api/upload?url=${encodeURIComponent(photoUrl)}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Failed to delete kitchen photo:', error);
      }
    }
    
    setFormData(prev => ({
      ...prev,
      kitchenPhotos: prev.kitchenPhotos.filter((_, i) => i !== index),
    }));
    setKitchenPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeAchievementPhoto = async (index: number) => {
    const photoUrl = achievementPhotoPreviews[index];
    
    // If it's a real URL (not a data URL), delete from server
    if (photoUrl && photoUrl.startsWith('http')) {
      try {
        await fetch(`/api/upload?url=${encodeURIComponent(photoUrl)}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Failed to delete achievement photo:', error);
      }
    }
    
    setFormData(prev => ({
      ...prev,
      achievementPhotos: prev.achievementPhotos.filter((_, i) => i !== index),
    }));
    setAchievementPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const addAchievement = () => {
    setFormData(prev => ({
      ...prev,
      achievements: [...prev.achievements, { title: '', description: '' }],
    }));
  };

  const updateAchievement = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      achievements: prev.achievements.map((achievement, i) => 
        i === index ? { ...achievement, [field]: value } : achievement
      ),
    }));
  };

  const removeAchievement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index),
    }));
  };

  const handleAutoFetchCoordinates = async () => {
    if (!formData.address || !formData.city || !formData.state) {
      alert('Please fill in the address, city, and state fields first');
      return;
    }

    setIsLoadingCoordinates(true);
    try {
      const fullAddress = `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode} ${formData.country}`.trim();
      
      const response = await fetch('/api/geocoding/reverse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: fullAddress }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.coordinates) {
          // Update coordinates
          setFormData(prev => ({
            ...prev,
            latitude: result.coordinates.latitude.toString(),
            longitude: result.coordinates.longitude.toString(),
          }));

          // Auto-fill address details if returned from API
          if (result.address) {
            setFormData(prev => ({
              ...prev,
              latitude: result.coordinates.latitude.toString(),
              longitude: result.coordinates.longitude.toString(),
              // Only update fields that are empty or if user wants to override
              address: result.address.street || prev.address,
              city: result.address.city || prev.city,
              state: result.address.state || prev.state,
              zipCode: result.address.zipCode || prev.zipCode,
              country: result.address.country || prev.country,
            }));
            alert('✅ Coordinates and address details updated successfully!');
          } else {
            alert('✅ Coordinates fetched successfully!');
          }
        } else {
          throw new Error('No coordinates found for this address');
        }
      } else {
        throw new Error('Failed to fetch coordinates');
      }
    } catch (error) {
      console.error('Error fetching coordinates:', error);
      alert('Failed to fetch coordinates automatically. Please enter them manually.');
    } finally {
      setIsLoadingCoordinates(false);
    }
  };

  // Function to auto-fill address from coordinates (reverse geocoding)
  const handleAutoFillFromCoordinates = async () => {
    if (!formData.latitude || !formData.longitude) {
      alert('Please enter latitude and longitude first');
      return;
    }

    setIsLoadingCoordinates(true);
    try {
      const response = await fetch(`/api/geocoding/reverse?lat=${formData.latitude}&lng=${formData.longitude}`);

      if (response.ok) {
        const result = await response.json();
        
        // Auto-fill address fields from reverse geocoding
        setFormData(prev => ({
          ...prev,
          city: result.city || prev.city,
          state: result.state || prev.state,
          country: result.country === 'United States' ? 'US' : (result.country === 'Canada' ? 'CA' : prev.country),
        }));
        
        alert('✅ Address details auto-filled from coordinates!');
      } else {
        throw new Error('Failed to get address from coordinates');
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      alert('Failed to auto-fill address from coordinates.');
    } finally {
      setIsLoadingCoordinates(false);
    }
  };

  // Function to fetch favicon/icon for delivery partner URLs
  const fetchDeliveryPartnerIcon = async (platform: keyof typeof formData.deliveryPartners, url: string) => {
    if (!url || !url.startsWith('http')) return;
    
    setLoadingIcons(prev => ({ ...prev, [platform]: true }));
    
    try {
      // Extract domain from URL
      const domain = new URL(url).hostname;
      
      // Try multiple favicon sources
      const faviconSources = [
        `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
        `https://${domain}/favicon.ico`,
        `https://favicons.githubusercontent.com/${domain}`,
      ];
      
      // Test the first source (Google favicons - most reliable)
      const response = await fetch(faviconSources[0]);
      if (response.ok) {
        setFormData(prev => ({
          ...prev,
          deliveryPartnerIcons: {
            ...prev.deliveryPartnerIcons,
            [platform]: faviconSources[0],
          },
        }));
      }
    } catch (error) {
      console.error(`Failed to fetch icon for ${platform}:`, error);
    } finally {
      setLoadingIcons(prev => ({ ...prev, [platform]: false }));
    }
  };

  // Handle delivery partner URL change with icon fetching
  const handleDeliveryPartnerChange = (platform: keyof typeof formData.deliveryPartners, value: string) => {
    handleNestedChange('deliveryPartners', platform, value);
    
    // Debounce icon fetching
    if (value && value.startsWith('http')) {
      setTimeout(() => {
        fetchDeliveryPartnerIcon(platform, value);
      }, 1000);
    } else {
      // Clear icon if URL is removed
      setFormData(prev => ({
        ...prev,
        deliveryPartnerIcons: {
          ...prev.deliveryPartnerIcons,
          [platform]: '',
        },
      }));
    }
  };

  // Handle social media URL change with icon fetching
  const handleSocialMediaChange = (platform: keyof typeof formData.socialMedia, value: string) => {
    handleNestedChange('socialMedia', platform, value);
    
    // Debounce icon fetching
    if (value && value.startsWith('http')) {
      setTimeout(() => {
        fetchSocialMediaIcon(platform, value);
      }, 1000);
    } else {
      // Clear icon if URL is removed
      setFormData(prev => ({
        ...prev,
        socialMediaIcons: {
          ...prev.socialMediaIcons,
          [platform]: '',
        },
      }));
    }
  };

  // Handle custom social media URL addition
  const addCustomSocialUrl = () => {
    setFormData(prev => ({
      ...prev,
      customSocialUrls: [...prev.customSocialUrls, { label: '', url: '', icon: '' }]
    }));
  };

  // Handle custom social media URL removal
  const removeCustomSocialUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customSocialUrls: prev.customSocialUrls.filter((_, i) => i !== index)
    }));
  };

  // Handle custom social media URL change
  const updateCustomSocialUrl = (index: number, field: 'label' | 'url', value: string) => {
    setFormData(prev => ({
      ...prev,
      customSocialUrls: prev.customSocialUrls.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));

    // Fetch icon if URL is being updated
    if (field === 'url' && value && value.startsWith('http')) {
      setTimeout(() => {
        fetchCustomUrlIcon(index, value, 'social');
      }, 1000);
    }
  };

  // Handle custom delivery URL addition
  const addCustomDeliveryUrl = () => {
    setFormData(prev => ({
      ...prev,
      customDeliveryUrls: [...prev.customDeliveryUrls, { label: '', url: '', icon: '' }]
    }));
  };

  // Handle custom delivery URL removal
  const removeCustomDeliveryUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customDeliveryUrls: prev.customDeliveryUrls.filter((_, i) => i !== index)
    }));
  };

  // Handle custom delivery URL change
  const updateCustomDeliveryUrl = (index: number, field: 'label' | 'url', value: string) => {
    setFormData(prev => ({
      ...prev,
      customDeliveryUrls: prev.customDeliveryUrls.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));

    // Fetch icon if URL is being updated
    if (field === 'url' && value && value.startsWith('http')) {
      setTimeout(() => {
        fetchCustomUrlIcon(index, value, 'delivery');
      }, 1000);
    }
  };

  // Fetch custom URL icon (favicon)
  const fetchCustomUrlIcon = async (index: number, url: string, type: 'social' | 'delivery') => {
    try {
      const domain = new URL(url).hostname;
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
      
      // Update the icon for the specific custom URL
      setFormData(prev => ({
        ...prev,
        [type === 'social' ? 'customSocialUrls' : 'customDeliveryUrls']: prev[type === 'social' ? 'customSocialUrls' : 'customDeliveryUrls'].map((item, i) => 
          i === index ? { ...item, icon: faviconUrl } : item
        )
      }));
    } catch (error) {
      console.error(`Failed to fetch custom URL icon:`, error);
    }
  };

  // Fetch social media platform icon (favicon)
  const fetchSocialMediaIcon = async (platform: string, url: string) => {
    if (!url.startsWith('http')) return;
    
    setLoadingIcons(prev => ({ ...prev, [platform]: true }));
    
    try {
      const domain = new URL(url).hostname;
      const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
      
      // Test if favicon loads using HTMLImageElement
      const img = document.createElement('img');
      img.onload = () => {
        setFormData(prev => ({
          ...prev,
          socialMediaIcons: {
            ...prev.socialMediaIcons,
            [platform]: faviconUrl,
          },
        }));
        setLoadingIcons(prev => ({ ...prev, [platform]: false }));
      };
      img.onerror = () => {
        setLoadingIcons(prev => ({ ...prev, [platform]: false }));
      };
      img.src = faviconUrl;
    } catch (error) {
      console.error(`Error fetching social media icon for ${platform}:`, error);
      setLoadingIcons(prev => ({ ...prev, [platform]: false }));
    }
  };

  // Smart auto-complete function that works both ways
  const handleSmartAutoComplete = async () => {
    // Check what data we have and decide which direction to go
    const hasAddress = formData.address && formData.city && formData.state;
    const hasCoordinates = formData.latitude && formData.longitude;
    
    if (hasAddress && !hasCoordinates) {
      // We have address but no coordinates - fetch coordinates
      await handleAutoFetchCoordinates();
    } else if (hasCoordinates && !hasAddress) {
      // We have coordinates but no address - fetch address
      await handleAutoFillFromCoordinates();
    } else if (hasAddress && hasCoordinates) {
      // We have both - let user know
      alert('Both address and coordinates are already filled. Clear one to auto-fill from the other.');
    } else {
      // We have neither - show instruction
      alert('Please enter either an address (street, city, state) OR coordinates (latitude, longitude) first.');
    }
  };

const handleHoursChange = (day: keyof typeof DEFAULT_HOURS, field: 'isOpen' | 'openTime' | 'closeTime', value: boolean | string) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [field]: value,
        },
      },
    }));
  };

  // Helper function to convert 24-hour time to 12-hour format for display
  const formatTimeDisplay = (time24: string) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const hour12 = hour % 12 || 12;
    return `${hour12.toString().padStart(2, '0')}:${minutes}${ampm}`;
  };

  // Function to add time slot for a day
  const addTimeSlot = (day: keyof typeof DEFAULT_HOURS) => {
    setFormData(prev => {
      const currentHours = prev.operatingHours[day];
      return {
        ...prev,
        operatingHours: {
          ...prev.operatingHours,
          [day]: {
            ...currentHours,
            additionalSlots: [
              ...(currentHours.additionalSlots || []),
              { openTime: '09:00', closeTime: '17:00' }
            ]
          },
        },
      };
    });
  };

  // Function to remove time slot for a day
  const removeTimeSlot = (day: keyof typeof DEFAULT_HOURS, slotIndex: number) => {
    setFormData(prev => {
      const currentHours = prev.operatingHours[day];
      return {
        ...prev,
        operatingHours: {
          ...prev.operatingHours,
          [day]: {
            ...currentHours,
            additionalSlots: (currentHours.additionalSlots?.filter((_, index) => index !== slotIndex) || [])
          },
        },
      };
    });
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
      // Prepare social media data combining predefined and custom URLs
      // Always return an object, even if empty
      const socialMediaEntries = Object.entries(formData.socialMedia).filter(([, value]) => value && value.trim() !== '');
      const customSocialEntries = formData.customSocialUrls.filter(custom => custom.label && custom.url);
      
      const socialMediaData = {
        ...Object.fromEntries(socialMediaEntries),
        // Add custom social URLs as additional properties
        ...customSocialEntries.reduce((acc, custom, index) => {
          acc[`custom_${index}`] = custom.url;
          acc[`custom_${index}_label`] = custom.label;
          acc[`custom_${index}_icon`] = custom.icon || '';
          return acc;
        }, {} as Record<string, string>)
      };

      // Prepare delivery partners data combining predefined and custom URLs
      // Always return an object, even if empty
      const deliveryPartnerEntries = Object.entries(formData.deliveryPartners).filter(([, value]) => value && value.trim() !== '');
      const customDeliveryEntries = formData.customDeliveryUrls.filter(custom => custom.label && custom.url);
      
      const deliveryPartnersData = {
        ...Object.fromEntries(deliveryPartnerEntries),
        // Add custom delivery URLs as additional properties
        ...customDeliveryEntries.reduce((acc, custom, index) => {
          acc[`custom_${index}`] = custom.url;
          acc[`custom_${index}_label`] = custom.label;
          acc[`custom_${index}_icon`] = custom.icon || '';
          return acc;
        }, {} as Record<string, string>)
      };

      // Prepare external_links data for database (following the schema)
      // Always include other array, even if empty
      const externalLinksData = {
        other: customDeliveryEntries.map(url => ({
          label: url.label,
          url: url.url,
          icon: url.icon || ''
        }))
      };

      // First, create the restaurant with basic data
      const basicData = {
        ...formData,
        categories: formData.categories, // Use categories as they are since we don't use "Other" anymore
        businessLicense: null, // Set to null as it's not collected
        kitchenPhotos: [], // Will be filled after upload
        achievementPhotos: [], // Will be filled after upload
        website: formData.website && formData.website.trim() !== '' ? formData.website : null, // Set to null if empty
        socialMedia: socialMediaData, // Enhanced social media data
        deliveryPartners: deliveryPartnersData, // Enhanced delivery partners data
        externalLinks: externalLinksData, // Custom links in database format
        // Include new image fields (they're already uploaded as URLs)
        profileImage: formData.profileImage,
        logoImage: formData.logoImage,
        coverImages: formData.coverImages,
        galleryImages: formData.galleryImages,
        bannerImages: formData.bannerImages,
      };

      // Debug: Log the data being sent to the API
      console.log('🚀 Sending to API:');
      console.log('Social Media:', JSON.stringify(socialMediaData, null, 2));
      console.log('Delivery Partners:', JSON.stringify(deliveryPartnersData, null, 2));
      console.log('External Links:', JSON.stringify(externalLinksData, null, 2));

      const response = await fetch('/api/onboarding/restaurant-owner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(basicData),
      });

      if (response.ok) {
        const result = await response.json();
        const restaurantId = result.restaurantId;

        // Upload kitchen photos
        const kitchenPhotoUrls: string[] = [];
        for (const file of formData.kitchenPhotos) {
          if (typeof file === 'string') {
            // Already uploaded, use the URL directly
            kitchenPhotoUrls.push(file);
          } else {
            // File object, needs to be uploaded
            try {
              const uploadResponse = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}&entityType=restaurant&entityId=${restaurantId}`, {
                method: 'POST',
                headers: { 'Content-Type': file.type },
                body: file,
              });
              
              if (uploadResponse.ok) {
                const uploadResult = await uploadResponse.json();
                kitchenPhotoUrls.push(uploadResult.url);
              }
            } catch (error) {
              console.error('Error uploading kitchen photo:', error);
            }
          }
        }

        // Upload achievement photos
        const achievementPhotoUrls: string[] = [];
        for (const file of formData.achievementPhotos) {
          if (typeof file === 'string') {
            // Already uploaded, use the URL directly
            achievementPhotoUrls.push(file);
          } else {
            // File object, needs to be uploaded
            try {
              const uploadResponse = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}&entityType=restaurant&entityId=${restaurantId}`, {
                method: 'POST',
                headers: { 'Content-Type': file.type },
                body: file,
              });
              
              if (uploadResponse.ok) {
                const uploadResult = await uploadResponse.json();
                achievementPhotoUrls.push(uploadResult.url);
              }
            } catch (error) {
              console.error('Error uploading achievement photo:', error);
            }
          }
        }

        // Update restaurant with photo URLs if any were uploaded
        if (kitchenPhotoUrls.length > 0 || achievementPhotoUrls.length > 0) {
          await fetch(`/api/restaurant/${restaurantId}/media`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              kitchenPhotos: kitchenPhotoUrls,
              achievementPhotos: achievementPhotoUrls,
            }),
          });
        }
        
        // Update Clerk user metadata
        await user?.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            userType: 'restaurant_owner',
            isOnboardingCompleted: true,
            restaurantId: restaurantId,
          },
        });
        
        // User data sync is handled by Clerk automatically
        console.log('Restaurant onboarding completed successfully');
        
        // Redirect to dashboard with welcome message
        router.push('/restaurant-dashboard?welcome=true');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save restaurant data');
      }
    } catch (error) {
      console.error('Restaurant onboarding error:', error);
      alert('Failed to complete setup. Please try again.');
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="mx-auto max-w-4xl">
            <Card className="bg-gradient-to-br from-white via-orange-50/30 to-white dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 border-2 border-black/10 dark:border-white/10 shadow-lg">
              <CardHeader className="text-center space-y-3 pb-6">
                <CardTitle className="flex items-center justify-center gap-3 text-2xl font-semibold">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl">
                    <Store className="h-6 w-6" />
                  </div>
                  Restaurant Information
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-400 text-sm max-w-lg mx-auto leading-relaxed">
                  Tell us about your restaurant and what makes it special
                </p>
              </CardHeader>
              <CardContent className="space-y-8 px-6 md:px-8 pb-8">
              {/* Restaurant Name */}
              <div className="space-y-2">
                <Label htmlFor="restaurantName" className="text-base font-medium">Restaurant Name *</Label>
                <Input
                  id="restaurantName"
                  value={formData.restaurantName}
                  onChange={(e) => handleInputChange('restaurantName', e.target.value)}
                  placeholder="Your restaurant's name"
                  required
                  className="h-12 text-lg"
                />
              </div>

              {/* Restaurant Categories */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Restaurant Categories *</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Select all categories that best describe your restaurant</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {RESTAURANT_CATEGORIES.map((category) => (
                    <div
                      key={category.value}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-orange-300 ${
                        formData.categories.includes(category.value)
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => handleCategoryChange(category.value)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          formData.categories.includes(category.value)
                            ? 'border-orange-500 bg-orange-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {formData.categories.includes(category.value) && (
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{category.label}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{category.description}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Other Category Option */}
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-orange-300 ${
                      otherCategorySelected || showCustomCategory
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => handleCategoryChange('other')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        otherCategorySelected || showCustomCategory
                          ? 'border-orange-500 bg-orange-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {(otherCategorySelected || showCustomCategory) && (
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">Other</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Specify a custom category</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Custom Category Input */}
                {showCustomCategory && (
                  <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <Label htmlFor="customCategory" className="text-base font-medium">Custom Restaurant Category *</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="customCategory"
                        value={customCategory}
                        onChange={(e) => handleCustomCategoryChange(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCustomCategoryAdd();
                          }
                        }}
                        placeholder="e.g., Fusion Cuisine, Farm-to-Table, Cloud Kitchen"
                        required
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handleCustomCategoryAdd}
                        disabled={!customCategory.trim()}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        Add
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          setShowCustomCategory(false);
                          setCustomCategory('');
                          // Keep otherCategorySelected as true so it stays ticked
                        }}
                        variant="outline"
                        className="text-gray-600 border-gray-300"
                      >
                        Done
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      Please specify your restaurant&apos;s unique category
                    </p>
                  </div>
                )}
                
                {/* Selected Categories Display */}
                {formData.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.categories.map((category) => (
                      <span
                        key={category}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 rounded-full text-sm font-medium"
                      >
                        {category}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              categories: prev.categories.filter(cat => cat !== category)
                            }));
                            // If removing a custom category and there are no predefined categories selected, 
                            // don't automatically show the custom input again
                          }}
                          className="ml-1 text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-medium">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your restaurant, specialties, and what makes it unique..."
                  rows={4}
                  required
                  className="resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Help customers understand what makes your restaurant special
                </p>
              </div>

              {/* Tagline */}
              <div className="space-y-2">
                <Label htmlFor="tagline" className="text-base font-medium">Tagline (Optional)</Label>
                <Input
                  id="tagline"
                  value={formData.tagline}
                  onChange={(e) => handleInputChange('tagline', e.target.value)}
                  placeholder="A short catchy phrase about your restaurant"
                  className="h-12"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  A memorable phrase that captures your restaurant&apos;s essence
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        );

      case 2:
        return (
          <div className="mx-auto max-w-4xl">
            <Card className="bg-gradient-to-br from-white via-orange-50/30 to-white dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 border-2 border-black/10 dark:border-white/10 shadow-lg">
              <CardHeader className="text-center space-y-3 pb-6">
                <CardTitle className="flex items-center justify-center gap-3 text-2xl font-semibold">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl">
                    <Camera className="h-6 w-6" />
                  </div>
                  Restaurant Images & Branding
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-400 text-sm max-w-lg mx-auto leading-relaxed">
                  Upload your restaurant logo, cover images, and gallery photos to showcase your brand
                </p>
              </CardHeader>
              <CardContent className="space-y-8 px-6 md:px-8 pb-8">
                
                {/* Restaurant Logo */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Restaurant Logo</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Upload your restaurant logo that will appear on your profile
                  </p>
                  <div className="flex items-start space-x-4">
                    <div className={`relative w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center ${
                      isLogoImageUploading ? 'border-orange-300 bg-orange-50' : 'border-gray-300 hover:border-orange-400 transition-colors'
                    }`}>
                      {logoImagePreview ? (
                        <div className="relative w-full h-full">
                          <Image 
                            src={logoImagePreview} 
                            alt="Logo preview" 
                            fill
                            className="object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={removeLogoImage}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div className="text-center p-4">
                          <input
                            id="logo-image"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleLogoImageUpload(e.target.files)}
                            className="hidden"
                            disabled={isLogoImageUploading}
                          />
                          <label htmlFor="logo-image" className={`${isLogoImageUploading ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                            <div className="flex flex-col items-center">
                              {isLogoImageUploading ? (
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                              ) : (
                                <>
                                  <Camera className="h-8 w-8 text-gray-400 mb-2" />
                                  <span className="text-xs text-gray-500">Upload Logo</span>
                                </>
                              )}
                            </div>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Image */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Profile Image</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Main profile image for your restaurant (can be different from logo)
                  </p>
                  <div className="flex items-start space-x-4">
                    <div className={`relative w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center ${
                      isProfileImageUploading ? 'border-orange-300 bg-orange-50' : 'border-gray-300 hover:border-orange-400 transition-colors'
                    }`}>
                      {profileImagePreview ? (
                        <div className="relative w-full h-full">
                          <Image 
                            src={profileImagePreview} 
                            alt="Profile preview" 
                            fill
                            className="object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={removeProfileImage}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div className="text-center p-4">
                          <input
                            id="profile-image"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleProfileImageUpload(e.target.files)}
                            className="hidden"
                            disabled={isProfileImageUploading}
                          />
                          <label htmlFor="profile-image" className={`${isProfileImageUploading ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                            <div className="flex flex-col items-center">
                              {isProfileImageUploading ? (
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                              ) : (
                                <>
                                  <Camera className="h-8 w-8 text-gray-400 mb-2" />
                                  <span className="text-xs text-gray-500">Upload Image</span>
                                </>
                              )}
                            </div>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cover Images */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Cover/Banner Images</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Upload cover images that will be displayed prominently on your restaurant page
                  </p>
                  <div className="space-y-4">
                    <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                      isCoverImagesUploading ? 'border-orange-300 bg-orange-50' : 'border-gray-300 hover:border-orange-400 transition-colors'
                    }`}>
                      <input
                        id="cover-images"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleCoverImagesUpload(e.target.files)}
                        className="hidden"
                        disabled={isCoverImagesUploading}
                      />
                      <label htmlFor="cover-images" className={`${isCoverImagesUploading ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                        <div className="flex flex-col items-center">
                          {isCoverImagesUploading ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                          ) : (
                            <>
                              <Camera className="h-8 w-8 text-gray-400 mb-2" />
                              <span className="text-sm font-medium text-gray-700 mb-1">Upload Cover Images</span>
                              <span className="text-xs text-gray-500">Select multiple images</span>
                            </>
                          )}
                        </div>
                      </label>
                    </div>
                    
                    {coverImagePreviews.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {coverImagePreviews.map((preview, index) => (
                          <div key={index} className="relative">
                            <Image 
                              src={preview} 
                              alt={`Cover ${index + 1}`} 
                              width={200}
                              height={150}
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                            <button
                              type="button"
                              onClick={() => removeCoverImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Gallery Images */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Gallery Images</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Additional photos to showcase your restaurant&lsquo;s atmosphere, interior, and exterior
                  </p>
                  <div className="space-y-4">
                    <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                      isGalleryImagesUploading ? 'border-orange-300 bg-orange-50' : 'border-gray-300 hover:border-orange-400 transition-colors'
                    }`}>
                      <input
                        id="gallery-images"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleGalleryImagesUpload(e.target.files)}
                        className="hidden"
                        disabled={isGalleryImagesUploading}
                      />
                      <label htmlFor="gallery-images" className={`${isGalleryImagesUploading ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                        <div className="flex flex-col items-center">
                          {isGalleryImagesUploading ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                          ) : (
                            <>
                              <Camera className="h-8 w-8 text-gray-400 mb-2" />
                              <span className="text-sm font-medium text-gray-700 mb-1">Upload Gallery Images</span>
                              <span className="text-xs text-gray-500">Select multiple images</span>
                            </>
                          )}
                        </div>
                      </label>
                    </div>
                    
                    {galleryImagePreviews.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {galleryImagePreviews.map((preview, index) => (
                          <div key={index} className="relative">
                            <Image 
                              src={preview} 
                              alt={`Gallery ${index + 1}`} 
                              width={200}
                              height={150}
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                            <button
                              type="button"
                              onClick={() => removeGalleryImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Banner Images */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Banner Images</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Special banner images for promotions, events, or seasonal displays
                  </p>
                  <div className="space-y-4">
                    <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                      isBannerImagesUploading ? 'border-orange-300 bg-orange-50' : 'border-gray-300 hover:border-orange-400 transition-colors'
                    }`}>
                      <input
                        id="banner-images"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleBannerImagesUpload(e.target.files)}
                        className="hidden"
                        disabled={isBannerImagesUploading}
                      />
                      <label htmlFor="banner-images" className={`${isBannerImagesUploading ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                        <div className="flex flex-col items-center">
                          {isBannerImagesUploading ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                          ) : (
                            <>
                              <Camera className="h-8 w-8 text-gray-400 mb-2" />
                              <span className="text-sm font-medium text-gray-700 mb-1">Upload Banner Images</span>
                              <span className="text-xs text-gray-500">Select multiple images</span>
                            </>
                          )}
                        </div>
                      </label>
                    </div>
                    
                    {bannerImagePreviews.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {bannerImagePreviews.map((preview, index) => (
                          <div key={index} className="relative">
                            <Image 
                              src={preview} 
                              alt={`Banner ${index + 1}`} 
                              width={200}
                              height={150}
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                            <button
                              type="button"
                              onClick={() => removeBannerImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="mx-auto max-w-4xl">
            <Card className="bg-gradient-to-br from-white via-orange-50/30 to-white dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 border-2 border-black/10 dark:border-white/10 shadow-lg">
              <CardHeader className="text-center space-y-3 pb-6">
                <CardTitle className="flex items-center justify-center gap-3 text-2xl font-semibold">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl">
                    <Store className="h-6 w-6" />
                  </div>
                  Cuisine Types & Features
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-400 text-sm max-w-lg mx-auto leading-relaxed">
                  Select your cuisine types and restaurant features
                </p>
              </CardHeader>
              <CardContent className="space-y-6 px-6 md:px-8 pb-8">
              <div>
                <Label className="text-base font-medium">Cuisine Types *</Label>
                <p className="text-sm text-gray-500 mb-3">Select all that apply to your restaurant</p>
                <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-3 border rounded-lg bg-gray-50">
                  {CUISINE_TYPES.map((cuisine) => (
                    <Badge
                      key={cuisine}
                      variant={formData.cuisineTypes.includes(cuisine) ? 'default' : 'outline'}
                      className={`cursor-pointer px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
                        formData.cuisineTypes.includes(cuisine) 
                          ? 'aharamm-gradient text-white shadow-sm scale-105' 
                          : 'bg-white hover:bg-orange-50 hover:border-orange-300 hover:scale-105 border-gray-300'
                      }`}
                      onClick={() => handleArrayToggle('cuisineTypes', cuisine)}
                    >
                      {cuisine}
                    </Badge>
                  ))}
                  
                  {/* Show custom added cuisines that aren't in the predefined list */}
                  {formData.cuisineTypes
                    .filter(cuisine => !(CUISINE_TYPES as readonly string[]).includes(cuisine))
                    .map((customCuisine) => (
                      <Badge
                        key={customCuisine}
                        variant="default"
                        className="cursor-pointer px-3 py-1 text-xs font-medium rounded-full aharamm-gradient text-white shadow-sm scale-105 relative"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            cuisineTypes: prev.cuisineTypes.filter(c => c !== customCuisine),
                          }));
                        }}
                      >
                        {customCuisine}
                        <span className="ml-1 text-xs opacity-75">(Custom)</span>
                      </Badge>
                    ))
                  }
                  
                  {/* Add custom cuisine button */}
                  <Badge
                    variant="outline"
                    className="cursor-pointer px-3 py-1 text-xs font-medium rounded-full bg-white hover:bg-orange-50 hover:border-orange-300 border-dashed border-2 border-gray-400"
                    onClick={() => setShowCustomCuisine(true)}
                  >
                    + Add Custom
                  </Badge>
                </div>
                
                {showCustomCuisine && (
                  <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <Label htmlFor="customCuisine" className="text-sm font-medium text-orange-800">
                      Add Custom Cuisine Type
                    </Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="customCuisine"
                        placeholder="e.g., Indo-Chinese, Tex-Mex"
                        value={customCuisine}
                        onChange={(e) => setCustomCuisine(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleCustomCuisineAdd()}
                        className="flex-1"
                      />
                      <Button 
                        onClick={handleCustomCuisineAdd}
                        disabled={!customCuisine.trim()}
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        Add
                      </Button>
                      <Button 
                        onClick={() => {
                          setShowCustomCuisine(false);
                          setCustomCuisine('');
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                    <p className="text-xs text-orange-600 mt-1">
                      If your cuisine type already exists above, click on it instead of adding it here.
                    </p>
                  </div>
                )}
                
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    Selected: {formData.cuisineTypes.length} cuisine type{formData.cuisineTypes.length !== 1 ? 's' : ''}
                  </p>
                  {formData.cuisineTypes.length > 0 && (
                    <Button 
                      onClick={() => setFormData(prev => ({ ...prev, cuisineTypes: [] }))}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 text-xs"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
                
                {/* Selected cuisines preview */}
                {formData.cuisineTypes.length > 0 && (
                  <div className="mt-3 p-3 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl shadow-sm">
                    <p className="text-sm font-semibold text-orange-800 mb-3 flex items-center gap-2">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Selected Cuisine Types ({formData.cuisineTypes.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.cuisineTypes.map((cuisine) => (
                        <span 
                          key={cuisine} 
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-800 bg-white bg-opacity-70 px-3 py-1.5 rounded-full border border-orange-300 hover:bg-opacity-90 hover:shadow-sm transition-all duration-200 group"
                        >
                          {cuisine}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                cuisineTypes: prev.cuisineTypes.filter(c => c !== cuisine),
                              }));
                            }}
                            className="ml-0.5 hover:bg-red-100 rounded-full p-1 transition-all duration-200 opacity-60 group-hover:opacity-100"
                            title={`Remove ${cuisine}`}
                          >
                            <svg className="h-3 w-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-base font-medium">Restaurant Features</Label>
                <p className="text-sm text-gray-500 mb-3">What services do you offer?</p>
                <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-3 border rounded-lg bg-gray-50">
                  {RESTAURANT_FEATURES.map((feature) => (
                    <Badge
                      key={feature}
                      variant={formData.features.includes(feature) ? 'default' : 'outline'}
                      className={`cursor-pointer px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
                        formData.features.includes(feature) 
                          ? 'aharamm-gradient text-white shadow-sm scale-105' 
                          : 'bg-white hover:bg-orange-50 hover:border-orange-300 hover:scale-105 border-gray-300'
                      }`}
                      onClick={() => handleArrayToggle('features', feature)}
                    >
                      {feature.replace('_', ' ')}
                    </Badge>
                  ))}
                  
                  {/* Show custom added features that aren't in the predefined list */}
                  {formData.features
                    .filter(feature => !RESTAURANT_FEATURES.includes(feature))
                    .map((customFeature) => (
                      <Badge
                        key={customFeature}
                        variant="default"
                        className="cursor-pointer px-3 py-1 text-xs font-medium rounded-full aharamm-gradient text-white shadow-sm scale-105 relative"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            features: prev.features.filter(f => f !== customFeature),
                          }));
                        }}
                      >
                        {customFeature.replace('_', ' ')}
                        <span className="ml-1 text-xs opacity-75">(Custom)</span>
                      </Badge>
                    ))
                  }
                  
                  {/* Add custom feature button */}
                  <Badge
                    variant="outline"
                    className="cursor-pointer px-3 py-1 text-xs font-medium rounded-full bg-white hover:bg-orange-50 hover:border-orange-300 border-dashed border-2 border-gray-400"
                    onClick={() => setShowCustomFeature(true)}
                  >
                    + Add Custom
                  </Badge>
                </div>
                
                {showCustomFeature && (
                  <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <Label htmlFor="customFeature" className="text-sm font-medium text-orange-800">
                      Add Custom Restaurant Feature
                    </Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="customFeature"
                        placeholder="e.g., Live Kitchen, Buffet Service"
                        value={customFeature}
                        onChange={(e) => setCustomFeature(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleCustomFeatureAdd()}
                        className="flex-1"
                      />
                      <Button 
                        onClick={handleCustomFeatureAdd}
                        disabled={!customFeature.trim()}
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        Add
                      </Button>
                      <Button 
                        onClick={() => {
                          setShowCustomFeature(false);
                          setCustomFeature('');
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                    <p className="text-xs text-orange-600 mt-1">
                      If your feature type already exists above, click on it instead of adding it here.
                    </p>
                  </div>
                )}
                
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    Selected: {formData.features.length} feature{formData.features.length !== 1 ? 's' : ''}
                  </p>
                  {formData.features.length > 0 && (
                    <Button 
                      onClick={() => setFormData(prev => ({ ...prev, features: [] }))}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 text-xs"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
                
                {/* Selected features preview */}
                {formData.features.length > 0 && (
                  <div className="mt-3 p-3 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl shadow-sm">
                    <p className="text-sm font-semibold text-orange-800 mb-3 flex items-center gap-2">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Selected Restaurant Features ({formData.features.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.features.map((feature) => (
                        <span 
                          key={feature} 
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-800 bg-white bg-opacity-70 px-3 py-1.5 rounded-full border border-orange-300 hover:bg-opacity-90 hover:shadow-sm transition-all duration-200 group"
                        >
                          {feature.replace('_', ' ')}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                features: prev.features.filter(f => f !== feature),
                              }));
                            }}
                            className="ml-0.5 hover:bg-red-100 rounded-full p-1 transition-all duration-200 opacity-60 group-hover:opacity-100"
                            title={`Remove ${feature.replace('_', ' ')}`}
                          >
                            <svg className="h-3 w-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        );

      case 4:
        return (
          <div className="mx-auto max-w-4xl">
            <Card className="bg-gradient-to-br from-white via-orange-50/30 to-white dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 border-2 border-black/10 dark:border-white/10 shadow-lg">
              <CardHeader className="text-center space-y-3 pb-6">
                <CardTitle className="flex items-center justify-center gap-3 text-2xl font-semibold">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl">
                    <MapPin className="h-6 w-6" />
                  </div>
                  Location Details
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-400 text-sm max-w-lg mx-auto leading-relaxed">
                  Help customers find your restaurant with accurate location information
                </p>
              </CardHeader>
              
              <CardContent className="space-y-6 px-6 md:px-8 pb-8">
                {/* Basic Address Information */}
                <div className="bg-white/80 dark:bg-gray-900/80 rounded-2xl p-6 border border-black/5 dark:border-white/5 shadow-sm">
                  <div className="mb-5">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      Basic Address
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Enter your restaurant&apos;s street address</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="address" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Street Address *
                      </Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="e.g., 123 Main Street"
                        required
                        className="h-12 border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                          City *
                        </Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          placeholder="e.g., New York"
                          required
                          className="h-12 border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                          State/Province *
                        </Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          placeholder="e.g., NY"
                          required
                          className="h-12 border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Postal & Country Information */}
                <div className="bg-white/80 dark:bg-gray-900/80 rounded-2xl p-6 border border-black/5 dark:border-white/5 shadow-sm">
                  <div className="mb-5">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      Postal & Country Details
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Complete your address with postal code and country</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="postalCode" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Postal/ZIP Code *
                      </Label>
                      <Input
                        id="postalCode"
                        value={formData.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                        placeholder="e.g., 10001"
                        required
                        className="h-12 border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label htmlFor="country" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Country *
                      </Label>
                      <Select 
                        value={formData.country || 'US'} 
                        onValueChange={(value) => handleInputChange('country', value)}
                      >
                        <SelectTrigger className="h-12 border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent className="border-gray-200 dark:border-gray-700 rounded-xl">
                          <SelectItem value="US">🇺🇸 United States</SelectItem>
                          <SelectItem value="CA">🇨🇦 Canada</SelectItem>
                          <SelectItem value="GB">🇬🇧 United Kingdom</SelectItem>
                          <SelectItem value="AU">🇦🇺 Australia</SelectItem>
                          <SelectItem value="DE">🇩🇪 Germany</SelectItem>
                          <SelectItem value="FR">🇫🇷 France</SelectItem>
                          <SelectItem value="IT">🇮🇹 Italy</SelectItem>
                          <SelectItem value="ES">🇪🇸 Spain</SelectItem>
                          <SelectItem value="JP">🇯🇵 Japan</SelectItem>
                          <SelectItem value="IN">🇮🇳 India</SelectItem>
                          <SelectItem value="MX">🇲🇽 Mexico</SelectItem>
                          <SelectItem value="BR">🇧🇷 Brazil</SelectItem>
                          <SelectItem value="OTHER">🌍 Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-orange-50/50 dark:bg-orange-900/20 rounded-xl border border-orange-200/50 dark:border-orange-800/50">
                    <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                      This helps customers find your restaurant and ensures accurate delivery zones
                    </p>
                  </div>
                </div>

                {/* Location Coordinates */}
                <div className="bg-white/80 dark:bg-gray-900/80 rounded-2xl p-6 border border-black/5 dark:border-white/5 shadow-sm">
                  <div className="mb-5">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      Precise Location
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Get your restaurant&apos;s exact coordinates for accurate mapping</p>
                  </div>

                  {/* Smart Auto-Complete */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-orange-50/80 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl border border-orange-200/50 dark:border-orange-800/30">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Smart Auto-Complete</p>
                      <Button
                        type="button"
                        onClick={handleSmartAutoComplete}
                        disabled={isLoadingCoordinates}
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white disabled:from-gray-400 disabled:to-gray-500 h-11 px-6 rounded-xl shadow-sm border-0"
                      >
                        {isLoadingCoordinates ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          '🔄 Auto-fill Address ↔ Coordinates'
                        )}
                      </Button>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 max-w-xs mx-auto">
                        Automatically fills missing information based on what you&apos;ve entered
                      </p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-200 dark:border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white dark:bg-gray-900 px-3 text-gray-500 dark:text-gray-400 font-medium">OR enter manually</span>
                    </div>
                  </div>

                  {/* Manual Coordinates Instructions */}
                  <div className="mb-6 p-4 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      How to get coordinates from Google Maps
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-5 h-5 bg-orange-500 text-white text-xs rounded-full font-semibold mt-0.5 flex-shrink-0">1</div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Search:</span> Open Google Maps and search for your restaurant&apos;s address
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-5 h-5 bg-orange-500 text-white text-xs rounded-full font-semibold mt-0.5 flex-shrink-0">2</div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Click:</span> Right-click on the pin/marker at your location
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-5 h-5 bg-orange-500 text-white text-xs rounded-full font-semibold mt-0.5 flex-shrink-0">3</div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Copy:</span> Click on the coordinates (e.g., 26.46419, 80.35636) and copy both numbers
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Coordinate Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="latitude" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Latitude * <span className="text-xs text-gray-500">(first number)</span>
                      </Label>
                      <Input
                        id="latitude"
                        value={formData.latitude}
                        onChange={(e) => handleInputChange('latitude', e.target.value)}
                        placeholder="e.g., 26.46419"
                        type="number"
                        step="any"
                        required
                        className="h-12 border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label htmlFor="longitude" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Longitude * <span className="text-xs text-gray-500">(second number)</span>
                      </Label>
                      <Input
                        id="longitude"
                        value={formData.longitude}
                        onChange={(e) => handleInputChange('longitude', e.target.value)}
                        placeholder="e.g., 80.35636"
                        type="number"
                        step="any"
                        required
                        className="h-12 border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
                    <p className="text-xs text-gray-600 dark:text-gray-400 text-center flex items-center justify-center gap-2">
                      <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                      Accurate coordinates ensure customers can find your exact location
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="mx-auto max-w-4xl">
            <Card className="bg-gradient-to-br from-white via-orange-50/30 to-white dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 border-2 border-black/10 dark:border-white/10 shadow-lg">
              <CardHeader className="text-center space-y-3 pb-6">
                <CardTitle className="flex items-center justify-center gap-3 text-2xl font-semibold">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl">
                    <Phone className="h-6 w-6" />
                  </div>
                  Contact Information
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-400 text-sm max-w-lg mx-auto leading-relaxed">
                  Help customers reach your restaurant easily
                </p>
              </CardHeader>
              <CardContent className="space-y-4 px-6 md:px-8 pb-8">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Restaurant Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Restaurant Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="info@restaurant.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="website">Website (Optional)</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://yourrestaurant.com"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium text-black dark:text-white">Social Media & Online Presence (Optional)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      {loadingIcons.facebook ? (
                        <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : formData.socialMediaIcons.facebook ? (
                        <Image src={formData.socialMediaIcons.facebook} alt="Facebook" width={16} height={16} className="w-4 h-4" />
                      ) : (
                        <span className="text-orange-600">📘</span>
                      )} Facebook
                    </Label>
                    <Input
                      placeholder="https://facebook.com/your-restaurant"
                      value={formData.socialMedia.facebook}
                      onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      {loadingIcons.instagram ? (
                        <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : formData.socialMediaIcons.instagram ? (
                        <Image src={formData.socialMediaIcons.instagram} alt="Instagram" width={16} height={16} className="w-4 h-4" />
                      ) : (
                        <span className="text-pink-600">📷</span>
                      )} Instagram
                    </Label>
                    <Input
                      placeholder="https://instagram.com/your-restaurant"
                      value={formData.socialMedia.instagram}
                      onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      {loadingIcons.twitter ? (
                        <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : formData.socialMediaIcons.twitter ? (
                        <Image src={formData.socialMediaIcons.twitter} alt="Twitter/X" width={16} height={16} className="w-4 h-4" />
                      ) : (
                        <span className="text-orange-400">🐦</span>
                      )} Twitter/X
                    </Label>
                    <Input
                      placeholder="https://twitter.com/your-restaurant"
                      value={formData.socialMedia.twitter}
                      onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      {loadingIcons.youtube ? (
                        <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : formData.socialMediaIcons.youtube ? (
                        <Image src={formData.socialMediaIcons.youtube} alt="YouTube" width={16} height={16} className="w-4 h-4" />
                      ) : (
                        <span className="text-red-600">📺</span>
                      )} YouTube
                    </Label>
                    <Input
                      placeholder="https://youtube.com/@your-restaurant"
                      value={formData.socialMedia.youtube || ''}
                      onChange={(e) => handleSocialMediaChange('youtube', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      {loadingIcons.tiktok ? (
                        <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : formData.socialMediaIcons.tiktok ? (
                        <Image src={formData.socialMediaIcons.tiktok} alt="TikTok" width={16} height={16} className="w-4 h-4" />
                      ) : (
                        <span className="text-black">🎵</span>
                      )} TikTok
                    </Label>
                    <Input
                      placeholder="https://tiktok.com/@your-restaurant"
                      value={formData.socialMedia.tiktok || ''}
                      onChange={(e) => handleSocialMediaChange('tiktok', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      {loadingIcons.linkedin ? (
                        <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : formData.socialMediaIcons.linkedin ? (
                        <Image src={formData.socialMediaIcons.linkedin} alt="LinkedIn" width={16} height={16} className="w-4 h-4" />
                      ) : (
                        <span className="text-orange-700">💼</span>
                      )} LinkedIn
                    </Label>
                    <Input
                      placeholder="https://linkedin.com/company/your-restaurant"
                      value={formData.socialMedia.linkedin || ''}
                      onChange={(e) => handleSocialMediaChange('linkedin', e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Additional Contact Options */}
                <div className="mt-6 space-y-3">
                  <Label className="text-base font-medium text-black dark:text-white">Additional Contact Options (Optional)</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        {loadingIcons.whatsapp ? (
                          <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : formData.socialMediaIcons.whatsapp ? (
                          <Image src={formData.socialMediaIcons.whatsapp} alt="WhatsApp Business" width={16} height={16} className="w-4 h-4" />
                        ) : (
                          <span className="text-green-600">💬</span>
                        )} WhatsApp Business
                      </Label>
                      <Input
                        placeholder="https://wa.me/1234567890"
                        value={formData.socialMedia.whatsapp || ''}
                        onChange={(e) => handleSocialMediaChange('whatsapp', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        {loadingIcons.googleBusiness ? (
                          <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : formData.socialMediaIcons.googleBusiness ? (
                          <Image src={formData.socialMediaIcons.googleBusiness} alt="Google My Business" width={16} height={16} className="w-4 h-4" />
                        ) : (
                          <span className="text-orange-600">🗺️</span>
                        )} Google My Business
                      </Label>
                      <Input
                        placeholder="https://g.co/kgs/your-business"
                        value={formData.socialMedia.googleBusiness || ''}
                        onChange={(e) => handleSocialMediaChange('googleBusiness', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        {loadingIcons.yelp ? (
                          <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : formData.socialMediaIcons.yelp ? (
                          <Image src={formData.socialMediaIcons.yelp} alt="Yelp" width={16} height={16} className="w-4 h-4" />
                        ) : (
                          <span className="text-red-600">⭐</span>
                        )} Yelp
                      </Label>
                      <Input
                        placeholder="https://yelp.com/biz/your-restaurant"
                        value={formData.socialMedia.yelp || ''}
                        onChange={(e) => handleSocialMediaChange('yelp', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        {loadingIcons.tripadvisor ? (
                          <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : formData.socialMediaIcons.tripadvisor ? (
                          <Image src={formData.socialMediaIcons.tripadvisor} alt="TripAdvisor" width={16} height={16} className="w-4 h-4" />
                        ) : (
                          <span className="text-green-600">✈️</span>
                        )} TripAdvisor
                      </Label>
                      <Input
                        placeholder="https://tripadvisor.com/Restaurant_Review-your-restaurant"
                        value={formData.socialMedia.tripadvisor || ''}
                        onChange={(e) => handleSocialMediaChange('tripadvisor', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <p className="text-xs text-black dark:text-white mt-3">
                    💡 Tip: Icons will automatically appear next to platform names after entering valid URLs. This helps customers easily identify and access your restaurant&apos;s online presence.
                  </p>
                  
                  {/* Custom Social Media URLs */}
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium text-black dark:text-white">Custom Social Links (Optional)</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addCustomSocialUrl}
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Custom URL
                      </Button>
                    </div>
                    
                    {formData.customSocialUrls.map((customUrl, index) => (
                      <div key={index} className="flex gap-2 items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <div className="flex-1">
                          <Input
                            placeholder="Platform name (e.g., Discord, Telegram)"
                            value={customUrl.label}
                            onChange={(e) => updateCustomSocialUrl(index, 'label', e.target.value)}
                            className="mb-2"
                          />
                          <div className="flex items-center gap-2">
                            {customUrl.icon && (
                              <Image src={customUrl.icon} alt="Icon" width={16} height={16} className="w-4 h-4" />
                            )}
                            <Input
                              placeholder="https://platform.com/your-restaurant"
                              value={customUrl.url}
                              onChange={(e) => updateCustomSocialUrl(index, 'url', e.target.value)}
                              className="flex-1"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCustomSocialUrl(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    ))}
                    
                    {formData.customSocialUrls.length === 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        No custom social links added yet. Click &ldquo;Add Custom URL&rdquo; to add links to Discord, Telegram, or other platforms.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery Partners Section */}
              <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    
                    <div className="text-base font-semibold text-black dark:text-white">
                      Delivery Partner Links (Optional)
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeliveryPartners(!showDeliveryPartners)}
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-100"
                  >
                    {showDeliveryPartners ? (
                      <>
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        Hide
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        Show Options
                      </>
                    )}
                  </Button>
                </div>
                
                <p className="text-sm text-black dark:text-white mb-4">
                  Connect your existing delivery platform profiles so customers can order directly from your restaurant
                </p>

                {showDeliveryPartners && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium text-black dark:text-white flex items-center gap-2">
                      {loadingIcons.zomato ? (
                        <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : formData.deliveryPartnerIcons.zomato ? (
                        <Image src={formData.deliveryPartnerIcons.zomato} alt="Zomato" width={16} height={16} className="w-4 h-4" />
                      ) : (
                        '🍅'
                      )} Zomato
                    </Label>
                    <Input
                      value={formData.deliveryPartners.zomato}
                      onChange={(e) => handleDeliveryPartnerChange('zomato', e.target.value)}
                      placeholder="https://zomato.com/restaurant-name"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-black dark:text-white flex items-center gap-2">
                      {loadingIcons.swiggy ? (
                        <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : formData.deliveryPartnerIcons.swiggy ? (
                        <Image src={formData.deliveryPartnerIcons.swiggy} alt="Swiggy" width={16} height={16} className="w-4 h-4" />
                      ) : (
                        '🍽️'
                      )} Swiggy
                    </Label>
                    <Input
                      value={formData.deliveryPartners.swiggy}
                      onChange={(e) => handleDeliveryPartnerChange('swiggy', e.target.value)}
                      placeholder="https://swiggy.com/restaurant-name"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-black dark:text-white flex items-center gap-2">
                      {loadingIcons.uberEats ? (
                        <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : formData.deliveryPartnerIcons.uberEats ? (
                        <Image src={formData.deliveryPartnerIcons.uberEats} alt="Uber Eats" width={16} height={16} className="w-4 h-4" />
                      ) : (
                        '🚗'
                      )} Uber Eats
                    </Label>
                    <Input
                      value={formData.deliveryPartners.uberEats}
                      onChange={(e) => handleDeliveryPartnerChange('uberEats', e.target.value)}
                      placeholder="https://ubereats.com/restaurant-name"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-black dark:text-white flex items-center gap-2">
                      {loadingIcons.doorDash ? (
                        <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : formData.deliveryPartnerIcons.doorDash ? (
                        <Image src={formData.deliveryPartnerIcons.doorDash} alt="DoorDash" width={16} height={16} className="w-4 h-4" />
                      ) : (
                        '🚪'
                      )} DoorDash
                    </Label>
                    <Input
                      value={formData.deliveryPartners.doorDash}
                      onChange={(e) => handleDeliveryPartnerChange('doorDash', e.target.value)}
                      placeholder="https://doordash.com/restaurant-name"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-black dark:text-white flex items-center gap-2">
                      {loadingIcons.grubHub ? (
                        <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : formData.deliveryPartnerIcons.grubHub ? (
                        <Image src={formData.deliveryPartnerIcons.grubHub} alt="Grubhub" width={16} height={16} className="w-4 h-4" />
                      ) : (
                        '🥪'
                      )} Grubhub
                    </Label>
                    <Input
                      value={formData.deliveryPartners.grubHub}
                      onChange={(e) => handleDeliveryPartnerChange('grubHub', e.target.value)}
                      placeholder="https://grubhub.com/restaurant-name"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-black dark:text-white flex items-center gap-2">
                      {loadingIcons.other ? (
                        <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : formData.deliveryPartnerIcons.other ? (
                        <Image src={formData.deliveryPartnerIcons.other} alt="Other Platform" width={16} height={16} className="w-4 h-4" />
                      ) : (
                        '📦'
                      )} Other Platform
                    </Label>
                    <Input
                      value={formData.deliveryPartners.other}
                      onChange={(e) => handleDeliveryPartnerChange('other', e.target.value)}
                      placeholder="https://other-delivery-platform.com"
                      className="mt-1"
                    />
                  </div>
                  </div>
                )}

                <p className="text-xs text-black dark:text-white mt-3">
                  💡 Tip: Icons will automatically appear next to platform names after entering valid URLs. This helps customers quickly identify their preferred delivery service.
                </p>
                
                {/* Custom Delivery URLs */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium text-black dark:text-white">Custom Delivery Links (Optional)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addCustomDeliveryUrl}
                      className="text-orange-600 border-orange-300 hover:bg-orange-50"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Custom URL
                    </Button>
                  </div>
                  
                  {formData.customDeliveryUrls.map((customUrl, index) => (
                    <div key={index} className="flex gap-2 items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="flex-1">
                        <Input
                          placeholder="Platform name (e.g., Local delivery, Website orders)"
                          value={customUrl.label}
                          onChange={(e) => updateCustomDeliveryUrl(index, 'label', e.target.value)}
                          className="mb-2"
                        />
                        <div className="flex items-center gap-2">
                          {customUrl.icon && (
                            <Image src={customUrl.icon} alt="Icon" width={16} height={16} className="w-4 h-4" />
                          )}
                          <Input
                            placeholder="https://delivery-platform.com/restaurant-name"
                            value={customUrl.url}
                            onChange={(e) => updateCustomDeliveryUrl(index, 'url', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCustomDeliveryUrl(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  ))}
                  
                  {formData.customDeliveryUrls.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No custom delivery links added yet. Click &ldquo;Add Custom URL&rdquo; to add links to local delivery services or your own ordering system.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        );

      case 5:
        return (
          <div className="mx-auto max-w-4xl">
            <Card className="bg-gradient-to-br from-white via-orange-50/30 to-white dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 border-2 border-black/10 dark:border-white/10 shadow-lg overflow-hidden">
              <CardHeader className="text-center space-y-3 pb-6 bg-gradient-to-r from-orange-500/5 to-orange-600/5">
                <CardTitle className="flex items-center justify-center gap-3 text-2xl font-semibold text-gray-900 dark:text-white">
                  <div className="p-3 bg-orange-500 text-white rounded-xl shadow-md">
                    <Clock className="h-6 w-6" />
                  </div>
                  Operating Hours
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-400 text-sm max-w-lg mx-auto leading-relaxed">
                  Set your restaurant&apos;s operating hours for each day of the week
                </p>
              </CardHeader>
              
              <CardContent className="space-y-6 px-6 md:px-8 pb-8">
                {/* Operating Hours Overview */}
                <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-orange-100/60 dark:from-orange-900/20 dark:to-orange-800/10 rounded-xl border border-orange-200/60 dark:border-orange-800/40">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Quick Overview</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    {Object.entries(formData.operatingHours).map(([day, hours]) => (
                      <div key={day} className="flex items-center justify-between bg-white/70 dark:bg-gray-800/50 rounded-lg px-3 py-2 border border-orange-200/30 dark:border-orange-800/30">
                        <span className="capitalize font-medium text-gray-700 dark:text-gray-300">{day}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${hours.isOpen ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                          {hours.isOpen ? `${formatTimeDisplay(hours.openTime)} - ${formatTimeDisplay(hours.closeTime)}` : 'Closed'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Days Configuration */}
                <div className="space-y-4">
                  {Object.entries(formData.operatingHours).map(([day, hours]) => (
                    <div key={day} className="bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
                      {/* Day Header */}
                      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center space-x-4">
                          {/* Modern Toggle Switch */}
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={hours.isOpen}
                              onChange={(e) => handleHoursChange(day as keyof typeof DEFAULT_HOURS, 'isOpen', e.target.checked)}
                              className="sr-only"
                              id={`toggle-${day}`}
                            />
                            <label
                              htmlFor={`toggle-${day}`}
                              className={`flex items-center cursor-pointer w-14 h-7 rounded-full p-1 transition-all duration-300 ${
                                hours.isOpen 
                                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg' 
                                  : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-all duration-300 ${
                                  hours.isOpen ? 'translate-x-7' : 'translate-x-0'
                                }`}
                              />
                            </label>
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="capitalize font-semibold text-lg text-gray-900 dark:text-white">
                              {day}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {hours.isOpen ? 'Restaurant is open' : 'Restaurant is closed'}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        {hours.isOpen && (
                          <div className="flex items-center space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addTimeSlot(day as keyof typeof DEFAULT_HOURS)}
                              className="text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-xs px-3 py-1.5"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Slot
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Time Configuration */}
                      {hours.isOpen && (
                        <div className="p-4 space-y-3">
                          {/* Main Time Slot */}
                          <div className="bg-gradient-to-r from-orange-50/50 to-orange-100/30 dark:from-orange-900/10 dark:to-orange-800/5 rounded-lg p-4 border border-orange-200/50 dark:border-orange-800/30">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Primary Hours</span>
                              <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full">
                                Main schedule
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Opening Time</Label>
                                <Input
                                  type="time"
                                  value={hours.openTime}
                                  onChange={(e) => handleHoursChange(day as keyof typeof DEFAULT_HOURS, 'openTime', e.target.value)}
                                  className="h-10 text-center border-orange-200 dark:border-orange-800 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg font-mono"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                  {formatTimeDisplay(hours.openTime)}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Closing Time</Label>
                                <Input
                                  type="time"
                                  value={hours.closeTime}
                                  onChange={(e) => handleHoursChange(day as keyof typeof DEFAULT_HOURS, 'closeTime', e.target.value)}
                                  className="h-10 text-center border-orange-200 dark:border-orange-800 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg font-mono"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                  {formatTimeDisplay(hours.closeTime)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Additional Time Slots */}
                          {hours.additionalSlots && hours.additionalSlots.length > 0 && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-orange-400 rounded-full"></div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Additional Hours</span>
                              </div>
                              {hours.additionalSlots.map((slot, index) => (
                                <div key={index} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Slot #{index + 1}</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeTimeSlot(day as keyof typeof DEFAULT_HOURS, index)}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 h-6 w-6"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Opens</Label>
                                      <Input
                                        type="time"
                                        value={slot.openTime}
                                        onChange={(e) => {
                                          const newSlots = [...(hours.additionalSlots || [])];
                                          newSlots[index] = { ...newSlots[index], openTime: e.target.value };
                                          const currentHours = formData.operatingHours[day as keyof typeof formData.operatingHours];
                                          setFormData(prev => ({
                                            ...prev,
                                            operatingHours: {
                                              ...prev.operatingHours,
                                              [day]: {
                                                ...currentHours,
                                                additionalSlots: newSlots
                                              }
                                            }
                                          }));
                                        }}
                                        className="h-9 text-center border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg font-mono text-sm"
                                      />
                                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                        {formatTimeDisplay(slot.openTime)}
                                      </p>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Closes</Label>
                                      <Input
                                        type="time"
                                        value={slot.closeTime}
                                        onChange={(e) => {
                                          const newSlots = [...(hours.additionalSlots || [])];
                                          newSlots[index] = { ...newSlots[index], closeTime: e.target.value };
                                          const currentHours = formData.operatingHours[day as keyof typeof formData.operatingHours];
                                          setFormData(prev => ({
                                            ...prev,
                                            operatingHours: {
                                              ...prev.operatingHours,
                                              [day]: {
                                                ...currentHours,
                                                additionalSlots: newSlots
                                              }
                                            }
                                          }));
                                        }}
                                        className="h-9 text-center border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg font-mono text-sm"
                                      />
                                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                        {formatTimeDisplay(slot.closeTime)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Closed State */}
                      {!hours.isOpen && (
                        <div className="p-6 text-center">
                          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Clock className="h-5 w-5 text-gray-400" />
                          </div>
                          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Closed on {day}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Toggle the switch above to set hours</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Quick Setup Actions */}
                <div className="mt-8 p-4 sm:p-6 bg-gradient-to-r from-orange-50 to-orange-100/60 dark:from-orange-900/20 dark:to-orange-800/10 rounded-xl border border-orange-200/60 dark:border-orange-800/40">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    Quick Setup Templates
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const standardHours = { isOpen: true, openTime: '09:00', closeTime: '17:00', additionalSlots: [] };
                        setFormData(prev => ({
                          ...prev,
                          operatingHours: {
                            monday: standardHours,
                            tuesday: standardHours,
                            wednesday: standardHours,
                            thursday: standardHours,
                            friday: standardHours,
                            saturday: standardHours,
                            sunday: standardHours,
                          }
                        }));
                      }}
                      className="bg-white dark:bg-gray-800 text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 min-h-[60px] sm:min-h-[70px] p-3 flex flex-col items-center justify-center text-center w-full"
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs font-medium">9 AM - 5 PM</span>
                      </div>
                      <span className="text-xs text-gray-500">All days</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const weekdayHours = { isOpen: true, openTime: '09:00', closeTime: '22:00', additionalSlots: [] };
                        const weekendHours = { isOpen: false, openTime: '09:00', closeTime: '22:00', additionalSlots: [] };
                        setFormData(prev => ({
                          ...prev,
                          operatingHours: {
                            monday: weekdayHours,
                            tuesday: weekdayHours,
                            wednesday: weekdayHours,
                            thursday: weekdayHours,
                            friday: weekdayHours,
                            saturday: weekendHours,
                            sunday: weekendHours,
                          }
                        }));
                      }}
                      className="bg-white dark:bg-gray-800 text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 min-h-[60px] sm:min-h-[70px] p-3 flex flex-col items-center justify-center text-center w-full"
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs font-medium">Weekdays Only</span>
                      </div>
                      <span className="text-xs text-gray-500">Mon-Fri</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const restaurantHours = { isOpen: true, openTime: '11:00', closeTime: '23:00', additionalSlots: [] };
                        setFormData(prev => ({
                          ...prev,
                          operatingHours: {
                            monday: restaurantHours,
                            tuesday: restaurantHours,
                            wednesday: restaurantHours,
                            thursday: restaurantHours,
                            friday: { ...restaurantHours, closeTime: '24:00' },
                            saturday: { ...restaurantHours, closeTime: '24:00' },
                            sunday: restaurantHours,
                          }
                        }));
                      }}
                      className="bg-white dark:bg-gray-800 text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 min-h-[60px] sm:min-h-[70px] p-3 flex flex-col items-center justify-center text-center w-full"
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs font-medium">Restaurant Hours</span>
                      </div>
                      <span className="text-xs text-gray-500">11 AM - 11 PM</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const closedHours = { isOpen: false, openTime: '09:00', closeTime: '17:00', additionalSlots: [] };
                        setFormData(prev => ({
                          ...prev,
                          operatingHours: {
                            monday: closedHours,
                            tuesday: closedHours,
                            wednesday: closedHours,
                            thursday: closedHours,
                            friday: closedHours,
                            saturday: closedHours,
                            sunday: closedHours,
                          }
                        }));
                      }}
                      className="bg-white dark:bg-gray-800 text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 min-h-[60px] sm:min-h-[70px] p-3 flex flex-col items-center justify-center text-center w-full"
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <X className="h-3 w-3" />
                        <span className="text-xs font-medium">Close All</span>
                      </div>
                      <span className="text-xs text-gray-500">Temporarily closed</span>
                    </Button>
                  </div>
                  
                  <div className="mt-4 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-orange-200/30 dark:border-orange-800/30">
                    <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <div className="w-1 h-1 bg-orange-400 rounded-full"></div>
                      You can always modify these hours later from your restaurant dashboard
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 6:
        return (
          <div className="mx-auto max-w-4xl">
            <Card className="bg-gradient-to-br from-white via-orange-50/30 to-white dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 border-2 border-black/10 dark:border-white/10 shadow-lg">
              <CardHeader className="text-center space-y-3 pb-6">
                <CardTitle className="flex items-center justify-center gap-3 text-2xl font-semibold">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl">
                    <FileText className="h-6 w-6" />
                  </div>
                  Policies & Final Details
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-400 text-sm max-w-lg mx-auto leading-relaxed">
                  Set your restaurant policies and guidelines
                </p>
              </CardHeader>
              <CardContent className="space-y-4 px-6 md:px-8 pb-8">
              <div>
                <Label htmlFor="cancellation">Cancellation Policy</Label>
                <Textarea
                  id="cancellation"
                  value={formData.policies.cancellation}
                  onChange={(e) => handleNestedChange('policies', 'cancellation', e.target.value)}
                  placeholder="e.g., 24-hour cancellation required for parties of 6 or more"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="delivery">Delivery Policy</Label>
                <Textarea
                  id="delivery"
                  value={formData.policies.delivery}
                  onChange={(e) => handleNestedChange('policies', 'delivery', e.target.value)}
                  placeholder="e.g., Free delivery within 3 miles, $25 minimum order"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="reservation">Reservation Policy</Label>
                <Textarea
                  id="reservation"
                  value={formData.policies.reservation}
                  onChange={(e) => handleNestedChange('policies', 'reservation', e.target.value)}
                  placeholder="e.g., Reservations recommended on weekends"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="dressCode">Dress Code (Optional)</Label>
                <Input
                  id="dressCode"
                  value={formData.policies.dressCode}
                  onChange={(e) => handleNestedChange('policies', 'dressCode', e.target.value)}
                  placeholder="e.g., Smart casual, No tank tops"
                />
              </div>

              <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                <h4 className="font-semibold text-orange-800 mb-2">🎉 Almost Done!</h4>
                <p className="text-sm text-orange-700">
After completing setup, you&apos;ll be taken to your restaurant dashboard where you can:
                </p>
                <ul className="text-sm text-orange-700 mt-2 space-y-1">
                  <li>• Upload your restaurant photos</li>
                  <li>• Create and manage your menu</li>
                  <li>• View customer reviews and analytics</li>
                  <li>• Update your restaurant information</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
        );

      case 7:
        return (
          <div className="mx-auto max-w-4xl">
            <Card className="bg-gradient-to-br from-white via-orange-50/30 to-white dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 border-2 border-black/10 dark:border-white/10 shadow-lg">
              <CardHeader className="text-center space-y-3 pb-6">
                <CardTitle className="flex items-center justify-center gap-3 text-2xl font-semibold">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl">
                    <ChefHat className="h-6 w-6" />
                  </div>
                  Kitchen Story & Photos
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-400 text-sm max-w-lg mx-auto leading-relaxed">
                  Share your culinary journey and showcase your kitchen
                </p>
              </CardHeader>
              <CardContent className="space-y-6 px-6 md:px-8 pb-8">
              <div>
                <Label htmlFor="kitchenStory" className="text-base font-medium">
                  Tell Your Kitchen Story
                </Label>
                <p className="text-sm text-gray-500 mb-3">
                  Share the story behind your kitchen, your culinary journey, and what makes your food special
                </p>
                <Textarea
                  id="kitchenStory"
                  value={formData.kitchenStory}
                  onChange={(e) => handleInputChange('kitchenStory', e.target.value)}
                  placeholder="Tell customers about your kitchen's story, your culinary philosophy, the chef's background, signature dishes, cooking techniques, or what makes your restaurant unique..."
                  rows={6}
                  className="resize-none"
                />
              </div>

              <div>
                <Label className="text-base font-medium">Kitchen Photos</Label>
                <p className="text-sm text-gray-500 mb-3">
                  Upload photos of your kitchen, cooking process, chef at work, or signature dishes being prepared
                </p>
                
                <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isKitchenPhotoUploading 
                    ? 'border-orange-300 bg-orange-50 cursor-not-allowed' 
                    : 'border-gray-300 bg-gray-50 hover:border-orange-300 hover:bg-orange-50'
                }`}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleKitchenPhotoUpload(e.target.files)}
                    className="hidden"
                    id="kitchen-photos"
                    disabled={isKitchenPhotoUploading}
                  />
                  <label htmlFor="kitchen-photos" className={`${isKitchenPhotoUploading ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <div className="flex flex-col items-center">
                      {isKitchenPhotoUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-2"></div>
                          <p className="text-sm text-orange-600 font-medium">Uploading kitchen photos...</p>
                          <p className="text-xs text-orange-500">Please wait</p>
                        </>
                      ) : (
                        <>
                          <Camera className="h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">Click to upload kitchen photos</p>
                          <p className="text-xs text-gray-500">PNG, JPG up to 10MB each</p>
                        </>
                      )}
                    </div>
                  </label>
                </div>

                {kitchenPhotoPreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {kitchenPhotoPreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <div className="relative h-32 w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                          <ImageWithFallback 
                            src={preview} 
                            alt={`Kitchen photo ${index + 1}`} 
                            fill 
                            className="object-cover" 
                            onError={() => console.error('Kitchen image failed to load:', preview)}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeKitchenPhoto(index)}
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        );

      case 8:
        return (
          <div className="mx-auto max-w-4xl">
            <Card className="bg-gradient-to-br from-white via-orange-50/30 to-white dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 border-2 border-black/10 dark:border-white/10 shadow-lg">
              <CardHeader className="text-center space-y-3 pb-6">
                <CardTitle className="flex items-center justify-center gap-3 text-2xl font-semibold">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl">
                    <Award className="h-6 w-6" />
                  </div>
                  Achievements & Awards
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-400 text-sm max-w-lg mx-auto leading-relaxed">
                  Showcase your restaurant&apos;s achievements and awards
                </p>
              </CardHeader>
              <CardContent className="space-y-6 px-6 md:px-8 pb-8">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-medium">Restaurant Achievements</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAchievement}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Achievement
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {formData.achievements.map((achievement, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium">Achievement #{index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAchievement(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Title *</Label>
                          <Input
                            value={achievement.title}
                            onChange={(e) => updateAchievement(index, 'title', e.target.value)}
                            placeholder="e.g., Best Restaurant Award 2024"
                          />
                        </div>
                        <div>
                          <Label>Year</Label>
                          <Input
                            type="number"
                            value={achievement.year || ''}
                            onChange={(e) => updateAchievement(index, 'year', parseInt(e.target.value))}
                            placeholder="2024"
                            min="1900"
                            max="2030"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <Label>Issuer/Organization</Label>
                        <Input
                          value={achievement.issuer || ''}
                          onChange={(e) => updateAchievement(index, 'issuer', e.target.value)}
                          placeholder="e.g., Local Food Critics Association"
                        />
                      </div>
                      
                      <div className="mt-3">
                        <Label>Description</Label>
                        <Textarea
                          value={achievement.description}
                          onChange={(e) => updateAchievement(index, 'description', e.target.value)}
                          placeholder="Describe this achievement and what it means..."
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                  
                  {formData.achievements.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Award className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No achievements added yet</p>
                      <p className="text-sm">Click &ldquo;Add Achievement&rdquo; to showcase your awards and recognitions</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Achievement Photos</Label>
                <p className="text-sm text-gray-500 mb-3">
                  Upload photos of certificates, awards, recognitions, or any achievement-related images
                </p>
                
                <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isAchievementPhotoUploading 
                    ? 'border-orange-300 bg-orange-50 cursor-not-allowed' 
                    : 'border-gray-300 bg-gray-50 hover:border-orange-300 hover:bg-orange-50'
                }`}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleAchievementPhotoUpload(e.target.files)}
                    className="hidden"
                    id="achievement-photos"
                    disabled={isAchievementPhotoUploading}
                  />
                  <label htmlFor="achievement-photos" className={`${isAchievementPhotoUploading ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <div className="flex flex-col items-center">
                      {isAchievementPhotoUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-2"></div>
                          <p className="text-sm text-orange-600 font-medium">Uploading achievement photos...</p>
                          <p className="text-xs text-orange-500">Please wait</p>
                        </>
                      ) : (
                        <>
                          <Camera className="h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">Click to upload achievement photos</p>
                          <p className="text-xs text-gray-500">PNG, JPG up to 10MB each</p>
                        </>
                      )}
                    </div>
                  </label>
                </div>

                {achievementPhotoPreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {achievementPhotoPreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <div className="relative h-32 w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                          <ImageWithFallback 
                            src={preview} 
                            alt={`Achievement photo ${index + 1}`} 
                            fill 
                            className="object-cover" 
                            onError={() => console.error('Achievement image failed to load:', preview)}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAchievementPhoto(index)}
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                <h4 className="font-semibold text-orange-800 mb-2">🎉 Final Step!</h4>
                <p className="text-sm text-orange-700">
                  You&apos;ve completed all the information needed for your restaurant profile. Click &ldquo;Complete Setup&rdquo; to finish your onboarding and access your dashboard.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto onboarding-container">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <Link href="/onboarding" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 mb-4 sm:mb-6 text-sm font-medium transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to user type selection
          </Link>
          
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Set up your restaurant profile
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4">
            Step {currentStep} of {totalSteps} - Let&apos;s get your restaurant listed on Aharamm AI
          </p>
          
          {/* Progress bar */}
          <div className="w-full max-w-sm sm:max-w-md mx-auto bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-3 mt-4 sm:mt-6 shadow-inner">
            <div 
              className="aharamm-gradient h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
            {Math.round((currentStep / totalSteps) * 100)}% Complete
          </p>
        </div>

        {/* Form Step */}
        <div className="mb-6 sm:mb-8">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 sticky bottom-4 sm:static bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none p-4 sm:p-0 rounded-lg sm:rounded-none border sm:border-none border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="w-full sm:w-auto order-2 sm:order-1 min-h-[44px] border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          {currentStep === totalSteps ? (
            <Button 
              onClick={handleSubmit}
              disabled={isLoading || !formData.restaurantName}
              className="aharamm-gradient w-full sm:w-auto order-1 sm:order-2 min-h-[44px] text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating your restaurant profile...
                </>
              ) : (
                <>
                  Complete Setup
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleNext}
              className="aharamm-gradient w-full sm:w-auto order-1 sm:order-2 min-h-[44px] text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              disabled={
                (currentStep === 1 && (!formData.restaurantName || (formData.categories.length === 0 && !otherCategorySelected) || !formData.description)) ||
                (currentStep === 3 && formData.cuisineTypes.length === 0) ||
                (currentStep === 4 && (!formData.address || !formData.city || !formData.state || !formData.zipCode || !formData.latitude || !formData.longitude)) ||
                (currentStep === 5 && !formData.phone) ||
                false // All remaining steps are optional or have no validation requirements
              }
            >
              Next Step
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
