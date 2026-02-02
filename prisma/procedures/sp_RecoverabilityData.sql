-- ============================================================================
-- sp_RecoverabilityData Stored Procedure (v2.0 - Optimized)
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
-- OPTIMIZATIONS (v2.0):
-- 1. Dynamic SQL for sargable WHERE clauses (eliminates OR @Param = '*' pattern)
-- 2. Temp table for AllTransactions (materialized once, indexed)
-- 3. Temp tables for intermediate results (reduce CTE re-evaluation)
-- 4. Clustered indexes on temp tables for efficient joins
--
-- INDEXES USED:
-- - idx_drs_biller_covering (Biller filter)
-- - idx_drs_client_covering (Client filter)
-- - idx_drs_serviceline_covering (Service line filter)
--
-- ============================================================================

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_RecoverabilityData]
     @BillerCode nvarchar(max)
    ,@AsOfDate datetime = NULL
    ,@ClientCode nvarchar(max) = '*'
    ,@ServLineCode nvarchar(max) = '*'
AS

SET NOCOUNT ON

-- Default @AsOfDate to current date if not provided
SET @AsOfDate = ISNULL(@AsOfDate, GETDATE())

DECLARE @sql NVARCHAR(MAX)
DECLARE @params NVARCHAR(MAX)

-- ============================================================================
-- STEP 1: AllTransactions temp table (materialized once, indexed)
-- Fetch all transactions for biller up to AsOfDate using dynamic SQL
-- ============================================================================

CREATE TABLE #AllTransactions (
    GSClientID UNIQUEIDENTIFIER
    ,ClientCode NVARCHAR(20)
    ,ClientNameFull NVARCHAR(255)
    ,GroupCode NVARCHAR(20)
    ,GroupDesc NVARCHAR(255)
    ,ServLineCode NVARCHAR(20)
    ,ServLineDesc NVARCHAR(255)
    ,TranDate DATETIME
    ,EntryType NVARCHAR(50)
    ,InvNumber NVARCHAR(50)
    ,Total FLOAT
    ,MasterServiceLineCode NVARCHAR(50)
    ,SubServlineGroupCode NVARCHAR(20)
    ,SubServlineGroupDesc NVARCHAR(255)
)

SET @sql = N'
INSERT INTO #AllTransactions
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
    ,ISNULL(sle.masterCode, d.ServLineCode) AS MasterServiceLineCode
    ,ISNULL(sle.SubServlineGroupCode, '''') AS SubServlineGroupCode
    ,ISNULL(sle.SubServlineGroupDesc, '''') AS SubServlineGroupDesc
FROM DrsTransactions d WITH (NOLOCK)
LEFT JOIN ServiceLineExternal sle ON d.ServLineCode = sle.ServLineCode
WHERE d.TranDate <= @p_AsOfDate'

-- Add sargable predicates only when filter is not wildcard
IF @BillerCode != '*' SET @sql = @sql + N' AND d.Biller = @p_BillerCode'
IF @ClientCode != '*' SET @sql = @sql + N' AND d.ClientCode = @p_ClientCode'
IF @ServLineCode != '*' SET @sql = @sql + N' AND d.ServLineCode = @p_ServLineCode'

SET @params = N'@p_AsOfDate datetime, @p_BillerCode nvarchar(max), @p_ClientCode nvarchar(max), @p_ServLineCode nvarchar(max)'

EXEC sp_executesql @sql, @params,
    @p_AsOfDate = @AsOfDate,
    @p_BillerCode = @BillerCode,
    @p_ClientCode = @ClientCode,
    @p_ServLineCode = @ServLineCode

-- Create indexes for efficient lookups
CREATE CLUSTERED INDEX IX_AllTrans_Client_SL ON #AllTransactions (GSClientID, ServLineCode, MasterServiceLineCode)
CREATE NONCLUSTERED INDEX IX_AllTrans_InvNumber ON #AllTransactions (InvNumber) WHERE InvNumber IS NOT NULL AND InvNumber != ''

-- ============================================================================
-- STEP 2: ClientServiceLineBalance temp table
-- Calculate total balance per client-serviceline combination
-- ============================================================================

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
INTO #ClientServiceLineBalance
FROM #AllTransactions
GROUP BY GSClientID, ServLineCode, MasterServiceLineCode

CREATE CLUSTERED INDEX IX_CSB_Client_SL ON #ClientServiceLineBalance (GSClientID, ServLineCode, MasterServiceLineCode)

-- ============================================================================
-- STEP 3: InvoiceBalances temp table
-- Group by InvNumber to calculate net balance and invoice date
-- ============================================================================

SELECT 
    GSClientID
    ,ServLineCode
    ,MasterServiceLineCode
    ,InvNumber
    ,ISNULL(
        MIN(CASE WHEN Total > 0 THEN TranDate ELSE NULL END),
        @AsOfDate
    ) AS InvoiceDate
    ,ROUND(SUM(ISNULL(Total, 0)), 2) AS NetBalance
INTO #InvoiceBalances
FROM #AllTransactions
WHERE InvNumber IS NOT NULL AND InvNumber != ''
GROUP BY GSClientID, ServLineCode, MasterServiceLineCode, InvNumber

CREATE CLUSTERED INDEX IX_IB_Client_SL_Inv ON #InvoiceBalances (GSClientID, ServLineCode, MasterServiceLineCode, InvNumber)

-- ============================================================================
-- STEP 4: Detect offsetting pairs and exclude from aging
-- ============================================================================

SELECT DISTINCT 
    i1.GSClientID
    ,i1.ServLineCode
    ,i1.MasterServiceLineCode
    ,i1.InvNumber
INTO #ExcludedInvoices
FROM #InvoiceBalances i1
INNER JOIN #InvoiceBalances i2 
    ON i1.GSClientID = i2.GSClientID
    AND i1.ServLineCode = i2.ServLineCode
    AND i1.MasterServiceLineCode = i2.MasterServiceLineCode
    AND ROUND(i1.NetBalance + i2.NetBalance, 2) = 0
    AND i1.NetBalance <> 0
    AND i1.InvNumber <> i2.InvNumber

CREATE CLUSTERED INDEX IX_Excl_Client_SL_Inv ON #ExcludedInvoices (GSClientID, ServLineCode, MasterServiceLineCode, InvNumber)

-- ============================================================================
-- STEP 5: AgingCalculation temp table
-- Calculate days outstanding and assign to buckets
-- ============================================================================

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
INTO #AgingCalculation
FROM #InvoiceBalances ib
WHERE NOT EXISTS (
    SELECT 1 FROM #ExcludedInvoices ei 
    WHERE ei.GSClientID = ib.GSClientID 
    AND ei.ServLineCode = ib.ServLineCode
    AND ei.MasterServiceLineCode = ib.MasterServiceLineCode
    AND ei.InvNumber = ib.InvNumber
)
AND ROUND(ib.NetBalance, 2) <> 0

CREATE CLUSTERED INDEX IX_Aging_Client_SL ON #AgingCalculation (GSClientID, ServLineCode, MasterServiceLineCode)

-- ============================================================================
-- STEP 6: ClientServiceLineAging temp table
-- Aggregate aging buckets per client-serviceline
-- ============================================================================

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
INTO #ClientServiceLineAging
FROM #AgingCalculation
GROUP BY GSClientID, ServLineCode, MasterServiceLineCode

CREATE CLUSTERED INDEX IX_CSA_Client_SL ON #ClientServiceLineAging (GSClientID, ServLineCode, MasterServiceLineCode)

-- ============================================================================
-- STEP 7: CurrentPeriodMetrics temp table
-- Calculate receipts AND billings in the current period (last 30 days)
-- Receipts: EntryType = 'Receipt', use -Total (handles reversals correctly)
-- ============================================================================

SELECT 
    GSClientID
    ,ServLineCode
    ,MasterServiceLineCode
    ,ROUND(SUM(CASE WHEN EntryType = 'Receipt' THEN -Total ELSE 0 END), 2) AS CurrentPeriodReceipts
    ,ROUND(SUM(CASE WHEN Total > 0 THEN Total ELSE 0 END), 2) AS CurrentPeriodBillings
INTO #CurrentPeriodMetrics
FROM #AllTransactions
WHERE TranDate > DATEADD(DAY, -30, @AsOfDate)
  AND TranDate <= @AsOfDate
GROUP BY GSClientID, ServLineCode, MasterServiceLineCode

CREATE CLUSTERED INDEX IX_CPM_Client_SL ON #CurrentPeriodMetrics (GSClientID, ServLineCode, MasterServiceLineCode)

-- ============================================================================
-- STEP 8: PriorBalance temp table
-- Calculate balance before the current period (30 days ago)
-- ============================================================================

SELECT 
    GSClientID
    ,ServLineCode
    ,MasterServiceLineCode
    ,ROUND(SUM(ISNULL(Total, 0)), 2) AS PriorMonthBalance
INTO #PriorBalance
FROM #AllTransactions
WHERE TranDate < DATEADD(DAY, -30, @AsOfDate)
GROUP BY GSClientID, ServLineCode, MasterServiceLineCode

CREATE CLUSTERED INDEX IX_PB_Client_SL ON #PriorBalance (GSClientID, ServLineCode, MasterServiceLineCode)

-- ============================================================================
-- STEP 9: Final SELECT - Join all temp tables
-- ============================================================================

SELECT 
    cb.GSClientID
    ,cb.ClientCode
    ,cb.ClientNameFull
    ,cb.GroupCode
    ,cb.GroupDesc
    ,cb.ServLineCode
    ,cb.ServLineDesc
    ,cb.MasterServiceLineCode
    ,ISNULL(slm.name, cb.ServLineDesc) AS MasterServiceLineName
    ,cb.SubServlineGroupCode
    ,cb.SubServlineGroupDesc
    ,cb.TotalBalance
    ,ISNULL(ca.InvoiceCount, 0) AS InvoiceCount
    ,ISNULL(ca.AgingCurrent, 0) AS AgingCurrent
    ,ISNULL(ca.Aging31_60, 0) AS Aging31_60
    ,ISNULL(ca.Aging61_90, 0) AS Aging61_90
    ,ISNULL(ca.Aging91_120, 0) AS Aging91_120
    ,ISNULL(ca.Aging120Plus, 0) AS Aging120Plus
    ,ISNULL(ca.AvgDaysOutstanding, 0) AS AvgDaysOutstanding
    ,ISNULL(cpm.CurrentPeriodReceipts, 0) AS CurrentPeriodReceipts
    ,ISNULL(cpm.CurrentPeriodBillings, 0) AS CurrentPeriodBillings
    ,ISNULL(pb.PriorMonthBalance, 0) AS PriorMonthBalance
FROM #ClientServiceLineBalance cb
LEFT JOIN #ClientServiceLineAging ca 
    ON cb.GSClientID = ca.GSClientID 
    AND cb.ServLineCode = ca.ServLineCode
    AND cb.MasterServiceLineCode = ca.MasterServiceLineCode
LEFT JOIN #CurrentPeriodMetrics cpm 
    ON cb.GSClientID = cpm.GSClientID 
    AND cb.ServLineCode = cpm.ServLineCode
    AND cb.MasterServiceLineCode = cpm.MasterServiceLineCode
LEFT JOIN #PriorBalance pb 
    ON cb.GSClientID = pb.GSClientID 
    AND cb.ServLineCode = pb.ServLineCode
    AND cb.MasterServiceLineCode = pb.MasterServiceLineCode
LEFT JOIN ServiceLineMaster slm ON cb.MasterServiceLineCode = slm.code AND slm.active = 1
ORDER BY cb.GroupCode, cb.ClientCode, cb.ServLineCode

-- ============================================================================
-- CLEANUP
-- ============================================================================

DROP TABLE #AllTransactions
DROP TABLE #ClientServiceLineBalance
DROP TABLE #InvoiceBalances
DROP TABLE #ExcludedInvoices
DROP TABLE #AgingCalculation
DROP TABLE #ClientServiceLineAging
DROP TABLE #CurrentPeriodMetrics
DROP TABLE #PriorBalance

GO
