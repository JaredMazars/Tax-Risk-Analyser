/**
 * BD Kanban Card Component
 * 
 * Pattern based on tasks KanbanCard with React.memo optimization.
 * Uses useSortable for drag-and-drop functionality.
 */

'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Users, Calendar, DollarSign, Building, Trash2 } from 'lucide-react';
import type { BDOpportunityWithRelations, BDDisplayMode } from './types';
import { formatAmount } from '@/lib/utils/formatters';
import { formatDistanceToNow } from 'date-fns';

interface BDKanbanCardProps {
  opportunity: BDOpportunityWithRelations;
  displayMode: BDDisplayMode;
  isDragging?: boolean;
  onClick: () => void;
  onDelete?: (id: number) => void;
}

// Memoized to prevent re-renders when sibling cards change
export const BDKanbanCard = React.memo(function BDKanbanCard({ 
  opportunity, 
  displayMode, 
  isDragging: externalIsDragging,
  onClick,
  onDelete
}: BDKanbanCardProps) {
  const isDraft = opportunity.status === 'DRAFT';
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: sortableIsDragging,
  } = useSortable({
    id: opportunity.id.toString(),
    disabled: isDraft, // Can't drag DRAFT opportunities
  });

  const isDragging = externalIsDragging || sortableIsDragging;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging && onClick) {
      onClick();
    }
  };

  // Calculate expected revenue (weighted value based on probability)
  const expectedRevenue = opportunity.value !== null && opportunity.probability !== null
    ? (opportunity.value * opportunity.probability) / 100
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={`bg-white rounded-lg shadow-corporate transition-shadow duration-200 relative group ${
        displayMode === 'compact' ? 'p-1.5' : 'p-3'
      } ${
        isDraft ? 'border-2 border-dashed border-forvis-warning-300' : 'border border-forvis-gray-200'
      } ${
        !isDraft ? 'cursor-move hover:shadow-corporate-md' : 'cursor-pointer hover:shadow-corporate-md'
      } ${isDragging ? 'z-50' : ''}`}
    >
      {/* Delete button for draft cards */}
      {isDraft && onDelete && displayMode === 'detailed' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(opportunity.id);
          }}
          className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-forvis-error-100 text-forvis-error-600 hover:text-forvis-error-700 transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100 focus:opacity-100"
          title="Delete draft opportunity"
          aria-label="Delete draft"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
      {/* Header with Company Name and Value */}
      <div className={`flex items-start justify-between ${displayMode === 'compact' ? 'mb-0.5' : 'mb-2'}`}>
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <div className={`rounded flex items-center justify-center flex-shrink-0 ${
            isDraft ? 'bg-forvis-warning-100' : 'bg-forvis-blue-100'
          } ${displayMode === 'compact' ? 'w-5 h-5' : 'w-8 h-8'}`}>
            <Building className={`${
              isDraft ? 'text-forvis-warning-600' : 'text-forvis-blue-600'
            } ${displayMode === 'compact' ? 'h-2.5 w-2.5' : 'h-4 w-4'}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className={`font-semibold truncate ${
              isDraft ? 'text-forvis-warning-700' : 'text-forvis-blue-600'
            } ${displayMode === 'compact' ? 'text-[9px]' : 'text-xs'}`}>
              {opportunity.companyName || opportunity.title}
            </div>
            {/* Hide service line if it's BUSINESS_DEV (redundant in BD context) */}
            {(opportunity.serviceLineDesc || opportunity.serviceLine) && 
             opportunity.serviceLine !== 'BUSINESS_DEV' && (
              <div className={`text-forvis-gray-600 truncate ${
                displayMode === 'compact' ? 'text-[9px]' : 'text-xs'
              }`}>
                {opportunity.serviceLineDesc || opportunity.serviceLine}
              </div>
            )}
          </div>
        </div>
        
        {/* Value in top right */}
        {opportunity.value !== null && (
          <div className={`text-forvis-gray-900 font-semibold flex-shrink-0 ${
            displayMode === 'compact' ? 'text-[9px]' : 'text-xs'
          }`}>
            {formatAmount(opportunity.value)}
          </div>
        )}
      </div>

      {/* Financial Metrics Section (Detailed Mode Only, Not for Drafts) */}
      {!isDraft && displayMode === 'detailed' && (opportunity.value !== null || opportunity.probability !== null) && (
        <div className="bg-forvis-success-50 rounded-lg p-2 mb-2">
          <div className="grid grid-cols-3 gap-2 text-xs">
            {opportunity.value !== null && (
              <div>
                <div className="text-forvis-gray-600 text-[10px]">Value</div>
                <div className="font-semibold text-forvis-gray-900 tabular-nums">{formatAmount(opportunity.value)}</div>
              </div>
            )}
            {opportunity.probability !== null && (
              <div>
                <div className="text-forvis-gray-600 text-[10px]">Probability</div>
                <div className="font-semibold text-forvis-gray-900 tabular-nums">{opportunity.probability}%</div>
              </div>
            )}
            {expectedRevenue !== null && (
              <div>
                <div className="text-forvis-gray-600 text-[10px]">Expected</div>
                <div className="font-semibold text-forvis-success-600 tabular-nums">{formatAmount(expectedRevenue)}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expected Revenue Badge (Compact Mode) */}
      {!isDraft && displayMode === 'compact' && expectedRevenue !== null && (
        <div className="mb-0.5">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-forvis-success-50 text-forvis-success-700 border border-forvis-success-200">
            <DollarSign className="h-2 w-2 mr-0.5" />
            {formatAmount(expectedRevenue)}
          </span>
        </div>
      )}

      {/* Description */}
      {opportunity.description && (
        <p className={`text-forvis-gray-700 ${
          displayMode === 'compact' ? 'text-[10px] mb-0.5 line-clamp-1' : 'text-sm mb-2 line-clamp-2'
        }`}>
          {opportunity.description}
        </p>
      )}

      {/* Draft Badge */}
      {isDraft && (
        <div className={displayMode === 'compact' ? 'mb-0.5' : 'mb-2'}>
          <span 
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-forvis-warning-100 text-forvis-warning-800 border border-forvis-warning-200"
            title="Click to resume wizard and complete this opportunity"
          >
            Incomplete
          </span>
        </div>
      )}

      {/* Assignment Type & Dates */}
      {!isDraft && displayMode === 'detailed' && (opportunity.assignmentType || opportunity.startDate) && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {/* Assignment Type Badge */}
          {opportunity.assignmentType && (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
              opportunity.assignmentType === 'ONCE_OFF' 
                ? 'bg-forvis-blue-100 text-forvis-blue-700 border border-forvis-blue-200' 
                : 'bg-green-100 text-green-700 border border-green-200'
            }`}>
              {opportunity.assignmentType === 'ONCE_OFF' ? 'Once-Off' : 'Recurring'}
            </span>
          )}
          
          {/* Recurring Frequency Badge */}
          {opportunity.assignmentType === 'RECURRING' && opportunity.recurringFrequency && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-600 border border-green-200">
              {opportunity.recurringFrequency === 'MONTHLY' && 'Monthly'}
              {opportunity.recurringFrequency === 'QUARTERLY' && 'Quarterly'}
              {opportunity.recurringFrequency === 'BI_ANNUALLY' && 'Bi-Annually'}
              {opportunity.recurringFrequency === 'YEARLY' && 'Yearly'}
            </span>
          )}
          
          {/* Date Range */}
          {opportunity.startDate && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-forvis-gray-100 text-forvis-gray-700 border border-forvis-gray-200">
              <Calendar className="h-2.5 w-2.5 mr-1" />
              {new Date(opportunity.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              {opportunity.endDate && (
                <>
                  {' - '}
                  {new Date(opportunity.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </>
              )}
            </span>
          )}
        </div>
      )}

      {/* BD Owner & Expected Close Date (Detailed Mode) */}
      {displayMode === 'detailed' && !isDraft && (opportunity.assignedToEmployee || opportunity.expectedCloseDate) && (
        <div className="space-y-1 mb-2">
          {/* BD Owner */}
          {opportunity.assignedToEmployee && (
            <div className="flex items-center gap-1 text-xs text-forvis-gray-600">
              <Users className="h-3 w-3" />
              <span className="font-medium">BD Owner:</span>
              <span>{opportunity.assignedToEmployee.EmpName || opportunity.assignedToEmployee.EmpCode}</span>
            </div>
          )}
          
          {/* Expected Close Date */}
          {opportunity.expectedCloseDate && (
            <div className="flex items-center gap-1 text-xs text-forvis-gray-600">
              <Calendar className="h-3 w-3" />
              <span className="font-medium">Expected Close:</span>
              <span>{formatDistanceToNow(new Date(opportunity.expectedCloseDate), { addSuffix: true })}</span>
            </div>
          )}
        </div>
      )}

      {/* Compact Mode: Expected Close Date & Probability */}
      {displayMode === 'compact' && (
        <div className="flex items-center justify-between text-[8px] text-forvis-gray-500">
          {opportunity.expectedCloseDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-2.5 w-2.5" />
              <span>{formatDistanceToNow(new Date(opportunity.expectedCloseDate), { addSuffix: true })}</span>
            </div>
          )}
          {opportunity.probability !== null && (
            <div className="flex items-center gap-1">
              <span>{opportunity.probability}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if these props actually changed
  return (
    prevProps.opportunity.id === nextProps.opportunity.id &&
    prevProps.opportunity.updatedAt === nextProps.opportunity.updatedAt &&
    prevProps.displayMode === nextProps.displayMode &&
    prevProps.isDragging === nextProps.isDragging
  );
});
