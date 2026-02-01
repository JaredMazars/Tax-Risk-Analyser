-- ============================================================================
-- sp_WIPAgingByTask Stored Procedure
-- WIP aging analysis by task with FIFO fee application
-- ============================================================================
--
-- PURPOSE:
-- Calculates WIP aging by task with aging buckets (Current, 30, 60, 90, 120, 150, 180+ days).
-- When fees or provisions are raised/reversed, they offset the oldest aging balance first (FIFO).
--
-- KEY FEATURES:
-- 1. Groups by Task (one row per task)
-- 2. Ages WIP buildup transactions (T, D, ADJ, P) into 7 buckets based on transaction date
-- 3. Applies fees (F type) using FIFO logic - oldest balances offset first
-- 4. Returns both gross (before fees) and net (after fees) aging balances
-- 5. Multiple filter options: Partner, Manager, Client, Group, ServiceLine, Task, Date
-- 6. Explicit ROUND() to prevent rounding errors
-- 7. Includes descriptive fields for rich reporting
--
-- TRANSACTION TYPES:
-- - T (Time): Increases WIP
-- - D (Disbursements): Increases WIP
-- - ADJ (Adjustments): Increases WIP
-- - F (Fees): Decreases WIP (billing/invoicing)
-- - P (Provisions): Increases WIP (bad debt provisions)
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
-- FIFO LOGIC:
-- Fees offset aging buckets in order: Bal180 → Bal150 → Bal120 → Bal90 → Bal60 → Bal30 → Curr
-- (Oldest balances are reduced first)
--
-- USED BY:
-- - WIP Aging Reports
-- - Partner/Manager WIP Analysis
--
-- INDEXES USED:
-- - WIPTransactions_GSTaskID_idx (existing)
-- - Consider: idx_WIPTransactions_Aging_COVERING for optimization
--
-- ============================================================================

-- Drop procedure if exists
IF OBJECT_ID('dbo.sp_WIPAgingByTask', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_WIPAgingByTask
GO

CREATE PROCEDURE [dbo].[sp_WIPAgingByTask]
     @TaskPartner nvarchar(max) = '*'
    ,@TaskManager nvarchar(max) = '*'
    ,@ClientCode nvarchar(max) = '*'
    ,@GroupCode nvarchar(max) = '*'
    ,@ServLineCode nvarchar(max) = '*'
    ,@TaskCode nvarchar(max) = '*'
    ,@AsOfDate datetime = NULL
AS

SET NOCOUNT ON

-- Default @AsOfDate to current date if not provided
SET @AsOfDate = ISNULL(@AsOfDate, GETDATE())

-- ============================================================================
-- CTE 1: AllTransactions
-- Fetch all WIP transactions matching filters up to AsOfDate
-- ============================================================================
;WITH AllTransactions AS (
    SELECT 
        w.GSTaskID
        ,w.GSClientID
        ,w.TaskCode
        ,w.ClientCode
        ,w.GroupCode
        ,w.TaskServLine AS ServLineCode
        ,w.TaskServLineDesc AS ServLineDesc
        ,w.TaskPartner
        ,w.PartnerName
        ,w.TaskManager
        ,w.ManagerName
        ,w.TaskDesc
        ,w.ClientName
        ,w.GroupDesc
        ,w.TranDate
        ,w.TType
        ,w.Amount
        ,DATEDIFF(DAY, w.TranDate, @AsOfDate) AS DaysOld
    FROM WIPTransactions w WITH (NOLOCK)
    WHERE w.TranDate <= @AsOfDate
      AND (@TaskPartner = '*' OR w.TaskPartner = @TaskPartner)
      AND (@TaskManager = '*' OR w.TaskManager = @TaskManager)
      AND (@ClientCode = '*' OR w.ClientCode = @ClientCode)
      AND (@GroupCode = '*' OR w.GroupCode = @GroupCode)
      AND (@ServLineCode = '*' OR w.TaskServLine = @ServLineCode)
      AND (@TaskCode = '*' OR w.TaskCode = @TaskCode)
)

-- ============================================================================
-- CTE 2: TaskMetadata
-- Get task-level metadata (one row per task)
-- ============================================================================
, TaskMetadata AS (
    SELECT 
        GSTaskID
        ,MAX(GSClientID) AS GSClientID
        ,MAX(TaskCode) AS TaskCode
        ,MAX(ClientCode) AS ClientCode
        ,MAX(GroupCode) AS GroupCode
        ,MAX(ServLineCode) AS ServLineCode
        ,MAX(ServLineDesc) AS ServLineDesc
        ,MAX(TaskPartner) AS TaskPartner
        ,MAX(PartnerName) AS PartnerName
        ,MAX(TaskManager) AS TaskManager
        ,MAX(ManagerName) AS ManagerName
        ,MAX(TaskDesc) AS TaskDesc
        ,MAX(ClientName) AS ClientName
        ,MAX(GroupDesc) AS GroupDesc
    FROM AllTransactions
    GROUP BY GSTaskID
)

-- ============================================================================
-- CTE 3: AgedWIP
-- Assign aging buckets to WIP buildup transactions (T, D, ADJ, P with positive amount)
-- ============================================================================
, AgedWIP AS (
    SELECT 
        GSTaskID
        ,Amount
        ,CASE 
            WHEN DaysOld < 0 THEN 'Curr'        -- Future dates (data errors) -> Current
            WHEN DaysOld <= 30 THEN 'Curr'      -- 0-30 days
            WHEN DaysOld <= 60 THEN 'Bal30'     -- 31-60 days
            WHEN DaysOld <= 90 THEN 'Bal60'     -- 61-90 days
            WHEN DaysOld <= 120 THEN 'Bal90'    -- 91-120 days
            WHEN DaysOld <= 150 THEN 'Bal120'   -- 121-150 days
            WHEN DaysOld <= 180 THEN 'Bal150'   -- 151-180 days
            ELSE 'Bal180'                        -- 180+ days
        END AS AgingBucket
    FROM AllTransactions
    WHERE TType IN ('T', 'D', 'ADJ', 'P')
      AND Amount > 0  -- Only positive amounts build up WIP
)

-- ============================================================================
-- CTE 4: GrossAgingByTask
-- Sum WIP by task and aging bucket (before fee application)
-- ============================================================================
, GrossAgingByTask AS (
    SELECT 
        GSTaskID
        ,ROUND(SUM(CASE WHEN AgingBucket = 'Curr' THEN Amount ELSE 0 END), 2) AS GrossCurr
        ,ROUND(SUM(CASE WHEN AgingBucket = 'Bal30' THEN Amount ELSE 0 END), 2) AS GrossBal30
        ,ROUND(SUM(CASE WHEN AgingBucket = 'Bal60' THEN Amount ELSE 0 END), 2) AS GrossBal60
        ,ROUND(SUM(CASE WHEN AgingBucket = 'Bal90' THEN Amount ELSE 0 END), 2) AS GrossBal90
        ,ROUND(SUM(CASE WHEN AgingBucket = 'Bal120' THEN Amount ELSE 0 END), 2) AS GrossBal120
        ,ROUND(SUM(CASE WHEN AgingBucket = 'Bal150' THEN Amount ELSE 0 END), 2) AS GrossBal150
        ,ROUND(SUM(CASE WHEN AgingBucket = 'Bal180' THEN Amount ELSE 0 END), 2) AS GrossBal180
    FROM AgedWIP
    GROUP BY GSTaskID
)

-- ============================================================================
-- CTE 5: FeesByTask
-- Sum fees (F type) to apply against gross WIP
-- ============================================================================
, FeesByTask AS (
    SELECT 
        GSTaskID
        ,ROUND(SUM(ABS(ISNULL(Amount, 0))), 2) AS TotalFees
    FROM AllTransactions
    WHERE TType = 'F'
    GROUP BY GSTaskID
)

-- ============================================================================
-- CTE 6: ProvisionsByTask
-- Sum provisions (P type) separately for reporting
-- ============================================================================
, ProvisionsByTask AS (
    SELECT 
        GSTaskID
        ,ROUND(SUM(ISNULL(Amount, 0)), 2) AS TotalProvision
    FROM AllTransactions
    WHERE TType = 'P'
    GROUP BY GSTaskID
)

-- ============================================================================
-- CTE 7: FIFOAllocation
-- Apply fees to aging buckets using FIFO logic (oldest first)
-- ============================================================================
, FIFOAllocation AS (
    SELECT 
        g.GSTaskID
        ,g.GrossCurr
        ,g.GrossBal30
        ,g.GrossBal60
        ,g.GrossBal90
        ,g.GrossBal120
        ,g.GrossBal150
        ,g.GrossBal180
        ,ISNULL(f.TotalFees, 0) AS TotalFees
        
        -- Calculate net balances using FIFO logic
        -- Step 1: Apply fees to Bal180 (oldest)
        ,CASE 
            WHEN ISNULL(f.TotalFees, 0) <= 0 THEN g.GrossBal180
            WHEN ISNULL(f.TotalFees, 0) >= g.GrossBal180 THEN 0
            ELSE g.GrossBal180 - ISNULL(f.TotalFees, 0)
        END AS NetBal180
        
        -- Step 2: Apply remaining fees to Bal150
        ,CASE 
            WHEN ISNULL(f.TotalFees, 0) <= g.GrossBal180 THEN g.GrossBal150
            WHEN (ISNULL(f.TotalFees, 0) - g.GrossBal180) >= g.GrossBal150 THEN 0
            ELSE g.GrossBal150 - (ISNULL(f.TotalFees, 0) - g.GrossBal180)
        END AS NetBal150
        
        -- Step 3: Apply remaining fees to Bal120
        ,CASE 
            WHEN ISNULL(f.TotalFees, 0) <= (g.GrossBal180 + g.GrossBal150) THEN g.GrossBal120
            WHEN (ISNULL(f.TotalFees, 0) - g.GrossBal180 - g.GrossBal150) >= g.GrossBal120 THEN 0
            ELSE g.GrossBal120 - (ISNULL(f.TotalFees, 0) - g.GrossBal180 - g.GrossBal150)
        END AS NetBal120
        
        -- Step 4: Apply remaining fees to Bal90
        ,CASE 
            WHEN ISNULL(f.TotalFees, 0) <= (g.GrossBal180 + g.GrossBal150 + g.GrossBal120) THEN g.GrossBal90
            WHEN (ISNULL(f.TotalFees, 0) - g.GrossBal180 - g.GrossBal150 - g.GrossBal120) >= g.GrossBal90 THEN 0
            ELSE g.GrossBal90 - (ISNULL(f.TotalFees, 0) - g.GrossBal180 - g.GrossBal150 - g.GrossBal120)
        END AS NetBal90
        
        -- Step 5: Apply remaining fees to Bal60
        ,CASE 
            WHEN ISNULL(f.TotalFees, 0) <= (g.GrossBal180 + g.GrossBal150 + g.GrossBal120 + g.GrossBal90) THEN g.GrossBal60
            WHEN (ISNULL(f.TotalFees, 0) - g.GrossBal180 - g.GrossBal150 - g.GrossBal120 - g.GrossBal90) >= g.GrossBal60 THEN 0
            ELSE g.GrossBal60 - (ISNULL(f.TotalFees, 0) - g.GrossBal180 - g.GrossBal150 - g.GrossBal120 - g.GrossBal90)
        END AS NetBal60
        
        -- Step 6: Apply remaining fees to Bal30
        ,CASE 
            WHEN ISNULL(f.TotalFees, 0) <= (g.GrossBal180 + g.GrossBal150 + g.GrossBal120 + g.GrossBal90 + g.GrossBal60) THEN g.GrossBal30
            WHEN (ISNULL(f.TotalFees, 0) - g.GrossBal180 - g.GrossBal150 - g.GrossBal120 - g.GrossBal90 - g.GrossBal60) >= g.GrossBal30 THEN 0
            ELSE g.GrossBal30 - (ISNULL(f.TotalFees, 0) - g.GrossBal180 - g.GrossBal150 - g.GrossBal120 - g.GrossBal90 - g.GrossBal60)
        END AS NetBal30
        
        -- Step 7: Apply remaining fees to Curr (newest)
        ,CASE 
            WHEN ISNULL(f.TotalFees, 0) <= (g.GrossBal180 + g.GrossBal150 + g.GrossBal120 + g.GrossBal90 + g.GrossBal60 + g.GrossBal30) THEN g.GrossCurr
            WHEN (ISNULL(f.TotalFees, 0) - g.GrossBal180 - g.GrossBal150 - g.GrossBal120 - g.GrossBal90 - g.GrossBal60 - g.GrossBal30) >= g.GrossCurr THEN 0
            ELSE g.GrossCurr - (ISNULL(f.TotalFees, 0) - g.GrossBal180 - g.GrossBal150 - g.GrossBal120 - g.GrossBal90 - g.GrossBal60 - g.GrossBal30)
        END AS NetCurr
        
    FROM GrossAgingByTask g
    LEFT JOIN FeesByTask f ON g.GSTaskID = f.GSTaskID
)

-- ============================================================================
-- Final Output
-- Combine task metadata, gross aging, net aging, and provisions
-- ============================================================================
SELECT 
    -- Task identifiers
    tm.GSTaskID
    ,tm.GSClientID
    ,tm.TaskCode
    ,tm.ClientCode
    ,tm.GroupCode
    ,tm.ServLineCode
    ,tm.TaskPartner
    ,tm.TaskManager
    
    -- Descriptive fields
    ,tm.TaskDesc
    ,tm.ClientName
    ,tm.GroupDesc
    ,tm.ServLineDesc
    ,tm.PartnerName
    ,tm.ManagerName
    
    -- Gross WIP by bucket (before fees)
    ,ROUND(ISNULL(fifo.GrossCurr, 0), 2) AS GrossCurr
    ,ROUND(ISNULL(fifo.GrossBal30, 0), 2) AS GrossBal30
    ,ROUND(ISNULL(fifo.GrossBal60, 0), 2) AS GrossBal60
    ,ROUND(ISNULL(fifo.GrossBal90, 0), 2) AS GrossBal90
    ,ROUND(ISNULL(fifo.GrossBal120, 0), 2) AS GrossBal120
    ,ROUND(ISNULL(fifo.GrossBal150, 0), 2) AS GrossBal150
    ,ROUND(ISNULL(fifo.GrossBal180, 0), 2) AS GrossBal180
    ,ROUND(ISNULL(fifo.GrossCurr, 0) + ISNULL(fifo.GrossBal30, 0) + ISNULL(fifo.GrossBal60, 0) + 
           ISNULL(fifo.GrossBal90, 0) + ISNULL(fifo.GrossBal120, 0) + ISNULL(fifo.GrossBal150, 0) + 
           ISNULL(fifo.GrossBal180, 0), 2) AS GrossTotal
    
    -- Total fees to apply
    ,ROUND(ISNULL(fifo.TotalFees, 0), 2) AS TotalFees
    
    -- Net WIP by bucket (after FIFO fee application)
    ,ROUND(ISNULL(fifo.NetCurr, 0), 2) AS Curr
    ,ROUND(ISNULL(fifo.NetBal30, 0), 2) AS Bal30
    ,ROUND(ISNULL(fifo.NetBal60, 0), 2) AS Bal60
    ,ROUND(ISNULL(fifo.NetBal90, 0), 2) AS Bal90
    ,ROUND(ISNULL(fifo.NetBal120, 0), 2) AS Bal120
    ,ROUND(ISNULL(fifo.NetBal150, 0), 2) AS Bal150
    ,ROUND(ISNULL(fifo.NetBal180, 0), 2) AS Bal180
    
    -- Calculated fields
    ,ROUND(ISNULL(fifo.NetCurr, 0) + ISNULL(fifo.NetBal30, 0) + ISNULL(fifo.NetBal60, 0) + 
           ISNULL(fifo.NetBal90, 0) + ISNULL(fifo.NetBal120, 0) + ISNULL(fifo.NetBal150, 0) + 
           ISNULL(fifo.NetBal180, 0), 2) AS BalWip
    ,ROUND(ISNULL(prov.TotalProvision, 0), 2) AS Provision
    ,ROUND(ISNULL(fifo.NetCurr, 0) + ISNULL(fifo.NetBal30, 0) + ISNULL(fifo.NetBal60, 0) + 
           ISNULL(fifo.NetBal90, 0) + ISNULL(fifo.NetBal120, 0) + ISNULL(fifo.NetBal150, 0) + 
           ISNULL(fifo.NetBal180, 0) + ISNULL(prov.TotalProvision, 0), 2) AS NettWip
    ,ROUND(ISNULL(fifo.TotalFees, 0), 2) AS PtdFeeAmt

FROM TaskMetadata tm
LEFT JOIN FIFOAllocation fifo ON tm.GSTaskID = fifo.GSTaskID
LEFT JOIN ProvisionsByTask prov ON tm.GSTaskID = prov.GSTaskID
WHERE (
    -- Only include tasks with non-zero balances
    ISNULL(fifo.NetCurr, 0) + ISNULL(fifo.NetBal30, 0) + ISNULL(fifo.NetBal60, 0) + 
    ISNULL(fifo.NetBal90, 0) + ISNULL(fifo.NetBal120, 0) + ISNULL(fifo.NetBal150, 0) + 
    ISNULL(fifo.NetBal180, 0) + ISNULL(prov.TotalProvision, 0) <> 0
)
ORDER BY tm.TaskPartner, tm.ClientCode, tm.TaskCode

GO
