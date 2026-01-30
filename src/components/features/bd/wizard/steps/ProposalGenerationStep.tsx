/**
 * BD Wizard Step 7: Proposal Generation/Upload
 * Generate proposal from template or upload custom file
 */

'use client';

import React, { useState } from 'react';
import { Button, Banner } from '@/components/ui';
import type { StepProps } from '@/types/bd-wizard';
import { FileText, Upload, CheckCircle } from 'lucide-react';
import { getGradient } from '@/lib/design-system/gradients';

export function ProposalGenerationStep({
  wizardData,
  updateWizardData,
  onNext,
  onBack,
  opportunityId,
}: StepProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [proposalGenerated, setProposalGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleGenerateProposal = async () => {
    if (wizardData.proposalType === 'quick' && !wizardData.templateId) {
      setError('No template selected');
      return;
    }

    if (!opportunityId) {
      setError('Opportunity ID not found');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const res = await fetch(
        `/api/bd/wizard/${opportunityId}/generate-proposal`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId: wizardData.templateId,
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to generate proposal');
      }

      const result = await res.json();
      setProposalGenerated(true);

      updateWizardData({
        proposalFile: {
          fileName: result.data.fileName,
          filePath: '/generated',
          fileSize: result.data.content?.length || 0,
        },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to generate proposal');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError('No file selected');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // For now, just mark as uploaded
      // Full file upload implementation would use blob storage
      setProposalGenerated(true);

      updateWizardData({
        proposalFile: {
          fileName: selectedFile.name,
          filePath: '/uploads',
          fileSize: selectedFile.size,
        },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to upload proposal');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNext = () => {
    onNext();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-forvis-gray-900 mb-2">
          {wizardData.proposalType === 'quick'
            ? 'Generate Proposal'
            : 'Upload Proposal'}
        </h3>
        <p className="text-sm text-forvis-gray-600">
          {wizardData.proposalType === 'quick'
            ? 'Generate your proposal from the selected template.'
            : 'Upload your custom proposal file.'}
        </p>
      </div>

      {error && (
        <div className="mb-4">
          <Banner
            variant="error"
            message={error}
            dismissible
            onDismiss={() => setError(null)}
          />
        </div>
      )}

      {!proposalGenerated ? (
        <div className="space-y-6">
          {/* Quick Proposal Generation */}
          {wizardData.proposalType === 'quick' && (
            <>
              <div className="bg-forvis-blue-50 border border-forvis-blue-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <FileText className="h-6 w-6 text-forvis-blue-600 flex-shrink-0" />
                  <div>
                    <h4 className="text-base font-semibold text-forvis-gray-900 mb-2">
                      Ready to Generate
                    </h4>
                    <p className="text-sm text-forvis-gray-700">
                      The proposal will be generated from the selected template with your
                      opportunity details automatically filled in.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGenerateProposal}
                variant="gradient"
                className="w-full"
                disabled={isProcessing}
              >
                {isProcessing ? 'Generating Proposal...' : 'Generate Proposal'}
              </Button>
            </>
          )}

          {/* Custom File Upload */}
          {wizardData.proposalType === 'custom' && (
            <>
              <div className="border-2 border-dashed border-forvis-blue-300 rounded-lg p-8">
                <div className="flex flex-col items-center text-center">
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center mb-4"
                    style={{ background: getGradient('icon', 'standard') }}
                  >
                    <Upload className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-base font-semibold text-forvis-gray-900 mb-2">
                    Upload Proposal File
                  </h4>
                  <p className="text-sm text-forvis-gray-600 mb-4">
                    Supported formats: PDF, DOCX, PPT, PPTX (Max 10MB)
                  </p>

                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    accept=".pdf,.docx,.ppt,.pptx"
                    className="hidden"
                    id="proposal-upload"
                  />
                  <label
                    htmlFor="proposal-upload"
                    className="px-4 py-2 bg-forvis-blue-600 text-white rounded-lg hover:bg-forvis-blue-700 transition-colors cursor-pointer"
                  >
                    Choose File
                  </label>

                  {selectedFile && (
                    <div className="mt-4 p-3 bg-forvis-success-50 border border-forvis-success-200 rounded-lg w-full">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-forvis-success-600" />
                          <span className="text-sm font-medium text-forvis-success-900">
                            {selectedFile.name}
                          </span>
                        </div>
                        <span className="text-sm text-forvis-success-700">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedFile && (
                <Button
                  onClick={handleFileUpload}
                  variant="gradient"
                  className="w-full"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Uploading...' : 'Upload Proposal'}
                </Button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-forvis-success-50 border border-forvis-success-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-forvis-success-600 flex-shrink-0" />
              <div>
                <h4 className="text-base font-semibold text-forvis-success-900 mb-2">
                  {wizardData.proposalType === 'quick'
                    ? 'Proposal Generated'
                    : 'Proposal Uploaded'}
                </h4>
                <p className="text-sm text-forvis-success-800">
                  {wizardData.proposalType === 'quick'
                    ? 'Your proposal has been successfully generated from the template.'
                    : 'Your custom proposal has been uploaded successfully.'}
                </p>
                {wizardData.proposalFile && (
                  <p className="text-sm text-forvis-success-700 mt-2">
                    File: {wizardData.proposalFile.fileName}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-forvis-gray-200 mt-8">
        <Button onClick={onBack} variant="secondary">
          Back
        </Button>
        <Button onClick={handleNext} variant="gradient" disabled={!proposalGenerated}>
          Review & Complete
        </Button>
      </div>
    </div>
  );
}
