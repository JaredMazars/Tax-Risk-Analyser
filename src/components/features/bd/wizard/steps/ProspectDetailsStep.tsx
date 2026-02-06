/**
 * BD Wizard Step 2: Prospect Details
 * Collect prospect company information
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import type { StepProps } from '@/types/bd-wizard';
import { useQuery } from '@tanstack/react-query';

export function ProspectDetailsStep({
  wizardData,
  updateWizardData,
  onNext,
  onBack,
}: StepProps) {
  const [companyName, setCompanyName] = useState(
    wizardData.prospectDetails?.companyName || ''
  );
  const [industry, setIndustry] = useState(
    wizardData.prospectDetails?.industry || ''
  );
  const [sector, setSector] = useState(wizardData.prospectDetails?.sector || '');
  const [contactName, setContactName] = useState(
    wizardData.prospectDetails?.contactName || ''
  );
  const [email, setEmail] = useState(wizardData.prospectDetails?.email || '');
  const [phone, setPhone] = useState(wizardData.prospectDetails?.phone || '');
  
  // Group search and selection state
  const [groupSearch, setGroupSearch] = useState(
    wizardData.prospectDetails?.groupDesc || ''
  );
  const [selectedGroup, setSelectedGroup] = useState<{
    groupCode: string;
    groupDesc: string;
  } | null>(
    wizardData.prospectDetails?.groupCode 
      ? { 
          groupCode: wizardData.prospectDetails.groupCode,
          groupDesc: wizardData.prospectDetails.groupDesc || ''
        } 
      : null
  );
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newGroupCode, setNewGroupCode] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const groupSearchRef = useRef<HTMLDivElement>(null);

  // Fetch groups with search
  const { data: groupsData, isLoading: isLoadingGroups } = useQuery({
    queryKey: ['groups', 'search', groupSearch],
    queryFn: async () => {
      const res = await fetch(
        `/api/groups?search=${encodeURIComponent(groupSearch)}&limit=50`
      );
      if (!res.ok) throw new Error('Failed to fetch groups');
      const result = await res.json();
      return result.data?.groups || [];
    },
    enabled: groupSearch.length >= 2,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        groupSearchRef.current &&
        !groupSearchRef.current.contains(event.target as Node)
      ) {
        setShowGroupDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Group selection handlers
  const handleGroupSelect = (group: { groupCode: string; groupDesc: string }) => {
    setSelectedGroup(group);
    setGroupSearch(group.groupDesc);
    setShowGroupDropdown(false);
    setIsCreatingNew(false);
  };

  const handleCreateNewGroup = () => {
    if (!newGroupCode.trim() || !newGroupDesc.trim()) return;
    
    const newGroup = {
      groupCode: newGroupCode.trim().toUpperCase(),
      groupDesc: newGroupDesc.trim(),
    };
    
    setSelectedGroup(newGroup);
    setGroupSearch(newGroup.groupDesc);
    setIsCreatingNew(false);
    setNewGroupCode('');
    setNewGroupDesc('');
    setShowGroupDropdown(false);
  };

  const handleNext = () => {
    updateWizardData({
      prospectDetails: {
        companyName,
        industry: industry || undefined,
        sector: sector || undefined,
        contactName: contactName || undefined,
        email: email || undefined,
        phone: phone || undefined,
        groupCode: selectedGroup?.groupCode || '',
        groupDesc: selectedGroup?.groupDesc,
      },
    });
    onNext();
  };

  const canProceed = companyName.trim() !== '' && selectedGroup !== null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-forvis-gray-900 mb-2">
          Prospect Details
        </h3>
        <p className="text-sm text-forvis-gray-600">
          Provide information about the prospect company.
        </p>
      </div>

      <div className="space-y-4">
        {/* Company Name */}
        <Input
          label="Company Name *"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Enter company name"
          required
        />

        {/* Group Search */}
        <div>
          <label className="block text-sm font-medium text-forvis-gray-700 mb-2">
            Group *
          </label>
          <div className="relative" ref={groupSearchRef}>
            <div className="relative">
              <input
                type="text"
                value={groupSearch}
                onChange={(e) => {
                  setGroupSearch(e.target.value);
                  setShowGroupDropdown(true);
                  setSelectedGroup(null);
                }}
                onFocus={() => groupSearch.length >= 2 && setShowGroupDropdown(true)}
                placeholder="Type to search groups or create new..."
                disabled={isCreatingNew}
                className="w-full px-4 py-2 pl-10 border border-forvis-gray-300 rounded-lg focus:ring-2 focus:ring-forvis-blue-500 focus:border-forvis-blue-500 disabled:bg-forvis-gray-100"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-forvis-gray-400" />
            </div>

            {/* Group Dropdown */}
            {showGroupDropdown && groupSearch.length >= 2 && !isCreatingNew && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-forvis-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                {isLoadingGroups ? (
                  <div className="p-4 text-center text-forvis-gray-600">
                    Searching groups...
                  </div>
                ) : groupsData && groupsData.length > 0 ? (
                  <ul>
                    {groupsData.map((group: any) => (
                      <li
                        key={group.groupCode}
                        className="px-4 py-3 hover:bg-forvis-blue-50 cursor-pointer border-b border-forvis-gray-100 last:border-b-0"
                        onClick={() => handleGroupSelect(group)}
                      >
                        <div className="font-medium text-forvis-gray-900">
                          {group.groupDesc}
                        </div>
                        <div className="text-sm text-forvis-gray-600">
                          Code: {group.groupCode} • {group.clientCount} clients
                        </div>
                      </li>
                    ))}
                    {/* Create New Option */}
                    <li
                      className="px-4 py-3 hover:bg-forvis-blue-50 cursor-pointer border-t-2 border-forvis-blue-200 bg-forvis-blue-25"
                      onClick={() => setIsCreatingNew(true)}
                    >
                      <div className="flex items-center gap-2 text-forvis-blue-600 font-medium">
                        <Plus className="h-4 w-4" />
                        Create new group "{groupSearch}"
                      </div>
                    </li>
                  </ul>
                ) : (
                  <div>
                    <div className="p-4 text-center text-forvis-gray-600">
                      No groups found
                    </div>
                    <div
                      className="px-4 py-3 hover:bg-forvis-blue-50 cursor-pointer border-t border-forvis-gray-200 bg-forvis-blue-25"
                      onClick={() => setIsCreatingNew(true)}
                    >
                      <div className="flex items-center gap-2 text-forvis-blue-600 font-medium">
                        <Plus className="h-4 w-4" />
                        Create new group
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Group Display */}
          {selectedGroup && !isCreatingNew && (
            <div className="mt-3 p-3 bg-forvis-success-50 border border-forvis-success-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-forvis-success-900">
                    {selectedGroup.groupDesc}
                  </div>
                  <div className="text-sm text-forvis-success-800">
                    Code: {selectedGroup.groupCode}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedGroup(null);
                    setGroupSearch('');
                  }}
                  className="text-forvis-success-600 hover:text-forvis-success-800 text-sm font-medium"
                >
                  Change
                </button>
              </div>
            </div>
          )}

          {/* Create New Group Form */}
          {isCreatingNew && (
            <div className="mt-3 p-4 bg-forvis-blue-50 border-2 border-forvis-blue-300 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-forvis-gray-900">
                  Create New Group
                </h4>
                <button
                  onClick={() => {
                    setIsCreatingNew(false);
                    setNewGroupCode('');
                    setNewGroupDesc('');
                  }}
                  className="text-forvis-gray-400 hover:text-forvis-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-forvis-gray-700 mb-1">
                    Group Code * (max 10 chars, uppercase)
                  </label>
                  <input
                    type="text"
                    value={newGroupCode}
                    onChange={(e) => setNewGroupCode(e.target.value.toUpperCase())}
                    placeholder="e.g., TECH, RETAIL"
                    maxLength={10}
                    className="w-full px-3 py-2 text-sm border border-forvis-gray-300 rounded-lg focus:ring-2 focus:ring-forvis-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-forvis-gray-700 mb-1">
                    Group Description * (max 150 chars)
                  </label>
                  <input
                    type="text"
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    placeholder="e.g., Technology Companies"
                    maxLength={150}
                    className="w-full px-3 py-2 text-sm border border-forvis-gray-300 rounded-lg focus:ring-2 focus:ring-forvis-blue-500"
                  />
                </div>
                
                <Button
                  onClick={handleCreateNewGroup}
                  variant="gradient"
                  disabled={!newGroupCode.trim() || !newGroupDesc.trim()}
                  className="w-full text-sm"
                >
                  Create Group
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Industry */}
        <Input
          label="Industry"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="e.g., Financial Services, Manufacturing"
        />

        {/* Sector */}
        <Input
          label="Sector"
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          placeholder="e.g., Banking, Automotive"
        />

        <div className="border-t border-forvis-gray-200 my-6 pt-6">
          <h4 className="text-base font-semibold text-forvis-gray-900 mb-4">
            Primary Contact (Optional)
          </h4>

          {/* Contact Name */}
          <div className="space-y-4">
            <Input
              label="Contact Name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Full name"
            />

            {/* Email */}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
            />

            {/* Phone */}
            <Input
              label="Phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>
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
