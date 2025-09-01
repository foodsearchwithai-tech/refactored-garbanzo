import type { Metadata } from "next";
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
    >
      <html lang="en">
        <body className={`${inter.variable} font-sans antialiased bg-white text-gray-900`}>
          <AutoLocationManager />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
