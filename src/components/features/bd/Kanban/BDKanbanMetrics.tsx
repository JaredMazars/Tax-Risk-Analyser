/**
 * BD Kanban Column Metrics
 * 
 * Displays count and total value for each column.
 * Pattern based on tasks kanban metrics.
 */

import { formatAmount } from '@/lib/utils/formatters';

interface BDKanbanMetricsProps {
  count: number;
  value: number;
}

export function BDKanbanMetrics({ count, value }: BDKanbanMetricsProps) {
  return (
    <div className="space-y-2 text-xs">
      {/* Opportunity Count */}
      <div className="flex items-center justify-between">
        <span className="text-white opacity-90">Opportunities</span>
        <span className="font-semibold text-white">{count}</span>
      </div>
      
      {/* Total Value */}
      <div className="flex items-center justify-between">
        <span className="text-white opacity-90">Total Value</span>
        <span className="font-semibold text-white tabular-nums">{formatAmount(value)}</span>
      </div>
    </div>
  );
}
