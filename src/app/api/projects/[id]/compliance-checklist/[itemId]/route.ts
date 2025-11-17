import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/services/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { handleApiError } from '@/lib/utils/errorHandler';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const itemId = parseInt(params.itemId);
    const body = await request.json();

    const updateData: any = {
      status: body.status,
    };

    if (body.status === 'COMPLETED' && body.completedAt) {
      updateData.completedAt = new Date(body.completedAt);
      updateData.completedBy = session.user.email;
    }

    const item = await prisma.complianceChecklist.update({
      where: { id: itemId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    return handleApiError(error, 'PUT /api/projects/[id]/compliance-checklist/[itemId]');
  }
}

