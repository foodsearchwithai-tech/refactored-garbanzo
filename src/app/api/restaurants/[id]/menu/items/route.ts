import { NextRequest } from 'next/server';
import { db, menuItems, menus, menuCategories } from '@/lib/db';
import { eq, asc } from 'drizzle-orm';
import { handleCors, corsJsonResponse } from '@/lib/cors';

export async function OPTIONS() {
  return handleCors();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params;

    // Get restaurant's menu
    const [menu] = await db
      .select()
      .from(menus)
      .where(eq(menus.restaurantId, restaurantId))
      .limit(1);

    if (!menu) {
      return corsJsonResponse({
        success: true,
        items: []
      });
    }

    // Get menu items with their categories
    const items = await db
      .select({
        id: menuItems.id,
        name: menuItems.name,
        description: menuItems.description,
        price: menuItems.price,
        images: menuItems.images,
        dietaryTags: menuItems.dietaryTags,
        allergens: menuItems.allergens,
        spiceLevel: menuItems.spiceLevel,
        badges: menuItems.badges,
        availability: menuItems.availability,
        nutritionalInfo: menuItems.nutritionalInfo,
        preparationTime: menuItems.preparationTime,
        customizations: menuItems.customizations,
        displayOrder: menuItems.displayOrder,
        isActive: menuItems.isActive,
        createdAt: menuItems.createdAt,
        updatedAt: menuItems.updatedAt,
        categoryId: menuItems.categoryId,
        categoryName: menuCategories.name,
      })
      .from(menuItems)
      .leftJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
      .where(eq(menuCategories.menuId, menu.id))
      .orderBy(asc(menuCategories.displayOrder), asc(menuItems.displayOrder));

    return corsJsonResponse({
      success: true,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: parseFloat(item.price), // Ensure price is always a number
        category: item.categoryName, // Maps to frontend's grouping logic
        categoryId: item.categoryId,
        isAvailable: item.availability === 'available',
        isVegetarian: item.dietaryTags?.includes('vegetarian') || false,
        isVegan: item.dietaryTags?.includes('vegan') || false,
        isGlutenFree: item.dietaryTags?.includes('gluten-free') || false,
        spiceLevel: item.spiceLevel === 'mild' ? 1 : 
                   item.spiceLevel === 'medium' ? 2 :
                   item.spiceLevel === 'hot' ? 3 :
                   item.spiceLevel === 'extra_hot' ? 4 : 0,
        preparationTime: item.preparationTime || 0,
        calories: item.nutritionalInfo?.calories || null,
        imageUrl: item.images?.[0] || null,
        imageUrls: item.images || [],
        // Only show ratings if there are actual reviews
        averageRating: null, // No fake ratings
        totalReviews: 0, // No fake review counts
        reviews: [],
        // Include other fields needed by frontend
        displayOrder: item.displayOrder,
        isActive: item.isActive,
        dietaryTags: item.dietaryTags,
        allergens: item.allergens,
        badges: item.badges,
        nutritionalInfo: item.nutritionalInfo,
        customizations: item.customizations,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }))
    });
  } catch (error) {
    console.error('Menu items fetch error:', error);
    return corsJsonResponse(
      { error: 'Failed to fetch menu items' },
      { status: 500 }
    );
  }
}
