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
      className={`block p-6 rounded-xl border-2 ${borderColor} ${bgColor} hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-14 h-14 rounded-lg ${bgColor} border ${borderColor} flex items-center justify-center`}>
            <Icon className={`h-7 w-7 ${color}`} />
          </div>
          <ArrowRightIcon className={`h-5 w-5 ${color}`} />
        </div>

        <h3 className={`text-2xl font-bold ${color} mb-2`}>{name}</h3>
        <p className="text-sm text-forvis-gray-700 mb-4 flex-grow">
          {getDescription(serviceLine)}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-forvis-gray-200">
          <div>
            <p className="text-2xl font-bold text-forvis-gray-900">{activeProjectCount}</p>
            <p className="text-xs text-forvis-gray-600">Active Projects</p>
          </div>
          <div>
            <p className="text-xl font-semibold text-forvis-gray-700">{projectCount}</p>
            <p className="text-xs text-forvis-gray-600">Total Projects</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

