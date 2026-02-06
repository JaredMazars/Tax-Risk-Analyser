# WIP Aging Stored Procedure - Deployment & Testing Guide

## Overview

The `sp_WIPAgingByTask` stored procedure calculates WIP aging by task with FIFO (First In First Out) logic. When fees or provisions are raised/reversed, they offset the oldest aging balance first.

## Deployment

### Status: ✅ DEPLOYED

**Procedure Name**: `sp_WIPAgingByTask`  
**Created**: 2026-02-01 04:24:10 UTC  
**Location**: `prisma/procedures/sp_WIPAgingByTask.sql`

### Parameters (All Optional)

| Parameter | Type | Default | Description |
|---|---|---|---|
| `@TaskPartner` | nvarchar(max) | '*' | Filter by partner (EmpCode) |
| `@TaskManager` | nvarchar(max) | '*' | Filter by manager (EmpCode) |
| `@ClientCode` | nvarchar(max) | '*' | Filter by client code |
| `@GroupCode` | nvarchar(max) | '*' | Filter by group code |
| `@ServLineCode` | nvarchar(max) | '*' | Filter by service line code |
| `@TaskCode` | nvarchar(max) | '*' | Filter by task code |
| `@AsOfDate` | datetime | NULL | Date cutoff (defaults to current date) |

**Wildcard Pattern**: Use `'*'` to return all records for that parameter.

## Key Features

1. **FIFO Fee Application**: Fees offset aging buckets from oldest to newest (Bal180 → Bal150 → Bal120 → Bal90 → Bal60 → Bal30 → Curr)
2. **7 Aging Buckets**:
   - `Curr`: 0-30 days
   - `Bal30`: 31-60 days
   - `Bal60`: 61-90 days
   - `Bal90`: 91-120 days
   - `Bal120`: 121-150 days
   - `Bal150`: 151-180 days
   - `Bal180`: 180+ days
3. **Transaction Types**:
   - **T** (Time): Increases WIP
   - **D** (Disbursements): Increases WIP
   - **ADJ** (Adjustments): Increases WIP
   - **F** (Fees): Decreases WIP (billing)
   - **P** (Provisions): Increases WIP (bad debt)
4. **Explicit Rounding**: ROUND(value, 2) prevents floating-point errors
5. **Rich Metadata**: Returns task codes, descriptions, partner names, client names, etc.

## Output Columns

### Identifiers
- `GSTaskID`, `GSClientID`
- `TaskCode`, `ClientCode`, `GroupCode`, `ServLineCode`
- `TaskPartner`, `TaskManager`

### Descriptive Fields
- `TaskDesc`, `ClientName`, `GroupDesc`, `ServLineDesc`
- `PartnerName`, `ManagerName`

### Gross WIP (Before Fees)
- `GrossCurr`, `GrossBal30`, `GrossBal60`, `GrossBal90`, `GrossBal120`, `GrossBal150`, `GrossBal180`
- `GrossTotal`

### Net WIP (After FIFO Fee Application)
- `Curr`, `Bal30`, `Bal60`, `Bal90`, `Bal120`, `Bal150`, `Bal180`
- `BalWip` (sum of net buckets)
- `Provision` (total provisions)
- `NettWip` (BalWip + Provision)
- `PtdFeeAmt` (period-to-date fees)
- `TotalFees` (fees applied)

## Usage Examples

```sql
-- Example 1: All tasks (no filters)
EXEC sp_WIPAgingByTask;

-- Example 2: Filter by partner
EXEC sp_WIPAgingByTask @TaskPartner = 'FERY001';

-- Example 3: Filter by client and service line
EXEC sp_WIPAgingByTask 
    @ClientCode = 'BRE0200',
    @ServLineCode = 'AUD';

-- Example 4: Filter by group as of specific date
EXEC sp_WIPAgingByTask 
    @GroupCode = 'BRE02',
    @AsOfDate = '2024-12-31';

-- Example 5: Multiple filters combined
EXEC sp_WIPAgingByTask 
    @TaskPartner = 'DEVT001',
    @ServLineCode = 'AUD',
    @AsOfDate = '2025-01-31';

-- Example 6: Specific task
EXEC sp_WIPAgingByTask @TaskCode = 'AUDAUP2025';
```

## Performance Considerations

### Current Status: ⚠️ REQUIRES OPTIMIZATION

**Issue**: The stored procedure times out (>30 seconds) on large datasets, even with specific filters.

### Recommended Optimizations

1. **Create Covering Index**:
```sql
CREATE NONCLUSTERED INDEX idx_WIPTransactions_Aging_COVERING
ON WIPTransactions(GSTaskID, TranDate, TType)
INCLUDE (Amount, TaskCode, ClientCode, GroupCode, TaskServLine, TaskPartner, TaskManager, 
         TaskDesc, ClientName, GroupDesc, TaskServLineDesc, PartnerName, ManagerName, GSClientID);
```

2. **Add Filtered Indexes** (for common filter combinations):
```sql
-- Index for partner queries
CREATE NONCLUSTERED INDEX idx_WIPTransactions_Partner_Aging
ON WIPTransactions(TaskPartner, TranDate, TType)
INCLUDE (Amount, GSTaskID, TaskCode, ClientCode);

-- Index for service line queries
CREATE NONCLUSTERED INDEX idx_WIPTransactions_ServLine_Aging
ON WIPTransactions(TaskServLine, TranDate, TType)
INCLUDE (Amount, GSTaskID, TaskCode, ClientCode, TaskPartner);
```

3. **Consider Adding Date Filter Index**:
```sql
CREATE NONCLUSTERED INDEX idx_WIPTransactions_TranDate
ON WIPTransactions(TranDate)
INCLUDE (GSTaskID, TType, Amount);
```

4. **Query Optimization Options**:
   - Add `OPTION (MAXDOP 4)` for parallel execution
   - Consider table partitioning by date for historical data
   - Implement a WIPAgingSummary table for pre-aggregated results (similar to WIPAging table)

## Testing Strategy

### Phase 1: Verification (Manual Testing in SQL)

1. **Test with highly specific filters** (single task/client):
```sql
-- Test 1: Single task with known WIP balance
EXEC sp_WIPAgingByTask @TaskCode = '[KNOWN_TASK_CODE]';

-- Verify:
-- - GrossTotal matches expected WIP buildup
-- - TotalFees matches expected billing
-- - Net aging buckets show FIFO allocation
-- - BalWip + Provision = NettWip
```

2. **Verify FIFO logic**:
   - Find a task with multiple aging buckets and fees
   - Confirm fees are applied to Bal180 first, then Bal150, etc.
   - Calculate expected net balances manually and compare

3. **Test filter combinations**:
   - Partner only
   - Partner + ServiceLine
   - Client + AsOfDate
   - Multiple filters combined

### Phase 2: Integration Testing (After Optimization)

1. Create API route: `src/app/api/reports/wip-aging/route.ts`
2. Create service function: `src/lib/services/reports/storedProcedureService.ts`
3. Test with application UI
4. Compare results with existing WIP calculations

### Phase 3: Performance Testing

1. Measure execution time for common filter patterns
2. Target: <500ms for filtered queries, <5s for all tasks
3. Monitor query execution plans
4. Adjust indexes based on actual usage patterns

## FIFO Logic Explanation

The stored procedure applies fees to aging buckets in oldest-first order:

**Example**:
```
Gross Balances:
- Bal180: R 10,000 (oldest)
- Bal150: R  5,000
- Bal120: R  3,000
- Bal90:  R  2,000
- Bal60:  R  1,000
- Bal30:  R    500
- Curr:   R    200

Total Fees: R 16,000

FIFO Application:
Step 1: Apply R 10,000 to Bal180 → NetBal180 = R 0, Remaining = R 6,000
Step 2: Apply R 5,000 to Bal150 → NetBal150 = R 0, Remaining = R 1,000
Step 3: Apply R 1,000 to Bal120 → NetBal120 = R 2,000, Remaining = R 0
Step 4-7: No remaining fees → Net balances = Gross balances

Result:
- NetBal180: R 0
- NetBal150: R 0
- NetBal120: R 2,000
- NetBal90:  R 2,000
- NetBal60:  R 1,000
- NetBal30:  R 500
- NetCurr:   R 200
- BalWip:    R 5,700
```

## Troubleshooting

### Issue: Timeout errors

**Solution**: Apply recommended indexes above. If still timing out:
1. Check execution plan for table scans
2. Verify statistics are up to date: `UPDATE STATISTICS WIPTransactions`
3. Consider reducing date range with @AsOfDate parameter
4. For large-scale queries, consider batch processing by partner/service line

### Issue: Incorrect FIFO allocation

**Check**:
1. Verify fees are correctly summed (TType = 'F')
2. Confirm aging buckets are calculated correctly (DATEDIFF logic)
3. Test with manual calculation for a single task
4. Review FIFO CASE statements for edge cases (zero balances, negative fees)

### Issue: Rounding discrepancies

**Check**:
1. All money values should use `ROUND(value, 2)`
2. Verify BalWip = sum of net buckets
3. Verify NettWip = BalWip + Provision
4. Tolerance: ±0.01 acceptable, ±0.02+ indicates issue

## Next Steps

1. **✅ Complete Index Deployment** (Priority: CRITICAL)
   - **STATUS**: Partially complete (1 of 3 indexes may still be creating)
   - **ACTION REQUIRED**: Run `prisma/procedures/sp_WIPAgingByTask_index_update.sql` in Azure Portal
   - **See**: `docs/WIP_AGING_INDEX_DEPLOYMENT.md` for detailed instructions
   - **Time**: 10-20 minutes

2. **Test Performance** (Priority: HIGH - After index deployment)
   - Run test queries from deployment guide
   - Verify <5 second response times
   - Monitor index usage for 1-2 days

3. **Create API Integration** (Priority: MEDIUM)
   - Build API route with secureRoute wrapper
   - Add caching layer (Redis, 10min TTL)
   - Create TypeScript types for result set

4. **Build UI Report** (Priority: LOW)
   - WIP Aging Report page
   - Filter controls for all 7 parameters
   - Drill-down by aging bucket
   - Export to Excel functionality

## Related Files

- **Stored Procedure**: `prisma/procedures/sp_WIPAgingByTask.sql`
- **Plan**: `.cursor/plans/wip_aging_stored_procedure_*.plan.md`
- **Similar Procedures**: 
  - `sp_RecoverabilityData.sql` (aging for debtors)
  - `sp_ProfitabilityData.sql` (financial aggregation)
- **WIP Calculation**: `src/lib/services/wip/wipCalculationSQL.ts`
- **Aging Logic**: `src/lib/services/analytics/debtorAggregation.ts` (reference for aging buckets)

## Success Criteria

- ✅ Stored procedure deploys successfully
- ✅ All 7 parameters accepted
- ✅ Returns expected column structure
- ⚠️ Performance optimization needed (timeout issues)
- ⏳ FIFO logic validation pending (requires manual testing)
- ⏳ Rounding accuracy validation pending
- ⏳ API integration pending
- ⏳ UI report pending
