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

// Enums matching Prisma schema
export enum ProjectType {
  TAX_CALCULATION = 'TAX_CALCULATION',
  TAX_OPINION = 'TAX_OPINION',
  TAX_ADMINISTRATION = 'TAX_ADMINISTRATION',
}

export enum ProjectRole {
  ADMIN = 'ADMIN',
  REVIEWER = 'REVIEWER',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

// Client/Organization
export interface Client {
  id: number;
  clientCode?: string | null;
  name: string;
  registrationNumber?: string | null;
  taxNumber?: string | null;
  industry?: string | null;
  legalEntityType?: string | null;
  jurisdiction?: string | null;
  taxRegime?: string | null;
  financialYearEnd?: string | null;
  baseCurrency?: string | null;
  primaryContact?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Enhanced Project
export interface Project {
  id: number;
  name: string;
  description?: string | null;
  projectType: ProjectType;
  taxYear?: number | null;
  taxPeriodStart?: Date | null;
  taxPeriodEnd?: Date | null;
  assessmentYear?: string | null;
  submissionDeadline?: Date | null;
  clientId?: number | null;
  client?: Client | null;
  status: string;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
  users?: ProjectUser[];
  _count?: {
    mappings: number;
    taxAdjustments: number;
  };
}

// Project User Access
export interface ProjectUser {
  id: number;
  projectId: number;
  userId: string;
  role: ProjectRole;
  createdAt: Date;
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
}

// Active Directory User (from Microsoft Graph)
export interface ADUser {
  id: string;
  email: string;
  displayName: string;
  jobTitle?: string | null;
  department?: string | null;
} 