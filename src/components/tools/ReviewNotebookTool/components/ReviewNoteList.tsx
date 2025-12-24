/**
 * Review Note List Component
 * Displays filterable list of review notes
 */

'use client';

import { useState, useEffect } from 'react';
import { Plus, Filter, User, Users } from 'lucide-react';
import { useReviewNotes } from '../hooks/useReviewNotes';
import type { ReviewNoteStatus } from '@/types/review-notes';
import { Button } from '@/components/ui';
import { LoadingSpinner } from '@/components/ui';
import { CreateReviewNoteModal } from './CreateReviewNoteModal';
import { ReviewNoteDetailModal } from './ReviewNoteDetailModal';

interface ReviewNoteListProps {
  taskId: number;
  statusFilter?: ReviewNoteStatus[];
}

export default function ReviewNoteList({ taskId, statusFilter }: ReviewNoteListProps) {
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [filterAssignedToMe, setFilterAssignedToMe] = useState(false);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(`/api/tasks/${taskId}/users/me`);
        if (response.ok) {
          const result = await response.json();
          setCurrentUserId(result.data?.userId || '');
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    if (taskId) {
      fetchCurrentUser();
    }
  }, [taskId]);

  const { data, isLoading, error } = useReviewNotes({
    taskId,
    status: statusFilter,
    assignedTo: filterAssignedToMe ? currentUserId : undefined,
    page,
    limit: 20,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-6">
        Failed to load review notes. Please try again.
      </div>
    );
  }

  const notes = data?.notes || [];

  return (
    <div className="space-y-4">
      {/* Header with Filter and Add Button */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h4 className="text-sm font-medium text-forvis-gray-700">
            {notes.length} Note{notes.length !== 1 ? 's' : ''}
          </h4>
          
          {/* Filter Toggle */}
          <div className="flex items-center border border-forvis-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => setFilterAssignedToMe(false)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center space-x-1 ${
                !filterAssignedToMe
                  ? 'bg-forvis-blue-600 text-white'
                  : 'bg-white text-forvis-gray-700 hover:bg-forvis-gray-50'
              }`}
            >
              <Users className="h-3 w-3" />
              <span>All Items</span>
            </button>
            <button
              onClick={() => setFilterAssignedToMe(true)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center space-x-1 border-l border-forvis-gray-300 ${
                filterAssignedToMe
                  ? 'bg-forvis-blue-600 text-white'
                  : 'bg-white text-forvis-gray-700 hover:bg-forvis-gray-50'
              }`}
            >
              <User className="h-3 w-3" />
              <span>My Items</span>
            </button>
          </div>
        </div>
        
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Review Note</span>
        </Button>
      </div>

      {/* Note List */}
      {notes.length === 0 ? (
        <div className="text-center p-12 bg-forvis-gray-50 rounded-lg">
          <p className="text-forvis-gray-600">No review notes found.</p>
          <p className="text-sm text-forvis-gray-500 mt-2">
            Click "Add Review Note" to create your first review note.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => {
            const getPriorityColor = (priority: string) => {
              switch (priority) {
                case 'CRITICAL':
                  return 'bg-red-100 text-red-800 border-red-200';
                case 'HIGH':
                  return 'bg-orange-100 text-orange-800 border-orange-200';
                case 'MEDIUM':
                  return 'bg-blue-100 text-blue-800 border-blue-200';
                case 'LOW':
                  return 'bg-gray-100 text-gray-800 border-gray-200';
                default:
                  return 'bg-gray-100 text-gray-800 border-gray-200';
              }
            };

            const getStatusColor = (status: string) => {
              switch (status) {
                case 'OPEN':
                  return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                case 'IN_PROGRESS':
                  return 'bg-blue-100 text-blue-800 border-blue-200';
                case 'ADDRESSED':
                  return 'bg-purple-100 text-purple-800 border-purple-200';
                case 'CLEARED':
                  return 'bg-green-100 text-green-800 border-green-200';
                case 'REJECTED':
                  return 'bg-red-100 text-red-800 border-red-200';
                default:
                  return 'bg-gray-100 text-gray-800 border-gray-200';
              }
            };

            return (
              <div
                key={note.id}
                className="bg-white border border-forvis-gray-200 rounded-lg p-4 hover:shadow-md hover:border-forvis-blue-300 transition-all cursor-pointer"
                onClick={() => setSelectedNoteId(note.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-medium text-forvis-gray-900 flex-1">{note.title}</h5>
                      <div className="flex items-center space-x-2 ml-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getPriorityColor(note.priority)}`}>
                          {note.priority}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getStatusColor(note.status)}`}>
                          {note.status}
                        </span>
                      </div>
                    </div>
                    
                    {note.description && (
                      <p className="text-sm text-forvis-gray-600 mt-1 line-clamp-2">
                        {note.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 mt-3 text-xs text-forvis-gray-500">
                      {/* Sitting With Indicator */}
                      {note.User_ReviewNote_currentOwnerToUser ? (
                        <span className="flex items-center space-x-1 font-medium text-forvis-blue-700">
                          <User className="w-3 h-3" />
                          <span>Sitting with: {note.User_ReviewNote_currentOwnerToUser.name || note.User_ReviewNote_currentOwnerToUser.email}</span>
                        </span>
                      ) : note._count && note._count.ReviewNoteAssignee > 0 && (
                        <span className="flex items-center space-x-1 font-medium text-forvis-blue-700">
                          <Users className="w-3 h-3" />
                          <span>Sitting with: All Assignees ({note._count.ReviewNoteAssignee})</span>
                        </span>
                      )}
                      {note.User_ReviewNote_assignedToToUser && (
                        <span className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>Assigned: {note.User_ReviewNote_assignedToToUser.name || note.User_ReviewNote_assignedToToUser.email}</span>
                        </span>
                      )}
                      {note.dueDate && (
                        <span>Due: {new Date(note.dueDate).toLocaleDateString()}</span>
                      )}
                      {note._count && (
                        <div className="flex items-center space-x-3">
                          {note._count.ReviewNoteComment > 0 && (
                            <span className="flex items-center space-x-1">
                              <Filter className="w-3 h-3" />
                              <span>{note._count.ReviewNoteComment}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-4">
          <Button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            variant="secondary"
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-sm text-forvis-gray-700">
            Page {page} of {data.pagination.totalPages}
          </span>
          <Button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= data.pagination.totalPages}
            variant="secondary"
          >
            Next
          </Button>
        </div>
      )}

      {/* Create Review Note Modal */}
      <CreateReviewNoteModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        taskId={taskId}
      />

      {/* Review Note Detail Modal */}
      {selectedNoteId && (
        <ReviewNoteDetailModal
          isOpen={!!selectedNoteId}
          onClose={() => setSelectedNoteId(null)}
          taskId={taskId}
          noteId={selectedNoteId}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}

