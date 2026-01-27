-- ============================================================================
-- Rollback: Restore Essential WIPTransactions Indexes
-- Date: 2026-01-27
-- ============================================================================
-- WARNING: Only use this rollback if you need to revert to the state where
-- these indexes don't exist. This is NOT recommended for production.
-- ============================================================================

-- Drop indexes if they exist
IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('WIPTransactions') AND name = 'WIPTransactions_TaskPartner_TranDate_idx')
BEGIN
    DROP INDEX [WIPTransactions_TaskPartner_TranDate_idx] ON [dbo].[WIPTransactions];
    PRINT '✓ Dropped WIPTransactions_TaskPartner_TranDate_idx';
END

IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('WIPTransactions') AND name = 'WIPTransactions_TaskManager_TranDate_idx')
BEGIN
    DROP INDEX [WIPTransactions_TaskManager_TranDate_idx] ON [dbo].[WIPTransactions];
    PRINT '✓ Dropped WIPTransactions_TaskManager_TranDate_idx';
END

IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('WIPTransactions') AND name = 'WIPTransactions_TranDate_idx')
BEGIN
    DROP INDEX [WIPTransactions_TranDate_idx] ON [dbo].[WIPTransactions];
    PRINT '✓ Dropped WIPTransactions_TranDate_idx';
END

PRINT 'Rollback complete - indexes dropped';
