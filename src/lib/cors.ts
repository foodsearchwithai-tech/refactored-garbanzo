import { NextResponse } from 'next/server';

/**
 * Simple CORS utility for the restaurant app
 * - Development: Only allows localhost:3000
 * - Production: Only allows the production domain
 */

function getAllowedOrigins(): string[] {
  const isProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';
  
  if (isProduction) {
    const productionDomain = process.env.PRODUCTION_DOMAIN;
    if (!productionDomain) {
      console.warn('PRODUCTION_DOMAIN not set, defaulting to localhost');
      return ['http://localhost:3000'];
    }
    return [productionDomain];
  }
  
  // Development mode - only localhost
  return ['http://localhost:3000'];
}

export function handleCors(request?: Request) {
  const origin = request?.headers.get('origin');
  const allowedOrigins = getAllowedOrigins();
  
  // Check if origin is allowed
  if (origin && !allowedOrigins.includes(origin)) {
    return new NextResponse(null, { status: 403 });
  }
  
  const corsHeaders = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Origin': origin || allowedOrigins[0],
  };
  
  return new NextResponse(null, { 
    status: 200, 
    headers: corsHeaders 
  });
}

export function withCors(response: NextResponse, request?: Request) {
  const origin = request?.headers.get('origin');
  const allowedOrigins = getAllowedOrigins();
  
  // Check if origin is allowed
  if (origin && !allowedOrigins.includes(origin)) {
    return response; // Don't add CORS headers for disallowed origins
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  response.headers.set('Access-Control-Allow-Origin', origin || allowedOrigins[0]);
  
  return response;
}

export function corsJsonResponse(data: unknown, init?: ResponseInit, request?: Request) {
  const origin = request?.headers.get('origin');
  const allowedOrigins = getAllowedOrigins();
  
  // Check if origin is allowed
  if (origin && !allowedOrigins.includes(origin)) {
    return NextResponse.json(
      { error: 'Origin not allowed' }, 
      { status: 403 }
    );
  }
  
  const corsHeaders = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Origin': origin || allowedOrigins[0],
  };
  
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...corsHeaders,
      ...init?.headers,
    },
  });
}
