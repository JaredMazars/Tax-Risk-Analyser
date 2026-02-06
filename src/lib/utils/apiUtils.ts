import { NextRequest } from 'next/server';
import { prisma } from '../db/prisma';
import { AppError, ErrorCodes } from './errorHandler';
import { Prisma } from '@prisma/client';
import { GSClientIDSchema } from '@/lib/validation/schemas';
import {
  TaskId, toTaskId,
  AdjustmentId, toAdjustmentId,
  ToolId, toToolId,
  DocumentId, toDocumentId,
  ApprovalId, toApprovalId,
  GSClientID as GSClientIDType,
  toGSClientID as toGSClientIDBranded,
} from '@/types/branded';

/**
 * Common utility functions for API routes
 */

/**
 * Generic numeric ID parser and validator for route params.
 * Use the entity-specific parsers (parseTaskId, parseAdjustmentId, etc.) when available
 * for branded type safety. Use this function for entities without a dedicated parser.
 * @param id - String ID from route params
 * @param entityName - Name of the entity (e.g., 'Project', 'Adjustment', 'Document')
 * @param required - Whether the ID is required (default: true)
 * @returns Validated numeric ID
 * @throws AppError if ID is invalid
 */
export function parseNumericId(
  id: string | undefined,
  entityName: string,
  required: boolean = true
): number {
  const sanitized = sanitizeRouteParam(id);
  if (!sanitized) {
    throw new AppError(
      400,
      required ? `${entityName} ID is required` : `Invalid ${entityName} ID`,
      ErrorCodes.VALIDATION_ERROR,
      { providedId: id, type: typeof id }
    );
  }

  const parsedId = Number.parseInt(sanitized, 10);

  if (Number.isNaN(parsedId) || parsedId <= 0) {
    throw new AppError(
      400,
      `Invalid ${entityName} ID format - must be a positive integer`,
      ErrorCodes.VALIDATION_ERROR,
      { providedId: id, parsedValue: parsedId }
    );
  }

  return parsedId;
}

/**
 * Sanitize route param values that may arrive as literal strings "undefined" or "null"
 * from Next.js dynamic route segments.
 * @param id - Raw string from route params
 * @returns The id if valid, or undefined if it's a sentinel value
 */
function sanitizeRouteParam(id: string | undefined): string | undefined {
  if (!id || id === 'undefined' || id === 'null') {
    return undefined;
  }
  return id;
}

/**
 * Parse and validate a numeric ID from route params, returning a branded type.
 * Handles route-param edge cases (undefined, 'undefined', 'null' strings) before
 * delegating to the branded converter.
 * @param id - String ID from route params
 * @param entityName - Name of the entity for error messages
 * @param converter - Branded type converter function
 * @param required - Whether the ID is required (default: true)
 * @returns Validated branded numeric ID
 * @throws AppError if ID is invalid or missing
 */
function parseNumericIdBranded<T>(
  id: string | undefined,
  entityName: string,
  converter: (value: unknown) => T,
  required: boolean = true
): T {
  const sanitized = sanitizeRouteParam(id);
  if (!sanitized) {
    throw new AppError(
      400,
      required ? `${entityName} ID is required` : `Invalid ${entityName} ID`,
      ErrorCodes.VALIDATION_ERROR,
      { providedId: id, type: typeof id }
    );
  }
  return converter(sanitized);
}

/**
 * Parse and validate task ID from route params
 * @param id - String ID from route params
 * @returns Validated branded TaskId
 * @throws AppError if ID is invalid
 */
export function parseTaskId(id: string | undefined): TaskId {
  return parseNumericIdBranded(id, 'Task', toTaskId);
}

/**
 * Parse and validate GSClientID (GUID) from route params
 * @param id - String ID from route params
 * @returns Validated branded GSClientID
 * @throws AppError if ID is invalid
 */
export function parseGSClientID(id: string | undefined): GSClientIDType {
  const sanitized = sanitizeRouteParam(id);
  if (!sanitized) {
    throw new AppError(
      400,
      'Client ID is required',
      ErrorCodes.VALIDATION_ERROR,
      { providedId: id, type: typeof id }
    );
  }

  const result = GSClientIDSchema.safeParse(sanitized);

  if (!result.success) {
    throw new AppError(
      400,
      'Invalid Client ID format - must be a valid GUID',
      ErrorCodes.VALIDATION_ERROR,
      { providedId: id }
    );
  }

  return toGSClientIDBranded(result.data);
}

/**
 * Parse and validate adjustment ID from route params
 * @param id - String ID from route params
 * @returns Validated branded AdjustmentId
 * @throws AppError if ID is invalid
 */
export function parseAdjustmentId(id: string | undefined): AdjustmentId {
  return parseNumericIdBranded(id, 'Adjustment', toAdjustmentId);
}

/**
 * Parse and validate tool ID from route params
 * @param id - String ID from route params
 * @returns Validated branded ToolId
 * @throws AppError if ID is invalid
 */
export function parseToolId(id: string | undefined): ToolId {
  return parseNumericIdBranded(id, 'Tool', toToolId);
}

/**
 * Parse and validate document ID from route params
 * @param id - String ID from route params
 * @returns Validated branded DocumentId
 * @throws AppError if ID is invalid
 */
export function parseDocumentId(id: string): DocumentId {
  return parseNumericIdBranded(id, 'Document', toDocumentId, false);
}

/**
 * Parse and validate approval ID from route params
 * @param id - String ID from route params
 * @returns Validated branded ApprovalId
 * @throws AppError if ID is invalid
 */
export function parseApprovalId(id: string | undefined): ApprovalId {
  return parseNumericIdBranded(id, 'Approval', toApprovalId);
}

/**
 * Fetch task by ID or throw 404 error
 * @param taskId - Task ID
 * @param include - Optional Prisma include object
 * @returns Task object
 * @throws AppError if task not found
 */
export async function getTaskOrThrow(
  taskId: number,
  include?: Prisma.TaskInclude
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include,
  });
  
  if (!task) {
    throw new AppError(
      404,
      'Task not found',
      ErrorCodes.NOT_FOUND,
      { taskId }
    );
  }
  
  return task;
}


/**
 * Fetch tax adjustment by ID or throw 404 error
 * @param adjustmentId - Adjustment ID
 * @param include - Optional Prisma include object
 * @returns Tax adjustment object
 * @throws AppError if adjustment not found
 */
export async function getTaxAdjustmentOrThrow(
  adjustmentId: number,
  include?: Prisma.TaxAdjustmentInclude
) {
  const adjustment = await prisma.taxAdjustment.findUnique({
    where: { id: adjustmentId },
    include,
  });
  
  if (!adjustment) {
    throw new AppError(
      404,
      'Tax adjustment not found',
      ErrorCodes.NOT_FOUND,
      { adjustmentId }
    );
  }
  
  return adjustment;
}

/**
 * Fetch document by ID or throw 404 error
 * @param documentId - Document ID
 * @param include - Optional Prisma include object
 * @returns Adjustment document object
 * @throws AppError if document not found
 */
export async function getDocumentOrThrow(
  documentId: number,
  include?: Prisma.AdjustmentDocumentInclude
) {
  const document = await prisma.adjustmentDocument.findUnique({
    where: { id: documentId },
    include,
  });
  
  if (!document) {
    throw new AppError(
      404,
      'Document not found',
      ErrorCodes.NOT_FOUND,
      { documentId }
    );
  }
  
  return document;
}

/**
 * Fetch mapped account by ID or throw 404 error
 * @param accountId - Account ID
 * @param include - Optional Prisma include object
 * @returns Mapped account object
 * @throws AppError if account not found
 */
export async function getMappedAccountOrThrow(
  accountId: number,
  include?: Prisma.MappedAccountInclude
) {
  const account = await prisma.mappedAccount.findUnique({
    where: { id: accountId },
    include,
  });
  
  if (!account) {
    throw new AppError(
      404,
      'Mapped account not found',
      ErrorCodes.NOT_FOUND,
      { accountId }
    );
  }
  
  return account;
}

/**
 * Verify that a task exists and is accessible
 * Useful for authorization checks
 * @param taskId - Task ID to verify
 * @throws AppError if task doesn't exist
 */
export async function verifyTaskExists(taskId: number): Promise<void> {
  const exists = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true },
  });
  
  if (!exists) {
    throw new AppError(
      404,
      'Task not found',
      ErrorCodes.NOT_FOUND,
      { taskId }
    );
  }
}


/**
 * Verify that an adjustment belongs to a specific task
 * @param adjustmentId - Adjustment ID
 * @param taskId - Expected task ID
 * @throws AppError if adjustment doesn't belong to task
 */
export async function verifyAdjustmentBelongsToTask(
  adjustmentId: number,
  taskId: number
): Promise<void> {
  const adjustment = await prisma.taxAdjustment.findUnique({
    where: { id: adjustmentId },
    select: { taskId: true },
  });
  
  if (!adjustment) {
    throw new AppError(
      404,
      'Tax adjustment not found',
      ErrorCodes.NOT_FOUND,
      { adjustmentId }
    );
  }
  
  if (adjustment.taskId !== taskId) {
    throw new AppError(
      403,
      'Tax adjustment does not belong to this task',
      ErrorCodes.FORBIDDEN,
      { adjustmentId, taskId, actualTaskId: adjustment.taskId }
    );
  }
}


/**
 * Extract pagination params from request
 * @param request - The incoming request
 * @returns Object with page, limit, and offset
 */
export function getPaginationParams(request: NextRequest): {
  page: number;
  limit: number;
  offset: number;
} {
  const { searchParams } = new URL(request.url);
  const page = Number.parseInt(searchParams.get('page') || '1');
  const limit = Math.min(Number.parseInt(searchParams.get('limit') || '50'), 100);
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
}

/**
 * Extract sort params from request
 * @param request - The incoming request
 * @param defaultSort - Default sort field (default: 'createdAt')
 * @param allowedFields - Optional allowlist of permitted sort fields. If provided, user-supplied
 *   sortBy values not in this list will be replaced with defaultSort to prevent field enumeration.
 *   Callers SHOULD provide this for security.
 */
export function getSortParams(
  request: NextRequest,
  defaultSort: string = 'createdAt',
  allowedFields?: string[]
): {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
} {
  const { searchParams } = new URL(request.url);
  let sortBy = searchParams.get('sortBy') || defaultSort;

  // Validate against allowlist if provided
  if (allowedFields && !allowedFields.includes(sortBy)) {
    sortBy = defaultSort;
  }

  const sortOrderParam = searchParams.get('sortOrder');
  const sortOrder: 'asc' | 'desc' = sortOrderParam === 'asc' ? 'asc' : 'desc';
  
  return { sortBy, sortOrder };
}

/**
 * Standard success response formatter
 * @param data - Response data
 * @param meta - Optional metadata (pagination, etc.)
 * @returns Formatted response object
 */
export function successResponse<T>(data: T, meta?: Record<string, unknown>) {
  return {
    success: true,
    data,
    ...(meta ? { meta } : {}),
  };
}

/**
 * Calculate pagination metadata
 * @param total - Total number of items
 * @param page - Current page number
 * @param limit - Items per page
 * @returns Pagination metadata
 */
export function paginationMeta(total: number, page: number, limit: number) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}



