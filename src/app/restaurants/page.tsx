import Header from '@/components/navigation/Header';
import RestaurantDiscovery from '@/components/RestaurantDiscovery';
import AuthRedirect from '@/components/auth/AuthRedirect';

export default function RestaurantsPage() {
  return (
    <AuthRedirect>
      <div className="min-h-screen bg-white">
        <Header />
        
        <main className="flex flex-col">
          {/* Page Header */}
          <section className="py-12 px-4 bg-gradient-to-br from-orange-50 to-white">
            <div className="container mx-auto text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Discover Amazing Restaurants
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Find the perfect dining experience with our AI-powered restaurant discovery platform
              </p>
            </div>
          </section>
          
          {/* Restaurant Discovery Section */}
          <section className="py-16 px-4">
            <div className="container mx-auto">
              <RestaurantDiscovery />
            </div>
          </section>
        </main>
        
        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 px-4 mt-16">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="h-8 w-8 rounded-full aharamm-gradient flex items-center justify-center">
                    <span className="text-white font-bold text-sm">A</span>
                  </div>
                  <span className="font-bold text-xl">Aharamm AI</span>
                </div>
                <p className="text-gray-400 text-sm">
                  AI powered food discovery platform connecting you with the best restaurants and dishes.
                </p>
              </div>
              
              
              
              <div>
                <h3 className="font-semibold mb-4">For Restaurants</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">List Your Restaurant</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Owner Dashboard</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Analytics</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
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
