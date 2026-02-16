import { NextResponse } from 'next/server';

/**
 * Handle OAuth callback from Supabase
 * Supabase handles the OAuth exchange and session creation
 * This route just needs to redirect to the dashboard
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    console.log('Auth callback received', {
      error,
      errorDescription,
      url: request.url,
    });

    // If there's an explicit OAuth error, go back to login with error
    if (error && error !== 'no_code') {
      console.error('OAuth error received:', error);
      return NextResponse.redirect(
        new URL(
          `/?error=${error}&description=${encodeURIComponent(errorDescription || '')}`,
          request.url
        )
      );
    }

    // Redirect to dashboard - Supabase client will pick up the session
    // The access token should be in the URL fragment or already set by Supabase
    console.log('Redirecting to dashboard');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/?error=callback_error', request.url));
  }
}
