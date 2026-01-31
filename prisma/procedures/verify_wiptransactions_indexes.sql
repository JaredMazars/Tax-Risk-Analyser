-- ============================================================================
-- Verify WIPTransactions Covering Indexes
-- Checks index existence, size, usage statistics, and execution plan hints
-- ============================================================================

SET NOCOUNT ON;

PRINT '============================================================================';
PRINT 'WIPTransactions Index Verification';
PRINT 'Timestamp: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '============================================================================';
PRINT '';

-- ============================================================================
-- CHECK 1: Index Existence and Metadata
-- ============================================================================

PRINT '-- CHECK 1: Index Existence and Metadata';
PRINT '';

SELECT 
    i.name AS IndexName,
    i.type_desc AS IndexType,
    i.is_unique AS IsUnique,
    i.fill_factor AS FillFactor,
    CASE 
        WHEN p.data_compression_desc = 'NONE' THEN 'No Compression'
        ELSE p.data_compression_desc 
    END AS Compression,
    STUFF((
        SELECT ', ' + c.name + 
               CASE WHEN ic.is_descending_key = 1 THEN ' DESC' ELSE ' ASC' END
        FROM sys.index_columns ic
        JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
        WHERE ic.object_id = i.object_id 
          AND ic.index_id = i.index_id 
          AND ic.is_included_column = 0
        ORDER BY ic.key_ordinal
        FOR XML PATH('')
    ), 1, 2, '') AS KeyColumns,
    STUFF((
        SELECT ', ' + c.name
        FROM sys.index_columns ic
        JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
        WHERE ic.object_id = i.object_id 
          AND ic.index_id = i.index_id 
          AND ic.is_included_column = 1
        ORDER BY ic.index_column_id
        FOR XML PATH('')
    ), 1, 2, '') AS IncludedColumns,
    ps.row_count AS RowCount,
    ps.used_page_count * 8 / 1024.0 AS UsedSizeMB,
    ps.reserved_page_count * 8 / 1024.0 AS ReservedSizeMB
FROM sys.indexes i
INNER JOIN sys.partitions p ON i.object_id = p.object_id AND i.index_id = p.index_id
INNER JOIN sys.dm_db_partition_stats ps ON i.object_id = ps.object_id AND i.index_id = ps.index_id
WHERE i.object_id = OBJECT_ID('WIPTransactions')
  AND i.name IN (
      'idx_WIPTransactions_Task_Covering',
      'idx_WIPTransactions_Date_EmpCode_Client_Covering'
  )
ORDER BY i.name;

PRINT '';
PRINT '✅ Expected: 2 covering indexes with PAGE compression';
PRINT '';

-- ============================================================================
-- CHECK 2: Index Usage Statistics
-- ============================================================================

PRINT '-- CHECK 2: Index Usage Statistics';
PRINT '';

SELECT 
    i.name AS IndexName,
    ius.user_seeks AS UserSeeks,
    ius.user_scans AS UserScans,
    ius.user_lookups AS UserLookups,
    ius.user_updates AS UserUpdates,
    ius.last_user_seek AS LastUserSeek,
    ius.last_user_scan AS LastUserScan,
    CASE 
        WHEN (ius.user_seeks + ius.user_scans + ius.user_lookups) = 0 THEN 'Not Used'
        WHEN ius.user_seeks > (ius.user_scans + ius.user_lookups) THEN 'Primarily Seeks (Good)'
        WHEN ius.user_scans > ius.user_seeks THEN 'Primarily Scans (Review Queries)'
        ELSE 'Mixed Usage'
    END AS UsagePattern,
    CASE 
        WHEN ius.user_updates > (ius.user_seeks + ius.user_scans + ius.user_lookups) * 5 
            THEN '⚠️ High Update Overhead'
        ELSE '✅ Acceptable'
    END AS UpdateStatus
FROM sys.indexes i
LEFT JOIN sys.dm_db_index_usage_stats ius 
    ON i.object_id = ius.object_id 
    AND i.index_id = ius.index_id
    AND ius.database_id = DB_ID()
WHERE i.object_id = OBJECT_ID('WIPTransactions')
  AND i.name IN (
      'idx_WIPTransactions_Task_Covering',
      'idx_WIPTransactions_Date_EmpCode_Client_Covering'
  )
ORDER BY i.name;

PRINT '';
PRINT '✅ Expected: Primarily seeks (not scans), last_user_seek within recent timeframe';
PRINT '⚠️ Warning: If "Not Used", queries may not be using indexes optimally';
PRINT '';

-- ============================================================================
-- CHECK 3: Index Fragmentation
-- ============================================================================

PRINT '-- CHECK 3: Index Fragmentation';
PRINT '';

SELECT 
    i.name AS IndexName,
    ips.index_type_desc AS IndexType,
    ips.avg_fragmentation_in_percent AS AvgFragmentationPercent,
    ips.fragment_count AS FragmentCount,
    ips.avg_fragment_size_in_pages AS AvgFragmentSizePages,
    ips.page_count AS PageCount,
    CASE 
        WHEN ips.avg_fragmentation_in_percent < 10 THEN '✅ Good (< 10%)'
        WHEN ips.avg_fragmentation_in_percent < 30 THEN '⚠️ Consider Reorganize (10-30%)'
        ELSE '❌ Rebuild Required (> 30%)'
    END AS FragmentationStatus,
    CASE 
        WHEN ips.avg_fragmentation_in_percent < 10 THEN 'No action needed'
        WHEN ips.avg_fragmentation_in_percent < 30 THEN 'ALTER INDEX ' + i.name + ' ON WIPTransactions REORGANIZE;'
        ELSE 'ALTER INDEX ' + i.name + ' ON WIPTransactions REBUILD WITH (ONLINE = ON);'
    END AS RecommendedAction
FROM sys.indexes i
CROSS APPLY sys.dm_db_index_physical_stats(
    DB_ID(), 
    i.object_id, 
    i.index_id, 
    NULL, 
    'LIMITED'
) ips
WHERE i.object_id = OBJECT_ID('WIPTransactions')
  AND i.name IN (
      'idx_WIPTransactions_Task_Covering',
      'idx_WIPTransactions_Date_EmpCode_Client_Covering'
  )
ORDER BY i.name;

PRINT '';
PRINT '✅ Expected: < 10% fragmentation for recently created indexes';
PRINT '⚠️ Run reorganize/rebuild if fragmentation > 10%';
PRINT '';

-- ============================================================================
-- CHECK 4: Missing Index Suggestions
-- ============================================================================

PRINT '-- CHECK 4: Missing Index Suggestions for WIPTransactions';
PRINT '';

SELECT TOP 5
    migs.avg_user_impact AS AvgUserImpact,
    migs.avg_total_user_cost AS AvgTotalUserCost,
    migs.user_seeks AS UserSeeks,
    migs.user_scans AS UserScans,
    mid.equality_columns AS EqualityColumns,
    mid.inequality_columns AS InequalityColumns,
    mid.included_columns AS IncludedColumns,
    'CREATE NONCLUSTERED INDEX IX_WIPTransactions_Missing_' + 
        CAST(ROW_NUMBER() OVER (ORDER BY migs.avg_user_impact DESC) AS VARCHAR) +
        ' ON WIPTransactions (' + 
        ISNULL(mid.equality_columns, '') + 
        CASE WHEN mid.inequality_columns IS NOT NULL THEN ', ' + mid.inequality_columns ELSE '' END +
        ')' +
        CASE WHEN mid.included_columns IS NOT NULL 
            THEN ' INCLUDE (' + mid.included_columns + ')' 
            ELSE '' 
        END + ';' AS CreateIndexStatement
FROM sys.dm_db_missing_index_details mid
INNER JOIN sys.dm_db_missing_index_groups mig ON mid.index_handle = mig.index_handle
INNER JOIN sys.dm_db_missing_index_group_stats migs ON mig.index_group_handle = migs.group_handle
WHERE mid.database_id = DB_ID()
  AND mid.object_id = OBJECT_ID('WIPTransactions')
ORDER BY migs.avg_user_impact DESC;

PRINT '';
PRINT '✅ Expected: No significant missing index suggestions';
PRINT '⚠️ If suggestions appear, review execution plans to validate need';
PRINT '';

-- ============================================================================
-- CHECK 5: Sample Execution Plan Test (Task-based Query)
-- ============================================================================

PRINT '-- CHECK 5: Sample Execution Plan Test (Task-based Query)';
PRINT '-- Testing if covering index is used for typical task query';
PRINT '';

-- Get a sample task for testing
DECLARE @SampleTaskID UNIQUEIDENTIFIER;
SELECT TOP 1 @SampleTaskID = GSTaskID FROM Task;

IF @SampleTaskID IS NOT NULL
BEGIN
    PRINT '  Sample Task ID: ' + CAST(@SampleTaskID AS VARCHAR(50));
    
    SET STATISTICS IO ON;
    
    -- Test query (simulates WipLTD pattern)
    SELECT 
        COUNT(*) AS TransactionCount,
        SUM(CASE WHEN TType = 'T' THEN Amount ELSE 0 END) AS TimeCharged
    FROM WIPTransactions
    WHERE GSTaskID = @SampleTaskID
      AND TranDate >= '2024-01-01'
      AND TranDate <= '2024-12-31';
    
    SET STATISTICS IO OFF;
    
    PRINT '';
    PRINT '✅ Review Messages tab for:';
    PRINT '   - Table "WIPTransactions": Logical reads should be LOW';
    PRINT '   - Scan count should be 1 (index seek)';
    PRINT '   - No "Worktable" reads (indicates no key lookups)';
END
ELSE
BEGIN
    PRINT '  ⚠️ No tasks found in database';
END

PRINT '';

-- ============================================================================
-- CHECK 6: Verify Stored Procedure Version
-- ============================================================================

PRINT '-- CHECK 6: Stored Procedure Version Check';
PRINT '';

-- Check procedure definition for version indicator
IF EXISTS (
    SELECT 1 
    FROM sys.sql_modules sm
    INNER JOIN sys.objects o ON sm.object_id = o.object_id
    WHERE o.name = 'WipLTD'
      AND sm.definition LIKE '%v2.5%'
)
BEGIN
    PRINT '✅ WipLTD procedure is v2.5 (PERFORMANCE OPTIMIZED)';
END
ELSE IF EXISTS (
    SELECT 1 
    FROM sys.sql_modules sm
    INNER JOIN sys.objects o ON sm.object_id = o.object_id
    WHERE o.name = 'WipLTD'
      AND sm.definition LIKE '%v2.4%'
)
BEGIN
    PRINT '⚠️ WipLTD procedure is v2.4 (consider upgrading to v2.5)';
END
ELSE
BEGIN
    PRINT '❌ WipLTD procedure version unknown or procedure not found';
END

PRINT '';

-- Check for WITH RECOMPILE option
IF EXISTS (
    SELECT 1 
    FROM sys.sql_modules sm
    INNER JOIN sys.objects o ON sm.object_id = o.object_id
    WHERE o.name = 'WipLTD'
      AND sm.definition LIKE '%WITH RECOMPILE%'
)
BEGIN
    PRINT '✅ Procedure has WITH RECOMPILE (prevents parameter sniffing)';
END
ELSE
BEGIN
    PRINT '⚠️ Procedure missing WITH RECOMPILE option';
END

PRINT '';

-- ============================================================================
-- SUMMARY AND RECOMMENDATIONS
-- ============================================================================

PRINT '============================================================================';
PRINT 'VERIFICATION COMPLETE';
PRINT '============================================================================';
PRINT '';
PRINT 'NEXT STEPS:';
PRINT '  1. If indexes are missing, run: prisma/migrations/20260127_wiptransactions_2_covering_indexes.sql';
PRINT '  2. If fragmentation > 10%, reorganize/rebuild indexes';
PRINT '  3. If procedure is v2.4, upgrade to v2.5: prisma/procedures/sp_WipLTD_Final_v2.5.sql';
PRINT '  4. Run performance tests: prisma/procedures/test_WipLTD_performance.sql';
PRINT '  5. Monitor index usage for 1-2 weeks';
PRINT '';
PRINT 'PERFORMANCE TUNING:';
PRINT '  - If scans > seeks: Review query patterns and WHERE clauses';
PRINT '  - If high fragmentation: Schedule weekly index maintenance';
PRINT '  - If missing indexes suggested: Evaluate before adding (avoid over-indexing)';
PRINT '';
GO
