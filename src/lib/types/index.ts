// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  profileImage?: string;
  userType: 'customer' | 'restaurant_owner';
  location?: UserLocation;
  preferences?: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserLocation {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  city: string;
  state: string;
  zipCode: string;
}

export interface UserPreferences {
  dietaryRestrictions: string[];
  cuisinePreferences: string[];
  budgetRange: {
    min: number;
    max: number;
  };
  diningFrequency: 'rarely' | 'occasionally' | 'frequently' | 'daily';
  groupSizePreference: number;
}

// Restaurant Types
export interface Restaurant {
  id: string;
  name: string;
  description: string;
  verified: boolean;
  cuisineTypes: string[];
  tagline?: string;
  coverImages: string[];
  profileImage: string;
  rating: number;
  reviewCount: number;
  location: RestaurantLocation;
  contact: RestaurantContact;
  operatingHours: OperatingHours;
  policies: RestaurantPolicies;
  certifications: Certification[];
  externalLinks: ExternalLinks;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RestaurantLocation {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  city: string;
  state: string;
  zipCode: string;
  landmark?: string;
}

export interface RestaurantContact {
  phone: string;
  email?: string;
  website?: string;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

export interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  isOpen: boolean;
  openTime?: string; // Format: "HH:mm"
  closeTime?: string; // Format: "HH:mm"
}

export interface RestaurantPolicies {
  cancellation: string;
  delivery: string;
  reservation: string;
  dressCode?: string;
  accessibility: string[];
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  imageUrl?: string;
  verificationUrl?: string;
  issuedDate: Date;
  expiryDate?: Date;
}

export interface ExternalLinks {
  uberEats?: string;
  doorDash?: string;
  grubHub?: string;
  zomato?: string;
  other: { name: string; url: string }[];
}

// Menu Types
export interface Menu {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  categories: MenuCategory[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  items: MenuItem[];
  displayOrder: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  dietaryTags: DietaryTag[];
  allergens: string[];
  spiceLevel?: 'mild' | 'medium' | 'hot' | 'extra_hot';
  badges: MenuItemBadge[];
  availability: 'available' | 'limited' | 'sold_out';
  nutritionalInfo?: NutritionalInfo;
  preparationTime?: number; // in minutes
  customizations: CustomizationOption[];
  isActive: boolean;
}

export type DietaryTag = 'vegan' | 'vegetarian' | 'gluten_free' | 'dairy_free' | 'nut_free' | 'keto' | 'halal' | 'kosher';

export type MenuItemBadge = 'chef_special' | 'trending' | 'new' | 'customer_favorite' | 'spicy' | 'healthy';

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
}

export interface CustomizationOption {
  id: string;
  name: string;
  options: {
    name: string;
    priceModifier: number;
  }[];
}

// Review Types
export interface Review {
  id: string;
  userId: string;
  restaurantId: string;
  menuItemId?: string;
  overallRating: number;
  categoryRatings: {
    foodQuality: number;
    service: number;
    ambiance: number;
    valueForMoney: number;
  };
  title?: string;
  content: string;
  images: string[];
  tags: ReviewTag[];
  isVerified: boolean;
  helpfulVotes: number;
  restaurantResponse?: RestaurantResponse;
  createdAt: Date;
  updatedAt: Date;
}

export type ReviewTag = 'great_service' | 'long_wait' | 'perfect_date_spot' | 'family_friendly' | 'noisy' | 'quiet' | 'good_value' | 'expensive' | 'fresh_food' | 'authentic' | 'creative_menu';

export interface RestaurantResponse {
  content: string;
  respondedAt: Date;
  respondedBy: string;
}

// Search and Filter Types
export interface SearchFilters {
  location?: {
    coordinates: {
      lat: number;
      lng: number;
    };
    radius: number; // in kilometers
  };
  cuisineTypes?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  dietaryRestrictions?: DietaryTag[];
  isOpen?: boolean;
  features?: RestaurantFeature[];
}

export type RestaurantFeature = 'delivery' | 'dine_in' | 'takeout' | 'reservation' | 'parking' | 'wifi' | 'outdoor_seating' | 'live_music' | 'pet_friendly' | 'wheelchair_accessible';

export interface SearchResult {
  restaurants: Restaurant[];
  totalCount: number;
  page: number;
  limit: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Onboarding Types
export interface CustomerOnboardingData {
  personalInfo: {
    name: string;
    phone: string;
    profileImage?: string;
  };
  locationPreferences: {
    homeAddress?: UserLocation;
    workAddress?: UserLocation;
    frequentAreas: UserLocation[];
  };
  diningPreferences: UserPreferences;
  notificationSettings: NotificationSettings;
}

export interface RestaurantOwnerOnboardingData {
  businessInfo: {
    restaurantName: string;
    businessLicense: string;
    cuisineTypes: string[];
    category: RestaurantCategory;
  };
  ownerDetails: {
    name: string;
    phone: string;
    email: string;
    profileImage?: string;
  };
  restaurantLocation: RestaurantLocation;
  businessDocuments: {
    license: string;
    permits: string[];
    certifications: string[];
  };
  contactInfo: RestaurantContact;
  operatingHours: OperatingHours;
  paymentInfo: PaymentInfo;
}

export type RestaurantCategory = 'fine_dining' | 'casual_dining' | 'fast_food' | 'cafe' | 'bakery' | 'bar' | 'food_truck' | 'catering' | 'ghost_kitchen';

export interface NotificationSettings {
  deals: boolean;
  newRestaurants: boolean;
  friendActivity: boolean;
  reviewReminders: boolean;
  marketingEmails: boolean;
}

export interface PaymentInfo {
  subscriptionPlan: 'basic' | 'premium' | 'enterprise';
  billingAddress: string;
  taxId?: string;
}
