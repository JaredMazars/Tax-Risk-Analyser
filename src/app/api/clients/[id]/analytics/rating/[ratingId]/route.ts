import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, checkClientAccess } from '@/lib/services/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { successResponse } from '@/lib/utils/apiUtils';
import { handleApiError } from '@/lib/utils/errorHandler';
import { parseCreditAnalysisReport, parseFinancialRatios } from '@/lib/utils/jsonValidation';
import { logger } from '@/lib/utils/logger';
import { GSClientIDSchema } from '@/lib/validation/schemas';

/**
 * GET /api/clients/[id]/analytics/rating/[ratingId]
 * Fetch a specific credit rating with full details
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; ratingId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, ratingId } = await context.params;
    const GSClientID = id;
    const ratId = Number.parseInt(ratingId);

    // Validate GSClientID is a valid GUID
    const validationResult = GSClientIDSchema.safeParse(GSClientID);
    if (!validationResult.success || Number.isNaN(ratId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    // SECURITY: Check authorization
    const hasAccess = await checkClientAccess(user.id, GSClientID);
    if (!hasAccess) {
      logger.warn('Unauthorized rating detail access attempt', {
        userId: user.id,
        userEmail: user.email,
        GSClientID,
        ratingId: ratId,
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get client by GSClientID to get numeric id
    const client = await prisma.client.findUnique({
      where: { GSClientID: GSClientID },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Fetch rating with documents (using numeric GSClientID)
    const rating = await prisma.clientCreditRating.findFirst({
      where: {
        id: ratId,
        clientId: client.id,
      },
      include: {
        CreditRatingDocument: {
          include: {
            ClientAnalyticsDocument: true,
          },
        },
        Client: {
          select: {
            id: true,
            GSClientID: true,  // This is correct - selecting external ID from Client table
            clientCode: true,
            clientNameFull: true,
            industry: true,
            sector: true,
          },
        },
      },
    });

    if (!rating) {
      return NextResponse.json({ error: 'Rating not found' }, { status: 404 });
    }

    // Transform response with safe JSON parsing
    const transformedRating = {
      ...rating,
      analysisReport: parseCreditAnalysisReport(rating.analysisReport),
      financialRatios: parseFinancialRatios(rating.financialRatios),
      documents: rating.CreditRatingDocument.map((d) => d.ClientAnalyticsDocument),
    };

    return NextResponse.json(successResponse(transformedRating));
  } catch (error) {
    return handleApiError(error, 'GET /api/clients/[id]/analytics/rating/[ratingId]');
  }
}

/**
 * DELETE /api/clients/[id]/analytics/rating/[ratingId]
 * Delete a specific credit rating
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; ratingId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, ratingId } = await context.params;
    const GSClientID = id;
    const ratId = Number.parseInt(ratingId);

    // Validate GSClientID is a valid GUID
    const validationResult = GSClientIDSchema.safeParse(GSClientID);
    if (!validationResult.success || Number.isNaN(ratId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    // SECURITY: Check authorization
    const hasAccess = await checkClientAccess(user.id, GSClientID);
    if (!hasAccess) {
      logger.warn('Unauthorized rating deletion attempt', {
        userId: user.id,
        userEmail: user.email,
        GSClientID,
        ratingId: ratId,
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get client by GSClientID to get numeric id
    const client = await prisma.client.findUnique({
      where: { GSClientID: GSClientID },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Verify rating exists and belongs to client
    const rating = await prisma.clientCreditRating.findFirst({
      where: {
        id: ratId,
        clientId: client.id,
      },
    });

    if (!rating) {
      return NextResponse.json({ error: 'Rating not found' }, { status: 404 });
    }

    // Delete rating (junction table entries will cascade)
    await prisma.clientCreditRating.delete({
      where: { id: ratId },
    });

    return NextResponse.json(
      successResponse({
        message: 'Rating deleted successfully',
        ratingId: ratId,
      })
    );
  } catch (error) {
    return handleApiError(error, 'DELETE /api/clients/[id]/analytics/rating/[ratingId]');
  }
}

