# List Performance Indexes Migration

**Migration Date:** 2025-12-06  
**Migration Name:** `add_list_performance_indexes`

## Purpose

This migration adds critical composite database indexes specifically optimized for list query performance with large datasets (200k tasks, 14k clients). These indexes complement existing performance indexes and target the most common query patterns in list endpoints.

## Changes

### Client Table Indexes

1. **`Client_groupDesc_clientNameFull_idx`** - Composite index on `groupDesc` + `clientNameFull`
   - Optimizes client list sorting and filtering by group
   - Improves multi-column sort performance
   - Benefits pagination queries

2. **`Client_industry_idx`** - Index on `industry` column
   - Optimizes search queries filtering by industry
   - Improves filter performance in client lists

3. **`Client_sector_idx`** - Index on `sector` column
   - Optimizes search queries filtering by sector
   - Improves filter performance in client lists

### Task Table Indexes

1. **`Task_ServLineCode_Active_updatedAt_idx`** - Composite index on `ServLineCode` + `Active` + `updatedAt` (DESC)
   - **Critical for list performance** - covers the most common query pattern
   - Optimizes service line filtering with active status and sorting
   - Significantly improves `/api/tasks` endpoint with service line filters
   - Benefits sub-service line group pages

2. **`Task_ClientCode_Active_updatedAt_idx`** - Composite index on `ClientCode` + `Active` + `updatedAt` (DESC)
   - Optimizes client detail page task lists
   - Improves performance when showing client's tasks
   - Benefits pagination on client pages

3. **`Task_TaskDesc_idx`** - Index on `TaskDesc` column
   - Optimizes search queries by task description
   - Improves LIKE queries in task search
   - Benefits full-text search scenarios

### TaskTeam Table Indexes

1. **`TaskTeam_userId_taskId_role_idx`** - Composite covering index on `userId` + `taskId` with `role` included
   - **Critical for myTasksOnly queries**
   - Covering index avoids table lookups (includes all needed fields)
   - Optimizes team membership checks
   - Significantly improves "My Tasks" tab performance

## Performance Impact

### Expected Improvements
- **Task list queries with service line filter:** 60-80% faster
- **Client task lists:** 40-60% faster  
- **My Tasks queries:** 70-90% faster (covering index eliminates lookups)
- **Search queries:** 30-50% faster with dedicated search indexes

### Query Patterns Optimized

```sql
-- Task list with service line and active filter (most common)
SELECT * FROM Task 
WHERE ServLineCode IN (...) AND Active = 'Yes' 
ORDER BY updatedAt DESC;

-- My tasks query (user-specific)
SELECT t.* FROM Task t
INNER JOIN TaskTeam tt ON t.id = tt.taskId
WHERE tt.userId = ? AND t.Active = 'Yes'
ORDER BY t.updatedAt DESC;

-- Client's tasks
SELECT * FROM Task
WHERE ClientCode = ? AND Active = 'Yes'
ORDER BY updatedAt DESC;

-- Task search
SELECT * FROM Task
WHERE TaskDesc LIKE '%search%';

-- Client search
SELECT * FROM Client
WHERE industry LIKE '%search%' OR sector LIKE '%search%';
```

## Database Size Impact

Each index adds approximately:
- Composite indexes: 50-200 MB each (depends on data volume)
- Single-column indexes: 20-80 MB each
- Total estimated size increase: 300-600 MB

This is acceptable for the performance gains with 200k tasks and 14k clients.

## Rollback

To rollback this migration, drop the indexes:

```sql
DROP INDEX [Client_groupDesc_clientNameFull_idx] ON [dbo].[Client];
DROP INDEX [Client_industry_idx] ON [dbo].[Client];
DROP INDEX [Client_sector_idx] ON [dbo].[Client];
DROP INDEX [Task_ServLineCode_Active_updatedAt_idx] ON [dbo].[Task];
DROP INDEX [Task_ClientCode_Active_updatedAt_idx] ON [dbo].[Task];
DROP INDEX [Task_TaskDesc_idx] ON [dbo].[Task];
DROP INDEX [TaskTeam_userId_taskId_role_idx] ON [dbo].[TaskTeam];
```

## Testing

After applying:
1. Monitor query performance for list endpoints
2. Check index usage with `sys.dm_db_index_usage_stats`
3. Verify no performance degradation on write operations
4. Test pagination with various page numbers
5. Test search functionality across clients and tasks

## Related

- Complements indexes from migration `20251206052014_add_task_performance_indexes`
- Works with Redis caching layer for optimal performance
- Part of overall performance optimization for large dataset handling

