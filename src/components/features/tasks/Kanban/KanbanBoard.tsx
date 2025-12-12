'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { LayoutGrid, List, Maximize2, Minimize2 } from 'lucide-react';
import { KanbanBoardProps, KanbanTask, KanbanFilters, CardDisplayMode } from './types';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { KanbanFilters as KanbanFiltersComponent } from './KanbanFilters';
import { useKanbanBoard, useUpdateTaskStage } from '@/hooks/tasks/useKanbanBoard';
import { LoadingSpinner } from '@/components/ui';
import { TaskStage } from '@/types/task-stages';
import { TaskDetailModal } from '@/components/features/tasks/TaskDetail/TaskDetailModal';

export function KanbanBoard({
  serviceLine,
  subServiceLineGroup,
  myTasksOnly = false,
  onTaskClick,
}: KanbanBoardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState<KanbanFilters>({
    search: '',
    teamMember: null,
    priority: null,
    dueDateRange: null,
    includeArchived: false,
  });
  const [displayMode, setDisplayMode] = useState<CardDisplayMode>('detailed');
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(new Set());
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Fetch Kanban data
  const { data, isLoading, isFetching, error, refetch } = useKanbanBoard({
    serviceLine,
    subServiceLineGroup,
    myTasksOnly,
    search: filters.search,
    teamMember: filters.teamMember,
    includeArchived: filters.includeArchived, // Query will refetch when this changes
  });

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'KanbanBoard.tsx:60',message:'Loading states changed',data:{isLoading,isFetching,hasData:!!data,dataColumnsCount:data?.columns?.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,C'})}).catch(()=>{});
  }, [isLoading, isFetching, data]);
  // #endregion


  // Check for taskModal URL parameter and open modal if present
  useEffect(() => {
    const taskModalId = searchParams.get('taskModal');
    if (taskModalId) {
      setSelectedTaskId(taskModalId);
      setIsModalOpen(true);
    }
  }, [searchParams]);

  // Update task stage mutation
  const updateStageMutation = useUpdateTaskStage();

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'KanbanBoard.tsx:84',message:'Mutation state changed',data:{isPending:updateStageMutation.isPending,isSuccess:updateStageMutation.isSuccess,isError:updateStageMutation.isError},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
  }, [updateStageMutation.isPending, updateStageMutation.isSuccess, updateStageMutation.isError]);
  // #endregion

  // Check if user can drag (has EDITOR, REVIEWER role or higher on at least one task)
  const canDrag = useMemo(() => {
    if (!data?.columns) return false;
    
    return data.columns.some(column =>
      column.tasks.some(task => 
        task.userRole && ['ADMIN', 'REVIEWER', 'EDITOR'].includes(task.userRole)
      )
    );
  }, [data]);

  // Get unique team members for filter
  const teamMembers = useMemo(() => {
    if (!data?.columns) return [];
    
    const membersMap = new Map<string, { id: string; name: string }>();
    
    data.columns.forEach(column => {
      column.tasks.forEach(task => {
        task.team.forEach(member => {
          if (!membersMap.has(member.userId)) {
            membersMap.set(member.userId, {
              id: member.userId,
              name: member.name || member.email,
            });
          }
        });
      });
    });
    
    return Array.from(membersMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }, [data]);

  // Drag and drop sensors
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
    const taskId = Number(active.id);
    
    // Find the task being dragged
    const task = data?.columns
      .flatMap(col => col.tasks)
      .find(t => t.id === taskId);
    
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = Number(active.id);
    const newStage = over.id as TaskStage;
    
    // Prevent dragging to ARCHIVED column
    if (newStage === TaskStage.ARCHIVED) {
      return;
    }

    // Find the task
    const task = data?.columns
      .flatMap(col => col.tasks)
      .find(t => t.id === taskId);

    if (!task) {
      return;
    }

    // Check if stage actually changed
    if (task.stage === newStage) {
      return;
    }

    // Check if user has permission to move this task
    // ADMIN, REVIEWER, and EDITOR can all move tasks
    if (!task.userRole || !['ADMIN', 'REVIEWER', 'EDITOR'].includes(task.userRole)) {
      return;
    }

    const mutationParams = { taskId, stage: newStage };

    // Update the task stage
    // Note: Mutation hook handles invalidation automatically, no need for manual refetch
    updateStageMutation.mutate(mutationParams);
  };

  const toggleColumnCollapse = (stage: string) => {
    setCollapsedColumns(prev => {
      const next = new Set(prev);
      if (next.has(stage)) {
        next.delete(stage);
      } else {
        next.add(stage);
      }
      return next;
    });
  };

  const handleTaskClick = (taskId: number) => {
    if (onTaskClick) {
      onTaskClick(taskId);
    } else {
      // Open modal with URL parameter
      setSelectedTaskId(taskId.toString());
      setIsModalOpen(true);
      
      // Update URL with taskModal parameter (shallow routing)
      const params = new URLSearchParams(searchParams.toString());
      params.set('taskModal', taskId.toString());
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTaskId(null);
    
    // Remove taskModal parameter from URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete('taskModal');
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
    
    // Refresh kanban board data
    refetch();
  };

  if (isLoading) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'KanbanBoard.tsx:285',message:'SPINNER SHOWN - isLoading=true',data:{isLoading,isFetching,hasData:!!data},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-medium">Error loading Kanban board</p>
        <p className="text-sm mt-1">Please try again later.</p>
      </div>
    );
  }

  if (!data || data.columns.length === 0) {
    return (
      <div className="bg-forvis-gray-50 border border-forvis-gray-200 rounded-lg p-8 text-center">
        <p className="text-forvis-gray-600">No tasks found</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-forvis-gray-700">
              Display Mode:
            </span>
            <div className="inline-flex rounded-lg border border-forvis-gray-300 bg-white">
              <button
                onClick={() => setDisplayMode('compact')}
                className={`px-3 py-1.5 text-sm font-medium rounded-l-lg transition-colors ${
                  displayMode === 'compact'
                    ? 'bg-forvis-blue-600 text-white'
                    : 'text-forvis-gray-700 hover:bg-forvis-gray-50'
                }`}
              >
                <Minimize2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDisplayMode('detailed')}
                className={`px-3 py-1.5 text-sm font-medium rounded-r-lg border-l border-forvis-gray-300 transition-colors ${
                  displayMode === 'detailed'
                    ? 'bg-forvis-blue-600 text-white'
                    : 'text-forvis-gray-700 hover:bg-forvis-gray-50'
                }`}
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="text-sm text-forvis-gray-600">
            <span className="font-semibold text-forvis-gray-900">{data.totalTasks}</span> total tasks
          </div>
        </div>

        {/* Filters */}
        <KanbanFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
          teamMembers={teamMembers}
        />

        {/* Kanban Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
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
                <KanbanColumn
                  key={column.stage}
                  column={column}
                  isCollapsed={collapsedColumns.has(column.stage)}
                  onToggleCollapse={() => toggleColumnCollapse(column.stage)}
                  canDrag={canDrag && column.stage !== TaskStage.ARCHIVED}
                  displayMode={displayMode}
                  onTaskClick={handleTaskClick}
                />
              ))}
            </div>
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeTask ? (
              <div className="opacity-80">
                <KanbanCard
                  task={activeTask}
                  displayMode={displayMode}
                  canDrag={false}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Task Detail Modal */}
      {isModalOpen && selectedTaskId && (
        <TaskDetailModal
          isOpen={isModalOpen}
          taskId={selectedTaskId}
          onClose={handleCloseModal}
          serviceLine={serviceLine}
          subServiceLineGroup={subServiceLineGroup}
          onTaskUpdated={refetch}
        />
      )}
    </>
  );
}



