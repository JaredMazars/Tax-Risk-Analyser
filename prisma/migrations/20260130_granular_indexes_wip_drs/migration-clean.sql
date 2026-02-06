-- ============================================================================
-- Clean Migration: Granular Indexes (Prisma-compatible)
-- Part 1: Drop old indexes
-- Part 2: Create new indexes
-- Part 3: Update statistics
-- ============================================================================

-- Part 1: Drop old WIPTransactions indexes
DROP INDEX IF EXISTS [idx_WIPTransactions_Task_Covering] ON [dbo].[WIPTransactions];

DROP INDEX IF EXISTS [idx_WIPTransactions_Date_EmpCode_Client_Covering] ON [dbo].[WIPTransactions];

-- Part 1: Drop old DrsTransactions indexes
DROP INDEX IF EXISTS [idx_drs_client_covering] ON [dbo].[DrsTransactions];

DROP INDEX IF EXISTS [idx_drs_biller_covering] ON [dbo].[DrsTransactions];

-- Part 2: Create WIPTransactions indexes

CREATE NONCLUSTERED INDEX [idx_wip_task]
ON [dbo].[WIPTransactions] ([GSTaskID], [TranDate])
INCLUDE ([Amount], [Cost], [Hour], [TType], [updatedAt])
WITH (DATA_COMPRESSION = PAGE, FILLFACTOR = 95, ONLINE = ON, SORT_IN_TEMPDB = ON, MAXDOP = 0);

CREATE NONCLUSTERED INDEX [idx_wip_client]
ON [dbo].[WIPTransactions] ([GSClientID], [TranDate])
INCLUDE ([Amount], [Cost], [Hour], [TType], [GSTaskID], [TaskServLine], [updatedAt])
WITH (DATA_COMPRESSION = PAGE, FILLFACTOR = 95, ONLINE = ON, SORT_IN_TEMPDB = ON, MAXDOP = 0);

CREATE NONCLUSTERED INDEX [idx_wip_partner_date]
ON [dbo].[WIPTransactions] ([TaskPartner], [TranDate])
INCLUDE ([GSTaskID], [Amount], [Cost], [Hour], [TType], [GSClientID], [ClientCode], [ClientName], [TaskCode], [TaskServLine])
WITH (DATA_COMPRESSION = PAGE, FILLFACTOR = 90, ONLINE = ON, SORT_IN_TEMPDB = ON, MAXDOP = 0);

CREATE NONCLUSTERED INDEX [idx_wip_manager_date]
ON [dbo].[WIPTransactions] ([TaskManager], [TranDate])
INCLUDE ([GSTaskID], [Amount], [Cost], [Hour], [TType], [GSClientID], [ClientCode], [ClientName], [TaskCode], [TaskServLine])
WITH (DATA_COMPRESSION = PAGE, FILLFACTOR = 90, ONLINE = ON, SORT_IN_TEMPDB = ON, MAXDOP = 0);

CREATE NONCLUSTERED INDEX [idx_wip_date]
ON [dbo].[WIPTransactions] ([TranDate], [GSClientID], [GSTaskID])
INCLUDE ([Amount], [Cost], [Hour], [TType], [EmpCode])
WITH (DATA_COMPRESSION = PAGE, FILLFACTOR = 90, ONLINE = ON, SORT_IN_TEMPDB = ON, MAXDOP = 0);

CREATE NONCLUSTERED INDEX [idx_wip_emp_date]
ON [dbo].[WIPTransactions] ([EmpCode], [TranDate], [TType])
INCLUDE ([GSTaskID], [Hour], [Amount])
WHERE ([EmpCode] IS NOT NULL)
WITH (DATA_COMPRESSION = PAGE, FILLFACTOR = 90, ONLINE = ON, SORT_IN_TEMPDB = ON, MAXDOP = 0);

-- Part 2: Create DrsTransactions indexes

CREATE NONCLUSTERED INDEX [idx_drs_biller_date]
ON [dbo].[DrsTransactions] ([Biller], [TranDate])
INCLUDE ([Total], [EntryType], [InvNumber], [Reference], [GSClientID], [ClientCode], [ClientNameFull], [GroupCode], [GroupDesc], [ServLineCode])
WHERE ([Biller] IS NOT NULL)
WITH (DATA_COMPRESSION = PAGE, FILLFACTOR = 90, ONLINE = ON, SORT_IN_TEMPDB = ON, MAXDOP = 0);

CREATE NONCLUSTERED INDEX [idx_drs_client_date]
ON [dbo].[DrsTransactions] ([GSClientID], [TranDate])
INCLUDE ([Total], [EntryType], [InvNumber], [Reference], [Biller], [ClientCode], [ClientNameFull], [GroupCode], [GroupDesc], [ServLineCode], [updatedAt])
WHERE ([GSClientID] IS NOT NULL)
WITH (DATA_COMPRESSION = PAGE, FILLFACTOR = 95, ONLINE = ON, SORT_IN_TEMPDB = ON, MAXDOP = 0);

CREATE NONCLUSTERED INDEX [idx_drs_client_group]
ON [dbo].[DrsTransactions] ([GSClientID], [GroupCode], [TranDate])
INCLUDE ([Total], [EntryType], [ServLineCode], [ClientCode])
WHERE ([GSClientID] IS NOT NULL)
WITH (DATA_COMPRESSION = PAGE, FILLFACTOR = 95, ONLINE = ON, SORT_IN_TEMPDB = ON, MAXDOP = 0);

-- Part 3: Update statistics

UPDATE STATISTICS [dbo].[WIPTransactions] WITH FULLSCAN;

UPDATE STATISTICS [dbo].[DrsTransactions] WITH FULLSCAN;
