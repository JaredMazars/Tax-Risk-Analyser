'use client';

/**
 * Country Management Overview Report
 * 
 * Business-wide performance overview metrics and charts.
 * Similar to My Reports Overview but with business-wide data.
 */

import { BarChart3 } from 'lucide-react';
import type { ReportMode } from './ReportModeSelector';

interface CountryManagementOverviewProps {
  reportMode: ReportMode;
  selectedPartners: string[];
  selectedManagers: string[];
}

export function CountryManagementOverview({
  reportMode,
  selectedPartners,
  selectedManagers,
}: CountryManagementOverviewProps) {
  // TODO: Implement full overview charts and metrics
  // This will be similar to MyReportsOverview but with business-wide data
  
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center max-w-md">
        <div
          className="inline-flex rounded-full p-4 mb-4"
          style={{ background: 'linear-gradient(to bottom right, #5B93D7, #2E5AAC)' }}
        >
          <BarChart3 className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-forvis-gray-900 mb-2">
          Business-Wide Overview
        </h3>
        <p className="text-sm text-forvis-gray-700 mb-4">
          Performance metrics and trend charts showing business-wide data with optional partner/manager filtering.
        </p>
        <div className="rounded-lg p-4 border border-forvis-blue-100" style={{ background: 'linear-gradient(135deg, #F0F7FD 0%, #E0EDFB 100%)' }}>
          <p className="text-xs text-forvis-gray-600">
            <strong>Report Mode:</strong> {reportMode === 'client' ? 'Client Reports' : reportMode === 'partner' ? 'Partner Reports' : 'Manager Reports'}
            <br />
            <strong>Filters:</strong> {selectedPartners.length} partner(s), {selectedManagers.length} manager(s)
          </p>
        </div>
        <p className="text-xs text-forvis-gray-500 mt-4">
          Full implementation coming soon - includes cumulative revenue, profit, collections, and lockup metrics.
        </p>
      </div>
    </div>
  );
}
