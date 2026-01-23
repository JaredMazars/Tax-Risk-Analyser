-- Add Full-Text Search Index for Client table
-- Purpose: Optimize multi-field search queries across clientNameFull, clientCode, groupDesc, groupCode, industry, sector
-- Performance: Expected 10-50x improvement over LIKE with OR conditions

-- Step 1: Create full-text catalog if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.fulltext_catalogs WHERE name = 'ClientSearchCatalog')
BEGIN
    PRINT 'Creating full-text catalog: ClientSearchCatalog';
    CREATE FULLTEXT CATALOG ClientSearchCatalog AS DEFAULT;
END
ELSE
BEGIN
    PRINT 'Full-text catalog ClientSearchCatalog already exists';
END
GO

-- Step 2: Create full-text index on Client table
IF NOT EXISTS (
    SELECT * 
    FROM sys.fulltext_indexes 
    WHERE object_id = OBJECT_ID('[dbo].[Client]')
)
BEGIN
    PRINT 'Creating full-text index on Client table';
    
    -- Create full-text index on search fields
    -- Note: Requires a unique index (PK) to exist on the table
    CREATE FULLTEXT INDEX ON [dbo].[Client]
    (
        clientNameFull LANGUAGE 1033,  -- English
        clientCode LANGUAGE 1033,
        groupDesc LANGUAGE 1033,
        groupCode LANGUAGE 1033,
        industry LANGUAGE 1033,
        sector LANGUAGE 1033
    )
    KEY INDEX [Client_pkey]  -- Primary key index name from schema
    ON ClientSearchCatalog
    WITH CHANGE_TRACKING AUTO;
    
    PRINT 'Full-text index created successfully';
END
ELSE
BEGIN
    PRINT 'Full-text index on Client table already exists';
END
GO

-- Step 3: Verify the full-text index was created
SELECT 
    OBJECT_NAME(object_id) AS TableName,
    'Full-text index exists' AS Status
FROM sys.fulltext_indexes
WHERE object_id = OBJECT_ID('[dbo].[Client]');
GO
