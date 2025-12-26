'use client';

/**
 * Sub Service Line Group Totals Table Component
 * 
 * Displays aggregated totals by Sub Service Line Group
 * Columns: Sub Service Line Group Name | Total Tasks | Net WIP
 */

import type { TaskWithWIPAndServiceLine } from '@/types/api';

interface SubServiceLineGroupTotal {
  code: string;
  name: string;
  taskCount: number;
  totalWIP: number;
}

interface SubServiceLineGroupTotalsTableProps {
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

export function SubServiceLineGroupTotalsTable({ tasks }: SubServiceLineGroupTotalsTableProps) {
  // Aggregate tasks by sub service line group
  const subServiceLineGroupTotals = new Map<string, SubServiceLineGroupTotal>();

  tasks.forEach((task) => {
    const code = task.subServlineGroupCode || task.servLineCode;
    const name = task.subServlineGroupDesc;
    
    if (!subServiceLineGroupTotals.has(code)) {
      subServiceLineGroupTotals.set(code, {
        code,
        name,
        taskCount: 0,
        totalWIP: 0,
      });
    }

    const sslg = subServiceLineGroupTotals.get(code)!;
    sslg.taskCount += 1;
    sslg.totalWIP += task.netWip;
  });

  // Convert to array and sort by name
  const sortedSubServiceLineGroups = Array.from(subServiceLineGroupTotals.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  if (sortedSubServiceLineGroups.length === 0) {
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
        <h3 className="mt-2 text-sm font-medium text-forvis-gray-900">No sub service line groups found</h3>
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
          className="grid gap-4 py-3 px-4 text-sm font-semibold text-white shadow-corporate"
          style={{
            background: 'linear-gradient(to right, #2E5AAC, #25488A)',
            gridTemplateColumns: '1fr auto auto',
          }}
        >
          <div>Sub Service Line Group</div>
          <div className="text-right min-w-[120px]">Total Tasks</div>
          <div className="text-right min-w-[150px]">Net WIP Balance</div>
        </div>

        {/* Table Body */}
        <div className="bg-white">
          {sortedSubServiceLineGroups.map((sslg, index) => (
            <div
              key={sslg.code}
              className={`grid gap-4 py-3 px-4 text-sm transition-colors duration-200 hover:bg-forvis-blue-50 ${
                index % 2 === 0 ? 'bg-white' : 'bg-forvis-gray-50'
              }`}
              style={{ gridTemplateColumns: '1fr auto auto' }}
            >
              <div className="font-semibold text-forvis-gray-900">{sslg.name}</div>
              <div className="text-right min-w-[120px] text-forvis-gray-700 tabular-nums">
                {sslg.taskCount}
              </div>
              <div className="text-right min-w-[150px]">
                <span
                  className={`font-semibold tabular-nums ${
                    sslg.totalWIP < 0 ? 'text-red-600' : 'text-forvis-blue-600'
                  }`}
                >
                  {formatCurrency(sslg.totalWIP)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

