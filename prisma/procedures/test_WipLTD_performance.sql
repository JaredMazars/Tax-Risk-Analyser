-- ============================================================================
-- WipLTD Performance Testing Script
-- Captures baseline metrics and compares different optimization approaches
-- ============================================================================
--
-- USAGE:
-- 1. Run baseline tests with current procedure
-- 2. Deploy optimized procedure
-- 3. Run same tests and compare results
--
-- ============================================================================

SET NOCOUNT ON;
SET STATISTICS TIME, IO ON;

PRINT '============================================================================';
PRINT 'WipLTD Performance Testing';
PRINT 'Started: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '============================================================================';
PRINT '';

-- ============================================================================
-- TEST 1: All Wildcards (Broadest Query)
-- ============================================================================

PRINT '-- TEST 1: All Wildcards (All Parameters = *)';
PRINT '-- Expected: Returns all tasks across all filters';
PRINT '';

EXEC WipLTD 
    @ServLineCode = '*',
    @PartnerCode = '*',
    @ManagerCode = '*',
    @GroupCode = '*',
    @ClientCode = '*',
    @TaskCode = '*',
    @DateFrom = '2024-01-01',
    @DateTo = '2024-12-31',
    @EmpCode = '*';

PRINT '';
PRINT 'Test 1 Complete';
PRINT '============================================================================';
PRINT '';

-- ============================================================================
-- TEST 2: Single Service Line Filter (Common Use Case)
-- ============================================================================

PRINT '-- TEST 2: Single Service Line Filter (TAX)';
PRINT '-- Expected: Returns only TAX service line tasks';
PRINT '';

EXEC WipLTD 
    @ServLineCode = 'TAX',
    @PartnerCode = '*',
    @ManagerCode = '*',
    @GroupCode = '*',
    @ClientCode = '*',
    @TaskCode = '*',
    @DateFrom = '2024-01-01',
    @DateTo = '2024-12-31',
    @EmpCode = '*';

PRINT '';
PRINT 'Test 2 Complete';
PRINT '============================================================================';
PRINT '';

-- ============================================================================
-- TEST 3: Partner Filter (Profitability Report Use Case)
-- ============================================================================

PRINT '-- TEST 3: Partner Filter (Partner Report)';
PRINT '-- Expected: Returns tasks for specific partner';
PRINT '-- NOTE: Replace P001 with actual partner code from your database';
PRINT '';

-- Find a real partner code
DECLARE @TestPartner NVARCHAR(10);
SELECT TOP 1 @TestPartner = TaskPartner FROM Task WHERE TaskPartner IS NOT NULL AND TaskPartner != '';

IF @TestPartner IS NOT NULL
BEGIN
    PRINT '  Using Partner Code: ' + @TestPartner;
    
    EXEC WipLTD 
        @ServLineCode = '*',
        @PartnerCode = @TestPartner,
        @ManagerCode = '*',
        @GroupCode = '*',
        @ClientCode = '*',
        @TaskCode = '*',
        @DateFrom = '2024-01-01',
        @DateTo = '2024-12-31',
        @EmpCode = '*';
END
ELSE
BEGIN
    PRINT '  ⚠️ No partner codes found in database';
END

PRINT '';
PRINT 'Test 3 Complete';
PRINT '============================================================================';
PRINT '';

-- ============================================================================
-- TEST 4: Manager Filter (Manager Report Use Case)
-- ============================================================================

PRINT '-- TEST 4: Manager Filter (Manager Report)';
PRINT '-- Expected: Returns tasks for specific manager';
PRINT '';

-- Find a real manager code
DECLARE @TestManager NVARCHAR(10);
SELECT TOP 1 @TestManager = TaskManager FROM Task WHERE TaskManager IS NOT NULL AND TaskManager != '';

IF @TestManager IS NOT NULL
BEGIN
    PRINT '  Using Manager Code: ' + @TestManager;
    
    EXEC WipLTD 
        @ServLineCode = '*',
        @PartnerCode = '*',
        @ManagerCode = @TestManager,
        @GroupCode = '*',
        @ClientCode = '*',
        @TaskCode = '*',
        @DateFrom = '2024-01-01',
        @DateTo = '2024-12-31',
        @EmpCode = '*';
END
ELSE
BEGIN
    PRINT '  ⚠️ No manager codes found in database';
END

PRINT '';
PRINT 'Test 4 Complete';
PRINT '============================================================================';
PRINT '';

-- ============================================================================
-- TEST 5: Single Task (Smallest Query)
-- ============================================================================

PRINT '-- TEST 5: Single Task Query';
PRINT '-- Expected: Returns single task detail';
PRINT '';

-- Find a real task code
DECLARE @TestTask NVARCHAR(10);
SELECT TOP 1 @TestTask = TaskCode FROM Task WHERE TaskCode IS NOT NULL AND TaskCode != '';

IF @TestTask IS NOT NULL
BEGIN
    PRINT '  Using Task Code: ' + @TestTask;
    
    EXEC WipLTD 
        @ServLineCode = '*',
        @PartnerCode = '*',
        @ManagerCode = '*',
        @GroupCode = '*',
        @ClientCode = '*',
        @TaskCode = @TestTask,
        @DateFrom = '2024-01-01',
        @DateTo = '2024-12-31',
        @EmpCode = '*';
END
ELSE
BEGIN
    PRINT '  ⚠️ No task codes found in database';
END

PRINT '';
PRINT 'Test 5 Complete';
PRINT '============================================================================';
PRINT '';

-- ============================================================================
-- TEST 6: Multiple Filters Combined (Complex Query)
-- ============================================================================

PRINT '-- TEST 6: Multiple Filters Combined';
PRINT '-- Expected: Returns tasks matching all specified filters';
PRINT '';

IF @TestPartner IS NOT NULL
BEGIN
    EXEC WipLTD 
        @ServLineCode = 'TAX',
        @PartnerCode = @TestPartner,
        @ManagerCode = '*',
        @GroupCode = '*',
        @ClientCode = '*',
        @TaskCode = '*',
        @DateFrom = '2024-01-01',
        @DateTo = '2024-12-31',
        @EmpCode = '*';
END
ELSE
BEGIN
    PRINT '  ⚠️ Skipped (no partner code available)';
END

PRINT '';
PRINT 'Test 6 Complete';
PRINT '============================================================================';
PRINT '';

-- ============================================================================
-- TEST 7: Employee Filter (Time Entry Analysis)
-- ============================================================================

PRINT '-- TEST 7: Employee Filter';
PRINT '-- Expected: Returns transactions for specific employee';
PRINT '';

-- Find a real employee code
DECLARE @TestEmployee NVARCHAR(10);
SELECT TOP 1 @TestEmployee = EmpCode FROM WIPTransactions WHERE EmpCode IS NOT NULL AND EmpCode != '';

IF @TestEmployee IS NOT NULL
BEGIN
    PRINT '  Using Employee Code: ' + @TestEmployee;
    
    EXEC WipLTD 
        @ServLineCode = '*',
        @PartnerCode = '*',
        @ManagerCode = '*',
        @GroupCode = '*',
        @ClientCode = '*',
        @TaskCode = '*',
        @DateFrom = '2024-01-01',
        @DateTo = '2024-12-31',
        @EmpCode = @TestEmployee;
END
ELSE
BEGIN
    PRINT '  ⚠️ No employee codes found in database';
END

PRINT '';
PRINT 'Test 7 Complete';
PRINT '============================================================================';
PRINT '';

SET STATISTICS TIME, IO OFF;

PRINT '';
PRINT '============================================================================';
PRINT 'Performance Testing Complete';
PRINT 'Completed: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '============================================================================';
PRINT '';
PRINT 'NEXT STEPS:';
PRINT '  1. Review SQL Server Messages tab for timing statistics';
PRINT '  2. Note "CPU time" and "elapsed time" for each test';
PRINT '  3. Note "logical reads" for WIPTransactions table';
PRINT '  4. Deploy optimized procedure (sp_WipLTD_Final_v2.5.sql)';
PRINT '  5. Re-run this script and compare results';
PRINT '';
PRINT 'KEY METRICS TO COMPARE:';
PRINT '  - CPU time (ms) - Lower is better';
PRINT '  - Elapsed time (ms) - Lower is better';
PRINT '  - Logical reads - Lower is better (indicates less I/O)';
PRINT '  - Scan count - Should be low (index seeks preferred)';
PRINT '';
GO
