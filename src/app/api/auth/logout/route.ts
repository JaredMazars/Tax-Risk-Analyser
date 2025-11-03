import { NextRequest, NextResponse } from 'next/server';

/**
 * Handle logout - clear session cookie and redirect
 */
export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/', request.url));
  
  // Delete session cookie with all the same options it was set with
  response.cookies.delete('session');
  
  // Add cache control headers to prevent caching
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}

/**
 * Handle logout via POST - clear session cookie and return success
 */
export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  
  // Delete session cookie with all the same options it was set with
  response.cookies.delete('session');
  
  // Also clear the auth callback URL cookie if it exists
  response.cookies.delete('auth_callback_url');
  
  // Add cache control headers to prevent caching
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}

