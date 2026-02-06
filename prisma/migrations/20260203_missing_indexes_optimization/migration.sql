-- ============================================================================
-- Missing Index Optimization - Based on SQL Server DMV Analysis
-- Addresses top performance bottlenecks identified by query statistics
-- 
-- Target: Client details page (8-12s -> 1-2s)
-- Target: Partner reports (3-5s -> 500-800ms)
-- Expected Improvement: 1,500,000+ improvement points from missing index DMVs
-- ============================================================================

BEGIN TRANSACTION;

PRINT '';
PRINT '=============================================================================';
PRINT 'Starting Missing Index Optimization Migration';
PRINT 'Timestamp: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '=============================================================================';

-- ============================================================================
-- STEP 1: Add ClientCode to WIPTransactions (REQUIRED for index)
-- ============================================================================

PRINT '';
PRINT 'STEP 1: Adding ClientCode column to WIPTransactions...';

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('WIPTransactions') 
    AND name = 'ClientCode'
)
BEGIN
    ALTER TABLE [dbo].[WIPTransactions]
    ADD ClientCode NVARCHAR(10) NULL;
    
    PRINT 'ClientCode column added';
END
ELSE
BEGIN
    PRINT 'ClientCode column already exists, skipping...';
END
GO

-- ============================================================================
-- STEP 2: Backfill ClientCode from Client via Task join
-- ============================================================================

PRINT '';
PRINT 'STEP 2: Backfilling ClientCode...';

DECLARE @BatchSize INT = 50000;
DECLARE @RowsAffected INT = 1;
DECLARE @TotalRows INT = 0;
DECLARE @StartTime DATETIME = GETDATE();

-- Count NULL rows
SELECT @TotalRows = COUNT(*) FROM [dbo].[WIPTransactions] WHERE ClientCode IS NULL;
PRINT 'Total rows to backfill: ' + CAST(@TotalRows AS VARCHAR(10));

IF @TotalRows > 0
BEGIN
    PRINT 'Starting backfill in batches of ' + CAST(@BatchSize AS VARCHAR(10));
    
    WHILE @RowsAffected > 0
    BEGIN
        UPDATE TOP (@BatchSize) w
        SET w.ClientCode = c.clientCode
        FROM [dbo].[WIPTransactions] w
        INNER JOIN [dbo].[Task] t ON w.GSTaskID = t.GSTaskID
        INNER JOIN [dbo].[Client] c ON t.GSClientID = c.GSClientID
        WHERE w.ClientCode IS NULL;
        
        SET @RowsAffected = @@ROWCOUNT;
        
        IF @RowsAffected > 0
        BEGIN
            PRINT '  Backfilled ' + CAST(@RowsAffected AS VARCHAR(10)) + ' rows at ' + CONVERT(VARCHAR, GETDATE(), 120);
            
            -- Small delay to reduce log pressure
            WAITFOR DELAY '00:00:01';
        END
    END
    
    DECLARE @Duration INT = DATEDIFF(SECOND, @StartTime, GETDATE());
    PRINT 'Backfill completed in ' + CAST(@Duration AS VARCHAR(10)) + ' seconds';
END
ELSE
BEGIN
    PRINT 'No rows to backfill (already completed)';
END
GO

-- ============================================================================
-- STEP 3: Verify Backfill Completion
-- ============================================================================

PRINT '';
PRINT 'STEP 3: Verifying backfill...';

DECLARE @NullCount INT;
SELECT @NullCount = COUNT(*) FROM [dbo].[WIPTransactions] WHERE ClientCode IS NULL;

IF @NullCount > 0
BEGIN
    PRINT 'ERROR: Backfill incomplete! ' + CAST(@NullCount AS VARCHAR(10)) + ' rows still NULL';
    RAISERROR('Backfill incomplete: %d rows still NULL', 16, 1, @NullCount);
    ROLLBACK TRANSACTION;
    RETURN;
END
ELSE
BEGIN
    PRINT 'Backfill verification passed (0 NULL rows)';
END
GO

-- ============================================================================
-- STEP 4: Make ClientCode NOT NULL
-- ============================================================================

PRINT '';
PRINT 'STEP 4: Setting ClientCode to NOT NULL...';

-- Check if column is already NOT NULL
DECLARE @IsNullable BIT;
SELECT @IsNullable = is_nullable 
FROM sys.columns 
WHERE object_id = OBJECT_ID('WIPTransactions') 
AND name = 'ClientCode';

IF @IsNullable = 1
BEGIN
    ALTER TABLE [dbo].[WIPTransactions]
    ALTER COLUMN ClientCode NVARCHAR(10) NOT NULL;
    
    PRINT 'ClientCode set to NOT NULL';
END
ELSE
BEGIN
    PRINT 'ClientCode already NOT NULL, skipping...';
END
GO

-- ============================================================================
-- STEP 5: Create Missing Indexes
-- ============================================================================

PRINT '';
PRINT 'STEP 5: Creating missing indexes...';

-- Priority 1: Client Details Page (415,976 points)
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_WIPTransactions_ClientTaskCode_Covering'
    AND object_id = OBJECT_ID('WIPTransactions')
)
BEGIN
    PRINT '';
    PRINT '  Creating IX_WIPTransactions_ClientTaskCode_Covering...';
    PRINT '  Impact: 415,976 improvement points (Client details page)';
    
    CREATE NONCLUSTERED INDEX [IX_WIPTransactions_ClientTaskCode_Covering]
    ON [dbo].[WIPTransactions] ([ClientCode], [TaskCode])
    INCLUDE ([TranDate], [TType], [Amount], [Hour], [Cost], [GSTaskID], [TaskPartner], [TaskManager], [EmpCode])
    WITH (ONLINE = ON, FILLFACTOR = 90, SORT_IN_TEMPDB = ON, DATA_COMPRESSION = PAGE);
    
    PRINT '  ✓ IX_WIPTransactions_ClientTaskCode_Covering created successfully';
END
ELSE
BEGIN
    PRINT '  ✓ IX_WIPTransactions_ClientTaskCode_Covering already exists';
END
GO

-- Priority 2: Partner Reports (469,753 points)
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_WIPTransactions_Partner_Covering'
    AND object_id = OBJECT_ID('WIPTransactions')
)
BEGIN
    PRINT '';
    PRINT '  Creating IX_WIPTransactions_Partner_Covering...';
    PRINT '  Impact: 469,753 improvement points (Partner reports)';
    
    CREATE NONCLUSTERED INDEX [IX_WIPTransactions_Partner_Covering]
    ON [dbo].[WIPTransactions] ([TaskPartner])
    INCLUDE ([GSTaskID], [TranDate], [TType], [EmpCode], [Hour], [Amount], [Cost])
    WITH (ONLINE = ON, FILLFACTOR = 90, SORT_IN_TEMPDB = ON, DATA_COMPRESSION = PAGE);
    
    PRINT '  ✓ IX_WIPTransactions_Partner_Covering created successfully';
END
ELSE
BEGIN
    PRINT '  ✓ IX_WIPTransactions_Partner_Covering already exists';
END
GO

-- Priority 3: Partner Date Reports (159,241 points)
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_WIPTransactions_PartnerDate_Covering'
    AND object_id = OBJECT_ID('WIPTransactions')
)
BEGIN
    PRINT '';
    PRINT '  Creating IX_WIPTransactions_PartnerDate_Covering...';
    PRINT '  Impact: 159,241 improvement points (Partner time-series reports)';
    
    CREATE NONCLUSTERED INDEX [IX_WIPTransactions_PartnerDate_Covering]
    ON [dbo].[WIPTransactions] ([TaskPartner], [TranDate])
    INCLUDE ([TType], [EmpCode], [Amount], [Cost], [Hour], [GSTaskID])
    WITH (ONLINE = ON, FILLFACTOR = 90, SORT_IN_TEMPDB = ON, DATA_COMPRESSION = PAGE);
    
    PRINT '  ✓ IX_WIPTransactions_PartnerDate_Covering created successfully';
END
ELSE
BEGIN
    PRINT '  ✓ IX_WIPTransactions_PartnerDate_Covering already exists';
END
GO

-- Priority 4: Service Line Reports (30,032 points)
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_Task_ServLine_Covering'
    AND object_id = OBJECT_ID('Task')
)
BEGIN
    PRINT '';
    PRINT '  Creating IX_Task_ServLine_Covering...';
    PRINT '  Impact: 30,032 improvement points (Service line reports)';
    
    CREATE NONCLUSTERED INDEX [IX_Task_ServLine_Covering]
    ON [dbo].[Task] ([ServLineCode])
    INCLUDE ([TaskPartner], [TaskManager], [Active], [GSTaskID], [GSClientID])
    WITH (ONLINE = ON, FILLFACTOR = 90, DATA_COMPRESSION = PAGE);
    
    PRINT '  ✓ IX_Task_ServLine_Covering created successfully';
END
ELSE
BEGIN
    PRINT '  ✓ IX_Task_ServLine_Covering already exists';
END
GO

-- Priority 5: Partner Task Lists (2,741 points)
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_Task_Partner_Covering'
    AND object_id = OBJECT_ID('Task')
)
BEGIN
    PRINT '';
    PRINT '  Creating IX_Task_Partner_Covering...';
    PRINT '  Impact: 2,741 improvement points (Partner task queries)';
    
    CREATE NONCLUSTERED INDEX [IX_Task_Partner_Covering]
    ON [dbo].[Task] ([TaskPartner])
    INCLUDE ([GSTaskID], [ServLineCode], [Active], [TaskManager], [GSClientID])
    WITH (ONLINE = ON, FILLFACTOR = 90, DATA_COMPRESSION = PAGE);
    
    PRINT '  ✓ IX_Task_Partner_Covering created successfully';
END
ELSE
BEGIN
    PRINT '  ✓ IX_Task_Partner_Covering already exists';
END
GO

-- ============================================================================
-- STEP 6: Update Statistics
-- ============================================================================

PRINT '';
PRINT 'STEP 6: Updating statistics for accurate cardinality estimates...';

UPDATE STATISTICS [dbo].[WIPTransactions] WITH FULLSCAN;
PRINT '  ✓ WIPTransactions statistics updated';

UPDATE STATISTICS [dbo].[Task] WITH FULLSCAN;
PRINT '  ✓ Task statistics updated';

-- ============================================================================
-- STEP 7: Verify Index Creation
-- ============================================================================

PRINT '';
PRINT 'STEP 7: Verifying index creation...';

DECLARE @WIPIndexCount INT;
DECLARE @TaskIndexCount INT;

SELECT @WIPIndexCount = COUNT(*) 
FROM sys.indexes 
WHERE object_id = OBJECT_ID('WIPTransactions') 
AND name IN (
    'IX_WIPTransactions_ClientTaskCode_Covering',
    'IX_WIPTransactions_Partner_Covering',
    'IX_WIPTransactions_PartnerDate_Covering'
)
AND is_disabled = 0;

SELECT @TaskIndexCount = COUNT(*) 
FROM sys.indexes 
WHERE object_id = OBJECT_ID('Task') 
AND name IN (
    'IX_Task_ServLine_Covering',
    'IX_Task_Partner_Covering'
)
AND is_disabled = 0;

PRINT '';
PRINT '=== Verification Results ===';
PRINT 'WIPTransactions indexes created: ' + CAST(@WIPIndexCount AS VARCHAR) + ' / 3';
PRINT 'Task indexes created: ' + CAST(@TaskIndexCount AS VARCHAR) + ' / 2';

IF @WIPIndexCount = 3 AND @TaskIndexCount = 2
BEGIN
    PRINT '';
    PRINT '✓ All indexes created successfully!';
END
ELSE
BEGIN
    PRINT '';
    PRINT '⚠ Some indexes may not have been created. Check output above.';
END

-- Display index details
PRINT '';
PRINT 'Created WIPTransactions Indexes:';
SELECT 
    name AS IndexName,
    type_desc AS IndexType,
    is_disabled AS IsDisabled,
    CAST(SUM(ps.used_page_count) * 8 / 1024.0 AS DECIMAL(10,2)) AS SizeMB
FROM sys.indexes i
INNER JOIN sys.dm_db_partition_stats ps ON i.object_id = ps.object_id AND i.index_id = ps.index_id
WHERE i.object_id = OBJECT_ID('WIPTransactions')
AND i.name LIKE 'IX_WIPTransactions_%Covering'
GROUP BY name, type_desc, is_disabled;

PRINT '';
PRINT 'Created Task Indexes:';
SELECT 
    name AS IndexName,
    type_desc AS IndexType,
    is_disabled AS IsDisabled,
    CAST(SUM(ps.used_page_count) * 8 / 1024.0 AS DECIMAL(10,2)) AS SizeMB
FROM sys.indexes i
INNER JOIN sys.dm_db_partition_stats ps ON i.object_id = ps.object_id AND i.index_id = ps.index_id
WHERE i.object_id = OBJECT_ID('Task')
AND i.name LIKE 'IX_Task_%Covering'
GROUP BY name, type_desc, is_disabled;

COMMIT TRANSACTION;

PRINT '';
PRINT '=============================================================================';
PRINT 'Migration completed successfully!';
PRINT 'Timestamp: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '';
PRINT 'Next Steps:';
PRINT '1. Update sp_ProfitabilityData to use ClientCode filter (see README.md)';
PRINT '2. Test client details page performance (target: < 2 seconds)';
PRINT '3. Monitor index usage for 48 hours';
PRINT '4. Review missing index DMVs to confirm improvements';
PRINT '=============================================================================';
GO
