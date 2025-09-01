import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { favorites, restaurants, menuItems } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { restaurantId, menuItemId, type } = body;

    if (!type || !['restaurant', 'menu_item'].includes(type)) {
      return NextResponse.json({ error: 'Invalid favorite type' }, { status: 400 });
    }

    if (type === 'restaurant' && !restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 });
    }

    if (type === 'menu_item' && !menuItemId) {
      return NextResponse.json({ error: 'Menu item ID is required' }, { status: 400 });
    }

    // Check if already favorited
    const existingFavorite = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.type, type),
          type === 'restaurant' 
            ? eq(favorites.restaurantId, restaurantId)
            : eq(favorites.menuItemId, menuItemId)
        )
      )
      .limit(1);

    if (existingFavorite.length > 0) {
      // Remove from favorites (unfavorite)
      await db
        .delete(favorites)
        .where(eq(favorites.id, existingFavorite[0].id));
      
      return NextResponse.json({ 
        success: true, 
        action: 'removed',
        message: 'Removed from favorites' 
      });
    } else {
      // Add to favorites
      await db.insert(favorites).values({
        userId,
        restaurantId: type === 'restaurant' ? restaurantId : null,
        menuItemId: type === 'menu_item' ? menuItemId : null,
        type,
      });

      return NextResponse.json({ 
        success: true, 
        action: 'added',
        message: 'Added to favorites' 
      });
    }
  } catch (error) {
    console.error('Favorites error:', error);
    return NextResponse.json(
      { error: 'Failed to update favorites' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';

    // Build base conditions with proper null checking
    let conditions = eq(favorites.userId, userId);
    
    if (filter === 'restaurants') {
      const restaurantCondition = and(eq(favorites.userId, userId), eq(favorites.type, 'restaurant'));
      conditions = restaurantCondition ?? eq(favorites.userId, userId);
    } else if (filter === 'menu_items') {
      const menuItemCondition = and(eq(favorites.userId, userId), eq(favorites.type, 'menu_item'));
      conditions = menuItemCondition ?? eq(favorites.userId, userId);
    }

    // Get favorites with restaurant and menu item details
    const userFavorites = await db
      .select({
        id: favorites.id,
        userId: favorites.userId,
        restaurantId: favorites.restaurantId,
        menuItemId: favorites.menuItemId,
        type: favorites.type,
        createdAt: favorites.createdAt,
        // Restaurant details
        restaurantName: restaurants.name,
        restaurantDescription: restaurants.description,
        restaurantCuisineTypes: restaurants.cuisineTypes,
        restaurantCategory: restaurants.category,
        restaurantAddress: restaurants.address,
        restaurantCity: restaurants.city,
        restaurantState: restaurants.state,
        restaurantProfileImage: restaurants.profileImage,
        restaurantCoverImages: restaurants.coverImages,
        restaurantAverageRating: restaurants.averageRating,
        restaurantReviewCount: restaurants.reviewCount,
        // Menu item details
        menuItemName: menuItems.name,
        menuItemDescription: menuItems.description,
        menuItemPrice: menuItems.price,
        menuItemCategoryId: menuItems.categoryId,
        menuItemImages: menuItems.images,
      })
      .from(favorites)
      .leftJoin(restaurants, eq(favorites.restaurantId, restaurants.id))
      .leftJoin(menuItems, eq(favorites.menuItemId, menuItems.id))
      .where(conditions)
      .orderBy(favorites.createdAt);

    return NextResponse.json({
      success: true,
      favorites: userFavorites
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}
