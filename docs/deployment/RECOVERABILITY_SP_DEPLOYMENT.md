# Recoverability Stored Procedures - Deployment & Testing Guide

## Overview

Two new stored procedures have been created to optimize the Recoverability report:

1. **sp_RecoverabilityAging**: Per-client aging analysis with offsetting pair detection
2. **sp_RecoverabilityMonthly**: Per-client monthly receipts breakdown

These procedures fix rounding errors and improve performance by moving complex calculations from JavaScript to SQL.

## Key Improvements

### 1. Rounding Fix
- **Problem**: JavaScript floating-point arithmetic caused cumulative rounding errors
- **Solution**: Explicit `ROUND(value, 2)` at all aggregation points in SQL
- **Result**: Totals now match exactly (within ±0.01 tolerance)

### 2. Performance
- **Problem**: Inline SQL fetches all transactions into memory, then processes in JavaScript
- **Solution**: SQL Server calculates everything server-side, returns only final results
- **Expected**: 50-70% faster execution time

### 3. Maintainability
- **Problem**: 300+ lines of complex business logic spread across TypeScript
- **Solution**: Centralized SQL logic in stored procedures, easier to review and optimize

## Deployment Steps

### Prerequisites

You need ONE of these tools:
- Azure Portal (web browser access)
- Azure Data Studio (recommended for local development)
- SQL Server Management Studio (SSMS)

### Step 1: Deploy Stored Procedures

**Option A: Azure Portal Query Editor** (No local tools required)

1. Go to [portal.azure.com](https://portal.azure.com)
2. Navigate to: SQL databases → gt3-db
3. Click "Query editor" in the left menu
4. Authenticate with SQL authentication:
   - Login: `sqladmin`
   - Password: (from DATABASE_URL in .env)

5. Deploy **sp_RecoverabilityAging**:
   - Open `prisma/procedures/sp_RecoverabilityAging.sql` in your code editor
   - Copy the ENTIRE file contents
   - Paste into Azure Portal Query Editor
   - Click "Run"
   - Wait for "Query succeeded" message

6. Deploy **sp_RecoverabilityMonthly**:
   - Open `prisma/procedures/sp_RecoverabilityMonthly.sql`
   - Copy the ENTIRE file contents
   - Paste into Query Editor
   - Click "Run"
   - Wait for "Query succeeded" message

**Option B: Azure Data Studio** (For local development)

1. Open Azure Data Studio
2. Connect to your SQL Server:
   - Server: `gt3-sql-server.database.windows.net`
   - Database: `gt3-db`
   - Authentication: SQL Login
   - Username: `sqladmin`
   - Password: (from .env)
   - Encrypt: Yes

3. Open and execute each file:
   - File → Open → `prisma/procedures/sp_RecoverabilityAging.sql`
   - Press F5 (or click Run button)
   - Verify "Commands completed successfully"
   - Repeat for `sp_RecoverabilityMonthly.sql`

### Step 2: Verify Deployment

Run this query in Query Editor or Azure Data Studio:

```sql
SELECT 
    name AS ProcedureName,
    create_date AS Created,
    modify_date AS Modified
FROM sys.objects 
WHERE type = 'P' 
  AND name IN ('sp_RecoverabilityAging', 'sp_RecoverabilityMonthly')
ORDER BY name;
```

**Expected Result**: 2 rows showing both procedures with recent create/modify dates.

### Step 3: Enable Stored Procedures

1. Open `.env` file in your project
2. Find or add the line: `USE_SP_FOR_REPORTS=false`
3. Change to: `USE_SP_FOR_REPORTS=true`
4. Save the file

### Step 4: Restart Dev Server

```bash
# Stop current dev server (Ctrl+C)
# Start fresh
npm run dev
```

The application will now use stored procedures for the Recoverability report.

## Testing & Validation

### Test Cases

Test the report with these scenarios to verify correctness:

**Test 1: Zero-Balance Filtering**
- Navigate to: My Reports → Recoverability
- Select: FY2026, January
- **Verify**: DIY0114 should NOT appear in the list

**Test 2: Negative Invoice Aging (BOS0139)**
- Same report (FY2026, January)
- Find client BOS0139
- **Verify**: 
  - Total Balance = R 29,140
  - Sum of aging buckets = R 29,140
  - No rounding errors (totals match exactly)

**Test 3: Offsetting Pair Exclusion (DIY0114 historical)**
- Check DIY0114 historical data
- **Verify**: Offsetting invoice pairs (M0035035/BFR0000047, M0043545/BFR0000118) are excluded from aging

**Test 4: Monthly Receipts Accuracy**
- Switch to "Monthly Receipts" tab
- For any client, verify:
  - Opening Balance (month start)
  - + Billings (positive transactions in month)
  - - Receipts (payments in month)
  - = Closing Balance (matches next month's opening)

**Test 5: Rounding Accuracy**
- Check several clients
- **Verify**: Total Balance exactly equals sum of aging buckets (no ±0.01, ±0.02 differences)

### Comparison Test (Optional)

To validate SP results match inline SQL:

1. Keep USE_SP_FOR_REPORTS=false
2. Load report, copy results
3. Set USE_SP_FOR_REPORTS=true, restart server
4. Load report again
5. Compare: All numbers should match within ±0.01 tolerance

## Performance Monitoring

After enabling stored procedures, monitor:

**Expected Improvements:**
- Report load time: 25-30 seconds → 10-15 seconds (50-60% faster)
- Server memory: Reduced (no transaction arrays in Node.js memory)
- Database CPU: Similar or slightly higher (more work server-side)

**Monitor in:**
- Browser DevTools Network tab (API response time)
- Next.js terminal logs (duration in ms)
- Azure Portal → SQL Database → Query Performance Insight

## Rollback Plan

If issues occur:

### Immediate Rollback (No Code Changes)

1. Open `.env`
2. Set `USE_SP_FOR_REPORTS=false`
3. Restart dev server (Ctrl+C, then `npm run dev`)
4. Application reverts to inline SQL implementation

### Remove Stored Procedures (If Needed)

```sql
DROP PROCEDURE IF EXISTS dbo.sp_RecoverabilityAging;
DROP PROCEDURE IF EXISTS dbo.sp_RecoverabilityMonthly;
```

## Troubleshooting

### Issue: Procedures not found error

**Symptom**: Error message "Could not find stored procedure 'dbo.sp_RecoverabilityAging'"

**Solution**:
1. Verify procedures were deployed (see Verification step)
2. Check database connection string in .env
3. Ensure you're connected to correct database (gt3-db)

### Issue: Results don't match inline SQL

**Symptom**: Numbers differ by more than ±0.01 between SP and inline paths

**Solution**:
1. Check if recent code changes affected inline SQL logic
2. Review stored procedure logic for alignment
3. Run comparison test with detailed logging
4. Report specific client codes and values that differ

### Issue: Performance worse than inline SQL

**Symptom**: SP path slower than inline SQL path

**Solution**:
1. Check if indexes exist: `idx_drs_biller_super_covering`
2. Update statistics: `UPDATE STATISTICS DrsTransactions;`
3. Check query execution plans in Azure Portal
4. May need index tuning for specific query patterns

## Technical Details

### sp_RecoverabilityAging Logic

```
AllTransactions (fetch all for biller up to asOfDate)
  ↓
ClientBalance (SUM all transactions = TotalBalance)
  ↓
InvoiceBalances (group by InvNumber, calculate NetBalance)
  ↓
OffsettingPairs (detect equal and opposite amounts)
  ↓
ExcludedInvoices (union of offsetting pairs)
  ↓
AgingCalculation (calculate days outstanding, assign buckets)
  ↓
ClientAging (aggregate buckets per client with ROUND)
  ↓
Final SELECT (merge client + aging + period metrics)
```

### sp_RecoverabilityMonthly Logic

```
MonthSeries (generate Sep-Aug months)
  ↓
ClientList (distinct clients for biller)
  ↓
AllTransactions (all transactions up to dateTo)
  ↓
MonthlyData (CROSS JOIN clients × months, calculate metrics)
  ↓
Final SELECT (calculate variance, recovery%, closing balance)
```

### Critical Business Rules Implemented

1. **Invoice Date**: MIN(TranDate) for positive transactions only
2. **Offsetting Pairs**: Invoices with equal and opposite amounts are excluded from aging
3. **Negative Aging**: Negative invoices reduce their respective aging buckets
4. **Total Balance**: Cumulative from ALL transactions (not just open invoices)
5. **Zero Filtering**: Clients with totalBalance ≈ 0 AND all aging buckets ≈ 0 are excluded

## Support

For issues or questions:
1. Check this guide's Troubleshooting section
2. Review stored procedure comments in SQL files
3. Compare with inline SQL logic in `route.ts` (lines 400-800)
4. Check application logs for detailed error messages
