'use client';

/**
 * WIP Aging Table Component
 * 
 * Displays individual task rows with 7 aging buckets.
 * Columns: Client | Task | Service Line | Curr | 30 | 60 | 90 | 120 | 150 | 180+ | Total | Fees | Provision | Net WIP
 */

import { useState } from 'react';
import { Pagination } from '@/components/shared/Pagination';
import { Badge } from '@/components/ui/Badge';
import type { WIPAgingTaskData } from '@/types/api';

interface WIPAgingTableProps {
  tasks: WIPAgingTaskData[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper to get badge color based on service line code
const getServiceLineBadgeColor = (servLineCode: string): 'blue' | 'purple' | 'green' | 'orange' | 'gray' => {
  const code = servLineCode.toUpperCase();
  
  if (code.includes('TAX')) return 'blue';
  if (code.includes('AUDIT')) return 'green';
  if (code.includes('ACCOUNT') || code.includes('ACCT')) return 'purple';
  if (code.includes('ADVISORY') || code.includes('CONSULT')) return 'orange';
  
  return 'gray';
};

export function WIPAgingTable({ tasks }: WIPAgingTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  // Sort tasks by client code then task code
  const sortedTasks = [...tasks].sort((a, b) => {
    const clientCompare = a.clientCode.localeCompare(b.clientCode);
    if (clientCompare !== 0) return clientCompare;
    return a.taskCode.localeCompare(b.taskCode);
  });

  // Pagination calculation
  const totalPages = Math.ceil(sortedTasks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTasks = sortedTasks.slice(startIndex, endIndex);

  // Calculate grand totals for current page
  const grandTotals = {
    taskCount: paginatedTasks.length,
    curr: paginatedTasks.reduce((sum, t) => sum + t.aging.curr, 0),
    bal30: paginatedTasks.reduce((sum, t) => sum + t.aging.bal30, 0),
    bal60: paginatedTasks.reduce((sum, t) => sum + t.aging.bal60, 0),
    bal90: paginatedTasks.reduce((sum, t) => sum + t.aging.bal90, 0),
    bal120: paginatedTasks.reduce((sum, t) => sum + t.aging.bal120, 0),
    bal150: paginatedTasks.reduce((sum, t) => sum + t.aging.bal150, 0),
    bal180: paginatedTasks.reduce((sum, t) => sum + t.aging.bal180, 0),
    balWip: paginatedTasks.reduce((sum, t) => sum + t.balWip, 0),
    ptdFeeAmt: paginatedTasks.reduce((sum, t) => sum + t.ptdFeeAmt, 0),
    provision: paginatedTasks.reduce((sum, t) => sum + t.provision, 0),
    nettWip: paginatedTasks.reduce((sum, t) => sum + t.nettWip, 0),
  };

  if (sortedTasks.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-forvis-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-forvis-gray-900">No tasks found</h3>
        <p className="mt-1 text-sm text-forvis-gray-500">
          No tasks match the current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full align-middle">
        {/* Table Header */}
        <div
          className="grid gap-2 py-3 px-4 text-xs font-semibold text-white shadow-corporate"
          style={{
            background: 'linear-gradient(to right, #2E5AAC, #25488A)',
            gridTemplateColumns: '1.5fr 1.5fr 120px 90px 90px 90px 90px 90px 90px 90px 100px 100px 90px 100px',
          }}
        >
          <div>Client</div>
          <div>Task</div>
          <div>Service Line</div>
          <div className="text-right">Curr</div>
          <div className="text-right">30</div>
          <div className="text-right">60</div>
          <div className="text-right">90</div>
          <div className="text-right">120</div>
          <div className="text-right">150</div>
          <div className="text-right">180+</div>
          <div className="text-right">Total WIP</div>
          <div className="text-right">Fees</div>
          <div className="text-right">Provision</div>
          <div className="text-right">Net WIP</div>
        </div>

        {/* Table Body */}
        <div className="bg-white">
          {paginatedTasks.map((task, index) => (
            <div
              key={task.GSTaskID}
              className={`grid gap-2 py-2 px-4 text-xs transition-colors duration-200 hover:bg-forvis-blue-50 ${
                index % 2 === 0 ? 'bg-white' : 'bg-forvis-gray-50'
              }`}
              style={{ gridTemplateColumns: '1.5fr 1.5fr 120px 90px 90px 90px 90px 90px 90px 90px 100px 100px 90px 100px' }}
            >
              <div className="text-forvis-gray-900 truncate" title={`${task.clientCode} - ${task.clientName || 'Unnamed'}`}>
                <span className="font-medium">{task.clientCode}</span>
                {' - '}
                {task.clientName || 'Unnamed'}
              </div>
              <div className="text-forvis-gray-900 truncate" title={`${task.taskCode} - ${task.taskDesc}`}>
                <span className="font-medium">{task.taskCode}</span>
                {' - '}
                {task.taskDesc}
              </div>
              <div>
                <Badge color={getServiceLineBadgeColor(task.servLineCode)}>
                  {task.servLineDesc}
                </Badge>
              </div>
              <div className={`text-right tabular-nums ${task.aging.curr !== 0 ? 'text-forvis-gray-900' : 'text-forvis-gray-400'}`}>
                {formatCurrency(task.aging.curr)}
              </div>
              <div className={`text-right tabular-nums ${task.aging.bal30 !== 0 ? 'text-forvis-gray-900' : 'text-forvis-gray-400'}`}>
                {formatCurrency(task.aging.bal30)}
              </div>
              <div className={`text-right tabular-nums ${task.aging.bal60 !== 0 ? 'text-forvis-warning-600' : 'text-forvis-gray-400'}`}>
                {formatCurrency(task.aging.bal60)}
              </div>
              <div className={`text-right tabular-nums ${task.aging.bal90 !== 0 ? 'text-forvis-warning-600' : 'text-forvis-gray-400'}`}>
                {formatCurrency(task.aging.bal90)}
              </div>
              <div className={`text-right tabular-nums ${task.aging.bal120 !== 0 ? 'text-forvis-error-600' : 'text-forvis-gray-400'}`}>
                {formatCurrency(task.aging.bal120)}
              </div>
              <div className={`text-right tabular-nums ${task.aging.bal150 !== 0 ? 'text-forvis-error-600' : 'text-forvis-gray-400'}`}>
                {formatCurrency(task.aging.bal150)}
              </div>
              <div className={`text-right tabular-nums font-semibold ${task.aging.bal180 !== 0 ? 'text-forvis-error-700' : 'text-forvis-gray-400'}`}>
                {formatCurrency(task.aging.bal180)}
              </div>
              <div className={`text-right tabular-nums font-semibold ${
                task.balWip < 0 ? 'text-forvis-error-600' : 'text-forvis-blue-600'
              }`}>
                {formatCurrency(task.balWip)}
              </div>
              <div className={`text-right tabular-nums ${
                task.ptdFeeAmt < 0 ? 'text-forvis-success-600' : 'text-forvis-gray-700'
              }`}>
                {formatCurrency(task.ptdFeeAmt)}
              </div>
              <div className="text-right tabular-nums text-forvis-gray-700">
                {formatCurrency(task.provision)}
              </div>
              <div className={`text-right tabular-nums font-bold ${
                task.nettWip < 0 ? 'text-forvis-error-600' : 'text-forvis-blue-700'
              }`}>
                {formatCurrency(task.nettWip)}
              </div>
            </div>
          ))}

          {/* Totals Row */}
          <div
            className="grid gap-2 py-3 px-4 text-xs font-bold border-t-2 border-forvis-blue-500"
            style={{
              background: 'linear-gradient(135deg, #F0F7FD 0%, #E0EDFB 100%)',
              gridTemplateColumns: '1.5fr 1.5fr 120px 90px 90px 90px 90px 90px 90px 90px 100px 100px 90px 100px'
            }}
          >
            <div className="text-forvis-blue-800" style={{ gridColumn: 'span 2' }}>
              TOTAL (Page {currentPage} of {totalPages})
            </div>
            <div className="text-forvis-blue-800">{grandTotals.taskCount} tasks</div>
            <div className="text-right tabular-nums text-forvis-blue-800">
              {formatCurrency(grandTotals.curr)}
            </div>
            <div className="text-right tabular-nums text-forvis-blue-800">
              {formatCurrency(grandTotals.bal30)}
            </div>
            <div className="text-right tabular-nums text-forvis-warning-600">
              {formatCurrency(grandTotals.bal60)}
            </div>
            <div className="text-right tabular-nums text-forvis-warning-600">
              {formatCurrency(grandTotals.bal90)}
            </div>
            <div className="text-right tabular-nums text-forvis-error-600">
              {formatCurrency(grandTotals.bal120)}
            </div>
            <div className="text-right tabular-nums text-forvis-error-600">
              {formatCurrency(grandTotals.bal150)}
            </div>
            <div className="text-right tabular-nums text-forvis-error-700">
              {formatCurrency(grandTotals.bal180)}
            </div>
            <div className={`text-right tabular-nums ${
              grandTotals.balWip < 0 ? 'text-forvis-error-600' : 'text-forvis-blue-800'
            }`}>
              {formatCurrency(grandTotals.balWip)}
            </div>
            <div className={`text-right tabular-nums ${
              grandTotals.ptdFeeAmt < 0 ? 'text-forvis-success-600' : 'text-forvis-blue-800'
            }`}>
              {formatCurrency(grandTotals.ptdFeeAmt)}
            </div>
            <div className="text-right tabular-nums text-forvis-blue-800">
              {formatCurrency(grandTotals.provision)}
            </div>
            <div className={`text-right tabular-nums ${
              grandTotals.nettWip < 0 ? 'text-forvis-error-600' : 'text-forvis-blue-800'
            }`}>
              {formatCurrency(grandTotals.nettWip)}
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={sortedTasks.length}
        itemsPerPage={ITEMS_PER_PAGE}
        showMetadata
        className="mt-4 px-4"
      />
    </div>
  );
}
