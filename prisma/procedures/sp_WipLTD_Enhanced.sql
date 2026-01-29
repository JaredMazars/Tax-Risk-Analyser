-- ============================================================================
-- Enhanced WipLTD Stored Procedure (v2.1)
-- Full profitability metrics including Cost, Hours, and split Adjustments
-- ============================================================================
--
-- OPTIMIZED: Uses temp table instead of nested CTEs for faster compilation
--
-- CHANGES from v2.0:
-- - Replaced nested CTEs with temp table approach
-- - Compilation time reduced from minutes to seconds
--
-- ============================================================================

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[WipLTD] 
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
WHERE (t.ServLineCode = @ServLineCode OR @ServLineCode = '*')
    AND (t.TaskPartner = @PartnerCode OR @PartnerCode = '*')
    AND (t.TaskManager = @ManagerCode OR @ManagerCode = '*')
    AND (t.TaskCode = @TaskCode OR @TaskCode = '*')
    AND (c.clientCode = @ClientCode OR @ClientCode = '*')
    AND (c.groupCode = @GroupCode OR @GroupCode = '*')

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
  AND (w.EmpCode = @EmpCode OR @EmpCode = '*' OR w.EmpCode IS NULL)
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

PRINT 'WipLTD stored procedure (v2.1) created successfully';
PRINT 'Optimized with temp table for fast compilation';
GO
