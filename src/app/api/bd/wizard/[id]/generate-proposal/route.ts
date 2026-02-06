/**
 * BD Wizard Generate Proposal API
 * POST /api/bd/wizard/[id]/generate-proposal - Generate proposal from template
 */

import { NextResponse } from 'next/server';
import { secureRoute, Feature } from '@/lib/api/secureRoute';
import { z } from 'zod';
import { parseNumericId, successResponse } from '@/lib/utils/apiUtils';
import { prisma } from '@/lib/db/prisma';
import { AppError, ErrorCodes } from '@/lib/utils/errorHandler';
import { logger } from '@/lib/utils/logger';

const GenerateProposalSchema = z.object({
  templateId: z.number().int().positive(),
});

export const POST = secureRoute.mutationWithParams({
  feature: Feature.ACCESS_BD,
  schema: GenerateProposalSchema,
  handler: async (request, { data, user, params }) => {
    const opportunityId = parseNumericId(params.id, 'Opportunity');

    // Get opportunity with client data
    const opportunity = await prisma.bDOpportunity.findUnique({
      where: { id: opportunityId },
      include: {
        Client: {
          select: {
            clientNameFull: true,
            clientCode: true,
          },
        },
      },
    });

    if (!opportunity) {
      throw new AppError(
        404,
        'Opportunity not found',
        ErrorCodes.NOT_FOUND
      );
    }

    // Get template
    const template = await prisma.template.findUnique({
      where: { id: data.templateId },
      select: {
        id: true,
        name: true,
        type: true,
      },
    });

    if (!template) {
      throw new AppError(
        404,
        'Template not found',
        ErrorCodes.NOT_FOUND
      );
    }

    if (template.type !== 'PROPOSAL') {
      throw new AppError(
        400,
        'Template is not a proposal template',
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Generate proposal from template
    const { generateProposalFromTemplate } = await import(
      '@/lib/services/templates/templateGenerator'
    );

    const generated = await generateProposalFromTemplate(
      opportunityId,
      data.templateId,
      false // Don't use AI adaptation for initial implementation
    );

    const companyName =
      opportunity.Client?.clientNameFull || opportunity.companyName || 'Company';

    const proposalTitle = `Proposal for ${companyName}`;

    // Create BDProposal record
    const proposal = await prisma.bDProposal.create({
      data: {
        opportunityId,
        title: proposalTitle,
        description: `Generated from template: ${template.name}`,
        fileName: `${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_Proposal.md`,
        filePath: `/proposals/${opportunityId}/generated_${Date.now()}.md`,
        fileSize: generated.content.length,
        proposedValue: opportunity.value || undefined,
        status: 'DRAFT',
        version: 1,
        uploadedBy: user.id,
      },
      select: {
        id: true,
        title: true,
        fileName: true,
      },
    });

    logger.info('Proposal generated from template', {
      opportunityId,
      proposalId: proposal.id,
      templateId: data.templateId,
    });

    return NextResponse.json(
      successResponse({
        proposalId: proposal.id,
        title: proposal.title,
        fileName: proposal.fileName,
        content: generated.content,
      })
    );
  },
});
