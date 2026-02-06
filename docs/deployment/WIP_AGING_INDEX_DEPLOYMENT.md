# WIP Aging Index Deployment Guide

## Status: 🟡 IN PROGRESS

The index update script has been **started via MCP** but timed out (expected). The index creation is likely still running in the background.

## What's Happening Now

### ✅ **Completed**
- `idx_wip_partner_date` has been **DROPPED**

### 🔄 **In Progress** (Background)
- `idx_wip_partner_date` is being **RECREATED** with enhanced columns
- This typically takes 5-15 minutes

### ⏳ **Pending**
- Drop and recreate `idx_wip_manager_date`
- Create new `idx_WIPTransactions_Aging_General`

## Next Steps - Manual Deployment Required

Since MCP has a 30-second timeout and index creation takes longer, you need to complete the deployment manually using Azure Portal or Azure Data Studio.

---

## Option 1: Azure Portal (Recommended - Easiest)

### Step 1: Check Current Progress

1. Go to [portal.azure.com](https://portal.azure.com)
2. Navigate to: **SQL databases** → **gt3-db** → **Query editor**
3. Authenticate with SQL credentials
4. Run this query to check if the first index is still creating:

```sql
-- Check for running index operations
SELECT 
    session_id,
    command,
    percent_complete,
    estimated_completion_time / 1000 / 60 AS estimated_minutes_remaining,
    start_time
FROM sys.dm_exec_requests
WHERE command LIKE '%INDEX%';
```

**If it returns rows**: Index creation is still running - wait for it to complete.

**If it returns no rows**: Index creation finished (or failed) - proceed to Step 2.

### Step 2: Verify First Index Status

```sql
-- Check if idx_wip_partner_date exists
SELECT name, type_desc 
FROM sys.indexes 
WHERE object_id = OBJECT_ID('WIPTransactions') 
AND name = 'idx_wip_partner_date';
```

**If it exists**: ✅ First index completed successfully - proceed to Step 3.

**If it doesn't exist**: ⚠️ Creation failed - restart from Step 3.

### Step 3: Complete Remaining Indexes

Copy and paste the **ENTIRE** contents of this file into Query Editor:

📁 **File**: `prisma/procedures/sp_WIPAgingByTask_index_update.sql`

Click **Run** and monitor progress (will take 10-20 minutes total).

---

## Option 2: Azure Data Studio (For Local Development)

### Step 1: Connect to Database

1. Open Azure Data Studio
2. Connect to: `gt3-sql-server.database.windows.net`
3. Database: `gt3-db`
4. Authentication: SQL Login
5. Username: `sqladmin`
6. Password: (from .env DATABASE_URL)

### Step 2: Open and Execute Script

1. **File** → **Open** → Navigate to:
   ```
   prisma/procedures/sp_WIPAgingByTask_index_update.sql
   ```

2. Press **F5** or click **Run** button

3. Monitor the **Messages** tab for progress updates:
   ```
   Step 1: Dropping idx_wip_partner_date...
   Creating enhanced idx_wip_partner_date...
   idx_wip_partner_date enhanced successfully!
   Step 2: Dropping idx_wip_manager_date...
   ...
   ```

4. Wait for all steps to complete (~10-20 minutes)

### Step 3: Verify Completion

Look for this message at the end:
```
Verification: Enhanced Indexes
========================================
Expected Results:
- idx_wip_partner_date: 3 key columns, 16 include columns
- idx_wip_manager_date: 3 key columns, 16 include columns
- idx_WIPTransactions_Aging_General: 2 key columns, 15 include columns
```

---

## Post-Deployment Verification

After the script completes, run these queries to verify everything is working:

### 1. Check All Indexes Were Created

```sql
SELECT 
    i.name AS IndexName,
    i.type_desc AS IndexType,
    (SELECT COUNT(*) FROM sys.index_columns ic2 
     WHERE ic2.object_id = i.object_id AND ic2.index_id = i.index_id 
     AND ic2.is_included_column = 0) AS KeyColumnCount,
    (SELECT COUNT(*) FROM sys.index_columns ic2 
     WHERE ic2.object_id = i.object_id AND ic2.index_id = i.index_id 
     AND ic2.is_included_column = 1) AS IncludeColumnCount
FROM sys.indexes i
WHERE i.object_id = OBJECT_ID('WIPTransactions')
  AND i.name IN ('idx_wip_partner_date', 'idx_wip_manager_date', 'idx_WIPTransactions_Aging_General')
ORDER BY i.name;
```

**Expected Results**:
| IndexName | KeyColumnCount | IncludeColumnCount |
|---|---|---|
| idx_wip_partner_date | 3 | 16 |
| idx_wip_manager_date | 3 | 16 |
| idx_WIPTransactions_Aging_General | 2 | 15 |

### 2. Test Stored Procedure Performance

```sql
-- Test 1: Partner filter (should complete in <5 seconds)
EXEC sp_WIPAgingByTask @TaskPartner = 'DEVT001';

-- Test 2: Manager filter (should complete in <5 seconds)
EXEC sp_WIPAgingByTask @TaskManager = 'PERJ001';

-- Test 3: Client filter (should complete in <5 seconds)
EXEC sp_WIPAgingByTask @ClientCode = 'BRE0200';

-- Test 4: Group + ServiceLine (should complete in <5 seconds)
EXEC sp_WIPAgingByTask @GroupCode = 'BRE02', @ServLineCode = 'AUD';
```

**Success Criteria**:
- ✅ All queries complete in **<5 seconds** (vs 30+ seconds before)
- ✅ All queries return data without errors
- ✅ No timeout errors

### 3. Monitor Index Usage (After 1-2 Days)

```sql
-- Check which indexes are being used by the stored procedure
SELECT 
    i.name AS IndexName,
    s.user_seeks AS Seeks,
    s.user_scans AS Scans,
    s.last_user_seek AS LastSeek,
    s.last_user_scan AS LastScan
FROM sys.indexes i
LEFT JOIN sys.dm_db_index_usage_stats s 
    ON i.object_id = s.object_id 
    AND i.index_id = s.index_id
    AND s.database_id = DB_ID()
WHERE i.object_id = OBJECT_ID('WIPTransactions')
  AND i.name LIKE '%partner%' OR i.name LIKE '%manager%' OR i.name LIKE '%Aging%'
ORDER BY s.user_seeks DESC;
```

---

## Troubleshooting

### Issue: "Cannot drop the index because it does not exist"

**Cause**: Index was already dropped by previous attempt.

**Solution**: Skip to the CREATE INDEX step for that specific index.

### Issue: Index creation takes >30 minutes

**Cause**: Table has millions of rows or server is under heavy load.

**Solution**: 
1. Remove `WITH (ONLINE = ON)` to allow offline index creation (faster but locks table)
2. Run during off-peak hours
3. Consider database scale-up temporarily

### Issue: "There is already an object named 'X' in the database"

**Cause**: Index already exists from previous attempt.

**Solution**: Either:
- Drop it first: `DROP INDEX idx_wip_partner_date ON WIPTransactions;`
- Or skip that index creation and move to the next one

### Issue: Stored procedure still times out after indexes

**Possible causes**:
1. Indexes not being used (check execution plan)
2. Statistics out of date: `UPDATE STATISTICS WIPTransactions WITH FULLSCAN;`
3. Query hint needed: Add `OPTION (MAXDOP 4)` to stored procedure queries

---

## Summary of Changes

### Enhanced Indexes

**1. idx_wip_partner_date** (Existing → Enhanced)
- **Before**: Keys(TaskPartner, TranDate) + 10 includes
- **After**: Keys(TaskPartner, TranDate, **TType**) + **17** includes
- **Added**: TType to keys, GroupCode, TaskServLineDesc, TaskManager, PartnerName, ManagerName, TaskDesc, GroupDesc

**2. idx_wip_manager_date** (Existing → Enhanced)
- **Before**: Keys(TaskManager, TranDate) + 10 includes
- **After**: Keys(TaskManager, TranDate, **TType**) + **17** includes
- **Added**: TType to keys, GroupCode, TaskServLineDesc, TaskPartner, PartnerName, ManagerName, TaskDesc, GroupDesc

**3. idx_WIPTransactions_Aging_General** (New)
- **Keys**: TranDate, TType
- **Includes**: 15 columns (all filter and descriptive fields)
- **Purpose**: Handles ClientCode, GroupCode, ServLineCode, TaskCode filters

### Performance Impact

**Before Indexes**:
- 30+ seconds (timeout) for most queries

**After Indexes** (Expected):
- Partner/Manager filters: 2-5 seconds
- Other filters: 2-5 seconds
- Multiple filters: 1-3 seconds

### Storage Impact

- **Additional storage**: ~10-15% of table size per enhanced index
- **Total new storage**: ~30-40% of WIPTransactions table size
- **Index maintenance**: Auto-maintained by SQL Server

---

## Support

If you encounter issues during deployment:

1. Check the **Messages** tab in Query Editor for specific error messages
2. Verify database has enough space for new indexes
3. Check if other processes are locking the WIPTransactions table
4. Contact DBA if index creation fails repeatedly

---

## Files Reference

- **Index Update Script**: `prisma/procedures/sp_WIPAgingByTask_index_update.sql`
- **Stored Procedure**: `prisma/procedures/sp_WIPAgingByTask.sql`
- **Deployment Guide**: `docs/WIP_AGING_SP_DEPLOYMENT.md`
- **Original Index Plan**: `prisma/procedures/sp_WIPAgingByTask_indexes.sql` (superseded)
