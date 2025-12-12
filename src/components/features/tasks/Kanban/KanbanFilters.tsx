'use client';

import { Search, X, Filter } from 'lucide-react';
import { KanbanFiltersProps } from './types';
import { Button } from '@/components/ui';

export function KanbanFilters({ filters, onFiltersChange, teamMembers }: KanbanFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleTeamMemberChange = (userId: string | null) => {
    onFiltersChange({ ...filters, teamMember: userId });
  };

  const handleToggleArchived = () => {
    const newValue = !filters.includeArchived;
    onFiltersChange({ ...filters, includeArchived: newValue });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      search: '',
      teamMember: null,
      priority: null,
      dueDateRange: null,
      includeArchived: false,
    });
  };

  const hasActiveFilters = 
    filters.search !== '' || 
    filters.teamMember !== null || 
    filters.priority !== null || 
    filters.dueDateRange !== null ||
    filters.includeArchived;

  return (
    <div className="bg-white rounded-lg shadow-corporate p-4 mb-4">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-forvis-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-forvis-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forvis-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Team Member Filter */}
        <div className="min-w-[200px]">
          <select
            value={filters.teamMember || ''}
            onChange={(e) => handleTeamMemberChange(e.target.value || null)}
            className="w-full px-4 py-2 border border-forvis-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forvis-blue-500 focus:border-transparent text-sm"
          >
            <option value="">All Team Members</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
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
            Clear Filters
          </button>
        )}

        {/* Active Filters Indicator */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 text-sm text-forvis-gray-600">
            <Filter className="h-4 w-4" />
            <span className="font-medium">
              {[
                filters.search && 'Search',
                filters.teamMember && 'Team Member',
                filters.priority && 'Priority',
                filters.dueDateRange && 'Date Range',
              ]
                .filter(Boolean)
                .join(', ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}




