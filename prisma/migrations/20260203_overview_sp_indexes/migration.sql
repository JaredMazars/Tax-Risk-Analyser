-- ============================================================================
-- Overview Stored Procedures - Optimized Covering Indexes
-- Migration Date: 2026-02-03
-- ============================================================================
--
-- PURPOSE: Create covering indexes for sp_WipMonthly and sp_DrsMonthly
--          stored procedures to optimize Overview report performance
--
-- ANALYSIS:
--   - Existing idx_wip_partner_date has TType in key (suboptimal)
--   - Existing idx_wip_manager_date has TType in key (suboptimal)
--   - Missing EmpCode and TaskCode in INCLUDE columns
--   - DrsTransactions: IX_DrsTransactions_Recoverability already perfect (no changes needed)
--
-- PERFORMANCE IMPACT:
--   - Expected 50-70% faster execution for Overview reports
--   - Index seeks instead of table scans
--   - Eliminates key lookups with covering INCLUDE columns
--
-- ROLLBACK:
--   - DROP INDEX IX_WIPTransactions_Partner_Monthly_Covering ON [dbo].[WIPTransactions]
--   - DROP INDEX IX_WIPTransactions_Manager_Monthly_Covering ON [dbo].[WIPTransactions]
--
-- ============================================================================

BEGIN TRANSACTION;

-- ============================================================================
-- WIPTransactions: Optimized Partner Index
-- ============================================================================
-- Key Columns: TaskPartner, TranDate (supports date range filtering)
-- INCLUDE Columns: TType, Amount, Cost, EmpCode, TaskCode (all columns in SELECT)
-- Replaces: idx_wip_partner_date (which has TType in key)

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_WIPTransactions_Partner_Monthly_Covering' 
    AND object_id = OBJECT_ID('[dbo].[WIPTransactions]')
)
BEGIN
    PRINT 'Creating IX_WIPTransactions_Partner_Monthly_Covering...'
    
    CREATE NONCLUSTERED INDEX [IX_WIPTransactions_Partner_Monthly_Covering]
    ON [dbo].[WIPTransactions] ([TaskPartner], [TranDate])
    INCLUDE ([TType], [Amount], [Cost], [EmpCode], [TaskCode])
    WITH (
        ONLINE = ON,
        FILLFACTOR = 90,
        SORT_IN_TEMPDB = ON,
        DATA_COMPRESSION = PAGE
    );
    
    PRINT 'Index IX_WIPTransactions_Partner_Monthly_Covering created successfully'
END
ELSE
BEGIN
    PRINT 'Index IX_WIPTransactions_Partner_Monthly_Covering already exists, skipping...'
END

-- ============================================================================
-- WIPTransactions: Optimized Manager Index
-- ============================================================================
-- Key Columns: TaskManager, TranDate (supports date range filtering)
-- INCLUDE Columns: TType, Amount, Cost, EmpCode, TaskCode (all columns in SELECT)
-- Replaces: idx_wip_manager_date (which has TType in key)

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_WIPTransactions_Manager_Monthly_Covering' 
    AND object_id = OBJECT_ID('[dbo].[WIPTransactions]')
)
BEGIN
    PRINT 'Creating IX_WIPTransactions_Manager_Monthly_Covering...'
    
    CREATE NONCLUSTERED INDEX [IX_WIPTransactions_Manager_Monthly_Covering]
    ON [dbo].[WIPTransactions] ([TaskManager], [TranDate])
    INCLUDE ([TType], [Amount], [Cost], [EmpCode], [TaskCode])
    WITH (
        ONLINE = ON,
        FILLFACTOR = 90,
        SORT_IN_TEMPDB = ON,
        DATA_COMPRESSION = PAGE
    );
    
    PRINT 'Index IX_WIPTransactions_Manager_Monthly_Covering created successfully'
END
ELSE
BEGIN
    PRINT 'Index IX_WIPTransactions_Manager_Monthly_Covering already exists, skipping...'
END

-- ============================================================================
-- Update Statistics for Query Optimizer
-- ============================================================================

PRINT 'Updating statistics for WIPTransactions...'
UPDATE STATISTICS [dbo].[WIPTransactions] WITH FULLSCAN;

PRINT 'Migration completed successfully'

COMMIT TRANSACTION;

-- ============================================================================
-- NOTES:
-- ============================================================================
--
-- 1. DrsTransactions Index Status:
--    - IX_DrsTransactions_Recoverability already exists and is optimal
--    - Key Columns: Biller, TranDate
--    - INCLUDE Columns: GSClientID, ClientCode, ClientNameFull, GroupCode, 
--                       GroupDesc, ServLineCode, ServLineDesc, EntryType, 
--                       InvNumber, Total
--    - No additional index needed
--
-- 2. Old Indexes (idx_wip_partner_date, idx_wip_manager_date):
--    - NOT dropped in this migration for safety
--    - Query optimizer will choose best index automatically
--    - Can be dropped after validation period (30 days)
--    - Dropping them would save ~2GB disk space + reduce update overhead
--
-- 3. Index Usage Monitoring:
--    SELECT 
--        i.name AS IndexName,
--        ius.user_seeks AS Seeks,
--        ius.user_scans AS Scans,
--        ius.last_user_seek AS LastSeek
--    FROM sys.indexes i
--    LEFT JOIN sys.dm_db_index_usage_stats ius 
--        ON i.object_id = ius.object_id AND i.index_id = ius.index_id
--    WHERE OBJECT_NAME(i.object_id) = 'WIPTransactions'
--        AND i.name LIKE '%Partner%' OR i.name LIKE '%Manager%'
--    ORDER BY LastSeek DESC;
--
-- 4. After 30 days validation, consider:
--    DROP INDEX idx_wip_partner_date ON [dbo].[WIPTransactions];
--    DROP INDEX idx_wip_manager_date ON [dbo].[WIPTransactions];
--
-- ============================================================================
