# Azure SQL Database Connection Guide

## Your Database Configuration

- **Server**: `fm-sql-server.database.windows.net`
- **Database**: `mapper-tax-db`
- **Resource Group**: `walter_sandbox`
- **Region**: West Europe
- **Authentication**: Microsoft Entra-only (Azure AD)
- **Admin**: WalterBlake@MazarsInAfrica.onmicrosoft.com

## Connection String Format

Since you're using Microsoft Entra-only authentication, you have two options:

### Option 1: Using Managed Identity (Recommended for Container Apps)

```bash
DATABASE_URL="sqlserver://fm-sql-server.database.windows.net:1433;database=mapper-tax-db;authentication=ActiveDirectoryMsi;encrypt=true;trustServerCertificate=false"
```

### Option 2: Using Azure AD Service Principal (for GitHub Actions)

```bash
DATABASE_URL="sqlserver://fm-sql-server.database.windows.net:1433;database=mapper-tax-db;authentication=ActiveDirectoryServicePrincipal;clientId=<CLIENT_ID>;clientSecret=<CLIENT_SECRET>;tenantId=<TENANT_ID>;encrypt=true;trustServerCertificate=false"
```

### Option 3: Using Azure AD Access Token (for local development)

For local development, you'll need to use `az login` and then:

```bash
# Get access token
ACCESS_TOKEN=$(az account get-access-token --resource https://database.windows.net/ --query accessToken -o tsv)

# Use in connection string
DATABASE_URL="sqlserver://fm-sql-server.database.windows.net:1433;database=mapper-tax-db;authentication=ActiveDirectoryAccessToken;encrypt=true;accessToken=$ACCESS_TOKEN"
```

## Required: Configure Firewall Rules

Even with Entra authentication, you need to allow access to the server:

```bash
# Allow Azure services
az sql server firewall-rule create \
  --resource-group walter_sandbox \
  --server fm-sql-server \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Allow your current IP (for local development)
MY_IP=$(curl -s https://api.ipify.org)
az sql server firewall-rule create \
  --resource-group walter_sandbox \
  --server fm-sql-server \
  --name AllowMyIP \
  --start-ip-address $MY_IP \
  --end-ip-address $MY_IP
```

## Grant Database Access

### For Container App (Managed Identity)

After creating your Container App, grant it database access:

```bash
# Get the Container App's managed identity
IDENTITY_ID=$(az containerapp show \
  --name mapper-tax-app \
  --resource-group walter_sandbox \
  --query identity.principalId -o tsv)

# Grant access in SQL
# You'll need to run this as SQL in Azure Portal Query Editor:
```

Then run this SQL in Azure Portal's Query Editor:

```sql
CREATE USER [mapper-tax-app] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [mapper-tax-app];
ALTER ROLE db_datawriter ADD MEMBER [mapper-tax-app];
ALTER ROLE db_ddladmin ADD MEMBER [mapper-tax-app];
```

### For Service Principal (GitHub Actions)

If you need a service principal for migrations:

```bash
# Create service principal
az ad sp create-for-rbac \
  --name "mapper-tax-db-access" \
  --role contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/walter_sandbox

# Note the appId, password, and tenant from output
```

Then grant SQL access via Azure Portal Query Editor:

```sql
CREATE USER [mapper-tax-db-access] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [mapper-tax-db-access];
ALTER ROLE db_datawriter ADD MEMBER [mapper-tax-db-access];
ALTER ROLE db_ddladmin ADD MEMBER [mapper-tax-db-access];
```

## Running Migrations

### Local Development

```bash
# Login to Azure
az login

# Set connection with access token
export DATABASE_URL="sqlserver://fm-sql-server.database.windows.net:1433;database=mapper-tax-db;authentication=ActiveDirectoryDefault;encrypt=true"

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

### From GitHub Actions

Update the GitHub Actions workflow to use service principal credentials for database access during migrations.

## Testing Connection

```bash
# Using Azure CLI
az sql db show \
  --resource-group walter_sandbox \
  --server fm-sql-server \
  --name mapper-tax-db

# Test with sqlcmd (if installed)
sqlcmd -S fm-sql-server.database.windows.net \
  -d mapper-tax-db \
  -G \
  -Q "SELECT @@VERSION"
```

## Enable Managed Identity for Container App

When creating your Container App, enable system-assigned managed identity:

```bash
az containerapp identity assign \
  --name mapper-tax-app \
  --resource-group walter_sandbox \
  --system-assigned
```

## Important Notes

1. **Serverless Pricing**: Your database will auto-pause after 1 hour of inactivity
2. **Connection Pooling**: Not needed with Prisma's built-in connection management
3. **Entra Authentication**: More secure than SQL authentication, no passwords to manage
4. **Firewall**: Must allow Azure services and your IP for access

## Prisma Data Source Configuration

Your `prisma/schema.prisma` has been updated to use `sqlserver` provider:

```prisma
datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}
```

## Azure SQL vs PostgreSQL Differences

Minor differences handled by Prisma automatically:
- ✅ ID generation (IDENTITY vs SERIAL)
- ✅ JSON support (NVARCHAR(MAX) vs JSONB)
- ✅ Timestamps (DATETIME2 vs TIMESTAMP)
- ✅ Indexes and constraints

No application code changes needed!

## Troubleshooting

### "Login failed for user"
- Ensure firewall rules allow your IP
- Verify you're logged in with `az account show`
- Check database exists: `az sql db show ...`

### "Cannot open server"
- Check server name is correct: `fm-sql-server.database.windows.net`
- Verify firewall rules: `az sql server firewall-rule list ...`

### "Database does not exist"
- Verify database name: `mapper-tax-db`
- Check it exists in Azure Portal

### Connection timeout
- Serverless database may be paused, wait 30-60 seconds for auto-resume
- Check network connectivity

## Cost Optimization

Your serverless configuration:
- **Auto-pause**: After 1 hour of inactivity
- **Auto-scale**: 0.5-1 vCores based on load
- **Estimated cost**: ~$5-15/month (when active)

Much cheaper than the always-on option!

## Next Steps

1. ✅ Configure firewall rules (above)
2. ✅ Run Prisma migrations (above)
3. ✅ Enable Container App managed identity
4. ✅ Grant SQL access to managed identity
5. ✅ Test connection



