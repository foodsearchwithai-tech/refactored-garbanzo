'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Utensils,
  DollarSign,
  Clock,
  Search,
  Star,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Image from 'next/image';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  categoryId?: string;
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  spiceLevel: number;
  preparationTime: number;
  calories?: number;
  imageUrl?: string; // Primary image for backward compatibility
  imageUrls?: string[]; // Multiple images
  createdAt: string;
  updatedAt: string;
}

interface MenuCategory {
  id: string;
  name: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
}

export default function MenuManagement() {
  const { } = useUser();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<Record<string, number>>({});
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState<string>('');

  // Custom Toggle Component
  const CustomToggle = ({ checked, onToggle, showLabel = false }: { checked: boolean; onToggle: () => void; showLabel?: boolean }) => (
    <div className="flex items-center space-x-2">
      {showLabel && (
        <span className={`text-xs font-medium transition-colors ${checked ? 'text-green-600' : 'text-red-600'}`}>
          {checked ? 'Available' : 'Unavailable'}
        </span>
      )}
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
          checked 
            ? 'bg-gradient-to-r from-orange-400 to-orange-500 shadow-lg' 
            : 'bg-gray-300 shadow-inner'
        }`}
      >
        <span
          className={`flex h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform items-center justify-center ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        >
          {checked ? (
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          ) : (
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          )}
        </span>
      </button>
    </div>
  );

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    isAvailable: true,
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    spiceLevel: 0,
    preparationTime: '',
    calories: '',
    imageFiles: [] as File[], // Multiple image files
    imageUrls: [] as string[] // Multiple image URLs
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    displayOrder: '',
    isActive: true
  });

  useEffect(() => {
    fetchMenuData();
  }, []);

  const fetchMenuData = async () => {
    try {
      const [itemsResponse, categoriesResponse] = await Promise.all([
        fetch('/api/menu/items'),
        fetch('/api/menu/categories')
      ]);

      if (itemsResponse.ok && categoriesResponse.ok) {
        const itemsData = await itemsResponse.json();
        const categoriesData = await categoriesResponse.json();
        
        setMenuItems(itemsData.items || []);
        setCategories(categoriesData.categories || []);
      }
    } catch (error) {
      console.error('Error fetching menu data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMultipleImageUpload = async (files: File[]) => {
    if (!files || files.length === 0) return [];

    setIsUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const timestamp = Date.now();
        const filename = `menu-items/${timestamp}-${file.name}`;

        const response = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}&entityType=menu_item`, {
          method: 'POST',
          headers: {
            'Content-Type': file.type,
          },
          body: file,
        });

        if (response.ok) {
          const data = await response.json();
          return data.url;
        } else {
          console.error('Upload failed:', await response.text());
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter(url => url !== null);
      
      return successfulUploads;
    } catch (error) {
      console.error('Error uploading images:', error);
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      alert('Please enter a menu item name.');
      return;
    }
    
    if (!formData.categoryId) {
      alert('Please select a category.');
      return;
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      alert('Please enter a valid price.');
      return;
    }
    
    // Upload new images if any
    let uploadedUrls: string[] = [];
    if (formData.imageFiles.length > 0) {
      uploadedUrls = await handleMultipleImageUpload(formData.imageFiles);
      if (uploadedUrls.length === 0) {
        alert('Failed to upload images. Please try again.');
        return;
      }
    }

    // Combine existing, temporary, and newly uploaded image URLs
    const allImageUrls = [...formData.imageUrls, ...uploadedUrls];

    const itemData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      categoryId: formData.categoryId,
      isAvailable: formData.isAvailable,
      isVegetarian: formData.isVegetarian,
      isVegan: formData.isVegan,
      isGlutenFree: formData.isGlutenFree,
      spiceLevel: formData.spiceLevel,
      preparationTime: parseInt(formData.preparationTime),
      calories: parseInt(formData.calories) || null,
      imageUrls: allImageUrls // Send all image URLs
    };

    try {
      const response = await fetch(
        editingItem ? `/api/menu/items/${editingItem.id}` : '/api/menu/items',
        {
          method: editingItem ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData),
        }
      );

      if (response.ok) {
        await fetchMenuData();
        closeDialog();
        // Show success message
        const action = editingItem ? 'updated' : 'created';
        alert(`Menu item ${action} successfully!`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save menu item');
      }
    } catch (error) {
      console.error('Error saving menu item:', error);
      alert('Failed to save menu item');
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const categoryData = {
      name: categoryForm.name,
      description: categoryForm.description,
      displayOrder: parseInt(categoryForm.displayOrder),
      isActive: categoryForm.isActive
    };

    try {
      const response = await fetch(
        editingCategory ? `/api/menu/categories/${editingCategory.id}` : '/api/menu/categories',
        {
          method: editingCategory ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryData),
        }
      );

      if (response.ok) {
        await fetchMenuData();
        closeCategoryDialog();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category');
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      const response = await fetch(`/api/menu/items/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchMenuData();
      } else {
        alert('Failed to delete menu item');
      }
    } catch (error) {
      console.error('Error deleting menu item:', error);
      alert('Failed to delete menu item');
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      const response = await fetch(`/api/menu/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, isAvailable: !item.isAvailable }),
      });

      if (response.ok) {
        await fetchMenuData();
      } else {
        alert('Failed to update item availability');
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Failed to update item availability');
    }
  };

  const openDialog = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description,
        price: typeof item.price === 'number' ? item.price.toString() : String(item.price || '0'),
        categoryId: item.categoryId || '',
        isAvailable: item.isAvailable,
        isVegetarian: item.isVegetarian,
        isVegan: item.isVegan,
        isGlutenFree: item.isGlutenFree,
        spiceLevel: item.spiceLevel,
        preparationTime: (item.preparationTime || 0).toString(),
        calories: item.calories?.toString() || '',
        imageFiles: [],
        imageUrls: item.imageUrl ? [item.imageUrl] : (item.imageUrls || [])
      });
      // Set image previews if editing
      const existingImages = item.imageUrl ? [item.imageUrl] : (item.imageUrls || []);
      setImagePreviews(existingImages);
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        categoryId: '',
        isAvailable: true,
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: false,
        spiceLevel: 0,
        preparationTime: '',
        calories: '',
        imageFiles: [],
        imageUrls: []
      });
      // Clear image previews
      setImagePreviews([]);
    }
    
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    // Clean up any blob URLs created for previews
    imagePreviews.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    
    setIsDialogOpen(false);
    setEditingItem(null);
    setImagePreviews([]);
  };

  const openCategoryDialog = (category?: MenuCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description,
        displayOrder: category.displayOrder.toString(),
        isActive: category.isActive
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        description: '',
        displayOrder: '',
        isActive: true
      });
    }
    setIsCategoryDialogOpen(true);
  };

  const closeCategoryDialog = () => {
    setIsCategoryDialogOpen(false);
    setEditingCategory(null);
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedItems = categories.reduce((acc, category) => {
    const categoryItems = filteredItems.filter(item => item.category === category.name);
    if (categoryItems.length > 0) {
      acc[category.name] = categoryItems;
    }
    return acc;
  }, {} as Record<string, MenuItem[]>);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Menu Management</h1>
              <p className="text-gray-600 text-sm md:text-base">Manage your restaurant&apos;s menu items and categories</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => openCategoryDialog()}
                variant="outline"
                className="order-2 sm:order-1 border-orange-200 text-orange-700 hover:bg-orange-50 transition-all duration-200"
                size="lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
              <Button 
                onClick={() => openDialog()} 
                className="order-1 sm:order-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                size="lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Menu Item
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-orange-200 focus:border-orange-500 focus:ring-orange-200 transition-all duration-200"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48 border-orange-200 focus:border-orange-500 focus:ring-orange-200 transition-all duration-200">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8">
            <Card className="border-orange-100 bg-gradient-to-br from-white to-orange-50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Utensils className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Items</p>
                    <p className="text-2xl font-bold text-gray-900">{menuItems.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-100 bg-gradient-to-br from-white to-orange-50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Eye className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Available</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {menuItems.filter(item => item.isAvailable).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-100 bg-gradient-to-br from-white to-orange-50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <EyeOff className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Unavailable</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {menuItems.filter(item => !item.isAvailable).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-100 bg-gradient-to-br from-white to-orange-50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Star className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Categories</p>
                    <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Menu Items by Category */}
        {Object.keys(groupedItems).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedItems).map(([categoryName, items]) => (
              <Card key={categoryName} className="border-orange-100 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl text-gray-900">{categoryName}</CardTitle>
                    <Badge variant="outline" className="border-orange-200 text-orange-700">
                      {items.length} items
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                    {items.map((item) => (
                      <Card key={item.id} className="border border-gray-200 hover:border-orange-300 transition-all duration-200 hover:shadow-lg">
                        <CardContent className="p-4">
                          {/* Image */}
                          <div className="relative h-48 bg-gray-100 rounded-lg mb-4 overflow-hidden">
                            {(() => {
                              const images = item.imageUrls && item.imageUrls.length > 0 
                                ? item.imageUrls 
                                : item.imageUrl 
                                ? [item.imageUrl] 
                                : [];
                              
                              const currentIndex = currentImageIndex[item.id] || 0;
                              const currentImage = images[currentIndex];

                              return images.length > 0 ? (
                                <>
                                  <div 
                                    className="cursor-pointer w-full h-full"
                                    onClick={() => {
                                      setModalImage(currentImage);
                                      setImageModalOpen(true);
                                    }}
                                  >
                                    <Image
                                      src={currentImage}
                                      alt={item.name}
                                      fill
                                      className="object-contain hover:scale-105 transition-transform duration-300 p-2"
                                    />
                                  </div>
                                  
                                  {/* Image Navigation */}
                                  {images.length > 1 && (
                                    <>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
                                          setCurrentImageIndex(prev => ({ ...prev, [item.id]: newIndex }));
                                        }}
                                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors z-10"
                                      >
                                        <ChevronLeft className="h-4 w-4" />
                                      </button>
                                      
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
                                          setCurrentImageIndex(prev => ({ ...prev, [item.id]: newIndex }));
                                        }}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors z-10"
                                      >
                                        <ChevronRight className="h-4 w-4" />
                                      </button>
                                      
                                      {/* Image Indicators */}
                                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 z-10">
                                        {images.map((_, index) => (
                                          <button
                                            key={index}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setCurrentImageIndex(prev => ({ ...prev, [item.id]: index }));
                                            }}
                                            className={`w-2 h-2 rounded-full transition-colors ${
                                              index === currentIndex ? 'bg-white' : 'bg-white/50'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                    </>
                                  )}
                                </>
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <Utensils className="h-8 w-8 text-gray-400" />
                                </div>
                              );
                            })()}
                          </div>

                          {/* Content */}
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-gray-900 line-clamp-2 leading-tight">
                                {item.name}
                              </h3>
                              <div className="flex items-center space-x-2 flex-shrink-0">
                                <CustomToggle
                                  checked={item.isAvailable}
                                  onToggle={() => toggleAvailability(item)}
                                  showLabel={true}
                                />
                              </div>
                            </div>

                            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                <span className="font-semibold text-green-600">
                                  {typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(item.price || '0').toFixed(2)}
                                </span>
                              </div>
                              {(item.preparationTime || 0) > 0 && (
                                <div className="flex items-center space-x-1 text-sm text-gray-500">
                                  <Clock className="h-4 w-4" />
                                  <span>{item.preparationTime}min</span>
                                </div>
                              )}
                            </div>

                            {/* Dietary Badges */}
                            <div className="flex flex-wrap gap-1">
                              {item.isVegetarian && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  Vegetarian
                                </Badge>
                              )}
                              {item.isVegan && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  Vegan
                                </Badge>
                              )}
                              {item.isGlutenFree && (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  Gluten-Free
                                </Badge>
                              )}
                              {item.spiceLevel > 0 && (
                                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                  🌶️ {item.spiceLevel}/5
                                </Badge>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDialog(item)}
                                className="flex-1 border-orange-200 text-orange-700 hover:bg-orange-50"
                              >
                                <Edit3 className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(item.id)}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-orange-100 shadow-lg">
            <CardContent className="p-8 sm:p-12 text-center">
              <Utensils className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Menu Items Found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'No items match your current filters. Try adjusting your search or category filter.'
                  : 'Start building your menu by adding your first menu item.'
                }
              </p>
              {!searchTerm && selectedCategory === 'all' && (
                <Button 
                  onClick={() => openDialog()} 
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Menu Item
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Menu Item Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {editingItem ? 'Update the details of this menu item.' : 'Add a new item to your menu.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700 font-medium">Item Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price" className="text-gray-700 font-medium">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    className="bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-700 font-medium">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-200"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-gray-700 font-medium">Category *</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  >
                    <SelectTrigger className="bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-200">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300">
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preparationTime" className="text-gray-700 font-medium">Prep Time (minutes)</Label>
                  <Input
                    id="preparationTime"
                    type="number"
                    min="0"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                    className="bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="calories" className="text-gray-700 font-medium">Calories</Label>
                  <Input
                    id="calories"
                    type="number"
                    min="0"
                    value={formData.calories}
                    onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                    className="bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="spiceLevel" className="text-gray-700 font-medium">Spice Level (0-5)</Label>
                  <Select
                    value={formData.spiceLevel.toString()}
                    onValueChange={(value) => setFormData({ ...formData, spiceLevel: parseInt(value) })}
                  >
                    <SelectTrigger className="bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300">
                      {[0, 1, 2, 3, 4, 5].map((level) => (
                        <SelectItem key={level} value={level.toString()}>
                          {level === 0 ? 'Not Spicy' : `${'🌶️'.repeat(level)} Level ${level}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image" className="text-gray-700 font-medium">Item Images</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      // Create local preview URLs for immediate display
                      const previewUrls = files.map(file => URL.createObjectURL(file));
                      setImagePreviews(prev => [...prev, ...previewUrls]);
                      
                      // Store the actual files for upload when saving
                      setFormData(prev => ({
                        ...prev,
                        imageFiles: [...prev.imageFiles, ...files]
                      }));
                      
                      // Clear the file input
                      e.target.value = '';
                    }
                  }}
                  className="bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-200"
                  disabled={isUploading}
                />
                
                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">
                      Images ({imagePreviews.length}):
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={`${preview}-${index}`} className="relative">
                          <div className="relative h-24 w-full rounded-lg overflow-hidden border border-gray-200">
                            <Image 
                              src={preview} 
                              alt={`Preview ${index + 1}`} 
                              fill 
                              className="object-cover" 
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Remove from previews
                              const newPreviews = imagePreviews.filter((_, i) => i !== index);
                              setImagePreviews(newPreviews);
                              
                              // Clean up blob URL if it's a local preview
                              if (preview.startsWith('blob:')) {
                                URL.revokeObjectURL(preview);
                              }
                              
                              // Update form data
                              if (preview.startsWith('blob:')) {
                                // Remove from imageFiles
                                const newImageFiles = [...formData.imageFiles];
                                newImageFiles.splice(index - formData.imageUrls.length, 1);
                                setFormData(prev => ({ ...prev, imageFiles: newImageFiles }));
                              } else {
                                // Remove from existing imageUrls
                                const newUrls = formData.imageUrls.filter(url => url !== preview);
                                setFormData(prev => ({ ...prev, imageUrls: newUrls }));
                              }
                            }}
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 bg-red-500 text-white hover:bg-red-600 border-0"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-2">
                      Images will be uploaded when you save the menu item
                    </p>
                  </div>
                )}
                
                {isUploading && (
                  <div className="flex items-center space-x-2 text-sm text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Uploading images...</span>
                  </div>
                )}
              </div>

              <Separator className="bg-gray-200" />

              {/* Dietary Options */}
              <div className="space-y-4 bg-white">
                <h4 className="font-medium text-gray-900">Dietary Options</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <CustomToggle
                      checked={formData.isVegetarian}
                      onToggle={() => setFormData({ ...formData, isVegetarian: !formData.isVegetarian })}
                    />
                    <Label htmlFor="vegetarian" className="text-gray-700">Vegetarian</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <CustomToggle
                      checked={formData.isVegan}
                      onToggle={() => setFormData({ ...formData, isVegan: !formData.isVegan })}
                    />
                    <Label htmlFor="vegan" className="text-gray-700">Vegan</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <CustomToggle
                      checked={formData.isGlutenFree}
                      onToggle={() => setFormData({ ...formData, isGlutenFree: !formData.isGlutenFree })}
                    />
                    <Label htmlFor="glutenFree" className="text-gray-700">Gluten-Free</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <CustomToggle
                      checked={formData.isAvailable}
                      onToggle={() => setFormData({ ...formData, isAvailable: !formData.isAvailable })}
                    />
                    <Label htmlFor="available" className="text-gray-700">Available</Label>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={closeDialog}
                  className="border-gray-300"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white" 
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : editingItem ? 'Update Item' : 'Add Item'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Category Dialog */}
        <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
          <DialogContent className="bg-white border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {editingCategory ? 'Update the category details.' : 'Create a new menu category.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCategorySubmit} className="space-y-4 bg-white">
              <div className="space-y-2">
                <Label htmlFor="categoryName" className="text-gray-700 font-medium">Category Name *</Label>
                <Input
                  id="categoryName"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  required
                  className="bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryDescription" className="text-gray-700 font-medium">Description</Label>
                <Textarea
                  id="categoryDescription"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  rows={2}
                  className="bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayOrder" className="text-gray-700 font-medium">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  min="0"
                  value={categoryForm.displayOrder}
                  onChange={(e) => setCategoryForm({ ...categoryForm, displayOrder: e.target.value })}
                  className="bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-200"
                />
              </div>

              <div className="flex items-center space-x-2">
                <CustomToggle
                  checked={categoryForm.isActive}
                  onToggle={() => setCategoryForm({ ...categoryForm, isActive: !categoryForm.isActive })}
                />
                <Label htmlFor="categoryActive" className="text-gray-700">Active</Label>
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={closeCategoryDialog}
                  className="border-gray-300"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                >
                  {editingCategory ? 'Update Category' : 'Add Category'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Image Modal */}
        <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-black/90 border-0">
            <div className="relative w-full h-full flex items-center justify-center">
              <button
                onClick={() => setImageModalOpen(false)}
                className="absolute top-4 right-4 z-20 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
              >
                ×
              </button>
              {modalImage && (
                <div className="relative w-full h-[80vh] flex items-center justify-center">
                  <Image
                    src={modalImage}
                    alt="Full size view"
                    fill
                    className="object-contain"
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}