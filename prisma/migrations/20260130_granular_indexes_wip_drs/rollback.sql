-- ============================================================================
-- Rollback: Restore Previous Comprehensive Covering Indexes
-- Migration: 20260130_granular_indexes_wip_drs
-- Created: 2026-01-30
-- ============================================================================
--
-- This script restores the previous comprehensive covering indexes that were
-- replaced by the granular index migration. Use this if the new indexes
-- underperform or cause issues.
--
-- ESTIMATED TIME: 4-6 minutes
-- DEPLOYMENT: Run during maintenance window with ONLINE = ON
-- ============================================================================

SET NOCOUNT ON;
GO

PRINT '============================================================================';
PRINT 'ROLLBACK: Restoring Previous Comprehensive Covering Indexes';
PRINT 'Started: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '============================================================================';
PRINT '';

-- ============================================================================
-- PART 1: WIPTransactions Rollback
-- ============================================================================

PRINT '============================================================================';
PRINT 'PART 1: WIPTransactions Rollback';
PRINT '============================================================================';
PRINT '';

-- ============================================================================
-- STEP 1.1: DROP NEW GRANULAR INDEXES
-- ============================================================================

PRINT '-- STEP 1.1: Dropping new granular indexes...';
PRINT '';

IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('WIPTransactions') AND name = 'idx_wip_task')
BEGIN
    PRINT '  Dropping: idx_wip_task';
    DROP INDEX [idx_wip_task] ON [dbo].[WIPTransactions];
    PRINT '  ✓ Dropped';
END

IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('WIPTransactions') AND name = 'idx_wip_client')
BEGIN
    PRINT '  Dropping: idx_wip_client';
    DROP INDEX [idx_wip_client] ON [dbo].[WIPTransactions];
    PRINT '  ✓ Dropped';
END

IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('WIPTransactions') AND name = 'idx_wip_partner_date')
BEGIN
    PRINT '  Dropping: idx_wip_partner_date';
    DROP INDEX [idx_wip_partner_date] ON [dbo].[WIPTransactions];
    PRINT '  ✓ Dropped';
END

IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('WIPTransactions') AND name = 'idx_wip_manager_date')
BEGIN
    PRINT '  Dropping: idx_wip_manager_date';
    DROP INDEX [idx_wip_manager_date] ON [dbo].[WIPTransactions];
    PRINT '  ✓ Dropped';
END

IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('WIPTransactions') AND name = 'idx_wip_date')
BEGIN
    PRINT '  Dropping: idx_wip_date';
    DROP INDEX [idx_wip_date] ON [dbo].[WIPTransactions];
    PRINT '  ✓ Dropped';
END

IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('WIPTransactions') AND name = 'idx_wip_emp_date')
BEGIN
    PRINT '  Dropping: idx_wip_emp_date';
    DROP INDEX [idx_wip_emp_date] ON [dbo].[WIPTransactions];
    PRINT '  ✓ Dropped';
END

PRINT '';
PRINT 'Completed dropping granular WIPTransactions indexes';
PRINT '';

-- ============================================================================
-- STEP 1.2: RESTORE PREVIOUS COMPREHENSIVE COVERING INDEXES
-- ============================================================================

PRINT '-- STEP 1.2: Restoring previous comprehensive covering indexes...';
PRINT '';

-- Restore Index 1: idx_WIPTransactions_Task_Covering
PRINT '  [1/2] Restoring idx_WIPTransactions_Task_Covering...';
PRINT '        Keys: (GSTaskID, TranDate)';
PRINT '        INCLUDE: 20 columns';

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('WIPTransactions') AND name = 'idx_WIPTransactions_Task_Covering')
BEGIN
    CREATE NONCLUSTERED INDEX [idx_WIPTransactions_Task_Covering]
    ON [dbo].[WIPTransactions] (
        [GSTaskID], 
        [TranDate]
    )
    INCLUDE (
        [GSClientID],
        [EmpCode],
        [Amount],
        [Cost],
        [Hour],
        [TType],
        [TaskServLine],
        [TaskPartner],
        [TaskManager],
        [OfficeCode],
        [ClientCode],
        [ClientName],
        [TaskCode],
        [TaskDesc],
        [PartnerName],
        [ManagerName],
        [updatedAt],
        [TranType],
        [Ref],
        [ServLineGroup]
    )
    WITH (
        ONLINE = ON,
        DATA_COMPRESSION = PAGE,
        FILLFACTOR = 95,
        SORT_IN_TEMPDB = ON,
        MAXDOP = 0
    );
    PRINT '        ✓ Created (~395 MB)';
END
ELSE
BEGIN
    PRINT '        Index already exists';
END
PRINT '';

-- Restore Index 2: idx_WIPTransactions_Date_EmpCode_Client_Covering
PRINT '  [2/2] Restoring idx_WIPTransactions_Date_EmpCode_Client_Covering...';
PRINT '        Keys: (TranDate, EmpCode, GSClientID)';
PRINT '        INCLUDE: 14 columns';

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('WIPTransactions') AND name = 'idx_WIPTransactions_Date_EmpCode_Client_Covering')
BEGIN
    CREATE NONCLUSTERED INDEX [idx_WIPTransactions_Date_EmpCode_Client_Covering]
    ON [dbo].[WIPTransactions] (
        [TranDate],
        [EmpCode],
        [GSClientID]
    )
    INCLUDE (
        [GSTaskID],
        [Amount],
        [Cost],
        [Hour],
        [TType],
        [TaskServLine],
        [TaskPartner],
        [TaskManager],
        [OfficeCode],
        [ServLineGroup],
        [updatedAt],
        [ClientCode],
        [ClientName],
        [TaskCode]
    )
    WITH (
        ONLINE = ON,
        DATA_COMPRESSION = PAGE,
        FILLFACTOR = 90,
        SORT_IN_TEMPDB = ON,
        MAXDOP = 0
    );
    PRINT '        ✓ Created (~795 MB)';
END
ELSE
BEGIN
    PRINT '        Index already exists';
END
PRINT '';

PRINT 'Completed restoring WIPTransactions covering indexes';
PRINT 'Total size: ~1,190 MB';
PRINT '';

-- ============================================================================
-- STEP 1.3: UPDATE STATISTICS FOR WIPTRANSACTIONS
-- ============================================================================

PRINT '-- STEP 1.3: Updating statistics for WIPTransactions...';
PRINT '';

UPDATE STATISTICS [dbo].[WIPTransactions] [idx_WIPTransactions_Task_Covering] WITH FULLSCAN;
UPDATE STATISTICS [dbo].[WIPTransactions] [idx_WIPTransactions_Date_EmpCode_Client_Covering] WITH FULLSCAN;

PRINT '✓ Statistics updated';
PRINT '';

-- ============================================================================
-- PART 2: DrsTransactions Rollback
-- ============================================================================

PRINT '============================================================================';
PRINT 'PART 2: DrsTransactions Rollback';
PRINT '============================================================================';
PRINT '';

-- ============================================================================
-- STEP 2.1: DROP NEW GRANULAR INDEXES
-- ============================================================================

PRINT '-- STEP 2.1: Dropping new granular indexes...';
PRINT '';

IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('DrsTransactions') AND name = 'idx_drs_biller_date')
BEGIN
    PRINT '  Dropping: idx_drs_biller_date';
    DROP INDEX [idx_drs_biller_date] ON [dbo].[DrsTransactions];
    PRINT '  ✓ Dropped';
END

IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('DrsTransactions') AND name = 'idx_drs_client_date')
BEGIN
    PRINT '  Dropping: idx_drs_client_date';
    DROP INDEX [idx_drs_client_date] ON [dbo].[DrsTransactions];
    PRINT '  ✓ Dropped';
END

IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('DrsTransactions') AND name = 'idx_drs_client_group')
BEGIN
    PRINT '  Dropping: idx_drs_client_group';
    DROP INDEX [idx_drs_client_group] ON [dbo].[DrsTransactions];
    PRINT '  ✓ Dropped';
END

PRINT '';
PRINT 'Completed dropping granular DrsTransactions indexes';
PRINT '';

-- ============================================================================
-- STEP 2.2: RESTORE PREVIOUS COMPREHENSIVE COVERING INDEXES
-- ============================================================================

PRINT '-- STEP 2.2: Restoring previous comprehensive covering indexes...';
PRINT '';

-- Restore Index 1: idx_drs_client_covering
PRINT '  [1/2] Restoring idx_drs_client_covering...';
PRINT '        Keys: (GSClientID, TranDate)';
PRINT '        INCLUDE: 11 columns';

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('DrsTransactions') AND name = 'idx_drs_client_covering')
BEGIN
    CREATE NONCLUSTERED INDEX [idx_drs_client_covering]
    ON [dbo].[DrsTransactions] (
        [GSClientID],
        [TranDate]
    )
    INCLUDE (
        [Total],
        [EntryType],
        [InvNumber],
        [Reference],
        [ServLineCode],
        [Biller],
        [ClientCode],
        [ClientNameFull],
        [GroupCode],
        [GroupDesc],
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
    PRINT '        ✓ Created';
END
ELSE
BEGIN
    PRINT '        Index already exists';
END
PRINT '';

-- Restore Index 2: idx_drs_biller_covering
PRINT '  [2/2] Restoring idx_drs_biller_covering...';
PRINT '        Keys: (Biller, TranDate, EntryType)';
PRINT '        INCLUDE: 10 columns';

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('DrsTransactions') AND name = 'idx_drs_biller_covering')
BEGIN
    CREATE NONCLUSTERED INDEX [idx_drs_biller_covering]
    ON [dbo].[DrsTransactions] (
        [Biller],
        [TranDate],
        [EntryType]
    )
    INCLUDE (
        [Total],
        [InvNumber],
        [Reference],
        [ServLineCode],
        [GSClientID],
        [ClientCode],
        [ClientNameFull],
        [GroupCode],
        [GroupDesc],
        [updatedAt]
    )
    WHERE ([Biller] IS NOT NULL)
    WITH (
        DATA_COMPRESSION = PAGE,
        FILLFACTOR = 90,
        ONLINE = ON,
        SORT_IN_TEMPDB = ON,
        MAXDOP = 0
    );
    PRINT '        ✓ Created';
END
ELSE
BEGIN
    PRINT '        Index already exists';
END
PRINT '';

PRINT 'Completed restoring DrsTransactions covering indexes';
PRINT '';

-- ============================================================================
-- STEP 2.3: UPDATE STATISTICS FOR DRSTRANSACTIONS
-- ============================================================================

PRINT '-- STEP 2.3: Updating statistics for DrsTransactions...';
PRINT '';

UPDATE STATISTICS [dbo].[DrsTransactions] [idx_drs_client_covering] WITH FULLSCAN;
UPDATE STATISTICS [dbo].[DrsTransactions] [idx_drs_biller_covering] WITH FULLSCAN;

PRINT '✓ Statistics updated';
PRINT '';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

PRINT '============================================================================';
PRINT 'VERIFICATION: Restored Index State';
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
    ), 1, 2, '') AS KeyColumns
FROM sys.indexes i
WHERE i.object_id = OBJECT_ID('dbo.WIPTransactions')
    AND i.type_desc = 'NONCLUSTERED'
    AND i.name LIKE 'idx_WIP%'
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
    ), 1, 2, '') AS KeyColumns
FROM sys.indexes i
WHERE i.object_id = OBJECT_ID('dbo.DrsTransactions')
    AND i.type_desc = 'NONCLUSTERED'
    AND i.name LIKE 'idx_drs%'
ORDER BY i.name;

PRINT '';
PRINT '============================================================================';
PRINT 'Rollback Complete!';
PRINT 'Completed: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '============================================================================';
PRINT '';
PRINT 'Previous comprehensive covering indexes have been restored.';
PRINT '';
GO
