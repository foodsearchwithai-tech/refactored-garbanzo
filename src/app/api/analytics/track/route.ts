import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

// Helper function to retry database operations
async function retryDatabaseOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`Database operation attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { restaurantId, eventType, metadata = {}, sessionId } = body;

    // Validate required fields
    if (!restaurantId) {
      return NextResponse.json({ 
        error: 'Restaurant ID is required',
        received: { restaurantId, eventType }
      }, { status: 400 });
    }

    if (!eventType) {
      return NextResponse.json({ 
        error: 'Event type is required',
        received: { restaurantId, eventType }
      }, { status: 400 });
    }

    // Validate event type
    const validEvents = [
      'view', 'click', 'search', 'favorite', 'call', 'directions', 
      'menu_view', 'photo_view', 'review_view', 'dashboard_view', 
      'menu_management_click', 'preview_restaurant_click', 'photo_upload_click', 
      'analytics_view_click', 'settings_click', 'location_enable_click'
    ];
    
    if (!validEvents.includes(eventType)) {
      return NextResponse.json({ 
        error: `Invalid event type: ${eventType}`,
        validEvents
      }, { status: 400 });
    }

    // Check if restaurant exists and get owner info
    let restaurantOwner = null;
    let isOwnerViewing = false;
    
    try {
      const restaurantCheck = await retryDatabaseOperation(async () => {
        return await db.execute(sql`
          SELECT id, owner_id FROM restaurants WHERE id = ${restaurantId} LIMIT 1
        `);
      });
      
      if (restaurantCheck.rows.length === 0) {
        return NextResponse.json({ 
          error: 'Restaurant not found',
          restaurantId 
        }, { status: 404 });
      }

      restaurantOwner = restaurantCheck.rows[0].owner_id;
      
      // Check if current user is the restaurant owner
      isOwnerViewing = Boolean(userId && userId === restaurantOwner);
      
    } catch (dbError) {
      console.error('Restaurant validation error:', dbError);
      return NextResponse.json({ error: 'Database error during validation' }, { status: 500 });
    }

    // Skip analytics tracking if this is the restaurant owner OR any dashboard event
    const isDashboardEvent = eventType.includes('dashboard') || 
                             eventType.includes('management') || 
                             eventType.includes('settings') ||
                             eventType.includes('analytics_view') ||
                             eventType.includes('photo_upload');
    
    // Skip ALL dashboard events and skip ANY event from restaurant owner
    if (isDashboardEvent || isOwnerViewing) {
      const reason = isDashboardEvent ? 'dashboard_event_skipped' : 'owner_viewing_own_restaurant';
      console.log(`Skipping analytics: ${eventType}, reason: ${reason}, userId: ${userId}, ownerId: ${restaurantOwner}`);
      
      // Return with isOwner status for logging purposes
      const analyticsData = {
        restaurantId,
        eventType,
        userId: userId || 'anonymous',
        timestamp: new Date().toISOString(),
        metadata,
        isOwner: isOwnerViewing
      };
      
      console.log('Real-time Analytics (Skipped):', analyticsData);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Event tracking skipped',
        skipped: true,
        reason: reason,
        analytics: analyticsData,
        isOwner: isOwnerViewing
      });
    }

    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Store detailed analytics event with retry logic
    await retryDatabaseOperation(async () => {
      await db.execute(sql`
        INSERT INTO analytics_events (
          restaurant_id, user_id, event_type, metadata, 
          ip_address, user_agent, session_id, created_at, date_hour
        ) VALUES (
          ${restaurantId}, ${userId || null}, ${eventType}, ${JSON.stringify(metadata)},
          ${ipAddress}, ${userAgent}, ${sessionId || null}, NOW(), DATE_TRUNC('hour', NOW())
        )
      `);
    });

    // Update aggregated analytics only for non-owner events
    if (restaurantId) {
      const updateField = getUpdateField(eventType);
      if (updateField) {
        await retryDatabaseOperation(async () => {
          await db.execute(sql`
            INSERT INTO restaurant_analytics (restaurant_id, ${sql.raw(updateField)}, last_view_at, updated_at)
            VALUES (${restaurantId}, 1, NOW(), NOW())
            ON CONFLICT (restaurant_id) 
            DO UPDATE SET 
              ${sql.raw(updateField)} = restaurant_analytics.${sql.raw(updateField)} + 1,
              last_view_at = CASE 
                WHEN ${eventType} = 'view' THEN NOW() 
                ELSE restaurant_analytics.last_view_at 
              END,
              updated_at = NOW()
          `);
        });

        // Update daily/weekly/monthly counters for views
        if (eventType === 'view') {
          await retryDatabaseOperation(async () => {
            await db.execute(sql`
              UPDATE restaurant_analytics 
              SET 
                views_today = COALESCE((
                  SELECT COUNT(*) FROM analytics_events ae
                  JOIN restaurants r ON ae.restaurant_id = r.id
                  WHERE ae.restaurant_id = ${restaurantId} 
                  AND ae.event_type = 'view' 
                  AND ae.created_at >= CURRENT_DATE
                  AND (ae.user_id IS NULL OR ae.user_id != r.owner_id)
                ), 0),
                views_this_week = COALESCE((
                  SELECT COUNT(*) FROM analytics_events ae
                  JOIN restaurants r ON ae.restaurant_id = r.id
                  WHERE ae.restaurant_id = ${restaurantId} 
                  AND ae.event_type = 'view' 
                  AND ae.created_at >= DATE_TRUNC('week', NOW())
                  AND (ae.user_id IS NULL OR ae.user_id != r.owner_id)
                ), 0),
                views_this_month = COALESCE((
                  SELECT COUNT(*) FROM analytics_events ae
                  JOIN restaurants r ON ae.restaurant_id = r.id
                  WHERE ae.restaurant_id = ${restaurantId} 
                  AND ae.event_type = 'view' 
                  AND ae.created_at >= DATE_TRUNC('month', NOW())
                  AND (ae.user_id IS NULL OR ae.user_id != r.owner_id)
                ), 0),
                peak_hour = COALESCE((
                  SELECT EXTRACT(hour FROM ae.created_at)::INTEGER as hour
                  FROM analytics_events ae
                  JOIN restaurants r ON ae.restaurant_id = r.id
                  WHERE ae.restaurant_id = ${restaurantId} 
                  AND ae.event_type = 'view'
                  AND ae.created_at >= CURRENT_DATE - INTERVAL '7 days'
                  AND (ae.user_id IS NULL OR ae.user_id != r.owner_id)
                  GROUP BY EXTRACT(hour FROM ae.created_at)
                  ORDER BY COUNT(*) DESC 
                  LIMIT 1
                ), 12)
              WHERE restaurant_id = ${restaurantId}
            `);
          });
        }
      }
    }

    // Real-time analytics for dashboard (emit to websocket if needed)
    const analyticsData = {
      restaurantId,
      eventType,
      userId: userId || 'anonymous',
      timestamp: new Date().toISOString(),
      metadata,
      isOwner: isOwnerViewing
    };

    // In production, you might want to emit this to a real-time service
    console.log('Real-time Analytics:', analyticsData);

    return NextResponse.json({ 
      success: true, 
      message: 'Event tracked successfully',
      analytics: analyticsData,
      isOwner: isOwnerViewing
    });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}

function getUpdateField(eventType: string): string | null {
  const fieldMap: Record<string, string> = {
    'view': 'total_views',
    'click': 'total_clicks',
    'favorite': 'total_favorites',
    'call': 'total_calls',
    'directions': 'total_directions'
  };
  return fieldMap[eventType] || null;
}

// GET endpoint for retrieving analytics data
export async function GET(request: NextRequest) {
  try {
    await auth(); // Ensure user is authenticated
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID required' }, { status: 400 });
    }

    // Get aggregated analytics
    const analyticsResult = await db.execute(sql`
      SELECT * FROM restaurant_analytics 
      WHERE restaurant_id = ${restaurantId}
    `);

    const analytics = analyticsResult.rows[0] || {
      total_views: 0,
      total_clicks: 0,
      total_favorites: 0,
      total_calls: 0,
      total_directions: 0,
      views_today: 0,
      views_this_week: 0,
      views_this_month: 0,
      peak_hour: 12,
      conversion_rate: 0
    };

    // Get recent events for timeline
    const recentEvents = await db.execute(sql`
      SELECT event_type, created_at, metadata
      FROM analytics_events 
      WHERE restaurant_id = ${restaurantId}
      ORDER BY created_at DESC 
      LIMIT 20
    `);

    // Get hourly breakdown for charts
    const hourlyData = await db.execute(sql`
      SELECT 
        EXTRACT(hour FROM created_at) as hour,
        COUNT(*) as events,
        event_type
      FROM analytics_events 
      WHERE restaurant_id = ${restaurantId}
      AND created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY EXTRACT(hour FROM created_at), event_type
      ORDER BY hour
    `);

    return NextResponse.json({
      success: true,
      analytics,
      recentEvents: recentEvents.rows,
      hourlyData: hourlyData.rows
    });
  } catch (error) {
    console.error('Analytics retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analytics' },
      { status: 500 }
    );
  }
}
