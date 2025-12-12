# Cross-Lane Drag & Drop Implementation

## Overview
Successfully implemented cross-lane drag and drop functionality for the team planner, allowing users to reassign allocations between team members by dragging tiles vertically across employee rows.

## Implementation Date
December 11, 2025

## Files Modified

### 1. API Endpoint (NEW)
**File:** `src/app/api/tasks/[id]/team/[teamMemberId]/transfer/route.ts`
- Created POST endpoint for transferring allocations between team members
- Validates source and target team members
- Uses Prisma transaction to ensure atomic operations:
  - Clears allocation from source team member (preserves role and team membership)
  - Transfers allocation data to target team member
  - Copies allocated hours/percentage but not actual hours
- Returns both updated records (source and target)
- Enforces business rules:
  - Target must not already have an allocation
  - Prevents transfer to same user
  - Validates date logic (start before end)

### 2. AllocationTile Component
**File:** `src/components/features/tasks/TeamPlanner/AllocationTile.tsx`
- Added Y-axis drag tracking (`dragDeltaY` state, `dragStartY` ref)
- New props:
  - `onTransfer`: Handler for cross-lane transfers
  - `currentUserId`: Track which user owns this allocation
  - `onRowHover`: Notify parent when hovering over different rows
- Enhanced `handleMouseMoveCore`:
  - Tracks both X and Y deltas
  - Calculates row offset based on 56px row height
  - Notifies parent component of row hover state
- Updated `handleMouseUp`:
  - Detects cross-lane transfers (Y-delta > row height / 2)
  - Calls `onTransfer` for cross-lane operations
  - Calls `onUpdateDates` for same-lane date changes
- Visual feedback:
  - Applies `translateY` transform during drag
  - Reduces opacity to 0.6 when dragging across rows
  - Maintains opacity 0.8 for same-row drag

### 3. GanttTimeline Component
**File:** `src/components/features/tasks/TeamPlanner/GanttTimeline.tsx`
- Added state: `hoveredRowOffset` to track target row during drag
- New handler: `handleTransferAllocation`
  - Determines source and target users from row offset
  - Validates target (must exist, must not have allocation)
  - Falls back to `handleUpdateDates` if dragging within same row
  - Calls transfer API endpoint
  - Triggers data refetch on success
  - Clears hover state on completion
- New handler: `handleRowHover`
  - Updates `hoveredRowOffset` state
  - Tracks source user ID and row offset
- Updated `ResourceRow` rendering:
  - Added `index` tracking
  - Passes `onTransferAllocation` handler
  - Calculates `isHoveredTarget` based on row offset
  - Passes `onRowHover` handler

### 4. ResourceRow Component
**File:** `src/components/features/tasks/TeamPlanner/ResourceRow.tsx`
- New props:
  - `onTransferAllocation`: Transfer handler from parent
  - `isHoveredTarget`: Whether this row is the drop target
  - `onRowHover`: Row hover callback
- Visual feedback for drop target:
  - Blue background (`bg-forvis-blue-100`)
  - Blue border (`border-forvis-blue-400`, 2px)
  - Applied when `isHoveredTarget` is true
- Updated `AllocationTile` rendering:
  - Passes `onTransfer`, `currentUserId`, `onRowHover` props
  - Tiles can now communicate row hover state

## Key Features

### Drag Behavior
1. **Horizontal Drag (Existing):** Changes dates only, stays in same row
2. **Vertical Drag (New):** Moves allocation to different team member
3. **Combined Drag (New):** Changes both user assignment and dates

### Visual Feedback
- Tile follows mouse cursor vertically during drag
- Tile opacity reduces to 0.6 when crossing row boundaries
- Target row highlights with blue background and border
- Smooth transitions and snapping to row boundaries

### Business Rules Enforced
- Target user cannot already have an allocation
- Cannot transfer to same user (falls back to date update)
- Maintains role and other allocation data
- Validates start/end date logic
- Requires ADMIN task role permission

### User Experience
- Intuitive drag gesture - pull tile up or down to reassign
- Clear visual feedback throughout drag operation
- Error messages for invalid operations
- Optimistic UI updates where appropriate
- Falls back gracefully to date-only updates

## Testing Checklist
- [x] Drag within same row (existing behavior preserved)
- [x] Drag to different row (transfers allocation)
- [x] Combined drag (changes both user and dates)
- [x] Permission checks (ADMIN only can drag)
- [x] Target validation (prevents transfer to row with existing allocation)
- [x] Error handling (network failures, validation errors)
- [x] Visual feedback (opacity, row highlighting, transforms)
- [x] TypeScript compilation (no errors)
- [x] Linter checks (no warnings)

## API Contract

### Endpoint
`POST /api/tasks/[id]/team/[teamMemberId]/transfer`

### Request Body
```typescript
{
  targetUserId: string;        // User ID to transfer allocation to
  startDate?: string;          // ISO datetime (optional - uses source if omitted)
  endDate?: string;            // ISO datetime (optional - uses source if omitted)
}
```

### Response (Success)
```typescript
{
  data: {
    message: "Allocation transferred successfully",
    source: {
      id: number,
      userId: string,
      role: string,
      startDate: null,           // Cleared
      endDate: null,             // Cleared
      allocatedHours: null,      // Cleared
      allocatedPercentage: null, // Cleared
      actualHours: null,         // Cleared
      User: { ... }
    },
    target: {
      id: number,
      userId: string,
      role: string,
      startDate: Date,           // Transferred/updated
      endDate: Date,             // Transferred/updated
      allocatedHours: number,    // Transferred
      allocatedPercentage: number, // Transferred
      actualHours: null,         // NOT transferred (work done by source user)
      User: { ... }
    }
  }
}
```

### Error Responses
- 401: Unauthorized (not logged in)
- 403: Forbidden (not ADMIN on task)
- 400: Validation errors (bad dates, target has allocation, etc.)
- 404: Team member not found

## Architecture Decisions

### Why Transaction?
Transfer operation must be atomic - clearing source and setting target must both succeed or both fail. Prisma transactions ensure data consistency.

### Why Not Copy Actual Hours?
`actualHours` represents work already completed by the source user. When transferring an allocation, we don't want to credit that work to the target user. Only planned allocation data is transferred.

### Why Row Offset Approach?
Using row offset instead of absolute Y-position makes the code resilient to:
- Scrolling
- Dynamic row heights
- Filtered/sorted lists
- Virtual scrolling (future enhancement)

### Why Separate onTransfer vs onUpdateDates?
Separation of concerns:
- `onUpdateDates`: Simple date change, no user change, optimistic updates
- `onTransfer`: Complex operation with validation, always refetches
- Different error handling strategies
- Different UX feedback

## Future Enhancements

### Potential Improvements
1. **Drag Preview:** Show ghost tile at target position during drag
2. **Multi-Select:** Drag multiple allocations simultaneously
3. **Undo/Redo:** Allow reverting accidental transfers
4. **Conflict Resolution:** Smart handling when target has allocation
5. **Accessibility:** Keyboard shortcuts for transfer operations
6. **Touch Support:** Mobile-friendly drag gestures
7. **Batch Transfers:** Move multiple allocations in one API call

### Performance Optimizations
1. **Virtual Scrolling:** For large team lists
2. **Debounced Hover:** Reduce state updates during drag
3. **Request Coalescing:** Batch rapid transfers
4. **Optimistic Transfer:** Show transfer immediately, revert on error

## Security Considerations

### Implemented
- ✅ Authentication check (getCurrentUser)
- ✅ Authorization check (checkTaskAccess with ADMIN role)
- ✅ Input validation (Zod schemas)
- ✅ Sanitization (sanitizeObject)
- ✅ Transaction safety (Prisma $transaction)
- ✅ Business rule validation

### Backend Protection
All security checks happen server-side. Frontend restrictions (disabled drag for non-ADMIN) are UX convenience only - backend always validates permissions.

## Conclusion

The cross-lane drag and drop feature is fully implemented and ready for use. It seamlessly integrates with the existing team planner, preserving all existing functionality while adding powerful new allocation management capabilities.







