-- ============================================================================
-- Daily Database Maintenance Script
-- ============================================================================
-- 
-- PURPOSE: Comprehensive daily maintenance routine combining:
--   1. Process monitoring (identify blocking)
--   2. Statistics updates (for key tables)
--   3. Index fragmentation check
--   4. Stored procedure performance analysis
--
-- RECOMMENDED SCHEDULE:
--   - Daily at 2:00 AM (low activity period)
--   - Duration: 15-20 minutes
--   - Safe to run during business hours if needed
--
-- SQL SERVER AGENT JOB SETUP:
--   1. Open SQL Server Management Studio
--   2. Expand SQL Server Agent → Jobs
--   3. Right-click Jobs → New Job
--   4. Name: "Daily Database Maintenance"
--   5. Steps → New:
--      - Type: Transact-SQL script (T-SQL)
--      - Database: [Your database name]
--      - Command: Contents of this file
--   6. Schedules → New:
--      - Name: "Daily 2 AM"
--      - Frequency: Daily at 02:00:00
--   7. Notifications: Configure email alerts on failure
--
-- MANUAL EXECUTION:
--   Run this script in SSMS when performance issues occur
--
-- ============================================================================

SET NOCOUNT ON;

DECLARE @MaintenanceStart DATETIME = GETDATE();
DECLARE @StepStart DATETIME;
DECLARE @Duration INT;

PRINT '';
PRINT '=============================================================================';
PRINT '=============================================================================';
PRINT '                   DAILY DATABASE MAINTENANCE';
PRINT '=============================================================================';
PRINT '=============================================================================';
PRINT '';
PRINT 'Database: ' + DB_NAME();
PRINT 'Start Time: ' + CONVERT(VARCHAR, @MaintenanceStart, 120);
PRINT '';
PRINT '';

-- ============================================================================
-- STEP 1: Quick Health Check
-- ============================================================================

PRINT '=============================================================================';
PRINT 'STEP 1: Quick Health Check';
PRINT '=============================================================================';
PRINT '';

-- Check for blocking
DECLARE @BlockingCount INT;
SELECT @BlockingCount = COUNT(*)
FROM sys.dm_exec_requests
WHERE blocking_session_id > 0;

IF @BlockingCount > 0
    PRINT '⚠ WARNING: ' + CAST(@BlockingCount AS VARCHAR) + ' sessions currently blocked';
ELSE
    PRINT '✓ No blocking detected';

-- Check for long-running queries
DECLARE @LongRunning INT;
SELECT @LongRunning = COUNT(*)
FROM sys.dm_exec_requests
WHERE total_elapsed_time > 60000  -- > 1 minute
    AND session_id != @@SPID;

IF @LongRunning > 0
    PRINT '⚠ WARNING: ' + CAST(@LongRunning AS VARCHAR) + ' queries running > 1 minute';
ELSE
    PRINT '✓ No long-running queries';

PRINT '';
PRINT '';

-- ============================================================================
-- STEP 2: Update Statistics
-- ============================================================================

PRINT '=============================================================================';
PRINT 'STEP 2: Update Statistics';
PRINT '=============================================================================';
PRINT '';

SET @StepStart = GETDATE();

-- Critical tables for stored procedure performance
PRINT 'Updating WIPTransactions...';
UPDATE STATISTICS [dbo].[WIPTransactions] WITH FULLSCAN;
PRINT '   ✓ Complete';

PRINT 'Updating DrsTransactions...';
UPDATE STATISTICS [dbo].[DrsTransactions] WITH FULLSCAN;
PRINT '   ✓ Complete';

PRINT 'Updating Task...';
UPDATE STATISTICS [dbo].[Task] WITH FULLSCAN;
PRINT '   ✓ Complete';

PRINT 'Updating Client...';
UPDATE STATISTICS [dbo].[Client] WITH FULLSCAN;
PRINT '   ✓ Complete';

PRINT 'Updating Employee...';
UPDATE STATISTICS [dbo].[Employee] WITH FULLSCAN;
PRINT '   ✓ Complete';

SET @Duration = DATEDIFF(SECOND, @StepStart, GETDATE());
PRINT '';
PRINT 'Statistics update complete (' + CAST(@Duration AS VARCHAR) + ' seconds)';
PRINT '';
PRINT '';

-- ============================================================================
-- STEP 3: Index Fragmentation Check
-- ============================================================================

PRINT '=============================================================================';
PRINT 'STEP 3: Index Fragmentation Analysis';
PRINT '=============================================================================';
PRINT '';

SET @StepStart = GETDATE();

IF OBJECT_ID('tempdb..#DailyFragmentation') IS NOT NULL 
    DROP TABLE #DailyFragmentation;

CREATE TABLE #DailyFragmentation (
    TableName NVARCHAR(128),
    IndexName NVARCHAR(128),
    FragmentPercent DECIMAL(5,2),
    PageCount BIGINT,
    Recommendation NVARCHAR(20)
);

INSERT INTO #DailyFragmentation
SELECT 
    OBJECT_NAME(ips.object_id) AS TableName,
    i.name AS IndexName,
    CAST(ips.avg_fragmentation_in_percent AS DECIMAL(5,2)) AS FragmentPercent,
    ips.page_count AS PageCount,
    CASE 
        WHEN ips.avg_fragmentation_in_percent < 10 THEN 'NONE'
        WHEN ips.avg_fragmentation_in_percent < 30 THEN 'REORGANIZE'
        ELSE 'REBUILD'
    END AS Recommendation
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
INNER JOIN sys.indexes i 
    ON ips.object_id = i.object_id AND ips.index_id = i.index_id
WHERE OBJECT_NAME(ips.object_id) IN (
    'WIPTransactions', 'DrsTransactions', 'Task', 'Client', 'Employee'
)
    AND i.name IS NOT NULL
    AND ips.page_count > 100;

DECLARE @RebuildNeeded INT;
DECLARE @ReorganizeNeeded INT;
DECLARE @HealthyIndexes INT;

SELECT @RebuildNeeded = COUNT(*) FROM #DailyFragmentation WHERE Recommendation = 'REBUILD';
SELECT @ReorganizeNeeded = COUNT(*) FROM #DailyFragmentation WHERE Recommendation = 'REORGANIZE';
SELECT @HealthyIndexes = COUNT(*) FROM #DailyFragmentation WHERE Recommendation = 'NONE';

PRINT 'Fragmentation Summary:';
PRINT '   Indexes needing REBUILD (>30%): ' + CAST(@RebuildNeeded AS VARCHAR);
PRINT '   Indexes needing REORGANIZE (10-30%): ' + CAST(@ReorganizeNeeded AS VARCHAR);
PRINT '   Healthy indexes (<10%): ' + CAST(@HealthyIndexes AS VARCHAR);

IF @RebuildNeeded > 0 OR @ReorganizeNeeded > 0
BEGIN
    PRINT '';
    PRINT '⚠ Index maintenance recommended';
    PRINT '   Run: 03_rebuild_indexes.sql for detailed analysis and maintenance';
    PRINT '';
    
    -- Show worst offenders
    PRINT 'Most fragmented indexes:';
    SELECT TOP 5 
        TableName, 
        IndexName, 
        FragmentPercent, 
        Recommendation
    FROM #DailyFragmentation
    WHERE Recommendation != 'NONE'
    ORDER BY FragmentPercent DESC;
END
ELSE
BEGIN
    PRINT '';
    PRINT '✓ All indexes are healthy';
END

DROP TABLE #DailyFragmentation;

SET @Duration = DATEDIFF(SECOND, @StepStart, GETDATE());
PRINT '';
PRINT 'Fragmentation check complete (' + CAST(@Duration AS VARCHAR) + ' seconds)';
PRINT '';
PRINT '';

-- ============================================================================
-- STEP 4: Stored Procedure Performance Summary
-- ============================================================================

PRINT '=============================================================================';
PRINT 'STEP 4: Stored Procedure Performance';
PRINT '=============================================================================';
PRINT '';

SET @StepStart = GETDATE();

-- Top 5 slowest procedures by average duration
PRINT 'Top 5 Slowest Stored Procedures (by average duration):';
SELECT TOP 5
    OBJECT_NAME(ps.object_id, ps.database_id) AS ProcedureName,
    ps.execution_count AS ExecCount,
    CAST(ps.total_elapsed_time / ps.execution_count / 1000.0 AS DECIMAL(18,2)) AS AvgMs,
    CAST(ps.min_elapsed_time / 1000.0 AS DECIMAL(18,2)) AS MinMs,
    CAST(ps.max_elapsed_time / 1000.0 AS DECIMAL(18,2)) AS MaxMs,
    ps.last_execution_time AS LastRun
FROM sys.dm_exec_procedure_stats ps
WHERE DB_NAME(ps.database_id) = DB_NAME()
    AND OBJECT_NAME(ps.object_id, ps.database_id) LIKE 'sp_%'
ORDER BY (ps.total_elapsed_time / ps.execution_count) DESC;

PRINT '';

-- Check our key stored procedures
PRINT 'Performance of Key Stored Procedures:';
SELECT 
    OBJECT_NAME(ps.object_id, ps.database_id) AS ProcedureName,
    ps.execution_count AS ExecCount,
    CAST(ps.total_elapsed_time / ps.execution_count / 1000.0 AS DECIMAL(18,2)) AS AvgMs,
    CAST(ps.total_logical_reads * 1.0 / ps.execution_count AS DECIMAL(18,2)) AS AvgReads,
    DATEDIFF(HOUR, ps.cached_time, GETDATE()) AS HoursCached,
    ps.last_execution_time AS LastRun
FROM sys.dm_exec_procedure_stats ps
WHERE DB_NAME(ps.database_id) = DB_NAME()
    AND OBJECT_NAME(ps.object_id, ps.database_id) IN (
        'sp_ProfitabilityData',
        'sp_WipMonthly',
        'sp_DrsMonthly',
        'sp_RecoverabilityData',
        'sp_GroupGraphData',
        'sp_ClientGraphData',
        'sp_WIPAgingByTask'
    )
ORDER BY OBJECT_NAME(ps.object_id, ps.database_id);

-- Check for procedures with old cached plans
DECLARE @OldPlans INT;
SELECT @OldPlans = COUNT(*)
FROM sys.dm_exec_procedure_stats ps
WHERE DB_NAME(ps.database_id) = DB_NAME()
    AND OBJECT_NAME(ps.object_id, ps.database_id) LIKE 'sp_%'
    AND DATEDIFF(DAY, ps.cached_time, GETDATE()) > 7;

IF @OldPlans > 0
BEGIN
    PRINT '';
    PRINT '⚠ WARNING: ' + CAST(@OldPlans AS VARCHAR) + ' stored procedures have plans cached > 7 days';
    PRINT '   Consider: DBCC FREEPROCCACHE to force recompilation with current statistics';
END

SET @Duration = DATEDIFF(SECOND, @StepStart, GETDATE());
PRINT '';
PRINT 'Performance analysis complete (' + CAST(@Duration AS VARCHAR) + ' seconds)';
PRINT '';
PRINT '';

-- ============================================================================
-- STEP 5: System Health Metrics
-- ============================================================================

PRINT '=============================================================================';
PRINT 'STEP 5: System Health Metrics';
PRINT '=============================================================================';
PRINT '';

-- Database size
PRINT 'Database Size:';
SELECT 
    name AS FileName,
    size * 8 / 1024 AS SizeMB,
    CAST((size * 8.0 / 1024 / 1024) AS DECIMAL(10,2)) AS SizeGB,
    CASE 
        WHEN max_size = -1 THEN 'UNLIMITED'
        ELSE CAST(max_size * 8 / 1024 AS VARCHAR) + ' MB'
    END AS MaxSize
FROM sys.database_files;

PRINT '';

-- Top wait statistics (current session)
PRINT 'Top Wait Types (since last restart):';
SELECT TOP 5
    wait_type AS WaitType,
    waiting_tasks_count AS WaitingTasks,
    wait_time_ms / 1000 AS TotalWaitSec,
    CASE 
        WHEN waiting_tasks_count > 0 
        THEN wait_time_ms / waiting_tasks_count 
        ELSE 0 
    END AS AvgWaitMs
FROM sys.dm_os_wait_stats
WHERE wait_type NOT IN (
    'CLR_SEMAPHORE', 'LAZYWRITER_SLEEP', 'RESOURCE_QUEUE', 'SLEEP_TASK',
    'SLEEP_SYSTEMTASK', 'SQLTRACE_BUFFER_FLUSH', 'WAITFOR', 'LOGMGR_QUEUE',
    'CHECKPOINT_QUEUE', 'REQUEST_FOR_DEADLOCK_SEARCH', 'XE_TIMER_EVENT'
)
    AND wait_time_ms > 0
ORDER BY wait_time_ms DESC;

PRINT '';
PRINT '';

-- ============================================================================
-- SUMMARY
-- ============================================================================

DECLARE @TotalDuration INT = DATEDIFF(SECOND, @MaintenanceStart, GETDATE());

PRINT '=============================================================================';
PRINT 'MAINTENANCE COMPLETE';
PRINT '=============================================================================';
PRINT '';
PRINT 'Start Time: ' + CONVERT(VARCHAR, @MaintenanceStart, 120);
PRINT 'End Time: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT 'Total Duration: ' + CAST(@TotalDuration AS VARCHAR) + ' seconds';
PRINT '';

-- Final recommendations
IF @BlockingCount > 0 OR @LongRunning > 0 OR @RebuildNeeded > 0 OR @OldPlans > 0
BEGIN
    PRINT 'ACTION ITEMS:';
    IF @BlockingCount > 0
        PRINT '   - Investigate blocking queries (run 01_check_running_processes.sql)';
    IF @RebuildNeeded > 0
        PRINT '   - Rebuild fragmented indexes (run 03_rebuild_indexes.sql)';
    IF @OldPlans > 0
        PRINT '   - Consider clearing procedure cache (DBCC FREEPROCCACHE)';
    PRINT '';
END
ELSE
BEGIN
    PRINT '✓ Database health is good - no immediate actions required';
    PRINT '';
END

PRINT '=============================================================================';
PRINT '';

GO
