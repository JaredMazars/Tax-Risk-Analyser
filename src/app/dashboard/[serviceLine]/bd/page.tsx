/**
 * BD Pipeline Dashboard Page - Kanban View
 * 
 * Uses exact drag-and-drop and caching patterns from tasks kanban.
 */

'use client';

import React, { useState } from 'react';
import { useRouter, useParams, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Plus } from 'lucide-react';
import { useBDKanban } from '@/hooks/bd/useBDKanban';
import { usePipelineAnalytics } from '@/hooks/bd/useBDAnalytics';
import { BDKanbanBoard, BDKanbanFilters } from '@/components/features/bd/Kanban';
import type { BDKanbanFilters as FiltersType, BDDisplayMode } from '@/components/features/bd/Kanban/types';
import { BDOpportunityWizard } from '@/components/features/bd/wizard/BDOpportunityWizard';
import { OpportunityDetailModal } from '@/components/features/bd/OpportunityDetailModal';
import { formatServiceLineName } from '@/lib/utils/serviceLineUtils';
import { Button } from '@/components/ui';
import { GRADIENTS } from '@/lib/design-system/gradients';
import { useQueryClient } from '@tanstack/react-query';

export default function BDPipelinePage() {
  const params = useParams();
  const serviceLine = params.serviceLine as string;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [showWizard, setShowWizard] = useState(false);
  const [resumeOpportunityId, setResumeOpportunityId] = useState<number | null>(null);
  const [displayMode, setDisplayMode] = useState<BDDisplayMode>('detailed');
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(new Set());
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Filters state
  const [filters, setFilters] = useState<FiltersType>({
    search: '',
    assignedTo: [],
    stages: [],
    minValue: undefined,
    maxValue: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    includeDrafts: true, // Show drafts by default
  });

  // Use hook with params object (same as tasks)
  const kanbanParams = {
    serviceLine: serviceLine.toUpperCase(),
    search: filters.search,
    assignedTo: filters.assignedTo,
    stages: filters.stages,
    minValue: filters.minValue,
    maxValue: filters.maxValue,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    includeDrafts: filters.includeDrafts,
  };

  const { data, isLoading, error } = useBDKanban(kanbanParams);

  const analyticsFilters = serviceLine.toUpperCase() === 'BUSINESS_DEV'
    ? {}
    : { serviceLine: serviceLine.toUpperCase() };

  const { data: analytics } = usePipelineAnalytics(analyticsFilters);

  const handleFiltersChange = (newFilters: Partial<FiltersType>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleToggleCollapse = (columnId: string) => {
    setCollapsedColumns(prev => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  };

  const handleOpportunityClick = (opportunityId: number) => {
    // Find the opportunity in kanban data
    const opportunity = data?.columns
      .flatMap(col => col.opportunities)
      .find(opp => opp.id === opportunityId);

    // If draft, open wizard to resume
    if (opportunity?.status === 'DRAFT') {
      setResumeOpportunityId(opportunityId);
      setShowWizard(true);
    } else {
      // Otherwise, open modal
      setSelectedOpportunityId(opportunityId);
      setIsDetailModalOpen(true);
      
      // Update URL for deep linking
      const params = new URLSearchParams(searchParams.toString());
      params.set('opportunityModal', opportunityId.toString());
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setSelectedOpportunityId(null);
    
    // Remove URL parameter
    const params = new URLSearchParams(searchParams.toString());
    params.delete('opportunityModal');
    const newUrl = pathname + (params.toString() ? `?${params}` : '');
    router.replace(newUrl, { scroll: false });
    
    // Invalidate queries to refresh Kanban board
    queryClient.invalidateQueries({ queryKey: ['bd-kanban'] });
  };

  const handleWizardComplete = () => {
    // Invalidate queries to refresh the kanban
    queryClient.invalidateQueries({ queryKey: ['bd-kanban'] });
    queryClient.invalidateQueries({ queryKey: ['bd-analytics'] });
    setShowWizard(false);
    setResumeOpportunityId(null); // Clear resume ID
  };

  const handleWizardCancel = () => {
    setShowWizard(false);
    setResumeOpportunityId(null); // Clear resume ID
  };

  // Handle opening modal from URL parameter (deep linking)
  React.useEffect(() => {
    const opportunityIdParam = searchParams.get('opportunityModal');
    if (opportunityIdParam && !isNaN(parseInt(opportunityIdParam))) {
      const opportunityId = parseInt(opportunityIdParam);
      setSelectedOpportunityId(opportunityId);
      setIsDetailModalOpen(true);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-forvis-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 pb-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-forvis-gray-600 py-4 mb-2">
          <Link href="/dashboard" className="hover:text-forvis-gray-900 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-forvis-blue-500 focus:ring-offset-2 rounded px-1">
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link 
            href={`/dashboard/${serviceLine.toLowerCase()}`} 
            className="hover:text-forvis-gray-900 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-forvis-blue-500 focus:ring-offset-2 rounded px-1"
          >
            {formatServiceLineName(serviceLine.toUpperCase())}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-forvis-gray-900 font-medium">BD Pipeline</span>
        </nav>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-semibold text-forvis-gray-900">
                Business Development Pipeline
              </h1>
              <p className="text-sm font-normal text-forvis-gray-600 mt-1">
                {serviceLine.toUpperCase() === 'BUSINESS_DEV' 
                  ? 'Viewing all opportunities across all service lines'
                  : `Track opportunities for ${formatServiceLineName(serviceLine.toUpperCase())}`}
              </p>
            </div>
            <Button
              variant="gradient"
              onClick={() => setShowWizard(true)}
            >
              <Plus className="w-5 h-5" />
              New Opportunity
            </Button>
          </div>

          {/* Stats Cards */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="bg-gradient-dashboard-card rounded-lg p-4 shadow-corporate border border-forvis-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-forvis-gray-600 uppercase tracking-wider">Total Pipeline Value</p>
                    <p className="text-2xl font-bold mt-2 text-forvis-blue-600">
                      {new Intl.NumberFormat('en-ZA', {
                        style: 'currency',
                        currency: 'ZAR',
                        minimumFractionDigits: 0,
                      }).format(analytics.totalValue || 0)}
                    </p>
                  </div>
                  <div
                    className="rounded-full p-2.5"
                    style={{ background: GRADIENTS.icon.standard }}
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-dashboard-card rounded-lg p-4 shadow-corporate border border-forvis-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-forvis-gray-600 uppercase tracking-wider">Weighted Value</p>
                    <p className="text-2xl font-bold mt-2 text-forvis-blue-600">
                      {new Intl.NumberFormat('en-ZA', {
                        style: 'currency',
                        currency: 'ZAR',
                        minimumFractionDigits: 0,
                      }).format(analytics.weightedValue || 0)}
                    </p>
                  </div>
                  <div
                    className="rounded-full p-2.5"
                    style={{ background: GRADIENTS.icon.standard }}
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-dashboard-card rounded-lg p-4 shadow-corporate border border-forvis-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-forvis-gray-600 uppercase tracking-wider">Open Opportunities</p>
                    <p className="text-2xl font-bold mt-2 text-forvis-blue-600">{analytics.opportunityCount || 0}</p>
                  </div>
                  <div
                    className="rounded-full p-2.5"
                    style={{ background: GRADIENTS.icon.standard }}
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-dashboard-card rounded-lg p-4 shadow-corporate border border-forvis-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-forvis-gray-600 uppercase tracking-wider">Active Stages</p>
                    <p className="text-2xl font-bold mt-2 text-forvis-blue-600">{analytics.byStage?.length || 0}</p>
                  </div>
                  <div
                    className="rounded-full p-2.5"
                    style={{ background: GRADIENTS.icon.standard }}
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <BDKanbanFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            displayMode={displayMode}
            onDisplayModeChange={setDisplayMode}
            stages={data?.stages || []}
            employees={[]} // TODO: Fetch employees from API
          />

          {/* Kanban Board */}
          <BDKanbanBoard
            data={data}
            isLoading={isLoading}
            error={error}
            displayMode={displayMode}
            onOpportunityClick={handleOpportunityClick}
            collapsedColumns={collapsedColumns}
            onToggleCollapse={handleToggleCollapse}
          />
        </div>
      </div>

      {/* BD Opportunity Wizard */}
      <BDOpportunityWizard
        isOpen={showWizard}
        serviceLine={serviceLine.toUpperCase()}
        opportunityId={resumeOpportunityId}
        onComplete={handleWizardComplete}
        onCancel={handleWizardCancel}
      />

      {/* BD Opportunity Detail Modal */}
      {selectedOpportunityId && (
        <OpportunityDetailModal
          isOpen={isDetailModalOpen}
          opportunityId={selectedOpportunityId}
          serviceLine={serviceLine}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

