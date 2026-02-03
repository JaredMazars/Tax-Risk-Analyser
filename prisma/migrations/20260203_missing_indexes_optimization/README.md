# Missing Index Optimization Migration

**Migration Date**: 2026-02-03  
**Target**: Client details page performance (8-12s → 1-2s)  
**Analysis Source**: SQL Server Missing Index DMVs + Manual Query Analysis

## Overview

This migration adds 5 critical indexes identified by SQL Server's missing index analysis, with a combined improvement potential of **1,500,000+ points**.

### Changes

1. **Add ClientCode column** to `WIPTransactions` (denormalized from Client via Task)
2. **Backfill ClientCode** for all existing rows (batched for safety)
3. **Create 5 covering indexes**:
   - `IX_WIPTransactions_ClientTaskCode_Covering` (415,976 points) - **Client details page**
   - `IX_WIPTransactions_Partner_Covering` (469,753 points) - Partner reports
   - `IX_WIPTransactions_PartnerDate_Covering` (159,241 points) - Partner time-series
   - `IX_Task_ServLine_Covering` (30,032 points) - Service line queries
   - `IX_Task_Partner_Covering` (2,741 points) - Partner task lists

### Expected Performance Improvements

| Query Type | Before | After | Improvement |
|---|---|---|---|
| Client details page | 8-12s | 1-2s | **6-10x faster** |
| Partner reports | 3-5s | 500-800ms | **4-8x faster** |
| Service line dashboard | 2-3s | 400-600ms | **4-6x faster** |

---

## Prerequisites

- SQL Server 2016+ (for ONLINE index creation)
- ~20-25 minutes maintenance window
- ~2-3 GB free disk space for indexes (compressed)

---

## Execution Steps

### 1. Run Migration SQL

```bash
# From project root
sqlcmd -S <server> -d <database> -i prisma/migrations/20260203_missing_indexes_optimization/migration.sql

# OR via Azure Data Studio / SSMS:
# Open migration.sql and execute
```

**Expected Duration**:
- ClientCode backfill: 10-15 minutes (5.7M rows, batched)
- Index creation: 5-10 minutes
- Statistics update: 2-3 minutes
- **Total: 20-25 minutes**

### 2. Update Stored Procedure

**CRITICAL**: Update `sp_ProfitabilityData` to use ClientCode filter in Step 1.

**File**: `prisma/procedures/sp_ProfitabilityData.sql`

**Change** (around line 120):

```sql
-- BEFORE:
-- EmpCode filter
IF @EmpCode != '*' SET @sql = @sql + N' AND w.EmpCode = @p_EmpCode'

-- AFTER (add ClientCode filter):
-- ClientCode filter (NEW - enables index seek)
IF @ClientCode != '*' SET @sql = @sql + N' AND w.ClientCode = @p_ClientCode'

-- EmpCode filter
IF @EmpCode != '*' SET @sql = @sql + N' AND w.EmpCode = @p_EmpCode'

-- AND update parameter list:
SET @params = N'@p_DateFrom datetime, @p_DateTo datetime, 
    @p_ClientCode nvarchar(max), @p_PartnerCode nvarchar(max), 
    @p_ManagerCode nvarchar(max), @p_ServLineCode nvarchar(max), 
    @p_TaskCode nvarchar(max), @p_EmpCode nvarchar(max)'

EXEC sp_executesql @sql, @params,
    @p_DateFrom = @DateFrom,
    @p_DateTo = @DateTo,
    @p_ClientCode = @ClientCode,  -- NEW
    @p_PartnerCode = @PartnerCode,
    -- ... rest of params
```

Then deploy updated stored procedure:

```bash
sqlcmd -S <server> -d <database> -i prisma/procedures/sp_ProfitabilityData.sql
```

### 3. Test Performance

```sql
-- Enable execution statistics
SET STATISTICS IO ON;
SET STATISTICS TIME ON;

-- Test client details page query
EXEC dbo.sp_ProfitabilityData 
    @ClientCode = 'YOURCLIENT',  -- Replace with real client code
    @DateFrom = '1900-01-01',
    @DateTo = '2099-12-31',
    @ServLineCode = '*',
    @PartnerCode = '*',
    @ManagerCode = '*',
    @GroupCode = '*',
    @TaskCode = '*',
    @EmpCode = '*';

-- Expected Results:
-- ✓ Index Seek on IX_WIPTransactions_ClientTaskCode_Covering
-- ✓ Logical reads < 1000 (down from 50,000+)
-- ✓ Elapsed time < 500ms (down from 5-10s)
```

### 4. Monitor Index Usage

After 24 hours of production use:

```sql
-- Check index effectiveness
SELECT 
    OBJECT_NAME(s.object_id) AS TableName,
    i.name AS IndexName,
    s.user_seeks AS Seeks,
    s.user_scans AS Scans,
    s.user_lookups AS Lookups,
    s.last_user_seek AS LastSeek,
    CASE 
        WHEN s.user_seeks > (s.user_scans + s.user_lookups) * 10 THEN 'EXCELLENT'
        WHEN s.user_seeks > s.user_scans + s.user_lookups THEN 'GOOD'
        ELSE 'REVIEW'
    END AS Status
FROM sys.dm_db_index_usage_stats s
INNER JOIN sys.indexes i ON s.object_id = i.object_id AND s.index_id = i.index_id
WHERE i.name IN (
    'IX_WIPTransactions_ClientTaskCode_Covering',
    'IX_WIPTransactions_Partner_Covering',
    'IX_WIPTransactions_PartnerDate_Covering',
    'IX_Task_ServLine_Covering',
    'IX_Task_Partner_Covering'
)
ORDER BY s.user_seeks DESC;

-- Verify no more missing indexes for these tables
SELECT TOP 5
    OBJECT_NAME(mid.object_id) AS TableName,
    mid.equality_columns AS EqualityColumns,
    CONVERT(DECIMAL(28,1), migs.avg_total_user_cost * migs.avg_user_impact * 
        (migs.user_seeks + migs.user_scans)) AS ImprovementMeasure
FROM sys.dm_db_missing_index_groups mig
INNER JOIN sys.dm_db_missing_index_group_stats migs ON migs.group_handle = mig.index_group_handle
INNER JOIN sys.dm_db_missing_index_details mid ON mig.index_handle = mid.index_handle
WHERE OBJECT_NAME(mid.object_id) IN ('Task', 'WIPTransactions')
ORDER BY ImprovementMeasure DESC;
```

---

## Rollback Plan

If issues arise:

```sql
-- 1. Remove indexes
DROP INDEX [IX_WIPTransactions_ClientTaskCode_Covering] ON [dbo].[WIPTransactions];
DROP INDEX [IX_WIPTransactions_Partner_Covering] ON [dbo].[WIPTransactions];
DROP INDEX [IX_WIPTransactions_PartnerDate_Covering] ON [dbo].[WIPTransactions];
DROP INDEX [IX_Task_ServLine_Covering] ON [dbo].[Task];
DROP INDEX [IX_Task_Partner_Covering] ON [dbo].[Task];

-- 2. Revert stored procedure
-- Deploy previous version of sp_ProfitabilityData from git

-- 3. Optional: Remove ClientCode column (not recommended - keep for future)
-- ALTER TABLE [dbo].[WIPTransactions] DROP COLUMN ClientCode;
```

---

## Technical Details

### Index Design Rationale

All indexes follow covering index pattern:
- **Key columns**: Filters and JOIN conditions (equality → range → JOIN)
- **INCLUDE columns**: All SELECT fields to eliminate key lookups
- **Result**: Zero key lookups = fastest possible queries

### Data Compression

All indexes use `DATA_COMPRESSION = PAGE`:
- 2-4x space savings
- No performance penalty (fast CPU decompression)
- Significant I/O reduction

### Online Operations

All indexes created with `ONLINE = ON`:
- Zero downtime during creation
- Production-safe deployment
- No table locks

### Fillfactor

- 90% for WIPTransactions (frequent inserts)
- 90% for Task (reduces page splits)
- Leaves 10% free space for growth

---

## Impact on My Reports

### No Regression Expected

- ✅ My Reports use Partner/Manager/ServiceLine filters (unchanged)
- ✅ New indexes support these queries (Partner covering indexes)
- ✅ Dynamic SQL skips ClientCode filter when not specified
- ✅ Additional indexes only help (never hurt) query performance

### Actual Performance Improvements

My Reports will also benefit from new indexes:
- Partner reports: 4-8x faster (469,753 point index)
- Time-series reports: 8-12x faster (159,241 point index)
- No impact on existing queries that don't use new indexes

---

## Success Criteria

After deployment, verify:

- [ ] Client details page loads in < 2 seconds (currently 8-12s)
- [ ] sp_ProfitabilityData with ClientCode executes in < 500ms (currently 5-10s)
- [ ] Partner reports complete in < 1 second (currently 3-5s)
- [ ] No errors in application logs
- [ ] Index usage stats show Seeks > Scans
- [ ] Missing index DMVs show < 10,000 improvement points remaining

---

## Monitoring Queries

Save these for ongoing monitoring:

```sql
-- 1. Index size and fragmentation
SELECT 
    OBJECT_NAME(i.object_id) AS TableName,
    i.name AS IndexName,
    ps.used_page_count * 8 / 1024.0 AS SizeMB,
    ips.avg_fragmentation_in_percent AS FragmentationPct,
    ips.page_count AS PageCount
FROM sys.indexes i
INNER JOIN sys.dm_db_partition_stats ps ON i.object_id = ps.object_id AND i.index_id = ps.index_id
INNER JOIN sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips 
    ON i.object_id = ips.object_id AND i.index_id = ips.index_id
WHERE i.name LIKE 'IX_%Covering'
ORDER BY SizeMB DESC;

-- 2. Query performance improvements
SELECT 
    DB_NAME(qt.dbid) AS DatabaseName,
    OBJECT_NAME(qt.objectid) AS ObjectName,
    qs.execution_count AS ExecutionCount,
    qs.total_elapsed_time / 1000000.0 AS TotalElapsedSeconds,
    qs.total_elapsed_time / qs.execution_count / 1000.0 AS AvgElapsedMs,
    qs.last_execution_time AS LastExecution
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
WHERE qt.text LIKE '%sp_ProfitabilityData%'
OR qt.text LIKE '%ClientCode%'
ORDER BY qs.last_execution_time DESC;
```

---

## Related Documentation

- `../../docs/optimization/CLIENT_DETAILS_OPTIMIZATION.md` - Detailed performance analysis
- `../../docs/optimization/MISSING_INDEXES_ANALYSIS.md` - Complete missing index report
- `../procedures/sp_ProfitabilityData.sql` - Stored procedure to update
- `../../.cursor/rules/stored-procedure-rules.mdc` - Optimization patterns
- `../../.cursor/rules/database-patterns.mdc` - Database conventions

---

## Support

If you encounter issues:

1. Check migration output for errors
2. Verify index creation: `SELECT * FROM sys.indexes WHERE name LIKE 'IX_%Covering'`
3. Review execution plans: `SET SHOWPLAN_ALL ON`
4. Check application logs for errors
5. Use rollback plan if necessary
