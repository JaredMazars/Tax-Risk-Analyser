'use client';

import { TrendingUp, TrendingDown, DollarSign, Target, Clock } from 'lucide-react';
import { useTaskTimeAccumulation } from '@/hooks/tasks/useTaskTimeAccumulation';
import { LoadingSpinner, Banner } from '@/components/ui';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface TimeVsBudgetChartProps {
  taskId: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
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

  // Find cumulative time and budget values
  const timeEntry = payload.find((p) => p.dataKey === 'cumulativeTime');
  const budgetEntry = payload.find((p) => p.dataKey === 'budget');
  const timeValue = timeEntry?.value || 0;
  const budgetValue = budgetEntry?.value || 0;
  const variance = timeValue - budgetValue;
  const isOverBudget = variance > 0;

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg border border-forvis-gray-200">
      <p className="text-sm font-semibold text-forvis-gray-900 mb-2">
        {label && formatDate(label)}
      </p>
      {payload.map((entry, index) => (
        <div key={`tooltip-${index}`} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-forvis-gray-700">{entry.name}:</span>
          </div>
          <span className="text-xs font-semibold text-forvis-gray-900">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
      <div className="border-t border-forvis-gray-200 mt-2 pt-2">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-forvis-gray-700">Variance:</span>
          <span className={`text-xs font-semibold ${isOverBudget ? 'text-forvis-error-600' : 'text-forvis-success-600'}`}>
            {isOverBudget ? '+' : ''}{formatCurrency(variance)}
          </span>
        </div>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

function SummaryCard({ label, value, icon, color, subtitle }: SummaryCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-gradient-dashboard-card rounded-lg p-4 shadow-corporate border border-forvis-blue-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-forvis-gray-600 uppercase tracking-wider">
            {label}
          </p>
          <p className={`text-2xl font-bold mt-2 ${color}`}>
            {formatCurrency(value)}
          </p>
          {subtitle && (
            <p className="text-xs text-forvis-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="bg-gradient-icon-standard rounded-full p-2.5">
          {icon}
        </div>
      </div>
    </div>
  );
}

export function TimeVsBudgetChart({ taskId }: TimeVsBudgetChartProps) {
  const { data, isLoading, error } = useTaskTimeAccumulation(taskId);

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
          title="Failed to load time accumulation data"
          message={error instanceof Error ? error.message : 'An unknown error occurred'}
        />
      </div>
    );
  }

  if (!data || data.cumulativeData.length === 0) {
    return (
      <Banner
        variant="info"
        title="No time data available"
        message="There are no time entries for this task yet. Time accumulation will appear once work is logged."
      />
    );
  }

  // Calculate variance metrics
  const variance = data.actualTime - data.totalBudget;
  const variancePercentage = data.totalBudget > 0 
    ? ((variance / data.totalBudget) * 100).toFixed(1) 
    : '0';
  const isOverBudget = variance > 0;

  return (
    <div className="space-y-6">
      {/* Summary Section Header */}
      <div className="bg-gradient-dashboard-card rounded-lg p-4 border border-forvis-blue-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-icon-standard rounded-full p-2">
            <Target className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-forvis-gray-900">Time vs Budget Summary</h2>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Budget"
          value={data.totalBudget}
          icon={<DollarSign className="w-5 h-5 text-white" />}
          color="text-forvis-blue-600"
          subtitle="Allocated time budget"
        />
        <SummaryCard
          label="Actual Time"
          value={data.actualTime}
          icon={<Clock className="w-5 h-5 text-white" />}
          color="text-forvis-blue-600"
          subtitle="Time used to date"
        />
        <div className="bg-gradient-dashboard-card rounded-lg p-4 shadow-corporate border border-forvis-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-forvis-gray-600 uppercase tracking-wider">
                Variance
              </p>
              <p className={`text-2xl font-bold mt-2 ${isOverBudget ? 'text-forvis-error-600' : 'text-forvis-success-600'}`}>
                {isOverBudget ? '+' : ''}{formatCurrency(variance)}
              </p>
              <p className="text-xs text-forvis-gray-500 mt-1">
                {isOverBudget ? 'Over budget' : 'Under budget'}
              </p>
            </div>
            <div className={`rounded-full p-2.5 ${isOverBudget ? 'bg-forvis-error-600' : 'bg-forvis-success-600'}`}>
              {isOverBudget ? (
                <TrendingUp className="w-5 h-5 text-white" />
              ) : (
                <TrendingDown className="w-5 h-5 text-white" />
              )}
            </div>
          </div>
        </div>
        <div className="bg-gradient-dashboard-card rounded-lg p-4 shadow-corporate border border-forvis-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-forvis-gray-600 uppercase tracking-wider">
                Variance %
              </p>
              <p className={`text-2xl font-bold mt-2 ${isOverBudget ? 'text-forvis-error-600' : 'text-forvis-success-600'}`}>
                {isOverBudget ? '+' : ''}{variancePercentage}%
              </p>
              <p className="text-xs text-forvis-gray-500 mt-1">
                Budget utilization
              </p>
            </div>
            <div className={`rounded-full p-2.5 ${isOverBudget ? 'bg-forvis-error-600' : 'bg-forvis-success-600'}`}>
              {isOverBudget ? (
                <TrendingUp className="w-5 h-5 text-white" />
              ) : (
                <TrendingDown className="w-5 h-5 text-white" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section Header */}
      <div className="bg-gradient-dashboard-card rounded-lg p-4 border border-forvis-blue-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-icon-standard rounded-full p-2">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-forvis-gray-900">Time Accumulation Chart</h2>
            <p className="text-xs text-forvis-gray-600 mt-0.5">
              From {format(parseISO(data.startDate), 'dd MMM yyyy')} to {format(parseISO(data.endDate), 'dd MMM yyyy')}
            </p>
          </div>
        </div>
      </div>

      {/* Line Chart */}
      <div className="rounded-lg bg-white shadow-corporate border border-forvis-gray-200 p-6">
        <ResponsiveContainer width="100%" height={500}>
          <LineChart
            data={data.cumulativeData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              interval="preserveStartEnd"
              minTickGap={50}
            />
            <YAxis
              tickFormatter={(value) => formatCurrency(value)}
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            {/* Budget Reference Line - flat line at budget amount */}
            <ReferenceLine 
              y={data.totalBudget} 
              stroke="#2F6A5F" 
              strokeDasharray="5 5" 
              strokeWidth={2}
              label={{ value: 'Budget', position: 'right', fill: '#2F6A5F', fontSize: 12 }}
            />
            {/* Cumulative Time Line */}
            <Line
              type="monotone"
              dataKey="cumulativeTime"
              name="Cumulative Time"
              stroke="#2E5AAC"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
              connectNulls={true}
            />
            {/* Budget Line (for legend visibility) */}
            <Line
              type="monotone"
              dataKey="budget"
              name="Budget"
              stroke="#2F6A5F"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Data Info */}
      <div className="rounded-lg bg-forvis-blue-50 border border-forvis-blue-100 p-4">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-forvis-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-forvis-blue-900">
              Data Period Information
            </p>
            <p className="text-xs text-forvis-blue-700 mt-1">
              This chart displays time accumulation from the task start date. 
              The blue line shows cumulative time spent, while the green dashed line shows the budgeted amount.
            </p>
            <ul className="text-xs text-forvis-blue-700 mt-2 ml-4 space-y-1">
              <li><strong>Cumulative Time:</strong> Sum of all time transactions (TType = &apos;T&apos;) over time</li>
              <li><strong>Budget:</strong> Total allocated budget based on staff hours × rates</li>
              <li><strong>Variance:</strong> Actual time minus budget (negative = under budget)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
