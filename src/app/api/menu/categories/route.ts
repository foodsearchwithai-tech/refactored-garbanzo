import { NextRequest, NextResponse } from 'next/server';
import { db, menuCategories, restaurants, menus } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

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
        categories: []
      });
    }

    // Get menu categories
    const categories = await db
      .select()
      .from(menuCategories)
      .where(eq(menuCategories.menuId, menu.id))
      .orderBy(menuCategories.displayOrder, menuCategories.name);

    return NextResponse.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Menu categories fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu categories' },
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
    const { name } = data;
    if (!name) {
      return NextResponse.json({ 
        error: 'Category name is required' 
      }, { status: 400 });
    }

    // Check if category with same name already exists for this menu
    const [existingCategory] = await db
      .select()
      .from(menuCategories)
      .where(
        and(
          eq(menuCategories.menuId, menu.id),
          eq(menuCategories.name, name)
        )
      )
      .limit(1);

    if (existingCategory) {
      return NextResponse.json({ 
        error: 'A category with this name already exists' 
      }, { status: 400 });
    }

    // Create menu category
    const [newCategory] = await db.insert(menuCategories).values({
      menuId: menu.id,
      name: data.name,
      description: data.description || '',
      displayOrder: data.displayOrder || 0,
      isActive: data.isActive ?? true,
    }).returning();

    return NextResponse.json({
      success: true,
      category: newCategory
    });
  } catch (error) {
    console.error('Menu category creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create menu category' },
      { status: 500 }
    );
  }
}
