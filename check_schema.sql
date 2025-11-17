-- Check if ServiceLineUser table exists
SELECT COUNT(*) as ServiceLineUserExists
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME = 'ServiceLineUser';

-- Check if serviceLine column exists on Project table
SELECT COUNT(*) as ServiceLineColumnExists
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Project' AND COLUMN_NAME = 'serviceLine';
