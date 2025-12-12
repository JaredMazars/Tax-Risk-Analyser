# Multiple Task Allocations - Testing Guide

## Overview

This document outlines the testing procedures for the multiple task allocations feature, which allows users to have multiple non-overlapping allocation periods on the same task with consistent roles.

## Test Environment Setup

### Prerequisites

1. Run the database migration:
```bash
cd /Users/walter.blake/Documents/development/mapper
npx prisma migrate dev --name allow_multiple_task_allocations
```

2. Ensure the application is running:
```bash
npm run dev
```

3. Have at least one task and multiple users in the system for testing

## Test Scenarios

### Scenario 1: Basic Multiple Allocations

**Objective:** Verify a user can have multiple non-overlapping allocations on the same task

**Steps:**
1. Navigate to a task's Team Planner page
2. Add a new team member with allocation dates (e.g., Jan 1 - Jan 31, 2025)
3. Add the same user again with different dates (e.g., Mar 1 - Mar 31, 2025)
4. Verify both allocations appear in the timeline
5. Verify the user appears once in the team list with multiple periods

**Expected Results:**
- ✅ Both allocations are created successfully
- ✅ No unique constraint violation error
- ✅ Timeline shows two separate bars for the user
- ✅ Both periods have the same role

### Scenario 2: Overlapping Prevention

**Objective:** Verify overlapping allocations are prevented

**Steps:**
1. Add a user with dates Jan 1 - Jan 31, 2025
2. Try to add the same user with overlapping dates (e.g., Jan 15 - Feb 15, 2025)
3. Verify error message appears

**Expected Results:**
- ✅ Second allocation is rejected with clear error message
- ✅ Error message indicates overlap with existing allocation
- ✅ Error metadata shows the conflicting dates
- ❌ No allocation is created

### Scenario 3: Adjacent Allocations (No Gap)

**Objective:** Verify allocations can be adjacent without overlapping

**Steps:**
1. Add a user with dates Jan 1 - Jan 31, 2025
2. Add the same user with dates Feb 1 - Feb 28, 2025
3. Verify both allocations are created

**Expected Results:**
- ✅ Both allocations are created successfully
- ✅ Timeline shows two adjacent bars with no gap
- ✅ No overlap error

### Scenario 4: Allocations with Gaps

**Objective:** Verify allocations can have gaps between them

**Steps:**
1. Add a user with dates Jan 1 - Jan 31, 2025
2. Add the same user with dates Apr 1 - Apr 30, 2025 (2-month gap)
3. Verify both allocations are created

**Expected Results:**
- ✅ Both allocations are created successfully
- ✅ Timeline shows visual gap between bars
- ✅ Gap is clearly visible in the timeline

### Scenario 5: Role Consistency

**Objective:** Verify all allocations for a user must have the same role

**Steps:**
1. Add a user with role "EDITOR" and dates Jan 1 - Jan 31, 2025
2. Try to add the same user with role "VIEWER" and dates Mar 1 - Mar 31, 2025
3. Verify error message appears

**Expected Results:**
- ✅ Second allocation is rejected with role consistency error
- ✅ Error message indicates role mismatch
- ✅ Error shows existing role vs. requested role
- ❌ No allocation is created

### Scenario 6: Ongoing Allocations

**Objective:** Verify allocations without dates (ongoing) are supported

**Steps:**
1. Add a user without specifying dates (ongoing assignment)
2. Try to add the same user with specific dates
3. Verify error about overlap with ongoing allocation

**Expected Results:**
- ✅ First allocation is created with null dates
- ✅ Second allocation is rejected (overlaps with ongoing)
- ✅ Error message indicates conflict with ongoing allocation

### Scenario 7: Role Update Affects All Allocations

**Objective:** Verify updating a user's role updates all their allocations

**Steps:**
1. Add a user with two allocation periods (both with role "EDITOR")
2. Update the user's role to "REVIEWER"
3. Verify both allocations now show "REVIEWER" role

**Expected Results:**
- ✅ Role update succeeds
- ✅ Both allocations show the new role
- ✅ Timeline updates to show new role color for both bars

### Scenario 8: Delete User Removes All Allocations

**Objective:** Verify removing a user removes all their allocations

**Steps:**
1. Add a user with three allocation periods
2. Delete the user from the task
3. Verify all three allocations are removed

**Expected Results:**
- ✅ User deletion succeeds
- ✅ All three allocations are removed from database
- ✅ Timeline no longer shows any bars for the user
- ✅ User no longer appears in team list

### Scenario 9: Existing Single Allocations Still Work

**Objective:** Verify backward compatibility with existing single allocations

**Steps:**
1. Query existing tasks with team members
2. Verify they still load correctly
3. Verify adding new allocation periods to existing users works

**Expected Results:**
- ✅ Existing allocations load without errors
- ✅ Users with single allocations display correctly
- ✅ Can add additional periods to users with existing single allocation

### Scenario 10: API Endpoint Tests

**Objective:** Verify all API endpoints work correctly

**Test A: POST /api/tasks/[id]/users**
```bash
curl -X POST http://localhost:3000/api/tasks/1/users \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "role": "EDITOR",
    "startDate": "2025-01-01",
    "endDate": "2025-01-31",
    "allocatedHours": 80,
    "allocatedPercentage": 50
  }'
```

Expected: 200 OK, allocation created

**Test B: POST /api/tasks/[id]/users/[userId]/allocations**
```bash
curl -X POST http://localhost:3000/api/tasks/1/users/user123/allocations \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "role": "EDITOR",
    "startDate": "2025-03-01",
    "endDate": "2025-03-31",
    "allocatedHours": 80,
    "allocatedPercentage": 50
  }'
```

Expected: 201 Created, second allocation created

**Test C: PUT /api/tasks/[id]/team/[teamMemberId]/allocation**
```bash
curl -X PUT http://localhost:3000/api/tasks/1/team/5/allocation \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2025-01-01",
    "endDate": "2025-02-28",
    "allocatedHours": 160
  }'
```

Expected: 200 OK, allocation dates extended

**Test D: GET /api/tasks/[id]/users/[userId]**
```bash
curl http://localhost:3000/api/tasks/1/users/user123
```

Expected: 200 OK, returns all allocations for the user

**Test E: DELETE /api/tasks/[id]/users/[userId]**
```bash
curl -X DELETE http://localhost:3000/api/tasks/1/users/user123
```

Expected: 200 OK, all allocations deleted

### Scenario 11: Edge Cases

**Test A: Same Start and End Date (1-day allocation)**
- Add allocation with startDate = endDate = "2025-01-15"
- Expected: ✅ Creates successfully, shows as 1-day bar

**Test B: End Date Before Start Date**
- Try to add allocation with endDate before startDate
- Expected: ❌ Validation error "End date must be after start date"

**Test C: Only Start Date Provided**
- Try to add allocation with only startDate
- Expected: ❌ Validation error "Both dates required or both empty"

**Test D: Large Number of Allocations**
- Add 10+ allocation periods for one user
- Expected: ✅ All allocations created, timeline renders correctly

**Test E: Update Allocation to Create Overlap**
- User has allocations Jan 1-31 and Mar 1-31
- Try to update Jan allocation to extend to Mar 15
- Expected: ❌ Overlap error with Mar allocation

## Database Verification

After each test scenario, verify database state:

```sql
-- Check all allocations for a user on a task
SELECT id, userId, taskId, role, startDate, endDate, allocatedHours, createdAt
FROM TaskTeam
WHERE taskId = 1 AND userId = 'user123'
ORDER BY startDate, createdAt;

-- Verify no duplicate user-task pairs with same dates
SELECT userId, taskId, startDate, endDate, COUNT(*)
FROM TaskTeam
WHERE taskId = 1
GROUP BY userId, taskId, startDate, endDate
HAVING COUNT(*) > 1;
```

## Performance Tests

1. **Load Time:** Task with 50 users, each with 5 allocations (250 records)
   - Expected: Page loads in < 2 seconds

2. **Query Performance:** Get all allocations for a task
   - Expected: Query completes in < 100ms

3. **Timeline Rendering:** Display 250 allocation bars
   - Expected: Renders in < 1 second, smooth scrolling

## Rollback Testing

If issues are found, verify rollback procedure:

```sql
-- See migration README for rollback steps
-- Test on a copy of the database first
```

## Sign-off Checklist

- [ ] All 11 scenarios tested and passed
- [ ] No console errors in browser
- [ ] No API errors in server logs
- [ ] Database constraints working correctly
- [ ] Existing data unaffected
- [ ] Timeline UI renders correctly
- [ ] Form validations work
- [ ] Error messages are clear and helpful
- [ ] Performance is acceptable
- [ ] Documentation is updated

## Known Limitations

1. Maximum recommended allocations per user per task: 20
2. Dates are inclusive (start and end dates both included in allocation)
3. Overlap validation happens at API level (not database constraint)
4. Role changes affect ALL allocations for a user
5. Deleting a user removes ALL their allocations

## Support

For issues or questions:
- Check server logs: `/logs/error.log`
- Check browser console for client-side errors
- Review migration README: `prisma/migrations/20251212_allow_multiple_task_allocations/README.md`


