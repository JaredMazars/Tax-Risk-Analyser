-- ============================================================================
-- Rollback: Recreate WIPTransactions Indexes
-- Date: 2026-01-27
-- ============================================================================
-- Use this script to restore the dropped indexes if needed
-- ============================================================================

-- Recreate WIPTransactions_TaskManager_TranDate_idx
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('WIPTransactions') AND name = 'WIPTransactions_TaskManager_TranDate_idx')
BEGIN
    CREATE NONCLUSTERED INDEX [WIPTransactions_TaskManager_TranDate_idx]
    ON [dbo].[WIPTransactions]([TaskManager], [TranDate]);
    PRINT '✓ Created WIPTransactions_TaskManager_TranDate_idx';
END
ELSE
BEGIN
    PRINT '⚠ WIPTransactions_TaskManager_TranDate_idx already exists';
END

-- Recreate WIPTransactions_TaskPartner_TranDate_idx
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('WIPTransactions') AND name = 'WIPTransactions_TaskPartner_TranDate_idx')
BEGIN
    CREATE NONCLUSTERED INDEX [WIPTransactions_TaskPartner_TranDate_idx]
    ON [dbo].[WIPTransactions]([TaskPartner], [TranDate]);
    PRINT '✓ Created WIPTransactions_TaskPartner_TranDate_idx';
END
ELSE
BEGIN
    PRINT '⚠ WIPTransactions_TaskPartner_TranDate_idx already exists';
END

-- Recreate WIPTransactions_TranDate_idx
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('WIPTransactions') AND name = 'WIPTransactions_TranDate_idx')
BEGIN
    CREATE NONCLUSTERED INDEX [WIPTransactions_TranDate_idx]
    ON [dbo].[WIPTransactions]([TranDate]);
    PRINT '✓ Created WIPTransactions_TranDate_idx';
END
ELSE
BEGIN
    PRINT '⚠ WIPTransactions_TranDate_idx already exists';
END

PRINT 'Rollback complete';
