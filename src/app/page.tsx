import Header from '@/components/navigation/Header';
import HeroSection from '@/components/HeroSection';
import AuthRedirect from '@/components/auth/AuthRedirect';
import Image from 'next/image';

export default function Home() {
  return (
    <AuthRedirect>
      <div className="min-h-screen bg-white">
      <Header />
      
      <main className="flex flex-col">
        {/* Hero Section */}
        <HeroSection />
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 mt-16">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Image
                  src="/192x192 Logo.png"
                  alt="Aharamm AI Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <span className="font-bold text-xl">Aharamm AI</span>
              </div>
              <p className="text-gray-400 text-sm">
                AI powered food discovery platform connecting you with the best restaurants and dishes.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">For Restaurants</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/restaurant-dashboard" className="hover:text-white transition-colors">List Your Restaurant</a></li>
                <li><a href="/restaurant-dashboard" className="hover:text-white transition-colors">Owner Dashboard</a></li>
                <li><a href="/restaurant-dashboard" className="hover:text-white transition-colors">Analytics</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 Aharamm AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
    </AuthRedirect>
  );
}