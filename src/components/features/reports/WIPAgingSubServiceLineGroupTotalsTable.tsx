'use client';

/**
 * WIP Aging Sub Service Line Group Totals Table Component
 * 
 * Aggregates WIP aging data by sub service line group.
 */

import { useState, useMemo } from 'react';
import { Pagination } from '@/components/shared/Pagination';
import type { WIPAgingTaskData } from '@/types/api';

interface WIPAgingSubServiceLineGroupTotalsTableProps {
  tasks: WIPAgingTaskData[];
}

interface SubServiceLineGroupAggregation {
  subServlineGroupCode: string;
  subServlineGroupDesc: string;
  masterServiceLineName: string;
  taskCount: number;
  curr: number;
  bal30: number;
  bal60: number;
  bal90: number;
  bal120: number;
  bal150: number;
  bal180: number;
  balWip: number;
  provision: number;
  nettWip: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function WIPAgingSubServiceLineGroupTotalsTable({ tasks }: WIPAgingSubServiceLineGroupTotalsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 25;
  
  // Sort state
  const [sortConfig, setSortConfig] = useState<{key: keyof SubServiceLineGroupAggregation; direction: 'asc' | 'desc'} | null>(null);
  
  // Handle sort
  const handleSort = (key: keyof SubServiceLineGroupAggregation) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' }; // Default to desc for amounts (highest first)
    });
  };

  // Aggregate by sub service line group
  const groupedData = useMemo(() => {
    const slMap = new Map<string, SubServiceLineGroupAggregation>();

    tasks.forEach((task) => {
      const key = task.subServlineGroupCode || task.servLineCode;
      const existing = slMap.get(key);

      if (existing) {
        existing.taskCount += 1;
        existing.curr += task.aging.curr;
        existing.bal30 += task.aging.bal30;
        existing.bal60 += task.aging.bal60;
        existing.bal90 += task.aging.bal90;
        existing.bal120 += task.aging.bal120;
        existing.bal150 += task.aging.bal150;
        existing.bal180 += task.aging.bal180;
        existing.balWip += task.balWip;
        existing.provision += task.provision;
        existing.nettWip += task.nettWip;
      } else {
        slMap.set(key, {
          subServlineGroupCode: key,
          subServlineGroupDesc: task.subServlineGroupDesc || task.servLineDesc,
          masterServiceLineName: task.masterServiceLineName || '',
          taskCount: 1,
          curr: task.aging.curr,
          bal30: task.aging.bal30,
          bal60: task.aging.bal60,
          bal90: task.aging.bal90,
          bal120: task.aging.bal120,
          bal150: task.aging.bal150,
          bal180: task.aging.bal180,
          balWip: task.balWip,
          provision: task.provision,
          nettWip: task.nettWip,
        });
      }
    });

    const aggregated = Array.from(slMap.values());
    
    // Apply sorting if configured
    if (sortConfig) {
      return aggregated.sort((a, b) => {
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
      });
    }
    
    // Default sort by description
    return aggregated.sort((a, b) => a.subServlineGroupDesc.localeCompare(b.subServlineGroupDesc));
  }, [tasks, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(groupedData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = groupedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Grand totals
  const grandTotals = useMemo(() => ({
    slCount: groupedData.length,
    taskCount: groupedData.reduce((sum, g) => sum + g.taskCount, 0),
    curr: groupedData.reduce((sum, g) => sum + g.curr, 0),
    bal30: groupedData.reduce((sum, g) => sum + g.bal30, 0),
    bal60: groupedData.reduce((sum, g) => sum + g.bal60, 0),
    bal90: groupedData.reduce((sum, g) => sum + g.bal90, 0),
    bal120: groupedData.reduce((sum, g) => sum + g.bal120, 0),
    bal150: groupedData.reduce((sum, g) => sum + g.bal150, 0),
    bal180: groupedData.reduce((sum, g) => sum + g.bal180, 0),
    balWip: groupedData.reduce((sum, g) => sum + g.balWip, 0),
    provision: groupedData.reduce((sum, g) => sum + g.provision, 0),
    nettWip: groupedData.reduce((sum, g) => sum + g.nettWip, 0),
  }), [groupedData]);

  if (groupedData.length === 0) {
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
        <h3 className="mt-2 text-sm font-medium text-forvis-gray-900">No data found</h3>
        <p className="mt-1 text-sm text-forvis-gray-500">
          No sub service line groups match the current filters.
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
            gridTemplateColumns: '2fr 1fr 70px 90px 90px 90px 90px 90px 90px 90px 100px 90px 100px',
          }}
        >
          <div 
            className="cursor-pointer hover:text-white/80 flex items-center gap-1"
            onClick={() => handleSort('subServlineGroupDesc')}
          >
            <span>Sub SL Group</span>
            {sortConfig?.key === 'subServlineGroupDesc' && (
              <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            className="cursor-pointer hover:text-white/80 flex items-center gap-1"
            onClick={() => handleSort('masterServiceLineName')}
          >
            <span>Master SL</span>
            {sortConfig?.key === 'masterServiceLineName' && (
              <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            className="text-right cursor-pointer hover:text-white/80 flex items-center justify-end gap-1"
            onClick={() => handleSort('taskCount')}
          >
            <span>Tasks</span>
            {sortConfig?.key === 'taskCount' && (
              <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            className="text-right cursor-pointer hover:text-white/80 flex items-center justify-end gap-1"
            onClick={() => handleSort('curr')}
          >
            <span>Curr</span>
            {sortConfig?.key === 'curr' && (
              <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            className="text-right cursor-pointer hover:text-white/80 flex items-center justify-end gap-1"
            onClick={() => handleSort('bal30')}
          >
            <span>30</span>
            {sortConfig?.key === 'bal30' && (
              <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            className="text-right cursor-pointer hover:text-white/80 flex items-center justify-end gap-1"
            onClick={() => handleSort('bal60')}
          >
            <span>60</span>
            {sortConfig?.key === 'bal60' && (
              <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            className="text-right cursor-pointer hover:text-white/80 flex items-center justify-end gap-1"
            onClick={() => handleSort('bal90')}
          >
            <span>90</span>
            {sortConfig?.key === 'bal90' && (
              <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            className="text-right cursor-pointer hover:text-white/80 flex items-center justify-end gap-1"
            onClick={() => handleSort('bal120')}
          >
            <span>120</span>
            {sortConfig?.key === 'bal120' && (
              <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            className="text-right cursor-pointer hover:text-white/80 flex items-center justify-end gap-1"
            onClick={() => handleSort('bal150')}
          >
            <span>150</span>
            {sortConfig?.key === 'bal150' && (
              <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            className="text-right cursor-pointer hover:text-white/80 flex items-center justify-end gap-1"
            onClick={() => handleSort('bal180')}
          >
            <span>180+</span>
            {sortConfig?.key === 'bal180' && (
              <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            className="text-right cursor-pointer hover:text-white/80 flex items-center justify-end gap-1"
            onClick={() => handleSort('balWip')}
          >
            <span>Total WIP</span>
            {sortConfig?.key === 'balWip' && (
              <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            className="text-right cursor-pointer hover:text-white/80 flex items-center justify-end gap-1"
            onClick={() => handleSort('provision')}
          >
            <span>Provision</span>
            {sortConfig?.key === 'provision' && (
              <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            className="text-right cursor-pointer hover:text-white/80 flex items-center justify-end gap-1"
            onClick={() => handleSort('nettWip')}
          >
            <span>Net WIP</span>
            {sortConfig?.key === 'nettWip' && (
              <span className="text-xs">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
        </div>

        {/* Table Body */}
        <div className="bg-white">
          {paginatedData.map((item, index) => (
            <div
              key={item.subServlineGroupCode}
              className={`grid gap-2 py-2 px-4 text-xs transition-colors duration-200 hover:bg-forvis-blue-50 ${
                index % 2 === 0 ? 'bg-white' : 'bg-forvis-gray-50'
              }`}
              style={{ gridTemplateColumns: '2fr 1fr 70px 90px 90px 90px 90px 90px 90px 90px 100px 90px 100px' }}
            >
              <div className="text-forvis-gray-900 truncate font-medium" title={item.subServlineGroupDesc}>
                {item.subServlineGroupDesc}
              </div>
              <div className="text-forvis-gray-600 truncate" title={item.masterServiceLineName}>
                {item.masterServiceLineName || '-'}
              </div>
              <div className="text-right tabular-nums text-forvis-gray-600">
                {item.taskCount}
              </div>
              <div className={`text-right tabular-nums ${item.curr !== 0 ? 'text-forvis-gray-900' : 'text-forvis-gray-400'}`}>
                {formatCurrency(item.curr)}
              </div>
              <div className={`text-right tabular-nums ${item.bal30 !== 0 ? 'text-forvis-gray-900' : 'text-forvis-gray-400'}`}>
                {formatCurrency(item.bal30)}
              </div>
              <div className={`text-right tabular-nums ${item.bal60 !== 0 ? 'text-forvis-warning-600' : 'text-forvis-gray-400'}`}>
                {formatCurrency(item.bal60)}
              </div>
              <div className={`text-right tabular-nums ${item.bal90 !== 0 ? 'text-forvis-warning-600' : 'text-forvis-gray-400'}`}>
                {formatCurrency(item.bal90)}
              </div>
              <div className={`text-right tabular-nums ${item.bal120 !== 0 ? 'text-forvis-error-600' : 'text-forvis-gray-400'}`}>
                {formatCurrency(item.bal120)}
              </div>
              <div className={`text-right tabular-nums ${item.bal150 !== 0 ? 'text-forvis-error-600' : 'text-forvis-gray-400'}`}>
                {formatCurrency(item.bal150)}
              </div>
              <div className={`text-right tabular-nums font-semibold ${item.bal180 !== 0 ? 'text-forvis-error-700' : 'text-forvis-gray-400'}`}>
                {formatCurrency(item.bal180)}
              </div>
              <div className={`text-right tabular-nums font-semibold ${
                item.balWip < 0 ? 'text-forvis-error-600' : 'text-forvis-blue-600'
              }`}>
                {formatCurrency(item.balWip)}
              </div>
              <div className="text-right tabular-nums text-forvis-gray-700">
                {formatCurrency(item.provision)}
              </div>
              <div className={`text-right tabular-nums font-bold ${
                item.nettWip < 0 ? 'text-forvis-error-600' : 'text-forvis-blue-700'
              }`}>
                {formatCurrency(item.nettWip)}
              </div>
            </div>
          ))}

          {/* Totals Row */}
          <div
            className="grid gap-2 py-3 px-4 text-xs font-bold border-t-2 border-forvis-blue-500"
            style={{
              background: 'linear-gradient(135deg, #F0F7FD 0%, #E0EDFB 100%)',
              gridTemplateColumns: '2fr 1fr 70px 90px 90px 90px 90px 90px 90px 90px 100px 90px 100px'
            }}
          >
            <div className="text-forvis-blue-800">
              GRAND TOTAL ({grandTotals.slCount} groups)
            </div>
            <div></div>
            <div className="text-right tabular-nums text-forvis-blue-800">
              {grandTotals.taskCount}
            </div>
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
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={groupedData.length}
          itemsPerPage={ITEMS_PER_PAGE}
          showMetadata
          className="mt-4 px-4"
        />
      )}
    </div>
  );
}
