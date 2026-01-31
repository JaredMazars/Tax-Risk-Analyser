# Critical Fix: Balance Sheet vs P&L Accounting in sp_ProfitabilityData

## Problem Identified

The original `sp_ProfitabilityData` stored procedure had a **critical accounting error**: it was filtering ALL WIP transactions by the date range parameters, including balance sheet accounts.

### Why This Was Wrong

**Balance Sheet Accounts** (BalWip, NetWIP):
- ❌ **OLD**: Filtered by date range → showed only transactions within period
- ✅ **NEW**: Show cumulative balance from ALL transactions (life-to-date)
- **Reason**: WIP is a balance sheet account representing the current state, not period activity

**P&L Accounts** (Charges, Costs, Revenue):
- ✅ Period-specific filtering is CORRECT for these metrics
- Shows activity within the reporting period

## What Changed (v2.0)

### Before (Incorrect)
```sql
-- ALL transactions filtered by date range
WHERE w.TranDate >= @DateFrom
  AND w.TranDate <= @DateTo
```

Result: BalWip and NetWIP only included period transactions ❌

### After (Correct)
```sql
-- Date filter moved INTO CASE statements for period metrics only
SUM(CASE WHEN w.TType = 'T' AND w.TranDate >= @DateFrom AND w.TranDate <= @DateTo 
    THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDTimeCharged

-- Balance sheet metrics have NO date filter
SUM(CASE WHEN w.TType = 'T' THEN ISNULL(w.Amount, 0) ELSE 0 END) -- Used in BalWip

-- WHERE clause now only filters by EmpCode (if specified)
WHERE (w.EmpCode = @EmpCode OR @EmpCode = '*' OR w.EmpCode IS NULL)
```

Result: 
- BalWip and NetWIP show cumulative balance (all time) ✅
- Period metrics show activity within date range ✅

## Impact on Reports

### Profitability Report
When running with date range parameters:
- **BalWip**: Now shows true WIP balance (cumulative)
- **NetWIP**: Now shows true net WIP after all provisions (cumulative)
- **LTDTimeCharged**: Shows charges within period (unchanged)
- **LTDCost**: Shows costs within period (unchanged)
- **NetRevenue**: Shows period revenue (unchanged)
- **GrossProfit**: Shows period profit (unchanged)

### Example Scenario

**Task BLAW001:**
- All-time Time Charged: $5,000,000
- All-time Fees Billed: -$4,000,000
- Period charges (Jan 2026): $100,000

**Before (WRONG):**
- Query for Jan 2026: BalWip = $100,000 (only Jan transactions)

**After (CORRECT):**
- Query for Jan 2026: BalWip = $1,000,000 (cumulative from all time)
- LTDTimeCharged = $100,000 (period activity)

## Migration Notes

### Database Update Required

Execute the updated stored procedure:
```sql
-- Deploy updated procedure
USE YourDatabase
GO
EXEC sp_executesql N'
-- (paste contents of sp_ProfitabilityData.sql)
'
```

### TypeScript/API Changes

**No changes required** to API or TypeScript code - the stored procedure signature and return columns remain identical.

### Testing Verification

Run these queries to verify the fix:

```sql
-- Test: Compare period vs all-time for a known task
DECLARE @TaskCode NVARCHAR(20) = 'BLAW001'

-- Period metrics (Jan 2026)
EXEC sp_ProfitabilityData 
    @TaskCode = @TaskCode,
    @DateFrom = '2026-01-01',
    @DateTo = '2026-01-31',
    @ServLineCode = '*',
    @PartnerCode = '*',
    @ManagerCode = '*',
    @GroupCode = '*',
    @ClientCode = '*',
    @EmpCode = '*'

-- Verify BalWip matches manual all-time calculation
SELECT 
    TaskCode,
    SUM(CASE WHEN TType = 'T' THEN Amount ELSE 0 END)
    + SUM(CASE WHEN TType = 'D' THEN Amount ELSE 0 END)
    + SUM(CASE WHEN TType = 'ADJ' THEN Amount ELSE 0 END)
    + SUM(CASE WHEN TType = 'F' THEN -Amount ELSE 0 END) AS ExpectedBalWip
FROM WIPTransactions w
    INNER JOIN Task t ON w.GSTaskID = t.GSTaskID
WHERE t.TaskCode = @TaskCode
GROUP BY TaskCode
```

Expected: BalWip from SP should match ExpectedBalWip (all transactions)

## Related Files

- **Stored Procedure**: `prisma/procedures/sp_ProfitabilityData.sql`
- **Debug Script**: `prisma/procedures/debug_netWIP_BLAW001.sql` (investigates this issue)
- **API Route**: `src/app/api/my-reports/profitability/route.ts`
- **Frontend**: `src/components/features/reports/*Table.tsx`

## Version History

- **v1.0**: Original implementation (incorrect date filtering)
- **v2.0**: Fixed balance sheet vs P&L accounting logic (2026-01-31)
