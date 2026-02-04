-- ============================================================================
-- Profitability Summary By Manager Stored Procedure (v1.1)
-- Pre-aggregated profitability metrics grouped by TaskManager
-- ============================================================================
--
-- PURPOSE: Provides manager-level profitability summary for Country Management
--          Performance Reports. Returns ~200-300 rows instead of 16K+ tasks.
--
-- OPTIMIZATIONS:
--   1. Dynamic SQL for sargable WHERE clauses
--   2. Two-stage temp table approach (same as sp_ProfitabilityData)
--   3. Final aggregation by TaskManager for summary output
--   4. Supports multi-select manager codes via STRING_SPLIT
--   5. v1.1: Pre-filter active tasks into indexed temp table (40% row reduction)
--
-- PERFORMANCE:
--   - Pre-filters to active tasks only
--   - Returns 200-300 rows vs 16K+ tasks
--   - Expected response time: 1-3 seconds for business-wide
--
-- USED BY:
--   - Country Management Performance Reports
--   - Executive dashboards
--
-- ============================================================================

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_ProfitabilitySummaryByManager] 
     @ServLineCode nvarchar(max)  = '*'
    ,@ManagerCode nvarchar(max)   = '*'
    ,@DateFrom datetime           = '1900/01/01'
    ,@DateTo datetime             = '2025/01/01'
AS

SET NOCOUNT ON

DECLARE @sql NVARCHAR(MAX)
DECLARE @params NVARCHAR(MAX)

-- ============================================================================
-- STEP 0: Pre-filter active tasks into indexed temp table
-- ============================================================================
-- This reduces the WIPTransactions scan by ~40% (inactive tasks excluded)

CREATE TABLE #ActiveTasks (
    GSTaskID UNIQUEIDENTIFIER NOT NULL,
    TaskManager NVARCHAR(10),
    GSClientID UNIQUEIDENTIFIER
)

INSERT INTO #ActiveTasks
SELECT GSTaskID, TaskManager, GSClientID
FROM [dbo].[Task]
WHERE Active = 'Yes'

-- Add clustered index for efficient JOIN
CREATE CLUSTERED INDEX IX_AT_GSTaskID ON #ActiveTasks (GSTaskID)

-- Add index for manager filtering
CREATE NONCLUSTERED INDEX IX_AT_Manager ON #ActiveTasks (TaskManager)

-- ============================================================================
-- STEP 1: Aggregate WIP transactions into temp table (single scan)
-- ============================================================================
-- Same logic as sp_ProfitabilityData but filtering on WIPTransactions.TaskManager
-- Only includes active tasks via JOIN to #ActiveTasks

CREATE TABLE #WIPAggregates (
    GSTaskID UNIQUEIDENTIFIER
    ,TaskManager NVARCHAR(10)
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

SET @sql = N'
INSERT INTO #WIPAggregates
SELECT 
    w.GSTaskID
    ,w.TaskManager
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
    INNER JOIN #ActiveTasks at ON w.GSTaskID = at.GSTaskID
    LEFT JOIN [dbo].[Employee] e ON w.EmpCode = e.EmpCode
WHERE 1=1'

-- Manager filter on WIPTransactions.TaskManager
-- Supports comma-separated list of codes for multi-select filtering
IF @ManagerCode != '*' AND CHARINDEX(',', @ManagerCode) > 0
    SET @sql = @sql + N' AND w.TaskManager IN (SELECT LTRIM(RTRIM(value)) FROM STRING_SPLIT(@p_ManagerCode, '',''))'
ELSE IF @ManagerCode != '*'
    SET @sql = @sql + N' AND w.TaskManager = @p_ManagerCode'

-- ServiceLine filter on WIPTransactions.TaskServLine
IF @ServLineCode != '*' SET @sql = @sql + N' AND w.TaskServLine = @p_ServLineCode'

SET @sql = @sql + N'
GROUP BY w.GSTaskID, w.TaskManager
OPTION (RECOMPILE)'

SET @params = N'@p_DateFrom datetime, @p_DateTo datetime, @p_ManagerCode nvarchar(max), @p_ServLineCode nvarchar(max)'

EXEC sp_executesql @sql, @params,
    @p_DateFrom = @DateFrom,
    @p_DateTo = @DateTo,
    @p_ManagerCode = @ManagerCode,
    @p_ServLineCode = @ServLineCode

-- Create clustered index for efficient join
CREATE CLUSTERED INDEX IX_WIPAgg_TaskManager ON #WIPAggregates (TaskManager, GSTaskID)

-- ============================================================================
-- STEP 2: Get Manager names and filter to valid tasks
-- ============================================================================

CREATE TABLE #ManagerInfo (
    TaskManager NVARCHAR(10)
    ,ManagerName NVARCHAR(100)
)

INSERT INTO #ManagerInfo
SELECT DISTINCT 
    wa.TaskManager
    ,ISNULL(e.EmpName, wa.TaskManager) AS ManagerName
FROM #WIPAggregates wa
LEFT JOIN [dbo].[Employee] e ON wa.TaskManager = e.EmpCode
WHERE wa.TaskManager IS NOT NULL AND wa.TaskManager != ''

CREATE CLUSTERED INDEX IX_MI_TaskManager ON #ManagerInfo (TaskManager)

-- ============================================================================
-- STEP 3: Get Client count per manager (using pre-filtered #ActiveTasks)
-- ============================================================================

CREATE TABLE #ManagerClients (
    TaskManager NVARCHAR(10)
    ,ClientCount INT
)

INSERT INTO #ManagerClients
SELECT 
    wa.TaskManager
    ,COUNT(DISTINCT at.GSClientID) AS ClientCount
FROM #WIPAggregates wa
INNER JOIN #ActiveTasks at ON wa.GSTaskID = at.GSTaskID
WHERE wa.TaskManager IS NOT NULL AND wa.TaskManager != ''
GROUP BY wa.TaskManager

CREATE CLUSTERED INDEX IX_MC_TaskManager ON #ManagerClients (TaskManager)

-- ============================================================================
-- STEP 4: Final SELECT - Aggregate by Manager
-- ============================================================================

SELECT 
    mi.TaskManager AS ManagerCode
    ,mi.ManagerName
    ,COUNT(DISTINCT wa.GSTaskID) AS TaskCount
    ,ISNULL(mc.ClientCount, 0) AS ClientCount
    
    -- Opening balance (sum of all task opening balances)
    ,ROUND(SUM(wa.OpeningT + wa.OpeningD + wa.OpeningADJ + wa.OpeningF + wa.OpeningP), 2) AS OpeningBalance
    
    -- Period metrics (direct sums)
    ,ROUND(SUM(wa.LTDTimeCharged), 2) AS LTDTimeCharged
    ,ROUND(SUM(wa.LTDDisbCharged), 2) AS LTDDisbCharged
    ,ROUND(SUM(wa.LTDFeesBilled), 2) AS LTDFeesBilled
    ,ROUND(SUM(wa.LTDAdjustments + wa.LTDWipProvision), 2) AS LTDAdjustments
    ,ROUND(SUM(wa.LTDHours), 2) AS LTDHours
    ,ROUND(SUM(wa.LTDCost), 2) AS LTDCost
    
    -- BalWip = Gross WIP (T + D + ADJ - F, NO provisions)
    ,ROUND(SUM(
        wa.OpeningT + wa.OpeningD + wa.OpeningADJ + wa.OpeningF
        + wa.LTDTimeCharged + wa.LTDDisbCharged + wa.LTDAdjustments + wa.LTDFeesBilled
    ), 2) AS BalWip
    
    -- NetWIP = BalWip + ALL Provisions (opening + period)
    ,ROUND(SUM(
        wa.OpeningT + wa.OpeningD + wa.OpeningADJ + wa.OpeningF
        + wa.LTDTimeCharged + wa.LTDDisbCharged + wa.LTDAdjustments + wa.LTDFeesBilled
        + wa.OpeningP + wa.LTDWipProvision
    ), 2) AS NetWIP
    
    -- NetRevenue = Time + Adjustments + Provisions
    ,ROUND(SUM(wa.LTDTimeCharged + wa.LTDAdjustments + wa.LTDWipProvision), 2) AS NetRevenue
    
    -- GrossProfit = NetRevenue - Cost
    ,ROUND(SUM(wa.LTDTimeCharged + wa.LTDAdjustments + wa.LTDWipProvision - wa.LTDCost), 2) AS GrossProfit
    
    -- GP% = GrossProfit / NetRevenue * 100
    ,CASE 
        WHEN SUM(wa.LTDTimeCharged + wa.LTDAdjustments + wa.LTDWipProvision) = 0 THEN 0
        ELSE ROUND(
            SUM(wa.LTDTimeCharged + wa.LTDAdjustments + wa.LTDWipProvision - wa.LTDCost) 
            / SUM(wa.LTDTimeCharged + wa.LTDAdjustments + wa.LTDWipProvision) * 100
        , 2)
    END AS GPPercentage

FROM #WIPAggregates wa
INNER JOIN #ManagerInfo mi ON wa.TaskManager = mi.TaskManager
LEFT JOIN #ManagerClients mc ON wa.TaskManager = mc.TaskManager
WHERE 
    -- Exclude tasks where ALL amounts are zero
    ABS(wa.OpeningT + wa.OpeningD + wa.OpeningADJ + wa.OpeningF + wa.OpeningP) > 0.01
    OR ABS(wa.LTDTimeCharged) > 0.01
    OR ABS(wa.LTDDisbCharged) > 0.01
    OR ABS(wa.LTDAdjustments) > 0.01
    OR ABS(wa.LTDFeesBilled) > 0.01
    OR ABS(wa.LTDWipProvision) > 0.01
GROUP BY mi.TaskManager, mi.ManagerName, mc.ClientCount
ORDER BY mi.ManagerName

-- ============================================================================
-- CLEANUP
-- ============================================================================
DROP TABLE #WIPAggregates
DROP TABLE #ManagerInfo
DROP TABLE #ManagerClients
DROP TABLE #ActiveTasks

GO
