'use client';

/**
 * Country Management Profitability Report
 * 
 * Business-wide profitability data with aggregation by client, partner, or manager.
 * Uses summary SPs for fast partner/manager views, detail SP for drill-down.
 */

import { useState, useMemo, useEffect } from 'react';
import { Layers, Building2, ListTodo, LayoutList, FolderTree, Tag, Users, UserCog } from 'lucide-react';
import { Input, LoadingSpinner } from '@/components/ui';
import { Banner } from '@/components/ui/Banner';
import { FiscalYearSelector } from '@/components/features/reports/FiscalYearSelector';
import { useCountryManagementProfitability } from '@/hooks/country-management/useCountryManagementProfitability';
import { useCountryManagementProfitabilitySummary } from '@/hooks/country-management/useCountryManagementProfitabilitySummary';
import { ReportFilters, type ReportFiltersState } from '@/components/features/reports/ReportFilters';
import { GroupTotalsTable } from '@/components/features/reports/GroupTotalsTable';
import { ClientTotalsTable } from '@/components/features/reports/ClientTotalsTable';
import { TaskDetailsTable } from '@/components/features/reports/TaskDetailsTable';
import { MasterServiceLineTotalsTable } from '@/components/features/reports/MasterServiceLineTotalsTable';
import { SubServiceLineGroupTotalsTable } from '@/components/features/reports/SubServiceLineGroupTotalsTable';
import { ServiceLineTotalsTable } from '@/components/features/reports/ServiceLineTotalsTable';
import { PartnerTotalsTable } from './tables/PartnerTotalsTable';
import { ManagerTotalsTable } from './tables/ManagerTotalsTable';
import { PartnerSummaryTable } from './tables/PartnerSummaryTable';
import { ManagerSummaryTable } from './tables/ManagerSummaryTable';
import { parseISO, differenceInMonths } from 'date-fns';
import { getCurrentFiscalPeriod, FISCAL_MONTHS } from '@/lib/utils/fiscalPeriod';
import type { ReportMode } from './ReportModeSelector';

type ViewMode = 'partner' | 'manager' | 'group' | 'client' | 'task' | 'master-service-line' | 'sub-service-line-group' | 'service-line';

// Views that require task-level data (detail SP)
const DETAIL_VIEW_MODES: ViewMode[] = ['group', 'client', 'task', 'master-service-line', 'sub-service-line-group', 'service-line'];

interface CountryManagementProfitabilityProps {
  reportMode: ReportMode;
  selectedPartners: string[];
  selectedManagers: string[];
}

export function CountryManagementProfitability({
  reportMode,
  selectedPartners,
  selectedManagers,
}: CountryManagementProfitabilityProps) {
  // State for fiscal year and mode selection
  const currentFY = getCurrentFiscalPeriod().fiscalYear;
  const [activeTab, setActiveTab] = useState<'fiscal' | 'custom'>('fiscal');
  const [fiscalYear, setFiscalYear] = useState(currentFY);
  const [selectedMonth, setSelectedMonth] = useState<string>('Aug');
  
  // Separate state for date inputs vs applied query params
  const [customInputs, setCustomInputs] = useState({ start: '', end: '' });
  const [appliedDates, setAppliedDates] = useState({ start: '', end: '' });
  const [dateError, setDateError] = useState<string | null>(null);

  // Determine default view mode based on report mode
  const getDefaultViewMode = (mode: ReportMode): ViewMode => {
    switch (mode) {
      case 'partner': return 'partner';
      case 'manager': return 'manager';
      default: return 'master-service-line';
    }
  };

  const [viewMode, setViewMode] = useState<ViewMode>(getDefaultViewMode(reportMode));
  const [filters, setFilters] = useState<ReportFiltersState>({
    clients: [],
    serviceLines: [],
    groups: [],
    masterServiceLines: [],
    subServiceLineGroups: [],
  });

  // Determine if we need summary or detail data
  const needsSummary = viewMode === 'partner' || viewMode === 'manager';
  const needsDetail = DETAIL_VIEW_MODES.includes(viewMode);

  // Summary data hook (fast - uses pre-aggregated SP)
  const { 
    data: summaryData, 
    isLoading: isSummaryLoading, 
    error: summaryError 
  } = useCountryManagementProfitabilitySummary({
    aggregateBy: viewMode === 'partner' ? 'partner' : 'manager',
    fiscalYear: activeTab === 'fiscal' ? fiscalYear : undefined,
    fiscalMonth: activeTab === 'fiscal' ? selectedMonth : undefined,
    startDate: activeTab === 'custom' && appliedDates.start ? appliedDates.start : undefined,
    endDate: activeTab === 'custom' && appliedDates.end ? appliedDates.end : undefined,
    mode: activeTab,
    partnerCodes: selectedPartners.length > 0 ? selectedPartners : undefined,
    managerCodes: selectedManagers.length > 0 ? selectedManagers : undefined,
    enabled: needsSummary,
  });

  // Detail data hook (slower - uses task-level SP, only when needed)
  const { 
    data: detailData, 
    isLoading: isDetailLoading, 
    error: detailError 
  } = useCountryManagementProfitability({
    fiscalYear: activeTab === 'fiscal' ? fiscalYear : undefined,
    fiscalMonth: activeTab === 'fiscal' ? selectedMonth : undefined,
    startDate: activeTab === 'custom' && appliedDates.start ? appliedDates.start : undefined,
    endDate: activeTab === 'custom' && appliedDates.end ? appliedDates.end : undefined,
    mode: activeTab,
    partnerCodes: selectedPartners.length > 0 ? selectedPartners : undefined,
    managerCodes: selectedManagers.length > 0 ? selectedManagers : undefined,
    enabled: needsDetail,
  });

  // Combined loading and error state
  const isLoading = needsSummary ? isSummaryLoading : isDetailLoading;
  const error = needsSummary ? summaryError : detailError;

  // Update view mode when report mode changes
  useEffect(() => {
    setViewMode(getDefaultViewMode(reportMode));
  }, [reportMode]);

  // Compute available months based on current fiscal period
  const availableMonths = useMemo(() => {
    const currentPeriod = getCurrentFiscalPeriod();
    
    if (fiscalYear < currentPeriod.fiscalYear) {
      return FISCAL_MONTHS;
    } else if (fiscalYear === currentPeriod.fiscalYear) {
      const currentMonthIndex = currentPeriod.fiscalMonth - 1;
      return FISCAL_MONTHS.slice(0, currentMonthIndex + 1);
    } else {
      return ['Sep'];
    }
  }, [fiscalYear]);

  // Auto-select last available month when fiscal year changes
  useEffect(() => {
    const lastMonth = availableMonths[availableMonths.length - 1];
    if (lastMonth && !availableMonths.includes(selectedMonth)) {
      setSelectedMonth(lastMonth);
    }
  }, [availableMonths, selectedMonth]);

  // Handle custom date range validation and application
  const handleDateRangeApply = () => {
    setDateError(null);
    
    if (!customInputs.start || !customInputs.end) {
      setDateError('Both start and end dates are required');
      return;
    }
    
    try {
      const start = parseISO(customInputs.start);
      const end = parseISO(customInputs.end);
      
      if (end < start) {
        setDateError('End date must be after start date');
        return;
      }
      
      const months = differenceInMonths(end, start);
      if (months > 24) {
        setDateError('Date range cannot exceed 24 months');
        return;
      }
      
      setAppliedDates({ start: customInputs.start, end: customInputs.end });
    } catch {
      setDateError('Invalid date format');
    }
  };

  // Apply multi-select filters to tasks (only for detail view)
  const filteredTasks = useMemo(() => {
    if (!detailData?.tasks) return [];

    let filtered = detailData.tasks;

    if (filters.clients.length > 0) {
      filtered = filtered.filter((task) => filters.clients.includes(task.GSClientID));
    }
    if (filters.serviceLines.length > 0) {
      filtered = filtered.filter((task) => filters.serviceLines.includes(task.servLineCode));
    }
    if (filters.groups.length > 0) {
      filtered = filtered.filter((task) => filters.groups.includes(task.groupCode));
    }
    if (filters.masterServiceLines.length > 0) {
      filtered = filtered.filter((task) => 
        filters.masterServiceLines.includes(task.masterServiceLineCode)
      );
    }
    if (filters.subServiceLineGroups.length > 0) {
      filtered = filtered.filter((task) => 
        filters.subServiceLineGroups.includes(task.subServlineGroupCode || task.servLineCode)
      );
    }

    return filtered;
  }, [detailData, filters]);

  // Get available view modes based on report mode
  const getViewModeButtons = () => {
    const baseButtons = [
      { mode: 'master-service-line' as ViewMode, icon: LayoutList, label: 'Master SL', shortLabel: 'MSL' },
      { mode: 'sub-service-line-group' as ViewMode, icon: FolderTree, label: 'Sub SL Group', shortLabel: 'SSL' },
      { mode: 'service-line' as ViewMode, icon: Tag, label: 'Service Line', shortLabel: 'SL' },
      { mode: 'group' as ViewMode, icon: Layers, label: 'Group', shortLabel: 'Group' },
      { mode: 'client' as ViewMode, icon: Building2, label: 'Client', shortLabel: 'Client' },
      { mode: 'task' as ViewMode, icon: ListTodo, label: 'Task', shortLabel: 'Task' },
    ];

    // Add partner/manager modes based on report mode
    if (reportMode === 'partner') {
      return [
        { mode: 'partner' as ViewMode, icon: Users, label: 'By Partner', shortLabel: 'Partner' },
        ...baseButtons,
      ];
    } else if (reportMode === 'manager') {
      return [
        { mode: 'manager' as ViewMode, icon: UserCog, label: 'By Manager', shortLabel: 'Manager' },
        ...baseButtons,
      ];
    }

    return baseButtons;
  };

  const viewModeButtons = getViewModeButtons();

  // Get display count for period info
  const getDisplayCount = () => {
    if (needsSummary && summaryData) {
      return `${summaryData.totalRows} ${viewMode === 'partner' ? 'partners' : 'managers'}`;
    }
    if (needsDetail && detailData) {
      return `${filteredTasks.length} task${filteredTasks.length !== 1 ? 's' : ''}`;
    }
    return '';
  };

  return (
    <div>
      {/* Date Mode Tabs */}
      <div className="border-b border-forvis-gray-200 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-2">
          <nav className="flex gap-4" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'fiscal'}
              onClick={() => setActiveTab('fiscal')}
              className={`pb-2 px-1 text-sm font-medium transition-colors ${
                activeTab === 'fiscal'
                  ? 'border-b-2 border-forvis-blue-600 text-forvis-blue-600'
                  : 'text-forvis-gray-600 hover:text-forvis-gray-900'
              }`}
            >
              Fiscal Year View
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'custom'}
              onClick={() => setActiveTab('custom')}
              className={`pb-2 px-1 text-sm font-medium transition-colors ${
                activeTab === 'custom'
                  ? 'border-b-2 border-forvis-blue-600 text-forvis-blue-600'
                  : 'text-forvis-gray-600 hover:text-forvis-gray-900'
              }`}
            >
              Custom Date Range
            </button>
          </nav>

          {/* Period Info */}
          {(summaryData || detailData) && (
            <div
              className="rounded-lg px-3 py-1.5 border border-forvis-blue-100"
              style={{ background: 'linear-gradient(135deg, #F0F7FD 0%, #E0EDFB 100%)' }}
            >
              <p className="text-xs text-forvis-gray-700 whitespace-nowrap">
                <span className="font-semibold">Period:</span>{' '}
                {activeTab === 'fiscal' 
                  ? selectedMonth === 'Aug' 
                    ? `FY${fiscalYear} (Full Year)` 
                    : `FY${fiscalYear} (Fiscal YTD through ${selectedMonth})`
                  : 'Custom Date Range (Cumulative)'} •{' '}
                <span className="font-semibold">{getDisplayCount()}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Date Controls */}
      <div className="bg-forvis-gray-50 rounded-lg border border-forvis-gray-200 p-4 mb-4">
        {activeTab === 'fiscal' ? (
          <div className="w-56">
            <FiscalYearSelector
              value={fiscalYear}
              onChange={(val) => setFiscalYear(val as number)}
              allowAllYears={false}
              currentFY={currentFY}
            />
          </div>
        ) : (
          <div className="w-full">
            {dateError && (
              <div className="mb-3">
                <Banner
                  variant="error"
                  message={dateError}
                  dismissible
                  onDismiss={() => setDateError(null)}
                />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end max-w-2xl">
              <Input
                type="date"
                label="Start Date"
                value={customInputs.start}
                onChange={(e) => setCustomInputs(prev => ({ ...prev, start: e.target.value }))}
              />
              <Input
                type="date"
                label="End Date"
                value={customInputs.end}
                onChange={(e) => setCustomInputs(prev => ({ ...prev, end: e.target.value }))}
              />
              <button 
                onClick={handleDateRangeApply}
                className="inline-flex items-center justify-center px-6 py-2 text-sm font-medium rounded-md text-white shadow-sm transition-all duration-200 hover:opacity-90 h-[42px]"
                style={{ background: 'linear-gradient(to right, #2E5AAC, #25488A)' }}
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Month Selector */}
      {activeTab === 'fiscal' && availableMonths.length > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm font-medium text-forvis-gray-700">
            Show cumulative through:
          </label>
          <div className="flex flex-wrap gap-1">
            {availableMonths.map((month) => (
              <button
                key={month}
                onClick={() => setSelectedMonth(month)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  selectedMonth === month
                    ? 'text-white shadow-sm'
                    : 'text-forvis-gray-600 bg-forvis-gray-100 hover:bg-forvis-gray-200'
                }`}
                style={
                  selectedMonth === month
                    ? { background: 'linear-gradient(to right, #2E5AAC, #25488A)' }
                    : {}
                }
              >
                {month}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* View Mode Buttons */}
      <div className="bg-forvis-gray-50 rounded-lg border border-forvis-gray-200 p-4 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
          {viewModeButtons.map(({ mode, icon: Icon, label, shortLabel }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`inline-flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md transition-all duration-200 ${
                viewMode === mode
                  ? 'text-white shadow-sm'
                  : 'text-forvis-gray-700 bg-white border border-forvis-gray-300 hover:bg-forvis-gray-50'
              }`}
              style={
                viewMode === mode
                  ? { background: 'linear-gradient(to right, #2E5AAC, #25488A)' }
                  : {}
              }
            >
              <Icon className="h-4 w-4" />
              <span className="hidden xl:inline">{label}</span>
              <span className="xl:hidden">{shortLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-forvis-gray-600">Loading profitability data...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Banner
          variant="error"
          title="Error Loading Report"
          message={error instanceof Error ? error.message : 'Failed to load profitability report'}
        />
      )}

      {/* Summary Data Display (Partner/Manager views - FAST) */}
      {!isLoading && !error && needsSummary && summaryData && (
        <div className="bg-white rounded-lg shadow-corporate overflow-hidden">
          {viewMode === 'partner' && <PartnerSummaryTable data={summaryData.data} />}
          {viewMode === 'manager' && <ManagerSummaryTable data={summaryData.data} />}
        </div>
      )}

      {/* Detail Data Display (Other views - requires full task data) */}
      {!isLoading && !error && needsDetail && detailData && (
        <>
          {/* Filters */}
          <ReportFilters
            filters={filters}
            onFiltersChange={setFilters}
            availableTasks={detailData.tasks}
          />

          {/* Filtered Count */}
          {filteredTasks.length !== detailData.tasks.length && (
            <div className="mb-3 text-sm text-forvis-gray-600">
              Showing <span className="font-semibold">{filteredTasks.length}</span> of{' '}
              <span className="font-semibold">{detailData.tasks.length}</span> tasks
            </div>
          )}

          {/* Conditional Table Rendering */}
          <div className="bg-white rounded-lg shadow-corporate overflow-hidden">
            {viewMode === 'group' && <GroupTotalsTable tasks={filteredTasks} />}
            {viewMode === 'client' && <ClientTotalsTable tasks={filteredTasks} />}
            {viewMode === 'task' && <TaskDetailsTable tasks={filteredTasks} />}
            {viewMode === 'master-service-line' && <MasterServiceLineTotalsTable tasks={filteredTasks} />}
            {viewMode === 'sub-service-line-group' && <SubServiceLineGroupTotalsTable tasks={filteredTasks} />}
            {viewMode === 'service-line' && <ServiceLineTotalsTable tasks={filteredTasks} />}
          </div>

          {/* Help Section */}
          {filteredTasks.length > 0 && (
            <div className="mt-4">
              <div className="rounded-lg p-3 bg-forvis-gray-50 border border-forvis-gray-200">
                <p className="text-xs text-forvis-gray-600">
                  <strong className="text-forvis-gray-700">Net WIP:</strong> Time + Adjustments +
                  Disbursements - Fees + Provision{' '}
                  {activeTab === 'fiscal' && (
                    <>
                      | <strong className="text-forvis-gray-700">Fiscal YTD:</strong> Cumulative from{' '}
                      Sep 1 of fiscal year through {selectedMonth} (fiscal year-to-date only, not lifetime)
                    </>
                  )}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Help Section for Summary Views */}
      {!isLoading && !error && needsSummary && summaryData && summaryData.data.length > 0 && (
        <div className="mt-4">
          <div className="rounded-lg p-3 bg-forvis-gray-50 border border-forvis-gray-200">
            <p className="text-xs text-forvis-gray-600">
              <strong className="text-forvis-gray-700">Summary View:</strong> Aggregated totals by {viewMode}.{' '}
              {activeTab === 'fiscal' && (
                <>
                  | <strong className="text-forvis-gray-700">Fiscal YTD:</strong> Cumulative from{' '}
                  Sep 1 of fiscal year through {selectedMonth}
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
