# Stored Procedures Usage Reference

## Overview

This document maps which stored procedures (SPs) are used in graphs, profitability reports, and analytics throughout the application.

---

## Stored Procedures in Use

### 1. Profitability Reports

#### Primary SP: `WipLTD` (sp_WipLTD_Enhanced.sql)

**Location:** `prisma/procedures/sp_WipLTD_Enhanced.sql`

**Used By:**
- `/api/my-reports/profitability` - My Reports Profitability Report
- Called via `executeWipLTD()` in `storedProcedureService.ts`

**Purpose:**
- Task-level WIP aggregations
- Full profitability metrics including cost, hours, and adjustments
- Lifetime-to-date calculations

**Key Features:**
- Uses temp tables instead of nested CTEs for faster compilation
- Supports filtering by:
  - Service Line
  - Partner Code
  - Manager Code
  - Group Code
  - Client Code
  - Task Code
  - Date Range
  - Employee Code

**Returns:**
```typescript
interface WipLTDResult {
  TaskCode: string;
  clientCode: string;
  clientNameFull: string;
  groupCode: string;
  groupDesc: string;
  ServLineCode: string;
  ServLineDesc: string;
  TaskPartner: string;
  TaskPartnerName: string;
  TaskManager: string;
  TaskManagerName: string;
  GSTaskID: string;
  GSClientID: string;
  // Metrics
  LTDHours: number;
  LTDTimeCharged: number;
  LTDDisbCharged: number;
  LTDAdjustments: number;
  LTDFeesBilled: number;
  LTDCost: number;
  LTDProvisions: number;
  LTDNegativeAdj: number;
}
```

**API Endpoint:**
- `GET /api/my-reports/profitability?fiscalYear=2024&mode=fiscal`
- `GET /api/my-reports/profitability?startDate=2024-01-01&endDate=2024-12-31&mode=custom`

---

#### Alternative SP: `sp_GetProfitabilityByTasks` (sp_GetProfitabilityByTasks.sql)

**Location:** `prisma/procedures/sp_GetProfitabilityByTasks.sql`

**Status:** Available but not currently used in production code

**Purpose:**
- Calculate profitability metrics for multiple tasks with date filtering
- Accepts JSON array of task GUIDs
- Designed for simple indexes (no INCLUDE columns needed)

**Parameters:**
```sql
@TaskIds    NVARCHAR(MAX) -- JSON array of task GUIDs
@StartDate  DATE          -- Start of date range
@EndDate    DATE          -- End of date range
```

**Note:** This is a newer SP that could be used as an alternative to `WipLTD` for specific use cases where you already have task IDs.

---

### 2. Overview Charts & Monthly Trends

#### SP: `WipMonthly` (sp_WipMonthly.sql)

**Location:** `prisma/procedures/sp_WipMonthly.sql`

**Used By:**
- `/api/my-reports/overview` - My Reports Overview page
- Called via `executeWipMonthly()` in `storedProcedureService.ts`

**Purpose:**
- Monthly WIP aggregations for Overview charts
- Shows WIP trends over time (cumulative or non-cumulative)
- Used for calculating lockup days

**Key Features:**
- Supports both cumulative (running totals) and non-cumulative (monthly values) modes
- Uses temp tables for faster compilation
- Aggregates by month for chart display

**Parameters:**
```typescript
interface WipMonthlyParams {
  partnerCode?: string;
  managerCode?: string;
  servLineCode?: string;
  dateFrom: Date;
  dateTo: Date;
  isCumulative?: boolean; // Default: true
}
```

**Returns:**
```typescript
interface WipMonthlyResult {
  Month: Date;           // Month-end date
  BalWip: number;        // WIP balance
  LTDTime: number;       // Time charged
  LTDDisb: number;       // Disbursements
  LTDAdj: number;        // Adjustments
  LTDFees: number;       // Fees billed
  LTDCost: number;       // Cost
  LTDProvision: number;  // Provisions
  LTDNegativeAdj: number; // Negative adjustments
}
```

**API Endpoint:**
- `GET /api/my-reports/overview` (internal use within aggregation)

---

#### SP: `DrsMonthly` (Not in Files - May be in Database)

**Used By:**
- `/api/my-reports/overview` - My Reports Overview page
- Called via `executeDrsMonthly()` in `storedProcedureService.ts`

**Purpose:**
- Monthly debtors aggregations for Overview charts
- Shows collections and debtor balance trends
- Used for calculating debtor lockup days

**Parameters:**
```typescript
interface DrsMonthlyParams {
  billerCode: string;    // Required
  servLineCode?: string;
  dateFrom: Date;
  dateTo: Date;
  isCumulative?: boolean; // Default: true
}
```

**Returns:**
```typescript
interface DrsMonthlyResult {
  Month: Date;
  BalDrs: number;        // Debtors balance
  Collections: number;   // Collections in month
  NetBillings: number;   // Net billings
  MonthlyInvoiced: number;
  MonthlyNetBillings: number;
}
```

**Note:** The SQL file for this SP is not in the `prisma/procedures` folder but the SP exists and is used.

---

### 3. Recoverability Reports (Aging & Receipts)

#### SP: `sp_RecoverabilityData` (sp_RecoverabilityData.sql)

**Location:** `prisma/procedures/sp_RecoverabilityData.sql`

**Used By:**
- `/api/my-reports/recoverability` - Both Aging and Receipts tabs
- Called via `executeRecoverabilityData()` in `storedProcedureService.ts`

**Purpose:**
- Combined aging and current period data by client-serviceline
- Single optimized SP for both aging analysis and receipts tracking
- Returns per-client-serviceline aggregations

**Key Features:**
- Groups by Client + Service Line (one row per combination)
- Maps service lines at TRANSACTION level (accurate for multi-serviceline clients)
- Ages ALL invoices (positive and negative)
- Detects and excludes offsetting invoice pairs
- Includes current period billings AND receipts (last 30 days)
- Prior month balance (30 days ago)

**Parameters:**
```typescript
interface RecoverabilityDataParams {
  billerCode: string;    // Required
  asOfDate: Date;        // Required
  clientCode?: string;   // Optional filter
  servLineCode?: string; // Optional filter
}
```

**Returns:**
```typescript
interface RecoverabilityDataResult {
  GSClientID: string;
  ClientCode: string;
  ClientNameFull: string;
  GroupCode: string;
  GroupDesc: string;
  ServLineCode: string;
  ServLineDesc: string;
  // Service line mapping
  MasterServiceLineCode: string;
  MasterServiceLineName: string;
  SubServlineGroupCode: string;
  SubServlineGroupDesc: string;
  // Balances and aging
  TotalBalance: number;
  AgingCurrent: number;       // 0-30 days
  Aging31_60: number;
  Aging61_90: number;
  Aging91_120: number;
  Aging120Plus: number;
  InvoiceCount: number;
  AvgDaysOutstanding: number;
  // Current period metrics (last 30 days)
  CurrentPeriodReceipts: number;
  CurrentPeriodBillings: number;
  PriorMonthBalance: number;  // Balance 30 days ago
}
```

**API Endpoint:**
- `GET /api/my-reports/recoverability?fiscalYear=2024&fiscalMonth=Sep&mode=fiscal`
- `GET /api/my-reports/recoverability?startDate=2024-01-01&endDate=2024-12-31&mode=custom`

---

#### SP: `sp_RecoverabilityMonthly` (DEPRECATED)

**Location:** `prisma/procedures/sp_RecoverabilityMonthly.sql`

**Status:** DEPRECATED - No longer used as of 2026-01-31

**Reason:** Consolidated to use only `sp_RecoverabilityData` for both aging and receipts. The monthly receipts are now derived from the current period fields in `sp_RecoverabilityData`.

**Note:** The SP still exists in the database and codebase for reference but is not called by any active code.

---

### 4. Other SPs (Not Used for Graphs/Profitability)

#### SP: `DrsLTDv2` (Not in Files - May be in Database)

**Used By:**
- Recoverability report (legacy, now replaced by `sp_RecoverabilityData`)

**Purpose:**
- Client-level debtors aggregations
- Aging buckets and payment metrics

**Status:** May still be used in some legacy code paths

---

## Analytics Graph Endpoints (No SPs)

The following graph endpoints **DO NOT** use stored procedures - they use inline Prisma queries:

### Task Analytics Graphs
**Endpoint:** `GET /api/tasks/[id]/analytics/graphs`
**File:** `src/app/api/tasks/[id]/analytics/graphs/route.ts`
**Data Source:** Direct Prisma queries on `WIPTransactions` table
**Purpose:** Daily WIP metrics for task-level graphs

### Group Analytics Graphs
**Endpoint:** `GET /api/groups/[groupCode]/analytics/graphs`
**File:** `src/app/api/groups/[groupCode]/analytics/graphs/route.ts`
**Data Source:** Direct Prisma queries on `WIPTransactions` table
**Purpose:** Daily WIP metrics aggregated by group and master service line

### Client Analytics Graphs
**Endpoint:** `GET /api/clients/[id]/analytics/graphs`
**File:** `src/app/api/clients/[id]/analytics/graphs/route.ts`
**Data Source:** Direct Prisma queries on `WIPTransactions` table
**Purpose:** Daily WIP metrics aggregated by client and master service line

**Why No SPs?**
- These endpoints need daily-level granularity (not monthly)
- They use smart downsampling to reduce payload size
- Prisma queries with covering indexes are sufficient for performance
- SPs would add complexity without significant performance benefit for single-entity queries

---

## Summary Table

| Report/Feature | Stored Procedure | File Location | Status |
|---|---|---|---|
| **Profitability Report** | `WipLTD` | `sp_WipLTD_Enhanced.sql` | ✅ Active |
| **Profitability (Alt)** | `sp_GetProfitabilityByTasks` | `sp_GetProfitabilityByTasks.sql` | ⚠️ Available but unused |
| **Overview Charts (WIP)** | `WipMonthly` | `sp_WipMonthly.sql` | ✅ Active |
| **Overview Charts (DRS)** | `DrsMonthly` | Not in files (in DB) | ✅ Active |
| **Recoverability (Aging + Receipts)** | `sp_RecoverabilityData` | `sp_RecoverabilityData.sql` | ✅ Active |
| **Recoverability (Monthly)** | `sp_RecoverabilityMonthly` | `sp_RecoverabilityMonthly.sql` | ❌ Deprecated |
| **Task Graphs** | None | Inline Prisma queries | N/A |
| **Group Graphs** | None | Inline Prisma queries | N/A |
| **Client Graphs** | None | Inline Prisma queries | N/A |

---

## Performance Optimization

### Covering Indexes Used

1. **WIPTransactions:**
   - `idx_WIPTransactions_Aggregation_COVERING` - Used by profitability queries
   - Covers: TaskID, TranDate, TType, Amount, Hour, Cost

2. **DrsTransactions:**
   - `idx_drs_biller_super_covering` - Used by recoverability queries
   - Covers: Biller, TranDate, ClientID, ServiceLine, Total, InvNumber

### SP Compilation Optimization

All SPs use **temp tables** instead of nested CTEs to avoid long compilation times:
- `WipLTD` - Uses temp tables for task filtering
- `WipMonthly` - Uses temp tables for month series and task filtering
- Compilation time: Seconds instead of minutes

---

## Feature Flag

**Environment Variable:** `USE_SP_FOR_REPORTS`

**Current Status:** SPs are used by default for:
- Profitability reports
- Overview charts
- Recoverability reports

**To Disable:** Set `USE_SP_FOR_REPORTS=false` in `.env`
- Will fall back to inline SQL queries (not recommended for production)

---

## Migration Notes

### Recent Changes (2026-01-31)

1. **Recoverability Consolidation:**
   - Removed dual-SP approach (`sp_RecoverabilityData` + `sp_RecoverabilityMonthly`)
   - Now uses only `sp_RecoverabilityData` for both aging and receipts
   - Performance improvement: ~50% faster (1 SP instead of 2)

2. **Receipts Report Filter Fix:**
   - Updated filter to include clients with period activity even if closing balance is zero
   - Ensures clients who fully paid during period appear in report

### Future Considerations

1. **sp_GetProfitabilityByTasks:**
   - Could replace `WipLTD` for specific use cases
   - More flexible JSON-based task ID input
   - Consider for API endpoints that already have task IDs

2. **Graph Endpoints:**
   - Currently use inline Prisma queries
   - Could benefit from SPs if daily aggregations become slow
   - Monitor performance as data volume grows

---

## Related Documentation

- **Consolidated SP Implementation:** `RECOVERABILITY_CONSOLIDATION_SUMMARY.md`
- **Filter Fix:** `RECEIPTS_REPORT_FILTER_FIX.md`
- **Test Plan:** `RECOVERABILITY_CONSOLIDATION_TEST_PLAN.md`
- **Service Layer:** `src/lib/services/reports/storedProcedureService.ts`

---

**Last Updated:** 2026-01-31
