# DrsTransactions & WIPTransactions Index Rebuild Guide

## Overview

This guide covers the complete process of dropping all existing indexes and rebuilding them with an optimized structure for the recoverability and WIP aging reports.

## Current Problem

- **Recoverability Report**: 30-60+ seconds (key lookups due to missing `ServLineDesc` in index)
- **WIP Aging Report**: Similar performance issues with incomplete covering indexes
- **Fragmented Indexes**: Multiple indexes created over time with overlapping columns
- **Inefficient Coverage**: No dedicated indexes for specific filter patterns

## Solution Strategy

**Drop all indexes and rebuild with 3 specialized covering indexes per table:**

### DrsTransactions (Recoverability Report)
1. `idx_drs_biller_covering` - Biller filter (most common)
2. `idx_drs_client_covering` - Client filter
3. `idx_drs_serviceline_covering` - Service line filter

### WIPTransactions (WIP Aging Report)
1. `idx_wip_partner_date` - Partner filter (enhanced)
2. `idx_wip_manager_date` - Manager filter (enhanced)
3. `idx_WIPTransactions_Aging_General` - General purpose covering

## Step-by-Step Process

### Phase 1: Backup Current State

**CRITICAL: Do this first!**

```sql
-- Run in SSMS and save the output
-- File: prisma/procedures/backup_current_drs_wip_indexes.sql
```

**What it does:**
- Generates CREATE INDEX statements for all current indexes
- Shows index statistics (fragmentation, size, usage)
- Documents index usage patterns
- Calculates total space used

**Save the output:** You'll need this if you need to restore the original indexes.

### Phase 2: Drop All Indexes

```sql
-- Run during maintenance window
-- File: prisma/procedures/drop_all_drs_wip_indexes.sql
```

**What it drops:**
- All non-clustered indexes on DrsTransactions
- All non-clustered indexes on WIPTransactions

**What it keeps:**
- Primary keys (clustered indexes)
- Unique constraints (GSDebtorsTranID, GSWIPTransID)

**Duration:** ~5-10 minutes

**⚠️ WARNING:** Query performance will be severely degraded until new indexes are created!

### Phase 3: Create Optimized Indexes

**IMMEDIATELY after dropping, run these scripts:**

#### For DrsTransactions (Recoverability)

```sql
-- File: prisma/procedures/sp_RecoverabilityData_comprehensive_indexes.sql
```

**Creates:**
1. `idx_drs_biller_covering` - Keys: (Biller, TranDate, EntryType), 11 includes
2. `idx_drs_client_covering` - Keys: (ClientCode, TranDate, EntryType), 11 includes
3. `idx_drs_serviceline_covering` - Keys: (ServLineCode, TranDate, EntryType), 10 includes

**Duration:** ~15-25 minutes
**Storage:** ~150-200MB additional space

#### For WIPTransactions (WIP Aging)

```sql
-- File: prisma/procedures/sp_WIPAgingByTask_index_update.sql
```

**Enhances:**
1. `idx_wip_partner_date` - Adds TType to keys, 7 new INCLUDE columns
2. `idx_wip_manager_date` - Adds TType to keys, 7 new INCLUDE columns

**Creates:**
3. `idx_WIPTransactions_Aging_General` - General covering index

**Duration:** ~10-20 minutes

### Phase 4: Performance Testing

#### Test Recoverability Report

```sql
-- File: prisma/procedures/sp_RecoverabilityData_comprehensive_performance_test.sql
```

**Tests:**
- Individual filters (Biller, Client, Service Line)
- Combined filters (multiple filters)
- Edge cases (date ranges, wildcards)

**Expected Results:**
- Individual queries: <5 seconds (was 30-60s)
- Combined queries: <2 seconds (was 15-30s)
- Zero key lookups in execution plans

#### Test WIP Aging Report

Use the test queries in `sp_WIPAgingByTask_index_update.sql`:

```sql
-- Partner filter
EXEC sp_WIPAgingByTask @TaskPartner = 'FERY001';

-- Manager filter
EXEC sp_WIPAgingByTask @TaskManager = 'PERJ001';

-- Client filter
EXEC sp_WIPAgingByTask @ClientCode = 'BRE0200';
```

**Target:** All queries <5 seconds

## Deployment Checklist

### Pre-Deployment

- [ ] Backup current index definitions
- [ ] Save backup output to safe location
- [ ] Schedule maintenance window (low traffic period)
- [ ] Notify users of potential temporary slowdown
- [ ] Test scripts in development environment

### Deployment

- [ ] Run backup script (`backup_current_drs_wip_indexes.sql`)
- [ ] **Save the output!**
- [ ] Run drop script (`drop_all_drs_wip_indexes.sql`)
- [ ] Verify indexes dropped (script shows remaining indexes)
- [ ] **IMMEDIATELY** run DRS index creation (`sp_RecoverabilityData_comprehensive_indexes.sql`)
- [ ] **IMMEDIATELY** run WIP index creation (`sp_WIPAgingByTask_index_update.sql`)
- [ ] Verify all indexes created successfully
- [ ] Update statistics (done automatically by scripts)

### Post-Deployment

- [ ] Run performance tests (both reports)
- [ ] Verify query execution times <5 seconds
- [ ] Check execution plans (no key lookups)
- [ ] Monitor application logs for errors
- [ ] Test actual report pages in application
- [ ] Document before/after metrics
- [ ] Update stored procedure comments (already done)

## Performance Expectations

### Before Optimization

| Query Type | Current Time | Key Lookups |
|---|---|---|
| Recoverability (All clients) | 30-60s | Millions |
| Recoverability (Client filter) | 20-40s | Hundreds of thousands |
| WIP Aging (Partner filter) | 20-40s | Hundreds of thousands |
| WIP Aging (Manager filter) | 20-40s | Hundreds of thousands |

### After Optimization

| Query Type | Target Time | Key Lookups |
|---|---|---|
| Recoverability (All clients) | <5s | 0 |
| Recoverability (Client filter) | <3s | 0 |
| WIP Aging (Partner filter) | <5s | 0 |
| WIP Aging (Manager filter) | <5s | 0 |

**Expected Improvement:** 5-10x faster

## Rollback Plan

If issues occur, restore original indexes:

1. Use the saved output from `backup_current_drs_wip_indexes.sql`
2. Copy all CREATE INDEX statements
3. Execute them in SSMS
4. Update statistics: `UPDATE STATISTICS [table] WITH FULLSCAN;`

**Note:** New indexes must be dropped first before restoring originals.

## Files Reference

### Backup & Drop
- `backup_current_drs_wip_indexes.sql` - Backup current indexes (run FIRST)
- `drop_all_drs_wip_indexes.sql` - Drop all indexes (run SECOND)

### Create New Indexes
- `sp_RecoverabilityData_comprehensive_indexes.sql` - DrsTransactions (run THIRD)
- `sp_WIPAgingByTask_index_update.sql` - WIPTransactions (run FOURTH)

### Testing
- `sp_RecoverabilityData_comprehensive_performance_test.sql` - Test DRS indexes
- Test queries embedded in `sp_WIPAgingByTask_index_update.sql`

### Documentation
- `sp_RecoverabilityData.sql` - Updated with new index comments
- `WIP_AGING_FINAL_STATUS.md` - WIP Aging optimization documentation

## Monitoring After Deployment

### Index Usage Statistics

```sql
-- Check which indexes are being used
SELECT 
    i.name AS IndexName,
    ius.user_seeks AS Seeks,
    ius.user_scans AS Scans,
    ius.user_lookups AS Lookups,
    ius.last_user_seek AS LastUsed
FROM sys.indexes i
LEFT JOIN sys.dm_db_index_usage_stats ius 
    ON i.object_id = ius.object_id 
    AND i.index_id = ius.index_id
    AND ius.database_id = DB_ID()
WHERE i.object_id IN (OBJECT_ID('DrsTransactions'), OBJECT_ID('WIPTransactions'))
  AND i.type = 2
ORDER BY COALESCE(ius.user_seeks, 0) + COALESCE(ius.user_scans, 0) DESC;
```

### Missing Index Recommendations

```sql
-- Check for missing indexes
SELECT 
    mid.statement AS TableName,
    migs.avg_user_impact AS AvgImpact,
    migs.user_seeks + migs.user_scans AS TotalSeeks,
    mid.equality_columns AS EqualityColumns,
    mid.inequality_columns AS InequalityColumns,
    mid.included_columns AS IncludedColumns
FROM sys.dm_db_missing_index_details mid
INNER JOIN sys.dm_db_missing_index_groups mig ON mid.index_handle = mig.index_handle
INNER JOIN sys.dm_db_missing_index_group_stats migs ON mig.index_group_handle = migs.group_handle
WHERE mid.database_id = DB_ID()
  AND (mid.statement LIKE '%DrsTransactions%' OR mid.statement LIKE '%WIPTransactions%')
ORDER BY migs.avg_user_impact DESC;
```

### Index Fragmentation

```sql
-- Check fragmentation (rebuild if >30%)
SELECT 
    i.name AS IndexName,
    ips.avg_fragmentation_in_percent AS Fragmentation,
    ips.page_count AS PageCount,
    CASE 
        WHEN ips.avg_fragmentation_in_percent < 10 THEN 'Good'
        WHEN ips.avg_fragmentation_in_percent < 30 THEN 'Consider Reorganize'
        ELSE 'Rebuild Recommended'
    END AS Status
FROM sys.indexes i
CROSS APPLY sys.dm_db_index_physical_stats(DB_ID(), i.object_id, i.index_id, NULL, 'LIMITED') ips
WHERE i.object_id IN (OBJECT_ID('DrsTransactions'), OBJECT_ID('WIPTransactions'))
  AND i.type = 2
ORDER BY ips.avg_fragmentation_in_percent DESC;
```

## Maintenance Recommendations

### Weekly
- Monitor query performance (slow query log)
- Check for timeout errors in application logs

### Monthly
- Review index usage statistics
- Check for missing index recommendations
- Monitor index fragmentation

### Quarterly
- Rebuild indexes if fragmentation >30%
- Review and tune based on usage patterns
- Update statistics with FULLSCAN

## Success Criteria

✅ All queries complete in <5 seconds
✅ Zero key lookups in execution plans
✅ Index seeks (not scans) on filtered queries
✅ No application errors or timeouts
✅ User-reported page load times improved
✅ Logical reads reduced by 80-90%

## Support

If issues occur:
1. Check execution plans for key lookups
2. Verify correct index being used (see test scripts)
3. Review index usage statistics
4. Check for missing index recommendations
5. Restore original indexes if needed (use backup output)

## References

- WIP Aging optimization: `docs/WIP_AGING_FINAL_STATUS.md`
- Database patterns: `.cursor/rules/database-patterns.mdc`
- Performance rules: `.cursor/rules/performance-rules.mdc`
