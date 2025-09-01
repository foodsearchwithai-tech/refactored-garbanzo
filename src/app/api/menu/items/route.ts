import { NextRequest, NextResponse } from 'next/server';
import { db, menuItems, restaurants, menus, menuCategories } from '@/lib/db';
import { eq, and, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from middleware header
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

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
      return NextResponse.json({
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

    return NextResponse.json({
      success: true,
      items: items.map(item => ({
        ...item,
        price: parseFloat(item.price), // Ensure price is always a number
        preparationTime: item.preparationTime || 0, // Ensure preparationTime is always a number
        category: item.categoryName,
        imageUrl: item.images?.[0] || null, // Primary image for backward compatibility
        imageUrls: item.images || [], // All images
        isAvailable: item.availability === 'available',
        isVegetarian: item.dietaryTags?.includes('vegetarian') || false,
        isVegan: item.dietaryTags?.includes('vegan') || false,
        isGlutenFree: item.dietaryTags?.includes('gluten-free') || false,
        calories: item.nutritionalInfo?.calories || null,
      }))
    });
  } catch (error) {
    console.error('Menu items fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user ID from middleware header
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    const data = await request.json();

    // Get user's restaurant
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.ownerId, userId))
      .limit(1);

    if (!restaurant) {
      return NextResponse.json({ error: 'No restaurant associated with user' }, { status: 404 });
    }

    // Get or create restaurant's menu
    let [menu] = await db
      .select()
      .from(menus)
      .where(eq(menus.restaurantId, restaurant.id))
      .limit(1);

    if (!menu) {
      [menu] = await db.insert(menus).values({
        restaurantId: restaurant.id,
        name: `${restaurant.name} Menu`,
        description: `Menu for ${restaurant.name}`,
      }).returning();
    }

    // Validate required fields
    const { name, price, categoryId } = data;
    if (!name || !price || !categoryId) {
      return NextResponse.json({ 
        error: 'Name, price, and category are required' 
      }, { status: 400 });
    }

    // Verify category belongs to this menu
    const [category] = await db
      .select()
      .from(menuCategories)
      .where(
        and(
          eq(menuCategories.id, categoryId),
          eq(menuCategories.menuId, menu.id)
        )
      )
      .limit(1);

    if (!category) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    // Prepare dietary tags
    const dietaryTags = [];
    if (data.isVegetarian) dietaryTags.push('vegetarian');
    if (data.isVegan) dietaryTags.push('vegan');
    if (data.isGlutenFree) dietaryTags.push('gluten-free');

    // Create menu item with images (already permanent URLs)
    const [newItem] = await db.insert(menuItems).values({
      categoryId: categoryId,
      name: data.name,
      description: data.description || '',
      price: parseFloat(data.price).toFixed(2),
      images: data.imageUrls || [],
      dietaryTags,
      spiceLevel: data.spiceLevel > 0 ? 
        (['mild', 'medium', 'hot', 'extra_hot'] as const)[Math.min(data.spiceLevel - 1, 3)] as 'mild' | 'medium' | 'hot' | 'extra_hot' : null,
      availability: data.isAvailable ? 'available' : 'sold_out',
      nutritionalInfo: data.calories ? { 
        calories: parseInt(data.calories),
        protein: 0,
        carbs: 0,
        fat: 0
      } : null,
      preparationTime: data.preparationTime ? parseInt(data.preparationTime) : null,
    }).returning();

    return NextResponse.json({
      success: true,
      item: newItem
    });
  } catch (error) {
    console.error('Menu item creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create menu item' },
      { status: 500 }
    );
  }
}
