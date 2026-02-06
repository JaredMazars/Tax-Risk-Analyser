'use client';

import { Users, TrendingUp, TrendingDown } from 'lucide-react';
import { useTaskTimeAccumulation } from '@/hooks/tasks/useTaskTimeAccumulation';
import { LoadingSpinner, Banner } from '@/components/ui';
import type { EmployeeTimeAccumulation } from '@/types/analytics';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface TimeByEmployeeGridProps {
  taskId: number;
}

interface EmployeeChartCardProps {
  employee: EmployeeTimeAccumulation;
}

interface EmployeeChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
  allocatedBudget: number;
}

function EmployeeChartTooltip({ active, payload, label, allocatedBudget }: EmployeeChartTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd MMM yyyy');
    } catch {
      return dateStr;
    }
  };

  const timeEntry = payload.find((p) => p.dataKey === 'cumulativeTime');
  const timeValue = timeEntry?.value || 0;
  const variance = timeValue - allocatedBudget;
  const isOverBudget = variance > 0;
  const variancePercentage = allocatedBudget > 0 
    ? ((variance / allocatedBudget) * 100).toFixed(1) 
    : '0';

  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border border-forvis-gray-200 text-xs">
      <p className="font-semibold text-forvis-gray-900 mb-2">
        {formatDate(label || '')}
      </p>
      <div className="space-y-1.5">
        <div className="flex justify-between gap-4">
          <span className="text-forvis-gray-600">Cumulative Time:</span>
          <span className="font-semibold text-forvis-blue-600">{formatCurrency(timeValue)}</span>
        </div>
        {allocatedBudget > 0 && (
          <>
            <div className="flex justify-between gap-4">
              <span className="text-forvis-gray-600">Budget:</span>
              <span className="font-semibold text-forvis-success-600">{formatCurrency(allocatedBudget)}</span>
            </div>
            <div className="flex justify-between gap-4 pt-1 border-t border-forvis-gray-100">
              <span className="text-forvis-gray-600">Variance:</span>
              <span className={`font-semibold ${isOverBudget ? 'text-forvis-error-600' : 'text-forvis-success-600'}`}>
                {isOverBudget ? '+' : ''}{formatCurrency(variance)} ({isOverBudget ? '+' : ''}{variancePercentage}%)
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EmployeeChartCard({ employee }: EmployeeChartCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatXAxis = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM yy');
    } catch {
      return dateStr;
    }
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `R${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R${(value / 1000).toFixed(0)}K`;
    return `R${value}`;
  };

  // Calculate variance
  const variance = employee.actualTime - employee.allocatedBudget;
  const variancePercentage = employee.allocatedBudget > 0 
    ? ((variance / employee.allocatedBudget) * 100).toFixed(1) 
    : '0';
  const isOverBudget = variance > 0;

  // Get max value for Y-axis domain
  const maxValue = Math.max(
    employee.allocatedBudget,
    ...employee.cumulativeData.map(d => d.cumulativeTime)
  );

  return (
    <div className="bg-white rounded-lg shadow-corporate border border-forvis-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-dashboard-card p-4 border-b border-forvis-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-forvis-gray-900">{employee.userName}</h3>
              {!employee.isTeamMember && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-forvis-warning-100 text-forvis-warning-800">
                  Not Assigned
                </span>
              )}
            </div>
            <p className="text-xs text-forvis-gray-600 uppercase">{employee.empCatDesc}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-forvis-gray-600">Budget</p>
            <p className={`font-semibold ${employee.allocatedBudget > 0 ? 'text-forvis-blue-600' : 'text-forvis-gray-400'}`}>
              {employee.allocatedBudget > 0 ? formatCurrency(employee.allocatedBudget) : 'No budget'}
            </p>
          </div>
        </div>
      </div>

      {/* Mini Chart */}
      <div className="p-4">
        {employee.cumulativeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={employee.cumulativeData}
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxis}
                stroke="#9CA3AF"
                style={{ fontSize: '10px' }}
                interval="preserveStartEnd"
                tick={{ fontSize: 10 }}
              />
              <YAxis
                tickFormatter={formatYAxis}
                stroke="#9CA3AF"
                style={{ fontSize: '10px' }}
                width={50}
                domain={[0, maxValue > 0 ? maxValue * 1.1 : 'auto']}
                tick={{ fontSize: 10 }}
              />
              <Tooltip content={<EmployeeChartTooltip allocatedBudget={employee.allocatedBudget} />} />
              {/* Budget Reference Line - only show if there's a budget */}
              {employee.allocatedBudget > 0 && (
                <ReferenceLine 
                  y={employee.allocatedBudget} 
                  stroke="#2F6A5F" 
                  strokeDasharray="3 3" 
                  strokeWidth={2}
                />
              )}
              {/* Cumulative Time Line */}
              <Line
                type="monotone"
                dataKey="cumulativeTime"
                stroke="#2E5AAC"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
                connectNulls={true}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center bg-forvis-gray-50 rounded-lg">
            <p className="text-sm text-forvis-gray-500">No time entries yet</p>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="border-t border-forvis-gray-200 px-4 py-3 bg-forvis-gray-50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-forvis-gray-600">Actual</p>
            <p className="font-semibold text-forvis-gray-900 text-sm">
              {formatCurrency(employee.actualTime)}
            </p>
          </div>
          <div>
            <p className="text-xs text-forvis-gray-600">Variance</p>
            {employee.allocatedBudget > 0 ? (
              <p className={`font-semibold text-sm ${isOverBudget ? 'text-forvis-error-600' : 'text-forvis-success-600'}`}>
                {isOverBudget ? '+' : ''}{formatCurrency(variance)}
              </p>
            ) : (
              <p className="text-sm text-forvis-gray-400">N/A</p>
            )}
          </div>
          <div>
            <p className="text-xs text-forvis-gray-600">%</p>
            {employee.allocatedBudget > 0 ? (
              <div className="flex items-center justify-center gap-1">
                {isOverBudget ? (
                  <TrendingUp className="w-3 h-3 text-forvis-error-600" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-forvis-success-600" />
                )}
                <p className={`font-semibold text-sm ${isOverBudget ? 'text-forvis-error-600' : 'text-forvis-success-600'}`}>
                  {isOverBudget ? '+' : ''}{variancePercentage}%
                </p>
              </div>
            ) : (
              <p className="text-sm text-forvis-gray-400">N/A</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TimeByEmployeeGrid({ taskId }: TimeByEmployeeGridProps) {
  const { data, isLoading, error } = useTaskTimeAccumulation(taskId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Banner
          variant="error"
          title="Failed to load employee time data"
          message={error instanceof Error ? error.message : 'An unknown error occurred'}
        />
      </div>
    );
  }

  if (!data || data.employeeData.length === 0) {
    return (
      <Banner
        variant="info"
        title="No time entries found"
        message="There are no time entries for this task yet. Time accumulation by employee will appear once work is logged."
      />
    );
  }

  // Calculate summary stats
  const totalBudget = data.totalBudget;
  const totalActual = data.actualTime;
  const totalVariance = totalActual - totalBudget;
  const isOverBudget = totalVariance > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-dashboard-card rounded-lg p-4 border border-forvis-blue-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-icon-standard rounded-full p-2">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-forvis-gray-900">Time by Employee</h2>
              <p className="text-xs text-forvis-gray-600 mt-0.5">
                {data.employeeData.length} employee{data.employeeData.length !== 1 ? 's' : ''} who booked time
                {data.employeeData.filter(e => !e.isTeamMember).length > 0 && (
                  <span className="text-forvis-warning-600"> (includes {data.employeeData.filter(e => !e.isTeamMember).length} not assigned to task)</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-forvis-gray-600">Total Budget</p>
              <p className="font-semibold text-forvis-blue-600">{formatCurrency(totalBudget)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-forvis-gray-600">Total Actual</p>
              <p className="font-semibold text-forvis-blue-600">{formatCurrency(totalActual)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-forvis-gray-600">Total Variance</p>
              <p className={`font-semibold ${isOverBudget ? 'text-forvis-error-600' : 'text-forvis-success-600'}`}>
                {isOverBudget ? '+' : ''}{formatCurrency(totalVariance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.employeeData.map((employee) => (
          <EmployeeChartCard key={employee.empCode} employee={employee} />
        ))}
      </div>

      {/* Legend */}
      <div className="rounded-lg bg-forvis-blue-50 border border-forvis-blue-100 p-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-[#2E5AAC]"></div>
            <span className="text-xs text-forvis-gray-700">Cumulative Time</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-[#2F6A5F]" style={{ borderStyle: 'dashed', borderWidth: '1px', height: '0' }}></div>
            <div className="w-4 border-t-2 border-dashed border-[#2F6A5F]"></div>
            <span className="text-xs text-forvis-gray-700">Budget</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-forvis-success-600" />
            <span className="text-xs text-forvis-gray-700">Under Budget</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-forvis-error-600" />
            <span className="text-xs text-forvis-gray-700">Over Budget</span>
          </div>
        </div>
      </div>
    </div>
  );
}
