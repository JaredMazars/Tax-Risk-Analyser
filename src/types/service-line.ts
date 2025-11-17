/**
 * Service Line specific types and utilities
 */

import React from 'react';
import { ServiceLine, ProjectType } from './index';
import {
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  CalculatorIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';

/**
 * Service line configuration
 */
export interface ServiceLineConfig {
  id: ServiceLine;
  name: string;
  description: string;
  icon: string;
  color: string;
  borderColor: string;
  bgColor: string;
  projectTypes: ProjectType[];
}

/**
 * Service line configurations
 */
export const SERVICE_LINE_CONFIGS: Record<ServiceLine, ServiceLineConfig> = {
  [ServiceLine.TAX]: {
    id: ServiceLine.TAX,
    name: 'Tax',
    description: 'Tax compliance, calculations, opinions, and administration',
    icon: 'DocumentTextIcon',
    color: 'text-blue-600',
    borderColor: 'border-blue-200',
    bgColor: 'bg-blue-50',
    projectTypes: [
      ProjectType.TAX_CALCULATION,
      ProjectType.TAX_OPINION,
      ProjectType.TAX_ADMINISTRATION,
    ],
  },
  [ServiceLine.AUDIT]: {
    id: ServiceLine.AUDIT,
    name: 'Audit',
    description: 'Audit engagements, reviews, and reporting',
    icon: 'ClipboardDocumentCheckIcon',
    color: 'text-green-600',
    borderColor: 'border-green-200',
    bgColor: 'bg-green-50',
    projectTypes: [
      ProjectType.AUDIT_ENGAGEMENT,
      ProjectType.AUDIT_REVIEW,
      ProjectType.AUDIT_REPORT,
    ],
  },
  [ServiceLine.ACCOUNTING]: {
    id: ServiceLine.ACCOUNTING,
    name: 'Accounting',
    description: 'Financial statements, bookkeeping, and management accounts',
    icon: 'CalculatorIcon',
    color: 'text-purple-600',
    borderColor: 'border-purple-200',
    bgColor: 'bg-purple-50',
    projectTypes: [
      ProjectType.FINANCIAL_STATEMENTS,
      ProjectType.BOOKKEEPING,
      ProjectType.MANAGEMENT_ACCOUNTS,
    ],
  },
  [ServiceLine.ADVISORY]: {
    id: ServiceLine.ADVISORY,
    name: 'Advisory',
    description: 'Consulting, strategy, and advisory services',
    icon: 'LightBulbIcon',
    color: 'text-orange-600',
    borderColor: 'border-orange-200',
    bgColor: 'bg-orange-50',
    projectTypes: [
      ProjectType.ADVISORY_PROJECT,
      ProjectType.CONSULTING_ENGAGEMENT,
      ProjectType.STRATEGY_REVIEW,
    ],
  },
};

/**
 * Get project types for a service line
 */
export function getProjectTypesForServiceLine(serviceLine: ServiceLine): ProjectType[] {
  return SERVICE_LINE_CONFIGS[serviceLine]?.projectTypes || [];
}

/**
 * Get service line for a project type
 */
export function getServiceLineForProjectType(projectType: ProjectType): ServiceLine | null {
  for (const [line, config] of Object.entries(SERVICE_LINE_CONFIGS)) {
    if (config.projectTypes.includes(projectType)) {
      return line as ServiceLine;
    }
  }
  return null;
}

/**
 * Check if a project type belongs to a service line
 */
export function isProjectTypeInServiceLine(
  projectType: ProjectType,
  serviceLine: ServiceLine
): boolean {
  return SERVICE_LINE_CONFIGS[serviceLine]?.projectTypes.includes(projectType) || false;
}

/**
 * Format service line name
 */
export function formatServiceLineName(serviceLine: ServiceLine | string): string {
  if (typeof serviceLine === 'string') {
    const config = SERVICE_LINE_CONFIGS[serviceLine as ServiceLine];
    return config?.name || serviceLine;
  }
  return SERVICE_LINE_CONFIGS[serviceLine]?.name || serviceLine;
}

/**
 * Get service line config
 */
export function getServiceLineConfig(serviceLine: ServiceLine): ServiceLineConfig | null {
  return SERVICE_LINE_CONFIGS[serviceLine] || null;
}

/**
 * Service line details with React components (for UI usage)
 */
export interface ServiceLineDetails {
  name: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  projectTypes: ProjectType[];
  colorClass: string;
  bgColorClass: string;
  borderColorClass: string;
}

/**
 * Service line details map (for direct UI usage with React components)
 */
export const SERVICE_LINE_DETAILS: Record<ServiceLine, ServiceLineDetails> = {
  [ServiceLine.TAX]: {
    name: 'Tax',
    description: 'Tax compliance, calculations, opinions, and administration',
    icon: DocumentTextIcon,
    projectTypes: [
      ProjectType.TAX_CALCULATION,
      ProjectType.TAX_OPINION,
      ProjectType.TAX_ADMINISTRATION,
    ],
    colorClass: 'text-blue-600',
    bgColorClass: 'bg-blue-50',
    borderColorClass: 'border-blue-200',
  },
  [ServiceLine.AUDIT]: {
    name: 'Audit',
    description: 'Audit engagements, reviews, and reporting',
    icon: ClipboardDocumentCheckIcon,
    projectTypes: [
      ProjectType.AUDIT_ENGAGEMENT,
      ProjectType.AUDIT_REVIEW,
      ProjectType.AUDIT_REPORT,
    ],
    colorClass: 'text-green-600',
    bgColorClass: 'bg-green-50',
    borderColorClass: 'border-green-200',
  },
  [ServiceLine.ACCOUNTING]: {
    name: 'Accounting',
    description: 'Financial statements, bookkeeping, and management accounts',
    icon: CalculatorIcon,
    projectTypes: [
      ProjectType.FINANCIAL_STATEMENTS,
      ProjectType.BOOKKEEPING,
      ProjectType.MANAGEMENT_ACCOUNTS,
    ],
    colorClass: 'text-purple-600',
    bgColorClass: 'bg-purple-50',
    borderColorClass: 'border-purple-200',
  },
  [ServiceLine.ADVISORY]: {
    name: 'Advisory',
    description: 'Consulting, strategy, and advisory services',
    icon: LightBulbIcon,
    projectTypes: [
      ProjectType.ADVISORY_PROJECT,
      ProjectType.CONSULTING_ENGAGEMENT,
      ProjectType.STRATEGY_REVIEW,
    ],
    colorClass: 'text-orange-600',
    bgColorClass: 'bg-orange-50',
    borderColorClass: 'border-orange-200',
  },
};
