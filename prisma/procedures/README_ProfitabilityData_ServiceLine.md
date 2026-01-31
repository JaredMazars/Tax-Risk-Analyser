# Profitability Data Service Line Enhancement

## Overview

The `sp_ProfitabilityData` stored procedure has been enhanced to include service line hierarchy information directly in the result set, eliminating the need for additional API-level queries.

## Changes Made

### 1. Stored Procedure Updates

**File**: `prisma/procedures/sp_ProfitabilityData.sql`

Added LEFT JOINs to `ServiceLineExternal` and `ServiceLineMaster` tables to retrieve:
- `masterCode` - Master service line code
- `SubServlineGroupCode` - Sub-service line group code
- `SubServlineGroupDesc` - Sub-service line group description
- `masterServiceLineName` - Master service line name

**Why LEFT JOIN?**
- Some tasks may not have mappings in ServiceLineExternal (legacy data)
- LEFT JOIN ensures all tasks are returned with NULL values for unmapped service lines
- Maintains backward compatibility

### 2. TypeScript Interface Updates

**File**: `src/types/api.ts`

Updated `WipLTDResult` interface to include new fields:
```typescript
export interface WipLTDResult {
  // ... existing fields ...
  ServLineCode: string;
  ServLineDesc: string;
  // NEW: Service line hierarchy
  masterCode: string | null;
  SubServlineGroupCode: string | null;
  SubServlineGroupDesc: string | null;
  masterServiceLineName: string | null;
  // ... rest of fields ...
}
```

### 3. API Route Simplification

**File**: `src/app/api/my-reports/profitability/route.ts`

**Removed** (~35 lines):
- `ServiceLineExternal` query to get mappings
- `ServiceLineMaster` query to get master service line names
- Complex mapping logic with `serviceLineMap` and `masterNameMap`

**Updated**:
- `mapWipLTDToTask()` function now directly maps service line fields from SP results
- Simplified main handler to just call `map(mapWipLTDToTask)`

## Benefits

### Performance
- **Eliminated 2 API-level queries** (ServiceLineExternal + ServiceLineMaster lookups)
- Database performs joins once instead of N+1 queries pattern
- Reduced network round trips between API and database

### Code Quality
- **35 lines of code removed** from API route
- Simpler, more maintainable code
- Single source of truth for service line hierarchy

### Data Integrity
- Service line mapping happens at data source (stored procedure)
- Consistent results across all API consumers
- No risk of mapping inconsistencies

### Future Capabilities
- Enables database-level grouping by master service line
- Can add ORDER BY or HAVING clauses on master service line
- Better support for cross-service-line reporting

## Database Schema

### ServiceLineExternal
Links Task.ServLineCode to master service line hierarchy:
```
ServLineCode (indexed) → masterCode → ServiceLineMaster.code
                      → SubServlineGroupCode
                      → SubServlineGroupDesc
```

### ServiceLineMaster
Master service line definitions:
```
code (PK) → name (display name)
```

## Testing

### SQL Testing
Run the test script to verify stored procedure changes:
```bash
sqlcmd -S server -d database -i prisma/procedures/test_sp_ProfitabilityData_serviceline.sql
```

**Expected Results**:
- All queries execute without errors
- New fields present in results
- Some tasks may have NULL values (legacy/unmapped data is expected)
- Performance similar to previous version

### TypeScript Testing
Run the Node.js test to verify API integration:
```bash
npx tsx scripts/test-profitability-serviceline.ts
```

**Expected Results**:
- WipLTDResult interface includes new fields
- Mapping coverage statistics displayed
- Sample results show service line hierarchy
- No TypeScript or runtime errors

## Deployment

### Step 1: Deploy Stored Procedure
```bash
# Replace existing sp_ProfitabilityData in database
sqlcmd -S server -d database -i prisma/procedures/sp_ProfitabilityData.sql
```

**Important**: This is a stored procedure change, not a schema migration. No `prisma migrate` needed.

### Step 2: Deploy Application Code
The TypeScript changes are backward compatible. Deploy as part of normal deployment process.

### Step 3: Verify in UI
1. Navigate to `/dashboard/my-reports/profitability`
2. Verify report loads successfully
3. Check that grouping by service line works correctly
4. Test filters (fiscal year, fiscal month, custom date range)

## Backward Compatibility

✅ **Fully backward compatible**:
- Existing columns unchanged
- New columns added (not replaced)
- NULL values for unmapped service lines (graceful degradation)
- API response structure unchanged (fields added, not removed)

## Troubleshooting

### Issue: NULL values for all service line hierarchy fields

**Possible Causes**:
1. No records in `ServiceLineExternal` table
2. `Task.ServLineCode` values don't match `ServiceLineExternal.ServLineCode`
3. ServiceLineExternal not linked to ServiceLineMaster (NULL masterCode)

**Solution**:
```sql
-- Check ServiceLineExternal mappings
SELECT ServLineCode, masterCode, SubServlineGroupCode 
FROM ServiceLineExternal 
WHERE ServLineCode IN (SELECT DISTINCT ServLineCode FROM Task);

-- Check ServiceLineMaster records
SELECT code, name FROM ServiceLineMaster;
```

### Issue: Performance degradation

**Possible Causes**:
1. Missing indexes on ServiceLineExternal.ServLineCode
2. Missing indexes on ServiceLineMaster.code (should be PK)

**Solution**:
```sql
-- Verify indexes exist
EXEC sp_helpindex 'ServiceLineExternal';
EXEC sp_helpindex 'ServiceLineMaster';

-- Check execution plan
SET SHOWPLAN_ALL ON;
EXEC sp_ProfitabilityData @DateFrom='2024-01-01', @DateTo='2025-01-01';
SET SHOWPLAN_ALL OFF;
```

## Related Files

- `prisma/procedures/sp_ProfitabilityData.sql` - Updated stored procedure
- `src/types/api.ts` - Updated WipLTDResult interface
- `src/app/api/my-reports/profitability/route.ts` - Simplified API route
- `src/lib/services/reports/storedProcedureService.ts` - SP execution wrapper (no changes needed)
- `prisma/procedures/test_sp_ProfitabilityData_serviceline.sql` - SQL test script
- `scripts/test-profitability-serviceline.ts` - TypeScript test script

## Version History

- **v1.0** (Original): Returns ServLineCode and ServLineDesc only
- **v1.1** (Current): Includes full service line hierarchy (masterCode, SubServlineGroupCode, SubServlineGroupDesc, masterServiceLineName)
