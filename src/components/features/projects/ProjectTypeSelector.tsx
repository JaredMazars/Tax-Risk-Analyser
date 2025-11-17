'use client';

import { ProjectType, ServiceLine } from '@/types';
import { formatProjectType } from '@/lib/utils/serviceLineUtils';
import { getProjectTypesForServiceLine } from '@/lib/utils/serviceLineUtils';

interface ProjectTypeSelectorProps {
  value: ProjectType;
  onChange: (type: ProjectType) => void;
  serviceLine?: ServiceLine | string;
}

const PROJECT_TYPE_DESCRIPTIONS: Record<ProjectType, string> = {
  // Tax
  [ProjectType.TAX_CALCULATION]: 'Calculate tax liability and adjustments',
  [ProjectType.TAX_OPINION]: 'Provide tax advice and opinions',
  [ProjectType.TAX_ADMINISTRATION]: 'Tax compliance and administration',
  // Audit
  [ProjectType.AUDIT_ENGAGEMENT]: 'Full audit engagement services',
  [ProjectType.AUDIT_REVIEW]: 'Review and assess audit findings',
  [ProjectType.AUDIT_REPORT]: 'Prepare audit reports and documentation',
  // Accounting
  [ProjectType.FINANCIAL_STATEMENTS]: 'Prepare financial statements',
  [ProjectType.BOOKKEEPING]: 'Bookkeeping and record keeping',
  [ProjectType.MANAGEMENT_ACCOUNTS]: 'Management accounting and reporting',
  // Advisory
  [ProjectType.ADVISORY_PROJECT]: 'General advisory services',
  [ProjectType.CONSULTING_ENGAGEMENT]: 'Consulting and strategic advice',
  [ProjectType.STRATEGY_REVIEW]: 'Strategic review and planning',
};

export function ProjectTypeSelector({ value, onChange, serviceLine }: ProjectTypeSelectorProps) {
  // Filter project types based on service line
  const availableTypes = serviceLine
    ? getProjectTypesForServiceLine(serviceLine as ServiceLine)
    : Object.values(ProjectType);

  const projectTypes = availableTypes.map(type => ({
    value: type,
    label: formatProjectType(type),
    description: PROJECT_TYPE_DESCRIPTIONS[type] || '',
  }));
  return (
    <div className="space-y-3">
      {projectTypes.map((type) => (
        <label
          key={type.value}
          className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
            value === type.value
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input
            type="radio"
            name="projectType"
            value={type.value}
            checked={value === type.value}
            onChange={() => onChange(type.value)}
            className="mt-1 mr-3"
          />
          <div>
            <div className="font-medium text-gray-900">{type.label}</div>
            <div className="text-sm text-gray-600">{type.description}</div>
          </div>
        </label>
      ))}
    </div>
  );
}





