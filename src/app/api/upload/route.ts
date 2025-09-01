import { put, del } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { db, images } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Get user ID from middleware header
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    const entityType = searchParams.get('entityType') || 'restaurant';
    const entityId = searchParams.get('entityId') || randomUUID();

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    if (!request.body) {
      return NextResponse.json({ error: 'No file data provided' }, { status: 400 });
    }

    // Get file info from headers
    const contentType = request.headers.get('content-type') || 'application/octet-stream';
    const contentLength = parseInt(request.headers.get('content-length') || '0');

    // Upload directly to permanent location
    const blob = await put(filename, request.body, {
      access: 'public',
    });

    // Store reference in database
    try {
      await db.insert(images).values({
        filename,
        originalName: filename.split('/').pop() || filename,
        mimeType: contentType,
        size: contentLength,
        url: blob.url,
        uploadedBy: userId,
        entityType: entityType as 'restaurant' | 'menu_item' | 'review' | 'user_profile' | 'certification',
        entityId: entityId,
      });
    } catch (dbError) {
      console.error('Database insertion error:', dbError);
      // Continue even if DB insertion fails
    }

    return NextResponse.json({
      url: blob.url,
      filename,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get user ID from middleware header
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Delete from Vercel Blob
    try {
      await del(url);
    } catch (blobError) {
      console.error('Blob deletion error:', blobError);
      // Continue to try database cleanup even if blob deletion fails
    }

    // Remove from database
    try {
      await db.delete(images).where(eq(images.url, url));
    } catch (dbError) {
      console.error('Database deletion error:', dbError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
