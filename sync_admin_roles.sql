-- Update all users with system role ADMIN to also have ADMIN role in their service lines
UPDATE slu
SET slu.role = 'ADMIN'
FROM [dbo].[ServiceLineUser] slu
INNER JOIN [dbo].[User] u ON slu.userId = u.id
WHERE u.role = 'ADMIN'
AND slu.role != 'ADMIN';

-- Show results
SELECT 
    u.name as UserName,
    u.email,
    u.role as SystemRole,
    slu.serviceLine,
    slu.role as ServiceLineRole
FROM [dbo].[User] u
INNER JOIN [dbo].[ServiceLineUser] slu ON u.id = slu.userId
WHERE u.role = 'ADMIN'
ORDER BY u.name, slu.serviceLine;
