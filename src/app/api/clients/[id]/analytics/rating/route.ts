import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { successResponse } from '@/lib/utils/apiUtils';
import { handleApiError } from '@/lib/utils/errorHandler';
import { CreditRatingAnalyzer } from '@/lib/services/analytics/creditRatingAnalyzer';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/clients/[id]/analytics/rating
 * Fetch credit rating history for a client
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: any = { clientId };
    if (startDate || endDate) {
      where.ratingDate = {};
      if (startDate) where.ratingDate.gte = new Date(startDate);
      if (endDate) where.ratingDate.lte = new Date(endDate);
    }

    // Fetch ratings with documents
    const ratings = await prisma.clientCreditRating.findMany({
      where,
      orderBy: { ratingDate: 'desc' },
      take: limit,
      include: {
        Documents: {
          include: {
            AnalyticsDocument: true,
          },
        },
      },
    });

    // Transform the data
    const transformedRatings = ratings.map((rating) => ({
      ...rating,
      analysisReport: JSON.parse(rating.analysisReport),
      financialRatios: JSON.parse(rating.financialRatios),
      documents: rating.Documents.map((d) => d.AnalyticsDocument),
    }));

    return NextResponse.json(
      successResponse({
        ratings: transformedRatings,
        totalCount: transformedRatings.length,
      })
    );
  } catch (error) {
    return handleApiError(error, 'GET /api/clients/[id]/analytics/rating');
  }
}

/**
 * POST /api/clients/[id]/analytics/rating
 * Generate a new credit rating
 */
export async function POST(
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

    // Parse request body
    const body = await request.json();
    const { documentIds } = body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one document ID is required' },
        { status: 400 }
      );
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        clientNameFull: true,
        clientCode: true,
        industry: true,
        sector: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Fetch documents
    const documents = await prisma.clientAnalyticsDocument.findMany({
      where: {
        id: { in: documentIds },
        clientId,
      },
    });

    if (documents.length === 0) {
      return NextResponse.json(
        { error: 'No valid documents found for the provided IDs' },
        { status: 404 }
      );
    }

    if (documents.length !== documentIds.length) {
      return NextResponse.json(
        {
          error: 'Some document IDs are invalid',
          found: documents.length,
          requested: documentIds.length,
        },
        { status: 400 }
      );
    }

    logger.info('Starting credit rating generation', {
      clientId,
      clientName: client.clientNameFull || client.clientCode,
      documentCount: documents.length,
      userId: user.email,
    });

    // Generate credit rating using AI
    const result = await CreditRatingAnalyzer.analyzeCreditRating(
      {
        id: client.id,
        name: client.clientNameFull || client.clientCode,
        industry: client.industry || undefined,
        sector: client.sector || undefined,
      },
      documents.map((doc) => ({
        id: doc.id,
        fileName: doc.fileName,
        documentType: doc.documentType,
        extractedData: doc.extractedData,
      }))
    );

    // Save rating to database
    const rating = await prisma.clientCreditRating.create({
      data: {
        clientId,
        ratingScore: result.ratingScore,
        ratingGrade: result.ratingGrade,
        analysisReport: JSON.stringify(result.analysisReport),
        financialRatios: JSON.stringify(result.financialRatios),
        confidence: result.confidence,
        analyzedBy: user.email!,
      },
    });

    // Create junction table entries linking rating to documents
    await prisma.creditRatingDocument.createMany({
      data: documentIds.map((docId: number) => ({
        creditRatingId: rating.id,
        analyticsDocumentId: docId,
      })),
    });

    // Fetch complete rating with documents
    const completeRating = await prisma.clientCreditRating.findUnique({
      where: { id: rating.id },
      include: {
        Documents: {
          include: {
            AnalyticsDocument: true,
          },
        },
      },
    });

    if (!completeRating) {
      throw new Error('Failed to fetch created rating');
    }

    // Transform response
    const transformedRating = {
      ...completeRating,
      analysisReport: JSON.parse(completeRating.analysisReport),
      financialRatios: JSON.parse(completeRating.financialRatios),
      documents: completeRating.Documents.map((d) => d.AnalyticsDocument),
    };

    logger.info('Credit rating generated successfully', {
      ratingId: rating.id,
      clientId,
      ratingGrade: result.ratingGrade,
      ratingScore: result.ratingScore,
    });

    return NextResponse.json(successResponse(transformedRating), { status: 201 });
  } catch (error) {
    return handleApiError(error, 'POST /api/clients/[id]/analytics/rating');
  }
}

