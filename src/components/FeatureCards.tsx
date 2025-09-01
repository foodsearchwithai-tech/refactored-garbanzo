'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bot, Store, Percent } from 'lucide-react';
import { FEATURE_CARDS } from '@/lib/constants';

const iconMap = {
  '🤖': Bot,
  '🏪': Store, 
  '🎯': Percent,
};

export default function FeatureCards() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Discover Food with AI
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
From personalized recommendations to verified restaurants and exclusive deals, we&apos;ve got everything you need for the perfect dining experience.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {FEATURE_CARDS.map((feature, index) => {
          const IconComponent = iconMap[feature.icon as keyof typeof iconMap];
          
          return (
            <Card 
              key={feature.id} 
              className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 feature-card-glow bg-white"
            >
              <CardContent className="p-8">
                <div className="space-y-6">
                  {/* Icon */}
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      {IconComponent && (
                        <IconComponent className="h-8 w-8 text-orange-600" />
                      )}
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{index + 1}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="pt-4">
                    <Button
                      variant="ghost"
                      className="p-0 h-auto text-orange-600 hover:text-orange-700 font-semibold group/btn"
                      asChild
                    >
                      <Link href={feature.href}>
                        Learn more
                        <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional features grid */}
      <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="text-center p-6 rounded-xl bg-gray-50">
          <div className="text-2xl mb-2">🚀</div>
          <div className="font-semibold text-gray-900 mb-1">Fast Search</div>
          <div className="text-sm text-gray-600">Lightning quick results</div>
        </div>
        
        <div className="text-center p-6 rounded-xl bg-gray-50">
          <div className="text-2xl mb-2">✅</div>
          <div className="font-semibold text-gray-900 mb-1">Verified</div>
          <div className="text-sm text-gray-600">Authentic restaurants only</div>
        </div>
        
        <div className="text-center p-6 rounded-xl bg-gray-50">
          <div className="text-2xl mb-2">💎</div>
          <div className="font-semibold text-gray-900 mb-1">Premium</div>
          <div className="text-sm text-gray-600">Curated dining experiences</div>
        </div>
        
        <div className="text-center p-6 rounded-xl bg-gray-50">
          <div className="text-2xl mb-2">🎯</div>
          <div className="font-semibold text-gray-900 mb-1">Personalized</div>
          <div className="text-sm text-gray-600">Tailored to your taste</div>
        </div>
      </div>
    </div>
  );
}
