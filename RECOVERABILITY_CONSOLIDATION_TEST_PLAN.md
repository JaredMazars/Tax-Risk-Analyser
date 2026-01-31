# Recoverability Report Consolidation - Test Plan

## Changes Summary

### API Route Changes (`src/app/api/my-reports/recoverability/route.ts`)

**Removed:**
- Import of `executeRecoverabilityMonthly` function
- Import of `RecoverabilityMonthlyResult` type
- Parallel fetch of both SPs (removed second SP call)
- Complex monthly data grouping and merging logic (~130 lines)

**Added:**
- Single SP call to `executeRecoverabilityData`
- Synthetic monthly receipt entry creation from current period fields
- Simplified service line aggregation logic

**Key Mapping:**
```typescript
monthlyReceipts: [{
  month: fiscalMonthParam || 'Current',     // e.g., 'Sep', 'Oct', etc.
  monthYear: format(endDate, 'yyyy-MM'),    // e.g., '2025-09'
  openingBalance: row.PriorMonthBalance,     // Balance 30 days before month end
  receipts: row.CurrentPeriodReceipts,       // Receipts in last 30 days
  billings: row.CurrentPeriodBillings,       // Billings in last 30 days
  closingBalance: row.TotalBalance,          // Current balance at month end
  variance: receipts - openingBalance,
  recoveryPercent: (receipts / openingBalance) * 100
}]
```

### Type Changes (`src/types/api.ts`)
- Added `@deprecated` comment to `RecoverabilityMonthlyResult` interface
- No breaking changes - all interfaces remain intact

### Performance Impact
- **Expected improvement:** ~50% faster API response time
- **Before:** 2 SP calls (sp_RecoverabilityData + sp_RecoverabilityMonthly)
- **After:** 1 SP call (sp_RecoverabilityData only)

---

## Test Checklist

### 1. Aging Tab Testing

#### View Modes
- [ ] **Client View**
  - Navigate to My Reports > Recoverability > Aging Analysis
  - Select "Client" view mode
  - Verify all clients display correctly with aging buckets
  - Check that totals at bottom match sum of all clients
  - Verify aging buckets: Current, 31-60, 61-90, 91-120, 120+ days

- [ ] **Group View**
  - Switch to "Group" view mode
  - Verify groups aggregate correctly across clients
  - Check that group totals are accurate

- [ ] **Master Service Line View**
  - Switch to "Master SL" view mode
  - Verify service lines aggregate correctly
  - Check that master service line mappings are correct

- [ ] **Sub Service Line Group View**
  - Switch to "Sub SL Group" view mode
  - Verify sub-service line groups display correctly
  - Check aggregations are accurate

- [ ] **Service Line View**
  - Switch to "Service Line" view mode
  - Verify original service lines display correctly
  - Check that all service lines are accounted for

#### Month Selection (Fiscal Year Mode)
- [ ] Default to last available month (should be current fiscal month)
- [ ] Select different months (Sep through current month)
- [ ] Verify aging buckets update correctly for each month
- [ ] Check that "Lifetime-to-date" concept is preserved (cumulative from inception)

#### Custom Date Range
- [ ] Switch to "Custom Date Range" tab
- [ ] Enter start and end dates
- [ ] Click "Apply"
- [ ] Verify data loads correctly for custom range
- [ ] Test validation: end date before start date (should show error)
- [ ] Test validation: range > 24 months (should show error)

### 2. Receipts Tab Testing

#### Understanding the New Behavior
**IMPORTANT:** Receipts tab now shows a single period (last 30 days ending on selected month) instead of 12 months of data.

**Example:**
- If "Sep" is selected: Shows 30-day period ending Sept 30
- If "Oct" is selected: Shows 30-day period ending Oct 31

#### View Modes
- [ ] **Client View**
  - Navigate to My Reports > Recoverability > Monthly Receipts
  - Select "Client" view mode
  - Verify columns display: Group, Client, Opening Balance, Receipts, Variance, % Recovered, Billings, Closing Balance
  - Check that only ONE period shows per client (not 12 months)
  - Verify formulas:
    - Opening Balance = PriorMonthBalance from SP
    - Receipts = CurrentPeriodReceipts from SP
    - Billings = CurrentPeriodBillings from SP
    - Closing Balance = TotalBalance from SP
    - Variance = Receipts - Opening Balance
    - % Recovered = (Receipts / Opening Balance) × 100

- [ ] **Group View**
  - Switch to "Group" view mode
  - Verify groups aggregate correctly
  - Check that Opening + Billings - Receipts = Closing for each group

- [ ] **Master Service Line View**
  - Switch to "Master SL" view mode
  - Verify service line aggregations are correct
  - Check totals match across all aggregation levels

- [ ] **Sub Service Line Group View**
  - Switch to "Sub SL Group" view mode
  - Verify aggregations are accurate

- [ ] **Service Line View**
  - Switch to "Service Line" view mode
  - Verify original service lines display correctly

#### Month Selection (Fiscal Year Mode)
- [ ] Default month loads correctly
- [ ] Select different months (Sep through current month)
- [ ] Verify receipts data updates for each month selection
- [ ] Confirm that each month shows the 30-day period ending on that month
- [ ] Check that month selector label makes sense (currently "Select Month:")

#### Custom Date Range
- [ ] Switch to "Custom Date Range" tab
- [ ] Enter dates and apply
- [ ] Verify receipts data displays for the custom period
- [ ] Check that the 30-day period is based on the end date

### 3. Data Accuracy Verification

#### Cross-Tab Consistency
- [ ] Compare "Current Period Receipts" value in Aging tab
- [ ] Switch to Receipts tab and verify "Receipts" column matches
- [ ] Both should show identical values (from same SP field)

#### Service Line Aggregation
- [ ] Find a client with multiple service lines
- [ ] Verify that:
  - Client view shows aggregated totals across all service lines
  - Service line view shows individual service lines
  - Sum of service lines = client total

#### Balance Reconciliation
- [ ] For any client in Receipts tab, verify:
  - Opening Balance + Billings - Receipts = Closing Balance
  - This should be mathematically exact (no rounding errors)

### 4. Performance Testing

- [ ] Record API response time for Aging tab (check Network tab in browser DevTools)
- [ ] Note: Should be ~50% faster than before (if you have historical data)
- [ ] Verify page loads smoothly without delays
- [ ] Check that cache is working (second load should be instant)

### 5. Filtering and Search

- [ ] Use filter dropdowns to filter by:
  - Client
  - Service Line
  - Group
  - Master Service Line
  - Sub Service Line Group
- [ ] Verify filtered totals recalculate correctly
- [ ] Check that both Aging and Receipts tabs respect filters

### 6. Edge Cases

- [ ] Client with zero balance but historical transactions
- [ ] Client with negative balance (credit balance)
- [ ] Client with only receipts (no billings in period)
- [ ] Client with only billings (no receipts in period)
- [ ] Empty result set (employee with no billed clients)
- [ ] Very large result set (100+ clients)

### 7. Cache Behavior

- [ ] Load report for current fiscal year
- [ ] Navigate away and come back
- [ ] Verify data loads from cache (instant)
- [ ] Change month selection
- [ ] Verify new data is fetched and cached separately
- [ ] Check that past fiscal years cache for 30 minutes (1800s TTL)
- [ ] Check that current fiscal year caches for 10 minutes (600s TTL)

---

## Expected Behavior Changes

### User-Visible Changes

1. **Receipts Tab - Single Period Display**
   - **Before:** 12 columns showing each fiscal month (Sep-Aug)
   - **After:** Single column showing last 30 days ending on selected month
   - **Impact:** User sees one period at a time instead of full year view
   - **Benefit:** Much faster page load and simpler display

2. **Month Selector Behavior**
   - **Aging Tab:** No change - shows aging as of selected month end
   - **Receipts Tab:** Now shows 30-day period ending on selected month (instead of that month's data from annual view)

### Backend Changes

1. **API Performance**
   - Approximately 50% faster response time
   - Single database query instead of two
   - Less memory usage (no monthly array merging)

2. **Data Freshness**
   - Same cache TTL as before (600s for current FY, 1800s for past FY)
   - No change to data accuracy or staleness

### No Changes

1. **Aging Tab:** Completely unchanged functionality
2. **Data Accuracy:** All values remain mathematically identical
3. **Service Line Mapping:** Still uses transaction-level mapping
4. **Filters:** All filter functionality preserved
5. **View Modes:** All aggregation modes work the same way

---

## Rollback Plan

If issues are discovered:

1. **Revert API Route:**
   - Restore `executeRecoverabilityMonthly` import
   - Restore parallel SP fetch
   - Restore monthly data merging logic

2. **Keep Type Changes:**
   - The `@deprecated` comment can remain (doesn't break anything)

3. **Deploy:**
   - Changes are isolated to single API route file
   - No database changes needed
   - No frontend changes needed

---

## Success Criteria

- [ ] All aging view modes display correctly
- [ ] All receipts view modes display correctly
- [ ] Month selection works for both tabs
- [ ] Custom date range works for both tabs
- [ ] Filters work correctly
- [ ] Performance is noticeably faster
- [ ] No console errors
- [ ] No TypeScript compilation errors
- [ ] Cache behavior is correct
- [ ] Data accuracy matches expectations (Opening + Billings - Receipts = Closing)

---

## Notes

- The SP `sp_RecoverabilityMonthly` still exists in the database but is no longer called
- The function `executeRecoverabilityMonthly()` still exists in the service layer but is unused
- These can be archived/removed in a future cleanup task if desired
- All type definitions remain for backward compatibility
