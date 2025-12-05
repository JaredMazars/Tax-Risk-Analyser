import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/auth/auth';
import { canApproveAcceptance } from '@/lib/services/auth/authorization';
import { successResponse } from '@/lib/utils/apiUtils';
import { handleApiError } from '@/lib/utils/errorHandler';
import { toTaskId } from '@/types/branded';

/**
 * GET /api/tasks/[id]/permissions/approve-acceptance
 * Check if current user can approve acceptance for this task
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const taskId = toTaskId(id);

    const allowed = await canApproveAcceptance(user.id, taskId);

    return NextResponse.json(successResponse({ allowed }));
  } catch (error) {
    return handleApiError(error, 'GET /api/tasks/[id]/permissions/approve-acceptance');
  }
}
