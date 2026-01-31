-- ============================================================================
-- Profitability Data Stored Procedure (v2.0)
-- Full profitability metrics including Cost, Hours, and Adjustments
-- ============================================================================
--
-- PURPOSE: Provides task-level profitability data for My Reports - Profitability
-- REPLACES: WipLTD (renamed for clarity and consistency with other report SPs)
--
-- OPTIMIZED: Uses temp table instead of nested CTEs for faster compilation
--
-- CRITICAL ACCOUNTING LOGIC:
--   - BalWip and NetWIP are BALANCE SHEET accounts (cumulative AS OF @DateTo)
--   - LTD* metrics are P&L items filtered by date range (@DateFrom to @DateTo)
--   - All values calculated based on transactions through the end date
--
-- RETURNS: Task-level WIP and profitability metrics with calculated fields:
--   
--   PERIOD-SPECIFIC (filtered by @DateFrom/@DateTo):
--   - LTDTimeCharged, LTDDisbCharged, LTDFeesBilled (period P&L)
--   - LTDAdjustments, LTDWipProvision (period P&L)
--   - LTDHours, LTDCost (period costs, excludes CARL employee category)
--   - NetRevenue, GrossProfit (period calculated fields)
--   
--   BALANCE AS OF @DateTo (cumulative through end date):
--   - BalWip = T + D + ADJ + F (balance as of end date)
--   - NetWIP = T + D + ADJ + F + P (balance as of end date, after provisions)
--
-- USAGE:
-- Run this script in SQL Server Management Studio or execute via Prisma
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

-- Step 1: Get filtered tasks into temp table with service line hierarchy
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
    -- Service line hierarchy from ServiceLineExternal
    ,sle.masterCode
    ,sle.SubServlineGroupCode
    ,sle.SubServlineGroupDesc
    ,slm.name AS masterServiceLineName
INTO #Tasks
FROM [dbo].[Task] t
    INNER JOIN [dbo].[Client] c ON t.GSClientID = c.GSClientID
    LEFT JOIN [dbo].[ServiceLineExternal] sle ON t.ServLineCode = sle.ServLineCode
    LEFT JOIN [dbo].[ServiceLineMaster] slm ON sle.masterCode = slm.code
WHERE (t.ServLineCode = @ServLineCode OR @ServLineCode = '*')
    AND (t.TaskPartner = @PartnerCode OR @PartnerCode = '*')
    AND (t.TaskManager = @ManagerCode OR @ManagerCode = '*')
    AND (t.TaskCode = @TaskCode OR @TaskCode = '*')
    AND (c.clientCode = @ClientCode OR @ClientCode = '*')
    AND (c.groupCode = @GroupCode OR @GroupCode = '*')

-- Create index on temp table for efficient join
CREATE CLUSTERED INDEX IX_Tasks_GSTaskID ON #Tasks (GSTaskID)

-- Step 2: Aggregate WIP transactions and join with tasks
-- CRITICAL: BalWip and NetWIP are BALANCE SHEET accounts - always life-to-date
-- Period metrics (LTDTimeCharged, LTDCost, etc.) are filtered by date range
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
    
    -- Period-specific metrics (P&L items within date range)
    ,SUM(CASE WHEN w.TType = 'T' AND w.TranDate >= @DateFrom AND w.TranDate <= @DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDTimeCharged
    ,SUM(CASE WHEN w.TType = 'D' AND w.TranDate >= @DateFrom AND w.TranDate <= @DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDDisbCharged
    ,SUM(CASE WHEN w.TType = 'F' AND w.TranDate >= @DateFrom AND w.TranDate <= @DateTo THEN 0 - ISNULL(w.Amount, 0) ELSE 0 END) AS LTDFeesBilled
    ,SUM(CASE WHEN w.TType = 'ADJ' AND w.TranDate >= @DateFrom AND w.TranDate <= @DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDAdjustments
    ,SUM(CASE WHEN w.TType = 'P' AND w.TranDate >= @DateFrom AND w.TranDate <= @DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDWipProvision
    ,SUM(CASE WHEN w.TType = 'T' AND w.TranDate >= @DateFrom AND w.TranDate <= @DateTo THEN ISNULL(w.Hour, 0) ELSE 0 END) AS LTDHours
    ,SUM(CASE WHEN w.TType != 'P' AND (e.EmpCatCode IS NULL OR e.EmpCatCode != 'CARL') AND w.TranDate >= @DateFrom AND w.TranDate <= @DateTo THEN ISNULL(w.Cost, 0) ELSE 0 END) AS LTDCost
    
    -- WIP balance AS OF end date (cumulative through @DateTo)
    ,SUM(CASE WHEN w.TType = 'T' AND w.TranDate <= @DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END)
     + SUM(CASE WHEN w.TType = 'D' AND w.TranDate <= @DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END)
     + SUM(CASE WHEN w.TType = 'ADJ' AND w.TranDate <= @DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END)
     + SUM(CASE WHEN w.TType = 'F' AND w.TranDate <= @DateTo THEN 0 - ISNULL(w.Amount, 0) ELSE 0 END) AS BalWip
    ,SUM(CASE WHEN w.TType = 'T' AND w.TranDate <= @DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END)
     + SUM(CASE WHEN w.TType = 'D' AND w.TranDate <= @DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END)
     + SUM(CASE WHEN w.TType = 'ADJ' AND w.TranDate <= @DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END)
     + SUM(CASE WHEN w.TType = 'F' AND w.TranDate <= @DateTo THEN 0 - ISNULL(w.Amount, 0) ELSE 0 END)
     + SUM(CASE WHEN w.TType = 'P' AND w.TranDate <= @DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END) AS NetWIP
    
    -- Period-specific calculated fields
    ,SUM(CASE WHEN w.TType = 'T' AND w.TranDate >= @DateFrom AND w.TranDate <= @DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END)
     + SUM(CASE WHEN w.TType = 'ADJ' AND w.TranDate >= @DateFrom AND w.TranDate <= @DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END) AS NetRevenue
    ,SUM(CASE WHEN w.TType = 'T' AND w.TranDate >= @DateFrom AND w.TranDate <= @DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END)
     + SUM(CASE WHEN w.TType = 'ADJ' AND w.TranDate >= @DateFrom AND w.TranDate <= @DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END)
     - SUM(CASE WHEN w.TType != 'P' AND (e.EmpCatCode IS NULL OR e.EmpCatCode != 'CARL') AND w.TranDate >= @DateFrom AND w.TranDate <= @DateTo THEN ISNULL(w.Cost, 0) ELSE 0 END) AS GrossProfit
FROM #Tasks t
    INNER JOIN [dbo].[WIPTransactions] w ON t.GSTaskID = w.GSTaskID
    LEFT JOIN [dbo].[Employee] e ON w.EmpCode = e.EmpCode
WHERE (w.EmpCode = @EmpCode OR @EmpCode = '*' OR w.EmpCode IS NULL)
GROUP BY
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
HAVING 
    -- Exclude tasks without master service line mapping
    t.masterCode IS NOT NULL
    -- Exclude tasks where ALL amounts are zero (balance AND period activity)
    AND (
        -- Check if any balance exists (as of end date)
        ABS(SUM(CASE WHEN w.TType = 'T' AND w.TranDate <= @DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END)
         + SUM(CASE WHEN w.TType = 'D' AND w.TranDate <= @DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END)
         + SUM(CASE WHEN w.TType = 'ADJ' AND w.TranDate <= @DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END)
         + SUM(CASE WHEN w.TType = 'F' AND w.TranDate <= @DateTo THEN 0 - ISNULL(w.Amount, 0) ELSE 0 END)
         + SUM(CASE WHEN w.TType = 'P' AND w.TranDate <= @DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END)) > 0.01
        -- OR check if any period activity exists (within date range)
        OR ABS(SUM(CASE WHEN w.TType = 'T' AND w.TranDate >= @DateFrom AND w.TranDate <= @DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END)) > 0.01
        OR ABS(SUM(CASE WHEN w.TType = 'D' AND w.TranDate >= @DateFrom AND w.TranDate <= @DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END)) > 0.01
        OR ABS(SUM(CASE WHEN w.TType = 'ADJ' AND w.TranDate >= @DateFrom AND w.TranDate <= @DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END)) > 0.01
        OR ABS(SUM(CASE WHEN w.TType = 'F' AND w.TranDate >= @DateFrom AND w.TranDate <= @DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END)) > 0.01
        OR ABS(SUM(CASE WHEN w.TType = 'P' AND w.TranDate >= @DateFrom AND w.TranDate <= @DateTo THEN ISNULL(w.Amount, 0) ELSE 0 END)) > 0.01
    )
ORDER BY t.groupCode, t.clientCode, t.TaskCode

-- Cleanup
DROP TABLE #Tasks
GO
