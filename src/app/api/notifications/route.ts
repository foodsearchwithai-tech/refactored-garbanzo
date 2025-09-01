import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

// GET - Fetch user notifications
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await db.execute(sql`
      SELECT * FROM notifications 
      WHERE user_id = ${userId}
      AND is_deleted = FALSE 
      AND (expires_at IS NULL OR expires_at > NOW())
      ${filter === 'unread' ? sql`AND is_read = FALSE` : sql``}
      ${filter === 'messages' ? sql`AND type = 'message'` : sql``}
      ORDER BY created_at DESC 
      LIMIT ${limit} OFFSET ${offset}
    `);
    const notifications = result.rows;

    return NextResponse.json({
      success: true,
      notifications: notifications.map(row => ({
        id: row.id,
        type: row.type,
        title: row.title,
        message: row.message,
        data: row.data,
        isRead: row.is_read,
        createdAt: row.created_at,
        expiresAt: row.expires_at
      }))
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST - Create new notification (admin/system use)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetUserId, type, title, message, data, expiresAt } = body;

    // For now, only allow users to create notifications for themselves
    // Later you can add admin checks
    if (targetUserId && targetUserId !== userId) {
      return NextResponse.json({ error: 'Cannot create notifications for other users' }, { status: 403 });
    }

    const notification = await db.execute(
      sql`INSERT INTO notifications (user_id, type, title, message, data, expires_at)
          VALUES (${targetUserId || userId}, ${type}, ${title}, ${message}, ${JSON.stringify(data || {})}, ${expiresAt || null})
          RETURNING *`
    );

    return NextResponse.json({
      success: true,
      notification: notification.rows[0]
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
