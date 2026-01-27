# Drop Redundant WIPTransactions Indexes

## Overview

This migration removes 3 indexes from WIPTransactions that are redundant with the super covering indexes.

## Indexes Removed

| Index Name | Columns | Reason for Removal |
|------------|---------|-------------------|
| `WIPTransactions_TaskManager_TranDate_idx` | (TaskManager, TranDate) | TaskManager is in INCLUDE of super covering indexes |
| `WIPTransactions_TaskPartner_TranDate_idx` | (TaskPartner, TranDate) | TaskPartner is in INCLUDE of super covering indexes |
| `WIPTransactions_TranDate_idx` | (TranDate) | TranDate is key column in both super covering indexes |

## Indexes Retained

| Index Name | Type | Purpose |
|------------|------|---------|
| `idx_wip_gsclientid_super_covering` | Covering | Client-level queries with INCLUDE columns |
| `idx_wip_gstaskid_super_covering` | Covering | Task-level queries with INCLUDE columns |
| `WIPTransactions_GSWIPTransID_key` | Unique | @unique constraint on GSWIPTransID |
| Primary Key (id) | Clustered | Primary key |

## Query Coverage Analysis

The super covering indexes handle all WIPTransactions query patterns:

1. **Client-level queries** (`WHERE GSClientID = ?`): `idx_wip_gsclientid_super_covering`
2. **Task-level queries** (`WHERE GSTaskID = ?`): `idx_wip_gstaskid_super_covering`
3. **Date range queries**: TranDate is second key column in both super covering indexes
4. **TaskManager/TaskPartner filtering**: Included in INCLUDE columns, covered by index

## Deployment

```bash
# Apply migration
npx prisma migrate deploy

# Or run SQL directly
sqlcmd -S server -d database -i migration.sql
```

## Rollback

If issues arise, run rollback.sql to recreate the dropped indexes.

## Files Changed

- `prisma/schema.prisma` - Removed @@index definitions for these 3 indexes
- `prisma/migrations/20260127_drop_wiptransactions_redundant_indexes/migration.sql` - DROP statements
