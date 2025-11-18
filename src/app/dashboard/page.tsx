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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forvis-blue-500 mx-auto"></div>
          <p className="mt-4 text-sm text-forvis-gray-700 font-medium">Loading service lines...</p>
        </div>
      </div>
    );
  }

  if (availableServiceLines.length === 0) {
    return (
      <div className="min-h-screen bg-forvis-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md">
          <div className="bg-white rounded-lg shadow-corporate border-2 p-8 text-center" style={{ borderColor: '#2E5AAC' }}>
            <div className="rounded-full p-4 inline-flex mb-4" style={{ background: 'linear-gradient(to bottom right, #5B93D7, #2E5AAC)' }}>
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-forvis-gray-900 mb-3">No Service Lines Available</h2>
            <p className="text-sm text-forvis-gray-700 mb-6">
              You don't have access to any service lines yet. Please contact your administrator to request access.
            </p>
            <div className="rounded-lg p-4 border-2" style={{ background: 'linear-gradient(135deg, #F8FBFE 0%, #EEF6FC 100%)', borderColor: '#E0EDFB' }}>
              <p className="text-xs font-bold mb-1" style={{ color: '#1C3667' }}>Need Help?</p>
              <p className="text-xs text-forvis-gray-700">
                Contact your system administrator to grant you access to service lines.
              </p>
            </div>
          </div>
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forvis-blue-500 mx-auto"></div>
          <p className="mt-4 text-sm text-forvis-gray-700 font-medium">Redirecting...</p>
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

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div 
            className="rounded-lg p-4 shadow-corporate text-white"
            style={{ background: 'linear-gradient(to bottom right, #2E5AAC, #25488A)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium opacity-90">Total Service Lines</p>
                <p className="text-2xl font-bold mt-1">{availableServiceLines.length}</p>
              </div>
              <div className="rounded-full p-2" style={{ backgroundColor: 'rgba(28, 54, 103, 0.5)' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </div>

          <div 
            className="rounded-lg p-4 shadow-corporate text-white"
            style={{ background: 'linear-gradient(to bottom right, #5B93D7, #2E5AAC)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium opacity-90">Total Projects</p>
                <p className="text-2xl font-bold mt-1">
                  {availableServiceLines.reduce((sum, sl) => sum + sl.projectCount, 0)}
                </p>
              </div>
              <div className="rounded-full p-2" style={{ backgroundColor: 'rgba(37, 72, 138, 0.5)' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div 
            className="rounded-lg p-4 shadow-corporate text-white"
            style={{ background: 'linear-gradient(to bottom right, #25488A, #1C3667)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium opacity-90">Active Projects</p>
                <p className="text-2xl font-bold mt-1">
                  {availableServiceLines.reduce((sum, sl) => sum + sl.activeProjectCount, 0)}
                </p>
              </div>
              <div className="rounded-full p-2" style={{ backgroundColor: 'rgba(19, 36, 69, 0.5)' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Service Line Cards */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-forvis-gray-900 mb-4">
            Your Service Lines
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {availableServiceLines.map((serviceLineData) => (
              <ServiceLineCard
                key={serviceLineData.serviceLine}
                serviceLineData={serviceLineData}
              />
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-white rounded-lg shadow-corporate border-2 overflow-hidden" style={{ borderColor: '#2E5AAC' }}>
          <div 
            className="px-6 py-4"
            style={{ background: 'linear-gradient(135deg, #5B93D7 0%, #2E5AAC 50%, #1C3667 100%)' }}
          >
            <h2 className="text-2xl font-bold text-white mb-1">
              About Our Service Lines
            </h2>
            <p className="text-sm text-white opacity-90">
              Comprehensive professional services tailored to your needs
            </p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-lg p-4 border-2" style={{ background: 'linear-gradient(135deg, #F8FBFE 0%, #EEF6FC 100%)', borderColor: '#E0EDFB' }}>
                <div className="flex items-start gap-3 mb-2">
                  <div className="rounded-lg p-2 bg-blue-100 border border-blue-200">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-forvis-gray-900 mb-1">
                      Tax
                    </h3>
                    <p className="text-sm text-forvis-gray-700">
                      Comprehensive tax services including compliance, planning, opinions, and administration for individuals and businesses.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4 border-2" style={{ background: 'linear-gradient(135deg, #F8FBFE 0%, #EEF6FC 100%)', borderColor: '#E0EDFB' }}>
                <div className="flex items-start gap-3 mb-2">
                  <div className="rounded-lg p-2 bg-green-100 border border-green-200">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-forvis-gray-900 mb-1">
                      Audit
                    </h3>
                    <p className="text-sm text-forvis-gray-700">
                      Professional audit and assurance services ensuring financial statement accuracy and regulatory compliance.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4 border-2" style={{ background: 'linear-gradient(135deg, #F8FBFE 0%, #EEF6FC 100%)', borderColor: '#E0EDFB' }}>
                <div className="flex items-start gap-3 mb-2">
                  <div className="rounded-lg p-2 bg-purple-100 border border-purple-200">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-forvis-gray-900 mb-1">
                      Accounting
                    </h3>
                    <p className="text-sm text-forvis-gray-700">
                      Full-service accounting solutions from bookkeeping to financial statement preparation and management reporting.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4 border-2" style={{ background: 'linear-gradient(135deg, #F8FBFE 0%, #EEF6FC 100%)', borderColor: '#E0EDFB' }}>
                <div className="flex items-start gap-3 mb-2">
                  <div className="rounded-lg p-2 bg-orange-100 border border-orange-200">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-forvis-gray-900 mb-1">
                      Advisory
                    </h3>
                    <p className="text-sm text-forvis-gray-700">
                      Strategic consulting and advisory services to help businesses navigate challenges and seize opportunities.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
