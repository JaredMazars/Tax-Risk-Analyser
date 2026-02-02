-- ============================================================================
-- Profitability Data Stored Procedure (v4.2 - WIP Transaction Attribution Fix)
-- Full profitability metrics including Cost, Hours, and Adjustments
-- ============================================================================
--
-- v4.2 FIX: Filter PartnerCode/ManagerCode on WIPTransactions instead of Task
--           This ensures consistency with Overview graph which uses transaction-level
--           partner/manager attribution (historical snapshot at transaction time).
--
-- v4.1 FIX: Create temp tables before sp_executesql (scope visibility fix)
--
-- PURPOSE: Provides task-level profitability data for My Reports - Profitability
--
-- OPTIMIZATIONS (v4.0):
--   1. Dynamic SQL for sargable WHERE clauses (eliminates OR @Param = '*' pattern)
--   2. Two-stage temp table approach:
--      - #WIPAggregates: Pre-computed aggregates filtered by partner/manager on WIPTransactions
--      - #Tasks: Task metadata joined via GSTaskID
--   3. Final SELECT joins temp tables and computes derived fields
--   4. Eliminates duplicate SUM calculations in HAVING clause
--
-- PERFORMANCE IMPROVEMENTS:
--   - WIPTransactions scanned once instead of twice (SELECT + HAVING)
--   - Index seeks instead of scans when specific filters provided
--   - Accurate cardinality estimates from temp table statistics
--   - Reduced memory grants and tempdb spills
--
-- CRITICAL ACCOUNTING LOGIC:
--   - Partner/Manager filter: Applied to WIPTransactions (transaction-level attribution)
--   - OpeningBalance: WIP balance BEFORE @DateFrom (T + D + ADJ + F + P < @DateFrom)
--   - BalWip: OpeningBalance + Period Activity (T + D + ADJ + F within date range)
--   - NetWIP: BalWip + Period Provisions (P within date range)
--   - LTD* metrics: P&L items filtered by date range (@DateFrom to @DateTo)
--
-- RETURNS: Task-level WIP and profitability metrics (same output as v3.0)
--
-- PREREQUISITES:
--   Run prisma/migrations/20260201_profitability_indexes/migration.sql first
--
-- ============================================================================

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_ProfitabilityData] 
     @ServLineCode nvarchar(max)  = '*'
    ,@PartnerCode nvarchar(max)   = '*'
    ,@ManagerCode nvarchar(max)   = '*'
    ,@GroupCode nvarchar(max)     = '*'
    ,@ClientCode nvarchar(max)    = '*'
    ,@TaskCode nvarchar(max)      = '*'
    ,@DateFrom datetime           = '1900/01/01'
    ,@DateTo datetime             = '2025/01/01'
    ,@EmpCode nvarchar(max)       = '*'
AS

SET NOCOUNT ON

DECLARE @sql NVARCHAR(MAX)
DECLARE @params NVARCHAR(MAX)

-- ============================================================================
-- STEP 1: Aggregate WIP transactions into temp table (single scan)
-- ============================================================================
-- IMPORTANT: Partner/Manager filter is applied HERE on WIPTransactions.TaskPartner
-- This ensures consistency with Overview graph which uses transaction-level attribution
-- NOTE: Temp table must be created BEFORE sp_executesql (scoping rules)

-- Create temp table structure first
CREATE TABLE #WIPAggregates (
    GSTaskID UNIQUEIDENTIFIER
    ,OpeningT FLOAT
    ,OpeningD FLOAT
    ,OpeningADJ FLOAT
    ,OpeningF FLOAT
    ,OpeningP FLOAT
    ,LTDTimeCharged FLOAT
    ,LTDDisbCharged FLOAT
    ,LTDFeesBilled FLOAT
    ,LTDAdjustments FLOAT
    ,LTDWipProvision FLOAT
    ,LTDHours FLOAT
    ,LTDCost FLOAT
)

-- Build dynamic SQL for WIPTransactions aggregation with partner/manager filter
SET @sql = N'
INSERT INTO #WIPAggregates
SELECT 
    w.GSTaskID
    -- Opening balance components (transactions BEFORE @DateFrom)
    ,SUM(CASE WHEN w.TType = ''T'' AND w.TranDate < @p_DateFrom THEN ISNULL(w.Amount, 0) ELSE 0 END) AS OpeningT
    ,SUM(CASE WHEN w.TType = ''D'' AND w.TranDate < @p_DateFrom THEN ISNULL(w.Amount, 0) ELSE 0 END) AS OpeningD
    ,SUM(CASE WHEN w.TType = ''ADJ'' AND w.TranDate < @p_DateFrom THEN ISNULL(w.Amount, 0) ELSE 0 END) AS OpeningADJ
    ,SUM(CASE WHEN w.TType = ''F'' AND w.TranDate < @p_DateFrom THEN 0 - ISNULL(w.Amount, 0) ELSE 0 END) AS OpeningF
    ,SUM(CASE WHEN w.TType = ''P'' AND w.TranDate < @p_DateFrom THEN ISNULL(w.Amount, 0) ELSE 0 END) AS OpeningP
    -- Period metrics (within date range)
    ,SUM(CASE WHEN w.TType = ''T'' AND w.TranDate >= @p_DateFrom AND w.TranDate <= @p_DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDTimeCharged
    ,SUM(CASE WHEN w.TType = ''D'' AND w.TranDate >= @p_DateFrom AND w.TranDate <= @p_DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDDisbCharged
    ,SUM(CASE WHEN w.TType = ''F'' AND w.TranDate >= @p_DateFrom AND w.TranDate <= @p_DateTo THEN 0 - ISNULL(w.Amount, 0) ELSE 0 END) AS LTDFeesBilled
    ,SUM(CASE WHEN w.TType = ''ADJ'' AND w.TranDate >= @p_DateFrom AND w.TranDate <= @p_DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDAdjustments
    ,SUM(CASE WHEN w.TType = ''P'' AND w.TranDate >= @p_DateFrom AND w.TranDate <= @p_DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDWipProvision
    ,SUM(CASE WHEN w.TType = ''T'' AND w.TranDate >= @p_DateFrom AND w.TranDate <= @p_DateTo THEN ISNULL(w.Hour, 0) ELSE 0 END) AS LTDHours
    ,SUM(CASE WHEN w.TType != ''P'' AND (e.EmpCatCode IS NULL OR e.EmpCatCode != ''CARL'') 
              AND w.TranDate >= @p_DateFrom AND w.TranDate <= @p_DateTo THEN ISNULL(w.Cost, 0) ELSE 0 END) AS LTDCost
FROM [dbo].[WIPTransactions] w
    LEFT JOIN [dbo].[Employee] e ON w.EmpCode = e.EmpCode
WHERE 1=1'

-- Partner/Manager filter on WIPTransactions (transaction-level attribution)
IF @PartnerCode != '*' SET @sql = @sql + N' AND w.TaskPartner = @p_PartnerCode'
IF @ManagerCode != '*' SET @sql = @sql + N' AND w.TaskManager = @p_ManagerCode'

-- ServiceLine filter on WIPTransactions.TaskServLine
IF @ServLineCode != '*' SET @sql = @sql + N' AND w.TaskServLine = @p_ServLineCode'

-- TaskCode filter on WIPTransactions.TaskCode
IF @TaskCode != '*' SET @sql = @sql + N' AND w.TaskCode = @p_TaskCode'

-- EmpCode filter
IF @EmpCode != '*' SET @sql = @sql + N' AND w.EmpCode = @p_EmpCode'

SET @sql = @sql + N'
GROUP BY w.GSTaskID
OPTION (RECOMPILE)'

SET @params = N'@p_DateFrom datetime, @p_DateTo datetime, @p_PartnerCode nvarchar(max), @p_ManagerCode nvarchar(max), @p_ServLineCode nvarchar(max), @p_TaskCode nvarchar(max), @p_EmpCode nvarchar(max)'

EXEC sp_executesql @sql, @params,
    @p_DateFrom = @DateFrom,
    @p_DateTo = @DateTo,
    @p_PartnerCode = @PartnerCode,
    @p_ManagerCode = @ManagerCode,
    @p_ServLineCode = @ServLineCode,
    @p_TaskCode = @TaskCode,
    @p_EmpCode = @EmpCode

-- Create clustered index for efficient join
CREATE CLUSTERED INDEX IX_WIPAgg_GSTaskID ON #WIPAggregates (GSTaskID)

-- ============================================================================
-- STEP 2: Get Task metadata for tasks that have WIP aggregates
-- ============================================================================
-- Join to Task table to get display information (current task metadata)
-- Additional filters (GroupCode, ClientCode) are applied here on Task/Client
-- NOTE: Temp table must be created BEFORE sp_executesql (scoping rules)

CREATE TABLE #Tasks (
    clientCode NVARCHAR(10)
    ,clientNameFull NVARCHAR(255)
    ,groupCode NVARCHAR(10)
    ,groupDesc NVARCHAR(150)
    ,TaskCode NVARCHAR(10)
    ,OfficeCode NVARCHAR(10)
    ,ServLineCode NVARCHAR(10)
    ,ServLineDesc NVARCHAR(150)
    ,TaskPartner NVARCHAR(10)
    ,TaskPartnerName NVARCHAR(50)
    ,TaskManager NVARCHAR(10)
    ,TaskManagerName NVARCHAR(50)
    ,GSTaskID UNIQUEIDENTIFIER
    ,GSClientID UNIQUEIDENTIFIER
    ,masterCode NVARCHAR(50)
    ,SubServlineGroupCode NVARCHAR(10)
    ,SubServlineGroupDesc NVARCHAR(150)
    ,masterServiceLineName NVARCHAR(200)
)

SET @sql = N'
INSERT INTO #Tasks
SELECT
    c.clientCode
    ,c.clientNameFull
    ,c.groupCode
    ,c.groupDesc
    ,t.TaskCode
    ,t.OfficeCode
    ,t.ServLineCode
    ,t.ServLineDesc
    ,t.TaskPartner
    ,t.TaskPartnerName
    ,t.TaskManager
    ,t.TaskManagerName
    ,t.GSTaskID
    ,t.GSClientID
    ,sle.masterCode
    ,sle.SubServlineGroupCode
    ,sle.SubServlineGroupDesc
    ,slm.name AS masterServiceLineName
FROM [dbo].[Task] t
    INNER JOIN [dbo].[Client] c ON t.GSClientID = c.GSClientID
    LEFT JOIN [dbo].[ServiceLineExternal] sle ON t.ServLineCode = sle.ServLineCode
    LEFT JOIN [dbo].[ServiceLineMaster] slm ON sle.masterCode = slm.code
WHERE t.GSTaskID IN (SELECT GSTaskID FROM #WIPAggregates)'

-- Additional filters on Task/Client (GroupCode, ClientCode)
IF @ClientCode != '*' SET @sql = @sql + N' AND c.clientCode = @p_ClientCode'
IF @GroupCode != '*' SET @sql = @sql + N' AND c.groupCode = @p_GroupCode'

SET @params = N'@p_ClientCode nvarchar(max), @p_GroupCode nvarchar(max)'

EXEC sp_executesql @sql, @params,
    @p_ClientCode = @ClientCode,
    @p_GroupCode = @GroupCode

-- Create clustered index on temp table for efficient join
CREATE CLUSTERED INDEX IX_Tasks_GSTaskID ON #Tasks (GSTaskID)

-- ============================================================================
-- STEP 3: Final SELECT - Join temp tables and compute derived fields
-- ============================================================================
-- All calculations use pre-aggregated values (no re-computation)
-- WHERE clause replaces HAVING (operates on materialized values)

SELECT 
    t.clientCode
    ,t.clientNameFull
    ,t.groupCode
    ,t.groupDesc
    ,t.TaskCode
    ,t.OfficeCode
    ,t.ServLineCode
    ,t.ServLineDesc
    ,t.TaskPartner
    ,t.TaskPartnerName
    ,t.TaskManager
    ,t.TaskManagerName
    ,t.GSTaskID
    ,t.GSClientID
    -- Service line hierarchy
    ,t.masterCode
    ,t.SubServlineGroupCode
    ,t.SubServlineGroupDesc
    ,t.masterServiceLineName
    
    -- Opening balance (computed from stored components, includes provisions)
    ,(wa.OpeningT + wa.OpeningD + wa.OpeningADJ + wa.OpeningF + wa.OpeningP) AS OpeningBalance
    
    -- Period metrics (direct from temp table)
    ,wa.LTDTimeCharged
    ,wa.LTDDisbCharged
    ,wa.LTDFeesBilled
    ,(wa.LTDAdjustments + wa.LTDWipProvision) AS LTDAdjustments  -- ADJ + P combined
    ,(wa.OpeningP + wa.LTDWipProvision) AS LTDWipProvision  -- Total provisions (opening + period) for reference
    ,wa.LTDHours
    ,wa.LTDCost
    
    -- BalWip = Gross WIP (T + D + ADJ - F, NO provisions)
    ,(wa.OpeningT + wa.OpeningD + wa.OpeningADJ + wa.OpeningF
      + wa.LTDTimeCharged + wa.LTDDisbCharged + wa.LTDAdjustments + wa.LTDFeesBilled) AS BalWip
    
    -- NetWIP = BalWip + ALL Provisions (opening + period)
    ,(wa.OpeningT + wa.OpeningD + wa.OpeningADJ + wa.OpeningF
      + wa.LTDTimeCharged + wa.LTDDisbCharged + wa.LTDAdjustments + wa.LTDFeesBilled
      + wa.OpeningP + wa.LTDWipProvision) AS NetWIP
    
    -- Calculated fields (Adjustments now includes Provisions)
    ,(wa.LTDTimeCharged + wa.LTDAdjustments + wa.LTDWipProvision) AS NetRevenue
    ,(wa.LTDTimeCharged + wa.LTDAdjustments + wa.LTDWipProvision - wa.LTDCost) AS GrossProfit

FROM #Tasks t
    INNER JOIN #WIPAggregates wa ON t.GSTaskID = wa.GSTaskID
WHERE 
    -- Exclude tasks without master service line mapping
    t.masterCode IS NOT NULL
    -- Exclude tasks where ALL amounts are zero (uses pre-computed values)
    AND (
        -- Check opening balance
        ABS(wa.OpeningT + wa.OpeningD + wa.OpeningADJ + wa.OpeningF + wa.OpeningP) > 0.01
        -- OR any period activity
        OR ABS(wa.LTDTimeCharged) > 0.01
        OR ABS(wa.LTDDisbCharged) > 0.01
        OR ABS(wa.LTDAdjustments) > 0.01
        OR ABS(wa.LTDFeesBilled) > 0.01
        OR ABS(wa.LTDWipProvision) > 0.01
    )
ORDER BY t.groupCode, t.clientCode, t.TaskCode

-- ============================================================================
-- CLEANUP
-- ============================================================================
DROP TABLE #WIPAggregates
DROP TABLE #Tasks

GO
