-- ============================================================================
-- Test Script for sp_ProfitabilityData with Service Line Hierarchy
-- ============================================================================
--
-- PURPOSE: Verify that the updated sp_ProfitabilityData correctly includes
--          service line hierarchy fields from ServiceLineExternal and 
--          ServiceLineMaster tables
--
-- TESTS:
-- 1. Basic execution returns new fields
-- 2. Verify NULL handling for tasks without service line mappings
-- 3. Check data types and values
--
-- ============================================================================

PRINT '============================================================================';
PRINT 'Test 1: Basic Execution - Verify New Fields Are Returned';
PRINT '============================================================================';
PRINT '';

-- Execute with wildcard parameters to get all data
EXEC sp_ProfitabilityData 
  @ServLineCode = '*',
  @PartnerCode = '*',
  @ManagerCode = '*',
  @GroupCode = '*',
  @ClientCode = '*',
  @TaskCode = '*',
  @DateFrom = '2024-01-01',
  @DateTo = '2025-01-01',
  @EmpCode = '*';

PRINT '';
PRINT '============================================================================';
PRINT 'Test 2: Check Field Presence and Data Quality';
PRINT '============================================================================';
PRINT '';

-- Get detailed information about service line mappings
SELECT TOP 10
    TaskCode,
    ServLineCode,
    ServLineDesc,
    masterCode,
    SubServlineGroupCode,
    SubServlineGroupDesc,
    masterServiceLineName,
    CASE 
        WHEN masterCode IS NULL THEN 'NO MAPPING'
        ELSE 'MAPPED'
    END AS MappingStatus
FROM (
    SELECT * FROM (
        -- Execute inline to inspect results
        EXEC sp_ProfitabilityData 
          @ServLineCode = '*',
          @DateFrom = '2024-01-01',
          @DateTo = '2025-01-01'
    ) AS Results
) AS InspectionData
ORDER BY MappingStatus DESC, TaskCode;

PRINT '';
PRINT '============================================================================';
PRINT 'Test 3: Verify Service Line External Mapping Coverage';
PRINT '============================================================================';
PRINT '';

-- Check which service lines have mappings in ServiceLineExternal
SELECT 
    t.ServLineCode,
    t.ServLineDesc,
    COUNT(DISTINCT t.TaskCode) AS TaskCount,
    CASE 
        WHEN sle.ServLineCode IS NOT NULL THEN 'MAPPED'
        ELSE 'NOT MAPPED'
    END AS HasMapping,
    sle.masterCode,
    sle.SubServlineGroupCode,
    slm.name AS masterServiceLineName
FROM [dbo].[Task] t
LEFT JOIN [dbo].[ServiceLineExternal] sle ON t.ServLineCode = sle.ServLineCode
LEFT JOIN [dbo].[ServiceLineMaster] slm ON sle.masterCode = slm.code
GROUP BY 
    t.ServLineCode,
    t.ServLineDesc,
    sle.ServLineCode,
    sle.masterCode,
    sle.SubServlineGroupCode,
    slm.name
ORDER BY HasMapping DESC, TaskCount DESC;

PRINT '';
PRINT '============================================================================';
PRINT 'Test 4: Performance Check - Execution Time';
PRINT '============================================================================';
PRINT '';

-- Measure execution time
DECLARE @StartTime DATETIME = GETDATE();

EXEC sp_ProfitabilityData 
  @ServLineCode = '*',
  @DateFrom = '2024-01-01',
  @DateTo = '2025-01-01';

DECLARE @EndTime DATETIME = GETDATE();
DECLARE @DurationMS INT = DATEDIFF(MILLISECOND, @StartTime, @EndTime);

PRINT 'Execution completed in ' + CAST(@DurationMS AS VARCHAR(10)) + ' milliseconds';
PRINT '';

PRINT '============================================================================';
PRINT 'Test 5: Specific Service Line Filter';
PRINT '============================================================================';
PRINT '';

-- Test filtering by specific service line
SELECT TOP 5
    TaskCode,
    ServLineCode,
    ServLineDesc,
    masterCode,
    SubServlineGroupCode,
    masterServiceLineName,
    LTDTimeCharged,
    NetRevenue
FROM (
    -- Execute with filter (replace 'TAX' with actual service line code in your DB)
    EXEC sp_ProfitabilityData 
      @ServLineCode = 'TAX',
      @DateFrom = '2024-01-01',
      @DateTo = '2025-01-01'
) AS FilteredResults;

PRINT '';
PRINT '============================================================================';
PRINT 'Test Complete';
PRINT '============================================================================';
PRINT '';
PRINT 'EXPECTED RESULTS:';
PRINT '- All queries should return results without errors';
PRINT '- New fields (masterCode, SubServlineGroupCode, SubServlineGroupDesc, masterServiceLineName) should be present';
PRINT '- Some tasks may have NULL values for service line hierarchy (legacy/unmapped data)';
PRINT '- Execution time should be similar to previous version (< 2 seconds for typical dataset)';
PRINT '';
