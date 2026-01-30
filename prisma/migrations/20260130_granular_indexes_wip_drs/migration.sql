-- ============================================================================
-- Migration: Granular Indexes for WIPTransactions and DrsTransactions
-- Created: 2026-01-30
-- Description: Replace comprehensive covering indexes with granular indexes
--              aligned to specific query patterns used in My Reports
-- ============================================================================
--
-- STRATEGY:
-- Replace 2 comprehensive covering indexes per table with multiple granular
-- indexes, each optimized for a specific query pattern.
--
-- BENEFITS:
-- - Each index optimized for specific use case
-- - Smaller individual index sizes
-- - Easier to maintain and understand
-- - Clear mapping: query pattern → index
-- - Can drop unused indexes without affecting others
--
-- ESTIMATED TIME: 5-8 minutes
-- - WIPTransactions drops: ~30 seconds
-- - WIPTransactions creates: ~4-5 minutes (6 indexes)
-- - DrsTransactions drops: ~15 seconds
-- - DrsTransactions creates: ~1-2 minutes (3 indexes)
--
-- DEPLOYMENT: Run during maintenance window with ONLINE = ON (minimal blocking)
-- ============================================================================

SET NOCOUNT ON;
GO

PRINT '============================================================================';
PRINT 'Granular Index Migration for WIPTransactions and DrsTransactions';
PRINT 'Started: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '============================================================================';
PRINT '';

-- ============================================================================
-- PART 1: WIPTransactions Index Optimization
-- ============================================================================

PRINT '============================================================================';
PRINT 'PART 1: WIPTransactions (5.7M rows)';
PRINT '============================================================================';
PRINT '';

-- ============================================================================
-- STEP 1.1: DROP EXISTING COMPREHENSIVE COVERING INDEXES
-- ============================================================================

PRINT '-- STEP 1.1: Dropping existing comprehensive covering indexes...';
PRINT '';

IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('WIPTransactions') AND name = 'idx_WIPTransactions_Task_Covering')
BEGIN
    PRINT '  Dropping: idx_WIPTransactions_Task_Covering (395 MB)';
    DROP INDEX [idx_WIPTransactions_Task_Covering] ON [dbo].[WIPTransactions];
    PRINT '  ✓ Dropped';
END
ELSE
BEGIN
    PRINT '  Index idx_WIPTransactions_Task_Covering does not exist (already dropped)';
END

IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('WIPTransactions') AND name = 'idx_WIPTransactions_Date_EmpCode_Client_Covering')
BEGIN
    PRINT '  Dropping: idx_WIPTransactions_Date_EmpCode_Client_Covering (795 MB)';
    DROP INDEX [idx_WIPTransactions_Date_EmpCode_Client_Covering] ON [dbo].[WIPTransactions];
    PRINT '  ✓ Dropped';
END
ELSE
BEGIN
    PRINT '  Index idx_WIPTransactions_Date_EmpCode_Client_Covering does not exist (already dropped)';
END

PRINT '';
PRINT 'Completed dropping old WIPTransactions indexes';
PRINT '';

-- ============================================================================
-- STEP 1.2: CREATE NEW GRANULAR INDEXES FOR WIPTRANSACTIONS
-- ============================================================================

PRINT '-- STEP 1.2: Creating 6 new granular indexes for WIPTransactions...';
PRINT '';

-- Index 1: Task-centric queries (most common)
-- Serves: /api/tasks/[id]/wip, /api/tasks/[id]/transactions, /api/tasks/[id]/balances
PRINT '  [1/6] Creating idx_wip_task...';
PRINT '        Keys: (GSTaskID, TranDate)';
PRINT '        Use: Single task queries, task transactions';

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('WIPTransactions') AND name = 'idx_wip_task')
BEGIN
    CREATE NONCLUSTERED INDEX [idx_wip_task]
    ON [dbo].[WIPTransactions] (
        [GSTaskID],
        [TranDate]
    )
    INCLUDE (
        [Amount],
        [Cost],
        [Hour],
        [TType],
        [updatedAt]
    )
    WITH (
        DATA_COMPRESSION = PAGE,
        FILLFACTOR = 95,
        ONLINE = ON,
        SORT_IN_TEMPDB = ON,
        MAXDOP = 0
    );
    PRINT '        ✓ Created (~50-60 MB)';
END
ELSE
BEGIN
    PRINT '        Index already exists';
END
PRINT '';

-- Index 2: Client-centric queries
-- Serves: /api/clients/[id]/wip, /api/clients/[id]/balances, /api/clients/[id]/analytics
PRINT '  [2/6] Creating idx_wip_client...';
PRINT '        Keys: (GSClientID, TranDate)';
PRINT '        Use: Client WIP queries, client analytics';

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('WIPTransactions') AND name = 'idx_wip_client')
BEGIN
    CREATE NONCLUSTERED INDEX [idx_wip_client]
    ON [dbo].[WIPTransactions] (
        [GSClientID],
        [TranDate]
    )
    INCLUDE (
        [Amount],
        [Cost],
        [Hour],
        [TType],
        [GSTaskID],
        [TaskServLine],
        [updatedAt]
    )
    WITH (
        DATA_COMPRESSION = PAGE,
        FILLFACTOR = 95,
        ONLINE = ON,
        SORT_IN_TEMPDB = ON,
        MAXDOP = 0
    );
    PRINT '        ✓ Created (~70-80 MB)';
END
ELSE
BEGIN
    PRINT '        Index already exists';
END
PRINT '';

-- Index 3: My Reports - Task Partner (profitability for CARL/DIR/Local)
-- Serves: /api/my-reports/profitability (CARL/DIR/Local employees)
PRINT '  [3/6] Creating idx_wip_partner_date...';
PRINT '        Keys: (TaskPartner, TranDate)';
PRINT '        Use: Profitability reports for partners';

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('WIPTransactions') AND name = 'idx_wip_partner_date')
BEGIN
    CREATE NONCLUSTERED INDEX [idx_wip_partner_date]
    ON [dbo].[WIPTransactions] (
        [TaskPartner],
        [TranDate]
    )
    INCLUDE (
        [GSTaskID],
        [Amount],
        [Cost],
        [Hour],
        [TType],
        [GSClientID],
        [ClientCode],
        [ClientName],
        [TaskCode],
        [TaskServLine]
    )
    WITH (
        DATA_COMPRESSION = PAGE,
        FILLFACTOR = 90,
        ONLINE = ON,
        SORT_IN_TEMPDB = ON,
        MAXDOP = 0
    );
    PRINT '        ✓ Created (~100-120 MB)';
END
ELSE
BEGIN
    PRINT '        Index already exists';
END
PRINT '';

-- Index 4: My Reports - Task Manager (profitability for others)
-- Serves: /api/my-reports/profitability (non-CARL/DIR/Local employees)
PRINT '  [4/6] Creating idx_wip_manager_date...';
PRINT '        Keys: (TaskManager, TranDate)';
PRINT '        Use: Profitability reports for managers';

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('WIPTransactions') AND name = 'idx_wip_manager_date')
BEGIN
    CREATE NONCLUSTERED INDEX [idx_wip_manager_date]
    ON [dbo].[WIPTransactions] (
        [TaskManager],
        [TranDate]
    )
    INCLUDE (
        [GSTaskID],
        [Amount],
        [Cost],
        [Hour],
        [TType],
        [GSClientID],
        [ClientCode],
        [ClientName],
        [TaskCode],
        [TaskServLine]
    )
    WITH (
        DATA_COMPRESSION = PAGE,
        FILLFACTOR = 90,
        ONLINE = ON,
        SORT_IN_TEMPDB = ON,
        MAXDOP = 0
    );
    PRINT '        ✓ Created (~100-120 MB)';
END
ELSE
BEGIN
    PRINT '        Index already exists';
END
PRINT '';

-- Index 5: Date-range fiscal reports
-- Serves: /api/reports/fiscal-transactions, date-based rollups
PRINT '  [5/6] Creating idx_wip_date...';
PRINT '        Keys: (TranDate, GSClientID, GSTaskID)';
PRINT '        Use: Date range queries, fiscal reports';

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('WIPTransactions') AND name = 'idx_wip_date')
BEGIN
    CREATE NONCLUSTERED INDEX [idx_wip_date]
    ON [dbo].[WIPTransactions] (
        [TranDate],
        [GSClientID],
        [GSTaskID]
    )
    INCLUDE (
        [Amount],
        [Cost],
        [Hour],
        [TType],
        [EmpCode]
    )
    WITH (
        DATA_COMPRESSION = PAGE,
        FILLFACTOR = 90,
        ONLINE = ON,
        SORT_IN_TEMPDB = ON,
        MAXDOP = 0
    );
    PRINT '        ✓ Created (~80-100 MB)';
END
ELSE
BEGIN
    PRINT '        Index already exists';
END
PRINT '';

-- Index 6: Employee time accumulation
-- Serves: /api/tasks/[id]/analytics/time-accumulation
PRINT '  [6/6] Creating idx_wip_emp_date...';
PRINT '        Keys: (EmpCode, TranDate, TType)';
PRINT '        Use: Employee time tracking, time accumulation';

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('WIPTransactions') AND name = 'idx_wip_emp_date')
BEGIN
    CREATE NONCLUSTERED INDEX [idx_wip_emp_date]
    ON [dbo].[WIPTransactions] (
        [EmpCode],
        [TranDate],
        [TType]
    )
    INCLUDE (
        [GSTaskID],
        [Hour],
        [Amount]
    )
    WHERE ([EmpCode] IS NOT NULL)
    WITH (
        DATA_COMPRESSION = PAGE,
        FILLFACTOR = 90,
        ONLINE = ON,
        SORT_IN_TEMPDB = ON,
        MAXDOP = 0
    );
    PRINT '        ✓ Created (~60-80 MB, filtered)';
END
ELSE
BEGIN
    PRINT '        Index already exists';
END
PRINT '';

PRINT 'Completed creating 6 WIPTransactions indexes';
PRINT 'Total estimated size: ~600-700 MB (down from 1,190 MB)';
PRINT '';

-- ============================================================================
-- STEP 1.3: UPDATE STATISTICS FOR WIPTRANSACTIONS
-- ============================================================================

PRINT '-- STEP 1.3: Updating statistics for WIPTransactions indexes...';
PRINT '';

UPDATE STATISTICS [dbo].[WIPTransactions] [idx_wip_task] WITH FULLSCAN;
UPDATE STATISTICS [dbo].[WIPTransactions] [idx_wip_client] WITH FULLSCAN;
UPDATE STATISTICS [dbo].[WIPTransactions] [idx_wip_partner_date] WITH FULLSCAN;
UPDATE STATISTICS [dbo].[WIPTransactions] [idx_wip_manager_date] WITH FULLSCAN;
UPDATE STATISTICS [dbo].[WIPTransactions] [idx_wip_date] WITH FULLSCAN;
UPDATE STATISTICS [dbo].[WIPTransactions] [idx_wip_emp_date] WITH FULLSCAN;

PRINT '✓ Statistics updated for all WIPTransactions indexes';
PRINT '';

-- ============================================================================
-- PART 2: DrsTransactions Index Optimization
-- ============================================================================

PRINT '============================================================================';
PRINT 'PART 2: DrsTransactions';
PRINT '============================================================================';
PRINT '';

-- ============================================================================
-- STEP 2.1: DROP EXISTING COMPREHENSIVE COVERING INDEXES
-- ============================================================================

PRINT '-- STEP 2.1: Dropping existing comprehensive covering indexes...';
PRINT '';

IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('DrsTransactions') AND name = 'idx_drs_client_covering')
BEGIN
    PRINT '  Dropping: idx_drs_client_covering';
    DROP INDEX [idx_drs_client_covering] ON [dbo].[DrsTransactions];
    PRINT '  ✓ Dropped';
END
ELSE
BEGIN
    PRINT '  Index idx_drs_client_covering does not exist (already dropped)';
END

IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('DrsTransactions') AND name = 'idx_drs_biller_covering')
BEGIN
    PRINT '  Dropping: idx_drs_biller_covering';
    DROP INDEX [idx_drs_biller_covering] ON [dbo].[DrsTransactions];
    PRINT '  ✓ Dropped';
END
ELSE
BEGIN
    PRINT '  Index idx_drs_biller_covering does not exist (already dropped)';
END

PRINT '';
PRINT 'Completed dropping old DrsTransactions indexes';
PRINT '';

-- ============================================================================
-- STEP 2.2: CREATE NEW GRANULAR INDEXES FOR DRSTRANSACTIONS
-- ============================================================================

PRINT '-- STEP 2.2: Creating 3 new granular indexes for DrsTransactions...';
PRINT '';

-- Index 1: My Reports - Recoverability (Biller-based)
-- Serves: /api/my-reports/recoverability, /api/my-reports/overview
PRINT '  [1/3] Creating idx_drs_biller_date...';
PRINT '        Keys: (Biller, TranDate)';
PRINT '        Use: Recoverability reports, biller-based queries';

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('DrsTransactions') AND name = 'idx_drs_biller_date')
BEGIN
    CREATE NONCLUSTERED INDEX [idx_drs_biller_date]
    ON [dbo].[DrsTransactions] (
        [Biller],
        [TranDate]
    )
    INCLUDE (
        [Total],
        [EntryType],
        [InvNumber],
        [Reference],
        [GSClientID],
        [ClientCode],
        [ClientNameFull],
        [GroupCode],
        [GroupDesc],
        [ServLineCode]
    )
    WHERE ([Biller] IS NOT NULL)
    WITH (
        DATA_COMPRESSION = PAGE,
        FILLFACTOR = 90,
        ONLINE = ON,
        SORT_IN_TEMPDB = ON,
        MAXDOP = 0
    );
    PRINT '        ✓ Created (~100-120 MB, filtered)';
END
ELSE
BEGIN
    PRINT '        Index already exists';
END
PRINT '';

-- Index 2: Client debtors queries
-- Serves: /api/clients/[id]/debtors, /api/clients/[id]/balances, /api/clients/[id]/debtors/details
PRINT '  [2/3] Creating idx_drs_client_date...';
PRINT '        Keys: (GSClientID, TranDate)';
PRINT '        Use: Client debtor queries, balances';

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('DrsTransactions') AND name = 'idx_drs_client_date')
BEGIN
    CREATE NONCLUSTERED INDEX [idx_drs_client_date]
    ON [dbo].[DrsTransactions] (
        [GSClientID],
        [TranDate]
    )
    INCLUDE (
        [Total],
        [EntryType],
        [InvNumber],
        [Reference],
        [Biller],
        [ClientCode],
        [ClientNameFull],
        [GroupCode],
        [GroupDesc],
        [ServLineCode],
        [updatedAt]
    )
    WHERE ([GSClientID] IS NOT NULL)
    WITH (
        DATA_COMPRESSION = PAGE,
        FILLFACTOR = 95,
        ONLINE = ON,
        SORT_IN_TEMPDB = ON,
        MAXDOP = 0
    );
    PRINT '        ✓ Created (~120-150 MB, filtered)';
END
ELSE
BEGIN
    PRINT '        Index already exists';
END
PRINT '';

-- Index 3: Group rollups (multiple clients)
-- Serves: /api/groups/[groupCode]/debtors
PRINT '  [3/3] Creating idx_drs_client_group...';
PRINT '        Keys: (GSClientID, GroupCode, TranDate)';
PRINT '        Use: Group-level debtor rollups';

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('DrsTransactions') AND name = 'idx_drs_client_group')
BEGIN
    CREATE NONCLUSTERED INDEX [idx_drs_client_group]
    ON [dbo].[DrsTransactions] (
        [GSClientID],
        [GroupCode],
        [TranDate]
    )
    INCLUDE (
        [Total],
        [EntryType],
        [ServLineCode],
        [ClientCode]
    )
    WHERE ([GSClientID] IS NOT NULL)
    WITH (
        DATA_COMPRESSION = PAGE,
        FILLFACTOR = 95,
        ONLINE = ON,
        SORT_IN_TEMPDB = ON,
        MAXDOP = 0
    );
    PRINT '        ✓ Created (~80-100 MB, filtered)';
END
ELSE
BEGIN
    PRINT '        Index already exists';
END
PRINT '';

PRINT 'Completed creating 3 DrsTransactions indexes';
PRINT 'Total estimated size: ~300-400 MB';
PRINT '';

-- ============================================================================
-- STEP 2.3: UPDATE STATISTICS FOR DRSTRANSACTIONS
-- ============================================================================

PRINT '-- STEP 2.3: Updating statistics for DrsTransactions indexes...';
PRINT '';

UPDATE STATISTICS [dbo].[DrsTransactions] [idx_drs_biller_date] WITH FULLSCAN;
UPDATE STATISTICS [dbo].[DrsTransactions] [idx_drs_client_date] WITH FULLSCAN;
UPDATE STATISTICS [dbo].[DrsTransactions] [idx_drs_client_group] WITH FULLSCAN;

PRINT '✓ Statistics updated for all DrsTransactions indexes';
PRINT '';

-- ============================================================================
-- VERIFICATION: Show final index state
-- ============================================================================

PRINT '============================================================================';
PRINT 'VERIFICATION: Final Index State';
PRINT '============================================================================';
PRINT '';

PRINT '-- WIPTransactions Indexes:';
SELECT 
    i.name AS IndexName,
    i.type_desc AS IndexType,
    STUFF((
        SELECT ', ' + c.name
        FROM sys.index_columns ic
        JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
        WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 0
        ORDER BY ic.key_ordinal
        FOR XML PATH('')
    ), 1, 2, '') AS KeyColumns,
    (SELECT COUNT(*) 
     FROM sys.index_columns ic 
     WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 1) AS IncludeCount
FROM sys.indexes i
WHERE i.object_id = OBJECT_ID('dbo.WIPTransactions')
    AND i.type_desc = 'NONCLUSTERED'
    AND i.name LIKE 'idx_wip%'
ORDER BY i.name;

PRINT '';
PRINT '-- DrsTransactions Indexes:';
SELECT 
    i.name AS IndexName,
    i.type_desc AS IndexType,
    STUFF((
        SELECT ', ' + c.name
        FROM sys.index_columns ic
        JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
        WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 0
        ORDER BY ic.key_ordinal
        FOR XML PATH('')
    ), 1, 2, '') AS KeyColumns,
    (SELECT COUNT(*) 
     FROM sys.index_columns ic 
     WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 1) AS IncludeCount
FROM sys.indexes i
WHERE i.object_id = OBJECT_ID('dbo.DrsTransactions')
    AND i.type_desc = 'NONCLUSTERED'
    AND i.name LIKE 'idx_drs%'
ORDER BY i.name;

PRINT '';
PRINT '============================================================================';
PRINT 'Migration Complete!';
PRINT 'Completed: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '============================================================================';
PRINT '';
PRINT 'Next Steps:';
PRINT '1. Run verify_indexes.sql to test query plans';
PRINT '2. Monitor Azure SQL Query Performance Insights';
PRINT '3. Check My Reports response times';
PRINT '4. Review index usage stats after 1 week';
PRINT '';
GO
