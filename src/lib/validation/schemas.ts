/**
 * Zod validation schemas for runtime type checking
 */

import { z } from 'zod';

/**
 * Project validation schemas
 */
export const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  projectType: z.enum([
    'TAX_CALCULATION', 'TAX_OPINION', 'TAX_ADMINISTRATION',
    'AUDIT_ENGAGEMENT', 'AUDIT_REVIEW', 'AUDIT_REPORT',
    'FINANCIAL_STATEMENTS', 'BOOKKEEPING', 'MANAGEMENT_ACCOUNTS',
    'ADVISORY_PROJECT', 'CONSULTING_ENGAGEMENT', 'STRATEGY_REVIEW'
  ]).optional(),
  serviceLine: z.enum(['TAX', 'AUDIT', 'ACCOUNTING', 'ADVISORY']).optional(),
  taxYear: z.number().int().min(2000).max(2100).optional(),
  taxPeriodStart: z.coerce.date().nullable().optional(),
  taxPeriodEnd: z.coerce.date().nullable().optional(),
  assessmentYear: z.string().max(50).optional(),
  submissionDeadline: z.coerce.date().nullable().optional(),
  clientId: z.number().int().positive().nullable().optional(),
}).strict();

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  projectType: z.enum([
    'TAX_CALCULATION', 'TAX_OPINION', 'TAX_ADMINISTRATION',
    'AUDIT_ENGAGEMENT', 'AUDIT_REVIEW', 'AUDIT_REPORT',
    'FINANCIAL_STATEMENTS', 'BOOKKEEPING', 'MANAGEMENT_ACCOUNTS',
    'ADVISORY_PROJECT', 'CONSULTING_ENGAGEMENT', 'STRATEGY_REVIEW'
  ]),
  serviceLine: z.enum(['TAX', 'AUDIT', 'ACCOUNTING', 'ADVISORY']),
  taxYear: z.number().int().min(2000).max(2100).optional(),
  taxPeriodStart: z.coerce.date().nullable().optional(),
  taxPeriodEnd: z.coerce.date().nullable().optional(),
  assessmentYear: z.string().max(50).optional(),
  submissionDeadline: z.coerce.date().nullable().optional(),
  clientId: z.number().int().positive().nullable().optional(),
}).strict();

/**
 * Project User Management validation schemas
 */
export const AddProjectUserSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['ADMIN', 'REVIEWER', 'EDITOR', 'VIEWER']).optional().default('VIEWER'),
}).strict();

export const UpdateProjectUserSchema = z.object({
  role: z.enum(['ADMIN', 'REVIEWER', 'EDITOR', 'VIEWER']),
}).strict();

/**
 * Client validation schemas
 */
export const UpdateClientSchema = z.object({
  // New required fields from external DB
  clientCode: z.string().max(10).optional(),
  clientNameFull: z.string().max(255).nullable().optional(),
  groupCode: z.string().max(10).optional(),
  groupDesc: z.string().max(150).optional(),
  clientPartner: z.string().max(10).optional(),
  clientManager: z.string().max(10).optional(),
  clientIncharge: z.string().max(10).optional(),
  active: z.string().max(3).optional(),
  clientDateOpen: z.coerce.date().nullable().optional(),
  clientDateTerminate: z.coerce.date().nullable().optional(),
  industry: z.string().max(255).nullable().optional(),
  sector: z.string().max(255).nullable().optional(),
  forvisMazarsIndustry: z.string().max(255).nullable().optional(),
  forvisMazarsSector: z.string().max(255).nullable().optional(),
  forvisMazarsSubsector: z.string().max(255).nullable().optional(),
  clientOCFlag: z.boolean().optional(),
  clientTaxFlag: z.boolean().nullable().optional(),
  clientSecFlag: z.boolean().nullable().optional(),
  creditor: z.boolean().nullable().optional(),
  rolePlayer: z.boolean().optional(),
  typeCode: z.string().max(10).optional(),
  typeDesc: z.string().max(50).optional(),
}).strict();

export const CreateClientSchema = z.object({
  // New required fields from external DB
  clientCode: z.string().min(1).max(10),
  clientNameFull: z.string().max(255).nullable().optional(),
  groupCode: z.string().min(1).max(10),
  groupDesc: z.string().min(1).max(150),
  clientPartner: z.string().min(1).max(10),
  clientManager: z.string().min(1).max(10),
  clientIncharge: z.string().min(1).max(10),
  active: z.string().min(1).max(3),
  clientDateOpen: z.coerce.date().nullable().optional(),
  clientDateTerminate: z.coerce.date().nullable().optional(),
  industry: z.string().max(255).nullable().optional(),
  sector: z.string().max(255).nullable().optional(),
  forvisMazarsIndustry: z.string().max(255).nullable().optional(),
  forvisMazarsSector: z.string().max(255).nullable().optional(),
  forvisMazarsSubsector: z.string().max(255).nullable().optional(),
  clientOCFlag: z.boolean(),
  clientTaxFlag: z.boolean().nullable().optional(),
  clientSecFlag: z.boolean().nullable().optional(),
  creditor: z.boolean().nullable().optional(),
  rolePlayer: z.boolean(),
  typeCode: z.string().min(1).max(10),
  typeDesc: z.string().min(1).max(50),
}).strict();

/**
 * Tax Adjustment validation schemas
 */
export const UpdateTaxAdjustmentSchema = z.object({
  type: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  amount: z.number().optional(),
  status: z.enum(['SUGGESTED', 'APPROVED', 'REJECTED', 'PENDING']).optional(),
  sourceDocuments: z.string().nullable().optional(),
  extractedData: z.string().nullable().optional(),
  calculationDetails: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  sarsSection: z.string().max(100).nullable().optional(),
  confidenceScore: z.number().min(0).max(1).nullable().optional(),
}).strict();

export const CreateTaxAdjustmentSchema = z.object({
  projectId: z.number().int().positive(),
  type: z.string().max(100),
  description: z.string().max(1000),
  amount: z.number(),
  status: z.enum(['SUGGESTED', 'APPROVED', 'REJECTED', 'PENDING']).optional(),
  sourceDocuments: z.string().nullable().optional(),
  extractedData: z.string().nullable().optional(),
  calculationDetails: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  sarsSection: z.string().max(100).nullable().optional(),
  confidenceScore: z.number().min(0).max(1).nullable().optional(),
}).strict();

/**
 * Pagination schema
 */
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
});

/**
 * Opinion Draft schemas
 */
export const CreateOpinionDraftSchema = z.object({
  projectId: z.number().int().positive(),
  title: z.string().min(1).max(500),
  content: z.string().optional(),
  version: z.number().int().positive().default(1),
}).strict();

export const UpdateOpinionSectionSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().optional(),
  reviewed: z.boolean().optional(),
  order: z.number().int().positive().optional(),
}).strict();

/**
 * Notification Preference schemas
 */
export const UpdateNotificationPreferenceSchema = z.object({
  emailEnabled: z.boolean(),
}).strict();

export const CreateNotificationPreferenceSchema = z.object({
  projectId: z.number().int().positive().nullable().optional(),
  notificationType: z.string().min(1).max(100),
  emailEnabled: z.boolean().default(true),
}).strict();

/**
 * In-App Notification schemas
 */
export const UpdateInAppNotificationSchema = z.object({
  isRead: z.boolean(),
}).strict();

export const SendUserMessageSchema = z.object({
  recipientUserId: z.string().min(1),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  projectId: z.number().int().positive().optional(),
  actionUrl: z.string().max(500).optional(),
}).strict();

export const NotificationFiltersSchema = z.object({
  isRead: z.boolean().optional(),
  projectId: z.number().int().positive().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
}).strict();

/**
 * Type inference from schemas
 */
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;
export type CreateClientInput = z.infer<typeof CreateClientSchema>;
export type UpdateTaxAdjustmentInput = z.infer<typeof UpdateTaxAdjustmentSchema>;
export type CreateTaxAdjustmentInput = z.infer<typeof CreateTaxAdjustmentSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type UpdateNotificationPreferenceInput = z.infer<typeof UpdateNotificationPreferenceSchema>;
export type CreateNotificationPreferenceInput = z.infer<typeof CreateNotificationPreferenceSchema>;
export type UpdateInAppNotificationInput = z.infer<typeof UpdateInAppNotificationSchema>;
export type SendUserMessageInput = z.infer<typeof SendUserMessageSchema>;
export type NotificationFiltersInput = z.infer<typeof NotificationFiltersSchema>;





