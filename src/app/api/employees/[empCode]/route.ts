import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/services/auth/auth';
import { successResponse } from '@/lib/utils/apiUtils';
import { handleApiError } from '@/lib/utils/errorHandler';

/**
 * GET /api/employees/[empCode]
 * Get employee details by employee code
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { empCode: string } }
) {
  try {
    // Authenticate
    const currentUser = await getCurrentUser();
    if (!currentUser?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { empCode } = params;

    if (!empCode) {
      return NextResponse.json(
        { success: false, error: 'Employee code is required' },
        { status: 400 }
      );
    }

    // Look up employee by code
    const employee = await prisma.employee.findFirst({
      where: { EmpCode: empCode },
      select: {
        id: true,
        EmpCode: true,
        EmpName: true,
        EmpNameFull: true,
        WinLogon: true,
        OfficeCode: true,
        EmpCatCode: true,
        EmpCatDesc: true,
        Active: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(successResponse(employee));
  } catch (error) {
    return handleApiError(error, 'Error fetching employee');
  }
}
