# Code Review Index -- Master Dashboard

**Last Updated**: February 6, 2026
**Total Review Items**: ~580+ files across 7 phases

---

## Overall Progress


| Phase     | Scope                 | Items    | Reviewed | Status          | Document                                                                   |
| --------- | --------------------- | -------- | -------- | --------------- | -------------------------------------------------------------------------- |
| 1         | Foundation            | 32       | 32       | Complete        | [01_FOUNDATION_REVIEW.md](./01_FOUNDATION_REVIEW.md)                       |
| 2         | Security & Auth       | 21       | 0        | Not Started     | [02_SECURITY_REVIEW.md](./02_SECURITY_REVIEW.md)                           |
| 3         | Shared Infrastructure | 52       | 0        | Not Started     | [03_SHARED_INFRASTRUCTURE_REVIEW.md](./03_SHARED_INFRASTRUCTURE_REVIEW.md) |
| 4         | UI Components         | 44       | 0        | Not Started     | [04_UI_COMPONENTS_REVIEW.md](./04_UI_COMPONENTS_REVIEW.md)                 |
| 5         | API Routes            | 268      | 0        | Not Started     | *(11 domain files below)*                                                  |
| 6         | Domain Full-Stack     | ~343     | 0        | Not Started     | [06_DOMAIN_FULLSTACK_REVIEW.md](./06_DOMAIN_FULLSTACK_REVIEW.md)           |
| 7         | Testing & CI/CD       | 5        | 0        | Not Started     | [07_TESTING_CICD_REVIEW.md](./07_TESTING_CICD_REVIEW.md)                   |
| **TOTAL** |                       | **~765** | **32**   | **In Progress** |                                                                            |


**Review Standards**: [REVIEW_STANDARDS.md](./REVIEW_STANDARDS.md)

---

## Review Order (Strict Sequential)

Phase 1 must complete before Phase 2 begins. Within a phase, files are reviewed one at a time.

---

## Phase 1: Foundation (~32 files)

Types, config, Prisma schema, middleware. See [01_FOUNDATION_REVIEW.md](./01_FOUNDATION_REVIEW.md).

- TypeScript Types (24 files)
- Constants (3 files)
- Prisma Schema (1 file)
- Middleware (1 file)
- Config Files (3 files)

---

## Phase 2: Security & Auth (~21 files)

secureRoute, permissions, auth services, guards. See [02_SECURITY_REVIEW.md](./02_SECURITY_REVIEW.md).

- API Security (5 files)
- Permissions (5 files)
- Auth Services (6 files)
- Guards (1 file)
- Permission Hooks (4 files)

---

## Phase 3: Shared Infrastructure (~52 files)

Utils, cache, validation, DB, config, monitoring, queue. See [03_SHARED_INFRASTRUCTURE_REVIEW.md](./03_SHARED_INFRASTRUCTURE_REVIEW.md).

- Core Utils (14 files)
- Service Line Utils (4 files)
- Task Utils (5 files)
- Notification Utils (2 files)
- Other Utils (7 files)
- SQL Utils (4 files)
- Cache Layer (3 files)
- Cache Services (3 files)
- Validation (3 files)
- DB / Config / Monitoring / Queue (7 files)

---

## Phase 4: UI Components (~44 files)

Base UI, shared components, layout, providers, design system. See [04_UI_COMPONENTS_REVIEW.md](./04_UI_COMPONENTS_REVIEW.md).

- Base UI Components (14 files)
- Shared Components (22 files)
- Layout Components (2 files)
- Providers (2 files)
- Design System (1 file)
- UI Hooks (3 files)

---

## Phase 5: API Routes (~268 routes across 11 domains)

All API route handlers. Each domain has its own review file.

### Auth (6 routes)

See [05_AUTH_ROUTES.md](./05_AUTH_ROUTES.md)

- Authentication (6 routes)

### BD (29 routes)

See [05_BD_ROUTES.md](./05_BD_ROUTES.md)

- Activities (5 routes)
- Analytics (3 routes)
- Contacts (5 routes)
- Opportunities (8 routes)
- Proposals (5 routes)
- Stages (1 route)
- Company Research (2 routes)

### Client (21 routes)

See [05_CLIENT_ROUTES.md](./05_CLIENT_ROUTES.md)

- Client List & Details (5 routes)
- Client Analytics (10 routes)
- Client Financial Data (4 routes)
- Client Documents (2 routes)

### Group (7 routes)

See [05_GROUP_ROUTES.md](./05_GROUP_ROUTES.md)

- Group Management (7 routes)

### Notification (7 routes)

See [05_NOTIFICATION_ROUTES.md](./05_NOTIFICATION_ROUTES.md)

- Notifications (7 routes)

### Tool (14 routes)

See [05_TOOL_ROUTES.md](./05_TOOL_ROUTES.md)

- Tool Management (5 routes)
- Tool Assignments (2 routes)
- Tool Availability (2 routes)
- Tool Registration (2 routes)
- Task Tools (3 routes)

### User (6 routes)

See [05_USER_ROUTES.md](./05_USER_ROUTES.md)

- User Search (2 routes)
- User Preferences (4 routes)

### Admin (58 routes)

See [05_ADMIN_ROUTES.md](./05_ADMIN_ROUTES.md)

- External Links (4 routes)
- Page Permissions (7 routes)
- Service Line Access (4 routes)
- Service Line Mapping (5 routes)
- Review Categories (5 routes)
- Service Line Master (6 routes)
- Sub Service Line Groups (1 route)
- Templates (18 routes)
- Document Vault (8 routes)

### Service Line (12 routes)

See [05_SERVICE_LINE_ROUTES.md](./05_SERVICE_LINE_ROUTES.md)

- Service Line Management (6 routes)
- Planner Routes (5 routes)
- User Accessible Groups (1 route)

### Utility (18 routes)

See [05_UTILITY_ROUTES.md](./05_UTILITY_ROUTES.md)

- Employee Routes (2 routes)
- Health & Debug (3 routes)
- Document Vault (2 routes)
- Search Routes (3 routes)
- News Routes (8 routes)

### Task (90 routes)

See [05_TASK_ROUTES.md](./05_TASK_ROUTES.md)

- Task List & Details (12 routes)
- Task Stage & Status (8 routes)
- Task Financial Data (9 routes)
- Task Team & Users (17 routes)
- Task Acceptance (14 routes)
- Task Tax & Compliance (14 routes)
- Task Documents & Workspace (14 routes)
- Task Mapped Accounts (2 routes)

---

## Phase 6: Domain Full-Stack (~343 files)

Domain-specific components, hooks, and services. See [06_DOMAIN_FULLSTACK_REVIEW.md](./06_DOMAIN_FULLSTACK_REVIEW.md).

- Tasks (~75 files)
- Clients (~33 files)
- Admin (~45 files)
- BD (~29 files)
- Approvals (~21 files)
- Service Lines (~18 files)
- Notifications (~12 files)
- Templates (~16 files)
- Groups (~10 files)
- Documents (~17 files)
- Search (~8 files)
- Analytics (~17 files)
- AI (~15 files)
- Employees (~7 files)
- Reports (~13 files)
- News (~7 files)

---

## Phase 7: Testing & CI/CD (5 areas)

Testing infrastructure and deployment pipeline. See [07_TESTING_CICD_REVIEW.md](./07_TESTING_CICD_REVIEW.md).

- Testing Framework Assessment
- Unit Test Coverage Plan
- Integration Test Plan
- E2E Test Plan
- CI/CD Pipeline Assessment

---

## How to Use This Dashboard

1. **Start with Phase 1** and work sequentially
2. Open the detailed review file for the current phase
3. Review files one at a time, checking the box when complete
4. Document any issues found and fixes applied in the detailed file
5. When a phase section is fully reviewed, check the box here
6. Move to the next phase only when the current one is complete
7. Update the "Reviewed" counts in the Overall Progress table as you go

