/**
 * BD Kanban Column Component
 * 
 * Pattern based on tasks KanbanColumn with exact droppable behavior.
 */

'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { GRADIENTS } from '@/lib/design-system/gradients';
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

  // Stage-specific gradients using centralized design system
  const getHeaderGradient = () => {
    if (column.isDraft) {
      // Use DARK warning gradient for proper white text contrast (matches button gradient depth)
      return GRADIENTS.semantic.warning.button;
    }
    if (column.color) {
      // For database-driven stage colors, use 90-100% opacity for darker, saturated headers
      return `linear-gradient(135deg, ${column.color}E6 0%, ${column.color}FF 100%)`;
    }
    // Default: Use data blue gradient (matches Task Kanban IN_PROGRESS)
    return GRADIENTS.data.blue;
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {/* Column Header */}
      <div
        className="rounded-t-lg p-4 shadow-corporate-md mb-2 cursor-pointer transition-all duration-200 hover:shadow-lg"
        style={{ background: getHeaderGradient() }}
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {column.isCollapsed ? (
              <ChevronRight className="h-5 w-5 text-white flex-shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 text-white flex-shrink-0" />
            )}
            <h3 className="text-lg font-semibold text-white truncate">
              {column.name}
            </h3>
          </div>
        </div>

        {!column.isCollapsed && (
          <BDKanbanMetrics
            count={column.count}
            value={column.totalValue}
          />
        )}
      </div>

      {/* Column Content */}
      {!column.isCollapsed && (
        <div
          ref={setNodeRef}
          className={`flex-1 bg-forvis-gray-50 rounded-b-lg p-2 min-h-[200px] max-h-[calc(100vh-350px)] overflow-y-auto transition-colors shadow-sm ${
            isOver ? 'bg-forvis-blue-100' : ''
          }`}
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="space-y-2 pb-2">
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
        </div>
      )}

      {/* Collapsed State - just show count */}
      {column.isCollapsed && (
        <div className="bg-forvis-gray-50 rounded-b-lg p-2">
          <div className="text-center text-sm text-forvis-gray-600">
            {column.count} {column.count === 1 ? 'opportunity' : 'opportunities'}
          </div>
        </div>
      )}
    </div>
  );
}
