'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, Users, Calendar, Folder } from 'lucide-react';
import { KanbanCardProps } from './types';
import { formatDate } from '@/lib/utils/taskUtils';

export function KanbanCard({ task, displayMode, canDrag, onClick }: KanbanCardProps) {
  const isArchived = task.stage === 'ARCHIVED';
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id.toString(),
    disabled: !canDrag || isArchived, // Disable drag for archived tasks
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging && onClick) {
      onClick();
    }
  };

  const hoursPercentage = task.allocatedHours > 0
    ? Math.min((task.actualHours / task.allocatedHours) * 100, 100)
    : 0;

  const isOverBudget = task.actualHours > task.allocatedHours;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={`bg-white rounded-lg shadow-corporate p-3 transition-all duration-200 ${
        isArchived ? 'border border-forvis-gray-400 opacity-70' : 'border border-forvis-gray-200'
      } ${
        canDrag && !isArchived ? 'cursor-move hover:shadow-corporate-md' : 'cursor-pointer hover:shadow-corporate-md'
      } ${isDragging ? 'z-50' : ''}`}
    >
      {/* Header with Task Code and Client */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 bg-forvis-blue-100">
            <Folder className="h-4 w-4 text-forvis-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-forvis-blue-600 truncate">
              {task.code}
            </div>
            {task.client && (
              <div className="text-xs text-forvis-gray-600 truncate">
                {task.client.name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Name */}
      <h4 className="text-sm font-medium text-forvis-gray-900 mb-2 line-clamp-2">
        {task.name}
      </h4>

      {displayMode === 'detailed' && (
        <>
          {/* Partner & Manager */}
          <div className="space-y-1 mb-3">
            {task.partner && (
              <div className="flex items-center gap-1 text-xs text-forvis-gray-600">
                <span className="font-medium">Partner:</span>
                <span className="truncate">{task.partner}</span>
              </div>
            )}
            {task.manager && (
              <div className="flex items-center gap-1 text-xs text-forvis-gray-600">
                <span className="font-medium">Manager:</span>
                <span className="truncate">{task.manager}</span>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="flex items-center gap-3 mb-3 text-xs text-forvis-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(task.dateOpen)}</span>
            </div>
            {task.dateTerminate && (
              <>
                <span>→</span>
                <span>{formatDate(task.dateTerminate)}</span>
              </>
            )}
          </div>
        </>
      )}

      {/* Team Members */}
      {task.team.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-3 w-3 text-forvis-gray-500 flex-shrink-0" />
          <div className="flex items-center -space-x-2">
            {task.team.slice(0, displayMode === 'compact' ? 3 : 5).map((member, idx) => (
              <div
                key={member.userId}
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-white"
                style={{
                  background: 'linear-gradient(135deg, #5B93D7 0%, #2E5AAC 100%)',
                  zIndex: task.team.length - idx,
                }}
                title={member.name || member.email}
              >
                {(member.name || member.email).charAt(0).toUpperCase()}
              </div>
            ))}
            {task.team.length > (displayMode === 'compact' ? 3 : 5) && (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium bg-forvis-gray-300 text-forvis-gray-700 border-2 border-white"
                title={`+${task.team.length - (displayMode === 'compact' ? 3 : 5)} more`}
              >
                +{task.team.length - (displayMode === 'compact' ? 3 : 5)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hours Progress */}
      {(task.allocatedHours > 0 || task.actualHours > 0) && (
        <div className="mt-3 pt-3 border-t border-forvis-gray-200">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1 text-xs text-forvis-gray-600">
              <Clock className="h-3 w-3" />
              <span>Hours</span>
            </div>
            <span className={`text-xs font-medium ${isOverBudget ? 'text-red-600' : 'text-forvis-gray-900'}`}>
              {task.actualHours.toFixed(1)} / {task.allocatedHours.toFixed(1)}h
            </span>
          </div>
          <div className="w-full bg-forvis-gray-200 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isOverBudget ? 'bg-red-500' : 'bg-forvis-blue-600'
              }`}
              style={{ width: `${hoursPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* User Role Badge (if user is on team) */}
      {task.userRole && displayMode === 'detailed' && (
        <div className="mt-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-forvis-blue-100 text-forvis-blue-700">
            {task.userRole}
          </span>
        </div>
      )}
    </div>
  );
}



