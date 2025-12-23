/**
 * Task Team Selector Component
 * Dropdown selector for team members assigned to a specific task
 */

'use client';

import { useTaskTeamMembers } from '@/hooks/tasks/useTaskTeamMembers';

interface TaskTeamSelectorProps {
  taskId: number;
  value?: string | null;
  onChange: (userId: string, userName: string) => void;
  label: string;
  required?: boolean;
}

export function TaskTeamSelector({
  taskId,
  value,
  onChange,
  label,
  required = false,
}: TaskTeamSelectorProps) {
  const { data: teamMembers = [], isLoading, error } = useTaskTeamMembers({
    taskId,
    enabled: !!taskId,
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUserId = e.target.value;
    const selectedMember = teamMembers.find((member) => member.userId === selectedUserId);

    if (selectedMember) {
      onChange(selectedMember.userId, selectedMember.User.name || selectedMember.User.email);
    } else {
      onChange('', '');
    }
  };

  if (isLoading) {
    return (
      <div>
        <label className="block text-sm font-medium text-forvis-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="animate-pulse">
          <div className="h-10 bg-forvis-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <label className="block text-sm font-medium text-forvis-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">Failed to load team members</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-forvis-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value || ''}
        onChange={handleChange}
        className="w-full px-3 py-2 border border-forvis-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-forvis-blue-500 focus:border-forvis-blue-500"
        required={required}
      >
        <option value="">Select {label.toLowerCase()}...</option>
        {teamMembers.map((member) => (
          <option key={member.userId} value={member.userId}>
            {member.User.name || member.User.email}
          </option>
        ))}
      </select>
      {teamMembers.length === 0 && (
        <p className="mt-1 text-xs text-forvis-gray-500">
          No team members assigned to this task
        </p>
      )}
    </div>
  );
}

