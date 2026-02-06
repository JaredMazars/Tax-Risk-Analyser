# Phase 5: Service Line Routes Review

**Domain**: Service Line Management, Planner, User Access
**Total Routes**: 12
**Last Updated**: February 6, 2026
**Status**: Not Started

---

## Review Standards

See [REVIEW_STANDARDS.md](./REVIEW_STANDARDS.md) -- apply **API Route Checklist**, **Security Checklist**, and **Performance Checklist**.

---

## Sign-Off Status

- [ ] **Security Review** -- Reviewer: _____ Date: _____
- [ ] **Performance Review** -- Reviewer: _____ Date: _____
- [ ] **Data Integrity Review** -- Reviewer: _____ Date: _____

---

## Progress Summary

| Subsection | Routes | Reviewed | Status |
|------------|--------|----------|--------|
| Service Line Management | 6 | 0 | Not Started |
| Planner Routes | 5 | 0 | Not Started |
| User Accessible Groups | 1 | 0 | Not Started |
| **TOTAL** | **12** | **0** | **Not Started** |

---

## Service Line Management (6 routes)

- [ ] `GET /api/service-lines` -- `src/app/api/service-lines/route.ts`
- [ ] `GET /api/service-lines/user-role` -- `src/app/api/service-lines/user-role/route.ts`
- [ ] `GET /api/service-lines/[code]` -- `src/app/api/service-lines/[code]/route.ts`
- [ ] `GET /api/service-lines/[code]/stats` -- `src/app/api/service-lines/[code]/stats/route.ts`
- [ ] `GET /api/service-lines/[code]/analytics` -- `src/app/api/service-lines/[code]/analytics/route.ts`
- [ ] `GET /api/service-lines/[code]/workspace` -- `src/app/api/service-lines/[code]/workspace/route.ts`

---

## Planner Routes (5 routes)

- [ ] `GET /api/service-lines/[code]/planner/staff` -- `src/app/api/service-lines/[code]/planner/staff/route.ts`
- [ ] `GET /api/service-lines/[code]/planner/tasks` -- `src/app/api/service-lines/[code]/planner/tasks/route.ts`
- [ ] `GET /api/service-lines/[code]/planner/utilization` -- `src/app/api/service-lines/[code]/planner/utilization/route.ts`
- [ ] `GET /api/service-lines/[code]/planner/capacity` -- `src/app/api/service-lines/[code]/planner/capacity/route.ts`
- [ ] `GET /api/service-lines/[code]/planner/team-workload` -- `src/app/api/service-lines/[code]/planner/team-workload/route.ts`

---

## User Accessible Groups (1 route)

- [ ] `GET /api/service-lines/user-accessible-groups` -- `src/app/api/service-lines/user-accessible-groups/route.ts`
