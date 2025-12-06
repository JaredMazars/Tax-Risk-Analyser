-- Add composite indexes for list query performance optimization

-- Client table: optimize SubServiceLineGroup filtering via Task relationships
-- This helps when filtering clients by tasks in specific service line groups
CREATE NONCLUSTERED INDEX [Client_groupDesc_clientNameFull_idx] 
  ON [dbo].[Client]([groupDesc], [clientNameFull]);

-- Task table: composite index for common filter combinations
-- Optimizes queries filtering by ServLineCode and Active with sorting by updatedAt
CREATE NONCLUSTERED INDEX [Task_ServLineCode_Active_updatedAt_idx] 
  ON [dbo].[Task]([ServLineCode], [Active], [updatedAt] DESC);

-- Task table: composite index for client task queries
-- Optimizes queries for client detail pages showing tasks
CREATE NONCLUSTERED INDEX [Task_ClientCode_Active_updatedAt_idx]
  ON [dbo].[Task]([ClientCode], [Active], [updatedAt] DESC);

-- Task table: optimize search by task description
CREATE NONCLUSTERED INDEX [Task_TaskDesc_idx]
  ON [dbo].[Task]([TaskDesc]);

-- TaskTeam: optimize myTasksOnly queries with covering index
-- Include commonly selected fields to avoid lookups
CREATE NONCLUSTERED INDEX [TaskTeam_userId_taskId_role_idx] 
  ON [dbo].[TaskTeam]([userId], [taskId]) 
  INCLUDE ([role]);

-- Client table: optimize search queries
CREATE NONCLUSTERED INDEX [Client_industry_idx]
  ON [dbo].[Client]([industry]);

CREATE NONCLUSTERED INDEX [Client_sector_idx]
  ON [dbo].[Client]([sector]);

