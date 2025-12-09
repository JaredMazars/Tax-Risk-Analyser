-- Check if Employee table exists and show structure
IF OBJECT_ID('dbo.Employee', 'U') IS NOT NULL
BEGIN
    PRINT 'Employee table exists';
    
    SELECT 
        c.name AS ColumnName,
        t.name AS DataType,
        c.max_length AS MaxLength,
        c.is_nullable AS IsNullable,
        c.is_identity AS IsIdentity,
        CASE WHEN pk.column_id IS NOT NULL THEN 'YES' ELSE 'NO' END AS IsPrimaryKey
    FROM sys.columns c
    INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
    LEFT JOIN (
        SELECT ic.object_id, ic.column_id
        FROM sys.indexes i
        INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
        WHERE i.is_primary_key = 1 AND i.object_id = OBJECT_ID('dbo.Employee')
    ) pk ON c.object_id = pk.object_id AND c.column_id = pk.column_id
    WHERE c.object_id = OBJECT_ID('dbo.Employee')
    ORDER BY c.column_id;
END
ELSE
BEGIN
    PRINT 'Employee table does NOT exist';
END;
