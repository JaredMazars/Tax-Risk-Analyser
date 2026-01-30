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
    <div className="flex items-center gap-3">
      <span className="text-sm font-semibold text-forvis-gray-900">
        {count}
      </span>
      <span className="text-xs text-forvis-gray-600">
        {formatAmount(value)}
      </span>
    </div>
  );
}
