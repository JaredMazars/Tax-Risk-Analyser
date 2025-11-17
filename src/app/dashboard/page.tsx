'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ServiceLineCard } from '@/components/features/service-lines/ServiceLineCard';
import { useServiceLine } from '@/components/providers/ServiceLineProvider';

export default function DashboardHomePage() {
  const router = useRouter();
  const { availableServiceLines, isLoading, setCurrentServiceLine } = useServiceLine();

  // Clear any stored service line when landing on this page
  useEffect(() => {
    setCurrentServiceLine(null);
  }, [setCurrentServiceLine]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-forvis-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forvis-blue-600 mx-auto"></div>
          <p className="mt-4 text-forvis-gray-700">Loading service lines...</p>
        </div>
      </div>
    );
  }

  if (availableServiceLines.length === 0) {
    return (
      <div className="min-h-screen bg-forvis-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-forvis-gray-900 mb-4">No Service Lines Available</h2>
          <p className="text-forvis-gray-700">
            You don't have access to any service lines yet. Please contact your administrator to request access.
          </p>
        </div>
      </div>
    );
  }

  // If user only has access to one service line, redirect automatically
  if (availableServiceLines.length === 1 && availableServiceLines[0]) {
    const serviceLine = availableServiceLines[0].serviceLine.toLowerCase();
    router.push(`/dashboard/${serviceLine}`);
    return (
      <div className="min-h-screen bg-forvis-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forvis-blue-600 mx-auto"></div>
          <p className="mt-4 text-forvis-gray-700">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forvis-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold text-forvis-gray-900 mb-2">
            Welcome to Forvis Mazars
          </h1>
          <p className="text-sm text-forvis-gray-600">
            Select a service line to get started
          </p>
        </div>

        {/* Service Line Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {availableServiceLines.map((serviceLineData) => (
            <ServiceLineCard
              key={serviceLineData.serviceLine}
              serviceLineData={serviceLineData}
            />
          ))}
        </div>

        {/* Info Section */}
        <div className="bg-white rounded-lg border border-forvis-gray-200 shadow-corporate p-6">
          <div className="mb-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-forvis-gray-900 mb-1">
              About Our Service Lines
            </h2>
            <p className="text-sm text-forvis-gray-600">
              Comprehensive professional services tailored to your needs
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-forvis-gray-900 mb-2">
                Tax
              </h3>
              <p className="text-sm text-forvis-gray-800">
                Comprehensive tax services including compliance, planning, opinions, and administration for individuals and businesses.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-forvis-gray-900 mb-2">
                Audit
              </h3>
              <p className="text-sm text-forvis-gray-800">
                Professional audit and assurance services ensuring financial statement accuracy and regulatory compliance.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-forvis-gray-900 mb-2">
                Accounting
              </h3>
              <p className="text-sm text-forvis-gray-800">
                Full-service accounting solutions from bookkeeping to financial statement preparation and management reporting.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-forvis-gray-900 mb-2">
                Advisory
              </h3>
              <p className="text-sm text-forvis-gray-800">
                Strategic consulting and advisory services to help businesses navigate challenges and seize opportunities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
