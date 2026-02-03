-- ============================================================================
-- Clear Procedure Cache - Force Query Plan Recompilation
-- ============================================================================
-- 
-- PURPOSE: Clear old cached query plans and force recompilation with:
--   - Current statistics
--   - Newly created indexes
--   - Schema changes
--
-- CRITICAL USE CASE:
--   After applying missing indexes migration, stored procedures may still use
--   old cached plans that were compiled BEFORE the indexes existed.
--   This script forces recompilation so SPs can take advantage of new indexes.
--
-- WHEN TO RUN:
--   ✅ REQUIRED: After creating new indexes (missing indexes migration)
--   ✅ REQUIRED: After major statistics update
--   ✅ Recommended: After schema changes
--   ✅ Troubleshooting: When SPs slow despite healthy indexes/stats
--
-- PERFORMANCE IMPACT:
--   - Brief CPU spike as plans recompile (1-2 minutes)
--   - First execution of each SP after clearing will be slower (compilation overhead)
--   - Subsequent executions will be faster with optimized plans
--   - Safe to run during business hours
--
-- TWO OPTIONS:
--   Option 1: Clear ALL cached plans (nuclear option - safest, affects all SPs)
--   Option 2: Recompile specific SPs (surgical approach - more controlled)
--
-- ============================================================================

SET NOCOUNT ON;

PRINT '';
PRINT '=============================================================================';
PRINT 'Procedure Cache Management';
PRINT 'Timestamp: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '=============================================================================';
PRINT '';

-- ============================================================================
-- STEP 1: Analyze Current Cache
-- ============================================================================

PRINT 'STEP 1: Current Procedure Cache Analysis';
PRINT '-------------------------------------------';
PRINT '';

-- Count cached plans
DECLARE @CachedPlanCount INT;
DECLARE @OldPlanCount INT;

SELECT @CachedPlanCount = COUNT(*)
FROM sys.dm_exec_cached_plans;

SELECT @OldPlanCount = COUNT(*)
FROM sys.dm_exec_procedure_stats ps
WHERE DB_NAME(ps.database_id) = DB_NAME()
    AND OBJECT_NAME(ps.object_id, ps.database_id) LIKE 'sp_%'
    AND DATEDIFF(DAY, ps.cached_time, GETDATE()) > 1;

PRINT 'Total cached plans: ' + CAST(@CachedPlanCount AS VARCHAR);
PRINT 'Stored procedures with plans > 1 day old: ' + CAST(@OldPlanCount AS VARCHAR);
PRINT '';

-- Show age of our key stored procedures' cached plans
PRINT 'Age of Key Stored Procedure Plans:';
SELECT 
    OBJECT_NAME(ps.object_id, ps.database_id) AS ProcedureName,
    ps.execution_count AS ExecCount,
    ps.cached_time AS CachedTime,
    DATEDIFF(HOUR, ps.cached_time, GETDATE()) AS HoursCached,
    CASE 
        WHEN DATEDIFF(HOUR, ps.cached_time, GETDATE()) < 1 THEN 'New'
        WHEN DATEDIFF(DAY, ps.cached_time, GETDATE()) < 1 THEN 'Recent'
        WHEN DATEDIFF(DAY, ps.cached_time, GETDATE()) < 7 THEN 'OK'
        ELSE 'Old - Should Clear'
    END AS Status
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
ORDER BY ps.cached_time;

PRINT '';
PRINT '';

-- ============================================================================
-- STEP 2: Choose Your Approach
-- ============================================================================

PRINT '=============================================================================';
PRINT 'STEP 2: Choose Your Approach';
PRINT '=============================================================================';
PRINT '';
PRINT 'You have TWO OPTIONS:';
PRINT '';
PRINT 'Option 1: CLEAR ALL CACHED PLANS (Recommended)';
PRINT '   ✅ Ensures all SPs recompile with current indexes/stats';
PRINT '   ✅ Safest approach after major changes';
PRINT '   ⚠️ Brief CPU spike during recompilation (1-2 minutes)';
PRINT '   ⚠️ First execution of each SP will be slower';
PRINT '';
PRINT 'Option 2: RECOMPILE SPECIFIC SPs (Surgical)';
PRINT '   ✅ More controlled';
PRINT '   ✅ No system-wide impact';
PRINT '   ⚠️ Must specify each SP individually';
PRINT '   ⚠️ May miss dependent queries';
PRINT '';
PRINT 'RECOMMENDED: Use Option 1 after applying missing indexes migration';
PRINT '';
PRINT '';

-- ============================================================================
-- OPTION 1: Clear ALL Cached Plans (Uncomment to use)
-- ============================================================================

PRINT '=============================================================================';
PRINT 'OPTION 1: Clear ALL Cached Plans';
PRINT '=============================================================================';
PRINT '';
PRINT 'To execute this option:';
PRINT '1. Uncomment the DBCC FREEPROCCACHE line below';
PRINT '2. Run this script';
PRINT '';
PRINT 'WARNING: This clears the entire plan cache!';
PRINT 'Impact: Brief CPU spike, temporary slowdown as plans recompile';
PRINT '';

-- UNCOMMENT THE LINE BELOW TO CLEAR ALL CACHED PLANS:
-- DBCC FREEPROCCACHE;

/*
-- ============================================================================
-- OPTION 1 EXECUTION (Uncomment this entire block to use)
-- ============================================================================

DECLARE @ClearStart DATETIME = GETDATE();

PRINT 'Clearing procedure cache...';
PRINT '';

-- Clear the cache
DBCC FREEPROCCACHE;

PRINT '✓ Procedure cache cleared';
PRINT '  Duration: ' + CAST(DATEDIFF(SECOND, @ClearStart, GETDATE()) AS VARCHAR) + ' seconds';
PRINT '';
PRINT 'WHAT HAPPENS NEXT:';
PRINT '- All stored procedures will recompile on next execution';
PRINT '- First execution will be slower (compilation overhead)';
PRINT '- Subsequent executions will use new optimized plans';
PRINT '- Monitor performance over next hour';
PRINT '';
PRINT 'VERIFICATION:';
PRINT '1. Wait 5 minutes for key SPs to execute and recompile';
PRINT '2. Run: 04_analyze_sp_performance.sql';
PRINT '3. Check "Recompilation Statistics" section';
PRINT '4. Verify CachedTime shows recent timestamps';
PRINT '';
*/

-- ============================================================================
-- OPTION 2: Recompile Specific Stored Procedures (Uncomment to use)
-- ============================================================================

PRINT '';
PRINT '';
PRINT '=============================================================================';
PRINT 'OPTION 2: Recompile Specific Stored Procedures';
PRINT '=============================================================================';
PRINT '';
PRINT 'To execute this option:';
PRINT '1. Uncomment the block below';
PRINT '2. Add/remove specific SPs as needed';
PRINT '3. Run this script';
PRINT '';

/*
-- ============================================================================
-- OPTION 2 EXECUTION (Uncomment this entire block to use)
-- ============================================================================

DECLARE @RecompileStart DATETIME;
DECLARE @RecompileEnd DATETIME;
DECLARE @Duration INT;

PRINT 'Recompiling specific stored procedures...';
PRINT '';

-- sp_ProfitabilityData (Priority 1 - Most critical)
PRINT '1. Recompiling sp_ProfitabilityData...';
SET @RecompileStart = GETDATE();
EXEC sp_recompile 'sp_ProfitabilityData';
SET @Duration = DATEDIFF(MILLISECOND, @RecompileStart, GETDATE());
PRINT '   ✓ Complete (' + CAST(@Duration AS VARCHAR) + ' ms)';
PRINT '';

-- sp_WipMonthly (Priority 2 - Overview reports)
PRINT '2. Recompiling sp_WipMonthly...';
SET @RecompileStart = GETDATE();
EXEC sp_recompile 'sp_WipMonthly';
SET @Duration = DATEDIFF(MILLISECOND, @RecompileStart, GETDATE());
PRINT '   ✓ Complete (' + CAST(@Duration AS VARCHAR) + ' ms)';
PRINT '';

-- sp_DrsMonthly (Priority 2 - Overview reports)
PRINT '3. Recompiling sp_DrsMonthly...';
SET @RecompileStart = GETDATE();
EXEC sp_recompile 'sp_DrsMonthly';
SET @Duration = DATEDIFF(MILLISECOND, @RecompileStart, GETDATE());
PRINT '   ✓ Complete (' + CAST(@Duration AS VARCHAR) + ' ms)';
PRINT '';

-- sp_RecoverabilityData (Priority 3 - Reports)
PRINT '4. Recompiling sp_RecoverabilityData...';
SET @RecompileStart = GETDATE();
EXEC sp_recompile 'sp_RecoverabilityData';
SET @Duration = DATEDIFF(MILLISECOND, @RecompileStart, GETDATE());
PRINT '   ✓ Complete (' + CAST(@Duration AS VARCHAR) + ' ms)';
PRINT '';

-- sp_GroupGraphData (Priority 3 - Dashboard)
PRINT '5. Recompiling sp_GroupGraphData...';
SET @RecompileStart = GETDATE();
EXEC sp_recompile 'sp_GroupGraphData';
SET @Duration = DATEDIFF(MILLISECOND, @RecompileStart, GETDATE());
PRINT '   ✓ Complete (' + CAST(@Duration AS VARCHAR) + ' ms)';
PRINT '';

-- sp_ClientGraphData (Priority 3 - Dashboard)
PRINT '6. Recompiling sp_ClientGraphData...';
SET @RecompileStart = GETDATE();
EXEC sp_recompile 'sp_ClientGraphData';
SET @Duration = DATEDIFF(MILLISECOND, @RecompileStart, GETDATE());
PRINT '   ✓ Complete (' + CAST(@Duration AS VARCHAR) + ' ms)';
PRINT '';

-- sp_WIPAgingByTask (Priority 4 - Aging analysis)
PRINT '7. Recompiling sp_WIPAgingByTask...';
SET @RecompileStart = GETDATE();
EXEC sp_recompile 'sp_WIPAgingByTask';
SET @Duration = DATEDIFF(MILLISECOND, @RecompileStart, GETDATE());
PRINT '   ✓ Complete (' + CAST(@Duration AS VARCHAR) + ' ms)';
PRINT '';

PRINT '✓ All specified stored procedures marked for recompilation';
PRINT '';
PRINT 'WHAT HAPPENS NEXT:';
PRINT '- Each SP will recompile on next execution';
PRINT '- First execution will be slower (compilation overhead)';
PRINT '- Subsequent executions will use new optimized plans';
PRINT '';
PRINT 'VERIFICATION:';
PRINT '1. Execute each SP at least once to trigger recompilation';
PRINT '2. Run: 04_analyze_sp_performance.sql';
PRINT '3. Check "Recompilation Statistics" section';
PRINT '4. Verify CachedTime shows recent timestamps for these SPs';
PRINT '';
*/

-- ============================================================================
-- STEP 3: Verification Instructions
-- ============================================================================

PRINT '';
PRINT '';
PRINT '=============================================================================';
PRINT 'STEP 3: Verification (After Running Option 1 or 2)';
PRINT '=============================================================================';
PRINT '';
PRINT 'To verify procedure cache was successfully cleared/recompiled:';
PRINT '';
PRINT '1. Wait 5-10 minutes for SPs to execute and recompile';
PRINT '';
PRINT '2. Run performance analysis:';
PRINT '   sqlcmd -i 04_analyze_sp_performance.sql';
PRINT '';
PRINT '3. Check Section 6 "Recompilation Statistics":';
PRINT '   - CachedTime should show recent timestamps';
PRINT '   - HoursCached should be < 1 hour';
PRINT '';
PRINT '4. Test a slow stored procedure:';
PRINT '   SET STATISTICS IO ON;';
PRINT '   SET STATISTICS TIME ON;';
PRINT '   EXEC sp_ProfitabilityData @ClientCode = ''TEST001'', @DateFrom = ''2024-09-01'';';
PRINT '';
PRINT '5. Verify improvement:';
PRINT '   - Should see "Index Seek" instead of "Table Scan" in execution plan';
PRINT '   - Logical reads should be significantly lower';
PRINT '   - Execution time should be faster';
PRINT '';

-- ============================================================================
-- SUMMARY
-- ============================================================================

PRINT '';
PRINT '=============================================================================';
PRINT 'SUMMARY';
PRINT '=============================================================================';
PRINT '';

IF @OldPlanCount > 0
BEGIN
    PRINT '⚠️ ACTION REQUIRED:';
    PRINT '   - ' + CAST(@OldPlanCount AS VARCHAR) + ' stored procedures have plans > 1 day old';
    PRINT '   - Choose Option 1 (clear all) or Option 2 (specific SPs) above';
    PRINT '   - Uncomment the appropriate section and re-run this script';
    PRINT '';
    PRINT 'RECOMMENDED: Use Option 1 after applying missing indexes migration';
END
ELSE
BEGIN
    PRINT '✓ All stored procedure plans are recent (< 1 day old)';
    PRINT '  Cache clearing may not be necessary unless:';
    PRINT '  - You just created new indexes';
    PRINT '  - You just updated statistics';
    PRINT '  - SPs are still slow despite healthy indexes/stats';
END

PRINT '';
PRINT '=============================================================================';
PRINT '';

GO

-- ============================================================================
-- QUICK REFERENCE: Common Commands
-- ============================================================================

PRINT '';
PRINT 'QUICK REFERENCE:';
PRINT '----------------';
PRINT '';
PRINT 'Clear all cached plans:';
PRINT '   DBCC FREEPROCCACHE;';
PRINT '';
PRINT 'Recompile specific SP:';
PRINT '   EXEC sp_recompile ''sp_ProcedureName'';';
PRINT '';
PRINT 'View cached plans for SP:';
PRINT '   SELECT * FROM sys.dm_exec_procedure_stats';
PRINT '   WHERE OBJECT_NAME(object_id) = ''sp_ProcedureName'';';
PRINT '';
PRINT 'View execution plan:';
PRINT '   SET SHOWPLAN_XML ON;';
PRINT '   EXEC sp_ProcedureName;';
PRINT '   SET SHOWPLAN_XML OFF;';
PRINT '';

GO
