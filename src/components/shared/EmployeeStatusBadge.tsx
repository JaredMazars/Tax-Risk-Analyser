'use client';

import React, { ReactNode } from 'react';
import { CircleX, CircleCheck, CircleHelp } from 'lucide-react';

export interface EmployeeStatusBadgeProps {
  // Status flags
  isActive?: boolean;
  hasUserAccount?: boolean;
  
  // Display options
  name?: string;
  variant?: 'text' | 'border' | 'icon-only';
  iconSize?: 'sm' | 'md' | 'lg';
  
  // For border variant
  children?: ReactNode;
  
  // Optional styling
  className?: string;
}

export function EmployeeStatusBadge({
  isActive = true,
  hasUserAccount = true,
  name,
  variant = 'text',
  iconSize = 'md',
  children,
  className = '',
}: EmployeeStatusBadgeProps) {
  
  // Determine status and colors
  const getStatusConfig = () => {
    if (!isActive) {
      return {
        textColor: 'text-red-600',
        borderColor: 'border-red-500',
        icon: CircleX,
        title: 'Employee is inactive',
      };
    }
    
    if (hasUserAccount) {
      return {
        textColor: 'text-green-600',
        borderColor: 'border-green-500',
        icon: CircleCheck,
        title: 'Employee is active with user account',
      };
    }
    
    return {
      textColor: 'text-yellow-600',
      borderColor: 'border-yellow-500',
      icon: CircleHelp,
      title: 'Employee is active but has no user account',
    };
  };

  const status = getStatusConfig();
  const Icon = status.icon;
  
  // Icon size classes
  const iconSizeClass = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }[iconSize];

  // Border variant: wrap children with colored border
  if (variant === 'border') {
    return (
      <div
        className={`inline-flex ${status.borderColor} border-2 rounded-full ${className}`}
        title={status.title}
      >
        {children}
      </div>
    );
  }

  // Icon-only variant
  if (variant === 'icon-only') {
    return (
      <Icon
        className={`${status.textColor} ${iconSizeClass} ${className}`}
        title={status.title}
      />
    );
  }

  // Text variant (default): name with colored text + icon
  return (
    <span
      className={`inline-flex items-center gap-1 ${status.textColor} ${className}`}
      title={status.title}
    >
      <span>{name}</span>
      <Icon className={iconSizeClass} />
    </span>
  );
}

