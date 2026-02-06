/**
 * BD Opportunity Wizard Service
 * Business logic for the multi-step opportunity creation wizard
 */

import { prisma } from '@/lib/db/prisma';
import { AppError, ErrorCodes } from '@/lib/utils/errorHandler';
import { logger } from '@/lib/utils/logger';
import type { BDWizardData } from '@/types/bd-wizard';
import { invalidateWorkspaceCounts, invalidateApprovalsCache } from '@/lib/services/cache/cacheInvalidation';
import { getOrCreateClientAcceptance } from '@/lib/services/acceptance/clientAcceptanceService';
import { randomUUID } from 'crypto';

/**
 * Create a new wizard session with an opportunity stub
 */
export async function createWizardSession(
  userId: string,
  serviceLine: string
): Promise<{ id: number; wizardData: BDWizardData }> {
  try {
    // Get default stage for the service line
    const defaultStage = await prisma.bDStage.findFirst({
      where: {
        OR: [
          { serviceLine, isDefault: true, isActive: true },
          { serviceLine: null, isDefault: true, isActive: true },
        ],
      },
      orderBy: [{ serviceLine: 'desc' }, { order: 'asc' }],
    });

    if (!defaultStage) {
      throw new AppError(
        404,
        'No default stage found for service line',
        ErrorCodes.NOT_FOUND
      );
    }

    // Initialize wizard data
    const initialWizardData: BDWizardData = {
      workflowType: 'existing',
      opportunityDetails: {
        title: '',
        serviceLine,
        stageId: defaultStage.id,
      },
      proposalType: 'quick',
    };

    // Create opportunity stub
    const opportunity = await prisma.bDOpportunity.create({
      data: {
        title: 'Draft Opportunity',
        serviceLine,
        stageId: defaultStage.id,
        status: 'DRAFT',
        assignedTo: userId,
        createdBy: userId,
        wizardStep: 1,
        wizardCompleted: false,
        wizardData: JSON.stringify(initialWizardData),
      },
      select: {
        id: true,
        wizardData: true,
      },
    });

    logger.info('Wizard session created', {
      opportunityId: opportunity.id,
      userId,
      serviceLine,
    });

    return {
      id: opportunity.id,
      wizardData: initialWizardData,
    };
  } catch (error) {
    logger.error('Failed to create wizard session', error);
    throw error;
  }
}

/**
 * Save wizard progress after each step
 */
export async function saveWizardProgress(
  opportunityId: number,
  step: number,
  wizardData: BDWizardData
): Promise<void> {
  try {
    await prisma.bDOpportunity.update({
      where: { id: opportunityId },
      data: {
        wizardStep: step,
        wizardData: JSON.stringify(wizardData),
        updatedAt: new Date(),
      },
    });

    logger.info('Wizard progress saved', {
      opportunityId,
      step,
    });
  } catch (error) {
    logger.error('Failed to save wizard progress', error);
    throw error;
  }
}

/**
 * Validate team assignment - ensure distinct employees and valid partner
 */
export async function validateTeamAssignment(
  partnerCode: string,
  managerCode: string,
  inchargeCode: string
): Promise<void> {
  // Check that all are different
  if (
    partnerCode === managerCode ||
    partnerCode === inchargeCode ||
    managerCode === inchargeCode
  ) {
    throw new AppError(
      400,
      'Partner, Manager, and Incharge must be different people',
      ErrorCodes.VALIDATION_ERROR
    );
  }

  // Validate partner exists and has correct category
  const partner = await prisma.employee.findFirst({
    where: {
      EmpCode: partnerCode,
      Active: 'Yes',
    },
    select: {
      EmpCode: true,
      EmpCatCode: true,
      EmpNameFull: true,
    },
  });

  if (!partner) {
    throw new AppError(
      400,
      `Partner ${partnerCode} not found or inactive`,
      ErrorCodes.VALIDATION_ERROR
    );
  }

  if (!['CARL', 'LOCAL', 'DIR'].includes(partner.EmpCatCode)) {
    throw new AppError(
      400,
      `Employee ${partner.EmpNameFull} is not eligible to be a partner (category: ${partner.EmpCatCode})`,
      ErrorCodes.VALIDATION_ERROR
    );
  }

  // Validate manager exists and is active
  const manager = await prisma.employee.findFirst({
    where: {
      EmpCode: managerCode,
      Active: 'Yes',
    },
    select: {
      EmpCode: true,
      EmpNameFull: true,
    },
  });

  if (!manager) {
    throw new AppError(
      400,
      `Manager ${managerCode} not found or inactive`,
      ErrorCodes.VALIDATION_ERROR
    );
  }

  // Validate incharge exists and is active
  const incharge = await prisma.employee.findFirst({
    where: {
      EmpCode: inchargeCode,
      Active: 'Yes',
    },
    select: {
      EmpCode: true,
      EmpNameFull: true,
    },
  });

  if (!incharge) {
    throw new AppError(
      400,
      `Incharge ${inchargeCode} not found or inactive`,
      ErrorCodes.VALIDATION_ERROR
    );
  }

  logger.info('Team assignment validated', {
    partnerCode,
    managerCode,
    inchargeCode,
  });
}

/**
 * Generate unique client code from company name
 */
async function generateClientCode(companyName: string): Promise<string> {
  // Extract up to 5 characters from company name (alphanumeric only)
  const baseCode = companyName
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 5)
    .toUpperCase();

  // Try the base code first
  let clientCode = baseCode;
  let counter = 1;

  // Check if code exists, if so, append numbers
  while (await prisma.client.findUnique({ where: { clientCode } })) {
    clientCode = `${baseCode}${counter}`;
    counter++;

    // Safety limit
    if (counter > 9999) {
      throw new Error('Could not generate unique client code');
    }
  }

  return clientCode;
}

/**
 * Create prospect client and initialize acceptance
 */
export async function createProspectClient(
  opportunityId: number,
  wizardData: BDWizardData,
  userId: string
): Promise<{ clientId: number; acceptanceId: number }> {
  if (!wizardData.prospectDetails || !wizardData.teamAssignment) {
    throw new AppError(
      400,
      'Prospect details and team assignment required',
      ErrorCodes.VALIDATION_ERROR
    );
  }

  // Validate team assignment
  await validateTeamAssignment(
    wizardData.teamAssignment.partnerCode,
    wizardData.teamAssignment.managerCode,
    wizardData.teamAssignment.inchargeCode
  );

  try {
    // Generate client code
    const clientCode = await generateClientCode(
      wizardData.prospectDetails.companyName
    );

    // Get group code (required field)
    const groupCode = wizardData.prospectDetails.groupCode || 'DEFAULT';

    // Get group description from existing client in the same group
    const existingClient = await prisma.client.findFirst({
      where: { groupCode },
      select: { groupDesc: true },
    });

    const groupDesc = existingClient?.groupDesc || groupCode;

    // Create client with prospect flag
    const client = await prisma.client.create({
      data: {
        clientCode,
        clientNameFull: wizardData.prospectDetails.companyName,
        groupCode,
        groupDesc,
        clientPartner: wizardData.teamAssignment.partnerCode,
        clientManager: wizardData.teamAssignment.managerCode,
        clientIncharge: wizardData.teamAssignment.inchargeCode,
        prospect: true, // KEY: Mark as prospect
        active: 'Yes',
        industry: wizardData.prospectDetails.industry,
        sector: wizardData.prospectDetails.sector,
        email: wizardData.prospectDetails.email,
        clientTel: wizardData.prospectDetails.phone,
        clientDateOpen: new Date(),
        clientOCFlag: false,
        rolePlayer: false,
        typeCode: 'PROSPECT',
        typeDesc: 'Prospect',
        GSClientID: randomUUID(),
      },
      select: {
        id: true,
        clientCode: true,
        clientNameFull: true,
      },
    });

    // Link client to opportunity
    await prisma.bDOpportunity.update({
      where: { id: opportunityId },
      data: {
        clientId: client.id,
        companyName: null, // Clear company name since we now have a client
      },
    });

    // Initialize client acceptance
    const acceptance = await getOrCreateClientAcceptance(client.id, userId);

    // Invalidate caches
    await invalidateWorkspaceCounts(
      wizardData.opportunityDetails.serviceLine,
      undefined
    );

    logger.info('Prospect client created', {
      clientId: client.id,
      clientCode: client.clientCode,
      opportunityId,
      userId,
    });

    return {
      clientId: client.id,
      acceptanceId: acceptance.id,
    };
  } catch (error) {
    logger.error('Failed to create prospect client', error);
    throw error;
  }
}

/**
 * Complete wizard and finalize opportunity
 */
export async function completeWizard(
  opportunityId: number,
  finalStageId: number,
  wizardData: BDWizardData
): Promise<void> {
  try {
    // Update opportunity with final details
    await prisma.bDOpportunity.update({
      where: { id: opportunityId },
      data: {
        title: wizardData.opportunityDetails.title,
        description: wizardData.opportunityDetails.description,
        value: wizardData.opportunityDetails.value,
        probability: wizardData.opportunityDetails.probability,
        expectedCloseDate: wizardData.opportunityDetails.expectedCloseDate
          ? new Date(wizardData.opportunityDetails.expectedCloseDate)
          : null,
        source: wizardData.opportunityDetails.source,
        serviceLine: wizardData.opportunityDetails.servLineCode || wizardData.opportunityDetails.serviceLine, // Use specific service line if selected
        stageId: finalStageId,
        // Assignment scheduling
        assignmentType: wizardData.opportunityDetails.assignmentType,
        startDate: wizardData.opportunityDetails.startDate
          ? new Date(wizardData.opportunityDetails.startDate)
          : null,
        endDate: wizardData.opportunityDetails.endDate
          ? new Date(wizardData.opportunityDetails.endDate)
          : null,
        recurringFrequency: wizardData.opportunityDetails.recurringFrequency || null,
        status: 'OPEN', // Change from DRAFT to OPEN
        wizardCompleted: true,
        wizardData: null, // Clear wizard state
        updatedAt: new Date(),
      },
    });

    // Invalidate caches
    await invalidateWorkspaceCounts(
      wizardData.opportunityDetails.serviceLine,
      undefined
    );

    logger.info('Wizard completed', {
      opportunityId,
      finalStageId,
    });
  } catch (error) {
    logger.error('Failed to complete wizard', error);
    throw error;
  }
}

/**
 * Get wizard state for resuming
 */
export async function getWizardState(
  opportunityId: number
): Promise<{ step: number; wizardData: BDWizardData } | null> {
  try {
    const opportunity = await prisma.bDOpportunity.findUnique({
      where: { id: opportunityId },
      select: {
        wizardStep: true,
        wizardData: true,
        wizardCompleted: true,
      },
    });

    if (!opportunity || opportunity.wizardCompleted || !opportunity.wizardData) {
      return null;
    }

    return {
      step: opportunity.wizardStep || 1,
      wizardData: JSON.parse(opportunity.wizardData) as BDWizardData,
    };
  } catch (error) {
    logger.error('Failed to get wizard state', error);
    return null;
  }
}
