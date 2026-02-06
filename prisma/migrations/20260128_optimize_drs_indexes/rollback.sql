-- ============================================================================
-- Rollback: Restore Original DrsTransactions Indexes
-- Created: 2026-01-28
-- Description: Rollback to original index state if issues arise
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP NEW COVERING INDEXES
-- ============================================================================

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_drs_client_covering' AND object_id = OBJECT_ID('dbo.DrsTransactions'))
BEGIN
    DROP INDEX [idx_drs_client_covering] ON [dbo].[DrsTransactions];
    PRINT 'Dropped index: idx_drs_client_covering';
END

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_drs_biller_covering' AND object_id = OBJECT_ID('dbo.DrsTransactions'))
BEGIN
    DROP INDEX [idx_drs_biller_covering] ON [dbo].[DrsTransactions];
    PRINT 'Dropped index: idx_drs_biller_covering';
END

-- ============================================================================
-- STEP 2: RESTORE ORIGINAL SINGLE-COLUMN INDEXES
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'DrsTransactions_OfficeCode_idx' AND object_id = OBJECT_ID('dbo.DrsTransactions'))
BEGIN
    CREATE NONCLUSTERED INDEX [DrsTransactions_OfficeCode_idx]
    ON [dbo].[DrsTransactions]([OfficeCode]);
    PRINT 'Restored index: DrsTransactions_OfficeCode_idx';
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'DrsTransactions_PeriodKey_idx' AND object_id = OBJECT_ID('dbo.DrsTransactions'))
BEGIN
    CREATE NONCLUSTERED INDEX [DrsTransactions_PeriodKey_idx]
    ON [dbo].[DrsTransactions]([PeriodKey]);
    PRINT 'Restored index: DrsTransactions_PeriodKey_idx';
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'DrsTransactions_ServLineCode_idx' AND object_id = OBJECT_ID('dbo.DrsTransactions'))
BEGIN
    CREATE NONCLUSTERED INDEX [DrsTransactions_ServLineCode_idx]
    ON [dbo].[DrsTransactions]([ServLineCode]);
    PRINT 'Restored index: DrsTransactions_ServLineCode_idx';
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'DrsTransactions_TranDate_idx' AND object_id = OBJECT_ID('dbo.DrsTransactions'))
BEGIN
    CREATE NONCLUSTERED INDEX [DrsTransactions_TranDate_idx]
    ON [dbo].[DrsTransactions]([TranDate]);
    PRINT 'Restored index: DrsTransactions_TranDate_idx';
END

-- ============================================================================
-- STEP 3: RESTORE ORIGINAL COVERING INDEXES
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_drs_biller_super_covering' AND object_id = OBJECT_ID('dbo.DrsTransactions'))
BEGIN
    CREATE NONCLUSTERED INDEX [idx_drs_biller_super_covering]
    ON [dbo].[DrsTransactions]([Biller], [TranDate])
    INCLUDE ([Total], [EntryType], [ServLineCode], [InvNumber], [Reference])
    WHERE ([Biller] IS NOT NULL);
    PRINT 'Restored index: idx_drs_biller_super_covering';
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_drs_gsclientid_super_covering' AND object_id = OBJECT_ID('dbo.DrsTransactions'))
BEGIN
    CREATE NONCLUSTERED INDEX [idx_drs_gsclientid_super_covering]
    ON [dbo].[DrsTransactions]([GSClientID], [TranDate])
    INCLUDE ([Total], [EntryType], [InvNumber], [Reference], [ServLineCode], [Biller], [updatedAt])
    WHERE ([GSClientID] IS NOT NULL);
    PRINT 'Restored index: idx_drs_gsclientid_super_covering';
END

-- ============================================================================
-- STEP 4: UPDATE STATISTICS
-- ============================================================================

UPDATE STATISTICS [dbo].[DrsTransactions] WITH FULLSCAN;
PRINT 'Updated statistics for DrsTransactions table';
