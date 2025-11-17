import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/services/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { handleApiError } from '@/lib/utils/errorHandler';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = parseInt(params.id);
    
    const filings = await prisma.filingStatus.findMany({
      where: { projectId },
      orderBy: [
        { status: 'asc' },
        { deadline: 'asc' },
      ],
    });

    return NextResponse.json({ success: true, data: filings });
  } catch (error) {
    return handleApiError(error, 'GET /api/projects/[id]/filing-status');
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = parseInt(params.id);
    const body = await request.json();

    const filing = await prisma.filingStatus.create({
      data: {
        projectId,
        filingType: body.filingType,
        description: body.description,
        status: body.status || 'PENDING',
        deadline: body.deadline ? new Date(body.deadline) : null,
        referenceNumber: body.referenceNumber,
        notes: body.notes,
        createdBy: session.user.email,
      },
    });

    return NextResponse.json({ success: true, data: filing });
  } catch (error) {
    return handleApiError(error, 'POST /api/projects/[id]/filing-status');
  }
}

