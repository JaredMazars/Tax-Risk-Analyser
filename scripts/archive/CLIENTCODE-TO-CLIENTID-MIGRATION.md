# ClientCode to ClientID Migration

## Overview
Successfully migrated Task.ClientCode and WipLTD.ClientCode from string-based clientCode (NVARCHAR(10)) to UUID-based ClientID (UNIQUEIDENTIFIER) references.

## Migration Date
December 6, 2025

## What Changed

### Database Schema
1. **Client.ClientID**: Added unique index on UNIQUEIDENTIFIER column
2. **Task.ClientCode**: Changed from NVARCHAR(10) to UNIQUEIDENTIFIER (nullable)
3. **WipLTD.ClientCode**: Changed from NVARCHAR(10) to UNIQUEIDENTIFIER (nullable)
4. **Foreign Keys**: Updated to reference Client.ClientID instead of Client.clientCode
5. **Unique Constraint**: Created filtered unique index on Task(ClientCode, TaskCode) excluding NULL values

### Prisma Schema
- Updated `Task.ClientCode` from `String` to `String?` to allow NULL values
- Updated `WipLTD.ClientCode` from `String` to `String?` to allow NULL values

## Migration Results

### Statistics
- **Total Clients**: 14,489 (all have ClientID)
- **Total Tasks**: 248,653
  - With ClientCode (linked to clients): 170,543
  - Without ClientCode (internal projects): 78,110
- **Orphaned Tasks**: 0 (all non-NULL ClientCodes reference valid clients)

### Key Changes
1. All task-to-client relationships now use UUIDs instead of string codes
2. Internal tasks (without clients) properly supported with NULL ClientCode
3. Filtered unique index allows duplicate TaskCodes for internal tasks
4. Full referential integrity maintained with foreign key constraints

## Scripts Created

### Migration Scripts (in archive/)
- `fix-clientcode-migration.ts`: Main migration logic
- `complete-clientcode-migration.ts`: Constraint and index creation
- `migrate-clientcode-to-clientid.ts`: Original migration attempt (incomplete)

### Diagnostic Scripts (in archive/)
- `check-clientcode-status.ts`: Verify column types and data
- `check-task-columns.ts`: Inspect Task table structure
- `check-client-clientid.ts`: Verify Client.ClientID uniqueness
- `check-null-clientcode-tasks.ts`: Analyze internal tasks
- `analyze-unmigrated-tasks.ts`: Investigate unmigrated data
- `verify-migration-success.ts`: Final verification
- `test-api-endpoints.ts`: API endpoint testing

## Technical Details

### Unique Constraint Implementation
Instead of a standard unique constraint, we use a filtered unique index:
```sql
CREATE UNIQUE INDEX [Task_ClientCode_TaskCode_key] 
ON [dbo].[Task]([ClientCode], [TaskCode])
WHERE [ClientCode] IS NOT NULL
```

This allows:
- Unique (ClientCode, TaskCode) pairs for client tasks
- Multiple internal tasks with the same TaskCode (NULL ClientCode)

### Internal Tasks
78,110 tasks have NULL ClientCode. These are:
1. Tasks whose original clientCode didn't match any Client.clientCode
2. Genuinely internal projects without client associations

The application properly handles these through:
- `internalOnly` filter in API routes
- `clientTasksOnly` filter in API routes
- Nullable ClientCode in Prisma schema

## Verification

All API endpoints tested and working:
- ✓ Client queries with task counts
- ✓ Task queries with client relations
- ✓ Internal task queries (NULL ClientCode)
- ✓ Mixed queries (with and without clients)
- ✓ Foreign key relationships
- ✓ Unique constraints

## Issues Resolved

1. **String to GUID Conversion Errors**: Fixed by completing the migration
2. **Missing Unique Constraint**: Added filtered unique index
3. **NULL ClientCode Errors**: Updated Prisma schema to make ClientCode optional
4. **Orphaned References**: All ClientCodes reference valid Client.ClientID values

## No Action Required

The migration is complete and the application is fully functional.
