// Tax Opinion Models
export interface OpinionDraft {
  id: number;
  taskId: number;
  version: number;
  title: string;
  content: string;
  status: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  documents?: OpinionDocument[];
  sections?: OpinionSection[];
  chatMessages?: OpinionChatMessage[];
}

export interface OpinionDocument {
  id: number;
  opinionDraftId: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  category: string;
  extractedText?: string | null;
  vectorized: boolean;
  uploadedBy: string;
  createdAt: Date;
}

export interface OpinionSection {
  id: number;
  opinionDraftId: number;
  sectionType: string;
  title: string;
  content: string;
  aiGenerated: boolean;
  reviewed: boolean;
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OpinionChatMessage {
  id: number;
  opinionDraftId: number;
  role: string;
  content: string;
  metadata?: string | null;
  sectionGenerationId?: string | null;
  sectionType?: string | null;
  createdAt: Date;
}

export interface ResearchNote {
  id: number;
  taskId: number;
  title: string;
  content: string;
  tags?: string | null;
  category?: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LegalPrecedent {
  id: number;
  taskId: number;
  caseName: string;
  citation: string;
  court?: string | null;
  year?: number | null;
  summary: string;
  relevance?: string | null;
  link?: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tax Administration Models
export interface SarsResponse {
  id: number;
  taskId: number;
  referenceNumber: string;
  subject: string;
  content: string;
  status: string;
  responseType: string;
  deadline?: Date | null;
  sentDate?: Date | null;
  receivedDate?: Date | null;
  documentPath?: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdministrationDocument {
  id: number;
  taskId: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  category: string;
  description?: string | null;
  version: number;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceChecklistItem {
  id: number;
  taskId: number;
  title: string;
  description?: string | null;
  dueDate?: Date | null;
  priority: string;
  status: string;
  assignedTo?: string | null;
  completedAt?: Date | null;
  completedBy?: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FilingStatus {
  id: number;
  taskId: number;
  filingType: string;
  description?: string | null;
  status: string;
  deadline?: Date | null;
  submittedDate?: Date | null;
  approvedDate?: Date | null;
  referenceNumber?: string | null;
  notes?: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tax Adjustment Model
 * Centralized type definition for TaxAdjustment to prevent duplication
 * Matches Prisma schema
 */
export interface TaxAdjustment {
  id: number;
  taskId: number;
  type: 'DEBIT' | 'CREDIT' | 'ALLOWANCE' | 'RECOUPMENT';
  description: string;
  amount: number;
  status: string;
  sourceDocuments?: string | null;
  extractedData?: string | null;
  calculationDetails?: string | null;
  notes?: string | null;
  sarsSection?: string | null;
  confidenceScore?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
  AdjustmentDocument?: AdjustmentDocument[];
}

/**
 * Tax Adjustment Display Type
 * Simplified version for display purposes (without relations)
 */
export interface TaxAdjustmentDisplay {
  id: number;
  type: 'DEBIT' | 'CREDIT' | 'ALLOWANCE' | 'RECOUPMENT';
  description: string;
  amount: number;
  status: string;
  sarsSection?: string | null;
  confidenceScore?: number | null;
  notes?: string | null;
  createdAt?: Date;
}

/**
 * Adjustment Document Model
 */
export interface AdjustmentDocument {
  id: number;
  taskId: number;
  taxAdjustmentId?: number | null;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  uploadedBy?: string | null;
  extractionStatus: string;
  extractedData?: string | null;
  extractionError?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
