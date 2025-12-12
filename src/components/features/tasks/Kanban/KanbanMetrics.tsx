'use client';

import { Clock } from 'lucide-react';
import { KanbanMetricsProps } from './types';

export function KanbanMetrics({ metrics }: KanbanMetricsProps) {
  const utilizationPercentage = metrics.totalBudgetHours > 0
    ? Math.min((metrics.totalActualHours / metrics.totalBudgetHours) * 100, 100)
    : 0;

  const isOverBudget = metrics.totalActualHours > metrics.totalBudgetHours;

  return (
    <div className="space-y-2 text-xs">
      {/* Task Count */}
      <div className="flex items-center justify-between">
        <span className="text-white opacity-90">Tasks</span>
        <span className="font-semibold text-white">{metrics.count}</span>
      </div>

      {/* Hours */}
      {(metrics.totalBudgetHours > 0 || metrics.totalActualHours > 0) && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-white opacity-90 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Hours
            </span>
            <span className={`font-semibold ${isOverBudget ? 'text-red-200' : 'text-white'}`}>
              {metrics.totalActualHours.toFixed(1)} / {metrics.totalBudgetHours.toFixed(1)}h
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white bg-opacity-20 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isOverBudget ? 'bg-red-300' : 'bg-white'
              }`}
              style={{ width: `${utilizationPercentage}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}



