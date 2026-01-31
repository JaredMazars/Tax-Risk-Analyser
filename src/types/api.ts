/**
 * Re-export AI types from schemas for consistency
 */
export type {
  AITaxReport,
  TaxReportRisk,
  ExtractedData,
  TaxAdjustmentSuggestion,
  TaxAdjustmentSuggestions,
  CalculationDetails,
  MappedAccount,
  AccountMapping,
} from '@/lib/ai/schemas';

/**
 * Standard API response types
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Tax computation export data types
 */
export interface TaxExportData {
  taskName: string;
  accountingProfit: number;
  adjustments: TaxAdjustmentExport[];
  taxableIncome: number;
  taxLiability: number;
}

export interface TaxAdjustmentExport {
  id: number;
  type: 'DEBIT' | 'CREDIT' | 'ALLOWANCE' | 'RECOUPMENT';
  description: string;
  amount: number;
  status: string;
  sarsSection?: string;
  notes?: string;
}

/**
 * Document extraction context
 */
export interface ExtractionContext {
  adjustmentType: string;
  adjustmentDescription: string;
  taskId: number;
}

/**
 * File upload types
 */
export interface FileUploadResult {
  success: boolean;
  fileId?: number;
  fileName?: string;
  fileSize?: number;
  error?: string;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  mimeType?: string;
  size?: number;
}

/**
 * Health check types
 */
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: ServiceStatus;
    openai?: ServiceStatus;
  };
  version?: string;
}

export interface ServiceStatus {
  status: 'up' | 'down' | 'degraded';
  latency?: number;
  message?: string;
}

/**
 * Permission check types
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

export interface PermissionCheckRequest {
  userId: string;
  taskId?: number;
  serviceLine?: string;
  feature?: string;
}

/**
 * My Reports - Profitability Report types
 */

/**
 * Profitability Report request parameters
 */
export interface ProfitabilityReportParams {
  fiscalYear?: number;        // If provided, show fiscal year view
  startDate?: string;         // For custom date range (ISO format)
  endDate?: string;           // For custom date range (ISO format)
  mode?: 'fiscal' | 'custom'; // View mode
}

/**
 * Profitability Report response data
 */
export interface ProfitabilityReportData {
  tasks: TaskWithWIPAndServiceLine[];
  filterMode: 'PARTNER' | 'MANAGER';
  employeeCode: string;
  fiscalYear?: number;        // If fiscal year mode
  fiscalMonth?: string;       // If fiscal year + month mode ('Sep', 'Oct', etc.)
  dateRange?: {               // If custom mode
    start: string;
    end: string;
  };
  isPeriodFiltered: boolean;  // True = period-specific, False = lifetime
}

export interface TaskWithWIP {
  id: number;
  TaskCode: string;
  TaskDesc: string;
  TaskPartner: string;
  TaskPartnerName: string;
  TaskManager: string;
  TaskManagerName: string;
  netWip: number;
  // Profitability metrics
  ltdHours: number;
  ltdTime: number;
  ltdDisb: number;
  ltdAdj: number;
  ltdCost: number;
  // Additional WIP metrics
  ltdWipProvision: number;
  balWip: number;
  // Calculated metrics
  grossProduction: number;
  netRevenue: number;
  adjustmentPercentage: number;
  grossProfit: number;
  grossProfitPercentage: number;
}

export interface TaskWithWIPAndServiceLine extends TaskWithWIP {
  groupCode: string;
  groupDesc: string;
  clientCode: string;
  clientNameFull: string | null;
  GSClientID: string;
  servLineCode: string;
  subServlineGroupCode: string;
  subServlineGroupDesc: string;
  serviceLineName: string;
  masterServiceLineCode: string;
  masterServiceLineName: string;
}

/**
 * My Reports - Tasks by Group types
 */
export interface TasksByGroupReport {
  tasks: Array<{
    id: number;
    TaskCode: string;
    TaskDesc: string;
    TaskPartner: string;
    TaskPartnerName: string;
    TaskManager: string;
    TaskManagerName: string;
    netWip: number;
    groupCode: string;
    groupDesc: string;
    clientCode: string;
    clientNameFull: string | null;
    GSClientID: string;
    servLineCode: string;
    subServlineGroupCode: string;
    subServlineGroupDesc: string;
    serviceLineName: string;
    masterServiceLineCode: string;
    masterServiceLineName: string;
  }>;
  filterMode: 'PARTNER' | 'MANAGER';
  employeeCode: string;
}

/**
 * My Reports - Overview types
 */
export interface MonthlyMetrics {
  month: string; // YYYY-MM format
  netRevenue: number;
  grossProfit: number;
  collections: number;
  wipLockupDays: number;
  debtorsLockupDays: number;
  writeoffPercentage: number;
  // Calculation components for tooltips
  wipBalance?: number;
  trailing12Revenue?: number;
  debtorsBalance?: number;
  trailing12Billings?: number;
  negativeAdj?: number;
  provisions?: number;
  grossTime?: number;
}

/**
 * My Reports Overview request parameters
 */
export interface MyReportsOverviewParams {
  fiscalYear?: number;        // If provided, show fiscal year view
  startDate?: string;         // For custom date range (ISO format)
  endDate?: string;           // For custom date range (ISO format)
  mode?: 'fiscal' | 'custom'; // View mode
  serviceLines?: string[];    // Optional array of masterCode values to filter by service line
}

/**
 * My Reports Overview response data
 */
export interface MyReportsOverviewData {
  monthlyMetrics?: MonthlyMetrics[]; // Cumulative within period (single year)
  yearlyData?: { [year: string]: MonthlyMetrics[] }; // Multi-year comparison data
  filterMode: 'PARTNER' | 'MANAGER';
  employeeCode: string;
  fiscalYear?: number | 'all'; // If fiscal year mode, 'all' for multi-year comparison
  dateRange?: {               // If custom mode
    start: string;
    end: string;
  };
  isCumulative: boolean;      // Always true now
}

/**
 * My Reports - Recoverability Report types
 */

/**
 * Aging buckets for debtor analysis
 */
export interface AgingBuckets {
  current: number;       // 0-30 days
  days31_60: number;     // 31-60 days
  days61_90: number;     // 61-90 days
  days91_120: number;    // 91-120 days
  days120Plus: number;   // 120+ days
}

/**
 * Recoverability Report request parameters
 */
export interface RecoverabilityReportParams {
  fiscalYear?: number;        // If provided, show fiscal year view
  startDate?: string;         // For custom date range (ISO format)
  endDate?: string;           // For custom date range (ISO format)
  mode?: 'fiscal' | 'custom'; // View mode
}

/**
 * Recoverability Report response data
 */
export interface RecoverabilityReportData {
  clients: ClientDebtorData[];
  totalAging: AgingBuckets;
  receiptsComparison: {
    currentPeriodReceipts: number;
    priorMonthBalance: number;
    variance: number;
  };
  employeeCode: string;
  fiscalYear?: number;        // If fiscal year mode
  fiscalMonth?: string;       // If fiscal year + month mode ('Sep', 'Oct', etc.)
  dateRange?: {               // If custom mode
    start: string;
    end: string;
  };
}

/**
 * Monthly receipt data for a single month
 */
export interface MonthlyReceiptData {
  month: string;           // 'Sep', 'Oct', etc.
  monthYear: string;       // '2024-09' for sorting
  openingBalance: number;  // Balance at start of month
  receipts: number;        // Payments received in month
  variance: number;        // Receipts - Opening Balance (surplus/deficit)
  recoveryPercent: number; // receipts / openingBalance * 100
  billings: number;        // Positive transactions in month
  closingBalance: number;  // Opening + Billings - Receipts
}

/**
 * Client-level debtor data with aging and receipts
 */
export interface ClientDebtorData {
  GSClientID: string;
  clientCode: string;
  clientNameFull: string | null;
  groupCode: string;
  groupDesc: string;
  servLineCode: string;
  serviceLineName: string;
  masterServiceLineCode: string;
  masterServiceLineName: string;
  subServlineGroupCode: string;
  subServlineGroupDesc: string;
  totalBalance: number;
  aging: AgingBuckets;
  currentPeriodReceipts: number;
  priorMonthBalance: number;
  invoiceCount: number;
  avgPaymentDaysOutstanding: number;       // Weighted avg days outstanding for unpaid invoices
  avgPaymentDaysPaid: number | null;       // Weighted avg days to pay for fully paid invoices
  monthlyReceipts: MonthlyReceiptData[];   // Monthly breakdown for receipts view
}

// ============================================================================
// Stored Procedure Result Types
// ============================================================================

/**
 * WipLTD stored procedure result
 * Task-level WIP aggregations with profitability metrics
 */
export interface WipLTDResult {
  clientCode: string;
  clientNameFull: string | null;
  groupCode: string;
  groupDesc: string;
  TaskCode: string;
  OfficeCode: string;
  ServLineCode: string;
  ServLineDesc: string;
  // Service line hierarchy
  masterCode: string | null;
  SubServlineGroupCode: string | null;
  SubServlineGroupDesc: string | null;
  masterServiceLineName: string | null;
  TaskPartner: string;
  TaskPartnerName: string;
  TaskManager: string;
  TaskManagerName: string;
  GSTaskID: string;
  GSClientID: string;
  // WIP metrics
  LTDTimeCharged: number;
  LTDDisbCharged: number;
  LTDFeesBilled: number;
  LTDAdjustments: number;
  LTDPositiveAdj: number;
  LTDNegativeAdj: number;
  LTDWipProvision: number;
  LTDHours: number;
  LTDCost: number;
  BalWip: number;
  // Calculated fields
  NetWIP: number;
  NetRevenue: number;
  GrossProfit: number;
}

/**
 * WipMonthly stored procedure result
 * Monthly WIP aggregations for Overview charts
 */
export interface WipMonthlyResult {
  Month: Date;
  LTDTime: number;
  LTDDisb: number;
  LTDAdj: number;
  LTDNegativeAdj: number;
  LTDProvision: number;
  LTDCost: number;
  LTDHours: number;
  BalWip: number;
}

/**
 * DrsLTD stored procedure result
 * Client-level debtors aggregations with aging buckets
 */
export interface DrsLTDResult {
  GSClientID: string;
  ClientCode: string;
  ClientNameFull: string | null;
  GroupCode: string;
  GroupDesc: string;
  ServLineCode: string;
  ServLineDesc: string;
  OfficeCode: string;
  OfficeDesc: string;
  Biller: string;
  BillerName: string;
  ClientPartner: string;
  ClientPartnerName: string;
  ClientManager: string;
  ClientManagerName: string;
  // LTD metrics
  LTDInvoiced: number;
  LTDCreditNotes: number;
  LTDReceipts: number;
  LTDJournals: number;
  LTDWriteOffs: number;
  BalDrs: number;
  // Aging buckets
  InvoiceCount: number;
  AgingCurrent: number;
  Aging31_60: number;
  Aging61_90: number;
  Aging91_120: number;
  Aging120Plus: number;
  // Payment metrics (v2)
  AvgPaymentDaysPaid: number | null;  // Weighted avg days to pay for fully paid invoices
  AvgDaysOutstanding: number;         // Weighted avg days outstanding for unpaid invoices
}

/**
 * DrsMonthly stored procedure result
 * Monthly debtors aggregations for Overview charts
 */
export interface DrsMonthlyResult {
  Month: Date;
  LTDInvoiced: number;
  LTDCreditNotes: number;
  Collections: number;
  LTDJournals: number;
  LTDWriteOffs: number;
  NetBillings: number;
  BalDrs: number;
  // Non-cumulative values for receipts tab
  MonthlyReceipts: number;
  MonthlyInvoiced: number;
  MonthlyNetBillings: number;
}

/**
 * sp_RecoverabilityData stored procedure result (AGING DATA)
 * One row per client-serviceline combination with aging metrics
 */
export interface RecoverabilityDataResult {
  GSClientID: string;
  ClientCode: string;
  ClientNameFull: string | null;
  GroupCode: string;
  GroupDesc: string;
  // Service line (original + mapped at transaction level)
  ServLineCode: string;
  ServLineDesc: string;
  MasterServiceLineCode: string;
  MasterServiceLineName: string;
  SubServlineGroupCode: string;
  SubServlineGroupDesc: string;
  // Balances and aging
  TotalBalance: number;
  AgingCurrent: number;
  Aging31_60: number;
  Aging61_90: number;
  Aging91_120: number;
  Aging120Plus: number;
  InvoiceCount: number;
  AvgDaysOutstanding: number;
  // Current period metrics (last 30 days)
  CurrentPeriodReceipts: number;
  CurrentPeriodBillings: number;
  // Prior period (30 days ago)
  PriorMonthBalance: number;
}

/**
 * sp_RecoverabilityMonthly stored procedure result (MONTHLY RECEIPTS DATA)
 * Per-client-serviceline monthly receipts with proper fiscal boundaries
 * 
 * @deprecated No longer used - Receipts now derived from sp_RecoverabilityData current period fields
 * Kept for backward compatibility only
 */
export interface RecoverabilityMonthlyResult {
  GSClientID: string;
  ClientCode: string;
  ClientNameFull: string | null;
  GroupCode: string;
  GroupDesc: string;
  ServLineCode: string;
  ServLineDesc: string;
  // Service line mapping fields
  MasterServiceLineCode: string;
  MasterServiceLineName: string;
  SubServlineGroupCode: string;
  SubServlineGroupDesc: string;
  // Monthly data
  MonthEnd: Date;
  MonthLabel: string;  // 'Sep', 'Oct', etc.
  OpeningBalance: number;  // Cumulative before month start
  Receipts: number;
  Billings: number;
  Variance: number;         // Receipts - OpeningBalance
  RecoveryPercent: number;  // (Receipts / OpeningBalance) * 100
  ClosingBalance: number;   // Opening + Billings - Receipts
}

/**
 * Helper type to convert SP result to existing MonthlyMetrics
 */
export function mapWipMonthlyToMetrics(
  wipRow: WipMonthlyResult,
  drsRow: DrsMonthlyResult | null
): Partial<MonthlyMetrics> {
  const netRevenue = wipRow.LTDTime + wipRow.LTDAdj;
  const grossProfit = netRevenue - wipRow.LTDCost;
  const writeoffAmount = wipRow.LTDNegativeAdj + wipRow.LTDProvision;
  const writeoffPercentage = wipRow.LTDTime !== 0 ? (writeoffAmount / wipRow.LTDTime) * 100 : 0;

  return {
    month: wipRow.Month.toISOString().slice(0, 7), // 'YYYY-MM'
    netRevenue,
    grossProfit,
    writeoffPercentage,
    negativeAdj: wipRow.LTDNegativeAdj,
    provisions: wipRow.LTDProvision,
    grossTime: wipRow.LTDTime,
    wipBalance: wipRow.BalWip,
    collections: drsRow?.Collections ?? 0,
    debtorsBalance: drsRow?.BalDrs ?? 0,
  };
}

/**
 * Helper type to convert DrsLTD result to existing ClientDebtorData
 */
export function mapDrsLTDToClientDebtor(row: DrsLTDResult): Partial<ClientDebtorData> {
  return {
    GSClientID: row.GSClientID,
    clientCode: row.ClientCode,
    clientNameFull: row.ClientNameFull,
    groupCode: row.GroupCode,
    groupDesc: row.GroupDesc,
    servLineCode: row.ServLineCode,
    serviceLineName: row.ServLineDesc,
    totalBalance: row.BalDrs,
    aging: {
      current: row.AgingCurrent,
      days31_60: row.Aging31_60,
      days61_90: row.Aging61_90,
      days91_120: row.Aging91_120,
      days120Plus: row.Aging120Plus,
    },
    invoiceCount: row.InvoiceCount,
    avgPaymentDaysOutstanding: row.AvgDaysOutstanding,
    avgPaymentDaysPaid: row.AvgPaymentDaysPaid,
  };
}































