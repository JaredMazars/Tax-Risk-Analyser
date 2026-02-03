# Fix WIP Aging Bucket Sum

**Date:** 2026-02-03  
**Stored Procedure:** sp_WIPAgingByTask  
**Version:** 4.3

## Problem

The WIP Aging report displayed aging buckets that didn't sum to Total WIP (BalWip).

**Issue 1 - Positive BalWip with inflated buckets (Task NCC0126/COM24):**
| Metric | Before Fix |
|--------|------------|
| Sum of buckets | 153,351.58 |
| BalWip | 22,087.50 |
| Discrepancy | 131,264.08 |

**Issue 2 - Negative BalWip (overbilled) with zero buckets (Task NCC0100/AHT55):**
| Metric | Before Fix |
|--------|------------|
| Sum of buckets | 0 |
| BalWip | -478.75 |
| Discrepancy | 478.75 |

## Root Causes

### Issue 1: Negative bucket amounts floored to 0
In Phase 2, negative bucket amounts (from negative ADJ transactions) were floored to 0 but included in TotalGrossWIP.

### Issue 2: Excess credits not shown in buckets
When credits exceeded all positive WIP (overbilled tasks), the Curr bucket was floored at 0 instead of going negative.

## Solution (v4.2 + v4.3)

### v4.2 Fix - Handle negative bucket amounts:
1. **Track NegativeBucketTotal** - Sum of all negative raw bucket values
2. **Calculate EffectiveCredits** - FeeCredits + ABS(NegativeBucketTotal)
3. **Apply FIFO with EffectiveCredits** - Buckets reduced by the larger credit amount
4. **Preserve BalWip formula** - Still uses original FeeCreditsOnly

### v4.3 Fix - Handle overbilled tasks:
5. **Allow negative Curr** - When excess credits exist, Curr can go negative

### Key Code Changes

**Phase 2 - Track negative bucket total:**
```sql
ROUND(
    CASE WHEN RawBal180 < 0 THEN RawBal180 ELSE 0 END +
    CASE WHEN RawBal150 < 0 THEN RawBal150 ELSE 0 END +
    -- ... other buckets
, 2) AS NegativeBucketTotal
```

**Phase 3 - Calculate effective credits:**
```sql
SELECT g.GSTaskID,
    ROUND(ISNULL(fc.FeeCredits, 0), 2) AS FeeCreditsOnly,
    ROUND(ISNULL(fc.FeeCredits, 0) + ABS(ISNULL(g.NegativeBucketTotal, 0)), 2) AS TotalCredits
```

**Phase 5 - Allow negative Curr (v4.3):**
```sql
-- v4.3: Allow negative Curr when excess credits exist
ROUND(CASE 
    WHEN fa.TotalCredits <= fa.GrossBal180 + ... + fa.GrossBal30 THEN fa.GrossCurr
    ELSE fa.GrossCurr - (fa.TotalCredits - fa.GrossBal180 - ... - fa.GrossBal30)
END, 2) AS Curr
```

## Result

After the fix:

**Example 1 - Task NCC0126/COM24 (positive BalWip):**
| Metric | After Fix |
|--------|-----------|
| Bal30 | 4,025 |
| Bal60 | 18,062.50 |
| Bal180 | 0 |
| Sum of buckets | **22,087.50** |
| BalWip | **22,087.50** |
| Match? | **Yes** |

**Example 2 - Task NCC0100/AHT55 (negative BalWip):**
| Metric | After Fix |
|--------|-----------|
| Curr | **-478.75** |
| Sum of buckets | **-478.75** |
| BalWip | **-478.75** |
| Match? | **Yes** |

**Verification - NCC01 Group:**
- Total records: 163
- Mismatches: **0**

## Deployment

The stored procedure was applied directly to the database. For redeployment:

```sql
-- Run the full procedure from:
-- prisma/procedures/sp_WIPAgingByTask.sql
```

## Testing

```sql
-- Test positive BalWip case
EXEC dbo.sp_WIPAgingByTask 
    @ClientCode = 'NCC0126', 
    @TaskCode = 'COM24', 
    @AsOfDate = '2026-02-03'

-- Test negative BalWip (overbilled) case
EXEC dbo.sp_WIPAgingByTask 
    @ClientCode = 'NCC0100', 
    @TaskCode = 'AHT55', 
    @AsOfDate = '2026-02-03'

-- Verify: Curr + Bal30 + Bal60 + Bal90 + Bal120 + Bal150 + Bal180 = BalWip
```

## Files Modified

- `prisma/procedures/sp_WIPAgingByTask.sql` - Updated to v4.3
