# Quick TaskStage Setup

## ✅ Current Status

The `TaskStage` table has been created successfully in the database with the correct structure.

## 🚀 Quick Initialization

To quickly populate the TaskStage table for all existing tasks, run this SQL script:

**File**: `quick_initialize_stages.sql`

### Steps:

1. Open **SQL Server Management Studio** or **Azure Data Studio**
2. Connect to your database
3. Open and run: `quick_initialize_stages.sql`

This script will:
- Find a system admin user (or any user if none found)
- Insert a DRAFT stage for all tasks that don't have one
- Use the task creator when available
- Complete in seconds (vs. hours with TypeScript)

### Verification

After running the script, verify:

```sql
-- Check total stages created
SELECT COUNT(*) as TotalStages FROM dbo.TaskStage;

-- Check stage distribution
SELECT 
    stage,
    COUNT(*) as count
FROM dbo.TaskStage
GROUP BY stage;

-- Check recent stages
SELECT TOP 10 
    ts.*,
    t.TaskCode,
    t.TaskDesc
FROM dbo.TaskStage ts
JOIN dbo.Task t ON ts.taskId = t.id
ORDER BY ts.createdAt DESC;
```

## 🎯 What's Working

✅ TaskStage table created
✅ Foreign keys and indexes in place
✅ Kanban board components implemented
✅ API endpoints ready
✅ UI toggle on Tasks and My Tasks tabs

## 🎨 Using the Kanban Board

Once the stages are initialized:

1. Navigate to any service line (e.g., `/dashboard/tax/TCN`)
2. Click on the **Tasks** or **My Tasks** tab
3. You'll see a **List/Kanban** toggle button
4. Click **Kanban** to switch to board view
5. Drag tasks between columns if you have EDITOR+ permissions

## 📊 Features Available

- **5 Stage Columns**: DRAFT, IN_PROGRESS, UNDER_REVIEW, COMPLETED, ARCHIVED
- **Drag & Drop**: Move tasks between stages (EDITOR+ only)
- **Card Display Modes**: Compact or Detailed view
- **Filters**: Search and filter by team member
- **Metrics**: Task count, budget hours, actual hours per column
- **Full History**: All stage changes are tracked

## ⚙️ Configuration

View preference is saved per service line in localStorage:
- Key format: `kanban-view-mode-{serviceLine}-{subServiceLineGroup}`
- Values: `'list'` or `'kanban'`

## 🔧 If Issues Occur

If the Kanban view shows errors:

1. **Restart the dev server** (Ctrl+C and `bun run dev`)
2. **Clear browser cache** and reload
3. **Verify table exists**:
   ```sql
   SELECT * FROM INFORMATION_SCHEMA.TABLES 
   WHERE TABLE_NAME = 'TaskStage';
   ```

## 📝 Technical Details

- **Database**: TaskStage table with full audit trail
- **API**: `/api/tasks/kanban` and `/api/tasks/[id]/stage`
- **Cache**: 10-minute cache for board data
- **Security**: Feature-based permissions (EDITOR+ to drag)
- **Libraries**: @dnd-kit for drag & drop







