-- ============================================================================
-- Group Graph Data Stored Procedure (v1.0)
-- Daily WIP transaction metrics aggregated across all clients in a group
-- ============================================================================
--
-- PURPOSE: Provides daily aggregated WIP metrics for group analytics graphs
-- REPLACES: Prisma groupBy aggregations in group graph API route
--
-- OPTIMIZED: Uses temp table and handles large groups (up to 10,000 clients)
--
-- RETURNS: Daily transaction metrics with service line hierarchy:
--   - TranDate: Transaction date
--   - ServLineCode: Service line code from transaction
--   - masterCode: Master service line code (from ServiceLineExternal)
--   - masterServiceLineName: Master service line name (from ServiceLineMaster)
--   - Production: Sum of Time transactions across all clients
--   - Adjustments: Sum of Adjustment transactions across all clients
--   - Disbursements: Sum of Disbursement transactions across all clients
--   - Billing: Sum of Fee transactions across all clients
--   - Provisions: Sum of Provision transactions across all clients
--   - OpeningBalance: Total WIP balance before @DateFrom (same for all rows)
--
-- USAGE:
-- EXEC sp_GroupGraphData 
--   @GroupCode = 'GRP001',
--   @DateFrom = '2024-01-01',
--   @DateTo = '2024-12-31',
--   @ServLineCode = '*'
--
-- ============================================================================

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_GroupGraphData]
    @GroupCode nvarchar(50)
   ,@DateFrom datetime = NULL
   ,@DateTo datetime = NULL
   ,@ServLineCode nvarchar(max) = '*'
AS

SET NOCOUNT ON

-- Default date range: last 12 months if not specified
IF @DateFrom IS NULL
    SET @DateFrom = DATEADD(MONTH, -12, GETDATE())
IF @DateTo IS NULL
    SET @DateTo = GETDATE()

-- Step 1: Get all clients in the group (with limit for safety)
SELECT TOP 10000
    GSClientID
INTO #GroupClients
FROM Client
WHERE groupCode = @GroupCode

-- Create index for efficient joins
CREATE CLUSTERED INDEX IX_GroupClients_GSClientID ON #GroupClients (GSClientID)

-- Step 2: Calculate opening WIP balance (transactions before @DateFrom)
DECLARE @OpeningBalance decimal(18,2)

SELECT @OpeningBalance = ISNULL(SUM(
    CASE 
        WHEN TType = 'T' THEN Amount
        WHEN TType = 'D' THEN Amount
        WHEN TType = 'ADJ' THEN Amount
        WHEN TType = 'F' THEN -Amount
        WHEN TType = 'P' THEN Amount
        ELSE 0
    END
), 0)
FROM WIPTransactions w
    INNER JOIN #GroupClients gc ON w.GSClientID = gc.GSClientID
WHERE w.TranDate < @DateFrom

-- Step 3: Get transactions for the period with service line mapping
SELECT
    w.TranDate
   ,w.TaskServLine AS ServLineCode
   ,sle.masterCode
   ,slm.name AS masterServiceLineName
   ,SUM(CASE WHEN w.TType = 'T' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS Production
   ,SUM(CASE WHEN w.TType = 'ADJ' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS Adjustments
   ,SUM(CASE WHEN w.TType = 'D' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS Disbursements
   ,SUM(CASE WHEN w.TType = 'F' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS Billing
   ,SUM(CASE WHEN w.TType = 'P' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS Provisions
   ,@OpeningBalance AS OpeningBalance
FROM WIPTransactions w
    INNER JOIN #GroupClients gc ON w.GSClientID = gc.GSClientID
    LEFT JOIN ServiceLineExternal sle ON w.TaskServLine = sle.ServLineCode
    LEFT JOIN ServiceLineMaster slm ON sle.masterCode = slm.code
WHERE w.TranDate >= @DateFrom
    AND w.TranDate <= @DateTo
    AND (@ServLineCode = '*' OR sle.masterCode = @ServLineCode OR w.TaskServLine = @ServLineCode)
GROUP BY
    w.TranDate
   ,w.TaskServLine
   ,sle.masterCode
   ,slm.name
HAVING 
    -- Exclude days with no activity
    (ABS(SUM(CASE WHEN w.TType = 'T' THEN ISNULL(w.Amount, 0) ELSE 0 END)) > 0.01
    OR ABS(SUM(CASE WHEN w.TType = 'ADJ' THEN ISNULL(w.Amount, 0) ELSE 0 END)) > 0.01
    OR ABS(SUM(CASE WHEN w.TType = 'D' THEN ISNULL(w.Amount, 0) ELSE 0 END)) > 0.01
    OR ABS(SUM(CASE WHEN w.TType = 'F' THEN ISNULL(w.Amount, 0) ELSE 0 END)) > 0.01
    OR ABS(SUM(CASE WHEN w.TType = 'P' THEN ISNULL(w.Amount, 0) ELSE 0 END)) > 0.01)
ORDER BY w.TranDate, sle.masterCode

-- Cleanup
DROP TABLE #GroupClients

GO
