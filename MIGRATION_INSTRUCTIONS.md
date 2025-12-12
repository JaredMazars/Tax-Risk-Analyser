# TaskStage Table Migration Instructions

## Issue

The automated Prisma migration failed due to a type mismatch between `User.id` and the `TaskStage.movedBy` foreign key column in SQL Server.

## Solution: Manual Table Creation

You need to manually create the `TaskStage` table in SQL Server. Here's how:

### Step 1: Run the SQL Script

1. Open **SQL Server Management Studio** (SSMS) or **Azure Data Studio**
2. Connect to your database
3. Open the file: `create_taskstage_manual.sql` (located in the project root)
4. Execute the entire script

The script will:
- Drop the TaskStage table if it exists (cleaning up any partial creation)
- Create the TaskStage table with the correct column types
- Add foreign key constraints
- Create the necessary indexes

### Step 2: Verify Table Creation

Run this query to verify:

```sql
SELECT 
    c.name AS ColumnName,
    t.name AS DataType,
    c.max_length,
    c.is_nullable
FROM sys.columns c
INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID('dbo.TaskStage')
ORDER BY c.column_id;
```

You should see:
- `id` (INT)
- `taskId` (INT)
- `stage` (NVARCHAR, 50)
- `movedBy` (NVARCHAR, MAX)
- `notes` (NVARCHAR, 500)
- `createdAt` (DATETIME2)

### Step 3: Initialize Task Stages

After the table is created, run the initialization script:

```bash
bun run scripts/initialize-task-stages.ts
```

This will set all existing tasks to the default `DRAFT` stage.

### Step 4: Restart Dev Server

The Kanban board should now work correctly!

## Alternative: Run SQL Directly

If you prefer, here's the condensed SQL:

```sql
-- Drop if exists
IF OBJECT_ID('dbo.TaskStage', 'U') IS NOT NULL DROP TABLE dbo.TaskStage;

-- Create table
CREATE TABLE [dbo].[TaskStage] (
    [id] INT IDENTITY(1,1) PRIMARY KEY,
    [taskId] INT NOT NULL,
    [stage] NVARCHAR(50) NOT NULL,
    [movedBy] NVARCHAR(MAX) NOT NULL,
    [notes] NVARCHAR(500),
    [createdAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ([taskId]) REFERENCES [dbo].[Task] ([id]) ON DELETE CASCADE,
    FOREIGN KEY ([movedBy]) REFERENCES [dbo].[User] ([id])
);

-- Create indexes
CREATE INDEX [IX_TaskStage_taskId_createdAt] ON [dbo].[TaskStage]([taskId], [createdAt] DESC);
CREATE INDEX [IX_TaskStage_stage] ON [dbo].[TaskStage]([stage]);
CREATE INDEX [IX_TaskStage_taskId_stage] ON [dbo].[TaskStage]([taskId], [stage]);
```

## What Went Wrong?

SQL Server requires exact type matching for foreign key relationships. The `User.id` column type didn't match what was initially specified in the migration. By using `NVARCHAR(MAX)` (which matches the Prisma String type), the foreign key constraint now works correctly.

## After Setup

Once the table is created:
1. The Kanban board will be accessible via the **List/Kanban toggle** on the Tasks tab
2. Users can drag tasks between stages (if they have EDITOR+ permissions)
3. All stage changes are tracked with full history



