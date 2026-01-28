-- ============================================================================
-- Check WIPTransactions and DrsTransactions Indexes
-- Purpose: Verify actual database state for performance optimization analysis
-- ============================================================================

SET NOCOUNT ON;

PRINT '============================================================================';
PRINT 'WIPTransactions and DrsTransactions Index Analysis';
PRINT 'Generated: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '============================================================================';
PRINT '';

-- ============================================================================
-- 1. WIPTransactions Table - All Indexes
-- ============================================================================
PRINT '============================================================================';
PRINT '1. WIPTransactions - All Indexes';
PRINT '============================================================================';
PRINT '';

SELECT 
    i.name AS IndexName,
    i.type_desc AS IndexType,
    i.is_unique AS IsUnique,
    i.has_filter AS HasFilter,
    i.filter_definition AS FilterDef,
    STUFF((
        SELECT ', ' + c.name + CASE WHEN ic.is_descending_key = 1 THEN ' DESC' ELSE '' END
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
    (
        SELECT SUM(ps.used_page_count) * 8 / 1024
        FROM sys.dm_db_partition_stats ps
        WHERE ps.object_id = i.object_id AND ps.index_id = i.index_id
    ) AS SizeMB,
    (
        SELECT SUM(ps.row_count)
        FROM sys.dm_db_partition_stats ps
        WHERE ps.object_id = i.object_id AND ps.index_id = i.index_id
    ) AS RowCount
FROM sys.indexes i
WHERE i.object_id = OBJECT_ID('WIPTransactions')
AND i.name IS NOT NULL
ORDER BY i.name;

PRINT '';
PRINT '============================================================================';

-- ============================================================================
-- 2. WIPTransactions - Index Usage Statistics
-- ============================================================================
PRINT '2. WIPTransactions - Index Usage Statistics';
PRINT '============================================================================';
PRINT '';

SELECT 
    i.name AS IndexName,
    ISNULL(s.user_seeks, 0) AS UserSeeks,
    ISNULL(s.user_scans, 0) AS UserScans,
    ISNULL(s.user_lookups, 0) AS UserLookups,
    ISNULL(s.user_updates, 0) AS UserUpdates,
    s.last_user_seek AS LastSeek,
    s.last_user_scan AS LastScan,
    CASE 
        WHEN s.index_id IS NULL THEN 'UNUSED SINCE RESTART'
        WHEN ISNULL(s.user_seeks, 0) + ISNULL(s.user_scans, 0) + ISNULL(s.user_lookups, 0) = 0 THEN 'UNUSED'
        WHEN ISNULL(s.user_seeks, 0) > ISNULL(s.user_scans, 0) * 10 THEN 'OPTIMAL (Seeks >> Scans)'
        WHEN ISNULL(s.user_scans, 0) > ISNULL(s.user_seeks, 0) THEN 'CHECK (More Scans)'
        ELSE 'NORMAL'
    END AS UsagePattern
FROM sys.indexes i
LEFT JOIN sys.dm_db_index_usage_stats s 
    ON i.object_id = s.object_id 
    AND i.index_id = s.index_id
    AND s.database_id = DB_ID()
WHERE i.object_id = OBJECT_ID('WIPTransactions')
AND i.name IS NOT NULL
ORDER BY 
    CASE WHEN s.index_id IS NULL THEN 1 ELSE 0 END,
    ISNULL(s.user_seeks, 0) + ISNULL(s.user_scans, 0) DESC;

PRINT '';
PRINT '============================================================================';

-- ============================================================================
-- 3. WIPTransactions - Index Fragmentation
-- ============================================================================
PRINT '3. WIPTransactions - Index Fragmentation';
PRINT '============================================================================';
PRINT '';

SELECT 
    i.name AS IndexName,
    ips.avg_fragmentation_in_percent AS FragmentationPct,
    ips.page_count AS PageCount,
    ips.page_count * 8 / 1024 AS SizeMB,
    CASE 
        WHEN ips.avg_fragmentation_in_percent > 30 THEN '🔴 REBUILD REQUIRED'
        WHEN ips.avg_fragmentation_in_percent > 10 THEN '🟡 REORGANIZE RECOMMENDED'
        ELSE '🟢 HEALTHY'
    END AS Status
FROM sys.dm_db_index_physical_stats(DB_ID(), OBJECT_ID('WIPTransactions'), NULL, NULL, 'SAMPLED') ips
JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
WHERE i.name IS NOT NULL
ORDER BY ips.avg_fragmentation_in_percent DESC;

PRINT '';
PRINT '============================================================================';

-- ============================================================================
-- 4. DrsTransactions Table - All Indexes
-- ============================================================================
PRINT '4. DrsTransactions - All Indexes';
PRINT '============================================================================';
PRINT '';

SELECT 
    i.name AS IndexName,
    i.type_desc AS IndexType,
    i.is_unique AS IsUnique,
    i.has_filter AS HasFilter,
    i.filter_definition AS FilterDef,
    STUFF((
        SELECT ', ' + c.name + CASE WHEN ic.is_descending_key = 1 THEN ' DESC' ELSE '' END
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
    (
        SELECT SUM(ps.used_page_count) * 8 / 1024
        FROM sys.dm_db_partition_stats ps
        WHERE ps.object_id = i.object_id AND ps.index_id = i.index_id
    ) AS SizeMB,
    (
        SELECT SUM(ps.row_count)
        FROM sys.dm_db_partition_stats ps
        WHERE ps.object_id = i.object_id AND ps.index_id = i.index_id
    ) AS RowCount
FROM sys.indexes i
WHERE i.object_id = OBJECT_ID('DrsTransactions')
AND i.name IS NOT NULL
ORDER BY i.name;

PRINT '';
PRINT '============================================================================';

-- ============================================================================
-- 5. DrsTransactions - Index Usage Statistics
-- ============================================================================
PRINT '5. DrsTransactions - Index Usage Statistics';
PRINT '============================================================================';
PRINT '';

SELECT 
    i.name AS IndexName,
    ISNULL(s.user_seeks, 0) AS UserSeeks,
    ISNULL(s.user_scans, 0) AS UserScans,
    ISNULL(s.user_lookups, 0) AS UserLookups,
    ISNULL(s.user_updates, 0) AS UserUpdates,
    s.last_user_seek AS LastSeek,
    s.last_user_scan AS LastScan,
    CASE 
        WHEN s.index_id IS NULL THEN 'UNUSED SINCE RESTART'
        WHEN ISNULL(s.user_seeks, 0) + ISNULL(s.user_scans, 0) + ISNULL(s.user_lookups, 0) = 0 THEN 'UNUSED'
        WHEN ISNULL(s.user_seeks, 0) > ISNULL(s.user_scans, 0) * 10 THEN 'OPTIMAL (Seeks >> Scans)'
        WHEN ISNULL(s.user_scans, 0) > ISNULL(s.user_seeks, 0) THEN 'CHECK (More Scans)'
        ELSE 'NORMAL'
    END AS UsagePattern
FROM sys.indexes i
LEFT JOIN sys.dm_db_index_usage_stats s 
    ON i.object_id = s.object_id 
    AND i.index_id = s.index_id
    AND s.database_id = DB_ID()
WHERE i.object_id = OBJECT_ID('DrsTransactions')
AND i.name IS NOT NULL
ORDER BY 
    CASE WHEN s.index_id IS NULL THEN 1 ELSE 0 END,
    ISNULL(s.user_seeks, 0) + ISNULL(s.user_scans, 0) DESC;

PRINT '';
PRINT '============================================================================';

-- ============================================================================
-- 6. DrsTransactions - Index Fragmentation
-- ============================================================================
PRINT '6. DrsTransactions - Index Fragmentation';
PRINT '============================================================================';
PRINT '';

SELECT 
    i.name AS IndexName,
    ips.avg_fragmentation_in_percent AS FragmentationPct,
    ips.page_count AS PageCount,
    ips.page_count * 8 / 1024 AS SizeMB,
    CASE 
        WHEN ips.avg_fragmentation_in_percent > 30 THEN '🔴 REBUILD REQUIRED'
        WHEN ips.avg_fragmentation_in_percent > 10 THEN '🟡 REORGANIZE RECOMMENDED'
        ELSE '🟢 HEALTHY'
    END AS Status
FROM sys.dm_db_index_physical_stats(DB_ID(), OBJECT_ID('DrsTransactions'), NULL, NULL, 'SAMPLED') ips
JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
WHERE i.name IS NOT NULL
ORDER BY ips.avg_fragmentation_in_percent DESC;

PRINT '';
PRINT '============================================================================';

-- ============================================================================
-- 7. Summary Statistics
-- ============================================================================
PRINT '7. Summary Statistics';
PRINT '============================================================================';
PRINT '';

SELECT 
    'WIPTransactions' AS TableName,
    COUNT(*) AS TotalIndexes,
    SUM(CASE WHEN i.has_filter = 1 THEN 1 ELSE 0 END) AS FilteredIndexes,
    SUM(CASE WHEN EXISTS (
        SELECT 1 FROM sys.index_columns ic 
        WHERE ic.object_id = i.object_id 
        AND ic.index_id = i.index_id 
        AND ic.is_included_column = 1
    ) THEN 1 ELSE 0 END) AS IndexesWithINCLUDE,
    (SELECT SUM(ps.used_page_count) * 8 / 1024 
     FROM sys.dm_db_partition_stats ps 
     WHERE ps.object_id = OBJECT_ID('WIPTransactions')) AS TotalIndexSizeMB,
    (SELECT SUM(ps.row_count) 
     FROM sys.dm_db_partition_stats ps 
     WHERE ps.object_id = OBJECT_ID('WIPTransactions')
     AND ps.index_id IN (0,1)) AS RowCount
FROM sys.indexes i
WHERE i.object_id = OBJECT_ID('WIPTransactions')
AND i.name IS NOT NULL

UNION ALL

SELECT 
    'DrsTransactions' AS TableName,
    COUNT(*) AS TotalIndexes,
    SUM(CASE WHEN i.has_filter = 1 THEN 1 ELSE 0 END) AS FilteredIndexes,
    SUM(CASE WHEN EXISTS (
        SELECT 1 FROM sys.index_columns ic 
        WHERE ic.object_id = i.object_id 
        AND ic.index_id = i.index_id 
        AND ic.is_included_column = 1
    ) THEN 1 ELSE 0 END) AS IndexesWithINCLUDE,
    (SELECT SUM(ps.used_page_count) * 8 / 1024 
     FROM sys.dm_db_partition_stats ps 
     WHERE ps.object_id = OBJECT_ID('DrsTransactions')) AS TotalIndexSizeMB,
    (SELECT SUM(ps.row_count) 
     FROM sys.dm_db_partition_stats ps 
     WHERE ps.object_id = OBJECT_ID('DrsTransactions')
     AND ps.index_id IN (0,1)) AS RowCount
FROM sys.indexes i
WHERE i.object_id = OBJECT_ID('DrsTransactions')
AND i.name IS NOT NULL;

PRINT '';
PRINT '============================================================================';
PRINT 'Analysis Complete';
PRINT '============================================================================';
PRINT '';
PRINT 'Key Findings to Review:';
PRINT '  - Total index count per table';
PRINT '  - Indexes with INCLUDE columns (covering indexes)';
PRINT '  - Usage patterns (unused indexes = candidates for removal)';
PRINT '  - Fragmentation levels (rebuild if >30%)';
PRINT '';
PRINT 'Next Steps:';
PRINT '  1. Compare with Prisma schema definitions';
PRINT '  2. Identify unused indexes for removal';
PRINT '  3. Check for missing covering indexes for My Reports queries';
PRINT '  4. Rebuild highly fragmented indexes';
PRINT '';
