import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

// GET - Fetch recent notifications for real-time updates
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching recent notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent notifications' },
      { status: 500 }
    );
  }
}
