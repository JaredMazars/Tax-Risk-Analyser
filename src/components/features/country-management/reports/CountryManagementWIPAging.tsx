'use client';

/**
 * Country Management WIP Aging Report
 * 
 * Business-wide WIP aging analysis with FIFO methodology.
 * Uses summary SPs for fast partner/manager views.
 */

import { useState, useEffect } from 'react';
import { Users, UserCog } from 'lucide-react';
import { Input, LoadingSpinner } from '@/components/ui';
import { Banner } from '@/components/ui/Banner';
import { useCountryManagementWIPAgingSummary } from '@/hooks/country-management/useCountryManagementWIPAgingSummary';
import { WIPAgingPartnerSummaryTable } from './tables/WIPAgingPartnerSummaryTable';
import { WIPAgingManagerSummaryTable } from './tables/WIPAgingManagerSummaryTable';
import { format, parseISO } from 'date-fns';
import type { ReportMode } from './ReportModeSelector';

type ViewMode = 'partner' | 'manager';

interface CountryManagementWIPAgingProps {
  reportMode: ReportMode;
  selectedPartners: string[];
  selectedManagers: string[];
}

export function CountryManagementWIPAging({
  reportMode,
  selectedPartners,
  selectedManagers,
}: CountryManagementWIPAgingProps) {
  // State for as-of date
  const [asOfDate, setAsOfDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  // Determine default view mode based on report mode
  const getDefaultViewMode = (mode: ReportMode): ViewMode => {
    return mode === 'manager' ? 'manager' : 'partner';
  };

  const [viewMode, setViewMode] = useState<ViewMode>(getDefaultViewMode(reportMode));

  // Summary data hook
  const { 
    data: summaryData, 
    isLoading, 
    error 
  } = useCountryManagementWIPAgingSummary({
    aggregateBy: viewMode,
    asOfDate,
    partnerCodes: selectedPartners.length > 0 ? selectedPartners : undefined,
    managerCodes: selectedManagers.length > 0 ? selectedManagers : undefined,
    enabled: true,
  });

  // Update view mode when report mode changes
  useEffect(() => {
    setViewMode(getDefaultViewMode(reportMode));
  }, [reportMode]);

  // View mode buttons
  const viewModeButtons = [
    { mode: 'partner' as ViewMode, icon: Users, label: 'By Partner', shortLabel: 'Partner' },
    { mode: 'manager' as ViewMode, icon: UserCog, label: 'By Manager', shortLabel: 'Manager' },
  ];

  return (
    <div>
      {/* Date Controls */}
      <div className="bg-forvis-gray-50 rounded-lg border border-forvis-gray-200 p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="w-56">
            <Input
              type="date"
              label="As of Date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
            />
          </div>
          {summaryData && (
            <div
              className="rounded-lg px-3 py-1.5 border border-forvis-blue-100 self-center"
              style={{ background: 'linear-gradient(135deg, #F0F7FD 0%, #E0EDFB 100%)' }}
            >
              <p className="text-xs text-forvis-gray-700 whitespace-nowrap">
                <span className="font-semibold">As of:</span>{' '}
                {format(parseISO(summaryData.asOfDate), 'dd MMM yyyy')} •{' '}
                <span className="font-semibold">{summaryData.totalRows}</span>{' '}
                {viewMode === 'partner' ? 'partners' : 'managers'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* View Mode Buttons */}
      <div className="bg-forvis-gray-50 rounded-lg border border-forvis-gray-200 p-4 mb-4">
        <div className="flex gap-2">
          {viewModeButtons.map(({ mode, icon: Icon, label, shortLabel }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`inline-flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
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
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{shortLabel}</span>
            </button>
          ))}
        </div>
      </div>

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
      {!isLoading && !error && summaryData && (
        <>
          <div className="bg-white rounded-lg shadow-corporate overflow-hidden">
            {viewMode === 'partner' && <WIPAgingPartnerSummaryTable data={summaryData.data} />}
            {viewMode === 'manager' && <WIPAgingManagerSummaryTable data={summaryData.data} />}
          </div>

          {/* Help Section */}
          {summaryData.data.length > 0 && (
            <div className="mt-4">
              <div className="rounded-lg p-3 bg-forvis-gray-50 border border-forvis-gray-200">
                <p className="text-xs text-forvis-gray-600">
                  <strong className="text-forvis-gray-700">Aging Buckets:</strong> Current (0-30 days), 
                  30 (31-60 days), 60 (61-90 days), 90 (91-120 days), 
                  120 (121-150 days), 150 (151-180 days), 180+ (over 180 days) |{' '}
                  <strong className="text-forvis-gray-700">Bal WIP:</strong> Gross WIP minus fees billed |{' '}
                  <strong className="text-forvis-gray-700">Net WIP:</strong> Bal WIP plus provisions
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
