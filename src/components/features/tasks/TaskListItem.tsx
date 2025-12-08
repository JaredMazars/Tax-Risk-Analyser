'use client';

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { ClockIcon } from '@heroicons/react/24/outline';
import { formatDate } from '@/lib/utils/taskUtils';
import { AlertModal } from '@/components/shared/AlertModal';

interface TaskListItemProps {
  task: {
    id: number;
    TaskDesc: string;
    TaskCode: string;
    Active: string;
    ServLineCode?: string;
    ServLineDesc?: string;
    SLGroup: string;
    subServiceLineGroupCode?: string | null; // The sub-service line group code this task belongs to
    createdAt: string | Date;
    updatedAt: string | Date;
    TaskPartner?: string;
    TaskPartnerName?: string;
    TaskManager?: string;
    TaskManagerName?: string;
    Client?: {
      GSClientID: string;
      clientCode: string;
      clientNameFull: string | null;
    };
    wip?: {
      balWIP: number;
      balTime: number;
      balDisb: number;
    };
  };
  currentSubServiceLineGroup: string;
  serviceLine: string;
  currentSubServiceLineGroupDescription?: string;
  showClientInfo?: boolean;
  showPartnerManager?: boolean;
  additionalBadge?: ReactNode;
  masterServiceLine?: string | null; // The main service line this task belongs to
  GSClientID?: string; // Optional GSClientID for when task.Client is not populated
}

export function TaskListItem({
  task,
  currentSubServiceLineGroup,
  serviceLine,
  currentSubServiceLineGroupDescription,
  showClientInfo = true,
  showPartnerManager = false,
  additionalBadge,
  masterServiceLine,
  GSClientID,
}: TaskListItemProps) {
  const [showAccessModal, setShowAccessModal] = useState(false);
  
  // Check if task belongs to the current sub-service line group
  // Use subServiceLineGroupCode if available, otherwise fall back to SLGroup
  const taskSubGroup = task.subServiceLineGroupCode || task.SLGroup;
  const isAccessible = taskSubGroup?.toUpperCase() === currentSubServiceLineGroup?.toUpperCase();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isAccessible) {
      e.preventDefault();
      setShowAccessModal(true);
    }
  };

  const taskUrl = task.Client?.GSClientID || GSClientID
    ? `/dashboard/${serviceLine.toLowerCase()}/${currentSubServiceLineGroup}/clients/${task.Client?.GSClientID || GSClientID}/tasks/${task.id}`
    : '#';

  const content = (
    <>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1 flex-wrap">
            <h3 className={`text-sm font-semibold ${isAccessible ? 'text-forvis-gray-900' : 'text-forvis-gray-500'}`}>
              {task.TaskDesc}
            </h3>
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
              isAccessible 
                ? 'bg-gray-100 text-gray-700 border border-gray-200'
                : 'bg-forvis-gray-100 text-forvis-gray-400 border border-forvis-gray-200'
            }`}>
              {task.TaskCode}
            </span>
            {task.ServLineDesc && (
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                isAccessible
                  ? 'bg-forvis-blue-100 text-forvis-blue-700'
                  : 'bg-forvis-gray-100 text-forvis-gray-400'
              }`}>
                {task.ServLineDesc}
              </span>
            )}
            {task.Active !== 'Yes' && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-forvis-gray-200 text-forvis-gray-700">
                {task.Active === 'Archived' ? 'Archived' : 'Inactive'}
              </span>
            )}
            {!isAccessible && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                Different Group
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className={`flex items-center space-x-3 text-xs ${isAccessible ? 'text-forvis-gray-500' : 'text-forvis-gray-400'}`}>
          {showClientInfo && task.Client && (
            <span title="Client">
              Client: {task.Client.clientNameFull || task.Client.clientCode}
            </span>
          )}
          {showPartnerManager && (
            <>
              {task.TaskPartnerName && (
                <span title="Partner">
                  Partner: {task.TaskPartnerName || task.TaskPartner}
                </span>
              )}
              {task.TaskManagerName && (
                <span title="Manager">
                  Manager: {task.TaskManagerName || task.TaskManager}
                </span>
              )}
            </>
          )}
          <span className="flex items-center">
            <ClockIcon className="h-3.5 w-3.5 mr-1" />
            {formatDate(task.updatedAt)}
          </span>
        </div>
        {additionalBadge}
      </div>
      
      {/* WIP Balances */}
      {task.wip && (
        <div className="mt-2 pt-2 border-t border-forvis-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <p className={`text-xs font-medium ${isAccessible ? 'text-forvis-gray-600' : 'text-forvis-gray-400'}`}>WIP Balance</p>
              <p className={`text-sm font-semibold ${isAccessible ? 'text-forvis-gray-900' : 'text-forvis-gray-500'}`}>
                {formatCurrency(task.wip.balWIP)}
              </p>
            </div>
            <div className="flex-1">
              <p className={`text-xs font-medium ${isAccessible ? 'text-forvis-gray-600' : 'text-forvis-gray-400'}`}>Time</p>
              <p className={`text-sm font-semibold ${isAccessible ? 'text-forvis-gray-900' : 'text-forvis-gray-500'}`}>
                {formatCurrency(task.wip.balTime)}
              </p>
            </div>
            <div className="flex-1">
              <p className={`text-xs font-medium ${isAccessible ? 'text-forvis-gray-600' : 'text-forvis-gray-400'}`}>Disb</p>
              <p className={`text-sm font-semibold ${isAccessible ? 'text-forvis-gray-900' : 'text-forvis-gray-500'}`}>
                {formatCurrency(task.wip.balDisb)}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {isAccessible ? (
        <Link
          href={taskUrl}
          className="block p-3 border border-forvis-gray-200 rounded-lg transition-all hover:border-forvis-blue-500 hover:shadow-sm cursor-pointer"
        >
          {content}
        </Link>
      ) : (
        <div
          onClick={handleClick}
          className="block p-3 border border-forvis-gray-200 rounded-lg transition-all opacity-50 cursor-not-allowed bg-forvis-gray-50"
          title={`This task belongs to sub-service line group: ${taskSubGroup}`}
        >
          {content}
        </div>
      )}

      <AlertModal
        isOpen={showAccessModal}
        onClose={() => setShowAccessModal(false)}
        title="Task Not Accessible"
        message={`This task belongs to a different sub-service line group. You are currently viewing ${currentSubServiceLineGroupDescription || currentSubServiceLineGroup}. This task belongs to ${taskSubGroup}.`}
        variant="info"
      />
    </>
  );
}
