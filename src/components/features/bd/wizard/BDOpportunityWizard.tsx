/**
 * BD Opportunity Creation Wizard
 * Multi-step wizard for creating opportunities with separate workflows
 * for existing clients and new prospects
 */

'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { getGradient } from '@/lib/design-system/gradients';
import type { BDWizardData, WizardStep } from '@/types/bd-wizard';
import { ClientSelectionStep } from './steps/ClientSelectionStep';
import { ProspectDetailsStep } from './steps/ProspectDetailsStep';
import { TeamAssignmentStep } from './steps/TeamAssignmentStep';
import { ClientAcceptanceStep } from './steps/ClientAcceptanceStep';
import { OpportunityDetailsStep } from './steps/OpportunityDetailsStep';
import { ProposalTypeStep } from './steps/ProposalTypeStep';
import { ProposalGenerationStep } from './steps/ProposalGenerationStep';
import { ReviewStep } from './steps/ReviewStep';
import { Banner } from '@/components/ui';

interface BDOpportunityWizardProps {
  isOpen: boolean;
  serviceLine: string;
  opportunityId?: number | null; // For resuming draft opportunities
  onComplete: () => void;
  onCancel: () => void;
}

export function BDOpportunityWizard({
  isOpen,
  serviceLine,
  opportunityId: externalOpportunityId,
  onComplete,
  onCancel,
}: BDOpportunityWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [opportunityId, setOpportunityId] = useState<number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const [wizardData, setWizardData] = useState<BDWizardData>({
    workflowType: 'existing',
    opportunityDetails: {
      title: '',
      serviceLine,
      stageId: 0,
    },
    proposalType: 'quick',
  });

  // Define wizard steps with conditional visibility
  const allSteps: WizardStep[] = [
    {
      id: 1,
      label: 'Client Selection',
      component: ClientSelectionStep,
      required: () => true,
    },
    {
      id: 2,
      label: 'Prospect Details',
      component: ProspectDetailsStep,
      required: (data) => data.workflowType === 'prospect',
    },
    {
      id: 3,
      label: 'Team Assignment',
      component: TeamAssignmentStep,
      required: (data) => data.workflowType === 'prospect',
    },
    {
      id: 4,
      label: 'Client Acceptance',
      component: ClientAcceptanceStep,
      required: (data) => data.workflowType === 'prospect',
    },
    {
      id: 5,
      label: 'Opportunity Details',
      component: OpportunityDetailsStep,
      required: () => true,
    },
    {
      id: 6,
      label: 'Proposal Type',
      component: ProposalTypeStep,
      required: () => true,
    },
    {
      id: 7,
      label: 'Proposal',
      component: ProposalGenerationStep,
      required: () => true,
    },
    {
      id: 8,
      label: 'Review',
      component: ReviewStep,
      required: () => true,
    },
  ];

  const activeSteps = allSteps.filter((step) => step.required(wizardData));
  const currentStepIndex = activeSteps.findIndex((s) => s.id === currentStep);
  const currentStepConfig = activeSteps[currentStepIndex];

  // Initialize wizard session or load draft
  useEffect(() => {
    if (isOpen) {
      if (externalOpportunityId) {
        // Load existing draft
        loadDraftOpportunity(externalOpportunityId);
      } else if (!opportunityId) {
        // Create new wizard session
        initializeWizard();
      }
    } else {
      // Reset state when modal closes
      if (!externalOpportunityId) {
        setOpportunityId(null);
        setCurrentStep(1);
        setError(null);
      }
    }
  }, [isOpen, externalOpportunityId]);

  const initializeWizard = async () => {
    try {
      setIsInitializing(true);
      // Clear any stale opportunity ID
      setOpportunityId(null);
      
      const res = await fetch('/api/bd/wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceLine }),
      });

      if (!res.ok) {
        throw new Error('Failed to initialize wizard');
      }

      const result = await res.json();
      setOpportunityId(result.data.opportunityId);
      setWizardData((prev) => ({
        ...prev,
        ...result.data.wizardData,
      }));
      setError(null);
    } catch (err) {
      console.error('Failed to initialize wizard', err);
      setError('Failed to start wizard. Please try again.');
      // Ensure opportunityId is cleared on error
      setOpportunityId(null);
    } finally {
      setIsInitializing(false);
    }
  };

  const loadDraftOpportunity = async (id: number) => {
    try {
      setIsInitializing(true);
      const res = await fetch(`/api/bd/wizard/${id}`);
      
      if (!res.ok) {
        throw new Error('Failed to load draft opportunity');
      }

      const result = await res.json();
      const data = result.data;
      
      // Restore wizard state
      setOpportunityId(id);
      setCurrentStep(data.wizardStep || 1);
      
      if (data.wizardData) {
        try {
          const parsedData = JSON.parse(data.wizardData);
          setWizardData(parsedData);
        } catch (parseError) {
          console.error('Failed to parse wizard data', parseError);
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to load draft', err);
      setError('Failed to load draft opportunity. Please try again.');
    } finally {
      setIsInitializing(false);
    }
  };

  const updateWizardData = (updates: Partial<BDWizardData>) => {
    setWizardData((prev) => ({ ...prev, ...updates }));
  };

  const handleNext = async () => {
    if (!opportunityId) return;

    try {
      // Save progress to database
      await fetch(`/api/bd/wizard/${opportunityId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: currentStep,
          wizardData,
        }),
      });

      // Move to next step
      if (currentStepIndex < activeSteps.length - 1) {
        const nextStep = activeSteps[currentStepIndex + 1];
        if (nextStep) {
          setCurrentStep(nextStep.id);
        }
      }
    } catch (err) {
      console.error('Failed to save progress', err);
      setError('Failed to save progress. Please try again.');
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      const prevStep = activeSteps[currentStepIndex - 1];
      if (prevStep) {
        setCurrentStep(prevStep.id);
      }
    }
  };

  const handleComplete = async () => {
    if (!opportunityId) return;

    try {
      // Get stages to find "Proposal Sent" stage
      const stagesRes = await fetch(`/api/bd/stages?serviceLine=${serviceLine}`);
      const stagesData = await stagesRes.json();
      const stages = stagesData.data || [];

      // Find proposal-related stage or use current stage
      const proposalStage = stages.find(
        (s: any) =>
          s.name.toLowerCase().includes('proposal') ||
          s.name.toLowerCase().includes('sent')
      );
      const finalStageId =
        proposalStage?.id || wizardData.opportunityDetails.stageId;

      // Complete wizard
      const res = await fetch(`/api/bd/wizard/${opportunityId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finalStageId,
          wizardData,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to complete wizard');
      }

      onComplete();
    } catch (err) {
      console.error('Failed to complete wizard', err);
      setError('Failed to create opportunity. Please try again.');
    }
  };

  const handleClose = () => {
    // Show discard/save modal if we have a draft opportunity
    if (opportunityId) {
      setShowCancelModal(true);
    } else {
      onCancel();
    }
  };

  const handleDiscardDraft = async () => {
    if (opportunityId) {
      try {
        const res = await fetch(`/api/bd/opportunities/${opportunityId}`, {
          method: 'DELETE',
        });
        
        // Handle 404 gracefully - the draft might already be deleted or never existed
        if (res.status === 404) {
          console.warn('Draft opportunity not found, likely already deleted');
          setShowCancelModal(false);
          onCancel();
          return;
        }
        
        if (!res.ok) {
          throw new Error('Failed to delete draft');
        }
        
        setShowCancelModal(false);
        onCancel();
      } catch (err) {
        console.error('Failed to discard draft', err);
        setError('Failed to discard draft. Please try again.');
      }
    } else {
      // No opportunity ID means nothing was created, just close
      setShowCancelModal(false);
      onCancel();
    }
  };

  const handleSaveDraft = () => {
    setShowCancelModal(false);
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        onClick={handleClose}
      >
        <div 
          className="bg-white rounded-lg shadow-corporate-lg max-w-6xl w-full max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="px-6 py-4 border-b border-forvis-gray-200 flex items-center justify-between"
            style={{ background: getGradient('primary', 'horizontal') }}
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-white flex-shrink-0">
                New Opportunity
              </h2>
              {/* Stepper */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent px-2">
                {activeSteps.map((step, index) => (
                  <div key={step.id} className="flex items-center flex-shrink-0">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                        step.id === currentStep
                          ? 'bg-white text-forvis-blue-600'
                          : step.id < currentStep
                          ? 'bg-forvis-blue-200 text-forvis-blue-700'
                          : 'bg-forvis-blue-700 text-white'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span
                      className={`ml-2 text-sm font-medium ${
                        step.id === currentStep
                          ? 'text-white'
                          : 'text-forvis-blue-100'
                      } hidden lg:inline`}
                    >
                      {step.label}
                    </span>
                    {index < activeSteps.length - 1 && (
                      <div
                        className={`w-12 h-0.5 mx-3 ${
                          step.id < currentStep
                            ? 'bg-forvis-blue-200'
                            : 'bg-forvis-blue-700'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-forvis-gray-200 transition-colors"
              aria-label="Close wizard"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
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

            {isInitializing ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forvis-blue-600 mx-auto mb-4"></div>
                  <p className="text-forvis-gray-600">Initializing wizard...</p>
                </div>
              </div>
            ) : (
              currentStepConfig && (
                <currentStepConfig.component
                  wizardData={wizardData}
                  updateWizardData={updateWizardData}
                  onNext={currentStepIndex === activeSteps.length - 1 ? handleComplete : handleNext}
                  onBack={currentStepIndex > 0 ? handleBack : undefined}
                  opportunityId={opportunityId}
                />
              )
            )}
          </div>
        </div>
      </div>

      {/* Cancel/Discard Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setShowCancelModal(false)} />
            
            <div className="relative bg-white rounded-lg shadow-corporate-lg max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-forvis-gray-900 mb-2">
                Close Wizard
              </h3>
              <p className="text-sm text-forvis-gray-600 mb-6">
                What would you like to do with this opportunity? You can save it as a draft to continue later, or discard it permanently.
              </p>
              
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <Button 
                    onClick={handleDiscardDraft} 
                    variant="danger" 
                    className="flex-1"
                  >
                    Discard
                  </Button>
                  <Button 
                    onClick={handleSaveDraft} 
                    variant="gradient" 
                    className="flex-1"
                  >
                    Save Draft
                  </Button>
                </div>
                <Button 
                  onClick={() => setShowCancelModal(false)} 
                  variant="secondary"
                  className="w-full"
                >
                  Continue Editing
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
