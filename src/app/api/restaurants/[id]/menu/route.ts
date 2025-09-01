import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { menus, menuCategories, menuItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params;

    // Get menu with categories and items
    const menuData = await db
      .select()
      .from(menus)
      .leftJoin(menuCategories, eq(menus.id, menuCategories.menuId))
      .leftJoin(menuItems, eq(menuCategories.id, menuItems.categoryId))
      .where(eq(menus.restaurantId, restaurantId));

    // Group data into structured format
    const categoriesMap = new Map();
    
    menuData.forEach((row) => {
      if (row.menu_categories) {
        const categoryId = row.menu_categories.id;
        
        if (!categoriesMap.has(categoryId)) {
          categoriesMap.set(categoryId, {
            id: categoryId,
            name: row.menu_categories.name,
            description: row.menu_categories.description,
            items: []
          });
        }
        
        if (row.menu_items) {
          categoriesMap.get(categoryId).items.push({
            id: row.menu_items.id,
            name: row.menu_items.name,
            description: row.menu_items.description,
            price: row.menu_items.price,
            images: row.menu_items.images || [],
            dietaryTags: row.menu_items.dietaryTags || [],
            spiceLevel: row.menu_items.spiceLevel,
            preparationTime: row.menu_items.preparationTime,
            availability: row.menu_items.availability,
            categoryId: categoryId,
            categoryName: row.menu_categories.name
          });
        }
      }
    });

    const categories = Array.from(categoriesMap.values());

    return NextResponse.json({
      success: true,
      categories
    });

  } catch (error) {
    console.error('Error fetching restaurant menu:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu' },
      { status: 500 }
    );
  }
}
