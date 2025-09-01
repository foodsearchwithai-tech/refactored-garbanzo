import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Count unread notifications for the user
    const result = await db.execute(
      sql`SELECT COUNT(*) as unread_count FROM notifications 
          WHERE user_id = ${userId} 
          AND is_read = FALSE 
          AND is_deleted = FALSE 
          AND (expires_at IS NULL OR expires_at > NOW())`
    );

    const unreadCount = Number(result.rows[0]?.unread_count || 0);

    return NextResponse.json({
      success: true,
      unreadCount
    });

  } catch (error) {
    console.error('Error fetching notification count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification count' },
      { status: 500 }
    );
  }
}
