-- ============================================================================
-- Update Statistics for Key Tables
-- ============================================================================
-- 
-- PURPOSE: Update statistics for accurate cardinality estimates and optimal query plans
--
-- WHY STATISTICS MATTER:
--   - Query optimizer uses statistics to choose execution plans
--   - Stale statistics lead to poor plans (table scans instead of seeks)
--   - Especially critical after large data changes (imports, deletes)
--   - SQL Server auto-updates stats, but not always frequently enough
--
-- WHEN TO RUN:
--   - Weekly for transaction tables (WIPTransactions, DrsTransactions)
--   - After bulk inserts/deletes (> 10% of table rows)
--   - When stored procedures suddenly become slow
--   - After creating new indexes
--
-- HOW TO USE:
--   Execute entire script - takes 5-10 minutes for large tables
--
-- PERFORMANCE IMPACT:
--   - FULLSCAN reads entire table but produces most accurate stats
--   - Creates shared table locks (brief, typically < 1 second per table)
--   - Safe to run during business hours (low impact)
--
-- ============================================================================

SET NOCOUNT ON;

PRINT '=============================================================================';
PRINT 'Statistics Update Process';
PRINT 'Timestamp: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '=============================================================================';
PRINT '';

DECLARE @StartTime DATETIME = GETDATE();
DECLARE @TableStartTime DATETIME;
DECLARE @Duration INT;

-- ============================================================================
-- 1. WIPTransactions (5.7M rows - MOST CRITICAL)
-- ============================================================================

PRINT '1. Updating WIPTransactions statistics...';
PRINT '   Table: 5.7M rows, multiple covering indexes';
SET @TableStartTime = GETDATE();

UPDATE STATISTICS [dbo].[WIPTransactions] WITH FULLSCAN;

SET @Duration = DATEDIFF(SECOND, @TableStartTime, GETDATE());
PRINT '   ✓ WIPTransactions complete (' + CAST(@Duration AS VARCHAR) + ' seconds)';
PRINT '';

-- ============================================================================
-- 2. DrsTransactions (1M+ rows)
-- ============================================================================

PRINT '2. Updating DrsTransactions statistics...';
PRINT '   Table: 1M+ rows, recoverability queries';
SET @TableStartTime = GETDATE();

UPDATE STATISTICS [dbo].[DrsTransactions] WITH FULLSCAN;

SET @Duration = DATEDIFF(SECOND, @TableStartTime, GETDATE());
PRINT '   ✓ DrsTransactions complete (' + CAST(@Duration AS VARCHAR) + ' seconds)';
PRINT '';

-- ============================================================================
-- 3. Task (100K+ rows)
-- ============================================================================

PRINT '3. Updating Task statistics...';
PRINT '   Table: 100K+ rows, critical for joins';
SET @TableStartTime = GETDATE();

UPDATE STATISTICS [dbo].[Task] WITH FULLSCAN;

SET @Duration = DATEDIFF(SECOND, @TableStartTime, GETDATE());
PRINT '   ✓ Task complete (' + CAST(@Duration AS VARCHAR) + ' seconds)';
PRINT '';

-- ============================================================================
-- 4. Client (supporting table)
-- ============================================================================

PRINT '4. Updating Client statistics...';
SET @TableStartTime = GETDATE();

UPDATE STATISTICS [dbo].[Client] WITH FULLSCAN;

SET @Duration = DATEDIFF(SECOND, @TableStartTime, GETDATE());
PRINT '   ✓ Client complete (' + CAST(@Duration AS VARCHAR) + ' seconds)';
PRINT '';

-- ============================================================================
-- 5. Employee (supporting table)
-- ============================================================================

PRINT '5. Updating Employee statistics...';
SET @TableStartTime = GETDATE();

UPDATE STATISTICS [dbo].[Employee] WITH FULLSCAN;

SET @Duration = DATEDIFF(SECOND, @TableStartTime, GETDATE());
PRINT '   ✓ Employee complete (' + CAST(@Duration AS VARCHAR) + ' seconds)';
PRINT '';

-- ============================================================================
-- 6. Debtors (aging calculations)
-- ============================================================================

PRINT '6. Updating Debtors statistics...';
SET @TableStartTime = GETDATE();

UPDATE STATISTICS [dbo].[Debtors] WITH FULLSCAN;

SET @Duration = DATEDIFF(SECOND, @TableStartTime, GETDATE());
PRINT '   ✓ Debtors complete (' + CAST(@Duration AS VARCHAR) + ' seconds)';
PRINT '';

-- ============================================================================
-- 7. Wip (balance calculations)
-- ============================================================================

PRINT '7. Updating Wip statistics...';
SET @TableStartTime = GETDATE();

UPDATE STATISTICS [dbo].[Wip] WITH FULLSCAN;

SET @Duration = DATEDIFF(SECOND, @TableStartTime, GETDATE());
PRINT '   ✓ Wip complete (' + CAST(@Duration AS VARCHAR) + ' seconds)';
PRINT '';

-- ============================================================================
-- Summary
-- ============================================================================

SET @Duration = DATEDIFF(SECOND, @StartTime, GETDATE());

PRINT '';
PRINT '=============================================================================';
PRINT 'Statistics Update Complete';
PRINT 'Total Duration: ' + CAST(@Duration AS VARCHAR) + ' seconds';
PRINT '=============================================================================';
PRINT '';
PRINT 'WHAT HAPPENS NEXT:';
PRINT '- Query optimizer will use new statistics for execution plans';
PRINT '- Stored procedures may recompile with better plans';
PRINT '- Monitor query performance over next 24 hours';
PRINT '';
PRINT 'IF STORED PROCEDURES STILL SLOW:';
PRINT '- Clear procedure cache to force recompilation';
PRINT '- Run: DBCC FREEPROCCACHE';
PRINT '- Or recompile specific SP: EXEC sp_recompile ''sp_ProcedureName''';
PRINT '';

GO

-- ============================================================================
-- Verify Statistics Update
-- ============================================================================

PRINT 'VERIFICATION: Statistics last updated dates';
PRINT '----------------------------------------------';
PRINT '';

SELECT 
    OBJECT_NAME(s.object_id) AS TableName,
    i.name AS IndexName,
    STATS_DATE(s.object_id, s.stats_id) AS LastUpdated,
    DATEDIFF(MINUTE, STATS_DATE(s.object_id, s.stats_id), GETDATE()) AS MinutesAgo,
    sp.rows AS RowCount
FROM sys.stats s
INNER JOIN sys.indexes i ON s.object_id = i.object_id AND s.stats_id = i.index_id
INNER JOIN sys.partitions sp ON s.object_id = sp.object_id AND sp.index_id < 2
WHERE OBJECT_NAME(s.object_id) IN (
    'WIPTransactions', 
    'DrsTransactions', 
    'Task', 
    'Client', 
    'Employee', 
    'Debtors', 
    'Wip'
)
    AND i.name LIKE 'IX_%'
ORDER BY OBJECT_NAME(s.object_id), i.name;

PRINT '';
PRINT 'All statistics should show MinutesAgo < 5';
PRINT '';

GO
