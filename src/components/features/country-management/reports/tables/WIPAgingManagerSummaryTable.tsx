'use client';

/**
 * WIP Aging Manager Summary Table Component
 * 
 * Displays pre-aggregated WIP aging buckets by manager from summary SP
 * Uses server-aggregated data for fast loading (no client-side aggregation)
 */

import { useState } from 'react';
import { Pagination } from '@/components/shared/Pagination';
import type { WIPAgingSummaryResult } from '@/types/reports';

interface WIPAgingManagerSummaryTableProps {
  data: WIPAgingSummaryResult[];
  onManagerClick?: (managerCode: string) => void;
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

type SortKey = 'ManagerName' | 'TaskCount' | 'ClientCount' | 'Curr' | 'Bal30' | 'Bal60' | 'Bal90' | 'Bal120' | 'Bal150' | 'Bal180' | 'BalWIP' | 'NettWIP';

export function WIPAgingManagerSummaryTable({ data, onManagerClick }: WIPAgingManagerSummaryTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  
  const [sortConfig, setSortConfig] = useState<{key: SortKey; direction: 'asc' | 'desc'} | null>(null);

  // Sort data
  let sortedData = [...data];
  
  if (sortConfig) {
    sortedData.sort((a, b) => {
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
    // Default sort by BalWIP descending
    sortedData.sort((a, b) => (b.BalWIP || 0) - (a.BalWIP || 0));
  }

  // Pagination
  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Grand totals
  const grandTotals = sortedData.reduce(
    (acc, row) => ({
      taskCount: acc.taskCount + (row.TaskCount || 0),
      clientCount: acc.clientCount + (row.ClientCount || 0),
      curr: acc.curr + (row.Curr || 0),
      bal30: acc.bal30 + (row.Bal30 || 0),
      bal60: acc.bal60 + (row.Bal60 || 0),
      bal90: acc.bal90 + (row.Bal90 || 0),
      bal120: acc.bal120 + (row.Bal120 || 0),
      bal150: acc.bal150 + (row.Bal150 || 0),
      bal180: acc.bal180 + (row.Bal180 || 0),
      balWIP: acc.balWIP + (row.BalWIP || 0),
      nettWIP: acc.nettWIP + (row.NettWIP || 0),
    }),
    { taskCount: 0, clientCount: 0, curr: 0, bal30: 0, bal60: 0, bal90: 0, bal120: 0, bal150: 0, bal180: 0, balWIP: 0, nettWIP: 0 }
  );

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' };
    });
  };

  const SortIndicator = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig?.key !== columnKey) return null;
    return <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-forvis-gray-500">
        No data found for the selected criteria
      </div>
    );
  }

  return (
    <div>
      {/* Summary */}
      <div className="px-4 py-3 bg-forvis-gray-50 border-b border-forvis-gray-200">
        <p className="text-sm text-forvis-gray-600">
          <span className="font-semibold text-forvis-gray-900">{sortedData.length}</span> managers •{' '}
          <span className="font-semibold text-forvis-gray-900">{formatNumber(grandTotals.taskCount)}</span> tasks •{' '}
          Bal WIP: <span className="font-semibold text-forvis-gray-900">{formatCurrency(grandTotals.balWIP)}</span> •{' '}
          Net WIP: <span className="font-semibold text-forvis-gray-900">{formatCurrency(grandTotals.nettWIP)}</span>
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-forvis-gray-100 text-forvis-gray-700">
              <th 
                className="px-3 py-3 text-left font-semibold cursor-pointer hover:bg-forvis-gray-200 sticky left-0 bg-forvis-gray-100"
                onClick={() => handleSort('ManagerName')}
              >
                Manager<SortIndicator columnKey="ManagerName" />
              </th>
              <th 
                className="px-3 py-3 text-right font-semibold cursor-pointer hover:bg-forvis-gray-200"
                onClick={() => handleSort('TaskCount')}
              >
                Tasks<SortIndicator columnKey="TaskCount" />
              </th>
              <th 
                className="px-3 py-3 text-right font-semibold cursor-pointer hover:bg-forvis-gray-200"
                onClick={() => handleSort('Curr')}
              >
                Curr<SortIndicator columnKey="Curr" />
              </th>
              <th 
                className="px-3 py-3 text-right font-semibold cursor-pointer hover:bg-forvis-gray-200"
                onClick={() => handleSort('Bal30')}
              >
                30<SortIndicator columnKey="Bal30" />
              </th>
              <th 
                className="px-3 py-3 text-right font-semibold cursor-pointer hover:bg-forvis-gray-200"
                onClick={() => handleSort('Bal60')}
              >
                60<SortIndicator columnKey="Bal60" />
              </th>
              <th 
                className="px-3 py-3 text-right font-semibold cursor-pointer hover:bg-forvis-gray-200"
                onClick={() => handleSort('Bal90')}
              >
                90<SortIndicator columnKey="Bal90" />
              </th>
              <th 
                className="px-3 py-3 text-right font-semibold cursor-pointer hover:bg-forvis-gray-200"
                onClick={() => handleSort('Bal120')}
              >
                120<SortIndicator columnKey="Bal120" />
              </th>
              <th 
                className="px-3 py-3 text-right font-semibold cursor-pointer hover:bg-forvis-gray-200"
                onClick={() => handleSort('Bal150')}
              >
                150<SortIndicator columnKey="Bal150" />
              </th>
              <th 
                className="px-3 py-3 text-right font-semibold cursor-pointer hover:bg-forvis-gray-200"
                onClick={() => handleSort('Bal180')}
              >
                180+<SortIndicator columnKey="Bal180" />
              </th>
              <th 
                className="px-3 py-3 text-right font-semibold cursor-pointer hover:bg-forvis-gray-200"
                onClick={() => handleSort('BalWIP')}
              >
                Bal WIP<SortIndicator columnKey="BalWIP" />
              </th>
              <th 
                className="px-3 py-3 text-right font-semibold cursor-pointer hover:bg-forvis-gray-200"
                onClick={() => handleSort('NettWIP')}
              >
                Net WIP<SortIndicator columnKey="NettWIP" />
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, index) => (
              <tr 
                key={row.ManagerCode}
                className={`border-b border-forvis-gray-100 hover:bg-forvis-gray-50 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-forvis-gray-50/50'
                } ${onManagerClick ? 'cursor-pointer' : ''}`}
                onClick={() => onManagerClick?.(row.ManagerCode || '')}
              >
                <td className="px-3 py-3 sticky left-0 bg-inherit">
                  <div>
                    <span className="font-medium text-forvis-gray-900">{row.ManagerName}</span>
                    <span className="ml-2 text-xs text-forvis-gray-500">{row.ManagerCode}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{formatNumber(row.TaskCount || 0)}</td>
                <td className={`px-3 py-3 text-right tabular-nums ${(row.Curr || 0) < 0 ? 'text-forvis-error-600' : ''}`}>
                  {formatCurrency(row.Curr || 0)}
                </td>
                <td className={`px-3 py-3 text-right tabular-nums ${(row.Bal30 || 0) < 0 ? 'text-forvis-error-600' : ''}`}>
                  {formatCurrency(row.Bal30 || 0)}
                </td>
                <td className={`px-3 py-3 text-right tabular-nums ${(row.Bal60 || 0) < 0 ? 'text-forvis-error-600' : ''}`}>
                  {formatCurrency(row.Bal60 || 0)}
                </td>
                <td className={`px-3 py-3 text-right tabular-nums ${(row.Bal90 || 0) < 0 ? 'text-forvis-error-600' : ''}`}>
                  {formatCurrency(row.Bal90 || 0)}
                </td>
                <td className={`px-3 py-3 text-right tabular-nums ${(row.Bal120 || 0) < 0 ? 'text-forvis-error-600' : ''}`}>
                  {formatCurrency(row.Bal120 || 0)}
                </td>
                <td className={`px-3 py-3 text-right tabular-nums ${(row.Bal150 || 0) < 0 ? 'text-forvis-error-600' : ''}`}>
                  {formatCurrency(row.Bal150 || 0)}
                </td>
                <td className={`px-3 py-3 text-right tabular-nums ${(row.Bal180 || 0) < 0 ? 'text-forvis-error-600' : ''}`}>
                  {formatCurrency(row.Bal180 || 0)}
                </td>
                <td className={`px-3 py-3 text-right tabular-nums font-medium ${(row.BalWIP || 0) < 0 ? 'text-forvis-error-600' : ''}`}>
                  {formatCurrency(row.BalWIP || 0)}
                </td>
                <td className={`px-3 py-3 text-right tabular-nums font-medium ${(row.NettWIP || 0) < 0 ? 'text-forvis-error-600' : ''}`}>
                  {formatCurrency(row.NettWIP || 0)}
                </td>
              </tr>
            ))}
          </tbody>
          {/* Grand Totals Footer */}
          <tfoot>
            <tr className="bg-forvis-gray-100 font-semibold text-forvis-gray-900 border-t-2 border-forvis-gray-300">
              <td className="px-3 py-3 sticky left-0 bg-forvis-gray-100">Grand Total</td>
              <td className="px-3 py-3 text-right tabular-nums">{formatNumber(grandTotals.taskCount)}</td>
              <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(grandTotals.curr)}</td>
              <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(grandTotals.bal30)}</td>
              <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(grandTotals.bal60)}</td>
              <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(grandTotals.bal90)}</td>
              <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(grandTotals.bal120)}</td>
              <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(grandTotals.bal150)}</td>
              <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(grandTotals.bal180)}</td>
              <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(grandTotals.balWIP)}</td>
              <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(grandTotals.nettWIP)}</td>
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
