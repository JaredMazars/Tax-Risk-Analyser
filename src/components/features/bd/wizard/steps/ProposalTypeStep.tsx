/**
 * BD Wizard Step 6: Proposal Type
 * Choose between quick template-based proposal or custom upload
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui';
import type { StepProps } from '@/types/bd-wizard';
import { FileText, Upload, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export function ProposalTypeStep({
  wizardData,
  updateWizardData,
  onNext,
  onBack,
}: StepProps) {
  const [proposalType, setProposalType] = useState<'quick' | 'custom'>(
    wizardData.proposalType || 'quick'
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    wizardData.templateId || 0
  );

  // Fetch proposal templates
  const { data: templatesData } = useQuery({
    queryKey: ['templates', 'PROPOSAL', wizardData.opportunityDetails.serviceLine],
    queryFn: async () => {
      const res = await fetch(
        `/api/templates/available?type=PROPOSAL&serviceLine=${wizardData.opportunityDetails.serviceLine}`
      );
      if (!res.ok) throw new Error('Failed to fetch templates');
      const result = await res.json();
      return result.data || [];
    },
    enabled: proposalType === 'quick',
  });

  const handleNext = () => {
    updateWizardData({
      proposalType,
      templateId: proposalType === 'quick' ? selectedTemplateId : undefined,
    });
    onNext();
  };

  const canProceed =
    proposalType === 'custom' || (proposalType === 'quick' && selectedTemplateId > 0);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-forvis-gray-900 mb-2">
          Proposal Type
        </h3>
        <p className="text-sm text-forvis-gray-600">
          Choose how you want to create the proposal for this opportunity.
        </p>
      </div>

      {/* Proposal Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Quick Proposal Option */}
        <button
          type="button"
          onClick={() => setProposalType('quick')}
          className={`p-6 border-2 rounded-lg transition-all ${
            proposalType === 'quick'
              ? 'border-forvis-blue-600 bg-forvis-blue-50'
              : 'border-forvis-gray-300 hover:border-forvis-blue-400'
          }`}
        >
          <div className="flex flex-col items-center text-center">
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${
                proposalType === 'quick' ? 'bg-forvis-blue-600' : 'bg-forvis-gray-200'
              }`}
            >
              <Sparkles
                className={`h-6 w-6 ${
                  proposalType === 'quick' ? 'text-white' : 'text-forvis-gray-600'
                }`}
              />
            </div>
            <h4 className="text-base font-semibold text-forvis-gray-900 mb-1">
              Quick Proposal
            </h4>
            <p className="text-sm text-forvis-gray-600">
              Generate from template (faster)
            </p>
          </div>
        </button>

        {/* Custom Proposal Option */}
        <button
          type="button"
          onClick={() => setProposalType('custom')}
          className={`p-6 border-2 rounded-lg transition-all ${
            proposalType === 'custom'
              ? 'border-forvis-blue-600 bg-forvis-blue-50'
              : 'border-forvis-gray-300 hover:border-forvis-blue-400'
          }`}
        >
          <div className="flex flex-col items-center text-center">
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${
                proposalType === 'custom' ? 'bg-forvis-blue-600' : 'bg-forvis-gray-200'
              }`}
            >
              <Upload
                className={`h-6 w-6 ${
                  proposalType === 'custom' ? 'text-white' : 'text-forvis-gray-600'
                }`}
              />
            </div>
            <h4 className="text-base font-semibold text-forvis-gray-900 mb-1">
              Custom Proposal
            </h4>
            <p className="text-sm text-forvis-gray-600">Upload your own file</p>
          </div>
        </button>
      </div>

      {/* Template Selection (for quick proposal) */}
      {proposalType === 'quick' && (
        <div className="mb-8">
          <label className="block text-sm font-medium text-forvis-gray-700 mb-2">
            Select Template *
          </label>
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-forvis-gray-300 rounded-lg focus:ring-2 focus:ring-forvis-blue-500 focus:border-forvis-blue-500"
            required
          >
            <option value="">Choose a template...</option>
            {templatesData?.map((template: any) => (
              <option key={template.id} value={template.id}>
                {template.name}
                {template.description && ` - ${template.description}`}
              </option>
            ))}
          </select>

          {templatesData && templatesData.length === 0 && (
            <p className="mt-2 text-sm text-forvis-warning-600">
              No proposal templates available. Please upload a custom proposal or create
              templates first.
            </p>
          )}
        </div>
      )}

      {/* Custom Upload Info (for custom proposal) */}
      {proposalType === 'custom' && (
        <div className="mb-8 p-4 bg-forvis-blue-50 border border-forvis-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-forvis-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-forvis-gray-700">
              <p className="font-medium mb-1">Custom Proposal Upload</p>
              <p>
                You'll be able to upload your custom proposal file in the next step. Supported
                formats: PDF, DOCX, PPT, PPTX
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-forvis-gray-200">
        <Button onClick={onBack} variant="secondary">
          Back
        </Button>
        <Button onClick={handleNext} variant="gradient" disabled={!canProceed}>
          Next
        </Button>
      </div>
    </div>
  );
}
