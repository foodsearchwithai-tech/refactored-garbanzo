import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// Configure Neon connection with better timeout and retry settings
const sql = neon(process.env.DATABASE_URL, {
  // Enable full results for better error handling
  fullResults: true,
  // Enable array mode for better performance
  arrayMode: false,
});

export const db = drizzle(sql, { 
  schema,
  logger: process.env.NODE_ENV === 'development' ? true : false
});

export {
  users,
  userOrigin,
  userLocations,
  userPreferences,
  restaurants,
  restaurantCertifications,
  menus,
  menuCategories,
  menuItems,
  reviews,
  reviewResponses,
  favorites,
  images,
  restaurantMessages,
  messageRecipients,
  notifications,
} from './schema';
