-- ============================================================================
-- Profitability Optimization - Rollback Script
-- Created: 2026-02-01
-- Purpose: Remove indexes created by migration.sql
-- ============================================================================
--
-- USE THIS SCRIPT IF:
--   - Indexes are causing write performance issues
--   - Need to revert to previous state
--   - Storage constraints require removal
--
-- ============================================================================

SET NOCOUNT ON;
PRINT '========================================================================'
PRINT 'PROFITABILITY OPTIMIZATION - ROLLBACK'
PRINT 'Started: ' + CONVERT(VARCHAR, GETDATE(), 120)
PRINT '========================================================================'
PRINT ''
GO

-- ============================================================================
-- DROP INDEX 1: Employee Covering Index
-- ============================================================================
PRINT 'Dropping IX_Employee_Profitability_Covering...'

IF EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_Employee_Profitability_Covering' 
    AND object_id = OBJECT_ID('Employee')
)
BEGIN
    DROP INDEX IX_Employee_Profitability_Covering ON [dbo].[Employee];
    PRINT '  Dropped IX_Employee_Profitability_Covering'
END
ELSE
BEGIN
    PRINT '  IX_Employee_Profitability_Covering does not exist - skipping'
END
PRINT ''
GO

-- ============================================================================
-- DROP INDEX 2: WIPTransactions EmpCode Covering Index
-- ============================================================================
PRINT 'Dropping IX_WIPTransactions_EmpCode_Covering...'

IF EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_WIPTransactions_EmpCode_Covering' 
    AND object_id = OBJECT_ID('WIPTransactions')
)
BEGIN
    DROP INDEX IX_WIPTransactions_EmpCode_Covering ON [dbo].[WIPTransactions];
    PRINT '  Dropped IX_WIPTransactions_EmpCode_Covering'
END
ELSE
BEGIN
    PRINT '  IX_WIPTransactions_EmpCode_Covering does not exist - skipping'
END
PRINT ''
GO

-- ============================================================================
-- DROP INDEX 3: Task Profitability Covering Index
-- ============================================================================
PRINT 'Dropping IX_Task_Profitability_Covering...'

IF EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_Task_Profitability_Covering' 
    AND object_id = OBJECT_ID('Task')
)
BEGIN
    DROP INDEX IX_Task_Profitability_Covering ON [dbo].[Task];
    PRINT '  Dropped IX_Task_Profitability_Covering'
END
ELSE
BEGIN
    PRINT '  IX_Task_Profitability_Covering does not exist - skipping'
END
PRINT ''
GO

-- ============================================================================
-- DROP INDEX 4: Client Profitability Covering Index
-- ============================================================================
PRINT 'Dropping IX_Client_Profitability_Covering...'

IF EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_Client_Profitability_Covering' 
    AND object_id = OBJECT_ID('Client')
)
BEGIN
    DROP INDEX IX_Client_Profitability_Covering ON [dbo].[Client];
    PRINT '  Dropped IX_Client_Profitability_Covering'
END
ELSE
BEGIN
    PRINT '  IX_Client_Profitability_Covering does not exist - skipping'
END
PRINT ''
GO

-- ============================================================================
-- NOTE: idx_wip_profitability_covering is NOT dropped
-- This index existed before this migration and is used by other procedures
-- ============================================================================
PRINT 'NOTE: idx_wip_profitability_covering was NOT dropped (pre-existing index)'
PRINT ''
GO

-- ============================================================================
-- UPDATE STATISTICS
-- ============================================================================
PRINT 'Updating statistics...'
UPDATE STATISTICS [dbo].[Employee] WITH FULLSCAN;
UPDATE STATISTICS [dbo].[Task] WITH FULLSCAN;
UPDATE STATISTICS [dbo].[Client] WITH FULLSCAN;
UPDATE STATISTICS [dbo].[WIPTransactions] WITH FULLSCAN;
PRINT '  Statistics updated.'
PRINT ''
GO

PRINT '========================================================================'
PRINT 'ROLLBACK COMPLETE'
PRINT 'Finished: ' + CONVERT(VARCHAR, GETDATE(), 120)
PRINT '========================================================================'
PRINT ''
PRINT 'To restore the original stored procedure, run:'
PRINT '  prisma/procedures/sp_ProfitabilityData.sql'
PRINT ''
GO
