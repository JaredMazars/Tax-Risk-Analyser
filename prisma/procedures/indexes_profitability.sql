-- ============================================================================
-- Performance Indexes for Profitability Reports
-- ============================================================================
--
-- PURPOSE: Optimize sp_ProfitabilityData with covering indexes
-- STRATEGY: Covering indexes include all columns needed to avoid key lookups
--
-- USAGE: Execute this script in SSMS or via Prisma
--
-- ============================================================================

-- ============================================================================
-- 1. WIPTransactions - CRITICAL (Highest Impact)
-- ============================================================================
-- Covers: JOIN on GSTaskID, WHERE on TranDate/EmpCode, all aggregation columns
-- This eliminates expensive key lookups on the largest table

PRINT 'Creating covering index on WIPTransactions...'
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_WIPTransactions_Profitability_Covering' 
    AND object_id = OBJECT_ID('[dbo].[WIPTransactions]')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_WIPTransactions_Profitability_Covering
    ON [dbo].[WIPTransactions] (GSTaskID, TranDate, EmpCode)
    INCLUDE (TType, Amount, Hour, Cost)
    WITH (
        ONLINE = ON,
        FILLFACTOR = 90,
        SORT_IN_TEMPDB = ON,
        STATISTICS_NORECOMPUTE = OFF
    );
    PRINT '✓ Created IX_WIPTransactions_Profitability_Covering'
END
ELSE
    PRINT '→ IX_WIPTransactions_Profitability_Covering already exists'
GO

-- ============================================================================
-- 2. Task - MEDIUM IMPACT
-- ============================================================================
-- Covers: WHERE filters + JOIN on GSClientID + all columns for temp table

PRINT 'Creating covering index on Task...'
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_Task_Profitability_Covering' 
    AND object_id = OBJECT_ID('[dbo].[Task]')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Task_Profitability_Covering
    ON [dbo].[Task] (ServLineCode, TaskPartner, TaskManager, TaskCode, GSClientID)
    INCLUDE (OfficeCode, ServLineDesc, TaskPartnerName, TaskManagerName, GSTaskID)
    WITH (
        ONLINE = ON,
        FILLFACTOR = 90,
        SORT_IN_TEMPDB = ON
    );
    PRINT '✓ Created IX_Task_Profitability_Covering'
END
ELSE
    PRINT '→ IX_Task_Profitability_Covering already exists'
GO

-- ============================================================================
-- 3. Client - LOW-MEDIUM IMPACT
-- ============================================================================
-- Covers: JOIN on GSClientID + WHERE on groupCode/clientCode + display columns

PRINT 'Creating covering index on Client...'
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_Client_Profitability_Covering' 
    AND object_id = OBJECT_ID('[dbo].[Client]')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Client_Profitability_Covering
    ON [dbo].[Client] (GSClientID, groupCode, clientCode)
    INCLUDE (clientNameFull, groupDesc)
    WITH (
        ONLINE = ON,
        FILLFACTOR = 90,
        SORT_IN_TEMPDB = ON
    );
    PRINT '✓ Created IX_Client_Profitability_Covering'
END
ELSE
    PRINT '→ IX_Client_Profitability_Covering already exists'
GO

-- ============================================================================
-- 4. Update Statistics
-- ============================================================================

PRINT ''
PRINT 'Updating statistics...'

UPDATE STATISTICS [dbo].[WIPTransactions] WITH FULLSCAN;
PRINT '✓ Statistics updated on WIPTransactions'

UPDATE STATISTICS [dbo].[Task] WITH FULLSCAN;
PRINT '✓ Statistics updated on Task'

UPDATE STATISTICS [dbo].[Client] WITH FULLSCAN;
PRINT '✓ Statistics updated on Client'

PRINT ''
PRINT '============================================================================'
PRINT 'Index creation complete!'
PRINT '============================================================================'
PRINT 'Test performance with:'
PRINT '  SET STATISTICS TIME ON;'
PRINT '  SET STATISTICS IO ON;'
PRINT '  EXEC sp_ProfitabilityData;'
PRINT '============================================================================'

GO
