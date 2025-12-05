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

    const taskId = Number.parseInt(params.id);
    
    const drafts = await prisma.opinionDraft.findMany({
      where: { taskId },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: drafts });
  } catch (error) {
    return handleApiError(error, 'GET /api/tasks/[id]/opinion-drafts');
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

    const taskId = Number.parseInt(params.id);
    const body = await request.json();

    const draft = await prisma.opinionDraft.create({
      data: {
        taskId,
        title: body.title,
        content: body.content || '',
        status: body.status || 'DRAFT',
        createdBy: session.user.email,
        version: 1,
      },
    });

    return NextResponse.json({ success: true, data: draft });
  } catch (error) {
    return handleApiError(error, 'POST /api/tasks/[id]/opinion-drafts');
  }
}

