import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/auth/auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * DEBUG ENDPOINT - Check current user's role
 */
export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionUser: user,
        dbUser,
        isSystemAdmin: dbUser?.role === 'SYSTEM_ADMIN',
      },
    });
  } catch (error) {
    console.error('Error checking user role:', error);
    return NextResponse.json({ error: 'Failed to check user role' }, { status: 500 });
  }
}

