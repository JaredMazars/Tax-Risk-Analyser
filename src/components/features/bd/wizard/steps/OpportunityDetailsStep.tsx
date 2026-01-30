/**
 * BD Wizard Step 5: Opportunity Details
 * Collect opportunity information (title, description, value, etc.)
 */

'use client';

import React, { useState } from 'react';
import { Button, Input } from '@/components/ui';
import type { StepProps } from '@/types/bd-wizard';
import { useQuery } from '@tanstack/react-query';

export function OpportunityDetailsStep({
  wizardData,
  updateWizardData,
  onNext,
  onBack,
}: StepProps) {
  const [title, setTitle] = useState(wizardData.opportunityDetails.title || '');
  const [selectedServLineCode, setSelectedServLineCode] = useState(
    wizardData.opportunityDetails.servLineCode || ''
  );
  const [description, setDescription] = useState(
    wizardData.opportunityDetails.description || ''
  );
  const [value, setValue] = useState(
    wizardData.opportunityDetails.value?.toString() || ''
  );
  const [probability, setProbability] = useState(
    wizardData.opportunityDetails.probability?.toString() || ''
  );
  const [expectedCloseDate, setExpectedCloseDate] = useState(
    wizardData.opportunityDetails.expectedCloseDate || ''
  );
  const [source, setSource] = useState(wizardData.opportunityDetails.source || '');
  const [stageId, setStageId] = useState(
    wizardData.opportunityDetails.stageId || 0
  );
  
  // Assignment scheduling fields
  const [assignmentType, setAssignmentType] = useState(
    wizardData.opportunityDetails.assignmentType || ''
  );
  const [startDate, setStartDate] = useState(
    wizardData.opportunityDetails.startDate || ''
  );
  const [endDate, setEndDate] = useState(
    wizardData.opportunityDetails.endDate || ''
  );
  const [recurringFrequency, setRecurringFrequency] = useState(
    wizardData.opportunityDetails.recurringFrequency || ''
  );

  // Fetch available service lines for the master code
  const { data: serviceLinesData } = useQuery({
    queryKey: ['bd-service-lines', wizardData.opportunityDetails.serviceLine],
    queryFn: async () => {
      const res = await fetch(
        `/api/bd/service-lines?masterCode=${wizardData.opportunityDetails.serviceLine}`
      );
      if (!res.ok) throw new Error('Failed to fetch service lines');
      const result = await res.json();
      return result.data || [];
    },
    enabled: !!wizardData.opportunityDetails.serviceLine,
  });

  // Fetch stages
  const { data: stagesData } = useQuery({
    queryKey: ['bd-stages', wizardData.opportunityDetails.serviceLine],
    queryFn: async () => {
      const res = await fetch(
        `/api/bd/stages?serviceLine=${wizardData.opportunityDetails.serviceLine}`
      );
      if (!res.ok) throw new Error('Failed to fetch stages');
      const result = await res.json();
      return result.data || [];
    },
  });

  const handleNext = () => {
    updateWizardData({
      opportunityDetails: {
        ...wizardData.opportunityDetails,
        title,
        servLineCode: selectedServLineCode,
        description: description || undefined,
        value: value ? parseFloat(value) : undefined,
        probability: probability ? parseFloat(probability) : undefined,
        expectedCloseDate: expectedCloseDate || undefined,
        source: source || undefined,
        stageId: stageId || wizardData.opportunityDetails.stageId,
        // Assignment scheduling
        assignmentType: assignmentType as 'ONCE_OFF' | 'RECURRING' | undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        recurringFrequency: assignmentType === 'RECURRING' ? (recurringFrequency as 'MONTHLY' | 'QUARTERLY' | 'BI_ANNUALLY' | 'YEARLY') : undefined,
      },
    });
    onNext();
  };

  const canProceed = 
    title.trim() !== '' && 
    stageId > 0 && 
    selectedServLineCode !== '' &&
    assignmentType !== '' &&
    startDate !== '' &&
    (assignmentType === 'RECURRING' || endDate !== '') && // End date required for once-off
    (assignmentType === 'ONCE_OFF' || recurringFrequency !== ''); // Frequency required for recurring

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-forvis-gray-900 mb-2">
          Opportunity Details
        </h3>
        <p className="text-sm text-forvis-gray-600">
          Provide details about the business development opportunity.
        </p>
      </div>

      <div className="space-y-4">
        {/* Title */}
        <Input
          label="Opportunity Title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Tax Advisory Services for Q4 2024"
          required
        />

        {/* Service Line Selection */}
        <div>
          <label className="block text-sm font-medium text-forvis-gray-700 mb-2">
            Service Line *
          </label>
          <select
            value={selectedServLineCode}
            onChange={(e) => setSelectedServLineCode(e.target.value)}
            className="w-full px-4 py-2 border border-forvis-gray-300 rounded-lg focus:ring-2 focus:ring-forvis-blue-500 focus:border-forvis-blue-500"
            required
          >
            <option value="">Select service line...</option>
            {serviceLinesData?.map((sl: any) => (
              <option key={sl.ServLineCode} value={sl.ServLineCode}>
                {sl.ServLineDesc}
              </option>
            ))}
          </select>
          <p className="text-xs text-forvis-gray-500 mt-1">
            Select the specific service line for this opportunity
          </p>
        </div>

        {/* Assignment Scheduling Section */}
        <div className="bg-forvis-gray-50 rounded-lg p-4 border border-forvis-gray-200">
          <h4 className="text-sm font-semibold text-forvis-gray-900 mb-3">
            Assignment Schedule
          </h4>
          
          {/* Assignment Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-forvis-gray-700 mb-2">
              Assignment Type *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="assignmentType"
                  value="ONCE_OFF"
                  checked={assignmentType === 'ONCE_OFF'}
                  onChange={(e) => setAssignmentType(e.target.value)}
                  className="h-4 w-4 text-forvis-blue-600 focus:ring-forvis-blue-500 border-forvis-gray-300"
                />
                <span className="ml-2 text-sm text-forvis-gray-700">Once-Off</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="assignmentType"
                  value="RECURRING"
                  checked={assignmentType === 'RECURRING'}
                  onChange={(e) => setAssignmentType(e.target.value)}
                  className="h-4 w-4 text-forvis-blue-600 focus:ring-forvis-blue-500 border-forvis-gray-300"
                />
                <span className="ml-2 text-sm text-forvis-gray-700">Recurring</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-forvis-gray-700 mb-2">
                Assignment Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-forvis-gray-300 rounded-lg focus:ring-2 focus:ring-forvis-blue-500 focus:border-forvis-blue-500"
                required
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-forvis-gray-700 mb-2">
                Assignment End Date {assignmentType === 'ONCE_OFF' && '*'}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-forvis-gray-300 rounded-lg focus:ring-2 focus:ring-forvis-blue-500 focus:border-forvis-blue-500"
                required={assignmentType === 'ONCE_OFF'}
              />
              {assignmentType === 'ONCE_OFF' && (
                <p className="text-xs text-forvis-gray-500 mt-1">
                  Required for once-off assignments
                </p>
              )}
            </div>
          </div>

          {/* Recurring Frequency - Only show for recurring assignments */}
          {assignmentType === 'RECURRING' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-forvis-gray-700 mb-2">
                Recurring Frequency *
              </label>
              <select
                value={recurringFrequency}
                onChange={(e) => setRecurringFrequency(e.target.value)}
                className="w-full px-4 py-2 border border-forvis-gray-300 rounded-lg focus:ring-2 focus:ring-forvis-blue-500 focus:border-forvis-blue-500"
                required
              >
                <option value="">Select frequency...</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="BI_ANNUALLY">Bi-Annually</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-forvis-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the opportunity..."
            rows={4}
            className="w-full px-4 py-2 border border-forvis-gray-300 rounded-lg focus:ring-2 focus:ring-forvis-blue-500 focus:border-forvis-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Value */}
          <Input
            label="Estimated Value"
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
          />

          {/* Probability */}
          <div>
            <label className="block text-sm font-medium text-forvis-gray-700 mb-2">
              Probability (%)
            </label>
            <input
              type="number"
              value={probability}
              onChange={(e) => setProbability(e.target.value)}
              placeholder="0"
              min="0"
              max="100"
              step="1"
              className="w-full px-4 py-2 border border-forvis-gray-300 rounded-lg focus:ring-2 focus:ring-forvis-blue-500 focus:border-forvis-blue-500"
            />
          </div>
        </div>

        {/* Expected Close Date */}
        <Input
          label="Expected Close Date"
          type="date"
          value={expectedCloseDate}
          onChange={(e) => setExpectedCloseDate(e.target.value)}
        />

        {/* Source */}
        <div>
          <label className="block text-sm font-medium text-forvis-gray-700 mb-2">
            Source
          </label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full px-4 py-2 border border-forvis-gray-300 rounded-lg focus:ring-2 focus:ring-forvis-blue-500 focus:border-forvis-blue-500"
          >
            <option value="">Select source...</option>
            <option value="Referral">Referral</option>
            <option value="Website">Website</option>
            <option value="Cold Call">Cold Call</option>
            <option value="Event">Event</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Stage */}
        <div>
          <label className="block text-sm font-medium text-forvis-gray-700 mb-2">
            Initial Stage *
          </label>
          <select
            value={stageId}
            onChange={(e) => setStageId(parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-forvis-gray-300 rounded-lg focus:ring-2 focus:ring-forvis-blue-500 focus:border-forvis-blue-500"
            required
          >
            <option value="">Select stage...</option>
            {stagesData
              ?.filter(
                (stage: any) =>
                  !stage.name.toLowerCase().includes('proposal') &&
                  !stage.name.toLowerCase().includes('sent')
              )
              .map((stage: any) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
          </select>
          <p className="mt-1 text-sm text-forvis-gray-500">
            Note: Stage will auto-progress to "Proposal Sent" after completing the wizard
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-forvis-gray-200 mt-8">
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
