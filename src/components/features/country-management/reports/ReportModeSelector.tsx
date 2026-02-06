'use client';

/**
 * Report Mode Selector Component
 * 
 * Three-way toggle for selecting report aggregation mode:
 * - Client Reports: Aggregated by client/group (standard view)
 * - Partner Reports: Aggregated by partner (shows each partner's portfolio)
 * - Manager Reports: Aggregated by manager (shows each manager's portfolio)
 */

import { Building2, Users, UserCog } from 'lucide-react';

export type ReportMode = 'client' | 'partner' | 'manager';

interface ReportModeSelectorProps {
  value: ReportMode;
  onChange: (mode: ReportMode) => void;
}

const modes: { value: ReportMode; label: string; icon: typeof Building2; description: string }[] = [
  {
    value: 'client',
    label: 'Client Reports',
    icon: Building2,
    description: 'Aggregated by client and group',
  },
  {
    value: 'partner',
    label: 'Partner Reports',
    icon: Users,
    description: 'Aggregated by task partner',
  },
  {
    value: 'manager',
    label: 'Manager Reports',
    icon: UserCog,
    description: 'Aggregated by task manager',
  },
];

export function ReportModeSelector({ value, onChange }: ReportModeSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-forvis-gray-700">Report Mode</label>
      <div className="flex gap-2">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = value === mode.value;
          
          return (
            <button
              key={mode.value}
              onClick={() => onChange(mode.value)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-white shadow-sm'
                  : 'text-forvis-gray-700 bg-white border border-forvis-gray-300 hover:bg-forvis-gray-50'
              }`}
              style={
                isActive
                  ? { background: 'linear-gradient(to right, #2E5AAC, #25488A)' }
                  : {}
              }
              title={mode.description}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{mode.label}</span>
              <span className="sm:hidden">{mode.value.charAt(0).toUpperCase() + mode.value.slice(1)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
