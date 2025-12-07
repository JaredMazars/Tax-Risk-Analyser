import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/utils/errorHandler';
import { successResponse } from '@/lib/utils/apiUtils';
import { getCurrentUser } from '@/lib/services/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { searchADUsers } from '@/lib/services/auth/graphClient';

// Force dynamic rendering (uses cookies)
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = Number.parseInt(searchParams.get('limit') || '20');
    const taskId = searchParams.get('taskId');
    const source = searchParams.get('source') || 'database'; // 'database' or 'ad'

    // Validate limit
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Search Active Directory if requested
    if (source === 'ad') {
      if (!query.trim()) {
        return NextResponse.json(successResponse([]));
      }

      try {
        const adUsers = await searchADUsers(query.trim(), limit);
        
        // Transform Graph users to ADUser format
        const formattedUsers = adUsers.map(u => ({
          id: u.id,
          email: u.mail || u.userPrincipalName,
          displayName: u.displayName,
          userPrincipalName: u.userPrincipalName,
          jobTitle: u.jobTitle,
          department: u.department,
          officeLocation: u.officeLocation,
          mobilePhone: u.mobilePhone,
          businessPhones: u.businessPhones,
          city: u.city,
          country: u.country,
          companyName: u.companyName,
          employeeId: u.employeeId,
          employeeType: u.employeeType,
          givenName: u.givenName,
          surname: u.surname,
        }));

        return NextResponse.json(successResponse(formattedUsers));
      } catch (error) {
        // Fall back to database search if AD fails
        console.error('AD search failed, falling back to database:', error);
      }
    }

    // Build where clause for database search
    interface WhereClause {
      OR?: Array<{ name: { contains: string } } | { email: { contains: string } }>;
    }
    
    const whereClause: WhereClause = {};
    
    if (query.trim()) {
      // Search by name or email (SQL Server uses case-insensitive collation by default)
      whereClause.OR = [
        { name: { contains: query.trim() } },
        { email: { contains: query.trim() } },
      ];
    }

    // Get users from database
    let users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
      },
      take: limit,
      orderBy: {
        name: 'asc',
      },
    });

    // If taskId is provided, filter out users already in the task
    if (taskId) {
      const taskUsers = await prisma.taskTeam.findMany({
        where: { taskId: Number.parseInt(taskId) },
        select: { userId: true },
      });
      
      const taskUserIds = new Set(taskUsers.map(tu => tu.userId));
      users = users.filter(u => !taskUserIds.has(u.id));
    }

    // Transform to expected format
    const formattedUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      displayName: u.name || u.email,
      jobTitle: null,
      department: null,
    }));

    return NextResponse.json(successResponse(formattedUsers));
  } catch (error) {
    return handleApiError(error, 'Search Users');
  }
}



