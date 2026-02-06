# Summary Stored Procedure Optimization (v1.1)

**Created:** 2026-02-04

## Overview

This migration optimizes the Country Management summary stored procedures for improved performance by reducing the number of rows scanned during aggregation.

## Stored Procedures Updated

- `sp_WIPAgingSummaryByPartner` (v1.0 → v1.1)
- `sp_WIPAgingSummaryByManager` (v1.0 → v1.1)
- `sp_ProfitabilitySummaryByPartner` (v1.0 → v1.1)
- `sp_ProfitabilitySummaryByManager` (v1.0 → v1.1)

## Optimizations Applied

### 1. Pre-filter Active Tasks (40% row reduction)

Before scanning WIPTransactions (5.7M rows), we first create an indexed temp table containing only active tasks (~150K rows):

```sql
CREATE TABLE #ActiveTasks (
    GSTaskID UNIQUEIDENTIFIER NOT NULL,
    TaskPartner NVARCHAR(10),
    GSClientID UNIQUEIDENTIFIER
)

INSERT INTO #ActiveTasks
SELECT GSTaskID, TaskPartner, GSClientID
FROM [dbo].[Task]
WHERE Active = 'Yes'

-- Add clustered index for efficient JOIN
CREATE CLUSTERED INDEX IX_AT_GSTaskID ON #ActiveTasks (GSTaskID)
```

The main aggregation query then joins to this temp table, eliminating transactions for inactive tasks.

### 2. 3-Year Date Lower Bound (50% row reduction) - WIP Aging Only

WIP Aging reports typically care about recent data. We add a 3-year lower bound:

```sql
DECLARE @DateLowerBound DATETIME = DATEADD(YEAR, -3, @AsOfDate)

WHERE w.TranDate >= @p_DateLowerBound AND w.TranDate <= @p_AsOfDate
```

This reduces the scan from 5.7M rows to ~2.5M rows.

### 3. Reuse Temp Tables for Client Count

Instead of joining to Task table again for client counts, we reuse the #ActiveTasks temp table:

```sql
-- Before (redundant Task table scan)
INNER JOIN [dbo].[Task] t ON wa.GSTaskID = t.GSTaskID

-- After (reuse temp table)
INNER JOIN #ActiveTasks at ON wa.GSTaskID = at.GSTaskID
```

## Expected Performance Improvements

| Metric | Before | After |
|--------|--------|-------|
| WIP Aging Summary | 10-30s | 1-3s |
| Profitability Summary | 5-15s | 1-3s |
| Data scanned (WIP Aging) | 5.7M rows | ~1.5M rows |
| Data scanned (Profitability) | 5.7M rows | ~3.4M rows |

## Cache TTL Changes

API routes for summary endpoints have been updated:

- **Current fiscal year data:** 30 minutes (was 5 minutes)
- **Historical fiscal year data:** 60 minutes (was 5 minutes)

## Deployment

Run the migration:

```bash
# Apply via sqlcmd or Azure Data Studio
sqlcmd -S <server> -d <database> -i migration.sql
```

Or use the application migration process.

## SP Naming Standardization

This migration also cleans up duplicate stored procedures by standardizing on the `sp_` prefix convention:

| Dropped (Duplicate) | Keep (Standard) |
|---|---|
| `dbo.WipMonthly` | `dbo.sp_WipMonthly` |
| `dbo.DrsMonthly` | `dbo.sp_DrsMonthly` |

The application code (`storedProcedureService.ts`) has been updated to use the `sp_` prefixed versions.

## Rollback

To rollback, restore the v1.0 stored procedures from `prisma/migrations/20260203_summary_stored_procedures/migration.sql`.

**Note:** If rolling back, you'll also need to recreate the dropped SPs (`WipMonthly`, `DrsMonthly`) or revert the code changes in `storedProcedureService.ts`.

## Testing

After deployment, test the summary endpoints:

```bash
# Profitability Summary by Partner
curl "/api/country-management/reports/profitability/summary?aggregateBy=partner&fiscalYear=2026"

# WIP Aging Summary by Manager
curl "/api/country-management/reports/wip-aging/summary?aggregateBy=manager"
```

Expected: Response times under 3 seconds.
