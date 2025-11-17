import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/services/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { handleApiError } from '@/lib/utils/errorHandler';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const noteId = parseInt(params.noteId);
    const body = await request.json();

    const note = await prisma.researchNote.update({
      where: { id: noteId },
      data: {
        title: body.title,
        content: body.content,
        tags: body.tags,
        category: body.category,
      },
    });

    return NextResponse.json({ success: true, data: note });
  } catch (error) {
    return handleApiError(error, 'PUT /api/projects/[id]/research-notes/[noteId]');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const noteId = parseInt(params.noteId);

    await prisma.researchNote.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/projects/[id]/research-notes/[noteId]');
  }
}

