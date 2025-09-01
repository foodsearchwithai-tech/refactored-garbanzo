import { NextRequest, NextResponse } from 'next/server';
import { db, menuItems, restaurants, menus, menuCategories } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

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
    const { id: itemId } = await context.params;

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

    // Verify the menu item belongs to the user's menu
    const [existingItem] = await db
      .select({
        menuItem: menuItems,
        categoryId: menuCategories.id,
        menuId: menuCategories.menuId
      })
      .from(menuItems)
      .leftJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
      .where(
        and(
          eq(menuItems.id, itemId),
          eq(menuCategories.menuId, menu.id)
        )
      )
      .limit(1);

    if (!existingItem) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    // If updating category, verify new category belongs to this menu
    if (data.categoryId && data.categoryId !== existingItem.categoryId) {
      const [newCategory] = await db
        .select()
        .from(menuCategories)
        .where(
          and(
            eq(menuCategories.id, data.categoryId),
            eq(menuCategories.menuId, menu.id)
          )
        )
        .limit(1);

      if (!newCategory) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      }
    }

    // Prepare dietary tags
    const dietaryTags = [];
    if (data.isVegetarian ?? existingItem.menuItem.dietaryTags?.includes('vegetarian')) {
      dietaryTags.push('vegetarian');
    }
    if (data.isVegan ?? existingItem.menuItem.dietaryTags?.includes('vegan')) {
      dietaryTags.push('vegan');
    }
    if (data.isGlutenFree ?? existingItem.menuItem.dietaryTags?.includes('gluten-free')) {
      dietaryTags.push('gluten-free');
    }

    // Handle image URLs - use as provided (already permanent)
    const finalImageUrls = data.imageUrls || existingItem.menuItem.images || [];

    // Update menu item
    const [updatedItem] = await db
      .update(menuItems)
      .set({
        categoryId: data.categoryId || existingItem.menuItem.categoryId,
        name: data.name || existingItem.menuItem.name,
        description: data.description ?? existingItem.menuItem.description,
        price: data.price !== undefined ? parseFloat(data.price).toFixed(2) : existingItem.menuItem.price,
        images: finalImageUrls, // Use final image URLs
        dietaryTags,
        spiceLevel: data.spiceLevel !== undefined && data.spiceLevel > 0 ? 
          (['mild', 'medium', 'hot', 'extra_hot'][Math.min(data.spiceLevel - 1, 3)] as 'mild' | 'medium' | 'hot' | 'extra_hot') : 
          existingItem.menuItem.spiceLevel,
        availability: data.isAvailable !== undefined ? 
          (data.isAvailable ? 'available' : 'sold_out') : 
          existingItem.menuItem.availability,
        nutritionalInfo: data.calories !== undefined ? 
          (data.calories ? { 
            calories: parseInt(data.calories),
            protein: existingItem.menuItem.nutritionalInfo?.protein || 0,
            carbs: existingItem.menuItem.nutritionalInfo?.carbs || 0,
            fat: existingItem.menuItem.nutritionalInfo?.fat || 0
          } : null) : 
          existingItem.menuItem.nutritionalInfo,
        preparationTime: data.preparationTime !== undefined ? 
          (data.preparationTime ? parseInt(data.preparationTime) : null) : 
          existingItem.menuItem.preparationTime,
      })
      .where(eq(menuItems.id, itemId))
      .returning();

    return NextResponse.json({
      success: true,
      item: updatedItem
    });
  } catch (error) {
    console.error('Menu item update error:', error);
    return NextResponse.json(
      { error: 'Failed to update menu item' },
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

    const { id: itemId } = await context.params;

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

    // Verify the menu item belongs to the user's menu
    const [existingItem] = await db
      .select({
        menuItem: menuItems,
        menuId: menuCategories.menuId
      })
      .from(menuItems)
      .leftJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
      .where(
        and(
          eq(menuItems.id, itemId),
          eq(menuCategories.menuId, menu.id)
        )
      )
      .limit(1);

    if (!existingItem) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    // Delete associated images from Vercel Blob
    if (existingItem.menuItem.images && existingItem.menuItem.images.length > 0) {
      for (const imageUrl of existingItem.menuItem.images) {
        try {
          await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/upload?url=${encodeURIComponent(imageUrl)}`, {
            method: 'DELETE',
            headers: {
              'x-user-id': userId,
            },
          });
        } catch (imageDeleteError) {
          console.error('Error deleting image:', imageUrl, imageDeleteError);
          // Continue with menu item deletion even if image deletion fails
        }
      }
    }

    // Delete menu item
    await db
      .delete(menuItems)
      .where(eq(menuItems.id, itemId));

    return NextResponse.json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    console.error('Menu item deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete menu item' },
      { status: 500 }
    );
  }
}
