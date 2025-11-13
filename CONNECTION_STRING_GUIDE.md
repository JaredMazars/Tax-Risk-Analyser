# Azure SQL Server Connection Guide

## Current Configuration

- **Server**: fm-sql-server.database.windows.net
- **Database**: mapper-tax-db  
- **Admin User**: sqladmin
- **Status**: Server is reachable (port 1433 open)
- **Your IP**: 160.226.158.146 (allowed in firewall)

## Correct DATABASE_URL Format

Your `.env` or `.env.local` file should have ONE of these formats:

### Format 1 (Recommended):
```
DATABASE_URL="sqlserver://fm-sql-server.database.windows.net:1433;database=mapper-tax-db;user=sqladmin;password=YOUR_PASSWORD_HERE;encrypt=true;trustServerCertificate=false;hostNameInCertificate=*.database.windows.net;loginTimeout=30"
```

### Format 2 (Alternative):
```
DATABASE_URL="sqlserver://fm-sql-server.database.windows.net:1433;database=mapper-tax-db;user=sqladmin@fm-sql-server;password={YOUR_PASSWORD_HERE};encrypt=true"
```

## IMPORTANT: Required Parameters for Azure SQL

Azure SQL REQUIRES these parameters in the connection string:
- `encrypt=true` - Azure SQL requires encrypted connections
- `trustServerCertificate=false` - For production security
- `hostNameInCertificate=*.database.windows.net` - Azure SQL certificate validation

## Common Issues

1. **Missing `encrypt=true`**: Connection will fail
2. **Password with special characters**: Wrap password in `{}` like `password={My!Pass@123}`
3. **Wrong username format**: Use either `sqladmin` OR `sqladmin@fm-sql-server` (not both)

## Testing Your Connection

After updating your .env file, test with:
```bash
npx prisma db pull
```

If successful, generate the Prisma client:
```bash
npx prisma generate
```

## Prisma Schema Status

✅ Your Prisma schema is correctly configured:
- Provider: sqlserver
- URL: env("DATABASE_URL")
