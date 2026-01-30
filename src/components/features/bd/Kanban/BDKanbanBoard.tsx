/**
 * BD Kanban Board Component
 * 
 * EXACT PATTERN from tasks KanbanBoard (lines 30-415).
 * Implements synchronous cache updates, optimistic UI, drag-and-drop with validation.
 */

'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { BDKanbanColumn } from './BDKanbanColumn';
import { BDKanbanCard } from './BDKanbanCard';
import { LoadingSpinner } from '@/components/ui';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import type { BDKanbanColumn as ColumnType, BDOpportunityWithRelations, BDDisplayMode, BDKanbanData } from './types';
import { useUpdateOpportunityStage, useDeleteBDOpportunity, bdKanbanKeys } from '@/hooks/bd/useBDKanban';

interface BDKanbanBoardProps {
  data: BDKanbanData | undefined;
  isLoading: boolean;
  error: Error | null;
  displayMode: BDDisplayMode;
  onOpportunityClick: (opportunityId: number) => void;
  collapsedColumns: Set<string>;
  onToggleCollapse: (columnId: string) => void;
}

export function BDKanbanBoard({
  data,
  isLoading,
  error,
  displayMode,
  onOpportunityClick,
  collapsedColumns,
  onToggleCollapse,
}: BDKanbanBoardProps) {
  const queryClient = useQueryClient();
  const [activeOpportunity, setActiveOpportunity] = useState<BDOpportunityWithRelations | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [opportunityToDelete, setOpportunityToDelete] = useState<number | null>(null);
  const updateStageMutation = useUpdateOpportunityStage();
  const deleteOpportunityMutation = useDeleteBDOpportunity();

  // Sensors (exact same as tasks - 8px distance, keyboard support)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before activating drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const opportunityId = Number(active.id);
    
    // Find the opportunity being dragged
    const opportunity = data?.columns
      .flatMap(col => col.opportunities)
      .find(opp => opp.id === opportunityId);
    
    if (opportunity) {
      setActiveOpportunity(opportunity);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Validation 1: Ensure valid drop target
    if (!over) {
      setActiveOpportunity(null);
      return;
    }

    const opportunityId = Number(active.id);
    
    // Validation 2: Resolve drop target (column or card)
    let targetColumnId: string;
    let newStageId: number;
    
    // Check if dropped on a column droppable
    const targetColumn = data?.columns.find(col => col.id === over.id);
    if (targetColumn) {
      // Case A: Dropped on column
      targetColumnId = targetColumn.id;
      newStageId = targetColumn.stageId;
    } else {
      // Case B: Dropped on another opportunity card
      const targetOpportunity = data?.columns
        .flatMap(col => col.opportunities)
        .find(opp => opp.id === Number(over.id));
      
      if (!targetOpportunity) {
        setActiveOpportunity(null);
        return;
      }
      
      const targetCol = data?.columns.find(col => 
        col.opportunities.some(opp => opp.id === targetOpportunity.id)
      );
      
      if (!targetCol) {
        setActiveOpportunity(null);
        return;
      }
      
      targetColumnId = targetCol.id;
      newStageId = targetCol.stageId;
    }
    
    // Validation 3: Prevent drops on drafts column
    if (targetColumnId === 'drafts') {
      setActiveOpportunity(null);
      return;
    }

    // Validation 4: Verify opportunity exists
    const opportunity = data?.columns
      .flatMap(col => col.opportunities)
      .find(opp => opp.id === opportunityId);

    if (!opportunity) {
      setActiveOpportunity(null);
      return;
    }

    // Validation 5: Skip if stage hasn't changed
    if (opportunity.stageId === newStageId) {
      setActiveOpportunity(null);
      return;
    }

    // Validation 6: Can't drag DRAFT opportunities to stages
    if (opportunity.status === 'DRAFT') {
      setActiveOpportunity(null);
      return;
    }

    const mutationParams = { opportunityId, stageId: newStageId };

    // SYNCHRONOUSLY update cache BEFORE mutation (EXACT PATTERN FROM TASKS)
    // This ensures immediate UI update without visual jump
    queryClient.setQueriesData<BDKanbanData>(
      { queryKey: bdKanbanKeys.boards() },
      (old) => {
        if (!old) return old;
        
        // Move opportunity to new column
        const updatedColumns = old.columns.map(column => {
          const filteredOpps = column.opportunities.filter(opp => opp.id !== opportunityId);
          
          // Add to target column
          if (column.stageId === newStageId) {
            const oppToMove = old.columns
              .flatMap(col => col.opportunities)
              .find(opp => opp.id === opportunityId);
            
            if (oppToMove) {
              const newOpps = [{ ...oppToMove, stageId: newStageId }, ...filteredOpps];
              return {
                ...column,
                opportunities: newOpps,
                count: newOpps.length,
                totalValue: newOpps.reduce((sum, opp) => sum + (opp.value || 0), 0),
              };
            }
          }
          
          // Remove from source column
          if (filteredOpps.length !== column.opportunities.length) {
            return {
              ...column,
              opportunities: filteredOpps,
              count: filteredOpps.length,
              totalValue: filteredOpps.reduce((sum, opp) => sum + (opp.value || 0), 0),
            };
          }
          
          return column;
        });
        
        return { ...old, columns: updatedColumns };
      }
    );

    // Trigger mutation for server sync (optimistic update already done)
    updateStageMutation.mutate(mutationParams);
    
    // Clear overlay immediately
    setActiveOpportunity(null);
  };

  const handleDeleteDraft = (opportunityId: number) => {
    setOpportunityToDelete(opportunityId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (opportunityToDelete) {
      try {
        await deleteOpportunityMutation.mutateAsync(opportunityToDelete);
        setShowDeleteModal(false);
        setOpportunityToDelete(null);
      } catch (error) {
        console.error('Failed to delete draft', error);
        // Modal stays open on error so user can retry
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-forvis-error-50 border border-forvis-error-200 rounded-lg p-4 text-forvis-error-700">
        <p className="font-medium">Error loading Kanban board</p>
        <p className="text-sm mt-1">Please try again later.</p>
      </div>
    );
  }

  if (!data || data.columns.length === 0) {
    return (
      <div className="bg-forvis-gray-50 border border-forvis-gray-200 rounded-lg p-8 text-center">
        <p className="text-forvis-gray-600">No opportunities found</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div 
        className="pb-4" 
        style={{ 
          maxHeight: 'calc(100vh - 300px)',
          overflow: 'hidden'
        }}
      >
        <div className="flex gap-3 h-full w-full">
          {data.columns.map(column => (
            <BDKanbanColumn
              key={column.id}
              column={{ ...column, isCollapsed: collapsedColumns.has(column.id) }}
              displayMode={displayMode}
              onOpportunityClick={onOpportunityClick}
              onToggleCollapse={() => onToggleCollapse(column.id)}
              onDelete={handleDeleteDraft}
            />
          ))}
        </div>
      </div>

      {/* Drag Overlay (exact same as tasks) */}
      <DragOverlay>
        {activeOpportunity ? (
          <div className="opacity-80">
            <BDKanbanCard
              opportunity={activeOpportunity}
              displayMode={displayMode}
              isDragging
              onClick={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Draft Opportunity"
        message="Are you sure you want to delete this draft opportunity? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </DndContext>
  );
}
