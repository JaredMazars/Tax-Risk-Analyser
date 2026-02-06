# Profitability SP Covering Indexes

**Date**: 2026-02-03  
**Purpose**: Add covering indexes for sp_ProfitabilityData filter optimization

## Problem

The `sp_ProfitabilityData` stored procedure had performance issues when filtering by:
- **GroupCode**: No index existed, caused full table scan (5-10s)
- **ClientCode**: Filter was only in Step 2, not Step 1 (5-10s) - FIXED in SP v4.3
- **ManagerCode**: Existing index `idx_wip_manager_date` missing GSTaskID/EmpCode (key lookups)
- **ServLineCode**: Existing index `idx_wip_serviceline` missing GSTaskID/TType/EmpCode (key lookups)

## Solution

### 1. SP Update (v4.3)
- Added `ClientCode` filter to Step 1 WIPTransactions aggregation
- Added `GroupCode` filter to Step 1 WIPTransactions aggregation
- Both now use index seeks instead of applying filters after full table scan

### 2. Covering Indexes (this migration)
Creates 3 new covering indexes on WIPTransactions (5.7M rows):

| Index | Key Column | Included Columns |
|-------|------------|------------------|
| IX_WIPTransactions_GroupCode_Covering | GroupCode | GSTaskID, TranDate, TType, Amount, Hour, Cost, EmpCode |
| IX_WIPTransactions_Manager_Covering | TaskManager | GSTaskID, TranDate, TType, Amount, Hour, Cost, EmpCode |
| IX_WIPTransactions_ServLine_Covering | TaskServLine | GSTaskID, TranDate, TType, Amount, Hour, Cost, EmpCode |

## Expected Performance

| Filter | Before | After | Improvement |
|--------|--------|-------|-------------|
| GroupCode | 5-10s (table scan) | 300-500ms | 10-20x |
| ClientCode | 5-10s (late filter) | 300-500ms | 10-20x |
| ManagerCode | 1-2s (key lookups) | 300-500ms | 2-4x |
| ServLineCode | 1-2s (key lookups) | 300-500ms | 2-4x |

## Index Size Estimate

Each covering index on 5.7M rows:
- Estimated size: 150-250 MB per index (with PAGE compression)
- Total additional storage: ~500-750 MB

## Execution

**Run during maintenance window** - index creation takes 5-15 minutes per index.

```bash
# Using sqlcmd
sqlcmd -S your-server -d your-db -i migration.sql

# Using Azure Data Studio or SSMS
# Open migration.sql and execute
```

## Rollback

If needed, run `rollback.sql` to remove the new indexes:

```bash
sqlcmd -S your-server -d your-db -i rollback.sql
```

Note: Old partial indexes (`idx_wip_manager_date`, `idx_wip_serviceline`) are retained as backup.

## Verification

After running the migration:

```sql
-- Check indexes exist
SELECT name, type_desc 
FROM sys.indexes 
WHERE object_id = OBJECT_ID('WIPTransactions')
AND name LIKE 'IX_WIPTransactions_%Covering';

-- Test with ClientCode filter (should be fast)
EXEC sp_ProfitabilityData @ClientCode = 'TESTCODE';

-- Test with GroupCode filter (should be fast)
EXEC sp_ProfitabilityData @GroupCode = 'TESTGROUP';
```

## Related Changes

- `prisma/procedures/sp_ProfitabilityData.sql` - Updated to v4.3 with GroupCode filter in Step 1
