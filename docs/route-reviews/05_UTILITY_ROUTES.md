# Phase 5: Utility Routes Review

**Domain**: Utility Services -- Search, Health, Employees, News, Document Vault
**Total Routes**: 18
**Last Updated**: February 6, 2026
**Status**: Not Started

---

## Review Standards

See [REVIEW_STANDARDS.md](./REVIEW_STANDARDS.md) -- apply **API Route Checklist** and **Performance Checklist**.

---

## Sign-Off Status

- [ ] **Security Review** -- Reviewer: _____ Date: _____
- [ ] **Performance Review** -- Reviewer: _____ Date: _____
- [ ] **Data Integrity Review** -- Reviewer: _____ Date: _____

---

## Progress Summary

| Subsection | Routes | Reviewed | Status |
|------------|--------|----------|--------|
| Employee Routes | 2 | 0 | Not Started |
| Health & Debug | 3 | 0 | Not Started |
| Document Vault | 2 | 0 | Not Started |
| Search Routes | 3 | 0 | Not Started |
| News Routes | 8 | 0 | Not Started |
| **TOTAL** | **18** | **0** | **Not Started** |

---

## Employee Routes (2 routes)

- [ ] `GET /api/employees` -- `src/app/api/employees/route.ts`
- [ ] `GET /api/employees/[empCode]` -- `src/app/api/employees/[empCode]/route.ts`

---

## Health & Debug (3 routes)

- [ ] `GET /api/health` -- `src/app/api/health/route.ts`
- [ ] `GET /api/health/redis` -- `src/app/api/health/redis/route.ts`
- [ ] `GET /api/admin/database/cache` -- `src/app/api/admin/database/cache/route.ts`

---

## Document Vault (2 routes)

- [ ] `POST /api/document-vault/extract` -- `src/app/api/document-vault/extract/route.ts` (AI endpoint)
- [ ] `GET /api/document-vault/templates` -- `src/app/api/document-vault/templates/route.ts`

---

## Search Routes (3 routes)

- [ ] `GET /api/search` -- `src/app/api/search/route.ts`
- [ ] `GET /api/search/global` -- `src/app/api/search/global/route.ts`
- [ ] `GET /api/search/suggestions` -- `src/app/api/search/suggestions/route.ts`

---

## News Routes (8 routes)

- [ ] `GET /api/news` -- `src/app/api/news/route.ts`
- [ ] `POST /api/news` -- `src/app/api/news/route.ts`
- [ ] `GET /api/news/[id]` -- `src/app/api/news/[id]/route.ts`
- [ ] `PUT /api/news/[id]` -- `src/app/api/news/[id]/route.ts`
- [ ] `DELETE /api/news/[id]` -- `src/app/api/news/[id]/route.ts`
- [ ] `GET /api/news/categories` -- `src/app/api/news/categories/route.ts`
- [ ] `POST /api/news/[id]/pin` -- `src/app/api/news/[id]/pin/route.ts`
- [ ] `POST /api/news/[id]/unpin` -- `src/app/api/news/[id]/unpin/route.ts`
