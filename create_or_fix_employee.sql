-- Create or fix Employee table structure
BEGIN TRY
    BEGIN TRANSACTION;

    -- If table doesn't exist, create it with correct structure
    IF OBJECT_ID('dbo.Employee', 'U') IS NULL
    BEGIN
        PRINT 'Creating Employee table with dual-ID structure';
        
        CREATE TABLE [dbo].[Employee] (
            [id] INT NOT NULL IDENTITY(1,1),
            [GSEmployeeID] uniqueidentifier NOT NULL,
            [EmpCode] NVARCHAR(10) NOT NULL,
            [EmpName] NVARCHAR(50) NOT NULL,
            [EmpNameFull] NVARCHAR(63) NOT NULL,
            [OfficeCode] NVARCHAR(10) NOT NULL,
            [SLGroup] NVARCHAR(10) NOT NULL,
            [ServLineCode] NVARCHAR(10) NOT NULL,
            [ServLineDesc] NVARCHAR(150) NOT NULL,
            [SubServLineCode] NVARCHAR(10) NOT NULL,
            [SubServLineDesc] NVARCHAR(50) NOT NULL,
            [EmpCatCode] NVARCHAR(5) NOT NULL,
            [EmpCatDesc] NVARCHAR(50) NOT NULL,
            [EmpCatType] NVARCHAR(1) NULL,
            [RateValue] MONEY NOT NULL,
            [EmpDateLeft] DATETIME2 NULL,
            [Active] VARCHAR(3) NOT NULL,
            [EmpDateStarted] DATETIME2 NULL,
            [Team] NVARCHAR(100) NULL,
            [WinLogon] NVARCHAR(100) NULL,
            [createdAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
            [updatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
            CONSTRAINT [Employee_pkey] PRIMARY KEY CLUSTERED ([id]),
            CONSTRAINT [Employee_GSEmployeeID_key] UNIQUE NONCLUSTERED ([GSEmployeeID])
        );

        CREATE NONCLUSTERED INDEX [Employee_Active_idx] ON [dbo].[Employee]([Active]);
        CREATE NONCLUSTERED INDEX [Employee_EmpCode_idx] ON [dbo].[Employee]([EmpCode]);
        CREATE NONCLUSTERED INDEX [Employee_GSEmployeeID_idx] ON [dbo].[Employee]([GSEmployeeID]);
        CREATE NONCLUSTERED INDEX [Employee_OfficeCode_idx] ON [dbo].[Employee]([OfficeCode]);
        CREATE NONCLUSTERED INDEX [Employee_ServLineCode_idx] ON [dbo].[Employee]([ServLineCode]);
        CREATE NONCLUSTERED INDEX [Employee_SLGroup_idx] ON [dbo].[Employee]([SLGroup]);
        CREATE NONCLUSTERED INDEX [Employee_WinLogon_idx] ON [dbo].[Employee]([WinLogon]);

        PRINT 'Employee table created successfully';
    END
    ELSE
    BEGIN
        PRINT 'Employee table exists - dropping and recreating with correct structure';
        
        -- Drop and recreate (since this is external sync data, we can recreate it)
        DROP TABLE [dbo].[Employee];
        
        CREATE TABLE [dbo].[Employee] (
            [id] INT NOT NULL IDENTITY(1,1),
            [GSEmployeeID] uniqueidentifier NOT NULL,
            [EmpCode] NVARCHAR(10) NOT NULL,
            [EmpName] NVARCHAR(50) NOT NULL,
            [EmpNameFull] NVARCHAR(63) NOT NULL,
            [OfficeCode] NVARCHAR(10) NOT NULL,
            [SLGroup] NVARCHAR(10) NOT NULL,
            [ServLineCode] NVARCHAR(10) NOT NULL,
            [ServLineDesc] NVARCHAR(150) NOT NULL,
            [SubServLineCode] NVARCHAR(10) NOT NULL,
            [SubServLineDesc] NVARCHAR(50) NOT NULL,
            [EmpCatCode] NVARCHAR(5) NOT NULL,
            [EmpCatDesc] NVARCHAR(50) NOT NULL,
            [EmpCatType] NVARCHAR(1) NULL,
            [RateValue] MONEY NOT NULL,
            [EmpDateLeft] DATETIME2 NULL,
            [Active] VARCHAR(3) NOT NULL,
            [EmpDateStarted] DATETIME2 NULL,
            [Team] NVARCHAR(100) NULL,
            [WinLogon] NVARCHAR(100) NULL,
            [createdAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
            [updatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
            CONSTRAINT [Employee_pkey] PRIMARY KEY CLUSTERED ([id]),
            CONSTRAINT [Employee_GSEmployeeID_key] UNIQUE NONCLUSTERED ([GSEmployeeID])
        );

        CREATE NONCLUSTERED INDEX [Employee_Active_idx] ON [dbo].[Employee]([Active]);
        CREATE NONCLUSTERED INDEX [Employee_EmpCode_idx] ON [dbo].[Employee]([EmpCode]);
        CREATE NONCLUSTERED INDEX [Employee_GSEmployeeID_idx] ON [dbo].[Employee]([GSEmployeeID]);
        CREATE NONCLUSTERED INDEX [Employee_OfficeCode_idx] ON [dbo].[Employee]([OfficeCode]);
        CREATE NONCLUSTERED INDEX [Employee_ServLineCode_idx] ON [dbo].[Employee]([ServLineCode]);
        CREATE NONCLUSTERED INDEX [Employee_SLGroup_idx] ON [dbo].[Employee]([SLGroup]);
        CREATE NONCLUSTERED INDEX [Employee_WinLogon_idx] ON [dbo].[Employee]([WinLogon]);

        PRINT 'Employee table recreated successfully';
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    PRINT 'ERROR: ' + @ErrorMessage;
    THROW;
END CATCH;
