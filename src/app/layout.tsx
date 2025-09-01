import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import AutoLocationManager from '@/components/auth/AutoLocationManager';
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Aharamm AI - AI Powered Food Discovery",
  description: "Discover the best restaurants and dishes near you with AI-powered search and personalized recommendations",
  keywords: ["food discovery", "restaurant finder", "AI search", "dining", "food reviews"],
  authors: [{ name: "Aharamm AI Team" }],
  openGraph: {
    title: "Aharamm AI - AI Powered Food Discovery",
    description: "Discover the best restaurants and dishes near you with AI-powered search and personalized recommendations",
    type: "website",
  },
  // iOS specific meta tags
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Aharamm AI',
  },
  formatDetection: {
    telephone: false, // Prevents iOS from auto-detecting phone numbers
  },
};

// Separate viewport export (Next.js 15 requirement)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents zoom on iOS
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        elements: {
          rootBox: "mx-auto",
          card: "shadow-lg",
        },
      }}
      // iOS/mobile compatibility
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/onboarding"
      afterSignInUrl="/"
      afterSignUpUrl="/onboarding"
    >
      <html lang="en">
        <head>
          {/* iOS specific meta tags for better mobile experience */}
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Aharamm AI" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="theme-color" content="#f97316" />
        </head>
        <body className={`${inter.variable} font-sans antialiased bg-white text-gray-900`}>
          <AutoLocationManager />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
