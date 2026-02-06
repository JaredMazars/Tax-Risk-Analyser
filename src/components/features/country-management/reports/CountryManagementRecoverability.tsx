'use client';

/**
 * Country Management Recoverability Report
 * 
 * Business-wide debtor aging and collections analysis.
 * Similar to My Reports Recoverability but with business-wide data.
 */

import { Banknote } from 'lucide-react';
import type { ReportMode } from './ReportModeSelector';

interface CountryManagementRecoverabilityProps {
  reportMode: ReportMode;
  selectedPartners: string[];
  selectedManagers: string[];
}

export function CountryManagementRecoverability({
  reportMode,
  selectedPartners,
  selectedManagers,
}: CountryManagementRecoverabilityProps) {
  // TODO: Implement full recoverability analysis
  // This will be similar to RecoverabilityReport but with business-wide data
  
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center max-w-md">
        <div
          className="inline-flex rounded-full p-4 mb-4"
          style={{ background: 'linear-gradient(to bottom right, #5B93D7, #2E5AAC)' }}
        >
          <Banknote className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-forvis-gray-900 mb-2">
          Business-Wide Recoverability
        </h3>
        <p className="text-sm text-forvis-gray-700 mb-4">
          Debtor aging analysis and collections tracking with optional partner/manager filtering.
        </p>
        <div className="rounded-lg p-4 border border-forvis-blue-100" style={{ background: 'linear-gradient(135deg, #F0F7FD 0%, #E0EDFB 100%)' }}>
          <p className="text-xs text-forvis-gray-600">
            <strong>Report Mode:</strong> {reportMode === 'client' ? 'Client Reports' : reportMode === 'partner' ? 'Partner Reports' : 'Manager Reports'}
            <br />
            <strong>Filters:</strong> {selectedPartners.length} partner(s), {selectedManagers.length} manager(s)
          </p>
        </div>
        <p className="text-xs text-forvis-gray-500 mt-4">
          Full implementation coming soon - includes aging buckets (Current, 31-60, 61-90, 91-120, 120+) and receipts tracking.
        </p>
      </div>
    </div>
  );
}
