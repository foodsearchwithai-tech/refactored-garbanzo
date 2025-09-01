import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Routes that require authentication - REMOVED /onboarding from here
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/profile(.*)',
  '/restaurant-dashboard(.*)',
  '/api/onboarding(.*)',
  '/api/upload(.*)',
  '/api/menu(.*)',
  '/api/restaurant/dashboard(.*)',
  '/api/reviews(.*)',
]);

// Public routes that don't need auth - ADDED /onboarding here
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/onboarding(.*)', // Make onboarding public
  '/api/restaurants(.*)',
  '/api/search(.*)',
  '/api/geocoding(.*)',
  '/api/menu-items/[itemId]/reviews(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  try {
    const { userId } = await auth();
    
    // Handle public routes first - no authentication required
    if (isPublicRoute(req)) {
      // Still add user ID for tracking if available
      if (userId && req.nextUrl.pathname.startsWith('/api/')) {
        const requestHeaders = new Headers(req.headers);
        requestHeaders.set('x-user-id', userId);
        return NextResponse.next({
          request: { headers: requestHeaders },
        });
      }
      return NextResponse.next();
    }
    
    // Protect all other routes
    if (isProtectedRoute(req)) {
      await auth.protect(); // Clerk will use default redirect URLs from env
    }
    
    // Add user ID to API routes when authenticated
    if (userId && req.nextUrl.pathname.startsWith('/api/')) {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-user-id', userId);
      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    }
    
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // Redirect to sign-in on any auth error
    return NextResponse.redirect(new URL('/sign-in', req.url));
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
