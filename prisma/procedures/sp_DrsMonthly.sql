-- ============================================================================
-- DrsMonthly Stored Procedure (v2.2)
-- Monthly DRS transaction aggregations for Overview report
-- ============================================================================
--
-- v2.2: Support multiple service line codes (comma-separated) using STRING_SPLIT
--
-- v2.1: Fixed BalDrs to include opening balance from before @DateFrom
--       BalDrs now shows actual debtors balance (historical + period activity)
--
-- v2.0: Added all missing fields to match TypeScript DrsMonthlyResult:
--       LTDInvoiced, LTDCreditNotes, LTDJournals, LTDWriteOffs, BalDrs, MonthlyReceipts
--
-- PURPOSE: Provides monthly Debtors metrics (Collections, Billings, Balance)
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
--   - LTDInvoiced: EntryType IN ('Invoice', 'Fee') - positive billing entries
--   - LTDCreditNotes: EntryType = 'Credit Note' - billing reductions
--   - LTDJournals: EntryType IN ('Interest', 'Reversal') - adjustments
--   - LTDWriteOffs: EntryType = 'Provisions' - bad debt write-offs
--   - Collections: EntryType IN ('Receipt', 'Receipt Forex'), negated
--   - NetBillings: All transactions EXCEPT receipts
--   - BalDrs: Cumulative sum of all transactions (debtors balance)
--   - MonthlyReceipts: Non-cumulative receipts (preserved for both modes)
--   - Cumulative Mode: Running totals via SUM() OVER (ORDER BY month)
--
-- RETURNS: Monthly metrics with full debtors breakdown
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
DECLARE @OpeningBalDrs FLOAT = 0

-- ============================================================================
-- STEP 1: Calculate opening debtors balance (transactions BEFORE @DateFrom)
-- ============================================================================

CREATE TABLE #OpeningBalance (
    OpeningBalDrs FLOAT
)

SET @sql = N'
INSERT INTO #OpeningBalance
SELECT 
    SUM(ISNULL(d.Total, 0)) AS OpeningBalDrs
FROM [dbo].[DrsTransactions] d
WHERE d.TranDate < @p_DateFrom'

-- Add biller filter
IF @BillerCode != '*'
    SET @sql = @sql + N' AND d.Biller = @p_BillerCode'

-- Add service line filter if specified (supports comma-separated list)
IF @ServLineCode != '*'
    SET @sql = @sql + N'
    AND d.ServLineCode IN (
        SELECT ServLineCode FROM [dbo].[ServiceLineExternal] sle
        WHERE sle.masterCode IN (SELECT LTRIM(RTRIM(value)) FROM STRING_SPLIT(@p_ServLineCode, '',''))
    )'

SET @params = N'@p_BillerCode nvarchar(max), @p_ServLineCode nvarchar(max), @p_DateFrom datetime'

EXEC sp_executesql @sql, @params,
    @p_BillerCode = @BillerCode,
    @p_ServLineCode = @ServLineCode,
    @p_DateFrom = @DateFrom

SELECT @OpeningBalDrs = ISNULL(OpeningBalDrs, 0) FROM #OpeningBalance
DROP TABLE #OpeningBalance

-- ============================================================================
-- STEP 2: Create temp table for monthly aggregations
-- ============================================================================

CREATE TABLE #MonthlyBase (
    [Month] DATE
    ,LTDInvoiced FLOAT
    ,LTDCreditNotes FLOAT
    ,LTDJournals FLOAT
    ,LTDWriteOffs FLOAT
    ,Collections FLOAT
    ,NetBillings FLOAT
    ,MonthlyReceipts FLOAT
)

-- ============================================================================
-- STEP 3: Build dynamic SQL for sargable filtering
-- ============================================================================

SET @sql = N'
INSERT INTO #MonthlyBase
SELECT 
    DATEFROMPARTS(YEAR(d.TranDate), MONTH(d.TranDate), 1) AS [Month]
    -- Invoices and Fees (positive billing entries)
    ,SUM(CASE WHEN d.EntryType IN (''Invoice'', ''Fee'') THEN ISNULL(d.Total, 0) ELSE 0 END) AS LTDInvoiced
    -- Credit Notes (billing reductions)
    ,SUM(CASE WHEN d.EntryType = ''Credit Note'' THEN ISNULL(d.Total, 0) ELSE 0 END) AS LTDCreditNotes
    -- Journals (Interest, Reversals)
    ,SUM(CASE WHEN d.EntryType IN (''Interest'', ''Reversal'') THEN ISNULL(d.Total, 0) ELSE 0 END) AS LTDJournals
    -- Write-offs (Provisions for bad debt)
    ,SUM(CASE WHEN d.EntryType = ''Provisions'' THEN ISNULL(d.Total, 0) ELSE 0 END) AS LTDWriteOffs
    -- Collections (Receipts, negated since stored as negative)
    ,SUM(CASE WHEN d.EntryType IN (''Receipt'', ''Receipt Forex'') THEN -ISNULL(d.Total, 0) ELSE 0 END) AS Collections
    -- Net Billings (all non-receipt transactions)
    ,SUM(CASE WHEN d.EntryType NOT IN (''Receipt'', ''Receipt Forex'') OR d.EntryType IS NULL THEN ISNULL(d.Total, 0) ELSE 0 END) AS NetBillings
    -- Monthly Receipts (non-cumulative receipts preserved for both modes)
    ,SUM(CASE WHEN d.EntryType IN (''Receipt'', ''Receipt Forex'') THEN -ISNULL(d.Total, 0) ELSE 0 END) AS MonthlyReceipts
FROM [dbo].[DrsTransactions] d
WHERE d.TranDate >= @p_DateFrom 
    AND d.TranDate <= @p_DateTo'

-- Add biller filter (sargable - enables index seek)
IF @BillerCode != '*'
    SET @sql = @sql + N' AND d.Biller = @p_BillerCode'

-- Add service line filter if specified (supports comma-separated list)
IF @ServLineCode != '*'
    SET @sql = @sql + N'
    AND d.ServLineCode IN (
        SELECT ServLineCode FROM [dbo].[ServiceLineExternal] sle
        WHERE sle.masterCode IN (SELECT LTRIM(RTRIM(value)) FROM STRING_SPLIT(@p_ServLineCode, '',''))
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
-- STEP 4: Return results (cumulative or non-cumulative)
-- ============================================================================

IF @IsCumulative = 1
BEGIN
    -- Cumulative mode: Running totals via window function
    -- BalDrs = Opening balance + cumulative (NetBillings - Collections)
    SELECT 
        [Month]
        ,SUM(LTDInvoiced) OVER (ORDER BY [Month] ROWS UNBOUNDED PRECEDING) AS LTDInvoiced
        ,SUM(LTDCreditNotes) OVER (ORDER BY [Month] ROWS UNBOUNDED PRECEDING) AS LTDCreditNotes
        ,SUM(Collections) OVER (ORDER BY [Month] ROWS UNBOUNDED PRECEDING) AS Collections
        ,SUM(LTDJournals) OVER (ORDER BY [Month] ROWS UNBOUNDED PRECEDING) AS LTDJournals
        ,SUM(LTDWriteOffs) OVER (ORDER BY [Month] ROWS UNBOUNDED PRECEDING) AS LTDWriteOffs
        ,SUM(NetBillings) OVER (ORDER BY [Month] ROWS UNBOUNDED PRECEDING) AS NetBillings
        ,@OpeningBalDrs + SUM(NetBillings - Collections) OVER (ORDER BY [Month] ROWS UNBOUNDED PRECEDING) AS BalDrs
        ,MonthlyReceipts  -- Preserved as non-cumulative for receipts tab
    FROM #MonthlyBase
    ORDER BY [Month]
END
ELSE
BEGIN
    -- Non-cumulative mode: Monthly values
    SELECT 
        [Month]
        ,LTDInvoiced
        ,LTDCreditNotes
        ,Collections
        ,LTDJournals
        ,LTDWriteOffs
        ,NetBillings
        ,(NetBillings - Collections) AS BalDrs  -- Monthly movement
        ,MonthlyReceipts
    FROM #MonthlyBase
    ORDER BY [Month]
END

-- ============================================================================
-- STEP 5: CLEANUP
-- ============================================================================

DROP TABLE #MonthlyBase

GO
