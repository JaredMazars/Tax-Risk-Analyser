-- Check and create ServiceLineUser table if it doesn't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ServiceLineUser')
BEGIN
    CREATE TABLE [dbo].[ServiceLineUser] (
        [id] INT NOT NULL IDENTITY(1,1),
        [userId] NVARCHAR(1000) NOT NULL,
        [serviceLine] NVARCHAR(1000) NOT NULL,
        [role] NVARCHAR(1000) NOT NULL CONSTRAINT [DF_ServiceLineUser_role] DEFAULT 'USER',
        [createdAt] DATETIME2 NOT NULL CONSTRAINT [DF_ServiceLineUser_createdAt] DEFAULT CURRENT_TIMESTAMP,
        [updatedAt] DATETIME2 NOT NULL,
        CONSTRAINT [PK_ServiceLineUser] PRIMARY KEY CLUSTERED ([id] ASC),
        CONSTRAINT [FK_ServiceLineUser_User] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT [ServiceLineUser_userId_serviceLine_key] UNIQUE NONCLUSTERED ([userId] ASC, [serviceLine] ASC)
    );

    CREATE NONCLUSTERED INDEX [ServiceLineUser_userId_idx] ON [dbo].[ServiceLineUser]([userId] ASC);
    CREATE NONCLUSTERED INDEX [ServiceLineUser_serviceLine_idx] ON [dbo].[ServiceLineUser]([serviceLine] ASC);
    
    PRINT 'ServiceLineUser table created';
END
ELSE
BEGIN
    PRINT 'ServiceLineUser table already exists';
END

-- Check and add serviceLine indexes if they don't exist
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'Project_serviceLine_idx')
BEGIN
    CREATE NONCLUSTERED INDEX [Project_serviceLine_idx] ON [dbo].[Project]([serviceLine] ASC);
    PRINT 'Project_serviceLine_idx index created';
END
ELSE
BEGIN
    PRINT 'Project_serviceLine_idx index already exists';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'Project_serviceLine_status_archived_idx')
BEGIN
    CREATE NONCLUSTERED INDEX [Project_serviceLine_status_archived_idx] ON [dbo].[Project]([serviceLine] ASC, [status] ASC, [archived] ASC);
    PRINT 'Project_serviceLine_status_archived_idx index created';
END
ELSE
BEGIN
    PRINT 'Project_serviceLine_status_archived_idx index already exists';
END

-- Grant all existing users TAX service line access
INSERT INTO [dbo].[ServiceLineUser] ([userId], [serviceLine], [role], [updatedAt])
SELECT [id], 'TAX', [role], CURRENT_TIMESTAMP
FROM [dbo].[User]
WHERE NOT EXISTS (
    SELECT 1 FROM [dbo].[ServiceLineUser] 
    WHERE [ServiceLineUser].[userId] = [User].[id] 
    AND [ServiceLineUser].[serviceLine] = 'TAX'
);

PRINT 'Migration completed successfully';
