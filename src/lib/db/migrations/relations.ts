import { relations } from "drizzle-orm/relations";
import { users, restaurants, menus, restaurantCertifications, images, reviews, menuItems, reviewResponses, menuCategories, userLocations, favorites, userPreferences } from "./schema";

export const restaurantsRelations = relations(restaurants, ({one, many}) => ({
	user: one(users, {
		fields: [restaurants.ownerId],
		references: [users.id]
	}),
	menus: many(menus),
	restaurantCertifications: many(restaurantCertifications),
	reviews: many(reviews),
	reviewResponses: many(reviewResponses),
	favorites: many(favorites),
}));

export const usersRelations = relations(users, ({many}) => ({
	restaurants: many(restaurants),
	images: many(images),
	reviews: many(reviews),
	userLocations: many(userLocations),
	favorites: many(favorites),
	userPreferences: many(userPreferences),
}));

export const menusRelations = relations(menus, ({one, many}) => ({
	restaurant: one(restaurants, {
		fields: [menus.restaurantId],
		references: [restaurants.id]
	}),
	menuCategories: many(menuCategories),
}));

export const restaurantCertificationsRelations = relations(restaurantCertifications, ({one}) => ({
	restaurant: one(restaurants, {
		fields: [restaurantCertifications.restaurantId],
		references: [restaurants.id]
	}),
}));

export const imagesRelations = relations(images, ({one}) => ({
	user: one(users, {
		fields: [images.uploadedBy],
		references: [users.id]
	}),
}));

export const reviewsRelations = relations(reviews, ({one, many}) => ({
	user: one(users, {
		fields: [reviews.userId],
		references: [users.id]
	}),
	restaurant: one(restaurants, {
		fields: [reviews.restaurantId],
		references: [restaurants.id]
	}),
	menuItem: one(menuItems, {
		fields: [reviews.menuItemId],
		references: [menuItems.id]
	}),
	reviewResponses: many(reviewResponses),
}));

export const menuItemsRelations = relations(menuItems, ({one, many}) => ({
	reviews: many(reviews),
	menuCategory: one(menuCategories, {
		fields: [menuItems.categoryId],
		references: [menuCategories.id]
	}),
	favorites: many(favorites),
}));

export const reviewResponsesRelations = relations(reviewResponses, ({one}) => ({
	review: one(reviews, {
		fields: [reviewResponses.reviewId],
		references: [reviews.id]
	}),
	restaurant: one(restaurants, {
		fields: [reviewResponses.restaurantId],
		references: [restaurants.id]
	}),
}));

export const menuCategoriesRelations = relations(menuCategories, ({one, many}) => ({
	menuItems: many(menuItems),
	menu: one(menus, {
		fields: [menuCategories.menuId],
		references: [menus.id]
	}),
}));

export const userLocationsRelations = relations(userLocations, ({one}) => ({
	user: one(users, {
		fields: [userLocations.userId],
		references: [users.id]
	}),
}));

export const favoritesRelations = relations(favorites, ({one}) => ({
	user: one(users, {
		fields: [favorites.userId],
		references: [users.id]
	}),
	restaurant: one(restaurants, {
		fields: [favorites.restaurantId],
		references: [restaurants.id]
	}),
	menuItem: one(menuItems, {
		fields: [favorites.menuItemId],
		references: [menuItems.id]
	}),
}));

export const userPreferencesRelations = relations(userPreferences, ({one}) => ({
	user: one(users, {
		fields: [userPreferences.userId],
		references: [users.id]
	}),
}));