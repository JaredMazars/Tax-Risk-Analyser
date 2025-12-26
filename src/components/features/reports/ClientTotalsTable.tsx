'use client';

/**
 * Client Totals Table Component
 * 
 * Displays aggregated totals by Client (with Group context)
 * Columns: Group Name | Client | Total Tasks | Net WIP
 */

import type { TaskWithWIPAndServiceLine } from '@/types/api';

interface ClientTotal {
  groupCode: string;
  groupDesc: string;
  GSClientID: string;
  clientCode: string;
  clientNameFull: string | null;
  taskCount: number;
  totalWIP: number;
}

interface ClientTotalsTableProps {
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

export function ClientTotalsTable({ tasks }: ClientTotalsTableProps) {
  // Aggregate tasks by client
  const clientTotals = new Map<string, ClientTotal>();

  tasks.forEach((task) => {
    if (!clientTotals.has(task.GSClientID)) {
      clientTotals.set(task.GSClientID, {
        groupCode: task.groupCode,
        groupDesc: task.groupDesc,
        GSClientID: task.GSClientID,
        clientCode: task.clientCode,
        clientNameFull: task.clientNameFull,
        taskCount: 0,
        totalWIP: 0,
      });
    }

    const client = clientTotals.get(task.GSClientID)!;
    client.taskCount += 1;
    client.totalWIP += task.netWip;
  });

  // Convert to array and sort by group then client code
  const sortedClients = Array.from(clientTotals.values()).sort((a, b) => {
    const groupCompare = a.groupDesc.localeCompare(b.groupDesc);
    if (groupCompare !== 0) return groupCompare;
    return a.clientCode.localeCompare(b.clientCode);
  });

  if (sortedClients.length === 0) {
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
            gridTemplateColumns: 'minmax(150px, 1fr) 2fr auto auto',
          }}
        >
          <div>Group Name</div>
          <div>Client</div>
          <div className="text-right min-w-[100px]">Total Tasks</div>
          <div className="text-right min-w-[150px]">Net WIP Balance</div>
        </div>

        {/* Table Body */}
        <div className="bg-white">
          {sortedClients.map((client, index) => (
            <div
              key={client.GSClientID}
              className={`grid gap-4 py-3 px-4 text-sm transition-colors duration-200 hover:bg-forvis-blue-50 ${
                index % 2 === 0 ? 'bg-white' : 'bg-forvis-gray-50'
              }`}
              style={{ gridTemplateColumns: 'minmax(150px, 1fr) 2fr auto auto' }}
            >
              <div className="text-forvis-gray-700">{client.groupDesc}</div>
              <div className="text-forvis-gray-900">
                <span className="font-medium">{client.clientCode}</span>
                {' - '}
                {client.clientNameFull || 'Unnamed Client'}
              </div>
              <div className="text-right min-w-[100px] text-forvis-gray-700 tabular-nums">
                {client.taskCount}
              </div>
              <div className="text-right min-w-[150px]">
                <span
                  className={`font-semibold tabular-nums ${
                    client.totalWIP < 0 ? 'text-red-600' : 'text-forvis-blue-600'
                  }`}
                >
                  {formatCurrency(client.totalWIP)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

