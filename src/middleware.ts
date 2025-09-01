import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/profile(.*)',
  '/onboarding(.*)',
  '/restaurant-dashboard(.*)',
  '/api/onboarding(.*)',
  '/api/upload(.*)',
  '/api/menu(.*)',
  '/api/restaurant/dashboard(.*)',
  '/api/reviews(.*)',
]);

// Public API routes that should never require authentication
const isPublicApiRoute = createRouteMatcher([
  '/api/restaurants/search(.*)',
  '/api/restaurants/nearby(.*)',
  '/api/restaurants/[id]',
  '/api/search(.*)',
  '/api/geocoding(.*)',
  '/api/menu-items/[itemId]/reviews(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  try {
    const { userId } = await auth();
    
    // Handle public API routes - no authentication required
    if (isPublicApiRoute(req)) {
      const origin = req.headers.get('origin');
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL;
      const additionalOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];
      
      // Build allowed origins list
      const allowedOrigins = [];
      if (siteUrl) {
        const normalizedUrl = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`;
        allowedOrigins.push(normalizedUrl);
        // Add both protocols for development
        if (normalizedUrl.startsWith('http://')) {
          allowedOrigins.push(normalizedUrl.replace('http://', 'https://'));
        } else {
          allowedOrigins.push(normalizedUrl.replace('https://', 'http://'));
        }
      }
      allowedOrigins.push(...additionalOrigins.filter(Boolean));
      
      if (process.env.NODE_ENV === 'development') {
        allowedOrigins.push('http://localhost:3000', 'https://localhost:3000', 'http://127.0.0.1:3000');
      }
      
      const response = NextResponse.next();
      
      // Set CORS headers
      if (process.env.NODE_ENV === 'development' || !origin || allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin || '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        response.headers.set('Access-Control-Max-Age', '86400');
        response.headers.set('Access-Control-Allow-Credentials', 'true');
      }
      
      // Still add user ID if available for tracking purposes
      if (userId) {
        const requestHeaders = new Headers(req.headers);
        requestHeaders.set('x-user-id', userId);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      }
      
      return response;
    }
    
    // Always add user ID to headers for API routes when user is authenticated
    if (userId && req.nextUrl.pathname.startsWith('/api/')) {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-user-id', userId);
      
      // Check if this is a protected route that needs auth
      if (isProtectedRoute(req)) {
        try {
          await auth.protect();
        } catch (authError) {
          console.error('Auth protection error:', authError);
          
          // Handle JWT clock skew issues gracefully in development
          if (process.env.NODE_ENV === 'development') {
            const errorMessage = String(authError);
            if (errorMessage.includes('token-iat-in-the-future') || 
                errorMessage.includes('clock skew') ||
                errorMessage.includes('JWT issued at date claim')) {
              
              // Log the issue but allow access in development with future dates
              console.warn('⚠️  Clock skew detected - allowing access in development mode');
              console.warn('Current system date appears to be in 2025');
              console.warn('If this is correct, the application will function normally');
              
              return NextResponse.next({
                request: {
                  headers: requestHeaders,
                },
              });
            }
          }
          
          // Re-throw for other auth errors
          throw authError;
        }
      }
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
    
    // Protect routes that require authentication (non-API routes)
    if (isProtectedRoute(req)) {
      try {
        await auth.protect();
      } catch (authError) {
        console.error('Auth protection error:', authError);
        
        // Handle JWT clock skew issues gracefully in development
        if (process.env.NODE_ENV === 'development') {
          const errorMessage = String(authError);
          if (errorMessage.includes('token-iat-in-the-future') || 
              errorMessage.includes('clock skew') ||
              errorMessage.includes('JWT issued at date claim')) {
            
            // Log the issue but allow access in development with future dates
            console.warn('⚠️  Clock skew detected - allowing access in development mode');
            console.warn('Current system date appears to be in 2025');
            console.warn('If this is correct, the application will function normally');
            
            return NextResponse.next();
          }
        }
        
        // Re-throw for other auth errors
        throw authError;
      }
    }
    
    // If user is signed in and accessing the home page
    if (userId && req.nextUrl.pathname === '/') {
      // Check if welcome=true is in the query params (just completed onboarding)
      const welcomeParam = req.nextUrl.searchParams.get('welcome');
      if (welcomeParam === 'true') {
        // Allow access to home page and don't redirect
        return NextResponse.next();
      }
    }
    
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    
    // In development, be more permissive with clock skew issues
    if (process.env.NODE_ENV === 'development') {
      const errorMessage = String(error);
      if (errorMessage.includes('token-iat-in-the-future') || 
          errorMessage.includes('clock skew') ||
          errorMessage.includes('JWT')) {
        console.warn('⚠️  JWT validation failed due to clock skew - continuing in development');
        return NextResponse.next();
      }
    }
    
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
