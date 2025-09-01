import { NextRequest } from 'next/server';
import { db, menuCategories, menus } from '@/lib/db';
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
        categories: []
      });
    }

    // Get menu categories
    const categories = await db
      .select({
        id: menuCategories.id,
        name: menuCategories.name,
        description: menuCategories.description,
        displayOrder: menuCategories.displayOrder,
        isActive: menuCategories.isActive,
      })
      .from(menuCategories)
      .where(eq(menuCategories.menuId, menu.id))
      .orderBy(asc(menuCategories.displayOrder));

    return corsJsonResponse({
      success: true,
      categories: categories.filter(cat => cat.isActive)
    });
  } catch (error) {
    console.error('Menu categories fetch error:', error);
    return corsJsonResponse(
      { error: 'Failed to fetch menu categories' },
      { status: 500 }
    );
  }
}
