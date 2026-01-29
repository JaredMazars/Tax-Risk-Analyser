-- ============================================================================
-- WipMonthly Stored Procedure (v1.1)
-- Monthly WIP aggregations for Overview charts
-- ============================================================================
--
-- OPTIMIZED: Uses temp tables instead of nested CTEs for faster compilation
--
-- PURPOSE:
-- Returns monthly WIP metrics for the Overview report charts.
-- Supports both cumulative (running totals within period) and
-- non-cumulative (monthly values) modes.
--
-- ============================================================================

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[WipMonthly]
     @PartnerCode nvarchar(max)   = '*'
    ,@ManagerCode nvarchar(max)   = '*'
    ,@ServLineCode nvarchar(max)  = '*'
    ,@DateFrom datetime
    ,@DateTo datetime
    ,@IsCumulative bit            = 1   -- 1 = cumulative, 0 = monthly values
AS

SET NOCOUNT ON

-- Step 1: Create month series using WHILE loop (faster than recursive CTE)
CREATE TABLE #Months (MonthEnd DATE PRIMARY KEY)

DECLARE @CurrentMonth DATE = EOMONTH(@DateFrom)
WHILE @CurrentMonth <= EOMONTH(@DateTo)
BEGIN
    INSERT INTO #Months (MonthEnd) VALUES (@CurrentMonth)
    SET @CurrentMonth = EOMONTH(DATEADD(MONTH, 1, @CurrentMonth))
END

-- Step 2: Get relevant task IDs into temp table
SELECT t.GSTaskID
INTO #Tasks
FROM [dbo].[Task] t
WHERE (t.TaskPartner = @PartnerCode OR @PartnerCode = '*')
  AND (t.TaskManager = @ManagerCode OR @ManagerCode = '*')
  AND (t.ServLineCode = @ServLineCode OR @ServLineCode = '*')

CREATE CLUSTERED INDEX IX_Tasks_GSTaskID ON #Tasks (GSTaskID)

-- Step 3: Aggregate WIP by month
SELECT 
    EOMONTH(w.TranDate) AS MonthEnd
    ,SUM(CASE WHEN w.TType = 'T' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS TimeCharged
    ,SUM(CASE WHEN w.TType = 'D' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS DisbCharged
    ,SUM(CASE WHEN w.TType = 'ADJ' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS Adjustments
    ,SUM(CASE WHEN w.TType = 'ADJ' AND ISNULL(w.Amount, 0) < 0 THEN ABS(w.Amount) ELSE 0 END) AS NegativeAdj
    ,SUM(CASE WHEN w.TType = 'P' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS WipProvision
    ,SUM(CASE WHEN w.TType != 'P' THEN ISNULL(w.Cost, 0) ELSE 0 END) AS Cost
    ,SUM(CASE WHEN w.TType = 'T' THEN ISNULL(w.Hour, 0) ELSE 0 END) AS Hours
    ,SUM(CASE WHEN w.TType = 'F' THEN 0 - ISNULL(w.Amount, 0) ELSE ISNULL(w.Amount, 0) END) AS BalWipChange
INTO #MonthlyWip
FROM [dbo].[WIPTransactions] w
    INNER JOIN #Tasks t ON w.GSTaskID = t.GSTaskID
WHERE w.TranDate >= @DateFrom
  AND w.TranDate <= @DateTo
GROUP BY EOMONTH(w.TranDate)

-- Step 4: Join with month series and calculate cumulative/non-cumulative values
SELECT 
    m.MonthEnd AS Month
    ,CASE WHEN @IsCumulative = 1 
        THEN SUM(ISNULL(mw.TimeCharged, 0)) OVER (ORDER BY m.MonthEnd ROWS UNBOUNDED PRECEDING)
        ELSE ISNULL(mw.TimeCharged, 0) 
     END AS LTDTime
    ,CASE WHEN @IsCumulative = 1 
        THEN SUM(ISNULL(mw.DisbCharged, 0)) OVER (ORDER BY m.MonthEnd ROWS UNBOUNDED PRECEDING)
        ELSE ISNULL(mw.DisbCharged, 0) 
     END AS LTDDisb
    ,CASE WHEN @IsCumulative = 1 
        THEN SUM(ISNULL(mw.Adjustments, 0)) OVER (ORDER BY m.MonthEnd ROWS UNBOUNDED PRECEDING)
        ELSE ISNULL(mw.Adjustments, 0) 
     END AS LTDAdj
    ,CASE WHEN @IsCumulative = 1 
        THEN SUM(ISNULL(mw.NegativeAdj, 0)) OVER (ORDER BY m.MonthEnd ROWS UNBOUNDED PRECEDING)
        ELSE ISNULL(mw.NegativeAdj, 0) 
     END AS LTDNegativeAdj
    ,CASE WHEN @IsCumulative = 1 
        THEN SUM(ISNULL(mw.WipProvision, 0)) OVER (ORDER BY m.MonthEnd ROWS UNBOUNDED PRECEDING)
        ELSE ISNULL(mw.WipProvision, 0) 
     END AS LTDProvision
    ,CASE WHEN @IsCumulative = 1 
        THEN SUM(ISNULL(mw.Cost, 0)) OVER (ORDER BY m.MonthEnd ROWS UNBOUNDED PRECEDING)
        ELSE ISNULL(mw.Cost, 0) 
     END AS LTDCost
    ,CASE WHEN @IsCumulative = 1 
        THEN SUM(ISNULL(mw.Hours, 0)) OVER (ORDER BY m.MonthEnd ROWS UNBOUNDED PRECEDING)
        ELSE ISNULL(mw.Hours, 0) 
     END AS LTDHours
    -- WIP Balance is always cumulative
    ,SUM(ISNULL(mw.BalWipChange, 0)) OVER (ORDER BY m.MonthEnd ROWS UNBOUNDED PRECEDING) AS BalWip
FROM #Months m
    LEFT JOIN #MonthlyWip mw ON m.MonthEnd = mw.MonthEnd
ORDER BY m.MonthEnd

-- Cleanup
DROP TABLE #Months
DROP TABLE #Tasks
DROP TABLE #MonthlyWip
GO

PRINT 'WipMonthly stored procedure (v1.1) created successfully';
PRINT 'Optimized with temp tables for fast compilation';
GO
