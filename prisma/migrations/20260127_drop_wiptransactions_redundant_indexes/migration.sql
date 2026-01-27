-- ============================================================================
-- Migration: Drop Redundant WIPTransactions Indexes
-- Date: 2026-01-27
-- ============================================================================
-- Purpose: Remove indexes that are redundant with super covering indexes
--
-- Context:
-- - Super covering indexes include TranDate as key column and cover all common query fields
-- - These composite indexes are no longer needed:
--   1. WIPTransactions_TaskManager_TranDate_idx (TaskManager, TranDate)
--   2. WIPTransactions_TaskPartner_TranDate_idx (TaskPartner, TranDate)
--   3. WIPTransactions_TranDate_idx (TranDate)
--
-- Reasoning:
-- - idx_wip_gsclientid_super_covering and idx_wip_gstaskid_super_covering handle
--   all client-level and task-level queries with covering INCLUDE columns
-- - TaskManager and TaskPartner are included in the super covering indexes,
--   so filtered queries on these columns can use the covering indexes
-- - TranDate is the second key column in both super covering indexes
--
-- Indexes Being Removed:
-- 1. WIPTransactions_TaskManager_TranDate_idx
-- 2. WIPTransactions_TaskPartner_TranDate_idx
-- 3. WIPTransactions_TranDate_idx
--
-- Indexes Being Kept:
-- - idx_wip_gsclientid_super_covering: (GSClientID, TranDate) INCLUDE (9 columns)
-- - idx_wip_gstaskid_super_covering: (GSTaskID, TranDate) INCLUDE (9 columns)
-- - WIPTransactions_GSWIPTransID_key: UNIQUE constraint (required for @unique)
-- - Primary key on id (clustered)
--
-- Performance Impact:
-- - Positive: Faster inserts/updates (3 fewer indexes to maintain)
-- - Positive: Less disk space
-- - Neutral: All queries covered by super covering indexes
--
-- Rollback: See rollback.sql in this folder
-- ============================================================================

-- Drop indexes if they exist
IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('WIPTransactions') AND name = 'WIPTransactions_TaskManager_TranDate_idx')
    DROP INDEX [WIPTransactions_TaskManager_TranDate_idx] ON [dbo].[WIPTransactions];

IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('WIPTransactions') AND name = 'WIPTransactions_TaskPartner_TranDate_idx')
    DROP INDEX [WIPTransactions_TaskPartner_TranDate_idx] ON [dbo].[WIPTransactions];

IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('WIPTransactions') AND name = 'WIPTransactions_TranDate_idx')
    DROP INDEX [WIPTransactions_TranDate_idx] ON [dbo].[WIPTransactions];

PRINT 'Successfully dropped 3 redundant WIPTransactions indexes';
