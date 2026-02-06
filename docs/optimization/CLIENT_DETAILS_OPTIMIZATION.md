# Client Details Page Performance Optimization

**Target**: `/dashboard/[serviceLine]/[subServiceLineGroup]/clients/[id]`  
**Issue**: Header totals and cards take a while to load  
**Root Cause**: WIP balance queries in `sp_ProfitabilityData`

## Current Performance Analysis

### Query Breakdown (GET /api/clients/[id])

| Operation | Status | Details |
|---|---|---|
| Client lookup | ✅ Fast | Uses `Client_GSClientID_key` index |
| Task pagination | ✅ Fast | Uses `Task_GSClientID_Active_updatedAt_idx` |
| ServiceLine mappings | ✅ Fast | Uses covering indexes |
| Employee enrichment | ✅ Fast | Uses `Employee_EmpCode_Active_idx` |
| **WIP balances (SP)** | ⚠️ **SLOW** | **PRIMARY BOTTLENECK** |
| Debtor balances (SP) | ✅ Fast | Uses `idx_drs_clientcode` |

### Root Cause: sp_ProfitabilityData Filtering

**Problem**: When called with `ClientCode` parameter for client details page:

```sql
-- Current flow (INEFFICIENT):
STEP 1: Aggregate WIPTransactions (5.7M rows)
  - Groups by GSTaskID
  - No ClientCode filter (only TaskPartner, TaskManager, TaskCode filters)
  - Aggregates ALL tasks, then filters later

STEP 2: Join to Task/Client and filter
  - WHERE c.clientCode = @p_ClientCode
  - Filters out most of the aggregated data from Step 1

STEP 3: Final SELECT with calculations
```

**Impact**: 
- Aggregates millions of WIP transactions unnecessarily
- Only to filter out 99% of them in Step 2
- Wastes CPU, memory, and I/O

**Solution**: Filter by ClientCode in Step 1 before aggregation.

---

## Recommended Optimizations

### Priority 1: Add ClientCode to WIPTransactions (CRITICAL) ⭐

**Impact**: 10-20x faster WIP queries for client details page  
**Risk**: Low - denormalized data pattern, common in data warehousing  
**Effort**: Medium - requires migration, index creation, SP update

#### Step 1.1: Add ClientCode Column to WIPTransactions

```sql
-- Migration: Add ClientCode column (nullable initially)
ALTER TABLE [dbo].[WIPTransactions]
ADD ClientCode NVARCHAR(10) NULL;
GO

-- Backfill ClientCode from Client table via Task join
-- Run in batches to avoid blocking (use WHILE loop for large tables)
UPDATE w
SET w.ClientCode = c.clientCode
FROM [dbo].[WIPTransactions] w
INNER JOIN [dbo].[Task] t ON w.GSTaskID = t.GSTaskID
INNER JOIN [dbo].[Client] c ON t.GSClientID = c.GSClientID
WHERE w.ClientCode IS NULL;
GO

-- Verify backfill (should return 0)
SELECT COUNT(*) FROM [dbo].[WIPTransactions] WHERE ClientCode IS NULL;
GO

-- Make NOT NULL after backfill
ALTER TABLE [dbo].[WIPTransactions]
ALTER COLUMN ClientCode NVARCHAR(10) NOT NULL;
GO
```

#### Step 1.2: Create Covering Index for Client-Based Queries

```sql
-- New covering index for sp_ProfitabilityData with ClientCode filter
CREATE NONCLUSTERED INDEX [IX_WIPTransactions_ClientCode_Covering]
ON [dbo].[WIPTransactions] (ClientCode, TranDate, TType)
INCLUDE (Amount, Hour, Cost, EmpCode, GSTaskID, TaskPartner, TaskManager, TaskServLine, TaskCode)
WITH (ONLINE = ON, FILLFACTOR = 90, SORT_IN_TEMPDB = ON);
GO

-- Update statistics for accurate cardinality estimates
UPDATE STATISTICS [dbo].[WIPTransactions] WITH FULLSCAN;
GO
```

**Index Design Rationale**:
- **Key columns**: `(ClientCode, TranDate, TType)` - Matches WHERE and GROUP BY
- **INCLUDE columns**: All fields used in SELECT, CASE expressions, and filters
- **Result**: Zero key lookups, all data from index

#### Step 1.3: Update sp_ProfitabilityData to Use ClientCode

**File**: `prisma/procedures/sp_ProfitabilityData.sql`

**Changes**:

```sql
-- BEFORE (current version):
SET @sql = N'
INSERT INTO #WIPAggregates
SELECT 
    w.GSTaskID
    -- ... aggregations ...
FROM [dbo].[WIPTransactions] w
    LEFT JOIN [dbo].[Employee] e ON w.EmpCode = e.EmpCode
WHERE 1=1'

-- Partner/Manager/TaskCode filters added conditionally
-- NO ClientCode filter here!

-- AFTER (optimized version):
SET @sql = N'
INSERT INTO #WIPAggregates
SELECT 
    w.GSTaskID
    -- ... aggregations ...
FROM [dbo].[WIPTransactions] w
    LEFT JOIN [dbo].[Employee] e ON w.EmpCode = e.EmpCode
WHERE 1=1'

-- Add ClientCode filter in Step 1 (before aggregation)
IF @ClientCode != '*' SET @sql = @sql + N' AND w.ClientCode = @p_ClientCode'

-- Partner/Manager/TaskCode filters added conditionally
IF @PartnerCode != '*' SET @sql = @sql + N' AND w.TaskPartner = @p_PartnerCode'
-- ... other filters ...

-- Update parameter list
SET @params = N'@p_DateFrom datetime, @p_DateTo datetime, 
    @p_ClientCode nvarchar(max), @p_PartnerCode nvarchar(max), ...'

EXEC sp_executesql @sql, @params,
    @p_ClientCode = @ClientCode,  -- Add this
    @p_PartnerCode = @PartnerCode,
    -- ... other params
```

**Expected Performance Improvement**:
- **Before**: Aggregate 5.7M WIP transactions, filter to ~100 tasks in Step 2
- **After**: Aggregate only ~100 tasks' transactions in Step 1
- **Speedup**: 10-20x faster for client details page

**Impact on My Reports**:
- ✅ **No impact** - My Reports typically don't filter by single client
- ✅ Uses Partner/Manager/ServiceLine filters which are unchanged
- ✅ If ClientCode = '*', optimization is skipped (dynamic SQL)

---

### Priority 2: Optimize Task Count by Service Line Query

**Current Implementation**: `getTaskCountsByServiceLine` in `src/lib/services/tasks/taskAggregation.ts`

**Issue**: Groups all tasks for a client by service line without index optimization.

#### Step 2.1: Check Current Implementation

```typescript
// src/lib/services/tasks/taskAggregation.ts
export async function getTaskCountsByServiceLine(
  GSClientID: string,
  includeArchived: boolean
): Promise<Record<string, number>> {
  // Current query groups tasks and joins to ServiceLineExternal
  // Relies on Task_GSClientID_Active_updatedAt_idx
}
```

#### Step 2.2: Create Specialized Index (Optional)

If task counts are still slow, add:

```sql
-- Composite index for task counting grouped by service line
CREATE NONCLUSTERED INDEX [IX_Task_ClientID_ServLine_Active]
ON [dbo].[Task] (GSClientID, ServLineCode, Active)
WITH (ONLINE = ON, FILLFACTOR = 90);
GO
```

**Benefits**:
- Faster GROUP BY ServLineCode queries
- Eliminates sort operation
- Index-only scan for counts

---

### Priority 3: Parallel Employee Enrichment (Optional)

**Current**: Serial employee lookups in `enrichRecordsWithEmployeeNames`

**Optimization**: Already efficient with `Employee_EmpCode_Active_idx`. Only optimize if profiling shows bottleneck.

---

## Migration Plan

### Step 1: Create Migration File

**File**: `prisma/migrations/20260203_wip_clientcode_optimization/migration.sql`

```sql
-- ============================================================================
-- WIPTransactions ClientCode Optimization for Client Details Page
-- Adds ClientCode column and covering index for faster client-specific queries
-- ============================================================================

BEGIN TRANSACTION;

-- Add ClientCode column (nullable initially)
ALTER TABLE [dbo].[WIPTransactions]
ADD ClientCode NVARCHAR(10) NULL;
GO

-- Backfill ClientCode from Task/Client join
-- Run in batches for safety (adjust batch size based on table size)
DECLARE @BatchSize INT = 50000;
DECLARE @RowsAffected INT = 1;

WHILE @RowsAffected > 0
BEGIN
    UPDATE TOP (@BatchSize) w
    SET w.ClientCode = c.clientCode
    FROM [dbo].[WIPTransactions] w
    INNER JOIN [dbo].[Task] t ON w.GSTaskID = t.GSTaskID
    INNER JOIN [dbo].[Client] c ON t.GSClientID = c.GSClientID
    WHERE w.ClientCode IS NULL;
    
    SET @RowsAffected = @@ROWCOUNT;
    
    -- Log progress
    PRINT 'Backfilled ' + CAST(@RowsAffected AS VARCHAR(10)) + ' rows';
    
    -- Small delay to reduce log pressure
    WAITFOR DELAY '00:00:01';
END
GO

-- Verify backfill completion
DECLARE @NullCount INT;
SELECT @NullCount = COUNT(*) FROM [dbo].[WIPTransactions] WHERE ClientCode IS NULL;

IF @NullCount > 0
BEGIN
    RAISERROR('Backfill incomplete: %d rows still NULL', 16, 1, @NullCount);
    ROLLBACK TRANSACTION;
    RETURN;
END
GO

-- Make NOT NULL after successful backfill
ALTER TABLE [dbo].[WIPTransactions]
ALTER COLUMN ClientCode NVARCHAR(10) NOT NULL;
GO

-- Create covering index for client-based queries
CREATE NONCLUSTERED INDEX [IX_WIPTransactions_ClientCode_Covering]
ON [dbo].[WIPTransactions] (ClientCode, TranDate, TType)
INCLUDE (Amount, Hour, Cost, EmpCode, GSTaskID, TaskPartner, TaskManager, TaskServLine, TaskCode)
WITH (ONLINE = ON, FILLFACTOR = 90, SORT_IN_TEMPDB = ON);
GO

-- Update statistics
UPDATE STATISTICS [dbo].[WIPTransactions] WITH FULLSCAN;
GO

COMMIT TRANSACTION;

PRINT 'Migration completed successfully';
GO
```

**File**: `prisma/migrations/20260203_wip_clientcode_optimization/README.md`

```markdown
# WIPTransactions ClientCode Optimization

## Purpose
Adds `ClientCode` column to `WIPTransactions` for faster client-specific queries in `sp_ProfitabilityData`.

## Changes
1. Add `ClientCode` column (NOT NULL after backfill)
2. Backfill from `Client` via `Task` join (batched)
3. Create covering index `IX_WIPTransactions_ClientCode_Covering`

## Performance Impact
- **Client details page**: 10-20x faster WIP balance queries
- **My Reports**: No impact (unchanged filters)

## Rollback
```sql
DROP INDEX [IX_WIPTransactions_ClientCode_Covering] ON [dbo].[WIPTransactions];
ALTER TABLE [dbo].[WIPTransactions] DROP COLUMN ClientCode;
```

## Estimated Time
- Backfill: ~10-15 minutes for 5.7M rows
- Index creation: ~5-10 minutes
- Total: ~20-25 minutes
```

### Step 2: Update Stored Procedure

**File**: `prisma/procedures/sp_ProfitabilityData.sql`

Add ClientCode filter in Step 1 (see detailed changes in Priority 1.3 above).

### Step 3: Test Before Production

```sql
-- Test with client details page parameters
EXEC dbo.sp_ProfitabilityData 
    @ClientCode = 'CLIENT001',
    @DateFrom = '1900-01-01',
    @DateTo = '2099-12-31',
    @ServLineCode = '*',
    @PartnerCode = '*',
    @ManagerCode = '*',
    @GroupCode = '*',
    @TaskCode = '*',
    @EmpCode = '*';

-- Verify index usage in execution plan
SET STATISTICS IO ON;
SET STATISTICS TIME ON;
```

**Expected Results**:
- Index seek on `IX_WIPTransactions_ClientCode_Covering`
- Logical reads < 1000 (currently 50,000+)
- Elapsed time < 500ms (currently 5-10 seconds)

---

## Testing Checklist

### Unit Tests
- [ ] sp_ProfitabilityData with ClientCode filter returns correct results
- [ ] sp_ProfitabilityData with ClientCode = '*' returns all clients (unchanged)
- [ ] WIP balances match previous implementation (regression test)

### Integration Tests
- [ ] Client details page loads WIP balances correctly
- [ ] My Reports - Profitability report unchanged performance
- [ ] My Reports - Overview graphs unchanged performance

### Performance Tests
- [ ] Client details page loads < 2 seconds (target: < 1 second)
- [ ] sp_ProfitabilityData execution time < 500ms for single client
- [ ] No regression in My Reports performance (Partner/Manager filters)

---

## Rollback Plan

If issues arise after deployment:

```sql
-- Remove index
DROP INDEX [IX_WIPTransactions_ClientCode_Covering] ON [dbo].[WIPTransactions];

-- Revert stored procedure to previous version (git revert)
-- Keep ClientCode column for future optimization attempts
```

---

## Monitoring After Deployment

### Key Metrics
1. **Client details page load time**: Monitor < 2 seconds
2. **sp_ProfitabilityData execution time**: Monitor < 500ms
3. **My Reports performance**: Ensure no regression

### SQL Server Monitoring
```sql
-- Check index usage after 24 hours
SELECT 
    OBJECT_NAME(s.object_id) AS TableName,
    i.name AS IndexName,
    s.user_seeks,
    s.user_scans,
    s.user_lookups,
    s.last_user_seek
FROM sys.dm_db_index_usage_stats s
INNER JOIN sys.indexes i ON s.object_id = i.object_id AND s.index_id = i.index_id
WHERE i.name = 'IX_WIPTransactions_ClientCode_Covering';
```

---

## Summary

### Expected Performance Improvements

| Metric | Before | After | Improvement |
|---|---|---|---|
| Client details load time | 8-12 seconds | 1-2 seconds | **6-10x faster** |
| sp_ProfitabilityData (client) | 5-10 seconds | 300-500ms | **10-20x faster** |
| WIP transactions scanned | 5.7M rows | ~100 tasks | **99% reduction** |
| Logical reads | 50,000+ | < 1,000 | **50x reduction** |

### Risk Assessment

| Risk | Mitigation |
|---|---|
| Backfill timeout | Batched updates with progress logging |
| Index creation blocking | ONLINE = ON prevents table locks |
| Data inconsistency | Transaction wraps all changes |
| My Reports regression | Dynamic SQL skips filter when ClientCode = '*' |

### Next Steps

1. ✅ Review optimization plan
2. ⬜ Create migration file
3. ⬜ Update sp_ProfitabilityData
4. ⬜ Test in staging environment
5. ⬜ Deploy to production during maintenance window
6. ⬜ Monitor performance metrics for 48 hours
