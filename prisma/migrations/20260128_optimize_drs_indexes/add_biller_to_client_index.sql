SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- Drop and recreate idx_drs_client_covering with Biller included
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_drs_client_covering' AND object_id = OBJECT_ID('dbo.DrsTransactions'))
BEGIN
    DROP INDEX [idx_drs_client_covering] ON [dbo].[DrsTransactions];
    PRINT 'Dropped index: idx_drs_client_covering';
END
GO

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
GO

PRINT 'Created index: idx_drs_client_covering (with Biller)';
GO

UPDATE STATISTICS [dbo].[DrsTransactions] [idx_drs_client_covering];
GO

-- Verify
SELECT 
    i.name AS IndexName,
    STRING_AGG(c.name, ', ') WITHIN GROUP (ORDER BY c.name) AS IncludedColumns
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('dbo.DrsTransactions')
    AND i.name = 'idx_drs_client_covering'
    AND ic.is_included_column = 1
GROUP BY i.name;
GO
