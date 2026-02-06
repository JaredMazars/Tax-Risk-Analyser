# Phase 1: Foundation Review

**Scope**: Types, constants, Prisma schema, middleware, and configuration files
**Total Items**: 32 files
**Last Updated**: February 6, 2026
**Status**: Complete

---

## Review Standards

See [REVIEW_STANDARDS.md](./REVIEW_STANDARDS.md) -- apply **Foundation Checklist** section.

---

## Sign-Off Status

- **Foundation Review Complete** -- Reviewer: _____ Date: _____

---

## Progress Summary


| Section          | Items  | Reviewed | Status          |
| ---------------- | ------ | -------- | --------------- |
| TypeScript Types | 24     | 24       | Complete        |
| Constants        | 3      | 3        | Complete        |
| Prisma Schema    | 1      | 1        | Complete        |
| Middleware       | 1      | 1        | Complete        |
| Config Files     | 3      | 3        | Complete        |
| **TOTAL**        | **32** | **32**   | **Complete**    |


---

## TypeScript Types (24 files)

### Core Type Files

- `src/types/index.ts` -- Main type exports, enums (SystemRole, ServiceLineRole)
  - **Issues Found**:
    1. **HIGH** -- Enum duplication: `SystemRole` and `ServiceLineRole` duplicated in `src/lib/utils/roleHierarchy.ts`
    2. **HIGH** -- `any` type: `allocations?: any[]` in `TaskTeam` interface (line 350)
    3. **LOW** -- Deprecated `ClientWithEmployees` interface with zero external usages still exported
    4. **LOW** -- No re-export of branded types from `./branded`
    5. **MEDIUM (documented)** -- Runtime constants (`NON_CLIENT_EVENT_LABELS`, `NON_CLIENT_EVENT_COLORS`, `NON_CLIENT_EVENT_CONFIG`) belong in `src/constants/` but left in place to avoid import churn
    6. **LOW (documented)** -- Entity interfaces use plain `number`/`string` for IDs instead of branded types; acceptable since branded types are used at API boundaries
    7. **INFO (documented)** -- File is 966 lines (exceeds 500-line guideline); consider moving domain types (Opinion*, Sars*, Administration*) to domain files
  - **Fixes Applied**:
    1. Removed duplicate enum definitions from `roleHierarchy.ts`; now imports from `@/types` and re-exports
    2. Replaced `any[]` with `AllocationPeriod[]` on `TaskTeam.allocations`
    3. Removed deprecated `ClientWithEmployees` interface
    4. Added `export * from './branded'` for centralized exports
- `src/types/branded.ts` -- Branded ID types (TaskId, ClientId, etc.)
  - **Issues Found**:
    1. **LOW** -- 26 trailing blank lines at end of file
  - **Fixes Applied**:
    1. Removed trailing blank lines
  - **Notes**: File is clean -- 19 branded types with matching `toXxxId()` converters, uses `unknown` input types correctly, no `any`, no circular deps. Now re-exported from `types/index.ts` (fixed in previous review).
- `src/types/api.ts` -- API types (request/response shapes)
  - **Issues Found**:
    1. **MEDIUM** -- Dead runtime function `mapWipMonthlyToMetrics()` (zero consumers) defined in a types file; runtime logic belongs in a service/utility
    2. **LOW** -- ~30 trailing blank lines at end of file
    3. **LOW (documented)** -- File is 647 lines (exceeds 500-line guideline); acceptable as centralized API response type registry
  - **Fixes Applied**:
    1. Removed dead `mapWipMonthlyToMetrics()` function (zero usages)
    2. Removed trailing blank lines
  - **Notes**: No `any` types, no circular deps, no enum duplication. `null` usage consistent with DB-nullable fields. Re-exports AI types from `@/lib/ai/schemas` (no circular import).
- [x] `src/types/dto.ts` -- Data Transfer Object types
  - **Issues Found**:
    1. **LOW** -- `ExternalLink` entity interface (line 199) is not a DTO; belongs in `types/index.ts`. Only 1 consumer.
    2. **LOW** -- ~15 trailing blank lines at end of file
    3. **LOW (documented)** -- DTOs manually defined rather than derived from Prisma via `Partial/Pick/Omit`; acceptable since input DTOs don't always map 1:1
  - **Fixes Applied**:
    1. Removed trailing blank lines
  - **Notes**: No `any` types, no circular deps. Imports `ServiceLine`/`ServiceLineRole` from `./index` correctly. `null` vs `undefined` pattern consistent.

### Domain Type Files

- [x] `src/types/analytics.ts` -- Analytics types
  - **Issues Found**: None
  - **Notes**: Clean. 237 lines. Domain-specific enums (`AnalyticsDocumentType`, `CreditRatingGrade`) re-exported via `index.ts`. No `any`, no circular deps.
- [x] `src/types/approval.ts` -- Approval types
  - **Issues Found**: None
  - **Notes**: Clean. 186 lines. Properly derives from Prisma types (`extends Approval`, etc.). Uses `unknown` correctly. `React.ComponentType` reference valid via global types.
- [x] `src/types/approvals.ts` -- Approvals types
  - **Issues Found**: None
  - **Notes**: Clean. 219 lines. Imports from `@/types/approval` (no circular). Domain-specific approval DTOs well-organized.
- [x] `src/types/bd-wizard.ts` -- BD wizard types
  - **Issues Found**: None
  - **Notes**: Clean. 118 lines. Wizard step types with conditional step logic. `React.ComponentType` reference valid via global types.
- [x] `src/types/budget.ts` -- Budget types
  - **Issues Found**: None
  - **Notes**: Clean. 57 lines. Well-structured budget category/member/summary types.
- [x] `src/types/bugReport.ts` -- Bug report types
  - **Issues Found**: None
  - **Notes**: Clean. 52 lines. Domain enums (`BugReportStatus`, `BugReportPriority`) appropriate here.
- [x] `src/types/documentVault.ts` -- Document vault types
  - **Issues Found**: None
  - **Notes**: Clean. 176 lines. Uses string literal union types for status/scope. Category approvers well-typed.
- [x] `src/types/email.ts` -- Email types
  - **Issues Found**: 1. **LOW** -- Trailing blank line
  - **Fixes Applied**: 1. Removed trailing blank line
  - **Notes**: 103 lines. Domain enums (`EmailNotificationType`, `EmailStatus`) appropriate here.
- [x] `src/types/notification.ts` -- Notification types
  - **Issues Found**: 1. **LOW** -- Trailing blank line
  - **Fixes Applied**: 1. Removed trailing blank line
  - **Notes**: Clean. 109 lines. Re-exported via `index.ts`. Domain enum `NotificationType` appropriate here.
- [x] `src/types/pagePermissions.ts` -- Page permission types
  - **Issues Found**: 1. **LOW** -- ~20 trailing blank lines
  - **Fixes Applied**: 1. Removed trailing blank lines
  - **Notes**: Clean. 81 lines. Imports `SystemRole`/`ServiceLineRole` from `./index` correctly. `PageAccessLevel` enum appropriate here.
- [x] `src/types/qrm.ts` -- QRM types
  - **Issues Found**: None
  - **Notes**: Clean. 31 lines. Simple metric/stats interfaces, no imports, no enums.
- [x] `src/types/review-notes.ts` -- Review note types
  - **Issues Found**: 1. **LOW** -- Trailing blank line
  - **Fixes Applied**: 1. Removed trailing blank line
  - **Notes**: Clean. 344 lines. Properly derives from Prisma types. Domain enums appropriate. `STATUS_TRANSITIONS` constant is tightly coupled to types (1 consumer in service).
- [x] `src/types/search.ts` -- Search types
  - **Issues Found**: 1. **LOW** -- Trailing blank line
  - **Fixes Applied**: 1. Removed trailing blank line
  - **Notes**: Clean. 82 lines. Good use of inheritance and discriminated union (`source` field).
- [x] `src/types/service-line.ts` -- Service line types
  - **Issues Found**: 1. **INFO** -- Mixes types with runtime constants, React imports, and icon components. 2. **INFO** -- `SERVICE_LINE_DETAILS` is deprecated but still has 2 consumers. 3. **INFO** -- Uses default Tailwind colors instead of Forvis brand colors (migration candidate).
  - **Notes**: 208 lines. Contains `SERVICE_LINE_CONFIGS`, icon mappings, and utility functions tightly coupled to types. Refactoring to separate file would be significant. Document for future migration.
- [x] `src/types/task-stages.ts` -- Task stage types
  - **Issues Found**: 1. **LOW** -- ~42 trailing blank lines. 2. **LOW** -- Unused `TaskStageType` alias (zero external consumers).
  - **Fixes Applied**: 1. Removed trailing blank lines. 2. Removed unused `TaskStageType` alias.
  - **Notes**: 13 lines after cleanup. Simple enum.
- [x] `src/types/templateExtraction.ts` -- Template extraction types
  - **Issues Found**: None
  - **Notes**: Clean. 84 lines. Contains tightly-coupled constants (`STANDARD_PLACEHOLDERS`) and utility functions. Well-structured.

### Declaration Files

- [x] `src/types/event-calendar.d.ts` -- Event calendar type definitions
  - **Issues Found**: 1. **LOW** -- ~8 trailing blank lines. 2. **INFO** -- Uses `any` for third-party library params (acceptable in `.d.ts`).
  - **Fixes Applied**: 1. Removed trailing blank lines.
  - **Notes**: 6 lines after cleanup. Declaration file for `@event-calendar/core`.
- [x] `src/types/jspdf-autotable.d.ts` -- jsPDF autotable type definitions
  - **Issues Found**: 1. **LOW** -- Trailing blank line.
  - **Fixes Applied**: 1. Removed trailing blank line.
  - **Notes**: Clean. 38 lines. Well-typed declaration for jsPDF plugin.
- [x] `src/types/next-auth.d.ts` -- NextAuth type definitions
  - **Issues Found**: 1. **LOW** -- 2 trailing blank lines.
  - **Fixes Applied**: 1. Removed trailing blank lines.
  - **Notes**: Clean. 25 lines. Standard NextAuth type augmentation.

---

## Constants (3 files)

- [x] `src/constants/acceptance-questions.ts` -- Acceptance questionnaire constants
  - **Issues Found**: 1. **LOW** -- ~22 trailing blank lines. 2. **INFO** -- 1163 lines exceeds 500-line guideline, but acceptable as questionnaire data definitions.
  - **Fixes Applied**: 1. Removed trailing blank lines.
  - **Notes**: Well-structured with clear section separation. Type-safe with `as const` patterns. No `any`.
- [x] `src/constants/business-rules.ts` -- Business rule constants
  - **Issues Found**: 1. **LOW** -- ~27 trailing blank lines.
  - **Fixes Applied**: 1. Removed trailing blank lines.
  - **Notes**: Clean. 49 lines after cleanup. Good use of `as const`.
- [x] `src/constants/routes.ts` -- Route path constants
  - **Issues Found**: 1. **LOW** -- ~6 trailing blank lines.
  - **Fixes Applied**: 1. Removed trailing blank lines.
  - **Notes**: Clean. 65 lines after cleanup. Good use of `as const` with typed route helpers.

---

## Prisma Schema (1 file)

- [x] `prisma/schema.prisma` -- Database schema (75+ models)
  - **Review Focus**: `@updatedAt` usage, indexes, relationships, ID conventions
  - **Issues Found**: 1. **MEDIUM** -- 8 models use `@default(now())` instead of `@updatedAt` for `updatedAt` field, violating convention. Affected models: `AcceptanceAnswer` (line 18), `AcceptanceQuestion` (line 57), `ClientAcceptance*` (lines 528, 557, 578), `VaultDocument*` (lines 2055, 2086, 2106). These appear to be introspected from legacy DB.
  - **Fixes Applied**: 1. Changed all 8 models from `@default(now())` to `@updatedAt` for `updatedAt` field.
  - **Notes**: 2371 lines. Large schema with 75+ models. Most models correctly use `@updatedAt`. Legacy models with `map:` constraints were introspected from SQL Server.

---

## Middleware (1 file)

- [x] `src/middleware.ts` -- Next.js middleware (security headers, auth checks, route protection)
  - **Issues Found**: 1. **LOW** -- Trailing blank line.
  - **Fixes Applied**: 1. Removed trailing blank line.
  - **Notes**: Clean. 103 lines. Good security headers, proper Edge runtime handling, clear auth flow with JWT-only verification. Sets `x-pathname` for PageAccessGuard.

---

## Config Files (3 files)

- [x] `tsconfig.json` -- TypeScript configuration (strict mode, path aliases)
  - **Issues Found**: None
  - **Notes**: Clean. `strict: true` with additional strictness (`noUncheckedIndexedAccess`, `noImplicitReturns`, `noFallthroughCasesInSwitch`). Path alias `@/*` configured.
- [x] `.eslintrc.json` -- ESLint configuration (no-explicit-any, no-console)
  - **Issues Found**: None
  - **Notes**: Clean. `no-explicit-any: "error"`, `no-console: "warn"` (allows `error`/`warn`), `no-unused-vars: "warn"` with underscore ignore.
- [x] `next.config.js` -- Next.js configuration (security headers, externals, image config)
  - **Issues Found**: 1. **INFO** -- `eslint.ignoreDuringBuilds: true` (common pattern with separate CI linting step).
  - **Notes**: Clean. 136 lines. Good security: `poweredByHeader: false`, CSP, HSTS, X-Frame-Options. Azure SDK externalized for SSR. Bundle analyzer support. Cache-Control on analytics routes.

