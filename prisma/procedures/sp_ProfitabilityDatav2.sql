-- ============================================================================
-- Profitability Data Stored Procedure (v2.0 - Simplified)
-- Full profitability metrics with simplified filtering
-- ============================================================================
--
-- PURPOSE: Provides task-level profitability data with only essential filters
-- SIMPLIFICATION: Reduced from 8 parameters to 5 (dates, client, partner, task)
--
-- OPTIMIZED: Uses temp table strategy and leverages existing covering indexes
--
-- RETURNS: Task-level WIP and profitability metrics with calculated fields:
--   - LTDTimeCharged, LTDDisbCharged, LTDFeesBilled
--   - LTDAdjustments (split into Positive and Negative)
--   - LTDWipProvision, LTDHours, LTDCost
--   - NetWIP, NetRevenue, GrossProfit (calculated)
--
-- FILTERS:
--   - @TaskPartnerCode: Filter by task partner
--   - @ClientCode: Filter by client code
--   - @TaskCode: Filter by task code
--   - @DateFrom/@DateTo: Date range for WIP transactions
--
-- USAGE:
--   EXEC sp_ProfitabilityDatav2;  -- All data
--   EXEC sp_ProfitabilityDatav2 @TaskPartnerCode='JSMITH', @DateFrom='2024-01-01';
--
-- ============================================================================

-- Drop if exists (SQL Server 2014 compatible)
IF OBJECT_ID('dbo.sp_ProfitabilityDatav2', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_ProfitabilityDatav2;
GO

CREATE PROCEDURE [dbo].[sp_ProfitabilityDatav2] 
     @TaskPartnerCode nvarchar(max)  = '*'
    ,@ClientCode nvarchar(max)       = '*'
    ,@TaskCode nvarchar(max)         = '*'
    ,@DateFrom datetime              = '1900/01/01'
    ,@DateTo datetime                = '2025/01/01'
AS

SET NOCOUNT ON

-- Step 1: Get filtered tasks into temp table
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
INTO #Tasks
FROM [dbo].[Task] t
    INNER JOIN [dbo].[Client] c ON t.GSClientID = c.GSClientID
WHERE (t.TaskPartner = @TaskPartnerCode OR @TaskPartnerCode = '*')
    AND (t.TaskCode = @TaskCode OR @TaskCode = '*')
    AND (c.clientCode = @ClientCode OR @ClientCode = '*')

-- Create index on temp table for efficient join
CREATE CLUSTERED INDEX IX_Tasks_GSTaskID ON #Tasks (GSTaskID)

-- Step 2: Aggregate WIP transactions and join with tasks
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
    ,SUM(CASE WHEN w.TType = 'T' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDTimeCharged
    ,SUM(CASE WHEN w.TType = 'D' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDDisbCharged
    ,SUM(CASE WHEN w.TType = 'F' THEN 0 - ISNULL(w.Amount, 0) ELSE 0 END) AS LTDFeesBilled
    ,SUM(CASE WHEN w.TType = 'ADJ' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDAdjustments
    ,SUM(CASE WHEN w.TType = 'ADJ' AND ISNULL(w.Amount, 0) > 0 THEN w.Amount ELSE 0 END) AS LTDPositiveAdj
    ,SUM(CASE WHEN w.TType = 'ADJ' AND ISNULL(w.Amount, 0) < 0 THEN ABS(w.Amount) ELSE 0 END) AS LTDNegativeAdj
    ,SUM(CASE WHEN w.TType = 'P' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDWipProvision
    ,SUM(CASE WHEN w.TType = 'T' THEN ISNULL(w.Hour, 0) ELSE 0 END) AS LTDHours
    ,SUM(CASE WHEN w.TType != 'P' THEN ISNULL(w.Cost, 0) ELSE 0 END) AS LTDCost
    ,SUM(CASE WHEN w.TType = 'F' THEN 0 - ISNULL(w.Amount, 0) ELSE ISNULL(w.Amount, 0) END) AS BalWip
    -- Calculated fields
    ,SUM(CASE WHEN w.TType = 'T' THEN ISNULL(w.Amount, 0) ELSE 0 END)
     + SUM(CASE WHEN w.TType = 'D' THEN ISNULL(w.Amount, 0) ELSE 0 END)
     + SUM(CASE WHEN w.TType = 'ADJ' THEN ISNULL(w.Amount, 0) ELSE 0 END)
     - SUM(CASE WHEN w.TType = 'F' THEN 0 - ISNULL(w.Amount, 0) ELSE 0 END) AS NetWIP
    ,SUM(CASE WHEN w.TType = 'T' THEN ISNULL(w.Amount, 0) ELSE 0 END)
     + SUM(CASE WHEN w.TType = 'ADJ' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS NetRevenue
    ,SUM(CASE WHEN w.TType = 'T' THEN ISNULL(w.Amount, 0) ELSE 0 END)
     + SUM(CASE WHEN w.TType = 'ADJ' THEN ISNULL(w.Amount, 0) ELSE 0 END)
     - SUM(CASE WHEN w.TType != 'P' THEN ISNULL(w.Cost, 0) ELSE 0 END) AS GrossProfit
FROM #Tasks t
    INNER JOIN [dbo].[WIPTransactions] w ON t.GSTaskID = w.GSTaskID
WHERE w.TranDate >= @DateFrom
  AND w.TranDate <= @DateTo
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
ORDER BY t.groupCode, t.clientCode, t.TaskCode

-- Cleanup
DROP TABLE #Tasks
GO
