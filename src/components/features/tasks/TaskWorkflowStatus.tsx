'use client';

import React from 'react';
import { Shield, FileText } from 'lucide-react';

interface TaskWorkflowStatusProps {
  acceptanceApproved?: boolean | null;
  engagementLetterUploaded?: boolean | null;
  isClientTask: boolean;
  displayMode?: 'compact' | 'detailed';
}

/**
 * TaskWorkflowStatus Component
 * 
 * Displays icon-based indicators for Acceptance & Continuance (A&C) and 
 * Engagement Letter (EL) status for client tasks.
 * 
 * - Green icons indicate completion
 * - Gray icons indicate pending status
 * - Only renders for client tasks
 */
export function TaskWorkflowStatus({
  acceptanceApproved,
  engagementLetterUploaded,
  isClientTask,
  displayMode = 'detailed',
}: TaskWorkflowStatusProps) {
  // Only show for client tasks
  if (!isClientTask) {
    return null;
  }

  const isCompact = displayMode === 'compact';
  const iconSize = isCompact ? 'h-3 w-3' : 'h-4 w-4';
  const spacing = isCompact ? 'gap-1' : 'gap-1.5';

  return (
    <div className={`flex items-center ${spacing}`}>
      {/* Acceptance & Continuance Indicator */}
      <div
        className="flex items-center"
        title={
          acceptanceApproved
            ? 'Acceptance & Continuance Approved'
            : 'Acceptance & Continuance Pending'
        }
      >
        <Shield
          className={`${iconSize} ${
            acceptanceApproved
              ? 'text-green-600'
              : 'text-forvis-gray-400'
          }`}
          strokeWidth={2}
        />
      </div>

      {/* Engagement Letter Indicator */}
      <div
        className="flex items-center"
        title={
          engagementLetterUploaded
            ? 'Engagement Letter Uploaded'
            : 'Engagement Letter Pending'
        }
      >
        <FileText
          className={`${iconSize} ${
            engagementLetterUploaded
              ? 'text-green-600'
              : 'text-forvis-gray-400'
          }`}
          strokeWidth={2}
        />
      </div>
    </div>
  );
}

