# Aharamm AI - Setup & Development Guide

## 🎉 What's Been Completed

### ✅ Phase 1: Foundation & Authentication (COMPLETED)
- **Next.js 14+** with TypeScript, Tailwind CSS, and shadcn/ui
- **Clerk Authentication** with social login integration
- **Orange brand theme** with custom CSS variables and animations
- **Responsive navigation** with mobile-first design
- **Professional homepage** with hero section, feature cards, and inspiration tabs

### ✅ Database & Storage Setup (COMPLETED)
- **Neon PostgreSQL** database schema with Drizzle ORM
- **Comprehensive data models** for users, restaurants, menus, reviews, and more
- **Vercel Blob Storage** integration for image/video uploads
- **Database migrations** generated and ready to deploy

### ✅ Onboarding Flow (COMPLETED)
- **User type selection** (Customer vs Restaurant Owner)
- **Customer onboarding** - 5-step form with preferences, dietary restrictions, and location
- **Restaurant owner onboarding** - 6-step form with business info, location, menu setup
- **Form validation** and data persistence to database

### ✅ Core UI Components (COMPLETED)
- **Header/Navigation** with authentication integration
- **Hero Section** with AI-powered search interface
- **Feature Cards** showcasing platform capabilities
- **Restaurant Discovery** with category-based filtering
- **Inspiration Tabs** with 7 cuisine categories and interactive prompts

## 🚀 Environment Setup

### Required Environment Variables

Create a `.env.local` file in the project root with these variables:

```env
# Clerk Authentication (REQUIRED)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Neon PostgreSQL Database (REQUIRED)
DATABASE_URL=postgresql://username:password@host/database?sslmode=require

# Vercel Blob Storage (REQUIRED)
BLOB_READ_WRITE_TOKEN=vercel_blob_token_here

# OpenAI API (REQUIRED for AI features)
OPENAI_API_KEY=sk-your_openai_key_here
OPENAI_BASE_URL=https://api.openai.com/v1

# Google Maps API (REQUIRED for location features)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### Service Setup Instructions

#### 1. Clerk Authentication
1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Copy the publishable key and secret key
4. Configure OAuth providers (Google, Facebook, etc.)
5. Set redirect URLs in Clerk dashboard

#### 2. Neon PostgreSQL Database
1. Go to [neon.tech](https://neon.tech) and create an account
2. Create a new database project
3. Copy the connection string
4. Run migrations: `npm run db:push`

#### 3. Vercel Blob Storage
1. Deploy to Vercel or use Vercel CLI
2. Go to your project settings in Vercel dashboard
3. Create a Blob store
4. Copy the read/write token

#### 4. OpenAI API
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an API key
3. Add billing information if needed

#### 5. Google Maps API
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Maps JavaScript API and Places API
4. Create credentials (API key)
5. Restrict the API key to your domain

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Database operations
npm run db:generate  # Generate migrations from schema changes
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio (database GUI)

# Production build
npm run build
npm start

# Linting
npm run lint
```

## 📁 Project Structure

```
aharamm-ai/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── api/                 # API endpoints
│   │   │   ├── onboarding/      # User onboarding APIs
│   │   │   └── upload/          # File upload API
│   │   ├── onboarding/          # Onboarding pages
│   │   ├── sign-in/             # Clerk sign-in page
│   │   ├── sign-up/             # Clerk sign-up page
│   │   └── page.tsx             # Homepage
│   ├── components/              # React components
│   │   ├── navigation/          # Header and navigation
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── HeroSection.tsx      # Homepage hero
│   │   ├── FeatureCards.tsx     # Feature showcase
│   │   ├── RestaurantDiscovery.tsx # Restaurant cards
│   │   └── InspirationTabs.tsx  # Cuisine inspiration
│   ├── lib/                     # Utilities and configurations
│   │   ├── db/                  # Database schema and connection
│   │   ├── storage/             # Vercel Blob utilities
│   │   ├── types/               # TypeScript type definitions
│   │   └── constants/           # App constants and configurations
│   └── middleware.ts            # Clerk middleware
├── drizzle.config.ts           # Database configuration
└── package.json               # Dependencies and scripts
```

## 🗄️ Database Schema

The database includes these main tables:

- **users** - User accounts (customers and restaurant owners)
- **user_preferences** - Customer dietary and cuisine preferences
- **user_locations** - User saved locations (home, work, etc.)
- **restaurants** - Restaurant profiles and information
- **menus** - Restaurant menu organization
- **menu_categories** - Menu sections (appetizers, mains, etc.)
- **menu_items** - Individual dishes with details
- **reviews** - User reviews and ratings
- **review_responses** - Restaurant responses to reviews
- **favorites** - User bookmarks for restaurants and dishes
- **images** - Media file references (Vercel Blob URLs)
- **restaurant_certifications** - Awards and certifications

## 🎨 Design System

### Color Palette
- **Primary Orange**: `#f97316` (Tailwind orange-500)
- **Orange Gradient**: `linear-gradient(135deg, #f97316 0%, #ea580c 100%)`
- **Neutral Grays**: Gray-50 to Gray-900
- **Success**: Green-500
- **Warning**: Yellow-500
- **Error**: Red-500

### Typography
- **Font**: Inter (via Google Fonts)
- **Headings**: Font weights 600-800
- **Body**: Font weight 400-500
- **Small text**: Font weight 400

### Components
- **Rounded corners**: 0.75rem default radius
- **Shadows**: Soft shadows with orange tint for primary elements
- **Animations**: Smooth transitions and hover effects
- **Responsive**: Mobile-first design approach

## 📋 Next Steps - Phase 2

The following features are ready to be implemented:

### 🏪 Restaurant Profile Pages
- Individual restaurant detail pages
- Image galleries with Vercel Blob integration
- Menu display with categories and items
- Review system integration
- Contact information and policies

### 🔍 Search Functionality
- AI-powered restaurant search
- Location-based filtering
- Cuisine and dietary preference filters
- Real-time search suggestions

### 📊 Analytics & Dashboard
- Restaurant owner dashboard
- Customer analytics for restaurants
- Review management interface
- Menu management tools

### 🗺️ Maps Integration
- Google Maps integration for restaurant locations
- Directions and navigation
- Distance-based filtering
- Interactive map views

## 🚨 Important Notes

1. **Database Migrations**: Run `npm run db:push` after setting up your Neon database
2. **Environment Variables**: All listed environment variables are required for full functionality
3. **Authentication**: Users must complete onboarding after sign-up
4. **Media Upload**: Images are stored in Vercel Blob with database references
5. **Development Server**: Uses `--turbopack` for faster builds in development

## 🆘 Troubleshooting

### Common Issues:

1. **Database Connection Error**
   - Verify DATABASE_URL is correct
   - Ensure database is created and accessible
   - Check if migrations have been applied

2. **Authentication Issues**
   - Verify Clerk keys are correct
   - Check redirect URLs in Clerk dashboard
   - Ensure middleware is properly configured

3. **Image Upload Failing**
   - Verify Vercel Blob token is correct
   - Check file size limits (5MB max)
   - Ensure API route is accessible

4. **Development Server Issues**
   - Clear `.next` cache: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules && npm install`
   - Check for TypeScript errors: `npm run build`

---

The foundation is complete and ready for Phase 2 development! 🚀
