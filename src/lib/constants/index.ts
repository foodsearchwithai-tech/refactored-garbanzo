// Brand Colors - Orange Primary Theme
export const COLORS = {
  primary: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316', // Main orange
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
} as const;

// Cuisine Types
export const CUISINE_TYPES = [
  'Italian',
  'Chinese',
  'Indian',
  'Mexican',
  'Japanese',
  'Thai',
  'French',
  'Mediterranean',
  'American',
  'Korean',
  'Vietnamese',
  'Middle Eastern',
  'Greek',
  'Spanish',
  'German',
  'British',
  'Caribbean',
  'African',
  'Brazilian',
  'Peruvian',
  'Turkish',
  'Russian',
  'Ethiopian',
  'Moroccan',
  'Lebanese',
  'Pakistani',
  'Bangladeshi',
  'Sri Lankan',
  'Nepalese',
  'Fusion',
  'Street Food',
  'Fast Food',
  'Vegetarian',
  'Vegan',
  'Organic',
  'Farm-to-Table',
] as const;

// Dietary Tags
export const DIETARY_TAGS = [
  { value: 'vegan', label: 'Vegan', color: 'green' },
  { value: 'vegetarian', label: 'Vegetarian', color: 'green' },
  { value: 'gluten_free', label: 'Gluten Free', color: 'blue' },
  { value: 'dairy_free', label: 'Dairy Free', color: 'purple' },
  { value: 'nut_free', label: 'Nut Free', color: 'red' },
  { value: 'keto', label: 'Keto', color: 'orange' },
  { value: 'halal', label: 'Halal', color: 'teal' },
  { value: 'kosher', label: 'Kosher', color: 'indigo' },
] as const;

// Menu Item Badges
export const MENU_BADGES = [
  { value: 'chef_special', label: "Chef's Special", color: 'gold', icon: '👨‍🍳' },
  { value: 'trending', label: 'Trending', color: 'red', icon: '🔥' },
  { value: 'new', label: 'New', color: 'green', icon: '✨' },
  { value: 'customer_favorite', label: 'Customer Favorite', color: 'purple', icon: '❤️' },
  { value: 'spicy', label: 'Spicy', color: 'red', icon: '🌶️' },
  { value: 'healthy', label: 'Healthy', color: 'green', icon: '🥗' },
] as const;

// Review Tags
export const REVIEW_TAGS = [
  { value: 'great_service', label: 'Great Service', emoji: '👏' },
  { value: 'long_wait', label: 'Long Wait', emoji: '⏰' },
  { value: 'perfect_date_spot', label: 'Perfect Date Spot', emoji: '💕' },
  { value: 'family_friendly', label: 'Family Friendly', emoji: '👨‍👩‍👧‍👦' },
  { value: 'noisy', label: 'Noisy', emoji: '🔊' },
  { value: 'quiet', label: 'Quiet', emoji: '🤫' },
  { value: 'good_value', label: 'Good Value', emoji: '💰' },
  { value: 'expensive', label: 'Expensive', emoji: '💸' },
  { value: 'fresh_food', label: 'Fresh Food', emoji: '🥬' },
  { value: 'authentic', label: 'Authentic', emoji: '🏆' },
  { value: 'creative_menu', label: 'Creative Menu', emoji: '🎨' },
] as const;

// Restaurant Features
export const RESTAURANT_FEATURES = [
  { value: 'delivery', label: 'Delivery', icon: '🚚' },
  { value: 'dine_in', label: 'Dine In', icon: '🍽️' },
  { value: 'takeout', label: 'Takeout', icon: '🥡' },
  { value: 'reservation', label: 'Reservations', icon: '📅' },
  { value: 'parking', label: 'Parking', icon: '🅿️' },
  { value: 'wifi', label: 'Free WiFi', icon: '📶' },
  { value: 'outdoor_seating', label: 'Outdoor Seating', icon: '🪑' },
  { value: 'live_music', label: 'Live Music', icon: '🎵' },
  { value: 'pet_friendly', label: 'Pet Friendly', icon: '🐕' },
  { value: 'wheelchair_accessible', label: 'Wheelchair Accessible', icon: '♿' },
] as const;

// Restaurant Categories
export const RESTAURANT_CATEGORIES = [
  { value: 'fine_dining', label: 'Fine Dining', description: 'Upscale dining experience' },
  { value: 'casual_dining', label: 'Casual Dining', description: 'Relaxed family dining' },
  { value: 'fast_food', label: 'Fast Food', description: 'Quick service restaurants' },
  { value: 'cafe', label: 'Café', description: 'Coffee shops and light meals' },
  { value: 'bakery', label: 'Bakery', description: 'Fresh baked goods' },
  { value: 'bar', label: 'Bar & Grill', description: 'Drinks and pub food' },
  { value: 'food_truck', label: 'Food Truck', description: 'Mobile food vendors' },
  { value: 'catering', label: 'Catering', description: 'Event and party catering' },
  { value: 'ghost_kitchen', label: 'Ghost Kitchen', description: 'Delivery-only restaurants' },
] as const;

// Inspiration Tab Categories
export const INSPIRATION_TABS = [
  {
    id: 'street_food',
    label: 'Street Food',
    description: 'Quick bites & local favorites',
    emoji: '🌮',
    prompts: [
      'Best street tacos near me',
      'Local food trucks and vendors',
      'Authentic street food experience',
      'Quick bites under $10',
    ],
  },
  {
    id: 'fine_dining',
    label: 'Fine Dining',
    description: 'Luxury dining experiences',
    emoji: '🍾',
    prompts: [
      'Michelin star restaurants',
      'Romantic dinner spots',
      'Chef tasting menus',
      'Special occasion dining',
    ],
  },
  {
    id: 'vegan',
    label: 'Vegan',
    description: 'Fresh, plant-based goodness',
    emoji: '🥗',
    prompts: [
      'Best vegan restaurants',
      'Plant-based comfort food',
      'Healthy vegan options',
      'Vegan-friendly cafés',
    ],
  },
  {
    id: 'biryani',
    label: 'Biryani',
    description: 'Authentic flavors, rice & spice',
    emoji: '🍛',
    prompts: [
      'Best biryani in the city',
      'Authentic Hyderabadi biryani',
      'Chicken biryani specialists',
      'Traditional Indian rice dishes',
    ],
  },
  {
    id: 'desserts',
    label: 'Desserts',
    description: 'Sweet treats & indulgence',
    emoji: '🍰',
    prompts: [
      'Best dessert places nearby',
      'Artisanal ice cream shops',
      'Bakeries and pastries',
      'Late-night sweet treats',
    ],
  },
  {
    id: 'cafes',
    label: 'Cafés',
    description: 'Coffee, tea & cozy vibes',
    emoji: '☕',
    prompts: [
      'Best coffee shops for work',
      'Cozy café atmosphere',
      'Specialty coffee roasters',
      'Café with WiFi and study space',
    ],
  },
  {
    id: 'trending',
    label: 'Trending Now',
    description: "What everyone's eating",
    emoji: '🔥',
    prompts: [
      'Most popular restaurants this week',
      'Viral food trends',
      'Where celebrities dine',
      'Instagram-worthy spots',
    ],
  },
] as const;

// Popular Restaurant Categories for Discovery Section
export const DISCOVERY_CATEGORIES = [
  {
    title: 'Famous Restaurants Around You',
    description: 'Well-known establishments in your area',
  },
  {
    title: 'Top Picks in Your City',
    description: 'Highest rated restaurants nearby',
  },
  {
    title: 'Must-Try Local Eateries',
    description: 'Hidden gems you should discover',
  },
  {
    title: 'Where Everyone\'s Eating',
    description: 'Currently popular dining spots',
  },
  {
    title: 'Trending Restaurants Nearby',
    description: 'Hot new openings and favorites',
  },
] as const;

// Feature Cards Data
export const FEATURE_CARDS = [
  {
    id: 'sampad_ai',
    title: 'Sampad AI',
    description: 'Personalized AI food search tailored to your taste preferences and dietary needs',
    icon: '🤖',
    href: '/search',
  },
  {
    id: 'restaurants',
    title: 'Restaurants',
    description: 'Verified kitchens & authentic menus from trusted local establishments',
    icon: '🏪',
    href: '/restaurants',
  },
  {
    id: 'offers',
    title: 'Offers',
    description: 'Exclusive food deals and discounts available in your area',
    icon: '🎯',
    href: '/offers',
  },
] as const;

// Spice Levels
export const SPICE_LEVELS = [
  { value: 'mild', label: 'Mild', color: 'green', peppers: 1 },
  { value: 'medium', label: 'Medium', color: 'yellow', peppers: 2 },
  { value: 'hot', label: 'Hot', color: 'orange', peppers: 3 },
  { value: 'extra_hot', label: 'Extra Hot', color: 'red', peppers: 4 },
] as const;

// Operating Hours Default
export const DEFAULT_HOURS = {
  monday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
  tuesday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
  wednesday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
  thursday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
  friday: { isOpen: true, openTime: '09:00', closeTime: '23:00' },
  saturday: { isOpen: true, openTime: '09:00', closeTime: '23:00' },
  sunday: { isOpen: true, openTime: '10:00', closeTime: '21:00' },
} as const;

// Price Ranges
export const PRICE_RANGES = [
  { value: 'budget', label: '$', description: 'Under $15 per person', min: 0, max: 15 },
  { value: 'moderate', label: '$$', description: '$15-30 per person', min: 15, max: 30 },
  { value: 'expensive', label: '$$$', description: '$30-50 per person', min: 30, max: 50 },
  { value: 'luxury', label: '$$$$', description: '$50+ per person', min: 50, max: 1000 },
] as const;

// Navigation Menu Items
export const NAVIGATION_ITEMS = [
  { label: 'Become a Restaurant', href: '/restaurant-signup', highlight: true },
] as const;

export const AUTH_MENU_ITEMS = [
  { label: 'Restaurants', href: '/restaurants' },
  { label: 'Help Center', href: '/help' },
] as const;

// Search Placeholder Texts
export const SEARCH_PLACEHOLDERS = [
  "What are you craving today? 🍜",
  "Find your next favorite dish 🍕",
  "Discover amazing restaurants 🌟",
  "Search for cuisine, restaurant, or dish 🔍",
  "What sounds delicious? 🤤",
] as const;

// App Configuration
export const APP_CONFIG = {
  name: 'Aharamm AI',
  tagline: 'AI powered Food search & finding dining discovery',
  supportEmail: 'support@aharamm.ai',
  defaultRadius: 10, // km
  maxSearchRadius: 50, // km
  reviewsPerPage: 10,
  restaurantsPerPage: 12,
  maxImagesPerReview: 5,
  maxImagesPerRestaurant: 10,
} as const;
