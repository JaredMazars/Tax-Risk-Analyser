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
        console.log('Fetching service lines from /api/service-lines...');
        const response = await fetch('/api/service-lines');
        console.log('Service lines response status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('Service lines result:', result);
          const serviceLines = result.success ? result.data : result;
          console.log('Available service lines:', serviceLines);
          setAvailableServiceLines(Array.isArray(serviceLines) ? serviceLines : []);
        } else {
          const errorText = await response.text();
          console.error('Failed to fetch service lines:', response.status, errorText);
          setAvailableServiceLines([]);
        }
      } catch (error) {
        console.error('Error loading service lines:', error);
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

