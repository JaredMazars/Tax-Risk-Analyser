-- ============================================================================
-- Migration: Restore Essential WIPTransactions Indexes
-- Date: 2026-01-27
-- ============================================================================
-- Purpose: Restore indexes that were incorrectly dropped
--
-- Context:
-- - The previous migration (20260127_drop_wiptransactions_redundant_indexes) 
--   incorrectly dropped indexes that ARE NEEDED for My Reports queries
-- - Super covering indexes have GSClientID/GSTaskID as first key column
-- - My Reports queries filter on TaskPartner/TaskManager (NOT GSClientID/GSTaskID)
-- - SQL Server requires first key column to match WHERE clause for index seek
-- - Therefore TaskPartner_TranDate and TaskManager_TranDate indexes are ESSENTIAL
--
-- Indexes Being Restored:
-- 1. WIPTransactions_TaskPartner_TranDate_idx (TaskPartner, TranDate)
--    - Required for: GET /api/my-reports/profitability (partner mode)
--    - Query: WHERE TaskPartner = @empCode AND TranDate >= @start AND TranDate <= @end
--
-- 2. WIPTransactions_TaskManager_TranDate_idx (TaskManager, TranDate) 
--    - Required for: GET /api/my-reports/profitability (manager mode)
--    - Query: WHERE TaskManager = @empCode AND TranDate >= @start AND TranDate <= @end
--
-- 3. WIPTransactions_TranDate_idx (TranDate)
--    - Required for: GET /api/reports/fiscal-transactions
--    - Query: WHERE TranDate >= @fiscalStart AND TranDate <= @fiscalEnd
--
-- Index Strategy Summary:
-- - idx_wip_gsclientid_super_covering: (GSClientID, TranDate) + INCLUDE - Client queries
-- - idx_wip_gstaskid_super_covering: (GSTaskID, TranDate) + INCLUDE - Task queries
-- - WIPTransactions_TaskPartner_TranDate_idx: Partner-based profitability reports
-- - WIPTransactions_TaskManager_TranDate_idx: Manager-based profitability reports
-- - WIPTransactions_TranDate_idx: Fiscal period date range queries
--
-- Performance Impact:
-- - Positive: My Reports queries will use index seeks instead of table scans
-- - Positive: Fiscal period queries will use index seeks
-- - Trade-off: 3 additional indexes to maintain on INSERT (acceptable)
--
-- Rollback: See rollback.sql in this folder
-- ============================================================================

-- Restore TaskPartner_TranDate index
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('WIPTransactions') AND name = 'WIPTransactions_TaskPartner_TranDate_idx')
BEGIN
    CREATE NONCLUSTERED INDEX [WIPTransactions_TaskPartner_TranDate_idx]
    ON [dbo].[WIPTransactions]([TaskPartner], [TranDate]);
    PRINT '✓ Created WIPTransactions_TaskPartner_TranDate_idx';
END
ELSE
BEGIN
    PRINT '○ WIPTransactions_TaskPartner_TranDate_idx already exists';
END

-- Restore TaskManager_TranDate index
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('WIPTransactions') AND name = 'WIPTransactions_TaskManager_TranDate_idx')
BEGIN
    CREATE NONCLUSTERED INDEX [WIPTransactions_TaskManager_TranDate_idx]
    ON [dbo].[WIPTransactions]([TaskManager], [TranDate]);
    PRINT '✓ Created WIPTransactions_TaskManager_TranDate_idx';
END
ELSE
BEGIN
    PRINT '○ WIPTransactions_TaskManager_TranDate_idx already exists';
END

-- Restore TranDate index
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('WIPTransactions') AND name = 'WIPTransactions_TranDate_idx')
BEGIN
    CREATE NONCLUSTERED INDEX [WIPTransactions_TranDate_idx]
    ON [dbo].[WIPTransactions]([TranDate]);
    PRINT '✓ Created WIPTransactions_TranDate_idx';
END
ELSE
BEGIN
    PRINT '○ WIPTransactions_TranDate_idx already exists';
END

PRINT 'Successfully restored essential WIPTransactions indexes';
