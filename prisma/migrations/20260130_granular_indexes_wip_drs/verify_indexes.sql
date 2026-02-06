-- ============================================================================
-- Verification & Testing Script for Granular Indexes
-- Migration: 20260130_granular_indexes_wip_drs
-- Created: 2026-01-30
-- ============================================================================
--
-- This script verifies that the new granular indexes are created correctly
-- and tests that they are used by the query optimizer for actual queries.
--
-- Run this after applying the migration to ensure indexes are working as expected.
-- ============================================================================

SET NOCOUNT ON;
GO

PRINT '============================================================================';
PRINT 'Index Verification & Query Plan Testing';
PRINT 'Started: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '============================================================================';
PRINT '';

-- ============================================================================
-- PART 1: Verify Index Creation
-- ============================================================================

PRINT '============================================================================';
PRINT 'PART 1: Verify Index Creation';
PRINT '============================================================================';
PRINT '';

-- Check WIPTransactions indexes
PRINT '-- WIPTransactions Indexes:';
PRINT '';

SELECT 
    i.name AS IndexName,
    i.type_desc AS IndexType,
    i.is_unique AS IsUnique,
    i.has_filter AS HasFilter,
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
     WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 1) AS IncludeColumnCount,
    ps.used_page_count * 8 / 1024.0 AS SizeMB
FROM sys.indexes i
LEFT JOIN sys.dm_db_partition_stats ps ON i.object_id = ps.object_id AND i.index_id = ps.index_id
WHERE i.object_id = OBJECT_ID('dbo.WIPTransactions')
    AND i.type_desc = 'NONCLUSTERED'
    AND i.name LIKE 'idx_wip%'
ORDER BY i.name;

PRINT '';
PRINT '-- DrsTransactions Indexes:';
PRINT '';

SELECT 
    i.name AS IndexName,
    i.type_desc AS IndexType,
    i.is_unique AS IsUnique,
    i.has_filter AS HasFilter,
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
     WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 1) AS IncludeColumnCount,
    ps.used_page_count * 8 / 1024.0 AS SizeMB
FROM sys.indexes i
LEFT JOIN sys.dm_db_partition_stats ps ON i.object_id = ps.object_id AND i.index_id = ps.index_id
WHERE i.object_id = OBJECT_ID('dbo.DrsTransactions')
    AND i.type_desc = 'NONCLUSTERED'
    AND i.name LIKE 'idx_drs%'
ORDER BY i.name;

PRINT '';

-- ============================================================================
-- PART 2: Test Query Plans
-- ============================================================================

PRINT '============================================================================';
PRINT 'PART 2: Test Query Plans';
PRINT '============================================================================';
PRINT '';
PRINT 'Running test queries with ACTUAL execution plans...';
PRINT 'Review plans in SSMS or Azure Portal to verify index usage.';
PRINT '';

-- Enable actual execution plan
SET STATISTICS IO ON;
SET STATISTICS TIME ON;
GO

-- ============================================================================
-- TEST 1: Task-centric query (should use idx_wip_task)
-- ============================================================================
PRINT '';
PRINT '-- TEST 1: Task WIP Query (should use idx_wip_task)';
PRINT '-- Query Pattern: /api/tasks/[id]/wip';
PRINT '';

DECLARE @TestGSTaskID UNIQUEIDENTIFIER;
SELECT TOP 1 @TestGSTaskID = GSTaskID FROM WIPTransactions;

SELECT 
    TranDate,
    Amount,
    Cost,
    Hour,
    TType
FROM WIPTransactions
WHERE GSTaskID = @TestGSTaskID
ORDER BY TranDate DESC;

-- Check which index was used
SELECT 
    qs.execution_count,
    qs.total_logical_reads,
    qs.last_logical_reads,
    SUBSTRING(qt.text, (qs.statement_start_offset/2)+1,
        ((CASE qs.statement_end_offset
            WHEN -1 THEN DATALENGTH(qt.text)
            ELSE qs.statement_end_offset
        END - qs.statement_start_offset)/2)+1) AS query_text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) AS qt
WHERE qt.text LIKE '%GSTaskID = @TestGSTaskID%'
    AND qt.text NOT LIKE '%sys.dm_exec_query_stats%'
ORDER BY qs.last_execution_time DESC;

PRINT '';

-- ============================================================================
-- TEST 2: Client-centric query (should use idx_wip_client)
-- ============================================================================
PRINT '';
PRINT '-- TEST 2: Client WIP Query (should use idx_wip_client)';
PRINT '-- Query Pattern: /api/clients/[id]/wip';
PRINT '';

DECLARE @TestGSClientID UNIQUEIDENTIFIER;
SELECT TOP 1 @TestGSClientID = GSClientID FROM WIPTransactions WHERE GSClientID IS NOT NULL;

SELECT 
    TranDate,
    Amount,
    Cost,
    Hour,
    TType,
    GSTaskID,
    TaskServLine
FROM WIPTransactions
WHERE GSClientID = @TestGSClientID
ORDER BY TranDate DESC;

PRINT '';

-- ============================================================================
-- TEST 3: My Reports - Profitability (Partner) (should use idx_wip_partner_date)
-- ============================================================================
PRINT '';
PRINT '-- TEST 3: Profitability Report - Partner (should use idx_wip_partner_date)';
PRINT '-- Query Pattern: /api/my-reports/profitability (CARL/DIR/Local)';
PRINT '';

DECLARE @TestPartner NVARCHAR(10);
SELECT TOP 1 @TestPartner = TaskPartner FROM WIPTransactions;

DECLARE @FiscalStartDate DATE = '2023-09-01';
DECLARE @FiscalEndDate DATE = '2024-08-31';

SELECT 
    GSTaskID,
    SUM(CASE WHEN TType = 'T' THEN Amount ELSE 0 END) AS TotalTime,
    SUM(CASE WHEN TType = 'D' THEN Amount ELSE 0 END) AS TotalDisb,
    SUM(CASE WHEN TType = 'A' THEN Amount ELSE 0 END) AS TotalAdj,
    SUM(Cost) AS TotalCost,
    SUM(Hour) AS TotalHours
FROM WIPTransactions
WHERE TaskPartner = @TestPartner
    AND TranDate >= @FiscalStartDate
    AND TranDate <= @FiscalEndDate
GROUP BY GSTaskID;

PRINT '';

-- ============================================================================
-- TEST 4: My Reports - Profitability (Manager) (should use idx_wip_manager_date)
-- ============================================================================
PRINT '';
PRINT '-- TEST 4: Profitability Report - Manager (should use idx_wip_manager_date)';
PRINT '-- Query Pattern: /api/my-reports/profitability (non-CARL/DIR/Local)';
PRINT '';

DECLARE @TestManager NVARCHAR(10);
SELECT TOP 1 @TestManager = TaskManager FROM WIPTransactions;

SELECT 
    GSTaskID,
    SUM(CASE WHEN TType = 'T' THEN Amount ELSE 0 END) AS TotalTime,
    SUM(CASE WHEN TType = 'D' THEN Amount ELSE 0 END) AS TotalDisb,
    SUM(CASE WHEN TType = 'A' THEN Amount ELSE 0 END) AS TotalAdj,
    SUM(Cost) AS TotalCost,
    SUM(Hour) AS TotalHours
FROM WIPTransactions
WHERE TaskManager = @TestManager
    AND TranDate >= @FiscalStartDate
    AND TranDate <= @FiscalEndDate
GROUP BY GSTaskID;

PRINT '';

-- ============================================================================
-- TEST 5: Date-range fiscal report (should use idx_wip_date)
-- ============================================================================
PRINT '';
PRINT '-- TEST 5: Date Range Fiscal Report (should use idx_wip_date)';
PRINT '-- Query Pattern: /api/reports/fiscal-transactions';
PRINT '';

SELECT 
    TranDate,
    GSClientID,
    GSTaskID,
    SUM(Amount) AS TotalAmount,
    SUM(Cost) AS TotalCost,
    SUM(Hour) AS TotalHours
FROM WIPTransactions
WHERE TranDate >= @FiscalStartDate
    AND TranDate <= @FiscalEndDate
    AND GSClientID IS NOT NULL
GROUP BY TranDate, GSClientID, GSTaskID;

PRINT '';

-- ============================================================================
-- TEST 6: Employee time accumulation (should use idx_wip_emp_date)
-- ============================================================================
PRINT '';
PRINT '-- TEST 6: Employee Time Accumulation (should use idx_wip_emp_date)';
PRINT '-- Query Pattern: /api/tasks/[id]/analytics/time-accumulation';
PRINT '';

DECLARE @TestEmpCode NVARCHAR(10);
SELECT TOP 1 @TestEmpCode = EmpCode FROM WIPTransactions WHERE EmpCode IS NOT NULL;

SELECT 
    TranDate,
    EmpCode,
    SUM(Hour) AS TotalHours,
    SUM(Amount) AS TotalAmount
FROM WIPTransactions
WHERE EmpCode = @TestEmpCode
    AND TranDate >= @FiscalStartDate
    AND TranDate <= @FiscalEndDate
    AND TType = 'T'
GROUP BY TranDate, EmpCode
ORDER BY TranDate;

PRINT '';

-- ============================================================================
-- TEST 7: Recoverability Report (should use idx_drs_biller_date)
-- ============================================================================
PRINT '';
PRINT '-- TEST 7: Recoverability Report (should use idx_drs_biller_date)';
PRINT '-- Query Pattern: /api/my-reports/recoverability';
PRINT '';

DECLARE @TestBiller NVARCHAR(10);
SELECT TOP 1 @TestBiller = Biller FROM DrsTransactions WHERE Biller IS NOT NULL;

SELECT 
    GSClientID,
    ClientCode,
    ClientNameFull,
    GroupCode,
    GroupDesc,
    ServLineCode,
    SUM(Total) AS TotalBalance,
    COUNT(DISTINCT InvNumber) AS InvoiceCount
FROM DrsTransactions
WHERE Biller = @TestBiller
    AND TranDate <= @FiscalEndDate
GROUP BY GSClientID, ClientCode, ClientNameFull, GroupCode, GroupDesc, ServLineCode;

PRINT '';

-- ============================================================================
-- TEST 8: Client Debtors Query (should use idx_drs_client_date)
-- ============================================================================
PRINT '';
PRINT '-- TEST 8: Client Debtors Query (should use idx_drs_client_date)';
PRINT '-- Query Pattern: /api/clients/[id]/debtors';
PRINT '';

DECLARE @TestDrsClientID UNIQUEIDENTIFIER;
SELECT TOP 1 @TestDrsClientID = GSClientID FROM DrsTransactions WHERE GSClientID IS NOT NULL;

SELECT 
    TranDate,
    Total,
    EntryType,
    InvNumber,
    Reference,
    Biller,
    ServLineCode
FROM DrsTransactions
WHERE GSClientID = @TestDrsClientID
ORDER BY TranDate DESC;

PRINT '';

-- ============================================================================
-- TEST 9: Group Debtors Rollup (should use idx_drs_client_group)
-- ============================================================================
PRINT '';
PRINT '-- TEST 9: Group Debtors Rollup (should use idx_drs_client_group)';
PRINT '-- Query Pattern: /api/groups/[groupCode]/debtors';
PRINT '';

DECLARE @TestGroupCode NVARCHAR(10);
SELECT TOP 1 @TestGroupCode = GroupCode FROM DrsTransactions WHERE GroupCode IS NOT NULL;

SELECT 
    GSClientID,
    GroupCode,
    ClientCode,
    ServLineCode,
    SUM(Total) AS TotalBalance,
    COUNT(*) AS TransactionCount
FROM DrsTransactions
WHERE GroupCode = @TestGroupCode
    AND TranDate <= @FiscalEndDate
    AND GSClientID IS NOT NULL
GROUP BY GSClientID, GroupCode, ClientCode, ServLineCode;

PRINT '';

-- Disable statistics
SET STATISTICS IO OFF;
SET STATISTICS TIME OFF;
GO

-- ============================================================================
-- PART 3: Index Usage Statistics
-- ============================================================================

PRINT '============================================================================';
PRINT 'PART 3: Index Usage Statistics';
PRINT '============================================================================';
PRINT '';
PRINT 'Current index usage stats (will populate over time):';
PRINT '';

-- WIPTransactions index usage
SELECT 
    OBJECT_NAME(s.object_id) AS TableName,
    i.name AS IndexName,
    s.user_seeks AS UserSeeks,
    s.user_scans AS UserScans,
    s.user_lookups AS UserLookups,
    s.user_updates AS UserUpdates,
    s.last_user_seek AS LastUserSeek,
    s.last_user_scan AS LastUserScan
FROM sys.dm_db_index_usage_stats s
INNER JOIN sys.indexes i ON s.object_id = i.object_id AND s.index_id = i.index_id
WHERE s.database_id = DB_ID()
    AND OBJECT_NAME(s.object_id) IN ('WIPTransactions', 'DrsTransactions')
    AND i.name LIKE 'idx_%'
ORDER BY OBJECT_NAME(s.object_id), i.name;

PRINT '';

-- ============================================================================
-- PART 4: Index Fragmentation Check
-- ============================================================================

PRINT '============================================================================';
PRINT 'PART 4: Index Fragmentation Check';
PRINT '============================================================================';
PRINT '';
PRINT 'Index fragmentation (should be 0% for newly created indexes):';
PRINT '';

SELECT 
    OBJECT_NAME(ips.object_id) AS TableName,
    i.name AS IndexName,
    ips.index_type_desc AS IndexType,
    ips.avg_fragmentation_in_percent AS FragmentationPercent,
    ips.page_count AS PageCount,
    CASE 
        WHEN ips.avg_fragmentation_in_percent > 30 THEN 'HIGH - Rebuild recommended'
        WHEN ips.avg_fragmentation_in_percent > 10 THEN 'MEDIUM - Consider reorganize'
        ELSE 'OK'
    END AS Status
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
INNER JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
WHERE OBJECT_NAME(ips.object_id) IN ('WIPTransactions', 'DrsTransactions')
    AND i.name LIKE 'idx_%'
    AND ips.page_count > 0
ORDER BY OBJECT_NAME(ips.object_id), i.name;

PRINT '';

-- ============================================================================
-- PART 5: Recommendations
-- ============================================================================

PRINT '============================================================================';
PRINT 'PART 5: Recommendations';
PRINT '============================================================================';
PRINT '';
PRINT 'Post-Migration Monitoring Checklist:';
PRINT '';
PRINT '1. Review execution plans in Azure SQL Query Performance Insights';
PRINT '   - Navigate to: Database > Intelligent Performance > Query Performance Insight';
PRINT '   - Look for queries using new indexes (idx_wip_*, idx_drs_*)';
PRINT '';
PRINT '2. Monitor My Reports response times:';
PRINT '   - /api/my-reports/profitability (should be 20-30% faster)';
PRINT '   - /api/my-reports/recoverability (should maintain current speed)';
PRINT '';
PRINT '3. Check index usage stats after 1 week:';
PRINT '   - Run: SELECT * FROM sys.dm_db_index_usage_stats WHERE database_id = DB_ID()';
PRINT '   - Look for user_seeks > 0 on new indexes';
PRINT '';
PRINT '4. Monitor disk space usage:';
PRINT '   - WIPTransactions: Expected ~600-700 MB (down from 1,190 MB)';
PRINT '   - DrsTransactions: Expected ~300-400 MB';
PRINT '';
PRINT '5. If indexes are not being used:';
PRINT '   - Check query execution plans';
PRINT '   - Verify WHERE clause matches index keys';
PRINT '   - Update statistics: UPDATE STATISTICS [table] WITH FULLSCAN';
PRINT '';
PRINT '6. If performance degrades:';
PRINT '   - Run rollback.sql to restore previous indexes';
PRINT '   - Report issue with execution plan screenshots';
PRINT '';

PRINT '============================================================================';
PRINT 'Verification Complete!';
PRINT 'Completed: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '============================================================================';
PRINT '';
GO
