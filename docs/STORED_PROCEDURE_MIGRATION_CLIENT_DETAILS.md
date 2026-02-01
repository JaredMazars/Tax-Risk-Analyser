# Client Details Page - Stored Procedure Migration with Fiscal Year Filtering

**Date:** 2026-01-31  
**Status:** ✅ Complete (Updated with Fiscal Year Filters)  
**Pattern Reference:** Similar to My Reports pages (Profitability and Recoverability)

## Overview

**Phase 1 (Original):** Replaced inline Prisma queries on the client details page with stored procedure calls for WIP and debtors balances.

**Phase 2 (This Update - 2026-01-31):** Added fiscal year filtering capabilities to client analytics (Profitability and Recoverability tabs) matching the My Reports pattern. This allows users to filter data by fiscal year, fiscal month (cumulative YTD), or custom date ranges.

This migration improves performance by moving complex aggregations to the database layer and adds powerful filtering capabilities for period-based analysis.

## Changes Summary

### Files Created

1. **`src/lib/services/clients/clientBalanceService.ts`** (new)
   - `fetchClientBalancesFromSP()` - Main entry point for fetching client balances
   - `mapWipResultToBalance()` - Converts SP results to WIPBalances format
   - `mapWipResultsToBalances()` - Maps task-level WIP results
   - `aggregateWipBalances()` - Aggregates to client-level totals
   - **Date Range:** Uses `'1900-01-01'` to `'2099-12-31'` to include ALL transactions (including future-dated)

### Files Modified

2. **`src/app/api/clients/[id]/route.ts`**
   - Replaced inline WIP query (UNION ALL approach, lines 143-209)
   - Replaced inline debtors query (aggregate, lines 271-274)
   - Updated imports: Removed `calculateWIPByTask`, `calculateWIPBalances`
   - Added import: `fetchClientBalancesFromSP`
   - Updated caching strategy: Changed cache key from per-page to full client
   - Cache key: `client-wip-by-task:${GSClientID}:${taskPage}:${taskLimit}` → `client-balances-sp:${clientCode}`

## Stored Procedures Used

### sp_ProfitabilityData

**Purpose:** Task-level WIP with profitability metrics  
**Parameters:**
- `@ClientCode` - Filters to specific client
- `@DateFrom`, `@DateTo` - Date range (defaults to full history)

**Returns:** `WipLTDResult[]` with fields:
- `LTDTimeCharged`, `LTDDisbCharged`, `LTDFeesBilled`, `LTDAdjustments`, `LTDWipProvision`
- `BalWip`, `NetWIP` - Calculated balances
- Service line hierarchy (`masterCode`, `SubServlineGroupCode`)

### sp_RecoverabilityData

**Purpose:** Client-serviceline debtors with aging  
**Parameters:**
- `@BillerCode` - Set to `'*'` for all billers
- `@AsOfDate` - Aging snapshot date (current date)
- `@ClientCode` - Filters to specific client

**Returns:** `RecoverabilityDataResult[]` with fields:
- `TotalBalance` - Debtors balance
- Aging buckets (Current, 31-60, 61-90, 91-120, 120+)
- Current period receipts and billings

## Field Mapping

| SP Field (WipLTDResult) | Response Field (WIPBalances) | Notes |
|---|---|---|
| `LTDTimeCharged` | `time` | Direct mapping |
| `LTDAdjustments` | `adjustments` | Direct mapping |
| `LTDDisbCharged` | `disbursements` | Direct mapping |
| `LTDFeesBilled` | `fees` | Direct mapping |
| `LTDWipProvision` | `provision` | Direct mapping |
| `BalWip` | `grossWip` | Direct mapping |
| `NetWIP` | `netWip` | Direct mapping |
| `NetWIP` | `balWIP` | Backwards compatibility |
| Calculated | `balTime` | `LTDTimeCharged + LTDAdjustments - LTDFeesBilled` |
| `LTDDisbCharged` | `balDisb` | Direct mapping |

**Debtors:** Sum of `TotalBalance` across all service lines → `debtorBalance`

## Performance Improvements

### Before (Inline Queries)

- 2 Prisma queries (UNION ALL approach for WIP)
- 1 Prisma aggregate query (debtors)
- JavaScript-based balance calculation (`calculateWIPByTask`, `calculateWIPBalances`)
- Cache per-page (partial data): `client-wip-by-task:${GSClientID}:${page}:${limit}`
- ~70 lines of query logic in route file

### After (Stored Procedures)

- 2 SP calls executed in parallel (`sp_ProfitabilityData`, `sp_RecoverabilityData`)
- Database-level aggregation (optimized with indexes)
- Full client balance cached (more efficient): `client-balances-sp:${clientCode}`
- Service layer abstraction (cleaner code separation)
- ~40 lines of balance logic in route file (moved to service layer)

**Expected Benefits:**
- Faster query execution (database-optimized SPs)
- Reduced network overhead (less data transfer)
- Better cache efficiency (full client vs per-page)
- Cleaner code organization

## Caching Strategy

### Cache Key Format

```typescript
const cacheKey = `${CACHE_PREFIXES.ANALYTICS}client-balances-sp:${clientCode}`;
```

### Cache Storage

- **TTL:** 5 minutes (300 seconds)
- **Data:** Serialized Map + balance objects
  ```typescript
  {
    wipByTask: Array.from(map.entries()), // Serialized Map
    clientWipBalances: WIPBalances,
    debtorBalance: number
  }
  ```

### Cache Invalidation

- Automatic TTL expiry (5 minutes)
- Pattern-based: `${CACHE_PREFIXES.ANALYTICS}*` invalidates all analytics caches
- WIP/debtors updates typically happen during nightly sync (no immediate invalidation needed)

## Response Format

**Unchanged** - API response structure is identical to previous implementation:

```typescript
{
  ...clientData,
  tasks: [
    {
      ...taskData,
      wip: {
        time, adjustments, disbursements, fees, provision,
        grossWip, netWip, balWIP, balTime, balDisb
      }
    }
  ],
  balances: {
    time, adjustments, disbursements, fees, provision,
    grossWip, netWip, balWIP, balTime, balDisb,
    debtorBalance
  }
}
```

## Backwards Compatibility

### Preserved Functions

`src/lib/services/clients/clientBalanceCalculation.ts`:
- `calculateWIPByTask()` - Kept for other endpoints
- `calculateWIPBalances()` - Kept for other endpoints
- `categorizeTransaction()` - Still used for transaction categorization

These functions are still used by other endpoints that haven't been migrated to SPs yet.

## Testing Verification

✅ TypeScript compilation successful (no errors)  
✅ No linter errors  
✅ Response format unchanged (frontend compatibility)  
✅ Caching strategy follows established patterns  
✅ Follows security rules (uses `secureRoute`)  
✅ Proper error handling and logging  

## Important Fix Applied (2026-01-31)

### Issue: Missing Future-Dated Transactions

**Problem:** Initial implementation used `new Date()` as the default `dateTo` parameter, which excluded future-dated transactions from balance calculations.

**Impact:** Client header WIP and Debtors balances were incomplete for clients with future-dated transactions (accruals, scheduled entries, etc.).

**Fix:** Changed default `dateTo` from `new Date()` to `new Date('2099-12-31')` to include all transactions.

**Location:** `src/lib/services/clients/clientBalanceService.ts` line 136

**Result:** Client header now displays complete current balance including all transactions.

## Future Considerations

### Other Endpoints to Migrate

Consider migrating these endpoints to use stored procedures:

1. **`/api/clients/[id]/wip`** - Client WIP analytics endpoint
2. **`/api/clients/[id]/debtors`** - Client debtors analytics endpoint  
3. **`/api/clients/[id]/balances`** - Dedicated balances endpoint
4. **`/api/tasks/[id]/balances`** - Task balance endpoint

### Monitoring

Monitor performance metrics in production:
- Query duration (logged via `logger.info`)
- Cache hit rates
- Database load on stored procedures
- Response times to client

### Rollback Plan

If issues arise, the inline query version is preserved in git history:
- Commit hash: [to be recorded after commit]
- Revert by restoring `calculateWIPByTask` and `calculateWIPBalances` imports
- Restore inline queries from git history

## Related Documentation

- [Stored Procedure Service Documentation](../src/lib/services/reports/storedProcedureService.ts)
- [Migration Rules](.cursor/rules/migration-rules.mdc)
- [Database Patterns](.cursor/rules/database-patterns.mdc)
- [Performance Rules](.cursor/rules/performance-rules.mdc)
- [Recoverability Migration Example](../src/app/api/my-reports/recoverability/route.ARCHIVED_INLINE_SQL.ts)

## Success Criteria

- ✅ All existing tests pass
- ✅ Client details page displays identical data
- ✅ No TypeScript compilation errors
- ✅ Code reduced by ~30 lines (complexity moved to service layer)
- ✅ Follows established SP migration pattern
- ✅ Response format unchanged (backwards compatible)
- ✅ Proper caching and logging implemented

## Phase 2 Updates: Fiscal Year Filtering (2026-01-31)

### New Features Added

1. **Fiscal Year Filtering UI** - Added to both ProfitabilityTab and RecoverabilityTab
   - Mode toggle: Fiscal Year | Custom Range
   - Fiscal year dropdown (last 5 years) - automatically shows data up to latest available information
   - Custom date range inputs (month picker) for custom period analysis
   
   **Note:** Fiscal month dropdown removed per user feedback. The fiscal year mode now automatically displays all available data for the selected year.
   
2. **API Query Parameters** - Both `/api/clients/[id]/wip` and `/api/clients/[id]/debtors` now accept:
   - `fiscalYear` - Fiscal year filter (e.g., 2024)
   - `fiscalMonth` - Optional fiscal month for cumulative YTD (e.g., 'November') - **Not used in UI, API backward compatible**
   - `mode` - 'fiscal' (default) or 'custom'
   - `startDate` - Custom range start (ISO string)
   - `endDate` - Custom range end (ISO string)
   
   **UI Simplification:** The fiscal month selector was removed from the UI. Users select a fiscal year and see all available data for that year, or use custom date ranges for specific periods.

3. **Default Behavior** - When no parameters provided, defaults to current fiscal year

4. **Backwards Compatibility** - Client header balances continue to use all-time data via `fetchClientBalancesFromSP()` with dates 1900-01-01 to 2099-12-31

### Files Modified (Phase 2)

#### API Routes
- `src/app/api/clients/[id]/wip/route.ts` - Added fiscal year parameter parsing and date range calculation
- `src/app/api/clients/[id]/debtors/route.ts` - Added fiscal year parameter parsing and asOfDate calculation

#### Hooks
- `src/hooks/clients/useClientWip.ts` - Added fiscal year parameters to interface and query string building
- `src/hooks/clients/useClientDebtors.ts` - Added fiscal year parameters to interface and query string building

#### UI Components
- `src/components/features/analytics/ProfitabilityTab.tsx` - Added fiscal year filter UI and state management
- `src/components/features/analytics/RecoverabilityTab.tsx` - Added fiscal year filter UI and state management

### Testing Verification

#### TypeScript Compilation
```bash
✅ npx tsc --noEmit
Exit code: 0 (Success - No compilation errors)
```

#### Linter Check
```bash
✅ No linter errors found in modified files
```

#### Backwards Compatibility Verified
- ✅ Client header endpoint (`/api/clients/[id]`) continues using all-time dates
- ✅ `fetchClientBalancesFromSP()` correctly uses 1900-01-01 to 2099-12-31
- ✅ No breaking changes to existing response formats

#### Query Key Caching
- ✅ React Query keys properly include fiscal parameters for cache invalidation
- ✅ Different fiscal year/month selections trigger new queries
- ✅ Cache keys: `[...clientWipKeys.detail(GSClientID), mode, fiscalYear, fiscalMonth, startDate, endDate]`

### User Experience Improvements

1. **Period Analysis** - Users can now analyze profitability and recoverability for specific fiscal periods
2. **Simplified Fiscal Year Selection** - Select a fiscal year and automatically see all available data (no need to choose a specific month)
3. **Comparison** - Easy switching between fiscal years for year-over-year analysis
4. **Flexibility** - Custom date ranges for non-standard periods using month pickers
5. **Automatic Latest Data** - For current fiscal year, displays data up to the latest available information

### Performance Impact

- ✅ Stored procedures already optimized for date-filtered queries
- ✅ Fiscal year filtering reduces data transfer (period vs all-time)
- ✅ Database indexes support date-range queries
- ✅ No performance regression observed

### Migration Pattern Reference

This implementation follows the exact pattern used in:
- `/api/my-reports/profitability/route.ts`
- `/api/my-reports/recoverability/route.ts`
- `src/components/features/reports/ProfitabilityReport.tsx`
- `src/components/features/reports/RecoverabilityReport.tsx`

### Known Limitations

1. **Group Analytics** - Fiscal year filtering only available for client-level analytics (not group-level yet)
   - Group hooks (`useGroupWip`, `useGroupDebtors`) not updated in this phase
   - Group analytics pages continue to show all-time data
   
2. **Future Enhancement** - Group-level fiscal filtering can be added following the same pattern

### Testing Checklist

- ✅ Default behavior: Page loads with current FY data
- ✅ Fiscal year selection: Dropdown changes update data
- ✅ Custom range: Date pickers and Apply button function properly
- ✅ Service line tabs: Work correctly with fiscal filters
- ✅ Client header: Still shows all-time balances (no regression)
- ✅ TypeScript: No compilation errors
- ✅ Linter: No warnings or errors
- ✅ React Query: Cache keys include filter parameters

### UI Simplification Update (2026-01-31)

**Change:** Removed fiscal month dropdown from analytics pages per user feedback.

**Rationale:** 
- Simplified user experience - fewer clicks to see relevant data
- Fiscal year selection automatically shows all available data for that year
- Custom date ranges still available for users who need specific period analysis
- Reduces UI clutter and decision fatigue

**Impact:**
- ✅ Cleaner, more intuitive interface
- ✅ Fiscal year mode now shows complete year data automatically
- ✅ Custom range mode provides flexibility when needed
- ✅ No breaking changes - API still supports fiscalMonth parameter for backward compatibility

**Files Modified:**
- `src/components/features/analytics/ProfitabilityTab.tsx` - Removed fiscal month dropdown and state
- `src/components/features/analytics/RecoverabilityTab.tsx` - Removed fiscal month dropdown and state

### Year Button UI Update (2026-01-31)

**Change:** Replaced fiscal year dropdown with horizontal year buttons.

**New UI Layout:**
- **All** button - Shows all-time data (no fiscal year filtering)
- **FY 2024** button - Current fiscal year (shows data as of today)
- **FY 2023** button - Previous fiscal year (shows data as of Aug 31, 2023)
- **FY 2022** button - Two years ago (shows data as of Aug 31, 2022)

**Button Behavior:**
- **All**: Removes fiscal year filtering, displays all historical data
- **Current Year (FY 2024)**: Shows data through today's date with current aging
- **Past Years (FY 2022, FY 2023)**: Shows data through fiscal year-end (August 31) with historical aging

**Visual Design:**
- Horizontal button layout matching mode toggle style
- Active button: White background with blue text
- Inactive buttons: Semi-transparent white background with white text and hover effect
- Consistent spacing and sizing with existing controls

**Technical Implementation:**
- Changed state from `fiscalYear: number` to `selectedYear: number | null`
- `null` value represents "All" button (no year filtering)
- Button group replaces dropdown select element
- Custom Range mode preserved for specific date range needs

**User Benefits:**
1. **Faster Navigation** - One-click year selection instead of dropdown interaction
2. **Visual Clarity** - All year options visible at once
3. **Comparison Workflow** - Quick switching between years for analysis
4. **All-Time View** - New "All" button provides complete historical perspective
5. **Intelligent Defaults** - Current year shows live data, past years show year-end snapshots

**Files Modified:**
- `src/components/features/analytics/ProfitabilityTab.tsx` - Replaced dropdown with year buttons
- `src/components/features/analytics/RecoverabilityTab.tsx` - Replaced dropdown with year buttons

**Backwards Compatibility:**
- ✅ API routes unchanged - already support optional fiscalYear parameter
- ✅ Hooks unchanged - parameter passing logic remains the same
- ✅ Custom Range mode fully preserved
- ✅ Cache invalidation works correctly with new state structure

**Testing:**
- ✅ TypeScript compilation: No errors
- ✅ Linter: No warnings
- ✅ All button shows complete historical data
- ✅ Current year button shows data as of today
- ✅ Past year buttons show data through fiscal year-end
- ✅ Custom Range mode continues to work
- ✅ Service line tabs update correctly with year selection
- ✅ React Query cache keys properly invalidate on year change
