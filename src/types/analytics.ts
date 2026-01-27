// Analytics Types

export enum AnalyticsDocumentType {
  AFS = 'AFS',
  MANAGEMENT_ACCOUNTS = 'MANAGEMENT_ACCOUNTS',
  BANK_STATEMENTS = 'BANK_STATEMENTS',
  CASH_FLOW = 'CASH_FLOW',
  OTHER = 'OTHER',
}

export enum CreditRatingGrade {
  AAA = 'AAA',
  AA = 'AA',
  A = 'A',
  BBB = 'BBB',
  BB = 'BB',
  B = 'B',
  CCC = 'CCC',
  D = 'D',
}

export interface AnalyticsDocument {
  id: number;
  clientId: number;  // Internal ID - renamed from GSClientID for clarity
  documentType: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: Date;
  extractedData?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialRatios {
  // Liquidity Ratios
  currentRatio?: number;
  quickRatio?: number;
  cashRatio?: number;
  
  // Profitability Ratios
  grossMargin?: number;
  netMargin?: number;
  returnOnAssets?: number;
  returnOnEquity?: number;
  
  // Leverage Ratios
  debtToEquity?: number;
  interestCoverage?: number;
  debtRatio?: number;
  
  // Efficiency Ratios
  assetTurnover?: number;
  inventoryTurnover?: number;
  receivablesTurnover?: number;
}

export interface CreditAnalysisReport {
  executiveSummary: string;
  strengths: string[];
  weaknesses: string[];
  riskFactors: Array<{
    factor: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    impact: string;
    mitigation?: string;
  }>;
  industryComparison?: {
    industry: string;
    companyPosition: string;
    keyMetrics: Array<{
      metric: string;
      companyValue: number;
      industryAverage: number;
      comparison: string;
    }>;
  };
  recommendations: string[];
  detailedAnalysis: string;
}

export interface CreditRating {
  id: number;
  clientId: number;  // Internal ID - renamed from GSClientID for clarity
  ratingScore: number; // 0-100
  ratingGrade: CreditRatingGrade;
  ratingDate: Date;
  analysisReport: CreditAnalysisReport;
  financialRatios: FinancialRatios;
  confidence: number; // 0-1
  analyzedBy: string;
  createdAt: Date;
  updatedAt: Date;
  documents?: AnalyticsDocument[];
}

export interface CreditRatingWithDocuments extends CreditRating {
  documents: AnalyticsDocument[];
}

export interface GenerateCreditRatingRequest {
  documentIds: number[];
}

export interface GenerateCreditRatingResponse {
  success: boolean;
  data?: CreditRating;
  error?: string;
}

export interface AnalyticsDocumentsResponse {
  success: boolean;
  data?: {
    documents: AnalyticsDocument[];
    totalCount: number;
  };
  error?: string;
}

export interface CreditRatingsResponse {
  success: boolean;
  data?: {
    ratings: CreditRating[];
    totalCount: number;
  };
  error?: string;
}

export interface LatestCreditRatingResponse {
  success: boolean;
  data?: CreditRating;
  error?: string;
}

export interface FinancialRatiosResponse {
  success: boolean;
  data?: FinancialRatios;
  error?: string;
}

// Utility types for document upload
export interface UploadDocumentData {
  file: File;
  documentType: AnalyticsDocumentType;
}

// For trend analysis
export interface RatingTrend {
  date: Date;
  ratingGrade: CreditRatingGrade;
  ratingScore: number;
  change?: number; // vs previous rating
  trend?: 'UP' | 'DOWN' | 'STABLE';
}

// For ratio comparison
export interface RatioComparison {
  current: number;
  previous?: number;
  industryAverage?: number;
  benchmark?: number;
  status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
}

// ============================================
// Time Accumulation Types (Task Finance Graphs)
// ============================================

/**
 * A single data point for cumulative time charts
 */
export interface CumulativeDataPoint {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Cumulative time amount at this date */
  cumulativeTime: number;
  /** Budget amount (flat line value) */
  budget: number;
}

/**
 * Time accumulation data for a single employee
 */
export interface EmployeeTimeAccumulation {
  /** User ID (from User table) */
  userId: string;
  /** Display name of the employee */
  userName: string;
  /** Employee code (from Employee table) */
  empCode: string;
  /** Employee category description (e.g., "Partner", "Manager") */
  empCatDesc: string;
  /** Total allocated budget for this employee (hours × rate) */
  allocatedBudget: number;
  /** Actual time amount used */
  actualTime: number;
  /** Whether this employee is an assigned team member (vs just booked time) */
  isTeamMember: boolean;
  /** Cumulative data points for charting */
  cumulativeData: CumulativeDataPoint[];
}

/**
 * Complete time accumulation data for a task
 */
export interface TaskTimeAccumulationData {
  /** Internal task ID */
  taskId: number;
  /** External GUID for task */
  GSTaskID: string;
  /** Task code for display */
  taskCode: string;
  /** Task description */
  taskDesc: string;
  /** Task start date (TaskDateOpen) */
  startDate: string;
  /** Current date (end of analysis period) */
  endDate: string;
  /** Total budget for the task (sum of all employee budgets) */
  totalBudget: number;
  /** Total actual time used */
  actualTime: number;
  /** Overall cumulative data points for charting */
  cumulativeData: CumulativeDataPoint[];
  /** Per-employee time accumulation data */
  employeeData: EmployeeTimeAccumulation[];
}

/**
 * API response wrapper for time accumulation data
 */
export interface TaskTimeAccumulationResponse {
  success: boolean;
  data: TaskTimeAccumulationData;
}
