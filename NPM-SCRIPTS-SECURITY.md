# npm Scripts Security - Installation and Postinstall Risks

## Overview
This document explains when it's safe to run `npm ci` with or without `--ignore-scripts`, and how we mitigate the risks of malicious postinstall scripts.

---

## The Security Risk: Arbitrary Code Execution

### ❌ The Danger of npm Postinstall Scripts

**What happens during `npm install` or `npm ci`:**
```json
// package.json
{
  "scripts": {
    "postinstall": "node ./malicious-script.js"
  }
}
```

**Attack scenario:**
1. Attacker publishes compromised npm package
2. Package contains malicious postinstall script
3. Developer runs `npm ci` (or `npm install`)
4. Postinstall script executes with developer's permissions
5. Script can:
   - Steal environment variables (API keys, secrets)
   - Exfiltrate source code
   - Install backdoors
   - Modify other dependencies
   - Access file system

**Real-world attacks:**
- **event-stream (2018):** Cryptocurrency wallet theft
- **ua-parser-js (2021):** Cryptominer and password stealer
- **coa/rc (2021):** Password stealing malware
- **node-ipc (2022):** Data wiping malware

---

## Our Implementation: Risk-Based Approach

### ✅ Safe: Production Container (Runner Stage)

**File:** `Dockerfile` (Stage 2: Runner)

```dockerfile
RUN npm ci --only=production --ignore-scripts
```

**Why it's SAFE:**
- ✅ **No script execution:** `--ignore-scripts` prevents ALL postinstall scripts
- ✅ **Pre-built artifacts:** Prisma client copied from builder stage
- ✅ **Maximum security:** Zero risk of malicious code execution
- ✅ **Production isolation:** Runtime environment completely protected

**This is the GOLD STANDARD for production deployments.**

---

### ⚠️ Acceptable Risk: Builder Stage (Docker)

**File:** `Dockerfile` (Stage 1: Builder)

```dockerfile
RUN npm ci  # Runs postinstall scripts
```

**Why it's ACCEPTABLE:**
1. **Isolated environment:** Builder stage is discarded after build
2. **Required for build:** `postinstall: "prisma generate"` needed for compilation
3. **Integrity verification:** package-lock.json has SHA-512 hashes for all packages
4. **Trusted sources:** Official npm registry with integrity checks
5. **No production secrets:** Only dummy environment variables in builder
6. **Multi-stage protection:** Malicious code can't reach production container

**Risk mitigation in place:**
- ✅ package-lock.json integrity hashes
- ✅ .dockerignore excludes sensitive files
- ✅ Dummy environment variables during build
- ✅ Production stage uses --ignore-scripts
- ✅ Multi-stage build isolation

---

### ⚠️ Acceptable Risk: CI/CD Pipeline (GitHub Actions)

**File:** `.github/workflows/azure-deploy.yml`

```yaml
- name: Install dependencies
  run: npm ci  # Runs postinstall scripts
```

**Why it's ACCEPTABLE:**
1. **Ephemeral environment:** GitHub runner destroyed after workflow
2. **Required for build:** Prisma generation needed for successful build
3. **Integrity verification:** package-lock.json ensures expected packages
4. **Secret scanning:** GitHub scans for leaked credentials
5. **Isolated from production:** Runs in separate CI environment
6. **Audit checks:** npm audit runs after installation

**Risk mitigation in place:**
- ✅ package-lock.json integrity verification
- ✅ npm audit scans for vulnerabilities
- ✅ Dependabot alerts on security issues
- ✅ GitHub secret scanning
- ✅ Ephemeral runners (destroyed after use)
- ✅ No sensitive data in build environment

---

## Security Controls in Place

### 1. ✅ Package Lock File Integrity

**package-lock.json contains SHA-512 hashes:**
```json
{
  "dependencies": {
    "@prisma/client": {
      "version": "6.5.0",
      "resolved": "https://registry.npmjs.org/@prisma/client/-/client-6.5.0.tgz",
      "integrity": "sha512-3gSH4CxGQLDsqC..."
    }
  }
}
```

**Protection:**
- ✅ npm verifies hash of every downloaded package
- ✅ Tampered packages rejected automatically
- ✅ Man-in-the-middle attacks prevented
- ✅ Reproducible builds guaranteed

---

### 2. ✅ Trusted Package Sources

**Our dependencies:**
```json
{
  "@prisma/client": "^6.5.0",      // Official Prisma package
  "next": "^14.2.33",               // Official Next.js package
  "@azure/storage-blob": "^12.24.0" // Official Microsoft package
}
```

**All packages are:**
- ✅ From verified publishers (Microsoft, Vercel, Prisma)
- ✅ Widely used (millions of downloads)
- ✅ Actively maintained
- ✅ Open source (auditable)

---

### 3. ✅ Automated Security Scanning

**Tools enabled:**

1. **npm audit** (Run in CI/CD)
   ```yaml
   - name: Audit dependencies
     run: npm audit --production --audit-level=high
   ```

2. **Dependabot** (GitHub)
   - Automatically checks for vulnerabilities
   - Creates PRs for security updates
   - Monitors npm advisory database

3. **GitHub Secret Scanning**
   - Prevents leaked credentials in code
   - Scans dependencies for embedded secrets

4. **CodeQL** (Can be added)
   - Static analysis of dependencies
   - Detects suspicious patterns

---

### 4. ✅ Multi-Stage Build Isolation

**Dockerfile architecture:**
```
┌──────────────────────────────────────┐
│  Stage 1: Builder (DISPOSABLE)       │
│  - npm ci (runs scripts)             │
│  - Builds application                │
│  - Generates Prisma client           │
│  - ⚠️ Any malicious code runs here   │
│  - 🗑️ ENTIRE STAGE DISCARDED         │
└──────────────────────────────────────┘
            │
            │ Copy only: .next, public, prisma client
            ▼
┌──────────────────────────────────────┐
│  Stage 2: Runner (PRODUCTION)        │
│  - npm ci --ignore-scripts           │
│  - ✅ NO script execution            │
│  - ✅ Clean environment              │
│  - ✅ Production ready                │
└──────────────────────────────────────┘
```

**Even if builder stage is compromised:**
- ❌ Malicious code CANNOT reach production container
- ❌ Backdoors CANNOT be installed in runtime
- ❌ Secrets CANNOT be stolen (only dummy vars in builder)
- ✅ Production remains secure

---

## When to Use --ignore-scripts

### ✅ ALWAYS use --ignore-scripts:

1. **Production deployments**
   ```dockerfile
   RUN npm ci --only=production --ignore-scripts
   ```

2. **Runtime containers**
   ```dockerfile
   USER nobody
   RUN npm ci --ignore-scripts
   ```

3. **When installing untrusted packages**
   ```bash
   npm ci --ignore-scripts
   ```

4. **Security-critical environments**
   ```bash
   npm ci --ignore-scripts --production
   ```

---

### ⚠️ Acceptable WITHOUT --ignore-scripts:

1. **Isolated build environments** (Docker builder stage)
   - Multi-stage builds with discarded builder
   - No production secrets available
   - Required for legitimate build tools (Prisma, TypeScript)

2. **CI/CD pipelines** (GitHub Actions, GitLab CI)
   - Ephemeral runners
   - No production access
   - Audit steps enabled

3. **Local development** (with caution)
   - Review package-lock.json diffs before pull
   - Run npm audit regularly
   - Keep dependencies updated

---

### ❌ NEVER without --ignore-scripts:

1. **Production servers** (live applications)
2. **Shared hosting environments**
3. **Containers with production secrets**
4. **Systems with production database access**
5. **Environments with write access to critical data**

---

## Detection and Prevention

### Before Installation

```bash
# 1. Review package-lock.json changes
git diff package-lock.json

# 2. Check for suspicious postinstall scripts
cat package-lock.json | grep -A 5 "postinstall"

# 3. Audit before installing
npm audit

# 4. Check package reputation
npx lockfile-lint --type npm --path package-lock.json --validate-https
```

### During Installation

```bash
# Monitor what scripts are running
npm ci --verbose

# Dry run to see what would happen
npm ci --dry-run
```

### After Installation

```bash
# Check for new postinstall scripts
npm ls --parseable | xargs npm show | grep scripts.postinstall

# Verify package integrity
npm audit signatures
```

---

## Enhanced Security Measures (Recommended)

### 1. Add Socket.dev Security

```yaml
# .github/workflows/azure-deploy.yml
- name: Install Socket CLI
  run: npm install -g @socketsecurity/cli

- name: Scan dependencies for malware
  run: socket report create
```

### 2. Add Snyk Scanning

```yaml
- name: Run Snyk security scan
  uses: snyk/actions/node@master
  with:
    args: --severity-threshold=high
```

### 3. Add SBOM Generation

```yaml
- name: Generate Software Bill of Materials
  run: |
    npm install -g @cyclonedx/cyclonedx-npm
    cyclonedx-npm --output-file sbom.json
```

### 4. Enable Dependabot

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "daily"
    open-pull-requests-limit: 10
```

---

## Incident Response

### If Malicious Package Detected

1. **Immediate Actions:**
   ```bash
   # Stop all builds
   gh workflow disable azure-deploy
   
   # Remove compromised package
   npm uninstall <malicious-package>
   
   # Audit all dependencies
   npm audit --production
   ```

2. **Rotate All Secrets:**
   - GitHub Actions secrets
   - Azure credentials
   - Database passwords
   - API keys
   - Service principal secrets

3. **Check for Backdoors:**
   ```bash
   # Scan file system for suspicious files
   find . -type f -name "*.sh" -o -name "*.bat"
   
   # Check for unauthorized network connections
   grep -r "fetch\|axios\|http\." node_modules/
   ```

4. **Review Recent Builds:**
   ```bash
   # Check what was deployed
   git log --all --since="7 days ago"
   
   # Review container images
   docker history <image-name>
   ```

5. **Notify Stakeholders:**
   - Security team
   - DevOps team
   - Affected users (if data breach)

---

## Our Postinstall Script (Legitimate)

### package.json
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

**Why this is SAFE:**
1. **Legitimate tool:** Prisma is a trusted ORM framework
2. **Required for build:** Generates TypeScript client for database access
3. **Auditable:** Open source, millions of downloads
4. **No network calls:** Generates code locally, no external connections
5. **Predictable:** Deterministic output based on schema.prisma

**What it does:**
```bash
# Reads prisma/schema.prisma
# Generates TypeScript types in node_modules/.prisma/client
# No network access, no file system modifications outside node_modules
```

---

## Security Checklist

Before allowing npm scripts:

- [ ] Is this a production environment? → Use --ignore-scripts
- [ ] Are there production secrets available? → Use --ignore-scripts
- [ ] Is this an isolated build environment? → Can allow scripts
- [ ] Is package-lock.json committed and reviewed? → Required
- [ ] Is npm audit passing? → Required
- [ ] Are all packages from trusted sources? → Verify
- [ ] Is Dependabot enabled? → Recommended
- [ ] Are security scans running in CI? → Recommended
- [ ] Is this a multi-stage build? → Allows builder scripts
- [ ] Is the environment ephemeral? → Safer to allow scripts

---

## Best Practices Summary

### ✅ Do This

1. Use `--ignore-scripts` in production containers
2. Use multi-stage Docker builds (builder + runner)
3. Run npm audit in CI/CD pipelines
4. Enable Dependabot for automated updates
5. Review package-lock.json changes in PRs
6. Keep dependencies updated
7. Use only well-known, trusted packages
8. Monitor npm advisory database

### ❌ Never Do This

1. Run npm install/ci without --ignore-scripts in production
2. Install packages without reviewing package-lock.json
3. Use packages with very few downloads or unknown publishers
4. Ignore npm audit warnings
5. Skip security scanning in CI/CD
6. Grant production access to build environments
7. Use npm install (prefer npm ci for reproducibility)

---

## References

- [npm-scripts Documentation](https://docs.npmjs.com/cli/v8/using-npm/scripts)
- [npm audit Security](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [OWASP Dependency Security](https://owasp.org/www-project-dependency-check/)
- [Socket.dev - Supply Chain Security](https://socket.dev/)
- [GitHub Advisory Database](https://github.com/advisories)
- [Snyk Vulnerability Database](https://snyk.io/vuln/)

---

**Last Updated:** December 4, 2025
**Security Status:** Risk-based approach with multi-layer protection
**Review Frequency:** Before every dependency update
