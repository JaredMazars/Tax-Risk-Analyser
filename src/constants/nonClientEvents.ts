import { NonClientEventType } from '@/types';

// Non-Client Event Type Labels
export const NON_CLIENT_EVENT_LABELS: Record<NonClientEventType, string> = {
  [NonClientEventType.TRAINING]: 'Training',
  [NonClientEventType.ANNUAL_LEAVE]: 'Annual Leave',
  [NonClientEventType.SICK_LEAVE]: 'Sick Leave',
  [NonClientEventType.PUBLIC_HOLIDAY]: 'Public Holiday',
  [NonClientEventType.PERSONAL]: 'Personal',
  [NonClientEventType.ADMINISTRATIVE]: 'Administrative',
};

// Non-Client Event Type Colors (gradients for timeline display - Forvis data-viz palette)
export const NON_CLIENT_EVENT_COLORS: Record<NonClientEventType, { from: string; to: string }> = {
  [NonClientEventType.TRAINING]: { from: '#2F6A5F', to: '#1F4540' },       // viz-4 success tones
  [NonClientEventType.ANNUAL_LEAVE]: { from: '#2E5AAC', to: '#1C3667' },   // viz-1 primary blue
  [NonClientEventType.SICK_LEAVE]: { from: '#A8803A', to: '#5E451F' },     // viz-5 warning tones
  [NonClientEventType.PUBLIC_HOLIDAY]: { from: '#5E5AAE', to: '#3D3A7A' }, // viz-7 muted violet
  [NonClientEventType.PERSONAL]: { from: '#2E7C7A', to: '#1C4E4D' },      // viz-8 muted teal
  [NonClientEventType.ADMINISTRATIVE]: { from: '#64748B', to: '#334155' }, // ink/muted corporate neutrals
};

// Non-Client Event Type Configuration
export const NON_CLIENT_EVENT_CONFIG: Record<NonClientEventType, {
  label: string;
  shortLabel: string;
  icon: string;
  gradient: string;
  description: string;
}> = {
  [NonClientEventType.TRAINING]: {
    label: 'Training',
    shortLabel: 'Training',
    icon: '📚',
    gradient: 'linear-gradient(135deg, #2F6A5F 0%, #1F4540 100%)',
    description: 'Professional development and training sessions'
  },
  [NonClientEventType.ANNUAL_LEAVE]: {
    label: 'Annual Leave',
    shortLabel: 'Leave',
    icon: '🏖️',
    gradient: 'linear-gradient(135deg, #2E5AAC 0%, #1C3667 100%)',
    description: 'Scheduled annual leave/vacation'
  },
  [NonClientEventType.SICK_LEAVE]: {
    label: 'Sick Leave',
    shortLabel: 'Sick',
    icon: '🤒',
    gradient: 'linear-gradient(135deg, #A8803A 0%, #5E451F 100%)',
    description: 'Sick leave and medical appointments'
  },
  [NonClientEventType.PUBLIC_HOLIDAY]: {
    label: 'Public Holiday',
    shortLabel: 'Holiday',
    icon: '🎉',
    gradient: 'linear-gradient(135deg, #5E5AAE 0%, #3D3A7A 100%)',
    description: 'Public holidays and firm closures'
  },
  [NonClientEventType.PERSONAL]: {
    label: 'Personal',
    shortLabel: 'Personal',
    icon: '👤',
    gradient: 'linear-gradient(135deg, #2E7C7A 0%, #1C4E4D 100%)',
    description: 'Personal time off'
  },
  [NonClientEventType.ADMINISTRATIVE]: {
    label: 'Administrative',
    shortLabel: 'Admin',
    icon: '📋',
    gradient: 'linear-gradient(135deg, #64748B 0%, #334155 100%)',
    description: 'Administrative tasks and internal work'
  }
};
