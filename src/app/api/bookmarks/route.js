import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { isValidUrl, isValidTitle } from '@/lib/validators';

/**
 * GET /api/bookmarks
 * Fetch all bookmarks for the authenticated user
 */
export async function GET(request) {
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

    // Fetch bookmarks for the current user
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('GET /api/bookmarks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookmarks
 * Create a new bookmark for the authenticated user
 */
export async function POST(request) {
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
    const body = await request.json();
    const { url, title } = body;

    // Validate input
    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    if (!isValidTitle(title)) {
      return NextResponse.json(
        { error: 'Invalid title' },
        { status: 400 }
      );
    }

    // Insert bookmark
    const { data, error } = await supabase
      .from('bookmarks')
      .insert([
        {
          user_id: userId,
          url,
          title: title.trim(),
        },
      ])
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      { data: data[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/bookmarks error:', error);
    return NextResponse.json(
      { error: 'Failed to create bookmark' },
      { status: 500 }
    );
  }
}
