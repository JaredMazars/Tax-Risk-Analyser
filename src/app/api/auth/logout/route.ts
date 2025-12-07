import { NextRequest, NextResponse } from 'next/server';
import { deleteSession, deleteAllUserSessions, verifySession, getLogoutUrl, getAuthUrl } from '@/lib/services/auth/auth';
import { clearRateLimitsForIdentifier, getClientIdentifier } from '@/lib/utils/rateLimit';

/**
 * Handle logout - clear session cookie and redirect
 */
export async function GET(request: NextRequest) {
  // Get current session token
  const sessionToken = request.cookies.get('session')?.value;
  
  // Delete session from database
  if (sessionToken) {
    // Check if user wants to logout from all devices
    const url = new URL(request.url);
    const logoutAll = url.searchParams.get('all') === 'true';
    
    if (logoutAll) {
      // Get user ID from session and delete all their sessions
      const session = await verifySession(sessionToken);
      if (session?.user?.id) {
        await deleteAllUserSessions(session.user.id);
      }
    } else {
      // Delete only this session
      await deleteSession(sessionToken);
    }
  }
  
  // Clear rate limits for this IP
  const clientIdentifier = getClientIdentifier(request);
  clearRateLimitsForIdentifier(clientIdentifier);
  
  // Get Azure AD login URL to redirect to after logout
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback`;
  const azureAdLoginUrl = await getAuthUrl(redirectUri);
  
  // Construct Azure AD logout URL with post-logout redirect to Azure AD login
  const azureAdLogoutUrl = getLogoutUrl(azureAdLoginUrl);
  
  const response = NextResponse.redirect(azureAdLogoutUrl);
  
  // Delete session cookie with all the same options it was set with
  response.cookies.delete('session');
  
  // Add cache control headers to prevent caching
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}

/**
 * Handle logout via POST - clear session cookie and return Azure AD logout URL
 */
export async function POST(request: NextRequest) {
  // Get current session token
  const sessionToken = request.cookies.get('session')?.value;
  
  // Delete session from database
  if (sessionToken) {
    await deleteSession(sessionToken);
  }
  
  // Clear rate limits for this IP
  const clientIdentifier = getClientIdentifier(request);
  clearRateLimitsForIdentifier(clientIdentifier);
  
  // Get Azure AD login URL to redirect to after logout
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback`;
  const azureAdLoginUrl = await getAuthUrl(redirectUri);
  
  // Construct Azure AD logout URL with post-logout redirect to Azure AD login
  const azureAdLogoutUrl = getLogoutUrl(azureAdLoginUrl);
  
  const response = NextResponse.json({ 
    success: true, 
    message: 'Logged out successfully',
    logoutUrl: azureAdLogoutUrl 
  });
  
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


