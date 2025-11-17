-- Check ServiceLineUser table
SELECT COUNT(*) as ServiceLineUserCount FROM [dbo].[ServiceLineUser];

-- Check users with TAX access
SELECT COUNT(DISTINCT userId) as UsersWithTaxAccess 
FROM [dbo].[ServiceLineUser] 
WHERE serviceLine = 'TAX';

-- Check total users
SELECT COUNT(*) as TotalUsers FROM [dbo].[User];

-- Check projects with service line
SELECT serviceLine, COUNT(*) as ProjectCount 
FROM [dbo].[Project] 
GROUP BY serviceLine;
