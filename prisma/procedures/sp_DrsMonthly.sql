-- ============================================================================
-- DrsMonthly Stored Procedure (v1.0)
-- Monthly DRS transaction aggregations for Overview report
-- ============================================================================
--
-- PURPOSE: Provides monthly Debtors metrics (Collections and Net Billings)
--          Supports both cumulative (fiscal year running totals) and non-cumulative modes
--
-- OPTIMIZATIONS:
--   1. Dynamic SQL for sargable WHERE clauses (eliminates OR @Param = '*' pattern)
--   2. Two-stage temp table approach:
--      - #MonthlyBase: Pre-computed monthly aggregations
--      - Final SELECT applies cumulative window function when needed
--   3. Leverages covering index IX_DrsTransactions_Recoverability (Biller, TranDate)
--   4. Single-pass aggregation (no duplicate SUM calculations)
--
-- CRITICAL LOGIC:
--   - Collections: EntryType = 'Receipt', negated (receipts stored as negative)
--   - Net Billings: All transactions EXCEPT 'Receipt' (invoices, credit notes, adjustments)
--   - Cumulative Mode: Running totals via SUM() OVER (ORDER BY month)
--   - Service Line Filter: Optional, applied via dynamic SQL
--
-- RETURNS: Monthly metrics with collections and net billings
--
-- PREREQUISITES:
--   - Index: IX_DrsTransactions_Recoverability (already exists)
--
-- ============================================================================

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_DrsMonthly] 
     @BillerCode nvarchar(max)    = '*'
    ,@ServLineCode nvarchar(max)  = '*'
    ,@DateFrom datetime           = '1900/01/01'
    ,@DateTo datetime             = '2099/12/31'
    ,@IsCumulative bit            = 0
AS

SET NOCOUNT ON

DECLARE @sql NVARCHAR(MAX)
DECLARE @params NVARCHAR(MAX)

-- ============================================================================
-- STEP 1: Create temp table for monthly aggregations
-- ============================================================================

CREATE TABLE #MonthlyBase (
    [Month] DATE
    ,Collections FLOAT
    ,NetBillings FLOAT
)

-- ============================================================================
-- STEP 2: Build dynamic SQL for sargable filtering
-- ============================================================================

SET @sql = N'
INSERT INTO #MonthlyBase
SELECT 
    DATEFROMPARTS(YEAR(d.TranDate), MONTH(d.TranDate), 1) AS [Month]
    ,SUM(CASE WHEN d.EntryType = ''Receipt'' THEN -ISNULL(d.Total, 0) ELSE 0 END) AS Collections
    ,SUM(CASE WHEN (d.EntryType IS NULL OR d.EntryType != ''Receipt'') THEN ISNULL(d.Total, 0) ELSE 0 END) AS NetBillings
FROM [dbo].[DrsTransactions] d
WHERE d.TranDate >= @p_DateFrom 
    AND d.TranDate <= @p_DateTo'

-- Add biller filter (sargable - enables index seek)
IF @BillerCode != '*'
    SET @sql = @sql + N' AND d.Biller = @p_BillerCode'

-- Add service line filter if specified
IF @ServLineCode != '*'
    SET @sql = @sql + N'
    AND d.ServLineCode IN (
        SELECT ServLineCode FROM [dbo].[ServiceLineExternal] sle
        WHERE sle.masterCode = @p_ServLineCode
    )'

SET @sql = @sql + N'
GROUP BY YEAR(d.TranDate), MONTH(d.TranDate)'

-- Define parameters
SET @params = N'@p_BillerCode nvarchar(max), @p_ServLineCode nvarchar(max), @p_DateFrom datetime, @p_DateTo datetime'

-- Execute dynamic SQL
EXEC sp_executesql @sql, @params,
    @p_BillerCode = @BillerCode,
    @p_ServLineCode = @ServLineCode,
    @p_DateFrom = @DateFrom,
    @p_DateTo = @DateTo

-- ============================================================================
-- STEP 3: Return results (cumulative or non-cumulative)
-- ============================================================================

IF @IsCumulative = 1
BEGIN
    -- Cumulative mode: Running totals via window function
    SELECT 
        [Month]
        ,SUM(Collections) OVER (ORDER BY [Month] ROWS UNBOUNDED PRECEDING) AS Collections
        ,SUM(NetBillings) OVER (ORDER BY [Month] ROWS UNBOUNDED PRECEDING) AS NetBillings
    FROM #MonthlyBase
    ORDER BY [Month]
END
ELSE
BEGIN
    -- Non-cumulative mode: Monthly values
    SELECT 
        [Month]
        ,Collections
        ,NetBillings
    FROM #MonthlyBase
    ORDER BY [Month]
END

-- ============================================================================
-- CLEANUP
-- ============================================================================

DROP TABLE #MonthlyBase

GO
