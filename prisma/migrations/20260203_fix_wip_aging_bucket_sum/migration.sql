-- ============================================================================
-- Migration: Fix WIP Aging Bucket Sum
-- Version: 4.2
-- Date: 2026-02-03
-- ============================================================================
--
-- ISSUE:
-- The WIP Aging report showed aging buckets that didn't sum to Total WIP (BalWip).
-- For example, task NCC0126/COM24 showed:
--   - Sum of buckets: 153,351.58
--   - BalWip: 22,087.50
--   - Discrepancy: 131,264.08
--
-- ROOT CAUSE:
-- In Phase 2, negative bucket amounts (from negative ADJ transactions) were 
-- floored to 0 for FIFO display purposes, but TotalGrossWIP included the negatives.
-- This caused displayed buckets to sum to more than BalWip.
--
-- FIX:
-- 1. Track NegativeBucketTotal (sum of negative raw bucket values)
-- 2. Add ABS(NegativeBucketTotal) to TotalCredits as EffectiveCredits for FIFO
-- 3. Apply FIFO with EffectiveCredits so buckets are reduced further
-- 4. Use original FeeCreditsOnly for BalWip calculation (unchanged)
--
-- RESULT:
-- Sum of displayed buckets now equals BalWip for all tasks.
--
-- ============================================================================

-- Copy the updated stored procedure from prisma/procedures/sp_WIPAgingByTask.sql
-- The procedure has already been applied directly, this migration documents the change.

-- Verify the fix is in place by checking procedure modification date
SELECT 
    'sp_WIPAgingByTask' AS ProcedureName,
    modify_date AS LastModified,
    CASE 
        WHEN modify_date >= '2026-02-03' THEN 'Updated (v4.2)'
        ELSE 'Needs Update'
    END AS Status
FROM sys.procedures 
WHERE name = 'sp_WIPAgingByTask';

-- NOTE: The stored procedure sp_WIPAgingByTask v4.2 should be applied separately
-- using the SQL file at: prisma/procedures/sp_WIPAgingByTask.sql
-- 
-- Key changes in v4.2:
-- 1. Phase 2: Added NegativeBucketTotal calculation in #GrossWIP
-- 2. Phase 3: Added FeeCreditsOnly and EffectiveCredits (TotalCredits) tracking
-- 3. Phase 4-5: FIFO uses EffectiveCredits for bucket distribution
-- 4. Final Output: BalWip uses FeeCreditsOnly, buckets use EffectiveCredits
