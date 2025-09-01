import { SignIn } from '@clerk/nextjs';

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="h-12 w-12 rounded-full aharamm-gradient flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="font-bold text-2xl text-gray-900">Aharamm AI</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back
          </h2>
          <p className="text-gray-600">
            Sign in to discover amazing restaurants and dishes
          </p>
        </div>
        
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: 'aharamm-gradient hover:opacity-90',
              card: 'shadow-lg',
            },
          }}
        />
      </div>
    </div>
  );
}
