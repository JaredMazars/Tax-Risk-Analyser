/**
 * BD Opportunity Detail Modal
 * Modal version of the opportunity detail page for viewing and editing opportunities
 * without leaving the Kanban board
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Edit, Save, FileCheck } from 'lucide-react';
import { useOpportunity, useUpdateOpportunity, useConvertOpportunity } from '@/hooks/bd/useOpportunities';
import { useActivities } from '@/hooks/bd/useActivities';
import { 
  formatServiceLineName, 
  getServiceLineColor, 
  getServiceLineBgColor,
  getServiceLineBorderColor 
} from '@/lib/utils/serviceLineUtils';
import { formatAmount } from '@/lib/utils/formatters';
import type { ActivityWithRelations } from '@/lib/services/bd/activityService';
import { AlertModal } from '@/components/shared/AlertModal';
import { LoadingSpinner, Button } from '@/components/ui';
import { GRADIENTS } from '@/lib/design-system/gradients';

interface OpportunityDetailModalProps {
  isOpen: boolean;
  opportunityId: number;
  serviceLine: string;
  onClose: () => void;
}

type TabId = 'overview' | 'schedule' | 'financial' | 'stage' | 'contact' | 'activities';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

export function OpportunityDetailModal({
  isOpen,
  opportunityId,
  serviceLine,
  onClose,
}: OpportunityDetailModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [isServiceLineModalOpen, setIsServiceLineModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [selectedServiceLine, setSelectedServiceLine] = useState<string>('');
  const [createProject, setCreateProject] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state for editing
  const [formData, setFormData] = useState({
    title: '',
    companyName: '',
    description: '',
    value: 0,
    probability: 0,
    expectedCloseDate: '',
    source: '',
    assignmentType: '',
    startDate: '',
    endDate: '',
    recurringFrequency: '',
  });

  // Modal state
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant?: 'success' | 'error' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info',
  });

  const { data: opportunity, isLoading } = useOpportunity(opportunityId);
  const { data: activitiesData } = useActivities({ opportunityId, page: 1, pageSize: 10 });
  const updateOpportunity = useUpdateOpportunity(opportunityId);
  const convertOpportunity = useConvertOpportunity(opportunityId);

  // Update form data when opportunity loads
  useEffect(() => {
    if (opportunity) {
      setFormData({
        title: opportunity.title,
        companyName: opportunity.companyName || '',
        description: opportunity.description || '',
        value: opportunity.value || 0,
        probability: opportunity.probability || opportunity.BDStage.probability,
        expectedCloseDate: (opportunity.expectedCloseDate 
          ? new Date(opportunity.expectedCloseDate).toISOString().split('T')[0]
          : '') as string,
        source: opportunity.source || '',
        assignmentType: opportunity.assignmentType || '',
        startDate: (opportunity.startDate 
          ? new Date(opportunity.startDate).toISOString().split('T')[0]
          : '') as string,
        endDate: (opportunity.endDate 
          ? new Date(opportunity.endDate).toISOString().split('T')[0]
          : '') as string,
        recurringFrequency: opportunity.recurringFrequency || '',
      });
    }
  }, [opportunity]);

  // Define tabs
  const tabs: Tab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'schedule',
      label: 'Assignment Schedule',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'financial',
      label: 'Financial Details',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'stage',
      label: 'Stage & Progress',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'contact',
      label: 'Contact',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 'activities',
      label: 'Activities',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !isConvertModalOpen && !isServiceLineModalOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, isConvertModalOpen, isServiceLineModalOpen, onClose]);

  const handleSave = async () => {
    try {
      await updateOpportunity.mutateAsync({
        title: formData.title,
        description: formData.description || undefined,
        companyName: formData.companyName || undefined,
        serviceLine: opportunity!.serviceLine,
        stageId: opportunity!.stageId,
        value: formData.value || undefined,
        probability: formData.probability || undefined,
        expectedCloseDate: formData.expectedCloseDate ? new Date(formData.expectedCloseDate) : undefined,
        source: (formData.source || undefined) as 'REFERRAL' | 'WEBSITE' | 'COLD_CALL' | 'NETWORKING' | 'EXISTING_CLIENT' | 'OTHER' | undefined,
        assignmentType: formData.assignmentType as 'ONCE_OFF' | 'RECURRING' | undefined,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        recurringFrequency: formData.assignmentType === 'RECURRING' 
          ? (formData.recurringFrequency as 'MONTHLY' | 'QUARTERLY' | 'BI_ANNUALLY' | 'YEARLY') 
          : undefined,
      });
      setIsEditing(false);
      setAlertModal({
        isOpen: true,
        title: 'Success',
        message: 'Opportunity updated successfully',
        variant: 'success',
      });
    } catch (error) {
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to update opportunity. Please try again.',
        variant: 'error',
      });
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    if (opportunity) {
      setFormData({
        title: opportunity.title,
        companyName: opportunity.companyName || '',
        description: opportunity.description || '',
        value: opportunity.value || 0,
        probability: opportunity.probability || opportunity.BDStage.probability,
        expectedCloseDate: (opportunity.expectedCloseDate 
          ? new Date(opportunity.expectedCloseDate).toISOString().split('T')[0]
          : '') as string,
        source: opportunity.source || '',
        assignmentType: opportunity.assignmentType || '',
        startDate: (opportunity.startDate 
          ? new Date(opportunity.startDate).toISOString().split('T')[0]
          : '') as string,
        endDate: (opportunity.endDate 
          ? new Date(opportunity.endDate).toISOString().split('T')[0]
          : '') as string,
        recurringFrequency: opportunity.recurringFrequency || '',
      });
    }
    setIsEditing(false);
  };

  const handleServiceLineChange = async () => {
    if (!selectedServiceLine || selectedServiceLine === opportunity?.serviceLine) {
      setIsServiceLineModalOpen(false);
      return;
    }

    try {
      await updateOpportunity.mutateAsync({
        title: opportunity!.title,
        description: opportunity!.description || undefined,
        GSClientID: opportunity!.GSClientID || undefined,
        companyName: opportunity!.companyName || undefined,
        serviceLine: selectedServiceLine as 'TAX' | 'AUDIT' | 'ACCOUNTING' | 'ADVISORY' | 'QRM' | 'BUSINESS_DEV' | 'IT' | 'FINANCE' | 'HR',
        stageId: opportunity!.stageId,
        value: opportunity!.value || undefined,
        probability: opportunity!.probability || undefined,
        expectedCloseDate: opportunity!.expectedCloseDate ? new Date(opportunity!.expectedCloseDate) : undefined,
        source: opportunity!.source || undefined,
      });
      setIsServiceLineModalOpen(false);
    } catch (error) {
      console.error('Failed to update service line:', error);
    }
  };

  const handleConvertToClient = async () => {
    try {
      const result = await convertOpportunity.mutateAsync({
        createTask: createProject,
      });
      setIsConvertModalOpen(false);
      
      // Show alert about client acceptance if needed
      if (result.needsClientAcceptance) {
        setAlertModal({
          isOpen: true,
          title: 'Client Acceptance Required',
          message: `Client has been created successfully. However, Client Acceptance must be completed before creating tasks or engagements. You will be redirected to the client page where you can complete the Client Acceptance assessment.`,
          variant: 'warning',
        });
        
        // Close modal and navigate after showing message
        setTimeout(() => {
          onClose();
          if (result.client) {
            router.push(`/dashboard/${serviceLine}/clients/${result.client.GSClientID}`);
          }
        }, 3000);
      } else {
        // Navigate immediately if acceptance already exists
        onClose();
        if (result.client) {
          router.push(`/dashboard/${serviceLine}/clients/${result.client.GSClientID}`);
        }
      }
    } catch (error) {
      console.error('Failed to convert opportunity:', error);
      setAlertModal({
        isOpen: true,
        title: 'Conversion Failed',
        message: 'Failed to convert opportunity to client. Please try again.',
        variant: 'error',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Backdrop and Container */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-corporate-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-forvis-gray-200">
            <h2 className="text-xl font-semibold text-forvis-gray-900">
              {isLoading ? 'Loading...' : opportunity?.title || 'Opportunity Details'}
            </h2>
            <button
              onClick={onClose}
              className="text-forvis-gray-400 hover:text-forvis-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Tabs Navigation */}
          {!isLoading && opportunity && (
            <div className="border-b border-forvis-gray-200 px-6">
              <div className="flex space-x-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                      activeTab === tab.id
                        ? 'border-forvis-blue-500 text-forvis-blue-600'
                        : 'border-transparent text-forvis-gray-600 hover:text-forvis-gray-900 hover:border-forvis-gray-300'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Modal Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : !opportunity ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold text-forvis-gray-900 mb-2">
                  Opportunity not found
                </h3>
                <p className="text-sm text-forvis-gray-600">
                  This opportunity may have been deleted or you don't have access to it.
                </p>
              </div>
            ) : (
              <>
                {/* Action Buttons - Always visible at top */}
                <div className="flex justify-end gap-3 pb-4 border-b border-forvis-gray-200">
                  {isEditing ? (
                    <>
                      <Button
                        variant="secondary"
                        onClick={handleCancel}
                      >
                        <X className="w-5 h-5" />
                        Cancel
                      </Button>
                      <Button
                        variant="gradient"
                        onClick={handleSave}
                        disabled={updateOpportunity.isPending}
                      >
                        <Save className="w-5 h-5" />
                        {updateOpportunity.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit className="w-5 h-5" />
                        Edit
                      </Button>
                      {opportunity.status !== 'WON' && !opportunity.convertedToGSClientID && (
                        <Button
                          variant="gradient"
                          onClick={() => setIsConvertModalOpen(true)}
                        >
                          <FileCheck className="w-5 h-5" />
                          Convert to Client
                        </Button>
                      )}
                      {opportunity.convertedToGSClientID && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-forvis-success-700 bg-forvis-success-50 border border-forvis-success-200 rounded-lg">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Converted to Client
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Tab Content */}
                <div className="pt-4">
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      {isEditing ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-forvis-gray-700 mb-2">
                              Title *
                            </label>
                            <input
                              type="text"
                              value={formData.title}
                              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                              className="w-full px-4 py-2.5 bg-white text-forvis-gray-900 border-2 border-forvis-blue-200 rounded-lg focus:border-forvis-blue-500 focus:ring-2 focus:ring-forvis-blue-200 transition-colors"
                              placeholder="Enter opportunity title"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-forvis-gray-700 mb-2">
                              Company Name
                            </label>
                            <input
                              type="text"
                              value={formData.companyName}
                              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                              className="w-full px-4 py-2.5 bg-white text-forvis-gray-900 border-2 border-forvis-blue-200 rounded-lg focus:border-forvis-blue-500 focus:ring-2 focus:ring-forvis-blue-200 transition-colors"
                              placeholder="Enter company name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-forvis-gray-700 mb-2">
                              Description
                            </label>
                            <textarea
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              rows={5}
                              className="w-full px-4 py-2.5 bg-white text-forvis-gray-900 border-2 border-forvis-blue-200 rounded-lg focus:border-forvis-blue-500 focus:ring-2 focus:ring-forvis-blue-200 transition-colors"
                              placeholder="Enter opportunity description"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div>
                            <div className="flex items-center gap-3 mb-3">
                              <h2 className="text-2xl font-semibold text-forvis-gray-900">{opportunity.title}</h2>
                              <button
                                onClick={() => {
                                  setSelectedServiceLine(opportunity.serviceLine);
                                  setIsServiceLineModalOpen(true);
                                }}
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border-2 transition-all hover:shadow-md ${getServiceLineBgColor(opportunity.serviceLine)} ${getServiceLineColor(opportunity.serviceLine)} ${getServiceLineBorderColor(opportunity.serviceLine)}`}
                                title="Click to change service line"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                {formatServiceLineName(opportunity.serviceLine)}
                              </button>
                            </div>
                            {opportunity.companyName && (
                              <p className="text-lg font-medium text-forvis-gray-700 mb-3">{opportunity.companyName}</p>
                            )}
                          </div>

                          {opportunity.description && (
                            <div className="bg-white rounded-lg border border-forvis-gray-200 shadow-corporate p-4">
                              <h3 className="text-sm font-semibold text-forvis-gray-900 mb-2">Description</h3>
                              <p className="text-sm text-forvis-gray-700 whitespace-pre-wrap">{opportunity.description}</p>
                            </div>
                          )}

                          {!opportunity.description && (
                            <div className="text-center py-8 text-forvis-gray-500">
                              <p className="text-sm">No description provided</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Assignment Schedule Tab */}
                  {activeTab === 'schedule' && (
                    <div className="space-y-6">
                      {isEditing ? (
                        <div className="space-y-6">
                          {/* Assignment Type */}
                          <div className="bg-forvis-gray-50 rounded-lg p-4 border border-forvis-gray-200">
                            <h4 className="text-sm font-semibold text-forvis-gray-900 mb-3">
                              Assignment Type
                            </h4>
                            <div className="flex gap-4">
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="radio"
                                  name="assignmentType"
                                  value="ONCE_OFF"
                                  checked={formData.assignmentType === 'ONCE_OFF'}
                                  onChange={(e) => setFormData({ ...formData, assignmentType: e.target.value })}
                                  className="h-4 w-4 text-forvis-blue-600 focus:ring-forvis-blue-500 border-forvis-gray-300"
                                />
                                <span className="ml-2 text-sm text-forvis-gray-700">Once-Off</span>
                              </label>
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="radio"
                                  name="assignmentType"
                                  value="RECURRING"
                                  checked={formData.assignmentType === 'RECURRING'}
                                  onChange={(e) => setFormData({ ...formData, assignmentType: e.target.value })}
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
                                Assignment Start Date
                              </label>
                              <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white text-forvis-gray-900 border-2 border-forvis-blue-200 rounded-lg focus:border-forvis-blue-500 focus:ring-2 focus:ring-forvis-blue-200 transition-colors"
                              />
                            </div>

                            {/* End Date */}
                            <div>
                              <label className="block text-sm font-medium text-forvis-gray-700 mb-2">
                                Assignment End Date {formData.assignmentType === 'ONCE_OFF' && '*'}
                              </label>
                              <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white text-forvis-gray-900 border-2 border-forvis-blue-200 rounded-lg focus:border-forvis-blue-500 focus:ring-2 focus:ring-forvis-blue-200 transition-colors"
                              />
                              {formData.assignmentType === 'ONCE_OFF' && (
                                <p className="text-xs text-forvis-gray-500 mt-1">
                                  Required for once-off assignments
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Recurring Frequency - Only show for recurring assignments */}
                          {formData.assignmentType === 'RECURRING' && (
                            <div>
                              <label className="block text-sm font-medium text-forvis-gray-700 mb-2">
                                Recurring Frequency *
                              </label>
                              <select
                                value={formData.recurringFrequency}
                                onChange={(e) => setFormData({ ...formData, recurringFrequency: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white text-forvis-gray-900 border-2 border-forvis-blue-200 rounded-lg focus:border-forvis-blue-500 focus:ring-2 focus:ring-forvis-blue-200 transition-colors"
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
                      ) : (
                        <div className="space-y-6">
                          {opportunity.assignmentType ? (
                            <>
                              <div className="bg-white rounded-lg border border-forvis-gray-200 shadow-corporate p-6">
                                <p className="text-xs font-medium text-forvis-gray-600 uppercase tracking-wider mb-2">Assignment Type</p>
                                <p className="text-2xl font-bold text-forvis-gray-900">
                                  {opportunity.assignmentType === 'ONCE_OFF' ? 'Once-Off Assignment' : 'Recurring Assignment'}
                                </p>
                                {opportunity.assignmentType === 'RECURRING' && opportunity.recurringFrequency && (
                                  <p className="text-sm text-forvis-gray-600 mt-2">
                                    Frequency: {opportunity.recurringFrequency.replace('_', ' ')}
                                  </p>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {opportunity.startDate && (
                                  <div className="bg-white rounded-lg border border-forvis-gray-200 shadow-corporate p-6">
                                    <p className="text-xs font-medium text-forvis-gray-600 uppercase tracking-wider mb-2">Start Date</p>
                                    <p className="text-lg font-bold text-forvis-gray-900">
                                      {new Date(opportunity.startDate).toLocaleDateString('en-US', { 
                                        month: 'long', 
                                        day: 'numeric', 
                                        year: 'numeric' 
                                      })}
                                    </p>
                                  </div>
                                )}

                                {opportunity.endDate && (
                                  <div className="bg-white rounded-lg border border-forvis-gray-200 shadow-corporate p-6">
                                    <p className="text-xs font-medium text-forvis-gray-600 uppercase tracking-wider mb-2">End Date</p>
                                    <p className="text-lg font-bold text-forvis-gray-900">
                                      {new Date(opportunity.endDate).toLocaleDateString('en-US', { 
                                        month: 'long', 
                                        day: 'numeric', 
                                        year: 'numeric' 
                                      })}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {opportunity.startDate && opportunity.endDate && opportunity.assignmentType === 'ONCE_OFF' && (
                                <div className="bg-forvis-blue-50 border border-forvis-blue-200 rounded-lg p-4">
                                  <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-forvis-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                      <p className="text-sm font-medium text-forvis-blue-900">Duration</p>
                                      <p className="text-sm text-forvis-blue-800 mt-1">
                                        {Math.ceil((new Date(opportunity.endDate).getTime() - new Date(opportunity.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-center py-12">
                              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-forvis-gray-100 mx-auto mb-4">
                                <svg className="w-8 h-8 text-forvis-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <h3 className="text-lg font-semibold text-forvis-gray-900 mb-2">No Assignment Schedule</h3>
                              <p className="text-sm text-forvis-gray-600">No assignment scheduling information has been configured for this opportunity.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Financial Tab */}
                  {activeTab === 'financial' && (
                    <div className="space-y-6">
                      {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-forvis-gray-700 mb-2">
                              Value
                            </label>
                            <input
                              type="number"
                              value={formData.value}
                              onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                              className="w-full px-4 py-2.5 bg-white text-forvis-gray-900 border-2 border-forvis-blue-200 rounded-lg focus:border-forvis-blue-500 focus:ring-2 focus:ring-forvis-blue-200 transition-colors"
                              placeholder="0.00"
                              step="0.01"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-forvis-gray-700 mb-2">
                              Probability (%)
                            </label>
                            <input
                              type="number"
                              value={formData.probability}
                              onChange={(e) => setFormData({ ...formData, probability: parseFloat(e.target.value) || 0 })}
                              className="w-full px-4 py-2.5 bg-white text-forvis-gray-900 border-2 border-forvis-blue-200 rounded-lg focus:border-forvis-blue-500 focus:ring-2 focus:ring-forvis-blue-200 transition-colors"
                              placeholder="0"
                              min="0"
                              max="100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-forvis-gray-700 mb-2">
                              Expected Close Date
                            </label>
                            <input
                              type="date"
                              value={formData.expectedCloseDate}
                              onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                              className="w-full px-4 py-2.5 bg-white text-forvis-gray-900 border-2 border-forvis-blue-200 rounded-lg focus:border-forvis-blue-500 focus:ring-2 focus:ring-forvis-blue-200 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-forvis-gray-700 mb-2">
                              Source
                            </label>
                            <input
                              type="text"
                              value={formData.source}
                              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                              className="w-full px-4 py-2.5 bg-white text-forvis-gray-900 border-2 border-forvis-blue-200 rounded-lg focus:border-forvis-blue-500 focus:ring-2 focus:ring-forvis-blue-200 transition-colors"
                              placeholder="e.g., Referral, Website, Cold Call"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white rounded-lg border border-forvis-gray-200 shadow-corporate p-6">
                            <p className="text-xs font-medium text-forvis-gray-600 uppercase tracking-wider mb-2">Estimated Value</p>
                            <p className="text-3xl font-bold text-forvis-blue-600">
                              {opportunity.value ? formatAmount(opportunity.value) : 'N/A'}
                            </p>
                          </div>

                          <div className="bg-white rounded-lg border border-forvis-gray-200 shadow-corporate p-6">
                            <p className="text-xs font-medium text-forvis-gray-600 uppercase tracking-wider mb-2">Probability</p>
                            <p className="text-3xl font-bold text-forvis-gray-900">
                              {opportunity.probability || opportunity.BDStage.probability}%
                            </p>
                          </div>

                          <div className="bg-white rounded-lg border border-forvis-gray-200 shadow-corporate p-6">
                            <p className="text-xs font-medium text-forvis-gray-600 uppercase tracking-wider mb-2">Expected Revenue</p>
                            <p className="text-3xl font-bold text-forvis-success-600">
                              {opportunity.value 
                                ? formatAmount(opportunity.value * ((opportunity.probability || opportunity.BDStage.probability) / 100))
                                : 'N/A'}
                            </p>
                            <p className="text-xs text-forvis-gray-500 mt-1">Value × Probability</p>
                          </div>

                          <div className="bg-white rounded-lg border border-forvis-gray-200 shadow-corporate p-6">
                            <p className="text-xs font-medium text-forvis-gray-600 uppercase tracking-wider mb-2">Expected Close</p>
                            <p className="text-lg font-bold text-forvis-gray-900">
                              {opportunity.expectedCloseDate 
                                ? new Date(opportunity.expectedCloseDate).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                  })
                                : 'Not set'}
                            </p>
                          </div>

                          {opportunity.source && (
                            <div className="bg-white rounded-lg border border-forvis-gray-200 shadow-corporate p-6 md:col-span-2">
                              <p className="text-xs font-medium text-forvis-gray-600 uppercase tracking-wider mb-2">Source</p>
                              <p className="text-lg font-medium text-forvis-gray-900">{opportunity.source}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stage & Progress Tab */}
                  {activeTab === 'stage' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg border border-forvis-gray-200 shadow-corporate p-6">
                          <p className="text-xs font-medium text-forvis-gray-600 uppercase tracking-wider mb-2">Current Stage</p>
                          <p className="text-2xl font-bold text-forvis-gray-900">{opportunity.BDStage.name}</p>
                          <p className="text-sm text-forvis-gray-600 mt-2">{opportunity.BDStage.description || 'No description'}</p>
                        </div>

                        <div className="bg-white rounded-lg border border-forvis-gray-200 shadow-corporate p-6">
                          <p className="text-xs font-medium text-forvis-gray-600 uppercase tracking-wider mb-2">Status</p>
                          <p className="text-2xl font-bold text-forvis-gray-900">{opportunity.status}</p>
                          {opportunity.convertedToGSClientID && (
                            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-forvis-success-700 bg-forvis-success-50 border border-forvis-success-200 rounded-lg">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Converted to Client
                            </div>
                          )}
                        </div>

                        <div className="bg-white rounded-lg border border-forvis-gray-200 shadow-corporate p-6">
                          <p className="text-xs font-medium text-forvis-gray-600 uppercase tracking-wider mb-2">Created Date</p>
                          <p className="text-lg font-bold text-forvis-gray-900">
                            {new Date(opportunity.createdAt).toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </p>
                          <p className="text-xs text-forvis-gray-500 mt-1">
                            {Math.floor((Date.now() - new Date(opportunity.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
                          </p>
                        </div>

                        <div className="bg-white rounded-lg border border-forvis-gray-200 shadow-corporate p-6">
                          <p className="text-xs font-medium text-forvis-gray-600 uppercase tracking-wider mb-2">Last Updated</p>
                          <p className="text-lg font-bold text-forvis-gray-900">
                            {new Date(opportunity.updatedAt).toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </p>
                          <p className="text-xs text-forvis-gray-500 mt-1">
                            {Math.floor((Date.now() - new Date(opportunity.updatedAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
                          </p>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg border border-forvis-gray-200 shadow-corporate p-6">
                        <h3 className="text-sm font-semibold text-forvis-gray-900 mb-3">Service Line</h3>
                        <button
                          onClick={() => {
                            setSelectedServiceLine(opportunity.serviceLine);
                            setIsServiceLineModalOpen(true);
                          }}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border-2 transition-all hover:shadow-md ${getServiceLineBgColor(opportunity.serviceLine)} ${getServiceLineColor(opportunity.serviceLine)} ${getServiceLineBorderColor(opportunity.serviceLine)}`}
                          title="Click to change service line"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {formatServiceLineName(opportunity.serviceLine)}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Contact Tab */}
                  {activeTab === 'contact' && (
                    <div className="space-y-6">
                      {opportunity.BDContact ? (
                        <div className="bg-white rounded-lg border border-forvis-gray-200 shadow-corporate p-6">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: GRADIENTS.primary.diagonal }}>
                              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold text-forvis-gray-900">
                                {opportunity.BDContact.firstName} {opportunity.BDContact.lastName}
                              </h3>
                              {opportunity.BDContact.title && (
                                <p className="text-sm text-forvis-gray-600">{opportunity.BDContact.title}</p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-4">
                            {opportunity.BDContact.email && (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-forvis-blue-50">
                                  <svg className="w-5 h-5 text-forvis-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-xs text-forvis-gray-600">Email</p>
                                  <a href={`mailto:${opportunity.BDContact.email}`} className="text-sm font-medium text-forvis-blue-600 hover:text-forvis-blue-700">
                                    {opportunity.BDContact.email}
                                  </a>
                                </div>
                              </div>
                            )}

                            {opportunity.BDContact.phone && (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-forvis-blue-50">
                                  <svg className="w-5 h-5 text-forvis-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-xs text-forvis-gray-600">Phone</p>
                                  <a href={`tel:${opportunity.BDContact.phone}`} className="text-sm font-medium text-forvis-blue-600 hover:text-forvis-blue-700">
                                    {opportunity.BDContact.phone}
                                  </a>
                                </div>
                              </div>
                            )}

                            {opportunity.companyName && (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-forvis-blue-50">
                                  <svg className="w-5 h-5 text-forvis-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-xs text-forvis-gray-600">Company</p>
                                  <p className="text-sm font-medium text-forvis-gray-900">{opportunity.companyName}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-forvis-gray-100 mx-auto mb-4">
                            <svg className="w-8 h-8 text-forvis-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-forvis-gray-900 mb-2">No Contact Information</h3>
                          <p className="text-sm text-forvis-gray-600">No contact has been assigned to this opportunity yet.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Activities Tab */}
                  {activeTab === 'activities' && (
                    <div className="space-y-4">
                      {activitiesData && activitiesData.activities.length > 0 ? (
                        <div className="space-y-3">
                          {activitiesData.activities.map((activity: ActivityWithRelations) => (
                            <div key={activity.id} className="bg-white rounded-lg border border-forvis-gray-200 shadow-corporate p-4">
                              <div className="flex gap-3">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-forvis-blue-50">
                                  <svg
                                    className="w-5 h-5 text-forvis-blue-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </div>
                                <div className="flex-grow">
                                  <p className="text-sm font-semibold text-forvis-gray-900">
                                    {activity.subject}
                                  </p>
                                  <p className="text-xs text-forvis-gray-600 mt-1">
                                    {activity.activityType} • {new Date(activity.createdAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                  {activity.description && (
                                    <p className="text-sm text-forvis-gray-700 mt-2">{activity.description}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-forvis-gray-100 mx-auto mb-4">
                            <svg className="w-8 h-8 text-forvis-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-forvis-gray-900 mb-2">No Activities Yet</h3>
                          <p className="text-sm text-forvis-gray-600">There are no activities recorded for this opportunity.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Convert to Client Sub-Modal */}
      {isConvertModalOpen && opportunity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-white border-b border-forvis-gray-200 px-6 py-4 flex justify-between items-center rounded-t-lg">
              <h2 className="text-xl font-semibold text-forvis-gray-900">Convert to Client</h2>
              <button
                onClick={() => setIsConvertModalOpen(false)}
                className="text-forvis-gray-400 hover:text-forvis-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-forvis-gray-700 mb-2">
                  This will create a new client record{opportunity.companyName ? ` for "${opportunity.companyName}"` : ''} 
                  {opportunity.Client ? ` linked to "${opportunity.Client.clientNameFull}"` : ''}.
                </p>
                {!opportunity.Client && !opportunity.companyName && (
                  <div className="bg-forvis-warning-50 border border-forvis-warning-200 rounded-lg p-3 mb-4">
                    <p className="text-xs text-forvis-warning-800">
                      <strong>Warning:</strong> This opportunity has no company name. Please edit the opportunity to add a company name before converting.
                    </p>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createProject}
                    onChange={(e) => setCreateProject(e.target.checked)}
                    className="mt-1 h-4 w-4 text-forvis-blue-600 border-forvis-gray-300 rounded focus:ring-forvis-blue-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-forvis-gray-900">Create initial project</p>
                    <p className="text-xs text-forvis-gray-600 mt-1">
                      Automatically create a project for this client in the {formatServiceLineName(opportunity.serviceLine)} service line
                    </p>
                  </div>
                </label>
              </div>

              <div className="bg-forvis-blue-50 border border-forvis-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-forvis-blue-800">
                  <strong>Note:</strong> This action will mark the opportunity as "WON" and link it to the new client record.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => setIsConvertModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="gradient"
                  onClick={handleConvertToClient}
                  disabled={convertOpportunity.isPending || (!opportunity.Client && !opportunity.companyName)}
                  loading={convertOpportunity.isPending}
                  className="flex-1"
                >
                  Convert to Client
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Line Change Sub-Modal */}
      {isServiceLineModalOpen && opportunity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-white border-b border-forvis-gray-200 px-6 py-4 flex justify-between items-center rounded-t-lg">
              <h2 className="text-xl font-semibold text-forvis-gray-900">Change Service Line</h2>
              <button
                onClick={() => setIsServiceLineModalOpen(false)}
                className="text-forvis-gray-400 hover:text-forvis-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-forvis-gray-600 mb-4">
                Select the service line that best classifies this opportunity.
              </p>
              
              <div className="space-y-2">
                {[
                  { value: 'TAX', label: 'Tax Services' },
                  { value: 'AUDIT', label: 'Audit Services' },
                  { value: 'ACCOUNTING', label: 'Accounting Services' },
                  { value: 'ADVISORY', label: 'Advisory Services' },
                  { value: 'QRM', label: 'Quality & Risk Management' },
                  { value: 'BUSINESS_DEV', label: 'Business Development & Marketing' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedServiceLine(option.value)}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                      selectedServiceLine === option.value
                        ? `${getServiceLineBgColor(option.value)} ${getServiceLineBorderColor(option.value)} ${getServiceLineColor(option.value)} font-bold`
                        : 'border-forvis-gray-200 hover:border-forvis-gray-300 bg-white text-forvis-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {option.label}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => setIsServiceLineModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="gradient"
                  onClick={handleServiceLineChange}
                  disabled={updateOpportunity.isPending}
                  loading={updateOpportunity.isPending}
                  className="flex-1"
                >
                  Save Change
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal((prev) => ({ ...prev, isOpen: false }))}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />
    </>
  );
}
