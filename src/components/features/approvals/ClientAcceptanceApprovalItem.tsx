'use client';

import { Building, AlertTriangle, Calendar, CheckCircle, Eye, User } from 'lucide-react';
import { formatDate } from '@/lib/utils/taskUtils';
import type { ApprovalWithSteps } from '@/types/approval';
import { Button } from '@/components/ui';
import { StatusBadge } from './StatusBadge';
import { WorkflowTimeline } from './WorkflowTimeline';
import { useState } from 'react';

interface ClientAcceptanceApprovalItemProps {
  approval: ApprovalWithSteps;
  onApprove?: (stepId: number, comment?: string) => Promise<void>;
  onReject?: (stepId: number, comment: string) => Promise<void>;
  isProcessing?: boolean;
  showArchived?: boolean;
}

export function ClientAcceptanceApprovalItem({
  approval,
  onApprove,
  onReject,
  isProcessing = false,
  showArchived = false,
}: ClientAcceptanceApprovalItemProps) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectComment, setRejectComment] = useState('');

  // Get current pending step
  const currentStep = approval.ApprovalStep.find((s) => s.status === 'PENDING');
  const isApproved = approval.status === 'APPROVED';

  // Get workflow data (will be fetched via API in UnifiedApprovalCard pattern)
  const workflowData = approval.context as any;
  const clientName = workflowData?.Client?.clientNameFull || workflowData?.Client?.clientCode || 'Unknown Client';
  const clientCode = workflowData?.Client?.clientCode || 'N/A';
  const riskRating = workflowData?.riskRating || 'Pending';
  const overallRiskScore = workflowData?.overallRiskScore;

  const getRiskColor = (rating: string) => {
    switch (rating.toUpperCase()) {
      case 'HIGH':
        return 'text-red-600';
      case 'MEDIUM':
        return 'text-yellow-600';
      case 'LOW':
        return 'text-green-600';
      default:
        return 'text-forvis-gray-600';
    }
  };

  const getButtonConfig = () => {
    if (showArchived && isApproved) {
      return {
        text: 'Approved',
        variant: 'secondary' as const,
        icon: CheckCircle,
        disabled: true,
      };
    }
    if (showArchived) {
      return {
        text: 'View',
        variant: 'secondary' as const,
        icon: Eye,
        disabled: false,
      };
    }
    return {
      text: 'Review & Approve',
      variant: 'gradient' as const,
      icon: null,
      disabled: false,
    };
  };

  const buttonConfig = getButtonConfig();
  const ButtonIcon = buttonConfig.icon;

  const handleApprove = async () => {
    if (currentStep && onApprove) {
      await onApprove(currentStep.id);
    }
  };

  const handleReject = async () => {
    if (currentStep && onReject && rejectComment.trim()) {
      await onReject(currentStep.id, rejectComment);
      setShowRejectModal(false);
      setRejectComment('');
    }
  };

  return (
    <>
      <div
        className="rounded-lg border border-forvis-blue-100 p-4 shadow-sm hover:shadow-md transition-all duration-200 relative"
        style={{ background: 'linear-gradient(135deg, #F0F7FD 0%, #E0EDFB 100%)' }}
      >
        {/* Status Badge - Top Right */}
        {showArchived && (
          <div className="absolute top-3 right-3">
            <StatusBadge status={approval.status} />
          </div>
        )}

        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {/* Icon */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ background: 'linear-gradient(135deg, #5B93D7 0%, #2E5AAC 100%)' }}
            >
              <Building className="h-5 w-5 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-forvis-gray-900">
                    Client Acceptance Questionnaire
                  </h4>
                  <div className="flex items-center space-x-2 mt-1 text-xs text-forvis-gray-600">
                    <Building className="h-3 w-3" />
                    <span className="font-medium">{clientCode}</span>
                  </div>
                </div>
              </div>

              {/* Client Details */}
              <div className="space-y-1 text-sm text-forvis-gray-700 mb-3">
                <div className="flex items-start">
                  <span className="text-forvis-gray-600 mr-2">Client:</span>
                  <span className="font-medium">{clientName}</span>
                </div>
                {riskRating && riskRating !== 'Pending' && (
                  <div className="flex items-center space-x-2 mt-2">
                    <AlertTriangle className={`h-4 w-4 ${getRiskColor(riskRating)}`} />
                    <span className={`font-medium ${getRiskColor(riskRating)}`}>
                      Risk Rating: {riskRating}
                    </span>
                    {overallRiskScore !== null && overallRiskScore !== undefined && (
                      <span className="text-forvis-gray-600">
                        (Score: {overallRiskScore.toFixed(1)})
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="flex items-center space-x-4 text-xs text-forvis-gray-600">
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span>
                    Requested by {approval.User_Approval_requestedByIdToUser?.name || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(approval.requestedAt.toString())}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="ml-4 flex-shrink-0">
            {!showArchived && currentStep ? (
              <div className="flex flex-col space-y-2">
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={handleApprove}
                  disabled={isProcessing}
                >
                  Approve
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowRejectModal(true)}
                  disabled={isProcessing}
                >
                  Reject
                </Button>
              </div>
            ) : (
              <Button
                variant={buttonConfig.variant}
                size="sm"
                disabled={buttonConfig.disabled}
                className={buttonConfig.disabled ? 'cursor-default opacity-80' : ''}
              >
                {ButtonIcon && <ButtonIcon className="h-4 w-4 mr-1.5" />}
                {buttonConfig.text}
              </Button>
            )}
          </div>
        </div>

        {/* Workflow Timeline */}
        <WorkflowTimeline type="clientAcceptance" approval={approval} />
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-corporate-lg max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold text-forvis-gray-900 mb-4">
              Reject Client Acceptance
            </h3>
            <p className="text-sm text-forvis-gray-600 mb-4">
              Please provide a reason for rejecting this client acceptance:
            </p>
            <textarea
              className="w-full border border-forvis-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-forvis-blue-500"
              rows={4}
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="Enter rejection reason..."
            />
            <div className="flex justify-end space-x-3 mt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectComment('');
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                disabled={isProcessing || !rejectComment.trim()}
              >
                {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
