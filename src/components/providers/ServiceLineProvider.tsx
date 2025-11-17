'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ServiceLine } from '@/types';
import { ServiceLineWithStats } from '@/types/dto';

interface ServiceLineContextType {
  currentServiceLine: ServiceLine | null;
  setCurrentServiceLine: (serviceLine: ServiceLine | null) => void;
  availableServiceLines: ServiceLineWithStats[];
  setAvailableServiceLines: (serviceLines: ServiceLineWithStats[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const ServiceLineContext = createContext<ServiceLineContextType | undefined>(undefined);

export function ServiceLineProvider({ children }: { children: ReactNode }) {
  const [currentServiceLine, setCurrentServiceLine] = useState<ServiceLine | null>(null);
  const [availableServiceLines, setAvailableServiceLines] = useState<ServiceLineWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load available service lines on mount
  useEffect(() => {
    const loadServiceLines = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/service-lines');
        
        if (response.ok) {
          const result = await response.json();
          const serviceLines = result.success ? result.data : result;
          setAvailableServiceLines(Array.isArray(serviceLines) ? serviceLines : []);
        } else {
          setAvailableServiceLines([]);
        }
      } catch (error) {
        setAvailableServiceLines([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadServiceLines();
  }, []);

  // Store current service line in sessionStorage
  useEffect(() => {
    if (currentServiceLine) {
      sessionStorage.setItem('currentServiceLine', currentServiceLine);
    } else {
      sessionStorage.removeItem('currentServiceLine');
    }
  }, [currentServiceLine]);

  // Load current service line from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('currentServiceLine');
    if (stored) {
      setCurrentServiceLine(stored as ServiceLine);
    }
  }, []);

  const value = {
    currentServiceLine,
    setCurrentServiceLine,
    availableServiceLines,
    setAvailableServiceLines,
    isLoading,
    setIsLoading,
  };

  return (
    <ServiceLineContext.Provider value={value}>
      {children}
    </ServiceLineContext.Provider>
  );
}

export function useServiceLine() {
  const context = useContext(ServiceLineContext);
  if (context === undefined) {
    throw new Error('useServiceLine must be used within a ServiceLineProvider');
  }
  return context;
}

