/**
 * Questionnaire Service
 * Business logic for questionnaire type detection, validation, and management
 */

import { prisma } from '@/lib/db/prisma';
import {
  QuestionnaireType,
  getQuestionnaireDefinition,
  getAllQuestions,
  QuestionSection,
} from '@/constants/acceptance-questions';

export interface QuestionnaireTypeResult {
  recommendedType: QuestionnaireType;
  isNewClient: boolean;
  isLiteEligible: boolean;
  reason: string;
}

/**
 * Helper: Get basic project and client data
 */
async function getProjectData(projectId: number, clientId: number) {
  const [project, previousProjectsCount] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        projectType: true,
        Client: {
          select: {
            id: true,
            clientCode: true,
            groupCode: true,
          },
        },
      },
    }),
    prisma.project.count({
      where: {
        clientId,
        id: { not: projectId },
        acceptanceApproved: true,
      },
    }),
  ]);

  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  return { project, isNewClient: previousProjectsCount === 0 };
}

/**
 * Helper: Determine questionnaire type based on client status and eligibility
 */
function determineQuestionnaireType(isNewClient: boolean, isLiteEligible: boolean): {
  type: QuestionnaireType;
  reason: string;
} {
  if (isNewClient) {
    if (isLiteEligible) {
      return {
        type: 'ACCEPTANCE_LITE',
        reason: 'New client meeting simplified criteria (fees < R250k, non-PIE, standalone)',
      };
    }
    return {
      type: 'ACCEPTANCE_FULL',
      reason: 'New client requiring comprehensive acceptance assessment',
    };
  }

  if (isLiteEligible) {
    return {
      type: 'CONTINUANCE_LITE',
      reason: 'Existing client meeting simplified criteria',
    };
  }

  return {
    type: 'CONTINUANCE_FULL',
    reason: 'Existing client requiring comprehensive continuance assessment',
  };
}

/**
 * Determine the appropriate questionnaire type for a project/client
 * Refactored to reduce cognitive complexity
 */
export async function getQuestionnaireType(
  projectId: number,
  clientId: number
): Promise<QuestionnaireTypeResult> {
  const { project, isNewClient } = await getProjectData(projectId, clientId);
  const isLiteEligible = await checkLiteEligibility(project);
  const { type, reason } = determineQuestionnaireType(isNewClient, isLiteEligible);

  return {
    recommendedType: type,
    isNewClient,
    isLiteEligible,
    reason,
  };
}

/**
 * Check if a project meets LITE eligibility criteria
 * Based on SharePoint AC Lite criteria questions
 */
async function checkLiteEligibility(project: {
  id: number;
  projectType: string;
  Client: { id: number; clientCode: string; groupCode: string } | null;
}): Promise<boolean> {
  // LITE criteria (simplified):
  // 1. Standalone client (not part of group) - check if groupCode matches clientCode
  // 2. Less complex engagement
  // 3. Fees < R250,000 (we'll assume this for now as we don't have fee data)
  // 4. Not a PIE
  // 5. No PEPs
  // 6. Not restricted entity

  if (!project.Client) {
    return false;
  }

  // Check if standalone (group code same as client code typically means standalone)
  const isStandalone = project.Client.groupCode === project.Client.clientCode;

  // For now, we'll use simple heuristics
  // In production, this would check additional data
  const isNotPIE = !project.projectType.includes('PIE'); // Simple check
  const isLessComplex = true; // Would need additional project complexity data

  // Return true if meets basic criteria
  return isStandalone && isNotPIE && isLessComplex;
}

/**
 * Get the questionnaire structure with sections and questions
 * Uses caching for improved performance
 */
export async function getQuestionnaireStructure(type: QuestionnaireType): Promise<QuestionSection[]> {
  // Dynamic import to avoid circular dependencies
  const { getCachedQuestionnaireStructure } = await import('./cache');
  return getCachedQuestionnaireStructure(type);
}

/**
 * Helper: Check if question should be validated
 */
function shouldValidateQuestion(
  question: any,
  answerMap: Map<string, string>
): boolean {
  // Skip non-required and special fields
  if (!question.required || question.fieldType === 'PLACEHOLDER' || question.fieldType === 'BUTTON') {
    return false;
  }

  // Check conditional display
  if (question.conditionalDisplay) {
    const dependentAnswer = answerMap.get(question.conditionalDisplay.dependsOn);
    return dependentAnswer === question.conditionalDisplay.requiredAnswer;
  }

  return true;
}

/**
 * Helper: Validate individual question answer
 */
function validateQuestionAnswer(
  question: any,
  answer: string | undefined,
  errors: string[]
): void {
  // Check if answer exists
  if (!answer || answer.trim() === '') {
    errors.push(`Question "${question.questionText}" is required`);
    return;
  }

  // Validate answer against options if applicable
  if (question.options && !question.options.includes(answer)) {
    errors.push(`Invalid answer for question "${question.questionText}"`);
  }
}

/**
 * Validate questionnaire responses
 * Refactored to reduce cognitive complexity
 */
export function validateQuestionnaireResponses(
  type: QuestionnaireType,
  answers: { questionKey: string; answer: string }[]
): { isValid: boolean; errors: string[] } {
  const questions = getAllQuestions(type);
  const errors: string[] = [];
  const answerMap = new Map(answers.map((a) => [a.questionKey, a.answer]));

  for (const question of questions) {
    if (!shouldValidateQuestion(question, answerMap)) {
      continue;
    }

    const answer = answerMap.get(question.questionKey);
    validateQuestionAnswer(question, answer, errors);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get or create a questionnaire response for a project
 */
export async function getOrCreateResponse(
  projectId: number,
  clientId: number,
  questionnaireType: QuestionnaireType,
  userId: string
) {
  // Check for existing response
  const existing = await prisma.clientAcceptanceResponse.findFirst({
    where: {
      projectId,
      questionnaireType,
    },
    include: {
      AcceptanceAnswer: {
        include: {
          AcceptanceQuestion: true,
        },
      },
      AcceptanceDocument: true,
    },
  });

  if (existing) {
    return existing;
  }

  // Create new response
  return await prisma.clientAcceptanceResponse.create({
    data: {
      projectId,
      clientId,
      questionnaireType,
    },
    include: {
      AcceptanceAnswer: {
        include: {
          AcceptanceQuestion: true,
        },
      },
      AcceptanceDocument: true,
    },
  });
}

/**
 * Check if questionnaire is completed
 */
export async function isQuestionnaireCompleted(responseId: number): Promise<boolean> {
  const response = await prisma.clientAcceptanceResponse.findUnique({
    where: { id: responseId },
    select: {
      completedAt: true,
      completedBy: true,
    },
  });

  return response?.completedAt != null && response?.completedBy != null;
}

/**
 * Mark questionnaire as completed
 */
export async function markQuestionnaireCompleted(
  responseId: number,
  userId: string
) {
  return await prisma.clientAcceptanceResponse.update({
    where: { id: responseId },
    data: {
      completedAt: new Date(),
      completedBy: userId,
    },
  });
}

/**
 * Get questionnaire completion status
 */
export async function getQuestionnaireStatus(projectId: number) {
  const response = await prisma.clientAcceptanceResponse.findFirst({
    where: { projectId },
    include: {
      AcceptanceAnswer: true,
      AcceptanceDocument: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!response) {
    return {
      exists: false,
      completed: false,
      reviewed: false,
      answerCount: 0,
      documentCount: 0,
    };
  }

  return {
    exists: true,
    completed: response.completedAt != null,
    reviewed: response.reviewedAt != null,
    answerCount: response.AcceptanceAnswer.length,
    documentCount: response.AcceptanceDocument.length,
    questionnaireType: response.questionnaireType,
    riskRating: response.riskRating,
    overallRiskScore: response.overallRiskScore,
    completedAt: response.completedAt,
    completedBy: response.completedBy,
    reviewedAt: response.reviewedAt,
    reviewedBy: response.reviewedBy,
  };
}

/**
 * Check if user can edit questionnaire
 * - Can edit if not completed
 * - Can edit if completed but not reviewed (can make changes before review)
 * - Cannot edit if reviewed
 */
export function canEditQuestionnaire(response: {
  completedAt: Date | null;
  reviewedAt: Date | null;
}): boolean {
  // If reviewed, cannot edit
  if (response.reviewedAt) {
    return false;
  }

  // Can edit if not completed or completed but not reviewed
  return true;
}


