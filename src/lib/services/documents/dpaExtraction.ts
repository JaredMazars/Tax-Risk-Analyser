/**
 * DPA (Data Processing Agreement) Extraction Service
 * 
 * Uses Azure Document Intelligence and AI to extract and validate
 * metadata from DPA PDFs including signatures, dates, and partner information.
 */

import { z } from 'zod';
import { generateObject } from 'ai';
import { documentIntelligence } from './documentIntelligence';
import { models } from '@/lib/ai/config';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logger';

// Zod schema for extracted DPA metadata
const DpaMetadataSchema = z.object({
  dpaDate: z.string().nullable(), // ISO date string or null
  signingPartner: z.string().nullable(),
  hasPartnerSignature: z.boolean(),
  hasClientSignature: z.boolean(),
  confidence: z.object({
    dpaDate: z.number().min(0).max(1),
    signatures: z.number().min(0).max(1),
  }),
});

type DpaMetadata = z.infer<typeof DpaMetadataSchema>;

export interface ExtractedDpaData {
  isValid: boolean;
  errors: string[];
  dpaDate: Date | null;
  dpaAge: number | null;
  signingPartner: string | null;
  partnerCode: string | null;
  hasPartnerSignature: boolean;
  hasClientSignature: boolean;
  extractedText?: string;
}

/**
 * Main function to extract metadata from DPA PDF
 */
export async function extractDpaMetadata(
  buffer: Buffer,
  taskId: number
): Promise<ExtractedDpaData> {
  try {
    logger.info('Starting DPA extraction', { taskId });

    // 1. Get task context for AI analysis
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        TaskPartner: true,
        TaskPartnerName: true,
        Client: {
          select: {
            clientNameFull: true,
          },
        },
      },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // 2. Extract text using Azure Document Intelligence
    logger.info('Extracting text from DPA with Document Intelligence', { taskId });
    const extractedText = await documentIntelligence.extractTextFromPDF(buffer);

    if (!extractedText || extractedText.length < 50) {
      throw new Error('Insufficient text extracted from DPA. The document may be image-based or corrupted.');
    }

    logger.info('DPA text extraction successful', { 
      taskId, 
      textLength: extractedText.length 
    });

    // 3. Analyze content with AI
    const metadata = await analyzeDpaContent(
      extractedText,
      {
        taskPartner: task.TaskPartnerName,
        taskPartnerCode: task.TaskPartner,
        clientName: task.Client?.clientNameFull || 'Unknown',
      }
    );

    // 4. Validate extracted data
    const validation = validateDpaData(metadata);

    // 5. Match partner code
    const partnerCode = await matchPartnerCode(
      metadata.signingPartner,
      task.TaskPartner
    );

    // 6. Calculate DPA age
    const dpaDate = metadata.dpaDate ? new Date(metadata.dpaDate) : null;
    const dpaAge = dpaDate 
      ? Math.floor((Date.now() - dpaDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const result: ExtractedDpaData = {
      isValid: validation.isValid,
      errors: validation.errors,
      dpaDate,
      dpaAge,
      signingPartner: metadata.signingPartner,
      partnerCode,
      hasPartnerSignature: metadata.hasPartnerSignature,
      hasClientSignature: metadata.hasClientSignature,
      extractedText: extractedText.substring(0, 50000), // Store first 50k chars
    };

    logger.info('DPA extraction completed', {
      taskId,
      isValid: result.isValid,
      errorCount: result.errors.length,
    });

    return result;
  } catch (error) {
    logger.error('DPA extraction failed', { taskId, error });
    throw error;
  }
}

/**
 * Analyze DPA content using AI
 */
async function analyzeDpaContent(
  text: string,
  context: {
    taskPartner: string;
    taskPartnerCode: string;
    clientName: string;
  }
): Promise<DpaMetadata> {
  const prompt = `You are analyzing a Data Processing Agreement (DPA) document. Extract the following information:

DOCUMENT TEXT:
${text.substring(0, 50000)}

TASK CONTEXT:
- Task Partner: ${context.taskPartner} (${context.taskPartnerCode})
- Client: ${context.clientName}

EXTRACTION REQUIREMENTS:

1. DPA DATE:
   - Look for date near "Data Processing Agreement" or "DPA" heading or at top of document
   - Common formats: "15 January 2024", "2024-01-15", "January 15, 2024"
   - Return as ISO date string (YYYY-MM-DD)
   - Look for phrases like "Date:", "Dated:", "Effective date:", or dates in signature section

2. SIGNING PARTNER:
   - Look for partner/firm representative name near signature section at end of document
   - May appear as "Partner:", "Signed by:", "For and on behalf of Forvis Mazars", or after "pp" (per procurationem)
   - Cross-check against task partner: ${context.taskPartner}
   - Often appears above or below "Yours faithfully" or similar closing

3. SIGNATURES:
   - Partner/Firm Signature: Look for keywords "signed", "signature", "pp", partner name, "for Forvis Mazars", or "Data Processor signature"
   - Client Signature: Look for keywords "acknowledged", "accepted", "client signature", "Data Controller signature", "on behalf of" followed by client name
   
   Note: Be generous in detecting signatures - look for any indication of signing intent, signature lines, or execution clauses

4. CONFIDENCE SCORES:
   - Return confidence scores between 0 and 1
   - Only return data with confidence > 0.5
   - Higher confidence when multiple indicators present

Return JSON with the extracted information. Be thorough but accurate.`;

  try {
    const result = await generateObject({
      model: models.nano,
      schema: DpaMetadataSchema,
      prompt,
    });

    return result.object;
  } catch (error) {
    logger.error('AI analysis failed for DPA', { error });
    throw new Error('Failed to analyze DPA content with AI');
  }
}

/**
 * Validate extracted DPA data
 */
function validateDpaData(
  metadata: DpaMetadata
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate DPA date
  if (!metadata.dpaDate) {
    errors.push('DPA date not found in document');
  } else {
    const date = new Date(metadata.dpaDate);
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    
    if (date < fiveYearsAgo) {
      errors.push('DPA date is more than 5 years old');
    }
    
    if (date > new Date()) {
      errors.push('DPA date is in the future');
    }
  }

  // Validate signing partner
  if (!metadata.signingPartner) {
    errors.push('Signing partner/representative name not identified');
  }

  // Validate signatures
  if (!metadata.hasPartnerSignature) {
    errors.push('Partner/firm signature not found on DPA');
  }

  if (!metadata.hasClientSignature) {
    errors.push('Client signature not found on DPA');
  }

  // Check confidence scores
  if (metadata.confidence.signatures < 0.5) {
    errors.push('Low confidence in signature detection - please verify document quality');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Match partner name to employee code
 */
async function matchPartnerCode(
  partnerName: string | null,
  taskPartnerCode: string
): Promise<string | null> {
  if (!partnerName) {
    return null;
  }

  try {
    // First, check if the task partner matches
    const taskPartner = await prisma.employee.findFirst({
      where: {
        EmpCode: taskPartnerCode,
      },
      select: {
        EmpCode: true,
        EmpName: true,
      },
    });

    if (taskPartner) {
      // Simple name matching (case-insensitive, partial match)
      const normalizedTaskName = taskPartner.EmpName.toLowerCase().trim();
      const normalizedExtractedName = partnerName.toLowerCase().trim();

      if (
        normalizedTaskName.includes(normalizedExtractedName) ||
        normalizedExtractedName.includes(normalizedTaskName)
      ) {
        return taskPartner.EmpCode;
      }
    }

    // Search for partner by name in Employee table
    const employees = await prisma.employee.findMany({
      where: {
        EmpName: {
          contains: partnerName,
        },
      },
      select: {
        EmpCode: true,
        EmpName: true,
      },
      take: 5,
    });

    if (employees.length === 1 && employees[0]) {
      return employees[0].EmpCode;
    }

    // If multiple matches or no matches, return null
    return null;
  } catch (error) {
    logger.error('Error matching partner code for DPA', { partnerName, error });
    return null;
  }
}
