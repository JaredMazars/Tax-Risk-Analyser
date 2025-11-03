# Quick Start Guide - Azure Deployment

This guide provides the fastest path to getting your application deployed to Azure.

## What's Been Done

✅ **Application Code Updated**
- Database migrated from SQLite to PostgreSQL
- Azure AD authentication implemented
- Azure Blob Storage integration added
- Docker containerization configured
- GitHub Actions CI/CD pipeline created
- All API routes protected with authentication

## What You Need To Do

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Azure Resources (15-20 minutes)

Follow `AZURE_SETUP_GUIDE.md` to create:
- PostgreSQL database
- Azure AD app registration
- Blob Storage account
- Container Registry
- Container Apps environment

**Quick command reference:**
```bash
# Login to Azure
az login

# Create PostgreSQL
az postgres flexible-server create --resource-group walter_sandbox --name mapper-tax-db ...

# Create Storage
az storage account create --name mappertaxstorage --resource-group walter_sandbox ...

# Create Container Registry
az acr create --name mappertaxregistry --resource-group walter_sandbox ...

# And so on... (see AZURE_SETUP_GUIDE.md for full commands)
```

### 3. Configure GitHub Secrets

Add these to your GitHub repository (Settings > Secrets and variables > Actions):

**Required secrets:**
- `AZURE_CREDENTIALS` - Service principal JSON
- `AZURE_REGISTRY_USERNAME` - ACR username
- `AZURE_REGISTRY_PASSWORD` - ACR password
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - Your OpenAI key
- `NEXTAUTH_SECRET` - Generate: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your Container App URL
- `AZURE_AD_CLIENT_ID` - From Azure AD registration
- `AZURE_AD_CLIENT_SECRET` - From Azure AD registration
- `AZURE_AD_TENANT_ID` - Your Azure tenant ID
- `AZURE_STORAGE_CONNECTION_STRING` - Storage connection string

### 4. Deploy

**Option A: Automatic (GitHub Actions)**
```bash
git add .
git commit -m "Deploy to Azure"
git push origin main
```

GitHub Actions will automatically:
- Build Docker image
- Push to Azure Container Registry
- Run database migrations
- Deploy to Container Apps
- Run health checks

**Option B: Manual**
```bash
# Build and push Docker image
az acr login --name mappertaxregistry
docker build -t mappertaxregistry.azurecr.io/mapper-tax-app:latest .
docker push mappertaxregistry.azurecr.io/mapper-tax-app:latest

# Update Container App
az containerapp update \
  --name mapper-tax-app \
  --resource-group walter_sandbox \
  --image mappertaxregistry.azurecr.io/mapper-tax-app:latest
```

### 5. Test

```bash
# Get app URL
az containerapp show \
  --name mapper-tax-app \
  --resource-group walter_sandbox \
  --query properties.configuration.ingress.fqdn -o tsv

# Test health
curl https://<YOUR_APP_URL>/api/health
```

Visit the URL in your browser to test authentication.

## Local Testing (Before Azure Deployment)

Want to test locally first?

```bash
# 1. Start local PostgreSQL and app
docker-compose up -d

# 2. Set database URL
export DATABASE_URL="postgresql://mapperadmin:changeme123@localhost:5432/mapper_production"

# 3. Run migrations
npx prisma migrate deploy

# 4. Visit http://localhost:3000
```

**Note:** For local testing, you'll need to:
- Create a `.env.local` file (copy from `.env.example`)
- Set up Azure AD with `http://localhost:3000/api/auth/callback/azure-ad` redirect URI

## Key Files

| File | Purpose |
|------|---------|
| `AZURE_SETUP_GUIDE.md` | Detailed Azure CLI commands |
| `DEPLOYMENT_SUMMARY.md` | Complete changes overview |
| `docker-compose.yml` | Local development stack |
| `Dockerfile` | Production container image |
| `.github/workflows/azure-deploy.yml` | CI/CD pipeline |

## Troubleshooting

### Application won't start
```bash
# Check logs
az containerapp logs show --name mapper-tax-app --resource-group walter_sandbox --follow
```

### Database connection fails
- Verify `DATABASE_URL` in Container App secrets
- Check PostgreSQL firewall rules
- Ensure SSL mode is set correctly

### Authentication doesn't work
- Verify Azure AD redirect URIs include your app URL
- Check `AZURE_AD_CLIENT_ID`, `CLIENT_SECRET`, and `TENANT_ID`
- Ensure `NEXTAUTH_URL` matches your actual URL

### File uploads fail
- Verify `AZURE_STORAGE_CONNECTION_STRING` is set
- Check blob container exists and is named `adjustment-documents`
- Review Container App logs for specific errors

## Architecture Overview

```
User Browser
     ↓
Azure AD (Auth) ←→ Container Apps (Next.js)
                         ↓         ↓
                   PostgreSQL  Blob Storage
```

## Cost Estimate

~$35-50/month for:
- PostgreSQL (Burstable B1ms): $12
- Container Apps (1-5 replicas): $15-30
- Blob Storage: $1-5
- Container Registry: $5

## Next Steps After Deployment

1. ✅ Monitor application logs
2. ✅ Set up automated database backups
3. ✅ Configure Application Insights (optional)
4. ✅ Set up custom domain (optional)
5. ✅ Configure auto-scaling rules

## Need Help?

- **Azure Setup**: See `AZURE_SETUP_GUIDE.md`
- **Complete Changes**: See `DEPLOYMENT_SUMMARY.md`
- **Database Migration**: See `POSTGRESQL_MIGRATION.md`
- **Authentication**: See `AUTHENTICATION_GUIDE.md`

---

**Ready to deploy!** Start with step 2 above to create your Azure resources.



