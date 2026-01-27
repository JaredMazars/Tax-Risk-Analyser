# Migration: Restore Essential WIPTransactions Indexes

**Date:** 2026-01-27  
**Status:** Pending

## Purpose

Restore indexes that were incorrectly dropped by the previous migration (`20260127_drop_wiptransactions_redundant_indexes`).

## Problem

The previous migration dropped these indexes assuming they were redundant with super covering indexes:

1. `WIPTransactions_TaskPartner_TranDate_idx`
2. `WIPTransactions_TaskManager_TranDate_idx`
3. `WIPTransactions_TranDate_idx`

**This was incorrect** because:

1. Super covering indexes have `GSClientID` or `GSTaskID` as the **first key column**
2. My Reports queries filter on `TaskPartner` or `TaskManager` (NOT `GSClientID`/`GSTaskID`)
3. SQL Server **requires the first key column to match the WHERE clause** for an index seek
4. Without these indexes, My Reports queries will perform **table scans** instead of **index seeks**

## Indexes Being Restored

| Index Name | Key Columns | API Endpoint | Query Pattern |
|------------|-------------|--------------|---------------|
| `WIPTransactions_TaskPartner_TranDate_idx` | `(TaskPartner, TranDate)` | `/api/my-reports/profitability` | `WHERE TaskPartner = @empCode AND TranDate >= @start` |
| `WIPTransactions_TaskManager_TranDate_idx` | `(TaskManager, TranDate)` | `/api/my-reports/profitability` | `WHERE TaskManager = @empCode AND TranDate >= @start` |
| `WIPTransactions_TranDate_idx` | `(TranDate)` | `/api/reports/fiscal-transactions` | `WHERE TranDate >= @fiscalStart` |

## Index Strategy Summary

After this migration, the WIPTransactions table will have:

### Super Covering Indexes (SQL-managed, not in Prisma schema)
- `idx_wip_gsclientid_super_covering`: `(GSClientID, TranDate)` + INCLUDE columns
- `idx_wip_gstaskid_super_covering`: `(GSTaskID, TranDate)` + INCLUDE columns

### Composite Indexes (Essential for specific query patterns)
- `WIPTransactions_TaskPartner_TranDate_idx`: Partner-based profitability
- `WIPTransactions_TaskManager_TranDate_idx`: Manager-based profitability  
- `WIPTransactions_TranDate_idx`: Fiscal period queries

### Unique Index
- `WIPTransactions_GSWIPTransID_key`: Primary identifier lookup

## Performance Impact

| Metric | Before Restore | After Restore |
|--------|----------------|---------------|
| My Reports query type | Table scan | Index seek |
| Fiscal queries type | Table scan | Index seek |
| Insert overhead | 2 indexes | 5 indexes |
| Total indexes on table | 3 | 6 |

## How to Apply

```bash
npx prisma migrate deploy
```

## Rollback

If needed, run `rollback.sql` in SQL Server Management Studio:

```sql
-- Run rollback.sql
```

**Warning:** Rolling back will cause performance degradation in My Reports.

## Verification

After applying, run this query to verify indexes exist:

```sql
SELECT name, type_desc
FROM sys.indexes
WHERE object_id = OBJECT_ID('WIPTransactions')
  AND name IN (
    'WIPTransactions_TaskPartner_TranDate_idx',
    'WIPTransactions_TaskManager_TranDate_idx',
    'WIPTransactions_TranDate_idx'
  );
```

Expected: 3 rows returned.
