-- ============================================================================
-- Update Existing WIPTransactions Indexes for sp_WIPAgingByTask
-- ============================================================================
--
-- STRATEGY:
-- Instead of creating 6 new indexes, we'll enhance 2 existing indexes that
-- are already close to what we need. This minimizes index overhead while
-- providing optimal performance for the stored procedure.
--
-- CHANGES:
-- 1. Enhance idx_wip_partner_date (add missing columns)
-- 2. Enhance idx_wip_manager_date (add missing columns)
-- 3. Create 1 new general-purpose covering index (for other filter combinations)
--
-- DEPLOYMENT TIME: ~10-20 minutes total
-- ============================================================================

-- ============================================================================
-- STEP 1: Enhance idx_wip_partner_date
-- ============================================================================
-- Current: Keys(TaskPartner, TranDate) + INCLUDE(GSTaskID, Amount, Cost, Hour, TType, GSClientID, ClientCode, ClientName, TaskCode, TaskServLine)
-- Enhanced: Add TType to keys (better selectivity) + add missing descriptive columns
-- ============================================================================

PRINT 'Step 1: Dropping idx_wip_partner_date...'
DROP INDEX IF EXISTS idx_wip_partner_date ON WIPTransactions;

PRINT 'Creating enhanced idx_wip_partner_date...'
CREATE NONCLUSTERED INDEX idx_wip_partner_date
ON WIPTransactions(TaskPartner, TranDate, TType)  -- Added TType to keys for better selectivity
INCLUDE (
    -- Existing columns (keep all)
    GSTaskID,
    Amount,
    Cost,
    Hour,
    GSClientID,
    ClientCode,
    ClientName,
    TaskCode,
    TaskServLine,
    
    -- NEW: Missing columns needed for aging SP
    GroupCode,
    TaskServLineDesc,
    TaskManager,
    PartnerName,
    ManagerName,
    TaskDesc,
    GroupDesc
)
WITH (ONLINE = ON, FILLFACTOR = 90);

PRINT 'idx_wip_partner_date enhanced successfully!'
GO

-- ============================================================================
-- STEP 2: Enhance idx_wip_manager_date
-- ============================================================================
-- Current: Keys(TaskManager, TranDate) + INCLUDE(GSTaskID, Amount, Cost, Hour, TType, GSClientID, ClientCode, ClientName, TaskCode, TaskServLine)
-- Enhanced: Add TType to keys + add missing descriptive columns
-- ============================================================================

PRINT 'Step 2: Dropping idx_wip_manager_date...'
DROP INDEX IF EXISTS idx_wip_manager_date ON WIPTransactions;

PRINT 'Creating enhanced idx_wip_manager_date...'
CREATE NONCLUSTERED INDEX idx_wip_manager_date
ON WIPTransactions(TaskManager, TranDate, TType)  -- Added TType to keys
INCLUDE (
    -- Existing columns (keep all)
    GSTaskID,
    Amount,
    Cost,
    Hour,
    GSClientID,
    ClientCode,
    ClientName,
    TaskCode,
    TaskServLine,
    
    -- NEW: Missing columns needed for aging SP
    GroupCode,
    TaskServLineDesc,
    TaskPartner,
    PartnerName,
    ManagerName,
    TaskDesc,
    GroupDesc
)
WITH (ONLINE = ON, FILLFACTOR = 90);

PRINT 'idx_wip_manager_date enhanced successfully!'
GO

-- ============================================================================
-- STEP 3: Create General Covering Index (for other filter combinations)
-- ============================================================================
-- Handles: ClientCode, GroupCode, TaskServLine, TaskCode filters
-- Also serves as fallback for queries without specific filter indexes
-- ============================================================================

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'idx_WIPTransactions_Aging_General' 
    AND object_id = OBJECT_ID('WIPTransactions')
)
BEGIN
    PRINT 'Step 3: Creating idx_WIPTransactions_Aging_General...'
    
    CREATE NONCLUSTERED INDEX idx_WIPTransactions_Aging_General
    ON WIPTransactions(TranDate, TType)  -- Most selective filters first
    INCLUDE (
        -- All columns needed for any filter combination
        GSTaskID,
        GSClientID,
        TaskCode,
        ClientCode,
        GroupCode,
        TaskServLine,
        TaskServLineDesc,
        TaskPartner,
        PartnerName,
        TaskManager,
        ManagerName,
        TaskDesc,
        ClientName,
        GroupDesc,
        Amount
    )
    WITH (ONLINE = ON, FILLFACTOR = 90);
    
    PRINT 'idx_WIPTransactions_Aging_General created successfully!'
END
ELSE
BEGIN
    PRINT 'idx_WIPTransactions_Aging_General already exists.'
END
GO

-- ============================================================================
-- STEP 4: Update Statistics
-- ============================================================================

PRINT 'Step 4: Updating statistics...'
UPDATE STATISTICS WIPTransactions WITH FULLSCAN;
PRINT 'Statistics updated!'
GO

-- ============================================================================
-- VERIFICATION
-- ============================================================================

PRINT ''
PRINT '=========================================='
PRINT 'Verification: Enhanced Indexes'
PRINT '=========================================='

SELECT 
    i.name AS IndexName,
    i.type_desc AS IndexType,
    (SELECT COUNT(*) FROM sys.index_columns ic2 
     WHERE ic2.object_id = i.object_id AND ic2.index_id = i.index_id 
     AND ic2.is_included_column = 0) AS KeyColumnCount,
    (SELECT COUNT(*) FROM sys.index_columns ic2 
     WHERE ic2.object_id = i.object_id AND ic2.index_id = i.index_id 
     AND ic2.is_included_column = 1) AS IncludeColumnCount
FROM sys.indexes i
WHERE i.object_id = OBJECT_ID('WIPTransactions')
  AND i.name IN ('idx_wip_partner_date', 'idx_wip_manager_date', 'idx_WIPTransactions_Aging_General')
ORDER BY i.name;

PRINT ''
PRINT 'Expected Results:'
PRINT '- idx_wip_partner_date: 3 key columns, 16 include columns'
PRINT '- idx_wip_manager_date: 3 key columns, 16 include columns'
PRINT '- idx_WIPTransactions_Aging_General: 2 key columns, 15 include columns'
GO

-- ============================================================================
-- TESTING
-- ============================================================================

PRINT ''
PRINT '=========================================='
PRINT 'Testing Enhanced Indexes'
PRINT '=========================================='
PRINT ''
PRINT 'Run these queries to test performance:'
PRINT ''
PRINT '-- Test 1: Partner filter (should use idx_wip_partner_date)'
PRINT 'EXEC sp_WIPAgingByTask @TaskPartner = ''FERY001'';'
PRINT ''
PRINT '-- Test 2: Manager filter (should use idx_wip_manager_date)'
PRINT 'EXEC sp_WIPAgingByTask @TaskManager = ''PERJ001'';'
PRINT ''
PRINT '-- Test 3: Client filter (should use idx_WIPTransactions_Aging_General)'
PRINT 'EXEC sp_WIPAgingByTask @ClientCode = ''BRE0200'';'
PRINT ''
PRINT '-- Test 4: Group + ServiceLine (should use idx_WIPTransactions_Aging_General)'
PRINT 'EXEC sp_WIPAgingByTask @GroupCode = ''BRE02'', @ServLineCode = ''AUD'';'
PRINT ''
PRINT 'Target: All queries should complete in <5 seconds'
GO

-- ============================================================================
-- SUMMARY
-- ============================================================================
--
-- What Changed:
-- 1. Enhanced idx_wip_partner_date: Added TType to keys + 7 new INCLUDE columns
-- 2. Enhanced idx_wip_manager_date: Added TType to keys + 7 new INCLUDE columns
-- 3. Created idx_WIPTransactions_Aging_General: New covering index for other filters
--
-- Benefits:
-- - Reuses existing index names (maintains compatibility)
-- - Only 3 indexes total instead of 6+
-- - Covers all filter combinations efficiently
-- - Minimal impact on INSERT/UPDATE performance
--
-- Index Usage by Filter:
-- - @TaskPartner: idx_wip_partner_date
-- - @TaskManager: idx_wip_manager_date
-- - @ClientCode: idx_WIPTransactions_Aging_General
-- - @GroupCode: idx_WIPTransactions_Aging_General
-- - @ServLineCode: idx_WIPTransactions_Aging_General
-- - @TaskCode: idx_WIPTransactions_Aging_General
-- - Multiple filters: SQL Server chooses most selective
--
-- ============================================================================
