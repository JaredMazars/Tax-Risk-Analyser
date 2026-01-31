-- ============================================================================
-- Debug Script: NetWIP Calculation for BLAW001
-- ============================================================================
-- Purpose: Investigate why NetWIP is showing 10,294,620 instead of ~1,002,686
-- 
-- Hypotheses being tested:
-- B. Employee JOIN causing row multiplication
-- E. Transaction-level data investigation
-- ============================================================================

DECLARE @DateFrom datetime = '2026-01-01';
DECLARE @DateTo datetime = '2026-01-31';

PRINT '=== Testing Period: ' + CONVERT(varchar, @DateFrom, 120) + ' to ' + CONVERT(varchar, @DateTo, 120) + ' ==='

-- Step 1: Check if Employee JOIN causes duplicates
PRINT ''
PRINT '=== HYPOTHESIS B: Employee JOIN Duplication Check ==='
SELECT 
    w.EmpCode,
    COUNT(DISTINCT e.GSEmployeeID) as EmployeeRecordCount,
    COUNT(*) as TotalJoinedRows
FROM [dbo].[WIPTransactions] w
    LEFT JOIN [dbo].[Employee] e ON w.EmpCode = e.EmpCode
WHERE w.TaskCode = 'BLAW001'
    AND w.TranDate >= @DateFrom
    AND w.TranDate <= @DateTo
GROUP BY w.EmpCode
HAVING COUNT(DISTINCT e.GSEmployeeID) > 1
ORDER BY EmployeeRecordCount DESC;

-- Step 2: Count raw transactions for BLAW001
PRINT ''
PRINT '=== Transaction Count for BLAW001 in Period ==='
SELECT 
    TType,
    COUNT(*) as TransactionCount,
    SUM(ISNULL(Amount, 0)) as TotalAmount,
    SUM(ISNULL(Cost, 0)) as TotalCost
FROM [dbo].[WIPTransactions]
WHERE TaskCode = 'BLAW001'
    AND TranDate >= @DateFrom
    AND TranDate <= @DateTo
GROUP BY TType
ORDER BY TType;

-- Step 3: Check what sp_ProfitabilityData returns (with Employee JOIN)
PRINT ''
PRINT '=== sp_ProfitabilityData Result for BLAW001 ==='
EXEC dbo.sp_ProfitabilityData 
    @ServLineCode = '*',
    @PartnerCode = '*',
    @ManagerCode = '*',
    @GroupCode = '*',
    @ClientCode = '*',
    @TaskCode = 'BLAW001',
    @DateFrom = @DateFrom,
    @DateTo = @DateTo,
    @EmpCode = '*';

-- Step 4: Manual calculation WITHOUT Employee JOIN (to compare)
PRINT ''
PRINT '=== Manual Calculation WITHOUT Employee JOIN ==='
SELECT 
    t.TaskCode,
    SUM(CASE WHEN w.TType = 'T' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDTimeCharged,
    SUM(CASE WHEN w.TType = 'D' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDDisbCharged,
    SUM(CASE WHEN w.TType = 'F' THEN 0 - ISNULL(w.Amount, 0) ELSE 0 END) AS LTDFeesBilled,
    SUM(CASE WHEN w.TType = 'ADJ' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDAdjustments,
    SUM(CASE WHEN w.TType = 'P' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDWipProvision,
    -- BalWip = T + D + ADJ + F
    SUM(CASE WHEN w.TType = 'T' THEN ISNULL(w.Amount, 0) ELSE 0 END)
     + SUM(CASE WHEN w.TType = 'D' THEN ISNULL(w.Amount, 0) ELSE 0 END)
     + SUM(CASE WHEN w.TType = 'ADJ' THEN ISNULL(w.Amount, 0) ELSE 0 END)
     + SUM(CASE WHEN w.TType = 'F' THEN 0 - ISNULL(w.Amount, 0) ELSE 0 END) AS BalWip,
    -- NetWIP = T + D + ADJ + F + P
    SUM(CASE WHEN w.TType = 'T' THEN ISNULL(w.Amount, 0) ELSE 0 END)
     + SUM(CASE WHEN w.TType = 'D' THEN ISNULL(w.Amount, 0) ELSE 0 END)
     + SUM(CASE WHEN w.TType = 'ADJ' THEN ISNULL(w.Amount, 0) ELSE 0 END)
     + SUM(CASE WHEN w.TType = 'F' THEN 0 - ISNULL(w.Amount, 0) ELSE 0 END)
     + SUM(CASE WHEN w.TType = 'P' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS NetWIP_WithoutEmployeeJoin
FROM [dbo].[Task] t
    INNER JOIN [dbo].[WIPTransactions] w ON t.GSTaskID = w.GSTaskID
WHERE t.TaskCode = 'BLAW001'
    AND w.TranDate >= @DateFrom
    AND w.TranDate <= @DateTo
GROUP BY t.TaskCode;

-- Step 5: Manual calculation WITH Employee JOIN (matching SP exactly)
PRINT ''
PRINT '=== Manual Calculation WITH Employee JOIN (matching SP) ==='
SELECT 
    t.TaskCode,
    SUM(CASE WHEN w.TType = 'T' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDTimeCharged,
    SUM(CASE WHEN w.TType = 'D' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDDisbCharged,
    SUM(CASE WHEN w.TType = 'F' THEN 0 - ISNULL(w.Amount, 0) ELSE 0 END) AS LTDFeesBilled,
    SUM(CASE WHEN w.TType = 'ADJ' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDAdjustments,
    SUM(CASE WHEN w.TType = 'P' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS LTDWipProvision,
    SUM(CASE WHEN w.TType != 'P' AND (e.EmpCatCode IS NULL OR e.EmpCatCode != 'CARL') THEN ISNULL(w.Cost, 0) ELSE 0 END) AS LTDCost,
    -- BalWip = T + D + ADJ + F
    SUM(CASE WHEN w.TType = 'T' THEN ISNULL(w.Amount, 0) ELSE 0 END)
     + SUM(CASE WHEN w.TType = 'D' THEN ISNULL(w.Amount, 0) ELSE 0 END)
     + SUM(CASE WHEN w.TType = 'ADJ' THEN ISNULL(w.Amount, 0) ELSE 0 END)
     + SUM(CASE WHEN w.TType = 'F' THEN 0 - ISNULL(w.Amount, 0) ELSE 0 END) AS BalWip,
    -- NetWIP = T + D + ADJ + F + P
    SUM(CASE WHEN w.TType = 'T' THEN ISNULL(w.Amount, 0) ELSE 0 END)
     + SUM(CASE WHEN w.TType = 'D' THEN ISNULL(w.Amount, 0) ELSE 0 END)
     + SUM(CASE WHEN w.TType = 'ADJ' THEN ISNULL(w.Amount, 0) ELSE 0 END)
     + SUM(CASE WHEN w.TType = 'F' THEN 0 - ISNULL(w.Amount, 0) ELSE 0 END)
     + SUM(CASE WHEN w.TType = 'P' THEN ISNULL(w.Amount, 0) ELSE 0 END) AS NetWIP_WithEmployeeJoin,
    COUNT(*) as TotalRows
FROM [dbo].[Task] t
    INNER JOIN [dbo].[WIPTransactions] w ON t.GSTaskID = w.GSTaskID
    LEFT JOIN [dbo].[Employee] e ON w.EmpCode = e.EmpCode
WHERE t.TaskCode = 'BLAW001'
    AND w.TranDate >= @DateFrom
    AND w.TranDate <= @DateTo
GROUP BY t.TaskCode;

-- Step 6: Check for duplicate Employee records by EmpCode
PRINT ''
PRINT '=== Duplicate Employee Records Check ==='
SELECT 
    EmpCode,
    COUNT(*) as RecordCount,
    STRING_AGG(CAST(GSEmployeeID AS NVARCHAR(50)), ', ') as GSEmployeeIDs,
    STRING_AGG(Active, ', ') as ActiveStatuses
FROM [dbo].[Employee]
WHERE EmpCode IN (
    SELECT DISTINCT EmpCode 
    FROM [dbo].[WIPTransactions] 
    WHERE TaskCode = 'BLAW001'
        AND TranDate >= @DateFrom
        AND TranDate <= @DateTo
        AND EmpCode IS NOT NULL
)
GROUP BY EmpCode
HAVING COUNT(*) > 1;

-- Step 7: Row-by-row JOIN analysis
PRINT ''
PRINT '=== Row-by-Row JOIN Analysis (First 20 rows) ==='
SELECT TOP 20
    w.EmpCode,
    w.TType,
    w.Amount,
    w.Cost,
    e.GSEmployeeID,
    e.EmpCatCode,
    e.Active,
    CASE WHEN e.EmpCatCode IS NULL OR e.EmpCatCode != 'CARL' THEN 'INCLUDE' ELSE 'EXCLUDE' END as CostFilter
FROM [dbo].[WIPTransactions] w
    LEFT JOIN [dbo].[Employee] e ON w.EmpCode = e.EmpCode
WHERE w.TaskCode = 'BLAW001'
    AND w.TranDate >= @DateFrom
    AND w.TranDate <= @DateTo
ORDER BY w.TranDate, w.EmpCode;
