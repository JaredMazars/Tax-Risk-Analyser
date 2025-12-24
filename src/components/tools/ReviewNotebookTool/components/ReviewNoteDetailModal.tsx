/**
 * Review Note Detail Modal Component
 * Displays full review note information with actions
 */

'use client';

import { useState } from 'react';
import { X, ExternalLink, Loader2, MessageSquare, CheckCircle, XCircle, AlertCircle, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui';
import { AttachmentManager } from './AttachmentManager';
import { AttachmentLightbox } from './AttachmentLightbox';
import { useReviewNote } from '../hooks/useReviewNotes';
import { useChangeReviewNoteStatus } from '../hooks/useReviewNoteActions';
import { useReviewNoteComments, useAddReviewNoteComment } from '../hooks/useReviewNoteComments';
import { useReviewNoteAttachments } from '../hooks/useReviewNoteAttachments';
import { ReviewNoteStatus, ReviewNotePriority, ReviewNoteCommentWithUser } from '@/types/review-notes';
import { useQueryClient } from '@tanstack/react-query';

interface ReviewNoteDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: number;
  noteId: number;
  currentUserId?: string;
}

export function ReviewNoteDetailModal({
  isOpen,
  onClose,
  taskId,
  noteId,
  currentUserId,
}: ReviewNoteDetailModalProps) {
  const [newComment, setNewComment] = useState('');
  const [commentAttachments, setCommentAttachments] = useState<File[]>([]);
  const [isUploadingAttachments, setIsUploadingAttachments] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showConfirmReject, setShowConfirmReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const { data: note, isLoading } = useReviewNote({
    taskId,
    noteId,
    includeComments: true,
    includeAttachments: false,
  });

  const { data: comments = [] } = useReviewNoteComments(taskId, noteId);
  const { data: attachments = [] } = useReviewNoteAttachments(taskId, noteId);
  const addCommentMutation = useAddReviewNoteComment(taskId, noteId);
  const changeStatusMutation = useChangeReviewNoteStatus(taskId, noteId);
  const queryClient = useQueryClient();

  if (!isOpen) return null;

  // #region agent log
  if (attachments.length > 0) {
    fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReviewNoteDetailModal.tsx:rendering',message:'Attachments array',data:{totalAttachments:attachments.length,attachments:attachments.map(a=>({id:a.id,fileName:a.fileName,commentId:a.commentId}))},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4,H5'})}).catch(()=>{});
  }
  // #endregion
  
  // Filter note-level attachments (not associated with any comment)
  const noteLevelAttachments = attachments.filter(att => !att.commentId);
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReviewNoteDetailModal.tsx:filterNoteLevel',message:'Note-level attachments filtered',data:{noteLevelCount:noteLevelAttachments.length,noteLevelAttachments:noteLevelAttachments.map(a=>({id:a.id,fileName:a.fileName,commentId:a.commentId}))},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
  // #endregion
  
  // Function to get attachments for a specific comment
  const getCommentAttachments = (commentId: number) => {
    const filtered = attachments.filter(att => att.commentId === commentId);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReviewNoteDetailModal.tsx:getCommentAttachments',message:'Filtering for comment',data:{commentId:commentId,foundCount:filtered.length,filtered:filtered.map(a=>({id:a.id,fileName:a.fileName,commentId:a.commentId}))},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
    // #endregion
    return filtered;
  };

  // Render attachment thumbnail
  const renderAttachmentThumbnail = (attachment: any, index: number, allAttachments: any[]) => (
    <div
      key={attachment.id}
      className="border border-forvis-gray-200 rounded-lg p-2 bg-white hover:shadow-sm transition-shadow cursor-pointer"
      onClick={() => {
        const globalIndex = attachments.findIndex(a => a.id === attachment.id);
        setLightboxIndex(globalIndex);
        setLightboxOpen(true);
      }}
    >
      <div className="mb-1">
        {attachment.fileType.startsWith('image/') ? (
          <div className="w-full h-16 bg-forvis-gray-100 rounded overflow-hidden">
            <img
              src={`/api/tasks/${taskId}/review-notes/${noteId}/attachments/${attachment.id}`}
              alt={attachment.fileName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg></div>';
                }
              }}
            />
          </div>
        ) : (
          <div className="w-full h-16 bg-forvis-gray-100 rounded flex items-center justify-center">
            <Paperclip className="w-6 h-6 text-forvis-gray-400" />
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-forvis-gray-900 truncate" title={attachment.fileName}>
        {attachment.fileName}
      </p>
      <p className="text-xs text-forvis-gray-500">
        {(attachment.fileSize / 1024).toFixed(1)} KB
      </p>
    </div>
  );

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReviewNoteDetailModal.tsx:handleAddComment:entry',message:'Starting comment creation',data:{hasAttachments:commentAttachments.length>0,attachmentCount:commentAttachments.length,newComment:newComment.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      
      // Add the comment first
      const result = await addCommentMutation.mutateAsync({
        comment: newComment,
      });
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReviewNoteDetailModal.tsx:handleAddComment:afterCreate',message:'Comment created',data:{result:result,resultId:result?.id,hasResultId:!!result?.id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      
      // Upload attachments if any
      if (commentAttachments.length > 0 && result.id) {
        setIsUploadingAttachments(true);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReviewNoteDetailModal.tsx:handleAddComment:beforeUpload',message:'Starting attachment upload',data:{commentId:result.id,attachmentCount:commentAttachments.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
        // #endregion
        
        for (let i = 0; i < commentAttachments.length; i++) {
          const file = commentAttachments[i];
          setUploadProgress(`Uploading ${i + 1} of ${commentAttachments.length}...`);
          
          const formData = new FormData();
          formData.append('file', file);
          formData.append('commentId', result.id.toString());
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReviewNoteDetailModal.tsx:handleAddComment:beforeFetch',message:'Sending attachment to API',data:{fileName:file.name,fileSize:file.size,commentId:result.id.toString(),url:`/api/tasks/${taskId}/review-notes/${noteId}/attachments`},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
          // #endregion
          
          const response = await fetch(
            `/api/tasks/${taskId}/review-notes/${noteId}/attachments`,
            {
              method: 'POST',
              body: formData,
            }
          );

          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReviewNoteDetailModal.tsx:handleAddComment:afterFetch',message:'Attachment upload response',data:{ok:response.ok,status:response.status,statusText:response.statusText},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
          // #endregion

          if (!response.ok) {
            const error = await response.json();
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReviewNoteDetailModal.tsx:handleAddComment:uploadError',message:'Attachment upload failed',data:{error:error},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
            // #endregion
            throw new Error(error.error || 'Failed to upload attachment');
          }
          
          const uploadResult = await response.json();
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReviewNoteDetailModal.tsx:handleAddComment:uploadSuccess',message:'Attachment uploaded successfully',data:{uploadResult:uploadResult},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3,H4',runId:'post-fix'})}).catch(()=>{});
          // #endregion
        }
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReviewNoteDetailModal.tsx:handleAddComment:beforeInvalidate',message:'Invalidating attachments cache',data:{taskId:taskId,noteId:noteId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4',runId:'post-fix'})}).catch(()=>{});
        // #endregion
        
        // Invalidate attachments query to refresh the list
        await queryClient.invalidateQueries({ queryKey: ['review-note-attachments', taskId, noteId] });
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReviewNoteDetailModal.tsx:handleAddComment:afterInvalidate',message:'Cache invalidated',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4',runId:'post-fix'})}).catch(()=>{});
        // #endregion
        
        setIsUploadingAttachments(false);
        setUploadProgress('');
      }
      
      setNewComment('');
      setCommentAttachments([]);
    } catch (error) {
      console.error('Failed to add comment:', error);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ReviewNoteDetailModal.tsx:handleAddComment:error',message:'Comment/upload error',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2,H3'})}).catch(()=>{});
      // #endregion
      setIsUploadingAttachments(false);
      setUploadProgress('');
    }
  };

  const handleStatusChange = async (status: ReviewNoteStatus, reason?: string) => {
    try {
      await changeStatusMutation.mutateAsync({
        status,
        reason,
      });
      
      if (status === 'CLEARED') setShowConfirmClear(false);
      if (status === 'REJECTED') setShowConfirmReject(false);
    } catch (error) {
      console.error('Failed to change status:', error);
    }
  };

  const getPriorityColor = (priority: ReviewNotePriority) => {
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

  const getStatusColor = (status: ReviewNoteStatus) => {
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

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="max-w-4xl w-full p-6 bg-white rounded-lg shadow-corporate-lg">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-forvis-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="max-w-4xl w-full p-6 bg-white rounded-lg shadow-corporate-lg">
          <p className="text-center text-red-600">Failed to load review note</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="max-w-4xl w-full p-6 bg-white rounded-lg shadow-corporate-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-forvis-gray-200">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-forvis-gray-900">{note.title}</h2>
            <div className="flex items-center space-x-2 mt-2">
              <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(note.priority as ReviewNotePriority)}`}>
                {note.priority}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(note.status as ReviewNoteStatus)}`}>
                {note.status}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-forvis-gray-600 hover:text-forvis-gray-900 rounded-lg hover:bg-forvis-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-6">
          {/* Description */}
          {note.description && (
            <div>
              <h3 className="text-sm font-medium text-forvis-gray-700 mb-2">Description</h3>
              <p className="text-sm text-forvis-gray-600 whitespace-pre-wrap">{note.description}</p>
            </div>
          )}

          {/* Reference URL */}
          {note.referenceUrl && (
            <div>
              <h3 className="text-sm font-medium text-forvis-gray-700 mb-2">Reference</h3>
              <a
                href={note.referenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-sm text-forvis-blue-600 hover:text-forvis-blue-800"
              >
                <span>{note.referenceUrl}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-medium text-forvis-gray-500 uppercase mb-1">Raised By</h3>
              <p className="text-sm text-forvis-gray-900">
                {note.User_ReviewNote_raisedByToUser?.name || note.User_ReviewNote_raisedByToUser?.email || 'Unknown'}
              </p>
            </div>
            
            {note.User_ReviewNote_assignedToToUser && (
              <div>
                <h3 className="text-xs font-medium text-forvis-gray-500 uppercase mb-1">Assigned To</h3>
                <p className="text-sm text-forvis-gray-900">
                  {note.User_ReviewNote_assignedToToUser.name || note.User_ReviewNote_assignedToToUser.email}
                </p>
              </div>
            )}

            {note.dueDate && (
              <div>
                <h3 className="text-xs font-medium text-forvis-gray-500 uppercase mb-1">Due Date</h3>
                <p className="text-sm text-forvis-gray-900">
                  {new Date(note.dueDate).toLocaleDateString()}
                </p>
              </div>
            )}

            <div>
              <h3 className="text-xs font-medium text-forvis-gray-500 uppercase mb-1">Created</h3>
              <p className="text-sm text-forvis-gray-900">
                {new Date(note.createdAt).toLocaleString()}
              </p>
            </div>

            {note.addressedAt && note.User_ReviewNote_addressedByToUser && (
              <>
                <div>
                  <h3 className="text-xs font-medium text-forvis-gray-500 uppercase mb-1">Addressed By</h3>
                  <p className="text-sm text-forvis-gray-900">
                    {note.User_ReviewNote_addressedByToUser.name || note.User_ReviewNote_addressedByToUser.email}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-forvis-gray-500 uppercase mb-1">Addressed At</h3>
                  <p className="text-sm text-forvis-gray-900">
                    {new Date(note.addressedAt).toLocaleString()}
                  </p>
                </div>
              </>
            )}

            {note.clearedAt && note.User_ReviewNote_clearedByToUser && (
              <>
                <div>
                  <h3 className="text-xs font-medium text-forvis-gray-500 uppercase mb-1">Cleared By</h3>
                  <p className="text-sm text-forvis-gray-900">
                    {note.User_ReviewNote_clearedByToUser.name || note.User_ReviewNote_clearedByToUser.email}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-forvis-gray-500 uppercase mb-1">Cleared At</h3>
                  <p className="text-sm text-forvis-gray-900">
                    {new Date(note.clearedAt).toLocaleString()}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Note-Level Attachments Section */}
          {noteLevelAttachments.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-forvis-gray-700 mb-3 flex items-center space-x-2">
                <Paperclip className="w-4 h-4" />
                <span>Attachments ({noteLevelAttachments.length})</span>
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {noteLevelAttachments.map((attachment, index) => 
                  renderAttachmentThumbnail(attachment, index, noteLevelAttachments)
                )}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div>
            <h3 className="text-sm font-medium text-forvis-gray-700 mb-3 flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Comments ({comments.length})</span>
            </h3>
            
            <div className="space-y-3 mb-4">
              {comments.length === 0 ? (
                <p className="text-sm text-forvis-gray-500 italic">No comments yet</p>
              ) : (
                comments.map((comment: ReviewNoteCommentWithUser) => {
                  const commentAttachments = getCommentAttachments(comment.id);
                  return (
                    <div key={comment.id} className="bg-forvis-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-medium text-forvis-gray-900">
                          {comment.User?.name || comment.User?.email || 'Unknown'}
                        </span>
                        <span className="text-xs text-forvis-gray-500">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-forvis-gray-700 whitespace-pre-wrap">{comment.comment}</p>
                      
                      {/* Comment Attachments - Inline */}
                      {commentAttachments.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                          {commentAttachments.map((attachment, index) => 
                            renderAttachmentThumbnail(attachment, index, commentAttachments)
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Comment */}
            <div className="space-y-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full px-3 py-2 border border-forvis-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-forvis-blue-500 text-sm"
                rows={2}
                disabled={addCommentMutation.isPending || isUploadingAttachments}
              />
              
              {/* Attachment Manager */}
              <AttachmentManager
                maxFiles={5}
                onAttachmentsChange={setCommentAttachments}
                disabled={addCommentMutation.isPending || isUploadingAttachments}
                showUploadButton={true}
              />

              {/* Upload Progress */}
              {isUploadingAttachments && (
                <div className="flex items-center gap-2 p-3 bg-forvis-blue-50 border border-forvis-blue-200 rounded-md">
                  <Loader2 className="w-4 h-4 animate-spin text-forvis-blue-600" />
                  <span className="text-sm text-forvis-blue-800">{uploadProgress}</span>
                </div>
              )}
              
              <div className="flex justify-end">
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || addCommentMutation.isPending || isUploadingAttachments}
                  variant="primary"
                  size="md"
                  icon={addCommentMutation.isPending || isUploadingAttachments ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
                >
                  {isUploadingAttachments 
                    ? 'Uploading...' 
                    : addCommentMutation.isPending 
                      ? 'Adding...' 
                      : 'Add Comment'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-forvis-gray-200">
          <div className="flex space-x-2">
            {note.status === 'OPEN' && (
              <Button
                onClick={() => handleStatusChange(ReviewNoteStatus.IN_PROGRESS)}
                disabled={changeStatusMutation.isPending}
                variant="primary"
                size="sm"
                icon={<AlertCircle className="w-4 h-4" />}
              >
                Start Progress
              </Button>
            )}

            {(note.status === 'OPEN' || note.status === 'IN_PROGRESS') && (
              <Button
                onClick={() => handleStatusChange(ReviewNoteStatus.ADDRESSED)}
                disabled={changeStatusMutation.isPending}
                variant="primary"
                size="sm"
                icon={<CheckCircle className="w-4 h-4" />}
              >
                Mark Addressed
              </Button>
            )}

            {note.status === 'ADDRESSED' && (
              <>
                <Button
                  onClick={() => setShowConfirmClear(true)}
                  disabled={changeStatusMutation.isPending}
                  variant="primary"
                  size="sm"
                  icon={<CheckCircle className="w-4 h-4" />}
                >
                  Clear Note
                </Button>
                <Button
                  onClick={() => setShowConfirmReject(true)}
                  disabled={changeStatusMutation.isPending}
                  variant="danger"
                  size="sm"
                  icon={<XCircle className="w-4 h-4" />}
                >
                  Reject
                </Button>
              </>
            )}
          </div>

          <Button onClick={onClose} variant="secondary" size="md">
            Close
          </Button>
        </div>

        {/* Clear Confirmation Modal */}
        {showConfirmClear && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-corporate-lg">
              <h3 className="text-lg font-semibold text-forvis-gray-900 mb-2">Clear Review Note?</h3>
              <p className="text-sm text-forvis-gray-600 mb-4">
                This will mark the review note as cleared and resolved. This action can be reversed if needed.
              </p>
              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => setShowConfirmClear(false)}
                  variant="secondary"
                  size="md"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleStatusChange(ReviewNoteStatus.CLEARED)}
                  variant="primary"
                  size="md"
                  disabled={changeStatusMutation.isPending}
                  icon={changeStatusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
                >
                  Clear Note
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Confirmation Modal */}
        {showConfirmReject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-corporate-lg">
              <h3 className="text-lg font-semibold text-forvis-gray-900 mb-2">Reject Review Note?</h3>
              <p className="text-sm text-forvis-gray-600 mb-4">
                Please provide a reason for rejecting this review note.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                className="w-full px-3 py-2 border border-forvis-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-forvis-blue-500 text-sm mb-4"
                rows={3}
              />
              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => {
                    setShowConfirmReject(false);
                    setRejectReason('');
                  }}
                  variant="secondary"
                  size="md"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleStatusChange(ReviewNoteStatus.REJECTED, rejectReason)}
                  variant="danger"
                  size="md"
                  disabled={!rejectReason.trim() || changeStatusMutation.isPending}
                  icon={changeStatusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
                >
                  Reject
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Attachment Lightbox */}
        <AttachmentLightbox
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          attachments={attachments}
          initialIndex={lightboxIndex}
          taskId={taskId}
          noteId={noteId}
        />
      </div>
    </div>
  );
}

