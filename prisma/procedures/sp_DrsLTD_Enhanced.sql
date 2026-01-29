-- ============================================================================
-- Enhanced DrsLTD Stored Procedure (v2.0)
-- Client-level debtors aggregation with aging buckets
-- ============================================================================
--
-- PURPOSE:
-- Returns client-level debtors metrics with aging analysis for Recoverability.
-- Calculates aging buckets based on invoice age as of the @AsOfDate.
--
-- CHANGES from v1.0:
-- 1. Added aging bucket columns (Current, 31-60, 61-90, 91-120, 120+)
-- 2. Added @AsOfDate parameter for point-in-time aging
-- 3. Added invoice count and average payment days
--
-- USED BY:
-- - My Reports Recoverability (Aging Tab)
--
-- INDEXES USED:
-- - idx_drs_biller_super_covering
-- - idx_drs_gsclientid_super_covering
--
-- ============================================================================

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[DrsLTD]
     @ServLineCode nvarchar(max)  = '*'
    ,@GroupCode nvarchar(max)     = '*'
    ,@ClientCode nvarchar(max)    = '*'
    ,@BillerCode nvarchar(max)    = '*'
    ,@DateFrom datetime           = '1900/01/01'
    ,@DateTo datetime             = '2025/01/01'
    ,@AsOfDate datetime           = NULL  -- For aging calculation (defaults to @DateTo)
AS

SET NOCOUNT ON

-- Default @AsOfDate to @DateTo if not provided
SET @AsOfDate = ISNULL(@AsOfDate, @DateTo)

;WITH DrsTran AS (
    SELECT 
        d.GSClientID
        ,d.ClientCode
        ,d.ClientNameFull
        ,d.GroupCode
        ,d.GroupDesc
        ,d.ServLineCode
        ,d.ServLineDesc
        ,d.OfficeCode
        ,d.OfficeDesc
        ,d.Biller
        ,d.BillerName
        ,d.ClientPartner
        ,d.ClientPartnerName
        ,d.ClientManager
        ,d.ClientManagerName
        ,d.TranDate
        ,d.EntryType
        ,d.InvNumber
        ,d.Total
        -- Entry type aggregations
        ,CASE WHEN d.EntryType = 'Invoice' THEN ISNULL(d.Total, 0) ELSE 0 END AS Invoiced
        ,CASE WHEN d.EntryType = 'Credit Note' THEN ISNULL(d.Total, 0) ELSE 0 END AS CreditNotes
        ,CASE WHEN d.EntryType = 'Receipt' THEN 0 - ISNULL(d.Total, 0) ELSE 0 END AS Receipts
        ,CASE WHEN d.EntryType = 'Journal' THEN ISNULL(d.Total, 0) ELSE 0 END AS Journals
        ,CASE WHEN d.EntryType = 'Write Off' THEN ISNULL(d.Total, 0) ELSE 0 END AS WriteOffs
        -- Balance calculation
        ,CASE WHEN d.EntryType = 'Receipt' THEN 0 - ISNULL(d.Total, 0)
              WHEN d.EntryType IN ('Invoice', 'Credit Note', 'Journal', 'Write Off') THEN ISNULL(d.Total, 0)
              ELSE 0 END AS BalDrsChange
    FROM DrsTransactions d
    WHERE d.TranDate >= @DateFrom
      AND d.TranDate <= @DateTo
      AND (d.ClientCode = @ClientCode OR @ClientCode = '*')
      AND (d.GroupCode = @GroupCode OR @GroupCode = '*')
      AND (d.ServLineCode = @ServLineCode OR @ServLineCode = '*')
      AND (d.Biller = @BillerCode OR @BillerCode = '*')
)
-- Calculate invoice-level aging
, InvoiceAging AS (
    SELECT 
        GSClientID
        ,InvNumber
        ,MIN(TranDate) AS InvoiceDate
        ,SUM(CASE WHEN EntryType = 'Invoice' THEN ISNULL(Total, 0) ELSE 0 END) AS InvoiceAmount
        ,SUM(CASE WHEN EntryType = 'Receipt' THEN ISNULL(Total, 0) ELSE 0 END) AS ReceiptAmount
        ,SUM(CASE WHEN EntryType = 'Credit Note' THEN ISNULL(Total, 0) ELSE 0 END) AS CreditAmount
    FROM DrsTran
    WHERE InvNumber IS NOT NULL AND InvNumber != ''
    GROUP BY GSClientID, InvNumber
)
, InvoiceBalances AS (
    SELECT 
        GSClientID
        ,InvNumber
        ,InvoiceDate
        ,(InvoiceAmount - ReceiptAmount + CreditAmount) AS NetBalance
        ,DATEDIFF(DAY, InvoiceDate, @AsOfDate) AS DaysOutstanding
    FROM InvoiceAging
    WHERE (InvoiceAmount - ReceiptAmount + CreditAmount) > 0.01  -- Only open invoices
)
-- Client-level LTD aggregation
, ClientLTD AS (
    SELECT 
        d.GSClientID
        ,MAX(d.ClientCode) AS ClientCode
        ,MAX(d.ClientNameFull) AS ClientNameFull
        ,MAX(d.GroupCode) AS GroupCode
        ,MAX(d.GroupDesc) AS GroupDesc
        ,MAX(d.ServLineCode) AS ServLineCode
        ,MAX(d.ServLineDesc) AS ServLineDesc
        ,MAX(d.OfficeCode) AS OfficeCode
        ,MAX(d.OfficeDesc) AS OfficeDesc
        ,MAX(d.Biller) AS Biller
        ,MAX(d.BillerName) AS BillerName
        ,MAX(d.ClientPartner) AS ClientPartner
        ,MAX(d.ClientPartnerName) AS ClientPartnerName
        ,MAX(d.ClientManager) AS ClientManager
        ,MAX(d.ClientManagerName) AS ClientManagerName
        ,SUM(Invoiced) AS LTDInvoiced
        ,SUM(CreditNotes) AS LTDCreditNotes
        ,SUM(Receipts) AS LTDReceipts
        ,SUM(Journals) AS LTDJournals
        ,SUM(WriteOffs) AS LTDWriteOffs
        ,SUM(BalDrsChange) AS BalDrs
    FROM DrsTran d
    GROUP BY d.GSClientID
)
-- Client aging buckets
, ClientAging AS (
    SELECT 
        GSClientID
        ,COUNT(DISTINCT InvNumber) AS InvoiceCount
        ,SUM(CASE WHEN DaysOutstanding <= 30 THEN NetBalance ELSE 0 END) AS AgingCurrent
        ,SUM(CASE WHEN DaysOutstanding > 30 AND DaysOutstanding <= 60 THEN NetBalance ELSE 0 END) AS Aging31_60
        ,SUM(CASE WHEN DaysOutstanding > 60 AND DaysOutstanding <= 90 THEN NetBalance ELSE 0 END) AS Aging61_90
        ,SUM(CASE WHEN DaysOutstanding > 90 AND DaysOutstanding <= 120 THEN NetBalance ELSE 0 END) AS Aging91_120
        ,SUM(CASE WHEN DaysOutstanding > 120 THEN NetBalance ELSE 0 END) AS Aging120Plus
        ,AVG(CAST(DaysOutstanding AS FLOAT)) AS AvgDaysOutstanding
    FROM InvoiceBalances
    GROUP BY GSClientID
)

SELECT 
    ltd.GSClientID
    ,ltd.ClientCode
    ,ltd.ClientNameFull
    ,ltd.GroupCode
    ,ltd.GroupDesc
    ,ltd.ServLineCode
    ,ltd.ServLineDesc
    ,ltd.OfficeCode
    ,ltd.OfficeDesc
    ,ltd.Biller
    ,ltd.BillerName
    ,ltd.ClientPartner
    ,ltd.ClientPartnerName
    ,ltd.ClientManager
    ,ltd.ClientManagerName
    ,ltd.LTDInvoiced
    ,ltd.LTDCreditNotes
    ,ltd.LTDReceipts
    ,ltd.LTDJournals
    ,ltd.LTDWriteOffs
    ,ltd.BalDrs
    -- Aging buckets
    ,ISNULL(ag.InvoiceCount, 0) AS InvoiceCount
    ,ISNULL(ag.AgingCurrent, 0) AS AgingCurrent
    ,ISNULL(ag.Aging31_60, 0) AS Aging31_60
    ,ISNULL(ag.Aging61_90, 0) AS Aging61_90
    ,ISNULL(ag.Aging91_120, 0) AS Aging91_120
    ,ISNULL(ag.Aging120Plus, 0) AS Aging120Plus
    ,ISNULL(ag.AvgDaysOutstanding, 0) AS AvgDaysOutstanding
FROM ClientLTD ltd
LEFT JOIN ClientAging ag ON ltd.GSClientID = ag.GSClientID
ORDER BY ltd.GroupCode, ltd.ClientCode
;
GO

PRINT 'DrsLTD stored procedure (v2.0) created successfully';
PRINT 'New fields: AgingCurrent, Aging31_60, Aging61_90, Aging91_120, Aging120Plus, AvgDaysOutstanding, InvoiceCount';
PRINT '';
PRINT 'Example usage:';
PRINT '  -- All clients for a biller in FY2024';
PRINT '  EXEC dbo.DrsLTD @BillerCode = ''BLAW001'', @DateFrom = ''2023-09-01'', @DateTo = ''2024-08-31'';';
PRINT '';
PRINT '  -- Aging as of specific date';
PRINT '  EXEC dbo.DrsLTD @BillerCode = ''BLAW001'', @DateFrom = ''1900-01-01'', @DateTo = ''2024-01-31'', @AsOfDate = ''2024-01-31'';';
GO
