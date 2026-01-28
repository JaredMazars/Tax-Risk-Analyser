-- ============================================================================
-- Enhanced WipLTD Stored Procedure
-- Add @DateFrom and @EmpCode parameters
-- ============================================================================
--
-- CHANGES:
-- 1. Add @DateFrom parameter (default '1900/01/01' for backward compatibility)
-- 2. Add @EmpCode parameter (default '*' for all employees)
-- 3. Update WipTran CTE to filter by date range and employee
--
-- INDEXES USED:
-- - idx_WIPTransactions_Date_EmpCode_Client_Covering (optimal for this SP)
-- - idx_WIPTransactions_Task_Covering (after Tsk CTE filters tasks)
--
-- ============================================================================

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[WipLTD] 
     @ServLineCode nvarchar(max)  = '*'
    ,@PartnerCode nvarchar(max)   = 'BLAW001'
    ,@ManagerCode nvarchar(max)   = '*'
    ,@GroupCode nvarchar(max)     = '*'
    ,@ClientCode nvarchar(max)    = '*'
    ,@TaskCode nvarchar(max)      = '*'
    ,@DateFrom datetime           = '1900/01/01'  -- NEW: Start date (default = all history)
    ,@DateTo datetime             = '2025/01/01'  -- Existing: End date
    ,@EmpCode nvarchar(max)       = '*'           -- NEW: Employee filter (default = all employees)
AS

SET NOCOUNT ON

;WITH Tsk AS (
    SELECT
        c.clientCode
        ,c.clientNameFull
        ,c.groupCode
        ,c.groupDesc
        ,t.TaskCode
        ,t.OfficeCode
        ,t.ServLineCode
        ,t.ServLineDesc
        ,t.TaskPartner
        ,t.TaskPartnerName
        ,t.TaskManager
        ,t.TaskManagerName
        ,t.GSTaskID
    FROM Task t
        CROSS APPLY (
                SELECT 
                    c.clientCode
                    ,c.clientNameFull
                    ,c.groupCode
                    ,c.groupDesc
                FROM Client c
                WHERE (t.GSClientID = c.GSClientID)
                    AND (c.clientCode = @ClientCode OR @ClientCode = '*')
                    AND (c.groupCode = @GroupCode OR @GroupCode = '*')
            ) c
    WHERE (t.ServLineCode = @ServLineCode OR @ServLineCode = '*')
        AND (t.TaskPartner = @PartnerCode OR @PartnerCode = '*')
        AND (t.TaskManager = @ManagerCode OR @ManagerCode = '*')
        AND (t.TaskCode = @TaskCode OR @TaskCode = '*')
)
, WipTran AS (
    SELECT 
        w.GSTaskID
        ,CASE WHEN w.TType = 'T' THEN w.Amount ELSE 0 END AS TimeCharged
        ,CASE WHEN w.TType = 'D' THEN w.Amount ELSE 0 END AS DisbCharged
        ,CASE WHEN w.TType = 'F' THEN 0 - w.Amount ELSE 0 END AS FeesBilled
        ,CASE WHEN w.TType = 'ADJ' THEN w.Amount ELSE 0 END AS Adjustments
        ,CASE WHEN w.TType = 'P' THEN w.Amount ELSE 0 END AS WipProvision
        ,CASE WHEN w.TType = 'F' THEN 0 - w.Amount ELSE w.Amount END AS BalWip
    FROM WipTransactions w
        CROSS APPLY (
                SELECT 
                    t.GSTaskID
                FROM Tsk t 
                WHERE w.GSTaskID = t.GSTaskID
            ) t
    -- ENHANCED FILTERING: Date range + employee
    WHERE w.TranDate >= @DateFrom              -- NEW: Date range start
      AND w.TranDate <= @DateTo                -- Existing: Date range end
      AND (w.EmpCode = @EmpCode                -- NEW: Employee filter
           OR @EmpCode = '*'                   -- Wildcard = all employees
           OR w.EmpCode IS NULL)               -- Include NULL employee codes
)
, WipLTD AS (
    SELECT 
        w.GSTaskID
        ,SUM(TimeCharged)  AS LTDTimeCharged
        ,SUM(DisbCharged)  AS LTDDisbCharged
        ,SUM(FeesBilled)   AS LTDFeesBilled
        ,SUM(Adjustments)  AS LTDAdjustments
        ,SUM(WipProvision) AS LTDWipProvision
        ,SUM(w.BalWip)     AS BalWip
    FROM WipTran w
    GROUP BY w.GSTaskID
)

SELECT *
FROM Tsk t
    JOIN WIPLTD w ON t.GSTaskID = w.GSTaskID
;

GO

PRINT 'Enhanced WipLTD stored procedure created successfully';
PRINT 'New parameters: @DateFrom (default 1900/01/01), @EmpCode (default ''*'')';
PRINT '';
PRINT 'Example usage:';
PRINT '  EXEC dbo.WipLTD @DateFrom = ''2024-01-01'', @DateTo = ''2024-12-31'', @EmpCode = ''BLAW001'';';
PRINT '';
