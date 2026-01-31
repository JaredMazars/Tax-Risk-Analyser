-- ============================================================================
-- sp_RecoverabilityMonthly Stored Procedure
-- Per-client monthly receipts breakdown using FiscalPeriod table
-- ============================================================================
--
-- PURPOSE:
-- Calculate monthly opening/closing balances for each client where:
-- - Opening Balance = cumulative transactions BEFORE period.startDate
-- - Receipts = negative transactions WITHIN period (absolute value)
-- - Billings = positive transactions WITHIN period
-- - Closing Balance = Opening + Billings - Receipts
-- 
-- Uses FiscalPeriod table for accurate period boundaries, ensuring:
-- - November closing = December opening (proper carry-forward)
-- - Consistent with other reports using FiscalPeriod
-- - No manual date calculations needed
--
-- PARAMETERS:
-- @BillerCode: Employee code (required)
-- @DateFrom: Start of fiscal year (e.g., '2025-09-01')
-- @DateTo: End date for reporting (e.g., '2026-01-31')
-- @ServLineCode: Optional service line filter (default '*')
--
-- RETURNS:
-- One row per client-serviceline-period combination
-- - OpeningBalance = cumulative BEFORE period.startDate
-- - Receipts/Billings = transactions WITHIN period
-- - ClosingBalance = opening + billings - receipts
--
-- ============================================================================

-- Drop procedure if exists
IF OBJECT_ID('dbo.sp_RecoverabilityMonthly', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_RecoverabilityMonthly
GO

CREATE PROCEDURE [dbo].[sp_RecoverabilityMonthly]
     @BillerCode nvarchar(max)
    ,@DateFrom datetime
    ,@DateTo datetime
    ,@ServLineCode nvarchar(max) = '*'
AS

SET NOCOUNT ON

-- ============================================================================
-- CTE 1: PeriodList
-- Get fiscal periods from FiscalPeriod table for requested date range
-- This replaces manual date calculations with authoritative period data
-- ============================================================================
;WITH PeriodList AS (
    SELECT 
        fp.periodKey
        ,fp.fiscalYear
        ,fp.fiscalMonth
        ,fp.startDate
        ,fp.endDate
        ,LEFT(fp.periodName, 3) AS MonthLabel  -- Extract 'Sep', 'Oct', etc.
        -- Get previous period's end date for opening balance calculation
        ,LAG(fp.endDate) OVER (ORDER BY fp.fiscalYear, fp.fiscalMonth) AS PrevPeriodEnd
    FROM FiscalPeriod fp WITH (NOLOCK)
    WHERE fp.startDate >= @DateFrom
      AND fp.endDate <= @DateTo
)

-- ============================================================================
-- CTE 2: ClientList
-- Get unique clients with service line mapping
-- ============================================================================
, ClientList AS (
    SELECT DISTINCT
        d.GSClientID
        ,MAX(d.ClientCode) AS ClientCode
        ,MAX(d.ClientNameFull) AS ClientNameFull
        ,MAX(d.GroupCode) AS GroupCode
        ,MAX(d.GroupDesc) AS GroupDesc
        ,d.ServLineCode
        ,MAX(d.ServLineDesc) AS ServLineDesc
        -- Service line mapping at transaction level
        ,MAX(ISNULL(sle.masterCode, d.ServLineCode)) AS MasterServiceLineCode
        ,MAX(ISNULL(sle.SubServlineGroupCode, '')) AS SubServlineGroupCode
        ,MAX(ISNULL(sle.SubServlineGroupDesc, '')) AS SubServlineGroupDesc
    FROM DrsTransactions d WITH (NOLOCK)
    LEFT JOIN ServiceLineExternal sle ON d.ServLineCode = sle.ServLineCode
    WHERE d.Biller = @BillerCode
      AND d.TranDate <= @DateTo
      AND (@ServLineCode = '*' OR d.ServLineCode = @ServLineCode)
    GROUP BY d.GSClientID, d.ServLineCode
)

-- ============================================================================
-- CTE 3: MonthlyData
-- Calculate metrics for each client-serviceline-period combination
-- Uses FiscalPeriod boundaries for accurate period calculations
-- ============================================================================
, MonthlyData AS (
    SELECT 
        c.GSClientID
        ,c.ClientCode
        ,c.ClientNameFull
        ,c.GroupCode
        ,c.GroupDesc
        ,c.ServLineCode
        ,c.ServLineDesc
        ,c.MasterServiceLineCode
        ,c.SubServlineGroupCode
        ,c.SubServlineGroupDesc
        ,p.startDate AS PeriodStart
        ,p.endDate AS PeriodEnd
        ,p.MonthLabel
        -- Opening Balance: Cumulative up to PREVIOUS period end
        -- This guarantees Nov closing = Dec opening (same cutoff date)
        ,ROUND(ISNULL(SUM(CASE 
            -- First period (no previous): use transactions before current start
            WHEN p.PrevPeriodEnd IS NULL AND d.TranDate < p.startDate THEN d.Total
            -- Subsequent periods: use transactions up to previous period end
            WHEN p.PrevPeriodEnd IS NOT NULL AND d.TranDate <= p.PrevPeriodEnd THEN d.Total
            ELSE 0 
        END), 0), 2) AS OpeningBalance
        -- Receipts: Negative transactions WITHIN period (absolute value)
        ,ROUND(ISNULL(SUM(CASE 
            WHEN d.TranDate >= p.startDate 
            AND d.TranDate <= p.endDate 
            AND d.Total < 0 THEN ABS(d.Total)
            ELSE 0 
        END), 0), 2) AS Receipts
        -- Billings: Positive transactions WITHIN period
        ,ROUND(ISNULL(SUM(CASE 
            WHEN d.TranDate >= p.startDate 
            AND d.TranDate <= p.endDate 
            AND d.Total > 0 THEN d.Total
            ELSE 0 
        END), 0), 2) AS Billings
    FROM ClientList c
    CROSS JOIN PeriodList p
    LEFT JOIN DrsTransactions d WITH (NOLOCK)
        ON c.GSClientID = d.GSClientID
        AND c.ServLineCode = d.ServLineCode
        AND d.Biller = @BillerCode
        -- Include ALL transactions up to period end for opening balance calculation
        AND d.TranDate <= p.endDate
    GROUP BY 
        c.GSClientID, c.ClientCode, c.ClientNameFull, c.GroupCode, c.GroupDesc,
        c.ServLineCode, c.ServLineDesc,
        c.MasterServiceLineCode, c.SubServlineGroupCode, c.SubServlineGroupDesc,
        p.startDate, p.endDate, p.MonthLabel
)

-- ============================================================================
-- Final SELECT with calculated fields
-- ============================================================================
SELECT 
    md.GSClientID
    ,md.ClientCode
    ,md.ClientNameFull
    ,md.GroupCode
    ,md.GroupDesc
    ,md.ServLineCode
    ,md.ServLineDesc
    -- Service line mapping
    ,md.MasterServiceLineCode
    ,ISNULL(slm.name, md.ServLineDesc) AS MasterServiceLineName
    ,md.SubServlineGroupCode
    ,md.SubServlineGroupDesc
    -- Period info (using FiscalPeriod boundaries)
    ,md.PeriodEnd AS MonthEnd
    ,md.MonthLabel
    -- Balances
    ,md.OpeningBalance
    ,md.Receipts
    ,md.Billings
    -- Calculated fields
    ,ROUND(md.Receipts - md.OpeningBalance, 2) AS Variance
    ,CASE 
        WHEN md.OpeningBalance > 0 
        THEN ROUND((md.Receipts / md.OpeningBalance) * 100, 2)
        ELSE 0 
    END AS RecoveryPercent
    ,ROUND(md.OpeningBalance + md.Billings - md.Receipts, 2) AS ClosingBalance
FROM MonthlyData md
LEFT JOIN ServiceLineMaster slm ON md.MasterServiceLineCode = slm.code AND slm.active = 1
ORDER BY md.GroupCode, md.ClientCode, md.ServLineCode, md.PeriodEnd
;
GO

PRINT 'sp_RecoverabilityMonthly stored procedure created successfully';
PRINT '';
PRINT 'Key Features:';
PRINT '  - Uses FiscalPeriod table for accurate period boundaries';
PRINT '  - Per-client-serviceline monthly breakdown';
PRINT '  - Opening balance = cumulative BEFORE period.startDate';
PRINT '  - Receipts = negative transactions WITHIN period (absolute value)';
PRINT '  - Billings = positive transactions WITHIN period';
PRINT '  - Closing balance = Opening + Billings - Receipts';
PRINT '  - Guarantees November closing = December opening';
PRINT '  - Transaction-level service line mapping';
PRINT '';
PRINT 'Example usage:';
PRINT '  -- Fiscal year FY2026 (Sep 2025 - Aug 2026)';
PRINT '  EXEC dbo.sp_RecoverabilityMonthly @BillerCode = ''BLAW001'', @DateFrom = ''2025-09-01'', @DateTo = ''2026-08-31'';';
PRINT '';
PRINT '  -- Partial year (Sep 2025 - Jan 2026)';
PRINT '  EXEC dbo.sp_RecoverabilityMonthly @BillerCode = ''BLAW001'', @DateFrom = ''2025-09-01'', @DateTo = ''2026-01-31'';';
GO
