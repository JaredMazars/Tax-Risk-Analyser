-- ============================================================================
-- Migration: Optimize DrsTransactions Indexes
-- Created: 2026-01-28
-- Description: Consolidate 6 indexes into 2 optimal covering indexes
-- ============================================================================

-- Required for filtered indexes
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- STEP 1: DROP EXISTING INDEXES
-- ============================================================================

-- Drop old covering indexes (to be replaced with improved versions)
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_drs_biller_super_covering' AND object_id = OBJECT_ID('dbo.DrsTransactions'))
BEGIN
    DROP INDEX [idx_drs_biller_super_covering] ON [dbo].[DrsTransactions];
    PRINT 'Dropped index: idx_drs_biller_super_covering';
END

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_drs_gsclientid_super_covering' AND object_id = OBJECT_ID('dbo.DrsTransactions'))
BEGIN
    DROP INDEX [idx_drs_gsclientid_super_covering] ON [dbo].[DrsTransactions];
    PRINT 'Dropped index: idx_drs_gsclientid_super_covering';
END

-- Drop single-column indexes (redundant - not used in any WHERE clauses)
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'DrsTransactions_OfficeCode_idx' AND object_id = OBJECT_ID('dbo.DrsTransactions'))
BEGIN
    DROP INDEX [DrsTransactions_OfficeCode_idx] ON [dbo].[DrsTransactions];
    PRINT 'Dropped index: DrsTransactions_OfficeCode_idx';
END

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'DrsTransactions_PeriodKey_idx' AND object_id = OBJECT_ID('dbo.DrsTransactions'))
BEGIN
    DROP INDEX [DrsTransactions_PeriodKey_idx] ON [dbo].[DrsTransactions];
    PRINT 'Dropped index: DrsTransactions_PeriodKey_idx';
END

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'DrsTransactions_ServLineCode_idx' AND object_id = OBJECT_ID('dbo.DrsTransactions'))
BEGIN
    DROP INDEX [DrsTransactions_ServLineCode_idx] ON [dbo].[DrsTransactions];
    PRINT 'Dropped index: DrsTransactions_ServLineCode_idx';
END

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'DrsTransactions_TranDate_idx' AND object_id = OBJECT_ID('dbo.DrsTransactions'))
BEGIN
    DROP INDEX [DrsTransactions_TranDate_idx] ON [dbo].[DrsTransactions];
    PRINT 'Dropped index: DrsTransactions_TranDate_idx';
END

-- ============================================================================
-- STEP 2: CREATE NEW COVERING INDEXES
-- ============================================================================

-- Index 1: Client-Based Covering Index
-- Covers: Client balance queries, debtor aging, group rollups, invoice details
-- Routes:
--   - /api/clients/[id]/balances
--   - /api/clients/[id]
--   - /api/clients/[id]/debtors
--   - /api/clients/[id]/debtors/details
--   - /api/groups/[groupCode]/debtors
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_drs_client_covering' AND object_id = OBJECT_ID('dbo.DrsTransactions'))
BEGIN
    CREATE NONCLUSTERED INDEX [idx_drs_client_covering]
    ON [dbo].[DrsTransactions]([GSClientID], [TranDate])
    INCLUDE (
        [Total],
        [EntryType],
        [InvNumber],
        [Reference],
        [ServLineCode],
        [Biller],
        [ClientCode],
        [ClientNameFull],
        [GroupCode],
        [GroupDesc],
        [updatedAt]
    )
    WHERE ([GSClientID] IS NOT NULL);
    -- Note: Narration excluded - TEXT columns cannot be included in indexes
    PRINT 'Created index: idx_drs_client_covering';
END

-- Index 2: Biller-Based Covering Index
-- Covers: Recoverability reports, monthly collections, net billings, debtor balance calculations
-- Routes:
--   - /api/my-reports/recoverability
--   - /api/my-reports/overview
--   - src/lib/utils/sql/monthlyAggregation.ts
--   - src/lib/utils/sql/wipBalanceCalculation.ts
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_drs_biller_covering' AND object_id = OBJECT_ID('dbo.DrsTransactions'))
BEGIN
    CREATE NONCLUSTERED INDEX [idx_drs_biller_covering]
    ON [dbo].[DrsTransactions]([Biller], [TranDate], [EntryType])
    INCLUDE (
        [Total],
        [InvNumber],
        [Reference],
        [ServLineCode],
        [GSClientID],
        [ClientCode],
        [ClientNameFull],
        [GroupCode],
        [GroupDesc],
        [updatedAt]
    )
    WHERE ([Biller] IS NOT NULL);
    -- Note: Narration excluded - TEXT columns cannot be included in indexes
    PRINT 'Created index: idx_drs_biller_covering';
END

-- ============================================================================
-- STEP 3: UPDATE STATISTICS
-- ============================================================================

UPDATE STATISTICS [dbo].[DrsTransactions] WITH FULLSCAN;
PRINT 'Updated statistics for DrsTransactions table';

-- ============================================================================
-- VERIFICATION: Show final index state
-- ============================================================================

SELECT 
    i.name AS IndexName,
    i.type_desc AS IndexType,
    i.is_unique AS IsUnique,
    i.has_filter AS HasFilter,
    i.filter_definition AS FilterDefinition,
    STRING_AGG(c.name, ', ') WITHIN GROUP (ORDER BY ic.key_ordinal) AS KeyColumns
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('dbo.DrsTransactions')
    AND ic.is_included_column = 0
GROUP BY i.name, i.type_desc, i.is_unique, i.has_filter, i.filter_definition
ORDER BY i.name;
