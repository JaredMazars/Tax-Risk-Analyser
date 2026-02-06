# Phase 5: Admin Routes Review

**Domain**: Admin Panel -- Configuration, Permissions, Templates, Document Vault
**Total Routes**: 58
**Last Updated**: February 6, 2026
**Status**: Not Started

---

## Review Standards

See [REVIEW_STANDARDS.md](./REVIEW_STANDARDS.md) -- apply **API Route Checklist**, **Security Checklist**, and **AI-Specific Checklist** for template extraction.

---

## Sign-Off Status

- [ ] **Security Review** -- Reviewer: _____ Date: _____
- [ ] **Performance Review** -- Reviewer: _____ Date: _____
- [ ] **Data Integrity Review** -- Reviewer: _____ Date: _____

---

## Progress Summary

| Subsection | Routes | Reviewed | Status |
|------------|--------|----------|--------|
| External Links | 4 | 0 | Not Started |
| Page Permissions | 7 | 0 | Not Started |
| Service Line Access | 4 | 0 | Not Started |
| Service Line Mapping | 5 | 0 | Not Started |
| Review Categories | 5 | 0 | Not Started |
| Service Line Master | 6 | 0 | Not Started |
| Sub Service Line Groups | 1 | 0 | Not Started |
| Templates | 18 | 0 | Not Started |
| Document Vault | 8 | 0 | Not Started |
| **TOTAL** | **58** | **0** | **Not Started** |

---

## External Links (4 routes)

- [ ] `GET /api/admin/external-links` -- `src/app/api/admin/external-links/route.ts`
- [ ] `POST /api/admin/external-links` -- `src/app/api/admin/external-links/route.ts`
- [ ] `PUT /api/admin/external-links/[id]` -- `src/app/api/admin/external-links/[id]/route.ts`
- [ ] `DELETE /api/admin/external-links/[id]` -- `src/app/api/admin/external-links/[id]/route.ts`

---

## Page Permissions (7 routes)

- [ ] `GET /api/admin/page-permissions` -- `src/app/api/admin/page-permissions/route.ts`
- [ ] `POST /api/admin/page-permissions` -- `src/app/api/admin/page-permissions/route.ts`
- [ ] `PUT /api/admin/page-permissions/[id]` -- `src/app/api/admin/page-permissions/[id]/route.ts`
- [ ] `DELETE /api/admin/page-permissions/[id]` -- `src/app/api/admin/page-permissions/[id]/route.ts`
- [ ] `POST /api/admin/page-permissions/bulk` -- `src/app/api/admin/page-permissions/bulk/route.ts`
- [ ] `POST /api/admin/page-permissions/discover` -- `src/app/api/admin/page-permissions/discover/route.ts`
- [ ] `GET /api/admin/page-permissions/registry` -- `src/app/api/admin/page-permissions/registry/route.ts`

---

## Service Line Access (4 routes)

- [ ] `GET /api/admin/service-line-access` -- `src/app/api/admin/service-line-access/route.ts`
- [ ] `POST /api/admin/service-line-access` -- `src/app/api/admin/service-line-access/route.ts`
- [ ] `PUT /api/admin/service-line-access/[id]` -- `src/app/api/admin/service-line-access/[id]/route.ts`
- [ ] `DELETE /api/admin/service-line-access/[id]` -- `src/app/api/admin/service-line-access/[id]/route.ts`

---

## Service Line Mapping (5 routes)

- [ ] `GET /api/admin/service-line-mapping` -- `src/app/api/admin/service-line-mapping/route.ts`
- [ ] `PUT /api/admin/service-line-mapping/[id]` -- `src/app/api/admin/service-line-mapping/[id]/route.ts`
- [ ] `POST /api/admin/service-line-mapping/bulk` -- `src/app/api/admin/service-line-mapping/bulk/route.ts`
- [ ] `GET /api/admin/service-line-mapping/stats` -- `src/app/api/admin/service-line-mapping/stats/route.ts`
- [ ] `GET /api/admin/service-line-mapping/unmapped` -- `src/app/api/admin/service-line-mapping/unmapped/route.ts`

---

## Review Categories (5 routes)

- [ ] `GET /api/admin/review-categories` -- `src/app/api/admin/review-categories/route.ts`
- [ ] `POST /api/admin/review-categories` -- `src/app/api/admin/review-categories/route.ts`
- [ ] `GET /api/admin/review-categories/[id]` -- `src/app/api/admin/review-categories/[id]/route.ts`
- [ ] `PUT /api/admin/review-categories/[id]` -- `src/app/api/admin/review-categories/[id]/route.ts`
- [ ] `DELETE /api/admin/review-categories/[id]` -- `src/app/api/admin/review-categories/[id]/route.ts`

---

## Service Line Master (6 routes)

- [ ] `GET /api/admin/service-lines` -- `src/app/api/admin/service-lines/route.ts`
- [ ] `GET /api/admin/service-lines/active` -- `src/app/api/admin/service-lines/active/route.ts`
- [ ] `POST /api/admin/service-lines` -- `src/app/api/admin/service-lines/route.ts`
- [ ] `PUT /api/admin/service-lines/[code]` -- `src/app/api/admin/service-lines/[code]/route.ts`
- [ ] `DELETE /api/admin/service-lines/[code]` -- `src/app/api/admin/service-lines/[code]/route.ts`
- [ ] `POST /api/admin/service-lines/reorder` -- `src/app/api/admin/service-lines/reorder/route.ts`

---

## Sub Service Line Groups (1 route)

- [ ] `GET /api/admin/sub-service-line-groups` -- `src/app/api/admin/sub-service-line-groups/route.ts`

---

## Templates (18 routes)

### Core Template Management (6 routes)

- [ ] `GET /api/admin/templates` -- `src/app/api/admin/templates/route.ts`
- [ ] `POST /api/admin/templates` -- `src/app/api/admin/templates/route.ts`
- [ ] `GET /api/admin/templates/[id]` -- `src/app/api/admin/templates/[id]/route.ts`
- [ ] `PUT /api/admin/templates/[id]` -- `src/app/api/admin/templates/[id]/route.ts`
- [ ] `DELETE /api/admin/templates/[id]` -- `src/app/api/admin/templates/[id]/route.ts`
- [ ] `POST /api/admin/templates/[id]/copy` -- `src/app/api/admin/templates/[id]/copy/route.ts`

### Template Sections (4 routes)

- [ ] `GET /api/admin/templates/[id]/sections` -- `src/app/api/admin/templates/[id]/sections/route.ts`
- [ ] `POST /api/admin/templates/[id]/sections` -- `src/app/api/admin/templates/[id]/sections/route.ts`
- [ ] `PUT /api/admin/templates/[id]/sections/[sectionId]` -- `src/app/api/admin/templates/[id]/sections/[sectionId]/route.ts`
- [ ] `DELETE /api/admin/templates/[id]/sections/[sectionId]` -- `src/app/api/admin/templates/[id]/sections/[sectionId]/route.ts`

### Template Versioning (7 routes)

- [ ] `POST /api/admin/templates/extract` -- `src/app/api/admin/templates/extract/route.ts` (AI endpoint)
- [ ] `GET /api/admin/templates/[id]/versions` -- `src/app/api/admin/templates/[id]/versions/route.ts`
- [ ] `POST /api/admin/templates/[id]/versions` -- `src/app/api/admin/templates/[id]/versions/route.ts`
- [ ] `GET /api/admin/templates/[id]/versions/[versionId]` -- `src/app/api/admin/templates/[id]/versions/[versionId]/route.ts`
- [ ] `PUT /api/admin/templates/[id]/versions/[versionId]` -- `src/app/api/admin/templates/[id]/versions/[versionId]/route.ts`
- [ ] `POST /api/admin/templates/migrate` -- `src/app/api/admin/templates/migrate/route.ts`

### Database Admin (1 route)

- [ ] `GET /api/admin/database/connection` -- `src/app/api/admin/database/connection/route.ts`

---

## Document Vault (8 routes)

### Document Types (4 routes)

- [ ] `GET /api/admin/document-vault/types` -- `src/app/api/admin/document-vault/types/route.ts`
- [ ] `POST /api/admin/document-vault/types` -- `src/app/api/admin/document-vault/types/route.ts`
- [ ] `PATCH /api/admin/document-vault/types/[id]` -- `src/app/api/admin/document-vault/types/[id]/route.ts`
- [ ] `DELETE /api/admin/document-vault/types/[id]` -- `src/app/api/admin/document-vault/types/[id]/route.ts`

### Document Categories (4 routes)

- [ ] `GET /api/admin/document-vault/categories` -- `src/app/api/admin/document-vault/categories/route.ts`
- [ ] `POST /api/admin/document-vault/categories` -- `src/app/api/admin/document-vault/categories/route.ts`
- [ ] `PATCH /api/admin/document-vault/categories/[id]` -- `src/app/api/admin/document-vault/categories/[id]/route.ts`
- [ ] `DELETE /api/admin/document-vault/categories/[id]` -- `src/app/api/admin/document-vault/categories/[id]/route.ts`
