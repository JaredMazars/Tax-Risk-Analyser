# Phase 6: Domain Full-Stack Review

**Scope**: Domain-specific components, hooks, and services (non-API, non-UI-base)
**Total Items**: ~340 files across all domains
**Last Updated**: February 6, 2026
**Status**: Not Started

---

## Review Standards

See [REVIEW_STANDARDS.md](./REVIEW_STANDARDS.md) -- apply **UI Component Checklist**, **Performance Checklist**, and **Security Checklist**.

---

## Sign-Off Status

- [ ] **Domain Full-Stack Review Complete** -- Reviewer: _____ Date: _____

---

## Progress Summary

| Domain | Components | Hooks | Services | Total | Reviewed | Status |
|--------|-----------|-------|----------|-------|----------|--------|
| Tasks | ~40 | ~20 | ~15 | ~75 | 0 | Not Started |
| Clients | ~15 | ~10 | ~8 | ~33 | 0 | Not Started |
| Admin | ~25 | ~8 | ~12 | ~45 | 0 | Not Started |
| BD | ~15 | ~8 | ~6 | ~29 | 0 | Not Started |
| Approvals | ~10 | ~6 | ~5 | ~21 | 0 | Not Started |
| Service Lines | ~8 | ~6 | ~4 | ~18 | 0 | Not Started |
| Notifications | ~5 | ~4 | ~3 | ~12 | 0 | Not Started |
| Templates | ~8 | ~4 | ~4 | ~16 | 0 | Not Started |
| Groups | ~5 | ~3 | ~2 | ~10 | 0 | Not Started |
| Documents | ~8 | ~4 | ~5 | ~17 | 0 | Not Started |
| Search | ~3 | ~3 | ~2 | ~8 | 0 | Not Started |
| Analytics | ~8 | ~4 | ~5 | ~17 | 0 | Not Started |
| AI | ~5 | ~2 | ~8 | ~15 | 0 | Not Started |
| Employees | ~3 | ~2 | ~2 | ~7 | 0 | Not Started |
| Reports | ~5 | ~3 | ~5 | ~13 | 0 | Not Started |
| News | ~3 | ~2 | ~2 | ~7 | 0 | Not Started |
| **TOTAL** | **~166** | **~89** | **~88** | **~343** | **0** | **Not Started** |

---

## Task Domain (~75 files)

### Task Components (~40 files)

- [ ] `src/components/features/tasks/TaskList.tsx`
- [ ] `src/components/features/tasks/TaskCard.tsx`
- [ ] `src/components/features/tasks/TaskDetail.tsx`
- [ ] `src/components/features/tasks/TaskForm.tsx`
- [ ] `src/components/features/tasks/TaskFilters.tsx`
- [ ] `src/components/features/tasks/TaskStageIndicator.tsx`
- [ ] `src/components/features/tasks/TaskTimeline.tsx`
- [ ] `src/components/features/tasks/TaskTeamPanel.tsx`
- [ ] `src/components/features/tasks/TaskFinancials.tsx`
- [ ] `src/components/features/tasks/TaskDocuments.tsx`
- [ ] `src/components/features/tasks/acceptance/AcceptancePanel.tsx`
- [ ] `src/components/features/tasks/acceptance/AcceptanceQuestionnaire.tsx`
- [ ] `src/components/features/tasks/acceptance/AcceptanceResearch.tsx`
- [ ] `src/components/features/tasks/acceptance/AcceptanceStatus.tsx`
- [ ] `src/components/features/tasks/acceptance/AcceptanceDocuments.tsx`
- [ ] `src/components/features/tasks/tax/TaxCompliancePanel.tsx`
- [ ] `src/components/features/tasks/tax/ResearchNotes.tsx`
- [ ] `src/components/features/tasks/tax/LegalPrecedents.tsx`
- [ ] `src/components/features/tasks/tax/SarsResponses.tsx`
- [ ] `src/components/features/tasks/tax/FilingStatus.tsx`
- [ ] `src/components/features/tasks/documents/EngagementLetter.tsx`
- [ ] `src/components/features/tasks/documents/DPAPanel.tsx`
- [ ] `src/components/features/tasks/documents/WorkspaceFiles.tsx`
- [ ] `src/components/features/tasks/team/TeamMemberList.tsx`
- [ ] `src/components/features/tasks/team/AllocationEditor.tsx`
- [ ] `src/components/features/tasks/team/RoleAssignment.tsx`
- [ ] _Remaining task components to be inventoried during review_

### Task Hooks (~20 files)

- [ ] `src/hooks/tasks/useTasks.ts`
- [ ] `src/hooks/tasks/useTaskDetail.ts`
- [ ] `src/hooks/tasks/useTaskMutations.ts`
- [ ] `src/hooks/tasks/useTaskTeam.ts`
- [ ] `src/hooks/tasks/useTaskAllocations.ts`
- [ ] `src/hooks/tasks/useTaskAcceptance.ts`
- [ ] `src/hooks/tasks/useTaskDocuments.ts`
- [ ] `src/hooks/tasks/useTaskFinancials.ts`
- [ ] `src/hooks/tasks/useTaskStages.ts`
- [ ] `src/hooks/tasks/useTaskReviewNotes.ts`
- [ ] `src/hooks/tasks/useTaskFilters.ts`
- [ ] _Remaining task hooks to be inventoried during review_

### Task Services (~15 files)

- [ ] `src/lib/services/tasks/taskService.ts`
- [ ] `src/lib/services/tasks/taskTeamService.ts`
- [ ] `src/lib/services/tasks/taskAcceptanceService.ts`
- [ ] `src/lib/services/tasks/taskDocumentService.ts`
- [ ] `src/lib/services/tasks/taskStageService.ts`
- [ ] `src/lib/services/tasks/taskWorkflowService.ts`
- [ ] `src/lib/services/tasks/taskFinancialService.ts`
- [ ] `src/lib/services/tasks/taskAllocationService.ts`
- [ ] _Remaining task services to be inventoried during review_

---

## Client Domain (~33 files)

### Client Components (~15 files)

- [ ] `src/components/features/clients/ClientList.tsx`
- [ ] `src/components/features/clients/ClientCard.tsx`
- [ ] `src/components/features/clients/ClientDetail.tsx`
- [ ] `src/components/features/clients/ClientAnalytics.tsx`
- [ ] `src/components/features/clients/ClientFinancials.tsx`
- [ ] _Remaining client components to be inventoried during review_

### Client Hooks (~10 files)

- [ ] `src/hooks/clients/useClients.ts`
- [ ] `src/hooks/clients/useClientDetail.ts`
- [ ] `src/hooks/clients/useClientFilters.ts`
- [ ] `src/hooks/clients/useClientGroups.ts`
- [ ] `src/hooks/clients/useClientGraphData.ts`
- [ ] _Remaining client hooks to be inventoried during review_

### Client Services (~8 files)

- [ ] `src/lib/services/clients/clientService.ts`
- [ ] `src/lib/services/clients/clientAnalyticsService.ts`
- [ ] `src/lib/services/clients/clientAcceptanceService.ts`
- [ ] _Remaining client services to be inventoried during review_

---

## Admin Domain (~45 files)

### Admin Components (~25 files)

- [ ] `src/components/features/admin/page-permissions/PermissionTable.tsx`
- [ ] `src/components/features/admin/page-permissions/PermissionEditModal.tsx`
- [ ] `src/components/features/admin/templates/TemplateEditor.tsx`
- [ ] `src/components/features/admin/templates/TemplateVersioning.tsx`
- [ ] `src/components/features/admin/templates/TemplateSections.tsx`
- [ ] `src/components/features/admin/document-vault/DocumentTypeManager.tsx`
- [ ] `src/components/features/admin/document-vault/CategoryManager.tsx`
- [ ] `src/components/features/admin/service-lines/ServiceLineConfig.tsx`
- [ ] `src/components/features/admin/service-lines/ServiceLineMapping.tsx`
- [ ] `src/components/features/admin/users/UserManagement.tsx`
- [ ] _Remaining admin components to be inventoried during review_

### Admin Hooks (~8 files)

- [ ] `src/hooks/admin/useExternalLinks.ts`
- [ ] `src/hooks/admin/usePagePermissions.ts`
- [ ] `src/hooks/admin/useServiceLineAccess.ts`
- [ ] _Remaining admin hooks to be inventoried during review_

### Admin Services (~12 files)

- [ ] `src/lib/services/admin/pagePermissionService.ts`
- [ ] `src/lib/services/admin/pageDiscovery.ts`
- [ ] `src/lib/services/admin/externalLinkService.ts`
- [ ] `src/lib/services/admin/serviceLineMasterService.ts`
- [ ] `src/lib/services/admin/serviceLineMappingService.ts`
- [ ] `src/lib/services/admin/serviceLineAccessService.ts`
- [ ] `src/lib/services/admin/reviewCategoryService.ts`
- [ ] _Remaining admin services to be inventoried during review_

---

## BD Domain (~29 files)

### BD Components (~15 files)

- [ ] `src/components/features/bd/OpportunityList.tsx`
- [ ] `src/components/features/bd/OpportunityForm.tsx`
- [ ] `src/components/features/bd/ProposalManager.tsx`
- [ ] `src/components/features/bd/ActivityTracker.tsx`
- [ ] `src/components/features/bd/ContactManager.tsx`
- [ ] `src/components/features/bd/BDAnalyticsDashboard.tsx`
- [ ] _Remaining BD components to be inventoried during review_

### BD Hooks (~8 files)

- [ ] `src/hooks/bd/useOpportunities.ts`
- [ ] `src/hooks/bd/useActivities.ts`
- [ ] `src/hooks/bd/useContacts.ts`
- [ ] `src/hooks/bd/useProposals.ts`
- [ ] `src/hooks/bd/useBDAnalytics.ts`
- [ ] _Remaining BD hooks to be inventoried during review_

### BD Services (~6 files)

- [ ] `src/lib/services/bd/opportunityService.ts`
- [ ] `src/lib/services/bd/activityService.ts`
- [ ] `src/lib/services/bd/contactService.ts`
- [ ] `src/lib/services/bd/proposalService.ts`
- [ ] _Remaining BD services to be inventoried during review_

---

## Approvals Domain (~21 files)

### Approval Components (~10 files)

- [ ] `src/components/features/approvals/UnifiedApprovalCard.tsx`
- [ ] `src/components/features/approvals/ApprovalList.tsx`
- [ ] `src/components/features/approvals/ApprovalActions.tsx`
- [ ] `src/components/features/approvals/ApprovalHistory.tsx`
- [ ] _Remaining approval components to be inventoried during review_

### Approval Hooks (~6 files)

- [ ] `src/hooks/approvals/useApprovals.ts`
- [ ] `src/hooks/approvals/useApprovalMutations.ts`
- [ ] _Remaining approval hooks to be inventoried during review_

### Approval Services (~5 files)

- [ ] `src/lib/services/approvals/approvalService.ts`
- [ ] `src/lib/services/approvals/workflowRegistry.ts`
- [ ] `src/lib/services/approvals/approvalRoutingService.ts`
- [ ] _Remaining approval services to be inventoried during review_

---

## Service Lines Domain (~18 files)

- [ ] `src/components/features/service-lines/ServiceLineCard.tsx`
- [ ] `src/components/features/service-lines/SharedServiceCard.tsx`
- [ ] `src/components/features/service-lines/ServiceLineSelector.tsx`
- [ ] `src/hooks/service-lines/useServiceLines.ts`
- [ ] `src/hooks/service-lines/useServiceLineStats.ts`
- [ ] `src/lib/services/service-lines/serviceLineService.ts`
- [ ] _Remaining service line files to be inventoried during review_

---

## Notifications Domain (~12 files)

- [ ] `src/components/features/notifications/NotificationList.tsx`
- [ ] `src/components/features/notifications/NotificationCard.tsx`
- [ ] `src/hooks/notifications/useNotifications.ts`
- [ ] `src/lib/services/notifications/notificationService.ts`
- [ ] _Remaining notification files to be inventoried during review_

---

## Templates Domain (~16 files)

- [ ] `src/components/features/templates/TemplateList.tsx`
- [ ] `src/components/features/templates/TemplateEditor.tsx`
- [ ] `src/hooks/templates/useTemplates.ts`
- [ ] `src/lib/services/templates/templateService.ts`
- [ ] _Remaining template files to be inventoried during review_

---

## Remaining Domains

### Groups (~10 files)
- [ ] Components, hooks, and services for group management
- _To be inventoried during review_

### Documents (~17 files)
- [ ] Components, hooks, and services for document management
- _To be inventoried during review_

### Search (~8 files)
- [ ] Components, hooks, and services for search functionality
- _To be inventoried during review_

### Analytics (~17 files)
- [ ] Components, hooks, and services for analytics/reporting
- _To be inventoried during review_

### AI (~15 files)
- [ ] `src/lib/ai/config.ts` -- AI model configuration
- [ ] `src/lib/ai/agents/*` -- AI agent implementations
- [ ] `src/lib/ai/rag/*` -- RAG engine
- _To be inventoried during review_

### Employees (~7 files)
- [ ] Components, hooks, and services for employee management
- _To be inventoried during review_

### Reports (~13 files)
- [ ] `src/lib/services/reports/fiscalPeriodQueries.ts`
- [ ] Components, hooks, and services for reporting
- _To be inventoried during review_

### News (~7 files)
- [ ] Components, hooks, and services for news management
- _To be inventoried during review_

---

## Notes

File counts are approximate. Exact inventories will be built during the review of each domain section. Files will be added to checkboxes as they are discovered and reviewed.
