-- ============================================================================
-- Profitability SP Covering Indexes
-- Adds covering indexes for GroupCode, ManagerCode, and ServLineCode filters
-- 
-- Target: sp_ProfitabilityData filter optimization
-- Expected: 2-10x faster queries when filtering by Group, Manager, or ServLine
-- ============================================================================
--
-- IMPORTANT: Run during maintenance window (index creation on 5.7M rows)
-- Estimated time: 5-15 minutes per index with ONLINE = ON
--
-- ============================================================================

SET NOCOUNT ON;

PRINT '';
PRINT '=============================================================================';
PRINT 'Starting Profitability SP Covering Index Creation';
PRINT 'Timestamp: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '=============================================================================';

-- ============================================================================
-- INDEX 1: GroupCode Covering Index (NEW)
-- ============================================================================
-- Purpose: Enables index seek for GroupCode filter in sp_ProfitabilityData
-- Currently: No index on GroupCode - causes full table scan

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_WIPTransactions_GroupCode_Covering' 
    AND object_id = OBJECT_ID('WIPTransactions')
)
BEGIN
    PRINT '';
    PRINT 'Creating IX_WIPTransactions_GroupCode_Covering...';
    PRINT 'This may take several minutes on 5.7M rows...';
    
    CREATE NONCLUSTERED INDEX [IX_WIPTransactions_GroupCode_Covering]
    ON [dbo].[WIPTransactions] ([GroupCode])
    INCLUDE ([GSTaskID], [TranDate], [TType], [Amount], [Hour], [Cost], [EmpCode])
    WITH (ONLINE = ON, FILLFACTOR = 90, DATA_COMPRESSION = PAGE);
    
    PRINT 'IX_WIPTransactions_GroupCode_Covering created successfully';
END
ELSE
BEGIN
    PRINT 'IX_WIPTransactions_GroupCode_Covering already exists, skipping...';
END
GO

-- ============================================================================
-- INDEX 2: ManagerCode Covering Index (REPLACES idx_wip_manager_date)
-- ============================================================================
-- Purpose: Full covering index for ManagerCode filter
-- Existing: idx_wip_manager_date missing GSTaskID, EmpCode (causes key lookups)

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_WIPTransactions_Manager_Covering' 
    AND object_id = OBJECT_ID('WIPTransactions')
)
BEGIN
    PRINT '';
    PRINT 'Creating IX_WIPTransactions_Manager_Covering...';
    PRINT 'This may take several minutes on 5.7M rows...';
    
    CREATE NONCLUSTERED INDEX [IX_WIPTransactions_Manager_Covering]
    ON [dbo].[WIPTransactions] ([TaskManager])
    INCLUDE ([GSTaskID], [TranDate], [TType], [Amount], [Hour], [Cost], [EmpCode])
    WITH (ONLINE = ON, FILLFACTOR = 90, DATA_COMPRESSION = PAGE);
    
    PRINT 'IX_WIPTransactions_Manager_Covering created successfully';
END
ELSE
BEGIN
    PRINT 'IX_WIPTransactions_Manager_Covering already exists, skipping...';
END
GO

-- ============================================================================
-- INDEX 3: ServLineCode Covering Index (REPLACES idx_wip_serviceline)
-- ============================================================================
-- Purpose: Full covering index for ServLineCode filter
-- Existing: idx_wip_serviceline missing GSTaskID, TType, EmpCode (causes key lookups)

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_WIPTransactions_ServLine_Covering' 
    AND object_id = OBJECT_ID('WIPTransactions')
)
BEGIN
    PRINT '';
    PRINT 'Creating IX_WIPTransactions_ServLine_Covering...';
    PRINT 'This may take several minutes on 5.7M rows...';
    
    CREATE NONCLUSTERED INDEX [IX_WIPTransactions_ServLine_Covering]
    ON [dbo].[WIPTransactions] ([TaskServLine])
    INCLUDE ([GSTaskID], [TranDate], [TType], [Amount], [Hour], [Cost], [EmpCode])
    WITH (ONLINE = ON, FILLFACTOR = 90, DATA_COMPRESSION = PAGE);
    
    PRINT 'IX_WIPTransactions_ServLine_Covering created successfully';
END
ELSE
BEGIN
    PRINT 'IX_WIPTransactions_ServLine_Covering already exists, skipping...';
END
GO

-- ============================================================================
-- Update Statistics
-- ============================================================================

PRINT '';
PRINT 'Updating statistics for accurate query plans...';

UPDATE STATISTICS [dbo].[WIPTransactions] WITH FULLSCAN;

PRINT 'Statistics updated successfully';

-- ============================================================================
-- Verify Index Creation
-- ============================================================================

PRINT '';
PRINT '=============================================================================';
PRINT 'Verification: Created Indexes';
PRINT '=============================================================================';

SELECT 
    i.name AS IndexName,
    i.type_desc AS IndexType,
    i.is_disabled AS IsDisabled,
    CAST(SUM(ps.used_page_count) * 8 / 1024.0 AS DECIMAL(10,2)) AS SizeMB
FROM sys.indexes i
INNER JOIN sys.dm_db_partition_stats ps 
    ON i.object_id = ps.object_id AND i.index_id = ps.index_id
WHERE i.object_id = OBJECT_ID('WIPTransactions')
AND i.name IN (
    'IX_WIPTransactions_GroupCode_Covering',
    'IX_WIPTransactions_Manager_Covering',
    'IX_WIPTransactions_ServLine_Covering'
)
GROUP BY i.name, i.type_desc, i.is_disabled;

PRINT '';
PRINT '=============================================================================';
PRINT 'Migration completed successfully!';
PRINT 'Timestamp: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '=============================================================================';
GO
