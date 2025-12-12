'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { KanbanFiltersProps } from './types';
import { MultiSelect, MultiSelectOption } from '@/components/ui';

export function KanbanFilters({ 
  filters, 
  onFiltersChange, 
  teamMembers,
  partners,
  managers,
  clients,
}: KanbanFiltersProps) {
  // Local state for immediate UI feedback
  const [localSearch, setLocalSearch] = useState(filters.search);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Update local search when filters.search changes externally
  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  const handleSearchChange = (value: string) => {
    // Update local state immediately for responsive UI
    setLocalSearch(value);
    
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set new timer to update filters after 500ms of no typing
    debounceTimerRef.current = setTimeout(() => {
      onFiltersChange({ ...filters, search: value });
    }, 500);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleTeamMembersChange = (values: (string | number)[]) => {
    onFiltersChange({ ...filters, teamMembers: values as string[] });
  };

  const handlePartnersChange = (values: (string | number)[]) => {
    onFiltersChange({ ...filters, partners: values as string[] });
  };

  const handleManagersChange = (values: (string | number)[]) => {
    onFiltersChange({ ...filters, managers: values as string[] });
  };

  const handleClientsChange = (values: (string | number)[]) => {
    onFiltersChange({ ...filters, clients: values as number[] });
  };

  const handleToggleArchived = () => {
    const newValue = !filters.includeArchived;
    onFiltersChange({ ...filters, includeArchived: newValue });
  };

  const handleClearFilters = () => {
    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    // Clear local search immediately
    setLocalSearch('');
    // Clear all filters
    onFiltersChange({
      search: '',
      teamMembers: [],
      partners: [],
      managers: [],
      clients: [],
      includeArchived: false,
    });
  };

  const hasActiveFilters = 
    filters.search !== '' || 
    filters.teamMembers.length > 0 ||
    filters.partners.length > 0 ||
    filters.managers.length > 0 ||
    filters.clients.length > 0 ||
    filters.includeArchived;

  // Convert data to MultiSelect options
  const teamMemberOptions: MultiSelectOption[] = teamMembers.map(member => ({
    id: member.id,
    label: member.name,
  }));

  const partnerOptions: MultiSelectOption[] = partners.map(partner => ({
    id: partner,
    label: partner,
  }));

  const managerOptions: MultiSelectOption[] = managers.map(manager => ({
    id: manager,
    label: manager,
  }));

  const clientOptions: MultiSelectOption[] = clients.map(client => ({
    id: client.id,
    label: `${client.name} (${client.code})`,
  }));

  // Generate active filters summary
  const getActiveFiltersSummary = () => {
    const parts: string[] = [];
    if (filters.search) parts.push('Search');
    if (filters.teamMembers.length > 0) parts.push(`${filters.teamMembers.length} Team Member${filters.teamMembers.length > 1 ? 's' : ''}`);
    if (filters.partners.length > 0) parts.push(`${filters.partners.length} Partner${filters.partners.length > 1 ? 's' : ''}`);
    if (filters.managers.length > 0) parts.push(`${filters.managers.length} Manager${filters.managers.length > 1 ? 's' : ''}`);
    if (filters.clients.length > 0) parts.push(`${filters.clients.length} Client${filters.clients.length > 1 ? 's' : ''}`);
    return parts.join(', ');
  };

  return (
    <div className="bg-white rounded-lg shadow-corporate p-4 mb-4">
      <div className="space-y-3">
        {/* First Row: Search */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-forvis-gray-400" />
              <input
                type="text"
                placeholder="Search by project name, code, client name, or code..."
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-forvis-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forvis-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Include Archived Toggle */}
          <label className="inline-flex items-center gap-2 px-4 py-2 border border-forvis-gray-300 rounded-lg bg-white cursor-pointer hover:bg-forvis-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={filters.includeArchived}
              onChange={handleToggleArchived}
              className="w-4 h-4 text-forvis-blue-600 border-forvis-gray-300 rounded focus:ring-forvis-blue-500"
            />
            <span className="text-sm font-medium text-forvis-gray-700">
              Include Archived
            </span>
          </label>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-forvis-gray-700 bg-forvis-gray-100 rounded-lg hover:bg-forvis-gray-200 transition-colors"
            >
              <X className="h-4 w-4" />
              Clear All
            </button>
          )}
        </div>

        {/* Second Row: Multi-Select Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Team Members Filter */}
          <MultiSelect
            options={teamMemberOptions}
            value={filters.teamMembers}
            onChange={handleTeamMembersChange}
            placeholder="All Team Members"
            searchPlaceholder="Search team members..."
          />

          {/* Partners Filter */}
          <MultiSelect
            options={partnerOptions}
            value={filters.partners}
            onChange={handlePartnersChange}
            placeholder="All Partners"
            searchPlaceholder="Search partners..."
          />

          {/* Managers Filter */}
          <MultiSelect
            options={managerOptions}
            value={filters.managers}
            onChange={handleManagersChange}
            placeholder="All Managers"
            searchPlaceholder="Search managers..."
          />

          {/* Clients Filter */}
          <MultiSelect
            options={clientOptions}
            value={filters.clients}
            onChange={handleClientsChange}
            placeholder="All Clients"
            searchPlaceholder="Search clients..."
          />
        </div>

        {/* Active Filters Indicator */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 text-sm text-forvis-gray-600 pt-1">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Active filters: {getActiveFiltersSummary()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
