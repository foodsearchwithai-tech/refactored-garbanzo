import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  json,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Use Clerk ID as primary key
  email: text('email').unique().notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  profileImage: text('profile_image'),
  userType: text('user_type', { enum: ['customer', 'restaurant_owner'] }).notNull(),
  phone: text('phone'),
  isOnboardingCompleted: boolean('is_onboarding_completed').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User origin table - Fixed location for each user with geocoding data
export const userOrigin = pgTable('user_origin', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).unique().notNull(),
  // Copied data from users table
  email: text('email').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  profileImage: text('profile_image'),
  userType: text('user_type').notNull(),
  phone: text('phone'),
  isOnboardingCompleted: boolean('is_onboarding_completed').default(false),
  // Origin location data with geocoding
  originAddress: text('origin_address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  country: text('country').notNull().default('India'),
  zipCode: text('zip_code'),
  latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
  longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
  // Geocoding metadata
  geocodingSource: text('geocoding_source').default('api'), // 'api', 'manual', 'ip'
  geocodingAccuracy: text('geocoding_accuracy'), // 'high', 'medium', 'low'
  placeId: text('place_id'), // Google/other geocoding service place ID
  formattedAddress: text('formatted_address'), // Full formatted address from geocoding service
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User locations table
export const userLocations = pgTable('user_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type', { enum: ['home', 'work', 'frequent'] }).notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zipCode: text('zip_code').notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User preferences table
export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).unique().notNull(),
  dietaryRestrictions: json('dietary_restrictions').$type<string[]>().default([]),
  cuisinePreferences: json('cuisine_preferences').$type<string[]>().default([]),
  budgetMin: integer('budget_min').default(0),
  budgetMax: integer('budget_max').default(100),
  diningFrequency: text('dining_frequency', { 
    enum: ['rarely', 'occasionally', 'frequently', 'daily'] 
  }).default('occasionally'),
  groupSizePreference: integer('group_size_preference').default(2),
  notificationSettings: json('notification_settings').$type<{
    deals: boolean;
    newRestaurants: boolean;
    friendActivity: boolean;
    reviewReminders: boolean;
    marketingEmails: boolean;
  }>().default({
    deals: true,
    newRestaurants: true,
    friendActivity: false,
    reviewReminders: true,
    marketingEmails: false,
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Restaurants table
export const restaurants = pgTable('restaurants', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: text('owner_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  isVerified: boolean('is_verified').default(false),
  cuisineTypes: json('cuisine_types').$type<string[]>().notNull(),
  category: text('category', {
    enum: ['fine_dining', 'casual_dining', 'fast_food', 'cafe', 'bakery', 'bar', 'food_truck', 'catering', 'ghost_kitchen']
  }).notNull(),
  tagline: text('tagline'),
  profileImage: text('profile_image'),
  coverImages: json('cover_images').$type<string[]>().default([]),
  // Additional image fields for better organization
  galleryImages: json('gallery_images').$type<string[]>().default([]),
  bannerImages: json('banner_images').$type<string[]>().default([]),
  logoImage: text('logo_image'),
  averageRating: decimal('average_rating', { precision: 3, scale: 2 }).default('0'),
  reviewCount: integer('review_count').default(0),
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zipCode: text('zip_code').notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  phone: text('phone').notNull(),
  email: text('email'),
  website: text('website'),
  socialMedia: json('social_media').$type<{
    facebook?: string;
    instagram?: string;
    twitter?: string;
  }>().default({}),
  operatingHours: json('operating_hours').$type<{
    monday: { isOpen: boolean; openTime?: string; closeTime?: string };
    tuesday: { isOpen: boolean; openTime?: string; closeTime?: string };
    wednesday: { isOpen: boolean; openTime?: string; closeTime?: string };
    thursday: { isOpen: boolean; openTime?: string; closeTime?: string };
    friday: { isOpen: boolean; openTime?: string; closeTime?: string };
    saturday: { isOpen: boolean; openTime?: string; closeTime?: string };
    sunday: { isOpen: boolean; openTime?: string; closeTime?: string };
  }>().notNull(),
  policies: json('policies').$type<{
    cancellation: string;
    delivery: string;
    reservation: string;
    dressCode?: string;
    accessibility: string[];
  }>().default({
    cancellation: '',
    delivery: '',
    reservation: '',
    accessibility: [],
  }),
  features: json('features').$type<string[]>().default([]),
  externalLinks: json('external_links').$type<{
    uberEats?: string;
    doorDash?: string;
    grubHub?: string;
    zomato?: string;
    other: { name: string; url: string }[];
  }>().default({ other: [] }),
  businessLicense: text('business_license'),
  // Kitchen & Achievement Features
  kitchenStory: text('kitchen_story'),
  kitchenPhotos: json('kitchen_photos').$type<string[]>().default([]),
  achievements: json('achievements').$type<{
    title: string;
    description: string;
    year?: number;
    issuer?: string;
  }[]>().default([]),
  achievementPhotos: json('achievement_photos').$type<string[]>().default([]),
  // Add delivery partners tracking
  deliveryPartners: json('delivery_partners').$type<{
    uberEats?: string;
    doorDash?: string;
    grubHub?: string;
    zomato?: string;
    other?: { name: string; url: string }[];
  }>().default({}),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Restaurant certifications table
export const restaurantCertifications = pgTable('restaurant_certifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  restaurantId: uuid('restaurant_id').references(() => restaurants.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  issuer: text('issuer').notNull(),
  imageUrl: text('image_url'),
  verificationUrl: text('verification_url'),
  issuedDate: timestamp('issued_date').notNull(),
  expiryDate: timestamp('expiry_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Menus table
export const menus = pgTable('menus', {
  id: uuid('id').primaryKey().defaultRandom(),
  restaurantId: uuid('restaurant_id').references(() => restaurants.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  displayOrder: integer('display_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Menu categories table
export const menuCategories = pgTable('menu_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  menuId: uuid('menu_id').references(() => menus.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Menu items table
export const menuItems = pgTable('menu_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').references(() => menuCategories.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  price: decimal('price', { precision: 8, scale: 2 }).notNull(),
  images: json('images').$type<string[]>().default([]), // Multiple images stored as JSON array
  dietaryTags: json('dietary_tags').$type<string[]>().default([]),
  allergens: json('allergens').$type<string[]>().default([]),
  spiceLevel: text('spice_level', { enum: ['mild', 'medium', 'hot', 'extra_hot'] }),
  badges: json('badges').$type<string[]>().default([]),
  availability: text('availability', { enum: ['available', 'limited', 'sold_out'] }).default('available'),
  nutritionalInfo: json('nutritional_info').$type<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
  }>(),
  preparationTime: integer('preparation_time'), // in minutes
  customizations: json('customizations').$type<{
    id: string;
    name: string;
    options: { name: string; priceModifier: number }[];
  }[]>().default([]),
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Reviews table
export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  restaurantId: uuid('restaurant_id').references(() => restaurants.id, { onDelete: 'cascade' }).notNull(),
  menuItemId: uuid('menu_item_id').references(() => menuItems.id, { onDelete: 'set null' }),
  overallRating: integer('overall_rating').notNull(), // 1-5
  foodQualityRating: integer('food_quality_rating').notNull(),
  serviceRating: integer('service_rating').notNull(),
  ambianceRating: integer('ambiance_rating').notNull(),
  valueForMoneyRating: integer('value_for_money_rating').notNull(),
  title: text('title'),
  content: text('content').notNull(),
  images: json('images').$type<string[]>().default([]),
  tags: json('tags').$type<string[]>().default([]),
  isVerified: boolean('is_verified').default(false),
  helpfulVotes: integer('helpful_votes').default(0),
  reviewLocation: text('review_location'),
  userCity: text('user_city'),
  userState: text('user_state'),
  userLatitude: decimal('user_latitude', { precision: 10, scale: 8 }),
  userLongitude: decimal('user_longitude', { precision: 11, scale: 8 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Restaurant responses to reviews
export const reviewResponses = pgTable('review_responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  reviewId: uuid('review_id').references(() => reviews.id, { onDelete: 'cascade' }).unique().notNull(),
  restaurantId: uuid('restaurant_id').references(() => restaurants.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  respondedBy: text('responded_by').notNull(), // Name/title of person responding
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User favorites table
export const favorites = pgTable('favorites', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  restaurantId: uuid('restaurant_id').references(() => restaurants.id, { onDelete: 'cascade' }),
  menuItemId: uuid('menu_item_id').references(() => menuItems.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['restaurant', 'menu_item'] }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Images table for media storage references
export const images = pgTable('images', {
  id: uuid('id').primaryKey().defaultRandom(),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  url: text('url').notNull(),
  uploadedBy: text('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
  entityType: text('entity_type', { 
    enum: ['restaurant', 'menu_item', 'review', 'user_profile', 'certification'] 
  }).notNull(),
  entityId: uuid('entity_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Restaurant messages table - For sending offers/announcements to nearby users
export const restaurantMessages = pgTable('restaurant_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  restaurantId: uuid('restaurant_id').references(() => restaurants.id, { onDelete: 'cascade' }).notNull(),
  senderId: text('sender_id').references(() => users.id, { onDelete: 'cascade' }).notNull(), // Restaurant owner
  title: text('title').notNull(),
  message: text('message').notNull(),
  messageType: text('message_type', { enum: ['offer', 'announcement', 'promotion'] }).default('offer').notNull(),
  offerDetails: json('offer_details').$type<{
    discountPercentage?: number;
    validUntil?: string;
    conditions?: string;
    menuItems?: string[];
    minimumOrder?: number;
  }>().default({}),
  targetRadiusKm: integer('target_radius_km').default(10), // Radius in kilometers
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Message recipients table - Tracks who receives each message
export const messageRecipients = pgTable('message_recipients', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id').references(() => restaurantMessages.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  recipientType: text('recipient_type', { enum: ['nearby', 'favorite'] }).notNull(), // 'nearby', 'favorite'
  distanceKm: decimal('distance_km', { precision: 10, scale: 2 }), // Distance from restaurant (null for favorite users)
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  isClicked: boolean('is_clicked').default(false),
  clickedAt: timestamp('clicked_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Define relationships
export const usersRelations = relations(users, ({ one, many }) => ({
  preferences: one(userPreferences),
  origin: one(userOrigin),
  locations: many(userLocations),
  restaurants: many(restaurants),
  reviews: many(reviews),
  favorites: many(favorites),
}));

export const userOriginRelations = relations(userOrigin, ({ one }) => ({
  user: one(users, {
    fields: [userOrigin.userId],
    references: [users.id],
  }),
}));

export const restaurantsRelations = relations(restaurants, ({ one, many }) => ({
  owner: one(users, {
    fields: [restaurants.ownerId],
    references: [users.id],
  }),
  menus: many(menus),
  reviews: many(reviews),
  certifications: many(restaurantCertifications),
  favorites: many(favorites),
  messages: many(restaurantMessages),
}));

export const menusRelations = relations(menus, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [menus.restaurantId],
    references: [restaurants.id],
  }),
  categories: many(menuCategories),
}));

export const menuCategoriesRelations = relations(menuCategories, ({ one, many }) => ({
  menu: one(menus, {
    fields: [menuCategories.menuId],
    references: [menus.id],
  }),
  items: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  category: one(menuCategories, {
    fields: [menuItems.categoryId],
    references: [menuCategories.id],
  }),
  reviews: many(reviews),
  favorites: many(favorites),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  restaurant: one(restaurants, {
    fields: [reviews.restaurantId],
    references: [restaurants.id],
  }),
  menuItem: one(menuItems, {
    fields: [reviews.menuItemId],
    references: [menuItems.id],
  }),
  response: one(reviewResponses),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  restaurant: one(restaurants, {
    fields: [favorites.restaurantId],
    references: [restaurants.id],
  }),
  menuItem: one(menuItems, {
    fields: [favorites.menuItemId],
    references: [menuItems.id],
  }),
}));

export const restaurantMessagesRelations = relations(restaurantMessages, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [restaurantMessages.restaurantId],
    references: [restaurants.id],
  }),
  sender: one(users, {
    fields: [restaurantMessages.senderId],
    references: [users.id],
  }),
  recipients: many(messageRecipients),
}));

// Notifications table
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // 'message', 'offer', 'review', 'system'
  title: text('title').notNull(),
  message: text('message').notNull(),
  data: json('data').$type<{
    restaurantId?: string;
    messageId?: string;
    url?: string;
    [key: string]: unknown;
  }>(),
  isRead: boolean('is_read').default(false),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  readAt: timestamp('read_at'),
  expiresAt: timestamp('expires_at'),
});

export const messageRecipientsRelations = relations(messageRecipients, ({ one }) => ({
  message: one(restaurantMessages, {
    fields: [messageRecipients.messageId],
    references: [restaurantMessages.id],
  }),
  user: one(users, {
    fields: [messageRecipients.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
