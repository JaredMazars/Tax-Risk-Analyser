-- ============================================================================
-- WipMonthly Stored Procedure (v2.3)
-- Monthly WIP transaction aggregations for Overview report
-- ============================================================================
--
-- v2.3: Support multiple partner/manager codes (comma-separated) using STRING_SPLIT
--       Enables multi-select filtering for Country Management reports
--
-- v2.2: Support multiple service line codes (comma-separated) using STRING_SPLIT
--
-- v2.1: Fixed BalWip to include opening balance from before @DateFrom
--       BalWip now shows actual WIP balance (historical + period activity)
--
-- v2.0: Added LTDHours and BalWip fields to match TypeScript WipMonthlyResult
--
-- PURPOSE: Provides monthly WIP metrics (Time, Disbursements, Adjustments, Cost, etc.)
--          Supports both cumulative (fiscal year running totals) and non-cumulative modes
--
-- OPTIMIZATIONS:
--   1. Dynamic SQL for sargable WHERE clauses (eliminates OR @Param = '*' pattern)
--   2. Two-stage temp table approach:
--      - #MonthlyBase: Pre-computed monthly aggregations
--      - Final SELECT applies cumulative window function when needed
--   3. Leverages covering indexes on (TaskPartner, TranDate) and (TaskManager, TranDate)
--   4. Single-pass aggregation (no duplicate SUM calculations)
--
-- CRITICAL LOGIC:
--   - Partner/Manager filter: Applied to WIPTransactions (transaction-level attribution)
--   - Cost Calculation: Excludes CARL employees for TType != 'P' transactions
--   - Cumulative Mode: Running totals via SUM() OVER (ORDER BY month)
--   - Service Line Filter: Optional, applied via dynamic SQL
--
-- RETURNS: Monthly metrics with all WIP transaction types aggregated
--
-- PREREQUISITES:
--   - Index: IX_WIPTransactions_Partner_Monthly_Covering
--   - Index: IX_WIPTransactions_Manager_Monthly_Covering
--
-- ============================================================================

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_WipMonthly] 
     @PartnerCode nvarchar(max)   = '*'
    ,@ManagerCode nvarchar(max)   = '*'
    ,@ServLineCode nvarchar(max)  = '*'
    ,@DateFrom datetime           = '1900/01/01'
    ,@DateTo datetime             = '2099/12/31'
    ,@IsCumulative bit            = 0
AS

SET NOCOUNT ON

DECLARE @sql NVARCHAR(MAX)
DECLARE @params NVARCHAR(MAX)
DECLARE @OpeningBalWip FLOAT = 0

-- ============================================================================
-- STEP 1: Calculate opening WIP balance (transactions BEFORE @DateFrom)
-- ============================================================================

CREATE TABLE #OpeningBalance (
    OpeningBalWip FLOAT
)

SET @sql = N'
INSERT INTO #OpeningBalance
SELECT 
    SUM(CASE WHEN w.TType IN (''T'', ''D'', ''ADJ'') THEN ISNULL(w.Amount, 0) 
             WHEN w.TType = ''F'' THEN -ISNULL(w.Amount, 0) 
             ELSE 0 END) AS OpeningBalWip
FROM [dbo].[WIPTransactions] w
WHERE w.TranDate < @p_DateFrom'

-- Add partner or manager filter (supports comma-separated list for multi-select)
IF @PartnerCode != '*' AND CHARINDEX(',', @PartnerCode) > 0
    SET @sql = @sql + N' AND w.TaskPartner IN (SELECT LTRIM(RTRIM(value)) FROM STRING_SPLIT(@p_PartnerCode, '',''))'
ELSE IF @PartnerCode != '*'
    SET @sql = @sql + N' AND w.TaskPartner = @p_PartnerCode'
ELSE IF @ManagerCode != '*' AND CHARINDEX(',', @ManagerCode) > 0
    SET @sql = @sql + N' AND w.TaskManager IN (SELECT LTRIM(RTRIM(value)) FROM STRING_SPLIT(@p_ManagerCode, '',''))'
ELSE IF @ManagerCode != '*'
    SET @sql = @sql + N' AND w.TaskManager = @p_ManagerCode'

-- Add service line filter if specified (supports comma-separated list)
IF @ServLineCode != '*'
    SET @sql = @sql + N'
    AND w.TaskCode IN (
        SELECT TaskCode FROM [dbo].[Task] t
        INNER JOIN [dbo].[ServiceLineExternal] sle ON t.ServLineCode = sle.ServLineCode
        WHERE sle.masterCode IN (SELECT LTRIM(RTRIM(value)) FROM STRING_SPLIT(@p_ServLineCode, '',''))
    )'

SET @params = N'@p_PartnerCode nvarchar(max), @p_ManagerCode nvarchar(max), @p_ServLineCode nvarchar(max), @p_DateFrom datetime'

EXEC sp_executesql @sql, @params,
    @p_PartnerCode = @PartnerCode,
    @p_ManagerCode = @ManagerCode,
    @p_ServLineCode = @ServLineCode,
    @p_DateFrom = @DateFrom

SELECT @OpeningBalWip = ISNULL(OpeningBalWip, 0) FROM #OpeningBalance
DROP TABLE #OpeningBalance

-- ============================================================================
-- STEP 2: Create temp table for monthly aggregations
-- ============================================================================

CREATE TABLE #MonthlyBase (
    [Month] DATE
    ,LTDTime FLOAT
    ,LTDDisb FLOAT
    ,LTDAdj FLOAT
    ,LTDCost FLOAT
    ,LTDFee FLOAT
    ,LTDProvision FLOAT
    ,LTDNegativeAdj FLOAT
    ,LTDHours FLOAT
)

-- ============================================================================
-- STEP 3: Build dynamic SQL for sargable filtering
-- ============================================================================

SET @sql = N'
INSERT INTO #MonthlyBase
SELECT 
    DATEFROMPARTS(YEAR(w.TranDate), MONTH(w.TranDate), 1) AS [Month]
    ,SUM(CASE WHEN w.TType = ''T'' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDTime
    ,SUM(CASE WHEN w.TType = ''D'' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDDisb
    ,SUM(CASE WHEN w.TType = ''ADJ'' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDAdj
    ,SUM(CASE WHEN w.TType != ''P'' AND (e.EmpCatCode IS NULL OR e.EmpCatCode != ''CARL'') THEN ISNULL(w.Cost, 0) ELSE 0 END) AS LTDCost
    ,SUM(CASE WHEN w.TType = ''F'' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDFee
    ,SUM(CASE WHEN w.TType = ''P'' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDProvision
    ,SUM(CASE WHEN w.TType = ''ADJ'' AND w.Amount < 0 THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDNegativeAdj
    ,SUM(CASE WHEN w.TType = ''T'' THEN ISNULL(w.Hour, 0) ELSE 0 END) AS LTDHours
FROM [dbo].[WIPTransactions] w
    LEFT JOIN [dbo].[Employee] e ON w.EmpCode = e.EmpCode
WHERE w.TranDate >= @p_DateFrom 
    AND w.TranDate <= @p_DateTo'

-- Add partner or manager filter (sargable - enables index seek, supports comma-separated list)
IF @PartnerCode != '*' AND CHARINDEX(',', @PartnerCode) > 0
    SET @sql = @sql + N' AND w.TaskPartner IN (SELECT LTRIM(RTRIM(value)) FROM STRING_SPLIT(@p_PartnerCode, '',''))'
ELSE IF @PartnerCode != '*'
    SET @sql = @sql + N' AND w.TaskPartner = @p_PartnerCode'
ELSE IF @ManagerCode != '*' AND CHARINDEX(',', @ManagerCode) > 0
    SET @sql = @sql + N' AND w.TaskManager IN (SELECT LTRIM(RTRIM(value)) FROM STRING_SPLIT(@p_ManagerCode, '',''))'
ELSE IF @ManagerCode != '*'
    SET @sql = @sql + N' AND w.TaskManager = @p_ManagerCode'

-- Add service line filter if specified (supports comma-separated list)
IF @ServLineCode != '*'
    SET @sql = @sql + N'
    AND w.TaskCode IN (
        SELECT TaskCode FROM [dbo].[Task] t
        INNER JOIN [dbo].[ServiceLineExternal] sle ON t.ServLineCode = sle.ServLineCode
        WHERE sle.masterCode IN (SELECT LTRIM(RTRIM(value)) FROM STRING_SPLIT(@p_ServLineCode, '',''))
    )'

SET @sql = @sql + N'
GROUP BY YEAR(w.TranDate), MONTH(w.TranDate)'

-- Define parameters
SET @params = N'@p_PartnerCode nvarchar(max), @p_ManagerCode nvarchar(max), @p_ServLineCode nvarchar(max), @p_DateFrom datetime, @p_DateTo datetime'

-- Execute dynamic SQL
EXEC sp_executesql @sql, @params,
    @p_PartnerCode = @PartnerCode,
    @p_ManagerCode = @ManagerCode,
    @p_ServLineCode = @ServLineCode,
    @p_DateFrom = @DateFrom,
    @p_DateTo = @DateTo

-- ============================================================================
-- STEP 4: Return results (cumulative or non-cumulative)
-- ============================================================================

IF @IsCumulative = 1
BEGIN
    -- Cumulative mode: Running totals via window function
    -- BalWip = Opening balance + cumulative (T + D + ADJ - F)
    SELECT 
        [Month]
        ,SUM(LTDTime) OVER (ORDER BY [Month] ROWS UNBOUNDED PRECEDING) AS LTDTime
        ,SUM(LTDDisb) OVER (ORDER BY [Month] ROWS UNBOUNDED PRECEDING) AS LTDDisb
        ,SUM(LTDAdj) OVER (ORDER BY [Month] ROWS UNBOUNDED PRECEDING) AS LTDAdj
        ,SUM(LTDCost) OVER (ORDER BY [Month] ROWS UNBOUNDED PRECEDING) AS LTDCost
        ,SUM(LTDFee) OVER (ORDER BY [Month] ROWS UNBOUNDED PRECEDING) AS LTDFee
        ,SUM(LTDProvision) OVER (ORDER BY [Month] ROWS UNBOUNDED PRECEDING) AS LTDProvision
        ,SUM(LTDNegativeAdj) OVER (ORDER BY [Month] ROWS UNBOUNDED PRECEDING) AS LTDNegativeAdj
        ,SUM(LTDHours) OVER (ORDER BY [Month] ROWS UNBOUNDED PRECEDING) AS LTDHours
        ,@OpeningBalWip + SUM(LTDTime + LTDDisb + LTDAdj - LTDFee) OVER (ORDER BY [Month] ROWS UNBOUNDED PRECEDING) AS BalWip
    FROM #MonthlyBase
    ORDER BY [Month]
END
ELSE
BEGIN
    -- Non-cumulative mode: Monthly values
    -- BalWip = T + D + ADJ - F (monthly WIP movement)
    SELECT 
        [Month]
        ,LTDTime
        ,LTDDisb
        ,LTDAdj
        ,LTDCost
        ,LTDFee
        ,LTDProvision
        ,LTDNegativeAdj
        ,LTDHours
        ,(LTDTime + LTDDisb + LTDAdj - LTDFee) AS BalWip
    FROM #MonthlyBase
    ORDER BY [Month]
END

-- ============================================================================
-- STEP 5: CLEANUP
-- ============================================================================

DROP TABLE #MonthlyBase

GO
