'use client';

/**
 * Country Management Reports View
 * 
 * Business-wide reports with:
 * - Report mode selector (Client / Partner / Manager)
 * - Partner and Manager multi-select filters  
 * - Four report tabs: Overview, Profitability, Recoverability, WIP Aging
 * - Aggregation by selected mode
 */

import { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Banknote, 
  Clock,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui';
import { Banner } from '@/components/ui/Banner';
import { ReportModeSelector, type ReportMode } from './ReportModeSelector';
import { PartnerManagerFilters } from './PartnerManagerFilters';
import { CountryManagementOverview } from './CountryManagementOverview';
import { CountryManagementProfitability } from './CountryManagementProfitability';
import { CountryManagementRecoverability } from './CountryManagementRecoverability';
import { CountryManagementWIPAging } from './CountryManagementWIPAging';

type ReportTab = 'overview' | 'profitability' | 'recoverability' | 'wip-aging';

const tabs: { id: ReportTab; label: string; icon: typeof LayoutDashboard; description: string }[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    description: 'Business-wide performance metrics and trends',
  },
  {
    id: 'profitability',
    label: 'Profitability',
    icon: TrendingUp,
    description: 'Net revenue, gross profit, and WIP analysis',
  },
  {
    id: 'recoverability',
    label: 'Recoverability',
    icon: Banknote,
    description: 'Debtor aging and collections analysis',
  },
  {
    id: 'wip-aging',
    label: 'WIP Aging',
    icon: Clock,
    description: 'Work in progress aging buckets',
  },
];

export function CountryManagementReportsView() {
  // Report mode state
  const [reportMode, setReportMode] = useState<ReportMode>('client');
  
  // Filter state
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [selectedManagers, setSelectedManagers] = useState<string[]>([]);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');

  // Compute if any filters are active
  const hasActiveFilters = selectedPartners.length > 0 || selectedManagers.length > 0;

  // Clear all filters
  const clearFilters = () => {
    setSelectedPartners([]);
    setSelectedManagers([]);
  };

  return (
    <div className="space-y-6">
      {/* Report Mode Selector */}
      <div className="bg-white rounded-lg border border-forvis-gray-200 shadow-sm p-4">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <ReportModeSelector value={reportMode} onChange={setReportMode} />
          
          {/* Filter Toggle Button */}
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              hasActiveFilters
                ? 'bg-forvis-blue-100 text-forvis-blue-700 border border-forvis-blue-300'
                : 'bg-white text-forvis-gray-700 border border-forvis-gray-300 hover:bg-forvis-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-forvis-blue-600 text-white rounded-full">
                {selectedPartners.length + selectedManagers.length}
              </span>
            )}
            {filtersExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Expandable Filters */}
        {filtersExpanded && (
          <div className="mt-4 pt-4 border-t border-forvis-gray-200">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-forvis-gray-600">
                Filter reports to specific partners or managers
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-forvis-blue-600 hover:text-forvis-blue-800 font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
            <PartnerManagerFilters
              selectedPartners={selectedPartners}
              selectedManagers={selectedManagers}
              onPartnersChange={setSelectedPartners}
              onManagersChange={setSelectedManagers}
            />
          </div>
        )}
      </div>

      {/* Report Mode Info Banner */}
      <div
        className="rounded-lg px-4 py-3 border border-forvis-blue-100"
        style={{ background: 'linear-gradient(135deg, #F0F7FD 0%, #E0EDFB 100%)' }}
      >
        <p className="text-sm text-forvis-gray-700">
          <span className="font-semibold">Report Mode:</span>{' '}
          {reportMode === 'client' && 'Aggregated by client and group'}
          {reportMode === 'partner' && 'Aggregated by task partner'}
          {reportMode === 'manager' && 'Aggregated by task manager'}
          {hasActiveFilters && (
            <>
              {' '}•{' '}
              <span className="font-semibold">Filters:</span>{' '}
              {selectedPartners.length > 0 && `${selectedPartners.length} partner(s)`}
              {selectedPartners.length > 0 && selectedManagers.length > 0 && ', '}
              {selectedManagers.length > 0 && `${selectedManagers.length} manager(s)`}
            </>
          )}
        </p>
      </div>

      {/* Report Tabs */}
      <div className="bg-white rounded-lg border border-forvis-gray-200 shadow-sm">
        {/* Tab Navigation */}
        <div className="border-b border-forvis-gray-200">
          <nav className="flex -mb-px overflow-x-auto" role="tablist">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'border-forvis-blue-600 text-forvis-blue-600'
                      : 'border-transparent text-forvis-gray-600 hover:text-forvis-gray-900 hover:border-forvis-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === 'overview' && (
            <CountryManagementOverview
              reportMode={reportMode}
              selectedPartners={selectedPartners}
              selectedManagers={selectedManagers}
            />
          )}
          {activeTab === 'profitability' && (
            <CountryManagementProfitability
              reportMode={reportMode}
              selectedPartners={selectedPartners}
              selectedManagers={selectedManagers}
            />
          )}
          {activeTab === 'recoverability' && (
            <CountryManagementRecoverability
              reportMode={reportMode}
              selectedPartners={selectedPartners}
              selectedManagers={selectedManagers}
            />
          )}
          {activeTab === 'wip-aging' && (
            <CountryManagementWIPAging
              reportMode={reportMode}
              selectedPartners={selectedPartners}
              selectedManagers={selectedManagers}
            />
          )}
        </div>
      </div>
    </div>
  );
}
