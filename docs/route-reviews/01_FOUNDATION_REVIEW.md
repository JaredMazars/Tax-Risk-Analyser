# Phase 1: Foundation Review

**Scope**: Types, constants, Prisma schema, middleware, and configuration files
**Total Items**: 32 files
**Last Updated**: February 6, 2026
**Status**: Completed (32/32)

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
| TypeScript Types | 24     | 23       | In Progress     |
| Constants        | 3      | 3        | Completed       |
| Prisma Schema    | 1      | 0        | Pending         |
| Middleware       | 1      | 0        | Pending         |
| Config Files     | 3      | 3        | Completed       |
| **TOTAL**        | **32** | **13**   | **In Progress** |


---

## TypeScript Types (24 files)

### Core Type Files

- `src/types/index.ts` -- Main type exports, enums (SystemRole, ServiceLineRole)
  - **Reviewed**: February 6, 2026
  - **Issues Found**:
    1. **HIGH: Branded ID types not used in interfaces** -- Branded types exist in `branded.ts` (TaskId, ClientId, UserId, GSClientID, etc.) but every interface uses raw `number`/`string` instead. Zero type-safety benefit at interface boundaries. Affects: Task, Client, TaskTeam, TaskAcceptance, TaskEngagementLetter, TaskDocument, NewsBulletin, ClientAcceptance, OpinionDraft, and ~15 more.
    2. **HIGH: `| string` escape hatches defeat type safety** -- Multiple fields use `EnumType | string` (lines 294, 295, 320, 384, 409, 460, 784, 805) which makes enums meaningless since `string` subsumes all enum values. E.g., `role: ServiceLineRole | string` and `type: 'DEBIT' | 'CREDIT' | ... | string`.
    3. **HIGH: File exceeds 500-line limit** -- 974 lines (nearly 2x the limit). Domain-specific types (tax opinions, SARS responses, compliance, BD, planner allocations) should be extracted to domain type files.
    4. **MEDIUM: Runtime constants in a types file** -- `NON_CLIENT_EVENT_LABELS` (L437), `NON_CLIENT_EVENT_COLORS` (L447), `NON_CLIENT_EVENT_CONFIG` (L878) are runtime values, not types. Should be in `src/constants/`.
    5. **MEDIUM: Duplicate `user`/`User` fields on TaskTeam** -- Two identical shapes (lines 328-343) for the same data; API layer should normalize casing instead of accommodating both.
    6. **MEDIUM: Interfaces manually redeclared instead of derived from Prisma** -- Types like Task, Client, TaskTeam are manually written instead of using `Prisma.XxxGetPayload<...>` or `Pick/Omit` from generated Prisma types. Creates drift risk on schema changes.
    7. **MEDIUM: `Date | string` on timestamp fields** -- `TaxAdjustment.createdAt/updatedAt` typed as `Date | string` (lines 794-795). Ambiguous -- conflates server-side and API response contexts.
    8. **MEDIUM: Inconsistent optional/null semantics** -- Some fields use `?:`, some `| null`, many use `?: ... | null`. Rule says: `undefined` for optional, `null` for DB nulls. Mixing both muddies semantics.
    9. **LOW: Non-Forvis brand colors** -- `NON_CLIENT_EVENT_COLORS` uses default Tailwind colors (#10B981, #3B82F6, etc.) instead of Forvis brand/data viz palette.
  - **Fixes Applied**:
    1. Issue #1 (branded IDs): Deferred -- requires interface-level changes across entire codebase. Addressed partially via Phase 5 (parseXxxId now returns branded types at API boundary).
    2. Issue #2: FIXED -- Removed `| string` from all 8 enum fields. Fixed downstream type errors in `TaskDetailContent.tsx` and `page.tsx`.
    3. Issue #3: PARTIALLY FIXED -- Extracted tax domain types to `src/types/tax.ts` (205 lines) and allocation types to `src/types/allocations.ts` (90 lines). Moved runtime constants to `src/constants/nonClientEvents.ts` (73 lines). File reduced from 974 to 611 lines. Remaining types are core shared types (Client, Task, TaskTeam) that belong in the main file.
    4. Issue #4: FIXED -- Moved `NON_CLIENT_EVENT_LABELS`, `NON_CLIENT_EVENT_COLORS`, `NON_CLIENT_EVENT_CONFIG` to `src/constants/nonClientEvents.ts`. Updated 11 consuming files.
    5. Issue #5: FIXED -- Extracted shared `TaskTeamUser` interface for the user shape. Documented `User` as canonical Prisma relation name and `user` as lowercase alias via JSDoc.
    6. Issue #6: Deferred -- Architectural change to derive from Prisma types requires separate initiative.
    7. Issue #7: FIXED -- Changed `Date | string` to `Date` on `TaxAdjustment.createdAt/updatedAt` and `TaxAdjustmentDisplay.createdAt`.
    8. Issue #8: PARTIALLY FIXED -- Normalized `TaskAcceptance` and `TaskEngagementLetter` to use `| null` (not `?: ... | null`) for DB-nullable fields. Full audit of all interfaces deferred to Issue #6 initiative.
    9. Issue #9: FIXED -- Replaced default Tailwind hex values with Forvis data-viz palette colors in both `NON_CLIENT_EVENT_COLORS` and `NON_CLIENT_EVENT_CONFIG` gradients.
  - **Notes**:
    - Enums (SystemRole, ServiceLineRole, ServiceLine, NonClientEventType, BulletinCategory, DocumentType) are correctly defined once -- not duplicated elsewhere. PASS.
    - No `any` types found. PASS.
    - No circular type dependencies via re-exports. PASS.
    - New files created: `src/types/tax.ts`, `src/types/allocations.ts`, `src/constants/nonClientEvents.ts`
    - All fixes verified with `npx tsc --noEmit` (no new errors introduced).
- `src/types/branded.ts` -- Branded ID types (TaskId, ClientId, etc.)
  - **Reviewed**: February 6, 2026
  - **Issues Found**:
    1. **HIGH: Massive code duplication in converter functions** -- 13 numeric `toXxxId()` converters are identical except for the type name and error message. Should use a generic factory: `const createNumericIdParser = <T>(name: string) => (value: unknown): T => {...}`. Same for the 2 string-based converters (`toUserId`, `toGSClientID`, `toGSEmployeeID`, `toGSTaskID`).
    2. **HIGH: Parallel duplicate parsers exist in `apiUtils.ts**` -- `parseTaskId()`, `parseAdjustmentId()`, `parseDocumentId()`, `parseApprovalId()`, `parseToolId()`, `parseGSClientID()` in `src/lib/utils/apiUtils.ts` do the same job but return raw `number`/`string` (not branded types) and use `AppError`. Two systems for the same purpose -- should be unified so `parseXxxId()` returns branded types and `toXxxId()` is eliminated or made an alias.
    3. **MEDIUM: Converters throw plain `Error` instead of `AppError**` -- `toXxxId()` functions throw `new Error(...)` while project convention requires `AppError` with `ErrorCodes.VALIDATION_ERROR`. The parallel `parseXxxId()` functions in `apiUtils.ts` correctly use `AppError`.
    4. **MEDIUM: `parseXxxId()` functions don't return branded types** -- API route parsers return raw `number`/`string`, not branded types like `TaskId`/`ClientId`. This means branded types provide zero enforcement at the API boundary where they matter most.
    5. **LOW: ~23 trailing blank lines** (L230-252) -- Minor cleanup.
    6. **LOW: Minimal JSDoc** -- Each converter says "Convert unknown value to XxxId with validation" without `@param`/`@returns`/`@throws` tags.
  - **Fixes Applied**:
    1. Issue #1: FIXED -- Replaced 19 duplicate converter functions with `createNumericIdParser<T>()` and `createStringIdParser<T>()` generic factories. File reduced from 252 to 96 lines.
    2. Issue #2: FIXED -- `parseXxxId()` functions in `apiUtils.ts` now delegate to branded converters and return branded types (`TaskId`, `AdjustmentId`, `ToolId`, `DocumentId`, `ApprovalId`, `GSClientID`).
    3. Issue #3: FIXED -- All `toXxxId()` converters now throw `AppError` with `ErrorCodes.VALIDATION_ERROR` (via factory).
    4. Issue #4: FIXED -- `parseTaskId()` returns `TaskId`, `parseAdjustmentId()` returns `AdjustmentId`, etc.
    5. Issue #5: FIXED -- Trailing blank lines removed.
    6. Issue #6: FIXED -- Factory functions have full JSDoc with `@param`, `@returns`, `@throws` tags.
  - **Notes**:
    - Branded type definitions themselves are well-structured. Good use of `readonly __brand` pattern. PASS.
    - No `any` types. PASS.
    - File under 500 lines (96 lines). PASS.
    - camelCase file naming. PASS.
    - Added `ToolId` and `ApprovalId` branded types to match existing `parseToolId`/`parseApprovalId` functions.
    - `parseNumericId()` retained as public export in `apiUtils.ts` for entity types without dedicated branded parsers.
    - All fixes verified with `npx tsc --noEmit` (no new errors introduced).
- `src/types/api.ts` -- API types (request/response shapes)
  - **Reviewed**: February 6, 2026
  - **Issues Found**:
    1. **HIGH: File exceeds 500-line limit** -- 605 lines of content (631 with trailing blanks). Contains types for 5+ distinct domains: standard API types, profitability reports, tasks-by-group, overview, recoverability, stored procedure results, WIP aging, and country management summary SP results.
    2. **MEDIUM: Duplicate `AgingBuckets` interface** -- Identical `AgingBuckets` interface defined in both `src/types/api.ts` (L258) and `src/lib/services/analytics/debtorAggregation.ts` (L19). Consumers split across both sources (2 from types, 3 from service).
    3. **MEDIUM: Dead exports (5 unused types)** -- `ExtractionContext`, `FileUploadResult`, `ProfitabilityReportParams`, `RecoverabilityReportParams`, `MyReportsOverviewParams` have zero external consumers.
    4. **MEDIUM: Branded ID types not used for IDs** -- `ExtractionContext.taskId: number` (should be `TaskId`), `TaxAdjustmentExport.id: number` (should be `AdjustmentId`), `FileUploadResult.fileId?: number`.
    5. **LOW: ~25 trailing blank lines** (L607-631).
  - **Fixes Applied**:
    1. Issue #1: FIXED -- Extracted all report/SP types (~440 lines) to new `src/types/reports.ts`. File reduced from 605 to 85 lines. Updated 44 consumer files to import from `@/types/reports`. Added `export * from './reports'` re-export in `api.ts` for backwards compatibility.
    2. Issue #2: FIXED -- Removed duplicate `AgingBuckets` from `debtorAggregation.ts`, replaced with import from `@/types/reports`. Re-exported for backwards compatibility. Updated 3 consumer files to import from `@/types/reports`.
    3. Issue #3: FIXED -- Removed all 5 dead exports (`ExtractionContext`, `FileUploadResult`, `ProfitabilityReportParams`, `RecoverabilityReportParams`, `MyReportsOverviewParams`).
    4. Issue #4: Deferred -- same as `index.ts` Issue #1. Requires broader initiative to adopt branded IDs at interface level.
    5. Issue #5: FIXED -- Trailing blank lines removed.
  - **Notes**:
    - No `any` types. PASS.
    - No circular dependencies (`@/lib/ai/schemas` does not import back). PASS.
    - No enum duplication (file doesn't define enums). PASS.
    - camelCase filename. PASS.
    - Re-exported AI types properly sourced from `@/lib/ai/schemas`. PASS.
    - New file created: `src/types/reports.ts` (440 lines -- Profitability, Recoverability, WIP Aging, Overview, TasksByGroup, SP results, Country Management summary).
    - Adjacent observation: `src/types/dto.ts` has 7 occurrences of `| string` escape hatches on enum fields (same pattern fixed in `index.ts`). Will be addressed when `dto.ts` is reviewed.
    - All fixes verified with `npx tsc --noEmit` (pending).
- `src/types/dto.ts` -- Data Transfer Object types
  - **Reviewed**: February 6, 2026
  - **Issues Found**:
    1. **HIGH: `| string` escape hatches on enum fields (7 occurrences)** -- `ServiceLineWithStats.serviceLine: ServiceLine | string`, `.role: ServiceLineRole | string`, plus 5 more on `CreateServiceLineUserDTO`, `UpdateServiceLineUserDTO`, `ServiceLineUserDTO`. These defeat type safety by allowing arbitrary strings where enum values are expected.
    2. **HIGH: 11 dead exports (zero external consumers)** -- `UpdateTaskDTO`, `CreateTaskDTO`, `UpdateClientDTO`, `CreateClientDTO`, `UpdateTaxAdjustmentDTO`, `CreateTaxAdjustmentDTO`, `CreateServiceLineUserDTO`, `UpdateServiceLineUserDTO`, `ServiceLineUserDTO`, `CreateExternalLinkDTO`, `UpdateExternalLinkDTO` are never imported anywhere in the codebase.
    3. **LOW: ~11 trailing blank lines** (L231-242).
  - **Fixes Applied**:
    1. Issue #1: FIXED -- Removed `| string` from `ServiceLineWithStats.serviceLine` and `.role`. Updated `serviceLineService.ts` admin path to use `as ServiceLine` cast and `ServiceLineRole.ADMINISTRATOR` enum value, and regular user path to use `as ServiceLine` / `as ServiceLineRole` casts. The other 5 affected types were unused (see Issue #2).
    2. Issue #2: FIXED -- Removed all 11 dead DTO exports. File reduced from 242 lines to 59 lines. Only 5 types retained: `PaginationParams`, `PaginatedResponse`, `ServiceLineWithStats`, `ExternalLink` (all have active consumers).
    3. Issue #3: FIXED -- Trailing blank lines removed.
  - **Notes**:
    - No `any` types. PASS.
    - No circular dependencies. PASS.
    - No enum duplication (enums imported from `./index`). PASS.
    - camelCase filename. PASS.
    - File under 500-line limit (59 lines). PASS.
    - Consumers unaffected: Only `ServiceLineWithStats` and `ExternalLink` are imported externally (6 files total), and their shapes are unchanged.

### Domain Type Files

- `src/types/analytics.ts` -- Analytics types
  - **Reviewed**: February 6, 2026
  - **Issues Found**:
    1. **MEDIUM: 10 dead exports (zero external consumers)** -- `CreditRatingWithDocuments`, `GenerateCreditRatingResponse`, `AnalyticsDocumentsResponse`, `CreditRatingsResponse`, `LatestCreditRatingResponse`, `FinancialRatiosResponse`, `UploadDocumentData`, `RatingTrend`, `RatioComparison`, `TaskTimeAccumulationResponse`.
    2. **MEDIUM: `documentType: string` should use `AnalyticsDocumentType` enum** -- The enum is defined in the same file but the `AnalyticsDocument.documentType` field uses plain `string`.
    3. **LOW: `TaskTimeAccumulationData.taskId: number`** -- Should be branded `TaskId`. Deferred per branded ID initiative.
  - **Fixes Applied**:
    1. Issue #1: FIXED -- Removed all 10 dead exports. File reduced from 237 to 161 lines.
    2. Issue #2: Deferred -- Requires API boundary casts since Prisma returns `string` from database. Will address when analytics API routes are reviewed.
    3. Issue #3: Deferred -- Broader branded ID initiative.
  - **Notes**:
    - No `any` types. PASS.
    - No circular dependencies. PASS.
    - No enum duplication (`AnalyticsDocumentType`, `CreditRatingGrade` are unique to this file). PASS.
    - camelCase filename. PASS.
    - File under 500-line limit (161 lines). PASS.
    - 10 types retained (all have active external consumers): `AnalyticsDocumentType`, `CreditRatingGrade`, `AnalyticsDocument`, `FinancialRatios`, `CreditAnalysisReport`, `CreditRating`, `GenerateCreditRatingRequest`, `CumulativeDataPoint`, `EmployeeTimeAccumulation`, `TaskTimeAccumulationData`.
- `src/types/approval.ts` -- Approval types
  - **Reviewed**: February 6, 2026
  - **Issues Found**:
    1. **MEDIUM: `ApprovalActionResult.workflowType: string`** -- Should use the `WorkflowType` type alias defined in the same file, not plain `string`.
    2. **MEDIUM: 5 dead exports (zero external consumers)** -- `ApprovalStatus`, `ApprovalStepStatus`, `ApprovalStepWithUsers`, `CreateRouteConfig`, `ActiveDelegation`.
  - **Fixes Applied**:
    1. Issue #1: FIXED -- Changed `workflowType: string` to `workflowType: WorkflowType` on `ApprovalActionResult`.
    2. Issue #2: FIXED -- Removed all 5 dead exports. Cleaned unused `ApprovalRoute`, `ApprovalDelegation` imports from `@prisma/client`. File reduced from 186 to 131 lines.
  - **Notes**:
    - No `any` types. PASS.
    - No circular dependencies. PASS.
    - No enum duplication (file defines type aliases, not enums). PASS.
    - camelCase filename. PASS.
    - File under 500-line limit (131 lines). PASS.
    - 12 types retained: `ApprovalPriority`, `ApprovalStepType`, `WorkflowType`, `ApprovalWithSteps`, `RouteConfig`, `RouteStepConfig`, `CreateApprovalConfig`, `DelegationConfig`, `ApprovalActionResult`, `UserApprovalsResponse`, `WorkflowDataFetcher`, `WorkflowRegistryEntry`.
- `src/types/approvals.ts` -- Approvals types (My Approvals feature DTOs)
  - **Reviewed**: February 6, 2026
  - **Issues Found**:
    1. **LOW: String-typed fields could use stricter union types** -- `ChangeRequestApproval.status`, `ReviewNoteApproval.status`, `ReviewNoteApproval.priority`, `IndependenceConfirmationApproval.role` use `string` where enum/union types would be stronger. These are DTOs reflecting Prisma output.
  - **Fixes Applied**:
    1. Issue #1: Deferred -- Same pattern as prior reviews. Requires API boundary casts. Will address when API routes are reviewed.
  - **Notes**:
    - No `any` types. PASS.
    - No dead exports (all 10 types have active consumers). PASS.
    - No circular dependencies. PASS.
    - No enum duplication. PASS.
    - camelCase filename. PASS.
    - File under 500-line limit (219 lines). PASS.
    - Naming note: `approval.ts` (framework types) vs `approvals.ts` (feature DTOs) — distinct purposes, not duplication.
- `src/types/bd-wizard.ts` -- BD wizard types
  - **Reviewed**: February 6, 2026
  - **Issues Found**:
    1. **LOW: 1 dead export** -- `TemplateOption` has zero external consumers.
    2. **LOW: Kebab-case filename** -- `bd-wizard.ts` should be `bdWizard.ts` per camelCase convention. Deferred (12 import paths to update).
    3. **LOW: `opportunityDetails.serviceLine: string`** -- Could use `ServiceLine` enum. Deferred (wizard form data, will address when BD routes reviewed).
  - **Fixes Applied**:
    1. Issue #1: FIXED -- Removed dead `TemplateOption` export. File reduced from 118 to 107 lines.
    2. Issue #2: Deferred -- File rename requires updating 12 import paths across wizard components.
    3. Issue #3: Deferred -- Requires broader change to wizard form handling.
  - **Notes**:
    - No `any` types. PASS.
    - No circular dependencies (no project imports). PASS.
    - No enum duplication. PASS.
    - File under 500-line limit (107 lines). PASS.
    - 5 types retained (all have active consumers): `BDWizardData`, `StepProps`, `WizardStep`, `EmployeeOption`, `ClientSearchResult`.
- `src/types/budget.ts` -- Budget types
  - **Reviewed**: February 6, 2026
  - **Issues Found**: None.
  - **Fixes Applied**: None needed.
  - **Notes**:
    - No `any` types. PASS.
    - No dead exports (all 6 types have active consumers). PASS.
    - No circular dependencies. PASS.
    - No enum duplication. PASS.
    - camelCase filename. PASS.
    - File under 500-line limit (57 lines). PASS.
- `src/types/bugReport.ts` -- Bug report types
  - **Reviewed**: February 6, 2026
  - **Issues Found**: None.
  - **Fixes Applied**: None needed.
  - **Notes**:
    - No `any` types. PASS.
    - No dead exports (all 4 types have active consumers). PASS.
    - No circular dependencies. PASS.
    - No enum duplication. PASS.
    - Enums properly used on interface fields (`status: BugReportStatus`, `priority: BugReportPriority`). PASS.
    - camelCase filename. PASS.
    - File under 500-line limit (52 lines). PASS.
- `src/types/documentVault.ts` -- Document vault types
  - **Reviewed**: February 6, 2026
  - **Issues Found**:
    1. **MEDIUM: 4 dead exports** -- `CreateVaultDocumentInput`, `UpdateVaultDocumentInput` (duplicated in `schemas.ts` via Zod inference), `VaultCategoryWithApprovers`, `CategoryApproverAssignment`.
    2. **LOW: `VaultDocumentApprovalDTO.status: string`** -- Could use stricter union type matching approval statuses.
  - **Fixes Applied**:
    1. Issue #1: FIXED -- Removed all 4 dead exports. File reduced from 176 to 143 lines.
    2. Issue #2: Deferred -- DTO field, same pattern as prior reviews.
  - **Notes**:
    - No `any` types. PASS.
    - No circular dependencies. PASS.
    - No enum duplication (type aliases, not enums). PASS.
    - Type aliases properly used on interface fields (`documentType: VaultDocumentType`, `scope: VaultDocumentScope`, etc.). PASS.
    - camelCase filename. PASS.
    - File under 500-line limit (143 lines). PASS.
- `src/types/email.ts` -- Email types
  - **Reviewed**: February 6, 2026
  - **Issues Found**:
    1. **MEDIUM: 2 dead exports** -- `NotificationPreference` and `EmailLog` have zero external consumers.
  - **Fixes Applied**:
    1. Issue #1: FIXED -- Removed both dead exports. File reduced from 103 to 75 lines.
  - **Notes**:
    - No `any` types. PASS.
    - No circular dependencies. PASS.
    - No enum duplication. PASS.
    - Enums used by emailService.ts (`EmailNotificationType`, `EmailStatus`). PASS.
    - camelCase filename. PASS.
    - File under 500-line limit (75 lines). PASS.
    - 7 types retained: `EmailNotificationType`, `EmailStatus`, `EmailUser`, `EmailTask`, `UserAddedEmailData`, `UserRemovedEmailData`, `EmailSendResult`.
- `src/types/notification.ts` -- Notification types
  - **Reviewed**: February 6, 2026
  - **Issues Found**:
    1. **LOW: `InAppNotification.type: string` and `NotificationFilters.types?: string[]`** -- Could use `NotificationType` enum. Deferred (DTO/Prisma boundary pattern).
  - **Fixes Applied**: None needed.
  - **Notes**:
    - No `any` types. PASS.
    - No dead exports (all 9 types have active consumers). PASS.
    - No circular dependencies. PASS.
    - No enum duplication. PASS.
    - camelCase filename. PASS.
    - File under 500-line limit (109 lines). PASS.
- `src/types/pagePermissions.ts` -- Page permission types
  - **Reviewed**: February 6, 2026
  - **Issues Found**:
    1. **LOW: ~15 trailing blank lines** (L81-95).
    2. **LOW: `PagePermission.role: string`** — Could use `PageRole` type for stricter typing. Deferred (common DTO/Prisma boundary pattern).
  - **Fixes Applied**:
    1. Issue #1: FIXED — Trailing blank lines removed. File reduced from 95 to 80 lines.
  - **Notes**:
    - All 7 exports have active consumers (15 files total). No dead code. PASS.
    - No `any` types. PASS.
    - No circular dependencies. PASS.
    - No enum duplication (enums imported from `./index`). PASS.
    - camelCase filename. PASS.
    - File under 500-line limit (80 lines). PASS.
- `src/types/qrm.ts` -- QRM types
  - **Reviewed**: February 6, 2026
  - **Issues Found**: None.
  - **Fixes Applied**: None needed.
  - **Notes**:
    - All 3 exports (`MetricStats`, `ServiceLineMonitoringStats`, `QRMMonitoringStats`) have active consumers (3 files). No dead code. PASS.
    - No `any` types. PASS.
    - No circular dependencies (no imports). PASS.
    - No enum duplication. PASS.
    - camelCase filename. PASS.
    - File under 500-line limit (31 lines). PASS.
- `src/types/review-notes.ts` -- Review note types
  - **Reviewed**: February 6, 2026
  - **Issues Found**:
    1. **HIGH: 9 dead exports** — `AddReviewNoteAssigneeDTO`, `RemoveReviewNoteAssigneeDTO`, `CreateReviewNoteCommentDTO`, `AssignReviewNoteDTO`, `ReviewNoteReportFilter`, `ReviewNoteReportData`, `STATUS_TRANSITIONS` (duplicated in reviewNoteService.ts), `ReviewNoteActivity`, `ReviewNotePermissions` — zero external consumers.
    2. **LOW: Unused `User` import** from `@prisma/client`.
    3. **LOW: Trailing blank line**.
    4. **LOW: kebab-case filename** `review-notes.ts` — deferred.
  - **Fixes Applied**:
    1. Issue #1: FIXED — Removed all 9 dead exports. File reduced from 344 to 257 lines.
    2. Issue #2: FIXED — Removed unused `User` import.
    3. Issue #3: FIXED — Trailing blank line removed.
  - **Notes**:
    - Remaining 16 exports all have active consumers (11 files). PASS.
    - No `any` types. PASS.
    - No circular dependencies. PASS.
    - No enum duplication. PASS.
    - File under 500-line limit (257 lines). PASS.
- `src/types/search.ts` -- Search types
  - **Reviewed**: February 6, 2026
  - **Issues Found**: None.
  - **Fixes Applied**: None needed.
  - **Notes**:
    - All 8 exports have active consumers (3 files). No dead code. PASS.
    - No `any` types. PASS.
    - No circular dependencies (no imports). PASS.
    - No enum duplication. PASS.
    - camelCase filename. PASS.
    - File under 500-line limit (82 lines). PASS.
- `src/types/service-line.ts` -- Service line types
  - **Reviewed**: February 6, 2026
  - **Issues Found**:
    1. **MEDIUM: 1 dead export** — `getServiceLineConfig()` never imported externally (zero consumers).
    2. **LOW: kebab-case filename** `service-line.ts` — deferred.
  - **Fixes Applied**:
    1. Issue #1: FIXED — Removed `getServiceLineConfig()`. File reduced from 208 to 200 lines.
  - **Notes**:
    - Remaining 5 exports (`ServiceLineConfig`, `SERVICE_LINE_CONFIGS`, `ServiceLineDetails`, `getServiceLineDetails`, `SERVICE_LINE_DETAILS`) all have active consumers (4 files) or are used internally. PASS.
    - `SERVICE_LINE_DETAILS` is marked `@deprecated` in favor of `getServiceLineDetails()`, but it is `SERVICE_LINE_DETAILS` that has external consumers (2 files), not the function. Deprecation notice is backwards — noted for future cleanup.
    - No `any` types. PASS.
    - No circular dependencies. PASS.
    - No enum duplication (imports `ServiceLine` from `./index`). PASS.
    - File under 500-line limit (200 lines). PASS.
- `src/types/task-stages.ts` -- Task stage types
  - **Reviewed**: February 6, 2026
  - **Issues Found**:
    1. **LOW: ~40 trailing blank lines** (L14-54).
  - **Fixes Applied**:
    1. Issue #1: FIXED — Trailing blank lines removed. File reduced from 54 to 14 lines.
  - **Notes**:
    - Single export (`TaskStage` enum) has active consumers (10 files). No dead code. PASS.
    - No `any` types. PASS.
    - No circular dependencies (no imports). PASS.
    - No enum duplication. PASS.
    - File under 500-line limit (14 lines). PASS.
    - kebab-case filename `task-stages.ts` — deferred.
- `src/types/tax.ts` -- Tax opinion, SARS, compliance, and adjustment types (extracted from index.ts)
  - **Issues Found**: N/A (new file, extracted from reviewed index.ts)
  - **Fixes Applied**: Created as part of index.ts Issue #3 remediation
  - **Notes**: 205 lines. Contains OpinionDraft, OpinionDocument, OpinionSection, OpinionChatMessage, ResearchNote, LegalPrecedent, SarsResponse, AdministrationDocument, ComplianceChecklistItem, FilingStatus, TaxAdjustment, TaxAdjustmentDisplay, AdjustmentDocument.
- `src/types/allocations.ts` -- Allocation and planner types (extracted from index.ts)
  - **Issues Found**: N/A (new file, extracted from reviewed index.ts)
  - **Fixes Applied**: Created as part of index.ts Issue #3 remediation
  - **Notes**: 90 lines. Contains TaskTeamAllocation, AllocationPeriod, GroupedTaskTeam, NonClientAllocation, TeamAllocation, TeamMemberWithAllocations.
- `src/types/reports.ts` -- Report and stored procedure result types (extracted from api.ts)
  - **Issues Found**: N/A (new file, extracted from reviewed api.ts)
  - **Fixes Applied**: Created as part of api.ts Issue #1 remediation
  - **Notes**: 440 lines. Contains ProfitabilityReportData, TaskWithWIP, TaskWithWIPAndServiceLine, TasksByGroupReport, MonthlyMetrics, MyReportsOverviewData, AgingBuckets, RecoverabilityReportData, MonthlyReceiptData, ClientDebtorData, WipLTDResult, WipMonthlyResult, DrsMonthlyResult, RecoverabilityDataResult, WIPAgingBuckets, WIPAgingTaskData, WIPAgingReportData, WIPAgingSPResult, ProfitabilitySummaryResult, WIPAgingSummaryResult.
- `src/types/templateExtraction.ts` -- Template extraction types
  - **Reviewed**: February 6, 2026
  - **Issues Found**: None.
  - **Fixes Applied**: None needed.
  - **Notes**:
    - All 8 exports (`PlaceholderSuggestion`, `ExtractedTemplateBlock`, `ExtractedTemplate`, `ProcessedTemplateResult`, `STANDARD_PLACEHOLDERS`, `StandardPlaceholder`, `isStandardPlaceholder`, `extractPlaceholdersFromContent`) have active consumers (10 files). No dead code. PASS.
    - No `any` types. PASS.
    - No circular dependencies (no imports). PASS.
    - No enum duplication. PASS.
    - camelCase filename. PASS.
    - File under 500-line limit (84 lines). PASS.

### Declaration Files

- `src/types/event-calendar.d.ts` -- Event calendar type definitions
  - **Reviewed**: February 6, 2026
  - **Issues Found**:
    1. **HIGH: Entire file dead** — `@event-calendar/core` is not installed (not in package.json) and never imported.
    2. **HIGH: 3 `any` types** — `plugins: any[]`, `options: any`, return type `any`.
    3. **LOW: 6 trailing blank lines**.
  - **Fixes Applied**:
    1. Issue #1: FIXED — File deleted. Package not installed, module never imported.
  - **Notes**:
    - DELETED — entirely dead declaration file.
- `src/types/jspdf-autotable.d.ts` -- jsPDF autotable type definitions
  - **Reviewed**: February 6, 2026
  - **Issues Found**:
    1. **HIGH: Entire file dead** — `jspdf` and `jspdf-autotable` are not installed (not in package.json) and never imported.
  - **Fixes Applied**:
    1. Issue #1: FIXED — File deleted. Packages not installed, modules never imported.
  - **Notes**:
    - DELETED — entirely dead declaration file.
- `src/types/next-auth.d.ts` -- NextAuth type definitions
  - **Reviewed**: February 6, 2026
  - **Issues Found**:
    1. **MEDIUM: Likely dead** — `next-auth` is in package.json (v5 beta) but never imported in any source file. Auth uses custom MSAL-based implementation. Declaration augments types that are never consumed.
    2. **LOW: 1 trailing blank line**.
  - **Fixes Applied**:
    1. Issue #1: NOTED — Left in place since package is a dependency. Should be removed along with `next-auth` package dependency in a separate cleanup.
    2. Issue #2: FIXED — Trailing blank line removed.
  - **Notes**:
    - No `any` types. PASS.
    - File under 500-line limit (25 lines). PASS.

---

## Constants (3 files)

- `src/constants/acceptance-questions.ts` -- Acceptance questionnaire constants
  - **Reviewed**: February 6, 2026
  - **Issues Found**:
    1. **MEDIUM: 2 dead exports** — `FieldType` (type, zero external consumers) and `getQuestionBySectionAndKey` (function, zero external consumers).
    2. **LOW: ~18 trailing blank lines**.
    3. **LOW: File is 1153 lines** — exceeds 500-line limit. However, this is questionnaire data (not logic), so splitting would fragment closely related constant definitions. Deferred.
  - **Fixes Applied**:
    1. Issue #1: FIXED — `FieldType` changed to non-exported `type` (still used internally by `AcceptanceQuestionDef`). `getQuestionBySectionAndKey` removed entirely.
    2. Issue #2: FIXED — Trailing blank lines removed.
  - **Notes**:
    - Remaining 10 exports all have active consumers (12 files). No dead code. PASS.
    - No `any` types. PASS.
    - No circular dependencies. PASS.
    - camelCase filename. PASS.
    - File size (1153 lines) exceeds limit — deferred due to data-heavy nature.
- `src/constants/business-rules.ts` -- Business rule constants
  - **Reviewed**: February 6, 2026
  - **Issues Found**:
    1. **HIGH: Entire file dead** — Never imported anywhere. All 6 exports (`PROJECT_LIMITS`, `FILE_UPLOAD`, `CACHE_TTL`, `PAGINATION_DEFAULTS`, `PROJECT_STATUS`, `ADJUSTMENT_STATUS`) have zero consumers. Similar constants exist inline throughout the codebase.
  - **Fixes Applied**:
    1. Issue #1: FIXED — File deleted entirely.
  - **Notes**:
    - DELETED — entirely dead constants file.
- `src/constants/routes.ts` -- Route path constants
  - **Reviewed**: February 6, 2026
  - **Issues Found**:
    1. **HIGH: Extensive dead code** — Out of 2 main exports (`ROUTES`, `API_ROUTES`), most nested properties are unused. Dead paths: `ROUTES.HOME`, `ROUTES.AUTH`, `ROUTES.PROJECTS.*` (all 6 functions), `ROUTES.SERVICE_LINE.*` (2 functions), `ROUTES.ADMIN.USERS`, and `API_ROUTES.HEALTH`, `API_ROUTES.AUTH.*` (3 of 4 paths), `API_ROUTES.PROJECTS.*` (all 5 functions), `API_ROUTES.CLIENTS.*` (2 functions), `API_ROUTES.NOTIFICATIONS.*` (all 5 paths/functions), `API_ROUTES.MAP`.
    2. **LOW: ~4 trailing blank lines**.
  - **Fixes Applied**:
    1. Issue #1: FIXED — Removed all dead nested properties. File reduced from 69 to 17 lines. Only active exports remain: `ROUTES.DASHBOARD.ROOT`, `ROUTES.DASHBOARD.NOTIFICATIONS`, `API_ROUTES.AUTH.LOGIN`.
    2. Issue #2: FIXED — Trailing blank lines removed.
  - **Notes**:
    - No `any` types. PASS.
    - No circular dependencies (no imports). PASS.
    - camelCase filename. PASS.
    - File under 500-line limit (17 lines). PASS.

---

## Prisma Schema (1 file)

- `prisma/schema.prisma` -- Database schema (98 models, 2370 lines)
  - **Review Focus**: `@updatedAt` usage, indexes, relationships, ID conventions
  - **Reviewed**: February 6, 2026
  - **Issues Found**: None.
  - **Fixes Applied**: None needed.
  - **Notes**:
    - All 98 models properly defined with correct syntax. PASS.
    - All models with `updatedAt` fields correctly use `@updatedAt` attribute for automatic timestamp management (per `database-patterns.mdc` requirement). PASS.
    - Schema validates successfully (`npx prisma validate`). PASS.
    - Proper indexes on foreign keys and frequently queried fields. PASS.
    - Relationships properly defined with `@relation` attributes and cascade behaviors. PASS.
    - ID conventions follow dual-ID pattern (internal `id` + external `GS*` GUIDs) per `database-patterns.mdc`. PASS.
    - File size (2370 lines) far exceeds 500-line limit — expected and acceptable for database schema with 98 models.

---

## Middleware (1 file)

- `src/middleware.ts` -- Next.js middleware (security headers, auth checks, route protection)
  - **Reviewed**: February 6, 2026
  - **Issues Found**: None.
  - **Fixes Applied**: None needed.
  - **Notes**:
    - Security headers properly applied to all responses (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy). PASS.
    - Authentication checks correctly implemented for protected routes (dashboard, API routes). PASS.
    - Edge runtime compatible using JWT-only verification (Prisma not available in Edge). PASS.
    - Public routes properly excluded (/auth, /_next, /api/health, /api/auth). PASS.
    - Proper redirects for unauthenticated users. PASS.
    - No `any` types. PASS.
    - No `console.log` statements. PASS.
    - File under 500-line limit (103 lines). PASS.

---

## Config Files (3 files)

- `tsconfig.json` -- TypeScript configuration (strict mode, path aliases)
  - **Reviewed**: February 6, 2026
  - **Issues Found**: None.
  - **Fixes Applied**: None needed.
  - **Notes**:
    - Strict mode enabled (`strict: true`). PASS.
    - Path aliases configured correctly (`@/*` → `./src/*`). PASS.
    - Additional strict checks enabled (`noUncheckedIndexedAccess`, `noImplicitReturns`, `noFallthroughCasesInSwitch`). PASS.
    - Proper target (`es2018`) and module resolution (`bundler`). PASS.
    - Excludes archived files and node_modules. PASS.
- `.eslintrc.json` -- ESLint configuration (no-explicit-any, no-console)
  - **Reviewed**: February 6, 2026
  - **Issues Found**: None.
  - **Fixes Applied**: None needed.
  - **Notes**:
    - `no-explicit-any` set to "error" (strict enforcement). PASS.
    - `no-console` set to "warn" (allows console.error/warn, warns on console.log). PASS.
    - Unused vars handling with ignore patterns for underscore-prefixed variables. PASS.
    - Modern JavaScript rules enforced (`prefer-const`, `no-var`). PASS.
    - Extends Next.js recommended configs (`next/core-web-vitals`, `next/typescript`). PASS.
- `next.config.js` -- Next.js configuration (security headers, externals, image config)
  - **Reviewed**: February 6, 2026
  - **Issues Found**:
    1. **LOW: 1 console.warn** (line 131) — Acceptable for optional bundle analyzer dependency warning.
  - **Fixes Applied**: None needed.
  - **Notes**:
    - Comprehensive security headers configured (X-Frame-Options, X-Content-Type-Options, CSP, HSTS, Referrer-Policy, Permissions-Policy). PASS.
    - Image optimization configured for Azure Blob Storage remote patterns. PASS.
    - Webpack externals properly configured for Azure SDK packages (server-side only). PASS.
    - Cache headers configured for analytics API routes (10-minute private cache). PASS.
    - `poweredByHeader: false` removes X-Powered-By header. PASS.
    - Package optimization for lucide-react and headlessui. PASS.
    - Bundle analyzer support with graceful fallback. PASS.
    - File under 500-line limit (136 lines). PASS.

