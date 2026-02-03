# Client Details Optimization - Deployment Checklist

**Date**: 2026-02-03  
**Duration**: ~30 minutes  
**Risk Level**: LOW

---

## Pre-Deployment Checklist

- [ ] Schedule maintenance window (20-25 minutes)
- [ ] Notify users of brief maintenance
- [ ] Backup database (if not already automated)
- [ ] Review migration script: `prisma/migrations/20260203_missing_indexes_optimization/migration.sql`
- [ ] Review updated SP: `prisma/procedures/sp_ProfitabilityData.sql`
- [ ] Identify test client code for verification (e.g., 'CLIENT001')

---

## Deployment Steps

### Step 1: Execute Database Migration (20-25 min)

**Command:**
```bash
sqlcmd -S <server> -d <database> -U <username> -P <password> \
  -i prisma/migrations/20260203_missing_indexes_optimization/migration.sql
```

**Or via Azure Data Studio / SSMS:**
1. Open `prisma/migrations/20260203_missing_indexes_optimization/migration.sql`
2. Connect to production database
3. Click Execute (F5)

**Expected Output:**
```
=============================================================================
Starting Missing Index Optimization Migration
Timestamp: 2026-02-03 10:00:00
=============================================================================

STEP 1: Adding ClientCode column to WIPTransactions...
ClientCode column added

STEP 2: Backfilling ClientCode...
Total rows to backfill: 5700000
  Backfilled 50000 rows at 2026-02-03 10:01:00
  Backfilled 50000 rows at 2026-02-03 10:02:00
  ... (continues for ~15 minutes)
Backfill completed in 900 seconds

STEP 3: Verifying backfill...
Backfill verification passed (0 NULL rows)

STEP 4: Setting ClientCode to NOT NULL...
ClientCode set to NOT NULL

STEP 5: Creating missing indexes...
  Creating IX_WIPTransactions_ClientTaskCode_Covering...
  ✓ IX_WIPTransactions_ClientTaskCode_Covering created successfully
  ... (5 indexes total)

STEP 6: Updating statistics...
  ✓ WIPTransactions statistics updated
  ✓ Task statistics updated

STEP 7: Verifying index creation...
=== Verification Results ===
WIPTransactions indexes created: 3 / 3
Task indexes created: 2 / 2
✓ All indexes created successfully!

=============================================================================
Migration completed successfully!
```

**If Migration Fails:**
- Transaction will auto-rollback
- Check output for specific error
- Review `migration.sql` for issues
- Contact DBA if needed

### Step 2: Deploy Updated Stored Procedure (2 min)

**Command:**
```bash
sqlcmd -S <server> -d <database> -U <username> -P <password> \
  -i prisma/procedures/sp_ProfitabilityData.sql
```

**Or via Azure Data Studio / SSMS:**
1. Open `prisma/procedures/sp_ProfitabilityData.sql`
2. Connect to production database
3. Click Execute (F5)

**Expected Output:**
```
Command(s) completed successfully.
```

### Step 3: Verify Index Creation (1 min)

**Query:**
```sql
-- Check indexes were created
SELECT 
    name AS IndexName,
    type_desc AS IndexType,
    is_disabled AS IsDisabled
FROM sys.indexes
WHERE object_id = OBJECT_ID('WIPTransactions')
AND name IN (
    'IX_WIPTransactions_ClientTaskCode_Covering',
    'IX_WIPTransactions_Partner_Covering',
    'IX_WIPTransactions_PartnerDate_Covering'
);

-- Expected: 3 rows, all NONCLUSTERED, IsDisabled = 0
```

### Step 4: Test Client Details Query (2 min)

**Query:**
```sql
SET STATISTICS IO ON;
SET STATISTICS TIME ON;

-- Replace 'YOURCLIENT' with actual client code
EXEC dbo.sp_ProfitabilityData 
    @ClientCode = 'YOURCLIENT',
    @DateFrom = '1900-01-01',
    @DateTo = '2099-12-31',
    @ServLineCode = '*',
    @PartnerCode = '*',
    @ManagerCode = '*',
    @GroupCode = '*',
    @TaskCode = '*',
    @EmpCode = '*';
```

**Expected Results:**
- ✅ Execution plan shows: "Index Seek on IX_WIPTransactions_ClientTaskCode_Covering"
- ✅ Logical reads < 1,000 (was 50,000+)
- ✅ CPU time < 500ms (was 5,000-10,000ms)
- ✅ Elapsed time < 500ms (was 5-10 seconds)

**Check Execution Plan:**
```sql
-- View execution plan
SET SHOWPLAN_TEXT ON;
GO

EXEC dbo.sp_ProfitabilityData @ClientCode = 'YOURCLIENT', @DateFrom = '1900-01-01', @DateTo = '2099-12-31', @ServLineCode = '*', @PartnerCode = '*', @ManagerCode = '*', @GroupCode = '*', @TaskCode = '*', @EmpCode = '*';
GO

SET SHOWPLAN_TEXT OFF;
GO

-- Look for: "Index Seek (NONCLUSTERED)[IX_WIPTransactions_ClientTaskCode_Covering]"
```

### Step 5: Test My Reports Query (2 min)

**Query:**
```sql
SET STATISTICS IO ON;
SET STATISTICS TIME ON;

-- Replace 'YOURPARTNER' with actual partner code
EXEC dbo.sp_ProfitabilityData 
    @PartnerCode = 'YOURPARTNER',
    @DateFrom = '2024-09-01',
    @DateTo = '2025-08-31',
    @ClientCode = '*',
    @ServLineCode = '*',
    @ManagerCode = '*',
    @GroupCode = '*',
    @TaskCode = '*',
    @EmpCode = '*';
```

**Expected Results:**
- ✅ Execution plan shows: "Index Seek on IX_WIPTransactions_Partner_Covering"
- ✅ Logical reads < 5,000 (improved from before)
- ✅ Elapsed time < 1,000ms (improved from 3-5 seconds)
- ✅ Results match previous version (no data changes)

### Step 6: Test Application (3 min)

1. **Client Details Page:**
   - Navigate to a client details page
   - **Expected**: Page loads in < 2 seconds (was 8-12s)
   - **Verify**: WIP balances display correctly
   - **Verify**: Header totals match previous values

2. **My Reports - Profitability:**
   - Navigate to My Reports → Profitability
   - **Expected**: Report loads in < 1 second (was 3-5s)
   - **Verify**: Task list displays correctly
   - **Verify**: WIP metrics match previous values

3. **Check Application Logs:**
   ```bash
   # Check for errors in last 5 minutes
   tail -f /path/to/application.log | grep -i error
   ```

---

## Post-Deployment Monitoring

### Immediate (First Hour)

**Monitor Application Performance:**
```sql
-- Check query execution times
SELECT TOP 10
    qs.execution_count AS Executions,
    qs.total_elapsed_time / qs.execution_count / 1000.0 AS AvgMs,
    qs.last_execution_time AS LastRun,
    SUBSTRING(qt.text, 1, 100) AS QueryPreview
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
WHERE qt.text LIKE '%sp_ProfitabilityData%'
AND qs.last_execution_time > DATEADD(HOUR, -1, GETDATE())
ORDER BY qs.last_execution_time DESC;

-- Expected: AvgMs < 500 for client queries, < 1000 for partner queries
```

**Monitor Index Usage:**
```sql
-- Check if indexes are being used
SELECT 
    i.name AS IndexName,
    s.user_seeks AS Seeks,
    s.user_scans AS Scans,
    s.user_lookups AS Lookups,
    s.last_user_seek AS LastSeek
FROM sys.dm_db_index_usage_stats s
INNER JOIN sys.indexes i ON s.object_id = i.object_id AND s.index_id = i.index_id
WHERE i.name LIKE 'IX_WIPTransactions_%Covering'
AND s.last_user_seek > DATEADD(HOUR, -1, GETDATE())
ORDER BY s.user_seeks DESC;

-- Expected: Seeks > 0, Scans = 0 or very low
```

### After 24 Hours

**Index Effectiveness:**
```sql
-- Comprehensive index usage report
SELECT 
    OBJECT_NAME(s.object_id) AS TableName,
    i.name AS IndexName,
    s.user_seeks AS Seeks,
    s.user_scans AS Scans,
    s.user_lookups AS Lookups,
    s.user_updates AS Updates,
    s.last_user_seek AS LastSeek,
    CASE 
        WHEN s.user_seeks + s.user_scans + s.user_lookups = 0 THEN 'UNUSED'
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

-- Expected Status: EXCELLENT or GOOD
```

**Performance Trends:**
```sql
-- Average query performance over 24 hours
SELECT 
    CAST(qs.last_execution_time AS DATE) AS ExecutionDate,
    COUNT(*) AS TotalExecutions,
    AVG(qs.total_elapsed_time / 1000.0) AS AvgElapsedMs,
    MIN(qs.total_elapsed_time / 1000.0) AS MinElapsedMs,
    MAX(qs.total_elapsed_time / 1000.0) AS MaxElapsedMs
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
WHERE qt.text LIKE '%sp_ProfitabilityData%'
AND qs.last_execution_time > DATEADD(HOUR, -24, GETDATE())
GROUP BY CAST(qs.last_execution_time AS DATE)
ORDER BY ExecutionDate DESC;
```

**Check for Remaining Missing Indexes:**
```sql
-- Verify no more high-impact missing indexes
SELECT TOP 5
    OBJECT_NAME(mid.object_id) AS TableName,
    mid.equality_columns AS EqualityColumns,
    mid.inequality_columns AS InequalityColumns,
    migs.avg_total_user_cost AS AvgCost,
    migs.user_seeks AS Seeks,
    CONVERT(DECIMAL(28,1), migs.avg_total_user_cost * migs.avg_user_impact * 
        (migs.user_seeks + migs.user_scans)) AS ImprovementMeasure
FROM sys.dm_db_missing_index_groups mig
INNER JOIN sys.dm_db_missing_index_group_stats migs ON migs.group_handle = mig.index_group_handle
INNER JOIN sys.dm_db_missing_index_details mid ON mig.index_handle = mid.index_handle
WHERE OBJECT_NAME(mid.object_id) IN ('Task', 'WIPTransactions')
ORDER BY ImprovementMeasure DESC;

-- Expected: ImprovementMeasure < 10,000 (down from 1,500,000+)
```

---

## Success Criteria

Mark each as complete:

### Database
- [ ] Migration completed without errors
- [ ] 5 indexes created successfully
- [ ] ClientCode column added and backfilled
- [ ] Statistics updated

### Performance
- [ ] Client details page loads in < 2 seconds
- [ ] My Reports loads in < 1 second
- [ ] sp_ProfitabilityData executes in < 500ms for client queries
- [ ] Index usage shows Seeks > Scans

### Data Integrity
- [ ] WIP balances match previous values (regression test)
- [ ] No data inconsistencies reported
- [ ] Application logs show no errors

### User Feedback
- [ ] Users report faster page loads
- [ ] No user complaints about data accuracy
- [ ] No increase in support tickets

---

## Rollback Procedure

**If issues arise within 24 hours:**

### Option 1: Remove Indexes Only (Recommended)

Keep ClientCode column, remove indexes:
```sql
DROP INDEX [IX_WIPTransactions_ClientTaskCode_Covering] ON [dbo].[WIPTransactions];
DROP INDEX [IX_WIPTransactions_Partner_Covering] ON [dbo].[WIPTransactions];
DROP INDEX [IX_WIPTransactions_PartnerDate_Covering] ON [dbo].[WIPTransactions];
DROP INDEX [IX_Task_ServLine_Covering] ON [dbo].[Task];
DROP INDEX [IX_Task_Partner_Covering] ON [dbo].[Task];
```

### Option 2: Revert Stored Procedure

```bash
# Get previous version from git
git checkout HEAD~1 prisma/procedures/sp_ProfitabilityData.sql

# Deploy
sqlcmd -S <server> -d <database> -i prisma/procedures/sp_ProfitabilityData.sql
```

### Option 3: Full Rollback (Nuclear Option)

Only if critical issues:
```sql
-- Remove indexes
DROP INDEX [IX_WIPTransactions_ClientTaskCode_Covering] ON [dbo].[WIPTransactions];
DROP INDEX [IX_WIPTransactions_Partner_Covering] ON [dbo].[WIPTransactions];
DROP INDEX [IX_WIPTransactions_PartnerDate_Covering] ON [dbo].[WIPTransactions];
DROP INDEX [IX_Task_ServLine_Covering] ON [dbo].[Task];
DROP INDEX [IX_Task_Partner_Covering] ON [dbo].[Task];

-- Remove ClientCode column (WARNING: Destructive)
ALTER TABLE [dbo].[WIPTransactions] DROP COLUMN ClientCode;
```

---

## Communication Template

### Pre-Deployment Announcement

**Subject:** Scheduled Maintenance - Database Performance Optimization

**Body:**
```
Dear Users,

We will be performing database optimization maintenance on [DATE] at [TIME].

Duration: Approximately 25 minutes
Impact: Application will remain available, but may experience brief slowdowns

After this maintenance, you should notice significantly faster load times for:
- Client details pages (8-12s → 1-2s)
- My Reports - Profitability (3-5s → < 1s)

Thank you for your patience.
```

### Post-Deployment Announcement

**Subject:** Maintenance Complete - Performance Improvements Live

**Body:**
```
Dear Users,

Database optimization maintenance has been completed successfully.

You should now experience:
✅ Client details pages loading 6-10x faster
✅ My Reports - Profitability loading 4-8x faster
✅ Overall improved application responsiveness

Please report any issues or unexpected behavior to [SUPPORT EMAIL].

Thank you!
```

---

## Contact Information

**Deployment Team:**
- Lead: [NAME] - [EMAIL]
- DBA: [NAME] - [EMAIL]
- Support: [EMAIL]

**Escalation:**
- If deployment fails: Contact DBA immediately
- If performance degrades: Execute rollback procedure
- If data issues: Contact development team

---

## Related Documentation

- [QUICK_START.md](./QUICK_START.md) - Quick deployment guide
- [OPTIMIZATION_SUMMARY.md](./OPTIMIZATION_SUMMARY.md) - Executive summary
- [CLIENT_DETAILS_OPTIMIZATION.md](./CLIENT_DETAILS_OPTIMIZATION.md) - Technical details
- [Migration README](../../prisma/migrations/20260203_missing_indexes_optimization/README.md) - Migration details
