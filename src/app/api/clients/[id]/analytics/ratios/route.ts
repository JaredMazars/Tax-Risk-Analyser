import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { successResponse } from '@/lib/utils/apiUtils';
import { handleApiError } from '@/lib/utils/errorHandler';

/**
 * GET /api/clients/[id]/analytics/ratios
 * Fetch latest calculated financial ratios for a client
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
    const clientId = parseInt(id);

    if (isNaN(clientId)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    // Get the most recent rating for this client
    const latestRating = await prisma.clientCreditRating.findFirst({
      where: { clientId },
      orderBy: { ratingDate: 'desc' },
      select: {
        financialRatios: true,
        ratingDate: true,
      },
    });

    if (!latestRating) {
      return NextResponse.json(
        successResponse({
          ratios: null,
          message: 'No credit ratings found for this client',
        })
      );
    }

    const ratios = JSON.parse(latestRating.financialRatios);

    return NextResponse.json(
      successResponse({
        ratios,
        ratingDate: latestRating.ratingDate,
      })
    );
  } catch (error) {
    return handleApiError(error, 'GET /api/clients/[id]/analytics/ratios');
  }
}

