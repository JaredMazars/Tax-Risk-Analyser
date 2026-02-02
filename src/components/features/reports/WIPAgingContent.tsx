'use client';

/**
 * WIP Aging Content Component
 * 
 * Displays WIP aging with 7 buckets using FIFO fee allocation.
 * Receives date parameters from parent (ProfitabilityReport).
 * Supports multiple view modes (Task, Client, Group, Service Line hierarchy) and filtering.
 */

import { useState, useMemo, useCallback } from 'react';
import { Layers, Building2, ListTodo, X, Filter, LayoutList, FolderTree, Tag } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui';
import { Banner } from '@/components/ui/Banner';
import { SearchMultiCombobox, SearchMultiComboboxOption } from '@/components/ui/SearchMultiCombobox';
import { useWIPAgingReport } from '@/hooks/reports/useWIPAgingReport';
import { WIPAgingTable } from './WIPAgingTable';
import { WIPAgingGroupTotalsTable } from './WIPAgingGroupTotalsTable';
import { WIPAgingClientTotalsTable } from './WIPAgingClientTotalsTable';
import { WIPAgingMasterServiceLineTotalsTable } from './WIPAgingMasterServiceLineTotalsTable';
import { WIPAgingSubServiceLineGroupTotalsTable } from './WIPAgingSubServiceLineGroupTotalsTable';
import { WIPAgingServiceLineTotalsTable } from './WIPAgingServiceLineTotalsTable';

type ViewMode = 'group' | 'client' | 'task' | 'master-service-line' | 'sub-service-line-group' | 'service-line';

interface WIPAgingFiltersState {
  clients: string[];
  serviceLines: string[];
  groups: string[];
  masterServiceLines: string[];
  subServiceLineGroups: string[];
}

interface WIPAgingContentProps {
  fiscalYear?: number;
  fiscalMonth?: string;
  startDate?: string;
  endDate?: string;
  mode: 'fiscal' | 'custom';
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function WIPAgingContent({ fiscalYear, fiscalMonth, startDate, endDate, mode }: WIPAgingContentProps) {
  // State for view mode and filters
  const [viewMode, setViewMode] = useState<ViewMode>('master-service-line');
  const [filters, setFilters] = useState<WIPAgingFiltersState>({
    clients: [],
    serviceLines: [],
    groups: [],
    masterServiceLines: [],
    subServiceLineGroups: [],
  });

  // Filter search handlers (managed by SearchMultiCombobox internally, but we need to provide the callback)
  const handleSearch = (_search: string) => { /* Search handled internally */ };

  // Fetch data with date params from parent
  const { data, isLoading, error } = useWIPAgingReport({
    fiscalYear,
    fiscalMonth,
    startDate,
    endDate,
    mode,
  });

  // Extract unique options from data
  const { clientOptions, serviceLineOptions, groupOptions, masterServiceLineOptions, subServiceLineGroupOptions } = useMemo(() => {
    if (!data?.tasks) {
      return { clientOptions: [], serviceLineOptions: [], groupOptions: [], masterServiceLineOptions: [], subServiceLineGroupOptions: [] };
    }

    const clientMap = new Map<string, SearchMultiComboboxOption>();
    const serviceLineMap = new Map<string, SearchMultiComboboxOption>();
    const groupMap = new Map<string, SearchMultiComboboxOption>();
    const masterServiceLineMap = new Map<string, SearchMultiComboboxOption>();
    const subServiceLineGroupMap = new Map<string, SearchMultiComboboxOption>();

    data.tasks.forEach((task) => {
      if (task.GSClientID && !clientMap.has(task.clientCode)) {
        clientMap.set(task.clientCode, {
          id: task.clientCode,
          label: `${task.clientCode} - ${task.clientName || 'Unnamed'}`,
        });
      }
      if (!serviceLineMap.has(task.servLineCode)) {
        serviceLineMap.set(task.servLineCode, {
          id: task.servLineCode,
          label: task.servLineDesc,
        });
      }
      if (task.groupCode && !groupMap.has(task.groupCode)) {
        groupMap.set(task.groupCode, {
          id: task.groupCode,
          label: task.groupDesc || task.groupCode,
        });
      }
      if (task.masterServiceLineCode && !masterServiceLineMap.has(task.masterServiceLineCode)) {
        masterServiceLineMap.set(task.masterServiceLineCode, {
          id: task.masterServiceLineCode,
          label: task.masterServiceLineName || task.masterServiceLineCode,
        });
      }
      if (task.subServlineGroupCode && !subServiceLineGroupMap.has(task.subServlineGroupCode)) {
        subServiceLineGroupMap.set(task.subServlineGroupCode, {
          id: task.subServlineGroupCode,
          label: task.subServlineGroupDesc || task.subServlineGroupCode,
        });
      }
    });

    return {
      clientOptions: Array.from(clientMap.values()).sort((a, b) => a.label.localeCompare(b.label)),
      serviceLineOptions: Array.from(serviceLineMap.values()).sort((a, b) => a.label.localeCompare(b.label)),
      groupOptions: Array.from(groupMap.values()).sort((a, b) => a.label.localeCompare(b.label)),
      masterServiceLineOptions: Array.from(masterServiceLineMap.values()).sort((a, b) => a.label.localeCompare(b.label)),
      subServiceLineGroupOptions: Array.from(subServiceLineGroupMap.values()).sort((a, b) => a.label.localeCompare(b.label)),
    };
  }, [data]);

  // Apply filters
  const filteredTasks = useMemo(() => {
    if (!data?.tasks) return [];

    let filtered = data.tasks;

    if (filters.clients.length > 0) {
      filtered = filtered.filter((task) => filters.clients.includes(task.clientCode));
    }

    if (filters.serviceLines.length > 0) {
      filtered = filtered.filter((task) => filters.serviceLines.includes(task.servLineCode));
    }

    if (filters.groups.length > 0) {
      filtered = filtered.filter((task) => task.groupCode && filters.groups.includes(task.groupCode));
    }

    if (filters.masterServiceLines.length > 0) {
      filtered = filtered.filter((task) => 
        filters.masterServiceLines.includes(task.masterServiceLineCode)
      );
    }

    if (filters.subServiceLineGroups.length > 0) {
      filtered = filtered.filter((task) => 
        filters.subServiceLineGroups.includes(task.subServlineGroupCode)
      );
    }

    return filtered;
  }, [data, filters]);

  // Calculate summary totals
  const summaryTotals = useMemo(() => {
    if (filteredTasks.length === 0) return null;

    return {
      curr: filteredTasks.reduce((sum, t) => sum + t.aging.curr, 0),
      bal30: filteredTasks.reduce((sum, t) => sum + t.aging.bal30, 0),
      bal60: filteredTasks.reduce((sum, t) => sum + t.aging.bal60, 0),
      bal90: filteredTasks.reduce((sum, t) => sum + t.aging.bal90, 0),
      bal120: filteredTasks.reduce((sum, t) => sum + t.aging.bal120, 0),
      bal150: filteredTasks.reduce((sum, t) => sum + t.aging.bal150, 0),
      bal180: filteredTasks.reduce((sum, t) => sum + t.aging.bal180, 0),
      balWip: filteredTasks.reduce((sum, t) => sum + t.balWip, 0),
      nettWip: filteredTasks.reduce((sum, t) => sum + t.nettWip, 0),
    };
  }, [filteredTasks]);

  // Check if any filters are active
  const hasActiveFilters = 
    filters.clients.length > 0 || 
    filters.serviceLines.length > 0 || 
    filters.groups.length > 0 ||
    filters.masterServiceLines.length > 0 ||
    filters.subServiceLineGroups.length > 0;
  const activeFilterCount = 
    filters.clients.length + 
    filters.serviceLines.length + 
    filters.groups.length +
    filters.masterServiceLines.length +
    filters.subServiceLineGroups.length;

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFilters({ clients: [], serviceLines: [], groups: [], masterServiceLines: [], subServiceLineGroups: [] });
  }, []);

  return (
    <div>
      {/* View Mode Buttons */}
      <div className="bg-white rounded-lg border border-forvis-gray-200 p-4 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <button
            onClick={() => setViewMode('master-service-line')}
            className={`inline-flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md transition-all duration-200 ${
              viewMode === 'master-service-line'
                ? 'text-white shadow-sm'
                : 'text-forvis-gray-700 bg-white border border-forvis-gray-300 hover:bg-forvis-gray-50'
            }`}
            style={
              viewMode === 'master-service-line'
                ? { background: 'linear-gradient(to right, #2E5AAC, #25488A)' }
                : {}
            }
          >
            <LayoutList className="h-4 w-4" />
            <span className="hidden xl:inline">Master SL</span>
            <span className="xl:hidden">MSL</span>
          </button>

          <button
            onClick={() => setViewMode('sub-service-line-group')}
            className={`inline-flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md transition-all duration-200 ${
              viewMode === 'sub-service-line-group'
                ? 'text-white shadow-sm'
                : 'text-forvis-gray-700 bg-white border border-forvis-gray-300 hover:bg-forvis-gray-50'
            }`}
            style={
              viewMode === 'sub-service-line-group'
                ? { background: 'linear-gradient(to right, #2E5AAC, #25488A)' }
                : {}
            }
          >
            <FolderTree className="h-4 w-4" />
            <span className="hidden xl:inline">Sub SL Group</span>
            <span className="xl:hidden">SSL</span>
          </button>

          <button
            onClick={() => setViewMode('service-line')}
            className={`inline-flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md transition-all duration-200 ${
              viewMode === 'service-line'
                ? 'text-white shadow-sm'
                : 'text-forvis-gray-700 bg-white border border-forvis-gray-300 hover:bg-forvis-gray-50'
            }`}
            style={
              viewMode === 'service-line'
                ? { background: 'linear-gradient(to right, #2E5AAC, #25488A)' }
                : {}
            }
          >
            <Tag className="h-4 w-4" />
            <span className="hidden xl:inline">Service Line</span>
            <span className="xl:hidden">SL</span>
          </button>

          <button
            onClick={() => setViewMode('group')}
            className={`inline-flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md transition-all duration-200 ${
              viewMode === 'group'
                ? 'text-white shadow-sm'
                : 'text-forvis-gray-700 bg-white border border-forvis-gray-300 hover:bg-forvis-gray-50'
            }`}
            style={
              viewMode === 'group'
                ? { background: 'linear-gradient(to right, #2E5AAC, #25488A)' }
                : {}
            }
          >
            <Layers className="h-4 w-4" />
            <span>Group</span>
          </button>

          <button
            onClick={() => setViewMode('client')}
            className={`inline-flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md transition-all duration-200 ${
              viewMode === 'client'
                ? 'text-white shadow-sm'
                : 'text-forvis-gray-700 bg-white border border-forvis-gray-300 hover:bg-forvis-gray-50'
            }`}
            style={
              viewMode === 'client'
                ? { background: 'linear-gradient(to right, #2E5AAC, #25488A)' }
                : {}
            }
          >
            <Building2 className="h-4 w-4" />
            <span>Client</span>
          </button>

          <button
            onClick={() => setViewMode('task')}
            className={`inline-flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md transition-all duration-200 ${
              viewMode === 'task'
                ? 'text-white shadow-sm'
                : 'text-forvis-gray-700 bg-white border border-forvis-gray-300 hover:bg-forvis-gray-50'
            }`}
            style={
              viewMode === 'task'
                ? { background: 'linear-gradient(to right, #2E5AAC, #25488A)' }
                : {}
            }
          >
            <ListTodo className="h-4 w-4" />
            <span>Task</span>
          </button>
        </div>
      </div>

      {/* Aging Summary Cards */}
      {summaryTotals && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-4">
          <div className="rounded-lg p-3 border border-forvis-gray-200 bg-white">
            <p className="text-xs text-forvis-gray-500 mb-1">Current (0-30)</p>
            <p className="text-lg font-bold text-forvis-gray-900">{formatCurrency(summaryTotals.curr)}</p>
          </div>
          <div className="rounded-lg p-3 border border-forvis-gray-200 bg-white">
            <p className="text-xs text-forvis-gray-500 mb-1">30 Days</p>
            <p className="text-lg font-bold text-forvis-gray-900">{formatCurrency(summaryTotals.bal30)}</p>
          </div>
          <div className="rounded-lg p-3 border border-forvis-warning-200 bg-forvis-warning-50">
            <p className="text-xs text-forvis-warning-600 mb-1">60 Days</p>
            <p className="text-lg font-bold text-forvis-warning-700">{formatCurrency(summaryTotals.bal60)}</p>
          </div>
          <div className="rounded-lg p-3 border border-forvis-warning-200 bg-forvis-warning-50">
            <p className="text-xs text-forvis-warning-600 mb-1">90 Days</p>
            <p className="text-lg font-bold text-forvis-warning-700">{formatCurrency(summaryTotals.bal90)}</p>
          </div>
          <div className="rounded-lg p-3 border border-forvis-error-200 bg-forvis-error-50">
            <p className="text-xs text-forvis-error-600 mb-1">120 Days</p>
            <p className="text-lg font-bold text-forvis-error-700">{formatCurrency(summaryTotals.bal120)}</p>
          </div>
          <div className="rounded-lg p-3 border border-forvis-error-200 bg-forvis-error-50">
            <p className="text-xs text-forvis-error-600 mb-1">150+ Days</p>
            <p className="text-lg font-bold text-forvis-error-700">{formatCurrency(summaryTotals.bal150 + summaryTotals.bal180)}</p>
          </div>
          <div 
            className="rounded-lg p-3 border border-forvis-blue-200"
            style={{ background: 'linear-gradient(135deg, #F0F7FD 0%, #E0EDFB 100%)' }}
          >
            <p className="text-xs text-forvis-blue-600 mb-1">Total WIP</p>
            <p className="text-lg font-bold text-forvis-blue-800">{formatCurrency(summaryTotals.balWip)}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-forvis-gray-600">Loading WIP aging data...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Banner
          variant="error"
          title="Error Loading Report"
          message={error instanceof Error ? error.message : 'Failed to load WIP aging report'}
        />
      )}

      {/* Data Display */}
      {!isLoading && !error && data && (
        <>
          {/* Filters */}
          <div className="mb-4 p-4 bg-white rounded-lg border border-forvis-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-forvis-gray-500" />
                <span className="text-sm font-medium text-forvis-gray-700">Filters</span>
                {hasActiveFilters && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-forvis-blue-100 text-forvis-blue-800">
                    {activeFilterCount} active
                  </span>
                )}
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1 text-xs text-forvis-gray-500 hover:text-forvis-gray-700"
                >
                  <X className="h-3 w-3" />
                  Clear all
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SearchMultiCombobox
                label="Master Service Lines"
                options={masterServiceLineOptions}
                value={filters.masterServiceLines}
                onChange={(values) =>
                  setFilters((prev) => ({ ...prev, masterServiceLines: values as string[] }))
                }
                onSearchChange={handleSearch}
                placeholder="Search master service lines..."
              />
              <SearchMultiCombobox
                label="Sub Service Line Groups"
                options={subServiceLineGroupOptions}
                value={filters.subServiceLineGroups}
                onChange={(values) =>
                  setFilters((prev) => ({ ...prev, subServiceLineGroups: values as string[] }))
                }
                onSearchChange={handleSearch}
                placeholder="Search sub service line groups..."
              />
              <SearchMultiCombobox
                label="Service Lines"
                options={serviceLineOptions}
                value={filters.serviceLines}
                onChange={(values) =>
                  setFilters((prev) => ({ ...prev, serviceLines: values as string[] }))
                }
                onSearchChange={handleSearch}
                placeholder="Search service lines..."
              />
              <SearchMultiCombobox
                label="Groups"
                options={groupOptions}
                value={filters.groups}
                onChange={(values) =>
                  setFilters((prev) => ({ ...prev, groups: values as string[] }))
                }
                onSearchChange={handleSearch}
                placeholder="Search groups..."
              />
              <SearchMultiCombobox
                label="Clients"
                options={clientOptions}
                value={filters.clients}
                onChange={(values) =>
                  setFilters((prev) => ({ ...prev, clients: values as string[] }))
                }
                onSearchChange={handleSearch}
                placeholder="Search clients..."
              />
            </div>
          </div>

          {/* Filtered Count */}
          {filteredTasks.length !== data.tasks.length && (
            <div className="mb-3 text-sm text-forvis-gray-600">
              Showing <span className="font-semibold">{filteredTasks.length}</span> of{' '}
              <span className="font-semibold">{data.tasks.length}</span> tasks
            </div>
          )}

          {/* Conditional Table Rendering */}
          <div className="bg-white rounded-lg shadow-corporate overflow-hidden">
            {viewMode === 'master-service-line' && <WIPAgingMasterServiceLineTotalsTable tasks={filteredTasks} />}
            {viewMode === 'sub-service-line-group' && <WIPAgingSubServiceLineGroupTotalsTable tasks={filteredTasks} />}
            {viewMode === 'service-line' && <WIPAgingServiceLineTotalsTable tasks={filteredTasks} />}
            {viewMode === 'group' && <WIPAgingGroupTotalsTable tasks={filteredTasks} />}
            {viewMode === 'client' && <WIPAgingClientTotalsTable tasks={filteredTasks} />}
            {viewMode === 'task' && <WIPAgingTable tasks={filteredTasks} />}
          </div>

          {/* Help Section */}
          {filteredTasks.length > 0 && (
            <div className="mt-4">
              <div className="rounded-lg p-3 bg-forvis-gray-50 border border-forvis-gray-200">
                <p className="text-xs text-forvis-gray-600">
                  <strong className="text-forvis-gray-700">FIFO Aging:</strong> Fees are applied against oldest WIP first. Bal180 absorbs credits first, then Bal150, Bal120, etc.{' '}
                  <strong className="text-forvis-gray-700">Buckets:</strong> Curr (0-30), 30 (31-60), 60 (61-90), 90 (91-120), 120 (121-150), 150 (151-180), 180+ (180+ days)
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
