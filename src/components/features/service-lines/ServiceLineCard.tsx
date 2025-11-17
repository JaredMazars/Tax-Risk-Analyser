'use client';

import Link from 'next/link';
import { 
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  CalculatorIcon,
  LightBulbIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { ServiceLine } from '@/types';
import { ServiceLineWithStats } from '@/types/dto';
import { 
  getServiceLineColor, 
  getServiceLineBgColor,
  getServiceLineBorderColor,
  formatServiceLineName 
} from '@/lib/utils/serviceLineUtils';

const iconMap = {
  [ServiceLine.TAX]: DocumentTextIcon,
  [ServiceLine.AUDIT]: ClipboardDocumentCheckIcon,
  [ServiceLine.ACCOUNTING]: CalculatorIcon,
  [ServiceLine.ADVISORY]: LightBulbIcon,
};

interface ServiceLineCardProps {
  serviceLineData: ServiceLineWithStats;
}

export function ServiceLineCard({ serviceLineData }: ServiceLineCardProps) {
  const { serviceLine, activeProjectCount, projectCount } = serviceLineData;
  
  const Icon = iconMap[serviceLine as ServiceLine] || DocumentTextIcon;
  const name = formatServiceLineName(serviceLine);
  const color = getServiceLineColor(serviceLine);
  const bgColor = getServiceLineBgColor(serviceLine);
  const borderColor = getServiceLineBorderColor(serviceLine);

  const getDescription = (line: ServiceLine | string) => {
    switch (line) {
      case ServiceLine.TAX:
        return 'Tax compliance, calculations, opinions, and administration';
      case ServiceLine.AUDIT:
        return 'Audit engagements, reviews, and reporting';
      case ServiceLine.ACCOUNTING:
        return 'Financial statements, bookkeeping, and management accounts';
      case ServiceLine.ADVISORY:
        return 'Consulting, strategy, and advisory services';
      default:
        return '';
    }
  };

  return (
    <Link
      href={`/dashboard/${serviceLine.toLowerCase()}`}
      className="group block bg-white rounded-lg border border-forvis-gray-200 shadow-corporate hover:shadow-corporate-md transition-shadow duration-200"
    >
      <div className="p-4">
        <div className="flex flex-col h-full">
          {/* Icon and Arrow */}
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-lg ${bgColor} border ${borderColor} flex items-center justify-center`}>
              <Icon className={`h-6 w-6 ${color}`} />
            </div>
            <ArrowRightIcon className={`h-5 w-5 ${color} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />
          </div>

          {/* Title and Description */}
          <h3 className="text-xl font-semibold text-forvis-gray-900 mb-2">
            {name}
          </h3>
          <p className="text-sm text-forvis-gray-600 mb-4 flex-grow">
            {getDescription(serviceLine)}
          </p>

          {/* Stats */}
          <div className="flex items-center justify-between pt-4 border-t border-forvis-gray-200">
            <div>
              <p className="text-2xl font-semibold text-forvis-gray-900">{activeProjectCount}</p>
              <p className="text-xs text-forvis-gray-600">Active</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-medium text-forvis-gray-700">{projectCount}</p>
              <p className="text-xs text-forvis-gray-600">Total</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

