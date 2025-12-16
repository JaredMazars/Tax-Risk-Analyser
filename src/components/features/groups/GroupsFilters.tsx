'use client';

import React from 'react';
import { X, Filter } from 'lucide-react';
import { MultiSelect, MultiSelectOption } from '@/components/ui';

export interface GroupsFiltersType {
  groups: string[];  // Group codes
}

export interface GroupsFiltersProps {
  filters: GroupsFiltersType;
  onFiltersChange: (filters: GroupsFiltersType) => void;
  groups: { code: string; name: string; clientCount?: number }[];
  onGroupSearchChange?: (search: string) => void;
}

export function GroupsFilters({
  filters,
  onFiltersChange,
  groups,
  onGroupSearchChange,
}: GroupsFiltersProps) {
  const [groupSearch, setGroupSearch] = React.useState('');
  
  // Debounce and notify parent of search changes
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (onGroupSearchChange) {
        onGroupSearchChange(groupSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [groupSearch, onGroupSearchChange]);
  
  const handleGroupsChange = (values: (string | number)[]) => {
    onFiltersChange({ ...filters, groups: values as string[] });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      groups: [],
    });
  };

  const hasActiveFilters = filters.groups.length > 0;

  // Convert data to MultiSelect options - show "Code - Name (Count)" format
  const groupOptions: MultiSelectOption[] = groups.map(group => ({
    id: group.code,
    label: `${group.code} - ${group.name}${group.clientCount !== undefined ? ` (${group.clientCount})` : ''}`,
  }));

  // Generate active filters summary
  const getActiveFiltersSummary = () => {
    if (filters.groups.length > 0) {
      return `${filters.groups.length} Group${filters.groups.length > 1 ? 's' : ''}`;
    }
    return '';
  };

  return (
    <div className="bg-white rounded-lg shadow-corporate p-3 mb-4">
      <div className="space-y-2">
        {/* Filter Row: Group */}
        <div className="flex items-center gap-2">
          <div className="flex-1 max-w-md">
            <MultiSelect
              options={groupOptions}
              value={filters.groups}
              onChange={handleGroupsChange}
              placeholder="Filter by Group"
              searchPlaceholder="Search by code or name..."
              onSearchChange={setGroupSearch}
            />
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-forvis-gray-700 bg-forvis-gray-100 rounded-lg hover:bg-forvis-gray-200 transition-colors"
              title="Clear all filters"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Active Filters Indicator */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 text-xs text-forvis-gray-600">
            <Filter className="h-3.5 w-3.5" />
            <span className="font-medium">Active: {getActiveFiltersSummary()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
