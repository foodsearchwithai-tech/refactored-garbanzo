import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, restaurantMessages, messageRecipients, restaurants, userOrigin, favorites } from '@/lib/db';
import { eq, and, sql } from 'drizzle-orm';

// Helper function to calculate distance between two points in kilometers
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in kilometers
  return Math.round(d * 100) / 100; // Round to 2 decimal places
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// POST - Send message to nearby users and favorites
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      message,
      messageType = 'offer',
      offerDetails = {},
      targetRadiusKm = 10,
      expiresAt
    } = body;

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json({
        error: 'Title and message are required'
      }, { status: 400 });
    }

    // Get restaurant owned by this user
    const userRestaurants = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.ownerId, userId))
      .limit(1);

    if (userRestaurants.length === 0) {
      return NextResponse.json({
        error: 'No restaurant found for this user'
      }, { status: 404 });
    }

    const restaurant = userRestaurants[0];

    // Validate restaurant has coordinates
    if (!restaurant.latitude || !restaurant.longitude) {
      return NextResponse.json({
        error: 'Restaurant location coordinates are required to send messages'
      }, { status: 400 });
    }

    const restaurantLat = parseFloat(restaurant.latitude);
    const restaurantLng = parseFloat(restaurant.longitude);

    // Create the message
    const createdMessage = await db
      .insert(restaurantMessages)
      .values({
        restaurantId: restaurant.id,
        senderId: userId,
        title,
        message,
        messageType,
        offerDetails,
        targetRadiusKm,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      })
      .returning();

    const messageId = createdMessage[0].id;

    // Find nearby users based on their origin location
    const nearbyUsers = await db.execute(sql`
      SELECT uo.user_id, uo.latitude, uo.longitude, uo.city, uo.state
      FROM user_origin uo
      JOIN users u ON uo.user_id = u.id
      WHERE u.user_type = 'customer'
      AND uo.latitude IS NOT NULL 
      AND uo.longitude IS NOT NULL
      AND u.id != ${userId}
    `);

    // Find users who have favorited this restaurant
    const favoriteUsers = await db
      .select({
        userId: favorites.userId,
        latitude: userOrigin.latitude,
        longitude: userOrigin.longitude,
      })
      .from(favorites)
      .leftJoin(userOrigin, eq(favorites.userId, userOrigin.userId))
      .where(and(
        eq(favorites.restaurantId, restaurant.id),
        eq(favorites.type, 'restaurant')
      ));

    const recipients: Array<{
      userId: string;
      recipientType: 'nearby' | 'favorite';
      distanceKm?: number;
    }> = [];

    // Process nearby users
    for (const user of nearbyUsers.rows) {
      if (user.latitude && user.longitude) {
        const userLat = parseFloat(user.latitude.toString());
        const userLng = parseFloat(user.longitude.toString());
        const distance = calculateDistance(restaurantLat, restaurantLng, userLat, userLng);
        
        if (distance <= targetRadiusKm) {
          recipients.push({
            userId: String(user.user_id),
            recipientType: 'nearby',
            distanceKm: distance
          });
        }
      }
    }

    // Process favorite users (include them regardless of distance)
    for (const favoriteUser of favoriteUsers) {
      // Check if user is not already in recipients (to avoid duplicates)
      const isAlreadyAdded = recipients.some(r => r.userId === favoriteUser.userId);
      
      if (!isAlreadyAdded) {
        let distance = null;
        if (favoriteUser.latitude && favoriteUser.longitude) {
          const userLat = parseFloat(favoriteUser.latitude);
          const userLng = parseFloat(favoriteUser.longitude);
          distance = calculateDistance(restaurantLat, restaurantLng, userLat, userLng);
        }
        
        recipients.push({
          userId: favoriteUser.userId,
          recipientType: 'favorite',
          distanceKm: distance || undefined
        });
      }
    }

    // Insert recipients in batches to avoid large transactions
    const recipientRecords = recipients.map(recipient => ({
      messageId,
      userId: recipient.userId,
      recipientType: recipient.recipientType,
      distanceKm: recipient.distanceKm?.toString() || null,
    }));

    if (recipientRecords.length > 0) {
      // Insert in batches of 100
      for (let i = 0; i < recipientRecords.length; i += 100) {
        const batch = recipientRecords.slice(i, i + 100);
        await db.insert(messageRecipients).values(batch);
      }

      // Create notifications for all recipients
      const notificationRecords = recipients.map(recipient => ({
        userId: recipient.userId,
        type: 'message',
        title: `New ${messageType} from ${restaurant.name}`,
        message: title,
        data: {
          restaurantId: restaurant.id,
          messageId,
          url: `/restaurant/${restaurant.id}`,
        },
      }));

      // Insert notifications in batches using raw SQL
      for (let i = 0; i < notificationRecords.length; i += 100) {
        const batch = notificationRecords.slice(i, i + 100);
        await db.execute(sql`
          INSERT INTO notifications (user_id, type, title, message, data)
          VALUES ${sql.join(
            batch.map(notif => sql`(${notif.userId}, ${notif.type}, ${notif.title}, ${notif.message}, ${JSON.stringify(notif.data)})`),
            sql`, `
          )}
        `);
      }
    }

    // Get summary statistics
    const nearbyCount = recipients.filter(r => r.recipientType === 'nearby').length;
    const favoriteCount = recipients.filter(r => r.recipientType === 'favorite').length;

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      messageId,
      summary: {
        totalRecipients: recipients.length,
        nearbyUsers: nearbyCount,
        favoriteUsers: favoriteCount,
        radiusKm: targetRadiusKm,
        restaurantName: restaurant.name,
      }
    });

  } catch (error) {
    console.error('Error sending restaurant message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// GET - Get messages sent by this restaurant owner
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get restaurant owned by this user
    const userRestaurants = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.ownerId, userId))
      .limit(1);

    if (userRestaurants.length === 0) {
      return NextResponse.json({
        error: 'No restaurant found for this user'
      }, { status: 404 });
    }

    const restaurant = userRestaurants[0];

    // Get messages with recipient counts
    const messages = await db.execute(sql`
      SELECT 
        rm.*,
        COUNT(mr.id) as total_recipients,
        COUNT(CASE WHEN mr.is_read = true THEN 1 END) as read_count,
        COUNT(CASE WHEN mr.is_clicked = true THEN 1 END) as click_count,
        COUNT(CASE WHEN mr.recipient_type = 'nearby' THEN 1 END) as nearby_count,
        COUNT(CASE WHEN mr.recipient_type = 'favorite' THEN 1 END) as favorite_count
      FROM restaurant_messages rm
      LEFT JOIN message_recipients mr ON rm.id = mr.message_id
      WHERE rm.restaurant_id = ${restaurant.id}
      GROUP BY rm.id
      ORDER BY rm.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    return NextResponse.json({
      success: true,
      messages: messages.rows,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name
      }
    });

  } catch (error) {
    console.error('Error fetching restaurant messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
