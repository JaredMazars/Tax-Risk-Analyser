/**
 * BD Kanban Column Component
 * 
 * Pattern based on tasks KanbanColumn with exact droppable behavior.
 */

'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { BDKanbanCard } from './BDKanbanCard';
import { BDKanbanMetrics } from './BDKanbanMetrics';
import type { BDKanbanColumn as ColumnType, BDDisplayMode } from './types';

interface BDKanbanColumnProps {
  column: ColumnType;
  displayMode: BDDisplayMode;
  onOpportunityClick: (id: number) => void;
  onToggleCollapse: () => void;
  onDelete?: (id: number) => void;
}

export function BDKanbanColumn({
  column,
  displayMode,
  onOpportunityClick,
  onToggleCollapse,
  onDelete,
}: BDKanbanColumnProps) {
  // useDroppable with column.id (exact same as tasks)
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    disabled: column.isDraft, // Can't drop into drafts column
  });

  // Get opportunity IDs for sortable context
  const opportunityIds = column.opportunities.map(opp => opp.id.toString());

  // Stage-specific gradients (same pattern as tasks)
  const getHeaderGradient = () => {
    if (column.isDraft) {
      // Warning gradient for drafts (same as tasks archived)
      return 'linear-gradient(135deg, #F8F3E8 0%, #EFE3C8 100%)';
    }
    if (column.color) {
      // Use database color with subtle gradient overlay
      return `linear-gradient(135deg, ${column.color}15 0%, ${column.color}25 100%)`;
    }
    // Default blue gradient (same as tasks ENGAGE)
    return 'linear-gradient(135deg, #F0F7FD 0%, #E0EDFB 100%)';
  };

  return (
    <div className="flex-shrink-0 w-80">
      {/* Column Header */}
      <div
        className="rounded-t-lg p-3 border-b border-forvis-gray-200"
        style={{ background: getHeaderGradient() }}
      >
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-2">
            {column.isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-forvis-gray-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-forvis-gray-600" />
            )}
            <h3 className="text-sm font-semibold text-forvis-gray-900">
              {column.name}
            </h3>
          </div>
          <BDKanbanMetrics
            count={column.count}
            value={column.totalValue}
          />
        </button>
      </div>

      {/* Column Content */}
      {!column.isCollapsed && (
        <div
          ref={setNodeRef}
          className={`bg-forvis-gray-50 rounded-b-lg p-2 min-h-[200px] space-y-2 transition-colors ${
            isOver ? 'bg-forvis-blue-100' : ''
          }`}
        >
          {column.opportunities.length === 0 ? (
            <div className="text-center py-8 text-sm text-forvis-gray-500">
              {column.isDraft ? 'No incomplete opportunities' : 'No opportunities'}
            </div>
          ) : (
            <SortableContext items={opportunityIds} strategy={verticalListSortingStrategy}>
              {column.opportunities.map(opportunity => (
                <BDKanbanCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  displayMode={displayMode}
                  onClick={() => onOpportunityClick(opportunity.id)}
                  onDelete={onDelete}
                />
              ))}
            </SortableContext>
          )}
        </div>
      )}
    </div>
  );
}
