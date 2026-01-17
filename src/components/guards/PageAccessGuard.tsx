/**
 * Page Access Guard
 * Server component that checks page permissions before rendering
 */

import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/services/auth/auth';
import { checkPageAccess } from '@/lib/permissions/pageAccess';
import { PageAccessProvider } from '@/components/providers/PageAccessProvider';
import { PageAccessLevel } from '@/types/pagePermissions';

interface PageAccessGuardProps {
  children: ReactNode;
  pathname: string;
}

/**
 * Server component that wraps pages and checks permissions
 * Redirects to dashboard with error if user lacks access
 * Provides access level context to children
 */
export async function PageAccessGuard({ children, pathname }: PageAccessGuardProps) {
  // Get current user
  const user = await getCurrentUser();

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PageAccessGuard.tsx:24',message:'getCurrentUser result',data:{hasUser:!!user,userId:user?.id,userEmail:user?.email,userSystemRole:user?.systemRole,pathname},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  if (!user) {
    // Not authenticated - redirect to login
    redirect('/api/auth/login?callbackUrl=' + encodeURIComponent(pathname));
  }

  // Check page access
  const { canAccess, accessLevel } = await checkPageAccess(user.id, pathname);

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PageAccessGuard.tsx:37',message:'checkPageAccess result',data:{userId:user.id,pathname,canAccess,accessLevel},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
  // #endregion

  if (!canAccess || accessLevel === PageAccessLevel.NONE) {
    // No access - redirect to dashboard with error message
    redirect('/dashboard?error=access_denied&page=' + encodeURIComponent(pathname));
  }

  // User has access - provide access level to children
  return (
    <PageAccessProvider accessLevel={accessLevel}>
      {children}
    </PageAccessProvider>
  );
}


