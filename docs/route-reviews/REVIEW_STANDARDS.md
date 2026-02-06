# Code Review Standards

**Version**: 3.0
**Last Updated**: February 6, 2026

Comprehensive review checklists for all layers of the application. Apply the relevant sections based on what you are reviewing.

---

## Table of Contents

1. [Foundation Checklist](#foundation-checklist)
2. [Security Checklist](#security-checklist)
3. [API Route Checklist](#api-route-checklist)
4. [Performance Checklist](#performance-checklist)
5. [UI Component Checklist](#ui-component-checklist)
6. [Data Integrity Checklist](#data-integrity-checklist)
7. [Correctness & Observability Checklist](#correctness--observability-checklist)
8. [Resilience Checklist](#resilience-checklist)
9. [AI-Specific Checklist](#ai-specific-checklist)
10. [Severity Levels](#severity-levels)
11. [Review Best Practices](#review-best-practices)

---

## Foundation Checklist

For types, config, Prisma schema, and middleware:

### Types & Interfaces
- [ ] Enums defined ONCE in `types/index.ts` (not duplicated)
- [ ] Branded ID types used for all entity IDs (`types/branded.ts`)
- [ ] DTOs derived from Prisma types with `Partial/Pick/Omit` (not redeclared)
- [ ] No `any` types -- use `unknown`, `Record<string, unknown>`, or proper interfaces
- [ ] `undefined` for optional, `null` for database nulls
- [ ] No circular type dependencies

### Prisma Schema
- [ ] All `updatedAt` fields use `@updatedAt` attribute (not plain `DateTime`)
- [ ] All `createdAt` fields use `@default(now())`
- [ ] Indexes exist for frequently queried fields
- [ ] Relationships use correct ID convention (external `GS*` IDs vs internal `id`)
- [ ] Unique constraints defined where needed
- [ ] No orphaned models (every model has clear purpose)

### Configuration
- [ ] TypeScript strict mode enabled
- [ ] Path aliases correct (`@/*` -> `./src/*`)
- [ ] ESLint rules enforced (no-explicit-any: error)
- [ ] Security headers configured in `next.config.js`
- [ ] Environment variables validated

### Middleware
- [ ] Security headers applied (X-Content-Type-Options, X-Frame-Options, etc.)
- [ ] Authentication check covers all protected routes
- [ ] Public route exclusions are minimal and correct
- [ ] Session verification via JWT
- [ ] Pathname header injection for PageAccessGuard

---

## Security Checklist

For security infrastructure, auth services, permissions, and guards:

### Authentication & Authorization
- [ ] Uses `secureRoute` wrapper (not raw handler) for all API routes
- [ ] Uses the correct `secureRoute` method (`query`, `queryWithParams`, `mutation`, `ai`, `fileUpload`)
- [ ] Appropriate `feature` permission is set (if applicable)
- [ ] Rate limiting is configured for mutations (POST/PUT/PATCH/DELETE)
- [ ] Task access checks for task-specific routes (`checkTaskAccess`)
- [ ] Service line access checks where needed
- [ ] Service line context passed to feature checks where applicable (via `serviceLine` option)
- [ ] **IDOR protection** -- User can only access resources they own/have permission for
- [ ] **Business logic authorization** -- Beyond role checks (e.g., can't approve own submissions)

### Input Validation & Sanitization
- [ ] Input validation via Zod schema for request body
- [ ] Route params + querystring are validated (Zod / `parseXxxId()` utilities), not just body
- [ ] **Branded ID type usage** -- All route params use `parseXxxId()` utilities
- [ ] `sanitizeObject()` applied to user input (automatic in secureRoute mutations)
- [ ] No manual `sanitizeText()` calls in mutation handlers (automatic via `sanitizeObject()`)
- [ ] User-controlled sorting/filtering uses an allowlist (no raw field passthrough)
- [ ] List endpoints enforce safe limits (max `take`/page size; validate cursor/skip)
- [ ] **Mass assignment protection** -- No spreading user input directly into Prisma `data`
- [ ] **No `any` types** -- Use `unknown` or proper interfaces
- [ ] **SQL Server case sensitivity** -- NEVER use `mode: 'insensitive'` (not supported by SQL Server)

### Data Protection
- [ ] No sensitive data in error messages
- [ ] `Cache-Control` headers are appropriate (sensitive/user-specific responses are `no-store`)
- [ ] Prisma queries use explicit `select:` fields (no `select *`)
- [ ] **Soft-deleted record exclusion** -- Queries filter out soft-deleted records where applicable
- [ ] **Raw SQL safety** -- If `prisma.$queryRaw` used, verify parameterization

### Logging & Audit
- [ ] No `console.log` -- uses `logger` instead
- [ ] Audit logging for sensitive operations
- [ ] Logs/audit logs avoid secrets/PII and include minimal context (userId, resourceId)

### File & External Operations
- [ ] File uploads (if any) validate size + MIME/type allowlist; storage paths are not user-controlled
- [ ] **Blob storage containers** -- Each document type uses purpose-specific container (never mix types)
- [ ] Outbound calls (if any) use allowlisted hosts + timeouts (SSRF + hanging request protection)
- [ ] **Response header hardening** -- `X-Content-Type-Options: nosniff` for file downloads

### Code Quality & Import Consistency
- [ ] Correct import paths for core utilities
- [ ] No stale imports (paths that no longer exist cause build failures)
- [ ] Routes with params use `*WithParams` variants (not base variants with manual param parsing)

### Page-Level Access (Frontend)
- [ ] Every page layout uses `<PageAccessGuard pathname={...}>`
- [ ] Components use `usePageAccess()` to check `isViewOnly`, `canEdit`
- [ ] `<EditActionWrapper>` used to hide edit buttons in VIEW mode
- [ ] `<FeatureGate>` used for conditional UI rendering
- [ ] No browser dialogs (`confirm()`, `alert()`, `prompt()`)

---

## API Route Checklist

Quick checklist for reviewing any API route file:

- [ ] Uses `secureRoute` wrapper (query/mutation/ai/fileUpload)
- [ ] `*WithParams` variant for routes with `[id]` segments
- [ ] Feature permission specified
- [ ] Schema validation for mutations (POST/PUT/PATCH/DELETE)
- [ ] Route params validated with `parseXxxId()` utilities
- [ ] IDOR protection (user can only access their resources)
- [ ] Explicit `select:` fields in Prisma queries
- [ ] `take` limits on `findMany()` for large tables
- [ ] Cache invalidation after mutations
- [ ] No `console.log` -- use `logger` instead
- [ ] No `any` types
- [ ] Deterministic ordering for pagination

---

## Performance Checklist

### Database Optimization
- [ ] Database queries are optimized (no N+1 queries)
- [ ] List endpoints use deterministic ordering for pagination (cursor or stable `orderBy`)
- [ ] Minimal data selection (only required fields via explicit `select:`)
- [ ] Default limits are applied (no unbounded `findMany()` on large tables)
- [ ] Indexes exist for frequently queried fields
- [ ] **Query complexity limits** -- Complex filters/sorts have bounded depth

### Caching
- [ ] Appropriate caching strategy (Redis/in-memory)
- [ ] Cache invalidation on mutations
- [ ] Cache TTLs are documented and appropriate

### Request Handling
- [ ] Pagination for list endpoints
- [ ] Batch operations use `Promise.all()` where independent
- [ ] No unnecessary database calls
- [ ] Large payloads are paginated or streamed
- [ ] No blocking operations in hot paths
- [ ] External/API calls (if any) are parallelized and use timeouts
- [ ] **No dynamic imports in handlers** -- Static imports only (except AI/ML)
- [ ] **Response size limits** -- Large JSON responses are bounded or streamed

### Concurrency & Connection Management
- [ ] **Race condition prevention** -- Concurrent mutations use optimistic locking or transactions
- [ ] **Connection pool health** -- Prisma connection limit not exceeded under load

---

## UI Component Checklist

### Design System Compliance
- [ ] Uses components from `@/components/ui` (not custom HTML elements)
- [ ] Uses Forvis brand colors (not default Tailwind red/green/yellow)
- [ ] Gradients use centralized constants/CSS classes (not inline strings)
- [ ] Uses `Banner` component for notifications (not toast libraries)
- [ ] Uses `ConfirmModal` for destructive actions (not `window.confirm()`)
- [ ] No browser dialogs (`confirm()`, `alert()`, `prompt()`)

### Accessibility & UX
- [ ] Focus management with `focus:ring-2 focus:ring-forvis-blue-500`
- [ ] Keyboard navigation supported
- [ ] WCAG AA color contrast met
- [ ] Mobile-first responsive design (`flex-col`, `grid-cols-1`)
- [ ] Transitions use `transition-all duration-200 ease-in-out`

### Component Quality
- [ ] Props have TypeScript interfaces
- [ ] No `any` types in props or state
- [ ] `'use client'` only when needed (prefer Server Components)
- [ ] No business logic in components (delegate to hooks/services)
- [ ] Files under 500 lines

---

## Data Integrity Checklist

For routes that create, update, or delete data:

- [ ] Foreign key relationships are validated (referenced records exist before insert/update)
- [ ] Cascade deletes are intentional and documented
- [ ] Unique constraints are validated before insert (prevents race condition errors)
- [ ] Orphaned records are prevented
- [ ] **Data model relationships validated** -- Task-to-Client and Client-to-Group boundaries enforced
- [ ] **Approval system integration** (if applicable) -- Uses centralized `approvalService.createApproval()`
- [ ] Audit trail for sensitive data changes (who changed what, when)
- [ ] Multi-step mutations use `prisma.$transaction`
- [ ] **Idempotency for critical mutations** -- Retrying POST/PUT doesn't create duplicates

---

## Correctness & Observability Checklist

### Response Handling
- [ ] Uses appropriate HTTP status codes (200/201/204) and consistent response wrappers
- [ ] Errors use stable app error codes (no raw stack traces)
- [ ] **Error categorization** -- 4xx for client errors, 5xx for server errors
- [ ] **Response shape validation** -- Response matches expected DTO type

### Data Consistency
- [ ] **Null vs undefined consistency** -- `undefined` for optional, `null` for DB nulls
- [ ] **Decimal precision for financial data** -- Use Decimal.js, never floats for money
- [ ] **Timezone handling** -- Dates stored/returned in UTC, converted on frontend
- [ ] **Fiscal period filtering** (financial routes only) -- Use `buildFiscalPeriodFilter()` helpers

### Observability
- [ ] Runtime is appropriate (Prisma/Node APIs run in Node.js, not Edge)
- [ ] Monitoring/logging includes enough context to debug without logging secrets/PII

---

## Resilience Checklist

For routes that call external APIs or services:

- [ ] Circuit breaker pattern for external API failures
- [ ] Retry logic with exponential backoff + jitter
- [ ] Graceful degradation when dependencies unavailable
- [ ] Fallback values or cached responses for non-critical data
- [ ] Timeout configuration to prevent hanging requests
- [ ] Dead letter handling for failed async operations (if applicable)

---

## AI-Specific Checklist

For routes using Azure OpenAI or AI-powered features:

### Configuration & Imports
- [ ] Model imports from `@/lib/ai/config`, not direct Azure SDK
- [ ] Uses `getModelParams()` for reasoning models (handles unsupported parameters)

### Security & Rate Limiting
- [ ] AI endpoints use `secureRoute.ai()` or `secureRoute.aiWithParams()`
- [ ] **Prompt injection prevention** -- User input in prompts is sanitized and validated

### Error Handling & Resilience
- [ ] **AI failure fallback** -- Graceful degradation when AI service unavailable
- [ ] **Timeout configuration** -- AI calls have reasonable timeouts (30-60s max)
- [ ] **Token/cost limits** -- Expensive operations have token or cost limits
- [ ] **Retry strategy** -- Transient failures (429, 503) retry with exponential backoff

### RAG Integration (If Applicable)
- [ ] **RAG availability check** -- `RAGEngine.isConfigured()` before use
- [ ] **Scope isolation** -- RAG searches scoped to appropriate context
- [ ] **Source citation** -- AI responses include source documents for auditability

### Structured Output Validation
- [ ] **Zod schema validation** -- `generateObject()` calls use Zod schema
- [ ] **Fallback validation** -- Manual validation as fallback if AI returns invalid structure

---

## Severity Levels

| Severity | Description | Action Required |
|----------|-------------|-----------------|
| CRITICAL | Security vulnerability, data loss risk, system crash potential | Fix immediately before sign-off |
| HIGH | Performance degradation, significant usability issue | Fix before domain sign-off |
| MEDIUM | Code quality issue, minor performance concern | Document and plan fix |
| LOW | Enhancement opportunity, style inconsistency | Document for future improvement |

---

## Review Best Practices

### For Individual Files
1. **Read the entire file** before starting checklist
2. **Check imports first** -- Verify all import paths are correct
3. **Trace data flow** -- Request -> Validation -> Database -> Response
4. **Look for edge cases** -- Empty results, invalid IDs, concurrent requests
5. **Verify error paths** -- Do error messages leak sensitive data?

### Sign-Off Criteria
A file can be signed off when:
- All applicable checklists have been reviewed
- Any issues found have been documented
- Critical issues have been fixed or have a remediation plan
- Review notes capture context for future reviewers

---

## Related Documentation

### Workspace Rules
- [Consolidated Project Rules](../../.cursor/rules/consolidated.mdc)
- [Security Rules](../../.cursor/rules/security-rules.mdc)
- [Database Patterns](../../.cursor/rules/database-patterns.mdc)
- [Performance Rules](../../.cursor/rules/performance-rules.mdc)
- [Forvis Design Rules](../../.cursor/rules/forvis-design-rules.mdc)
- [Approval System Rules](../../.cursor/rules/approval-system-rules.mdc)
- [Blob Storage Rules](../../.cursor/rules/blob-storage-rules.mdc)
- [AI Patterns](../../.cursor/rules/ai-patterns.mdc)
- [Tool System Rules](../../.cursor/rules/tool-system-rules.mdc)
- [Migration Rules](../../.cursor/rules/migration-rules.mdc)
