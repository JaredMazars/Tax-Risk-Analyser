# Permission System Testing Guide

## Overview
This guide provides step-by-step instructions for testing the new role-based permission system.

## Prerequisites

1. **Run the migration**:
   ```bash
   # Apply the migration to your database
   # Note: You may need to run this manually against Azure SQL
   ```

2. **Seed permissions**:
   ```bash
   npm run seed:permissions
   ```

3. **Ensure at least one SUPERUSER exists**:
   The system requires at least one SUPERUSER to manage permissions. If you don't have one:
   ```bash
   npm run add:admin
   ```

## User Roles

### Role Hierarchy (least to most permissions)

1. **VIEWER**: Read-only access to most pages
2. **USER**: Basic access with ability to work on assigned projects
3. **SUPERVISOR**: Can create projects and manage team members
4. **MANAGER**: Full CRUD on service line, manage clients and projects
5. **PARTNER**: Full access across service lines, limited admin
6. **ADMIN**: Full CRUD + admin pages access
7. **SUPERUSER**: Complete system access (bypasses all checks)

## Testing Steps

### Step 1: Access the Permission Matrix

1. Log in as a SUPERUSER or ADMIN
2. Navigate to `/dashboard/admin/permissions`
3. You should see a matrix table with:
   - Columns for each role (PARTNER, MANAGER, SUPERVISOR, ADMIN, USER, VIEWER)
   - Rows grouped by Pages and Features
   - CRUD checkboxes for each permission

### Step 2: Modify Role Permissions

1. Click on any CRUD checkbox to toggle permissions
2. Notice the yellow banner showing unsaved changes
3. Click "Save Changes" to persist
4. Verify the changes are saved by refreshing the page

### Step 3: Test Role-Based Access

#### Test VIEWER Role

1. Update a test user's role to 'VIEWER' in the database:
   ```sql
   UPDATE [User] SET role = 'VIEWER' WHERE email = 'test@example.com';
   ```

2. Log in as this user
3. Verify:
   - ✅ Can view dashboard
   - ✅ Can view clients (if has READ permission)
   - ✅ Can view projects
   - ❌ Cannot create clients
   - ❌ Cannot create projects
   - ❌ Cannot access admin pages
   - ❌ Admin menu should not appear in navigation

#### Test USER Role

1. Update a test user's role to 'USER':
   ```sql
   UPDATE [User] SET role = 'USER' WHERE email = 'test@example.com';
   ```

2. Log in as this user
3. Verify:
   - ✅ Can view all pages
   - ✅ Can upload documents to assigned projects
   - ✅ Can create/edit mappings and adjustments
   - ❌ Cannot create new projects
   - ❌ Cannot delete clients
   - ❌ Cannot access admin pages

#### Test SUPERVISOR Role

1. Update a test user's role to 'SUPERVISOR':
   ```sql
   UPDATE [User] SET role = 'SUPERVISOR' WHERE email = 'test@example.com';
   ```

2. Log in as this user
3. Verify:
   - ✅ Can create new projects
   - ✅ Can assign users to projects
   - ✅ Can approve client acceptance
   - ✅ Can delete documents
   - ❌ Cannot delete clients
   - ❌ Cannot access admin pages (except templates - read only)

#### Test MANAGER Role

1. Update a test user's role to 'MANAGER':
   ```sql
   UPDATE [User] SET role = 'MANAGER' WHERE email = 'test@example.com';
   ```

2. Log in as this user
3. Verify:
   - ✅ Full CRUD on clients within service line
   - ✅ Full CRUD on projects within service line
   - ✅ Can manage BD opportunities
   - ✅ Can publish tax opinions
   - ❌ Cannot access admin pages
   - ❌ Cannot manage users or service lines

#### Test PARTNER Role

1. Update a test user's role to 'PARTNER':
   ```sql
   UPDATE [User] SET role = 'PARTNER' WHERE email = 'test@example.com';
   ```

2. Log in as this user
3. Verify:
   - ✅ Full CRUD across all service lines (that they have access to)
   - ✅ Can view admin templates (read-only)
   - ✅ Full access to BD/CRM functionality
   - ❌ Cannot manage users
   - ❌ Cannot modify service line access
   - ❌ Cannot access permission matrix

#### Test ADMIN Role

1. Update a test user's role to 'ADMIN':
   ```sql
   UPDATE [User] SET role = 'ADMIN' WHERE email = 'test@example.com';
   ```

2. Log in as this user
3. Verify:
   - ✅ Full access to all features
   - ✅ Can access all admin pages
   - ✅ Can manage users
   - ✅ Can manage service lines
   - ✅ Can view and modify permission matrix
   - ✅ Admin menu appears in navigation

#### Test SUPERUSER Role

1. SUPERUSER bypasses all permission checks
2. Verify:
   - ✅ All permissions automatically granted
   - ✅ No permission API calls needed
   - ✅ Full access to everything

### Step 4: Test API Route Protection

Use a tool like Postman or curl to test API routes:

```bash
# Should fail without READ permission on clients
curl -X GET http://localhost:3000/api/clients \
  -H "Cookie: session=YOUR_SESSION_TOKEN"

# Should fail without CREATE permission on projects
curl -X POST http://localhost:3000/api/projects \
  -H "Cookie: session=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project","serviceLine":"TAX"}'

# Should fail for non-admin on admin routes
curl -X GET http://localhost:3000/api/admin/users \
  -H "Cookie: session=YOUR_SESSION_TOKEN"
```

### Step 5: Test UI Permission Gates

1. Use browser DevTools to inspect elements
2. Verify that buttons/links are hidden based on permissions:
   - Create Client button should only show if user has `clients.create` CREATE permission
   - Delete buttons should only show if user has DELETE permission
   - Admin menu should only show if user has `admin` READ permission

## Common Test Scenarios

### Scenario 1: Create a Custom Role Configuration

1. Log in as SUPERUSER or ADMIN
2. Navigate to Permission Matrix
3. Create a custom permission set for "MANAGER":
   - Enable: Projects (READ, UPDATE)
   - Enable: Clients (READ only)
   - Enable: Documents (READ, CREATE)
   - Disable: Projects.delete
4. Save changes
5. Test with a MANAGER role user

### Scenario 2: Restrict Access to Sensitive Features

1. Remove DELETE permissions from USER role for all resources
2. Remove CREATE permissions from VIEWER role
3. Verify users cannot perform these actions

### Scenario 3: Grant Limited Admin Access

1. Grant PARTNER role access to `admin.templates` (READ only)
2. Verify they can view templates but not create/edit/delete
3. Verify they cannot access other admin pages

## Verification Checklist

- [ ] Migration applied successfully
- [ ] Permissions seeded successfully
- [ ] Permission matrix page loads and displays correctly
- [ ] Can modify and save permissions
- [ ] VIEWER role has read-only access
- [ ] USER role can work on assigned projects
- [ ] SUPERVISOR can create and manage projects
- [ ] MANAGER has full CRUD within service line
- [ ] PARTNER has cross-service line access
- [ ] ADMIN can access all admin pages
- [ ] SUPERUSER bypasses all checks
- [ ] API routes enforce permissions correctly
- [ ] UI elements hide based on permissions
- [ ] Navigation menu updates based on permissions
- [ ] Permission checks don't break existing functionality

## Troubleshooting

### "Forbidden - Insufficient permissions" error

1. Check the user's role in the database
2. Verify permissions are seeded (`npm run seed:permissions`)
3. Check the permission matrix to ensure the role has the required permission
4. Clear React Query cache and refresh the browser

### Permission Matrix Not Loading

1. Ensure user is ADMIN or SUPERUSER
2. Check browser console for errors
3. Verify API route `/api/permissions/matrix` is accessible

### Changes Not Saving

1. Check browser console for errors
2. Verify the user has `admin.permissions` UPDATE permission
3. Ensure database connection is working

### SUPERUSER Not Bypassing Checks

1. Verify role is exactly 'SUPERUSER' (case-sensitive)
2. Check the auth service is correctly detecting SUPERUSER
3. Clear session and re-login

## Rollback Procedure

If you need to rollback the permission system:

1. Remove permission checks from API routes
2. Restore navigation components to original state
3. Run the rollback SQL:
   ```sql
   DROP TABLE [RolePermission];
   DROP TABLE [Permission];
   ```
4. Remove seed script and permission service files

## Next Steps

After successful testing:

1. Update user roles in production database
2. Run migration and seed in production
3. Communicate changes to users
4. Monitor logs for permission-related errors
5. Adjust permissions as needed based on user feedback

## Notes

- Permission checks add minimal overhead (<50ms per check)
- Permissions are cached in React Query (5 minutes)
- Database queries are optimized with indexes
- SUPERUSER role should be granted sparingly
- Regularly audit permission assignments
- Consider implementing permission change audit logs


