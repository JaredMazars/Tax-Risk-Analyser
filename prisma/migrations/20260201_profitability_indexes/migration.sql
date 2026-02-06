-- ============================================================================
-- Profitability Optimization - Index Creation Script
-- Created: 2026-02-01
-- Purpose: Create covering indexes to optimize sp_ProfitabilityData performance
-- ============================================================================
--
-- IMPORTANT: Run this script in Azure Data Studio or SSMS
-- Recommended timeout: 30+ minutes (index creation on large tables)
-- All indexes use ONLINE = ON for zero-downtime creation
--
-- ============================================================================

SET NOCOUNT ON;
PRINT '========================================================================'
PRINT 'PROFITABILITY OPTIMIZATION - INDEX CREATION'
PRINT 'Started: ' + CONVERT(VARCHAR, GETDATE(), 120)
PRINT '========================================================================'
PRINT ''
GO

-- ============================================================================
-- INDEX 1: Employee Covering Index for EmpCatCode Lookup
-- Purpose: Eliminate key lookups when checking for CARL employee category
-- ============================================================================
PRINT 'Step 1/4: Creating IX_Employee_Profitability_Covering...'
PRINT '----------------------------------------------------------------'

IF EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_Employee_Profitability_Covering' 
    AND object_id = OBJECT_ID('Employee')
)
BEGIN
    PRINT '  Index already exists - skipping'
END
ELSE
BEGIN
    CREATE NONCLUSTERED INDEX IX_Employee_Profitability_Covering
    ON [dbo].[Employee] (EmpCode)
    INCLUDE (EmpCatCode)
    WITH (ONLINE = ON, FILLFACTOR = 90);
    
    PRINT '  Created IX_Employee_Profitability_Covering'
END
PRINT ''
GO

-- ============================================================================
-- INDEX 2: WIPTransactions EmpCode Covering Index
-- Purpose: Optimize queries filtering by specific employee
-- Used when @EmpCode != '*' parameter is passed
-- ============================================================================
PRINT 'Step 2/4: Creating IX_WIPTransactions_EmpCode_Covering...'
PRINT '----------------------------------------------------------------'

IF EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_WIPTransactions_EmpCode_Covering' 
    AND object_id = OBJECT_ID('WIPTransactions')
)
BEGIN
    PRINT '  Index already exists - skipping'
END
ELSE
BEGIN
    PRINT '  Creating index on WIPTransactions (5.7M+ rows - this may take 10-20 minutes)...'
    
    CREATE NONCLUSTERED INDEX IX_WIPTransactions_EmpCode_Covering
    ON [dbo].[WIPTransactions] (EmpCode, GSTaskID, TranDate, TType)
    INCLUDE (Amount, Hour, Cost)
    WITH (ONLINE = ON, FILLFACTOR = 90);
    
    PRINT '  Created IX_WIPTransactions_EmpCode_Covering'
END
PRINT ''
GO

-- ============================================================================
-- INDEX 3: Task Profitability Covering Index
-- Purpose: Optimize Step 1 task filtering with multi-column predicates
-- ============================================================================
PRINT 'Step 3/4: Creating IX_Task_Profitability_Covering...'
PRINT '----------------------------------------------------------------'

IF EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_Task_Profitability_Covering' 
    AND object_id = OBJECT_ID('Task')
)
BEGIN
    PRINT '  Index already exists - skipping'
END
ELSE
BEGIN
    CREATE NONCLUSTERED INDEX IX_Task_Profitability_Covering
    ON [dbo].[Task] (ServLineCode, TaskPartner, TaskManager, TaskCode, GSClientID)
    INCLUDE (OfficeCode, ServLineDesc, TaskPartnerName, TaskManagerName, GSTaskID)
    WITH (ONLINE = ON, FILLFACTOR = 90);
    
    PRINT '  Created IX_Task_Profitability_Covering'
END
PRINT ''
GO

-- ============================================================================
-- INDEX 4: Client Profitability Covering Index
-- Purpose: Optimize client lookups by groupCode and clientCode
-- ============================================================================
PRINT 'Step 4/4: Creating IX_Client_Profitability_Covering...'
PRINT '----------------------------------------------------------------'

IF EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_Client_Profitability_Covering' 
    AND object_id = OBJECT_ID('Client')
)
BEGIN
    PRINT '  Index already exists - skipping'
END
ELSE
BEGIN
    CREATE NONCLUSTERED INDEX IX_Client_Profitability_Covering
    ON [dbo].[Client] (GSClientID, groupCode, clientCode)
    INCLUDE (clientNameFull, groupDesc)
    WITH (ONLINE = ON, FILLFACTOR = 90);
    
    PRINT '  Created IX_Client_Profitability_Covering'
END
PRINT ''
GO

-- ============================================================================
-- VERIFY: Check existing profitability index on WIPTransactions
-- This should already exist from previous optimizations
-- ============================================================================
PRINT 'Verifying existing idx_wip_profitability_covering...'
PRINT '----------------------------------------------------------------'

IF EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'idx_wip_profitability_covering' 
    AND object_id = OBJECT_ID('WIPTransactions')
)
BEGIN
    PRINT '  idx_wip_profitability_covering exists (OK)'
END
ELSE
BEGIN
    PRINT '  WARNING: idx_wip_profitability_covering is missing!'
    PRINT '  Creating idx_wip_profitability_covering...'
    
    CREATE NONCLUSTERED INDEX idx_wip_profitability_covering
    ON [dbo].[WIPTransactions] (GSTaskID, TranDate, TType)
    INCLUDE (Amount, Hour, Cost, EmpCode)
    WITH (ONLINE = ON, FILLFACTOR = 90);
    
    PRINT '  Created idx_wip_profitability_covering'
END
PRINT ''
GO

-- ============================================================================
-- UPDATE STATISTICS
-- ============================================================================
PRINT 'Updating statistics on affected tables...'
PRINT '----------------------------------------------------------------'

PRINT '  Updating Employee statistics...'
UPDATE STATISTICS [dbo].[Employee] WITH FULLSCAN;

PRINT '  Updating Task statistics...'
UPDATE STATISTICS [dbo].[Task] WITH FULLSCAN;

PRINT '  Updating Client statistics...'
UPDATE STATISTICS [dbo].[Client] WITH FULLSCAN;

PRINT '  Updating WIPTransactions statistics (this may take a few minutes)...'
UPDATE STATISTICS [dbo].[WIPTransactions] WITH FULLSCAN;

PRINT '  Statistics updated.'
PRINT ''
GO

-- ============================================================================
-- VERIFICATION: Show all profitability-related indexes
-- ============================================================================
PRINT '========================================================================'
PRINT 'INDEX VERIFICATION'
PRINT '========================================================================'
PRINT ''

SELECT 
    OBJECT_NAME(i.object_id) AS TableName,
    i.name AS IndexName,
    i.type_desc AS IndexType,
    (SELECT COUNT(*) FROM sys.index_columns ic2 
     WHERE ic2.object_id = i.object_id AND ic2.index_id = i.index_id 
     AND ic2.is_included_column = 0) AS KeyColumns,
    (SELECT COUNT(*) FROM sys.index_columns ic2 
     WHERE ic2.object_id = i.object_id AND ic2.index_id = i.index_id 
     AND ic2.is_included_column = 1) AS IncludeColumns
FROM sys.indexes i
WHERE (
    (i.object_id = OBJECT_ID('Employee') AND i.name LIKE '%Profitability%')
    OR (i.object_id = OBJECT_ID('Task') AND i.name LIKE '%Profitability%')
    OR (i.object_id = OBJECT_ID('Client') AND i.name LIKE '%Profitability%')
    OR (i.object_id = OBJECT_ID('WIPTransactions') AND (i.name LIKE '%profitability%' OR i.name LIKE '%EmpCode_Covering%'))
)
ORDER BY OBJECT_NAME(i.object_id), i.name;
GO

PRINT ''
PRINT '========================================================================'
PRINT 'INDEX CREATION COMPLETE'
PRINT 'Finished: ' + CONVERT(VARCHAR, GETDATE(), 120)
PRINT '========================================================================'
PRINT ''
PRINT 'Next step: Run the optimized sp_ProfitabilityData stored procedure'
PRINT ''
GO
