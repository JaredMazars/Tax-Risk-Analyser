# Admin Service Line Management Guide

## What Changed

✅ **All admin users now have access to all service lines** (Tax, Audit, Accounting, Advisory)

✅ **New Admin Interface** for managing service line access

## How to Access

### 1. Refresh Your Browser
After refreshing, you should now see **all 4 service line cards** on the dashboard:
- Tax
- Audit  
- Accounting
- Advisory

### 2. Access the Admin Panel
Navigate to: **Admin → Service Line Access**

Or directly: `/dashboard/admin/service-lines`

## Managing Service Line Access

### Grant Access to Users

1. Go to **Admin → Service Line Access**
2. Select the service line tab (Tax, Audit, Accounting, or Advisory)
3. Click **"Grant Access"**
4. Choose a user from the list
5. Select role:
   - **User**: Can view and work on projects
   - **Manager**: Can manage projects and team members  
   - **Admin**: Full control including permissions
6. Click **"Grant User"** or **"Grant Admin"**

### Change User Roles

1. Go to **Admin → Service Line Access**
2. Select the service line tab
3. Find the user in the table
4. Use the dropdown to change their role:
   - Viewer
   - User
   - Manager
   - Admin

### Revoke Access

1. Go to **Admin → Service Line Access**
2. Select the service line tab
3. Find the user in the table
4. Click the trash icon
5. Confirm the removal

## User Roles Explained

### Service Line Roles

- **VIEWER**: Read-only access to projects
- **USER**: Can create and edit projects
- **MANAGER**: Can manage projects and team members
- **ADMIN**: Full control including permissions

### Global vs Service Line Roles

- **Global Role** (in User table): Controls overall system access
- **Service Line Role** (in ServiceLineUser table): Controls access per service line

A user can have different roles in different service lines:
- Admin in Tax
- User in Audit
- No access to Accounting
- Manager in Advisory

## Common Scenarios

### New Employee - Grant Tax Access
```
1. Go to Admin → Service Line Access
2. Select "Tax" tab
3. Click "Grant Access"
4. Select the employee
5. Click "Grant User"
```

### Promote User to Service Line Manager
```
1. Go to Admin → Service Line Access
2. Select the service line tab
3. Find the user
4. Change role dropdown from "User" to "Manager"
```

### Grant Access to All Service Lines
```
For each service line (Tax, Audit, Accounting, Advisory):
1. Select the tab
2. Click "Grant Access"
3. Select the user
4. Click "Grant User" or "Grant Admin"
```

### Remove User from Service Line
```
1. Select the service line tab
2. Find the user
3. Click the trash icon
4. Confirm removal
```

## Via SQL (For Bulk Operations)

### Grant User Access to All Service Lines
```sql
DECLARE @userId NVARCHAR(1000) = '<user-id>';
DECLARE @role NVARCHAR(50) = 'USER'; -- or 'ADMIN', 'MANAGER', 'VIEWER'

INSERT INTO [dbo].[ServiceLineUser] ([userId], [serviceLine], [role], [updatedAt])
SELECT @userId, serviceLine, @role, CURRENT_TIMESTAMP
FROM (VALUES ('TAX'), ('AUDIT'), ('ACCOUNTING'), ('ADVISORY')) AS ServiceLines(serviceLine)
WHERE NOT EXISTS (
    SELECT 1 FROM [dbo].[ServiceLineUser]
    WHERE userId = @userId AND serviceLine = ServiceLines.serviceLine
);
```

### Make All Admins Have Access to All Service Lines
```sql
INSERT INTO [dbo].[ServiceLineUser] ([userId], [serviceLine], [role], [updatedAt])
SELECT u.id, sl.serviceLine, 'ADMIN', CURRENT_TIMESTAMP
FROM [dbo].[User] u
CROSS JOIN (VALUES ('TAX'), ('AUDIT'), ('ACCOUNTING'), ('ADVISORY')) AS sl(serviceLine)
WHERE u.role = 'ADMIN'
AND NOT EXISTS (
    SELECT 1 FROM [dbo].[ServiceLineUser] slu
    WHERE slu.userId = u.id AND slu.serviceLine = sl.serviceLine
);
```

## Checking Access

### View Your Service Lines
When you log in, you'll see cards for all service lines you have access to.

### View User's Service Lines
```sql
SELECT slu.serviceLine, slu.role, slu.createdAt
FROM [dbo].[ServiceLineUser] slu
WHERE slu.userId = '<user-id>'
ORDER BY slu.serviceLine;
```

### View All Users in a Service Line
```sql
SELECT u.name, u.email, slu.role
FROM [dbo].[ServiceLineUser] slu
JOIN [dbo].[User] u ON u.id = slu.userId
WHERE slu.serviceLine = 'TAX'
ORDER BY u.name;
```

## Troubleshooting

### User Can't See Service Line
- Check they have access: Admin → Service Line Access
- Verify their role is not just VIEWER (VIEWERs have limited access)
- Have them logout and login again

### Admin Can't See All Service Lines
- Run the grant admin access script again:
```sql
-- See grant_admin_access.sql
```

### Changes Not Appearing
- Refresh the browser (Ctrl+R or Cmd+R)
- Clear browser cache if needed
- Check the browser console for errors

## Best Practices

1. **Grant minimum necessary access**: Start with USER role, promote as needed
2. **Use service-line-specific admins**: Not everyone needs global ADMIN
3. **Regular audits**: Review who has access to what
4. **Onboarding**: Create a checklist for new hires
5. **Offboarding**: Remove all access when employees leave

## Next Steps

1. ✅ Refresh your browser to see all 4 service lines
2. ✅ Navigate to Admin → Service Line Access
3. ✅ Grant users access to their respective service lines
4. ✅ Start creating projects in different service lines

---

**Need Help?** Check the application logs or contact support.

