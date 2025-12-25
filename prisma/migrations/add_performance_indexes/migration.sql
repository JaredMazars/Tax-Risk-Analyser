-- Performance Optimization Indexes
-- Phase 1: Critical indexes for task queries and WIP calculations

-- Task queries optimization
-- Covers common query patterns: filtering by service line and active status
CREATE INDEX IF NOT EXISTS idx_task_servlinecode_active 
ON Task(ServLineCode, Active) 
INCLUDE (TaskPartner, TaskManager);

-- Client task lookups
CREATE INDEX IF NOT EXISTS idx_task_gsclientid 
ON Task(GSClientID);

-- Task team member lookups
CREATE INDEX IF NOT EXISTS idx_taskteam_userid_taskid 
ON TaskTeam(userId, taskId);

-- WIP transactions - CRITICAL for SQL-based WIP aggregation
-- Primary lookup index
CREATE INDEX IF NOT EXISTS idx_wiptransactions_gstaskid 
ON WIPTransactions(GSTaskID);

-- Composite index for WIP aggregation with TType filtering
CREATE INDEX IF NOT EXISTS idx_wiptransactions_gstaskid_ttype 
ON WIPTransactions(GSTaskID, TType) 
INCLUDE (Amount);

-- Client-level WIP aggregation
CREATE INDEX IF NOT EXISTS idx_wiptransactions_gsclientid 
ON WIPTransactions(GSClientID);

-- Employee lookups for partner/manager name resolution
CREATE INDEX IF NOT EXISTS idx_employee_empcode_active 
ON Employee(EmpCode, Active) 
INCLUDE (EmpName);

-- TaskStage optimization for latest stage detection
CREATE INDEX IF NOT EXISTS idx_taskstage_taskid_created 
ON TaskStage(taskId, createdAt DESC);

-- Employee WinLogon lookup for user matching
CREATE INDEX IF NOT EXISTS idx_employee_winlogon 
ON Employee(WinLogon) 
WHERE WinLogon IS NOT NULL;

