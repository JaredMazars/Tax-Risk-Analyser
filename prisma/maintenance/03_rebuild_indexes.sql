-- ============================================================================
-- Index Maintenance - Rebuild/Reorganize Fragmented Indexes
-- ============================================================================
-- 
-- PURPOSE: Reduce index fragmentation to improve query performance
--
-- WHAT IS FRAGMENTATION:
--   - Logical fragmentation: Index pages not in sequential order
--   - Physical fragmentation: Data pages not contiguous on disk
--   - Causes extra I/O operations and slower queries
--   - Builds up over time with inserts/updates/deletes
--
-- FRAGMENTATION THRESHOLDS:
--   < 10%: No action needed (index is healthy)
--   10-30%: REORGANIZE (online, faster, less thorough)
--   > 30%: REBUILD (offline or ONLINE=ON, slower but complete defrag)
--
-- WHEN TO RUN:
--   - Monthly for transaction tables
--   - Weekly if heavy insert/update/delete activity
--   - After bulk data operations
--   - When queries slow down despite good statistics
--
-- MAINTENANCE WINDOW:
--   - REORGANIZE: Can run during business hours (online)
--   - REBUILD with ONLINE=ON: Safe during business hours (requires Enterprise Edition)
--   - REBUILD without ONLINE: Off-hours only (locks table)
--
-- HOW TO USE:
--   1. Run ANALYSIS section first to see fragmentation levels
--   2. Review recommendations
--   3. Run REBUILD/REORGANIZE section during appropriate window
--
-- ============================================================================

SET NOCOUNT ON;

PRINT '=============================================================================';
PRINT 'Index Fragmentation Analysis';
PRINT 'Timestamp: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '=============================================================================';
PRINT '';

-- ============================================================================
-- PART 1: ANALYZE FRAGMENTATION
-- ============================================================================

PRINT 'Analyzing index fragmentation...';
PRINT '';

-- Temporary table for results
IF OBJECT_ID('tempdb..#FragmentationResults') IS NOT NULL 
    DROP TABLE #FragmentationResults;

CREATE TABLE #FragmentationResults (
    TableName NVARCHAR(128),
    IndexName NVARCHAR(128),
    IndexType NVARCHAR(60),
    FragmentPercent DECIMAL(5,2),
    PageCount BIGINT,
    SizeMB DECIMAL(10,2),
    Recommendation NVARCHAR(20)
);

-- Collect fragmentation stats for all user indexes
INSERT INTO #FragmentationResults
SELECT 
    OBJECT_NAME(ips.object_id) AS TableName,
    i.name AS IndexName,
    ips.index_type_desc AS IndexType,
    CAST(ips.avg_fragmentation_in_percent AS DECIMAL(5,2)) AS FragmentPercent,
    ips.page_count AS PageCount,
    CAST(ips.page_count * 8 / 1024.0 AS DECIMAL(10,2)) AS SizeMB,
    CASE 
        WHEN ips.avg_fragmentation_in_percent < 10 THEN 'NONE'
        WHEN ips.avg_fragmentation_in_percent < 30 THEN 'REORGANIZE'
        ELSE 'REBUILD'
    END AS Recommendation
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
INNER JOIN sys.indexes i 
    ON ips.object_id = i.object_id 
    AND ips.index_id = i.index_id
WHERE OBJECT_NAME(ips.object_id) IN (
    'WIPTransactions', 
    'DrsTransactions', 
    'Task', 
    'Client', 
    'Employee',
    'Debtors',
    'Wip'
)
    AND i.name IS NOT NULL  -- Exclude heaps
    AND ips.page_count > 100  -- Exclude tiny indexes (< 1 MB)
ORDER BY ips.avg_fragmentation_in_percent DESC;

-- ============================================================================
-- Display Results by Recommendation
-- ============================================================================

PRINT '--- INDEXES REQUIRING REBUILD (> 30% fragmentation) ---';
SELECT 
    TableName,
    IndexName,
    IndexType,
    FragmentPercent,
    PageCount,
    SizeMB,
    Recommendation
FROM #FragmentationResults
WHERE Recommendation = 'REBUILD'
ORDER BY FragmentPercent DESC;

IF NOT EXISTS (SELECT 1 FROM #FragmentationResults WHERE Recommendation = 'REBUILD')
    PRINT '   ✓ No indexes require rebuild';

PRINT '';
PRINT '--- INDEXES REQUIRING REORGANIZE (10-30% fragmentation) ---';
SELECT 
    TableName,
    IndexName,
    IndexType,
    FragmentPercent,
    PageCount,
    SizeMB,
    Recommendation
FROM #FragmentationResults
WHERE Recommendation = 'REORGANIZE'
ORDER BY FragmentPercent DESC;

IF NOT EXISTS (SELECT 1 FROM #FragmentationResults WHERE Recommendation = 'REORGANIZE')
    PRINT '   ✓ No indexes require reorganize';

PRINT '';
PRINT '--- HEALTHY INDEXES (< 10% fragmentation) ---';
SELECT 
    TableName,
    IndexName,
    FragmentPercent,
    SizeMB
FROM #FragmentationResults
WHERE Recommendation = 'NONE'
ORDER BY TableName, IndexName;

PRINT '';
PRINT '';

-- ============================================================================
-- PART 2: EXECUTE MAINTENANCE (Uncomment to run)
-- ============================================================================

PRINT '=============================================================================';
PRINT 'Index Maintenance Execution';
PRINT '=============================================================================';
PRINT '';
PRINT 'TO RUN MAINTENANCE: Uncomment the section below';
PRINT '';

/*
-- ============================================================================
-- REBUILD INDEXES (> 30% fragmentation)
-- ============================================================================

DECLARE @RebuildSQL NVARCHAR(MAX);
DECLARE @RebuildCursor CURSOR;
DECLARE @TableName NVARCHAR(128);
DECLARE @IndexName NVARCHAR(128);
DECLARE @StartTime DATETIME;
DECLARE @Duration INT;

SET @RebuildCursor = CURSOR FOR
SELECT TableName, IndexName
FROM #FragmentationResults
WHERE Recommendation = 'REBUILD';

OPEN @RebuildCursor;
FETCH NEXT FROM @RebuildCursor INTO @TableName, @IndexName;

WHILE @@FETCH_STATUS = 0
BEGIN
    PRINT 'Rebuilding: [' + @TableName + '].[' + @IndexName + ']';
    SET @StartTime = GETDATE();
    
    SET @RebuildSQL = N'ALTER INDEX [' + @IndexName + '] ON [dbo].[' + @TableName + '] REBUILD WITH (ONLINE = ON, SORT_IN_TEMPDB = ON)';
    
    BEGIN TRY
        EXEC sp_executesql @RebuildSQL;
        SET @Duration = DATEDIFF(SECOND, @StartTime, GETDATE());
        PRINT '   ✓ Complete (' + CAST(@Duration AS VARCHAR) + ' seconds)';
    END TRY
    BEGIN CATCH
        PRINT '   ✗ ERROR: ' + ERROR_MESSAGE();
        PRINT '   Trying without ONLINE option...';
        
        SET @RebuildSQL = N'ALTER INDEX [' + @IndexName + '] ON [dbo].[' + @TableName + '] REBUILD WITH (SORT_IN_TEMPDB = ON)';
        EXEC sp_executesql @RebuildSQL;
        
        SET @Duration = DATEDIFF(SECOND, @StartTime, GETDATE());
        PRINT '   ✓ Complete offline rebuild (' + CAST(@Duration AS VARCHAR) + ' seconds)';
    END CATCH
    
    PRINT '';
    FETCH NEXT FROM @RebuildCursor INTO @TableName, @IndexName;
END

CLOSE @RebuildCursor;
DEALLOCATE @RebuildCursor;

-- ============================================================================
-- REORGANIZE INDEXES (10-30% fragmentation)
-- ============================================================================

DECLARE @ReorganizeSQL NVARCHAR(MAX);
DECLARE @ReorganizeCursor CURSOR;

SET @ReorganizeCursor = CURSOR FOR
SELECT TableName, IndexName
FROM #FragmentationResults
WHERE Recommendation = 'REORGANIZE';

OPEN @ReorganizeCursor;
FETCH NEXT FROM @ReorganizeCursor INTO @TableName, @IndexName;

WHILE @@FETCH_STATUS = 0
BEGIN
    PRINT 'Reorganizing: [' + @TableName + '].[' + @IndexName + ']';
    SET @StartTime = GETDATE();
    
    SET @ReorganizeSQL = N'ALTER INDEX [' + @IndexName + '] ON [dbo].[' + @TableName + '] REORGANIZE';
    EXEC sp_executesql @ReorganizeSQL;
    
    SET @Duration = DATEDIFF(SECOND, @StartTime, GETDATE());
    PRINT '   ✓ Complete (' + CAST(@Duration AS VARCHAR) + ' seconds)';
    PRINT '';
    
    FETCH NEXT FROM @ReorganizeCursor INTO @TableName, @IndexName;
END

CLOSE @ReorganizeCursor;
DEALLOCATE @ReorganizeCursor;

-- ============================================================================
-- Update Statistics After Maintenance
-- ============================================================================

PRINT 'Updating statistics after index maintenance...';
PRINT '';

UPDATE STATISTICS [dbo].[WIPTransactions] WITH FULLSCAN;
PRINT '   ✓ WIPTransactions';

UPDATE STATISTICS [dbo].[DrsTransactions] WITH FULLSCAN;
PRINT '   ✓ DrsTransactions';

UPDATE STATISTICS [dbo].[Task] WITH FULLSCAN;
PRINT '   ✓ Task';

PRINT '';
PRINT 'Index maintenance complete!';
PRINT '';
*/

-- ============================================================================
-- Summary
-- ============================================================================

DECLARE @RebuildCount INT;
DECLARE @ReorganizeCount INT;
DECLARE @HealthyCount INT;

SELECT @RebuildCount = COUNT(*) FROM #FragmentationResults WHERE Recommendation = 'REBUILD';
SELECT @ReorganizeCount = COUNT(*) FROM #FragmentationResults WHERE Recommendation = 'REORGANIZE';
SELECT @HealthyCount = COUNT(*) FROM #FragmentationResults WHERE Recommendation = 'NONE';

PRINT '';
PRINT '=============================================================================';
PRINT 'Summary';
PRINT '=============================================================================';
PRINT 'Indexes requiring REBUILD: ' + CAST(@RebuildCount AS VARCHAR);
PRINT 'Indexes requiring REORGANIZE: ' + CAST(@ReorganizeCount AS VARCHAR);
PRINT 'Healthy indexes (< 10%): ' + CAST(@HealthyCount AS VARCHAR);
PRINT '';

IF @RebuildCount > 0 OR @ReorganizeCount > 0
BEGIN
    PRINT 'ACTION REQUIRED:';
    PRINT '1. Uncomment the maintenance section in this script';
    PRINT '2. Run during appropriate maintenance window:';
    PRINT '   - REORGANIZE: Safe during business hours';
    PRINT '   - REBUILD: Requires off-hours unless Enterprise Edition with ONLINE=ON';
    PRINT '';
END
ELSE
BEGIN
    PRINT '✓ All indexes are healthy - no maintenance needed';
    PRINT '';
END

-- Cleanup
DROP TABLE #FragmentationResults;

GO
