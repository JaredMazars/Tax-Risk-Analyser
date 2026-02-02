# Profitability Optimization Migration

**Created:** 2026-02-01  
**Purpose:** Optimize `sp_ProfitabilityData` stored procedure performance

## Overview

This migration adds covering indexes and updates the stored procedure to improve performance on the 5.7M+ row `WIPTransactions` table.

## Files

| File | Purpose |
|------|---------|
| `migration.sql` | Creates 4 new covering indexes |
| `rollback.sql` | Removes the new indexes (if needed) |
| `../procedures/sp_ProfitabilityData_v4_optimized.sql` | Optimized stored procedure |

## Deployment Steps

### 1. Run Index Creation (Required First)

```sql
-- In Azure Data Studio or SSMS
-- Set timeout to 30+ minutes
:r migration.sql
```

**Expected Duration:** 15-30 minutes (WIPTransactions index is largest)

### 2. Deploy Optimized Stored Procedure

```sql
-- After indexes are created
:r ../procedures/sp_ProfitabilityData_v4_optimized.sql
```

### 3. Verify Performance

```sql
-- Test with typical parameters
SET STATISTICS IO ON;
SET STATISTICS TIME ON;

EXEC sp_ProfitabilityData 
    @ServLineCode = 'TAX',
    @PartnerCode = '*',
    @DateFrom = '2025-09-01',
    @DateTo = '2026-01-31';
```

**Expected:** Query time reduced from 15-60s to <5s

## Indexes Created

| Index | Table | Key Columns | Include | Purpose |
|-------|-------|-------------|---------|---------|
| `IX_Employee_Profitability_Covering` | Employee | `EmpCode` | `EmpCatCode` | CARL exclusion lookup |
| `IX_WIPTransactions_EmpCode_Covering` | WIPTransactions | `EmpCode, GSTaskID, TranDate, TType` | `Amount, Hour, Cost` | Employee-filtered queries |
| `IX_Task_Profitability_Covering` | Task | `ServLineCode, TaskPartner, TaskManager, TaskCode, GSClientID` | `OfficeCode, ServLineDesc, TaskPartnerName, TaskManagerName, GSTaskID` | Task filtering |
| `IX_Client_Profitability_Covering` | Client | `GSClientID, groupCode, clientCode` | `clientNameFull, groupDesc` | Client lookups |

## Stored Procedure Optimizations

1. **Dynamic SQL** - Sargable WHERE clauses (eliminates `OR @Param = '*'` pattern)
2. **Two-stage temp tables** - `#Tasks` + `#WIPAggregates` for single-pass aggregation
3. **Pre-computed aggregates** - Eliminates duplicate SUM calculations in HAVING
4. **Index-friendly joins** - Clustered indexes on temp tables

## Rollback

If issues occur, run in order:

```sql
-- 1. Restore original stored procedure
:r ../procedures/sp_ProfitabilityData.sql

-- 2. Remove new indexes (optional - only if causing write issues)
:r rollback.sql
```

## Storage Impact

| Index | Estimated Size |
|-------|---------------|
| IX_Employee_Profitability_Covering | ~1 MB |
| IX_WIPTransactions_EmpCode_Covering | ~150 MB |
| IX_Task_Profitability_Covering | ~5 MB |
| IX_Client_Profitability_Covering | ~2 MB |
| **Total** | **~160 MB** |

## Monitoring

```sql
-- Check index usage after 24 hours
SELECT 
    OBJECT_NAME(i.object_id) AS TableName,
    i.name AS IndexName,
    ius.user_seeks AS Seeks,
    ius.user_scans AS Scans,
    ius.last_user_seek AS LastSeek
FROM sys.indexes i
LEFT JOIN sys.dm_db_index_usage_stats ius 
    ON i.object_id = ius.object_id AND i.index_id = ius.index_id
WHERE i.name LIKE '%Profitability%' OR i.name LIKE '%EmpCode_Covering%'
ORDER BY TableName, IndexName;
```
