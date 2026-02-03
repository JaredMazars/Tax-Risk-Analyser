-- ============================================================================
-- Check Running Processes and Blocking Queries
-- ============================================================================
-- 
-- PURPOSE: Diagnose slow stored procedure performance by identifying:
--   - Long-running queries
--   - Blocking chains
--   - Resource-intensive sessions
--   - Wait statistics
--
-- WHEN TO RUN:
--   - When stored procedures are running slow
--   - During high-load periods to identify bottlenecks
--   - When users report system slowness
--   - As part of routine performance monitoring
--
-- HOW TO USE:
--   1. Run all queries in sequence
--   2. Look for sessions with high ElapsedSec or WaitSec
--   3. Check BlockedBy column for blocking chains
--   4. Review SQL text of slow queries
--
-- ============================================================================

PRINT '=============================================================================';
PRINT 'Database Process Monitoring Report';
PRINT 'Timestamp: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '=============================================================================';
PRINT '';

-- ============================================================================
-- 1. Active Sessions Overview (sp_who2 alternative)
-- ============================================================================

PRINT '1. ACTIVE SESSIONS';
PRINT '-------------------';

SELECT 
    s.session_id AS SPID,
    s.login_name AS LoginName,
    s.host_name AS HostName,
    s.program_name AS ProgramName,
    s.status AS Status,
    r.blocking_session_id AS BlockedBy,
    r.wait_type AS WaitType,
    r.wait_time / 1000 AS WaitSec,
    r.cpu_time / 1000 AS CPUSec,
    r.total_elapsed_time / 1000 AS ElapsedSec,
    r.reads AS Reads,
    r.writes AS Writes,
    r.command AS Command,
    DB_NAME(r.database_id) AS DatabaseName,
    s.last_request_start_time AS LastRequest
FROM sys.dm_exec_sessions s
LEFT JOIN sys.dm_exec_requests r ON s.session_id = r.session_id
WHERE s.session_id > 50  -- Exclude system sessions
    AND s.session_id != @@SPID  -- Exclude current session
    AND (
        r.session_id IS NOT NULL  -- Has active request
        OR s.status = 'running'   -- Or session is running
    )
ORDER BY r.total_elapsed_time DESC;

PRINT '';
PRINT '';

-- ============================================================================
-- 2. Blocking Chains (WHO IS BLOCKING WHOM)
-- ============================================================================

PRINT '2. BLOCKING CHAINS';
PRINT '-------------------';
PRINT 'Shows which sessions are blocked and by whom';
PRINT '';

SELECT 
    r.session_id AS BlockedSPID,
    r.blocking_session_id AS BlockerSPID,
    r.wait_type AS WaitType,
    r.wait_time / 1000 AS WaitSec,
    r.wait_resource AS WaitResource,
    DB_NAME(r.database_id) AS DatabaseName,
    OBJECT_NAME(p.object_id, r.database_id) AS ObjectName,
    r.command AS Command,
    s.login_name AS BlockedUser,
    blocker.login_name AS BlockerUser,
    -- Show SQL text of blocked query
    SUBSTRING(
        blocked_text.text, 
        (r.statement_start_offset/2) + 1,
        ((CASE r.statement_end_offset 
            WHEN -1 THEN DATALENGTH(blocked_text.text)
            ELSE r.statement_end_offset 
        END - r.statement_start_offset)/2) + 1
    ) AS BlockedSQL
FROM sys.dm_exec_requests r
INNER JOIN sys.dm_exec_sessions s ON r.session_id = s.session_id
LEFT JOIN sys.dm_exec_sessions blocker ON r.blocking_session_id = blocker.session_id
LEFT JOIN sys.partitions p ON r.wait_resource LIKE '%' + CAST(p.hobt_id AS VARCHAR) + '%'
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) blocked_text
WHERE r.blocking_session_id > 0  -- Only show blocked sessions
ORDER BY r.wait_time DESC;

PRINT '';
PRINT '';

-- ============================================================================
-- 3. Long-Running Queries (> 30 seconds)
-- ============================================================================

PRINT '3. LONG-RUNNING QUERIES (> 30 seconds)';
PRINT '----------------------------------------';

SELECT 
    r.session_id AS SPID,
    r.start_time AS StartTime,
    r.total_elapsed_time / 1000 AS ElapsedSec,
    r.cpu_time / 1000 AS CPUSec,
    r.logical_reads AS LogicalReads,
    r.reads AS PhysicalReads,
    r.writes AS Writes,
    r.command AS Command,
    r.wait_type AS WaitType,
    r.wait_time / 1000 AS WaitSec,
    r.percent_complete AS PercentComplete,
    DB_NAME(r.database_id) AS DatabaseName,
    s.login_name AS LoginName,
    s.program_name AS ProgramName,
    -- Extract SQL text
    SUBSTRING(
        qt.text, 
        (r.statement_start_offset/2) + 1,
        ((CASE r.statement_end_offset 
            WHEN -1 THEN DATALENGTH(qt.text)
            ELSE r.statement_end_offset 
        END - r.statement_start_offset)/2) + 1
    ) AS CurrentSQL,
    -- Full batch text
    qt.text AS FullBatchText
FROM sys.dm_exec_requests r
INNER JOIN sys.dm_exec_sessions s ON r.session_id = s.session_id
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) qt
WHERE r.total_elapsed_time > 30000  -- More than 30 seconds
    AND r.session_id != @@SPID
ORDER BY r.total_elapsed_time DESC;

PRINT '';
PRINT '';

-- ============================================================================
-- 4. Resource-Intensive Sessions (High I/O)
-- ============================================================================

PRINT '4. RESOURCE-INTENSIVE SESSIONS (High I/O)';
PRINT '-------------------------------------------';

SELECT TOP 20
    s.session_id AS SPID,
    s.login_name AS LoginName,
    s.program_name AS ProgramName,
    r.logical_reads AS LogicalReads,
    r.reads AS PhysicalReads,
    r.writes AS Writes,
    r.cpu_time / 1000 AS CPUSec,
    r.total_elapsed_time / 1000 AS ElapsedSec,
    r.command AS Command,
    DB_NAME(r.database_id) AS DatabaseName,
    -- Extract current SQL
    SUBSTRING(
        qt.text, 
        (r.statement_start_offset/2) + 1,
        ((CASE r.statement_end_offset 
            WHEN -1 THEN DATALENGTH(qt.text)
            ELSE r.statement_end_offset 
        END - r.statement_start_offset)/2) + 1
    ) AS CurrentSQL
FROM sys.dm_exec_sessions s
INNER JOIN sys.dm_exec_requests r ON s.session_id = r.session_id
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) qt
WHERE r.session_id != @@SPID
ORDER BY r.logical_reads DESC;

PRINT '';
PRINT '';

-- ============================================================================
-- 5. Wait Statistics Summary
-- ============================================================================

PRINT '5. CURRENT WAIT STATISTICS';
PRINT '----------------------------';
PRINT 'Top wait types currently happening in database';
PRINT '';

SELECT TOP 10
    wait_type AS WaitType,
    waiting_tasks_count AS WaitingTasks,
    wait_time_ms / 1000 AS TotalWaitSec,
    (wait_time_ms - signal_wait_time_ms) / 1000 AS ResourceWaitSec,
    signal_wait_time_ms / 1000 AS SignalWaitSec,
    CASE 
        WHEN waiting_tasks_count > 0 
        THEN (wait_time_ms / waiting_tasks_count) 
        ELSE 0 
    END AS AvgWaitMs
FROM sys.dm_os_wait_stats
WHERE wait_type NOT IN (
    -- Filter out benign waits
    'CLR_SEMAPHORE', 'LAZYWRITER_SLEEP', 'RESOURCE_QUEUE', 'SLEEP_TASK',
    'SLEEP_SYSTEMTASK', 'SQLTRACE_BUFFER_FLUSH', 'WAITFOR', 'LOGMGR_QUEUE',
    'CHECKPOINT_QUEUE', 'REQUEST_FOR_DEADLOCK_SEARCH', 'XE_TIMER_EVENT',
    'BROKER_TO_FLUSH', 'BROKER_TASK_STOP', 'CLR_MANUAL_EVENT',
    'CLR_AUTO_EVENT', 'DISPATCHER_QUEUE_SEMAPHORE', 'FT_IFTS_SCHEDULER_IDLE_WAIT',
    'XE_DISPATCHER_WAIT', 'XE_DISPATCHER_JOIN'
)
    AND wait_time_ms > 0
ORDER BY wait_time_ms DESC;

PRINT '';
PRINT '';

-- ============================================================================
-- 6. Stored Procedure Execution Statistics
-- ============================================================================

PRINT '6. STORED PROCEDURE PERFORMANCE (Current Execution)';
PRINT '-----------------------------------------------------';
PRINT 'Shows stored procedures currently running';
PRINT '';

SELECT 
    s.session_id AS SPID,
    OBJECT_NAME(qt.objectid, qt.dbid) AS ProcedureName,
    r.start_time AS StartTime,
    r.total_elapsed_time / 1000 AS ElapsedSec,
    r.cpu_time / 1000 AS CPUSec,
    r.logical_reads AS LogicalReads,
    r.wait_type AS WaitType,
    r.wait_time / 1000 AS WaitSec,
    s.login_name AS LoginName,
    s.program_name AS ProgramName
FROM sys.dm_exec_requests r
INNER JOIN sys.dm_exec_sessions s ON r.session_id = s.session_id
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) qt
WHERE qt.objectid IS NOT NULL  -- Filter to stored procedures only
    AND r.session_id != @@SPID
ORDER BY r.total_elapsed_time DESC;

PRINT '';
PRINT '=============================================================================';
PRINT 'Report Complete';
PRINT '=============================================================================';
PRINT '';
PRINT 'INTERPRETATION GUIDE:';
PRINT '- ElapsedSec > 30: Query is running slow';
PRINT '- BlockedBy > 0: Session is waiting on another session (blocking)';
PRINT '- High LogicalReads: Query doing lots of I/O (check for missing indexes)';
PRINT '- WaitType = PAGEIOLATCH_*: Disk I/O bottleneck';
PRINT '- WaitType = LCK_*: Locking contention';
PRINT '- WaitType = CXPACKET: Parallelism waits (normal for large queries)';
PRINT '';

GO
