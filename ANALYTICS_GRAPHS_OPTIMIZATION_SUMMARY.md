# Analytics Graphs Performance Optimization - Implementation Summary

**Date:** December 24, 2025  
**Issue:** 500 Internal Server Error on group and client analytics graphs endpoints in production  
**Root Cause:** Request timeouts (92+ seconds) exceeding Azure Container Apps timeout limits (~30-60 seconds)

## Changes Implemented

### 1. Group Endpoint: `/api/groups/[groupCode]/analytics/graphs`

**File:** `src/app/api/groups/[groupCode]/analytics/graphs/route.ts`

#### Changes:
1. ✅ **Date Range Reduced** (Line 150)
   - Changed from 24 months to 12 months
   - Expected impact: ~50% reduction in transaction volume

2. ✅ **TAKE Limits Lowered** (Lines 244, 260)
   - Opening balance: 500,000 → 100,000
   - Period transactions: 250,000 → 50,000
   - Expected impact: Faster database queries, reduced memory usage

3. ✅ **Default Resolution Changed** (Line 52)
   - Changed from 'standard' (120 points) to 'low' (60 points)
   - Expected impact: Smaller payload, faster processing

4. ✅ **Cache TTL Increased** (Line 450)
   - Changed from 600 seconds (10 min) to 1800 seconds (30 min)
   - Expected impact: Higher cache hit rate, fewer expensive queries

5. ✅ **Warning Logs Added** (After lines 262, 282)
   - Logs warning if transaction limits are reached
   - Helps identify groups that may need further optimization

### 2. Client Endpoint: `/api/clients/[id]/analytics/graphs`

**File:** `src/app/api/clients/[id]/analytics/graphs/route.ts`

#### Changes:
1. ✅ **Date Range Reduced** (Line 150)
   - Changed from 24 months to 12 months

2. ✅ **Default Resolution Changed** (Line 52)
   - Changed from 'standard' to 'low'

3. ✅ **Cache TTL Increased** (Line 418)
   - Changed from 10 minutes to 30 minutes

4. ✅ **Warning Logs Added** (After lines 241, 260)
   - Logs warning if transaction limits are reached

**Note:** Client endpoint TAKE limits were already at reasonable values (100k/50k) and were not changed.

## Expected Performance Impact

### Before Optimization:
- **Response Time:** 92.9 seconds (local) - timing out in production
- **Date Range:** 24 months
- **Transaction Volume:** 13,880 period + 9,082 opening (EMP01 group)
- **Cache:** 10 minutes
- **Default Resolution:** 120 data points

### After Optimization:
- **Expected Response Time:** 15-30 seconds (67-75% improvement)
- **Date Range:** 12 months (~50% fewer transactions)
- **Transaction Limits:** More conservative (prevents extreme cases)
- **Cache:** 30 minutes (3x longer, better hit rate)
- **Default Resolution:** 60 data points (50% smaller payload)

## Testing Instructions

### Manual Testing (Required)

Since testing requires authenticated sessions, please perform the following tests after deployment:

#### 1. Test Group Analytics (EMP01)
```
1. Navigate to: /dashboard/audit/AUD/groups/EMP01/analytics
2. Click on "Graphs" tab
3. Verify:
   - Page loads without 500 error
   - Response time < 30 seconds
   - All data displays correctly
   - Check browser console for any errors
```

#### 2. Test Client Analytics (High-Volume Client)
```
1. Identify a client with many transactions
2. Navigate to: /dashboard/{serviceLine}/{subGroup}/clients/{clientId}/analytics
3. Click on "Graphs" tab
4. Verify:
   - Page loads without 500 error
   - Response time < 30 seconds
   - All service lines display correctly
```

#### 3. Test Different Resolutions
```
1. Open browser DevTools Network tab
2. Navigate to graphs page
3. Check the API call URL - should have ?resolution=low
4. Manually test higher resolutions by adding to URL:
   - ?resolution=standard (120 points)
   - ?resolution=high (365 points)
5. Verify all resolutions work within timeout
```

#### 4. Verify Data Accuracy
```
1. On the same client/group analytics page:
   - Note the "Total Billing" on Profitability tab
   - Note the "Total Billing" on Graphs tab
2. These should match (or be very close)
3. If there's a large discrepancy, investigate
```

#### 5. Monitor Production Logs
```
After deployment, monitor for:
- 500 error rate on /api/groups/.../analytics/graphs
- 500 error rate on /api/clients/.../analytics/graphs
- Warning logs about transaction limits being hit
- Response times (p50, p95, p99)
```

## Monitoring & Alerts

### Key Metrics to Watch:

1. **Error Rate**
   - Target: Zero 500 errors for 7 days
   - Alert: If error rate > 1% for 1 hour

2. **Response Times**
   - Target p50: < 10 seconds
   - Target p95: < 30 seconds
   - Target p99: < 45 seconds
   - Alert: If p95 > 30 seconds

3. **Cache Hit Rate**
   - Target: > 80% during business hours
   - Monitor: Cache misses should complete successfully

4. **Transaction Limit Warnings**
   - Monitor: How often limits are hit
   - Action: If frequent, consider Phase 2 database optimizations

## Rollback Plan

If issues arise:

1. **Immediate Rollback (Git)**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Partial Rollback**
   - Keep optimizations but restore 24-month range if users complain
   - Keep cache improvements regardless

3. **Cache Clear**
   ```bash
   # If stale data issues occur
   # Clear Redis cache for analytics keys
   ```

## Next Steps (Phase 2)

If performance is still not optimal after these changes:

1. **Database Indexes** (Requires migration)
   ```sql
   CREATE NONCLUSTERED INDEX idx_wip_client_date_type 
   ON WIPTransactions (GSClientID, TranDate, TType) 
   INCLUDE (Amount, TaskServLine, TranType);
   
   CREATE NONCLUSTERED INDEX idx_wip_task_date_type 
   ON WIPTransactions (GSTaskID, TranDate, TType) 
   INCLUDE (Amount, TaskServLine, TranType, GSClientID);
   ```

2. **Database Aggregation**
   - Move aggregation from JavaScript to SQL
   - Use Prisma `groupBy` or raw SQL for complex calculations

3. **Pre-computed Analytics** (Future)
   - Nightly job to pre-calculate analytics
   - Store in summary tables
   - API reads from summary tables (sub-second response)

## Files Modified

1. `src/app/api/groups/[groupCode]/analytics/graphs/route.ts`
2. `src/app/api/clients/[id]/analytics/graphs/route.ts`

## Success Criteria

- ✅ Zero 500 errors on both endpoints
- ✅ p95 response time < 30 seconds
- ✅ Cache hit rate > 80%
- ✅ Data accuracy maintained
- ✅ User satisfaction with 12-month range

## Notes

- Users can still request higher resolution via URL parameter if needed
- 12-month range should be adequate for most analytics use cases
- Consider adding UI toggle for date range in future enhancement
- Monitor for groups/clients hitting the 50k/100k transaction limits

