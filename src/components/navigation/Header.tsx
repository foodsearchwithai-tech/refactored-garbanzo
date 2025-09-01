'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { UserButton, useUser, SignInButton, SignUpButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu, Search, User, Heart, Star } from 'lucide-react';
import { AUTH_MENU_ITEMS } from '@/lib/constants';
import NotificationDropdown from './NotificationDropdown';

export default function Header() {
  const { isSignedIn, user } = useUser();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Check if user is a restaurant owner
  const isRestaurantOwner = user?.unsafeMetadata?.userType === 'restaurant_owner';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/192x192 Logo.png"
              alt="Aharamm AI Logo"
              width={32}
              height={32}
              className="h-8 w-8 rounded-full"
            />
            <span className="font-bold text-xl text-gray-900 hidden sm:block">
              Aharamm AI
            </span>
          </Link>

          {/* Desktop Navigation - Center */}
          <div className="hidden md:flex items-center space-x-8">
            <NavigationMenu>
              <NavigationMenuList>
                {/* Show different content based on user type */}
                {!isSignedIn || !isRestaurantOwner ? (
                  <NavigationMenuItem>
                    <Link 
                      href="/onboarding" 
                      className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                    >
                      Become a Restaurant
                    </Link>
                  </NavigationMenuItem>
                ) : (
                  <NavigationMenuItem>
                    <Link 
                      href="/restaurant-dashboard" 
                      className="group inline-flex h-10 w-max items-center justify-center rounded-md aharamm-gradient text-white px-4 py-2 text-sm font-medium transition-colors hover:opacity-90 focus:opacity-90 focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                    >
                      Restaurant Dashboard
                    </Link>
                  </NavigationMenuItem>
                )}

                {/* Help Menu */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-10 text-gray-700 hover:text-orange-700 hover:bg-orange-50">
                    Help & More
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="!bg-white !border !border-orange-200 !shadow-lg">
                    <div className="grid w-[200px] gap-3 p-4 bg-white">
                      {AUTH_MENU_ITEMS.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors text-gray-700 hover:bg-orange-50 hover:text-orange-700 focus:bg-orange-50 focus:text-orange-700"
                        >
                          <div className="text-sm font-medium leading-none">
                            {item.label}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right Side - Icons & Auth */}
          <div className="flex items-center space-x-2">
            {isSignedIn && (
              <>
                {/* Desktop Icons */}
                <div className="hidden md:flex items-center space-x-2">
                  {/* Notifications */}
                  <NotificationDropdown />

                  {/* Favorites */}
                  <Link href="/favorites">
                    <Button variant="ghost" size="icon" className="hover:bg-orange-50">
                      <Heart className="h-5 w-5 text-gray-600 hover:text-orange-600" />
                    </Button>
                  </Link>

                  {/* Review History */}
                  <Link href="/reviews/history">
                    <Button variant="ghost" size="icon" className="hover:bg-orange-50">
                      <Star className="h-5 w-5 text-gray-600 hover:text-orange-600" />
                    </Button>
                  </Link>
                </div>
              </>
            )}

            {/* Authentication */}
            {isSignedIn ? (
              <div className="flex items-center space-x-2">
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8"
                    }
                  }}
                />
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm" className="aharamm-gradient">
                    Sign up
                  </Button>
                </SignUpButton>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-white border-l border-orange-200">
                {/* Accessible title for screen readers */}
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col space-y-4 mt-6">
                  {/* Mobile Logo */}
                  <Link href="/" className="flex items-center space-x-2 mb-6">
                    <Image
                      src="/192x192 Logo.png"
                      alt="Aharamm AI Logo"
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full"
                    />
                    <span className="font-bold text-xl text-gray-900">
                      Aharamm AI
                    </span>
                  </Link>

                  {/* Mobile Icons Menu */}
                  {isSignedIn && !isRestaurantOwner && (
                    <div className="space-y-3 mb-6">
                      {/* Mobile Notifications */}
                      <div className="p-3 rounded-md bg-white shadow-sm">
                        <NotificationDropdown />
                      </div>

                      {/* Mobile Favorites */}
                      <Link href="/favorites" className="flex items-center space-x-2 p-3 rounded-md bg-white shadow-sm hover:shadow-md transition-shadow">
                        <Heart className="h-5 w-5 text-orange-600" />
                        <span className="text-sm font-medium text-gray-700">Favorites</span>
                      </Link>

                      {/* Mobile Review History */}
                      <Link href="/reviews/history" className="flex items-center space-x-2 p-3 rounded-md bg-white shadow-sm hover:shadow-md transition-shadow">
                        <Star className="h-5 w-5 text-orange-600" />
                        <span className="text-sm font-medium text-gray-700">Reviews</span>
                      </Link>
                    </div>
                  )}

                  {/* Mobile Search */}
                  <Button
                    variant="outline"
                    className="justify-start border-orange-200 text-gray-700 hover:bg-orange-50 hover:border-orange-300"
                    onClick={() => setIsSearchOpen(true)}
                  >
                    <Search className="h-4 w-4 mr-2 text-orange-500" />
                    Search restaurants
                  </Button>

                  {/* Mobile Navigation */}
                  <div className="space-y-2">
                    {/* Show different content based on user type */}
                    {!isSignedIn || !isRestaurantOwner ? (
                      <Link 
                        href="/onboarding"
                        className="block py-3 px-4 rounded-md text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                      >
                        Become a Restaurant
                      </Link>
                    ) : (
                      <Link 
                        href="/restaurant-dashboard"
                        className="block py-3 px-4 rounded-md aharamm-gradient text-white hover:opacity-90 transition-opacity"
                      >
                        Restaurant Dashboard
                      </Link>
                    )}
                    
                    {AUTH_MENU_ITEMS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block py-3 px-4 rounded-md text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>

                  {/* Mobile Auth */}
                  {!isSignedIn && (
                    <div className="flex flex-col space-y-2 pt-4 border-t border-orange-200">
                      <SignInButton mode="modal">
                        <Button variant="outline" className="w-full border-orange-200 text-gray-700 hover:bg-orange-50 hover:border-orange-300">
                          <User className="h-4 w-4 mr-2 text-orange-500" />
                          Log in
                        </Button>
                      </SignInButton>
                      <SignUpButton mode="modal">
                        <Button className="w-full aharamm-gradient text-white hover:opacity-90">
                          Sign up
                        </Button>
                      </SignUpButton>
                    </div>
                  )}

                  {isSignedIn && (
                    <div className="pt-4 border-t border-orange-200">
                      <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg">
                        <UserButton 
                          afterSignOutUrl="/"
                          appearance={{
                            elements: {
                              avatarBox: "h-10 w-10"
                            }
                          }}
                        />
                        <div>
                          <div className="font-medium text-sm text-gray-900">
                            {user?.firstName} {user?.lastName}
                          </div>
                          <div className="text-xs text-gray-600">
                            {user?.primaryEmailAddress?.emailAddress}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Search Modal/Overlay would go here */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="flex items-start justify-center min-h-screen pt-16 px-4">
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Search Restaurants</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSearchOpen(false)}
                >
                  ✕
                </Button>
              </div>
              <div className="text-center text-muted-foreground">
                Search functionality will be implemented in Phase 2
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
