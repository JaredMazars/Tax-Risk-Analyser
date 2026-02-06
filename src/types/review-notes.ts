/**
 * Review Notes Types and DTOs
 * Type definitions for the Review Notebook tool
 */

import type { ReviewNote, ReviewNoteComment, ReviewNoteAttachment, ReviewNoteAssignee, ReviewCategory } from '@prisma/client';

// ============================================================================
// Enums
// ============================================================================

export enum ReviewNoteStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  ADDRESSED = 'ADDRESSED',
  CLEARED = 'CLEARED',
  REJECTED = 'REJECTED',
}

export enum ReviewNotePriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum ReviewReferenceType {
  FILE = 'FILE',
  PAGE = 'PAGE',
  EXTERNAL = 'EXTERNAL',
}

// ============================================================================
// Extended Types with Relations
// ============================================================================

export type ReviewNoteWithRelations = ReviewNote & {
  Task?: {
    id: number;
    TaskCode: string;
    TaskDesc: string;
  };
  ReviewCategory?: ReviewCategory | null;
  User_ReviewNote_raisedByToUser: {
    id: string;
    name: string | null;
    email: string;
  };
  User_ReviewNote_assignedToToUser?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  User_ReviewNote_currentOwnerToUser?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  User_ReviewNote_lastRespondedByToUser?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  User_ReviewNote_addressedByToUser?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  User_ReviewNote_clearedByToUser?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  ReviewNoteComment?: ReviewNoteCommentWithUser[];
  ReviewNoteAttachment?: ReviewNoteAttachmentWithUser[];
  ReviewNoteAssignee?: ReviewNoteAssigneeWithUser[];
  _count?: {
    ReviewNoteComment: number;
    ReviewNoteAttachment: number;
    ReviewNoteAssignee: number;
  };
};

export type ReviewNoteCommentWithUser = ReviewNoteComment & {
  User: {
    id: string;
    name: string | null;
    email: string;
  };
};

export type ReviewNoteAttachmentWithUser = ReviewNoteAttachment & {
  User: {
    id: string;
    name: string | null;
    email: string;
  };
};

export type ReviewNoteAssigneeWithUser = ReviewNoteAssignee & {
  User_ReviewNoteAssignee_userIdToUser: {
    id: string;
    name: string | null;
    email: string;
  };
  User_ReviewNoteAssignee_assignedByToUser: {
    id: string;
    name: string | null;
    email: string;
  };
};

// ============================================================================
// DTOs - Create
// ============================================================================

export interface CreateReviewNoteDTO {
  taskId: number;
  title: string;
  description?: string;
  referenceUrl?: string;
  referenceType: ReviewReferenceType;
  referenceId?: string;
  section?: string;
  priority: ReviewNotePriority;
  categoryId?: number;
  dueDate?: Date | string;
  assignedTo?: string; // Deprecated - use assignees array
  assignees?: string[]; // Array of user IDs to assign
}

export interface CreateReviewCategoryDTO {
  name: string;
  description?: string;
  serviceLine?: string;
  sortOrder?: number;
}

// ============================================================================
// DTOs - Update
// ============================================================================

export interface UpdateReviewNoteDTO {
  title?: string;
  description?: string;
  referenceUrl?: string;
  referenceType?: ReviewReferenceType;
  referenceId?: string;
  section?: string;
  priority?: ReviewNotePriority;
  categoryId?: number;
  dueDate?: Date | string | null;
  assignedTo?: string | null;
}

export interface UpdateReviewCategoryDTO {
  name?: string;
  description?: string;
  serviceLine?: string;
  active?: boolean;
  sortOrder?: number;
}

// ============================================================================
// DTOs - Status Changes
// ============================================================================

export interface ChangeReviewNoteStatusDTO {
  status: ReviewNoteStatus;
  comment?: string;
  reason?: string; // For rejection
}

// ============================================================================
// DTOs - Filters
// ============================================================================

export interface ReviewNoteFilterDTO {
  taskId?: number;
  status?: ReviewNoteStatus | ReviewNoteStatus[];
  priority?: ReviewNotePriority | ReviewNotePriority[];
  categoryId?: number | number[];
  assignedTo?: string | string[]; // Support single or multiple
  raisedBy?: string | string[]; // Support single or multiple
  dueDateFrom?: Date | string;
  dueDateTo?: Date | string;
  overdue?: boolean;
  search?: string; // Search in title and description
  page?: number;
  limit?: number;
  sortBy?: 'dueDate' | 'priority' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface ReviewNoteAnalytics {
  summary: {
    total: number;
    byStatus: Record<ReviewNoteStatus, number>;
    byPriority: Record<ReviewNotePriority, number>;
    overdue: number;
    averageResolutionTimeHours: number | null;
  };
  byCategory: Array<{
    categoryId: number | null;
    categoryName: string;
    total: number;
    open: number;
    cleared: number;
  }>;
  byAssignee: Array<{
    userId: string;
    userName: string;
    open: number;
    inProgress: number;
    addressed: number;
    cleared: number;
    rejected: number;
    total: number;
    averageResolutionTimeHours: number | null;
  }>;
  timeline: Array<{
    date: string;
    opened: number;
    cleared: number;
    rejected: number;
  }>;
}

// ============================================================================
// List Response
// ============================================================================

export interface ReviewNoteListResponse {
  notes: ReviewNoteWithRelations[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: ReviewNoteFilterDTO;
}

// ============================================================================
// Workflow Validation
// ============================================================================

export interface StatusTransition {
  from: ReviewNoteStatus;
  to: ReviewNoteStatus;
  allowedRoles: string[]; // 'RAISER' | 'ASSIGNEE' | 'PARTNER' | 'SYSTEM_ADMIN'
  requiresComment?: boolean;
}
