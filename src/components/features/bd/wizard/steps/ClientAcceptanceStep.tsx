/**
 * BD Wizard Step 4: Client Acceptance
 * Create prospect client and initiate acceptance process
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button, Banner } from '@/components/ui';
import type { StepProps } from '@/types/bd-wizard';
import { CheckCircle, AlertCircle } from 'lucide-react';

export function ClientAcceptanceStep({
  wizardData,
  updateWizardData,
  onNext,
  onBack,
  opportunityId,
}: StepProps) {
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [clientCreated, setClientCreated] = useState(false);
  const [clientId, setClientId] = useState<number | null>(
    wizardData.clientId || null
  );
  const [acceptanceId, setAcceptanceId] = useState<number | null>(
    wizardData.clientAcceptanceId || null
  );
  const [error, setError] = useState<string | null>(null);

  // Check if client already created
  useEffect(() => {
    if (wizardData.clientId && wizardData.clientAcceptanceId) {
      setClientCreated(true);
      setClientId(wizardData.clientId);
      setAcceptanceId(wizardData.clientAcceptanceId);
    }
  }, []);

  const handleCreateClient = async () => {
    if (!opportunityId) {
      setError('Opportunity ID not found');
      return;
    }

    try {
      setIsCreatingClient(true);
      setError(null);

      // Call create-client API
      const res = await fetch(
        `/api/bd/wizard/${opportunityId}/create-client`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wizardData,
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to create client');
      }

      const result = await res.json();

      setClientId(result.data.clientId);
      setAcceptanceId(result.data.acceptanceId);
      setClientCreated(true);

      // Update wizard data
      updateWizardData({
        clientId: result.data.clientId,
        clientAcceptanceId: result.data.acceptanceId,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create prospect client');
    } finally {
      setIsCreatingClient(false);
    }
  };

  const handleNext = () => {
    updateWizardData({
      clientAcceptanceCompleted: true,
    });
    onNext();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-forvis-gray-900 mb-2">
          Client Acceptance
        </h3>
        <p className="text-sm text-forvis-gray-600">
          Create the prospect client record and initialize client acceptance.
        </p>
      </div>

      {error && (
        <div className="mb-4">
          <Banner variant="error" message={error} dismissible onDismiss={() => setError(null)} />
        </div>
      )}

      {!clientCreated ? (
        <div className="space-y-6">
          {/* Summary of information */}
          <div className="bg-forvis-blue-50 border border-forvis-blue-200 rounded-lg p-6">
            <h4 className="text-base font-semibold text-forvis-gray-900 mb-4">
              Ready to Create Prospect
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-forvis-gray-700">Company:</span>{' '}
                <span className="text-forvis-gray-900">
                  {wizardData.prospectDetails?.companyName}
                </span>
              </div>
              {wizardData.prospectDetails?.industry && (
                <div>
                  <span className="font-medium text-forvis-gray-700">Industry:</span>{' '}
                  <span className="text-forvis-gray-900">
                    {wizardData.prospectDetails.industry}
                  </span>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-forvis-blue-300">
                <div className="font-medium text-forvis-gray-700 mb-2">Team:</div>
                <ul className="space-y-1 ml-4">
                  <li className="text-forvis-gray-900">
                    Partner: {wizardData.teamAssignment?.partnerCode}
                  </li>
                  <li className="text-forvis-gray-900">
                    Manager: {wizardData.teamAssignment?.managerCode}
                  </li>
                  <li className="text-forvis-gray-900">
                    Incharge: {wizardData.teamAssignment?.inchargeCode}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-forvis-warning-50 border border-forvis-warning-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-forvis-warning-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-forvis-warning-800">
                <p className="font-medium mb-1">Client Acceptance Required</p>
                <p>
                  After creating the prospect, client acceptance must be completed before
                  proceeding with the opportunity. This wizard will guide you through the
                  acceptance process.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleCreateClient}
            variant="gradient"
            className="w-full"
            disabled={isCreatingClient}
          >
            {isCreatingClient ? 'Creating Prospect...' : 'Create Prospect Client'}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-forvis-success-50 border border-forvis-success-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-forvis-success-600 flex-shrink-0" />
              <div>
                <h4 className="text-base font-semibold text-forvis-success-900 mb-2">
                  Prospect Client Created
                </h4>
                <p className="text-sm text-forvis-success-800">
                  The prospect client has been created successfully with client ID: {clientId}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-forvis-blue-50 border border-forvis-blue-200 rounded-lg p-6">
            <h4 className="text-base font-semibold text-forvis-gray-900 mb-3">
              Next: Client Acceptance
            </h4>
            <p className="text-sm text-forvis-gray-700 mb-4">
              Client acceptance must be completed for this prospect before creating the
              opportunity. You can complete it now through the standard client acceptance
              workflow, or proceed with the opportunity creation and complete acceptance later.
            </p>
            <p className="text-sm text-forvis-gray-600">
              For this wizard implementation, we'll mark acceptance as initiated and you can
              complete it through the client management interface.
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-forvis-gray-200 mt-8">
        <Button onClick={onBack} variant="secondary">
          Back
        </Button>
        <Button
          onClick={handleNext}
          variant="gradient"
          disabled={!clientCreated}
        >
          Continue to Opportunity Details
        </Button>
      </div>
    </div>
  );
}
