'use client';

/**
 * Performance Reports Page for Country Management
 * 
 * Business-wide reports with:
 * - Report mode selector (Client / Partner / Manager)
 * - Partner and Manager multi-select filters
 * - Four report tabs: Overview, Profitability, Recoverability, WIP Aging
 * - Reuses existing table components from My Reports
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ChevronRight, BarChart3 } from 'lucide-react';
import { isValidServiceLine, formatServiceLineName } from '@/lib/utils/serviceLineUtils';
import { useServiceLine } from '@/components/providers/ServiceLineProvider';
import { ServiceLine } from '@/types';
import { GRADIENTS } from '@/lib/design-system/gradients';
import { CountryManagementReportsView } from '@/components/features/country-management/reports/CountryManagementReportsView';

export default function PerformanceReportsPage() {
  const router = useRouter();
  const params = useParams();
  const serviceLine = (params.serviceLine as string)?.toUpperCase();
  const { setCurrentServiceLine } = useServiceLine();

  // Validate service line and ensure it's Country Management
  useEffect(() => {
    if (!isValidServiceLine(serviceLine)) {
      router.push('/dashboard');
    } else if (serviceLine !== 'COUNTRY_MANAGEMENT') {
      // Redirect non-Country Management service lines back to their dashboard
      router.push(`/dashboard/${serviceLine.toLowerCase()}`);
    } else {
      setCurrentServiceLine(serviceLine as ServiceLine);
    }
  }, [serviceLine, router, setCurrentServiceLine]);

  if (!isValidServiceLine(serviceLine) || serviceLine !== 'COUNTRY_MANAGEMENT') {
    return null;
  }

  return (
    <div className="min-h-screen bg-forvis-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-forvis-gray-600 mb-6">
          <Link href="/dashboard" className="hover:text-forvis-gray-900 transition-colors">
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link 
            href={`/dashboard/${serviceLine.toLowerCase()}`} 
            className="hover:text-forvis-gray-900 transition-colors"
          >
            {formatServiceLineName(serviceLine)}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link 
            href={`/dashboard/${serviceLine.toLowerCase()}/exco-reporting`} 
            className="hover:text-forvis-gray-900 transition-colors"
          >
            Exco Reporting
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-forvis-gray-900 font-medium">Performance Reports</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm"
              style={{ background: GRADIENTS.icon.standard }}
            >
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-forvis-gray-900">
                Performance Reports
              </h1>
              <p className="text-sm text-forvis-gray-600">
                Business-wide profitability, WIP aging, recoverability, and overview metrics
              </p>
            </div>
          </div>
        </div>

        {/* Main Reports View */}
        <CountryManagementReportsView />
      </div>
    </div>
  );
}
