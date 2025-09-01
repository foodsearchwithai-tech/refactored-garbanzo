import { pgTable, foreignKey, uuid, text, boolean, json, numeric, integer, timestamp, unique } from "drizzle-orm/pg-core"



export const restaurants = pgTable("restaurants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	ownerId: text("owner_id").notNull(),
	name: text().notNull(),
	description: text(),
	isVerified: boolean("is_verified").default(false),
	cuisineTypes: json("cuisine_types").notNull(),
	category: text().notNull(),
	tagline: text(),
	profileImage: text("profile_image"),
	coverImages: json("cover_images").default([]),
	averageRating: numeric("average_rating", { precision: 3, scale:  2 }).default('0'),
	reviewCount: integer("review_count").default(0),
	address: text().notNull(),
	city: text().notNull(),
	state: text().notNull(),
	zipCode: text("zip_code").notNull(),
	latitude: numeric({ precision: 10, scale:  8 }),
	longitude: numeric({ precision: 11, scale:  8 }),
	phone: text().notNull(),
	email: text(),
	website: text(),
	socialMedia: json("social_media").default({}),
	operatingHours: json("operating_hours").notNull(),
	policies: json().default({"cancellation":"","delivery":"","reservation":"","accessibility":[]}),
	features: json().default([]),
	externalLinks: json("external_links").default({"other":[]}),
	businessLicense: text("business_license"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [users.id],
			name: "restaurants_owner_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const menus = pgTable("menus", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	restaurantId: uuid("restaurant_id").notNull(),
	name: text().notNull(),
	description: text(),
	isActive: boolean("is_active").default(true),
	displayOrder: integer("display_order").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.restaurantId],
			foreignColumns: [restaurants.id],
			name: "menus_restaurant_id_restaurants_id_fk"
		}).onDelete("cascade"),
]);

export const restaurantCertifications = pgTable("restaurant_certifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	restaurantId: uuid("restaurant_id").notNull(),
	name: text().notNull(),
	issuer: text().notNull(),
	imageUrl: text("image_url"),
	verificationUrl: text("verification_url"),
	issuedDate: timestamp("issued_date", { mode: 'string' }).notNull(),
	expiryDate: timestamp("expiry_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.restaurantId],
			foreignColumns: [restaurants.id],
			name: "restaurant_certifications_restaurant_id_restaurants_id_fk"
		}).onDelete("cascade"),
]);

export const images = pgTable("images", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	filename: text().notNull(),
	originalName: text("original_name").notNull(),
	mimeType: text("mime_type").notNull(),
	size: integer().notNull(),
	url: text().notNull(),
	uploadedBy: text("uploaded_by"),
	entityType: text("entity_type").notNull(),
	entityId: uuid("entity_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.uploadedBy],
			foreignColumns: [users.id],
			name: "images_uploaded_by_users_id_fk"
		}).onDelete("set null"),
]);

export const reviews = pgTable("reviews", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	restaurantId: uuid("restaurant_id").notNull(),
	menuItemId: uuid("menu_item_id"),
	overallRating: integer("overall_rating").notNull(),
	foodQualityRating: integer("food_quality_rating").notNull(),
	serviceRating: integer("service_rating").notNull(),
	ambianceRating: integer("ambiance_rating").notNull(),
	valueForMoneyRating: integer("value_for_money_rating").notNull(),
	title: text(),
	content: text().notNull(),
	images: json().default([]),
	tags: json().default([]),
	isVerified: boolean("is_verified").default(false),
	helpfulVotes: integer("helpful_votes").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "reviews_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.restaurantId],
			foreignColumns: [restaurants.id],
			name: "reviews_restaurant_id_restaurants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.menuItemId],
			foreignColumns: [menuItems.id],
			name: "reviews_menu_item_id_menu_items_id_fk"
		}).onDelete("set null"),
]);

export const reviewResponses = pgTable("review_responses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	reviewId: uuid("review_id").notNull(),
	restaurantId: uuid("restaurant_id").notNull(),
	content: text().notNull(),
	respondedBy: text("responded_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.reviewId],
			foreignColumns: [reviews.id],
			name: "review_responses_review_id_reviews_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.restaurantId],
			foreignColumns: [restaurants.id],
			name: "review_responses_restaurant_id_restaurants_id_fk"
		}).onDelete("cascade"),
	unique("review_responses_review_id_unique").on(table.reviewId),
]);

export const menuItems = pgTable("menu_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	categoryId: uuid("category_id").notNull(),
	name: text().notNull(),
	description: text().notNull(),
	price: numeric({ precision: 8, scale:  2 }).notNull(),
	images: json().default([]),
	dietaryTags: json("dietary_tags").default([]),
	allergens: json().default([]),
	spiceLevel: text("spice_level"),
	badges: json().default([]),
	availability: text().default('available'),
	nutritionalInfo: json("nutritional_info"),
	preparationTime: integer("preparation_time"),
	customizations: json().default([]),
	displayOrder: integer("display_order").default(0),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [menuCategories.id],
			name: "menu_items_category_id_menu_categories_id_fk"
		}).onDelete("cascade"),
]);

export const userLocations = pgTable("user_locations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	type: text().notNull(),
	address: text().notNull(),
	city: text().notNull(),
	state: text().notNull(),
	zipCode: text("zip_code").notNull(),
	latitude: numeric({ precision: 10, scale:  8 }),
	longitude: numeric({ precision: 11, scale:  8 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_locations_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const favorites = pgTable("favorites", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	restaurantId: uuid("restaurant_id"),
	menuItemId: uuid("menu_item_id"),
	type: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "favorites_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.restaurantId],
			foreignColumns: [restaurants.id],
			name: "favorites_restaurant_id_restaurants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.menuItemId],
			foreignColumns: [menuItems.id],
			name: "favorites_menu_item_id_menu_items_id_fk"
		}).onDelete("cascade"),
]);

export const userPreferences = pgTable("user_preferences", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	dietaryRestrictions: json("dietary_restrictions").default([]),
	cuisinePreferences: json("cuisine_preferences").default([]),
	budgetMin: integer("budget_min").default(0),
	budgetMax: integer("budget_max").default(100),
	diningFrequency: text("dining_frequency").default('occasionally'),
	groupSizePreference: integer("group_size_preference").default(2),
	notificationSettings: json("notification_settings").default({"deals":true,"newRestaurants":true,"friendActivity":false,"reviewReminders":true,"marketingEmails":false}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_preferences_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("user_preferences_user_id_unique").on(table.userId),
]);

export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	firstName: text("first_name"),
	lastName: text("last_name"),
	profileImage: text("profile_image"),
	userType: text("user_type").notNull(),
	phone: text(),
	isOnboardingCompleted: boolean("is_onboarding_completed").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const menuCategories = pgTable("menu_categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	menuId: uuid("menu_id").notNull(),
	name: text().notNull(),
	description: text(),
	displayOrder: integer("display_order").default(0),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.menuId],
			foreignColumns: [menus.id],
			name: "menu_categories_menu_id_menus_id_fk"
		}).onDelete("cascade"),
]);
