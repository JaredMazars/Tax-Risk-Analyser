# Testing Guide: Granular Index Migration

**Migration:** 20260130_granular_indexes_wip_drs  
**Target:** Development database first, then production  
**Duration:** ~5-8 minutes per environment

## Pre-Migration Checklist

Before running the migration on development database:

- [ ] Backup database (or ensure automated backups are enabled)
- [ ] Verify current index state
- [ ] Baseline My Reports response times
- [ ] Check available disk space (ensure 700+ MB available)
- [ ] Verify no active deployments or heavy queries running

## Step 1: Verify Current State

### Check Current Indexes

Connect to Azure SQL Database via:
- Azure Portal → SQL Database → Query Editor, OR
- SQL Server Management Studio (SSMS)

Run this query:

```sql
-- Check current WIPTransactions indexes
SELECT 
    i.name AS IndexName,
    ps.used_page_count * 8 / 1024.0 AS SizeMB
FROM sys.indexes i
LEFT JOIN sys.dm_db_partition_stats ps ON i.object_id = ps.object_id AND i.index_id = ps.index_id
WHERE i.object_id = OBJECT_ID('dbo.WIPTransactions')
    AND i.type_desc = 'NONCLUSTERED'
ORDER BY i.name;
```

**Expected Output:**
- `idx_WIPTransactions_Task_Covering` (~395 MB)
- `idx_WIPTransactions_Date_EmpCode_Client_Covering` (~795 MB)

### Baseline Performance

1. **My Reports - Profitability:**
   - Navigate to `/api/my-reports/profitability` in browser dev tools
   - Note response time (e.g., 2.5 seconds)
   - Record as baseline

2. **My Reports - Recoverability:**
   - Navigate to `/api/my-reports/recoverability`
   - Note response time (e.g., 1.8 seconds)
   - Record as baseline

## Step 2: Run Migration

### Option A: Azure Portal Query Editor

1. Navigate to Azure Portal → SQL Database → Query editor
2. Login with SQL authentication
3. Open `migration.sql` file
4. Copy entire contents
5. Paste into query editor
6. Click "Run"
7. Monitor output for success messages
8. Expected duration: 5-8 minutes

### Option B: SQL Server Management Studio (SSMS)

1. Connect to Azure SQL Database
2. Open `migration.sql` file
3. Execute (F5)
4. Monitor Messages tab for progress
5. Expected duration: 5-8 minutes

### What to Watch For

**Progress Messages:**
```
PART 1: WIPTransactions (5.7M rows)
  Dropping: idx_WIPTransactions_Task_Covering
  ✓ Dropped
  ...
  [1/6] Creating idx_wip_task...
  ✓ Created (~50-60 MB)
  ...
PART 2: DrsTransactions
  ...
Migration Complete!
```

**Warning Signs:**
- Timeout errors (migration taking > 15 minutes)
- "Cannot create index" errors
- "Insufficient disk space" errors

If errors occur, see Troubleshooting section below.

## Step 3: Verify Index Creation

Run `verify_indexes.sql`:

```bash
# In Azure Portal Query Editor or SSMS
# Open and execute: verify_indexes.sql
```

### Expected Results

**Part 1: Index Creation**
Should show 9 new indexes:

**WIPTransactions:**
1. `idx_wip_task` (~50-60 MB)
2. `idx_wip_client` (~70-80 MB)
3. `idx_wip_partner_date` (~100-120 MB)
4. `idx_wip_manager_date` (~100-120 MB)
5. `idx_wip_date` (~80-100 MB)
6. `idx_wip_emp_date` (~60-80 MB)

**DrsTransactions:**
1. `idx_drs_biller_date` (~100-120 MB)
2. `idx_drs_client_date` (~120-150 MB)
3. `idx_drs_client_group` (~80-100 MB)

**Part 2: Query Plans**
- Review execution plans in output
- Look for "Index Seek" operations (good)
- Avoid "Index Scan" or "Table Scan" (bad)

## Step 4: Test Application

### Manual Testing

1. **My Reports - Profitability:**
   - Login to application
   - Navigate to My Reports → Profitability
   - Select current fiscal year
   - Verify report loads successfully
   - Note new response time
   - **Expected:** 20-30% faster than baseline

2. **My Reports - Recoverability:**
   - Navigate to My Reports → Recoverability
   - Verify report loads successfully
   - Note new response time
   - **Expected:** Similar to baseline

3. **Task WIP Queries:**
   - Navigate to any task detail page
   - Click on "WIP" tab
   - Verify data loads
   - **Expected:** 10-15% faster

4. **Client Queries:**
   - Navigate to any client detail page
   - Click on "Balances" or "Debtors" tabs
   - Verify data loads
   - **Expected:** Similar or slightly faster

### Automated Testing (If Available)

Run your test suite focusing on:
- API route tests for My Reports
- Task query tests
- Client query tests

## Step 5: Monitor Performance

### Immediate Checks (First Hour)

**Azure SQL Query Performance Insights:**
1. Navigate to: Database → Intelligent Performance → Query Performance Insight
2. Filter by: Last 1 hour
3. Look for:
   - Queries using new indexes (`idx_wip_*`, `idx_drs_*`)
   - Reduced logical reads compared to baseline
   - No timeout errors

**Application Logs:**
1. Check application logs for errors
2. Look for: Query timeout errors, database connection errors
3. Verify no increase in error rate

### Check Index Usage

Run this query:

```sql
-- Check if new indexes are being used
SELECT 
    OBJECT_NAME(s.object_id) AS TableName,
    i.name AS IndexName,
    s.user_seeks AS Seeks,
    s.user_scans AS Scans,
    s.user_lookups AS Lookups,
    s.last_user_seek AS LastSeek
FROM sys.dm_db_index_usage_stats s
INNER JOIN sys.indexes i ON s.object_id = i.object_id AND s.index_id = i.index_id
WHERE s.database_id = DB_ID()
    AND OBJECT_NAME(s.object_id) IN ('WIPTransactions', 'DrsTransactions')
    AND i.name LIKE 'idx_%'
ORDER BY OBJECT_NAME(s.object_id), i.name;
```

**What to Look For:**
- `user_seeks > 0` for all indexes (indicates usage)
- `idx_wip_partner_date` OR `idx_wip_manager_date` should have seeks (profitability report)
- `idx_drs_biller_date` should have seeks (recoverability report)

### Performance Comparison

Create a comparison table:

| Query | Before (seconds) | After (seconds) | Change |
|---|---|---|---|
| Profitability (Partner) | 2.5 | ? | ? |
| Profitability (Manager) | 2.3 | ? | ? |
| Recoverability | 1.8 | ? | ? |
| Task WIP | 0.5 | ? | ? |
| Client Debtors | 0.8 | ? | ? |

**Success Criteria:**
- ✅ Profitability: 15-30% faster
- ✅ Recoverability: Similar performance (±10%)
- ✅ Task queries: 10-20% faster
- ✅ No errors in application logs

## Step 6: Extended Monitoring (First Week)

### Daily Checks

**Day 1-3:**
- Check My Reports response times daily
- Monitor Azure SQL DTU/vCore usage
- Review Query Performance Insights for slow queries

**Day 4-7:**
- Review index usage statistics
- Check for index fragmentation (should be 0% for new indexes)
- Monitor disk space usage

### Weekly Report

After 1 week, compile:

1. **Performance Metrics:**
   - Average response times for each query type
   - Comparison with baseline
   - Any anomalies or issues

2. **Index Usage Statistics:**
   - Seeks/scans/lookups for each index
   - Any unused indexes

3. **Resource Usage:**
   - DTU/vCore consumption
   - Disk space used by indexes
   - Any capacity concerns

## Rollback Procedure

### When to Rollback

Rollback if:
- ❌ My Reports queries are slower than baseline (>20% slower)
- ❌ Multiple query timeout errors
- ❌ Index usage stats show no seeks after 24 hours
- ❌ Significant user complaints about slow reports

### How to Rollback

1. Connect to Azure SQL Database (Portal or SSMS)
2. Open `rollback.sql`
3. Execute entire script
4. Expected duration: 4-6 minutes
5. Verify old indexes are restored

**Post-Rollback:**
- Verify My Reports response times return to baseline
- Check application logs for errors
- Report issue with:
  - Execution plans (before/after)
  - Performance comparison data
  - Error messages

## Troubleshooting

### Issue: Migration Timeout

**Symptoms:** Script runs for > 15 minutes, no progress

**Solutions:**
1. Cancel execution (if still running)
2. Check Azure SQL DTU/vCore usage
3. Wait for lower activity period
4. Retry migration during off-hours

### Issue: Insufficient Disk Space

**Symptoms:** "Insufficient disk space" error

**Solutions:**
1. Check current disk usage
2. Drop temporary indexes if any exist
3. Consider scaling up storage temporarily
4. Contact Azure support if at maximum

### Issue: Index Not Created

**Symptoms:** "Cannot create index" error

**Solutions:**
1. Check if index already exists:
   ```sql
   SELECT name FROM sys.indexes WHERE object_id = OBJECT_ID('WIPTransactions');
   ```
2. If exists, manually drop and retry
3. Check for duplicate index names

### Issue: Queries Still Slow

**Symptoms:** No performance improvement after migration

**Solutions:**
1. Run `verify_indexes.sql` and check execution plans
2. Verify correct index is being used (should show "Index Seek")
3. Update statistics:
   ```sql
   UPDATE STATISTICS [WIPTransactions] WITH FULLSCAN;
   UPDATE STATISTICS [DrsTransactions] WITH FULLSCAN;
   ```
4. Clear query plan cache (forces recompilation):
   ```sql
   DBCC FREEPROCCACHE;
   ```

### Issue: Index Not Being Used

**Symptoms:** Execution plan shows "Table Scan" or "Index Scan" instead of "Index Seek"

**Solutions:**
1. Check query WHERE clause matches index keys
2. Verify no functions on indexed columns (e.g., ISNULL())
3. Check if query uses ISNULL() or COALESCE() on indexed columns
4. Consider adding missing columns to INCLUDE list

## Production Deployment

### Prerequisites

- ✅ Development migration completed successfully
- ✅ Performance verified (15-30% improvement)
- ✅ No errors in development for 1 week
- ✅ All stakeholders notified
- ✅ Maintenance window scheduled

### Production Steps

1. **Notify Users:**
   - Send notice: "Database maintenance in 15 minutes"
   - Expected downtime: None (ONLINE = ON), but queries may be slower during migration

2. **Run Migration:**
   - Same steps as development
   - Monitor progress closely
   - Expected duration: 5-8 minutes

3. **Immediate Verification:**
   - Run `verify_indexes.sql`
   - Check My Reports functionality
   - Monitor application logs

4. **Post-Deployment:**
   - Send all-clear notification
   - Continue monitoring for 24 hours
   - Schedule follow-up review after 1 week

## Success Metrics

After 1 week in production:

### Performance
- [x] My Reports Profitability: 15-30% faster
- [x] My Reports Recoverability: ±10% of baseline
- [x] Task queries: 10-20% faster
- [x] No increase in query timeouts

### Resource Usage
- [x] WIPTransactions indexes: ~600-700 MB (down from 1,190 MB)
- [x] DrsTransactions indexes: ~300-400 MB
- [x] DTU/vCore usage stable or reduced

### Index Health
- [x] All indexes show `user_seeks > 0`
- [x] Fragmentation < 10%
- [x] No blocking queries related to index maintenance

## Contact

For issues or questions:
- Review execution plans in Azure SQL Query Performance Insights
- Check application error logs
- Consult with database administrator
- Reference: `README.md` in migration folder
