'use client';

/**
 * Master Service Line Totals Table Component
 * 
 * Displays aggregated totals by Master Service Line
 * Columns: Master Service Line Name | Total Tasks | Net WIP
 */

import type { TaskWithWIPAndServiceLine } from '@/types/api';

interface MasterServiceLineTotal {
  code: string;
  name: string;
  taskCount: number;
  totalWIP: number;
  ltdHours: number;
  grossProduction: number;
  ltdAdj: number;
  netRevenue: number;
  ltdCost: number;
  grossProfit: number;
}

interface MasterServiceLineTotalsTableProps {
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

export function MasterServiceLineTotalsTable({ tasks }: MasterServiceLineTotalsTableProps) {
  // Aggregate tasks by master service line
  const masterServiceLineTotals = new Map<string, MasterServiceLineTotal>();

  tasks.forEach((task) => {
    const code = task.masterServiceLineCode;
    const name = task.masterServiceLineName;
    
    if (!masterServiceLineTotals.has(code)) {
      masterServiceLineTotals.set(code, {
        code,
        name,
        taskCount: 0,
        totalWIP: 0,
        ltdHours: 0,
        grossProduction: 0,
        ltdAdj: 0,
        netRevenue: 0,
        ltdCost: 0,
        grossProfit: 0,
      });
    }

    const msl = masterServiceLineTotals.get(code)!;
    msl.taskCount += 1;
    msl.totalWIP += task.netWip;
    msl.ltdHours += task.ltdHours;
    msl.grossProduction += task.grossProduction;
    msl.ltdAdj += task.ltdAdj;
    msl.netRevenue += task.netRevenue;
    msl.ltdCost += task.ltdCost;
    msl.grossProfit += task.grossProfit;
  });

  // Convert to array and sort by name
  const sortedMasterServiceLines = Array.from(masterServiceLineTotals.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  if (sortedMasterServiceLines.length === 0) {
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
        <h3 className="mt-2 text-sm font-medium text-forvis-gray-900">No master service lines found</h3>
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
            gridTemplateColumns: '2fr 80px 100px 120px 120px 120px 100px 120px 120px 120px',
          }}
        >
          <div>Master Service Line</div>
          <div className="text-right">Tasks</div>
          <div className="text-right">Hours</div>
          <div className="text-right">Production</div>
          <div className="text-right">Adjustments</div>
          <div className="text-right">Net Revenue</div>
          <div className="text-right">Adj %</div>
          <div className="text-right">Cost</div>
          <div className="text-right">Gross Profit</div>
          <div className="text-right">GP %</div>
        </div>

        {/* Table Body */}
        <div className="bg-white">
          {sortedMasterServiceLines.map((msl, index) => {
            const adjustmentPercentage = msl.grossProduction !== 0 ? (msl.ltdAdj / msl.grossProduction) * 100 : 0;
            const grossProfitPercentage = msl.netRevenue !== 0 ? (msl.grossProfit / msl.netRevenue) * 100 : 0;
            
            return (
              <div
                key={msl.code}
                className={`grid gap-3 py-3 px-4 text-xs transition-colors duration-200 hover:bg-forvis-blue-50 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-forvis-gray-50'
                }`}
                style={{ gridTemplateColumns: '2fr 80px 100px 120px 120px 120px 100px 120px 120px 120px' }}
              >
                <div className="font-semibold text-forvis-gray-900">{msl.name}</div>
                <div className="text-right text-forvis-gray-700 tabular-nums">
                  {msl.taskCount}
                </div>
                <div className="text-right tabular-nums text-forvis-gray-700">
                  {formatNumber(msl.ltdHours)}
                </div>
                <div className="text-right tabular-nums text-forvis-gray-700">
                  {formatCurrency(msl.grossProduction)}
                </div>
                <div className={`text-right tabular-nums font-medium ${
                  msl.ltdAdj < 0 ? 'text-red-600' : 'text-forvis-gray-700'
                }`}>
                  {formatCurrency(msl.ltdAdj)}
                </div>
                <div className={`text-right tabular-nums font-semibold ${
                  msl.netRevenue < 0 ? 'text-red-600' : 'text-forvis-blue-600'
                }`}>
                  {formatCurrency(msl.netRevenue)}
                </div>
                <div className={`text-right tabular-nums ${
                  adjustmentPercentage < 0 ? 'text-red-600' : 'text-forvis-gray-700'
                }`}>
                  {formatPercentage(adjustmentPercentage)}
                </div>
                <div className="text-right tabular-nums text-forvis-gray-700">
                  {formatCurrency(msl.ltdCost)}
                </div>
                <div className={`text-right tabular-nums font-semibold ${
                  msl.grossProfit < 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatCurrency(msl.grossProfit)}
                </div>
                <div className={`text-right tabular-nums font-bold ${
                  grossProfitPercentage >= 60 ? 'text-green-600' : 
                  grossProfitPercentage >= 50 ? 'text-yellow-600' : 
                  'text-red-600'
                }`}>
                  {formatPercentage(grossProfitPercentage)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

