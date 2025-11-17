# Troubleshooting Service Lines Home Screen

## Debug Steps

### 1. Check Browser Console
Open your browser's Developer Tools (F12 or Right-click → Inspect) and go to the Console tab.

You should see these logs:
```
Fetching service lines from /api/service-lines...
Service lines response status: 200
Service lines result: {success: true, data: [...]}
Available service lines: [...]
Dashboard Home - isLoading: false
Dashboard Home - availableServiceLines: [...]
```

### 2. Common Issues & Fixes

#### Issue: Stuck on "Loading service lines..."
**Symptom**: Page shows loading spinner forever

**Check**:
1. Open Console - look for error messages
2. Check Network tab - is `/api/service-lines` request failing?
3. Verify you're logged in (check if redirected to login)

**Fix**:
```bash
# Restart your dev server
npm run dev
```

#### Issue: "No Service Lines Available"
**Symptom**: Page says you have no access

**Check Console for**:
```
Available service lines: []
```

**Fix**: You need to be granted access. Run this SQL:
```sql
-- Grant yourself access to all service lines
DECLARE @userId NVARCHAR(1000) = '<your-user-id>';

INSERT INTO [dbo].[ServiceLineUser] ([userId], [serviceLine], [role], [updatedAt])
SELECT @userId, sl.serviceLine, 'ADMIN', CURRENT_TIMESTAMP
FROM (VALUES ('TAX'), ('AUDIT'), ('ACCOUNTING'), ('ADVISORY')) AS sl(serviceLine)
WHERE NOT EXISTS (
    SELECT 1 FROM [dbo].[ServiceLineUser]
    WHERE userId = @userId AND serviceLine = sl.serviceLine
);
```

Or use the admin script we created:
```bash
cd /Users/walter.blake/Documents/development/mapper
npx prisma db execute --file grant_admin_access.sql --schema prisma/schema.prisma
```

#### Issue: API Returns 401 Unauthorized
**Symptom**: Console shows `Service lines response status: 401`

**Fix**: 
- Clear browser cookies
- Logout and login again
- Check if your session expired

#### Issue: Cards Don't Appear
**Symptom**: Console shows service lines but cards don't render

**Check**:
1. Look for JavaScript errors in console
2. Check if ServiceLineCard component has errors
3. Verify data structure matches expected format

### 3. Manual API Test

Test the API endpoint directly:

**Option A: Browser**
Visit: `http://localhost:3000/api/service-lines`

Should return:
```json
{
  "success": true,
  "data": [
    {
      "serviceLine": "TAX",
      "role": "ADMIN",
      "projectCount": X,
      "activeProjectCount": Y
    },
    ...
  ]
}
```

**Option B: Terminal**
```bash
curl http://localhost:3000/api/service-lines \
  -H "Cookie: <your-session-cookie>"
```

### 4. Check Database

Verify you have service line access:

```sql
-- Check your user ID
SELECT id, name, email, role FROM [dbo].[User] WHERE email = '<your-email>';

-- Check your service line access (use your ID from above)
SELECT * FROM [dbo].[ServiceLineUser] WHERE userId = '<your-user-id>';

-- Should show 4 rows (TAX, AUDIT, ACCOUNTING, ADVISORY)
```

### 5. Force Refresh

Sometimes the issue is browser cache:

1. **Hard refresh**: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. **Clear cache**: Settings → Clear browsing data → Cached images and files
3. **Incognito mode**: Try in a private/incognito window

### 6. Check Server Logs

Look at server console where `npm run dev` is running for errors.

## Quick Fix Script

If you're an admin and can't see service lines, run this:

```bash
cd /Users/walter.blake/Documents/development/mapper

# Grant all admins access to all service lines
cat > fix_admin_access.sql << 'EOF'
INSERT INTO [dbo].[ServiceLineUser] ([userId], [serviceLine], [role], [updatedAt])
SELECT u.id, sl.serviceLine, 'ADMIN', CURRENT_TIMESTAMP
FROM [dbo].[User] u
CROSS JOIN (VALUES ('TAX'), ('AUDIT'), ('ACCOUNTING'), ('ADVISORY')) AS sl(serviceLine)
WHERE u.role = 'ADMIN'
AND NOT EXISTS (
    SELECT 1 FROM [dbo].[ServiceLineUser] slu
    WHERE slu.userId = u.id AND slu.serviceLine = sl.serviceLine
);

SELECT u.name, u.email, slu.serviceLine, slu.role
FROM [dbo].[User] u
JOIN [dbo].[ServiceLineUser] slu ON u.id = slu.userId
WHERE u.role = 'ADMIN'
ORDER BY u.name, slu.serviceLine;
EOF

npx prisma db execute --file fix_admin_access.sql --schema prisma/schema.prisma

echo "✅ Admin access granted. Now logout and login again."
```

## What to Report

If issue persists, provide:

1. **Console logs** (copy from browser console)
2. **Network tab** screenshot of `/api/service-lines` request
3. **Server logs** from terminal where dev server is running
4. **SQL query results**:
   ```sql
   SELECT COUNT(*) FROM [dbo].[ServiceLineUser] WHERE userId = '<your-id>';
   ```

## Contact Points

- Check application logs: `logs/combined.log`
- Check error logs: `logs/error.log`
- Verify database connection in `.env`

---

## Most Common Fix

**90% of the time, this fixes it:**

1. Make sure you're logged in as an admin
2. Run the fix script above
3. Logout completely
4. Login again
5. Hard refresh the browser (Ctrl+Shift+R)

If you see the service lines after this, you're good to go! 🎉

