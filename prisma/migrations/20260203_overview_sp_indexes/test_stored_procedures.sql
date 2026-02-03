-- ============================================================================
-- Stored Procedure Testing & Validation
-- Test sp_WipMonthly and sp_DrsMonthly outputs
-- ============================================================================
--
-- PURPOSE: Validate that stored procedures return correct results
--          Compare SP output against expected inline SQL results
--
-- USAGE:
--   1. Deploy stored procedures first (sp_WipMonthly.sql, sp_DrsMonthly.sql)
--   2. Run this test script
--   3. Verify results match expected outputs
--   4. Check performance metrics (IO, Time)
--
-- ============================================================================

-- Enable statistics for performance comparison
SET STATISTICS IO ON;
SET STATISTICS TIME ON;

PRINT '============================================================================'
PRINT 'Test 1: sp_WipMonthly - Non-Cumulative, Partner Filter'
PRINT '============================================================================'

-- Test parameters (adjust to match real data in your database)
DECLARE @TestPartner NVARCHAR(MAX) = 'P001'  -- Replace with actual partner code
DECLARE @TestManager NVARCHAR(MAX) = '*'
DECLARE @TestDateFrom DATETIME = '2024-09-01'
DECLARE @TestDateTo DATETIME = '2024-12-31'

EXEC sp_WipMonthly 
    @PartnerCode = @TestPartner,
    @ManagerCode = @TestManager,
    @ServLineCode = '*',
    @DateFrom = @TestDateFrom,
    @DateTo = @TestDateTo,
    @IsCumulative = 0;

PRINT ''
PRINT 'Expected: Monthly WIP values for each month in fiscal year (Sep-Dec)'
PRINT 'Verify: LTDTime, LTDDisb, LTDAdj, LTDCost all have values > 0'
PRINT ''

PRINT '============================================================================'
PRINT 'Test 2: sp_WipMonthly - Cumulative, Manager Filter'
PRINT '============================================================================'

SET @TestPartner = '*'
SET @TestManager = 'M001'  -- Replace with actual manager code

EXEC sp_WipMonthly 
    @PartnerCode = @TestPartner,
    @ManagerCode = @TestManager,
    @ServLineCode = '*',
    @DateFrom = @TestDateFrom,
    @DateTo = @TestDateTo,
    @IsCumulative = 1;

PRINT ''
PRINT 'Expected: Cumulative WIP values (running totals)'
PRINT 'Verify: Each month''s values >= previous month''s values'
PRINT ''

PRINT '============================================================================'
PRINT 'Test 3: sp_WipMonthly - With Service Line Filter'
PRINT '============================================================================'

SET @TestPartner = 'P001'
SET @TestManager = '*'

EXEC sp_WipMonthly 
    @PartnerCode = @TestPartner,
    @ManagerCode = '*',
    @ServLineCode = 'TAX',  -- Replace with actual service line code
    @DateFrom = @TestDateFrom,
    @DateTo = @TestDateTo,
    @IsCumulative = 0;

PRINT ''
PRINT 'Expected: WIP values filtered to TAX service line only'
PRINT 'Verify: Values are lower than Test 1 (subset of data)'
PRINT ''

PRINT '============================================================================'
PRINT 'Test 4: sp_DrsMonthly - Non-Cumulative, Biller Filter'
PRINT '============================================================================'

DECLARE @TestBiller NVARCHAR(MAX) = 'E001'  -- Replace with actual biller code

EXEC sp_DrsMonthly 
    @BillerCode = @TestBiller,
    @ServLineCode = '*',
    @DateFrom = @TestDateFrom,
    @DateTo = @TestDateTo,
    @IsCumulative = 0;

PRINT ''
PRINT 'Expected: Monthly collections and net billings'
PRINT 'Verify: Collections > 0 (receipts), NetBillings > 0 (invoices)'
PRINT ''

PRINT '============================================================================'
PRINT 'Test 5: sp_DrsMonthly - Cumulative'
PRINT '============================================================================'

EXEC sp_DrsMonthly 
    @BillerCode = @TestBiller,
    @ServLineCode = '*',
    @DateFrom = @TestDateFrom,
    @DateTo = @TestDateTo,
    @IsCumulative = 1;

PRINT ''
PRINT 'Expected: Cumulative collections and billings (running totals)'
PRINT 'Verify: Each month''s values >= previous month''s values'
PRINT ''

PRINT '============================================================================'
PRINT 'Test 6: Edge Cases'
PRINT '============================================================================'

-- Test with no data (future date range)
PRINT 'Testing: Future date range (should return 0 rows)'
EXEC sp_WipMonthly 
    @PartnerCode = @TestPartner,
    @ManagerCode = '*',
    @ServLineCode = '*',
    @DateFrom = '2099-01-01',
    @DateTo = '2099-12-31',
    @IsCumulative = 0;

PRINT ''

-- Test with single month
PRINT 'Testing: Single month range'
EXEC sp_WipMonthly 
    @PartnerCode = @TestPartner,
    @ManagerCode = '*',
    @ServLineCode = '*',
    @DateFrom = '2024-09-01',
    @DateTo = '2024-09-30',
    @IsCumulative = 0;

PRINT ''

-- Test with wildcard filters (should return all data)
PRINT 'Testing: Wildcard filters (both partner and manager = *)'
EXEC sp_WipMonthly 
    @PartnerCode = '*',
    @ManagerCode = '*',
    @ServLineCode = '*',
    @DateFrom = @TestDateFrom,
    @DateTo = @TestDateTo,
    @IsCumulative = 0;

PRINT ''

PRINT '============================================================================'
PRINT 'Test 7: Performance Comparison'
PRINT '============================================================================'

-- Compare stored procedure vs inline SQL query performance

PRINT 'Running: sp_WipMonthly (optimized)'
DECLARE @SPStart DATETIME = GETDATE()

EXEC sp_WipMonthly 
    @PartnerCode = @TestPartner,
    @ManagerCode = '*',
    @ServLineCode = '*',
    @DateFrom = @TestDateFrom,
    @DateTo = @TestDateTo,
    @IsCumulative = 1;

DECLARE @SPEnd DATETIME = GETDATE()
DECLARE @SPDuration INT = DATEDIFF(MILLISECOND, @SPStart, @SPEnd)

PRINT ''
PRINT 'Stored Procedure Duration: ' + CAST(@SPDuration AS VARCHAR) + ' ms'
PRINT ''

-- Inline SQL equivalent (for comparison)
PRINT 'Running: Inline SQL equivalent'
DECLARE @InlineStart DATETIME = GETDATE()

;WITH MonthlyTotals AS (
    SELECT 
        DATEFROMPARTS(YEAR(w.TranDate), MONTH(w.TranDate), 1) as month,
        SUM(CASE WHEN w.TType = 'T' THEN ISNULL(w.Amount, 0) ELSE 0 END) as monthlyTime,
        SUM(CASE WHEN w.TType = 'D' THEN ISNULL(w.Amount, 0) ELSE 0 END) as monthlyDisb,
        SUM(CASE WHEN w.TType = 'ADJ' THEN ISNULL(w.Amount, 0) ELSE 0 END) as monthlyAdj,
        SUM(CASE WHEN w.TType != 'P' AND (e.EmpCatCode IS NULL OR e.EmpCatCode != 'CARL') THEN ISNULL(w.Cost, 0) ELSE 0 END) as monthlyCost,
        SUM(CASE WHEN w.TType = 'F' THEN ISNULL(w.Amount, 0) ELSE 0 END) as monthlyFee,
        SUM(CASE WHEN w.TType = 'P' THEN ISNULL(w.Amount, 0) ELSE 0 END) as monthlyProvision,
        SUM(CASE WHEN w.TType = 'ADJ' AND w.Amount < 0 THEN ISNULL(w.Amount, 0) ELSE 0 END) as monthlyNegativeAdj
    FROM WIPTransactions w
        LEFT JOIN Employee e ON w.EmpCode = e.EmpCode
    WHERE w.TaskPartner = @TestPartner
        AND w.TranDate >= @TestDateFrom
        AND w.TranDate <= @TestDateTo
    GROUP BY YEAR(w.TranDate), MONTH(w.TranDate)
)
SELECT 
    month,
    SUM(monthlyTime) OVER (ORDER BY month ROWS UNBOUNDED PRECEDING) as LTDTime,
    SUM(monthlyDisb) OVER (ORDER BY month ROWS UNBOUNDED PRECEDING) as LTDDisb,
    SUM(monthlyAdj) OVER (ORDER BY month ROWS UNBOUNDED PRECEDING) as LTDAdj,
    SUM(monthlyCost) OVER (ORDER BY month ROWS UNBOUNDED PRECEDING) as LTDCost,
    SUM(monthlyFee) OVER (ORDER BY month ROWS UNBOUNDED PRECEDING) as LTDFee,
    SUM(monthlyProvision) OVER (ORDER BY month ROWS UNBOUNDED PRECEDING) as LTDProvision,
    SUM(monthlyNegativeAdj) OVER (ORDER BY month ROWS UNBOUNDED PRECEDING) as LTDNegativeAdj
FROM MonthlyTotals
ORDER BY month;

DECLARE @InlineEnd DATETIME = GETDATE()
DECLARE @InlineDuration INT = DATEDIFF(MILLISECOND, @InlineStart, @InlineEnd)

PRINT ''
PRINT 'Inline SQL Duration: ' + CAST(@InlineDuration AS VARCHAR) + ' ms'
PRINT 'Performance Improvement: ' + CAST(CAST((@InlineDuration - @SPDuration) AS FLOAT) / @InlineDuration * 100 AS VARCHAR(10)) + '%'
PRINT ''

PRINT '============================================================================'
PRINT 'Test 8: Index Usage Verification'
PRINT '============================================================================'

-- Check which indexes were used
SELECT 
    OBJECT_NAME(s.object_id) AS TableName,
    i.name AS IndexName,
    s.user_seeks AS Seeks,
    s.user_scans AS Scans,
    s.user_lookups AS Lookups,
    s.last_user_seek AS LastSeek
FROM sys.dm_db_index_usage_stats s
INNER JOIN sys.indexes i ON s.object_id = i.object_id AND s.index_id = i.index_id
WHERE OBJECT_NAME(s.object_id) IN ('WIPTransactions', 'DrsTransactions')
    AND (i.name LIKE '%Partner%' OR i.name LIKE '%Manager%' OR i.name LIKE '%Biller%' OR i.name LIKE '%Recoverability%')
ORDER BY LastSeek DESC;

PRINT ''
PRINT 'Expected: New indexes (IX_WIPTransactions_Partner_Monthly_Covering, etc.) should show in results'
PRINT 'Verify: user_seeks > 0, user_scans = 0 (index seeks, not scans)'
PRINT ''

SET STATISTICS IO OFF;
SET STATISTICS TIME OFF;

PRINT '============================================================================'
PRINT 'Testing Complete'
PRINT '============================================================================'
PRINT ''
PRINT 'Manual Verification Checklist:'
PRINT '  [ ] All tests returned data (no errors)'
PRINT '  [ ] Cumulative values increase monotonically'
PRINT '  [ ] Edge cases handled correctly (no data, single month)'
PRINT '  [ ] Performance improvement > 30% vs inline SQL'
PRINT '  [ ] New indexes used (IX_WIPTransactions_*_Monthly_Covering)'
PRINT '  [ ] Logical reads reduced (check STATISTICS IO output)'
PRINT ''
