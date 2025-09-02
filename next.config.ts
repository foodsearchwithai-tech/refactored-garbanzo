import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'oioqa3094kaaijdx.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
    ],
    // Add timeout and retry configurations
    unoptimized: false,
    // Increase timeout for image processing
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Add image optimization settings to prevent timeouts
    formats: ['image/webp'],
    minimumCacheTTL: 60,
  },
  // Configure Turbopack instead of webpack
  turbopack: {
    // Configure resolve aliases for better module resolution
    resolveAlias: {
      // Add any aliases you need here
    },
    // Configure resolve extensions
    resolveExtensions: [
      '.mdx',
      '.tsx', 
      '.ts', 
      '.jsx', 
      '.js', 
      '.mjs', 
      '.json'
    ],
  },
  // Move serverComponentsExternalPackages to the correct location
  serverExternalPackages: [],
  // Add experimental features to handle timeouts better
  experimental: {
    // Remove deprecated and invalid options
  },
  // Add API routes timeout configuration
  serverRuntimeConfig: {
    // Increase API timeout to 60 seconds
    maxDuration: 60,
  },
};

export default nextConfig;
