'use client';

import { KanbanMetricsProps } from './types';

export function KanbanMetrics({ metrics }: KanbanMetricsProps) {
  return (
    <div className="space-y-2 text-xs">
      {/* Task Count */}
      <div className="flex items-center justify-between">
        <span className="text-white opacity-90">Tasks</span>
        <span className="font-semibold text-white">{metrics.count}</span>
      </div>
    </div>
  );
}




