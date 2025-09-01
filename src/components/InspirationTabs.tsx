'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { INSPIRATION_TABS } from '@/lib/constants';

export default function InspirationTabs() {
  const [activeTab, setActiveTab] = useState<string>(INSPIRATION_TABS[0].id);
  const [searchQuery, setSearchQuery] = useState('');

  const handlePromptClick = (prompt: string) => {
    setSearchQuery(prompt);
    // In Phase 2, this will trigger the actual search
    console.log('Search triggered:', prompt);
  };


  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Get Inspired
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Explore different cuisines and dining experiences. Click on any prompt to start your food discovery journey.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Tab Navigation */}
        <div className="overflow-x-auto">
          <TabsList className="grid w-full grid-cols-7 lg:grid-cols-7 gap-2 h-auto p-2 bg-gray-100 rounded-xl">
            {INSPIRATION_TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex flex-col items-center gap-2 py-4 px-3 rounded-lg text-center min-w-[120px] data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <span className="text-2xl">{tab.emoji}</span>
                <div>
                  <div className="font-semibold text-sm">{tab.label}</div>
                  <div className="text-xs text-gray-500 hidden sm:block">
                    {tab.description.split(' ').slice(0, 2).join(' ')}
                  </div>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {INSPIRATION_TABS.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="space-y-6">
              {/* Active Tab Header */}
              <div className="text-center bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl p-8">
                <div className="text-4xl mb-4">{tab.emoji}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {tab.label}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {tab.description}
                </p>
              </div>

              {/* Prompts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {tab.prompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto p-6 text-left justify-start hover:bg-orange-50 hover:border-orange-200 transition-all duration-200 group"
                    onClick={() => handlePromptClick(prompt)}
                  >
                    <div className="space-y-2 w-full">
                      <div className="flex items-center justify-between">
                        <Search className="h-4 w-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
                        <Badge variant="secondary" className="text-xs">
                          #{index + 1}
                        </Badge>
                      </div>
                      <div className="text-sm font-medium text-gray-900 leading-relaxed">
                        {prompt}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>

              {/* Additional suggestions for active tab */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-lg">{tab.emoji}</span>
                  More {tab.label} Ideas
                </h4>
                <div className="flex flex-wrap gap-2">
                  {/* Generate additional prompts based on category */}
                  {tab.id === 'street_food' && [
                    'Night market food',
                    'Food truck festivals',
                    'Local street vendors',
                    'Quick lunch spots',
                  ].map((suggestion) => (
                    <Badge
                      key={suggestion}
                      variant="outline"
                      className="cursor-pointer hover:bg-orange-50 hover:border-orange-200 transition-colors"
                      onClick={() => handlePromptClick(suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                  
                  {tab.id === 'fine_dining' && [
                    'Anniversary dinner',
                    'Business meetings',
                    'Wine pairing menus',
                    'Luxury experiences',
                  ].map((suggestion) => (
                    <Badge
                      key={suggestion}
                      variant="outline"
                      className="cursor-pointer hover:bg-orange-50 hover:border-orange-200 transition-colors"
                      onClick={() => handlePromptClick(suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                  
                  {tab.id === 'vegan' && [
                    'Raw food restaurants',
                    'Vegan desserts',
                    'Plant-based protein',
                    'Organic ingredients',
                  ].map((suggestion) => (
                    <Badge
                      key={suggestion}
                      variant="outline"
                      className="cursor-pointer hover:bg-orange-50 hover:border-orange-200 transition-colors"
                      onClick={() => handlePromptClick(suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                  
                  {tab.id === 'biryani' && [
                    'Mutton biryani',
                    'Vegetable biryani',
                    'Dum biryani',
                    'Biriyani combos',
                  ].map((suggestion) => (
                    <Badge
                      key={suggestion}
                      variant="outline"
                      className="cursor-pointer hover:bg-orange-50 hover:border-orange-200 transition-colors"
                      onClick={() => handlePromptClick(suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                  
                  {tab.id === 'desserts' && [
                    'Ice cream parlors',
                    'Cake shops',
                    'Chocolate desserts',
                    'Traditional sweets',
                  ].map((suggestion) => (
                    <Badge
                      key={suggestion}
                      variant="outline"
                      className="cursor-pointer hover:bg-orange-50 hover:border-orange-200 transition-colors"
                      onClick={() => handlePromptClick(suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                  
                  {tab.id === 'cafes' && [
                    'Work-friendly cafes',
                    'Breakfast spots',
                    'Tea houses',
                    'Board game cafes',
                  ].map((suggestion) => (
                    <Badge
                      key={suggestion}
                      variant="outline"
                      className="cursor-pointer hover:bg-orange-50 hover:border-orange-200 transition-colors"
                      onClick={() => handlePromptClick(suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                  
                  {tab.id === 'trending' && [
                    'Food influencer spots',
                    'Social media hotspots',
                    'Celebrity chef restaurants',
                    'Viral food challenges',
                  ].map((suggestion) => (
                    <Badge
                      key={suggestion}
                      variant="outline"
                      className="cursor-pointer hover:bg-orange-50 hover:border-orange-200 transition-colors"
                      onClick={() => handlePromptClick(suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>
          ))}
        </div>
      </Tabs>

      {/* Search Preview */}
      {searchQuery && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
          <div className="flex items-center gap-2 text-orange-800">
            <Search className="h-4 w-4" />
            <span className="font-medium">Search Preview:</span>
<span>&ldquo;{searchQuery}&rdquo;</span>
          </div>
          <p className="text-sm text-orange-700 mt-1">
            Click the search button in the hero section to perform this search (Feature coming in Phase 2)
          </p>
        </div>
      )}
    </div>
  );
}
