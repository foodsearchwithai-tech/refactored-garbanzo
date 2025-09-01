import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

// GET - Fetch recent notifications for real-time updates
export async function GET(request: NextRequest) {
  try {
    // Handle CORS for mobile/iOS compatibility
    const origin = request.headers.get('origin');
    const corsHeaders = {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-User-ID',
      'Access-Control-Max-Age': '86400',
    };

    // Try to get user ID but don't fail if not authenticated
    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch {
      // User not authenticated - return empty notifications
      return NextResponse.json({
        success: true,
        notifications: [],
        count: 0,
        timestamp: new Date().toISOString(),
        authenticated: false
      }, { headers: corsHeaders });
    }

    // Check alternative sources for user ID (from middleware)
    if (!userId) {
      userId = request.headers.get('x-user-id') || request.headers.get('X-User-ID');
    }

    if (!userId) {
      return NextResponse.json({
        success: true,
        notifications: [],
        count: 0,
        timestamp: new Date().toISOString(),
        authenticated: false
      }, { headers: corsHeaders });
    }

    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since'); // ISO timestamp
    const limit = parseInt(searchParams.get('limit') || '10');

    let sinceClause = sql``;
    if (since) {
      sinceClause = sql`AND created_at > ${since}`;
    } else {
      // Default to last 10 minutes if no since parameter
      sinceClause = sql`AND created_at > NOW() - INTERVAL '10 minutes'`;
    }

    const result = await db.execute(sql`
      SELECT * FROM notifications 
      WHERE user_id = ${userId}
      AND is_deleted = FALSE 
      AND (expires_at IS NULL OR expires_at > NOW())
      ${sinceClause}
      ORDER BY created_at DESC 
      LIMIT ${limit}
    `);

    const notifications = result.rows.map(row => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      data: row.data,
      isRead: row.is_read,
      createdAt: row.created_at,
      expiresAt: row.expires_at
    }));

    return NextResponse.json({
      success: true,
      notifications,
      count: notifications.length,
      timestamp: new Date().toISOString(),
      authenticated: true
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error fetching recent notifications:', error);
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-User-ID',
    };

    return NextResponse.json(
      { 
        error: 'Failed to fetch recent notifications',
        success: false,
        notifications: [],
        count: 0
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-User-ID',
      'Access-Control-Max-Age': '86400',
    },
  });
}
