/**
 * ApprovalActions Component
 * Reusable component for approve/reject actions with comment modal
 */

'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { ConfirmModal } from '@/components/shared/ConfirmModal';

interface ApprovalActionsProps {
  onApprove: (comment?: string) => void | Promise<void>;
  onReject: (comment: string) => void | Promise<void>;
  isProcessing?: boolean;
  approveText?: string;
  rejectText?: string;
}

export function ApprovalActions({
  onApprove,
  onReject,
  isProcessing = false,
  approveText = 'Approve',
  rejectText = 'Reject',
}: ApprovalActionsProps) {
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approveComment, setApproveComment] = useState('');
  const [rejectComment, setRejectComment] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  const handleApproveClick = () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ApprovalActions.tsx:34',message:'Approve button clicked - opening modal',data:{isProcessing},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    setApproveComment('');
    setShowApproveModal(true);
  };

  const handleApproveConfirm = async () => {
    // #region agent log
    await fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ApprovalActions.tsx:39',message:'Approve confirmed in modal - calling onApprove',data:{comment:approveComment || 'none',isProcessing},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A_B'})}).catch(()=>{});
    // #endregion
    
    await onApprove(approveComment || undefined);
    
    // #region agent log
    await fetch('http://127.0.0.1:7242/ingest/b3aab070-f6ba-47bb-8f83-44bc48c48d0b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ApprovalActions.tsx:46',message:'onApprove completed - closing modal',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    setShowApproveModal(false);
    setApproveComment('');
  };

  const handleRejectClick = () => {
    setRejectComment('');
    setRejectError(null);
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectComment.trim()) {
      setRejectError('Please provide a reason for rejection');
      return;
    }
    
    await onReject(rejectComment);
    setShowRejectModal(false);
    setRejectComment('');
    setRejectError(null);
  };

  return (
    <>
      <div className="flex gap-3 justify-end">
        <Button
          variant="secondary"
          onClick={handleRejectClick}
          disabled={isProcessing}
          className="min-w-[120px]"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 mr-2" />
              {rejectText}
            </>
          )}
        </Button>

        <Button
          variant="gradient"
          onClick={handleApproveClick}
          disabled={isProcessing}
          className="min-w-[120px]"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              {approveText}
            </>
          )}
        </Button>
      </div>

      {/* Approve Confirmation Modal */}
      <ConfirmModal
        isOpen={showApproveModal}
        title="Approve Client Acceptance?"
        message="Are you sure you want to approve this client acceptance assessment?"
        confirmText={approveText}
        variant="info"
        onConfirm={handleApproveConfirm}
        onClose={() => setShowApproveModal(false)}
      />

      {/* Reject Confirmation Modal */}
      <ConfirmModal
        isOpen={showRejectModal}
        title="Reject Client Acceptance?"
        message="Please provide a reason for rejecting this client acceptance assessment. The submitter will be notified."
        confirmText={rejectText}
        variant="danger"
        onConfirm={handleRejectConfirm}
        onClose={() => {
          setShowRejectModal(false);
          setRejectError(null);
        }}
      />
    </>
  );
}
