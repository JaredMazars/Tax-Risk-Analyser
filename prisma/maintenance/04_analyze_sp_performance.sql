-- ============================================================================
-- Stored Procedure Performance Analysis
-- ============================================================================
-- 
-- PURPOSE: Identify slow stored procedures and diagnose performance issues
--
-- WHAT THIS SCRIPT ANALYZES:
--   - Execution frequency and average duration
--   - CPU usage and I/O operations
--   - Query plan quality (seeks vs scans)
--   - Parameter sniffing issues
--   - Cached plan efficiency
--
-- WHEN TO RUN:
--   - When users report slow performance
--   - After deploying new stored procedures
--   - Weekly performance monitoring
--   - After applying index changes
--
-- HOW TO USE:
--   1. Run entire script to get comprehensive analysis
--   2. Focus on "Slowest Stored Procedures" section
--   3. Check "Query Plan Analysis" for table scans
--   4. Review "Parameter Sniffing Candidates" for recompile needs
--
-- ============================================================================

SET NOCOUNT ON;

PRINT '=============================================================================';
PRINT 'Stored Procedure Performance Analysis';
PRINT 'Timestamp: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT 'Database: ' + DB_NAME();
PRINT '=============================================================================';
PRINT '';

-- ============================================================================
-- 1. Slowest Stored Procedures (by Total Duration)
-- ============================================================================

PRINT '1. SLOWEST STORED PROCEDURES (Total Duration)';
PRINT '-----------------------------------------------';
PRINT 'Shows procedures consuming most total database time';
PRINT '';

SELECT TOP 20
    DB_NAME(ps.database_id) AS DatabaseName,
    OBJECT_NAME(ps.object_id, ps.database_id) AS ProcedureName,
    ps.execution_count AS ExecCount,
    CAST(ps.total_elapsed_time / 1000000.0 AS DECIMAL(18,2)) AS TotalElapsedSec,
    CAST(ps.total_elapsed_time / ps.execution_count / 1000.0 AS DECIMAL(18,2)) AS AvgElapsedMs,
    CAST(ps.min_elapsed_time / 1000.0 AS DECIMAL(18,2)) AS MinElapsedMs,
    CAST(ps.max_elapsed_time / 1000.0 AS DECIMAL(18,2)) AS MaxElapsedMs,
    CAST(ps.total_worker_time / 1000000.0 AS DECIMAL(18,2)) AS TotalCPUSec,
    CAST(ps.total_worker_time / ps.execution_count / 1000.0 AS DECIMAL(18,2)) AS AvgCPUMs,
    ps.cached_time AS CachedTime,
    ps.last_execution_time AS LastExecution
FROM sys.dm_exec_procedure_stats ps
WHERE DB_NAME(ps.database_id) = DB_NAME()
    AND OBJECT_NAME(ps.object_id, ps.database_id) LIKE 'sp_%'
ORDER BY ps.total_elapsed_time DESC;

PRINT '';
PRINT '';

-- ============================================================================
-- 2. Slowest Stored Procedures (by Average Duration)
-- ============================================================================

PRINT '2. SLOWEST STORED PROCEDURES (Average Duration)';
PRINT '-------------------------------------------------';
PRINT 'Shows procedures with highest average execution time';
PRINT '';

SELECT TOP 20
    OBJECT_NAME(ps.object_id, ps.database_id) AS ProcedureName,
    ps.execution_count AS ExecCount,
    CAST(ps.total_elapsed_time / ps.execution_count / 1000.0 AS DECIMAL(18,2)) AS AvgElapsedMs,
    CAST(ps.min_elapsed_time / 1000.0 AS DECIMAL(18,2)) AS MinElapsedMs,
    CAST(ps.max_elapsed_time / 1000.0 AS DECIMAL(18,2)) AS MaxElapsedMs,
    CAST((ps.max_elapsed_time - ps.min_elapsed_time) / 1000.0 AS DECIMAL(18,2)) AS VarianceMs,
    CAST(ps.total_logical_reads * 1.0 / ps.execution_count AS DECIMAL(18,2)) AS AvgLogicalReads,
    ps.last_execution_time AS LastExecution,
    CASE 
        WHEN ps.execution_count > 0 AND 
             (ps.max_elapsed_time - ps.min_elapsed_time) > (ps.total_elapsed_time / ps.execution_count) * 3 
        THEN 'Possible Parameter Sniffing'
        ELSE 'Normal'
    END AS PerfProfile
FROM sys.dm_exec_procedure_stats ps
WHERE DB_NAME(ps.database_id) = DB_NAME()
    AND OBJECT_NAME(ps.object_id, ps.database_id) LIKE 'sp_%'
    AND ps.execution_count > 0
ORDER BY (ps.total_elapsed_time / ps.execution_count) DESC;

PRINT '';
PRINT '';

-- ============================================================================
-- 3. High I/O Stored Procedures
-- ============================================================================

PRINT '3. HIGH I/O STORED PROCEDURES';
PRINT '-------------------------------';
PRINT 'Shows procedures doing most logical reads (memory + disk I/O)';
PRINT '';

SELECT TOP 20
    OBJECT_NAME(ps.object_id, ps.database_id) AS ProcedureName,
    ps.execution_count AS ExecCount,
    ps.total_logical_reads AS TotalReads,
    CAST(ps.total_logical_reads * 1.0 / ps.execution_count AS DECIMAL(18,2)) AS AvgReads,
    ps.total_logical_writes AS TotalWrites,
    CAST(ps.total_logical_writes * 1.0 / ps.execution_count AS DECIMAL(18,2)) AS AvgWrites,
    CAST(ps.total_elapsed_time / ps.execution_count / 1000.0 AS DECIMAL(18,2)) AS AvgElapsedMs,
    ps.last_execution_time AS LastExecution
FROM sys.dm_exec_procedure_stats ps
WHERE DB_NAME(ps.database_id) = DB_NAME()
    AND OBJECT_NAME(ps.object_id, ps.database_id) LIKE 'sp_%'
ORDER BY ps.total_logical_reads DESC;

PRINT '';
PRINT '';

-- ============================================================================
-- 4. Parameter Sniffing Candidates
-- ============================================================================

PRINT '4. PARAMETER SNIFFING CANDIDATES';
PRINT '----------------------------------';
PRINT 'Procedures with high variance between min/max execution times';
PRINT 'High variance suggests cached plan is not optimal for all parameters';
PRINT '';

SELECT TOP 15
    OBJECT_NAME(ps.object_id, ps.database_id) AS ProcedureName,
    ps.execution_count AS ExecCount,
    CAST(ps.min_elapsed_time / 1000.0 AS DECIMAL(18,2)) AS MinMs,
    CAST(ps.max_elapsed_time / 1000.0 AS DECIMAL(18,2)) AS MaxMs,
    CAST((ps.max_elapsed_time - ps.min_elapsed_time) / 1000.0 AS DECIMAL(18,2)) AS VarianceMs,
    CAST(ps.total_elapsed_time / ps.execution_count / 1000.0 AS DECIMAL(18,2)) AS AvgMs,
    CAST((ps.max_elapsed_time * 1.0 / NULLIF(ps.min_elapsed_time, 0)) AS DECIMAL(18,2)) AS MaxMinRatio,
    ps.cached_time AS CachedTime,
    ps.last_execution_time AS LastExecution
FROM sys.dm_exec_procedure_stats ps
WHERE DB_NAME(ps.database_id) = DB_NAME()
    AND OBJECT_NAME(ps.object_id, ps.database_id) LIKE 'sp_%'
    AND ps.execution_count > 5  -- Need some executions to show variance
    AND ps.max_elapsed_time > ps.min_elapsed_time * 5  -- Max is 5x slower than min
ORDER BY (ps.max_elapsed_time - ps.min_elapsed_time) DESC;

PRINT '';
PRINT 'If MaxMinRatio > 10: Strong parameter sniffing indicator';
PRINT 'Solution: Add OPTION (RECOMPILE) or use dynamic SQL';
PRINT '';
PRINT '';

-- ============================================================================
-- 5. Query Plan Analysis for Specific Stored Procedures
-- ============================================================================

PRINT '5. QUERY PLAN ANALYSIS - Our Key Stored Procedures';
PRINT '----------------------------------------------------';
PRINT 'Analyzing execution plans for common performance issues';
PRINT '';

-- Our key stored procedures to analyze
DECLARE @ProcNames TABLE (ProcName NVARCHAR(128));
INSERT INTO @ProcNames VALUES 
    ('sp_ProfitabilityData'),
    ('sp_WipMonthly'),
    ('sp_DrsMonthly'),
    ('sp_RecoverabilityData'),
    ('sp_GroupGraphData'),
    ('sp_ClientGraphData'),
    ('sp_WIPAgingByTask');

SELECT 
    OBJECT_NAME(ps.object_id, ps.database_id) AS ProcedureName,
    ps.execution_count AS ExecCount,
    CAST(ps.total_elapsed_time / ps.execution_count / 1000.0 AS DECIMAL(18,2)) AS AvgMs,
    CAST(ps.total_logical_reads * 1.0 / ps.execution_count AS DECIMAL(18,2)) AS AvgReads,
    ps.cached_time AS CachedTime,
    ps.last_execution_time AS LastExecution,
    -- Plan analysis
    CASE 
        WHEN qp.query_plan.value('count(//RelOp[@PhysicalOp="Table Scan"])', 'int') > 0 
        THEN 'TABLE SCAN DETECTED'
        ELSE 'OK'
    END AS TableScanStatus,
    qp.query_plan.value('count(//RelOp[@PhysicalOp="Index Scan"])', 'int') AS IndexScans,
    qp.query_plan.value('count(//RelOp[@PhysicalOp="Index Seek"])', 'int') AS IndexSeeks,
    qp.query_plan.value('count(//RelOp[@PhysicalOp="Clustered Index Seek"])', 'int') AS ClusteredSeeks,
    CASE 
        WHEN qp.query_plan.exist('//MissingIndexes') = 1 
        THEN 'MISSING INDEXES'
        ELSE 'OK'
    END AS MissingIndexStatus
FROM sys.dm_exec_procedure_stats ps
CROSS APPLY sys.dm_exec_query_plan(ps.plan_handle) qp
WHERE DB_NAME(ps.database_id) = DB_NAME()
    AND OBJECT_NAME(ps.object_id, ps.database_id) IN (SELECT ProcName FROM @ProcNames)
ORDER BY OBJECT_NAME(ps.object_id, ps.database_id);

PRINT '';
PRINT 'INTERPRETATION:';
PRINT '- TABLE SCAN DETECTED: Procedure scanning entire table (bad for large tables)';
PRINT '- IndexSeeks > IndexScans: Good (index seeks are efficient)';
PRINT '- MISSING INDEXES: SQL Server identified missing indexes in query plan';
PRINT '';
PRINT '';

-- ============================================================================
-- 6. Recompilation Statistics
-- ============================================================================

PRINT '6. RECOMPILATION STATISTICS';
PRINT '-----------------------------';
PRINT 'Shows how often stored procedures are recompiling';
PRINT '';

SELECT TOP 15
    OBJECT_NAME(ps.object_id, ps.database_id) AS ProcedureName,
    ps.execution_count AS ExecCount,
    ps.cached_time AS CachedTime,
    DATEDIFF(HOUR, ps.cached_time, GETDATE()) AS HoursCached,
    ps.last_execution_time AS LastExecution,
    CASE 
        WHEN DATEDIFF(HOUR, ps.cached_time, GETDATE()) < 1 AND ps.execution_count < 10 
        THEN 'Recently recompiled'
        WHEN DATEDIFF(DAY, ps.cached_time, GETDATE()) > 7 
        THEN 'Old plan (consider recompile)'
        ELSE 'Normal'
    END AS CacheStatus
FROM sys.dm_exec_procedure_stats ps
WHERE DB_NAME(ps.database_id) = DB_NAME()
    AND OBJECT_NAME(ps.object_id, ps.database_id) LIKE 'sp_%'
ORDER BY ps.cached_time DESC;

PRINT '';
PRINT '';

-- ============================================================================
-- 7. Recommendations
-- ============================================================================

PRINT '';
PRINT '=============================================================================';
PRINT 'RECOMMENDATIONS';
PRINT '=============================================================================';
PRINT '';

DECLARE @SlowProcs INT;
DECLARE @HighIOProcs INT;
DECLARE @ParamSniffing INT;

SELECT @SlowProcs = COUNT(*)
FROM sys.dm_exec_procedure_stats ps
WHERE DB_NAME(ps.database_id) = DB_NAME()
    AND OBJECT_NAME(ps.object_id, ps.database_id) LIKE 'sp_%'
    AND ps.total_elapsed_time / ps.execution_count > 1000000;  -- > 1 second avg

SELECT @HighIOProcs = COUNT(*)
FROM sys.dm_exec_procedure_stats ps
WHERE DB_NAME(ps.database_id) = DB_NAME()
    AND OBJECT_NAME(ps.object_id, ps.database_id) LIKE 'sp_%'
    AND ps.total_logical_reads / ps.execution_count > 50000;  -- > 50K reads avg

SELECT @ParamSniffing = COUNT(*)
FROM sys.dm_exec_procedure_stats ps
WHERE DB_NAME(ps.database_id) = DB_NAME()
    AND OBJECT_NAME(ps.object_id, ps.database_id) LIKE 'sp_%'
    AND ps.execution_count > 5
    AND ps.max_elapsed_time > ps.min_elapsed_time * 5;

IF @SlowProcs > 0
    PRINT '⚠ ' + CAST(@SlowProcs AS VARCHAR) + ' stored procedures averaging > 1 second execution time';

IF @HighIOProcs > 0
    PRINT '⚠ ' + CAST(@HighIOProcs AS VARCHAR) + ' stored procedures doing excessive I/O (> 50K reads)';

IF @ParamSniffing > 0
    PRINT '⚠ ' + CAST(@ParamSniffing AS VARCHAR) + ' stored procedures showing parameter sniffing symptoms';

PRINT '';
PRINT 'ACTION ITEMS:';
PRINT '';
PRINT '1. Clear Procedure Cache (Forces recompilation with current statistics):';
PRINT '   DBCC FREEPROCCACHE;  -- Clears all cached plans';
PRINT '   EXEC sp_recompile ''sp_ProcedureName'';  -- Recompile specific SP';
PRINT '';
PRINT '2. For Parameter Sniffing Issues:';
PRINT '   - Add OPTION (RECOMPILE) to slow queries';
PRINT '   - Use dynamic SQL for optional parameters';
PRINT '   - See: stored-procedure-rules.mdc for patterns';
PRINT '';
PRINT '3. For High I/O Procedures:';
PRINT '   - Check for missing indexes (see missing index queries)';
PRINT '   - Review query plans for table scans';
PRINT '   - Add covering indexes for frequent queries';
PRINT '';
PRINT '4. For Table Scan Issues:';
PRINT '   - Review execution plans (Section 5 above)';
PRINT '   - Create appropriate indexes';
PRINT '   - Ensure statistics are current';
PRINT '';

GO
