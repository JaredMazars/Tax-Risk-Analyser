# Docker Security Best Practices

## Overview
This document outlines the security measures implemented in our Docker configuration to prevent sensitive data leakage and ensure secure containerization.

---

## Sensitive Data Protection

### ✅ Implemented Security Measures

#### 1. Explicit Copy Operations (No Recursive Wildcards)
**File:** `Dockerfile`

```dockerfile
# ❌ DANGEROUS - Copies everything recursively
COPY . .

# ✅ SAFE - Explicit directory and file copying
COPY src ./src
COPY public ./public
COPY next.config.js tsconfig.json tailwind.config.ts postcss.config.js ./
```

**Why:** 
- Prevents accidental inclusion of sensitive files
- Makes it clear what's being copied
- Forces developers to think about each addition

#### 2. Comprehensive .dockerignore
**File:** `.dockerignore`

**Critical Exclusions:**
```
# Environment files
.env*
**/.env*
secrets/

# Credentials & Keys
*.key
*.pem
*.cert
*.p12
*.pfx
id_rsa*
credentials.json
```

**Why:**
- First line of defense against sensitive data leakage
- Applies to all COPY operations
- Reduces image size by excluding unnecessary files

#### 3. Build-Time Dummy Variables
**File:** `Dockerfile`

```dockerfile
# Dummy variables for build only - never use real secrets here
ENV OPENAI_API_KEY="sk-dummy-key-for-build-only"
ENV NEXTAUTH_SECRET="dummy-secret-for-build-only"
ENV DATABASE_URL="sqlserver://dummy:dummy@dummy.database.windows.net..."
```

**Why:**
- Allows Next.js to build without real credentials
- Real secrets injected at runtime via environment variables
- No secrets baked into image layers

#### 4. Multi-Stage Build
**Pattern:** Separate builder and runner stages

**Benefits:**
- Final image doesn't include build tools
- Smaller attack surface
- Reduced image size
- Build artifacts isolated

#### 5. Non-Root User
```dockerfile
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
USER nextjs
```

**Why:**
- Principle of least privilege
- Limits damage if container is compromised
- Industry best practice

---

## Files That Must Never Be in the Image

### 🚨 Critical (Secrets & Credentials)
- ✅ `.env` and `.env.*` files
- ✅ `secrets/` directory
- ✅ Private keys: `*.key`, `*.pem`, `id_rsa*`
- ✅ Certificates: `*.cert`, `*.crt`, `*.p12`, `*.pfx`
- ✅ Service account files: `credentials.json`, `service-account*.json`
- ✅ Database files: `*.db`, `*.sqlite`

### ⚠️ Important (Development & Build Artifacts)
- ✅ `node_modules/` (rebuilt in each stage)
- ✅ `.git/` (source control history)
- ✅ Test files: `**/*.test.ts`, `**/__tests__/`
- ✅ Build tools: `Dockerfile`, `docker-compose.yml`
- ✅ Scripts: `scripts/`, `*.ps1`, `*.sh`

### 💡 Nice to Have (Size Optimization)
- ✅ Documentation: `*.md` (except README.md)
- ✅ IDE configs: `.vscode/`, `.idea/`
- ✅ CI/CD: `.github/`, `.husky/`
- ✅ Logs: `*.log`, `logs/`

---

## Runtime Secret Management

### How Secrets Are Injected

#### Azure Container Apps (Production)
```bash
# Secrets stored in Azure Key Vault
# Injected as environment variables at container startup
az containerapp update \
  --name tax-risk-analyser \
  --set-env-vars \
    "DATABASE_URL=secretref:database-url" \
    "OPENAI_API_KEY=secretref:openai-api-key"
```

#### Docker Compose (Development)
```yaml
# docker-compose.yml
services:
  app:
    env_file:
      - .env.local  # Never commit this file
    environment:
      - NODE_ENV=development
```

#### Kubernetes (Alternative)
```yaml
# Use Kubernetes Secrets
env:
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: db-secrets
        key: connection-string
```

### ❌ Never Do This
```dockerfile
# DON'T: Hardcode secrets
ENV DATABASE_URL="sqlserver://real-password@prod.database.windows.net"

# DON'T: Copy secrets into image
COPY .env ./

# DON'T: Download secrets during build
RUN curl https://secrets-api.com/get-secret > secret.txt
```

---

## Verification Checklist

Before deploying, verify:

- [ ] No `.env` files in the project root
- [ ] No credentials in environment variables in Dockerfile
- [ ] `.dockerignore` is comprehensive
- [ ] All `COPY` operations are explicit (no `COPY . .` with sensitive files)
- [ ] Build succeeds with dummy environment variables
- [ ] Image runs with runtime-injected secrets
- [ ] Container runs as non-root user
- [ ] Health check endpoint is public (no auth required)

---

## Scanning for Secrets

### Manual Verification
```bash
# Build the image
docker build -t tax-risk-analyser:test .

# Check for sensitive strings in the image
docker run --rm tax-risk-analyser:test sh -c 'find / -type f -name "*.env" 2>/dev/null'
docker run --rm tax-risk-analyser:test sh -c 'find / -type f -name "*.key" 2>/dev/null'
docker run --rm tax-risk-analyser:test sh -c 'find / -type f -name "credentials*" 2>/dev/null'

# Check environment variables (should only show dummy values)
docker run --rm tax-risk-analyser:test env | grep -i "key\|secret\|password"
```

### Automated Tools

#### 1. Trivy (Vulnerability & Secret Scanner)
```bash
# Install Trivy
# Windows: choco install trivy
# Linux: apt-get install trivy

# Scan for secrets
trivy fs --scanners secret .
trivy image --scanners secret tax-risk-analyser:latest
```

#### 2. Docker Scout
```bash
# Scan image for vulnerabilities and secrets
docker scout cves tax-risk-analyser:latest
docker scout quickview tax-risk-analyser:latest
```

#### 3. Hadolint (Dockerfile Linter)
```bash
# Install: https://github.com/hadolint/hadolint
hadolint Dockerfile
```

#### 4. Git Secrets Prevention
```bash
# Install git-secrets
# Prevent commits with secrets
git secrets --install
git secrets --register-aws
git secrets --add 'sk-[a-zA-Z0-9]{32,}'  # OpenAI keys
git secrets --add 'postgres://[^@]+:[^@]+@'  # Database URLs
```

---

## Image Inspection

### Check What's Actually in the Image
```powershell
# Build image
docker build -t tax-risk-analyser:inspect .

# List all files in the image
docker run --rm tax-risk-analyser:inspect find /app -type f

# Check specific directories
docker run --rm tax-risk-analyser:inspect ls -la /app
docker run --rm tax-risk-analyser:inspect ls -la /app/src

# Inspect environment variables
docker inspect tax-risk-analyser:inspect | ConvertFrom-Json | Select-Object -ExpandProperty Config | Select-Object -ExpandProperty Env
```

### Check Image Layers
```bash
# See what each layer adds
docker history tax-risk-analyser:latest

# Dive into image layers
# Install dive: https://github.com/wagoodman/dive
dive tax-risk-analyser:latest
```

---

## Incident Response

### If Secrets Are Leaked in an Image

1. **Immediate Actions:**
   ```bash
   # Stop all containers using the compromised image
   docker stop $(docker ps -q --filter ancestor=tax-risk-analyser:compromised)
   
   # Remove the compromised image
   docker rmi tax-risk-analyser:compromised
   ```

2. **Rotate All Secrets:**
   - Database passwords
   - API keys (OpenAI, Bing Search, etc.)
   - JWT secrets (NEXTAUTH_SECRET)
   - Azure AD credentials
   - Service principal secrets

3. **Review Container Registry:**
   ```bash
   # Delete compromised versions from registry
   az acr repository delete --name mazarsregistry --image tax-risk-analyser:compromised
   ```

4. **Audit Access:**
   - Check who pulled the compromised image
   - Review container logs for suspicious activity
   - Check database access logs

5. **Rebuild Securely:**
   - Fix .dockerignore
   - Use explicit COPY operations
   - Verify with scanning tools
   - Redeploy with new secrets

---

## Best Practices Summary

### ✅ Do This
- Use explicit `COPY` operations for specific files/directories
- Maintain comprehensive `.dockerignore`
- Use multi-stage builds
- Run as non-root user
- Inject secrets at runtime via environment variables
- Use dummy values for build-time variables
- Scan images regularly for secrets and vulnerabilities
- Keep base images updated
- Use specific image tags (not `latest`)

### ❌ Never Do This
- `COPY . .` without reviewing what's being copied
- Hardcode secrets in Dockerfile
- Copy `.env` files into images
- Run containers as root
- Use `latest` tag in production
- Commit secrets to version control
- Store secrets in environment variables in Dockerfile
- Download secrets during build

---

## References

- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
- [OWASP Docker Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)
- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [Azure Container Apps Security](https://learn.microsoft.com/en-us/azure/container-apps/security-baseline)

---

**Last Updated:** December 4, 2025
**Security Level:** Hardened
**Review Frequency:** Quarterly or after any Dockerfile changes
