'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

const iconMap: Partial<Record<ServiceLine, typeof DocumentTextIcon>> = {
  [ServiceLine.TAX]: DocumentTextIcon,
  [ServiceLine.AUDIT]: ClipboardDocumentCheckIcon,
  [ServiceLine.ACCOUNTING]: CalculatorIcon,
  [ServiceLine.ADVISORY]: LightBulbIcon,
};

interface ServiceLineCardProps {
  serviceLineData: ServiceLineWithStats;
}

export function ServiceLineCard({ serviceLineData }: ServiceLineCardProps) {
  const { serviceLine } = serviceLineData;
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  
  const Icon = iconMap[serviceLine as ServiceLine] || DocumentTextIcon;
  const name = formatServiceLineName(serviceLine);
  const color = getServiceLineColor(serviceLine);
  const bgColor = getServiceLineBgColor(serviceLine);
  const borderColor = getServiceLineBorderColor(serviceLine);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsNavigating(true);
    router.push(`/dashboard/${serviceLine.toLowerCase()}`);
  };

  const getDescription = (line: ServiceLine | string) => {
    switch (line) {
      case ServiceLine.TAX:
        return 'Comprehensive tax services including compliance, planning, opinions, and administration';
      case ServiceLine.AUDIT:
        return 'Professional audit and assurance services ensuring financial statement accuracy';
      case ServiceLine.ACCOUNTING:
        return 'Full-service accounting from bookkeeping to financial statements and reporting';
      case ServiceLine.ADVISORY:
        return 'Strategic consulting to help businesses navigate challenges and opportunities';
      default:
        return '';
    }
  };

  return (
    <Link
      href={`/dashboard/${serviceLine.toLowerCase()}`}
      onClick={handleClick}
      className="group block bg-white rounded-lg border-2 border-forvis-gray-200 shadow-corporate hover:shadow-corporate-md transition-all duration-200 hover:border-forvis-blue-500 relative"
    >
      {/* Loading overlay */}
      {isNavigating && (
        <div className="absolute inset-0 bg-white bg-opacity-90 rounded-lg flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forvis-blue-600"></div>
        </div>
      )}
      
      <div className="p-4">
        <div className="flex flex-col h-full">
          {/* Icon and Arrow */}
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-lg ${bgColor} border-2 ${borderColor} flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}>
              <Icon className={`h-6 w-6 ${color}`} />
            </div>
            <ArrowRightIcon className={`h-5 w-5 text-forvis-blue-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200`} />
          </div>

          {/* Title and Description */}
          <h3 className="text-lg font-bold text-forvis-gray-900 mb-2 group-hover:text-forvis-blue-600 transition-colors duration-200">
            {name}
          </h3>
          <p className="text-xs text-forvis-gray-700 flex-grow leading-relaxed">
            {getDescription(serviceLine)}
          </p>
        </div>
      </div>
    </Link>
  );
}

