/**
 * BD Wizard Step 1: Client Selection
 * Choose between existing client or new prospect
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Building2, UserPlus } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import type { StepProps, ClientSearchResult } from '@/types/bd-wizard';
import { useQuery } from '@tanstack/react-query';

export function ClientSelectionStep({
  wizardData,
  updateWizardData,
  onNext,
}: StepProps) {
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientSearchResult | null>(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const clientSearchRef = useRef<HTMLDivElement>(null);

  // Fetch clients based on search
  const { data: clientsData, isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients', 'search', clientSearch],
    queryFn: async () => {
      const res = await fetch(
        `/api/clients?search=${encodeURIComponent(clientSearch)}&limit=50`
      );
      if (!res.ok) throw new Error('Failed to fetch clients');
      const result = await res.json();
      return result.data?.clients || [];
    },
    enabled: wizardData.workflowType === 'existing' && clientSearch.length >= 2,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        clientSearchRef.current &&
        !clientSearchRef.current.contains(event.target as Node)
      ) {
        setShowClientDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleWorkflowTypeChange = (type: 'existing' | 'prospect') => {
    updateWizardData({
      workflowType: type,
      clientId: undefined,
    });
    setSelectedClient(null);
    setClientSearch('');
  };

  const handleClientSelect = (client: ClientSearchResult) => {
    setSelectedClient(client);
    setClientSearch(client.clientNameFull || '');
    setShowClientDropdown(false);
    updateWizardData({
      clientId: client.id,
    });
  };

  const handleNext = () => {
    if (wizardData.workflowType === 'existing' && !selectedClient) {
      return; // Cannot proceed without selecting a client
    }
    onNext();
  };

  const canProceed =
    wizardData.workflowType === 'prospect' ||
    (wizardData.workflowType === 'existing' && selectedClient);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-forvis-gray-900 mb-2">
          Select Opportunity Type
        </h3>
        <p className="text-sm text-forvis-gray-600">
          Choose whether this opportunity is for an existing client or a new prospect.
        </p>
      </div>

      {/* Workflow Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Existing Client Option */}
        <button
          type="button"
          onClick={() => handleWorkflowTypeChange('existing')}
          className={`p-6 border-2 rounded-lg transition-all ${
            wizardData.workflowType === 'existing'
              ? 'border-forvis-blue-600 bg-forvis-blue-50'
              : 'border-forvis-gray-300 hover:border-forvis-blue-400'
          }`}
        >
          <div className="flex flex-col items-center text-center">
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${
                wizardData.workflowType === 'existing'
                  ? 'bg-forvis-blue-600'
                  : 'bg-forvis-gray-200'
              }`}
            >
              <Building2
                className={`h-6 w-6 ${
                  wizardData.workflowType === 'existing'
                    ? 'text-white'
                    : 'text-forvis-gray-600'
                }`}
              />
            </div>
            <h4 className="text-base font-semibold text-forvis-gray-900 mb-1">
              Existing Client
            </h4>
            <p className="text-sm text-forvis-gray-600">
              Create opportunity for current client
            </p>
          </div>
        </button>

        {/* New Prospect Option */}
        <button
          type="button"
          onClick={() => handleWorkflowTypeChange('prospect')}
          className={`p-6 border-2 rounded-lg transition-all ${
            wizardData.workflowType === 'prospect'
              ? 'border-forvis-blue-600 bg-forvis-blue-50'
              : 'border-forvis-gray-300 hover:border-forvis-blue-400'
          }`}
        >
          <div className="flex flex-col items-center text-center">
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${
                wizardData.workflowType === 'prospect'
                  ? 'bg-forvis-blue-600'
                  : 'bg-forvis-gray-200'
              }`}
            >
              <UserPlus
                className={`h-6 w-6 ${
                  wizardData.workflowType === 'prospect'
                    ? 'text-white'
                    : 'text-forvis-gray-600'
                }`}
              />
            </div>
            <h4 className="text-base font-semibold text-forvis-gray-900 mb-1">
              New Prospect
            </h4>
            <p className="text-sm text-forvis-gray-600">
              Add prospect and create opportunity
            </p>
          </div>
        </button>
      </div>

      {/* Client Search (for existing client workflow) */}
      {wizardData.workflowType === 'existing' && (
        <div className="mb-8">
          <label className="block text-sm font-medium text-forvis-gray-700 mb-2">
            Search for Client *
          </label>
          <div className="relative" ref={clientSearchRef}>
            <div className="relative">
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setShowClientDropdown(true);
                }}
                onFocus={() => clientSearch.length >= 2 && setShowClientDropdown(true)}
                placeholder="Type client name or code..."
                className="w-full px-4 py-2 pl-10 border border-forvis-gray-300 rounded-lg focus:ring-2 focus:ring-forvis-blue-500 focus:border-forvis-blue-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-forvis-gray-400" />
            </div>

            {/* Client Dropdown */}
            {showClientDropdown && clientSearch.length >= 2 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-forvis-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                {isLoadingClients ? (
                  <div className="p-4 text-center text-forvis-gray-600">
                    Searching...
                  </div>
                ) : clientsData && clientsData.length > 0 ? (
                  <ul>
                    {clientsData.map((client: ClientSearchResult) => (
                      <li
                        key={client.id}
                        className="px-4 py-3 hover:bg-forvis-blue-50 cursor-pointer border-b border-forvis-gray-100 last:border-b-0"
                        onClick={() => handleClientSelect(client)}
                      >
                        <div className="font-medium text-forvis-gray-900">
                          {client.clientNameFull}
                        </div>
                        <div className="text-sm text-forvis-gray-600">
                          {client.clientCode} • {client.groupDesc}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-forvis-gray-600">
                    No clients found
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedClient && (
            <div className="mt-3 p-3 bg-forvis-success-50 border border-forvis-success-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-forvis-success-900">
                    {selectedClient.clientNameFull}
                  </div>
                  <div className="text-sm text-forvis-success-800">
                    {selectedClient.clientCode} • {selectedClient.groupDesc}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedClient(null);
                    setClientSearch('');
                    updateWizardData({ clientId: undefined });
                  }}
                  className="text-forvis-success-600 hover:text-forvis-success-800 text-sm font-medium"
                >
                  Change
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Prospect Info (for prospect workflow) */}
      {wizardData.workflowType === 'prospect' && (
        <div className="mb-8 p-4 bg-forvis-blue-50 border border-forvis-blue-200 rounded-lg">
          <p className="text-sm text-forvis-gray-700">
            You'll provide prospect details, assign a team, and complete client acceptance
            in the next steps.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-end pt-6 border-t border-forvis-gray-200">
        <Button onClick={handleNext} variant="gradient" disabled={!canProceed}>
          Next
        </Button>
      </div>
    </div>
  );
}
