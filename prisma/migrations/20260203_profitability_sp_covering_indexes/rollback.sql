-- ============================================================================
-- Rollback: Profitability SP Covering Indexes
-- ============================================================================
-- 
-- This script removes the covering indexes created by the migration.
-- Note: Old partial indexes are retained (idx_wip_manager_date, idx_wip_serviceline)
--
-- ============================================================================

SET NOCOUNT ON;

PRINT 'Removing Profitability SP covering indexes...';

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_WIPTransactions_GroupCode_Covering' AND object_id = OBJECT_ID('WIPTransactions'))
BEGIN
    DROP INDEX [IX_WIPTransactions_GroupCode_Covering] ON [dbo].[WIPTransactions];
    PRINT 'Dropped IX_WIPTransactions_GroupCode_Covering';
END

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_WIPTransactions_Manager_Covering' AND object_id = OBJECT_ID('WIPTransactions'))
BEGIN
    DROP INDEX [IX_WIPTransactions_Manager_Covering] ON [dbo].[WIPTransactions];
    PRINT 'Dropped IX_WIPTransactions_Manager_Covering';
END

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_WIPTransactions_ServLine_Covering' AND object_id = OBJECT_ID('WIPTransactions'))
BEGIN
    DROP INDEX [IX_WIPTransactions_ServLine_Covering] ON [dbo].[WIPTransactions];
    PRINT 'Dropped IX_WIPTransactions_ServLine_Covering';
END

PRINT '';
PRINT 'Rollback completed. Old partial indexes (idx_wip_manager_date, idx_wip_serviceline) are still available.';
GO
