'use client';

/**
 * Manager Totals Table Component
 * 
 * Displays aggregated totals by Task Manager
 * Columns: Manager Name | Total Tasks | Net WIP | Net Revenue | Gross Profit | GP%
 */

import { useState } from 'react';
import { Pagination } from '@/components/shared/Pagination';
import type { TaskWithWIPAndServiceLine } from '@/types/reports';

interface ManagerTotal {
  managerCode: string;
  managerName: string;
  taskCount: number;
  totalWIP: number;
  ltdWipProvision: number;
  balWip: number;
  grossProduction: number;
  ltdAdj: number;
  netRevenue: number;
  ltdCost: number;
  grossProfit: number;
  adjustmentPercentage: number;
  grossProfitPercentage: number;
}

interface ManagerTotalsTableProps {
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

export function ManagerTotalsTable({ tasks }: ManagerTotalsTableProps) {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  
  // Sort state
  const [sortConfig, setSortConfig] = useState<{key: keyof ManagerTotal; direction: 'asc' | 'desc'} | null>(null);

  // Aggregate tasks by manager
  const managerTotals = new Map<string, ManagerTotal>();

  tasks.forEach((task) => {
    const managerCode = task.TaskManager || 'Unknown';
    const managerName = task.TaskManagerName || task.TaskManager || 'Unknown';
    
    if (!managerTotals.has(managerCode)) {
      managerTotals.set(managerCode, {
        managerCode,
        managerName,
        taskCount: 0,
        totalWIP: 0,
        ltdWipProvision: 0,
        balWip: 0,
        grossProduction: 0,
        ltdAdj: 0,
        netRevenue: 0,
        ltdCost: 0,
        grossProfit: 0,
        adjustmentPercentage: 0,
        grossProfitPercentage: 0,
      });
    }

    const manager = managerTotals.get(managerCode)!;
    manager.taskCount += 1;
    manager.totalWIP += task.netWip;
    manager.ltdWipProvision += task.ltdWipProvision;
    manager.balWip += task.balWip;
    manager.grossProduction += task.grossProduction;
    manager.ltdAdj += task.ltdAdj;
    manager.netRevenue += task.netRevenue;
    manager.ltdCost += task.ltdCost;
    manager.grossProfit += task.grossProfit;
  });
  
  // Calculate percentages for each manager
  managerTotals.forEach((manager) => {
    manager.adjustmentPercentage = manager.grossProduction !== 0 
      ? (manager.ltdAdj / manager.grossProduction) * 100 
      : 0;
    manager.grossProfitPercentage = manager.netRevenue !== 0 
      ? (manager.grossProfit / manager.netRevenue) * 100 
      : 0;
  });

  // Convert to array and sort
  let sortedManagers = Array.from(managerTotals.values());
  
  if (sortConfig) {
    sortedManagers.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      return 0;
    });
  } else {
    // Default sort by net revenue descending
    sortedManagers.sort((a, b) => b.netRevenue - a.netRevenue);
  }

  // Pagination
  const totalPages = Math.ceil(sortedManagers.length / ITEMS_PER_PAGE);
  const paginatedManagers = sortedManagers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Grand totals
  const grandTotals = sortedManagers.reduce(
    (acc, manager) => ({
      taskCount: acc.taskCount + manager.taskCount,
      totalWIP: acc.totalWIP + manager.totalWIP,
      balWip: acc.balWip + manager.balWip,
      netRevenue: acc.netRevenue + manager.netRevenue,
      ltdCost: acc.ltdCost + manager.ltdCost,
      grossProfit: acc.grossProfit + manager.grossProfit,
    }),
    { taskCount: 0, totalWIP: 0, balWip: 0, netRevenue: 0, ltdCost: 0, grossProfit: 0 }
  );

  const grandGrossProfitPercentage = grandTotals.netRevenue !== 0 
    ? (grandTotals.grossProfit / grandTotals.netRevenue) * 100 
    : 0;

  const handleSort = (key: keyof ManagerTotal) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' };
    });
  };

  const SortIndicator = ({ columnKey }: { columnKey: keyof ManagerTotal }) => {
    if (sortConfig?.key !== columnKey) return null;
    return <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  if (tasks.length === 0) {
    return (
      <div className="p-8 text-center text-forvis-gray-500">
        No tasks found for the selected criteria
      </div>
    );
  }

  return (
    <div>
      {/* Summary */}
      <div className="px-4 py-3 bg-forvis-gray-50 border-b border-forvis-gray-200">
        <p className="text-sm text-forvis-gray-600">
          <span className="font-semibold text-forvis-gray-900">{sortedManagers.length}</span> managers •{' '}
          <span className="font-semibold text-forvis-gray-900">{formatNumber(grandTotals.taskCount)}</span> tasks •{' '}
          Net Revenue: <span className="font-semibold text-forvis-gray-900">{formatCurrency(grandTotals.netRevenue)}</span> •{' '}
          Gross Profit: <span className="font-semibold text-forvis-gray-900">{formatCurrency(grandTotals.grossProfit)}</span>{' '}
          ({formatPercentage(grandGrossProfitPercentage)})
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-forvis-gray-100 text-forvis-gray-700">
              <th 
                className="px-4 py-3 text-left font-semibold cursor-pointer hover:bg-forvis-gray-200"
                onClick={() => handleSort('managerName')}
              >
                Manager<SortIndicator columnKey="managerName" />
              </th>
              <th 
                className="px-4 py-3 text-right font-semibold cursor-pointer hover:bg-forvis-gray-200"
                onClick={() => handleSort('taskCount')}
              >
                Tasks<SortIndicator columnKey="taskCount" />
              </th>
              <th 
                className="px-4 py-3 text-right font-semibold cursor-pointer hover:bg-forvis-gray-200"
                onClick={() => handleSort('balWip')}
              >
                Bal WIP<SortIndicator columnKey="balWip" />
              </th>
              <th 
                className="px-4 py-3 text-right font-semibold cursor-pointer hover:bg-forvis-gray-200"
                onClick={() => handleSort('totalWIP')}
              >
                Net WIP<SortIndicator columnKey="totalWIP" />
              </th>
              <th 
                className="px-4 py-3 text-right font-semibold cursor-pointer hover:bg-forvis-gray-200"
                onClick={() => handleSort('netRevenue')}
              >
                Net Revenue<SortIndicator columnKey="netRevenue" />
              </th>
              <th 
                className="px-4 py-3 text-right font-semibold cursor-pointer hover:bg-forvis-gray-200"
                onClick={() => handleSort('ltdCost')}
              >
                Cost<SortIndicator columnKey="ltdCost" />
              </th>
              <th 
                className="px-4 py-3 text-right font-semibold cursor-pointer hover:bg-forvis-gray-200"
                onClick={() => handleSort('grossProfit')}
              >
                Gross Profit<SortIndicator columnKey="grossProfit" />
              </th>
              <th 
                className="px-4 py-3 text-right font-semibold cursor-pointer hover:bg-forvis-gray-200"
                onClick={() => handleSort('grossProfitPercentage')}
              >
                GP%<SortIndicator columnKey="grossProfitPercentage" />
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedManagers.map((manager, index) => (
              <tr 
                key={manager.managerCode}
                className={`border-b border-forvis-gray-100 hover:bg-forvis-gray-50 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-forvis-gray-50/50'
                }`}
              >
                <td className="px-4 py-3">
                  <div>
                    <span className="font-medium text-forvis-gray-900">{manager.managerName}</span>
                    <span className="ml-2 text-xs text-forvis-gray-500">{manager.managerCode}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{formatNumber(manager.taskCount)}</td>
                <td className={`px-4 py-3 text-right tabular-nums ${manager.balWip < 0 ? 'text-forvis-error-600' : ''}`}>
                  {formatCurrency(manager.balWip)}
                </td>
                <td className={`px-4 py-3 text-right tabular-nums ${manager.totalWIP < 0 ? 'text-forvis-error-600' : ''}`}>
                  {formatCurrency(manager.totalWIP)}
                </td>
                <td className={`px-4 py-3 text-right tabular-nums ${manager.netRevenue < 0 ? 'text-forvis-error-600' : ''}`}>
                  {formatCurrency(manager.netRevenue)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(manager.ltdCost)}</td>
                <td className={`px-4 py-3 text-right tabular-nums ${manager.grossProfit < 0 ? 'text-forvis-error-600' : ''}`}>
                  {formatCurrency(manager.grossProfit)}
                </td>
                <td className={`px-4 py-3 text-right tabular-nums ${manager.grossProfitPercentage < 0 ? 'text-forvis-error-600' : ''}`}>
                  {formatPercentage(manager.grossProfitPercentage)}
                </td>
              </tr>
            ))}
          </tbody>
          {/* Grand Totals Footer */}
          <tfoot>
            <tr className="bg-forvis-gray-100 font-semibold text-forvis-gray-900 border-t-2 border-forvis-gray-300">
              <td className="px-4 py-3">Grand Total</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatNumber(grandTotals.taskCount)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(grandTotals.balWip)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(grandTotals.totalWIP)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(grandTotals.netRevenue)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(grandTotals.ltdCost)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(grandTotals.grossProfit)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatPercentage(grandGrossProfitPercentage)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-forvis-gray-200">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
