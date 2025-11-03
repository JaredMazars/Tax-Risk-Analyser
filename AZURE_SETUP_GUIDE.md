# Azure Deployment Setup Guide

This guide provides step-by-step instructions for deploying the Tax Computation Mapper application to Azure.

## Prerequisites

- Azure CLI installed and logged in (`az login`)
- Docker installed (for local testing)
- Node.js 20+ installed
- Access to Azure subscription with `walter_sandbox` resource group
- Azure CLI Container Apps extension: `az extension add --name containerapp`

## Phase 1: Azure SQL Database Setup

### 1.1 Database Status

✅ **Already Created via Azure Portal:**
- Server: `fm-sql-server`
- Database: `mapper-tax-db`
- Region: West Europe
- Authentication: Microsoft Entra-only
- Admin: WalterBlake@MazarsInAfrica.onmicrosoft.com

### 1.2 Configure Firewall Rules

Allow Azure services and your IP to access the database:

```bash
# Allow Azure services
az sql server firewall-rule create \
  --resource-group walter_sandbox \
  --server fm-sql-server \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Allow your current IP
MY_IP=$(curl -s https://api.ipify.org)
az sql server firewall-rule create \
  --resource-group walter_sandbox \
  --server fm-sql-server \
  --name AllowMyIP \
  --start-ip-address $MY_IP \
  --end-ip-address $MY_IP
```

### 1.3 Set Connection String

For Azure SQL with Entra authentication:

```bash
export DATABASE_URL="sqlserver://fm-sql-server.database.windows.net:1433;database=mapper-tax-db;authentication=ActiveDirectoryDefault;encrypt=true"
```

### 1.4 Test Connection

```bash
az sql db show \
  --resource-group walter_sandbox \
  --server fm-sql-server \
  --name mapper-tax-db
```

## Phase 2: Azure AD App Registration

### 2.1 Register Application

```bash
az ad app create \
  --display-name "Tax Computation Mapper" \
  --sign-in-audience AzureADMyOrg
```

Save the `appId` from the output as `AZURE_AD_CLIENT_ID`.

### 2.2 Get Tenant ID

```bash
az account show --query tenantId -o tsv
```

Save this as `AZURE_AD_TENANT_ID`.

### 2.3 Create Client Secret

```bash
APP_ID="<YOUR_APP_ID>"
az ad app credential reset --id $APP_ID --append
```

Save the `password` field from output as `AZURE_AD_CLIENT_SECRET`.

### 2.4 Configure Redirect URIs

You'll need to add redirect URIs after deploying the Container App. For now, add localhost:

```bash
az ad app update --id $APP_ID \
  --web-redirect-uris "http://localhost:3000/api/auth/callback/azure-ad" \
                      "https://mapper-tax-app.YOUR-REGION.azurecontainerapps.io/api/auth/callback/azure-ad"
```

**Note**: Update the production URL after deployment.

## Phase 3: Azure Blob Storage Setup

### 3.1 Create Storage Account

```bash
az storage account create \
  --name mappertaxstorage \
  --resource-group walter_sandbox \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2 \
  --access-tier Hot
```

### 3.2 Get Storage Connection String

```bash
az storage account show-connection-string \
  --name mappertaxstorage \
  --resource-group walter_sandbox \
  --output tsv
```

Save this as `AZURE_STORAGE_CONNECTION_STRING`.

### 3.3 Create Blob Container

```bash
az storage container create \
  --name adjustment-documents \
  --account-name mappertaxstorage \
  --auth-mode login
```

## Phase 4: Azure Container Registry Setup

### 4.1 Create Container Registry

```bash
az acr create \
  --resource-group walter_sandbox \
  --name mappertaxregistry \
  --sku Basic \
  --admin-enabled true
```

### 4.2 Get Registry Credentials

```bash
az acr credential show \
  --name mappertaxregistry \
  --resource-group walter_sandbox
```

Save `username` as `AZURE_REGISTRY_USERNAME` and one of the passwords as `AZURE_REGISTRY_PASSWORD`.

## Phase 5: Azure Container Apps Setup

### 5.1 Create Container Apps Environment

```bash
az containerapp env create \
  --name mapper-tax-env \
  --resource-group walter_sandbox \
  --location eastus
```

### 5.2 Create Container App

First, build and push initial image:

```bash
# Login to registry
az acr login --name mappertaxregistry

# Build and push image
docker build -t mappertaxregistry.azurecr.io/mapper-tax-app:latest .
docker push mappertaxregistry.azurecr.io/mapper-tax-app:latest
```

Then create the Container App:

```bash
az containerapp create \
  --name mapper-tax-app \
  --resource-group walter_sandbox \
  --environment mapper-tax-env \
  --image mappertaxregistry.azurecr.io/mapper-tax-app:latest \
  --registry-server mappertaxregistry.azurecr.io \
  --registry-username <REGISTRY_USERNAME> \
  --registry-password <REGISTRY_PASSWORD> \
  --target-port 3000 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 5 \
  --cpu 1.0 \
  --memory 2.0Gi
```

### 5.3 Configure Environment Secrets

```bash
# Add secrets
az containerapp secret set \
  --name mapper-tax-app \
  --resource-group walter_sandbox \
  --secrets \
    database-url="<DATABASE_CONNECTION_STRING>" \
    openai-api-key="<YOUR_OPENAI_KEY>" \
    nextauth-secret="<GENERATED_SECRET>" \
    azure-ad-client-id="<AZURE_AD_CLIENT_ID>" \
    azure-ad-client-secret="<AZURE_AD_CLIENT_SECRET>" \
    azure-storage-connection-string="<STORAGE_CONNECTION_STRING>"
```

### 5.4 Configure Environment Variables

```bash
az containerapp update \
  --name mapper-tax-app \
  --resource-group walter_sandbox \
  --set-env-vars \
    "NEXTAUTH_URL=https://mapper-tax-app.<REGION>.azurecontainerapps.io" \
    "AZURE_AD_TENANT_ID=<TENANT_ID>" \
    "AZURE_STORAGE_CONTAINER_NAME=adjustment-documents" \
    "NODE_ENV=production" \
    "MAX_FILE_UPLOAD_SIZE=10485760" \
    "RATE_LIMIT_MAX_REQUESTS=10" \
    "RATE_LIMIT_WINDOW_MS=60000" \
  --secret-env-vars \
    "DATABASE_URL=secretref:database-url" \
    "OPENAI_API_KEY=secretref:openai-api-key" \
    "NEXTAUTH_SECRET=secretref:nextauth-secret" \
    "AZURE_AD_CLIENT_ID=secretref:azure-ad-client-id" \
    "AZURE_AD_CLIENT_SECRET=secretref:azure-ad-client-secret" \
    "AZURE_STORAGE_CONNECTION_STRING=secretref:azure-storage-connection-string"
```

### 5.5 Get Container App URL

```bash
az containerapp show \
  --name mapper-tax-app \
  --resource-group walter_sandbox \
  --query properties.configuration.ingress.fqdn \
  --output tsv
```

## Phase 6: Database Migration

Run Prisma migrations on the Azure PostgreSQL database:

```bash
# Set DATABASE_URL environment variable
export DATABASE_URL="<YOUR_AZURE_POSTGRES_CONNECTION_STRING>"

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

## Phase 7: GitHub Actions Setup

### 7.1 Create Service Principal

```bash
az ad sp create-for-rbac \
  --name "mapper-tax-github-actions" \
  --role contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/walter_sandbox \
  --sdk-auth
```

Save the entire JSON output as GitHub secret `AZURE_CREDENTIALS`.

### 7.2 Configure GitHub Secrets

Add these secrets to your GitHub repository (Settings > Secrets and variables > Actions):

- `AZURE_CREDENTIALS` - Service principal JSON from previous step
- `AZURE_REGISTRY_USERNAME` - From Phase 4.2
- `AZURE_REGISTRY_PASSWORD` - From Phase 4.2
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - Your OpenAI API key
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Container App URL from Phase 5.5
- `AZURE_AD_CLIENT_ID` - From Phase 2.1
- `AZURE_AD_CLIENT_SECRET` - From Phase 2.3
- `AZURE_AD_TENANT_ID` - From Phase 2.2
- `AZURE_STORAGE_CONNECTION_STRING` - From Phase 3.2

## Phase 8: Testing & Validation

### 8.1 Test Health Endpoint

```bash
APP_URL=$(az containerapp show \
  --name mapper-tax-app \
  --resource-group walter_sandbox \
  --query properties.configuration.ingress.fqdn -o tsv)

curl https://$APP_URL/api/health
```

Expected output: `{"status":"ok"}`

### 8.2 Test Authentication

Visit `https://<YOUR_APP_URL>` in browser and test sign-in flow with Azure AD.

### 8.3 Monitor Logs

```bash
az containerapp logs show \
  --name mapper-tax-app \
  --resource-group walter_sandbox \
  --follow
```

## Phase 9: Optional - Infrastructure as Code

For repeatable deployments, consider using the Bicep template:

```bash
az deployment group create \
  --resource-group walter_sandbox \
  --template-file infrastructure/main.bicep \
  --parameters @infrastructure/parameters.json
```

## Troubleshooting

### View Container App Logs

```bash
az containerapp logs show \
  --name mapper-tax-app \
  --resource-group walter_sandbox \
  --tail 100
```

### Restart Container App

```bash
az containerapp revision restart \
  --name mapper-tax-app \
  --resource-group walter_sandbox
```

### Update Container Image

```bash
az containerapp update \
  --name mapper-tax-app \
  --resource-group walter_sandbox \
  --image mappertaxregistry.azurecr.io/mapper-tax-app:latest
```

### Check Resource Health

```bash
az resource list \
  --resource-group walter_sandbox \
  --output table
```

## Cost Optimization

### Scale Down During Off-Hours

```bash
az containerapp update \
  --name mapper-tax-app \
  --resource-group walter_sandbox \
  --min-replicas 0 \
  --max-replicas 3
```

### Monitor Costs

```bash
az consumption usage list \
  --start-date 2025-11-01 \
  --end-date 2025-11-30 \
  --query "[?contains(instanceId, 'walter_sandbox')]" \
  --output table
```

## Security Checklist

- [ ] PostgreSQL uses SSL/TLS connections
- [ ] Database firewall configured to allow only Azure services
- [ ] Container App uses managed identity where possible
- [ ] Secrets stored in Azure Container Apps secrets (not environment variables)
- [ ] Azure AD app registration uses least privilege
- [ ] Storage account uses private endpoints (optional)
- [ ] Application Insights configured for monitoring
- [ ] Regular security updates scheduled

## Next Steps

1. Configure custom domain (optional)
2. Set up Application Insights for monitoring
3. Configure auto-scaling rules
4. Set up backup strategy for PostgreSQL
5. Implement disaster recovery plan
6. Configure Azure Front Door for CDN (optional)

## Useful Commands

### List all resources in resource group

```bash
az resource list --resource-group walter_sandbox --output table
```

### Delete specific resource

```bash
az <resource-type> delete --name <name> --resource-group walter_sandbox
```

### View subscription details

```bash
az account show
```

## Support

For issues or questions:
- Azure Documentation: https://docs.microsoft.com/azure
- Container Apps: https://learn.microsoft.com/azure/container-apps/
- PostgreSQL: https://learn.microsoft.com/azure/postgresql/

