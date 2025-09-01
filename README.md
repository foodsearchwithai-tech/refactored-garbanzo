# 🍽️ Aharamm AI - AI Powered Food Discovery Platform

**Aharamm AI** is a sophisticated food discovery platform that uses artificial intelligence to help users find restaurants, dishes, and dining experiences tailored to their preferences. Built with Next.js 15, it features real-time search, location-based recommendations, and comprehensive restaurant management.

[![Next.js](https://img.shields.io/badge/Next.js-15.5.0-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Neon](https://img.shields.io/badge/Database-Neon_PostgreSQL-green)](https://neon.tech/)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-purple)](https://clerk.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)](https://vercel.com/)

---

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Database Schema](#-database-schema)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Management](#-database-management)
- [Current Database State](#-current-database-state)
- [Deployment](#-deployment)

---

## ✨ Features

### 🤖 **AI-Powered Search**
- **Real-time search** with instant results
- **Unified search** across restaurants and dishes
- **Smart relevance scoring** algorithm
- **Location-based filtering** using GPS
- **Type-ahead suggestions** and autocomplete

### 👥 **User Management**
- **Dual user types**: Customers & Restaurant Owners
- **Clerk authentication** with OAuth support
- **Comprehensive onboarding** flows
- **User preferences** and dietary restrictions
- **Location tracking** (home/work addresses)

### 🏪 **Restaurant Management**
- **Complete restaurant profiles** with operating hours
- **Hierarchical menu system** (Menus → Categories → Items)
- **Image upload** and media management
- **Review and rating system** with owner responses
- **Verification badges** and certifications
- **Analytics and insights** dashboard

### 🌍 **Location Services**
- **Google Maps integration** for geocoding
- **Distance calculation** using Haversine formula
- **Nearby restaurant discovery**
- **City and state-based filtering**

### 📱 **User Experience**
- **Responsive design** for all devices
- **Real-time notifications** and updates
- **Favorites system** for restaurants and dishes
- **Advanced filtering** by cuisine, price, ratings
- **Social features** and review interactions

---

## 🛠️ Technology Stack

### **Frontend**
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

### **Backend**
- **Neon PostgreSQL** - Serverless database
- **Drizzle ORM** - Type-safe database toolkit
- **Clerk** - Authentication and user management
- **Vercel Blob** - File storage and CDN
- **Google Maps API** - Geocoding and location services

### **Development Tools**
- **ESLint** - Code linting
- **Drizzle Kit** - Database migrations
- **PostCSS** - CSS processing
- **tsx** - TypeScript execution

---

## 🗄️ Database Schema

### **Database Information**
- **Provider**: Neon PostgreSQL
- **Project ID**: `icy-moon-39877489`
- **Database**: `neondb`
- **ORM**: Drizzle ORM with relations
- **Total Tables**: 12

### **Core Tables**

#### **1. Users (`users`)**
```sql
id: text (PK) -- Clerk ID
email: text (unique)
first_name: text
last_name: text
profile_image: text
user_type: enum('customer', 'restaurant_owner')
phone: text
is_onboarding_completed: boolean
created_at: timestamp
updated_at: timestamp
```

#### **2. Restaurants (`restaurants`)**
```sql
id: uuid (PK)
owner_id: text (FK → users.id)
name: text
description: text
is_verified: boolean
cuisine_types: json (array)
category: enum('fine_dining', 'casual_dining', 'fast_food', 'cafe', 'bakery', 'bar', 'food_truck', 'catering', 'ghost_kitchen')
tagline: text
profile_image: text
cover_images: json (array)
average_rating: decimal(3,2)
review_count: integer
address: text
city: text
state: text
zip_code: text
latitude: decimal(10,8)
longitude: decimal(11,8)
phone: text
email: text
website: text
social_media: json
operating_hours: json
policies: json
features: json (array)
external_links: json
business_license: text
is_active: boolean
created_at: timestamp
updated_at: timestamp
```

#### **3. Menu System**
```sql
-- Menus
menus (id, restaurant_id, name, description, is_active, display_order)

-- Menu Categories  
menu_categories (id, menu_id, name, description, display_order, is_active)

-- Menu Items
menu_items (id, category_id, name, description, price, images, dietary_tags, 
           allergens, spice_level, badges, availability, nutritional_info, 
           preparation_time, customizations, display_order, is_active)
```

#### **4. Review System**
```sql
-- Reviews
reviews (id, user_id, restaurant_id, menu_item_id, overall_rating, 
         food_quality_rating, service_rating, ambiance_rating, 
         value_for_money_rating, title, content, images, tags, 
         is_verified, helpful_votes)

-- Review Responses
review_responses (id, review_id, restaurant_id, content, responded_by)
```

#### **5. User Data**
```sql
-- User Preferences
user_preferences (id, user_id, dietary_restrictions, cuisine_preferences, 
                 budget_min, budget_max, dining_frequency, 
                 group_size_preference, notification_settings)

-- User Locations
user_locations (id, user_id, type, address, city, state, zip_code, 
               latitude, longitude)

-- Favorites
favorites (id, user_id, restaurant_id, menu_item_id, type)
```

#### **6. Additional Tables**
```sql
-- Restaurant Certifications
restaurant_certifications (id, restaurant_id, name, issuer, image_url, 
                          verification_url, issued_date, expiry_date)

-- Images
images (id, filename, original_name, mime_type, size, url, uploaded_by, 
        entity_type, entity_id)
```

---

## 🚀 API Documentation

### **Authentication Routes**
- `POST /api/onboarding/customer` - Customer onboarding
- `POST /api/onboarding/restaurant-owner` - Restaurant owner setup
- `POST /api/sync-user` - Sync Clerk user data

### **Search & Discovery**
- `POST /api/search` - AI-powered unified search
- `GET /api/restaurants/search` - Advanced restaurant search
- `GET /api/restaurants/nearby` - Location-based restaurant discovery
- `GET /api/restaurants/[id]` - Individual restaurant details

### **Menu Management**
- `GET /api/menu/categories` - Menu categories
- `GET /api/menu/categories/[id]` - Specific category
- `GET /api/menu/items` - Menu items
- `GET /api/menu/items/[id]` - Specific menu item

### **User Features**
- `GET /api/favorites` - User favorites
- `POST /api/favorites` - Add to favorites
- `DELETE /api/favorites` - Remove from favorites

### **Restaurant Dashboard**
- `GET /api/restaurant/dashboard` - Restaurant analytics
- `POST /api/upload` - File upload

### **Utility APIs**
- `POST /api/geocoding/reverse` - Reverse geocoding
- `POST /api/analytics/track` - Event tracking

---

## 📁 Project Structure

```
aharamm-ai/
├── 📄 README.md
├── 📄 package.json
├── 📄 next.config.ts
├── 📄 tailwind.config.js
├── 📄 tsconfig.json
├── 📄 drizzle.config.ts
├── 📁 public/
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── 📁 scripts/
│   └── geocode-restaurants.ts
├── 📁 src/
│   ├── 📄 env.d.ts
│   ├── 📄 middleware.ts
│   ├── 📁 app/
│   │   ├── 📄 layout.tsx
│   │   ├── 📄 page.tsx
│   │   ├── 📄 globals.css
│   │   ├── 📁 api/ (13 API routes)
│   │   │   ├── analytics/track/
│   │   │   ├── favorites/
│   │   │   ├── geocoding/reverse/
│   │   │   ├── menu/categories/, items/
│   │   │   ├── onboarding/customer/, restaurant-owner/
│   │   │   ├── restaurant/dashboard/
│   │   │   ├── restaurants/[id]/, nearby/, search/
│   │   │   ├── search/
│   │   │   └── upload/
│   │   ├── 📁 onboarding/
│   │   ├── 📁 restaurant/[id]/
│   │   ├── 📁 restaurant-dashboard/
│   │   ├── 📁 restaurant-signup/
│   │   ├── 📁 sign-in/[[...sign-in]]/
│   │   └── 📁 sign-up/[[...sign-up]]/
│   ├── 📁 components/
│   │   ├── 📄 FeatureCards.tsx
│   │   ├── 📄 HeroSection.tsx
│   │   ├── 📄 InspirationTabs.tsx
│   │   ├── 📄 RestaurantDiscovery.tsx
│   │   ├── 📁 auth/
│   │   ├── 📁 navigation/
│   │   ├── 📁 restaurant/
│   │   ├── 📁 search/
│   │   └── 📁 ui/ (shadcn/ui components)
│   └── 📁 lib/
│       ├── 📄 geocoding.ts
│       ├── 📄 utils.ts
│       ├── 📁 constants/
│       ├── 📁 db/
│       │   ├── 📄 index.ts
│       │   ├── 📄 schema.ts
│       │   └── 📁 migrations/
│       ├── 📁 storage/
│       └── 📁 types/
```

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18.17 or later
- npm, yarn, pnpm, or bun
- Neon PostgreSQL database
- Clerk account for authentication
- Google Maps API key
- Vercel account (for deployment)

### **Installation**

1. **Clone the repository**
```bash
git clone <repository-url>
cd aharamm-ai
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

4. **Run database migrations**
```bash
npm run db:push
```

5. **Start the development server**
```bash
npm run dev
```

6. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🔐 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Database
DATABASE_URL=postgresql://neondb_owner:...@ep-...neon.tech/neondb?sslmode=require&channel_binding=require

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

# OpenAI-compatible API (Optional)
OPENAI_API_BASE=https://ai-gateway.vercel.sh/v1
OPENAI_API_KEY=vck_...

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
GOOGLE_MAPS_API_KEY=AIzaSy...
```

---

## 📊 Database Management

### **Available Scripts**
```bash
# Generate migration files
npm run db:generate

# Push schema changes to database
npm run db:push

# Run migrations
npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio

# Geocode existing restaurants
npm run geocode-restaurants
```

### **Database Connection**
- **Neon Project ID**: `icy-moon-39877489`
- **Database Name**: `neondb`
- **Connection**: Serverless PostgreSQL via Neon

### **Schema Management**
The database schema is defined in `src/lib/db/schema.ts` using Drizzle ORM with full TypeScript support and relations.

---

## 📈 Current Database State

### **Live Data Summary** (as of August 27, 2025)

#### **Users (3 records)**
1. **Customer**: A.h.technical. mind (`ceo@fastenai.in`)
   - User Type: Customer
   - Onboarding: ✅ Completed
   - Preferences: Chinese cuisine, $15-50 budget, occasional dining

2. **Restaurant Owner**: Abdul hadi (`co-founder@fastenai.in`)
   - User Type: Restaurant Owner
   - Onboarding: ✅ Completed
   - Restaurant: "foody" (British Cafe)

3. **Customer**: Abdul Hadi (`abdulhadi96052@gmail.com`)
   - User Type: Customer  
   - Onboarding: ✅ Completed
   - Restaurant: "foody" (Japanese Bar)

#### **Restaurants (2 records)**

**Restaurant 1: "foody" (Japanese Bar)**
- **Owner**: abdulhadi96052@gmail.com
- **Location**: Mall Road, Kanpur Nagar, UP 208001
- **Cuisine**: Japanese | Category: Bar
- **Phone**: 72121122112
- **Hours**: Mon-Thu 9-22, Fri-Sat 9-23, Sun 10-21
- **Status**: Active, Not Verified

**Restaurant 2: "foody" (British Cafe)**
- **Owner**: co-founder@fastenai.in  
- **Location**: Mall Road, Kanpur, UP 208001
- **Cuisine**: British | Category: Cafe
- **Phone**: 7318022413
- **Hours**: Mon-Thu 9-22, Fri-Sat 9-23, Sun 10-21
- **Policies**: 24hr cancellation, ₹25 delivery, weekend reservations
- **Status**: Active, Not Verified

#### **Empty Tables**
The following tables are currently empty but ready for data:
- `menus`, `menu_categories`, `menu_items`
- `reviews`, `review_responses`
- `favorites`, `images`
- `restaurant_certifications`, `user_locations`

---

## 🌐 Deployment

### **Vercel Deployment**
This project is optimized for [Vercel Platform](https://vercel.com/):

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy automatically** on every push to main branch

### **Database Setup**
1. **Create Neon project** at [neon.tech](https://neon.tech)
2. **Copy connection string** to `DATABASE_URL`
3. **Run migrations** after first deployment

### **Additional Services**
- **Clerk**: Set up authentication at [clerk.com](https://clerk.com)
- **Google Maps**: Enable Geocoding API in Google Cloud Console
- **Vercel Blob**: Configure storage in Vercel dashboard

---

## 📝 Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:generate  # Generate migrations
npm run db:push      # Push schema changes
npm run db:migrate   # Run migrations
npm run db:studio    # Open Drizzle Studio

# Utilities
npm run geocode-restaurants  # Geocode existing restaurant addresses
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

**Aharamm AI Team**
- Built with ❤️ for food lovers and restaurant owners
- **Support**: support@aharamm.ai

---

*Last updated: August 27, 2025*
