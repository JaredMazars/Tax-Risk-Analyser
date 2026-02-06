# Recoverability Report Indexing Strategy

## Overview

This document describes the comprehensive indexing strategy for the `sp_RecoverabilityData` stored procedure to optimize the My Reports > Recoverability page performance.

## Problem Statement

The recoverability report was experiencing severe performance issues:
- **Query execution time**: 30-60+ seconds
- **Root cause**: Key lookups for missing columns in covering index
- **Impact**: Page timeouts, poor user experience

## Solution: Multi-Index Strategy

Following the proven pattern from WIP Aging optimization, we implement **3 dedicated covering indexes** for the 3 main filter patterns used in the recoverability query.

### Indexing Strategy

| Index Name | Key Columns | Filter Pattern | Use Case |
|---|---|---|---|
| `idx_drs_biller_covering` | Biller, TranDate, EntryType | `@BillerCode` | Most common (default view) |
| `idx_drs_client_covering` | ClientCode, TranDate, EntryType | `@ClientCode` | Client-specific reports |
| `idx_drs_serviceline_covering` | ServLineCode, TranDate, EntryType | `@ServLineCode` | Service line analysis |

### Why Multiple Indexes?

**Single Index Approach (previous):**
- One index with Biller as key column
- Works well for Biller filter
- Inefficient for Client or Service Line filters (requires full index scan)

**Multi-Index Approach (new):**
- Each filter has dedicated index with that filter as first key column
- SQL Server chooses most selective index automatically
- Optimal performance for all filter combinations

## Index Details

### 1. idx_drs_biller_covering (Enhanced)

**Purpose**: Biller-based queries (most common use case)

**Keys**: 
- `Biller` (primary filter)
- `TranDate` (range filter)
- `EntryType` (additional selectivity)

**INCLUDE Columns**: 
```sql
Total, InvNumber, Reference, ServLineCode, ServLineDesc,
GSClientID, ClientCode, ClientNameFull, GroupCode, GroupDesc, updatedAt
```

**Filter**: `WHERE (Biller IS NOT NULL)`

**Change from Previous**: Added `ServLineDesc` to INCLUDE (was missing, caused key lookups)

### 2. idx_drs_client_covering (New)

**Purpose**: Client-specific queries

**Keys**: 
- `ClientCode` (primary filter)
- `TranDate` (range filter)
- `EntryType` (additional selectivity)

**INCLUDE Columns**: 
```sql
Total, InvNumber, Reference, ServLineCode, ServLineDesc,
GSClientID, ClientNameFull, GroupCode, GroupDesc, Biller, updatedAt
```

**Filter**: `WHERE (ClientCode IS NOT NULL)`

**Use Case**: When user filters by specific client on recoverability page

### 3. idx_drs_serviceline_covering (New)

**Purpose**: Service line-based queries

**Keys**: 
- `ServLineCode` (primary filter)
- `TranDate` (range filter)
- `EntryType` (additional selectivity)

**INCLUDE Columns**: 
```sql
Total, InvNumber, Reference, ServLineDesc,
GSClientID, ClientCode, ClientNameFull, GroupCode, GroupDesc, Biller, updatedAt
```

**Filter**: `WHERE (ServLineCode IS NOT NULL)`

**Use Case**: When user filters by service line on recoverability page

## Query Plan Selection

SQL Server automatically chooses the most appropriate index based on the query predicates:

| Filter Combination | Index Used | Reason |
|---|---|---|
| Biller only | `idx_drs_biller_covering` | Biller is key column |
| Client only | `idx_drs_client_covering` | ClientCode is key column |
| Service Line only | `idx_drs_serviceline_covering` | ServLineCode is key column |
| Biller + Client | Most selective | SQL Server evaluates cardinality |
| Biller + Service Line | Most selective | SQL Server evaluates cardinality |
| Client + Service Line | Most selective | SQL Server evaluates cardinality |
| All three | Most selective | Typically Biller (usually least rows) |

## Performance Expectations

### Before Indexing

| Query Type | Execution Time | Key Lookups |
|---|---|---|
| Biller filter | 30-60 seconds | Millions |
| Client filter | 20-40 seconds | Hundreds of thousands |
| Service Line filter | 20-40 seconds | Hundreds of thousands |

### After Indexing

| Query Type | Execution Time | Key Lookups |
|---|---|---|
| Biller filter | <5 seconds | 0 |
| Client filter | <3 seconds | 0 |
| Service Line filter | <3 seconds | 0 |
| Combined filters | <2 seconds | 0 |

**Expected Improvement**: **5-10x faster** across all query patterns

## Storage & Maintenance Impact

### Storage

- **Index Size**: ~50-75MB per index (150-225MB total)
- **Total Table Size**: ~500MB
- **Storage Overhead**: ~30-45% increase (acceptable for read-heavy workload)

### Write Performance

- **DrsTransactions pattern**: Mostly INSERT operations
- **UPDATE/DELETE**: Rare (historical data is stable)
- **Write overhead**: <5% (negligible impact)

### Maintenance

- **Fragmentation**: Monitor quarterly, rebuild if >30%
- **Statistics**: Auto-update enabled (SQL Server default)
- **FILLFACTOR**: Set to 90 to reduce fragmentation

## Deployment

### Files

1. **`sp_RecoverabilityData_comprehensive_indexes.sql`** - Index creation script
2. **`sp_RecoverabilityData_comprehensive_performance_test.sql`** - Testing suite
3. **`sp_RecoverabilityData.sql`** - Updated with index documentation

### Deployment Steps

1. **Pre-deployment Testing**
   ```sql
   -- Run performance test BEFORE indexing (baseline)
   -- Execute: sp_RecoverabilityData_comprehensive_performance_test.sql
   -- Record: Execution times, logical reads, key lookups
   ```

2. **Apply Indexes**
   ```sql
   -- Execute: sp_RecoverabilityData_comprehensive_indexes.sql
   -- Duration: ~15-25 minutes
   -- Impact: Zero downtime (ONLINE = ON)
   ```

3. **Post-deployment Verification**
   ```sql
   -- Run performance test AFTER indexing
   -- Execute: sp_RecoverabilityData_comprehensive_performance_test.sql
   -- Verify: 5-10x improvement, zero key lookups
   ```

4. **Monitor Production**
   - Watch query execution times
   - Check index usage statistics
   - Monitor fragmentation levels

### Rollback Plan

If performance doesn't improve or issues arise:

```sql
-- Drop new indexes
DROP INDEX IF EXISTS idx_drs_client_covering ON DrsTransactions;
DROP INDEX IF EXISTS idx_drs_serviceline_covering ON DrsTransactions;

-- Restore original idx_drs_biller_covering (without ServLineDesc)
DROP INDEX IF EXISTS idx_drs_biller_covering ON DrsTransactions;

CREATE NONCLUSTERED INDEX idx_drs_biller_covering
ON DrsTransactions(Biller, TranDate, EntryType)
INCLUDE (Total, InvNumber, Reference, ServLineCode, GSClientID, 
         ClientCode, ClientNameFull, GroupCode, GroupDesc, updatedAt)
WHERE (Biller IS NOT NULL)
WITH (ONLINE = ON);
```

## Comparison to Single Index Approach

### Alternative 1: Single Enhanced Biller Index

**File**: `sp_RecoverabilityData_index_update.sql`

**Pros**:
- Simpler (1 index instead of 3)
- Less storage overhead
- Minimal write impact

**Cons**:
- Suboptimal for Client/Service Line filters
- May still require index scans for non-Biller queries
- Only 2-3x improvement for non-Biller queries (vs 5-10x)

### Alternative 2: Multi-Index Strategy (Recommended)

**File**: `sp_RecoverabilityData_comprehensive_indexes.sql`

**Pros**:
- Optimal for all filter patterns
- 5-10x improvement across the board
- True covering indexes (zero key lookups)
- Scales to any query combination

**Cons**:
- More storage (150-225MB vs 50-75MB)
- Slightly higher write overhead (~5% vs ~2%)
- More complex maintenance

### Recommendation

**Use Multi-Index Strategy** for these reasons:

1. **User Experience**: All filter patterns perform equally well
2. **Scalability**: Supports future query variations without re-indexing
3. **Storage**: 150-225MB overhead is negligible for modern systems
4. **Write Impact**: DrsTransactions is 95%+ reads (minimal write overhead)
5. **Future-Proof**: If user adds more filters, existing indexes will support them

## Testing Results

### Test Environment

- **Database**: [Your database name]
- **Table Size**: ~500MB, ~2M rows
- **Test Date**: [Date you run tests]

### Baseline (Before Indexing)

| Test | Duration | Logical Reads | Key Lookups |
|---|---|---|---|
| Biller filter | XX.X sec | XXX,XXX | XXX,XXX |
| Client filter | XX.X sec | XXX,XXX | XXX,XXX |
| Service Line filter | XX.X sec | XXX,XXX | XXX,XXX |

### After Multi-Index

| Test | Duration | Logical Reads | Key Lookups | Improvement |
|---|---|---|---|---|
| Biller filter | X.X sec | X,XXX | 0 | X.Xx faster |
| Client filter | X.X sec | X,XXX | 0 | X.Xx faster |
| Service Line filter | X.X sec | X,XXX | 0 | X.Xx faster |

## Monitoring Queries

### Check Index Usage

```sql
SELECT 
    i.name AS IndexName,
    ius.user_seeks AS Seeks,
    ius.user_scans AS Scans,
    ius.user_lookups AS Lookups,
    ius.last_user_seek AS LastSeek
FROM sys.indexes i
LEFT JOIN sys.dm_db_index_usage_stats ius 
    ON i.object_id = ius.object_id AND i.index_id = ius.index_id
WHERE i.object_id = OBJECT_ID('DrsTransactions')
  AND i.name LIKE 'idx_drs_%_covering'
ORDER BY i.name;
```

### Check Fragmentation

```sql
SELECT 
    i.name AS IndexName,
    ips.avg_fragmentation_in_percent AS Fragmentation,
    ips.page_count AS Pages
FROM sys.indexes i
CROSS APPLY sys.dm_db_index_physical_stats(DB_ID(), i.object_id, i.index_id, NULL, 'LIMITED') ips
WHERE i.object_id = OBJECT_ID('DrsTransactions')
  AND i.name LIKE 'idx_drs_%_covering'
ORDER BY i.name;
```

### Rebuild if Fragmented

```sql
-- If fragmentation >30%
ALTER INDEX idx_drs_biller_covering ON DrsTransactions REBUILD WITH (ONLINE = ON);
ALTER INDEX idx_drs_client_covering ON DrsTransactions REBUILD WITH (ONLINE = ON);
ALTER INDEX idx_drs_serviceline_covering ON DrsTransactions REBUILD WITH (ONLINE = ON);
```

## Related Documentation

- **WIP Aging Optimization**: `docs/WIP_AGING_FINAL_STATUS.md`
- **Database Patterns**: `.cursor/rules/database-patterns.mdc`
- **Performance Rules**: `.cursor/rules/performance-rules.mdc`

## References

- Pattern based on: `sp_WIPAgingByTask_index_update.sql`
- Original index migration: `prisma/migrations/20260128_optimize_drs_indexes/migration.sql`
- Stored procedure: `prisma/procedures/sp_RecoverabilityData.sql`
