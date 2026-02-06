/**
 * BD Kanban Filters Component
 * 
 * Pattern based on tasks TasksFilters with BD-specific filters.
 */

'use client';

import React from 'react';
import { X, Search, LayoutGrid, List } from 'lucide-react';
import { SearchMultiCombobox, SearchMultiComboboxOption } from '@/components/ui/SearchMultiCombobox';
import { Input } from '@/components/ui';
import type { BDKanbanFilters as FiltersType, BDDisplayMode } from './types';

interface BDKanbanFiltersProps {
  filters: FiltersType;
  onFiltersChange: (filters: Partial<FiltersType>) => void;
  displayMode: BDDisplayMode;
  onDisplayModeChange: (mode: BDDisplayMode) => void;
  stages: Array<{ id: number; name: string; color: string | null; probability: number }>;
  employees: Array<{ id: string; name: string }>;
}

export function BDKanbanFilters({
  filters,
  onFiltersChange,
  displayMode,
  onDisplayModeChange,
  stages,
  employees,
}: BDKanbanFiltersProps) {
  const [searchInput, setSearchInput] = React.useState(filters.search);
  const [stageSearch, setStageSearch] = React.useState('');
  const [employeeSearch, setEmployeeSearch] = React.useState('');

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFiltersChange({ search: searchInput });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search, onFiltersChange]);

  const handleStagesChange = (values: (string | number)[]) => {
    onFiltersChange({ stages: values as string[] });
  };

  const handleAssignedToChange = (values: (string | number)[]) => {
    onFiltersChange({ assignedTo: values as string[] });
  };

  const handleToggleDrafts = () => {
    onFiltersChange({ includeDrafts: !filters.includeDrafts });
  };

  const handleClearFilters = () => {
    setSearchInput('');
    onFiltersChange({
      search: '',
      assignedTo: [],
      stages: [],
      minValue: undefined,
      maxValue: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      includeDrafts: false,
    });
  };

  const hasActiveFilters =
    filters.search.length > 0 ||
    filters.assignedTo.length > 0 ||
    filters.stages.length > 0 ||
    filters.minValue !== undefined ||
    filters.maxValue !== undefined ||
    filters.dateFrom !== undefined ||
    filters.dateTo !== undefined ||
    filters.includeDrafts;

  // Convert data to SearchMultiCombobox options
  const stageOptions: SearchMultiComboboxOption[] = stages.map(stage => ({
    id: stage.id.toString(),
    label: stage.name,
  }));

  const employeeOptions: SearchMultiComboboxOption[] = employees.map(emp => ({
    id: emp.id,
    label: emp.name,
  }));

  // Generate active filters summary
  const getActiveFiltersSummary = () => {
    const parts: string[] = [];
    if (filters.search) parts.push('Search');
    if (filters.assignedTo.length > 0) parts.push(`${filters.assignedTo.length} Assigned`);
    if (filters.stages.length > 0) parts.push(`${filters.stages.length} Stage${filters.stages.length > 1 ? 's' : ''}`);
    if (filters.minValue !== undefined || filters.maxValue !== undefined) parts.push('Value Range');
    if (filters.dateFrom !== undefined || filters.dateTo !== undefined) parts.push('Date Range');
    if (filters.includeDrafts) parts.push('Drafts');
    return parts.join(', ');
  };

  return (
    <div className="bg-white rounded-lg shadow-corporate p-3 mb-4">
      <div className="space-y-2">
        {/* First Row: Display Mode, Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Display Mode Toggle (Compact/Detailed) */}
          <div className="inline-flex rounded-lg border border-forvis-gray-300 bg-white">
            <button
              onClick={() => onDisplayModeChange('compact')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-l-lg transition-colors ${
                displayMode === 'compact'
                  ? 'bg-forvis-blue-600 text-white'
                  : 'text-forvis-gray-700 hover:bg-forvis-gray-50'
              }`}
              title="Compact View"
            >
              <List className="h-3.5 w-3.5" />
              <span>Compact</span>
            </button>
            <button
              onClick={() => onDisplayModeChange('detailed')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-r-lg transition-colors ${
                displayMode === 'detailed'
                  ? 'bg-forvis-blue-600 text-white'
                  : 'text-forvis-gray-700 hover:bg-forvis-gray-50'
              }`}
              title="Detailed View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Detailed</span>
            </button>
          </div>

          {/* Include Drafts Toggle */}
          <button
            onClick={handleToggleDrafts}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              filters.includeDrafts
                ? 'bg-forvis-warning-100 text-forvis-warning-800 border-forvis-warning-300'
                : 'bg-white text-forvis-gray-700 border-forvis-gray-300 hover:bg-forvis-gray-50'
            }`}
          >
            {filters.includeDrafts ? 'Hide' : 'Show'} Drafts
          </button>

          {/* Active Filters Badge */}
          {hasActiveFilters && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-forvis-blue-50 text-forvis-blue-700 border border-forvis-blue-200">
              <span className="font-semibold">{getActiveFiltersSummary()}</span>
            </div>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-forvis-gray-700 rounded-lg border border-forvis-gray-300 hover:bg-forvis-gray-50 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Clear All
            </button>
          )}
        </div>

        {/* Second Row: Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-forvis-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search opportunities..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-forvis-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forvis-blue-500 focus:border-transparent"
            />
          </div>

          {/* Stages Filter */}
          <SearchMultiCombobox
            options={stageOptions}
            value={filters.stages}
            onChange={handleStagesChange}
            onSearchChange={setStageSearch}
            placeholder="All Stages"
            searchPlaceholder="Search stages..."
            emptyMessage="No stages found"
            className="w-full"
          />

          {/* Assigned To Filter */}
          <SearchMultiCombobox
            options={employeeOptions}
            value={filters.assignedTo}
            onChange={handleAssignedToChange}
            onSearchChange={setEmployeeSearch}
            placeholder="Assigned To"
            searchPlaceholder="Search employees..."
            emptyMessage="No employees found"
            className="w-full"
          />

          {/* Value Range */}
          <div className="flex gap-2">
            <input
              type="number"
              value={filters.minValue || ''}
              onChange={(e) => onFiltersChange({ minValue: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="Min Value"
              className="w-1/2 px-3 py-2 text-sm border border-forvis-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forvis-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              value={filters.maxValue || ''}
              onChange={(e) => onFiltersChange({ maxValue: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="Max Value"
              className="w-1/2 px-3 py-2 text-sm border border-forvis-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forvis-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Third Row: Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-forvis-gray-700 whitespace-nowrap">Target Close:</label>
            <input
              type="date"
              value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
              onChange={(e) => onFiltersChange({ dateFrom: e.target.value ? new Date(e.target.value) : undefined })}
              className="flex-1 px-3 py-2 text-sm border border-forvis-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forvis-blue-500 focus:border-transparent"
            />
            <span className="text-xs text-forvis-gray-500">to</span>
            <input
              type="date"
              value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
              onChange={(e) => onFiltersChange({ dateTo: e.target.value ? new Date(e.target.value) : undefined })}
              className="flex-1 px-3 py-2 text-sm border border-forvis-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forvis-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
