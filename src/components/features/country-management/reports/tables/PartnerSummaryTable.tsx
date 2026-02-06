'use client';

/**
 * Partner Summary Table Component
 * 
 * Displays pre-aggregated profitability totals by partner from summary SP
 * Uses server-aggregated data for fast loading (no client-side aggregation)
 */

import { useState } from 'react';
import { Pagination } from '@/components/shared/Pagination';
import type { ProfitabilitySummaryResult } from '@/types/reports';

interface PartnerSummaryTableProps {
  data: ProfitabilitySummaryResult[];
  onPartnerClick?: (partnerCode: string) => void;
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

type SortKey = 'PartnerName' | 'TaskCount' | 'ClientCount' | 'BalWip' | 'NetWIP' | 'NetRevenue' | 'LTDCost' | 'GrossProfit' | 'GPPercentage';

export function PartnerSummaryTable({ data, onPartnerClick }: PartnerSummaryTableProps) {
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
    // Default sort by net revenue descending
    sortedData.sort((a, b) => (b.NetRevenue || 0) - (a.NetRevenue || 0));
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
      balWip: acc.balWip + (row.BalWip || 0),
      netWip: acc.netWip + (row.NetWIP || 0),
      netRevenue: acc.netRevenue + (row.NetRevenue || 0),
      ltdCost: acc.ltdCost + (row.LTDCost || 0),
      grossProfit: acc.grossProfit + (row.GrossProfit || 0),
    }),
    { taskCount: 0, clientCount: 0, balWip: 0, netWip: 0, netRevenue: 0, ltdCost: 0, grossProfit: 0 }
  );

  const grandGrossProfitPercentage = grandTotals.netRevenue !== 0 
    ? (grandTotals.grossProfit / grandTotals.netRevenue) * 100 
    : 0;

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
          <span className="font-semibold text-forvis-gray-900">{sortedData.length}</span> partners •{' '}
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
                onClick={() => handleSort('PartnerName')}
              >
                Partner<SortIndicator columnKey="PartnerName" />
              </th>
              <th 
                className="px-4 py-3 text-right font-semibold cursor-pointer hover:bg-forvis-gray-200"
                onClick={() => handleSort('TaskCount')}
              >
                Tasks<SortIndicator columnKey="TaskCount" />
              </th>
              <th 
                className="px-4 py-3 text-right font-semibold cursor-pointer hover:bg-forvis-gray-200"
                onClick={() => handleSort('ClientCount')}
              >
                Clients<SortIndicator columnKey="ClientCount" />
              </th>
              <th 
                className="px-4 py-3 text-right font-semibold cursor-pointer hover:bg-forvis-gray-200"
                onClick={() => handleSort('BalWip')}
              >
                Bal WIP<SortIndicator columnKey="BalWip" />
              </th>
              <th 
                className="px-4 py-3 text-right font-semibold cursor-pointer hover:bg-forvis-gray-200"
                onClick={() => handleSort('NetWIP')}
              >
                Net WIP<SortIndicator columnKey="NetWIP" />
              </th>
              <th 
                className="px-4 py-3 text-right font-semibold cursor-pointer hover:bg-forvis-gray-200"
                onClick={() => handleSort('NetRevenue')}
              >
                Net Revenue<SortIndicator columnKey="NetRevenue" />
              </th>
              <th 
                className="px-4 py-3 text-right font-semibold cursor-pointer hover:bg-forvis-gray-200"
                onClick={() => handleSort('LTDCost')}
              >
                Cost<SortIndicator columnKey="LTDCost" />
              </th>
              <th 
                className="px-4 py-3 text-right font-semibold cursor-pointer hover:bg-forvis-gray-200"
                onClick={() => handleSort('GrossProfit')}
              >
                Gross Profit<SortIndicator columnKey="GrossProfit" />
              </th>
              <th 
                className="px-4 py-3 text-right font-semibold cursor-pointer hover:bg-forvis-gray-200"
                onClick={() => handleSort('GPPercentage')}
              >
                GP%<SortIndicator columnKey="GPPercentage" />
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, index) => (
              <tr 
                key={row.PartnerCode}
                className={`border-b border-forvis-gray-100 hover:bg-forvis-gray-50 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-forvis-gray-50/50'
                } ${onPartnerClick ? 'cursor-pointer' : ''}`}
                onClick={() => onPartnerClick?.(row.PartnerCode || '')}
              >
                <td className="px-4 py-3">
                  <div>
                    <span className="font-medium text-forvis-gray-900">{row.PartnerName}</span>
                    <span className="ml-2 text-xs text-forvis-gray-500">{row.PartnerCode}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{formatNumber(row.TaskCount || 0)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatNumber(row.ClientCount || 0)}</td>
                <td className={`px-4 py-3 text-right tabular-nums ${(row.BalWip || 0) < 0 ? 'text-forvis-error-600' : ''}`}>
                  {formatCurrency(row.BalWip || 0)}
                </td>
                <td className={`px-4 py-3 text-right tabular-nums ${(row.NetWIP || 0) < 0 ? 'text-forvis-error-600' : ''}`}>
                  {formatCurrency(row.NetWIP || 0)}
                </td>
                <td className={`px-4 py-3 text-right tabular-nums ${(row.NetRevenue || 0) < 0 ? 'text-forvis-error-600' : ''}`}>
                  {formatCurrency(row.NetRevenue || 0)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(row.LTDCost || 0)}</td>
                <td className={`px-4 py-3 text-right tabular-nums ${(row.GrossProfit || 0) < 0 ? 'text-forvis-error-600' : ''}`}>
                  {formatCurrency(row.GrossProfit || 0)}
                </td>
                <td className={`px-4 py-3 text-right tabular-nums ${(row.GPPercentage || 0) < 0 ? 'text-forvis-error-600' : ''}`}>
                  {formatPercentage(row.GPPercentage || 0)}
                </td>
              </tr>
            ))}
          </tbody>
          {/* Grand Totals Footer */}
          <tfoot>
            <tr className="bg-forvis-gray-100 font-semibold text-forvis-gray-900 border-t-2 border-forvis-gray-300">
              <td className="px-4 py-3">Grand Total</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatNumber(grandTotals.taskCount)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatNumber(grandTotals.clientCount)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(grandTotals.balWip)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(grandTotals.netWip)}</td>
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
