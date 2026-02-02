'use client';

/**
 * Task Details Table Component
 * 
 * Displays individual task rows
 * Columns: Client | Task | Service Line (badge) | Net WIP
 */

import { useState } from 'react';
import { Pagination } from '@/components/shared/Pagination';
import { Badge } from '@/components/ui/Badge';
import type { TaskWithWIPAndServiceLine } from '@/types/api';

interface TaskDetailsTableProps {
  tasks: TaskWithWIPAndServiceLine[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-ZA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

const formatPercentage = (percent: number) => {
  return `${percent.toFixed(2)}%`;
};

// Helper to get badge color based on service line code
const getServiceLineBadgeColor = (servLineCode: string): 'blue' | 'purple' | 'green' | 'orange' | 'gray' => {
  const code = servLineCode.toUpperCase();
  
  // Client-facing service lines
  if (code.includes('TAX')) return 'blue';
  if (code.includes('AUDIT')) return 'green';
  if (code.includes('ACCOUNT') || code.includes('ACCT')) return 'purple';
  if (code.includes('ADVISORY') || code.includes('CONSULT')) return 'orange';
  
  // Shared services (gray)
  return 'gray';
};

export function TaskDetailsTable({ tasks }: TaskDetailsTableProps) {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;
  
  // Sort state
  const [sortConfig, setSortConfig] = useState<{key: keyof TaskWithWIPAndServiceLine; direction: 'asc' | 'desc'} | null>(null);
  
  // Handle sort
  const handleSort = (key: keyof TaskWithWIPAndServiceLine) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' }; // Default to desc for amounts (highest first)
    });
  };

  // Apply sorting
  const sortedTasks = [...tasks].sort((a, b) => {
    // Apply custom sort if active
    if (sortConfig) {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }
      
      // Handle numeric comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      }
      
      return 0;
    }
    
    // Default sort by client code then task code
    const clientCompare = a.clientCode.localeCompare(b.clientCode);
    if (clientCompare !== 0) return clientCompare;
    return a.TaskCode.localeCompare(b.TaskCode);
  });

  // Pagination calculation
  const totalPages = Math.ceil(sortedTasks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTasks = sortedTasks.slice(startIndex, endIndex);

  // Calculate grand totals for current page
  const grandTotals = {
    taskCount: paginatedTasks.length,
    totalWIP: paginatedTasks.reduce((sum, t) => sum + t.netWip, 0),
    ltdWipProvision: paginatedTasks.reduce((sum, t) => sum + t.ltdWipProvision, 0),
    balWip: paginatedTasks.reduce((sum, t) => sum + t.balWip, 0),
    grossProduction: paginatedTasks.reduce((sum, t) => sum + t.grossProduction, 0),
    ltdAdj: paginatedTasks.reduce((sum, t) => sum + t.ltdAdj, 0),
    netRevenue: paginatedTasks.reduce((sum, t) => sum + t.netRevenue, 0),
    ltdCost: paginatedTasks.reduce((sum, t) => sum + t.ltdCost, 0),
    grossProfit: paginatedTasks.reduce((sum, t) => sum + t.grossProfit, 0),
  };
  
  const totalAdjPercentage = grandTotals.grossProduction !== 0 
    ? (grandTotals.ltdAdj / grandTotals.grossProduction) * 100 
    : 0;
  const totalGPPercentage = grandTotals.netRevenue !== 0 
    ? (grandTotals.grossProfit / grandTotals.netRevenue) * 100 
    : 0;

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
          className="grid gap-3 py-3 px-4 text-xs font-semibold text-white shadow-corporate"
          style={{
            background: 'linear-gradient(to right, #2E5AAC, #25488A)',
            gridTemplateColumns: '1.5fr 2fr 140px 120px 120px 120px 120px 120px 120px 100px 120px 120px 120px',
          }}
        >
          <div 
            className="cursor-pointer hover:text-white/80 flex items-center gap-1"
            onClick={() => handleSort('clientCode')}
          >
            <span>Client</span>
            {sortConfig?.key === 'clientCode' && (
              <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            className="cursor-pointer hover:text-white/80 flex items-center gap-1"
            onClick={() => handleSort('TaskCode')}
          >
            <span>Task</span>
            {sortConfig?.key === 'TaskCode' && (
              <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div className="min-w-[120px]">Service Line</div>
          <div 
            className="text-right cursor-pointer hover:text-white/80 flex items-center justify-end gap-1"
            onClick={() => handleSort('netWip')}
          >
            <span>Net WIP</span>
            {sortConfig?.key === 'netWip' && (
              <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            className="text-right cursor-pointer hover:text-white/80 flex items-center justify-end gap-1"
            onClick={() => handleSort('ltdWipProvision')}
          >
            <span>WIP Provision</span>
            {sortConfig?.key === 'ltdWipProvision' && (
              <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            className="text-right cursor-pointer hover:text-white/80 flex items-center justify-end gap-1"
            onClick={() => handleSort('balWip')}
          >
            <span>Balance WIP</span>
            {sortConfig?.key === 'balWip' && (
              <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            className="text-right cursor-pointer hover:text-white/80 flex items-center justify-end gap-1"
            onClick={() => handleSort('grossProduction')}
          >
            <span>Production</span>
            {sortConfig?.key === 'grossProduction' && (
              <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            className="text-right cursor-pointer hover:text-white/80 flex items-center justify-end gap-1"
            onClick={() => handleSort('ltdAdj')}
          >
            <span>Adjustments</span>
            {sortConfig?.key === 'ltdAdj' && (
              <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            className="text-right cursor-pointer hover:text-white/80 flex items-center justify-end gap-1"
            onClick={() => handleSort('netRevenue')}
          >
            <span>Net Revenue</span>
            {sortConfig?.key === 'netRevenue' && (
              <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            className="text-right cursor-pointer hover:text-white/80 flex items-center justify-end gap-1"
            onClick={() => handleSort('adjustmentPercentage')}
          >
            <span>Adj %</span>
            {sortConfig?.key === 'adjustmentPercentage' && (
              <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            className="text-right cursor-pointer hover:text-white/80 flex items-center justify-end gap-1"
            onClick={() => handleSort('ltdCost')}
          >
            <span>Cost</span>
            {sortConfig?.key === 'ltdCost' && (
              <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            className="text-right cursor-pointer hover:text-white/80 flex items-center justify-end gap-1"
            onClick={() => handleSort('grossProfit')}
          >
            <span>Gross Profit</span>
            {sortConfig?.key === 'grossProfit' && (
              <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            className="text-right cursor-pointer hover:text-white/80 flex items-center justify-end gap-1"
            onClick={() => handleSort('grossProfitPercentage')}
          >
            <span>GP %</span>
            {sortConfig?.key === 'grossProfitPercentage' && (
              <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
        </div>

        {/* Table Body */}
        <div className="bg-white">
          {paginatedTasks.map((task, index) => (
            <div
              key={task.id}
              className={`grid gap-3 py-3 px-4 text-xs transition-colors duration-200 hover:bg-forvis-blue-50 ${
                index % 2 === 0 ? 'bg-white' : 'bg-forvis-gray-50'
              }`}
              style={{ gridTemplateColumns: '1.5fr 2fr 140px 120px 120px 120px 120px 120px 120px 100px 120px 120px 120px' }}
            >
              <div className="text-forvis-gray-900">
                <span className="font-medium">{task.clientCode}</span>
                {' - '}
                {task.clientNameFull || 'Unnamed Client'}
              </div>
              <div className="text-forvis-gray-900">
                <span className="font-medium">{task.TaskCode}</span>
                {' - '}
                {task.TaskDesc}
              </div>
              <div className="min-w-[120px]">
                <Badge color={getServiceLineBadgeColor(task.servLineCode)}>
                  {task.serviceLineName}
                </Badge>
              </div>
              <div className={`text-right tabular-nums font-semibold ${
                task.netWip < 0 ? 'text-red-600' : 'text-forvis-blue-600'
              }`}>
                {formatCurrency(task.netWip)}
              </div>
              <div className="text-right tabular-nums text-forvis-gray-700">
                {formatCurrency(task.ltdWipProvision)}
              </div>
              <div className="text-right tabular-nums text-forvis-gray-700">
                {formatCurrency(task.balWip)}
              </div>
              <div className="text-right tabular-nums text-forvis-gray-700">
                {formatCurrency(task.grossProduction)}
              </div>
              <div className={`text-right tabular-nums font-medium ${
                task.ltdAdj < 0 ? 'text-red-600' : 'text-forvis-gray-700'
              }`}>
                {formatCurrency(task.ltdAdj)}
              </div>
              <div className={`text-right tabular-nums font-semibold ${
                task.netRevenue < 0 ? 'text-red-600' : 'text-forvis-blue-600'
              }`}>
                {formatCurrency(task.netRevenue)}
              </div>
              <div className={`text-right tabular-nums ${
                task.adjustmentPercentage < 0 ? 'text-red-600' : 'text-forvis-gray-700'
              }`}>
                {formatPercentage(task.adjustmentPercentage)}
              </div>
              <div className="text-right tabular-nums text-forvis-gray-700">
                {formatCurrency(task.ltdCost)}
              </div>
              <div className={`text-right tabular-nums font-semibold ${
                task.grossProfit < 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {formatCurrency(task.grossProfit)}
              </div>
              <div className={`text-right tabular-nums font-bold ${
                task.grossProfitPercentage >= 60 ? 'text-green-600' : 
                task.grossProfitPercentage >= 50 ? 'text-yellow-600' : 
                'text-red-600'
              }`}>
                {formatPercentage(task.grossProfitPercentage)}
              </div>
            </div>
          ))}

          {/* Totals Row */}
          <div
            className="grid gap-3 py-3 px-4 text-xs font-bold border-t-2 border-forvis-blue-500"
            style={{
              background: 'linear-gradient(135deg, #F0F7FD 0%, #E0EDFB 100%)',
              gridTemplateColumns: '1.5fr 2fr 140px 120px 120px 120px 120px 120px 120px 100px 120px 120px 120px'
            }}
          >
            <div className="text-forvis-blue-800" style={{ gridColumn: 'span 2' }}>TOTAL (Page {currentPage} of {totalPages})</div>
            <div className="text-forvis-blue-800">{grandTotals.taskCount} task{grandTotals.taskCount !== 1 ? 's' : ''}</div>
            <div className={`text-right tabular-nums ${
              grandTotals.totalWIP < 0 ? 'text-forvis-error-600' : 'text-forvis-blue-800'
            }`}>
              {formatCurrency(grandTotals.totalWIP)}
            </div>
            <div className="text-right tabular-nums text-forvis-blue-800">
              {formatCurrency(grandTotals.ltdWipProvision)}
            </div>
            <div className="text-right tabular-nums text-forvis-blue-800">
              {formatCurrency(grandTotals.balWip)}
            </div>
            <div className="text-right tabular-nums text-forvis-blue-800">
              {formatCurrency(grandTotals.grossProduction)}
            </div>
            <div className={`text-right tabular-nums ${
              grandTotals.ltdAdj < 0 ? 'text-forvis-error-600' : 'text-forvis-blue-800'
            }`}>
              {formatCurrency(grandTotals.ltdAdj)}
            </div>
            <div className={`text-right tabular-nums ${
              grandTotals.netRevenue < 0 ? 'text-forvis-error-600' : 'text-forvis-blue-800'
            }`}>
              {formatCurrency(grandTotals.netRevenue)}
            </div>
            <div className={`text-right tabular-nums ${
              totalAdjPercentage < 0 ? 'text-forvis-error-600' : 'text-forvis-blue-800'
            }`}>
              {formatPercentage(totalAdjPercentage)}
            </div>
            <div className="text-right tabular-nums text-forvis-blue-800">
              {formatCurrency(grandTotals.ltdCost)}
            </div>
            <div className={`text-right tabular-nums ${
              grandTotals.grossProfit < 0 ? 'text-forvis-error-600' : 'text-forvis-success-600'
            }`}>
              {formatCurrency(grandTotals.grossProfit)}
            </div>
            <div className={`text-right tabular-nums ${
              totalGPPercentage >= 60 ? 'text-forvis-success-600' : 
              totalGPPercentage >= 50 ? 'text-forvis-warning-600' : 
              'text-forvis-error-600'
            }`}>
              {formatPercentage(totalGPPercentage)}
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
