import { NextResponse } from 'next/server';

/**
 * Middleware to handle route protection and redirects
 * This runs on every request before it reaches the route handler
 */
export function middleware(request) {
  const { pathname } = request.nextUrl;

  // This middleware is optional - Next.js Auth in Supabase handles most of it
  // You can add additional route protection logic here if needed
  
  return NextResponse.next();
}

// Configure which routes should run this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
