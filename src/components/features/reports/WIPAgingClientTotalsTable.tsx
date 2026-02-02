'use client';

/**
 * WIP Aging Client Totals Table Component
 * 
 * Aggregates WIP aging data by client.
 * Columns: Client | Task Count | Curr | 30 | 60 | 90 | 120 | 150 | 180+ | Total | Provision | Net WIP
 */

import { useState, useMemo } from 'react';
import { Pagination } from '@/components/shared/Pagination';
import type { WIPAgingTaskData } from '@/types/api';

interface WIPAgingClientTotalsTableProps {
  tasks: WIPAgingTaskData[];
}

interface ClientAggregation {
  clientCode: string;
  clientName: string | null;
  GSClientID: string;
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

export function WIPAgingClientTotalsTable({ tasks }: WIPAgingClientTotalsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 25;
  
  // Sort state
  const [sortConfig, setSortConfig] = useState<{key: keyof ClientAggregation; direction: 'asc' | 'desc'} | null>(null);
  
  // Handle sort
  const handleSort = (key: keyof ClientAggregation) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' }; // Default to desc for amounts (highest first)
    });
  };

  // Aggregate by client
  const clientData = useMemo(() => {
    const clientMap = new Map<string, ClientAggregation>();

    tasks.forEach((task) => {
      const key = task.clientCode;
      const existing = clientMap.get(key);

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
        clientMap.set(key, {
          clientCode: key,
          clientName: task.clientName,
          GSClientID: task.GSClientID || '',
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

    const aggregated = Array.from(clientMap.values());
    
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
        
        // Handle null values
        if (aValue === null && bValue !== null) return 1;
        if (aValue !== null && bValue === null) return -1;
        
        return 0;
      });
    }
    
    // Default sort by client code
    return aggregated.sort((a, b) => a.clientCode.localeCompare(b.clientCode));
  }, [tasks, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(clientData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = clientData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Grand totals
  const grandTotals = useMemo(() => ({
    clientCount: clientData.length,
    taskCount: clientData.reduce((sum, c) => sum + c.taskCount, 0),
    curr: clientData.reduce((sum, c) => sum + c.curr, 0),
    bal30: clientData.reduce((sum, c) => sum + c.bal30, 0),
    bal60: clientData.reduce((sum, c) => sum + c.bal60, 0),
    bal90: clientData.reduce((sum, c) => sum + c.bal90, 0),
    bal120: clientData.reduce((sum, c) => sum + c.bal120, 0),
    bal150: clientData.reduce((sum, c) => sum + c.bal150, 0),
    bal180: clientData.reduce((sum, c) => sum + c.bal180, 0),
    balWip: clientData.reduce((sum, c) => sum + c.balWip, 0),
    provision: clientData.reduce((sum, c) => sum + c.provision, 0),
    nettWip: clientData.reduce((sum, c) => sum + c.nettWip, 0),
  }), [clientData]);

  if (clientData.length === 0) {
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
        <h3 className="mt-2 text-sm font-medium text-forvis-gray-900">No clients found</h3>
        <p className="mt-1 text-sm text-forvis-gray-500">
          No clients match the current filters.
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
            gridTemplateColumns: '2fr 70px 90px 90px 90px 90px 90px 90px 90px 100px 90px 100px',
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
          {paginatedData.map((client, index) => (
            <div
              key={client.clientCode}
              className={`grid gap-2 py-2 px-4 text-xs transition-colors duration-200 hover:bg-forvis-blue-50 ${
                index % 2 === 0 ? 'bg-white' : 'bg-forvis-gray-50'
              }`}
              style={{ gridTemplateColumns: '2fr 70px 90px 90px 90px 90px 90px 90px 90px 100px 90px 100px' }}
            >
              <div className="text-forvis-gray-900 truncate" title={`${client.clientCode} - ${client.clientName || 'Unnamed'}`}>
                <span className="font-medium">{client.clientCode}</span>
                {' - '}
                {client.clientName || 'Unnamed'}
              </div>
              <div className="text-right tabular-nums text-forvis-gray-600">
                {client.taskCount}
              </div>
              <div className={`text-right tabular-nums ${client.curr !== 0 ? 'text-forvis-gray-900' : 'text-forvis-gray-400'}`}>
                {formatCurrency(client.curr)}
              </div>
              <div className={`text-right tabular-nums ${client.bal30 !== 0 ? 'text-forvis-gray-900' : 'text-forvis-gray-400'}`}>
                {formatCurrency(client.bal30)}
              </div>
              <div className={`text-right tabular-nums ${client.bal60 !== 0 ? 'text-forvis-warning-600' : 'text-forvis-gray-400'}`}>
                {formatCurrency(client.bal60)}
              </div>
              <div className={`text-right tabular-nums ${client.bal90 !== 0 ? 'text-forvis-warning-600' : 'text-forvis-gray-400'}`}>
                {formatCurrency(client.bal90)}
              </div>
              <div className={`text-right tabular-nums ${client.bal120 !== 0 ? 'text-forvis-error-600' : 'text-forvis-gray-400'}`}>
                {formatCurrency(client.bal120)}
              </div>
              <div className={`text-right tabular-nums ${client.bal150 !== 0 ? 'text-forvis-error-600' : 'text-forvis-gray-400'}`}>
                {formatCurrency(client.bal150)}
              </div>
              <div className={`text-right tabular-nums font-semibold ${client.bal180 !== 0 ? 'text-forvis-error-700' : 'text-forvis-gray-400'}`}>
                {formatCurrency(client.bal180)}
              </div>
              <div className={`text-right tabular-nums font-semibold ${
                client.balWip < 0 ? 'text-forvis-error-600' : 'text-forvis-blue-600'
              }`}>
                {formatCurrency(client.balWip)}
              </div>
              <div className="text-right tabular-nums text-forvis-gray-700">
                {formatCurrency(client.provision)}
              </div>
              <div className={`text-right tabular-nums font-bold ${
                client.nettWip < 0 ? 'text-forvis-error-600' : 'text-forvis-blue-700'
              }`}>
                {formatCurrency(client.nettWip)}
              </div>
            </div>
          ))}

          {/* Totals Row */}
          <div
            className="grid gap-2 py-3 px-4 text-xs font-bold border-t-2 border-forvis-blue-500"
            style={{
              background: 'linear-gradient(135deg, #F0F7FD 0%, #E0EDFB 100%)',
              gridTemplateColumns: '2fr 70px 90px 90px 90px 90px 90px 90px 90px 100px 90px 100px'
            }}
          >
            <div className="text-forvis-blue-800">
              GRAND TOTAL ({grandTotals.clientCount} clients)
            </div>
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
          totalItems={clientData.length}
          itemsPerPage={ITEMS_PER_PAGE}
          showMetadata
          className="mt-4 px-4"
        />
      )}
    </div>
  );
}
