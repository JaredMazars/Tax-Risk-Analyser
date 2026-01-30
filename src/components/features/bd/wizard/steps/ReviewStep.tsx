/**
 * BD Wizard Step 8: Review
 * Final review of all entered data before completing
 */

'use client';

import React, { useState } from 'react';
import { Button, Banner } from '@/components/ui';
import type { StepProps } from '@/types/bd-wizard';
import {
  Building2,
  Users,
  FileText,
  CheckCircle,
  DollarSign,
  Calendar,
} from 'lucide-react';

export function ReviewStep({ wizardData, onNext, onBack }: StepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async () => {
    setIsSubmitting(true);
    await onNext();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-forvis-gray-900 mb-2">
          Review & Complete
        </h3>
        <p className="text-sm text-forvis-gray-600">
          Please review all the information before creating the opportunity.
        </p>
      </div>

      <div className="space-y-6">
        {/* Workflow Type Summary */}
        <div className="bg-white border border-forvis-gray-200 rounded-lg p-6">
          <div className="flex items-start gap-3 mb-4">
            <Building2 className="h-5 w-5 text-forvis-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-base font-semibold text-forvis-gray-900">
                {wizardData.workflowType === 'existing'
                  ? 'Existing Client'
                  : 'New Prospect'}
              </h4>
            </div>
          </div>

          {wizardData.workflowType === 'prospect' && wizardData.prospectDetails && (
            <div className="ml-8 space-y-2 text-sm">
              <div>
                <span className="font-medium text-forvis-gray-700">Company:</span>{' '}
                <span className="text-forvis-gray-900">
                  {wizardData.prospectDetails.companyName}
                </span>
              </div>
              {wizardData.prospectDetails.industry && (
                <div>
                  <span className="font-medium text-forvis-gray-700">Industry:</span>{' '}
                  <span className="text-forvis-gray-900">
                    {wizardData.prospectDetails.industry}
                  </span>
                </div>
              )}
              {wizardData.prospectDetails.email && (
                <div>
                  <span className="font-medium text-forvis-gray-700">Email:</span>{' '}
                  <span className="text-forvis-gray-900">
                    {wizardData.prospectDetails.email}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Team Assignment (for prospects) */}
        {wizardData.workflowType === 'prospect' && wizardData.teamAssignment && (
          <div className="bg-white border border-forvis-gray-200 rounded-lg p-6">
            <div className="flex items-start gap-3 mb-4">
              <Users className="h-5 w-5 text-forvis-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-base font-semibold text-forvis-gray-900">
                  Team Assignment
                </h4>
              </div>
            </div>

            <div className="ml-8 space-y-2 text-sm">
              <div>
                <span className="font-medium text-forvis-gray-700">Partner:</span>{' '}
                <span className="text-forvis-gray-900">
                  {wizardData.teamAssignment.partnerCode}
                </span>
              </div>
              <div>
                <span className="font-medium text-forvis-gray-700">Manager:</span>{' '}
                <span className="text-forvis-gray-900">
                  {wizardData.teamAssignment.managerCode}
                </span>
              </div>
              <div>
                <span className="font-medium text-forvis-gray-700">Incharge:</span>{' '}
                <span className="text-forvis-gray-900">
                  {wizardData.teamAssignment.inchargeCode}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Client Acceptance Status (for prospects) */}
        {wizardData.workflowType === 'prospect' && wizardData.clientAcceptanceId && (
          <div className="bg-forvis-success-50 border border-forvis-success-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-forvis-success-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-base font-semibold text-forvis-success-900">
                  Client Acceptance Initiated
                </h4>
                <p className="text-sm text-forvis-success-800 mt-1">
                  Client acceptance has been initialized and can be completed through the
                  client management interface.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Opportunity Details */}
        <div className="bg-white border border-forvis-gray-200 rounded-lg p-6">
          <div className="flex items-start gap-3 mb-4">
            <FileText className="h-5 w-5 text-forvis-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-base font-semibold text-forvis-gray-900">
                Opportunity Details
              </h4>
            </div>
          </div>

          <div className="ml-8 space-y-2 text-sm">
            <div>
              <span className="font-medium text-forvis-gray-700">Title:</span>{' '}
              <span className="text-forvis-gray-900">
                {wizardData.opportunityDetails.title}
              </span>
            </div>
            {wizardData.opportunityDetails.description && (
              <div>
                <span className="font-medium text-forvis-gray-700">Description:</span>{' '}
                <span className="text-forvis-gray-900">
                  {wizardData.opportunityDetails.description}
                </span>
              </div>
            )}
            {wizardData.opportunityDetails.value && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-forvis-gray-500" />
                <span className="font-medium text-forvis-gray-700">Value:</span>{' '}
                <span className="text-forvis-gray-900">
                  ${wizardData.opportunityDetails.value.toLocaleString()}
                </span>
              </div>
            )}
            {wizardData.opportunityDetails.probability && (
              <div>
                <span className="font-medium text-forvis-gray-700">Probability:</span>{' '}
                <span className="text-forvis-gray-900">
                  {wizardData.opportunityDetails.probability}%
                </span>
              </div>
            )}
            {wizardData.opportunityDetails.expectedCloseDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-forvis-gray-500" />
                <span className="font-medium text-forvis-gray-700">Expected Close:</span>{' '}
                <span className="text-forvis-gray-900">
                  {new Date(
                    wizardData.opportunityDetails.expectedCloseDate
                  ).toLocaleDateString()}
                </span>
              </div>
            )}
            {wizardData.opportunityDetails.source && (
              <div>
                <span className="font-medium text-forvis-gray-700">Source:</span>{' '}
                <span className="text-forvis-gray-900">
                  {wizardData.opportunityDetails.source}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Proposal Summary */}
        <div className="bg-white border border-forvis-gray-200 rounded-lg p-6">
          <div className="flex items-start gap-3 mb-4">
            <FileText className="h-5 w-5 text-forvis-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-base font-semibold text-forvis-gray-900">Proposal</h4>
            </div>
          </div>

          <div className="ml-8 space-y-2 text-sm">
            <div>
              <span className="font-medium text-forvis-gray-700">Type:</span>{' '}
              <span className="text-forvis-gray-900">
                {wizardData.proposalType === 'quick'
                  ? 'Template-based (Quick)'
                  : 'Custom Upload'}
              </span>
            </div>
            {wizardData.proposalFile && (
              <div>
                <span className="font-medium text-forvis-gray-700">File:</span>{' '}
                <span className="text-forvis-gray-900">
                  {wizardData.proposalFile.fileName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Final Info */}
        <div className="bg-forvis-blue-50 border border-forvis-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-forvis-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-forvis-gray-700">
              <p className="font-medium mb-1">Ready to Create Opportunity</p>
              <p>
                When you click "Create Opportunity", the system will:
              </p>
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>Create the opportunity with all entered details</li>
                <li>Automatically progress the stage to "Proposal Sent"</li>
                <li>
                  {wizardData.workflowType === 'prospect'
                    ? 'Link the opportunity to the newly created prospect client'
                    : 'Link the opportunity to the selected client'}
                </li>
                <li>Make the opportunity available in the pipeline</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-forvis-gray-200 mt-8">
        <Button onClick={onBack} variant="secondary" disabled={isSubmitting}>
          Back
        </Button>
        <Button
          onClick={handleComplete}
          variant="gradient"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Opportunity...' : 'Create Opportunity'}
        </Button>
      </div>
    </div>
  );
}
