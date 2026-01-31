-- ============================================================================
-- Client Graph Data Stored Procedure (v1.0)
-- Daily WIP transaction metrics for analytics graphs
-- ============================================================================
--
-- PURPOSE: Provides daily aggregated WIP metrics for client analytics graphs
-- REPLACES: Prisma groupBy aggregations in client graph API route
--
-- OPTIMIZED: Uses temp table and single-pass aggregation for performance
--
-- RETURNS: Daily transaction metrics with service line hierarchy:
--   - TranDate: Transaction date
--   - ServLineCode: Service line code from transaction
--   - masterCode: Master service line code (from ServiceLineExternal)
--   - masterServiceLineName: Master service line name (from ServiceLineMaster)
--   - Production: Sum of Time transactions (TType = 'T')
--   - Adjustments: Sum of Adjustment transactions (TType = 'ADJ')
--   - Disbursements: Sum of Disbursement transactions (TType = 'D')
--   - Billing: Sum of Fee transactions (TType = 'F', negated)
--   - Provisions: Sum of Provision transactions (TType = 'P')
--   - OpeningBalance: WIP balance before @DateFrom (same for all rows)
--
-- USAGE:
-- EXEC sp_ClientGraphData 
--   @GSClientID = '12345678-1234-1234-1234-123456789012',
--   @DateFrom = '2024-01-01',
--   @DateTo = '2024-12-31',
--   @ServLineCode = '*'
--
-- ============================================================================

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_ClientGraphData]
    @GSClientID uniqueidentifier
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

-- Step 1: Calculate opening WIP balance (transactions before @DateFrom)
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
FROM WIPTransactions
WHERE GSClientID = @GSClientID
    AND TranDate < @DateFrom

-- Step 2: Get transactions for the period with service line mapping
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
    LEFT JOIN ServiceLineExternal sle ON w.TaskServLine = sle.ServLineCode
    LEFT JOIN ServiceLineMaster slm ON sle.masterCode = slm.code
WHERE w.GSClientID = @GSClientID
    AND w.TranDate >= @DateFrom
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

GO
