/**
 * POST /api/approvals/steps/[stepId]/approve
 * Approve an approval step
 */

import { NextResponse } from 'next/server';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { approvalService } from '@/lib/services/approvals/approvalService';
import { invalidateApprovalsCache, invalidateWorkflowCache } from '@/lib/services/cache/cacheInvalidation';
import { successResponse } from '@/lib/utils/apiUtils';
import { AppError, ErrorCodes } from '@/lib/utils/errorHandler';
import { z } from 'zod';

const ApproveStepSchema = z.object({
  comment: z.string().optional(),
});

export const POST = secureRoute.mutationWithParams<typeof ApproveStepSchema, { stepId: string }>({
  feature: Feature.APPROVE_CLIENT_ACCEPTANCE,
  schema: ApproveStepSchema,
  handler: async (request, { user, params, data }) => {
    const stepId = parseInt(params.stepId, 10);
    
    if (isNaN(stepId)) {
      throw new AppError(400, 'Invalid step ID', ErrorCodes.VALIDATION_ERROR);
    }

    // #region agent log
    await fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'approve/route.ts:28',message:'Before approveStep',data:{stepId,userId:user.id,comment:data.comment},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C_D'})}).catch(()=>{});
    // #endregion

    const result = await approvalService.approveStep(stepId, user.id, data.comment);

    // #region agent log
    await fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'approve/route.ts:34',message:'After approveStep',data:{stepId,success:result.success,isComplete:result.isComplete,approvalStatus:result.approval.status,workflowType:result.workflowType,workflowId:result.workflowId},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C_D'})}).catch(()=>{});
    // #endregion

    // Invalidate approvals cache and workflow-specific caches
    await Promise.all([
      invalidateApprovalsCache(),
      invalidateWorkflowCache(result.workflowType, result.workflowId),
    ]);

    // #region agent log
    await fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'approve/route.ts:45',message:'After cache invalidation',data:{stepId,workflowType:result.workflowType,workflowId:result.workflowId},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'D_E'})}).catch(()=>{});
    // #endregion

    return NextResponse.json(successResponse(result));
  },
});
