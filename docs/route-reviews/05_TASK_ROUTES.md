# Phase 5: Task Routes Review

**Domain**: Task Management -- Core Operations, Documents, Team, Acceptance, Tax & Compliance
**Total Routes**: 90
**Last Updated**: February 6, 2026
**Status**: Not Started

---

## Review Standards

See [REVIEW_STANDARDS.md](./REVIEW_STANDARDS.md) -- apply **API Route Checklist**, **Security Checklist**, **Performance Checklist**, **Data Integrity Checklist**, and **AI-Specific Checklist** for AI tax report / engagement letter generation.

---

## Sign-Off Status

- [ ] **Security Review** -- Reviewer: _____ Date: _____
- [ ] **Performance Review** -- Reviewer: _____ Date: _____
- [ ] **Data Integrity Review** -- Reviewer: _____ Date: _____

---

## Progress Summary

| Subsection | Routes | Reviewed | Status |
|------------|--------|----------|--------|
| Task List & Details | 12 | 0 | Not Started |
| Task Stage & Status | 8 | 0 | Not Started |
| Task Financial Data | 9 | 0 | Not Started |
| Task Team & Users | 17 | 0 | Not Started |
| Task Acceptance | 14 | 0 | Not Started |
| Task Tax & Compliance | 14 | 0 | Not Started |
| Task Documents & Workspace | 14 | 0 | Not Started |
| Task Mapped Accounts | 2 | 0 | Not Started |
| **TOTAL** | **90** | **0** | **Not Started** |

---

## Task List & Details (12 routes)

- [ ] `GET /api/tasks` -- List tasks with pagination
- [ ] `POST /api/tasks` -- Create new task
- [ ] `GET /api/tasks/[id]` -- Get task details
- [ ] `PUT /api/tasks/[id]` -- Update task
- [ ] `DELETE /api/tasks/[id]` -- Delete task (soft delete)
- [ ] `GET /api/tasks/[id]/history` -- Task change history
- [ ] `GET /api/tasks/filters` -- Task filter options
- [ ] `GET /api/tasks/[id]/review-notes` -- Task review notes
- [ ] `POST /api/tasks/[id]/review-notes` -- Create review note
- [ ] `PUT /api/tasks/[id]/review-notes/[noteId]` -- Update review note
- [ ] `DELETE /api/tasks/[id]/review-notes/[noteId]` -- Delete review note
- [ ] `GET /api/tasks/[id]/audit-log` -- Task audit log

---

## Task Stage & Status (8 routes)

- [ ] `PUT /api/tasks/[id]/stage` -- Update task stage
- [ ] `PUT /api/tasks/[id]/status` -- Update task status
- [ ] `GET /api/tasks/[id]/stage-history` -- Stage transition history
- [ ] `POST /api/tasks/[id]/archive` -- Archive task
- [ ] `POST /api/tasks/[id]/restore` -- Restore archived task
- [ ] `PUT /api/tasks/[id]/priority` -- Update task priority
- [ ] `PUT /api/tasks/[id]/timeline` -- Update task timeline/dates
- [ ] `PUT /api/tasks/[id]/continuance` -- Task continuance

---

## Task Financial Data (9 routes)

- [ ] `GET /api/tasks/[id]/wip` -- Work in progress data
- [ ] `GET /api/tasks/[id]/fees` -- Fee information
- [ ] `GET /api/tasks/[id]/billing` -- Billing details
- [ ] `GET /api/tasks/[id]/budgets` -- Budget information
- [ ] `PUT /api/tasks/[id]/budgets` -- Update budget
- [ ] `GET /api/tasks/[id]/debtors` -- Debtor information
- [ ] `GET /api/tasks/[id]/wip-aging` -- WIP aging data
- [ ] `GET /api/tasks/[id]/financial-summary` -- Financial summary
- [ ] `GET /api/tasks/[id]/transactions` -- Transaction list

---

## Task Team & Users (17 routes)

- [ ] `GET /api/tasks/[id]/team` -- List team members
- [ ] `POST /api/tasks/[id]/team` -- Add team member
- [ ] `PUT /api/tasks/[id]/team/[memberId]` -- Update team member role/allocation
- [ ] `DELETE /api/tasks/[id]/team/[memberId]` -- Remove team member
- [ ] `GET /api/tasks/[id]/allocations` -- View allocations
- [ ] `PUT /api/tasks/[id]/allocations` -- Update allocations
- [ ] `GET /api/tasks/[id]/team/available` -- Available team members
- [ ] `POST /api/tasks/[id]/team/bulk` -- Bulk add team members
- [ ] `GET /api/tasks/[id]/responsible-person` -- Get responsible person
- [ ] `PUT /api/tasks/[id]/responsible-person` -- Set responsible person
- [ ] `GET /api/tasks/[id]/partner` -- Get partner
- [ ] `PUT /api/tasks/[id]/partner` -- Set partner
- [ ] `GET /api/tasks/[id]/manager` -- Get manager
- [ ] `PUT /api/tasks/[id]/manager` -- Set manager
- [ ] `GET /api/tasks/[id]/supervisor` -- Get supervisor
- [ ] `PUT /api/tasks/[id]/supervisor` -- Set supervisor
- [ ] `GET /api/tasks/[id]/signatories` -- Get signatories

---

## Task Acceptance (14 routes)

- [ ] `GET /api/tasks/[id]/acceptance/status` -- Acceptance status
- [ ] `POST /api/tasks/[id]/acceptance/initialize` -- Start acceptance process
- [ ] `GET /api/tasks/[id]/acceptance/questions` -- Get questionnaire
- [ ] `POST /api/tasks/[id]/acceptance/answers` -- Submit answers
- [ ] `POST /api/tasks/[id]/acceptance/research` -- Initiate research
- [ ] `GET /api/tasks/[id]/acceptance/research` -- Get research results
- [ ] `POST /api/tasks/[id]/acceptance/submit` -- Submit for approval
- [ ] `POST /api/tasks/[id]/acceptance/approve` -- Approve acceptance
- [ ] `POST /api/tasks/[id]/acceptance/reject` -- Reject acceptance
- [ ] `GET /api/tasks/[id]/acceptance/employees` -- Acceptance employee list
- [ ] `GET /api/tasks/[id]/acceptance/team` -- Acceptance team
- [ ] `POST /api/tasks/[id]/acceptance/documents` -- Upload acceptance docs
- [ ] `GET /api/tasks/[id]/acceptance/documents` -- List acceptance docs
- [ ] `DELETE /api/tasks/[id]/acceptance/documents/[docId]` -- Delete acceptance doc

---

## Task Tax & Compliance (14 routes)

- [ ] `GET /api/tasks/[id]/research-notes` -- List research notes
- [ ] `POST /api/tasks/[id]/research-notes` -- Create research note
- [ ] `PUT /api/tasks/[id]/research-notes/[noteId]` -- Update research note
- [ ] `DELETE /api/tasks/[id]/research-notes/[noteId]` -- Delete research note
- [ ] `GET /api/tasks/[id]/ai-tax-report` -- Get AI-generated tax report
- [ ] `POST /api/tasks/[id]/ai-tax-report` -- Generate AI tax report (AI endpoint)
- [ ] `GET /api/tasks/[id]/legal-precedents` -- Get legal precedents
- [ ] `POST /api/tasks/[id]/legal-precedents` -- Add legal precedent
- [ ] `GET /api/tasks/[id]/sars-responses` -- Get SARS responses
- [ ] `POST /api/tasks/[id]/sars-responses` -- Add SARS response
- [ ] `GET /api/tasks/[id]/filing-status` -- Get filing status
- [ ] `PUT /api/tasks/[id]/filing-status` -- Update filing status
- [ ] `GET /api/tasks/[id]/notification-preferences` -- Task notification settings
- [ ] `PUT /api/tasks/[id]/notification-preferences` -- Update task notification settings

---

## Task Documents & Workspace (14 routes)

- [ ] `GET /api/tasks/[id]/workspace/files` -- List workspace files
- [ ] `POST /api/tasks/[id]/workspace/files` -- Upload file
- [ ] `GET /api/tasks/[id]/workspace/files/[fileId]` -- Get file details
- [ ] `DELETE /api/tasks/[id]/workspace/files/[fileId]` -- Delete file
- [ ] `GET /api/tasks/[id]/workspace/files/[fileId]/download` -- Download file
- [ ] `GET /api/tasks/[id]/documents` -- List all task documents
- [ ] `GET /api/tasks/[id]/engagement-letter` -- Get engagement letter
- [ ] `POST /api/tasks/[id]/engagement-letter` -- Create engagement letter
- [ ] `POST /api/tasks/[id]/engagement-letter/generate` -- AI generate letter (AI endpoint)
- [ ] `GET /api/tasks/[id]/engagement-letter/download` -- Download letter PDF
- [ ] `GET /api/tasks/[id]/dpa` -- Get DPA
- [ ] `POST /api/tasks/[id]/dpa` -- Create/update DPA
- [ ] `GET /api/tasks/[id]/dpa/download` -- Download DPA PDF
- [ ] `GET /api/tasks/[id]/dpa/status` -- DPA status

---

## Task Mapped Accounts (2 routes)

- [ ] `GET /api/tasks/[id]/mapped-accounts` -- Get mapped accounts
- [ ] `PUT /api/tasks/[id]/mapped-accounts` -- Update account mappings
