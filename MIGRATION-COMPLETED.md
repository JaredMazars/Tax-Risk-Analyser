# Service Lines Migration - COMPLETED ✅

## Migration Status
**Date**: November 17, 2025
**Status**: Successfully Applied

## What Was Applied

### 1. Database Changes ✅
- **ServiceLineUser Table**: Created with user-to-service-line mappings
- **Project.serviceLine Column**: Already existed (likely from previous schema push)
- **Indexes**: Created for performance
  - `Project_serviceLine_idx`
  - `Project_serviceLine_status_archived_idx`
  - `ServiceLineUser_userId_idx`
  - `ServiceLineUser_serviceLine_idx`

### 2. Data Migration ✅
- All existing users have been granted **TAX** service line access
- User roles from global settings copied to TAX service line
- All existing projects retain `serviceLine = 'TAX'` (default value)

## Next Steps

### 1. Test the Application
```bash
# Start your development server
npm run dev
```

Then:
1. ✅ Login to the application
2. ✅ You should see the **Service Line Selection Page**
3. ✅ Click on the **TAX** service line card
4. ✅ You should see your existing projects
5. ✅ Create a new project - it will be assigned to TAX
6. ✅ All existing tax features should work as before

### 2. Grant Users Access to Other Service Lines (Optional)

To grant a user access to **Audit** service line:
```sql
INSERT INTO [dbo].[ServiceLineUser] ([userId], [serviceLine], [role], [updatedAt])
VALUES ('<user-id>', 'AUDIT', 'USER', CURRENT_TIMESTAMP);
```

To grant a user **Admin** access to all service lines:
```sql
DECLARE @userId NVARCHAR(1000) = '<user-id>';

INSERT INTO [dbo].[ServiceLineUser] ([userId], [serviceLine], [role], [updatedAt])
SELECT @userId, serviceLine, 'ADMIN', CURRENT_TIMESTAMP
FROM (VALUES ('TAX'), ('AUDIT'), ('ACCOUNTING'), ('ADVISORY')) AS ServiceLines(serviceLine)
WHERE NOT EXISTS (
    SELECT 1 FROM [dbo].[ServiceLineUser]
    WHERE userId = @userId AND serviceLine = ServiceLines.serviceLine
);
```

### 3. Verify Service Line Access

Check which service lines a user has access to:
```sql
SELECT userId, serviceLine, role, createdAt
FROM [dbo].[ServiceLineUser]
WHERE userId = '<user-id>';
```

Check all users with access to a specific service line:
```sql
SELECT slu.userId, u.name, u.email, slu.role
FROM [dbo].[ServiceLineUser] slu
JOIN [dbo].[User] u ON u.id = slu.userId
WHERE slu.serviceLine = 'TAX'
ORDER BY u.name;
```

## Verification Checklist

Run these checks to verify the migration:

- [ ] ServiceLineUser table exists and has data
- [ ] All users have TAX service line access
- [ ] All projects have serviceLine = 'TAX'
- [ ] Application loads without errors
- [ ] Service line selection page displays
- [ ] TAX service line workspace shows existing projects
- [ ] Can create new projects in TAX service line
- [ ] Tax-specific features (AI Tax Report, Tax Adjustments) are visible
- [ ] Navigation shows current service line

## Rollback (If Needed)

If you need to rollback:
```sql
-- Drop ServiceLineUser table
DROP TABLE [dbo].[ServiceLineUser];

-- Drop service line indexes
DROP INDEX [Project_serviceLine_idx] ON [dbo].[Project];
DROP INDEX [Project_serviceLine_status_archived_idx] ON [dbo].[Project];

-- Optionally remove serviceLine column (will lose data)
-- ALTER TABLE [dbo].[Project] DROP CONSTRAINT [DF_Project_serviceLine];
-- ALTER TABLE [dbo].[Project] DROP COLUMN [serviceLine];
```

## Technical Details

### Service Lines Available
- **TAX**: Tax Calculation, Tax Opinion, Tax Administration
- **AUDIT**: Audit Engagement, Audit Review, Audit Report
- **ACCOUNTING**: Financial Statements, Bookkeeping, Management Accounts
- **ADVISORY**: Advisory Project, Consulting Engagement, Strategy Review

### API Endpoints
- `GET /api/service-lines` - List accessible service lines
- `GET /api/service-lines/[serviceLine]` - Get stats for service line
- `GET /api/projects?serviceLine=TAX` - Filter projects by service line

### Routes
- `/dashboard` - Service line selection page
- `/dashboard/tax` - Tax service line workspace
- `/dashboard/audit` - Audit service line workspace
- `/dashboard/accounting` - Accounting service line workspace
- `/dashboard/advisory` - Advisory service line workspace

## Support

For issues or questions:
1. Check the logs at `logs/combined.log` and `logs/error.log`
2. Verify database connection in `.env`
3. Ensure all TypeScript types are generated: `npx prisma generate`
4. Check React Query DevTools for API call issues

---

**Migration Completed**: ✅ November 17, 2025
**Next**: Test the application and grant users access to additional service lines as needed.

