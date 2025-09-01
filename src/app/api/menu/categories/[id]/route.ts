import { NextRequest, NextResponse } from 'next/server';
import { db, menuCategories, restaurants, menus, menuItems } from '@/lib/db';
import { eq, and, sql } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Get user ID from middleware header
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    const data = await request.json();
    const { id: categoryId } = await context.params;

    // Get user's restaurant
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.ownerId, userId))
      .limit(1);

    if (!restaurant) {
      return NextResponse.json({ error: 'No restaurant associated with user' }, { status: 404 });
    }

    // Get restaurant's menu
    const [menu] = await db
      .select()
      .from(menus)
      .where(eq(menus.restaurantId, restaurant.id))
      .limit(1);

    if (!menu) {
      return NextResponse.json({ error: 'No menu found for restaurant' }, { status: 404 });
    }

    // Verify the category belongs to the user's menu
    const [existingCategory] = await db
      .select()
      .from(menuCategories)
      .where(
        and(
          eq(menuCategories.id, categoryId),
          eq(menuCategories.menuId, menu.id)
        )
      )
      .limit(1);

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Update category
    const [updatedCategory] = await db
      .update(menuCategories)
      .set({
        name: data.name || existingCategory.name,
        description: data.description ?? existingCategory.description,
        displayOrder: data.displayOrder ?? existingCategory.displayOrder,
        isActive: data.isActive ?? existingCategory.isActive,
      })
      .where(eq(menuCategories.id, categoryId))
      .returning();

    return NextResponse.json({
      success: true,
      category: updatedCategory
    });
  } catch (error) {
    console.error('Menu category update error:', error);
    return NextResponse.json(
      { error: 'Failed to update menu category' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Get user ID from middleware header
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    const { id: categoryId } = await context.params;

    // Get user's restaurant
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.ownerId, userId))
      .limit(1);

    if (!restaurant) {
      return NextResponse.json({ error: 'No restaurant associated with user' }, { status: 404 });
    }

    // Get restaurant's menu
    const [menu] = await db
      .select()
      .from(menus)
      .where(eq(menus.restaurantId, restaurant.id))
      .limit(1);

    if (!menu) {
      return NextResponse.json({ error: 'No menu found for restaurant' }, { status: 404 });
    }

    // Verify the category belongs to the user's menu
    const [existingCategory] = await db
      .select()
      .from(menuCategories)
      .where(
        and(
          eq(menuCategories.id, categoryId),
          eq(menuCategories.menuId, menu.id)
        )
      )
      .limit(1);

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }


    // Check if category has menu items
    const [itemCount] = await db
      .select({ count: sql`count(*)` })
      .from(menuItems)
      .where(eq(menuItems.categoryId, categoryId));

    if (itemCount && Number(itemCount.count) > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete category that contains menu items. Please move or delete the items first.' 
      }, { status: 400 });
    }

    // Delete category
    await db
      .delete(menuCategories)
      .where(eq(menuCategories.id, categoryId));

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Menu category deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete menu category' },
      { status: 500 }
    );
  }
}
