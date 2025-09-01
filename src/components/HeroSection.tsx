'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Camera, Mic } from 'lucide-react';

export default function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextSearch = (query?: string) => {
    const searchTerm = query || searchQuery;
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result?.toString().split(',')[1];
        if (base64) {
          // Navigate to search page with image parameter
          router.push(`/search?q=image-search`);
          
          // Perform the actual search
          const response = await fetch('/api/ai-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageData: base64 }),
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.results.length > 0) {
              // Redirect with proper query
              router.push(`/search?q=${encodeURIComponent(data.aiAnalysis || 'image-search')}`);
            }
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Image search failed:', error);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleImageSearch = () => {
    fileInputRef.current?.click();
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('Voice search is not supported in your browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) {
        setSearchQuery(transcript);
        handleTextSearch(transcript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-50 pt-16 pb-32">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div 
          className="w-full h-full" 
          style={{
            backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f97316' fill-opacity='0.05'%3E%3Ccircle cx='7' cy='7' r='2'/%3E%3Ccircle cx='27' cy='7' r='2'/%3E%3Ccircle cx='47' cy='7' r='2'/%3E%3Ccircle cx='7' cy='27' r='2'/%3E%3Ccircle cx='27' cy='27' r='2'/%3E%3Ccircle cx='47' cy='27' r='2'/%3E%3Ccircle cx='7' cy='47' r='2'/%3E%3Ccircle cx='27' cy='47' r='2'/%3E%3Ccircle cx='47' cy='47' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}
        />
      </div>
      
      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main headline */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              AI powered
            </span>{' '}
            Food Discovery
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Search by typing, speaking, or taking a photo of food. Our AI finds the best restaurants and dishes near you.
          </p>

          {/* AI Search Interface */}
          <div className="w-full max-w-2xl mx-auto">
            {/* Search Input */}
            <div className="flex items-center gap-2 p-3 bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="flex-1 flex items-center space-x-3 px-3">
                <Search className="h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Type what you're craving or describe a dish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTextSearch()}
                  className="border-0 p-0 text-base placeholder:text-gray-400 focus-visible:ring-0 bg-transparent"
                />
              </div>

              {/* Search Method Buttons */}
              <div className="flex items-center gap-2">
                {/* Hidden file input for image upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {/* Voice Search */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleVoiceSearch}
                  className={`p-2 rounded-lg hover:bg-orange-50 transition-colors ${
                    isListening ? 'text-red-500' : 'text-orange-600'
                  }`}
                  title="Voice search"
                  disabled={isListening}
                >
                  <Mic className="h-4 w-4" />
                </Button>

                {/* Image Search */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleImageSearch}
                  className="p-2 rounded-lg hover:bg-orange-50 text-orange-600 transition-colors"
                  title="Search by image"
                  disabled={isProcessingImage}
                >
                  <Camera className="h-4 w-4" />
                </Button>

                {/* Text Search Button */}
                <Button
                  type="button"
                  onClick={() => handleTextSearch()}
                  disabled={!searchQuery.trim()}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Examples */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-gray-500 mr-2">Try:</span>
            {[
              '🍕 "Spicy pizza"', 
              '🍛 "Chicken biryani"', 
              '🥗 "Healthy salad"', 
              '🍔 "Burger and fries"',
              '🍜 "Ramen noodles"'
            ].map((example) => (
              <Button
                key={example}
                variant="outline"
                size="sm"
                className="rounded-full text-sm hover:bg-orange-50 hover:border-orange-200 transition-colors"
                onClick={() => {
                  const text = example.replace(/[🍕🍛🥗🍔🍜]/g, '').replace(/"/g, '').trim();
                  setSearchQuery(text);
                  handleTextSearch(text);
                }}
              >
                {example}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
