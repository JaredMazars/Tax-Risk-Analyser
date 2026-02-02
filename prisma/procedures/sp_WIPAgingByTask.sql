-- ============================================================================
-- sp_WIPAgingByTask Stored Procedure
-- WIP aging analysis by task with FIFO fee allocation
-- ============================================================================
--
-- PURPOSE:
-- Calculates WIP aging by task using FIFO (First-In, First-Out) methodology.
-- Fees are applied against the OLDEST WIP first, reducing aged balances
-- before current balances.
--
-- VERSION: 2.0 - FIFO Aging Implementation
-- PREVIOUS: 1.0 - Simple date-based aging (no FIFO)
--
-- KEY FEATURES:
-- 1. FIFO Fee Allocation: Credits reduce oldest WIP buckets first
-- 2. Dynamic SQL: Optimal index usage for any filter combination
-- 3. Temp Tables: Better query plan control for 5M+ row tables
-- 4. 7 Aging Buckets: Curr, 30, 60, 90, 120, 150, 180+ days
--
-- TRANSACTION TYPES:
-- - T (Time): Positive amount, increases WIP
-- - D (Disbursements): Positive amount, increases WIP
-- - ADJ (Adjustments): Positive increases WIP, negative reduces WIP
-- - F (Fees): ALWAYS reduces WIP (represents billing, regardless of Amount sign)
-- - P (Provisions): Positive amount, increases WIP (bad debt provisions)
--
-- CREDIT IDENTIFICATION:
-- Credits (amounts that reduce WIP via FIFO) are:
--   1. ALL F (Fee) transactions - F always reduces WIP regardless of Amount sign
--   2. Any NEGATIVE amounts from other TTypes (e.g., negative ADJ)
--
-- FIFO AGING LOGIC:
-- 1. Calculate GROSS WIP per bucket (positive T, D, ADJ, P amounts - excluding F)
-- 2. Calculate total credits per task (all F amounts + negative amounts from other TTypes)
-- 3. Apply credits FIFO: Bal180 first, then Bal150, Bal120, Bal90, Bal60, Bal30, Curr
-- 4. Output NET WIP per bucket after credit allocation
--
-- EXAMPLE:
-- Task has: Time=$100 in Bal180, $50 in Bal60, $200 in Curr
--           Fee (F)=$50, Negative ADJ=$70 (Total Credits = $120)
-- FIFO Allocation (credits applied oldest first):
--   - Bal180: $100 - $100 = $0 (fully absorbed, $20 credits remaining)
--   - Bal60: $50 - $20 = $30 (partially absorbed, $0 credits remaining)
--   - Curr: $200 - $0 = $200 (unchanged)
-- Result: Bal180=0, Bal60=30, Curr=200, BalWip=230
--
-- AGING BUCKETS (based on days since transaction date):
-- - Curr: 0-30 days
-- - Bal30: 31-60 days
-- - Bal60: 61-90 days
-- - Bal90: 91-120 days
-- - Bal120: 121-150 days
-- - Bal150: 151-180 days
-- - Bal180: 180+ days
--
-- PERFORMANCE OPTIMIZATIONS:
-- 1. Dynamic SQL avoids catch-all parameter pattern
-- 2. Temp tables with targeted indexes
-- 3. Set-based FIFO calculation (no cursors)
-- 4. OPTION (RECOMPILE) for optimal plan per execution
--
-- REQUIRED INDEXES:
-- - idx_WIPTransactions_FIFO_Aging (primary)
-- - idx_WIPTransactions_Partner_FIFO (partner filter)
-- - idx_WIPTransactions_Manager_FIFO (manager filter)
-- - idx_WIPTransactions_ServLine_FIFO (service line filter)
-- See: sp_WIPAgingByTask_FIFO_indexes.sql
--
-- USED BY:
-- - WIP Aging Reports
-- - Partner/Manager WIP Analysis
-- - Financial Dashboards
--
-- ============================================================================

CREATE OR ALTER PROCEDURE [dbo].[sp_WIPAgingByTask]
     @TaskPartner nvarchar(max) = '*'
    ,@TaskManager nvarchar(max) = '*'
    ,@ClientCode nvarchar(max) = '*'
    ,@GroupCode nvarchar(max) = '*'
    ,@ServLineCode nvarchar(max) = '*'
    ,@TaskCode nvarchar(max) = '*'
    ,@AsOfDate datetime = NULL
AS

SET NOCOUNT ON;
SET XACT_ABORT ON;

-- ============================================================================
-- INITIALIZATION
-- ============================================================================

-- Default @AsOfDate to current date if not provided
SET @AsOfDate = ISNULL(@AsOfDate, GETDATE());

-- Clean up any existing temp tables (safety for re-execution)
IF OBJECT_ID('tempdb..#FilteredTransactions') IS NOT NULL DROP TABLE #FilteredTransactions;
IF OBJECT_ID('tempdb..#GrossWIP') IS NOT NULL DROP TABLE #GrossWIP;
IF OBJECT_ID('tempdb..#TaskCredits') IS NOT NULL DROP TABLE #TaskCredits;
IF OBJECT_ID('tempdb..#FIFOAging') IS NOT NULL DROP TABLE #FIFOAging;
IF OBJECT_ID('tempdb..#TaskMetadata') IS NOT NULL DROP TABLE #TaskMetadata;

-- ============================================================================
-- PHASE 1: Create temp table for filtered transactions
-- ============================================================================
-- Using dynamic SQL to avoid catch-all parameter pattern which kills performance.
-- Each filter combination gets an optimal execution plan.
-- ============================================================================

CREATE TABLE #FilteredTransactions (
    RowID int IDENTITY(1,1) PRIMARY KEY,
    GSTaskID uniqueidentifier NOT NULL,
    GSClientID uniqueidentifier NULL,
    TaskCode nvarchar(10) NOT NULL,
    ClientCode nvarchar(10) NOT NULL,
    GroupCode nvarchar(10) NULL,
    ServLineCode nvarchar(10) NOT NULL,
    ServLineDesc nvarchar(150) NOT NULL,
    TaskPartner nvarchar(10) NOT NULL,
    PartnerName nvarchar(50) NOT NULL,
    TaskManager nvarchar(10) NOT NULL,
    ManagerName nvarchar(50) NOT NULL,
    TaskDesc nvarchar(150) NOT NULL,
    ClientName nvarchar(259) NULL,
    GroupDesc nvarchar(150) NULL,
    TranDate datetime2 NOT NULL,
    TType varchar(3) NOT NULL,
    Amount money NULL,
    DaysOld int NOT NULL,
    AgingBucket tinyint NOT NULL  -- 1=Bal180, 2=Bal150, 3=Bal120, 4=Bal90, 5=Bal60, 6=Bal30, 7=Curr
);

-- Build dynamic SQL with only the necessary WHERE conditions
DECLARE @SQL nvarchar(max);
DECLARE @Where nvarchar(max) = N'WHERE w.TranDate <= @pAsOfDate';

-- Add filter conditions only for non-wildcard parameters
IF @TaskPartner <> '*'
    SET @Where = @Where + N' AND w.TaskPartner = @pTaskPartner';
IF @TaskManager <> '*'
    SET @Where = @Where + N' AND w.TaskManager = @pTaskManager';
IF @ClientCode <> '*'
    SET @Where = @Where + N' AND w.ClientCode = @pClientCode';
IF @GroupCode <> '*'
    SET @Where = @Where + N' AND w.GroupCode = @pGroupCode';
IF @ServLineCode <> '*'
    SET @Where = @Where + N' AND w.TaskServLine = @pServLineCode';
IF @TaskCode <> '*'
    SET @Where = @Where + N' AND w.TaskCode = @pTaskCode';

SET @SQL = N'
INSERT INTO #FilteredTransactions (
    GSTaskID, GSClientID, TaskCode, ClientCode, GroupCode,
    ServLineCode, ServLineDesc, TaskPartner, PartnerName,
    TaskManager, ManagerName, TaskDesc, ClientName, GroupDesc,
    TranDate, TType, Amount, DaysOld, AgingBucket
)
SELECT 
    w.GSTaskID,
    w.GSClientID,
    w.TaskCode,
    w.ClientCode,
    w.GroupCode,
    w.TaskServLine,
    w.TaskServLineDesc,
    w.TaskPartner,
    w.PartnerName,
    w.TaskManager,
    w.ManagerName,
    w.TaskDesc,
    w.ClientName,
    w.GroupDesc,
    w.TranDate,
    w.TType,
    w.Amount,
    DATEDIFF(DAY, w.TranDate, @pAsOfDate) AS DaysOld,
    -- Aging bucket: 1=oldest (Bal180), 7=newest (Curr)
    CASE 
        WHEN DATEDIFF(DAY, w.TranDate, @pAsOfDate) > 180 THEN 1  -- Bal180 (oldest)
        WHEN DATEDIFF(DAY, w.TranDate, @pAsOfDate) > 150 THEN 2  -- Bal150
        WHEN DATEDIFF(DAY, w.TranDate, @pAsOfDate) > 120 THEN 3  -- Bal120
        WHEN DATEDIFF(DAY, w.TranDate, @pAsOfDate) > 90 THEN 4   -- Bal90
        WHEN DATEDIFF(DAY, w.TranDate, @pAsOfDate) > 60 THEN 5   -- Bal60
        WHEN DATEDIFF(DAY, w.TranDate, @pAsOfDate) > 30 THEN 6   -- Bal30
        ELSE 7                                                     -- Curr (newest)
    END AS AgingBucket
FROM WIPTransactions w WITH (NOLOCK)
' + @Where + N'
OPTION (RECOMPILE);';

-- Execute dynamic SQL with parameters
EXEC sp_executesql @SQL,
    N'@pAsOfDate datetime, @pTaskPartner nvarchar(max), @pTaskManager nvarchar(max), 
      @pClientCode nvarchar(max), @pGroupCode nvarchar(max), @pServLineCode nvarchar(max), 
      @pTaskCode nvarchar(max)',
    @pAsOfDate = @AsOfDate,
    @pTaskPartner = @TaskPartner,
    @pTaskManager = @TaskManager,
    @pClientCode = @ClientCode,
    @pGroupCode = @GroupCode,
    @pServLineCode = @ServLineCode,
    @pTaskCode = @TaskCode;

-- Create index on temp table for efficient grouping and Amount-based filtering
CREATE NONCLUSTERED INDEX IX_Filtered_Task_Bucket 
ON #FilteredTransactions(GSTaskID, AgingBucket) 
INCLUDE (Amount, TType);

-- ============================================================================
-- PHASE 2: Calculate GROSS WIP per bucket (positive amounts, excluding F)
-- ============================================================================
-- Gross WIP includes POSITIVE amounts for T, D, ADJ, P (NOT F)
-- F transactions always reduce WIP (handled in credits)
-- Negative amounts are also handled separately in credits
-- ============================================================================

SELECT 
    GSTaskID,
    -- Gross amounts by bucket (oldest to newest: 1-7) - positive non-F amounts only
    ROUND(SUM(CASE WHEN AgingBucket = 1 AND ISNULL(Amount, 0) > 0 AND TType <> 'F' THEN Amount ELSE 0 END), 2) AS GrossBal180,
    ROUND(SUM(CASE WHEN AgingBucket = 2 AND ISNULL(Amount, 0) > 0 AND TType <> 'F' THEN Amount ELSE 0 END), 2) AS GrossBal150,
    ROUND(SUM(CASE WHEN AgingBucket = 3 AND ISNULL(Amount, 0) > 0 AND TType <> 'F' THEN Amount ELSE 0 END), 2) AS GrossBal120,
    ROUND(SUM(CASE WHEN AgingBucket = 4 AND ISNULL(Amount, 0) > 0 AND TType <> 'F' THEN Amount ELSE 0 END), 2) AS GrossBal90,
    ROUND(SUM(CASE WHEN AgingBucket = 5 AND ISNULL(Amount, 0) > 0 AND TType <> 'F' THEN Amount ELSE 0 END), 2) AS GrossBal60,
    ROUND(SUM(CASE WHEN AgingBucket = 6 AND ISNULL(Amount, 0) > 0 AND TType <> 'F' THEN Amount ELSE 0 END), 2) AS GrossBal30,
    ROUND(SUM(CASE WHEN AgingBucket = 7 AND ISNULL(Amount, 0) > 0 AND TType <> 'F' THEN Amount ELSE 0 END), 2) AS GrossCurr,
    -- Total gross WIP (positive non-F amounts only)
    ROUND(SUM(CASE WHEN ISNULL(Amount, 0) > 0 AND TType <> 'F' THEN Amount ELSE 0 END), 2) AS TotalGrossWIP,
    -- Total provisions (for reporting)
    ROUND(SUM(CASE WHEN TType = 'P' AND ISNULL(Amount, 0) > 0 THEN Amount ELSE 0 END), 2) AS TotalProvision
INTO #GrossWIP
FROM #FilteredTransactions
GROUP BY GSTaskID;

-- ============================================================================
-- PHASE 3: Calculate total credits per task
-- ============================================================================
-- Credits include:
--   1. ALL F (Fee) transactions (regardless of Amount sign - F always reduces WIP)
--   2. Any negative amounts from other TTypes (e.g., negative ADJ)
-- We take the absolute value for FIFO allocation
-- ============================================================================

SELECT 
    GSTaskID,
    ROUND(SUM(
        CASE 
            WHEN TType = 'F' THEN ABS(ISNULL(Amount, 0))  -- F always reduces WIP
            WHEN ISNULL(Amount, 0) < 0 THEN ABS(Amount)   -- Negative amounts reduce WIP
            ELSE 0 
        END
    ), 2) AS TotalCredits
INTO #TaskCredits
FROM #FilteredTransactions
WHERE TType = 'F' OR ISNULL(Amount, 0) < 0
GROUP BY GSTaskID;

-- ============================================================================
-- PHASE 4: FIFO Credit Allocation
-- ============================================================================
-- Apply credits against oldest buckets first (Bal180 -> Bal150 -> ... -> Curr)
-- Using cascading subtraction with running remainder
-- ============================================================================

SELECT 
    g.GSTaskID,
    
    -- Gross amounts (for reference/debugging)
    g.GrossBal180, g.GrossBal150, g.GrossBal120, g.GrossBal90, 
    g.GrossBal60, g.GrossBal30, g.GrossCurr,
    
    -- Total credits to apply
    ISNULL(c.TotalCredits, 0) AS TotalCredits,
    
    -- FIFO Allocation: Apply credits from oldest to newest
    -- Step 1: Bal180 absorbs credits first
    CASE 
        WHEN ISNULL(c.TotalCredits, 0) >= g.GrossBal180 THEN 0  -- Fully absorbed
        ELSE g.GrossBal180 - ISNULL(c.TotalCredits, 0)          -- Partially absorbed
    END AS NetBal180,
    
    -- Remaining credits after Bal180
    CASE 
        WHEN ISNULL(c.TotalCredits, 0) > g.GrossBal180 
        THEN ISNULL(c.TotalCredits, 0) - g.GrossBal180 
        ELSE 0 
    END AS CreditsAfter180,
    
    -- Step 2: Bal150 absorbs remaining credits
    CASE 
        WHEN ISNULL(c.TotalCredits, 0) <= g.GrossBal180 THEN g.GrossBal150  -- No credits left
        WHEN ISNULL(c.TotalCredits, 0) - g.GrossBal180 >= g.GrossBal150 THEN 0  -- Fully absorbed
        ELSE g.GrossBal150 - (ISNULL(c.TotalCredits, 0) - g.GrossBal180)  -- Partially absorbed
    END AS NetBal150,
    
    -- Running credits remaining after each bucket (for subsequent calculations)
    -- Credits remaining after Bal180 + Bal150
    CASE 
        WHEN ISNULL(c.TotalCredits, 0) > g.GrossBal180 + g.GrossBal150 
        THEN ISNULL(c.TotalCredits, 0) - g.GrossBal180 - g.GrossBal150 
        ELSE 0 
    END AS CreditsAfter150,
    
    -- Provision for output
    g.TotalProvision
    
INTO #FIFOAging
FROM #GrossWIP g
LEFT JOIN #TaskCredits c ON g.GSTaskID = c.GSTaskID;

-- ============================================================================
-- PHASE 5: Complete FIFO calculation for all buckets
-- ============================================================================
-- Calculate net amounts for remaining buckets (Bal120 through Curr)
-- Using set-based approach with cascading credit absorption
-- ============================================================================

;WITH FIFOComplete AS (
    SELECT 
        fa.GSTaskID,
        
        -- Net amounts for first two buckets (already calculated)
        fa.NetBal180,
        fa.NetBal150,
        
        -- Bal120: Absorb remaining credits after Bal180+Bal150
        CASE 
            WHEN fa.CreditsAfter150 <= 0 THEN fa.GrossBal120
            WHEN fa.CreditsAfter150 >= fa.GrossBal120 THEN 0
            ELSE fa.GrossBal120 - fa.CreditsAfter150
        END AS NetBal120,
        
        -- Credits remaining after Bal120
        CASE 
            WHEN fa.CreditsAfter150 > fa.GrossBal120 
            THEN fa.CreditsAfter150 - fa.GrossBal120 
            ELSE 0 
        END AS CreditsAfter120,
        
        -- Store gross values for subsequent calculations
        fa.GrossBal90,
        fa.GrossBal60,
        fa.GrossBal30,
        fa.GrossCurr,
        fa.TotalCredits,
        fa.TotalProvision
    FROM #FIFOAging fa
),
FIFOBal90 AS (
    SELECT 
        fc.*,
        -- Bal90: Absorb remaining credits after Bal120
        CASE 
            WHEN fc.CreditsAfter120 <= 0 THEN fc.GrossBal90
            WHEN fc.CreditsAfter120 >= fc.GrossBal90 THEN 0
            ELSE fc.GrossBal90 - fc.CreditsAfter120
        END AS NetBal90,
        -- Credits remaining after Bal90
        CASE 
            WHEN fc.CreditsAfter120 > fc.GrossBal90 
            THEN fc.CreditsAfter120 - fc.GrossBal90 
            ELSE 0 
        END AS CreditsAfter90
    FROM FIFOComplete fc
),
FIFOBal60 AS (
    SELECT 
        fb.*,
        -- Bal60: Absorb remaining credits after Bal90
        CASE 
            WHEN fb.CreditsAfter90 <= 0 THEN fb.GrossBal60
            WHEN fb.CreditsAfter90 >= fb.GrossBal60 THEN 0
            ELSE fb.GrossBal60 - fb.CreditsAfter90
        END AS NetBal60,
        -- Credits remaining after Bal60
        CASE 
            WHEN fb.CreditsAfter90 > fb.GrossBal60 
            THEN fb.CreditsAfter90 - fb.GrossBal60 
            ELSE 0 
        END AS CreditsAfter60
    FROM FIFOBal90 fb
),
FIFOBal30 AS (
    SELECT 
        f6.*,
        -- Bal30: Absorb remaining credits after Bal60
        CASE 
            WHEN f6.CreditsAfter60 <= 0 THEN f6.GrossBal30
            WHEN f6.CreditsAfter60 >= f6.GrossBal30 THEN 0
            ELSE f6.GrossBal30 - f6.CreditsAfter60
        END AS NetBal30,
        -- Credits remaining after Bal30
        CASE 
            WHEN f6.CreditsAfter60 > f6.GrossBal30 
            THEN f6.CreditsAfter60 - f6.GrossBal30 
            ELSE 0 
        END AS CreditsAfter30
    FROM FIFOBal60 f6
),
FIFOFinal AS (
    SELECT 
        f3.*,
        -- Curr: Absorb remaining credits after Bal30
        CASE 
            WHEN f3.CreditsAfter30 <= 0 THEN f3.GrossCurr
            WHEN f3.CreditsAfter30 >= f3.GrossCurr THEN 0
            ELSE f3.GrossCurr - f3.CreditsAfter30
        END AS NetCurr,
        -- Excess credits (if credits > total gross WIP)
        CASE 
            WHEN f3.CreditsAfter30 > f3.GrossCurr 
            THEN f3.CreditsAfter30 - f3.GrossCurr 
            ELSE 0 
        END AS ExcessCredits
    FROM FIFOBal30 f3
)
SELECT 
    GSTaskID,
    ROUND(NetBal180, 2) AS Bal180,
    ROUND(NetBal150, 2) AS Bal150,
    ROUND(NetBal120, 2) AS Bal120,
    ROUND(NetBal90, 2) AS Bal90,
    ROUND(NetBal60, 2) AS Bal60,
    ROUND(NetBal30, 2) AS Bal30,
    ROUND(NetCurr, 2) AS Curr,
    ROUND(TotalCredits, 2) AS TotalCredits,
    ROUND(TotalProvision, 2) AS TotalProvision,
    ROUND(ExcessCredits, 2) AS ExcessCredits
INTO #FIFOResult
FROM FIFOFinal;

-- ============================================================================
-- PHASE 6: Get task metadata (one row per task)
-- ============================================================================

SELECT 
    GSTaskID,
    MAX(GSClientID) AS GSClientID,
    MAX(TaskCode) AS TaskCode,
    MAX(ClientCode) AS ClientCode,
    MAX(GroupCode) AS GroupCode,
    MAX(ServLineCode) AS ServLineCode,
    MAX(ServLineDesc) AS ServLineDesc,
    MAX(TaskPartner) AS TaskPartner,
    MAX(PartnerName) AS PartnerName,
    MAX(TaskManager) AS TaskManager,
    MAX(ManagerName) AS ManagerName,
    MAX(TaskDesc) AS TaskDesc,
    MAX(ClientName) AS ClientName,
    MAX(GroupDesc) AS GroupDesc
INTO #TaskMetadata
FROM #FilteredTransactions
GROUP BY GSTaskID;

-- ============================================================================
-- FINAL OUTPUT
-- ============================================================================
-- Combine task metadata with FIFO-aged WIP amounts
-- Output columns match original SP for backward compatibility
-- ============================================================================

SELECT 
    -- Task identifiers
    tm.GSTaskID,
    tm.GSClientID,
    tm.TaskCode,
    tm.ClientCode,
    tm.GroupCode,
    tm.ServLineCode,
    tm.TaskPartner,
    tm.TaskManager,
    
    -- Descriptive fields
    tm.TaskDesc,
    tm.ClientName,
    tm.GroupDesc,
    tm.ServLineDesc,
    tm.PartnerName,
    tm.ManagerName,
    
    -- FIFO-aged WIP by bucket (note: order is Curr first in output, but FIFO applied oldest first)
    ROUND(ISNULL(fr.Curr, 0), 2) AS Curr,
    ROUND(ISNULL(fr.Bal30, 0), 2) AS Bal30,
    ROUND(ISNULL(fr.Bal60, 0), 2) AS Bal60,
    ROUND(ISNULL(fr.Bal90, 0), 2) AS Bal90,
    ROUND(ISNULL(fr.Bal120, 0), 2) AS Bal120,
    ROUND(ISNULL(fr.Bal150, 0), 2) AS Bal150,
    ROUND(ISNULL(fr.Bal180, 0), 2) AS Bal180,
    
    -- Total WIP (sum of all net buckets)
    ROUND(ISNULL(fr.Curr, 0) + ISNULL(fr.Bal30, 0) + ISNULL(fr.Bal60, 0) + 
          ISNULL(fr.Bal90, 0) + ISNULL(fr.Bal120, 0) + ISNULL(fr.Bal150, 0) + 
          ISNULL(fr.Bal180, 0), 2) AS BalWip,
    
    -- Credit and provision totals for reference
    ROUND(-ISNULL(fr.TotalCredits, 0), 2) AS PtdFeeAmt,  -- Negative to match original convention (credits applied)
    ROUND(ISNULL(fr.TotalProvision, 0), 2) AS Provision,
    
    -- Net WIP (same as BalWip - both represent net after FIFO)
    ROUND(ISNULL(fr.Curr, 0) + ISNULL(fr.Bal30, 0) + ISNULL(fr.Bal60, 0) + 
          ISNULL(fr.Bal90, 0) + ISNULL(fr.Bal120, 0) + ISNULL(fr.Bal150, 0) + 
          ISNULL(fr.Bal180, 0), 2) AS NettWip

FROM #TaskMetadata tm
LEFT JOIN #FIFOResult fr ON tm.GSTaskID = fr.GSTaskID
ORDER BY tm.TaskPartner, tm.ClientCode, tm.TaskCode;

-- ============================================================================
-- CLEANUP
-- ============================================================================

DROP TABLE IF EXISTS #FilteredTransactions;
DROP TABLE IF EXISTS #GrossWIP;
DROP TABLE IF EXISTS #TaskCredits;
DROP TABLE IF EXISTS #FIFOAging;
DROP TABLE IF EXISTS #FIFOResult;
DROP TABLE IF EXISTS #TaskMetadata;

GO
