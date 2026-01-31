-- ============================================================================
-- DrsMonthly Stored Procedure
-- Monthly DRS aggregations for Overview charts
-- ============================================================================
--
-- PURPOSE:
-- Returns monthly debtors metrics for the Overview report charts.
-- Supports both cumulative (running totals within period) and
-- non-cumulative (monthly values) modes.
--
-- KEY FEATURES:
-- 1. Monthly aggregation by entry type (Invoice, Receipt, Credit Note, etc.)
-- 2. Cumulative and non-cumulative modes for different chart needs
-- 3. Net billings calculation for lockup day denominators
-- 4. Uses WITH (NOLOCK) for read consistency with DrsLTDv2
--
-- USED BY:
-- - My Reports Overview (Collections, Debtors Balance, Lockup Days)
-- - My Reports Recoverability (Receipts Tab)
--
-- INDEXES USED:
-- - idx_drs_biller_super_covering
--
-- ============================================================================

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[DrsMonthly]
     @BillerCode nvarchar(max)
    ,@ServLineCode nvarchar(max)  = '*'
    ,@DateFrom datetime
    ,@DateTo datetime
    ,@IsCumulative bit            = 1   -- 1 = cumulative, 0 = monthly values
AS

SET NOCOUNT ON;

-- ============================================================================
-- CTE 1: MonthSeries
-- Generate month series for the date range
-- ============================================================================
;WITH MonthSeries AS (
    SELECT EOMONTH(@DateFrom) AS MonthEnd
    UNION ALL
    SELECT EOMONTH(DATEADD(MONTH, 1, MonthEnd))
    FROM MonthSeries
    WHERE MonthEnd < EOMONTH(@DateTo)
)

-- ============================================================================
-- CTE 2: MonthlyDrs
-- Monthly aggregation of DRS transactions with NOLOCK for performance
-- ============================================================================
, MonthlyDrs AS (
    SELECT 
        EOMONTH(d.TranDate) AS MonthEnd
        ,SUM(CASE WHEN d.EntryType = 'Invoice' THEN ISNULL(d.Total, 0) ELSE 0 END) AS Invoiced
        ,SUM(CASE WHEN d.EntryType = 'Credit Note' THEN ISNULL(d.Total, 0) ELSE 0 END) AS CreditNotes
        ,SUM(CASE WHEN d.EntryType = 'Receipt' THEN ISNULL(d.Total, 0) ELSE 0 END) AS Receipts
        ,SUM(CASE WHEN d.EntryType = 'Journal' THEN ISNULL(d.Total, 0) ELSE 0 END) AS Journals
        ,SUM(CASE WHEN d.EntryType = 'Write Off' THEN ISNULL(d.Total, 0) ELSE 0 END) AS WriteOffs
        -- Net billings = Invoiced + Credit Notes (credit notes are negative)
        ,SUM(CASE WHEN d.EntryType = 'Invoice' THEN ISNULL(d.Total, 0)
                  WHEN d.EntryType = 'Credit Note' THEN ISNULL(d.Total, 0)
                  ELSE 0 END) AS NetBillings
        -- Balance change (matches DrsLTDv2 logic)
        ,SUM(CASE WHEN d.EntryType = 'Receipt' THEN 0 - ISNULL(d.Total, 0)
                  WHEN d.EntryType IN ('Invoice', 'Credit Note', 'Journal', 'Write Off') THEN ISNULL(d.Total, 0)
                  ELSE 0 END) AS BalDrsChange
    FROM DrsTransactions d WITH (NOLOCK)
    WHERE d.Biller = @BillerCode
      AND d.TranDate >= @DateFrom
      AND d.TranDate <= @DateTo
      AND (@ServLineCode = '*' OR d.ServLineCode = @ServLineCode)
    GROUP BY EOMONTH(d.TranDate)
)
-- ============================================================================
-- CTE 3: MonthlyData
-- Join with month series to ensure all months are present (zero-fill)
-- ============================================================================
, MonthlyData AS (
    SELECT 
        ms.MonthEnd
        ,ISNULL(md.Invoiced, 0) AS Invoiced
        ,ISNULL(md.CreditNotes, 0) AS CreditNotes
        ,ISNULL(md.Receipts, 0) AS Receipts
        ,ISNULL(md.Journals, 0) AS Journals
        ,ISNULL(md.WriteOffs, 0) AS WriteOffs
        ,ISNULL(md.NetBillings, 0) AS NetBillings
        ,ISNULL(md.BalDrsChange, 0) AS BalDrsChange
    FROM MonthSeries ms
    LEFT JOIN MonthlyDrs md ON ms.MonthEnd = md.MonthEnd
)

-- ============================================================================
-- Final SELECT: Apply cumulative windowing if requested
-- ============================================================================
SELECT 
    MonthEnd AS Month
    ,CASE WHEN @IsCumulative = 1 
        THEN SUM(Invoiced) OVER (ORDER BY MonthEnd ROWS UNBOUNDED PRECEDING)
        ELSE Invoiced 
     END AS LTDInvoiced
    ,CASE WHEN @IsCumulative = 1 
        THEN SUM(CreditNotes) OVER (ORDER BY MonthEnd ROWS UNBOUNDED PRECEDING)
        ELSE CreditNotes 
     END AS LTDCreditNotes
    ,CASE WHEN @IsCumulative = 1 
        THEN SUM(Receipts) OVER (ORDER BY MonthEnd ROWS UNBOUNDED PRECEDING)
        ELSE Receipts 
     END AS Collections  -- Alias for clarity in charts
    ,CASE WHEN @IsCumulative = 1 
        THEN SUM(Journals) OVER (ORDER BY MonthEnd ROWS UNBOUNDED PRECEDING)
        ELSE Journals 
     END AS LTDJournals
    ,CASE WHEN @IsCumulative = 1 
        THEN SUM(WriteOffs) OVER (ORDER BY MonthEnd ROWS UNBOUNDED PRECEDING)
        ELSE WriteOffs 
     END AS LTDWriteOffs
    ,CASE WHEN @IsCumulative = 1 
        THEN SUM(NetBillings) OVER (ORDER BY MonthEnd ROWS UNBOUNDED PRECEDING)
        ELSE NetBillings 
     END AS NetBillings
    -- Debtors Balance is always cumulative from inception
    ,SUM(BalDrsChange) OVER (ORDER BY MonthEnd ROWS UNBOUNDED PRECEDING) AS BalDrs
    -- Monthly values (non-cumulative) for receipts tab
    ,Receipts AS MonthlyReceipts
    ,Invoiced AS MonthlyInvoiced
    ,(Invoiced - CreditNotes) AS MonthlyNetBillings
FROM MonthlyData
ORDER BY MonthEnd
OPTION (MAXRECURSION 100)
;
GO

PRINT 'DrsMonthly stored procedure created successfully';
PRINT '';
PRINT 'Example usage:';
PRINT '  -- Biller FY2024 cumulative for charts';
PRINT '  EXEC dbo.DrsMonthly @BillerCode = ''BLAW001'', @DateFrom = ''2023-09-01'', @DateTo = ''2024-08-31'', @IsCumulative = 1;';
PRINT '';
PRINT '  -- Biller FY2024 non-cumulative for receipts analysis';
PRINT '  EXEC dbo.DrsMonthly @BillerCode = ''BLAW001'', @DateFrom = ''2023-09-01'', @DateTo = ''2024-08-31'', @IsCumulative = 0;';
PRINT '';
PRINT '  -- Trailing 12 months for lockup calculations';
PRINT '  EXEC dbo.DrsMonthly @BillerCode = ''BLAW001'', @DateFrom = ''2023-01-01'', @DateTo = ''2024-08-31'', @IsCumulative = 0;';
GO
