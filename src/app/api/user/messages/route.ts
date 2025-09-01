import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, messageRecipients, restaurantMessages, restaurants } from '@/lib/db';
import { eq, and, desc, sql } from 'drizzle-orm';

// GET - Get messages for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unread') === 'true';

    // Build the query
    const baseCondition = eq(messageRecipients.userId, userId);
    const whereConditions = unreadOnly 
      ? and(baseCondition, eq(messageRecipients.isRead, false))
      : baseCondition;

    // Get messages for this user with restaurant details
    const userMessages = await db
      .select({
        id: messageRecipients.id,
        messageId: messageRecipients.messageId,
        recipientType: messageRecipients.recipientType,
        distanceKm: messageRecipients.distanceKm,
        isRead: messageRecipients.isRead,
        readAt: messageRecipients.readAt,
        isClicked: messageRecipients.isClicked,
        clickedAt: messageRecipients.clickedAt,
        receivedAt: messageRecipients.createdAt,
        // Message details
        title: restaurantMessages.title,
        message: restaurantMessages.message,
        messageType: restaurantMessages.messageType,
        offerDetails: restaurantMessages.offerDetails,
        expiresAt: restaurantMessages.expiresAt,
        sentAt: restaurantMessages.createdAt,
        // Restaurant details
        restaurantId: restaurants.id,
        restaurantName: restaurants.name,
        restaurantImage: restaurants.profileImage,
        restaurantCity: restaurants.city,
        restaurantState: restaurants.state,
        restaurantPhone: restaurants.phone,
      })
      .from(messageRecipients)
      .innerJoin(restaurantMessages, eq(messageRecipients.messageId, restaurantMessages.id))
      .innerJoin(restaurants, eq(restaurantMessages.restaurantId, restaurants.id))
      .where(and(
        whereConditions,
        eq(restaurantMessages.isActive, true)
      ))
      .orderBy(desc(messageRecipients.createdAt))
      .limit(limit)
      .offset(offset);

    // Get unread count
    const unreadCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(messageRecipients)
      .innerJoin(restaurantMessages, eq(messageRecipients.messageId, restaurantMessages.id))
      .where(and(
        eq(messageRecipients.userId, userId),
        eq(messageRecipients.isRead, false),
        eq(restaurantMessages.isActive, true)
      ));

    const unreadCount = unreadCountResult[0]?.count || 0;

    return NextResponse.json({
      success: true,
      messages: userMessages,
      unreadCount,
      pagination: {
        limit,
        offset,
        hasMore: userMessages.length === limit
      }
    });

  } catch (error) {
    console.error('Error fetching user messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// PATCH - Mark message as read/clicked
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { messageId, action } = body;

    if (!messageId || !action) {
      return NextResponse.json({
        error: 'messageId and action are required'
      }, { status: 400 });
    }

    if (!['read', 'click'].includes(action)) {
      return NextResponse.json({
        error: 'Action must be either "read" or "click"'
      }, { status: 400 });
    }

    // Update the message recipient record
    const updateData: {
      isRead?: boolean;
      readAt?: Date;
      isClicked?: boolean;
      clickedAt?: Date;
    } = {};
    
    if (action === 'read') {
      updateData.isRead = true;
      updateData.readAt = new Date();
    } else if (action === 'click') {
      updateData.isClicked = true;
      updateData.clickedAt = new Date();
      // Also mark as read if not already
      updateData.isRead = true;
      if (!updateData.readAt) {
        updateData.readAt = new Date();
      }
    }

    const updated = await db
      .update(messageRecipients)
      .set(updateData)
      .where(and(
        eq(messageRecipients.messageId, messageId),
        eq(messageRecipients.userId, userId)
      ))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({
        error: 'Message not found or not accessible'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Message marked as ${action === 'read' ? 'read' : 'clicked'}`,
      updated: updated[0]
    });

  } catch (error) {
    console.error('Error updating message status:', error);
    return NextResponse.json(
      { error: 'Failed to update message status' },
      { status: 500 }
    );
  }
}
