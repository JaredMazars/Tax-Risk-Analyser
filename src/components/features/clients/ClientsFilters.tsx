'use client';

import React from 'react';
import { X, Filter } from 'lucide-react';
import { MultiSelect, MultiSelectOption } from '@/components/ui';

export interface ClientsFiltersType {
  clients: string[];  // Client codes
  industries: string[];
  groups: string[];
}

export interface ClientsFiltersProps {
  filters: ClientsFiltersType;
  onFiltersChange: (filters: ClientsFiltersType) => void;
  clients: { code: string; name: string }[];
  industries: string[];
  groups: { name: string; code: string }[];
  onClientSearchChange?: (search: string) => void;
  onIndustrySearchChange?: (search: string) => void;
  onGroupSearchChange?: (search: string) => void;
}

export function ClientsFilters({
  filters,
  onFiltersChange,
  clients,
  industries,
  groups,
  onClientSearchChange,
  onIndustrySearchChange,
  onGroupSearchChange,
}: ClientsFiltersProps) {
  const [clientSearch, setClientSearch] = React.useState('');
  const [industrySearch, setIndustrySearch] = React.useState('');
  const [groupSearch, setGroupSearch] = React.useState('');
  
  // Debounce and notify parent of client search changes
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (onClientSearchChange) {
        onClientSearchChange(clientSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [clientSearch, onClientSearchChange]);
  
  // Debounce and notify parent of industry search changes
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (onIndustrySearchChange) {
        onIndustrySearchChange(industrySearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [industrySearch, onIndustrySearchChange]);
  
  // Debounce and notify parent of group search changes
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (onGroupSearchChange) {
        onGroupSearchChange(groupSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [groupSearch, onGroupSearchChange]);
  
  const handleClientsChange = (values: (string | number)[]) => {
    onFiltersChange({ ...filters, clients: values as string[] });
  };

  const handleIndustriesChange = (values: (string | number)[]) => {
    onFiltersChange({ ...filters, industries: values as string[] });
  };

  const handleGroupsChange = (values: (string | number)[]) => {
    onFiltersChange({ ...filters, groups: values as string[] });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      clients: [],
      industries: [],
      groups: [],
    });
  };

  const hasActiveFilters = 
    filters.clients.length > 0 ||
    filters.industries.length > 0 ||
    filters.groups.length > 0;

  // Convert data to MultiSelect options - show "Code - Name" format
  const clientOptions: MultiSelectOption[] = clients.map(client => ({
    id: client.code,
    label: `${client.code} - ${client.name}`,
  }));

  const industryOptions: MultiSelectOption[] = industries.map(industry => ({
    id: industry,
    label: industry,
  }));

  const groupOptions: MultiSelectOption[] = groups.map(group => ({
    id: group.code,
    label: `${group.name} (${group.code})`,
  }));

  // #region agent log
  React.useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/fefc3511-fdd0-43c4-a837-f5a8973894e3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ClientsFilters.tsx:109',message:'Groups prop received',data:{groupsCount:groups.length,groupOptionsCount:groupOptions.length,firstThree:groups.slice(0,3)},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C'})}).catch(()=>{});
  }, [groups, groupOptions]);
  // #endregion

  // Generate active filters summary
  const getActiveFiltersSummary = () => {
    const parts: string[] = [];
    if (filters.clients.length > 0) parts.push(`${filters.clients.length} Client${filters.clients.length > 1 ? 's' : ''}`);
    if (filters.industries.length > 0) parts.push(`${filters.industries.length} Industr${filters.industries.length > 1 ? 'ies' : 'y'}`);
    if (filters.groups.length > 0) parts.push(`${filters.groups.length} Group${filters.groups.length > 1 ? 's' : ''}`);
    return parts.join(', ');
  };

  return (
    <div className="bg-white rounded-lg shadow-corporate p-3 mb-4">
      <div className="space-y-2">
        {/* Filter Row: Client, Industry, Group */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {/* Client Filter with server-side search */}
          <MultiSelect
            options={clientOptions}
            value={filters.clients}
            onChange={handleClientsChange}
            placeholder="Filter by Client"
            searchPlaceholder="Search by code or name..."
            onSearchChange={setClientSearch}
          />

          {/* Industry Filter with server-side search */}
          <MultiSelect
            options={industryOptions}
            value={filters.industries}
            onChange={handleIndustriesChange}
            placeholder="All Industries"
            searchPlaceholder="Search industries..."
            onSearchChange={setIndustrySearch}
          />

          {/* Group Filter with server-side search */}
          <MultiSelect
            options={groupOptions}
            value={filters.groups}
            onChange={handleGroupsChange}
            placeholder="All Groups"
            searchPlaceholder="Search groups..."
            onSearchChange={setGroupSearch}
          />
        </div>

        {/* Active Filters Indicator */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-forvis-gray-600">
              <Filter className="h-3.5 w-3.5" />
              <span className="font-medium">Active: {getActiveFiltersSummary()}</span>
            </div>
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-forvis-gray-700 bg-forvis-gray-100 rounded-lg hover:bg-forvis-gray-200 transition-colors"
              title="Clear all filters"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
