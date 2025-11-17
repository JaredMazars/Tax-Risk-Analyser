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
    
    const notes = await prisma.researchNote.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: notes });
  } catch (error) {
    return handleApiError(error, 'GET /api/projects/[id]/research-notes');
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

    const note = await prisma.researchNote.create({
      data: {
        projectId,
        title: body.title,
        content: body.content,
        tags: body.tags,
        category: body.category,
        createdBy: session.user.email,
      },
    });

    return NextResponse.json({ success: true, data: note });
  } catch (error) {
    return handleApiError(error, 'POST /api/projects/[id]/research-notes');
  }
}

