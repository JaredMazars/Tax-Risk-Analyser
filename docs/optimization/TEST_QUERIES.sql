-- ============================================================================
-- Test Queries for Client Details Optimization
-- Execute these after deploying migration and updated stored procedure
-- ============================================================================

-- ============================================================================
-- 1. VERIFY INDEX CREATION
-- ============================================================================

PRINT 'Checking WIPTransactions indexes...';
SELECT 
    name AS IndexName,
    type_desc AS IndexType,
    is_disabled AS IsDisabled,
    has_filter AS HasFilter
FROM sys.indexes
WHERE object_id = OBJECT_ID('WIPTransactions')
AND name IN (
    'IX_WIPTransactions_ClientTaskCode_Covering',
    'IX_WIPTransactions_Partner_Covering',
    'IX_WIPTransactions_PartnerDate_Covering'
);

-- Expected: 3 rows, all NONCLUSTERED, IsDisabled = 0
GO

PRINT 'Checking Task indexes...';
SELECT 
    name AS IndexName,
    type_desc AS IndexType,
    is_disabled AS IsDisabled
FROM sys.indexes
WHERE object_id = OBJECT_ID('Task')
AND name IN (
    'IX_Task_ServLine_Covering',
    'IX_Task_Partner_Covering'
);

-- Expected: 2 rows, all NONCLUSTERED, IsDisabled = 0
GO

PRINT 'Checking ClientCode column...';
SELECT 
    name AS ColumnName,
    TYPE_NAME(system_type_id) AS DataType,
    max_length AS MaxLength,
    is_nullable AS IsNullable
FROM sys.columns
WHERE object_id = OBJECT_ID('WIPTransactions')
AND name = 'ClientCode';

-- Expected: 1 row, DataType = nvarchar, MaxLength = 20, IsNullable = 0
GO

-- ============================================================================
-- 2. TEST CLIENT DETAILS QUERY (PRIMARY USE CASE)
-- ============================================================================

-- IMPORTANT: Replace 'YOURCLIENT' with actual client code from your database
DECLARE @TestClientCode NVARCHAR(10) = 'YOURCLIENT'; -- <<< CHANGE THIS

PRINT '';
PRINT '=============================================================================';
PRINT 'Testing Client Details Query';
PRINT 'Client Code: ' + @TestClientCode;
PRINT '=============================================================================';

-- Enable statistics
SET STATISTICS IO ON;
SET STATISTICS TIME ON;

-- Execute query
EXEC dbo.sp_ProfitabilityData 
    @ClientCode = @TestClientCode,
    @DateFrom = '1900-01-01',
    @DateTo = '2099-12-31',
    @ServLineCode = '*',
    @PartnerCode = '*',
    @ManagerCode = '*',
    @GroupCode = '*',
    @TaskCode = '*',
    @EmpCode = '*';

-- Disable statistics
SET STATISTICS IO OFF;
SET STATISTICS TIME OFF;

-- Expected Results:
-- ✓ Index Seek on IX_WIPTransactions_ClientTaskCode_Covering
-- ✓ Logical reads < 1,000 (was 50,000+)
-- ✓ CPU time < 500ms (was 5,000-10,000ms)
-- ✓ Elapsed time < 500ms (was 5-10 seconds)
GO

-- ============================================================================
-- 3. CHECK EXECUTION PLAN FOR CLIENT QUERY
-- ============================================================================

DECLARE @TestClientCode NVARCHAR(10) = 'YOURCLIENT'; -- <<< CHANGE THIS

PRINT '';
PRINT '=============================================================================';
PRINT 'Checking Execution Plan for Client Details Query';
PRINT '=============================================================================';

-- Show execution plan as text
SET SHOWPLAN_TEXT ON;
GO

EXEC dbo.sp_ProfitabilityData 
    @ClientCode = 'YOURCLIENT', -- <<< CHANGE THIS
    @DateFrom = '1900-01-01',
    @DateTo = '2099-12-31',
    @ServLineCode = '*',
    @PartnerCode = '*',
    @ManagerCode = '*',
    @GroupCode = '*',
    @TaskCode = '*',
    @EmpCode = '*';
GO

SET SHOWPLAN_TEXT OFF;
GO

-- Look for in output:
-- "Index Seek (NONCLUSTERED)[IX_WIPTransactions_ClientTaskCode_Covering]"

-- ============================================================================
-- 4. TEST MY REPORTS QUERY (VERIFY NO REGRESSION)
-- ============================================================================

-- IMPORTANT: Replace 'YOURPARTNER' with actual partner code from your database
DECLARE @TestPartnerCode NVARCHAR(10) = 'YOURPARTNER'; -- <<< CHANGE THIS

PRINT '';
PRINT '=============================================================================';
PRINT 'Testing My Reports Query (Partner Filter)';
PRINT 'Partner Code: ' + @TestPartnerCode;
PRINT '=============================================================================';

-- Enable statistics
SET STATISTICS IO ON;
SET STATISTICS TIME ON;

-- Execute query
EXEC dbo.sp_ProfitabilityData 
    @PartnerCode = @TestPartnerCode,
    @DateFrom = '2024-09-01',
    @DateTo = '2025-08-31',
    @ClientCode = '*',
    @ServLineCode = '*',
    @ManagerCode = '*',
    @GroupCode = '*',
    @TaskCode = '*',
    @EmpCode = '*';

-- Disable statistics
SET STATISTICS IO OFF;
SET STATISTICS TIME OFF;

-- Expected Results:
-- ✓ Index Seek on IX_WIPTransactions_Partner_Covering
-- ✓ Logical reads < 5,000 (improved from before)
-- ✓ Elapsed time < 1,000ms (improved from 3-5 seconds)
-- ✓ Results match previous version
GO

-- ============================================================================
-- 5. PERFORMANCE COMPARISON TEST
-- ============================================================================

-- Test with and without filter to compare
DECLARE @TestClientCode NVARCHAR(10) = 'YOURCLIENT'; -- <<< CHANGE THIS

PRINT '';
PRINT '=============================================================================';
PRINT 'Performance Comparison: With vs Without ClientCode Filter';
PRINT '=============================================================================';

-- Baseline: All clients (should use different index or scan)
PRINT 'Test 1: All Clients (Wildcard)';
SET STATISTICS TIME ON;
EXEC dbo.sp_ProfitabilityData 
    @ClientCode = '*',
    @DateFrom = '2024-09-01',
    @DateTo = '2025-08-31',
    @ServLineCode = '*',
    @PartnerCode = '*',
    @ManagerCode = '*',
    @GroupCode = '*',
    @TaskCode = '*',
    @EmpCode = '*';
SET STATISTICS TIME OFF;

PRINT '';
PRINT 'Test 2: Single Client (Optimized)';
SET STATISTICS TIME ON;
EXEC dbo.sp_ProfitabilityData 
    @ClientCode = @TestClientCode,
    @DateFrom = '2024-09-01',
    @DateTo = '2025-08-31',
    @ServLineCode = '*',
    @PartnerCode = '*',
    @ManagerCode = '*',
    @GroupCode = '*',
    @TaskCode = '*',
    @EmpCode = '*';
SET STATISTICS TIME OFF;

-- Expected: Test 2 should be significantly faster than Test 1
GO

-- ============================================================================
-- 6. INDEX USAGE STATISTICS (IMMEDIATE CHECK)
-- ============================================================================

PRINT '';
PRINT '=============================================================================';
PRINT 'Index Usage Statistics (Immediate Check)';
PRINT '=============================================================================';

SELECT 
    OBJECT_NAME(s.object_id) AS TableName,
    i.name AS IndexName,
    s.user_seeks AS Seeks,
    s.user_scans AS Scans,
    s.user_lookups AS Lookups,
    s.user_updates AS Updates,
    s.last_user_seek AS LastSeek,
    CASE 
        WHEN s.user_seeks + s.user_scans + s.user_lookups = 0 THEN '⚠️ NOT USED YET'
        WHEN s.user_seeks > (s.user_scans + s.user_lookups) * 10 THEN '✅ EXCELLENT'
        WHEN s.user_seeks > s.user_scans + s.user_lookups THEN '✅ GOOD'
        ELSE '⚠️ REVIEW'
    END AS Status
FROM sys.dm_db_index_usage_stats s
INNER JOIN sys.indexes i ON s.object_id = i.object_id AND s.index_id = i.index_id
WHERE i.name IN (
    'IX_WIPTransactions_ClientTaskCode_Covering',
    'IX_WIPTransactions_Partner_Covering',
    'IX_WIPTransactions_PartnerDate_Covering',
    'IX_Task_ServLine_Covering',
    'IX_Task_Partner_Covering'
)
ORDER BY s.user_seeks DESC;

-- Expected: After running tests above, you should see Seeks > 0
GO

-- ============================================================================
-- 7. QUERY PERFORMANCE STATISTICS
-- ============================================================================

PRINT '';
PRINT '=============================================================================';
PRINT 'Query Performance Statistics (Recent Executions)';
PRINT '=============================================================================';

SELECT TOP 10
    qs.execution_count AS Executions,
    CAST(qs.total_elapsed_time / qs.execution_count / 1000.0 AS DECIMAL(10,2)) AS AvgElapsedMs,
    CAST(qs.min_elapsed_time / 1000.0 AS DECIMAL(10,2)) AS MinElapsedMs,
    CAST(qs.max_elapsed_time / 1000.0 AS DECIMAL(10,2)) AS MaxElapsedMs,
    qs.total_logical_reads AS TotalReads,
    CAST(qs.total_logical_reads / NULLIF(qs.execution_count, 0) AS BIGINT) AS AvgReads,
    qs.last_execution_time AS LastRun,
    CASE 
        WHEN qs.total_elapsed_time / qs.execution_count / 1000.0 < 500 THEN '✅ EXCELLENT'
        WHEN qs.total_elapsed_time / qs.execution_count / 1000.0 < 1000 THEN '✅ GOOD'
        WHEN qs.total_elapsed_time / qs.execution_count / 1000.0 < 3000 THEN '⚠️ ACCEPTABLE'
        ELSE '❌ SLOW'
    END AS PerformanceRating
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
WHERE qt.text LIKE '%sp_ProfitabilityData%'
AND qs.last_execution_time > DATEADD(HOUR, -1, GETDATE())
ORDER BY qs.last_execution_time DESC;

-- Expected: AvgElapsedMs < 500, AvgReads < 1000, PerformanceRating = EXCELLENT
GO

-- ============================================================================
-- 8. DATA INTEGRITY CHECK (REGRESSION TEST)
-- ============================================================================

-- Compare WIP balances before and after optimization
-- Run this query BEFORE and AFTER deployment to verify results match

DECLARE @TestClientCode NVARCHAR(10) = 'YOURCLIENT'; -- <<< CHANGE THIS

PRINT '';
PRINT '=============================================================================';
PRINT 'Data Integrity Check - WIP Balance Verification';
PRINT 'Client Code: ' + @TestClientCode;
PRINT '=============================================================================';

-- Get aggregated WIP totals for client
SELECT 
    clientCode,
    COUNT(DISTINCT GSTaskID) AS TaskCount,
    CAST(SUM(LTDTimeCharged) AS DECIMAL(15,2)) AS TotalTimeCharged,
    CAST(SUM(LTDDisbCharged) AS DECIMAL(15,2)) AS TotalDisbCharged,
    CAST(SUM(LTDFeesBilled) AS DECIMAL(15,2)) AS TotalFeesBilled,
    CAST(SUM(LTDAdjustments) AS DECIMAL(15,2)) AS TotalAdjustments,
    CAST(SUM(NetWIP) AS DECIMAL(15,2)) AS TotalNetWIP,
    CAST(SUM(BalWip) AS DECIMAL(15,2)) AS TotalBalWip
FROM (
    EXEC dbo.sp_ProfitabilityData 
        @ClientCode = @TestClientCode,
        @DateFrom = '1900-01-01',
        @DateTo = '2099-12-31',
        @ServLineCode = '*',
        @PartnerCode = '*',
        @ManagerCode = '*',
        @GroupCode = '*',
        @TaskCode = '*',
        @EmpCode = '*'
) AS Results
GROUP BY clientCode;

-- IMPORTANT: Save these results and compare with previous values
-- If numbers don't match, investigate immediately!
GO

-- ============================================================================
-- 9. MISSING INDEX CHECK (VERIFY IMPROVEMENT)
-- ============================================================================

PRINT '';
PRINT '=============================================================================';
PRINT 'Missing Index Check - Verify No More High-Impact Missing Indexes';
PRINT '=============================================================================';

SELECT TOP 5
    OBJECT_NAME(mid.object_id) AS TableName,
    mid.equality_columns AS EqualityColumns,
    mid.inequality_columns AS InequalityColumns,
    mid.included_columns AS IncludedColumns,
    CAST(migs.avg_total_user_cost AS DECIMAL(10,2)) AS AvgCost,
    migs.avg_user_impact AS ImpactPct,
    migs.user_seeks AS Seeks,
    CAST(migs.avg_total_user_cost * migs.avg_user_impact * 
        (migs.user_seeks + migs.user_scans) AS DECIMAL(15,1)) AS ImprovementMeasure
FROM sys.dm_db_missing_index_groups mig
INNER JOIN sys.dm_db_missing_index_group_stats migs ON migs.group_handle = mig.index_group_handle
INNER JOIN sys.dm_db_missing_index_details mid ON mig.index_handle = mid.index_handle
WHERE OBJECT_NAME(mid.object_id) IN ('Task', 'WIPTransactions', 'Client')
ORDER BY ImprovementMeasure DESC;

-- Expected: ImprovementMeasure < 10,000 (down from 1,500,000+)
-- If still seeing high numbers, investigate those tables
GO

-- ============================================================================
-- 10. INDEX SIZE AND FRAGMENTATION
-- ============================================================================

PRINT '';
PRINT '=============================================================================';
PRINT 'Index Size and Fragmentation Analysis';
PRINT '=============================================================================';

SELECT 
    OBJECT_NAME(i.object_id) AS TableName,
    i.name AS IndexName,
    CAST(SUM(ps.used_page_count) * 8 / 1024.0 AS DECIMAL(10,2)) AS SizeMB,
    CAST(ips.avg_fragmentation_in_percent AS DECIMAL(5,2)) AS FragmentationPct,
    ips.page_count AS PageCount,
    CASE 
        WHEN ips.avg_fragmentation_in_percent < 10 THEN '✅ GOOD'
        WHEN ips.avg_fragmentation_in_percent < 30 THEN '⚠️ CONSIDER REORGANIZE'
        ELSE '❌ NEEDS REBUILD'
    END AS FragmentationStatus
FROM sys.indexes i
INNER JOIN sys.dm_db_partition_stats ps ON i.object_id = ps.object_id AND i.index_id = ps.index_id
INNER JOIN sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips 
    ON i.object_id = ips.object_id AND i.index_id = ips.index_id
WHERE i.name IN (
    'IX_WIPTransactions_ClientTaskCode_Covering',
    'IX_WIPTransactions_Partner_Covering',
    'IX_WIPTransactions_PartnerDate_Covering',
    'IX_Task_ServLine_Covering',
    'IX_Task_Partner_Covering'
)
GROUP BY OBJECT_NAME(i.object_id), i.name, ips.avg_fragmentation_in_percent, ips.page_count
ORDER BY SizeMB DESC;

-- Expected: New indexes should show FragmentationStatus = GOOD (< 10%)
GO

-- ============================================================================
-- TEST COMPLETE
-- ============================================================================

PRINT '';
PRINT '=============================================================================';
PRINT 'All Tests Complete!';
PRINT '';
PRINT 'Review Results Above:';
PRINT '  ✓ Indexes created and enabled';
PRINT '  ✓ Client query uses ClientCode index (< 500ms)';
PRINT '  ✓ Partner query uses Partner index (< 1000ms)';
PRINT '  ✓ Index usage shows Seeks > Scans';
PRINT '  ✓ Data integrity verified (WIP balances match)';
PRINT '  ✓ No high-impact missing indexes remain';
PRINT '';
PRINT 'Next Steps:';
PRINT '  1. Test application (client details page, My Reports)';
PRINT '  2. Monitor performance for 24-48 hours';
PRINT '  3. Review monitoring queries in DEPLOYMENT_CHECKLIST.md';
PRINT '=============================================================================';
GO
