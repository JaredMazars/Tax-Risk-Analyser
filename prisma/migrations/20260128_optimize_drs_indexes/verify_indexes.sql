-- ============================================================================
-- Verification Script: DrsTransactions Index Optimization
-- Created: 2026-01-28
-- Run this AFTER applying migration.sql to verify indexes are working correctly
-- ============================================================================

-- ============================================================================
-- STEP 1: Verify Index Structure
-- ============================================================================

PRINT '=== Current Indexes on DrsTransactions ===';

SELECT 
    i.name AS IndexName,
    i.type_desc AS IndexType,
    i.is_unique AS IsUnique,
    i.has_filter AS HasFilter,
    i.filter_definition AS FilterDefinition
FROM sys.indexes i
WHERE i.object_id = OBJECT_ID('dbo.DrsTransactions')
ORDER BY i.name;

-- ============================================================================
-- STEP 2: Verify Index Key Columns
-- ============================================================================

PRINT '';
PRINT '=== Index Key Columns ===';

SELECT 
    i.name AS IndexName,
    c.name AS ColumnName,
    ic.key_ordinal AS KeyPosition,
    'KEY' AS ColumnType
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('dbo.DrsTransactions')
    AND ic.is_included_column = 0
    AND i.name IN ('idx_drs_client_covering', 'idx_drs_biller_covering')
ORDER BY i.name, ic.key_ordinal;

-- ============================================================================
-- STEP 3: Verify Index INCLUDE Columns
-- ============================================================================

PRINT '';
PRINT '=== Index INCLUDE Columns ===';

SELECT 
    i.name AS IndexName,
    STRING_AGG(c.name, ', ') WITHIN GROUP (ORDER BY c.name) AS IncludedColumns
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('dbo.DrsTransactions')
    AND ic.is_included_column = 1
    AND i.name IN ('idx_drs_client_covering', 'idx_drs_biller_covering')
GROUP BY i.name
ORDER BY i.name;

-- ============================================================================
-- STEP 4: Verify Old Indexes Are Removed
-- ============================================================================

PRINT '';
PRINT '=== Verify Old Indexes Removed ===';

DECLARE @OldIndexesExist INT = 0;

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_drs_gsclientid_super_covering' AND object_id = OBJECT_ID('dbo.DrsTransactions'))
BEGIN
    PRINT 'WARNING: idx_drs_gsclientid_super_covering still exists!';
    SET @OldIndexesExist = 1;
END

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_drs_biller_super_covering' AND object_id = OBJECT_ID('dbo.DrsTransactions'))
BEGIN
    PRINT 'WARNING: idx_drs_biller_super_covering still exists!';
    SET @OldIndexesExist = 1;
END

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'DrsTransactions_OfficeCode_idx' AND object_id = OBJECT_ID('dbo.DrsTransactions'))
BEGIN
    PRINT 'WARNING: DrsTransactions_OfficeCode_idx still exists!';
    SET @OldIndexesExist = 1;
END

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'DrsTransactions_PeriodKey_idx' AND object_id = OBJECT_ID('dbo.DrsTransactions'))
BEGIN
    PRINT 'WARNING: DrsTransactions_PeriodKey_idx still exists!';
    SET @OldIndexesExist = 1;
END

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'DrsTransactions_ServLineCode_idx' AND object_id = OBJECT_ID('dbo.DrsTransactions'))
BEGIN
    PRINT 'WARNING: DrsTransactions_ServLineCode_idx still exists!';
    SET @OldIndexesExist = 1;
END

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'DrsTransactions_TranDate_idx' AND object_id = OBJECT_ID('dbo.DrsTransactions'))
BEGIN
    PRINT 'WARNING: DrsTransactions_TranDate_idx still exists!';
    SET @OldIndexesExist = 1;
END

IF @OldIndexesExist = 0
BEGIN
    PRINT 'OK: All old indexes have been removed.';
END

-- ============================================================================
-- STEP 5: Test Query Plans (Index Usage)
-- ============================================================================

PRINT '';
PRINT '=== Testing Query Plans ===';
PRINT 'Run these queries with SET SHOWPLAN_TEXT ON to verify index usage:';
PRINT '';

-- Test 1: Client-based query (should use idx_drs_client_covering)
PRINT '-- Test 1: Client-based query (should use idx_drs_client_covering)';
PRINT 'SET SHOWPLAN_TEXT ON;';
PRINT 'GO';
PRINT 'SELECT TranDate, Total, EntryType, InvNumber, Reference, Narration, ServLineCode, updatedAt';
PRINT 'FROM DrsTransactions';
PRINT 'WHERE GSClientID = ''00000000-0000-0000-0000-000000000001''';
PRINT '  AND TranDate >= ''2025-01-01'';';
PRINT 'GO';
PRINT 'SET SHOWPLAN_TEXT OFF;';
PRINT 'GO';
PRINT '';

-- Test 2: Biller-based query (should use idx_drs_biller_covering)
PRINT '-- Test 2: Biller-based query (should use idx_drs_biller_covering)';
PRINT 'SET SHOWPLAN_TEXT ON;';
PRINT 'GO';
PRINT 'SELECT TranDate, Total, EntryType, InvNumber, Reference, Narration, ServLineCode, GSClientID';
PRINT 'FROM DrsTransactions';
PRINT 'WHERE Biller = ''ABC123''';
PRINT '  AND TranDate <= ''2026-01-28'';';
PRINT 'GO';
PRINT 'SET SHOWPLAN_TEXT OFF;';
PRINT 'GO';
PRINT '';

-- Test 3: Collections query with EntryType filter (should use idx_drs_biller_covering efficiently)
PRINT '-- Test 3: Collections query with EntryType filter (should use idx_drs_biller_covering efficiently)';
PRINT 'SET SHOWPLAN_TEXT ON;';
PRINT 'GO';
PRINT 'SELECT TranDate, Total, ServLineCode';
PRINT 'FROM DrsTransactions';
PRINT 'WHERE Biller = ''ABC123''';
PRINT '  AND EntryType = ''Receipt''';
PRINT '  AND TranDate BETWEEN ''2025-01-01'' AND ''2026-01-28'';';
PRINT 'GO';
PRINT 'SET SHOWPLAN_TEXT OFF;';
PRINT 'GO';
PRINT '';

-- ============================================================================
-- STEP 6: Index Statistics
-- ============================================================================

PRINT '';
PRINT '=== Index Statistics ===';

SELECT 
    i.name AS IndexName,
    s.user_seeks AS Seeks,
    s.user_scans AS Scans,
    s.user_lookups AS Lookups,
    s.user_updates AS Updates,
    s.last_user_seek AS LastSeek,
    s.last_user_scan AS LastScan
FROM sys.indexes i
LEFT JOIN sys.dm_db_index_usage_stats s 
    ON i.object_id = s.object_id 
    AND i.index_id = s.index_id
    AND s.database_id = DB_ID()
WHERE i.object_id = OBJECT_ID('dbo.DrsTransactions')
    AND i.name IN ('idx_drs_client_covering', 'idx_drs_biller_covering')
ORDER BY i.name;

PRINT '';
PRINT '=== Verification Complete ===';
