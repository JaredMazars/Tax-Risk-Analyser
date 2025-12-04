# Security Fixes - ReDoS (Regular Expression Denial of Service) Vulnerabilities

## Overview
Fixed multiple Regular Expression Denial of Service (ReDoS) vulnerabilities throughout the codebase. These vulnerabilities could have been exploited to cause catastrophic backtracking, leading to CPU exhaustion and denial of service.

## Vulnerabilities Fixed

### 1. File Validator - CSV Detection (CRITICAL)
**File:** `src/lib/utils/fileValidator.ts`
**Vulnerable Pattern:** `/^[\x20-\x7E\r\n\t,]*$/`

**Issue:** Unbounded `*` quantifier with character class could cause exponential backtracking on specially crafted input.

**Fix:** 
- Added explicit length limit: `{0,100}`
- Added pre-check for input length
- Changed to: `/^[\x20-\x7E\r\n\t,]{0,100}$/`

**Impact:** Prevents attackers from causing server hang with malicious CSV-like files.

---

### 2. Markdown Formatter - Inline Formatting (HIGH)
**File:** `src/lib/utils/markdownFormatter.ts`
**Vulnerable Patterns:** 
- `/\*\*(.+?)\*\*/g` - Bold
- `/__(.+?)__/g` - Bold alternative
- `/\*(.+?)\*/g` - Italic
- `/_(.+?)_/g` - Italic alternative
- `/\`(.+?)\`/g` - Code
- `/\[(.+?)\]\((.+?)\)/g` - Links

**Issue:** `.+?` non-greedy quantifiers can still cause catastrophic backtracking with nested or malformed markdown.

**Fix:**
- Added input length limit: 10,000 characters max
- Replaced `.+?` with negated character classes and explicit limits:
  - Bold: `/\*\*([^*]{1,500}?)\*\*/g`
  - Italic: `/\*([^*]{1,500}?)\*/g`
  - Code: `/\`([^\`]{1,500}?)\`/g`
  - Links: `/\[([^\]]{1,200}?)\]\(([^)]{1,500}?)\)/g`

**Impact:** Prevents DoS attacks through malicious markdown content in comments, opinions, and user-generated content.

---

### 3. Sanitization - Script Tag Removal (HIGH)
**File:** `src/lib/utils/sanitization.ts`
**Vulnerable Patterns:**
- `/<script[^>]*>.*?<\/script>/gi` - Script removal
- `/on\w+\s*=/gi` - Event handler removal

**Issue:** `[^>]*` and `\w+` can cause excessive backtracking with malformed HTML.

**Fix:**
- Added explicit length limits:
  - `/<script[^>]{0,200}?>[\s\S]{0,5000}?<\/script>/gi`
  - `/on\w{0,20}\s*=/gi`

**Impact:** Prevents DoS while sanitizing user comments and HTML content.

---

### 4. Bing Search Service - Case Name Extraction (MEDIUM)
**File:** `src/lib/services/search/bingSearchService.ts`
**Vulnerable Pattern:** `/(.+?)\s+v[s]?\s+(.+)/i`

**Issue:** `.+?` quantifiers without anchors or limits can backtrack excessively.

**Fix:**
- Added input length limit: 500 characters max
- Added anchors and explicit limits: `/^(.{1,200}?)\s+v[s]?\s+(.{1,200})$/i`

**Impact:** Prevents DoS when processing search results from external APIs.

---

### 5. Agent Orchestrator - Query Extraction (MEDIUM)
**File:** `src/lib/agents/agentOrchestrator.ts`
**Vulnerable Patterns:**
- `/search for (.+)/i`
- `/find (.+)/i`
- `/look for (.+)/i`
- `/information about (.+)/i`

**Issue:** Unbounded `.+` can cause excessive backtracking on long messages.

**Fix:**
- Added input length limit: 1,000 characters max
- Replaced `.+` with `(.{1,500})` for each pattern

**Impact:** Prevents DoS in AI chat interface when processing user queries.

---

### 6. Word Exporter - Bold Detection (MEDIUM)
**File:** `src/lib/services/export/wordExporter.ts`
**Vulnerable Pattern:** `/(\*\*|__)(.*?)\1/g`

**Issue:** `.*?` can cause backtracking with nested bold markers.

**Fix:**
- Added input length limit: 50,000 characters max
- Replaced `.*?` with negated character class: `/(\*\*|__)([^*_]{1,1000}?)\1/g`

**Impact:** Prevents DoS when exporting large opinion documents to Word format.

---

## Additional Security Improvements

### parseInt Migration
Replaced all instances of `parseInt()` with `Number.parseInt()` throughout the codebase for better security and ES6 compliance.

---

## Testing Recommendations

1. **Fuzz Testing:** Test all regex patterns with:
   - Very long strings (10MB+)
   - Nested patterns
   - Repeated characters
   - Malformed input

2. **Load Testing:** Verify performance under:
   - High concurrent requests
   - Large file uploads
   - Long markdown documents

3. **Security Scanning:** Run automated ReDoS detection tools:
   - `eslint-plugin-security`
   - `safe-regex` npm package
   - OWASP ZAP

---

## Prevention Guidelines

### Future Regex Development:
1. **Always add explicit length limits** using `{min,max}` quantifiers
2. **Avoid nested quantifiers** like `(a+)+`
3. **Use negated character classes** instead of `.+?` when possible
4. **Add input validation** before regex matching
5. **Limit input length** at the start of functions
6. **Prefer non-regex solutions** when simpler alternatives exist
7. **Test with ReDoS detection tools** before deployment

### Code Review Checklist:
- [ ] No unbounded quantifiers (`*`, `+`, `{n,}`)
- [ ] Explicit length limits on all quantifiers
- [ ] Input length validation before regex
- [ ] No nested quantifiers
- [ ] Prefer negated character classes over `.+`
- [ ] Test with long, malicious inputs

---

## References
- [OWASP ReDoS](https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS)
- [Safe Regex](https://github.com/substack/safe-regex)
- [Regex Performance Best Practices](https://www.regular-expressions.info/catastrophic.html)
