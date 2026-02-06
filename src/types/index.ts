import type { TaskTeamAllocation } from './allocations';

export interface MappedData {
  id: number;
  accountCode: string;
  accountName: string;
  section: string;
  subsection: string;
  balance: number;
  priorYearBalance: number;
  sarsItem: string;
}

// Employee Status (for UI status indicators)
export interface EmployeeStatus {
  empCode?: string;
  isActive: boolean;
  hasUserAccount: boolean;
}

// Enums matching Prisma schema
export enum ServiceLine {
  TAX = 'TAX',
  AUDIT = 'AUDIT',
  ACCOUNTING = 'ACCOUNTING',
  ADVISORY = 'ADVISORY',
  // Shared Services
  QRM = 'QRM',
  BUSINESS_DEV = 'BUSINESS_DEV',
  IT = 'IT',
  FINANCE = 'FINANCE',
  HR = 'HR',
  COUNTRY_MANAGEMENT = 'COUNTRY_MANAGEMENT',
}

// System-level roles (User.role)
// SYSTEM_ADMIN: System-wide access to all features and service lines
// USER: Regular user, requires service line access
export enum SystemRole {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  USER = 'USER',
}

// Service line roles (ServiceLineUser.role and TaskTeam.role)
// Used for both service line access and task team assignments
export enum ServiceLineRole {
  ADMINISTRATOR = 'ADMINISTRATOR', // Service line administrator (highest)
  PARTNER = 'PARTNER',   // Partner level
  MANAGER = 'MANAGER',   // Manager level
  SUPERVISOR = 'SUPERVISOR', // Supervisor level  
  USER = 'USER',         // Staff level
  VIEWER = 'VIEWER',     // View-only access
}

// Non-Client Event Types
export enum NonClientEventType {
  TRAINING = 'TRAINING',
  ANNUAL_LEAVE = 'ANNUAL_LEAVE',
  SICK_LEAVE = 'SICK_LEAVE',
  PUBLIC_HOLIDAY = 'PUBLIC_HOLIDAY',
  PERSONAL = 'PERSONAL',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
}

// News Bulletin Categories
export enum BulletinCategory {
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  POLICY_UPDATE = 'POLICY_UPDATE',
  EVENT = 'EVENT',
  ACHIEVEMENT = 'ACHIEVEMENT',
  REMINDER = 'REMINDER',
  CLIENT_WIN = 'CLIENT_WIN',
  MARKET_UPDATE = 'MARKET_UPDATE',
  INDUSTRY_NEWS = 'INDUSTRY_NEWS',
  PARTNERSHIP = 'PARTNERSHIP',
  HIRING = 'HIRING',
}

// News Bulletin
export interface NewsBulletin {
  id: number;
  title: string;
  summary: string;
  body: string;
  category: BulletinCategory;
  serviceLine: string | null;
  effectiveDate: Date;
  expiresAt: Date | null;
  contactPerson: string | null;
  actionRequired: boolean;
  callToActionUrl: string | null;
  callToActionText: string | null;
  isPinned: boolean;
  isActive: boolean;
  documentFileName: string | null;
  documentFilePath: string | null;
  documentFileSize: number | null;
  documentUploadedAt: Date | null;
  showDocumentLink: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: {
    id: string;
    name: string | null;
    email: string;
  };
}

// Client/Organization
export interface Client {
  id: number;
  // New required fields from external DB
  clientCode: string;
  GSClientID: string; // UniqueIdentifier GUID
  clientNameFull?: string | null;
  groupCode: string;
  groupDesc: string;
  clientPartner: string;
  clientPartnerName?: string; // Enriched from Employee table
  clientPartnerStatus?: EmployeeStatus; // Employee status indicator
  clientManager: string;
  clientManagerName?: string; // Enriched from Employee table
  clientManagerStatus?: EmployeeStatus; // Employee status indicator
  clientIncharge: string;
  clientInchargeName?: string; // Enriched from Employee table
  clientInchargeStatus?: EmployeeStatus; // Employee status indicator
  active: string;
  clientOCFlag: boolean;
  rolePlayer: boolean;
  typeCode: string;
  typeDesc: string;
  // New optional fields from external DB
  clientDateOpen?: Date | null;
  clientDateTerminate?: Date | null;
  sector?: string | null;
  forvisMazarsIndustry?: string | null;
  forvisMazarsSector?: string | null;
  forvisMazarsSubsector?: string | null;
  clientTaxFlag?: boolean | null;
  clientSecFlag?: boolean | null;
  creditor?: boolean | null;
  industry?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Client acceptance fields (flattened from ClientAcceptance relation)
  clientAcceptanceId?: number | null;
  clientAcceptanceApproved?: boolean;
  clientAcceptanceRiskRating?: string | null;
  clientAcceptanceApprovedAt?: Date | null;
  clientAcceptanceApprovedBy?: string | null;
}

// Client Acceptance (client-level risk assessment)
export interface ClientAcceptance {
  id: number;
  clientId: number;
  riskRating: string | null; // LOW, MEDIUM, HIGH
  overallRiskScore: number | null;
  riskSummary: string | null;
  completedAt: Date | null;
  completedBy: string | null;
  approvedAt: Date | null;
  approvedBy: string | null;
  approvalId: number | null;
  validUntil: Date | null;
  lastReviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  client?: Client;
  answers?: ClientAcceptanceAnswer[];
}

// Client Acceptance Answer
export interface ClientAcceptanceAnswer {
  id: number;
  clientAcceptanceId: number;
  questionId: number;
  answer: string | null;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
  question?: AcceptanceQuestion;
}

// Acceptance Question (shared by both client and engagement acceptance)
export interface AcceptanceQuestion {
  id: number;
  questionnaireType: string; // CLIENT_ACCEPTANCE, ENGAGEMENT_ACCEPTANCE_FULL, ENGAGEMENT_ACCEPTANCE_LITE
  sectionKey: string;
  questionKey: string;
  questionText: string;
  description: string | null;
  fieldType: string; // text, textarea, select, radio, checkbox, date
  options: string | null; // JSON string for select/radio/checkbox
  required: boolean;
  order: number;
  riskWeight: number;
  highRiskAnswers: string | null; // JSON array of high-risk answer values
  createdAt: Date;
  updatedAt: Date;
}

// Enhanced Project
export interface Task {
  id: number;
  clientId?: number | null;         // Internal FK - for ALL queries and relations
  GSTaskID: string;                 // External ID - for sync only
  GSClientID?: string | null;       // External ID - kept for sync reference only
  TaskCode: string;                 // For display/search only
  TaskDesc: string;
  TaskPartner: string;
  TaskPartnerName: string;
  TaskPartnerStatus?: EmployeeStatus; // Employee status indicator
  TaskManager: string;
  TaskManagerName: string;
  TaskManagerStatus?: EmployeeStatus; // Employee status indicator
  OfficeCode: string;
  SLGroup: string;
  ServLineCode: string;
  ServLineDesc: string;
  Active: string;
  TaskDateOpen: Date;
  TaskDateTerminate?: Date | null;
  // New task-like fields
  name?: string | null;
  description?: string | null;
  status: string;
  archived: boolean;
  serviceLine?: string | null;
  assessmentYear?: string | null;
  submissionDeadline?: Date | null;
  taxPeriodStart?: Date | null;
  taxPeriodEnd?: Date | null;
  taxYear?: number | null;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  client?: Client | null;
  team?: TaskTeam[];
  users?: TaskTeam[];
  acceptance?: TaskAcceptance | null;
  engagementLetter?: TaskEngagementLetter | null;
  documents?: TaskDocument[];
  // Flattened acceptance fields (from TaskAcceptance)
  acceptanceApproved?: boolean;
  acceptanceApprovedBy?: string | null;
  acceptanceApprovedAt?: Date | null;
  // Flattened engagement letter fields (from TaskEngagementLetter)
  engagementLetterGenerated?: boolean;
  engagementLetterUploaded?: boolean;
  engagementLetterContent?: string | null;
  engagementLetterTemplateId?: number | null;
  engagementLetterGeneratedBy?: string | null;
  engagementLetterGeneratedAt?: Date | null;
  engagementLetterPath?: string | null;
  engagementLetterUploadedBy?: string | null;
  engagementLetterUploadedAt?: Date | null;
  // DPA fields
  dpaUploaded?: boolean;
  dpaPath?: string | null;
  dpaUploadedBy?: string | null;
  dpaUploadedAt?: Date | null;
  // Engagement Letter Extraction fields
  elExtractionStatus?: 'PENDING' | 'SUCCESS' | 'FAILED';
  elExtractionError?: string | null;
  elLetterDate?: Date | null;
  elLetterAge?: number | null;
  elSigningPartner?: string | null;
  elSigningPartnerCode?: string | null;
  elServicesCovered?: string | null; // JSON string
  elHasPartnerSignature?: boolean;
  elHasClientSignature?: boolean;
  elHasTermsConditions?: boolean;
  elHasTcPartnerSignature?: boolean;
  elHasTcClientSignature?: boolean;
  // DPA Extraction fields
  dpaExtractionStatus?: 'PENDING' | 'SUCCESS' | 'FAILED';
  dpaExtractionError?: string | null;
  dpaLetterDate?: Date | null;
  dpaLetterAge?: number | null;
  dpaSigningPartner?: string | null;
  dpaSigningPartnerCode?: string | null;
  dpaHasPartnerSignature?: boolean;
  dpaHasClientSignature?: boolean;
  _count?: {
    mappings: number;
    taxAdjustments: number;
  };
}

// Service Line User Access
export interface ServiceLineUser {
  id: number;
  userId: string;
  serviceLine: ServiceLine;
  role: ServiceLineRole;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
  };
}

// Sub Service Line Group (from ServiceLineExternal)
export interface SubServiceLineGroup {
  code: string;
  description: string;
  activeTasks: number; // Actually counts active tasks in this sub-service line group
  totalTasks: number; // Actually counts total tasks in this sub-service line group
  masterCode: string;
}

// Shared user shape for team member relations
export interface TaskTeamUser {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
  jobTitle?: string | null;
  officeLocation?: string | null;
}

// Task Team Access
export interface TaskTeam {
  id: number;
  taskId: number;
  userId: string;
  role: ServiceLineRole;
  startDate?: Date | null;
  endDate?: Date | null;
  allocatedHours?: number | null;
  allocatedPercentage?: number | null;
  actualHours?: number | null;
  createdAt: Date;
  /** Lowercase alias – used by some API response transformations */
  user?: TaskTeamUser;
  /** Prisma relation name (canonical) – returned directly from Prisma queries */
  User?: TaskTeamUser;
  // Optional task/client display fields (for allocation display)
  taskName?: string | null;
  taskCode?: string | null;
  clientName?: string | null;
  clientCode?: string | null;
  // Allocations for this team member (from allocation API)
  allocations?: TaskTeamAllocation[];
  // Employee ID (for non-client allocation planning)
  employeeId?: number;
  // Indicates if the user has an account (false for pending accounts)
  hasAccount?: boolean;
  // Employee status for status indicators
  employeeStatus?: EmployeeStatus;
  // Independence confirmation
  independenceConfirmation?: TaskIndependenceConfirmation | null;
}

// Task Independence Confirmation
export interface TaskIndependenceConfirmation {
  id: number;
  taskTeamId: number;
  confirmed: boolean;
  confirmedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Task Team with Independence (extended type for independence tab)
export interface TaskTeamWithIndependence extends TaskTeam {
  independenceConfirmation: TaskIndependenceConfirmation | null;
}

export interface TaskAcceptance {
  id: number;
  taskId: number;
  acceptanceApproved: boolean;
  approvedBy: string | null;        // DB nullable
  approvedAt: Date | null;          // DB nullable
  questionnaireType: string | null;  // DB nullable
  overallRiskScore: number | null;   // DB nullable
  riskRating: string | null;         // DB nullable
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskEngagementLetter {
  id: number;
  taskId: number;
  generated: boolean;
  uploaded: boolean;
  filePath: string | null;      // DB nullable
  content: string | null;       // DB nullable
  templateId: number | null;    // DB nullable
  generatedAt: Date | null;     // DB nullable
  generatedBy: string | null;   // DB nullable
  uploadedAt: Date | null;      // DB nullable
  uploadedBy: string | null;    // DB nullable
  dpaUploaded: boolean;
  dpaFilePath: string | null;   // DB nullable
  dpaUploadedAt: Date | null;   // DB nullable
  dpaUploadedBy: string | null; // DB nullable
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskDocument {
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

// Active Directory User (from Microsoft Graph)
export interface ADUser {
  id: string;
  email: string;
  displayName: string;
  userPrincipalName?: string;
  jobTitle?: string | null;
  department?: string | null;
  officeLocation?: string | null;
  mobilePhone?: string | null;
  businessPhones?: string[];
  city?: string | null;
  country?: string | null;
  companyName?: string | null;
  employeeId?: string | null;
  employeeType?: string | null;
  givenName?: string | null;
  surname?: string | null;
}

// Employee Search Result (from Employee table with User matching)
export interface EmployeeSearchResult {
  id: number;
  GSEmployeeID: string;
  EmpCode: string;
  EmpName: string;
  EmpNameFull: string;
  WinLogon: string | null;
  ServLineCode: string;
  ServLineDesc: string;
  OfficeCode: string;
  Team: string | null;
  EmpCatDesc: string;
  User: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
}

// Client Documents
export enum DocumentType {
  ENGAGEMENT_LETTER = 'ENGAGEMENT_LETTER',
  ADMINISTRATION = 'ADMINISTRATION',
  ADJUSTMENT = 'ADJUSTMENT',
  OPINION = 'OPINION',
  SARS = 'SARS',
}

export interface ClientDocument {
  id: number;
  documentType: DocumentType;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  taskId: number;
  taskName: string;
  uploadedBy?: string | null;
  createdAt: Date;
  // Type-specific fields
  category?: string; // For Administration and Opinion documents
  description?: string; // For Administration documents
  version?: number; // For Administration documents
  extractionStatus?: string; // For Adjustment documents
  referenceNumber?: string; // For SARS documents
  subject?: string; // For SARS documents
}

export interface DocumentsByType {
  engagementLetters: ClientDocument[];
  administration: ClientDocument[];
  adjustments: ClientDocument[];
  opinions: ClientDocument[];
  sars: ClientDocument[];
}

export interface ClientDocumentsResponse {
  documents: DocumentsByType;
  totalCount: number;
}

// Re-export notification types
export * from './notification';

// Re-export task stage types
export * from './task-stages';

// Re-export analytics types
export * from './analytics';

// Re-export branded ID types
export * from './branded';

// Re-export tax domain types
export * from './tax';

// Re-export allocation domain types
export * from './allocations';

/**
 * DrsTransactions already has employee names from external system
 * This type documents the structure for reference
 */
export interface DrsTransaction {
  id: number;
  GSDebtorsTranID: string;
  GSClientID: string;
  ClientCode: string;
  ClientNameFull?: string | null;
  GroupCode: string;
  GroupDesc: string;
  OfficeCode: string;
  OfficeDesc: string;
  ServLineCode: string;
  ServLineDesc: string;
  Biller: string;
  BillerName: string; // Already provided by external system
  TranDate: Date;
  EntryType?: string | null;
  Ordinal?: number | null;
  Reference?: string | null;
  InvNumber?: string | null;
  Amount?: number | null;
  Vat?: number | null;
  Total?: number | null;
  Batch?: string | null;
  Allocation: string;
  Narration?: string | null;
  VatCode?: string | null;
  PeriodKey: number;
  EntryGroupCode?: string | null;
  EntryGroup?: string | null;
  DRAccount?: string | null;
  CRAccount?: string | null;
  ClientPartner: string;
  ClientPartnerName: string; // Already provided by external system
  ClientManager: string;
  ClientManagerName: string; // Already provided by external system
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Metric types for profitability tracking
 * Used in transaction details modal
 */
export type MetricType = 
  | 'grossProduction'
  | 'ltdAdjustment'
  | 'ltdAdj'  // Merged adjustments
  | 'ltdAdjTime'  // Legacy - for backwards compatibility
  | 'ltdAdjDisb'  // Legacy - for backwards compatibility
  | 'ltdCost'
  | 'ltdFee'  // Merged fees
  | 'ltdFeeTime'  // Legacy - for backwards compatibility
  | 'ltdFeeDisb'  // Legacy - for backwards compatibility
  | 'balWIP'
  | 'balTime'
  | 'balDisb'
  | 'wipProvision'
  | 'ltdHours'
  | 'netRevenue'
  | 'grossProfit'
  | 'grossProfitPercentage'
  | 'averageChargeoutRate'
  | 'averageRecoveryRate';

/**
 * Task WIP Transaction
 * Used for transaction details display
 */
export interface TaskTransaction {
  id: number;
  GSWIPTransID: string;
  tranDate: Date;
  tranType: string;
  tType: string;
  empCode: string | null;
  empName: string | null;
  amount: number | null;
  cost: number;
  hour: number;
  ref: string | null;
  narr: string | null;
  officeCode: string;
  taskServLine: string;
} 
