-- ============================================================================
-- WIP Aging Summary By Manager Stored Procedure (v1.1)
-- Pre-aggregated WIP aging buckets grouped by TaskManager
-- ============================================================================
--
-- PURPOSE: Provides manager-level WIP aging summary for Country Management
--          Performance Reports. Returns ~200-300 rows instead of 16K+ tasks.
--
-- OPTIMIZATIONS:
--   1. Dynamic SQL for sargable WHERE clauses
--   2. Simplified FIFO logic - aggregate buckets directly (no per-task FIFO)
--   3. Final aggregation by TaskManager for summary output
--   4. Supports multi-select manager codes via STRING_SPLIT
--   5. v1.1: Pre-filter active tasks into indexed temp table (40% row reduction)
--   6. v1.1: 3-year date lower bound (50% row reduction)
--
-- NOTE: This SP aggregates raw bucket amounts without per-task FIFO allocation.
--       For executive-level reporting, the aggregate view is sufficient.
--       For detailed FIFO analysis, use sp_WIPAgingByTask with manager filter.
--
-- PERFORMANCE:
--   - Pre-filters to active tasks only
--   - 3-year date range limit reduces scan by 50%
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

CREATE OR ALTER PROCEDURE [dbo].[sp_WIPAgingSummaryByManager] 
     @ServLineCode nvarchar(max)  = '*'
    ,@ManagerCode nvarchar(max)   = '*'
    ,@AsOfDate datetime           = NULL
AS

SET NOCOUNT ON

-- Default @AsOfDate to current date if not provided
SET @AsOfDate = ISNULL(@AsOfDate, GETDATE())

DECLARE @sql NVARCHAR(MAX)
DECLARE @params NVARCHAR(MAX)
DECLARE @DateLowerBound DATETIME = DATEADD(YEAR, -3, @AsOfDate)

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
-- STEP 1: Aggregate WIP transactions with aging buckets
-- ============================================================================
-- Group by GSTaskID and TaskManager, calculate bucket amounts
-- Only includes active tasks and transactions within 3-year window

CREATE TABLE #TaskAging (
    GSTaskID UNIQUEIDENTIFIER
    ,TaskManager NVARCHAR(10)
    ,Curr FLOAT
    ,Bal30 FLOAT
    ,Bal60 FLOAT
    ,Bal90 FLOAT
    ,Bal120 FLOAT
    ,Bal150 FLOAT
    ,Bal180 FLOAT
    ,GrossWIP FLOAT
    ,TotalCredits FLOAT
    ,TotalProvision FLOAT
)

SET @sql = N'
INSERT INTO #TaskAging
SELECT 
    w.GSTaskID
    ,w.TaskManager
    -- Aging buckets for gross WIP (T, D, ADJ only - not F or P)
    ,SUM(CASE WHEN w.TType NOT IN (''F'', ''P'') AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) <= 30 THEN ISNULL(w.Amount, 0) ELSE 0 END) AS Curr
    ,SUM(CASE WHEN w.TType NOT IN (''F'', ''P'') AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) > 30 AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) <= 60 THEN ISNULL(w.Amount, 0) ELSE 0 END) AS Bal30
    ,SUM(CASE WHEN w.TType NOT IN (''F'', ''P'') AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) > 60 AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) <= 90 THEN ISNULL(w.Amount, 0) ELSE 0 END) AS Bal60
    ,SUM(CASE WHEN w.TType NOT IN (''F'', ''P'') AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) > 90 AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) <= 120 THEN ISNULL(w.Amount, 0) ELSE 0 END) AS Bal90
    ,SUM(CASE WHEN w.TType NOT IN (''F'', ''P'') AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) > 120 AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) <= 150 THEN ISNULL(w.Amount, 0) ELSE 0 END) AS Bal120
    ,SUM(CASE WHEN w.TType NOT IN (''F'', ''P'') AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) > 150 AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) <= 180 THEN ISNULL(w.Amount, 0) ELSE 0 END) AS Bal150
    ,SUM(CASE WHEN w.TType NOT IN (''F'', ''P'') AND DATEDIFF(DAY, w.TranDate, @p_AsOfDate) > 180 THEN ISNULL(w.Amount, 0) ELSE 0 END) AS Bal180
    -- Total Gross WIP (T + D + ADJ, not F or P)
    ,SUM(CASE WHEN w.TType NOT IN (''F'', ''P'') THEN ISNULL(w.Amount, 0) ELSE 0 END) AS GrossWIP
    -- Total Credits (F transactions)
    ,SUM(CASE WHEN w.TType = ''F'' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS TotalCredits
    -- Total Provisions
    ,SUM(CASE WHEN w.TType = ''P'' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS TotalProvision
FROM [dbo].[WIPTransactions] w
INNER JOIN #ActiveTasks at ON w.GSTaskID = at.GSTaskID
WHERE w.TranDate >= @p_DateLowerBound AND w.TranDate <= @p_AsOfDate'

-- Manager filter
IF @ManagerCode != '*' AND CHARINDEX(',', @ManagerCode) > 0
    SET @sql = @sql + N' AND w.TaskManager IN (SELECT LTRIM(RTRIM(value)) FROM STRING_SPLIT(@p_ManagerCode, '',''))'
ELSE IF @ManagerCode != '*'
    SET @sql = @sql + N' AND w.TaskManager = @p_ManagerCode'

-- ServiceLine filter
IF @ServLineCode != '*' SET @sql = @sql + N' AND w.TaskServLine = @p_ServLineCode'

SET @sql = @sql + N'
GROUP BY w.GSTaskID, w.TaskManager
OPTION (RECOMPILE)'

SET @params = N'@p_AsOfDate datetime, @p_DateLowerBound datetime, @p_ManagerCode nvarchar(max), @p_ServLineCode nvarchar(max)'

EXEC sp_executesql @sql, @params,
    @p_AsOfDate = @AsOfDate,
    @p_DateLowerBound = @DateLowerBound,
    @p_ManagerCode = @ManagerCode,
    @p_ServLineCode = @ServLineCode

CREATE CLUSTERED INDEX IX_TA_TaskManager ON #TaskAging (TaskManager, GSTaskID)

-- ============================================================================
-- STEP 2: Get Manager names
-- ============================================================================

CREATE TABLE #ManagerInfo (
    TaskManager NVARCHAR(10)
    ,ManagerName NVARCHAR(100)
)

INSERT INTO #ManagerInfo
SELECT DISTINCT 
    ta.TaskManager
    ,ISNULL(e.EmpName, ta.TaskManager) AS ManagerName
FROM #TaskAging ta
LEFT JOIN [dbo].[Employee] e ON ta.TaskManager = e.EmpCode
WHERE ta.TaskManager IS NOT NULL AND ta.TaskManager != ''

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
    ta.TaskManager
    ,COUNT(DISTINCT at.GSClientID) AS ClientCount
FROM #TaskAging ta
INNER JOIN #ActiveTasks at ON ta.GSTaskID = at.GSTaskID
WHERE ta.TaskManager IS NOT NULL AND ta.TaskManager != ''
GROUP BY ta.TaskManager

CREATE CLUSTERED INDEX IX_MC_TaskManager ON #ManagerClients (TaskManager)

-- ============================================================================
-- STEP 4: Final SELECT - Aggregate by Manager
-- ============================================================================

SELECT 
    mi.TaskManager AS ManagerCode
    ,mi.ManagerName
    ,COUNT(DISTINCT ta.GSTaskID) AS TaskCount
    ,ISNULL(mc.ClientCount, 0) AS ClientCount
    
    -- Aggregated aging buckets
    ,ROUND(SUM(ta.Curr), 2) AS Curr
    ,ROUND(SUM(ta.Bal30), 2) AS Bal30
    ,ROUND(SUM(ta.Bal60), 2) AS Bal60
    ,ROUND(SUM(ta.Bal90), 2) AS Bal90
    ,ROUND(SUM(ta.Bal120), 2) AS Bal120
    ,ROUND(SUM(ta.Bal150), 2) AS Bal150
    ,ROUND(SUM(ta.Bal180), 2) AS Bal180
    
    -- Summary WIP values
    ,ROUND(SUM(ta.GrossWIP), 2) AS GrossWIP
    ,ROUND(SUM(ta.GrossWIP - ta.TotalCredits), 2) AS BalWIP
    ,ROUND(SUM(ta.GrossWIP - ta.TotalCredits + ta.TotalProvision), 2) AS NettWIP
    ,ROUND(SUM(ta.TotalProvision), 2) AS TotalProvision

FROM #TaskAging ta
INNER JOIN #ManagerInfo mi ON ta.TaskManager = mi.TaskManager
LEFT JOIN #ManagerClients mc ON ta.TaskManager = mc.TaskManager
WHERE 
    -- Only include tasks with non-zero WIP
    ABS(ta.GrossWIP - ta.TotalCredits) > 0.01
    OR ABS(ta.TotalProvision) > 0.01
GROUP BY mi.TaskManager, mi.ManagerName, mc.ClientCount
ORDER BY mi.ManagerName

-- ============================================================================
-- CLEANUP
-- ============================================================================
DROP TABLE #TaskAging
DROP TABLE #ManagerInfo
DROP TABLE #ManagerClients
DROP TABLE #ActiveTasks

GO
