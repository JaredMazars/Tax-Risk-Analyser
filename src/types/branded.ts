/**
 * Branded types for type-safe IDs
 * Prevents accidentally mixing different ID types
 *
 * NOTE: This file is imported by client-side components via re-export from @/types.
 * It MUST NOT import any server-only modules (errorHandler, logger, prisma, etc.)
 * to avoid pulling Node.js dependencies (winston/fs) into the client bundle.
 * Server-side callers (e.g. parseXxxId in apiUtils.ts) wrap these with AppError.
 */

// Branded type definitions
export type TaskId = number & { readonly __brand: 'TaskId' };
export type UserId = string & { readonly __brand: 'UserId' };
export type DraftId = number & { readonly __brand: 'DraftId' };
export type ClientId = number & { readonly __brand: 'ClientId' };
export type GSClientID = string & { readonly __brand: 'GSClientID' };
export type GSTaskID = string & { readonly __brand: 'GSTaskID' };
export type EmployeeId = number & { readonly __brand: 'EmployeeId' };
export type GSEmployeeID = string & { readonly __brand: 'GSEmployeeID' };
export type AdjustmentId = number & { readonly __brand: 'AdjustmentId' };
export type DocumentId = number & { readonly __brand: 'DocumentId' };
export type TemplateId = number & { readonly __brand: 'TemplateId' };
export type SectionId = number & { readonly __brand: 'SectionId' };
export type NotificationId = number & { readonly __brand: 'NotificationId' };
export type PermissionId = number & { readonly __brand: 'PermissionId' };
export type ServiceLineUserId = number & { readonly __brand: 'ServiceLineUserId' };
export type TaskTeamId = number & { readonly __brand: 'TaskTeamId' };
export type OpportunityId = number & { readonly __brand: 'OpportunityId' };
export type ActivityId = number & { readonly __brand: 'ActivityId' };
export type ContactId = number & { readonly __brand: 'ContactId' };
export type ToolId = number & { readonly __brand: 'ToolId' };
export type ApprovalId = number & { readonly __brand: 'ApprovalId' };

/**
 * Factory for creating numeric branded ID parsers.
 * Accepts unknown input, validates it is a positive integer, and returns the branded type.
 * @param name - Human-readable ID type name for error messages
 * @returns A parser function that converts unknown values to the branded numeric ID type
 * @throws Error if the value is not a valid positive integer
 */
function createNumericIdParser<T>(name: string) {
  return (value: unknown): T => {
    const id = typeof value === 'string' ? Number.parseInt(value, 10) : Number(value);
    if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
      throw new Error(`Invalid ${name}: ${value}`);
    }
    return id as unknown as T;
  };
}

/**
 * Factory for creating string branded ID parsers.
 * Accepts unknown input, validates it is a non-empty string, and returns the branded type.
 * @param name - Human-readable ID type name for error messages
 * @returns A parser function that converts unknown values to the branded string ID type
 * @throws Error if the value is not a valid non-empty string
 */
function createStringIdParser<T>(name: string) {
  return (value: unknown): T => {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new Error(`Invalid ${name}: ${value}`);
    }
    return value as unknown as T;
  };
}

// Numeric ID converters
export const toTaskId = createNumericIdParser<TaskId>('TaskId');
export const toDraftId = createNumericIdParser<DraftId>('DraftId');
export const toClientId = createNumericIdParser<ClientId>('ClientId');
export const toEmployeeId = createNumericIdParser<EmployeeId>('EmployeeId');
export const toAdjustmentId = createNumericIdParser<AdjustmentId>('AdjustmentId');
export const toDocumentId = createNumericIdParser<DocumentId>('DocumentId');
export const toTemplateId = createNumericIdParser<TemplateId>('TemplateId');
export const toSectionId = createNumericIdParser<SectionId>('SectionId');
export const toNotificationId = createNumericIdParser<NotificationId>('NotificationId');
export const toPermissionId = createNumericIdParser<PermissionId>('PermissionId');
export const toServiceLineUserId = createNumericIdParser<ServiceLineUserId>('ServiceLineUserId');
export const toTaskTeamId = createNumericIdParser<TaskTeamId>('TaskTeamId');
export const toOpportunityId = createNumericIdParser<OpportunityId>('OpportunityId');
export const toActivityId = createNumericIdParser<ActivityId>('ActivityId');
export const toContactId = createNumericIdParser<ContactId>('ContactId');
export const toToolId = createNumericIdParser<ToolId>('ToolId');
export const toApprovalId = createNumericIdParser<ApprovalId>('ApprovalId');

// String ID converters
export const toUserId = createStringIdParser<UserId>('UserId');
export const toGSClientID = createStringIdParser<GSClientID>('GSClientID');
export const toGSTaskID = createStringIdParser<GSTaskID>('GSTaskID');
export const toGSEmployeeID = createStringIdParser<GSEmployeeID>('GSEmployeeID');
