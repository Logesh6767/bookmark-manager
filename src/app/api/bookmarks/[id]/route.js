import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { isValidUUID } from '@/lib/validators';

/**
 * DELETE /api/bookmarks/[id]
 * Delete a bookmark owned by the authenticated user
 */
export async function DELETE(request, { params }) {
  try {
    // Get the user session from Supabase
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const bookmarkId = params.id;

    // Validate UUID format
    if (!isValidUUID(bookmarkId)) {
      return NextResponse.json(
        { error: 'Invalid bookmark ID' },
        { status: 400 }
      );
    }

    // Check if bookmark exists and belongs to the user
    const { data: bookmark, error: fetchError } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('id', bookmarkId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !bookmark) {
      return NextResponse.json(
        { error: 'Bookmark not found' },
        { status: 404 }
      );
    }

    // Delete the bookmark
    const { error: deleteError } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', bookmarkId)
      .eq('user_id', userId);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json(
      { message: 'Bookmark deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/bookmarks/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete bookmark' },
      { status: 500 }
    );
  }
}
