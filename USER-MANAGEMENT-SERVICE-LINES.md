# User Service Line Access Management

## Overview

The user management interface has been enhanced to support managing service line access for each user. All existing users have been automatically granted access to the TAX service line.

## What's New

### 1. Service Line Access Section in User Details

When you click on a user in the Admin > Users page, the modal now shows:

- **Service Line Access** section (above Project Assignments)
- Current service lines the user has access to
- Ability to add new service lines
- Ability to remove service line access
- Ability to change the user's role within each service line (User, Manager, Admin)

### 2. Visual Service Line Display

Each service line is displayed with:
- 📄 Colored icon representing the service line
- Service line name and description
- Role dropdown (User/Manager/Admin)
- Remove button

### 3. Add Service Line Dropdown

Click "Add Service Line" to see available service lines:
- Tax (blue)
- Audit (green)
- Accounting (purple)
- Advisory (yellow)

Service lines the user already has access to are grayed out.

### 4. All Users Granted TAX Access

✅ All existing users in the system have been automatically granted access to the TAX service line with their current role.

## How to Use

### Grant Service Line Access

1. Navigate to **Dashboard > Admin > Users**
2. Click on a user to open their details
3. Click **"Add Service Line"** in the Service Line Access section
4. Select the service line to grant access
5. The user is added with "USER" role by default

### Change User Role in Service Line

1. Open user details modal
2. Find the service line in the Service Line Access section
3. Use the dropdown to select:
   - **User**: Basic access to view and work on projects
   - **Manager**: Can manage projects and users
   - **Admin**: Full administrative access

### Remove Service Line Access

1. Open user details modal
2. Find the service line to remove
3. Click the 🗑️ trash icon
4. Confirm removal

## Service Line Roles

- **USER**: Can access and work on projects in the service line
- **MANAGER**: Can manage projects and view analytics
- **ADMIN**: Full control over the service line, including user management

## Technical Details

### Database Changes

- All users granted TAX access via SQL migration
- ServiceLineUser records created with appropriate roles

### API Endpoints Used

- `GET /api/admin/service-line-access?userId={userId}` - Fetch user's service lines
- `POST /api/admin/service-line-access` - Grant service line access
- `PUT /api/admin/service-line-access` - Update role
- `DELETE /api/admin/service-line-access?id={id}` - Remove access

### Component Updates

**File**: `src/app/dashboard/admin/users/page.tsx`

**New Features**:
- Service line access management in user modal
- Dropdown for adding service lines
- Role selection dropdown
- Remove access button
- Click-outside to close dropdown

## Access Control

Only users with **ADMIN** role can:
- View the Admin > Users page
- Manage service line access for users
- Grant/revoke service line permissions

## Best Practices

1. **Grant minimum necessary access**: Only assign service lines users need
2. **Use appropriate roles**: Most users should have USER role
3. **Regular audits**: Review service line access periodically
4. **Document changes**: Note why users were given specific access

## Example Workflow

### Onboarding a New Tax User

1. User logs in (automatically added to system)
2. Admin navigates to Users page
3. Admin clicks on the new user
4. Admin clicks "Add Service Line" → TAX
5. Admin changes role to "USER" (default)
6. User can now access TAX dashboard and projects

### Promoting a User to Service Line Manager

1. Open user details
2. Find the service line (e.g., TAX)
3. Change role from "USER" to "MANAGER"
4. User now has manager permissions in TAX

### Giving User Multi-Service Line Access

1. Open user details
2. Click "Add Service Line" → AUDIT
3. Click "Add Service Line" → ACCOUNTING
4. User can now access TAX, AUDIT, and ACCOUNTING dashboards
5. User will see all three options on the service line selection page

## Troubleshooting

### User doesn't see any service lines

**Solution**: Grant them access via Admin > Users

### User can't access a specific service line

**Check**: Open user details and verify they have that service line assigned

### Service line shows but user gets access denied

**Check**: 
1. User has the service line in their access list
2. Role is not set to a restrictive value
3. Try logging out and back in

### Dropdown doesn't close

**Solution**: Click outside the dropdown or press Escape (automatic)

## Migration Summary

✅ Database migration completed
✅ ServiceLineUser table created
✅ All users granted TAX access
✅ UI updated with service line management
✅ API endpoints secured with admin checks

---

**Last Updated**: November 17, 2025
**Status**: ✅ Complete and tested
