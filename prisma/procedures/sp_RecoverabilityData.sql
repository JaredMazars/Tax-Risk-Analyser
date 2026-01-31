-- ============================================================================
-- sp_RecoverabilityData Stored Procedure
-- Combined aging and current period data by client-serviceline
-- ============================================================================
--
-- PURPOSE:
-- Single optimized stored procedure that returns per-client-serviceline
-- aggregations with aging buckets, current period metrics, and proper
-- service line mapping at the transaction level.
--
-- KEY FEATURES:
-- 1. Groups by Client + Service Line (one row per combination)
-- 2. Maps service lines at TRANSACTION level (not client level with MAX)
-- 3. Ages ALL invoices (positive and negative)
-- 4. Detects and excludes offsetting invoice pairs
-- 5. Includes current period billings AND receipts
-- 6. Optional client filter for targeted queries
-- 7. Explicit ROUND() to prevent rounding errors
--
-- DIFFERENCES FROM PREVIOUS APPROACH:
-- - Single SP instead of two separate calls
-- - Transaction-level service line mapping (accurate for multi-serviceline clients)
-- - Returns client-serviceline combinations (can be merged in TypeScript)
-- - Current period billings included (not full 12-month history)
--
-- USED BY:
-- - My Reports Recoverability
--
-- INDEXES USED:
-- - idx_drs_biller_super_covering
--
-- ============================================================================

-- Drop procedure if exists
IF OBJECT_ID('dbo.sp_RecoverabilityData', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_RecoverabilityData
GO

CREATE PROCEDURE [dbo].[sp_RecoverabilityData]
     @BillerCode nvarchar(max)
    ,@AsOfDate datetime = NULL
    ,@ClientCode nvarchar(max) = '*'
    ,@ServLineCode nvarchar(max) = '*'
AS

SET NOCOUNT ON

-- Default @AsOfDate to current date if not provided
SET @AsOfDate = ISNULL(@AsOfDate, GETDATE())

-- ============================================================================
-- CTE 1: AllTransactions
-- Fetch all transactions for biller up to AsOfDate
-- Join ServiceLineExternal at TRANSACTION level for accurate mapping
-- ============================================================================
;WITH AllTransactions AS (
    SELECT 
        d.GSClientID
        ,d.ClientCode
        ,d.ClientNameFull
        ,d.GroupCode
        ,d.GroupDesc
        ,d.ServLineCode
        ,d.ServLineDesc
        ,d.TranDate
        ,d.EntryType
        ,d.InvNumber
        ,d.Total
        -- Service line mapping at transaction level
        ,ISNULL(sle.masterCode, d.ServLineCode) AS MasterServiceLineCode
        ,ISNULL(sle.SubServlineGroupCode, '') AS SubServlineGroupCode
        ,ISNULL(sle.SubServlineGroupDesc, '') AS SubServlineGroupDesc
    FROM DrsTransactions d WITH (NOLOCK)
    LEFT JOIN ServiceLineExternal sle ON d.ServLineCode = sle.ServLineCode
    WHERE (@BillerCode = '*' OR d.Biller = @BillerCode)
      AND d.TranDate <= @AsOfDate
      AND (@ClientCode = '*' OR d.ClientCode = @ClientCode)
      AND (@ServLineCode = '*' OR d.ServLineCode = @ServLineCode)
)

-- ============================================================================
-- CTE 2: ClientServiceLineBalance
-- Calculate total balance per client-serviceline combination
-- ============================================================================
, ClientServiceLineBalance AS (
    SELECT 
        GSClientID
        ,MAX(ClientCode) AS ClientCode
        ,MAX(ClientNameFull) AS ClientNameFull
        ,MAX(GroupCode) AS GroupCode
        ,MAX(GroupDesc) AS GroupDesc
        ,ServLineCode
        ,MAX(ServLineDesc) AS ServLineDesc
        ,MasterServiceLineCode
        ,MAX(SubServlineGroupCode) AS SubServlineGroupCode
        ,MAX(SubServlineGroupDesc) AS SubServlineGroupDesc
        ,ROUND(SUM(ISNULL(Total, 0)), 2) AS TotalBalance
    FROM AllTransactions
    GROUP BY GSClientID, ServLineCode, MasterServiceLineCode
)

-- ============================================================================
-- CTE 3: InvoiceBalances
-- Group by InvNumber to calculate net balance and invoice date
-- InvoiceDate = MIN(TranDate) for positive amounts only
-- ============================================================================
, InvoiceBalances AS (
    SELECT 
        GSClientID
        ,ServLineCode
        ,MasterServiceLineCode
        ,InvNumber
        -- InvoiceDate: Use MIN of positive transactions only
        ,ISNULL(
            MIN(CASE WHEN Total > 0 THEN TranDate ELSE NULL END),
            @AsOfDate
        ) AS InvoiceDate
        ,ROUND(SUM(ISNULL(Total, 0)), 2) AS NetBalance
    FROM AllTransactions
    WHERE InvNumber IS NOT NULL AND InvNumber != ''
    GROUP BY GSClientID, ServLineCode, MasterServiceLineCode, InvNumber
)

-- ============================================================================
-- CTE 4: OffsettingPairs
-- Detect invoice pairs with equal and opposite amounts within same client-serviceline
-- ============================================================================
, OffsettingPairs AS (
    SELECT DISTINCT 
        i1.GSClientID
        ,i1.ServLineCode
        ,i1.MasterServiceLineCode
        ,i1.InvNumber AS InvNumber1
        ,i2.InvNumber AS InvNumber2
    FROM InvoiceBalances i1
    INNER JOIN InvoiceBalances i2 
        ON i1.GSClientID = i2.GSClientID
        AND i1.ServLineCode = i2.ServLineCode
        AND i1.MasterServiceLineCode = i2.MasterServiceLineCode
        AND ROUND(i1.NetBalance + i2.NetBalance, 2) = 0
        AND i1.NetBalance <> 0
        AND i1.InvNumber <> i2.InvNumber
)

-- ============================================================================
-- CTE 5: ExcludedInvoices
-- Union of all invoices that should be excluded from aging
-- ============================================================================
, ExcludedInvoices AS (
    SELECT GSClientID, ServLineCode, MasterServiceLineCode, InvNumber1 AS InvNumber FROM OffsettingPairs
    UNION
    SELECT GSClientID, ServLineCode, MasterServiceLineCode, InvNumber2 AS InvNumber FROM OffsettingPairs
)

-- ============================================================================
-- CTE 6: AgingCalculation
-- Calculate days outstanding and assign to buckets
-- ============================================================================
, AgingCalculation AS (
    SELECT 
        ib.GSClientID
        ,ib.ServLineCode
        ,ib.MasterServiceLineCode
        ,ib.InvNumber
        ,ib.InvoiceDate
        ,ib.NetBalance
        ,DATEDIFF(DAY, ib.InvoiceDate, @AsOfDate) AS DaysOutstanding
        ,CASE 
            WHEN DATEDIFF(DAY, ib.InvoiceDate, @AsOfDate) <= 30 THEN 'Current'
            WHEN DATEDIFF(DAY, ib.InvoiceDate, @AsOfDate) <= 60 THEN 'Days31_60'
            WHEN DATEDIFF(DAY, ib.InvoiceDate, @AsOfDate) <= 90 THEN 'Days61_90'
            WHEN DATEDIFF(DAY, ib.InvoiceDate, @AsOfDate) <= 120 THEN 'Days91_120'
            ELSE 'Days120Plus'
        END AS AgingBucket
    FROM InvoiceBalances ib
    WHERE NOT EXISTS (
        SELECT 1 FROM ExcludedInvoices ei 
        WHERE ei.GSClientID = ib.GSClientID 
        AND ei.ServLineCode = ib.ServLineCode
        AND ei.MasterServiceLineCode = ib.MasterServiceLineCode
        AND ei.InvNumber = ib.InvNumber
    )
    AND ROUND(ib.NetBalance, 2) <> 0
)

-- ============================================================================
-- CTE 7: ClientServiceLineAging
-- Aggregate aging buckets per client-serviceline
-- ============================================================================
, ClientServiceLineAging AS (
    SELECT 
        GSClientID
        ,ServLineCode
        ,MasterServiceLineCode
        ,COUNT(DISTINCT InvNumber) AS InvoiceCount
        ,ROUND(SUM(CASE WHEN AgingBucket = 'Current' THEN NetBalance ELSE 0 END), 2) AS AgingCurrent
        ,ROUND(SUM(CASE WHEN AgingBucket = 'Days31_60' THEN NetBalance ELSE 0 END), 2) AS Aging31_60
        ,ROUND(SUM(CASE WHEN AgingBucket = 'Days61_90' THEN NetBalance ELSE 0 END), 2) AS Aging61_90
        ,ROUND(SUM(CASE WHEN AgingBucket = 'Days91_120' THEN NetBalance ELSE 0 END), 2) AS Aging91_120
        ,ROUND(SUM(CASE WHEN AgingBucket = 'Days120Plus' THEN NetBalance ELSE 0 END), 2) AS Aging120Plus
        ,ROUND(AVG(CAST(DaysOutstanding AS FLOAT)), 2) AS AvgDaysOutstanding
    FROM AgingCalculation
    GROUP BY GSClientID, ServLineCode, MasterServiceLineCode
)

-- ============================================================================
-- CTE 8: CurrentPeriodMetrics
-- Calculate receipts AND billings in the current period (last 30 days)
-- ============================================================================
, CurrentPeriodMetrics AS (
    SELECT 
        GSClientID
        ,ServLineCode
        ,MasterServiceLineCode
        ,ROUND(SUM(CASE WHEN Total < 0 THEN ABS(Total) ELSE 0 END), 2) AS CurrentPeriodReceipts
        ,ROUND(SUM(CASE WHEN Total > 0 THEN Total ELSE 0 END), 2) AS CurrentPeriodBillings
    FROM AllTransactions
    WHERE TranDate > DATEADD(DAY, -30, @AsOfDate)
      AND TranDate <= @AsOfDate
    GROUP BY GSClientID, ServLineCode, MasterServiceLineCode
)

-- ============================================================================
-- CTE 9: PriorBalance
-- Calculate balance before the current period (30 days ago)
-- ============================================================================
, PriorBalance AS (
    SELECT 
        GSClientID
        ,ServLineCode
        ,MasterServiceLineCode
        ,ROUND(SUM(ISNULL(Total, 0)), 2) AS PriorMonthBalance
    FROM AllTransactions
    WHERE TranDate < DATEADD(DAY, -30, @AsOfDate)
    GROUP BY GSClientID, ServLineCode, MasterServiceLineCode
)

-- ============================================================================
-- Final SELECT: Merge all CTEs and return results with service line mappings
-- ============================================================================
SELECT 
    cb.GSClientID
    ,cb.ClientCode
    ,cb.ClientNameFull
    ,cb.GroupCode
    ,cb.GroupDesc
    ,cb.ServLineCode
    ,cb.ServLineDesc
    -- Service line mapping fields (mapped at transaction level)
    ,cb.MasterServiceLineCode
    ,ISNULL(slm.name, cb.ServLineDesc) AS MasterServiceLineName
    ,cb.SubServlineGroupCode
    ,cb.SubServlineGroupDesc
    -- Balances and aging
    ,cb.TotalBalance
    ,ISNULL(ca.InvoiceCount, 0) AS InvoiceCount
    ,ISNULL(ca.AgingCurrent, 0) AS AgingCurrent
    ,ISNULL(ca.Aging31_60, 0) AS Aging31_60
    ,ISNULL(ca.Aging61_90, 0) AS Aging61_90
    ,ISNULL(ca.Aging91_120, 0) AS Aging91_120
    ,ISNULL(ca.Aging120Plus, 0) AS Aging120Plus
    ,ISNULL(ca.AvgDaysOutstanding, 0) AS AvgDaysOutstanding
    -- Current period metrics
    ,ISNULL(cpm.CurrentPeriodReceipts, 0) AS CurrentPeriodReceipts
    ,ISNULL(cpm.CurrentPeriodBillings, 0) AS CurrentPeriodBillings
    -- Prior period
    ,ISNULL(pb.PriorMonthBalance, 0) AS PriorMonthBalance
FROM ClientServiceLineBalance cb
LEFT JOIN ClientServiceLineAging ca 
    ON cb.GSClientID = ca.GSClientID 
    AND cb.ServLineCode = ca.ServLineCode
    AND cb.MasterServiceLineCode = ca.MasterServiceLineCode
LEFT JOIN CurrentPeriodMetrics cpm 
    ON cb.GSClientID = cpm.GSClientID 
    AND cb.ServLineCode = cpm.ServLineCode
    AND cb.MasterServiceLineCode = cpm.MasterServiceLineCode
LEFT JOIN PriorBalance pb 
    ON cb.GSClientID = pb.GSClientID 
    AND cb.ServLineCode = pb.ServLineCode
    AND cb.MasterServiceLineCode = pb.MasterServiceLineCode
LEFT JOIN ServiceLineMaster slm ON cb.MasterServiceLineCode = slm.code AND slm.active = 1
ORDER BY cb.GroupCode, cb.ClientCode, cb.ServLineCode
;
GO

PRINT 'sp_RecoverabilityData stored procedure created successfully';
PRINT '';
PRINT 'Key Features:';
PRINT '  - One row per client-serviceline combination';
PRINT '  - Transaction-level service line mapping (accurate for multi-serviceline clients)';
PRINT '  - Ages ALL invoices (positive and negative)';
PRINT '  - Detects and excludes offsetting invoice pairs';
PRINT '  - Current period billings AND receipts';
PRINT '  - Optional client filter for targeted queries';
PRINT '  - Explicit ROUND() to prevent rounding errors';
PRINT '';
PRINT 'Example usage:';
PRINT '  -- All clients and service lines';
PRINT '  EXEC dbo.sp_RecoverabilityData @BillerCode = ''BLAW001'', @AsOfDate = ''2026-01-31'';';
PRINT '';
PRINT '  -- Filter by specific client';
PRINT '  EXEC dbo.sp_RecoverabilityData @BillerCode = ''BLAW001'', @AsOfDate = ''2026-01-31'', @ClientCode = ''BOS0139'';';
PRINT '';
PRINT '  -- Filter by service line';
PRINT '  EXEC dbo.sp_RecoverabilityData @BillerCode = ''BLAW001'', @AsOfDate = ''2026-01-31'', @ServLineCode = ''TAX'';';
GO
