'use client';

/**
 * Group Totals Table Component
 * 
 * Displays aggregated totals by Client Group
 * Columns: Group Name | Total Tasks | Net WIP
 */

import type { TaskWithWIPAndServiceLine } from '@/types/api';

interface GroupTotal {
  groupCode: string;
  groupDesc: string;
  taskCount: number;
  totalWIP: number;
}

interface GroupTotalsTableProps {
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

export function GroupTotalsTable({ tasks }: GroupTotalsTableProps) {
  // Aggregate tasks by group
  const groupTotals = new Map<string, GroupTotal>();

  tasks.forEach((task) => {
    if (!groupTotals.has(task.groupCode)) {
      groupTotals.set(task.groupCode, {
        groupCode: task.groupCode,
        groupDesc: task.groupDesc,
        taskCount: 0,
        totalWIP: 0,
      });
    }

    const group = groupTotals.get(task.groupCode)!;
    group.taskCount += 1;
    group.totalWIP += task.netWip;
  });

  // Convert to array and sort by group description
  const sortedGroups = Array.from(groupTotals.values()).sort((a, b) =>
    a.groupDesc.localeCompare(b.groupDesc)
  );

  if (sortedGroups.length === 0) {
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
        <h3 className="mt-2 text-sm font-medium text-forvis-gray-900">No groups found</h3>
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
          <div>Group Name</div>
          <div className="text-right min-w-[120px]">Total Tasks</div>
          <div className="text-right min-w-[150px]">Net WIP Balance</div>
        </div>

        {/* Table Body */}
        <div className="bg-white">
          {sortedGroups.map((group, index) => (
            <div
              key={group.groupCode}
              className={`grid gap-4 py-3 px-4 text-sm transition-colors duration-200 hover:bg-forvis-blue-50 ${
                index % 2 === 0 ? 'bg-white' : 'bg-forvis-gray-50'
              }`}
              style={{ gridTemplateColumns: '1fr auto auto' }}
            >
              <div className="font-semibold text-forvis-gray-900">{group.groupDesc}</div>
              <div className="text-right min-w-[120px] text-forvis-gray-700 tabular-nums">
                {group.taskCount}
              </div>
              <div className="text-right min-w-[150px]">
                <span
                  className={`font-semibold tabular-nums ${
                    group.totalWIP < 0 ? 'text-red-600' : 'text-forvis-blue-600'
                  }`}
                >
                  {formatCurrency(group.totalWIP)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

