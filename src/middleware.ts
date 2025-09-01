import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/profile(.*)',
  '/restaurant-dashboard(.*)',
  '/api/upload(.*)',
  '/api/menu(.*)',
  '/api/restaurant/dashboard(.*)',
  '/api/reviews(.*)',
  '/api/favorites(.*)',
  '/api/user/(.*)',
]);

// Public routes that don't need auth
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/onboarding(.*)',
  '/restaurants(.*)',
  '/restaurant/(.*)',
  '/search(.*)',
  '/api/restaurants(.*)',
  '/api/search(.*)',
  '/api/geocoding(.*)',
  '/api/menu-items/(.*)',
]);

// API routes that should work for both authenticated and unauthenticated users
const isOptionalAuthRoute = createRouteMatcher([
  '/api/notifications(.*)',
  '/api/analytics(.*)',
  '/api/onboarding(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  try {
    // Handle CORS for mobile/iOS compatibility
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-User-ID',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Get user ID (but don't throw if not authenticated)
    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch {
      // User not authenticated - this is OK for some routes
      console.log('User not authenticated, continuing...');
    }
    
    // Handle public routes - no authentication required
    if (isPublicRoute(req)) {
      const response = NextResponse.next();
      // Add CORS headers for mobile compatibility
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-User-ID');
      
      // Still add user ID if available
      if (userId && req.nextUrl.pathname.startsWith('/api/')) {
        response.headers.set('X-User-ID', userId);
      }
      return response;
    }
    
    // Handle optional auth routes (work for both authenticated and unauthenticated)
    if (isOptionalAuthRoute(req)) {
      const response = NextResponse.next();
      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-User-ID');
      
      // Add user ID header if authenticated
      if (userId) {
        response.headers.set('X-User-ID', userId);
      }
      return response;
    }
    
    // Protect routes that require authentication
    if (isProtectedRoute(req)) {
      if (!userId) {
        // Redirect to sign-in for protected routes
        const signInUrl = new URL('/sign-in', req.url);
        signInUrl.searchParams.set('redirect_url', req.url);
        return NextResponse.redirect(signInUrl);
      }
      
      // Add user ID to protected API routes
      if (req.nextUrl.pathname.startsWith('/api/')) {
        const response = NextResponse.next();
        response.headers.set('X-User-ID', userId);
        return response;
      }
    }
    
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // On error, allow the request to continue but without auth
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|static|favicon.ico|images|.*\\.(?:png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
