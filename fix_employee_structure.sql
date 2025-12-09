-- Fix Employee table structure
-- This script checks current state and applies changes as needed

BEGIN TRY
    BEGIN TRANSACTION;

    -- Check if id column exists
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Employee' AND COLUMN_NAME = 'id'
    )
    BEGIN
        -- Check if GSEmpID column exists (old name)
        IF EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Employee' AND COLUMN_NAME = 'GSEmpID'
        )
        BEGIN
            -- Drop any existing primary key
            DECLARE @pkName NVARCHAR(200)
            SELECT @pkName = CONSTRAINT_NAME
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
            WHERE TABLE_NAME = 'Employee' AND CONSTRAINT_TYPE = 'PRIMARY KEY'
            
            IF @pkName IS NOT NULL
            BEGIN
                EXEC('ALTER TABLE [dbo].[Employee] DROP CONSTRAINT [' + @pkName + ']')
            END

            -- Add the new id column
            ALTER TABLE [dbo].[Employee] ADD [id] INT NOT NULL IDENTITY(1,1);

            -- Rename GSEmpID to GSEmployeeID
            EXEC sp_rename 'dbo.Employee.GSEmpID', 'GSEmployeeID', 'COLUMN';

            -- Create new primary key on id
            ALTER TABLE [dbo].[Employee] ADD CONSTRAINT [Employee_pkey] PRIMARY KEY CLUSTERED ([id]);

            -- Create unique constraint on GSEmployeeID
            IF NOT EXISTS (
                SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                WHERE TABLE_NAME = 'Employee' AND CONSTRAINT_NAME = 'Employee_GSEmployeeID_key'
            )
            BEGIN
                ALTER TABLE [dbo].[Employee] ADD CONSTRAINT [Employee_GSEmployeeID_key] UNIQUE NONCLUSTERED ([GSEmployeeID]);
            END

            -- Create unique constraint on EmpCode if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                WHERE TABLE_NAME = 'Employee' AND CONSTRAINT_NAME = 'Employee_EmpCode_key'
            )
            BEGIN
                ALTER TABLE [dbo].[Employee] ADD CONSTRAINT [Employee_EmpCode_key] UNIQUE NONCLUSTERED ([EmpCode]);
            END
        END
        ELSE IF EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Employee' AND COLUMN_NAME = 'GSEmployeeID'
        )
        BEGIN
            -- GSEmployeeID exists but no id - add id column
            -- Drop any existing primary key
            DECLARE @pkName2 NVARCHAR(200)
            SELECT @pkName2 = CONSTRAINT_NAME
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
            WHERE TABLE_NAME = 'Employee' AND CONSTRAINT_TYPE = 'PRIMARY KEY'
            
            IF @pkName2 IS NOT NULL
            BEGIN
                EXEC('ALTER TABLE [dbo].[Employee] DROP CONSTRAINT [' + @pkName2 + ']')
            END

            -- Add the new id column
            ALTER TABLE [dbo].[Employee] ADD [id] INT NOT NULL IDENTITY(1,1);

            -- Create new primary key on id
            ALTER TABLE [dbo].[Employee] ADD CONSTRAINT [Employee_pkey] PRIMARY KEY CLUSTERED ([id]);

            -- Create unique constraint on GSEmployeeID if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                WHERE TABLE_NAME = 'Employee' AND CONSTRAINT_NAME = 'Employee_GSEmployeeID_key'
            )
            BEGIN
                ALTER TABLE [dbo].[Employee] ADD CONSTRAINT [Employee_GSEmployeeID_key] UNIQUE NONCLUSTERED ([GSEmployeeID]);
            END

            -- Create unique constraint on EmpCode if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                WHERE TABLE_NAME = 'Employee' AND CONSTRAINT_NAME = 'Employee_EmpCode_key'
            )
            BEGIN
                ALTER TABLE [dbo].[Employee] ADD CONSTRAINT [Employee_EmpCode_key] UNIQUE NONCLUSTERED ([EmpCode]);
            END
        END
    END

    COMMIT TRANSACTION;
    PRINT 'Employee table structure updated successfully';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    
    RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
