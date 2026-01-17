/**
 * Client Acceptance Card Component
 * Displays client acceptance status and provides access to complete/renew acceptance
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, AlertCircle, Clock, XCircle, Play } from 'lucide-react';
import { Card, Button } from '@/components/ui';
import type { ClientAcceptance } from '@/types';

interface ClientAcceptanceCardProps {
  GSClientID: string;
  clientCode: string;
  clientName: string | null;
  onStartAcceptance?: () => void;
}

export function ClientAcceptanceCard({
  GSClientID,
  clientCode,
  clientName,
  onStartAcceptance,
}: ClientAcceptanceCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Fetch client acceptance status
  const { data: status, isLoading } = useQuery({
    queryKey: ['client', 'acceptance', 'status', GSClientID],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${GSClientID}/acceptance/status`);
      if (!res.ok) throw new Error('Failed to fetch client acceptance status');
      const data = await res.json();
      return data.data;
    },
  });

  // Note: Completion percentage is now calculated and displayed within the questionnaire
  // to avoid duplication and ensure consistency

  if (isLoading) {
    return (
      <Card variant="standard" className="animate-pulse">
        <div className="p-6">
          <div className="h-6 bg-forvis-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-forvis-gray-200 rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  const getStatusBadge = () => {
    if (!status?.exists) {
      return (
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-forvis-gray-100 border-2 border-forvis-gray-300 rounded-lg">
          <XCircle className="h-4 w-4 text-forvis-gray-600" />
          <span className="text-sm font-semibold text-forvis-gray-700">Not Started</span>
        </div>
      );
    }

    if (status.approved) {
      return (
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 border-2 border-green-200 rounded-lg">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm font-semibold text-green-700">Approved</span>
        </div>
      );
    }

    if (status.completed) {
      return (
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <Clock className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-700">Pending Approval</span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2 px-3 py-1.5 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <span className="text-sm font-semibold text-yellow-700">In Progress</span>
      </div>
    );
  };

  const getRiskBadge = () => {
    if (!status?.riskRating) return null;

    const colors = {
      LOW: 'bg-green-100 text-green-800 border-green-300',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      HIGH: 'bg-red-100 text-red-800 border-red-300',
    };

    const color = colors[status.riskRating as keyof typeof colors] || colors.MEDIUM;

    return (
      <div className={`px-3 py-1.5 rounded-lg border-2 text-sm font-semibold ${color}`}>
        Risk: {status.riskRating}
        {status.overallRiskScore && ` (${status.overallRiskScore.toFixed(0)}%)`}
      </div>
    );
  };

  return (
    <Card variant="standard">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-forvis-gray-900 mb-1">
              Client Acceptance
            </h3>
            <p className="text-sm text-forvis-gray-600">
              Client-level risk assessment required before engagement work
            </p>
          </div>
          {getStatusBadge()}
        </div>

        {status?.approved && (
          <div className="space-y-2 mb-4">
            {status.approvedAt && (
              <div className="text-sm">
                <span className="font-medium text-forvis-gray-700">Approved: </span>
                <span className="text-forvis-gray-600">
                  {new Date(status.approvedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                {status.approvedBy && (
                  <span className="text-forvis-gray-600"> by {status.approvedBy}</span>
                )}
              </div>
            )}
            {status.validUntil && (
              <div className="text-sm">
                <span className="font-medium text-forvis-gray-700">Valid Until: </span>
                <span className="text-forvis-gray-600">
                  {new Date(status.validUntil).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
            {getRiskBadge()}
          </div>
        )}

        {status?.completed && !status.approved && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              Submitted for Partner review on{' '}
              {status.completedAt &&
                new Date(status.completedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
            </p>
          </div>
        )}

        {!status?.exists && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Action Required:</strong> Client Acceptance must be completed before creating tasks or engagements for this client.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          {!status?.approved && (
            <Button
              variant="primary"
              onClick={onStartAcceptance}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              {status?.exists 
                ? 'Continue Assessment'
                : 'Begin Risk Assessment'}
            </Button>
          )}

          {status?.approved && (
            <Button
              variant="secondary"
              onClick={() => setShowDetails(!showDetails)}
              className="flex-1"
            >
              {showDetails ? 'Hide Details' : 'View Details'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
