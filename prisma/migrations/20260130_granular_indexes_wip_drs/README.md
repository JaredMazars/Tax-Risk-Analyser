# Granular Index Migration for WIPTransactions and DrsTransactions

**Migration Date:** 2026-01-30  
**Tables Affected:** WIPTransactions (5.7M rows), DrsTransactions  
**Estimated Duration:** 5-8 minutes  
**Status:** Ready for deployment

## Overview

This migration replaces comprehensive covering indexes with granular indexes optimized for specific query patterns, particularly those used in My Reports features.

### Previous State (Comprehensive Covering Indexes)

**WIPTransactions:**
- `idx_WIPTransactions_Task_Covering` (395 MB)
- `idx_WIPTransactions_Date_EmpCode_Client_Covering` (795 MB)
- **Total:** 1,190 MB

**DrsTransactions:**
- `idx_drs_client_covering`
- `idx_drs_biller_covering`

### New State (Granular Indexes)

**WIPTransactions - 6 Indexes:**
1. `idx_wip_task` (~50-60 MB) - Task queries
2. `idx_wip_client` (~70-80 MB) - Client queries
3. `idx_wip_partner_date` (~100-120 MB) - Profitability reports (partners)
4. `idx_wip_manager_date` (~100-120 MB) - Profitability reports (managers)
5. `idx_wip_date` (~80-100 MB) - Fiscal reports
6. `idx_wip_emp_date` (~60-80 MB) - Employee time tracking
- **Total:** ~600-700 MB (40% reduction)

**DrsTransactions - 3 Indexes:**
1. `idx_drs_biller_date` (~100-120 MB) - Recoverability reports
2. `idx_drs_client_date` (~120-150 MB) - Client debtors
3. `idx_drs_client_group` (~80-100 MB) - Group rollups
- **Total:** ~300-400 MB

## Rationale

### Why Granular Indexes?

1. **Query Pattern Alignment**: Each index optimized for specific API routes and query patterns
2. **Performance**: My Reports profitability queries get dedicated partner/manager indexes
3. **Maintainability**: Clear mapping between query patterns and indexes
4. **Flexibility**: Can drop unused indexes without affecting others
5. **Disk Space**: 40% reduction in WIPTransactions index size

### Query Pattern Analysis

#### WIPTransactions

| Index | Query Pattern | API Routes |
|---|---|---|
| `idx_wip_task` | `WHERE GSTaskID = ?` | `/api/tasks/[id]/wip`, `/api/tasks/[id]/transactions` |
| `idx_wip_client` | `WHERE GSClientID = ?` | `/api/clients/[id]/wip`, `/api/clients/[id]/balances` |
| `idx_wip_partner_date` | `WHERE TaskPartner = ? AND TranDate BETWEEN ? AND ?` | `/api/my-reports/profitability` (CARL/DIR/Local) |
| `idx_wip_manager_date` | `WHERE TaskManager = ? AND TranDate BETWEEN ? AND ?` | `/api/my-reports/profitability` (Others) |
| `idx_wip_date` | `WHERE TranDate BETWEEN ? AND ?` | `/api/reports/fiscal-transactions` |
| `idx_wip_emp_date` | `WHERE EmpCode = ? AND TType = 'T'` | `/api/tasks/[id]/analytics/time-accumulation` |

#### DrsTransactions

| Index | Query Pattern | API Routes |
|---|---|---|
| `idx_drs_biller_date` | `WHERE Biller = ? AND TranDate <= ?` | `/api/my-reports/recoverability`, `/api/my-reports/overview` |
| `idx_drs_client_date` | `WHERE GSClientID = ?` | `/api/clients/[id]/debtors`, `/api/clients/[id]/balances` |
| `idx_drs_client_group` | `WHERE GSClientID IN (?) AND GroupCode = ?` | `/api/groups/[groupCode]/debtors` |

## Expected Performance Impact

### My Reports (Primary Target)

**Profitability Report** (`/api/my-reports/profitability`):
- **Current:** Uses generic date-based covering index
- **New:** Uses dedicated `idx_wip_partner_date` or `idx_wip_manager_date`
- **Expected Improvement:** 20-30% faster (dedicated index for partner/manager filtering)

**Recoverability Report** (`/api/my-reports/recoverability`):
- **Current:** Uses `idx_drs_biller_covering`
- **New:** Uses `idx_drs_biller_date` (similar structure)
- **Expected:** Maintains current performance

### Other Queries

**Task Queries** (`/api/tasks/[id]/*`):
- **Expected:** 10-15% faster (smaller, more focused `idx_wip_task`)

**Client Queries** (`/api/clients/[id]/*`):
- **Expected:** Similar or slightly faster

## Deployment Instructions

### Prerequisites

- [ ] Database backup completed
- [ ] Maintenance window scheduled (5-8 minutes)
- [ ] Azure SQL DTU/vCore limits reviewed (ensure capacity for index operations)
- [ ] Team notified of deployment

### Deployment Steps

1. **Run Migration**
   ```sql
   -- In Azure Portal Query Editor or SSMS
   -- Execute: migration.sql
   ```

2. **Verify Creation**
   ```sql
   -- Execute: verify_indexes.sql
   -- Check: Part 1 shows all 9 indexes created
   ```

3. **Test Query Plans**
   ```sql
   -- Execute: verify_indexes.sql (full)
   -- Review execution plans in output
   ```

4. **Monitor Initial Performance**
   - Check My Reports response times
   - Verify index usage in Azure SQL Insights

### Rollback (If Needed)

If new indexes underperform:

```sql
-- Execute: rollback.sql
-- This restores previous comprehensive covering indexes
```

## Post-Deployment Monitoring

### Week 1: Active Monitoring

**Daily Checks:**
1. My Reports response times (target: 20-30% improvement for profitability)
2. Azure SQL Query Performance Insights (verify new indexes are used)
3. Error logs (check for any query timeouts)

**Key Metrics:**
- `/api/my-reports/profitability` response time
- `/api/my-reports/recoverability` response time
- Index seek vs scan ratio

### Week 2-4: Passive Monitoring

**Weekly Checks:**
1. Index usage statistics
   ```sql
   SELECT * FROM sys.dm_db_index_usage_stats 
   WHERE database_id = DB_ID() 
   AND OBJECT_NAME(object_id) IN ('WIPTransactions', 'DrsTransactions');
   ```

2. Index fragmentation
   ```sql
   SELECT * FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED')
   WHERE OBJECT_NAME(object_id) IN ('WIPTransactions', 'DrsTransactions');
   ```

3. Disk space usage (verify expected reduction)

### Success Criteria

After 1 week, the migration is successful if:

- ✅ My Reports profitability queries show 15-30% improvement
- ✅ No query timeout errors
- ✅ All 9 indexes show `user_seeks > 0` in usage stats
- ✅ WIPTransactions index size ~600-700 MB (down from 1,190 MB)
- ✅ No significant increase in logical reads for any query

### Failure Criteria (Triggers Rollback)

- ❌ My Reports queries are slower than baseline
- ❌ Queries show "Index Scan" instead of "Index Seek" in execution plans
- ❌ Multiple query timeout errors
- ❌ User complaints about slow reports

## Index Maintenance

### Fragmentation Monitoring

Check fragmentation monthly:

```sql
SELECT 
    OBJECT_NAME(ips.object_id) AS TableName,
    i.name AS IndexName,
    ips.avg_fragmentation_in_percent,
    CASE 
        WHEN ips.avg_fragmentation_in_percent > 30 THEN 'REBUILD'
        WHEN ips.avg_fragmentation_in_percent > 10 THEN 'REORGANIZE'
        ELSE 'OK'
    END AS Action
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
INNER JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
WHERE OBJECT_NAME(ips.object_id) IN ('WIPTransactions', 'DrsTransactions')
    AND i.name LIKE 'idx_%';
```

### Rebuild/Reorganize

**If fragmentation > 30%:**
```sql
ALTER INDEX [idx_wip_task] ON [WIPTransactions] REBUILD WITH (ONLINE = ON);
```

**If fragmentation 10-30%:**
```sql
ALTER INDEX [idx_wip_task] ON [WIPTransactions] REORGANIZE;
```

## Troubleshooting

### Issue: Index Not Being Used

**Symptoms:** Query execution plan shows "Index Scan" or table scan instead of "Index Seek"

**Solutions:**
1. Update statistics: `UPDATE STATISTICS [WIPTransactions] WITH FULLSCAN;`
2. Check WHERE clause matches index key columns
3. Verify filtered index predicate (e.g., `WHERE EmpCode IS NOT NULL`)
4. Check if query uses ISNULL() or functions on indexed columns (prevents index usage)

### Issue: Slower Query Performance

**Symptoms:** Query takes longer than before migration

**Solutions:**
1. Check execution plan (compare with pre-migration plan if available)
2. Verify correct index is being used
3. Check for missing INCLUDE columns in index
4. Consider rollback if widespread issues

### Issue: High Index Fragmentation

**Symptoms:** `avg_fragmentation_in_percent > 30%` shortly after creation

**Solutions:**
1. This is abnormal for new indexes - investigate data distribution
2. Check `FILLFACTOR` setting (should be 90-95)
3. Consider adjusting `FILLFACTOR` for heavily updated tables

## Technical Details

### Index Design Decisions

**Why Not Keep Comprehensive Covering Indexes?**
- 1,190 MB for 2 indexes on WIPTransactions is excessive
- Many included columns unused by most queries
- Query optimizer sometimes confused by multiple similar indexes

**Why Separate Partner/Manager Indexes?**
- My Reports profitability has two distinct query patterns
- Employees filter by either TaskPartner OR TaskManager (never both)
- Separate indexes provide clearer query plans

**Why Filtered Indexes?**
- `idx_wip_emp_date` uses `WHERE EmpCode IS NOT NULL`
- `idx_drs_*` indexes use `WHERE GSClientID/Biller IS NOT NULL`
- Reduces index size and improves query performance for non-null queries

### INCLUDE Column Selection

INCLUDE columns chosen based on:
1. Frequently selected fields in queries
2. Small data types (avoiding NVARCHAR(Max), Text)
3. Columns used in JOIN or WHERE clauses downstream

**Not Included:**
- `Narration` (TEXT type - cannot be included)
- Large NVARCHAR(Max) columns
- Rarely selected columns

## Files in This Migration

- **migration.sql** - Main migration script (DROP + CREATE)
- **rollback.sql** - Restores previous indexes if needed
- **verify_indexes.sql** - Tests and verifies new indexes
- **README.md** - This documentation

## References

- **Query Analysis:** See `/docs/QUERY_PATTERN_ANALYSIS.md` (if exists)
- **Previous Migration:** `20260127_wiptransactions_2_covering_indexes.sql`
- **DRS Migration:** `20260128_optimize_drs_indexes/migration.sql`
- **Prisma Schema:** `prisma/schema.prisma` (lines 2338-2368, 863-874)

## Contact

For questions or issues:
- Review execution plans in Azure SQL Query Performance Insights
- Check application logs for query errors
- Consult DBA or senior developer before rollback
