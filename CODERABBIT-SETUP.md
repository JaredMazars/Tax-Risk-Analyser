# CodeRabbit Setup Guide

## What is CodeRabbit?
CodeRabbit is an AI-powered code review tool that automatically reviews your pull requests on GitHub, providing feedback on code quality, security, performance, and best practices.

---

## Installation Steps

### Step 1: Install CodeRabbit GitHub App

1. **Go to CodeRabbit GitHub App:**
   - Visit: https://github.com/apps/coderabbitai
   - Or search "CodeRabbit" in GitHub Marketplace

2. **Click "Install" or "Configure"**

3. **Choose Installation Target:**
   - Select your account: `JaredMazars`
   - Choose repositories:
     - ✅ Option 1: "All repositories" (if you want CodeRabbit on all repos)
     - ✅ Option 2: "Only select repositories" → Choose `Tax-Risk-Analyser`

4. **Authorize the App:**
   - Review permissions (CodeRabbit needs read/write access to PRs and code)
   - Click "Install & Authorize"

5. **Done!** CodeRabbit is now installed on your repository

---

## Configuration

We've created a `.coderabbit.yaml` configuration file in your repository with the following settings:

### Review Settings:
- ✅ Automatic reviews on all pull requests
- ✅ Detailed review level
- ✅ Reviews TypeScript, JavaScript, YAML, Dockerfile, Markdown

### Focus Areas:
- 🔒 Security vulnerabilities
- ⚡ Performance issues
- 🛡️ Error handling
- 🎯 Type safety
- ✨ Best practices
- 📊 Code complexity
- 🔄 Code duplication

### Comment Behavior:
- Posts review summary
- Inline comments for issues
- Minimum severity: warnings and above
- Professional tone

---

## How to Use CodeRabbit

### Method 1: Create a Pull Request (Recommended)

```bash
# Create a feature branch
git checkout -b feature/my-changes

# Make your changes
# ... edit files ...

# Commit changes
git add .
git commit -m "Your changes"

# Push to GitHub
git push origin feature/my-changes

# Create a Pull Request on GitHub
# CodeRabbit will automatically review within 1-2 minutes!
```

### Method 2: Manual Review Trigger

If CodeRabbit doesn't automatically review, you can trigger it by:

1. **Comment on your PR:**
   ```
   @coderabbitai review
   ```

2. **Request full review:**
   ```
   @coderabbitai full review
   ```

3. **Ask CodeRabbit a question:**
   ```
   @coderabbitai explain this file
   ```

---

## CodeRabbit Commands

You can interact with CodeRabbit using comments in your PRs:

| Command | Description |
|---------|-------------|
| `@coderabbitai review` | Trigger a new review |
| `@coderabbitai full review` | Comprehensive review |
| `@coderabbitai resolve` | Mark conversation as resolved |
| `@coderabbitai explain` | Explain specific code |
| `@coderabbitai summary` | Generate PR summary |
| `@coderabbitai help` | Show available commands |

---

## Testing Your Setup

### Quick Test:

1. **Create a test branch:**
   ```bash
   git checkout -b test/coderabbit-setup
   ```

2. **Make a small change:**
   ```bash
   echo "// Test CodeRabbit" >> README.md
   git add README.md
   git commit -m "test: Verify CodeRabbit integration"
   git push origin test/coderabbit-setup
   ```

3. **Create a Pull Request:**
   - Go to: https://github.com/JaredMazars/Tax-Risk-Analyser/pulls
   - Click "New pull request"
   - Select `test/coderabbit-setup` branch
   - Create the PR

4. **Wait for CodeRabbit:**
   - Within 1-2 minutes, CodeRabbit will comment with a review
   - You should see a review summary and any suggestions

5. **Clean up:**
   ```bash
   # After testing, close the PR and delete the branch
   git checkout main
   git branch -D test/coderabbit-setup
   git push origin --delete test/coderabbit-setup
   ```

---

## Configuration Customization

Edit `.coderabbit.yaml` to customize:

### Change Review Level:
```yaml
reviews:
  level: basic  # or "detailed"
```

### Focus on Specific File Types:
```yaml
reviews:
  include:
    - "**/*.ts"
    - "**/*.tsx"
```

### Adjust Comment Threshold:
```yaml
comments:
  min_severity: info  # info, warning, or error
```

### Enable Auto-Fix:
```yaml
suggestions:
  auto_apply: true  # Be careful - test first!
```

---

## Troubleshooting

### CodeRabbit Not Reviewing?

1. **Check Installation:**
   - Visit: https://github.com/settings/installations
   - Verify CodeRabbit is installed for your repository

2. **Check Permissions:**
   - CodeRabbit needs read/write access to PRs
   - Check repository settings → Integrations

3. **Trigger Manually:**
   - Comment `@coderabbitai review` on your PR

4. **Check Configuration:**
   - Ensure `.coderabbit.yaml` is valid YAML
   - Check for syntax errors

### CodeRabbit Reviews Are Too Noisy?

```yaml
# Adjust minimum severity
comments:
  min_severity: error  # Only show critical issues
```

### Want Reviews Only on Specific Files?

```yaml
reviews:
  include:
    - "src/**/*.ts"  # Only review TypeScript in src/
  exclude:
    - "**/*.test.ts"  # Skip test files
```

---

## Best Practices

### 1. ✅ Use Feature Branches
Always create PRs from feature branches, not directly to main:
```bash
git checkout -b feature/security-improvements
```

### 2. ✅ Small, Focused PRs
CodeRabbit works best with focused changes:
- One feature per PR
- Aim for < 500 lines changed

### 3. ✅ Respond to Feedback
- Address CodeRabbit's suggestions
- Ask questions using `@coderabbitai explain`
- Mark conversations as resolved

### 4. ✅ Review Configuration Regularly
- Update `.coderabbit.yaml` as your needs change
- Add new file patterns
- Adjust focus areas

---

## Next Steps

1. **Install CodeRabbit:**
   - Visit: https://github.com/apps/coderabbitai
   - Install for `Tax-Risk-Analyser`

2. **Commit Configuration:**
   ```bash
   git add .coderabbit.yaml
   git commit -m "Add CodeRabbit configuration"
   git push origin main
   ```

3. **Create a Test PR:**
   - Make any small change
   - Create a PR
   - Watch CodeRabbit review it!

4. **Start Using on All PRs:**
   - CodeRabbit will now automatically review all your pull requests
   - Enjoy automated code reviews! 🎉

---

## Resources

- **CodeRabbit Documentation:** https://coderabbit.ai/docs
- **Configuration Reference:** https://coderabbit.ai/docs/configuration
- **GitHub App:** https://github.com/apps/coderabbitai
- **Support:** support@coderabbit.ai

---

**Last Updated:** December 11, 2025
**Status:** Configuration ready, install GitHub App to activate
